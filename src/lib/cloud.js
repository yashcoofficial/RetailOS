const POLL_INTERVAL_MS = 3500;

async function requestJson(path, method = "GET", body) {
  const response = await fetch(path, {
    method,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (response.status === 409) return { conflict: true, snapshot: payload.snapshot || null };
  if (!response.ok) throw new Error(payload.error || "Shared store data is unavailable.");
  return payload;
}

export async function getCurrentSession() {
  const result = await requestJson("/api/session");
  return result.session || null;
}

export async function signIn(email, password) {
  const result = await requestJson("/api/session", "POST", { email, password });
  return result.session;
}

export async function signOut() {
  await requestJson("/api/session", "DELETE");
}

export async function loadSharedState() {
  const result = await requestJson("/api/state");
  return result.snapshot || null;
}

export async function initializeSharedState(data) {
  const result = await requestJson("/api/state", "POST", { data, expectedRevision: 0 });
  if (result.conflict) return result.snapshot;
  return result.snapshot;
}

export async function saveSharedState(expectedRevision, data) {
  const result = await requestJson("/api/state", "PUT", { data, expectedRevision });
  if (result.conflict) return -1;
  return Number(result.snapshot.revision);
}

export function subscribeToSharedState(onState, onError) {
  let active = true;
  let checking = false;

  const check = async () => {
    if (!active || checking) return;
    checking = true;
    try {
      const snapshot = await loadSharedState();
      if (active && snapshot) onState(snapshot);
    } catch (error) {
      if (active) onError?.(error);
    } finally {
      checking = false;
    }
  };

  const timer = window.setInterval(check, POLL_INTERVAL_MS);
  return () => {
    active = false;
    window.clearInterval(timer);
  };
}
