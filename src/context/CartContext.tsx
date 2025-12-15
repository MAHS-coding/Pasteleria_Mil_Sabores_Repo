import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { getProductByCode } from "../utils/products";
import { products as seedProducts } from "../utils/dataLoaders";
import { addCartItem, fetchCart, removeCartItem, updateCartItem } from "../services/cartService";
import type { CartItemDto } from "../services/cartService";

// Cart is now fully server-backed; localStorage no longer used

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

// Cart is now fully server-backed; localStorage functions removed

function normalizeMessage(msg?: string | null) {
    return msg ?? "";
}

const STOCK_UNLIMITED = Number.POSITIVE_INFINITY;

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

function mapCartItemDtoToCartItem(dto: CartItemDto) {
    if (!dto || !dto.productoCodigo) return null;
    const code = dto.productoCodigo;
    const cantidad = typeof dto.cantidad === "number" ? dto.cantidad : 0;
    const product = getProductByCode(code, seedProducts);
    return {
        code,
        productId: code,
        productName: product?.productName || code,
        price: typeof dto.precioUnitario === "number" ? dto.precioUnitario : undefined,
        img: product?.img,
        cantidad,
        mensaje: dto.mensaje,
        serverItemId: dto.id,
    } as CartItem;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);

    const applyRemoteItem = useCallback((dto: CartItemDto) => {
        const remoteItem = mapCartItemDtoToCartItem(dto);
        if (!remoteItem) return;
        setItems((current) => {
            const key = cartItemKey(remoteItem.code, remoteItem.mensaje);
            const next = [...current];
            const idx = next.findIndex((it) => cartItemKey(it.code, it.mensaje) === key);
            if (idx >= 0) {
                // Preserve client-side properties like img, productName if not from server
                next[idx] = { ...next[idx], ...remoteItem, img: remoteItem.img || next[idx].img, productName: remoteItem.productName || next[idx].productName };
            } else {
                next.push(remoteItem);
            }
            return next;
        });
    }, []);

    const [pendingSync, setPendingSync] = useState<Set<string>>(new Set());

    const syncItemWithServer = useCallback((code: string, mensaje?: string) => {
        const key = cartItemKey(code, mensaje);
        setPendingSync((prev) => new Set(prev).add(key));
    }, []);

    // Separate effect to handle async sync with server
    useEffect(() => {
        if (!user?.run || pendingSync.size === 0) return;
        
        const userRun = user.run;
        const syncKeys = Array.from(pendingSync);
        
        (async () => {
            for (const key of syncKeys) {
                const target = items.find((it) => cartItemKey(it.code, it.mensaje) === key);
                if (!target) {
                    setPendingSync((prev) => {
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    });
                    continue;
                }
                
                const qty = Math.max(0, target.cantidad || 0);
                if (qty <= 0) {
                    if (target.serverItemId) {
                        await removeCartItem(userRun, target.serverItemId);
                    }
                    setPendingSync((prev) => {
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    });
                    continue;
                }
                
                const payload = { qty, mensaje: target.mensaje };
                let remote: CartItemDto | null = null;
                if (target.serverItemId) {
                    remote = await updateCartItem(userRun, target.serverItemId, payload);
                } else {
                    remote = await addCartItem(userRun, { productId: target.productId || target.code, qty, mensaje: target.mensaje });
                }
                
                if (remote) {
                    applyRemoteItem(remote);
                }
                
                setPendingSync((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            }
        })();
    }, [user?.run, items, pendingSync, applyRemoteItem]);

    const count = useMemo(() => items.reduce((s, it) => s + (it.cantidad || 0), 0), [items]);

    // Load cart from server on mount or user change
    useEffect(() => {
        if (!user?.run) {
            setItems([]);
            return;
        }
        const userRun = user.run;
        let active = true;
        (async () => {
            const remoteCart = await fetchCart(userRun);
            if (!active) return;
            if (remoteCart?.items) {
                const cartItems = remoteCart.items
                    .map(mapCartItemDtoToCartItem)
                    .filter((item): item is CartItem => item !== null);
                setItems(cartItems);
            }
        })();
        return () => { active = false; };
    }, [user?.run]);

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
        setItems(next);
        if (toAdd > 0) void syncItemWithServer(item.code, item.mensaje);
        return toAdd;
    }

    function remove(code: string, mensaje?: string) {
        const existing = items.find((c) => c.code === code && normalizeMessage(c.mensaje) === normalizeMessage(mensaje));
        const serverId = existing?.serverItemId;
        setItems((cur) => {
            return cur.filter((c) => !(c.code === code && (c.mensaje || "") === (mensaje || "")));
        });
        if (serverId && user?.run) {
            const userRun = user.run;
            void removeCartItem(userRun, serverId);
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
            setItems(next);
            void syncItemWithServer(code, mensaje);
            return 0;
        }

        if (targetQty === existingQty) {
            return existingQty;
        }

        const next = items.map((c, idx) => (idx === index ? { ...c, cantidad: targetQty } : c));
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
        setItems([]);
        if (serverIds.length > 0 && user?.run) {
            const userRun = user.run;
            serverIds.forEach((id) => void removeCartItem(userRun, id));
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
