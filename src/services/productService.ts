import catalog from "../data/products/productos.json";

type Catalog = typeof catalog;
type RawCategory = Catalog["categorias"][number];
type RawProduct = RawCategory["productos"][number];

type NormalizedProduct = RawProduct & {
    categoria?: string;
    id_categoria?: number;
    nombre_categoria?: string;
};

const products: NormalizedProduct[] = (catalog?.categorias ?? []).flatMap((categoria) => {
    const safeProducts = Array.isArray(categoria.productos) ? categoria.productos : [];
    return safeProducts.map((producto) => ({
        ...producto,
        categoria: categoria.nombre_categoria,
        nombre_categoria: categoria.nombre_categoria,
        id_categoria: categoria.id_categoria,
    }));
});

function normalizeQuery(value: string) {
    return value.trim().toLowerCase();
}

export async function getAllProducts(): Promise<NormalizedProduct[]> {
    return products;
}

export async function findProductByCode(code: string): Promise<NormalizedProduct | undefined> {
    if (!code) return undefined;
    const normalized = code.trim().toLowerCase();
    return products.find((producto) => String(producto.codigo_producto || "").trim().toLowerCase() === normalized);
}

export async function searchProducts(query: string): Promise<NormalizedProduct[]> {
    const normalized = normalizeQuery(query || "");
    if (!normalized) return products;
    return products.filter((producto) => {
        const fields = [
            producto.nombre_producto,
            producto["descripción_producto"],
            (producto as any).descripcion_producto,
            producto.categoria,
            producto.nombre_categoria,
        ]
            .filter(Boolean)
            .map((field) => String(field).toLowerCase());
        return fields.some((field) => field.includes(normalized));
    });
}

export default {
    getAllProducts,
    findProductByCode,
    searchProducts,
};
