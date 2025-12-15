import httpClient from "./httpClient.ts";

export type CartItemDto = {
    id: string;
    productoCodigo?: string;
    cantidad?: number;
    precioUnitario?: number;
    precioTotal?: number;
    mensaje?: string;
};

export type CartDto = {
    items: CartItemDto[];
    total?: number;
};

export async function fetchCart(run: string): Promise<CartDto | null> {
    if (!run) return null;
    try {
        const response = await httpClient.get(`/api/users/${encodeURIComponent(run)}/cart`);
        return (response.data || null) as CartDto;
    } catch (error) {
        return null;
    }
}

export async function addCartItem(run: string, payload: { productId: string; qty: number; mensaje?: string }): Promise<CartItemDto | null> {
    if (!run) return null;
    try {
        const mapped = {
            productoCodigo: payload.productId,
            cantidad: payload.qty,
            mensaje: payload.mensaje,
        };
        const response = await httpClient.post(`/api/users/${encodeURIComponent(run)}/cart/items`, mapped);
        return (response.data || null) as CartItemDto;
    } catch (error) {
        return null;
    }
}

export async function updateCartItem(run: string, itemId: string, payload: { qty: number; mensaje?: string }): Promise<CartItemDto | null> {
    if (!run || !itemId) return null;
    try {
        const mapped = { cantidad: payload.qty, mensaje: payload.mensaje };
        const response = await httpClient.put(`/api/users/${encodeURIComponent(run)}/cart/items/${encodeURIComponent(itemId)}`, mapped);
        return (response.data || null) as CartItemDto;
    } catch (error) {
        return null;
    }
}

export async function removeCartItem(run: string, itemId: string): Promise<boolean> {
    if (!run || !itemId) return false;
    try {
        await httpClient.delete(`/api/users/${encodeURIComponent(run)}/cart/items/${encodeURIComponent(itemId)}`);
        return true;
    } catch (error) {
        return false;
    }
}
export async function clearCart(run: string): Promise<boolean> {
    if (!run) return false;
    // Try bulk delete and suppress axios throw on non-2xx
    const bulkResp = await httpClient.delete(`/api/users/${encodeURIComponent(run)}/cart/items`, {
        validateStatus: () => true,
    });
    if (bulkResp.status >= 200 && bulkResp.status < 300) {
        return true;
    }
    // Fallback: delete items individually if bulk not allowed
    try {
        const cart = await fetchCart(run);
        const items = cart?.items || [];
        let ok = true;
        for (const it of items) {
            const done = await removeCartItem(run, it.id);
            ok = ok && done;
        }
        return ok;
    } catch {
        return false;
    }
}