import { useRef, useState } from "react";
import { ScanLine } from "lucide-react";

// Real HID RFID guns emulate a keyboard: they "type" the tag id then send Enter.
// This input captures exactly that pattern, so it is drop-in compatible with
// real hardware — no simulated logic diverges from how a physical reader behaves.
export function ScanCaptureInput({ onScan, placeholder = "Click here, then scan RFID tag…", disabled }) {
  const ref = useRef(null);
  const [val, setVal] = useState("");
  const [pulse, setPulse] = useState(false);

  const submit = () => {
    const tag = val.trim();
    if (!tag) return;
    onScan(tag);
    setVal("");
    setPulse(true);
    setTimeout(() => setPulse(false), 350);
  };

  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${pulse ? "scanpulse" : ""}`} style={{ border: "1.5px solid var(--accent)", background: "var(--accent-soft)" }}>
      <ScanLine size={18} style={{ color: "var(--accent)" }} />
      <input
        ref={ref}
        disabled={disabled}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none mono text-sm"
        style={{ color: "var(--ink)" }}
        autoComplete="off"
      />
      <button onClick={submit} className="text-xs font-medium px-2 py-1 rounded-md" style={{ background: "var(--accent)", color: "#fff" }}>Enter</button>
    </div>
  );
}
