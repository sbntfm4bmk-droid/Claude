// Shared API response types, mirroring the Prisma models on the server.

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: "CLIENT" | "PROVIDER";
  providerProfile?: ProviderProfile | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  _count?: { providers: number };
}

export interface ProviderProfile {
  id: string;
  userId: string;
  bio?: string | null;
  hourlyRate: number;
  latitude?: number | null;
  longitude?: number | null;
  isAvailable: boolean;
  ratingAvg: number;
  ratingCount: number;
  categoryId?: string | null;
  category?: Category | null;
  user?: Pick<User, "id" | "fullName" | "avatarUrl" | "phone">;
  distanceKm?: number | null;
  reviews?: Review[];
}

export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  description: string;
  address?: string | null;
  scheduledAt?: string | null;
  priceEstimate?: number | null;
  status: BookingStatus;
  createdAt: string;
  category?: Category | null;
  client?: Pick<User, "id" | "fullName" | "avatarUrl" | "phone">;
  provider?: ProviderProfile;
  review?: Review | null;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  author?: Pick<User, "fullName" | "avatarUrl">;
}

export interface AuthResponse {
  token: string;
  user: User;
}
