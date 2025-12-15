import httpClient from "./httpClient.ts";
import type { Product } from "../types/product";

export type ProductoDto = {
    codigo_producto?: string;
    codigoProducto: string;
    nombre_producto?: string;
    nombreProducto: string;
    precio_producto?: number;
    precioProducto: number;
    imagen_producto?: string;
    imagenProducto?: string;
    "descripción_producto"?: string;
    descripcionProducto?: string;
    categoria?: string;
    stock?: number;
    stock_critico?: number;
    stockCritico?: number;
    categoria_id?: number;
    categoriaId?: number;
    nombre_categoria?: string;
    categoriaNombre?: string;
    capacidadDiaria?: number;
};

function normalizeNumber(value: unknown): number | undefined {
    if (value == null || value === "") return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
}

export function dtoToProduct(dto: ProductoDto): Product {
    const accentDesc = dto["descripción_producto"] ?? dto.descripcionProducto ?? (dto as any).descripcion;
    const code = String(dto.codigoProducto || dto.codigo_producto || "").trim();
    const categoriaNombre = dto.categoriaNombre || dto.nombre_categoria || "";
    // Generar slug desde categoriaNombre para la categoría
    const categorySlug = categoriaNombre 
        ? categoriaNombre.toLowerCase().replace(/[\s&]+/g, "-").replace(/[^a-z0-9-]/g, "")
        : (dto.categoria || "").trim();
    
    return {
        code,
        productName: String(dto.nombreProducto || dto.nombre_producto || code || "").trim(),
        price: normalizeNumber(dto.precioProducto ?? dto.precio_producto) ?? 0,
        img: String(dto.imagenProducto || dto.imagen_producto || ""),
        category: categorySlug,
        desc: accentDesc ? String(accentDesc) : undefined,
        stock: normalizeNumber(dto.stock),
        stockCritico: normalizeNumber(dto.stockCritico ?? dto.stock_critico),
        capacidadDiaria: normalizeNumber(dto.capacidadDiaria),
        categoryId: normalizeNumber(dto.categoriaId ?? dto.categoria_id),
        categoriaId: normalizeNumber(dto.categoriaId ?? dto.categoria_id),
        categoryLabel: categoriaNombre || categorySlug,
        nombreCategoria: categoriaNombre || categorySlug,
    };
}

export function productToDto(product: Product | Partial<Product>): ProductoDto {
    return {
        codigoProducto: String(product.code || "").trim(),
        nombreProducto: String(product.productName || product.code || "").trim(),
        precioProducto: normalizeNumber(product.price) ?? 0,
        imagenProducto: String(product.img || "").trim(),
        descripcionProducto: product.desc ? String(product.desc) : undefined,
        stock: normalizeNumber(product.stock),
        stockCritico: normalizeNumber(product.stockCritico),
        categoriaId: normalizeNumber(product.categoryId ?? product.categoriaId),
        categoriaNombre: product.categoryLabel || product.nombreCategoria ? String(product.categoryLabel || product.nombreCategoria) : undefined,
    };
}

export async function fetchAllProducts(): Promise<ProductoDto[]> {
    try {
        const response = await httpClient.get("/api/productos");
        return (response.data || []) as ProductoDto[];
    } catch (error: any) {
        // 404 Not Found - no products available
        // Return empty array for 404 to allow fallback to seedProducts
        if (error?.response?.status === 404) {
            console.warn("Products endpoint returned 404, using fallback");
            return [];
        }
        // 403 Forbidden, 401 Unauthorized, or other errors should be re-thrown
        // These indicate a real problem that should be visible
        throw error;
    }
}

export async function fetchProductByCode(codigo: string): Promise<ProductoDto | null> {
    try {
        const response = await httpClient.get(`/api/productos/${encodeURIComponent(codigo)}`);
        return (response.data || null) as ProductoDto | null;
    } catch (error) {
        console.error("Error fetching product by code:", error);
        return null;
    }
}

export async function createProduct(payload: ProductoDto): Promise<ProductoDto> {
    const response = await httpClient.post("/api/productos", payload);
    return (response.data || payload) as ProductoDto;
}

export async function updateProduct(codigo: string, payload: ProductoDto): Promise<ProductoDto> {
    const response = await httpClient.put(`/api/productos/${encodeURIComponent(codigo)}`, payload);
    return (response.data || payload) as ProductoDto;
}

export async function deleteProduct(codigo: string): Promise<void> {
    await httpClient.delete(`/api/productos/${encodeURIComponent(codigo)}`);
}
