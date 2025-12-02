import httpClient from "./httpClient.ts";
import type { Product } from "../types/product";

export type ProductoDto = {
    codigo_producto: string;
    nombre_producto: string;
    precio_producto: number;
    imagen_producto?: string;
    "descripción_producto"?: string;
    categoria?: string;
    stock?: number;
    stock_critico?: number;
    categoria_id?: number;
    nombre_categoria?: string;
    capacidadDiaria?: number;
};

function normalizeNumber(value: unknown): number | undefined {
    if (value == null || value === "") return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
}

export function dtoToProduct(dto: ProductoDto): Product {
    const accentDesc = dto["descripción_producto"] ?? (dto as any).descripcion;
    return {
        code: String(dto.codigo_producto || "").trim(),
        productName: String(dto.nombre_producto || dto.codigo_producto || "").trim(),
        price: normalizeNumber(dto.precio_producto) ?? 0,
        img: String(dto.imagen_producto || ""),
        category: String(dto.categoria || "").trim(),
        desc: accentDesc ? String(accentDesc) : undefined,
        stock: normalizeNumber(dto.stock),
        stockCritico: normalizeNumber(dto.stock_critico),
        capacidadDiaria: normalizeNumber(dto.capacidadDiaria),
        categoryId: normalizeNumber(dto.categoria_id),
        categoriaId: normalizeNumber(dto.categoria_id),
        categoryLabel: dto.nombre_categoria ? String(dto.nombre_categoria) : undefined,
        nombreCategoria: dto.nombre_categoria ? String(dto.nombre_categoria) : undefined,
    };
}

export function productToDto(product: Product | Partial<Product>): ProductoDto {
    return {
        codigo_producto: String(product.code || "").trim(),
        nombre_producto: String(product.productName || product.code || "").trim(),
        precio_producto: normalizeNumber(product.price) ?? 0,
        categoria: String(product.category || "").trim(),
        imagen_producto: String(product.img || "").trim(),
        "descripción_producto": product.desc ? String(product.desc) : undefined,
        stock: normalizeNumber(product.stock),
        stock_critico: normalizeNumber(product.stockCritico),
        categoria_id: normalizeNumber(product.categoryId ?? product.categoriaId),
        nombre_categoria: product.categoryLabel || product.nombreCategoria ? String(product.categoryLabel || product.nombreCategoria) : undefined,
        capacidadDiaria: normalizeNumber(product.capacidadDiaria),
    };
}

export async function fetchAllProducts(): Promise<ProductoDto[]> {
    const response = await httpClient.get("/api/productos");
    return (response.data || []) as ProductoDto[];
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
