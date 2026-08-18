export function MiniStat({ label, value, tone }) {
  const c = tone ? { accent: "var(--accent)", danger: "var(--danger)", warn: "var(--warn)" }[tone] : "var(--ink)";
  return (
    <div>
      <div className="text-xs" style={{ color: "var(--ink-faint)" }}>{label}</div>
      <div className="font-medium disp" style={{ color: c }}>{value}</div>
    </div>
  );
}

export function SectionLabel({ children }) {
  return <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--ink-faint)" }}>{children}</div>;
}

export function InsightLine({ icon: Icon, tone, text }) {
  const c = { accent: "var(--accent)", info: "var(--info)", warn: "var(--warn)", danger: "var(--danger)" }[tone];
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon size={15} style={{ color: c, marginTop: 2 }} className="shrink-0" />
      <span>{text}</span>
    </div>
  );
}

export function QuickAction({ icon: Icon, label, onClick, show = true }) {
  if (!show) return null;
  return (
    <button onClick={onClick} className="card flex flex-col items-center justify-center gap-2 py-4 hover:bg-gray-50 transition-colors">
      <div className="p-2 rounded-lg" style={{ background: "var(--surface-2)" }}>
        <Icon size={18} style={{ color: "var(--primary)" }} />
      </div>
      <span className="text-xs font-medium text-center">{label}</span>
    </button>
  );
}
