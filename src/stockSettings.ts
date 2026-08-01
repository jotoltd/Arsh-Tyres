const STORAGE_KEY = 'arsh_stock_management_enabled';

export function isStockManagementEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setStockManagementEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

export function getEffectiveStock(tyre: { stock: number }): number {
  if (isStockManagementEnabled()) return tyre.stock;
  return 999;
}
