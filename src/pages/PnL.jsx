import { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card } from "../components/ui/Card.jsx";
import { salesInRange, expensesInRange, financials } from "../lib/domain.js";
import { daysAgoISO, todayISO, inr, pct } from "../lib/utils.js";

export function PnL({ state }) {
  const [range, setRange] = useState("month");
  let from, to = todayISO();
  if (range === "month") from = todayISO().slice(0, 8) + "01";
  else if (range === "7") from = daysAgoISO(6);
  else if (range === "30") from = daysAgoISO(29);
  else from = daysAgoISO(89);

  const sales = salesInRange(state.sales, from, to);
  const expenses = expensesInRange(state.expenses, from, to);
  const fin = financials(sales, expenses);

  const byCategory = useMemo(() => {
    const map = {};
    for (const e of expenses) map[e.category] = (map[e.category] || 0) + e.amount;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const rows = [
    { label: "Revenue", value: fin.revenue, tone: "ink" },
    { label: "Cost of Goods Sold (COGS)", value: -fin.cogs, tone: "danger" },
    { label: "Gross Profit", value: fin.grossProfit, tone: "accent", bold: true },
    { label: "Operating Expenses", value: -fin.expenses, tone: "danger" },
    { label: "Net Profit", value: fin.netProfit, tone: fin.netProfit >= 0 ? "accent" : "danger", bold: true },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-[900px]">
      <div className="flex items-center gap-2">
        {[["7", "7 Days"], ["30", "30 Days"], ["month", "This Month"], ["90", "90 Days"]].map(([v, l]) => (
          <button key={v} onClick={() => setRange(v)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: range === v ? "var(--primary)" : "var(--surface)", color: range === v ? "#fff" : "var(--ink-soft)", border: "1px solid var(--line)" }}>{l}</button>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between py-1.5" style={{ borderTop: r.bold ? "1px solid var(--line)" : "none" }}>
              <span className={r.bold ? "font-semibold disp" : ""} style={{ color: "var(--ink-soft)" }}>{r.label}</span>
              <span className={`mono ${r.bold ? "font-semibold text-lg" : ""}`} style={{ color: r.value < 0 ? "var(--danger)" : r.tone === "accent" ? "var(--accent)" : "var(--ink)" }}>
                {r.value < 0 ? "-" : ""}{inr(Math.abs(r.value))}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-3 pt-3 border-t text-sm" style={{ borderColor: "var(--line)" }}>
          <span>Gross Margin: <b>{pct(fin.grossMargin)}</b></span>
          <span>Net Margin: <b>{pct(fin.netMargin)}</b></span>
        </div>
      </Card>

      <Card className="p-4">
        <div className="disp font-medium text-sm mb-2">Expense Breakdown</div>
        {byCategory.length === 0 ? <div className="text-sm" style={{ color: "var(--ink-faint)" }}>No expenses in this period.</div> : (
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory.map(([k, v]) => ({ name: k, Amount: v }))} margin={{ left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9AA1B0" }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: "#9AA1B0" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => inr(v)} />
                <Bar dataKey="Amount" fill="#26314F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
