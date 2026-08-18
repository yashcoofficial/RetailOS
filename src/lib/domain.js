import { daysAgoISO, todayISO } from "./utils.js";

export function computeStockMap(stockMovements) {
  const map = {};
  for (const m of stockMovements) map[m.productId] = (map[m.productId] || 0) + m.qty;
  return map;
}

export function stockStatus(current, min, max) {
  if (current <= 0) return { label: "Out of Stock", tone: "danger" };
  if (current < min) return { label: "Low Stock", tone: "warn" };
  if (max && current > max) return { label: "Overstock", tone: "info" };
  return { label: "In Stock", tone: "accent" };
}

export function salesInRange(sales, fromISO, toISO) {
  return sales.filter((s) => s.date >= fromISO && s.date <= toISO);
}

export function expensesInRange(expenses, fromISO, toISO) {
  return expenses.filter((e) => e.date >= fromISO && e.date <= toISO);
}

export function financials(sales, expenses) {
  const revenue = sales.reduce((s, x) => s + x.total, 0);
  const cogs = sales.reduce((s, x) => s + x.cogs, 0);
  const grossProfit = revenue - cogs;
  const expTotal = expenses.reduce((s, x) => s + x.amount, 0);
  const netProfit = grossProfit - expTotal;
  const grossMargin = revenue ? (grossProfit / revenue) * 100 : 0;
  const netMargin = revenue ? (netProfit / revenue) * 100 : 0;
  return {
    revenue, cogs, grossProfit, expenses: expTotal, netProfit, grossMargin, netMargin,
    orders: sales.length, aov: sales.length ? revenue / sales.length : 0,
  };
}

export function insightSalesChange(state) {
  const thisWk = financials(salesInRange(state.sales, daysAgoISO(6), todayISO()), []);
  const lastWk = financials(salesInRange(state.sales, daysAgoISO(13), daysAgoISO(7)), []);
  if (!lastWk.revenue) return "Not enough sales history yet to compare weekly trends.";
  const change = ((thisWk.revenue - lastWk.revenue) / lastWk.revenue) * 100;
  return `Sales are ${change >= 0 ? "up" : "down"} ${Math.abs(change).toFixed(0)}% vs the previous 7 days.`;
}

export function deadStockList(state, derived, days) {
  const cutoff = daysAgoISO(days);
  const soldRecently = new Set();
  for (const s of state.sales) {
    if (s.date >= cutoff) for (const it of s.items) soldRecently.add(it.productId);
  }
  return derived.productsWithStock.filter((p) => p.currentStock > 0 && !soldRecently.has(p.id));
}
