import httpClient from "./httpClient.ts";
import slugify from "../utils/slugify";

export type CategoriaDto = {
    id?: number | string;
    nombre_categoria?: string;
    nombreCategoria?: string;
    nombre?: string;
    slug?: string;
};

export type CategoryOption = {
    id?: number | string;
    slug: string;
    label: string;
};

function dtoToCategoryOption(dto: CategoriaDto): CategoryOption {
    const rawLabel = String(dto.nombre_categoria || dto.nombreCategoria || dto.nombre || dto.slug || `categoria-${dto.id || 'sin-id'}`).trim();
    const label = rawLabel || `categoria-${dto.id || 'sin-id'}`;
    let slug = String(dto.slug || "").trim();
    if (!slug) {
        slug = slugify(label);
    }
    if (!slug) {
        slug = `categoria-${dto.id || 'sin-id'}`;
    }
    return {
        id: dto.id,
        slug,
        label,
    };
}

export async function fetchAllCategories(): Promise<CategoryOption[]> {
    const response = await httpClient.get("/api/categorias");
    const payload = response.data as any;
    const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.categorias)
            ? payload.categorias
            : [];
    return items.map(dtoToCategoryOption);
}
