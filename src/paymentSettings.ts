export type StripeMode = 'test' | 'live';

let currentMode: StripeMode = 'test';

export function getStripeMode(): StripeMode {
  return currentMode;
}

export function setStripeMode(mode: StripeMode) {
  currentMode = mode;
  window.dispatchEvent(new Event('stripe-mode-changed'));
}

export function getStripePublishableKey(): string {
  const mode = getStripeMode();
  if (mode === 'live') {
    return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_LIVE || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  }
  return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY_TEST || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
}
