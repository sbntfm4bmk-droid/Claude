// Shared API response types, mirroring the Prisma models on the server.

export type Role = "CLIENT" | "PROVIDER";
export type BusinessType = "SERVICE" | "PRODUCT" | "BOTH";

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: Role;
  business?: Business | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  kind: "SERVICE" | "PRODUCT" | "BOTH";
  _count?: { businesses: number };
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  durationMin: number;
  price: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface OpeningHour {
  id: string;
  weekday: number;
  openMinute: number;
  closeMinute: number;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  author?: Pick<User, "fullName" | "avatarUrl">;
}

export interface Business {
  id: string;
  userId: string;
  name: string;
  type: BusinessType;
  tagline?: string | null;
  description?: string | null;
  categoryId?: string | null;
  category?: Category | null;
  addressLine?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coverImageUrl?: string | null;
  ratingAvg: number;
  ratingCount: number;
  isActive: boolean;
  distanceKm?: number | null;
  user?: Pick<User, "id" | "fullName" | "avatarUrl" | "phone">;
  services?: Service[];
  products?: Product[];
  openingHours?: OpeningHour[];
  reviews?: Review[];
  _count?: { services: number; products: number; reviews: number };
}

export interface Slot {
  startAt: string;
  endAt: string;
}

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  id: string;
  businessId: string;
  serviceId: string;
  clientId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  priceAtBooking: number;
  notes?: string | null;
  createdAt: string;
  service?: Service;
  review?: Review | null;
  client?: Pick<User, "id" | "fullName" | "avatarUrl" | "phone">;
  business?: Business;
}

export type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELLED";

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: Product;
}

export interface Order {
  id: string;
  businessId: string;
  clientId: string;
  status: OrderStatus;
  fulfillment: "PICKUP" | "DELIVERY";
  total: number;
  createdAt: string;
  items?: OrderItem[];
  client?: Pick<User, "id" | "fullName" | "phone">;
  business?: Pick<Business, "id" | "name">;
}

export interface Favorite {
  id: string;
  businessId: string;
  business?: Business;
}

export interface AuthResponse {
  token: string;
  user: User;
}
