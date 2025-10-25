// Central product types used across the app.
export type Product = {
    code: string;
    productName: string;
    price: number;
    img: string;
    category: string;
    desc?: string;
    stock?: number;
    stockCritico?: number;
    capacidadDiaria?: number;
};

export type CatalogProduct = {
    codigo_producto: string;
    nombre_producto: string;
    precio_producto: number;
    descripción_producto?: string;
    imagen_producto?: string;
    stock?: number;
    stock_critico?: number;
};

export type Category = {
    id_categoria: number;
    nombre_categoria: string;
    productos: CatalogProduct[];
};

export type Catalog = {
    nombre_pasteleria: string;
    categorias: Category[];
};

export {};
