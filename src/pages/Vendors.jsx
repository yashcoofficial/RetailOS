import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { TextField } from "../components/ui/Fields.jsx";
import { MiniStat } from "../components/ui/Misc.jsx";
import { uid, inr } from "../lib/utils.js";

export function Vendors({ state, persist, notify }) {
  const [showModal, setShowModal] = useState(false);
  const rows = state.vendors.map((v) => {
    const purchases = state.purchases.filter((p) => p.vendorId === v.id);
    const total = purchases.reduce((s, p) => s + p.total, 0);
    const paid = purchases.reduce((s, p) => s + p.paidAmount, 0);
    return { ...v, purchaseCount: purchases.length, total, paid, outstanding: total - paid };
  });

  const addVendor = async (form) => {
    await persist((prev) => ({ ...prev, vendors: [...prev.vendors, { id: uid("ven"), ...form }] }));
    notify("Vendor added.", "accent");
    setShowModal(false);
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1100px]">
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{ color: "var(--ink-soft)" }}>{rows.length} vendors on file</div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>Add Vendor</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((v) => (
          <Card key={v.id} className="p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{v.name}</div>
                <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{v.company}</div>
              </div>
              <Building2 size={16} style={{ color: "var(--ink-faint)" }} />
            </div>
            <div className="text-xs" style={{ color: "var(--ink-faint)" }}>{v.phone} · {v.gst}</div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t" style={{ borderColor: "var(--line-soft)" }}>
              <MiniStat label="Purchases" value={v.purchaseCount} />
              <MiniStat label="Total Value" value={inr(v.total)} />
              <MiniStat label="Outstanding" value={inr(v.outstanding)} tone={v.outstanding > 0 ? "danger" : "accent"} />
            </div>
          </Card>
        ))}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Vendor">
        <VendorForm onSave={addVendor} />
      </Modal>
    </div>
  );
}

function VendorForm({ onSave }) {
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", gst: "", address: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Vendor Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <TextField label="Company Name" value={form.company} onChange={(e) => set("company", e.target.value)} />
        <TextField label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <TextField label="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        <TextField label="GST Number" value={form.gst} onChange={(e) => set("gst", e.target.value)} />
        <TextField label="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />
      </div>
      <Button onClick={() => onSave(form)} className="w-full">Save Vendor</Button>
    </div>
  );
}
