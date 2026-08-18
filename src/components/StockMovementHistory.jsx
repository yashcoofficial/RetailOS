import { Badge } from "./ui/Badge.jsx";
import { fmtDate } from "../lib/utils.js";

export function StockMovementHistory({ state, productId }) {
  const moves = state.stockMovements.filter((m) => m.productId === productId).sort((a, b) => b.date.localeCompare(a.date));
  let running = 0;
  const withRunning = [...moves].reverse().map((m) => { running += m.qty; return { ...m, running }; }).reverse();
  return (
    <div className="mt-1">
      <div className="text-xs font-semibold mb-1.5" style={{ color: "var(--ink-soft)" }}>Stock Movement History</div>
      <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
        {withRunning.map((m) => (
          <div key={m.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md" style={{ background: "var(--surface)" }}>
            <span className="flex items-center gap-2">
              <Badge tone={m.qty >= 0 ? "accent" : "danger"}>{m.type}</Badge>
              <span style={{ color: "var(--ink-faint)" }}>{fmtDate(m.date)}</span>
            </span>
            <span className="flex items-center gap-3">
              <span style={{ color: m.qty >= 0 ? "var(--accent)" : "var(--danger)" }}>{m.qty >= 0 ? "+" : ""}{m.qty}</span>
              <span className="mono" style={{ color: "var(--ink-faint)" }}>bal {m.running}</span>
            </span>
          </div>
        ))}
        {moves.length === 0 && <div className="text-xs py-2" style={{ color: "var(--ink-faint)" }}>No movements recorded.</div>}
      </div>
    </div>
  );
}
