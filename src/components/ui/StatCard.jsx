import { Card } from "./Card.jsx";

export function StatCard({ icon: Icon, label, value, sub, tone = "ink", accentBar }) {
  const toneColor = { ink: "var(--ink)", accent: "var(--accent)", warn: "var(--warn)", danger: "var(--danger)", info: "var(--info)" }[tone];
  return (
    <Card className="p-4 sm:p-5 flex flex-col gap-2 relative overflow-hidden">
      {accentBar && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: toneColor }} />}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>{label}</span>
        {Icon && <Icon size={16} style={{ color: toneColor }} />}
      </div>
      <div className="disp text-2xl sm:text-[28px] font-semibold" style={{ color: "var(--ink)" }}>{value}</div>
      {sub && <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{sub}</div>}
    </Card>
  );
}
