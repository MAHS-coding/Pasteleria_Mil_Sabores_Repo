import catalogData from "../data/products/productos.json";
import type { Catalog, Category, CatalogProduct } from "../types/product";
import apiClient from "@/config/axiosConfig";

// If Vite env `VITE_API_BASE` is set, the service will try to use remote
// product-service endpoints (with JWT support). Otherwise it falls back to
// the local JSON editorial copy so the UI keeps working without the backend.

function localCatalog(): Catalog {
    return catalogData as unknown as Catalog;
}

export async function getCatalog(): Promise<Catalog> {
    if (!apiClient.hasApi()) return localCatalog();
    try {
        const products = await apiClient.request('/api/products');
        // normalize to frontend catalog shape: a single category 'Todos'
        const cat: Category = { nombre: 'Todos', productos: products } as any;
        return { categorias: [cat] } as any;
    } catch (e) {
        console.warn('Remote products failed, falling back to local:', e);
        return localCatalog();
    }
}

export async function getCategories(): Promise<Category[]> {
    const c = await getCatalog();
    return c.categorias || [];
}

export async function getAllProducts(): Promise<CatalogProduct[]> {
    const cats = await getCategories();
    return cats.flatMap(c => (c.productos as CatalogProduct[]) || []);
}

export async function findProductByCode(code?: string): Promise<CatalogProduct | undefined> {
    if (!code) return undefined;
    const normalized = String(code).trim();
    const all = await getAllProducts();
    return all.find(p => String((p as any).codigo_producto) === normalized || String((p as any).nombre_producto).toLowerCase() === normalized.toLowerCase());
}

export async function searchProducts(q?: string): Promise<CatalogProduct[]> {
    const all = await getAllProducts();
    if (!q) return all;
    const s = String(q).trim().toLowerCase();
    return all.filter(p => (String((p as any).nombre_producto || "").toLowerCase().includes(s) || String((p as any)['descripción_producto'] || "").toLowerCase().includes(s)));
}

// Backwards-compatible synchronous helpers that use the local JSON.
export function getCatalogSync(): Catalog { return localCatalog(); }
export function getCategoriesSync(): Category[] { return getCatalogSync().categorias || []; }
export function getAllProductsSync(): CatalogProduct[] { return getCategoriesSync().flatMap(c => c.productos || []); }
export function findProductByCodeSync(code?: string): CatalogProduct | undefined {
    if (!code) return undefined;
    const normalized = String(code).trim();
    return getAllProductsSync().find(p => String((p as any).codigo_producto) === normalized || String((p as any).nombre_producto).toLowerCase() === normalized.toLowerCase());
}
export function searchProductsSync(q?: string): CatalogProduct[] {
    if (!q) return getAllProductsSync();
    const s = String(q).trim().toLowerCase();
    return getAllProductsSync().filter(p => (String((p as any).nombre_producto || "").toLowerCase().includes(s) || String((p as any)['descripción_producto'] || "").toLowerCase().includes(s)));
}

export default { getCatalog, getCategories, getAllProducts, findProductByCode, searchProducts, getCatalogSync, getCategoriesSync, getAllProductsSync, findProductByCodeSync, searchProductsSync };
