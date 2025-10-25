import type { Product } from "../types/product";

export const defaultStock = (p: any): Product => ({
    ...p,
    stock: Number.isFinite(p.stock) ? p.stock : 10,
    stockCritico: Number.isFinite(p.stockCritico) ? p.stockCritico : 5,
    capacidadDiaria: Number.isFinite(p.capacidadDiaria) ? p.capacidadDiaria : 20,
});

import { getJSON, setJSON } from './storage';

export function initCatalog(seedProducts: Product[], key = "catalogo"): Product[] {
    try {
        let cat = getJSON<Product[] | null>(key) || null;
        if (!Array.isArray(cat) || cat.length === 0) {
            const seed = Array.isArray(seedProducts) ? seedProducts : [];
            cat = seed.map(defaultStock);
            setJSON(key, cat);
        } else {
            cat = cat.map(defaultStock);
            setJSON(key, cat);
        }
        return cat;
    } catch {
        return Array.isArray(seedProducts) ? seedProducts.map(defaultStock) : [];
    }
}

export function mapSegmentToId(s?: string): string {
    if (!s) return "*";
    switch (s) {
        case "sin-azucar":
            return "productos-sin-azucar";
        case "sin-gluten":
            return "productos-sin-gluten";
        case "veganos":
            return "productos-veganos";
        case "tradicional":
            return "pasteleria-tradicional";
        case "especiales":
            return "tortas-especiales";
        case "todos":
            return "*";
        default:
            return s;
    }
}

export function mapIdToSegment(id?: string): string {
    if (!id || id === "*") return "";
    switch (id) {
        case "productos-sin-azucar":
            return "sin-azucar";
        case "productos-sin-gluten":
            return "sin-gluten";
        case "productos-veganos":
            return "veganos";
        case "pasteleria-tradicional":
            return "tradicional";
        case "tortas-especiales":
            return "especiales";
        default:
            return id;
    }
}

export function filterProducts(products: Product[] | undefined, filter?: string): Product[] {
    if (!filter || filter === "*") return products ? products : [];
    return (products || []).filter((p) => p.category === filter);
}

export function sortProducts(products: Product[] | undefined, sort?: string): Product[] {
    const copy = Array.isArray(products) ? [...products] : [];
    if (sort === "price-asc") copy.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === "price-desc") copy.sort((a, b) => (b.price || 0) - (a.price || 0));
    return copy;
}

export function getRelatedProducts(producto: Product | null, seedProducts: Product[], key = "catalogo", count = 4): Product[] {
    if (!producto) return [];
    const fuente = getJSON<Product[] | null>(key) || seedProducts;
    const others = (fuente || []).filter((p: Product) => p.code !== producto.code);
    for (let i = others.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j], others[i]];
    }
    return others.slice(0, count);
}

export const personalizables = ["TC001", "TE001", "TE002"];
export function isPersonalizable(code?: string) { return !!code && personalizables.includes(code); }

export function readCatalog(key = "catalogo"): Product[] | null {
    try {
        const parsed = getJSON<Product[]>(key || "catalogo");
        return Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

export function getProductByCode(code?: string | null, seedProducts: Product[] = [], key = "catalogo"): Product | undefined {
    if (!code) return undefined;
    const cat = readCatalog(key) || seedProducts;
    return (cat || []).find((p) => p.code === code);
}

export default {
    defaultStock,
    initCatalog,
    mapSegmentToId,
    mapIdToSegment,
    filterProducts,
    sortProducts,
    getRelatedProducts,
    personalizables,
    isPersonalizable,
};
