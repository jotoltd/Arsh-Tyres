import { Tyre } from './types';

// Diverse set of premium and value tyres matching standard size profiles
export const TYRE_DATABASE: Tyre[] = [
  {
    id: 'michelin-ps5',
    brand: 'Michelin',
    model: 'Pilot Sport 5',
    width: 225,
    profile: 45,
    rim: 17,
    speedRating: 'Y',
    loadIndex: 94,
    price: 119.50,
    category: 'Summer',
    isRunflat: false,
    isReinforced: true,
    fuelEfficiency: 'C',
    wetGrip: 'A',
    noiseLevel: 72,
    stock: 16,
    rating: 4.8,
    reviewsCount: 312,
    imageUrl: 'https://images.unsplash.com/photo-1728522298320-e4ef6a76bbcd?auto=format&fit=crop&w=600&q=80',
    recommendedFor: 'Sporty sedans, BMW 3 Series, Audi A4, Volkswagen Golf GTI'
  },
  {
    id: 'continental-sc7',
    brand: 'Continental',
    model: 'SportContact 7',
    width: 235,
    profile: 40,
    rim: 19,
    speedRating: 'Y',
    loadIndex: 96,
    price: 154.00,
    category: 'Summer',
    isRunflat: false,
    isReinforced: true,
    fuelEfficiency: 'C',
    wetGrip: 'A',
    noiseLevel: 72,
    stock: 8,
    rating: 4.9,
    reviewsCount: 145,
    imageUrl: 'https://images.unsplash.com/photo-1699325490806-902b139a6682?auto=format&fit=crop&w=600&q=80',
    recommendedFor: 'High-performance sports cars, Mercedes-AMG C43, Audi S5'
  },
  {
    id: 'pirelli-pzero-pz4',
    brand: 'Pirelli',
    model: 'P Zero (PZ4)',
    width: 245,
    profile: 35,
    rim: 20,
    speedRating: 'Y',
    loadIndex: 95,
    price: 189.99,
    category: 'Summer',
    isRunflat: true,
    isReinforced: true,
    fuelEfficiency: 'D',
    wetGrip: 'A',
    noiseLevel: 73,
    stock: 12,
    rating: 4.7,
    reviewsCount: 88,
    imageUrl: 'https://images.unsplash.com/photo-1760111537896-05ef8f0f347f?auto=format&fit=crop&w=600&q=80',
    recommendedFor: 'Supercars and premium luxury vehicles, Porsche 911, Tesla Model S'
  },
  {
    id: 'goodyear-f1-asym6',
    brand: 'Goodyear',
    model: 'Eagle F1 Asymmetric 6',
    width: 225,
    profile: 40,
    rim: 18,
    speedRating: 'Y',
    loadIndex: 92,
    price: 108.50,
    category: 'Summer',
    isRunflat: false,
    isReinforced: false,
    fuelEfficiency: 'C',
    wetGrip: 'A',
    noiseLevel: 70,
    stock: 24,
    rating: 4.8,
    reviewsCount: 192,
    imageUrl: 'https://images.unsplash.com/photo-1756664825124-15a086629185?auto=format&fit=crop&w=600&q=80',
    recommendedFor: 'Hot hatches, Ford Focus ST, Honda Civic Type R, BMW 1 Series'
  },
  {
    id: 'michelin-cc2',
    brand: 'Michelin',
    model: 'CrossClimate 2',
    width: 205,
    profile: 55,
    rim: 16,
    speedRating: 'V',
    loadIndex: 91,
    price: 98.75,
    category: 'All-Season',
    isRunflat: false,
    isReinforced: false,
    fuelEfficiency: 'B',
    wetGrip: 'B',
    noiseLevel: 71,
    stock: 32,
    rating: 4.9,
    reviewsCount: 540,
    imageUrl: 'https://images.unsplash.com/photo-1751601397743-fed8bbfd2965?auto=format&fit=crop&w=600&q=80',
    recommendedFor: 'Family hatchbacks and saloons, Ford Focus, Toyota Corolla, Volkswagen Golf'
  },
  {
    id: 'continental-ascon6',
    brand: 'Continental',
    model: 'AllSeasonContact 2',
    width: 215,
    profile: 55,
    rim: 17,
    speedRating: 'V',
    loadIndex: 98,
    price: 114.20,
    category: 'All-Season',
    isRunflat: false,
    isReinforced: true,
    fuelEfficiency: 'B',
    wetGrip: 'B',
    noiseLevel: 71,
    stock: 18,
    rating: 4.6,
    reviewsCount: 74,
    imageUrl: 'https://images.unsplash.com/photo-1708216877383-b879d34de7e2?auto=format&fit=crop&w=600&q=80',
    recommendedFor: 'SUVs and mid-size crossovers, Nissan Qashqai, Kia Sportage, Hyundai Tucson'
  },
  {
    id: 'bridgestone-t005',
    brand: 'Bridgestone',
    model: 'Turanza T005',
    width: 205,
    profile: 55,
    rim: 16,
    speedRating: 'H',
    loadIndex: 91,
    price: 84.99,
    category: 'Summer',
    isRunflat: false,
    isReinforced: false,
    fuelEfficiency: 'A',
    wetGrip: 'A',
    noiseLevel: 71,
    stock: 40,
    rating: 4.5,
    reviewsCount: 204,
    imageUrl: 'https://images.unsplash.com/photo-1753183700294-a2dbeb81e168?auto=format&fit=crop&w=600&q=80',
    recommendedFor: 'Daily commuters, Skoda Octavia, Vauxhall Astra, Honda Civic'
  },
  {
    id: 'pirelli-sottozero3',
    brand: 'Pirelli',
    model: 'Winter Sottozero 3',
    width: 225,
    profile: 45,
    rim: 17,
    speedRating: 'V',
    loadIndex: 94,
    price: 128.00,
    category: 'Winter',
    isRunflat: false,
    isReinforced: true,
    fuelEfficiency: 'D',
    wetGrip: 'B',
    noiseLevel: 72,
    stock: 10,
    rating: 4.7,
    reviewsCount: 112,
    imageUrl: 'https://images.unsplash.com/photo-1752959807356-a4f7628f74a6?auto=format&fit=crop&w=600&q=80',
    recommendedFor: 'Cold climates and alpine roads, Audi A4 Quattro, BMW xDrive models'
  },
  {
    id: 'michelin-alpin6',
    brand: 'Michelin',
    model: 'Alpin 6',
    width: 195,
    profile: 65,
    rim: 15,
    speedRating: 'H',
    loadIndex: 91,
    price: 89.50,
    category: 'Winter',
    isRunflat: false,
    isReinforced: false,
    fuelEfficiency: 'C',
    wetGrip: 'B',
    noiseLevel: 69,
    stock: 14,
    rating: 4.8,
    reviewsCount: 95,
    imageUrl: 'https://images.unsplash.com/photo-1761846788508-ed4beafeb64a?auto=format&fit=crop&w=600&q=80',
    recommendedFor: 'Compact cars in winter regions, Volkswagen Polo, Ford Fiesta, Renault Clio'
  },
  {
    id: 'hankook-ventus-s1',
    brand: 'Hankook',
    model: 'Ventus S1 Evo 3',
    width: 225,
    profile: 40,
    rim: 18,
    speedRating: 'Y',
    loadIndex: 92,
    price: 86.50,
    category: 'Summer',
    isRunflat: false,
    isReinforced: true,
    fuelEfficiency: 'C',
    wetGrip: 'A',
    noiseLevel: 71,
    stock: 28,
    rating: 4.4,
    reviewsCount: 153,
    imageUrl: 'https://images.unsplash.com/photo-1668457248687-4cd393be920b?auto=format&fit=crop&w=600&q=80',
    recommendedFor: 'Executive saloons and sporty hatchbacks, Mercedes C-Class, Tesla Model 3'
  },
  {
    id: 'yokohama-bluearth',
    brand: 'Yokohama',
    model: 'BluEarth-GT AE51',
    width: 195,
    profile: 60,
    rim: 15,
    speedRating: 'V',
    loadIndex: 88,
    price: 69.95,
    category: 'Summer',
    isRunflat: false,
    isReinforced: false,
    fuelEfficiency: 'B',
    wetGrip: 'A',
    noiseLevel: 68,
    stock: 20,
    rating: 4.3,
    reviewsCount: 64,
    imageUrl: 'https://images.unsplash.com/photo-1699325490806-902b139a6682?auto=format&fit=crop&w=600&q=80',
    recommendedFor: 'Eco cars and fuel-conscious drivers, Toyota Yaris, Nissan Micra'
  },
  {
    id: 'dunlop-sport-maxx',
    brand: 'Dunlop',
    model: 'Sport Maxx RT2',
    width: 225,
    profile: 45,
    rim: 18,
    speedRating: 'Y',
    loadIndex: 95,
    price: 97.20,
    category: 'Summer',
    isRunflat: false,
    isReinforced: true,
    fuelEfficiency: 'C',
    wetGrip: 'A',
    noiseLevel: 69,
    stock: 16,
    rating: 4.5,
    reviewsCount: 122,
    imageUrl: 'https://images.unsplash.com/photo-1728522298320-e4ef6a76bbcd?auto=format&fit=crop&w=600&q=80',
    recommendedFor: 'Enthusiast performance drivers, Subaru WRX, Volkswagen Golf R'
  }
];

// Dropdown options
export const WIDTHS = [195, 205, 215, 225, 235, 245];
export const PROFILES = [35, 40, 45, 55, 60, 65];
export const RIMS = [15, 16, 17, 18, 19, 20];
export const SPEED_RATINGS = [
  { code: 'H', desc: 'Up to 130 mph (210 km/h)' },
  { code: 'V', desc: 'Up to 149 mph (240 km/h)' },
  { code: 'Y', desc: 'Up to 186 mph (300 km/h)' }
];

// Mock database for UK car registration lookups
export interface RegLookup {
  registration: string;
  vehicleMakeModel: string;
  width: number;
  profile: number;
  rim: number;
  speedRating: string;
}

export const MOCK_REGISTRATIONS: Record<string, RegLookup> = {
  'AA26TYR': {
    registration: 'AA26 TYR',
    vehicleMakeModel: 'BMW 3 Series (320d M Sport - 2021)',
    width: 225,
    profile: 45,
    rim: 17,
    speedRating: 'Y'
  },
  'ARSH999': {
    registration: 'ARSH 999',
    vehicleMakeModel: 'Mercedes-Benz E-Class (E300d - 2022)',
    width: 245,
    profile: 35,
    rim: 20,
    speedRating: 'Y'
  },
  'VW26GOL': {
    registration: 'VW26 GOL',
    vehicleMakeModel: 'Volkswagen Golf VIII (1.5 TSI - 2020)',
    width: 205,
    profile: 55,
    rim: 16,
    speedRating: 'V'
  },
  'TS26SLA': {
    registration: 'TS26 SLA',
    vehicleMakeModel: 'Tesla Model 3 Long Range (2023)',
    width: 235,
    profile: 40,
    rim: 19,
    speedRating: 'Y'
  }
};

// Available time slots for booking
export const TIME_SLOTS = [
  '08:30 - 10:00',
  '10:00 - 11:30',
  '11:30 - 13:00',
  '13:00 - 14:30',
  '14:30 - 16:00',
  '16:00 - 17:30'
];

// Pricing configurations
export const FITTING_FEES = {
  shop: 15.00,       // £15 per tyre
  mobile: 25.00,     // £25 callout + £10 per tyre (we will structure it as £20 per tyre)
  delivery: 0.00     // Free shipping
};
