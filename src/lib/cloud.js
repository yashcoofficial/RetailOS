import { supabase } from "./supabase.js";

function client() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}

export async function getCurrentSession() {
  return unwrap(await client().auth.getSession()).session;
}

export function onAuthStateChange(callback) {
  const { data } = client().auth.onAuthStateChange((event, session) => callback(event, session));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email, password) {
  return unwrap(await client().auth.signInWithPassword({ email, password }));
}

export async function signOut() {
  unwrap(await client().auth.signOut());
}

export async function loadSharedState() {
  const { data, error } = await client()
    .from("retailos_states")
    .select("data, revision")
    .eq("store_key", "primary")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function initializeSharedState(data) {
  unwrap(await client().rpc("retailos_initialize_state", { p_data: data }));
  return loadSharedState();
}

export async function saveSharedState(expectedRevision, data) {
  const revision = unwrap(
    await client().rpc("retailos_save_state", {
      p_expected_revision: expectedRevision,
      p_data: data,
    }),
  );
  return Number(revision);
}

export function subscribeToSharedState(onState) {
  const channel = client()
    .channel("retailos-admin-live")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "retailos_states", filter: "store_key=eq.primary" },
      (payload) => onState(payload.new),
    )
    .subscribe();
  return () => client().removeChannel(channel);
}
