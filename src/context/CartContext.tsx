import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { getProductByCode } from "../utils/products";
import { products as seedProducts } from "../utils/dataLoaders";
import { addCartItem, fetchCart, removeCartItem, updateCartItem } from "../services/cartService";
import type { CartItemDto } from "../services/cartService";

const KEY_CART = "carrito"; // base key; actual key will include user identifier

type CartItem = {
    code: string;
    productId?: string;
    productName: string;
    price?: number;
    img?: string;
    cantidad: number;
    mensaje?: string;
    serverItemId?: string;
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

function cartItemKey(code: string, mensaje?: string) {
    return `${code}::${normalizeMessage(mensaje)}`;
}

function cartItemDtoKey(code: string, mensaje?: string) {
    return `${code}::${normalizeMessage(mensaje)}`;
}

function mapCartItemDtoToCartItem(dto: CartItemDto) {
    if (!dto || (!dto.code && !dto.productId)) return null;
    const code = dto.code || dto.productId || "";
    const cantidad = typeof dto.cantidad === "number" ? dto.cantidad : typeof dto.qty === "number" ? dto.qty : 0;
    return {
        code,
        productId: dto.productId,
        productName: dto.productName || getProductByCode(code, seedProducts)?.productName || code,
        price: typeof dto.price === "number" ? dto.price : undefined,
        cantidad,
        mensaje: dto.mensaje,
        serverItemId: dto.id,
    } as CartItem;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const storageKey = useMemo(() => cartStorageKeyForUser(user as any), [user]);
    const prevKeyRef = useRef<string | null>(null);
    const [items, setItems] = useState<CartItem[]>(() => readCartForKey(storageKey));

    const applyRemoteItem = useCallback((dto: CartItemDto) => {
        const remoteItem = mapCartItemDtoToCartItem(dto);
        if (!remoteItem) return;
        setItems((current) => {
            const key = cartItemKey(remoteItem.code, remoteItem.mensaje);
            const next = [...current];
            const idx = next.findIndex((it) => cartItemKey(it.code, it.mensaje) === key);
            if (idx >= 0) {
                next[idx] = { ...next[idx], ...remoteItem };
            } else {
                next.push(remoteItem);
            }
            try { writeCartForKey(storageKey, next); } catch {};
            return next;
        });
    }, [storageKey]);

    const syncItemWithServer = useCallback(async (code: string, mensaje?: string) => {
        if (!user?.run) return;
        const targetKey = cartItemKey(code, mensaje);
        const latest = readCartForKey(storageKey);
        const target = latest.find((it) => cartItemKey(it.code, it.mensaje) === targetKey);
        if (!target) return;
        const qty = Math.max(0, target.cantidad || 0);
        if (qty <= 0) {
            if (target.serverItemId) {
                await removeCartItem(user.run, target.serverItemId);
            }
            return;
        }
        const payload = { qty, mensaje: target.mensaje };
        let remote: CartItemDto | null = null;
        if (target.serverItemId) {
            remote = await updateCartItem(user.run, target.serverItemId, payload);
        } else {
            remote = await addCartItem(user.run, { productId: target.productId || target.code, qty, mensaje: target.mensaje });
        }
        if (remote) {
            applyRemoteItem(remote);
        }
    }, [storageKey, user?.run, applyRemoteItem]);

    const count = useMemo(() => items.reduce((s, it) => s + (it.cantidad || 0), 0), [items]);

    useEffect(() => {
        const prevKey = prevKeyRef.current;
        if (!prevKey) {
            prevKeyRef.current = storageKey;
            return;
        }
        if (prevKey === storageKey) return;

        const prevCart = readCartForKey(prevKey);
        const newCart = readCartForKey(storageKey);

        const prevIsGuest = prevKey.endsWith("_guest");
        const newIsGuest = storageKey.endsWith("_guest");

        if (prevIsGuest && !newIsGuest) {
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
            writeCartForKey(prevKey, []);
            setItems(merged);
        } else if (!prevIsGuest && newIsGuest) {
            writeCartForKey(storageKey, []);
            setItems([]);
        } else {
            setItems(newCart || []);
        }
        prevKeyRef.current = storageKey;
    }, [storageKey]);

    useEffect(() => {
        if (!user?.run) return;
        let active = true;
        (async () => {
            const remoteCart = await fetchCart(user.run);
            if (!active || !remoteCart?.items) return;
            remoteCart.items.forEach(applyRemoteItem);
            const stored = readCartForKey(storageKey);
            for (const entry of stored) {
                if (!entry.serverItemId) {
                    await syncItemWithServer(entry.code, entry.mensaje);
                }
            }
        })();
        return () => { active = false; };
    }, [storageKey, user?.run, applyRemoteItem, syncItemWithServer]);

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
        void syncItemWithServer(item.code, item.mensaje);
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
        if (toAdd > 0) void syncItemWithServer(item.code, item.mensaje);
        return toAdd;
    }

    function remove(code: string, mensaje?: string) {
        const existing = items.find((c) => c.code === code && normalizeMessage(c.mensaje) === normalizeMessage(mensaje));
        const serverId = existing?.serverItemId;
        setItems((cur) => {
            const next = cur.filter((c) => !(c.code === code && (c.mensaje || "") === (mensaje || "")));
            try { writeCartForKey(storageKey, next); } catch {};
            return next;
        });
        if (serverId && user?.run) {
            void removeCartItem(user.run, serverId);
        }
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
            void syncItemWithServer(code, mensaje);
            return 0;
        }

        if (targetQty === existingQty) {
            return existingQty;
        }

        const next = items.map((c, idx) => (idx === index ? { ...c, cantidad: targetQty } : c));
        try { writeCartForKey(storageKey, next); } catch {};
        setItems(next);
        void syncItemWithServer(code, mensaje);
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

        try { writeCartForKey(storageKey, next); } catch {};
        setItems(next);
        const messagesToSync = new Set<string | undefined>();
        for (let i = 0; i < canAdd; i++) {
            const raw = messages[i] ?? "";
            const trimmed = String(raw).trim();
            const message: string | undefined = trimmed.length > 0 ? trimmed : undefined;
            messagesToSync.add(message);
        }
        messagesToSync.forEach((msg) => void syncItemWithServer(code, msg));
        return canAdd;
    }

    function clear() {
        const serverIds = items.map((it) => it.serverItemId).filter(Boolean) as string[];
        setItems(() => {
            const next: CartItem[] = [];
            try { writeCartForKey(storageKey, next); } catch {};
            return next;
        });
        if (serverIds.length > 0 && user?.run) {
            serverIds.forEach((id) => void removeCartItem(user.run, id));
        }
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
