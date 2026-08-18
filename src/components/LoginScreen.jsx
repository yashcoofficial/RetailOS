import { useState } from "react";
import { ScanLine } from "lucide-react";
import { Card } from "./ui/Card.jsx";
import { Button } from "./ui/Button.jsx";
import { TextField } from "./ui/Fields.jsx";
import { LOGIN_EMAIL, LOGIN_PASSWORD } from "../lib/auth.js";

export function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === LOGIN_EMAIL.toLowerCase() && password === LOGIN_PASSWORD) {
      setError("");
      onSuccess();
    } else {
      setError("Incorrect email or password.");
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
          <div className="text-xs text-center" style={{ color: "var(--ink-soft)" }}>Sign in to manage your store</div>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <TextField label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          {error && <div className="text-xs" style={{ color: "var(--danger)" }}>{error}</div>}
          <Button type="submit" className="w-full mt-1">Sign In</Button>
        </form>
      </Card>
    </div>
  );
}
