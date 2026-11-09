import type {
  ApiResponse,
  Cart,
  Category,
  Order,
  Product,
  User,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
const baseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
export async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Unable to reach the store. Please try again shortly.",
      0,
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      body?.message || "The request could not be completed.",
      response.status,
    );
  if (!body || body.status !== "success")
    throw new ApiError(
      "The store returned an unexpected response.",
      response.status,
    );
  return body;
}
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, {
    method: "POST",
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
export const api = {
  products: (params: { page: number; search: string; category: string }) => {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: "12",
    });
    if (params.search) query.set("search", params.search);
    if (params.category) query.set("category", params.category);
    return request<Product[]>(`/products?${query}`);
  },
  product: (slug: string) =>
    request<Product>(`/products/${encodeURIComponent(slug)}`),
  categories: () => request<Category[]>("/categories"),
  me: () => request<{ user: User }>("/auth/me"),
  login: (data: { email: string; password: string }) =>
    post<{ user: User }>("/auth/login", data),
  signup: (data: { name: string; email: string; password: string }) =>
    post<{ user: User }>("/auth/signup", data),
  logout: () => post<void>("/auth/logout"),
  cart: () => request<Cart>("/cart"),
  changeCart: (
    action: "add" | "remove",
    productSlug: string,
    quantity: number,
  ) => post<void>(`/cart/${action}`, { productSlug, quantity }),
  checkout: () => post<Order>("/cart/checkout"),
  orders: () => request<Order[]>("/orders"),
};
