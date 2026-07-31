import { Tyre, TyreCategory } from './types';

// ARSH Tyres real inventory.
// All prices are per tyre and include fitting, wheel balancing and a new valve.
// Row format: [width, profile, rim, pricePerTyre, pricePerTyreWhenBuying4?]
type Row = [number, number, number, number, number?];

const g = (rim: number, price: number, price4: number | undefined, sizes: [number, number][]): Row[] =>
  sizes.map(([w, p]) => [w, p, rim, price, price4]);

const STANDARD: Row[] = [
  // 14" - £40 each / £37.50 each when buying 4
  ...g(14, 40, 37.5, [[155, 65], [165, 60], [165, 65], [165, 70], [175, 60], [175, 65], [175, 70], [175, 80], [185, 60], [185, 65], [185, 70]]),
  // 15" - £50 each / £45 each when buying 4 (£180 for 4)
  ...g(15, 50, 45, [[145, 65], [155, 60], [165, 55], [165, 60], [165, 65], [175, 55], [175, 60], [175, 65], [185, 55], [185, 60], [185, 65], [195, 45], [195, 50], [195, 55], [195, 60], [195, 65], [205, 60], [205, 65], [205, 70], [215, 60], [215, 65]]),
  // 16" - £60 each / £55 each when buying 4 (£220 for 4)
  ...g(16, 60, 55, [[185, 50], [185, 55], [195, 45], [195, 50], [195, 55], [205, 45], [205, 50], [205, 60], [215, 45], [215, 50], [215, 55], [215, 60], [215, 65]]),
  // 16" - £50 each / £45 each when buying 4 (£180 for 4)
  ...g(16, 50, 45, [[205, 55]]),
  // 16" - £70 each / £65 each when buying 4 (£260 for 4)
  ...g(16, 70, 65, [[175, 60], [185, 60], [195, 60], [205, 65], [215, 70], [225, 50], [225, 55], [235, 60]]),
  // 17" - individually priced
  [195, 45, 17, 70, 65],
  [205, 40, 17, 60, 55],
  [205, 45, 17, 65, 60],
  [205, 50, 17, 65, 60],
  [205, 55, 17, 65, 60],
  [215, 40, 17, 60, 55],
  [215, 45, 17, 60, 55],
  [215, 50, 17, 65, 60],
  [215, 55, 17, 65, 60],
  [215, 60, 17, 65, 60],
  [215, 65, 17, 75, 70],
  [225, 45, 17, 60, 55],
  [225, 50, 17, 65, 60],
  [225, 55, 17, 65, 60],
  [225, 60, 17, 70, 65],
  [225, 65, 17, 70, 65],
  [235, 45, 17, 65, 60],
  [235, 50, 17, 65, 60],
  [235, 55, 17, 65, 60],
  [235, 60, 17, 75, 70],
  [235, 65, 17, 75, 70],
  [245, 65, 17, 80, 75],
  [255, 60, 17, 80, 75],
  [255, 65, 17, 80, 75],
  // 18" - £75 each / £70 each when buying 4
  ...g(18, 75, 70, [[215, 40], [215, 45], [215, 50], [215, 55], [225, 35], [225, 45], [225, 50], [225, 55], [225, 60], [235, 40], [235, 45], [235, 50], [235, 55], [235, 60], [245, 35], [245, 40], [245, 45], [255, 35], [265, 35]]),
  [225, 40, 18, 60, 55],
  [235, 65, 18, 95, 90],
  // 18" - £80 each / £75 each when buying 4
  ...g(18, 80, 75, [[245, 50], [255, 40], [255, 45], [255, 55], [265, 60], [275, 40]]),
  // 19" - £80 each / £75 each when buying 4
  ...g(19, 80, 75, [[205, 55], [225, 35], [225, 40], [225, 45], [235, 35], [235, 40], [235, 45], [245, 35], [245, 40], [245, 45], [255, 35]]),
  // 19" - £85 each / £80 each when buying 4
  ...g(19, 85, 80, [[225, 55], [235, 50], [235, 55], [245, 50], [255, 30], [255, 40], [255, 45], [255, 50], [255, 55], [265, 30], [275, 35], [275, 40], [275, 45]]),
  // 19" - £120 each / £115 each when buying 4
  ...g(19, 120, 115, [[265, 35], [285, 30], [285, 40]]),
  // 20" - £120 each
  ...g(20, 120, undefined, [[195, 55], [215, 45], [225, 35], [225, 40], [235, 30], [235, 35], [235, 45], [245, 35], [245, 40], [245, 45], [255, 35], [255, 40], [255, 45], [265, 40], [265, 45], [275, 30], [275, 35], [275, 40], [275, 45]]),
  // 20" - £150 each
  ...g(20, 150, undefined, [[235, 50], [235, 55], [245, 50], [255, 50], [255, 55], [265, 30], [265, 35], [265, 50], [275, 50], [275, 55], [285, 30], [285, 35], [285, 40], [285, 45], [285, 50], [295, 35], [295, 40], [315, 35]]),
  // 21" - £150 each
  ...g(21, 150, undefined, [[235, 45], [245, 35], [245, 40], [255, 35], [255, 40], [265, 40], [265, 45], [275, 30], [275, 35], [275, 45], [275, 50], [285, 30], [285, 35], [285, 40], [295, 35], [295, 40], [315, 35], [315, 40]]),
  // 22" - £150 each
  ...g(22, 150, undefined, [[255, 35], [265, 35], [265, 40], [275, 35], [275, 40], [285, 35], [285, 40], [285, 45], [315, 30], [325, 35]]),
];

// Runflat tyres - priced per tyre (no multi-buy discount)
const RUNFLAT: Row[] = [
  [195, 55, 16, 90],
  [205, 55, 16, 90],
  [205, 45, 17, 90],
  [225, 45, 17, 100],
  [205, 50, 17, 100],
  [225, 50, 17, 110],
  [225, 55, 17, 110],
  [255, 40, 18, 125],
  [275, 40, 18, 125],
  [245, 50, 18, 125],
  [225, 40, 18, 100],
  [245, 40, 18, 125],
  [245, 45, 18, 125],
  [225, 45, 18, 125],
  [225, 50, 18, 125],
  [255, 35, 18, 125],
  [245, 35, 18, 130],
  [275, 35, 19, 140],
  [255, 35, 19, 125],
  [245, 40, 19, 125],
  [245, 45, 19, 125],
  [225, 40, 19, 125],
  [255, 40, 19, 140],
  [235, 45, 19, 140],
  [275, 40, 20, 150],
  [275, 30, 20, 140],
  [245, 35, 20, 125],
  [245, 40, 20, 125],
  [315, 35, 20, 160],
  [275, 35, 20, 150],
  [325, 30, 21, 170],
];

// Commercial (van) tyres - "C" rated
const COMMERCIAL: Row[] = [
  [165, 80, 13, 70, 65],
  [185, 65, 15, 80, 75],
  [195, 70, 15, 65, 60],
  [195, 80, 15, 80, 75],
  [205, 65, 15, 70, 65],
  [215, 65, 15, 70, 65],
  [215, 70, 15, 70, 65],
  [225, 70, 15, 75, 70],
  [185, 75, 16, 60, 55],
  [195, 65, 16, 65, 60],
  [195, 75, 16, 60, 55],
  [205, 65, 16, 65, 60],
  [205, 75, 16, 75, 70],
  [215, 65, 16, 75, 70],
  [215, 70, 16, 80, 75],
  [215, 75, 16, 75, 70],
  [225, 65, 16, 80, 75],
  [225, 75, 16, 80, 75],
  [235, 65, 16, 75, 70],
  [215, 60, 17, 80, 75],
  [225, 55, 17, 80, 75],
];

const makeTyre = (row: Row, category: TyreCategory): Tyre => {
  const [width, profile, rim, price, price4] = row;
  const prefix = category === 'Runflat' ? 'rf' : category === 'Commercial' ? 'com' : 'std';
  const suffix = category === 'Runflat' ? ' Runflat' : category === 'Commercial' ? 'C' : '';
  return {
    id: `${prefix}-${width}-${profile}-${rim}`,
    brand: 'ARSH Tyres',
    model: `${width}/${profile} R${rim}${suffix}`,
    width,
    profile,
    rim,
    price,
    price4,
    category,
    isRunflat: category === 'Runflat',
    stock: 20,
  };
};

const dedupe = (tyres: Tyre[]): Tyre[] => {
  const seen = new Map<string, Tyre>();
  for (const t of tyres) {
    if (!seen.has(t.id)) seen.set(t.id, t);
  }
  return [...seen.values()];
};

export const TYRE_DATABASE: Tyre[] = dedupe([
  ...STANDARD.map((r) => makeTyre(r, 'Standard')),
  ...RUNFLAT.map((r) => makeTyre(r, 'Runflat')),
  ...COMMERCIAL.map((r) => makeTyre(r, 'Commercial')),
]);

// Per-tyre price for a given quantity (4+ gets the multi-buy price where available)
export const getUnitPrice = (tyre: Tyre, quantity: number): number =>
  quantity >= 4 && tyre.price4 !== undefined ? tyre.price4 : tyre.price;

// Extra workshop services
export const LOCKING_NUT_REMOVAL_PRICE = 20; // £20 per locking wheel nut removal

export const SERVICES = [
  {
    id: 'tpms',
    name: 'TPMS - Tyre Pressure Monitoring Sensors',
    description: 'We supply Autel sensors including fitting and programming. Contact us for a quote.',
    price: null as number | null,
  },
  {
    id: 'locking-nut-removal',
    name: 'Locking Wheel Nut Removal',
    description: '£20 per locking wheel nut removal.',
    price: LOCKING_NUT_REMOVAL_PRICE,
  },
];

// Dropdown options (derived from live inventory)
const unique = (nums: number[]) => [...new Set(nums)].sort((a, b) => a - b);
export const WIDTHS = unique(TYRE_DATABASE.map((t) => t.width));
export const PROFILES = unique(TYRE_DATABASE.map((t) => t.profile));
export const RIMS = unique(TYRE_DATABASE.map((t) => t.rim));
export const TYRE_TYPES: TyreCategory[] = ['Standard', 'Runflat', 'Commercial'];

// Mock database for UK car registration lookups
export interface RegLookup {
  registration: string;
  vehicleMakeModel: string;
  width: number;
  profile: number;
  rim: number;
  speedRating: string;
}

export const MOCK_REGISTRATIONS: Record<string, RegLookup> = {};

// Available time slots for booking
export const TIME_SLOTS = [
  'Morning',
  'Afternoon'
];

// Fitting is included in all tyre prices
export const FITTING_FEES = {
  shop: 0.00,
  mobile: 0.00,
  delivery: 0.00
};
