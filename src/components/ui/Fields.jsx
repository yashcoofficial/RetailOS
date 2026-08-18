export function TextField({ label, ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="text-xs font-medium" style={{ color: "var(--ink-soft)" }}>{label}</span>}
      <input
        className="rounded-lg px-3 py-2 text-sm bg-white"
        style={{ border: "1px solid var(--line)" }}
        {...props}
      />
    </label>
  );
}

export function SelectField({ label, children, ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="text-xs font-medium" style={{ color: "var(--ink-soft)" }}>{label}</span>}
      <select className="rounded-lg px-3 py-2 text-sm bg-white" style={{ border: "1px solid var(--line)" }} {...props}>
        {children}
      </select>
    </label>
  );
}
