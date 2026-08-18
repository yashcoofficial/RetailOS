import {
  LayoutDashboard, ShoppingCart, Radio, Package, Boxes, Truck, Receipt,
  Wallet, BarChart3, Settings as SettingsIcon, Building2, TrendingUp,
  CreditCard, Banknote, Smartphone, Landmark, Clock,
} from "lucide-react";

export const PAYMENT_MODES = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "bank", label: "Bank Transfer", icon: Landmark },
  { id: "credit", label: "Credit", icon: Clock },
];

export const EXPENSE_CATEGORIES = [
  "Rent", "Electricity", "Salaries", "Marketing", "Packaging",
  "Transport", "Repairs", "Software", "Internet", "Maintenance", "Miscellaneous",
];

export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["owner", "staff"] },
  { id: "pos", label: "POS / New Sale", icon: ShoppingCart, roles: ["owner", "staff"] },
  { id: "rfid", label: "RFID Scanner", icon: Radio, roles: ["owner", "staff"] },
  { id: "inventory", label: "Inventory", icon: Boxes, roles: ["owner", "staff"] },
  { id: "products", label: "Products", icon: Package, roles: ["owner", "staff"] },
  { id: "purchases", label: "Purchases", icon: Truck, roles: ["owner"] },
  { id: "sales", label: "Sales", icon: Receipt, roles: ["owner", "staff"] },
  { id: "vendors", label: "Vendors", icon: Building2, roles: ["owner"] },
  { id: "expenses", label: "Expenses", icon: Wallet, roles: ["owner"] },
  { id: "reports", label: "Reports", icon: BarChart3, roles: ["owner"] },
  { id: "pnl", label: "Profit & Loss", icon: TrendingUp, roles: ["owner"] },
  { id: "settings", label: "Settings", icon: SettingsIcon, roles: ["owner", "staff"] },
];
