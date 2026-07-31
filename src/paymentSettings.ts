export type StripeMode = 'test' | 'live';

const STORAGE_KEY = 'stripe_mode';

export function getStripeMode(): StripeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'live' ? 'live' : 'test';
}

export function setStripeMode(mode: StripeMode) {
  localStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(new Event('stripe-mode-changed'));
}

export function getStripePublishableKey(): string {
  const mode = getStripeMode();
  if (mode === 'live') {
    return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_LIVE || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  }
  return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
}
