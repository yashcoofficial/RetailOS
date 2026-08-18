import { useState } from "react";
import { Download, ShieldAlert, RotateCcw, LogOut } from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { TextField } from "../components/ui/Fields.jsx";
import { buildInitialState } from "../lib/initialState.js";
import { saveState } from "../lib/storage.js";

export function SettingsPage({ state, persist, notify, role, onLogout }) {
  const [ownerName, setOwnerName] = useState(state.settings.ownerName);
  const [shopName, setShopName] = useState(state.settings.shopName);
  const [taxRate, setTaxRate] = useState(state.settings.taxRate);
  const [deadDays, setDeadDays] = useState(state.settings.deadStockDays);

  const save = async () => {
    await persist((prev) => ({ ...prev, settings: { ...prev.settings, ownerName, shopName, taxRate, deadStockDays: deadDays } }));
    notify("Settings saved.", "accent");
  };

  const resetAll = async () => {
    const fresh = buildInitialState();
    await saveState(fresh);
    notify("All data cleared.", "accent");
    setTimeout(() => window.location.reload(), 600);
  };

  const exportAll = (key) => {
    const data = state[key];
    if (!data || data.length === 0) { notify("Nothing to export.", "danger"); return; }
    const cols = Object.keys(data[0]).filter((k) => typeof data[0][k] !== "object");
    const lines = data.map((row) => cols.map((c) => JSON.stringify(row[c] ?? "")).join(","));
    const blob = new Blob([[cols.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${key}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5 max-w-[700px]">
      <Card className="p-4 flex items-center justify-between">
        <div>
          <div className="disp font-medium text-sm">Session</div>
          <div className="text-xs" style={{ color: "var(--ink-soft)" }}>Signed in as {role === "owner" ? (state.settings.ownerName || "Shehzan") : "Staff"}</div>
        </div>
        <Button variant="soft" size="sm" icon={LogOut} onClick={onLogout}>Log Out</Button>
      </Card>

      <Card className="p-4 flex flex-col gap-3">
        <div className="disp font-medium text-sm">Shop Information</div>
        <TextField label="Owner Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} disabled={role !== "owner"} />
        <TextField label="Shop Name" value={shopName} onChange={(e) => setShopName(e.target.value)} disabled={role !== "owner"} />
        {role === "owner" && (
          <>
            <TextField label="Default Tax Rate (%)" type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
            <TextField label="Dead Stock Threshold (days)" type="number" value={deadDays} onChange={(e) => setDeadDays(Number(e.target.value))} />
            <Button onClick={save} className="w-fit">Save Settings</Button>
          </>
        )}
      </Card>

      <Card className="p-4 flex flex-col gap-2">
        <div className="disp font-medium text-sm">Data Storage</div>
        <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
          This app stores your shop's data in this browser's local storage. Clearing your browser data will erase it. For multi-device or multi-user access, connect it to a real backend and database.
        </div>
      </Card>

      {role === "owner" && (
        <Card className="p-4 flex flex-col gap-3">
          <div className="disp font-medium text-sm">Exports</div>
          <div className="flex flex-wrap gap-2">
            {["sales", "products", "purchases", "expenses", "vendors"].map((k) => (
              <Button key={k} variant="soft" size="sm" icon={Download} onClick={() => exportAll(k)}>{k[0].toUpperCase() + k.slice(1)} CSV</Button>
            ))}
          </div>
        </Card>
      )}

      {role === "owner" && (
        <Card className="p-4 flex flex-col gap-2">
          <div className="disp font-medium text-sm flex items-center gap-1.5" style={{ color: "var(--danger)" }}><ShieldAlert size={15} /> Reset All Data</div>
          <div className="text-xs" style={{ color: "var(--ink-soft)" }}>Permanently clears every product, sale, purchase, vendor, and expense — starts the app completely empty again.</div>
          <Button variant="danger" size="sm" icon={RotateCcw} onClick={resetAll} className="w-fit">Clear All Data</Button>
        </Card>
      )}
    </div>
  );
}
