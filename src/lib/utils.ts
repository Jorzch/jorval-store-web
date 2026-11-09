import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CartItem } from "./types";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
export const cartTotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.Product.price * item.quantity, 0);
