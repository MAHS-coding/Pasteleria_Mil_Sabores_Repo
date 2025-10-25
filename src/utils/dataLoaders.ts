import catalogData from "../data/products/productos.json";
import regionesRaw from "../data/regionesComunas/regionesComunas.json";
import slugify from "./slugify";
import type { Product, Category, Catalog } from "../types/product";
import type { Region, Comuna, RegionWithComunas } from "../types/region";

// --- Products ---
const flatProducts: Product[] = [];
for (const cat of (catalogData as any).categorias || []) {
    const categorySlug = slugify(cat.nombre_categoria || "sin-categoria");
    for (const prod of cat.productos || []) {
        flatProducts.push({
            code: prod.codigo_producto,
            productName: prod.nombre_producto,
            price: prod.precio_producto,
            img: prod.imagen_producto,
            category: categorySlug,
            desc: prod["descripción_producto"] || prod.descripcion_producto,
            stock: prod.stock,
            stockCritico: prod.stock_critico,
        } as Product);
    }
}

export const products: Product[] = flatProducts;

export const catalog: Catalog = {
    nombre_pasteleria: "Pasteleria Mil Sabores",
    categorias: [],
};

const categoryMap: Record<string, Category> = {};
let nextCategoryId = 1;
for (const p of products) {
    const catKey = p.category || "sin-categoria";
    if (!categoryMap[catKey]) {
        categoryMap[catKey] = {
            id_categoria: nextCategoryId++,
            nombre_categoria: catKey.replace(/-/g, " "),
            productos: [],
        } as Category;
    }

    categoryMap[catKey].productos.push({
        codigo_producto: p.code,
        nombre_producto: p.productName,
        precio_producto: p.price,
        descripción_producto: p.desc,
        imagen_producto: p.img,
        stock: p.stock,
        stock_critico: p.stockCritico,
    });
}

catalog.categorias = Object.values(categoryMap);

// --- Regiones / Comunas ---
const rawRegions: any[] = regionesRaw as any;

export const regions: RegionWithComunas[] = rawRegions.map((r) => {
    const regionName: string = r.region || String(r.nombre || "");
    const regionId: string = String(r.id ?? regionName);
    const regionSlug = slugify(regionName || `region-${regionId}`);

    const comunas: Comuna[] = (r.comunas || []).map((c: string) => {
        const comunaName = String(c);
        const comunaSlug = slugify(comunaName);
        return {
            id: `${regionSlug}-${comunaSlug}`,
            name: comunaName,
            slug: comunaSlug,
            regionId,
            regionSlug,
        } as Comuna;
    });

    return {
        id: regionId,
        name: regionName,
        slug: regionSlug,
        comunas,
    } as RegionWithComunas;
});

export const comunas: Comuna[] = regions.flatMap((r) => r.comunas);

export const comunasByRegionSlug: Record<string, Comuna[]> = {};
for (const r of regions) comunasByRegionSlug[r.slug] = r.comunas;

export function getRegionBySlug(slug: string): Region | undefined {
    return regions.find((r) => r.slug === slug);
}

export function getComunasByRegionSlug(slug: string): Comuna[] {
    return comunasByRegionSlug[slug] || [];
}

export default {
    products,
    catalog,
    regions,
    comunas,
    comunasByRegionSlug,
    getRegionBySlug,
    getComunasByRegionSlug,
};
