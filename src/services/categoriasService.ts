import httpClient from "./httpClient.ts";
import slugify from "../utils/slugify";

export type CategoriaDto = {
    id?: number | string;
    nombre_categoria?: string;
    nombreCategoria?: string;
    nombre?: string;
    slug?: string;
    categoria_id?: number;
    categoriaNombre?: string;
};

export type CategoryOption = {
    id?: number | string;
    slug: string;
    label: string;
};

function dtoToCategoryOption(dto: CategoriaDto): CategoryOption {
    const rawLabel = String(
        dto.nombre_categoria || 
        dto.nombreCategoria || 
        dto.categoriaNombre || 
        dto.nombre || 
        dto.slug || 
        `categoria-${dto.id || dto.categoria_id || 'sin-id'}`
    ).trim();
    const label = rawLabel || `categoria-${dto.id || dto.categoria_id || 'sin-id'}`;
    let slug = String(dto.slug || "").trim();
    if (!slug) {
        slug = slugify(label);
    }
    if (!slug) {
        slug = `categoria-${dto.id || dto.categoria_id || 'sin-id'}`;
    }
    return {
        id: dto.id || dto.categoria_id || (dto as any).idCategoria || (dto as any).id_categoria,
        slug,
        label,
    };
}

export async function fetchAllCategories(): Promise<CategoryOption[]> {
    try {
        const response = await httpClient.get("/api/categorias");
        const payload = response.data as any;
        
        // Handle different response structures
        let items = [];
        if (Array.isArray(payload)) {
            items = payload;
        } else if (payload && typeof payload === 'object') {
            items = Array.isArray(payload.categorias) 
                ? payload.categorias 
                : Array.isArray(payload.data)
                ? payload.data
                : [];
        }
        
        if (!items || items.length === 0) {
            console.warn("fetchAllCategories: No se recibieron categorías del backend, usando categorías por defecto");
            return getDefaultCategories();
        }
        
        return items.map(dtoToCategoryOption);
    } catch (error) {
        console.error("Error fetching categories from backend:", error);
        // Return default categories as fallback
        return getDefaultCategories();
    }
}

export async function createCategoria(nombre: string): Promise<CategoryOption> {
    const payload = { nombreCategoria: String(nombre || "").trim() };
    const response = await httpClient.post("/api/categorias", payload);
    const dto = (response.data || payload) as CategoriaDto;
    return dtoToCategoryOption(dto);
}

function getDefaultCategories(): CategoryOption[] {
    return [
        { id: 1, slug: 'tortas', label: 'Tortas' },
        { id: 2, slug: 'pasteleria-tradicional', label: 'Pastelería Tradicional' },
        { id: 3, slug: 'postres-individuales', label: 'Postres Individuales' },
        { id: 4, slug: 'productos-sin-gluten', label: 'Productos sin Gluten' },
        { id: 5, slug: 'productos-sin-azucar', label: 'Productos sin Azúcar' },
        { id: 6, slug: 'productos-veganos', label: 'Productos Veganos' },
    ];
}
