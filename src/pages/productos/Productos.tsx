// ...existing code...
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { products as seedProducts, type Product } from "../../data/products";
import "./Productos.css";

const KEY_CATALOG = "catalogo";
const KEY_CART = "carrito";

const defaultStock = (p: any) => ({
    ...p,
    stock: Number.isFinite(p.stock) ? p.stock : 10,
    stockCritico: Number.isFinite(p.stockCritico) ? p.stockCritico : 5,
    capacidadDiaria: Number.isFinite(p.capacidadDiaria) ? p.capacidadDiaria : 20,
});

const personalizables = ["TC001", "TE001", "TE002"];

const clp = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});

// categorías y mapping a ids tipo HTML (para mantener apariencia "como el HTML ejemplo")
const allCategories = [
    { id: "*", label: "Todos", btnId: "todosBtn" },
    { id: "tortas-cuadradas", label: "Tortas Cuadradas", btnId: "tortasCuadradasBtn" },
    { id: "tortas-circulares", label: "Tortas Circulares", btnId: "tortasCircularesBtn" },
    { id: "postres-individuales", label: "Postres Individuales", btnId: "postresIndividualesBtn" },
    { id: "productos-sin-azucar", label: "Sin Azúcar", btnId: "sinAzucarBtn" },
    { id: "pasteleria-tradicional", label: "Pastelería Tradicional", btnId: "tradicionalBtn" },
    { id: "productos-sin-gluten", label: "Sin Gluten", btnId: "sinGlutenBtn" },
    { id: "productos-veganos", label: "Veganos", btnId: "veganosBtn" },
    { id: "tortas-especiales", label: "Tortas Especiales", btnId: "tortasEspecialesBtn" },
];

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(KEY_CART) || "[]");
    } catch {
        return [];
    }
}
function setCart(cart: any[]) {
    localStorage.setItem(KEY_CART, JSON.stringify(cart));
}
function updateCartCount() {
    const carrito = getCart();
    const badge = document.getElementById("cart-count");
    if (!badge) return;
    const totalItems = carrito.reduce((acc: number, p: any) => acc + (p.cantidad || 0), 0);
    if (totalItems > 0) {
        badge.textContent = String(totalItems);
        badge.classList.remove("d-none");
    } else {
        badge.classList.add("d-none");
    }
}

export const Productos: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [filter, setFilter] = useState<string>("*");

    // Modal states for personalized message
    const [showModal, setShowModal] = useState(false);
    const [modalProduct, setModalProduct] = useState<Product | null>(null);
    const [mensaje, setMensaje] = useState<string>("");

    // Inicializar catálogo en localStorage (si no existe) y cargarlo al state
    useEffect(() => {
        try {
            let cat = JSON.parse(localStorage.getItem(KEY_CATALOG) || "null");
            if (!Array.isArray(cat) || cat.length === 0) {
                const seed = Array.isArray(seedProducts) ? seedProducts : [];
                cat = seed.map(defaultStock);
                localStorage.setItem(KEY_CATALOG, JSON.stringify(cat));
            } else {
                cat = cat.map(defaultStock);
                localStorage.setItem(KEY_CATALOG, JSON.stringify(cat));
            }
            setProducts(cat);
        } catch {
            setProducts(Array.isArray(seedProducts) ? seedProducts.map(defaultStock) : []);
        }

        updateCartCount();
    }, []);

    const filtered = useMemo(() => {
        if (!filter || filter === "*") return products;
        return products.filter((p) => p.category === filter);
    }, [products, filter]);

    function handleCardClick(p: Product) {
        navigate(`/detalle?code=${encodeURIComponent(p.code)}`);
    }

    function doAddToCart(product: Product, mensajeOpt?: string) {
        const carrito = getCart();
        const mensajeFinal = mensajeOpt && mensajeOpt.trim() ? mensajeOpt.trim() : undefined;
        const existing = carrito.find((c: any) => c.code === product.code && (c.mensaje || "") === (mensajeFinal || ""));
        if (existing) {
            existing.cantidad = (existing.cantidad || 0) + 1;
        } else {
            carrito.push({
                code: product.code,
                productName: product.productName,
                price: product.price,
                img: product.img,
                cantidad: 1,
                mensaje: mensajeFinal,
            });
        }
        setCart(carrito);
        updateCartCount();
        // notificación mínima
        alert(`✅ ${product.productName} agregado al carrito.`);
    }

    function addToCart(product: Product) {
        if (personalizables.includes(product.code)) {
            setModalProduct(product);
            setMensaje("");
            setShowModal(true);
        } else {
            doAddToCart(product);
        }
    }

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
        <div className="container py-4">
            <div className="row g-3">
                {/* SIDEBAR filtros - visible en md+ */}
                <aside className="col-md-2 d-none d-md-block px-3">
                    <h2 className="h6 mb-3">Filtros</h2>
                    <div className="d-grid gap-2 filters">
                        {allCategories.map((c) => (
                            <button
                                key={c.id}
                                id={c.btnId}
                                className={`btn btn-sm text-start btn-filter ${filter === c.id ? "btn-filter-primary" : "btn-filter"}`}
                                onClick={() => setFilter(c.id)}
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
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                {allCategories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div id="shopContent" className="row g-3">
                        {filtered.length === 0 && <p className="text-muted py-3">No hay productos para este filtro.</p>}

                        {filtered.map((p) => (
                            <div key={p.code} className="col-12 col-sm-6 col-md-4 col-lg-3">
                                <div
                                    className="card product-card h-100"
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (target.closest("button")) return;
                                        handleCardClick(p);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCardClick(p);
                                    }}
                                >
                                    <img
                                        src={p.img}
                                        alt={p.productName}
                                        className="product-img card-img-top"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = "/images/placeholder.png";
                                        }}
                                    />

                                    <div className="card-body d-flex flex-column">
                                        <h5 className="card-title">{p.productName}</h5>
                                        <p className="text-muted small mb-2">Código: {p.code}</p>

                                        <div className="d-flex align-items-center justify-content-between mb-3 mt-auto">
                                            <span className="price fw-bold">{clp.format(p.price)}</span>
                                            <div className="badges-inline d-flex gap-1">
                                                {personalizables.includes(p.code) && <span className="badge text-bg-info">Personalizable</span>}
                                                {p.category === "productos-sin-azucar" && <span className="badge text-bg-dark">Sin azúcar</span>}
                                                {p.category === "productos-sin-gluten" && <span className="badge text-bg-warning">Sin gluten</span>}
                                                {p.category === "productos-veganos" && <span className="badge text-bg-success">Vegano</span>}
                                            </div>
                                        </div>

                                        <button
                                            className="btn btn-sm w-100 btn-cart"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addToCart(p);
                                            }}
                                        >
                                            <i className="bi bi-cart-plus me-2" /> Agregar al carrito
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Modal controlado para mensaje personalizado */}
            {showModal && modalProduct && (
                <>
                    <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true" style={{ background: "rgba(0,0,0,0.4)" }}>
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Mensaje personalizado <small className="text-secondary">(opcional)</small></h5>
                                    <button type="button" className="btn-close" aria-label="Cerrar" onClick={cancelModal}></button>
                                </div>
                                <div className="modal-body">
                                    <p className="mb-2"><strong>{modalProduct.productName}</strong></p>
                                    <input
                                        autoFocus
                                        maxLength={60}
                                        value={mensaje}
                                        onChange={(e) => setMensaje(e.target.value)}
                                        className="form-control"
                                        placeholder="Ej: ¡Feliz Cumpleaños, Ana! (opcional)"
                                    />
                                    <div className="form-text mt-2">Puedes dejar este campo vacío si no deseas agregar un mensaje.</div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={cancelModal}>Cancelar</button>
                                    <button type="button" className="btn btn-primary" onClick={confirmModalAdd}>Agregar al carrito</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </div>
    );
};

export default Productos;
// ...existing code...