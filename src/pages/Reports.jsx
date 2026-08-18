import { useMemo, useState } from "react";
import { Card } from "../components/ui/Card.jsx";
import { StatCard } from "../components/ui/StatCard.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { SelectField } from "../components/ui/Fields.jsx";
import { salesInRange, expensesInRange, financials, deadStockList } from "../lib/domain.js";
import { daysAgoISO, todayISO, inr, pct } from "../lib/utils.js";

export function Reports({ state, derived }) {
  const [range, setRange] = useState("30");
  const from = daysAgoISO(Number(range) - 1);
  const to = todayISO();
  const sales = salesInRange(state.sales, from, to);
  const fin = financials(sales, expensesInRange(state.expenses, from, to));

  const productProfitability = useMemo(() => {
    const map = {};
    for (const s of sales) for (const it of s.items) {
      map[it.productId] = map[it.productId] || { units: 0, revenue: 0, cogs: 0 };
      map[it.productId].units += it.qty;
      map[it.productId].revenue += it.qty * it.price;
      map[it.productId].cogs += it.qty * it.cost;
    }
    return Object.entries(map).map(([pid, v]) => ({
      product: derived.productById[pid], ...v, profit: v.revenue - v.cogs, margin: v.revenue ? ((v.revenue - v.cogs) / v.revenue) * 100 : 0,
    })).filter((x) => x.product);
  }, [sales, derived.productById]);

  const [sortKey, setSortKey] = useState("profit");
  const sorted = [...productProfitability].sort((a, b) => b[sortKey] - a[sortKey]);

  const deadStock = deadStockList(state, derived, state.settings.deadStockDays);

  return (
    <div className="flex flex-col gap-5 max-w-[1200px]">
      <div className="flex items-center gap-2">
        {[["7", "7 Days"], ["30", "30 Days"], ["90", "90 Days"]].map(([v, l]) => (
          <button key={v} onClick={() => setRange(v)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: range === v ? "var(--primary)" : "var(--surface)", color: range === v ? "#fff" : "var(--ink-soft)", border: "1px solid var(--line)" }}>{l}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Revenue" value={inr(fin.revenue)} accentBar />
        <StatCard label="Orders" value={fin.orders} accentBar />
        <StatCard label="Gross Profit" value={inr(fin.grossProfit)} tone="accent" accentBar />
        <StatCard label="Avg Order Value" value={inr(fin.aov)} accentBar />
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="disp font-medium text-sm">Product Profitability</div>
          <SelectField value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <option value="profit">Highest Profit</option>
            <option value="margin">Highest Margin</option>
            <option value="units">Highest Sales</option>
          </SelectField>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>
              {["Product", "Units Sold", "Revenue", "COGS", "Profit", "Margin"].map((h) => <th key={h} className="text-left py-2 text-xs font-semibold" style={{ color: "var(--ink-soft)" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.product.id} className="border-t" style={{ borderColor: "var(--line-soft)" }}>
                  <td className="py-2">{r.product.name}</td>
                  <td className="py-2">{r.units}</td>
                  <td className="py-2">{inr(r.revenue)}</td>
                  <td className="py-2">{inr(r.cogs)}</td>
                  <td className="py-2" style={{ color: "var(--accent)" }}>{inr(r.profit)}</td>
                  <td className="py-2">{pct(r.margin)}</td>
                </tr>
              ))}
              {sorted.length === 0 && <tr><td colSpan={6} className="py-6 text-center" style={{ color: "var(--ink-faint)" }}>No sales in this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="disp font-medium text-sm mb-2">Dead Stock ({state.settings.deadStockDays}+ days without a sale)</div>
        {deadStock.length === 0 ? (
          <div className="text-sm py-3" style={{ color: "var(--ink-faint)" }}>No dead stock — everything has moved recently.</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {deadStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.name}</span>
                <span className="flex items-center gap-3 text-xs" style={{ color: "var(--ink-soft)" }}>
                  <span>{p.currentStock} units</span>
                  <Badge tone="danger">{inr(p.costValue)} blocked</Badge>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="disp font-medium text-sm mb-2">Reorder Recommendations</div>
        <div className="flex flex-col gap-1.5">
          {derived.productsWithStock.filter((p) => p.currentStock < p.minStock).map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span>{p.name}</span>
              <span className="text-xs" style={{ color: "var(--warn)" }}>Current: {p.currentStock} · Min: {p.minStock} · Reorder: {p.reorderQty}</span>
            </div>
          ))}
          {derived.productsWithStock.filter((p) => p.currentStock < p.minStock).length === 0 && <div className="text-sm" style={{ color: "var(--ink-faint)" }}>No reorders needed right now.</div>}
        </div>
      </Card>
    </div>
  );
}
