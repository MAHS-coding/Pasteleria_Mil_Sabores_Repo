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
