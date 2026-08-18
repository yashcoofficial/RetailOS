import { useMemo } from "react";
import { computeStockMap } from "../lib/domain.js";

export function useDerived(state) {
  return useMemo(() => {
    if (!state) return null;
    const stockMap = computeStockMap(state.stockMovements);
    const productsWithStock = state.products.map((p) => ({
      ...p,
      currentStock: stockMap[p.id] || 0,
      profitPerUnit: p.sellingPrice - p.purchasePrice,
      marginPct: p.sellingPrice ? ((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100 : 0,
      costValue: (stockMap[p.id] || 0) * p.purchasePrice,
      salesValue: (stockMap[p.id] || 0) * p.sellingPrice,
    }));
    const productById = Object.fromEntries(productsWithStock.map((p) => [p.id, p]));
    const vendorById = Object.fromEntries(state.vendors.map((v) => [v.id, v]));

    const totalStockUnits = productsWithStock.reduce((s, p) => s + p.currentStock, 0);
    const totalCostValue = productsWithStock.reduce((s, p) => s + p.costValue, 0);
    const totalSalesValue = productsWithStock.reduce((s, p) => s + p.salesValue, 0);
    const lowStock = productsWithStock.filter((p) => p.currentStock > 0 && p.currentStock < p.minStock);
    const outOfStock = productsWithStock.filter((p) => p.currentStock <= 0);
    const overstock = productsWithStock.filter((p) => p.maxStock && p.currentStock > p.maxStock);

    return {
      stockMap, productsWithStock, productById, vendorById,
      totalStockUnits, totalCostValue, totalSalesValue,
      lowStock, outOfStock, overstock,
    };
  }, [state]);
}
