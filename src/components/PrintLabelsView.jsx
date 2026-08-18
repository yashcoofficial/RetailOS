import { Printer } from "lucide-react";
import { Button } from "./ui/Button.jsx";
import { BarcodeSvg } from "./BarcodeSvg.jsx";
import { inr } from "../lib/utils.js";

export function PrintLabelsView({ shopName, product, tags }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 no-print">
        <div className="text-sm" style={{ color: "var(--ink-soft)" }}>{tags.length} label(s) ready for {product.name}.</div>
        <Button icon={Printer} onClick={() => window.print()}>Print</Button>
      </div>
      <div className="no-print text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: "var(--info-soft)", color: "var(--info)" }}>
        Each label shows a Code128 barcode encoding the tag ID. Scan it with your barcode gun into any RetailOS scan box — POS, Receiving, RFID Scanner, or Audit — and it'll pull up this product's stock, price, and history automatically.
      </div>
      <div className="print-area grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tags.map((t) => (
          <div key={t.tagId} className="flex flex-col items-center gap-1 p-2" style={{ border: "1px dashed #999", borderRadius: 6, breakInside: "avoid" }}>
            <div className="text-[10px] font-medium text-center truncate w-full">{shopName}</div>
            <div className="text-xs font-semibold text-center truncate w-full">{product.name}</div>
            <div className="text-[10px] mono" style={{ color: "#555" }}>{product.sku}</div>
            <BarcodeSvg value={t.tagId} />
            <div className="text-[9px] mono" style={{ color: "#555" }}>{t.tagId}</div>
            <div className="text-xs font-semibold">{inr(product.sellingPrice)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
