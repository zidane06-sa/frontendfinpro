const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export type UserRole = "admin" | "customer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  city: string;
  cuisine?: string | null;
  phone?: string | null;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
  owner_id: string;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  table_number: string;
  capacity: number;
  status: "available" | "reserved" | "maintenance";
  location?: string | null;
  restaurant?: Pick<Restaurant, "id" | "name" | "address">;
  Restaurant?: Pick<Restaurant, "id" | "name" | "address">;
}

export interface Reservation {
  id: string;
  customer_id: string;
  restaurant_id: string;
  table_id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
  special_request?: string | null;
  rejection_reason?: string | null;
  User?: Pick<User, "id" | "name" | "email">;
  Restaurant?: Pick<Restaurant, "id" | "name" | "address" | "city">;
  Table?: Pick<RestaurantTable, "id" | "table_number" | "capacity">;
}

interface AuthResponse {
  token?: string;
  user: User;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("reservo_token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Request failed");
  }

  return payload as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string, role: UserRole) =>
    request<AuthResponse>("/users/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    }),

  getRestaurants: () =>
    request<{ restaurants: Restaurant[] }>("/restaurants"),

  createRestaurant: (restaurant: Omit<Restaurant, "id" | "is_active">) =>
    request<{ restaurant: Restaurant }>("/restaurants", {
      method: "POST",
      body: JSON.stringify(restaurant),
    }),

  getTables: () =>
    request<{ tables: RestaurantTable[] }>("/tables"),

  getTablesByRestaurant: (restaurantId: string) =>
    request<{ tables: RestaurantTable[] }>(`/tables/restaurant/${restaurantId}`),

  getAvailableTables: (restaurantId: string, capacity: number) =>
    request<{ tables: RestaurantTable[] }>(`/tables/restaurant/${restaurantId}/available?capacity=${capacity}`),

  createTable: (table: Omit<RestaurantTable, "id">) =>
    request<{ table: RestaurantTable }>("/tables", {
      method: "POST",
      body: JSON.stringify(table),
    }),

  updateTableStatus: (id: string, status: RestaurantTable["status"]) =>
    request<{ table: RestaurantTable }>(`/tables/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getReservations: () =>
    request<{ reservations: Reservation[] }>("/reservations"),

  getCustomerReservations: (customerId: string) =>
    request<{ reservations: Reservation[] }>(`/reservations/customer/${customerId}`),

  createReservation: (reservation: {
    customer_id: string;
    restaurant_id: string;
    table_id: string;
    reservation_date: string;
    start_time: string;
    end_time: string;
    guest_count: number;
    special_request?: string;
  }) =>
    request<{ reservation: Reservation }>("/reservations", {
      method: "POST",
      body: JSON.stringify(reservation),
    }),

  confirmReservation: (id: string) =>
    request<{ reservation: Reservation }>(`/reservations/${id}/confirm`, { method: "PATCH" }),

  rejectReservation: (id: string) =>
    request<{ reservation: Reservation }>(`/reservations/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejection_reason: "Rejected by restaurant admin" }),
    }),

  cancelReservation: (id: string) =>
    request<{ reservation: Reservation }>(`/reservations/${id}/cancel`, { method: "PATCH" }),
};

export function saveAuth(token: string | undefined, user: User) {
  if (token) {
    localStorage.setItem("reservo_token", token);
  }
  localStorage.setItem("reservo_user", JSON.stringify(user));
}

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem("reservo_user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem("reservo_token");
  localStorage.removeItem("reservo_user");
}
