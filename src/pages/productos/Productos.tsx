import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { products as seedProducts } from "../../utils/dataLoaders";
import type { Product } from "../../types/product";
import styles from "./Productos.module.css";
import { useCart } from "../../context/CartContext";
import ProductGrid from "../../components/product/ProductGrid";
import { initCatalog, mapSegmentToId, mapIdToSegment, filterProducts, sortProducts } from "../../utils/products";
import Modal from "../../components/ui/Modal";
import PersonalizeMessageModal from "../../components/product/PersonalizeMessageModal";
import useInfoModal from "../../hooks/useInfoModal";
import { STOCK_INSUFICIENTE_TITLE, STOCK_INSUFICIENTE_MSG } from "../../utils/messages";

const KEY_CATALOG = "catalogo";


function titleCaseFromSlug(slug: string) {
    const name = String(slug || "").replace(/-/g, " ").trim();
    return name.replace(/\b\w/g, (m) => m.toUpperCase());
}

// cart persistence is handled by CartContext

const Productos: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [filter, setFilter] = useState<string>("*");
    const location = useLocation();
    const [sort, setSort] = useState<string>("default");
    const { add } = useCart();

    // confirmation modal state when a product is added
    const [showAddedConfirm, setShowAddedConfirm] = useState(false);
    const [addedProductName, setAddedProductName] = useState<string>("");
    // Info modal via hook
    const { InfoModal, showInfo } = useInfoModal();

    // Modal states for personalized message
    const [showModal, setShowModal] = useState(false);
    const [modalProduct, setModalProduct] = useState<Product | null>(null);
    const [mensaje, setMensaje] = useState<string>("");

    // Inicializar catálogo en localStorage (si no existe) y cargarlo al state
    useEffect(() => {
        const cat = initCatalog(seedProducts, KEY_CATALOG);
        setProducts(cat as Product[]);
    }, []);

    // Read the URL (path or query) and apply a filter when the user navigates from the header links.
    useEffect(() => {
        if (!location) return;
        const path = location.pathname || "";
        const search = location.search || "";

        // Only handle routes under /productos
        if (!path.startsWith("/productos")) return;

        const parts = path.split("/").filter(Boolean); // ['productos', 'tortas-cuadradas']
        const segment = parts[1];

        // parse query params: allow ?filtro=... and ?sort=...
        try {
            const params = new URLSearchParams(search);
            // sort param (default fallback)
            const s = params.get("sort");
            if (s) setSort(s);
            else setSort("default");

            // filter: query param overrides path segment. If no query and no segment -> show all (*).
            const f = params.get("filtro");
            if (f) {
                setFilter(f);
            } else if (segment) {
                setFilter(mapSegmentToId(segment));
            } else {
                setFilter("*");
            }
        } catch {
            setFilter("*");
            setSort("default");
        }
    }, [location]);

    // Keep products in sync if catalog changes in another tab
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === KEY_CATALOG) {
                const cat = initCatalog(seedProducts, KEY_CATALOG);
                setProducts(cat as Product[]);
            }
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, []);

    // Dynamic categories (from current catalog)
    const categories = useMemo(() => {
        const set = new Set<string>();
        (products || []).forEach((p) => {
            const c = String(p.category || "").trim();
            if (c) set.add(c);
        });
        const items = Array.from(set).sort((a, b) => a.localeCompare(b));
        return [{ id: "*", label: "Todos" }, ...items.map((id) => ({ id, label: titleCaseFromSlug(id) }))];
    }, [products]);

    const filtered = useMemo(() => filterProducts(products, filter), [products, filter]);

    const displayedProducts = useMemo(() => sortProducts(filtered, sort), [filtered, sort]);

    function applyFilter(catId: string) {
        setFilter(catId);

        const segment = mapIdToSegment(catId);
        // preserve sort in querystring
        const params = new URLSearchParams(location.search);
        if (sort && sort !== "default") params.set("sort", sort);
        else params.delete("sort");

        const qs = params.toString();
        if (!segment) navigate(`/productos${qs ? `?${qs}` : ""}`);
        else navigate(`/productos/${segment}${qs ? `?${qs}` : ""}`);
    }

    function applySort(sortId: string) {
        setSort(sortId);

        const params = new URLSearchParams(location.search);
        if (sortId && sortId !== "default") params.set("sort", sortId);
        else params.delete("sort");

        const qs = params.toString();
        navigate(`${location.pathname}${qs ? `?${qs}` : ""}`);
    }


    function doAddToCart(product: Product, mensajeOpt?: string) {
        const mensajeFinal = mensajeOpt && mensajeOpt.trim() ? mensajeOpt.trim() : undefined;
        const added = add({ code: product.code, productName: product.productName, price: product.price, img: product.img, mensaje: mensajeFinal } as any);
        if (!added) {
            showInfo(STOCK_INSUFICIENTE_TITLE, STOCK_INSUFICIENTE_MSG);
            return;
        }
        // show confirmation modal instead of alert
        setAddedProductName(product.productName);
        setShowAddedConfirm(true);
    }

    function closeAddedConfirm() {
        setShowAddedConfirm(false);
    }

    function goToCart() {
        setShowAddedConfirm(false);
        navigate("/carrito");
    }

    // addToCart handled by ProductCard; personalize still opens modal via onPersonalize

    function confirmModalAdd() {
        if (!modalProduct) return;
        doAddToCart(modalProduct, mensaje);
        setShowModal(false);
        setModalProduct(null);
        setMensaje("");
    }

    function cancelModal() {
        setShowModal(false);
        setModalProduct(null);
        setMensaje("");
    }

    useEffect(() => {
        if (!showModal) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") cancelModal();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [showModal]);

    return (
        <div className="container py-4 flex">
            <div className="row g-3">
                {/* SIDEBAR filtros - visible en md+ */}
                <aside className="col-md-2 d-none d-md-block">
                    <h2 className="h6 mb-3">Filtros</h2>
                    <div className="d-grid gap-2 filters">
                        {categories.map((c: {id: string; label: string}) => (
                            <button
                                key={c.id}
                                id={`filter-${c.id}`}
                                className={`btn btn-sm text-start ${filter === c.id ? styles.btnFilterPrimary : styles.btnFilter}`}
                                onClick={() => applyFilter(c.id)}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* MAIN */}
                <section className="col-12 col-md-10">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h1 className="h3 mb-0">Productos</h1>

                        {/* Móvil: select para filtros */}
                        <div className="d-md-none" style={{ minWidth: 220 }}>
                            <select
                                id="mobileFilter"
                                className="form-select form-select-sm"
                                value={filter}
                                onChange={(e) => applyFilter(e.target.value)}
                            >
                                {categories.map((c: {id: string; label: string}) => (
                                    <option key={c.id} value={c.id}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* Ordenar por precio (visible en todas las pantallas) */}
                        <div className="ms-3" style={{ minWidth: 200 }}>
                            <select id="sortSelect" className="form-select form-select-sm" value={sort} onChange={(e) => applySort(e.target.value)}>
                                <option value="default">Ordenar</option>
                                <option value="price-asc">Precio: menor a mayor</option>
                                <option value="price-desc">Precio: mayor a menor</option>
                            </select>
                        </div>
                    </div>
                    <div className={styles.shopContent}>
                        <ProductGrid
                            products={displayedProducts}
                            onPersonalize={(prod) => {
                                setModalProduct(prod as any);
                                setMensaje("");
                                setShowModal(true);
                            }}
                        />
                    </div>
                </section>
            </div>

            {/* Modal controlado para mensaje personalizado (reutiliza componente Modal) */}
            <PersonalizeMessageModal
                show={showModal && !!modalProduct}
                productName={modalProduct?.productName}
                onCancel={cancelModal}
                onConfirm={confirmModalAdd}
                value={mensaje}
                onChange={setMensaje}
              />

            {/* Confirmation when product added */}
            <Modal
                show={showAddedConfirm}
                title="Producto agregado"
                onClose={closeAddedConfirm}
                onConfirm={goToCart}
                confirmLabel="Ver carrito"
                cancelLabel="Seguir comprando"
            >
                <div className="text-center">
                    <i className="bi bi-cart-check text-success fs-1 mb-2"></i>
                    <p className="mb-0">{addedProductName ? <strong>{addedProductName}</strong> : "El producto"} ha sido agregado al carrito.</p>
                </div>
            </Modal>

            {/* Shared Info Modal */}
            <InfoModal />
        </div>
    );
};

export default Productos;