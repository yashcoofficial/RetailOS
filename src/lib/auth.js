// Login gate. NOTE: this is a client-side-only check — anyone who opens
// devtools or views the bundled JS can read these values. It's a basic
// access deterrent for a small single-shop tool, not real authentication.
// A real deployment should verify credentials against a backend, never
// ship them in frontend code, and never use a shared plaintext password.

export const LOGIN_EMAIL = "alvishehzan@gmail.com";
export const LOGIN_PASSWORD = "Libaan@26";

const SESSION_KEY = "retailos-authed-v1";

export function isAuthed() {
  try {
    return localStorage.getItem(SESSION_KEY) === "true";
  } catch (e) {
    return false;
  }
}

export function setAuthed(value) {
  try {
    if (value) localStorage.setItem(SESSION_KEY, "true");
    else localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    /* ignore */
  }
}
