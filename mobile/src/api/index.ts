import { apiFetch } from "./client";
import type {
  AuthResponse,
  Booking,
  BookingStatus,
  Category,
  ProviderProfile,
  User,
} from "./types";

// ---- Auth ----
export const authApi = {
  register: (body: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: "CLIENT" | "PROVIDER";
    categoryId?: string;
    hourlyRate?: number;
    bio?: string;
  }) => apiFetch<AuthResponse>("/api/auth/register", { method: "POST", body }),

  login: (body: { email: string; password: string }) =>
    apiFetch<AuthResponse>("/api/auth/login", { method: "POST", body }),

  me: () => apiFetch<{ user: User }>("/api/auth/me", { auth: true }),
};

// ---- Categories ----
export const categoriesApi = {
  list: () => apiFetch<{ categories: Category[] }>("/api/categories"),
};

// ---- Providers ----
export const providersApi = {
  list: (params: { categoryId?: string; lat?: number; lng?: number; q?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.categoryId) qs.set("categoryId", params.categoryId);
    if (params.lat != null) qs.set("lat", String(params.lat));
    if (params.lng != null) qs.set("lng", String(params.lng));
    if (params.q) qs.set("q", params.q);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<{ providers: ProviderProfile[] }>(`/api/providers${suffix}`);
  },

  get: (id: string) => apiFetch<{ provider: ProviderProfile }>(`/api/providers/${id}`),

  updateMe: (body: Partial<ProviderProfile>) =>
    apiFetch<{ provider: ProviderProfile }>("/api/providers/me", {
      method: "PATCH",
      body,
      auth: true,
    }),
};

// ---- Bookings ----
export const bookingsApi = {
  create: (body: {
    providerId: string;
    categoryId?: string;
    description: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    scheduledAt?: string;
  }) => apiFetch<{ booking: Booking }>("/api/bookings", { method: "POST", body, auth: true }),

  list: () => apiFetch<{ bookings: Booking[] }>("/api/bookings", { auth: true }),

  updateStatus: (id: string, status: BookingStatus) =>
    apiFetch<{ booking: Booking }>(`/api/bookings/${id}/status`, {
      method: "PATCH",
      body: { status },
      auth: true,
    }),
};

// ---- Reviews ----
export const reviewsApi = {
  create: (body: { bookingId: string; rating: number; comment?: string }) =>
    apiFetch<{ review: unknown }>("/api/reviews", { method: "POST", body, auth: true }),
};
