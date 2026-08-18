import React, { useState } from "react";
import { Search, Download, Boxes } from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { SelectField } from "../components/ui/Fields.jsx";
import { StockMovementHistory } from "../components/StockMovementHistory.jsx";
import { stockStatus } from "../lib/domain.js";
import { inr } from "../lib/utils.js";

export function Inventory({ state, derived, role }) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expanded, setExpanded] = useState(null);

  let rows = derived.productsWithStock.map((p) => ({ ...p, status: stockStatus(p.currentStock, p.minStock, p.maxStock) }));
  if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()));
  if (statusFilter !== "all") rows = rows.filter((p) => p.status.label === statusFilter);
  rows = [...rows].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "stock") return b.currentStock - a.currentStock;
    if (sortBy === "value") return b.costValue - a.costValue;
    return 0;
  });

  const exportCsv = () => {
    const header = ["Product", "SKU", "Stock", "Purchase Price", "Selling Price", "Stock Value", "Status"];
    const lines = rows.map((p) => [p.name, p.sku, p.currentStock, p.purchasePrice, p.sellingPrice, p.costValue, p.status.label].join(","));
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "inventory.csv"; a.click(); URL.revokeObjectURL(url);
  };

  if (state.products.length === 0) {
    return (
      <div className="max-w-[1200px]">
        <Card className="p-10">
          <EmptyState icon={Boxes} title="Inventory is empty" sub="Add a product to start tracking stock, RFID tags, and value here." />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-faint)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product or SKU…" className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--line)" }} />
        </div>
        <div className="flex flex-wrap gap-2">
          <SelectField value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option>In Stock</option><option>Low Stock</option><option>Out of Stock</option><option>Overstock</option>
          </SelectField>
          <SelectField value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Sort: Name</option>
            <option value="stock">Sort: Stock</option>
            {role === "owner" && <option value="value">Sort: Value</option>}
          </SelectField>
          <Button variant="soft" icon={Download} onClick={exportCsv}>Export</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Product", "SKU", "Stock", role === "owner" ? "Purchase" : null, "Selling", role === "owner" ? "Stock Value" : null, "Status"].filter(Boolean).map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "var(--ink-soft)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <React.Fragment key={p.id}>
                  <tr className="border-t cursor-pointer hover:bg-gray-50" style={{ borderColor: "var(--line-soft)" }} onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                    <td className="px-4 py-2.5 font-medium">{p.name}</td>
                    <td className="px-4 py-2.5 mono text-xs" style={{ color: "var(--ink-faint)" }}>{p.sku}</td>
                    <td className="px-4 py-2.5">{p.currentStock}</td>
                    {role === "owner" && <td className="px-4 py-2.5">{inr(p.purchasePrice)}</td>}
                    <td className="px-4 py-2.5">{inr(p.sellingPrice)}</td>
                    {role === "owner" && <td className="px-4 py-2.5">{inr(p.costValue)}</td>}
                    <td className="px-4 py-2.5"><Badge tone={p.status.tone}>{p.status.label}</Badge></td>
                  </tr>
                  {expanded === p.id && (
                    <tr>
                      <td colSpan={role === "owner" ? 7 : 5} className="px-4 pb-4 pt-1" style={{ background: "var(--surface-2)" }}>
                        <StockMovementHistory state={state} productId={p.id} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="py-10"><EmptyState icon={Boxes} title="No products match" sub="Try a different search or filter." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
