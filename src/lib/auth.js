// Keeps the original admin login available without storing the plaintext
// password in the frontend source. Supabase Auth remains the secure session
// provider whenever cloud configuration is present.

export const LOGIN_EMAIL = "alvishehzan@gmail.com";
const LOGIN_PASSWORD_SHA256 = "f5181e727b46c6ae10bb8d6083747401492249ebaebb37f854e90dc0923542f9";
const SESSION_KEY = "retailos-authed-v1";

export const hasLocalAdminCredentials = true;

export async function validateAdminLogin(email, password) {
  if (!hasLocalAdminCredentials) return false;
  if (email.trim().toLowerCase() !== LOGIN_EMAIL.toLowerCase()) return false;
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return hash === LOGIN_PASSWORD_SHA256;
}

export function isLocallyAuthed() {
  try {
    return localStorage.getItem(SESSION_KEY) === "true";
  } catch (_error) {
    return false;
  }
}

export function setLocallyAuthed(value) {
  try {
    if (value) localStorage.setItem(SESSION_KEY, "true");
    else localStorage.removeItem(SESSION_KEY);
  } catch (_error) {
    // Ignore unavailable browser storage.
  }
}
