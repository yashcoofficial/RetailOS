import { X } from "lucide-react";

export function Modal({ open, onClose, title, children, width = 560 }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(20,22,30,0.45)" }} onClick={onClose}>
      <div
        className="slidein card w-full max-h-[88vh] overflow-y-auto p-5"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="disp text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
