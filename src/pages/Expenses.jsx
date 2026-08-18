import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { StatCard } from "../components/ui/StatCard.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { TextField, SelectField } from "../components/ui/Fields.jsx";
import { PAYMENT_MODES, EXPENSE_CATEGORIES } from "../lib/constants.js";
import { uid, todayISO, fmtDate, inr } from "../lib/utils.js";

export function Expenses({ state, persist, notify }) {
  const [showModal, setShowModal] = useState(false);
  const rows = [...state.expenses].sort((a, b) => b.date.localeCompare(a.date));
  const total = rows.reduce((s, e) => s + e.amount, 0);

  const addExpense = async (form) => {
    await persist((prev) => ({ ...prev, expenses: [...prev.expenses, { id: uid("exp"), ...form }] }));
    notify("Expense recorded.", "accent");
    setShowModal(false);
  };

  return (
    <div className="flex flex-col gap-4 max-w-[900px]">
      <div className="flex items-center justify-between">
        <StatCard label="Total Expenses Recorded" value={inr(total)} tone="warn" />
        <Button icon={Plus} onClick={() => setShowModal(true)}>Add Expense</Button>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ background: "var(--surface-2)" }}>
              {["Category", "Date", "Payment Mode", "Notes", "Amount"].map((h) => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "var(--ink-soft)" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-t" style={{ borderColor: "var(--line-soft)" }}>
                  <td className="px-4 py-2.5">{e.category}</td>
                  <td className="px-4 py-2.5">{fmtDate(e.date)}</td>
                  <td className="px-4 py-2.5 capitalize">{e.paymentMode}</td>
                  <td className="px-4 py-2.5" style={{ color: "var(--ink-faint)" }}>{e.notes || "—"}</td>
                  <td className="px-4 py-2.5 font-medium">{inr(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Expense">
        <ExpenseForm onSave={addExpense} />
      </Modal>
    </div>
  );
}

function ExpenseForm({ onSave }) {
  const [form, setForm] = useState({ category: EXPENSE_CATEGORIES[0], amount: 0, date: todayISO(), paymentMode: "cash", notes: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="flex flex-col gap-3">
      <SelectField label="Category" value={form.category} onChange={(e) => set("category", e.target.value)}>
        {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </SelectField>
      <TextField label="Amount (₹)" type="number" value={form.amount} onChange={(e) => set("amount", Number(e.target.value))} />
      <TextField label="Date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
      <SelectField label="Payment Mode" value={form.paymentMode} onChange={(e) => set("paymentMode", e.target.value)}>
        {PAYMENT_MODES.filter((p) => p.id !== "credit").map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </SelectField>
      <TextField label="Notes (optional)" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      <Button onClick={() => onSave(form)} className="w-full">Save Expense</Button>
    </div>
  );
}
