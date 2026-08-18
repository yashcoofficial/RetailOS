// Persists shop data in the browser's localStorage. This replaces the
// window.storage API used inside Claude's artifact environment, which
// isn't available in a plain browser — localStorage is the closest
// same-shape substitute for local/dev use. For a real multi-user
// deployment, swap loadState/saveState for calls to a real backend API.

const STORAGE_KEY = "retailos-shop-state-v1";

export async function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* not found or invalid JSON */
  }
  return null;
}

export async function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    return false;
  }
}
