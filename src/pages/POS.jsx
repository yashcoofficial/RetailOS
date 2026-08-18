import { useState, useEffect, useRef } from "react";
import { Search, Minus, Plus, Trash2, CheckCircle2, XCircle, ShoppingCart } from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { SelectField } from "../components/ui/Fields.jsx";
import { ScanCaptureInput } from "../components/ScanCaptureInput.jsx";
import { DemoTagPicker } from "../components/DemoTagPicker.jsx";
import { PAYMENT_MODES } from "../lib/constants.js";
import { stockStatus } from "../lib/domain.js";
import { uid, todayISO, inr, clamp } from "../lib/utils.js";

export function POS({ state, derived, persist, notify, role, cart, setCart }) {
  const [query, setQuery] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [customerId, setCustomerId] = useState(state.customers[0]?.id || "");
  const [lastScan, setLastScan] = useState(null);
  const cartRef = useRef(cart);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  // If staff navigates away with unconfirmed items still in the cart (customer
  // changed their mind, got called away, etc.), release any reserved tags back
  // to Active so they aren't stuck unavailable for the next sale.
  useEffect(() => {
    return () => {
      const leftover = cartRef.current;
      const tagIds = (leftover || []).flatMap((c) => c.tagIds);
      if (tagIds.length > 0) {
        persist((prev) => ({
          ...prev,
          rfidTags: prev.rfidTags.map((t) => tagIds.includes(t.tagId) && t.status === "Reserved" ? { ...t, status: "Active", lastTransaction: null } : t),
        }));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = query.length > 0
    ? derived.productsWithStock.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  const addToCart = (product, tagId) => {
    if (product.currentStock <= 0 && !cart.find((c) => c.productId === product.id)) {
      notify(`${product.name} is out of stock.`, "danger"); return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      const inCartQty = existing ? existing.qty : 0;
      if (inCartQty + 1 > product.currentStock) {
        notify(`Only ${product.currentStock} unit(s) of ${product.name} available.`, "danger");
        return prev;
      }
      if (existing) {
        return prev.map((c) => c.productId === product.id ? { ...c, qty: c.qty + 1, tagIds: tagId ? [...c.tagIds, tagId] : c.tagIds } : c);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.sellingPrice, cost: product.purchasePrice, qty: 1, tagIds: tagId ? [tagId] : [] }];
    });
    setQuery("");
  };

  const handleScan = async (tagId) => {
    const tag = state.rfidTags.find((t) => t.tagId.toUpperCase() === tagId.toUpperCase());
    if (!tag) { notify(`Unregistered RFID tag: ${tagId}`, "danger"); setLastScan({ ok: false, tagId }); return; }
    if (tag.status !== "Active") { notify(`Tag ${tagId} is not available (status: ${tag.status}).`, "danger"); setLastScan({ ok: false, tagId }); return; }
    const product = derived.productById[tag.productId];
    if (!product) { notify(`Tag ${tagId} has no matching product.`, "danger"); return; }
    // Reserve the physical tag immediately on scan so it can't be scanned into
    // a second sale while this one is still pending confirmation.
    await persist((prev) => ({
      ...prev,
      rfidTags: prev.rfidTags.map((t) => t.tagId === tag.tagId ? { ...t, status: "Reserved", lastTransaction: "Pending sale" } : t),
    }));
    addToCart(product, tag.tagId);
    setLastScan({ ok: true, tagId, name: product.name, price: product.sellingPrice });
  };

  const releaseTags = (tagIds) => {
    if (tagIds.length === 0) return;
    persist((prev) => ({
      ...prev,
      rfidTags: prev.rfidTags.map((t) => tagIds.includes(t.tagId) && t.status === "Reserved" ? { ...t, status: "Active", lastTransaction: null } : t),
    }));
  };

  const updateQty = (pid, delta) => {
    const c = cart.find((x) => x.productId === pid);
    if (!c) return;
    const stock = derived.productById[pid]?.currentStock || 0;
    const nextQty = clamp(c.qty + delta, 1, Math.max(stock, c.qty));
    if (nextQty === c.qty) return;
    if (nextQty < c.qty && c.tagIds.length > nextQty) {
      // quantity reduced below what was scanned — release the freed-up tag(s)
      const toRelease = c.tagIds.slice(nextQty);
      releaseTags(toRelease);
      setCart((prev) => prev.map((x) => x.productId === pid ? { ...x, qty: nextQty, tagIds: x.tagIds.slice(0, nextQty) } : x));
    } else {
      setCart((prev) => prev.map((x) => x.productId === pid ? { ...x, qty: nextQty } : x));
    }
  };

  const removeItem = (pid) => {
    const item = cart.find((c) => c.productId === pid);
    if (item) {
      releaseTags(item.tagIds);
      notify(`${item.name} removed from cart — inventory restored.`, "accent");
    }
    setCart((prev) => prev.filter((c) => c.productId !== pid));
  };

  const subtotal = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * ((state.settings.taxRate || 0) / 100));
  const total = taxable + tax;
  const cogs = cart.reduce((s, c) => s + c.qty * c.cost, 0);

  const checkout = async () => {
    if (cart.length === 0) { notify("Cart is empty.", "danger"); return; }
    const date = todayISO();
    const saleId = uid("sale");
    const invoiceNo = `SALE-${Math.floor(Math.random() * 9000 + 1000)}`;
    const items = cart.map((c) => ({ productId: c.productId, qty: c.qty, price: c.price, cost: c.cost }));

    await persist((prev) => {
      const stockMovements = [...prev.stockMovements];
      const rfidTags = [...prev.rfidTags];
      for (const c of cart) {
        stockMovements.push({ id: uid("mv"), productId: c.productId, type: "Sale", qty: -c.qty, date, refId: invoiceNo, note: "POS sale" });
        // reserved tags scanned for this sale are confirmed sold; fall back to
        // marking N available active tags for any items added without a scan
        let toMark = c.tagIds.slice(0, c.qty);
        if (toMark.length < c.qty) {
          const avail = rfidTags.filter((t) => t.productId === c.productId && t.status === "Active" && !toMark.includes(t.tagId));
          toMark = [...toMark, ...avail.slice(0, c.qty - toMark.length).map((t) => t.tagId)];
        }
        for (const tid of toMark) {
          const idx = rfidTags.findIndex((t) => t.tagId === tid);
          if (idx >= 0) rfidTags[idx] = { ...rfidTags[idx], status: "Sold", lastSeen: date, lastTransaction: invoiceNo };
        }
      }
      const customers = prev.customers.map((cu) => cu.id === customerId ? { ...cu, totalSpent: cu.totalSpent + total, purchaseCount: cu.purchaseCount + 1, lastPurchase: date } : cu);
      const sales = [...prev.sales, { id: saleId, invoiceNo, date, items, subtotal, discount, tax, total, cogs, paymentMode, customerId, staffId: role }];
      return { ...prev, stockMovements, rfidTags, sales, customers };
    });

    notify(`Sale ${invoiceNo} completed — ${inr(total)} via ${PAYMENT_MODES.find((p) => p.id === paymentMode)?.label}.`, "accent");
    setCart([]); setDiscount(0); setLastScan(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-[1200px]">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Card className="p-4">
          <div className="disp font-medium text-sm mb-2">Scan Product</div>
          <ScanCaptureInput onScan={handleScan} />
          {lastScan && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              {lastScan.ok ? <CheckCircle2 size={15} style={{ color: "var(--accent)" }} /> : <XCircle size={15} style={{ color: "var(--danger)" }} />}
              <span className="mono text-xs" style={{ color: "var(--ink-faint)" }}>{lastScan.tagId}</span>
              {lastScan.ok ? <span>Added <b>{lastScan.name}</b> · {inr(lastScan.price)}</span> : <span style={{ color: "var(--danger)" }}>Tag not recognized</span>}
            </div>
          )}
          <div className="text-xs mt-2" style={{ color: "var(--ink-faint)" }}>No reader handy? Try a demo tag below, or search manually.</div>
          <DemoTagPicker state={state} derived={derived} onPick={handleScan} />
        </Card>

        <Card className="p-4">
          <div className="disp font-medium text-sm mb-2">Search Product</div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-faint)" }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or SKU…" className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--line)" }} />
          </div>
          {results.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              {results.map((p) => (
                <button key={p.id} onClick={() => addToCart(p)} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-left" style={{ border: "1px solid var(--line-soft)" }}>
                  <span>{p.name} <span className="mono text-xs" style={{ color: "var(--ink-faint)" }}>· {p.sku}</span></span>
                  <span className="flex items-center gap-2">
                    <Badge tone={stockStatus(p.currentStock, p.minStock, p.maxStock).tone}>{p.currentStock} in stock</Badge>
                    <span className="font-medium">{inr(p.sellingPrice)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4 flex flex-col gap-3 h-fit lg:sticky lg:top-0">
        <div className="disp font-medium text-sm flex items-center justify-between">
          Cart <Badge tone="ink">{cart.reduce((s, c) => s + c.qty, 0)} items</Badge>
        </div>
        {cart.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Cart is empty" sub="Scan an RFID tag or search a product to begin." />
        ) : (
          <div className="flex flex-col gap-2">
            {cart.map((c) => (
              <div key={c.productId} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{inr(c.price)} × {c.qty}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => updateQty(c.productId, -1)} className="p-1 rounded-md" style={{ border: "1px solid var(--line)" }}><Minus size={12} /></button>
                  <span className="w-5 text-center">{c.qty}</span>
                  <button onClick={() => updateQty(c.productId, 1)} className="p-1 rounded-md" style={{ border: "1px solid var(--line)" }}><Plus size={12} /></button>
                  <button onClick={() => removeItem(c.productId)} className="p-1 rounded-md ml-1" style={{ color: "var(--danger)" }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-3 flex flex-col gap-2" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center justify-between text-sm"><span style={{ color: "var(--ink-soft)" }}>Subtotal</span><span>{inr(subtotal)}</span></div>
          <div className="flex items-center justify-between text-sm gap-2">
            <span style={{ color: "var(--ink-soft)" }}>Discount (₹)</span>
            <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} className="w-24 text-right px-2 py-1 rounded-md text-sm" style={{ border: "1px solid var(--line)" }} />
          </div>
          <div className="flex items-center justify-between text-sm"><span style={{ color: "var(--ink-soft)" }}>Tax ({state.settings.taxRate}%)</span><span>{inr(tax)}</span></div>
          <div className="flex items-center justify-between font-semibold disp text-base pt-1"><span>Total</span><span>{inr(total)}</span></div>
        </div>

        <SelectField label="Customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          {state.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectField>

        <div>
          <span className="text-xs font-medium" style={{ color: "var(--ink-soft)" }}>Payment Mode</span>
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            {PAYMENT_MODES.map((pm) => (
              <button key={pm.id} onClick={() => setPaymentMode(pm.id)} className="flex flex-col items-center gap-1 py-2 rounded-lg text-[11px]" style={{ border: paymentMode === pm.id ? "1.5px solid var(--primary)" : "1px solid var(--line)", background: paymentMode === pm.id ? "var(--surface-2)" : "transparent" }}>
                <pm.icon size={14} />
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        <Button variant="accent" size="lg" onClick={checkout} className="w-full mt-1">Complete Sale · {inr(total)}</Button>
      </Card>
    </div>
  );
}
