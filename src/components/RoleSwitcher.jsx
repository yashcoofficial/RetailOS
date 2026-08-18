export function RoleSwitcher({ state, persist }) {
  const role = state.settings.role;
  return (
    <div className="flex items-center rounded-lg p-0.5" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
      {["owner", "staff"].map((r) => (
        <button
          key={r}
          onClick={() => persist((prev) => ({ ...prev, settings: { ...prev.settings, role: r } }))}
          className="px-3 py-1.5 rounded-md text-xs font-medium capitalize"
          style={{ background: role === r ? "var(--primary)" : "transparent", color: role === r ? "#fff" : "var(--ink-soft)" }}
        >
          {r === "owner" ? (state.settings.ownerName || "Shehzan") : "Staff"}
        </button>
      ))}
    </div>
  );
}
