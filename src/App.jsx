import { useState, useEffect, useCallback } from "react";
import { Menu, ScanLine } from "lucide-react";
import { Toast } from "./components/ui/Toast.jsx";
import { SidebarContent } from "./components/Sidebar.jsx";
import { RoleSwitcher } from "./components/RoleSwitcher.jsx";
import { LoginScreen } from "./components/LoginScreen.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { POS } from "./pages/POS.jsx";
import { RfidScannerPage } from "./pages/RfidScanner.jsx";
import { Inventory } from "./pages/Inventory.jsx";
import { Products } from "./pages/Products.jsx";
import { Purchases } from "./pages/Purchases.jsx";
import { SalesPage } from "./pages/Sales.jsx";
import { Vendors } from "./pages/Vendors.jsx";
import { Expenses } from "./pages/Expenses.jsx";
import { Reports } from "./pages/Reports.jsx";
import { PnL } from "./pages/PnL.jsx";
import { SettingsPage } from "./pages/Settings.jsx";
import { useDerived } from "./hooks/useDerived.js";
import { loadState, saveState } from "./lib/storage.js";
import { buildInitialState } from "./lib/initialState.js";
import { NAV } from "./lib/constants.js";
import { uid } from "./lib/utils.js";
import { isAuthed, setAuthed } from "./lib/auth.js";

export default function App() {
  const [authed, setAuthedState] = useState(isAuthed());
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [cart, setCart] = useState([]); // POS cart lives outside persisted state

  const notify = useCallback((msg, tone = "accent") => {
    const id = uid("toast");
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  useEffect(() => {
    (async () => {
      let s = await loadState();
      if (!s) {
        s = buildInitialState();
        await saveState(s);
      }
      setState(s);
      setLoading(false);
    })();
  }, []);

  const persist = useCallback(async (updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveState(next);
      return next;
    });
  }, []);

  const derived = useDerived(state);
  const role = state?.settings?.role || "owner";
  const visibleNav = NAV.filter((n) => n.roles.includes(role));

  useEffect(() => {
    if (!loading && !visibleNav.find((n) => n.id === page)) setPage("dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, loading]);

  const handleLogin = () => {
    setAuthed(true);
    setAuthedState(true);
  };
  const handleLogout = () => {
    setAuthed(false);
    setAuthedState(false);
  };

  if (!authed) {
    return <LoginScreen onSuccess={handleLogin} />;
  }

  if (loading || !state || !derived) {
    return (
      <div className="rfos min-h-[600px] flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-2xl" style={{ background: "var(--primary)" }}>
            <ScanLine className="animate-pulse" size={26} color="#fff" />
          </div>
          <div className="text-sm" style={{ color: "var(--ink-soft)" }}>Loading store data…</div>
        </div>
      </div>
    );
  }

  const pageProps = { state, derived, persist, notify, role, cart, setCart, onLogout: handleLogout };

  return (
    <div className="rfos min-h-[700px] flex" style={{ background: "var(--bg)", fontSize: 14 }}>
      <Toast toasts={toasts} />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[224px] shrink-0 border-r" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
        <SidebarContent nav={visibleNav} page={page} setPage={setPage} state={state} role={role} />
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0" style={{ background: "rgba(20,22,30,0.45)" }} onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[240px] flex flex-col" style={{ background: "var(--surface)" }}>
            <SidebarContent nav={visibleNav} page={page} setPage={(p) => { setPage(p); setMobileNavOpen(false); }} state={state} role={role} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b shrink-0" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden p-1.5 rounded-md" style={{ border: "1px solid var(--line)" }} onClick={() => setMobileNavOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="disp font-semibold text-[15px] truncate">{NAV.find((n) => n.id === page)?.label}</div>
          </div>
          <div className="flex items-center gap-3">
            <RoleSwitcher state={state} persist={persist} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6">
          {page === "dashboard" && <Dashboard {...pageProps} setPage={setPage} />}
          {page === "pos" && <POS {...pageProps} />}
          {page === "rfid" && <RfidScannerPage {...pageProps} />}
          {page === "inventory" && <Inventory {...pageProps} />}
          {page === "products" && <Products {...pageProps} />}
          {page === "purchases" && role === "owner" && <Purchases {...pageProps} />}
          {page === "sales" && <SalesPage {...pageProps} />}
          {page === "vendors" && role === "owner" && <Vendors {...pageProps} />}
          {page === "expenses" && role === "owner" && <Expenses {...pageProps} />}
          {page === "reports" && role === "owner" && <Reports {...pageProps} />}
          {page === "pnl" && role === "owner" && <PnL {...pageProps} />}
          {page === "settings" && <SettingsPage {...pageProps} />}
        </main>

        {/* Bottom nav (mobile) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around border-t px-1 py-1.5" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
          {visibleNav.slice(0, 5).map((n) => {
            const Icon = n.icon;
            const active = page === n.id;
            return (
              <button key={n.id} onClick={() => setPage(n.id)} className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg" style={{ color: active ? "var(--primary)" : "var(--ink-faint)" }}>
                <Icon size={19} />
                <span className="text-[10px] font-medium">{n.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
