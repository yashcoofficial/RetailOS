import { uid } from "./utils.js";

// No mock/demo business records. The only non-empty entry is a single system
// "Walk-in Customer" row, which POS needs to attach cash sales to when no
// named customer is selected — not a business record, just a default option.

export function buildInitialState() {
  return {
    createdAt: new Date().toISOString(),
    settings: { shopName: "Shehzan Enterprises", ownerName: "Shehzan", currency: "₹", taxRate: 12, role: "owner", deadStockDays: 30 },
    vendors: [],
    products: [],
    rfidTags: [],
    stockMovements: [],
    purchases: [],
    sales: [],
    expenses: [],
    customers: [
      { id: uid("cus"), name: "Walk-in Customer", phone: "", totalSpent: 0, purchaseCount: 0, lastPurchase: null, outstandingCredit: 0 },
    ],
    returns: [],
  };
}
