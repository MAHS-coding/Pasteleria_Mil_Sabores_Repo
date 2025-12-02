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
    run?: string;
    correo?: string;
    total: number;
    fechaEntrega: string;
    direccionEntrega: string;
    paymentMethodId?: string;
    paymentMethod?: string;
    items: OrderItemRequest[];
    discounts?: OrderDiscounts;
    estado?: string;
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
    id?: string;
    pedidoId?: string;
    tsISO?: string;
    fechaPedido?: string;
    usuarioCorreo?: string;
    total?: number;
    items?: OrderItemSummaryDto[];
    estado?: string;
    status?: string;
    createdAt?: string;
    deliveryAddress?: string;
    freeCakeApplied?: boolean;
    freeCakeAmount?: number;
    discountAppliedPercent?: number;
    lifetimeDiscountAppliedPercent?: number;
    subtotal?: number;
    discountAmount?: number;
    purchaserRun?: string;
    purchaserNombre?: string;
    purchaserApellidos?: string;
    purchaserCorreo?: string;
    purchaserTelefono?: string;
    freeCakeTortaKey?: string;
    discounts?: OrderDiscounts;
    totalSinDescuento?: number;
    totalConDescuento?: number;
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
