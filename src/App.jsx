import { useState, useEffect, useCallback, useRef } from "react";
import { Menu, ScanLine, Wifi } from "lucide-react";
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
import { buildInitialState } from "./lib/initialState.js";
import { saveState } from "./lib/storage.js";
import { NAV } from "./lib/constants.js";
import { uid } from "./lib/utils.js";
import {
  loadSharedState,
  getCurrentSession,
  initializeSharedState,
  saveSharedState,
  signOut,
  subscribeToSharedState,
} from "./lib/cloud.js";

const LEGACY_STORAGE_KEY = "retailos-shop-state-v1";

function initialCloudData() {
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) return JSON.parse(legacy);
  } catch (_error) {
    // If old browser data cannot be read, initialize an empty store.
  }
  return buildInitialState();
}

function hasBusinessData(data) {
  return ["products", "sales", "purchases", "expenses", "vendors"].some((key) => data?.[key]?.length > 0);
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [state, setState] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [cart, setCart] = useState([]);
  const [role, setRoleState] = useState(() => localStorage.getItem("retailos-view-role") || "owner");
  const stateRef = useRef(null);
  const revisionRef = useRef(0);
  const persistQueue = useRef(Promise.resolve());
  const authenticated = Boolean(session);

  const notify = useCallback((msg, tone = "accent") => {
    const id = uid("toast");
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    setLoadError("");
    try {
      const localData = initialCloudData();
      let snapshot = await loadSharedState();
      if (!snapshot) {
        snapshot = await initializeSharedState(localData);
      } else if (!hasBusinessData(snapshot.data) && hasBusinessData(localData)) {
        const migratedRevision = await saveSharedState(Number(snapshot.revision), localData);
        snapshot = migratedRevision === -1 ? await loadSharedState() : { data: localData, revision: migratedRevision };
      }
      await saveState(snapshot.data);
      setState(snapshot.data);
      stateRef.current = snapshot.data;
      revisionRef.current = Number(snapshot.revision);
    } catch (err) {
      setLoadError(err.message || "Could not load shared store data.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getCurrentSession()
      .then((current) => { if (active) setSession(current); })
      .catch(() => { if (active) setSession(null); })
      .finally(() => { if (active) setAuthReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setState(null);
      stateRef.current = null;
      return;
    }
    loadData();
  }, [authenticated, loadData]);

  useEffect(() => {
    if (!authenticated || !state) return undefined;
    return subscribeToSharedState((record) => {
      const incomingRevision = Number(record.revision);
      if (incomingRevision <= revisionRef.current) return;
      revisionRef.current = incomingRevision;
      stateRef.current = record.data;
      setState(record.data);
      saveState(record.data);
    }, (error) => notify(error.message || "Live sync is temporarily unavailable.", "danger"));
  }, [authenticated, Boolean(state), notify]);

  const persist = useCallback((updater) => {
    const commit = async () => {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const base = stateRef.current;
        const next = typeof updater === "function" ? updater(base) : updater;
        const nextRevision = await saveSharedState(revisionRef.current, next);
        if (nextRevision === -1) {
          const fresh = await loadSharedState();
          revisionRef.current = Number(fresh.revision);
          stateRef.current = fresh.data;
          setState(fresh.data);
          continue;
        }
        revisionRef.current = nextRevision;
        stateRef.current = next;
        setState(next);
        await saveState(next);
        return next;
      }
      throw new Error("Store data changed on another device. Please try again.");
    };
    const pending = persistQueue.current.then(commit, commit);
    persistQueue.current = pending.catch(() => undefined);
    return pending.catch((err) => {
      notify(err.message || "The change could not be saved.", "danger");
      throw err;
    });
  }, [notify]);

  const handleLogout = useCallback(async () => {
    await signOut();
    setSession(null);
    setPage("dashboard");
    setCart([]);
  }, []);

  const setRole = useCallback((nextRole) => {
    localStorage.setItem("retailos-view-role", nextRole);
    setRoleState(nextRole);
  }, []);

  const derived = useDerived(state);
  const visibleNav = NAV.filter((n) => n.roles.includes(role));

  useEffect(() => {
    if (!visibleNav.find((item) => item.id === page)) setPage("dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (!authReady) return <LoadingScreen label="Connecting securely…" />;
  if (!authenticated) return <LoginScreen onSuccess={(current) => setSession(current)} />;
  if (dataLoading) return <LoadingScreen label="Loading shared store data…" />;
  if (loadError) {
    return (
      <div className="rfos min-h-[700px] flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-md">
          <div className="font-semibold" style={{ color: "var(--danger)" }}>Could not open RetailOS</div>
          <div className="text-sm mt-2" style={{ color: "var(--ink-soft)" }}>{loadError}</div>
          <button className="text-sm font-medium mt-4" style={{ color: "var(--primary)" }} onClick={loadData}>Try again</button>
        </div>
      </div>
    );
  }
  if (!state || !derived) return <LoadingScreen label="Loading shared store data…" />;

  const pageProps = { state, derived, persist, notify, role, cart, setCart, userEmail: session.email, syncEnabled: true, onLogout: handleLogout };
  const adminProfile = { full_name: state.settings.ownerName || "Admin" };

  return (
    <div className="rfos min-h-[700px] flex" style={{ background: "var(--bg)", fontSize: 14 }}>
      <Toast toasts={toasts} />
      <aside className="hidden md:flex flex-col w-[224px] shrink-0 border-r" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
        <SidebarContent nav={visibleNav} page={page} setPage={setPage} state={state} role={role} profile={adminProfile} />
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0" style={{ background: "rgba(20,22,30,0.45)" }} onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[240px] flex flex-col" style={{ background: "var(--surface)" }}>
            <SidebarContent nav={visibleNav} page={page} setPage={(p) => { setPage(p); setMobileNavOpen(false); }} state={state} role={role} profile={adminProfile} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b shrink-0" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden p-1.5 rounded-md" style={{ border: "1px solid var(--line)" }} onClick={() => setMobileNavOpen(true)}><Menu size={18} /></button>
            <div className="disp font-semibold text-[15px] truncate">{NAV.find((n) => n.id === page)?.label}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--accent)" }}><Wifi size={14} /> Live sync</div>
            <RoleSwitcher role={role} setRole={setRole} ownerName={state.settings.ownerName} />
          </div>
        </header>

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

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around border-t px-1 py-1.5" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
          {visibleNav.slice(0, 5).map((n) => {
            const Icon = n.icon;
            const active = page === n.id;
            return <button key={n.id} onClick={() => setPage(n.id)} className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg" style={{ color: active ? "var(--primary)" : "var(--ink-faint)" }}><Icon size={19} /><span className="text-[10px] font-medium">{n.label.split(" ")[0]}</span></button>;
          })}
        </nav>
      </div>
    </div>
  );
}

function LoadingScreen({ label }) {
  return (
    <div className="rfos min-h-[700px] flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 rounded-2xl" style={{ background: "var(--primary)" }}><ScanLine className="animate-pulse" size={26} color="#fff" /></div>
        <div className="text-sm" style={{ color: "var(--ink-soft)" }}>{label}</div>
      </div>
    </div>
  );
}
