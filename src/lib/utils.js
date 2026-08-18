export const uid = (p = "id") =>
  `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

export const rfidTag = () =>
  "E28" +
  Array.from({ length: 12 }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");

export const inr = (n) =>
  `₹${(Math.round((n || 0) * 100) / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const inr2 = (n) =>
  `₹${(Math.round((n || 0) * 100) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const pct = (n) => `${(Math.round((n || 0) * 10) / 10).toFixed(1)}%`;

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const daysAgoISO = (d) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
