export function RoleSwitcher({ role, setRole, ownerName }) {
  return (
    <div className="flex items-center rounded-lg p-0.5" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
      {["owner", "staff"].map((nextRole) => (
        <button
          key={nextRole}
          onClick={() => setRole(nextRole)}
          className="px-3 py-1.5 rounded-md text-xs font-medium capitalize"
          style={{ background: role === nextRole ? "var(--primary)" : "transparent", color: role === nextRole ? "#fff" : "var(--ink-soft)" }}
        >
          {nextRole === "owner" ? ownerName || "Admin" : "Staff"}
        </button>
      ))}
    </div>
  );
}
