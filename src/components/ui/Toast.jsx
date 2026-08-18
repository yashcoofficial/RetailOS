import { CheckCircle2, XCircle, Sparkles } from "lucide-react";

export function Toast({ toasts }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <div key={t.id} className="slidein card px-4 py-2.5 text-sm flex items-center gap-2 shadow-lg" style={{ borderColor: t.tone === "danger" ? "var(--danger)" : "var(--line)" }}>
          {t.tone === "accent" ? <CheckCircle2 size={16} style={{ color: "var(--accent)" }} /> : t.tone === "danger" ? <XCircle size={16} style={{ color: "var(--danger)" }} /> : <Sparkles size={16} style={{ color: "var(--info)" }} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
