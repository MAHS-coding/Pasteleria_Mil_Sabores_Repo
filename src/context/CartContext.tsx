import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

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
    add: (item: Omit<CartItem, "cantidad">) => void;
    addMultiple: (item: Omit<CartItem, "cantidad">, qty: number) => void;
    remove: (code: string, mensaje?: string) => void;
    setQuantity: (code: string, mensaje: string | undefined, qty: number) => void;
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

    function add(item: Omit<CartItem, "cantidad">) {
        setItems((cur) => {
            const existing = cur.find((c) => c.code === item.code && (c.mensaje || "") === (item.mensaje || ""));
            const next = existing
                ? cur.map((c) => (c === existing ? { ...c, cantidad: (c.cantidad || 0) + 1 } : c))
                : [...cur, { ...item, cantidad: 1 }];
            try { writeCartForKey(storageKey, next); } catch {};
            return next;
        });
    }

    function addMultiple(item: Omit<CartItem, "cantidad">, qty: number) {
        if (!qty || qty <= 0) return;
        setItems((cur) => {
            const existing = cur.find((c) => c.code === item.code && (c.mensaje || "") === (item.mensaje || ""));
            const next = existing
                ? cur.map((c) => (c === existing ? { ...c, cantidad: (c.cantidad || 0) + qty } : c))
                : [...cur, { ...item, cantidad: qty }];
            try { writeCartForKey(storageKey, next); } catch {};
            return next;
        });
    }

    function remove(code: string, mensaje?: string) {
        setItems((cur) => {
            const next = cur.filter((c) => !(c.code === code && (c.mensaje || "") === (mensaje || "")));
            try { writeCartForKey(storageKey, next); } catch {};
            return next;
        });
    }

    function setQuantity(code: string, mensaje: string | undefined, qty: number) {
        if (qty <= 0) return;
        setItems((cur) => {
            const next = cur.map((c) => (
                c.code === code && (c.mensaje || "") === (mensaje || "")
                    ? { ...c, cantidad: qty }
                    : c
            ));
            try { writeCartForKey(storageKey, next); } catch {};
            return next;
        });
    }

    function clear() {
        setItems(() => {
            const next: CartItem[] = [];
            try { writeCartForKey(storageKey, next); } catch {};
            return next;
        });
    }

    const value = { items, count, add, addMultiple, remove, setQuantity, clear };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside CartProvider");
    return ctx;
}

export default CartContext;
