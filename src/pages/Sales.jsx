import { useState } from "react";
import { Search, CheckCircle2 } from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { ScanCaptureInput } from "../components/ScanCaptureInput.jsx";
import { uid, todayISO, fmtDate, inr } from "../lib/utils.js";

export function SalesPage({ state, derived, persist, notify, role }) {
  const [returning, setReturning] = useState(null);
  const [q, setQ] = useState("");

  const rows = [...state.sales].sort((a, b) => b.date.localeCompare(a.date)).filter((s) => s.invoiceNo.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex flex-col gap-4 max-w-[1100px]">
      <div className="relative w-full sm:w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-faint)" }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice…" className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--line)" }} />
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ background: "var(--surface-2)" }}>
              {["Invoice", "Date", "Items", "Payment", "Total", role === "owner" ? "Profit" : null, ""].filter(Boolean).map((h) => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "var(--ink-soft)" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.slice(0, 60).map((s) => (
                <tr key={s.id} className="border-t" style={{ borderColor: "var(--line-soft)" }}>
                  <td className="px-4 py-2.5 mono text-xs">{s.invoiceNo}</td>
                  <td className="px-4 py-2.5">{fmtDate(s.date)}</td>
                  <td className="px-4 py-2.5">{s.items.reduce((a, i) => a + i.qty, 0)} items</td>
                  <td className="px-4 py-2.5 capitalize">{s.paymentMode}</td>
                  <td className="px-4 py-2.5 font-medium">{inr(s.total)}</td>
                  {role === "owner" && <td className="px-4 py-2.5" style={{ color: "var(--accent)" }}>+{inr(s.total - s.cogs - s.discount)}</td>}
                  <td className="px-4 py-2.5"><Button variant="soft" size="sm" onClick={() => setReturning(s)}>Return</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!returning} onClose={() => setReturning(null)} title={`Process Return — ${returning?.invoiceNo || ""}`}>
        {returning && <ReturnFlow state={state} derived={derived} sale={returning} persist={persist} notify={notify} onDone={() => setReturning(null)} />}
      </Modal>
    </div>
  );
}

function ReturnFlow({ state, derived, sale, persist, notify, onDone }) {
  const [scanned, setScanned] = useState(null);
  const [selectedItem, setSelectedItem] = useState(sale.items[0]?.productId || "");

  const handleScan = (tagId) => {
    const tag = state.rfidTags.find((t) => t.tagId.toUpperCase() === tagId.toUpperCase());
    if (!tag) { notify("Tag not recognized.", "danger"); return; }
    if (!sale.items.find((it) => it.productId === tag.productId)) { notify("This tag was not part of the original sale.", "danger"); return; }
    setScanned(tag);
    setSelectedItem(tag.productId);
  };

  const processReturn = async () => {
    const date = todayISO();
    const item = sale.items.find((it) => it.productId === selectedItem);
    await persist((prev) => {
      const rfidTags = prev.rfidTags.map((t) => t.tagId === scanned?.tagId ? { ...t, status: "Active", lastSeen: date, lastTransaction: `RETURN-${sale.invoiceNo}` } : t);
      const stockMovements = [...prev.stockMovements, { id: uid("mv"), productId: selectedItem, type: "Return", qty: 1, date, refId: sale.invoiceNo, note: "Sales return" }];
      const returns = [...(prev.returns || []), { id: uid("ret"), saleId: sale.id, productId: selectedItem, date, refundAmount: item.price, paymentMode: sale.paymentMode }];
      return { ...prev, rfidTags, stockMovements, returns };
    });
    notify(`Return processed. ${inr(item.price)} refunded via ${sale.paymentMode}.`, "accent");
    onDone();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm" style={{ color: "var(--ink-soft)" }}>Scan the item's RFID tag to validate and process the return.</div>
      <ScanCaptureInput onScan={handleScan} />
      <div className="flex flex-col gap-1">
        {sale.items.map((it) => (
          <button key={it.productId} onClick={() => setSelectedItem(it.productId)} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left" style={{ border: selectedItem === it.productId ? "1.5px solid var(--primary)" : "1px solid var(--line)" }}>
            <span>{derived.productById[it.productId]?.name}</span>
            <span>{inr(it.price)}</span>
          </button>
        ))}
      </div>
      {scanned && <div className="text-xs flex items-center gap-1.5" style={{ color: "var(--accent)" }}><CheckCircle2 size={13} /> Tag validated: {scanned.tagId}</div>}
      <Button variant="accent" onClick={processReturn} className="w-full">Process Return & Refund</Button>
    </div>
  );
}
