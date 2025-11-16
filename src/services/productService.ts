import catalogData from "../data/products/productos.json";
import type { Catalog, Category, CatalogProduct } from "../types/product";

// Lightweight product service that reads from the local JSON catalog.
// Keeps logic centralized so components can import these helpers instead of reading JSON directly.

export function getCatalog(): Catalog {
    return catalogData as unknown as Catalog;
}

export function getCategories(): Category[] {
    return getCatalog().categorias || [];
}

export function getAllProducts(): CatalogProduct[] {
    return getCategories().flatMap(c => c.productos || []);
}

export function findProductByCode(code?: string): CatalogProduct | undefined {
    if (!code) return undefined;
    const normalized = String(code).trim();
    return getAllProducts().find(p => String(p.codigo_producto) === normalized || String(p.nombre_producto).toLowerCase() === normalized.toLowerCase());
}

export function searchProducts(q?: string): CatalogProduct[] {
    if (!q) return getAllProducts();
    const s = String(q).trim().toLowerCase();
    return getAllProducts().filter(p => (p.nombre_producto || "").toLowerCase().includes(s) || (p.descripción_producto || "").toLowerCase().includes(s));
}

export default { getCatalog, getCategories, getAllProducts, findProductByCode, searchProducts };
