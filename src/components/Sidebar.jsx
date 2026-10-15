import { ScanLine, User } from "lucide-react";
import { Badge } from "./ui/Badge.jsx";

export function SidebarContent({ nav, page, setPage, state, role, profile }) {
  return (
    <>
      <div className="flex items-center gap-2 px-4 h-14 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
          <ScanLine size={16} color="#fff" />
        </div>
        <div className="disp font-semibold text-[15px] truncate">{state.settings.shopName}</div>
      </div>
      <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = page === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left"
              style={{
                background: active ? "var(--primary)" : "transparent",
                color: active ? "#fff" : "var(--ink-soft)",
              }}
            >
              <Icon size={16} />
              {n.label}
            </button>
          );
        })}
      </div>
      <div className="p-3 border-t text-xs flex items-center gap-2" style={{ borderColor: "var(--line)", color: "var(--ink-faint)" }}>
        <User size={13} /> Signed in as <Badge tone={role === "owner" ? "accent" : "info"}>{profile?.full_name || (role === "owner" ? "Owner" : "Retailer")}</Badge>
      </div>
    </>
  );
}
