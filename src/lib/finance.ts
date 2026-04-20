import { Transaction, Asset, AssetType } from '../types';

export function calculateAveragePrice(currentAsset: Asset | undefined, newTransaction: Transaction): number {
  if (!currentAsset) return newTransaction.unitPrice;
  
  if (newTransaction.type === 'COMPRA') {
    const totalQuantity = currentAsset.quantity + newTransaction.quantity;
    const totalCost = (currentAsset.quantity * currentAsset.averagePrice) + (newTransaction.quantity * newTransaction.unitPrice) + newTransaction.costs;
    return totalCost / totalQuantity;
  }
  
  return currentAsset.averagePrice; // Selling doesn't change average price (cost basis)
}

export interface MonthlyTaxResult {
  month: number;
  year: number;
  profit: number;
  tax: number;
  assetType: 'DAY_TRADE' | 'SWING_TRADE' | 'RENDA_FIXA' | 'OUTROS';
}

export function processMonthlyTaxes(transactions: Transaction[], assets: Asset[]): MonthlyTaxResult[] {
  const results: MonthlyTaxResult[] = [];
  const grouped = transactions.reduce((acc, tx) => {
    const date = new Date(tx.date);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  for (const [key, txl] of Object.entries(grouped)) {
    const [year, month] = key.split('-').map(Number);
    
    // Separate by Trade Type
    const swingTrades = txl.filter(t => !t.isDayTrade && t.type === 'VENDA');
    const dayTrades = txl.filter(t => t.isDayTrade && t.type === 'VENDA');

    // Swing Trade Logic
    if (swingTrades.length > 0) {
      let swingProfit = 0;
      let totalSales = 0;
      
      for (const st of swingTrades) {
        const asset = assets.find(a => a.id === st.assetId);
        if (asset) {
          swingProfit += st.totalValue - (st.quantity * asset.averagePrice) - st.costs;
          totalSales += st.totalValue;
        }
      }

      // Check 20k exemption for Stocks (Simplified for now)
      const tax = (totalSales > 20000 && swingProfit > 0) ? swingProfit * 0.15 : 0;
      
      if (tax > 0) {
        results.push({
          month, year, profit: swingProfit, tax, assetType: 'SWING_TRADE'
        });
      }
    }

    // Day Trade Logic
    if (dayTrades.length > 0) {
      let dayProfit = 0;
      for (const dt of dayTrades) {
        const asset = assets.find(a => a.id === dt.assetId);
        if (asset) {
          dayProfit += dt.totalValue - (dt.quantity * asset.averagePrice) - dt.costs;
        }
      }

      if (dayProfit > 0) {
        results.push({
          month, year, profit: dayProfit, tax: dayProfit * 0.20, assetType: 'DAY_TRADE'
        });
      }
    }
  }

  return results;
}

export function getDARFCode(type: 'DAY_TRADE' | 'SWING_TRADE' | 'RENDA_FIXA' | 'OUTROS'): string {
  if (type === 'RENDA_FIXA') return '0213';
  return '6015';
}
