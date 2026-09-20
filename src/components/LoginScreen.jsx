import { useState } from "react";
import { ScanLine } from "lucide-react";
import { Card } from "./ui/Card.jsx";
import { Button } from "./ui/Button.jsx";
import { TextField } from "./ui/Fields.jsx";
import { signIn } from "../lib/cloud.js";
import { isCloudConfigured } from "../lib/supabase.js";
import { hasLocalAdminCredentials, validateAdminLogin, setLocallyAuthed } from "../lib/auth.js";

export function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (isCloudConfigured) {
        await signIn(email.trim(), password);
      } else {
        if (!hasLocalAdminCredentials) {
          setError("Admin login is not configured for this deployment.");
          return;
        }
        const valid = await validateAdminLogin(email, password);
        if (!valid) {
          setError("Incorrect email or password.");
          return;
        }
        setLocallyAuthed(true);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rfos min-h-[700px] flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <Card className="w-full max-w-[380px] p-6 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 mb-1">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
            <ScanLine size={22} color="#fff" />
          </div>
          <div className="disp text-lg font-semibold text-center">Shehzan Enterprises</div>
          <div className="text-xs text-center" style={{ color: "var(--ink-soft)" }}>Admin sign in · shared across every device</div>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <TextField label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          {error && <div className="text-xs" style={{ color: "var(--danger)" }}>{error}</div>}
          <Button type="submit" className="w-full mt-1" disabled={busy}>{busy ? "Please wait…" : "Sign In"}</Button>
        </form>
      </Card>
    </div>
  );
}
