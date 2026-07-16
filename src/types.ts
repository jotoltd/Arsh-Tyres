export interface Tyre {
  id: string;
  brand: string;
  model: string;
  width: number;       // e.g., 205
  profile: number;     // e.g., 55
  rim: number;         // e.g., 16
  speedRating: string; // e.g., "V", "W", "Y"
  loadIndex: number;   // e.g., 91, 94
  price: number;
  category: 'Summer' | 'Winter' | 'All-Season';
  isRunflat: boolean;
  isReinforced: boolean; // XL
  fuelEfficiency: 'A' | 'B' | 'C' | 'D' | 'E';
  wetGrip: 'A' | 'B' | 'C' | 'D' | 'E';
  noiseLevel: number; // in dB
  stock: number;
  rating: number;
  reviewsCount: number;
  imageUrl?: string;
  recommendedFor?: string;
}

export interface CartItem {
  tyre: Tyre;
  quantity: number;
}

export interface Booking {
  id: string;
  cartItems: CartItem[];
  subtotal: number;
  fittingFee: number;
  totalPrice: number;
  fittingType: 'shop' | 'mobile' | 'delivery'; // 'shop' (fitted in shop), 'mobile' (fitted at home/work), 'delivery' (tyres only delivery)
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "09:00 - 10:30"
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleRegistration: string;
  vehicleMakeModel: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface SearchFilters {
  width: string;
  profile: string;
  rim: string;
  speedRating: string;
  category: string; // 'All' | 'Summer' | 'Winter' | 'All-Season'
}
