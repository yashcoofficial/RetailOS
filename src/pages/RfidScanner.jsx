import { useMemo, useState } from "react";
import { Search, ClipboardCheck, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { MiniStat } from "../components/ui/Misc.jsx";
import { ScanCaptureInput } from "../components/ScanCaptureInput.jsx";
import { DemoTagPicker } from "../components/DemoTagPicker.jsx";
import { uid, todayISO, fmtDate, inr } from "../lib/utils.js";

export function RfidScannerPage({ state, derived, persist, notify, role }) {
  const [mode, setMode] = useState("lookup"); // lookup | audit
  const [lookupResult, setLookupResult] = useState(null);
  const [auditScanned, setAuditScanned] = useState({}); // tagId -> true
  const [auditRunning, setAuditRunning] = useState(false);
  const [feed, setFeed] = useState([]);

  const pushFeed = (entry) => setFeed((f) => [entry, ...f].slice(0, 25));

  const doLookup = (tagId) => {
    const tag = state.rfidTags.find((t) => t.tagId.toUpperCase() === tagId.toUpperCase());
    if (!tag) { setLookupResult({ ok: false, tagId }); pushFeed({ tagId, ok: false, note: "Unregistered", ts: Date.now() }); return; }
    const product = derived.productById[tag.productId];
    const productSales = state.sales.filter((s) => s.items.some((it) => it.productId === tag.productId));
    const productPurchases = state.purchases.filter((p) => p.items.some((it) => it.productId === tag.productId));
    setLookupResult({ ok: true, tag, product, salesCount: productSales.length, purchaseCount: productPurchases.length });
    pushFeed({ tagId, ok: true, note: product?.name, ts: Date.now() });
  };

  const doAuditScan = (tagId) => {
    const tag = state.rfidTags.find((t) => t.tagId.toUpperCase() === tagId.toUpperCase());
    setAuditScanned((prev) => ({ ...prev, [tagId.toUpperCase()]: true }));
    if (!tag) { pushFeed({ tagId, ok: false, note: "Unexpected tag", ts: Date.now() }); return; }
    pushFeed({ tagId, ok: true, note: derived.productById[tag.productId]?.name || "—", ts: Date.now() });
  };

  const auditResults = useMemo(() => {
    if (!auditRunning && Object.keys(auditScanned).length === 0) return null;
    // Reserved tags are mid-sale (scanned in an open POS cart, not yet checked
    // out) — they're still physically on the shelf, so the audit should expect
    // to find them too, not flag them as missing.
    const expectedTags = state.rfidTags.filter((t) => t.status === "Active" || t.status === "Reserved");
    const scannedIds = new Set(Object.keys(auditScanned));
    const found = expectedTags.filter((t) => scannedIds.has(t.tagId.toUpperCase()));
    const missing = expectedTags.filter((t) => !scannedIds.has(t.tagId.toUpperCase()));
    const byTagId = Object.fromEntries(state.rfidTags.map((t) => [t.tagId.toUpperCase(), t]));
    // Every scanned tag falls into exactly one bucket, so nothing silently
    // disappears from the summary: unregistered tags are "unexpected";
    // registered tags that aren't Active/Reserved (already sold, already
    // marked missing, etc.) are called out separately as "already processed".
    const unexpected = [...scannedIds].filter((id) => !byTagId[id]);
    const alreadyProcessed = [...scannedIds]
      .map((id) => byTagId[id])
      .filter((t) => t && t.status !== "Active" && t.status !== "Reserved");
    return { found, missing, unexpected, alreadyProcessed, expectedCount: expectedTags.length };
  }, [auditScanned, auditRunning, state.rfidTags]);

  const finishAudit = async () => {
    if (!auditResults) return;
    const date = todayISO();
    await persist((prev) => {
      const stockMovements = [...prev.stockMovements];
      const rfidTags = prev.rfidTags.map((t) => {
        if (auditResults.missing.find((m) => m.tagId === t.tagId)) {
          return { ...t, status: "Missing" };
        }
        return t;
      });
      const missingByProduct = {};
      for (const t of auditResults.missing) missingByProduct[t.productId] = (missingByProduct[t.productId] || 0) + 1;
      for (const [pid, qty] of Object.entries(missingByProduct)) {
        stockMovements.push({ id: uid("mv"), productId: pid, type: "RFID Audit Adjustment", qty: -qty, date, refId: "AUDIT", note: `${qty} unit(s) not found during audit` });
      }
      return { ...prev, stockMovements, rfidTags };
    });
    notify(`Audit complete — ${auditResults.found.length} found, ${auditResults.missing.length} missing, marked as adjusted.`, auditResults.missing.length ? "danger" : "accent");
    setAuditScanned({}); setAuditRunning(false); setFeed([]);
  };

  return (
    <div className="flex flex-col gap-5 max-w-[1000px]">
      <div className="flex items-center gap-2">
        {[
          { id: "lookup", label: "Tag Lookup", icon: Search },
          { id: "audit", label: "Inventory Audit", icon: ClipboardCheck },
        ].map((m) => (
          <button key={m.id} onClick={() => { setMode(m.id); setFeed([]); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium" style={{ background: mode === m.id ? "var(--primary)" : "var(--surface)", color: mode === m.id ? "#fff" : "var(--ink-soft)", border: "1px solid var(--line)" }}>
            <m.icon size={14} /> {m.label}
          </button>
        ))}
      </div>

      {mode === "lookup" && (
        <>
          <Card className="p-4">
            <div className="disp font-medium text-sm mb-2">Scan a tag to look it up</div>
            <ScanCaptureInput onScan={doLookup} />
            <DemoTagPicker state={state} derived={derived} onPick={doLookup} />
          </Card>
          {lookupResult && (
            lookupResult.ok ? (
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="disp text-lg font-semibold">{lookupResult.product?.name}</div>
                    <div className="mono text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>{lookupResult.tag.tagId}</div>
                  </div>
                  <Badge tone={lookupResult.tag.status === "Active" ? "accent" : lookupResult.tag.status === "Reserved" ? "warn" : lookupResult.tag.status === "Sold" ? "ink" : "danger"}>{lookupResult.tag.status}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <MiniStat label="Stock" value={lookupResult.product?.currentStock} />
                  {role === "owner" && <MiniStat label="Purchase Price" value={inr(lookupResult.product?.purchasePrice)} />}
                  <MiniStat label="Selling Price" value={inr(lookupResult.product?.sellingPrice)} />
                  <MiniStat label="Location" value={lookupResult.tag.location} />
                  <MiniStat label="Sales Transactions" value={lookupResult.salesCount} />
                  <MiniStat label="Purchase Records" value={lookupResult.purchaseCount} />
                  <MiniStat label="Last Seen" value={fmtDate(lookupResult.tag.lastSeen)} />
                  <MiniStat label="Last Transaction" value={lookupResult.tag.lastTransaction || "—"} />
                </div>
              </Card>
            ) : (
              <Card className="p-4 flex items-center gap-2" style={{ borderColor: "var(--danger)" }}>
                <XCircle size={16} style={{ color: "var(--danger)" }} />
                <span>Tag <span className="mono">{lookupResult.tagId}</span> is not registered in the system.</span>
              </Card>
            )
          )}
        </>
      )}

      {mode === "audit" && (
        <>
          {derived.totalStockUnits === 0 ? (
            <Card className="p-10">
              <div className="flex flex-col items-center justify-center text-center py-4 gap-2">
                <div className="disp font-medium">No inventory registered yet</div>
                <div className="text-sm max-w-sm" style={{ color: "var(--ink-soft)" }}>
                  There's nothing on record to audit against. Add a product and some stock (or receive a purchase) first — then come back here to reconcile it.
                </div>
              </div>
            </Card>
          ) : (
          <>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="disp font-medium text-sm">Scan the entire store to reconcile inventory</div>
              <Badge tone="info">{Object.keys(auditScanned).length} tags scanned</Badge>
            </div>
            <ScanCaptureInput onScan={(id) => { setAuditRunning(true); doAuditScan(id); }} placeholder="Scan every product in the store…" />
            <DemoTagPicker state={state} derived={derived} onPick={(id) => { setAuditRunning(true); doAuditScan(id); }} />
          </Card>

          {feed.length > 0 && (
            <Card className="p-4">
              <div className="disp font-medium text-sm mb-2">Live Scan Feed</div>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {feed.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs mono">
                    <span style={{ color: "var(--ink-faint)" }}>{f.tagId}</span>
                    {f.ok ? <CheckCircle2 size={12} style={{ color: "var(--accent)" }} /> : <XCircle size={12} style={{ color: "var(--danger)" }} />}
                    <span className="font-sans" style={{ color: "var(--ink-soft)" }}>{f.note}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {auditResults && (
            <Card className="p-4">
              <div className="disp font-medium text-sm mb-3">Audit Summary</div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <MiniStat label="Found" value={auditResults.found.length} tone="accent" />
                <MiniStat label="Missing" value={auditResults.missing.length} tone="danger" />
                <MiniStat label="Unexpected" value={auditResults.unexpected.length} tone="warn" />
              </div>
              {auditResults.alreadyProcessed.length > 0 && (
                <div className="text-xs mb-3 px-2 py-1.5 rounded-md" style={{ background: "var(--surface-2)", color: "var(--ink-soft)" }}>
                  {auditResults.alreadyProcessed.length} scanned tag(s) are registered but already marked {auditResults.alreadyProcessed.map((t) => t.status).join(", ")} — not counted as found or missing.
                </div>
              )}
              {auditResults.missing.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--ink-soft)" }}>Missing products</div>
                  <div className="flex flex-col gap-1">
                    {Object.entries(auditResults.missing.reduce((acc, t) => { acc[t.productId] = (acc[t.productId] || 0) + 1; return acc; }, {})).map(([pid, qty]) => (
                      <div key={pid} className="flex items-center justify-between text-sm">
                        <span>{derived.productById[pid]?.name}</span>
                        <Badge tone="danger">{qty} missing</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button variant="primary" onClick={finishAudit}>Apply Audit Adjustments</Button>
            </Card>
          )}
          </>
          )}
        </>
      )}
    </div>
  );
}
