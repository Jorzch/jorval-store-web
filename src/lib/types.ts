export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
}
export interface Category {
  id: string;
  name: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}
export interface CartItem {
  id: string;
  quantity: number;
  Product: Product;
}
export interface Cart {
  id: string;
  CartItems: CartItem[];
}
export interface Order {
  id: string;
  details: { products: CartItem[]; total: number };
}
export interface ApiResponse<T> {
  status: string;
  data: T;
  pagination?: { page: number; total: number };
}
