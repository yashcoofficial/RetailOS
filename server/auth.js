import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "retailos_admin_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function credentials() {
  const email = process.env.RETAILOS_ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.RETAILOS_ADMIN_PASSWORD_SHA256?.trim().toLowerCase();
  const sessionSecret = process.env.RETAILOS_SESSION_SECRET || process.env.BLOB_READ_WRITE_TOKEN;
  if (!email || !passwordHash || !sessionSecret) {
    throw new Error("Admin login is not configured on Vercel.");
  }
  return { email, passwordHash, sessionSecret };
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function cookieValue(request) {
  const source = request.headers.cookie || "";
  const entry = source.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return entry ? decodeURIComponent(entry.slice(COOKIE_NAME.length + 1)) : "";
}

export function verifyCredentials(email, password) {
  const configured = credentials();
  const suppliedHash = createHash("sha256").update(password).digest("hex");
  return safeEqual(email.trim().toLowerCase(), configured.email) && safeEqual(suppliedHash, configured.passwordHash);
}

export function createSession(email) {
  const { sessionSecret } = credentials();
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + SESSION_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload, sessionSecret)}`;
}

export function sessionFromRequest(request) {
  try {
    const { sessionSecret } = credentials();
    const [payload, signature] = cookieValue(request).split(".");
    if (!payload || !signature || !safeEqual(signature, sign(payload, sessionSecret))) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.email || !session.exp || session.exp <= Date.now()) return null;
    return { email: session.email };
  } catch (_error) {
    return null;
  }
}

export function sessionCookie(value) {
  const secure = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure ? "; Secure" : ""}`;
}

export function expiredSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}
