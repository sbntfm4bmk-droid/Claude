import { apiFetch } from "./client";
import type {
  Appointment,
  AppointmentStatus,
  AuthResponse,
  Business,
  BusinessType,
  Category,
  Favorite,
  Order,
  OrderStatus,
  Product,
  Service,
  Slot,
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
    businessName?: string;
    businessType?: BusinessType;
    categoryId?: string;
    city?: string;
  }) => apiFetch<AuthResponse>("/api/auth/register", { method: "POST", body }),

  login: (body: { email: string; password: string }) =>
    apiFetch<AuthResponse>("/api/auth/login", { method: "POST", body }),

  me: () => apiFetch<{ user: User }>("/api/auth/me", { auth: true }),
};

// ---- Categories ----
export const categoriesApi = {
  list: () => apiFetch<{ categories: Category[] }>("/api/categories"),
};

// ---- Businesses (discovery + storefront) ----
export const businessesApi = {
  list: (params: {
    categoryId?: string;
    type?: BusinessType;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    q?: string;
  } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") qs.set(k, String(v));
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<{ businesses: Business[] }>(`/api/businesses${suffix}`);
  },

  get: (id: string) => apiFetch<{ business: Business }>(`/api/businesses/${id}`),

  updateMe: (body: Partial<Business>) =>
    apiFetch<{ business: Business }>("/api/businesses/me", { method: "PATCH", body, auth: true }),
};

// ---- Services ----
export const servicesApi = {
  create: (body: { name: string; description?: string; durationMin: number; price: number }) =>
    apiFetch<{ service: Service }>("/api/services", { method: "POST", body, auth: true }),

  slots: (serviceId: string, date: string) =>
    apiFetch<{ slots: Slot[]; durationMin: number }>(`/api/services/${serviceId}/slots?date=${date}`),
};

// ---- Products ----
export const productsApi = {
  create: (body: { name: string; description?: string; price: number; stock: number }) =>
    apiFetch<{ product: Product }>("/api/products", { method: "POST", body, auth: true }),
};

// ---- Appointments (RDV) ----
export const appointmentsApi = {
  create: (body: { serviceId: string; startAt: string; notes?: string }) =>
    apiFetch<{ appointment: Appointment }>("/api/appointments", { method: "POST", body, auth: true }),

  list: () => apiFetch<{ appointments: Appointment[] }>("/api/appointments", { auth: true }),

  updateStatus: (id: string, status: AppointmentStatus) =>
    apiFetch<{ appointment: Appointment }>(`/api/appointments/${id}/status`, {
      method: "PATCH",
      body: { status },
      auth: true,
    }),
};

// ---- Orders ----
export const ordersApi = {
  create: (body: {
    businessId: string;
    fulfillment: "PICKUP" | "DELIVERY";
    items: { productId: string; quantity: number }[];
  }) => apiFetch<{ order: Order }>("/api/orders", { method: "POST", body, auth: true }),

  list: () => apiFetch<{ orders: Order[] }>("/api/orders", { auth: true }),

  updateStatus: (id: string, status: OrderStatus) =>
    apiFetch<{ order: Order }>(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: { status },
      auth: true,
    }),
};

// ---- Reviews ----
export const reviewsApi = {
  create: (body: { appointmentId: string; rating: number; comment?: string }) =>
    apiFetch<{ review: unknown }>("/api/reviews", { method: "POST", body, auth: true }),
};

// ---- Favorites ----
export const favoritesApi = {
  list: () => apiFetch<{ favorites: Favorite[] }>("/api/favorites", { auth: true }),
  toggle: (businessId: string) =>
    apiFetch<{ favorited: boolean }>("/api/favorites/toggle", {
      method: "POST",
      body: { businessId },
      auth: true,
    }),
};
