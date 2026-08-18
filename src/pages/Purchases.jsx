import { useState } from "react";
import { Plus, ScanLine } from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { TextField, SelectField } from "../components/ui/Fields.jsx";
import { ScanCaptureInput } from "../components/ScanCaptureInput.jsx";
import { PAYMENT_MODES } from "../lib/constants.js";
import { uid, rfidTag, todayISO, fmtDate, inr } from "../lib/utils.js";

export function Purchases({ state, derived, persist, notify }) {
  const [showModal, setShowModal] = useState(false);
  const [receiving, setReceiving] = useState(null);

  const createPurchase = async (form) => {
    await persist((prev) => ({ ...prev, purchases: [...prev.purchases, { id: uid("pur"), ...form, paidAmount: form.paymentStatus === "Paid" ? form.total : form.paymentStatus === "Unpaid" ? 0 : Math.round(form.total * 0.5) }] }));
    notify(`Purchase order ${form.invoiceNo} created.`, "accent");
    setShowModal(false);
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1100px]">
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{ color: "var(--ink-soft)" }}>Record incoming stock and receive it via RFID scan.</div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>New Purchase</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ background: "var(--surface-2)" }}>
              {["Invoice", "Vendor", "Date", "Items", "Total", "Paid", "Status", ""].map((h) => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "var(--ink-soft)" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {[...state.purchases].sort((a, b) => b.date.localeCompare(a.date)).map((pu) => (
                <tr key={pu.id} className="border-t" style={{ borderColor: "var(--line-soft)" }}>
                  <td className="px-4 py-2.5 mono text-xs">{pu.invoiceNo}</td>
                  <td className="px-4 py-2.5">{derived.vendorById[pu.vendorId]?.name}</td>
                  <td className="px-4 py-2.5">{fmtDate(pu.date)}</td>
                  <td className="px-4 py-2.5">{pu.items.reduce((s, i) => s + i.qty, 0)} units</td>
                  <td className="px-4 py-2.5">{inr(pu.total)}</td>
                  <td className="px-4 py-2.5">{inr(pu.paidAmount)}</td>
                  <td className="px-4 py-2.5"><Badge tone={pu.paymentStatus === "Paid" ? "accent" : pu.paymentStatus === "Unpaid" ? "danger" : "warn"}>{pu.paymentStatus}</Badge></td>
                  <td className="px-4 py-2.5"><Button variant="soft" size="sm" icon={ScanLine} onClick={() => setReceiving(pu)}>Receive</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Purchase Order">
        <PurchaseForm state={state} onSave={createPurchase} />
      </Modal>

      <Modal open={!!receiving} onClose={() => setReceiving(null)} title={`Receive Stock — ${receiving?.invoiceNo || ""}`} width={620}>
        {receiving && <ReceiveStock state={state} derived={derived} purchase={receiving} persist={persist} notify={notify} onDone={() => setReceiving(null)} />}
      </Modal>
    </div>
  );
}

function PurchaseForm({ state, onSave }) {
  const [vendorId, setVendorId] = useState(state.vendors[0]?.id || "");
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Math.floor(Math.random() * 9000 + 1000)}`);
  const [date, setDate] = useState(todayISO());
  const [items, setItems] = useState([{ productId: state.products[0]?.id || "", qty: 10, price: state.products[0]?.purchasePrice || 0 }]);
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [paymentMode, setPaymentMode] = useState("bank");

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const updateItem = (idx, patch) => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  const addItem = () => setItems((prev) => [...prev, { productId: state.products[0]?.id || "", qty: 1, price: 0 }]);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Vendor" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
          {state.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </SelectField>
        <TextField label="Invoice Number" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
        <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <SelectField label="Payment Mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
          {PAYMENT_MODES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </SelectField>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium" style={{ color: "var(--ink-soft)" }}>Items</span>
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_70px_90px] gap-2 items-center">
            <select value={it.productId} onChange={(e) => {
              const p = state.products.find((x) => x.id === e.target.value);
              updateItem(idx, { productId: e.target.value, price: p?.purchasePrice || 0 });
            }} className="rounded-lg px-2 py-2 text-sm" style={{ border: "1px solid var(--line)" }}>
              {state.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" value={it.qty} onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })} className="rounded-lg px-2 py-2 text-sm" style={{ border: "1px solid var(--line)" }} />
            <input type="number" value={it.price} onChange={(e) => updateItem(idx, { price: Number(e.target.value) })} className="rounded-lg px-2 py-2 text-sm" style={{ border: "1px solid var(--line)" }} />
          </div>
        ))}
        <button onClick={addItem} className="text-xs font-medium text-left" style={{ color: "var(--primary)" }}>+ Add another item</button>
      </div>

      <SelectField label="Payment Status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
        <option>Unpaid</option><option>Partially Paid</option><option>Paid</option>
      </SelectField>

      <div className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--surface-2)" }}>
        Total Purchase Amount <span>{inr(total)}</span>
      </div>
      <Button onClick={() => onSave({ vendorId, invoiceNo, date, items, total, paymentStatus, paymentMode })} className="w-full">Create Purchase Order</Button>
    </div>
  );
}

function ReceiveStock({ state, derived, purchase, persist, notify, onDone }) {
  const [scanned, setScanned] = useState([]);
  const expectedQty = purchase.items.reduce((s, i) => s + i.qty, 0);

  const handleScan = (tagId) => {
    if (state.rfidTags.find((t) => t.tagId.toUpperCase() === tagId.toUpperCase())) {
      notify(`Tag ${tagId} is already registered.`, "danger"); return;
    }
    if (scanned.length >= expectedQty) { notify("All expected units already scanned.", "danger"); return; }
    let remaining = purchase.items.map((i) => ({ ...i, got: 0 }));
    for (const s of scanned) {
      const idx = remaining.findIndex((r) => r.productId === s.productId);
      if (idx >= 0) remaining[idx].got += 1;
    }
    const target = remaining.find((r) => r.got < r.qty);
    if (!target) { notify("All items fully received.", "danger"); return; }
    setScanned((prev) => [...prev, { tagId, productId: target.productId }]);
  };

  const finish = async () => {
    const date = todayISO();
    await persist((prev) => {
      const rfidTags = [...prev.rfidTags, ...scanned.map((s) => ({
        tagId: s.tagId, productId: s.productId, sku: prev.products.find((p) => p.id === s.productId)?.sku,
        status: "Active", assignedDate: date, lastSeen: date, lastTransaction: null, location: "Store Floor",
      }))];
      const byProduct = {};
      for (const s of scanned) byProduct[s.productId] = (byProduct[s.productId] || 0) + 1;
      const stockMovements = [...prev.stockMovements, ...Object.entries(byProduct).map(([pid, qty]) => ({
        id: uid("mv"), productId: pid, type: "Purchase", qty, date, refId: purchase.invoiceNo, note: `Received via RFID scan`,
      }))];
      return { ...prev, rfidTags, stockMovements };
    });
    notify(`${scanned.length} unit(s) received and added to inventory.`, "accent");
    onDone();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm" style={{ color: "var(--ink-soft)" }}>Scan each incoming unit's RFID tag. No manual quantity entry needed.</div>
      <ScanCaptureInput onScan={handleScan} placeholder="Scan RFID tag on incoming product…" />
      <button onClick={() => handleScan(rfidTag())} className="text-xs font-medium text-left" style={{ color: "var(--primary)" }}>Simulate next scan (generates a fresh tag) →</button>

      <div className="flex items-center justify-between px-3 py-2 rounded-lg text-sm" style={{ background: "var(--accent-soft)" }}>
        <span>Scanned: <b>{scanned.length}</b> / {expectedQty} expected</span>
      </div>
      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
        {scanned.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs mono px-2 py-1 rounded-md" style={{ background: "var(--surface-2)" }}>
            <span>{s.tagId}</span>
            <span className="font-sans" style={{ color: "var(--ink-soft)" }}>{derived.productById[s.productId]?.name}</span>
          </div>
        ))}
      </div>
      <Button variant="accent" disabled={scanned.length === 0} onClick={finish} className="w-full">Confirm Receipt · {scanned.length} unit(s)</Button>
    </div>
  );
}
