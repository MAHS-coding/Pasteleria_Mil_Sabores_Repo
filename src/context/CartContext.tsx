import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { getProductByCode } from "../utils/products";
import { products as seedProducts } from "../utils/dataLoaders";

const KEY_CART = "carrito"; // base key; actual key will include user identifier

type CartItem = {
    code: string;
    productName: string;
    price?: number;
    img?: string;
    cantidad: number;
    mensaje?: string;
};

type CartContextValue = {
    items: CartItem[];
    count: number;
    add: (item: Omit<CartItem, "cantidad">) => boolean;
    addMultiple: (item: Omit<CartItem, "cantidad">, qty: number) => number;
    addPersonalizedBatch: (base: Omit<CartItem, "cantidad" | "mensaje">, messages: (string | undefined)[]) => number;
    remove: (code: string, mensaje?: string) => void;
    setQuantity: (code: string, mensaje: string | undefined, qty: number) => number;
    clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function sanitizeKeyPart(s?: string) {
    if (!s) return "guest";
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function cartStorageKeyForUser(user: { name?: string; email?: string } | null) {
    if (!user) return `${KEY_CART}_guest`;
    if (user.email) return `${KEY_CART}_${sanitizeKeyPart(user.email)}`;
    if (user.name) return `${KEY_CART}_${sanitizeKeyPart(user.name)}`;
    return `${KEY_CART}_guest`;
}

import { getJSON, setJSON } from "../utils/storage";

function readCartForKey(key: string): CartItem[] {
    try {
        const v = getJSON<CartItem[]>(key);
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
}

function writeCartForKey(key: string, items: CartItem[]) {
    setJSON(key, items);
}

const STOCK_UNLIMITED = Number.POSITIVE_INFINITY;

function normalizeMessage(msg?: string | null) {
    return msg ?? "";
}

function resolveStockLimit(code: string): number {
    const product = getProductByCode(code, seedProducts);
    const stock = product?.stock;
    if (typeof stock === "number" && Number.isFinite(stock) && stock >= 0) return stock;
    return STOCK_UNLIMITED;
}

function totalQuantityForCode(items: CartItem[], code: string, excludeMessage?: string): number {
    return items.reduce((sum, it) => {
        if (it.code !== code) return sum;
        if (excludeMessage !== undefined && normalizeMessage(it.mensaje) === excludeMessage) return sum;
        return sum + (it.cantidad || 0);
    }, 0);
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const storageKey = useMemo(() => cartStorageKeyForUser(user as any), [user]);
    const prevKeyRef = useRef<string | null>(null);

    // initialize from storage for the current user
    const [items, setItems] = useState<CartItem[]>(() => readCartForKey(storageKey));

    // NOTE: persist explicitly inside state-updating functions to avoid races
    // that can overwrite a user's cart when the storageKey changes.

    const count = useMemo(() => items.reduce((s, it) => s + (it.cantidad || 0), 0), [items]);

    // watch for user changes and migrate/merge carts when needed
    useEffect(() => {
        const prevKey = prevKeyRef.current;
        if (!prevKey) {
            // first render: ensure state reflects storage (already set by initializer)
            prevKeyRef.current = storageKey;
            return;
        }

    if (prevKey === storageKey) return; // no change

    const prevCart = readCartForKey(prevKey);
    const newCart = readCartForKey(storageKey);

        // If user is logging in (guest -> user), merge guest into user.
        const prevIsGuest = prevKey.endsWith("_guest");
        const newIsGuest = storageKey.endsWith("_guest");

        // If guest -> user: merge guest into user (preserve guest items into user's cart)
        if (prevIsGuest && !newIsGuest) {
            // merge guest into user
            const mergedMap = new Map<string, CartItem>();
            function keyOf(it: CartItem) { return `${it.code}::${it.mensaje || ""}`; }
            (newCart || []).forEach((it) => mergedMap.set(keyOf(it), { ...it }));
            (prevCart || []).forEach((it) => {
                const k = keyOf(it);
                if (mergedMap.has(k)) {
                    const ex = mergedMap.get(k)!;
                    mergedMap.set(k, { ...ex, cantidad: (ex.cantidad || 0) + (it.cantidad || 0) });
                } else {
                    mergedMap.set(k, { ...it });
                }
            });
            const merged = Array.from(mergedMap.values());
            writeCartForKey(storageKey, merged);
            // clear guest cart after merge
            writeCartForKey(prevKey, []);
            setItems(merged);
        } else if (!prevIsGuest && newIsGuest) {
            // user -> guest (logout): clear the guest cart in UI (do not load previous user items)
            // keep the user's persisted cart under their key (so it can be restored when they log back in)
            // user -> guest (logout): clear the guest UI and persist empty guest cart
            writeCartForKey(storageKey, []);
            setItems([]);
        } else {
            // otherwise just load the cart for the active key
            setItems(newCart || []);
        }
        prevKeyRef.current = storageKey;
    }, [storageKey]);

    function add(item: Omit<CartItem, "cantidad">): boolean {
        const limit = resolveStockLimit(item.code);
        const messageKey = normalizeMessage(item.mensaje);
        const unlimited = !Number.isFinite(limit);
        const totalForProduct = totalQuantityForCode(items, item.code);
        const available = unlimited ? 1 : Math.max(0, limit - totalForProduct);
        const increment = unlimited ? 1 : Math.min(1, available);
        if (increment <= 0) return false;

        const existing = items.find((c) => c.code === item.code && normalizeMessage(c.mensaje) === messageKey);
        const next = existing
            ? items.map((c) => (c === existing ? { ...c, cantidad: (c.cantidad || 0) + increment } : c))
            : [...items, { ...item, cantidad: increment }];
        try { writeCartForKey(storageKey, next); } catch {};
        setItems(next);
        return true;
    }

    function addMultiple(item: Omit<CartItem, "cantidad">, qty: number): number {
        const normalizedQty = Math.max(0, Math.floor(qty || 0));
        if (normalizedQty <= 0) return 0;

        const limit = resolveStockLimit(item.code);
        const messageKey = normalizeMessage(item.mensaje);
        const unlimited = !Number.isFinite(limit);
        const totalForProduct = totalQuantityForCode(items, item.code);
        const available = unlimited ? normalizedQty : Math.max(0, limit - totalForProduct);
        const toAdd = unlimited ? normalizedQty : Math.min(normalizedQty, available);
        if (toAdd <= 0) return 0;

        const existing = items.find((c) => c.code === item.code && normalizeMessage(c.mensaje) === messageKey);
        const next = existing
            ? items.map((c) => (c === existing ? { ...c, cantidad: (c.cantidad || 0) + toAdd } : c))
            : [...items, { ...item, cantidad: toAdd }];
        try { writeCartForKey(storageKey, next); } catch {};
        setItems(next);
        return toAdd;
    }

    function remove(code: string, mensaje?: string) {
        setItems((cur) => {
            const next = cur.filter((c) => !(c.code === code && (c.mensaje || "") === (mensaje || "")));
            try { writeCartForKey(storageKey, next); } catch {};
            return next;
        });
    }

    function setQuantity(code: string, mensaje: string | undefined, qty: number): number {
        const requestedQty = Math.max(0, Math.floor(qty || 0));
        if (requestedQty <= 0) return 0;

        const limit = resolveStockLimit(code);
        const messageKey = normalizeMessage(mensaje);

        const index = items.findIndex((c) => c.code === code && normalizeMessage(c.mensaje) === messageKey);
        if (index === -1) return 0;

        const existingItem = items[index];
        const existingQty = existingItem.cantidad || 0;
        let targetQty = requestedQty;

        if (Number.isFinite(limit)) {
            const otherTotal = totalQuantityForCode(items, code, messageKey);
            const allowed = Math.max(0, limit - otherTotal);
            targetQty = Math.min(targetQty, allowed);
        }

        if (Number.isFinite(limit) && targetQty <= 0) {
            const next = items.filter((_, idx) => idx !== index);
            try { writeCartForKey(storageKey, next); } catch {};
            setItems(next);
            return 0;
        }

        if (targetQty === existingQty) {
            return existingQty;
        }

        const next = items.map((c, idx) => (idx === index ? { ...c, cantidad: targetQty } : c));
        try { writeCartForKey(storageKey, next); } catch {};
        setItems(next);
        return targetQty;
    }

    function addPersonalizedBatch(base: Omit<CartItem, "cantidad" | "mensaje">, messages: (string | undefined)[]): number {
        const code = base.code;
        const limit = resolveStockLimit(code);
        const unlimited = !Number.isFinite(limit);
        const currentTotal = totalQuantityForCode(items, code);
        const desired = messages.length;
        const canAdd = unlimited ? desired : Math.max(0, Math.min(desired, limit - currentTotal));
        if (canAdd <= 0) return 0;

        const next: CartItem[] = items.map((it) => ({ ...it }));

        for (let i = 0; i < canAdd; i++) {
            // normalize message: trim and use undefined when empty
            const raw = messages[i] ?? "";
            const trimmed = String(raw).trim();
            const message: string | undefined = trimmed.length > 0 ? trimmed : undefined;
            const key = normalizeMessage(message);
            const idx = next.findIndex((c) => c.code === code && normalizeMessage(c.mensaje) === key);
            if (idx >= 0) {
                next[idx] = { ...next[idx], cantidad: (next[idx].cantidad || 0) + 1 };
            } else {
                next.push({ ...base, code, mensaje: message, cantidad: 1 });
            }
        }

        try { writeCartForKey(storageKey, next); } catch {}
        setItems(next);
        return canAdd;
    }

    function clear() {
        setItems(() => {
            const next: CartItem[] = [];
            try { writeCartForKey(storageKey, next); } catch {};
            return next;
        });
    }

    const value = { items, count, add, addMultiple, addPersonalizedBatch, remove, setQuantity, clear };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside CartProvider");
    return ctx;
}

export default CartContext;
