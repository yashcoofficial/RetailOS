import { ScanLine, Database } from "lucide-react";
import { Card } from "./ui/Card.jsx";

export function CloudConfigScreen() {
  return (
    <div className="rfos min-h-[700px] flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <Card className="w-full max-w-[520px] p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
            <ScanLine size={22} color="#fff" />
          </div>
          <div>
            <div className="disp text-lg font-semibold">Connect RetailOS Cloud</div>
            <div className="text-xs" style={{ color: "var(--ink-soft)" }}>One database keeps every device in sync.</div>
          </div>
        </div>
        <div className="rounded-xl p-4 flex gap-3" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
          <Database size={19} style={{ color: "var(--primary)", flexShrink: 0 }} />
          <div className="text-sm leading-6" style={{ color: "var(--ink-soft)" }}>
            Run the SQL migration in <span className="mono">supabase/migrations</span>, then copy <span className="mono">.env.example</span> to <span className="mono">.env</span> and add your Supabase URL and publishable key.
          </div>
        </div>
        <div className="text-xs" style={{ color: "var(--ink-faint)" }}>The service-role key must never be added to this frontend.</div>
      </Card>
    </div>
  );
}
