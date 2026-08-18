export function EmptyState({ icon: Icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 gap-2">
      <div className="p-3 rounded-full mb-1" style={{ background: "var(--surface-2)" }}>
        <Icon size={22} style={{ color: "var(--ink-faint)" }} />
      </div>
      <div className="disp font-medium">{title}</div>
      {sub && <div className="text-sm max-w-sm" style={{ color: "var(--ink-soft)" }}>{sub}</div>}
      {action}
    </div>
  );
}
