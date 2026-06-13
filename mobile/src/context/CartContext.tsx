import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Business, Product } from "../api/types";

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  businessId: string | null;
  businessName: string | null;
  lines: CartLine[];
  count: number;
  total: number;
  add: (business: Pick<Business, "id" | "name">, product: Product) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// A cart holds products from a SINGLE business at a time (like ordering from one
// shop). Adding from a different business resets the cart.
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);

  const add = useCallback(
    (business: Pick<Business, "id" | "name">, product: Product) => {
      setLines((prev) => {
        // Switching businesses clears the previous cart.
        if (businessId && businessId !== business.id) {
          setBusinessId(business.id);
          setBusinessName(business.name);
          return [{ product, quantity: 1 }];
        }
        if (!businessId) {
          setBusinessId(business.id);
          setBusinessName(business.name);
        }
        const existing = prev.find((l) => l.product.id === product.id);
        if (existing) {
          return prev.map((l) =>
            l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
          );
        }
        return [...prev, { product, quantity: 1 }];
      });
    },
    [businessId]
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0)
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setBusinessId(null);
    setBusinessName(null);
  }, []);

  const count = useMemo(() => lines.reduce((n, l) => n + l.quantity, 0), [lines]);
  const total = useMemo(
    () => lines.reduce((s, l) => s + l.product.price * l.quantity, 0),
    [lines]
  );

  return (
    <CartContext.Provider
      value={{ businessId, businessName, lines, count, total, add, setQuantity, remove, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
