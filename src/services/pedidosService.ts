import httpClient from "./httpClient.ts";

export type OrderDiscounts = {
    agePercent?: number;
    codePercent?: number;
    ageDiscountMoney?: number;
    codeDiscountMoney?: number;
    discountPercentMoney?: number;
    freeCakeApplied?: boolean;
    freeCakeMoney?: number;
    freeCakeTortaKey?: string | null;
    totalDiscountMoney?: number;
};

export type OrderItemRequest = {
    productoCodigo: string;
    cantidad: number;
    mensaje?: string;
    precioUnitario?: number;
};

export type OrderRequest = {
    // Backend expects these names
    userRun?: string;
    purchaserCorreo?: string;
    total: number;
    subtotal?: number;
    shippingCost?: number;
    freeCakeAmount?: number;
    discountAmount?: number;
    fechaEntrega: string;
    deliveryAddress: string;
    applyDiscounts?: boolean;
    applyFreeCakeCoupon?: boolean;
    paymentMethodId?: string;
    paymentMethod?: string;
    items: OrderItemRequest[];
    discounts?: OrderDiscounts;
    estado?: string;
    // Payment metadata (frontend sends these for card association)
    cardId?: string;
    cardLastFour?: string;
    cardBrand?: string;
    paymentLastFour?: string;
    paymentBrand?: string;
};

export type OrderItemSummaryDto = {
    productoCodigo?: string;
    cantidad?: number;
    precioUnitario?: number;
    mensaje?: string;
    precio?: number;
    qty?: number;
    price?: number;
    productCode?: string;
};

export type OrderResponse = {
    pedidoId?: string;
    subtotal?: number;
    shippingCost?: number;
    freeCakeAmount?: number;
    discountPercentApplied?: number;
    lifetimeDiscountPercentApplied?: number;
    discountAmount?: number;
    total?: number;
    items?: any[];
    cardId?: string;
    cardLastFour?: string;
    cardBrand?: string;
    freeCakeAvailable?: boolean;
    freeCakeSuggestedProducts?: string[];
    // Legacy/alternative field names for backwards compatibility
    id?: string;
    tsISO?: string;
    createdAt?: string;
    fechaPedido?: string;
    usuarioCorreo?: string;
    purchaserCorreo?: string;
    purchaserRun?: string;
    purchaserNombre?: string;
    purchaserApellidos?: string;
    purchaserTelefono?: string;
    deliveryAddress?: string;
    estado?: string;
    status?: string;
    freeCakeApplied?: boolean;
    discountAppliedPercent?: number;
    lifetimeDiscountAppliedPercent?: number;
    totalSinDescuento?: number;
    totalConDescuento?: number;
    freeCakeTortaKey?: string;
    discounts?: OrderDiscounts;
};

export async function createOrder(payload: OrderRequest): Promise<OrderResponse> {
    const response = await httpClient.post("/api/pedidos", payload);
    return (response.data || {}) as OrderResponse;
}

export async function fetchOrders(): Promise<OrderResponse[]> {
    const response = await httpClient.get("/api/pedidos");
    return (response.data || []) as OrderResponse[];
}

export async function fetchAdminOrders(): Promise<OrderResponse[]> {
    const response = await httpClient.get("/api/pedidos/admin");
    return (response.data || []) as OrderResponse[];
}
