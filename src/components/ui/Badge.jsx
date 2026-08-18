export function Badge({ tone = "ink", children }) {
  const map = {
    accent: { bg: "var(--accent-soft)", fg: "var(--accent)" },
    warn: { bg: "var(--warn-soft)", fg: "var(--warn)" },
    danger: { bg: "var(--danger-soft)", fg: "var(--danger)" },
    info: { bg: "var(--info-soft)", fg: "var(--info)" },
    ink: { bg: "#EEF0F5", fg: "var(--ink-soft)" },
  }[tone];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: map.bg, color: map.fg }}>
      {children}
    </span>
  );
}
