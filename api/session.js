import {
  createSession,
  expiredSessionCookie,
  sessionCookie,
  sessionFromRequest,
  verifyCredentials,
} from "../server/auth.js";

function send(response, status, payload) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  return response.status(status).json(payload);
}

async function requestBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  if (!request.body) return {};
  return JSON.parse(request.body);
}

export default async function handler(request, response) {
  if (request.method === "GET") {
    return send(response, 200, { session: sessionFromRequest(request) });
  }

  if (request.method === "DELETE") {
    response.setHeader("Set-Cookie", expiredSessionCookie());
    return send(response, 200, { session: null });
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST, DELETE");
    return send(response, 405, { error: "Method not allowed." });
  }

  try {
    const { email = "", password = "" } = await requestBody(request);
    if (!verifyCredentials(email, password)) {
      return send(response, 401, { error: "Incorrect email or password." });
    }
    const session = { email: email.trim().toLowerCase() };
    response.setHeader("Set-Cookie", sessionCookie(createSession(session.email)));
    return send(response, 200, { session });
  } catch (error) {
    const message = error.message === "Admin login is not configured on Vercel."
      ? error.message
      : "Could not sign in.";
    return send(response, 503, { error: message });
  }
}
