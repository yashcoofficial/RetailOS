import { useMemo, useState } from "react";

export function DemoTagPicker({ state, derived, onPick }) {
  const [open, setOpen] = useState(false);
  const activeTags = state.rfidTags.filter((t) => t.status === "Active");
  const sample = useMemo(() => {
    const byProduct = {};
    for (const t of activeTags) { if (!byProduct[t.productId]) byProduct[t.productId] = t; }
    return Object.values(byProduct).slice(0, 8);
  }, [state.rfidTags]);
  if (!open) return <button onClick={() => setOpen(true)} className="text-xs font-medium mt-2" style={{ color: "var(--primary)" }}>Show demo tags to scan →</button>;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {sample.map((t) => (
        <button key={t.tagId} onClick={() => onPick(t.tagId)} className="mono text-[10px] px-2 py-1 rounded-md" style={{ border: "1px solid var(--line)", background: "var(--surface-2)" }} title={derived.productById[t.productId]?.name}>
          {t.tagId.slice(0, 10)}…
        </button>
      ))}
    </div>
  );
}
