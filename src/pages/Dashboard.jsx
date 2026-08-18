import { useMemo } from "react";
import {
  IndianRupee, TrendingUp, Receipt, ShoppingCart, Package, Boxes, AlertTriangle,
  ChevronRight, Sparkles, PackageX, Building2, Smartphone, PackagePlus, Truck,
  ScanLine, Wallet, Plus,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart as RePieChart, Pie, Cell,
} from "recharts";
import { Card } from "../components/ui/Card.jsx";
import { StatCard } from "../components/ui/StatCard.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { SectionLabel, InsightLine, QuickAction } from "../components/ui/Misc.jsx";
import { PAYMENT_MODES } from "../lib/constants.js";
import { todayISO, daysAgoISO, inr, pct } from "../lib/utils.js";
import { salesInRange, expensesInRange, financials, insightSalesChange, deadStockList } from "../lib/domain.js";

export function Dashboard({ state, derived, notify, setPage, role }) {
  const today = todayISO();
  const todaySales = salesInRange(state.sales, today, today);
  const todayFin = financials(todaySales, []);
  const thisMonthFrom = todayISO().slice(0, 8) + "01";
  const monthFin = financials(salesInRange(state.sales, thisMonthFrom, today), expensesInRange(state.expenses, thisMonthFrom, today));

  const trend = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => daysAgoISO(13 - i));
    return days.map((d) => {
      const s = salesInRange(state.sales, d, d);
      const f = financials(s, []);
      return { date: d.slice(5), Revenue: f.revenue, Profit: f.grossProfit };
    });
  }, [state.sales]);

  const productPerf = useMemo(() => {
    const map = {};
    for (const s of state.sales) {
      for (const it of s.items) {
        map[it.productId] = map[it.productId] || { units: 0, revenue: 0, profit: 0 };
        map[it.productId].units += it.qty;
        map[it.productId].revenue += it.qty * it.price;
        map[it.productId].profit += it.qty * (it.price - it.cost);
      }
    }
    return Object.entries(map)
      .map(([pid, v]) => ({ product: derived.productById[pid], ...v }))
      .filter((x) => x.product)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);
  }, [state.sales, derived.productById]);

  const paymentBreakdown = useMemo(() => {
    const map = {};
    for (const s of state.sales) map[s.paymentMode] = (map[s.paymentMode] || 0) + s.total;
    return PAYMENT_MODES.map((pm) => ({ ...pm, value: map[pm.id] || 0 })).filter((p) => p.value > 0);
  }, [state.sales]);

  const pieColors = ["#26314F", "#1B8F63", "#3057A6", "#B7791F", "#B23B32"];

  const vendorOutstanding = state.purchases.reduce((s, p) => s + (p.total - p.paidAmount), 0);
  const dead = deadStockList(state, derived, state.settings.deadStockDays);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      <div>
        <div className="disp text-xl sm:text-2xl font-semibold">{greet}, {role === "owner" ? (state.settings.ownerName || "Shehzan") : "there"}.</div>
        <div className="text-sm mt-0.5" style={{ color: "var(--ink-soft)" }}>Here's how {state.settings.shopName} is doing today.</div>
      </div>

      {state.products.length === 0 ? (
        <Card className="p-10">
          <EmptyState
            icon={Package}
            title="No inventory yet"
            sub="Your dashboard will fill in with today's sales, stock levels, and profit as soon as you add your first product."
            action={role === "owner" ? <Button icon={Plus} onClick={() => setPage("products")} className="mt-2">Add Your First Product</Button> : null}
          />
        </Card>
      ) : (
        <>
          {/* Today's business */}
          <section>
            <SectionLabel>Today's Business</SectionLabel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={IndianRupee} label="Today's Revenue" value={inr(todayFin.revenue)} tone="ink" accentBar />
              {role === "owner" && <StatCard icon={TrendingUp} label="Today's Profit" value={inr(todayFin.grossProfit)} tone="accent" accentBar />}
              <StatCard icon={Receipt} label="Orders" value={todaySales.length} tone="info" accentBar />
              <StatCard icon={ShoppingCart} label="Avg Order Value" value={inr(todayFin.aov)} tone="ink" accentBar />
            </div>
          </section>

          {/* Inventory */}
          <section>
            <SectionLabel>Inventory</SectionLabel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={Package} label="Total Products" value={state.products.length} accentBar />
              <StatCard icon={Boxes} label="Units in Stock" value={derived.totalStockUnits.toLocaleString("en-IN")} accentBar />
              {role === "owner" && <StatCard icon={IndianRupee} label="Inventory Cost Value" value={inr(derived.totalCostValue)} accentBar />}
              <StatCard icon={AlertTriangle} label="Low / Out of Stock" value={`${derived.lowStock.length} / ${derived.outOfStock.length}`} tone="warn" accentBar />
            </div>
          </section>

          {/* Financial overview */}
          {role === "owner" && (
            <section>
              <SectionLabel>Financial Overview · This Month</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard label="Revenue" value={inr(monthFin.revenue)} accentBar />
                <StatCard label="COGS" value={inr(monthFin.cogs)} accentBar />
                <StatCard label="Gross Profit" value={inr(monthFin.grossProfit)} tone="accent" accentBar />
                <StatCard label="Expenses" value={inr(monthFin.expenses)} tone="warn" accentBar />
                <StatCard label="Net Profit" value={inr(monthFin.netProfit)} tone={monthFin.netProfit >= 0 ? "accent" : "danger"} accentBar />
              </div>
              <div className="flex gap-4 mt-2 text-xs" style={{ color: "var(--ink-soft)" }}>
                <span>Gross Margin: <b style={{ color: "var(--ink)" }}>{pct(monthFin.grossMargin)}</b></span>
                <span>Net Margin: <b style={{ color: "var(--ink)" }}>{pct(monthFin.netMargin)}</b></span>
              </div>
            </section>
          )}

          {/* Charts row */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4 lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div className="disp font-medium text-sm">Sales & Profit Trend — 14 days</div>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ left: -18, top: 5, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9AA1B0" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9AA1B0" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E4E7EE" }} />
                    <Line type="monotone" dataKey="Revenue" stroke="#26314F" strokeWidth={2} dot={false} />
                    {role === "owner" && <Line type="monotone" dataKey="Profit" stroke="#1B8F63" strokeWidth={2} dot={false} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <div className="disp font-medium text-sm mb-2">Payment Methods</div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={paymentBreakdown} dataKey="value" nameKey="label" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {paymentBreakdown.map((p, i) => <Cell key={p.id} fill={pieColors[i % pieColors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => inr(v)} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                {paymentBreakdown.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />{p.label}</span>
                    <span style={{ color: "var(--ink-soft)" }}>{inr(p.value)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="disp font-medium text-sm mb-3">Best Selling Products</div>
              <div className="flex flex-col gap-2.5">
                {productPerf.map((p, i) => (
                  <div key={p.product.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>{i + 1}</span>
                      <span className="truncate">{p.product.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs" style={{ color: "var(--ink-soft)" }}>
                      <span>{p.units} units</span>
                      <span className="font-medium" style={{ color: "var(--ink)" }}>{inr(p.revenue)}</span>
                      {role === "owner" && <Badge tone="accent">+{inr(p.profit)}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="disp font-medium text-sm">Low Stock Alerts</div>
                <button onClick={() => setPage("inventory")} className="text-xs font-medium flex items-center gap-0.5" style={{ color: "var(--primary)" }}>View all <ChevronRight size={13} /></button>
              </div>
              {derived.lowStock.length === 0 ? (
                <div className="text-sm py-4 text-center" style={{ color: "var(--ink-faint)" }}>All products are well stocked.</div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {derived.lowStock.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{p.name}</span>
                      <span className="text-xs shrink-0" style={{ color: "var(--warn)" }}>{p.currentStock} left · min {p.minStock}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          {/* Insights */}
          <section>
            <SectionLabel>Business Insights</SectionLabel>
            <Card className="p-4 flex flex-col gap-2.5">
              <InsightLine icon={TrendingUp} tone="accent" text={insightSalesChange(state)} />
              {productPerf[0] && <InsightLine icon={Sparkles} tone="info" text={`${productPerf[0].product.name} generated the highest profit this month among top sellers.`} />}
              {derived.lowStock.length > 0 && <InsightLine icon={AlertTriangle} tone="warn" text={`${derived.lowStock.length} product${derived.lowStock.length > 1 ? "s are" : " is"} currently below minimum stock.`} />}
              {role === "owner" && dead.length > 0 && <InsightLine icon={PackageX} tone="danger" text={`${inr(dead.reduce((s, d) => s + d.costValue, 0))} is currently blocked in ${dead.length} slow-moving product${dead.length > 1 ? "s" : ""}.`} />}
              {role === "owner" && vendorOutstanding > 0 && <InsightLine icon={Building2} tone="warn" text={`${inr(vendorOutstanding)} is outstanding across vendor payments.`} />}
              {paymentBreakdown[0] && <InsightLine icon={Smartphone} tone="info" text={`${paymentBreakdown.sort((a, b) => b.value - a.value)[0].label} represents ${pct((paymentBreakdown.sort((a, b) => b.value - a.value)[0].value / paymentBreakdown.reduce((s, p) => s + p.value, 0)) * 100)} of recorded sales.`} />}
            </Card>
          </section>

          {/* Quick actions */}
          <section>
            <SectionLabel>Quick Actions</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <QuickAction icon={PackagePlus} label="Add Product" onClick={() => setPage("products")} />
              <QuickAction icon={Truck} label="Receive Stock" onClick={() => setPage("purchases")} show={role === "owner"} />
              <QuickAction icon={ScanLine} label="Scan RFID" onClick={() => setPage("rfid")} />
              <QuickAction icon={ShoppingCart} label="New Sale" onClick={() => setPage("pos")} />
              <QuickAction icon={Wallet} label="Add Expense" onClick={() => setPage("expenses")} show={role === "owner"} />
              <QuickAction icon={TrendingUp} label="View P&L" onClick={() => setPage("pnl")} show={role === "owner"} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
