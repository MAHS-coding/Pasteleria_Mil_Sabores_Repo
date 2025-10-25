import React from "react";
import ProductCard from "./ProductCard";
import type { Product as PType } from "../../types/product";
// reuses ProductCard.module.css for gridItem / card styling

type Props = {
    products: PType[];
    onPersonalize?: (p: PType) => void;
};

export const ProductGrid: React.FC<Props> = ({ products, onPersonalize }) => {
    if (!products || products.length === 0) return <p className="text-muted py-3">No hay productos para este filtro.</p>;

    return (
        <>
            {products.map((p) => (
                <ProductCard key={p.code} p={p as any} onPersonalize={onPersonalize as any} />
            ))}
        </>
    );
};

export default ProductGrid;
