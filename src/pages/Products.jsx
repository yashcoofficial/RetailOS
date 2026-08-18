import { useState } from "react";
import { Search, Plus, Edit3, Trash2, Package, PackagePlus, Copy, Printer } from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { TextField } from "../components/ui/Fields.jsx";
import { MiniStat } from "../components/ui/Misc.jsx";
import { StockMovementHistory } from "../components/StockMovementHistory.jsx";
import { PrintLabelsView } from "../components/PrintLabelsView.jsx";
import { stockStatus } from "../lib/domain.js";
import { uid, rfidTag, todayISO, inr, pct, fmtDate } from "../lib/utils.js";

export function Products({ state, derived, persist, notify, role }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [q, setQ] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [addStockFor, setAddStockFor] = useState(null);
  const [generatedTags, setGeneratedTags] = useState(null); // { product, tags: [...] }
  const [printLabelsFor, setPrintLabelsFor] = useState(null); // { product, tags: [...] }

  const rows = derived.productsWithStock.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()));

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setShowModal(true); };

  // Generates `qty` fresh RFID tags for a product and records the matching
  // stock movement, so the ledger and the RFID Scanner lookup both reflect
  // the owner's manual stock entry immediately.
  const generateStock = async (productId, sku, qty, movementType, refId) => {
    const date = todayISO();
    const newTags = Array.from({ length: qty }, () => ({
      tagId: rfidTag(), productId, sku, status: "Active",
      assignedDate: date, lastSeen: date, lastTransaction: null, location: "Store Floor",
    }));
    await persist((prev) => ({
      ...prev,
      rfidTags: [...prev.rfidTags, ...newTags],
      stockMovements: [...prev.stockMovements, { id: uid("mv"), productId, type: movementType, qty, date, refId, note: `${qty} unit(s) entered manually by owner` }],
    }));
    return newTags;
  };

  const saveProduct = async (form) => {
    const isNew = !editing;
    const pid = editing?.id || uid("prod");
    const stockQty = Math.max(0, Number(form.stockQty) || 0);
    const { stockQty: _drop, ...productFields } = form;

    await persist((prev) => {
      let products;
      if (isNew) {
        products = [...prev.products, { ...productFields, id: pid, createdDate: todayISO(), status: "Active" }];
      } else {
        products = prev.products.map((p) => p.id === pid ? { ...p, ...productFields } : p);
      }
      return { ...prev, products };
    });

    if (isNew && stockQty > 0) {
      const tags = await generateStock(pid, productFields.sku, stockQty, "Opening Stock", "OPEN");
      notify(`Product added — ${stockQty} tag(s) generated.`, "accent");
      setGeneratedTags({ product: { name: productFields.name, sku: productFields.sku, sellingPrice: productFields.sellingPrice }, tags });
    } else {
      notify(isNew ? "Product added." : "Product updated.", "accent");
    }
    setShowModal(false);
  };

  const addStock = async (product, qty) => {
    if (qty <= 0) { notify("Enter a quantity greater than 0.", "danger"); return; }
    const tags = await generateStock(product.id, product.sku, qty, "Manual Stock Addition", "MANUAL");
    notify(`${qty} unit(s) added — ${qty} tag(s) generated.`, "accent");
    setAddStockFor(null);
    setGeneratedTags({ product: { name: product.name, sku: product.sku, sellingPrice: product.sellingPrice }, tags });
  };

  const deleteProduct = async (p) => {
    await persist((prev) => ({
      ...prev,
      products: prev.products.filter((x) => x.id !== p.id),
      // any RFID tags still on the shelf for this product are released; sold tags stay as historical record
      rfidTags: prev.rfidTags.filter((t) => !(t.productId === p.id && t.status === "Active")),
    }));
    notify(`${p.name} deleted.`, "accent");
    setConfirmDelete(null);
    if (detail?.id === p.id) setDetail(null);
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-faint)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--line)" }} />
        </div>
        {role === "owner" && <Button icon={Plus} onClick={openNew}>Add Product</Button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((p) => (
          <Card key={p.id} className="p-4 flex flex-col gap-2 cursor-pointer hover:shadow-sm" onClick={() => setDetail(p)}>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="mono text-xs" style={{ color: "var(--ink-faint)" }}>{p.sku}</div>
              </div>
              <Badge tone={stockStatus(p.currentStock, p.minStock, p.maxStock).tone}>{p.currentStock} in stock</Badge>
            </div>
            <div className="flex items-center justify-between text-sm pt-1 border-t" style={{ borderColor: "var(--line-soft)" }}>
              <span>{inr(p.sellingPrice)}</span>
              {role === "owner" && <span style={{ color: "var(--accent)" }}>+{inr(p.profitPerUnit)} ({pct(p.marginPct)})</span>}
            </div>
            {role === "owner" && (
              <div className="flex flex-col gap-1.5">
                <Button variant="soft" size="sm" icon={PackagePlus} onClick={(e) => { e.stopPropagation(); setAddStockFor(p); }} className="w-full">Add Stock</Button>
                <div className="flex gap-2">
                  <Button variant="soft" size="sm" icon={Edit3} onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="flex-1">Edit</Button>
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }} style={{ color: "var(--danger)", border: "1px solid var(--danger)" }}>Delete</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
        {rows.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState icon={Package} title="No products yet" sub="Add your first product to start building inventory." action={role === "owner" ? <Button icon={Plus} onClick={openNew}>Add Product</Button> : null} />
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Product" : "Add Product"}>
        <ProductForm state={state} initial={editing} onSave={saveProduct} />
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} width={680}>
        {detail && (
          <ProductDetail
            state={state}
            derived={derived}
            product={detail}
            role={role}
            onAddStock={() => { setAddStockFor(detail); setDetail(null); }}
            onPrintLabels={() => {
              const activeTags = state.rfidTags.filter((t) => t.productId === detail.id && t.status === "Active");
              if (activeTags.length === 0) { notify("No active tags to print for this product yet.", "danger"); return; }
              setPrintLabelsFor({ product: detail, tags: activeTags });
              setDetail(null);
            }}
          />
        )}
      </Modal>

      <Modal open={!!addStockFor} onClose={() => setAddStockFor(null)} title={`Add Stock — ${addStockFor?.name || ""}`} width={420}>
        {addStockFor && <AddStockForm product={addStockFor} onSave={(qty) => addStock(addStockFor, qty)} />}
      </Modal>

      <Modal open={!!generatedTags} onClose={() => setGeneratedTags(null)} title="Tags Generated" width={480}>
        {generatedTags && (
          <GeneratedTagsView
            data={{ productName: generatedTags.product.name, tags: generatedTags.tags }}
            notify={notify}
            onPrint={() => { setPrintLabelsFor(generatedTags); setGeneratedTags(null); }}
          />
        )}
      </Modal>

      <Modal open={!!printLabelsFor} onClose={() => setPrintLabelsFor(null)} title={`Print Labels — ${printLabelsFor?.product?.name || ""}`} width={720}>
        {printLabelsFor && <PrintLabelsView shopName={state.settings.shopName} product={printLabelsFor.product} tags={printLabelsFor.tags} />}
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Product" width={420}>
        {confirmDelete && (
          <div className="flex flex-col gap-3">
            <div className="text-sm">
              Delete <b>{confirmDelete.name}</b>? {confirmDelete.currentStock > 0 && (
                <span>This product currently has <b>{confirmDelete.currentStock} unit(s)</b> in stock — deleting it will remove those RFID tags from active inventory.</span>
              )}
              {confirmDelete.currentStock <= 0 && "This can't be undone."}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => deleteProduct(confirmDelete)}>Delete Product</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ProductForm({ state, initial, onSave }) {
  const [form, setForm] = useState(initial ? {
    name: initial.name, sku: initial.sku, purchasePrice: initial.purchasePrice, sellingPrice: initial.sellingPrice,
    minStock: initial.minStock, maxStock: initial.maxStock, reorderQty: initial.reorderQty,
  } : {
    name: "", sku: `SKU-${1000 + state.products.length}`,
    purchasePrice: 0, sellingPrice: 0, minStock: 5, maxStock: 50, reorderQty: 20, stockQty: 0,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const profit = (form.sellingPrice || 0) - (form.purchasePrice || 0);
  const margin = form.sellingPrice ? (profit / form.sellingPrice) * 100 : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Product Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <TextField label="SKU" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
        <TextField label="Purchase Price (₹)" type="number" value={form.purchasePrice} onChange={(e) => set("purchasePrice", Number(e.target.value))} />
        <TextField label="Selling Price (₹)" type="number" value={form.sellingPrice} onChange={(e) => set("sellingPrice", Number(e.target.value))} />
        <TextField label="Minimum Quantity" type="number" value={form.minStock} onChange={(e) => set("minStock", Number(e.target.value))} />
        <TextField label="Maximum Quantity" type="number" value={form.maxStock} onChange={(e) => set("maxStock", Number(e.target.value))} />
        <TextField label="Reorder Quantity" type="number" value={form.reorderQty} onChange={(e) => set("reorderQty", Number(e.target.value))} />
        {!initial && <TextField label="Stock Quantity" type="number" value={form.stockQty} onChange={(e) => set("stockQty", Number(e.target.value))} />}
      </div>
      <div className="flex items-center justify-between px-3 py-2 rounded-lg text-sm" style={{ background: "var(--accent-soft)" }}>
        <span>Profit per unit: <b>{inr(profit)}</b></span>
        <span>Margin: <b>{pct(margin)}</b></span>
      </div>
      {!initial && (
        <div className="text-xs" style={{ color: "var(--ink-faint)" }}>
          {form.stockQty > 0
            ? `${form.stockQty} RFID tag(s) will be generated automatically — you'll get the tag IDs to program onto physical tags so your RFID gun can scan and identify them.`
            : "Leave Stock Quantity at 0 to start empty, or enter a count to generate that many RFID tags now."}
        </div>
      )}
      <Button onClick={() => onSave(form)} className="w-full mt-1">Save Product</Button>
    </div>
  );
}

function AddStockForm({ product, onSave }) {
  const [qty, setQty] = useState(product.reorderQty || 10);
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm" style={{ color: "var(--ink-soft)" }}>
        Currently <b>{product.currentStock}</b> unit(s) in stock. Enter how many you're adding — the system will generate one RFID tag per unit.
      </div>
      <TextField label="Quantity to Add" type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
      <Button onClick={() => onSave(qty)} className="w-full">Generate RFID Tags & Add Stock</Button>
    </div>
  );
}

function GeneratedTagsView({ data, notify, onPrint }) {
  const copyAll = async () => {
    const text = data.tags.map((t) => t.tagId).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      notify("Tag IDs copied to clipboard.", "accent");
    } catch (e) {
      notify("Couldn't copy automatically — select and copy manually.", "danger");
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm">
        <b>{data.tags.length}</b> tag(s) generated for <b>{data.productName}</b>. If you're using real RFID hardware, program these IDs onto blank tags with your encoder. If you're using a barcode/QR gun instead, print them as labels below and stick them straight on the product.
      </div>
      <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
        {data.tags.map((t) => (
          <div key={t.tagId} className="mono text-xs px-2 py-1.5 rounded-md" style={{ background: "var(--surface-2)" }}>{t.tagId}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="soft" icon={Copy} onClick={copyAll} className="flex-1">Copy All Tag IDs</Button>
        <Button variant="soft" icon={Printer} onClick={onPrint} className="flex-1">Print Labels</Button>
      </div>
    </div>
  );
}

function ProductDetail({ state, derived, product, role, onAddStock, onPrintLabels }) {
  const p = derived.productById[product.id] || product;
  const sales = state.sales.filter((s) => s.items.some((it) => it.productId === p.id));
  const unitsSold = sales.reduce((s, sale) => s + sale.items.filter((it) => it.productId === p.id).reduce((a, it) => a + it.qty, 0), 0);
  const revenue = sales.reduce((s, sale) => s + sale.items.filter((it) => it.productId === p.id).reduce((a, it) => a + it.qty * it.price, 0), 0);
  const profit = sales.reduce((s, sale) => s + sale.items.filter((it) => it.productId === p.id).reduce((a, it) => a + it.qty * (it.price - it.cost), 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Current Stock" value={p.currentStock} />
        {role === "owner" && <MiniStat label="Purchase Price" value={inr(p.purchasePrice)} />}
        <MiniStat label="Selling Price" value={inr(p.sellingPrice)} />
        {role === "owner" && <MiniStat label="Profit / Unit" value={inr(p.profitPerUnit)} tone="accent" />}
        {role === "owner" && <MiniStat label="Margin" value={pct(p.marginPct)} />}
        <MiniStat label="Units Sold" value={unitsSold} />
        <MiniStat label="Total Revenue" value={inr(revenue)} />
        {role === "owner" && <MiniStat label="Total Profit" value={inr(profit)} tone="accent" />}
      </div>
      {role === "owner" && (
        <div className="flex gap-2">
          <Button variant="soft" icon={PackagePlus} onClick={onAddStock} className="flex-1">Add Stock</Button>
          <Button variant="soft" icon={Printer} onClick={onPrintLabels} className="flex-1">Print Labels</Button>
        </div>
      )}
      <StockMovementHistory state={state} productId={p.id} />
      <div>
        <div className="text-xs font-semibold mb-1.5" style={{ color: "var(--ink-soft)" }}>Recent Sales</div>
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
          {sales.slice(-6).reverse().map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md" style={{ background: "var(--surface-2)" }}>
              <span>{s.invoiceNo} · {fmtDate(s.date)}</span>
              <span>{inr(s.items.find((it) => it.productId === p.id)?.price)}</span>
            </div>
          ))}
          {sales.length === 0 && <div className="text-xs" style={{ color: "var(--ink-faint)" }}>No sales yet.</div>}
        </div>
      </div>
    </div>
  );
}
