import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

export function BarcodeSvg({ value, width = 180, height = 55 }) {
  const svgRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128", displayValue: false, margin: 0, width: 1.6, height: height - 10,
        });
        setFailed(false);
      } catch (e) {
        setFailed(true);
      }
    }
  }, [value, height]);

  if (failed) {
    return <div className="text-[9px] text-center px-1" style={{ color: "var(--danger)" }}>Barcode failed to render</div>;
  }
  return <svg ref={svgRef} style={{ width, height, maxWidth: "100%" }} />;
}
