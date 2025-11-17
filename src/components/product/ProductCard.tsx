import React, { useEffect, useState } from "react";
import shared from "./productShared.module.css";
import { useNavigate } from "react-router-dom";
import { scrollToTop } from "../../utils/scroll";
import { useCart } from "../../context/CartContext";
import Modal from "../ui/Modal";
import { isPersonalizable } from "../../utils/products";
import { getAverage } from "../../utils/ratings";
import { formatCLP } from "../../utils/currency";
import PersonalizeMessageModal from "./PersonalizeMessageModal";
import { STOCK_INSUFICIENTE_TITLE, STOCK_INSUFICIENTE_MSG } from "../../utils/messages";
import useInfoModal from "../../hooks/useInfoModal";
import type { Product as ProductType } from "../../types/product";

type Props = {
    p: ProductType;
    onPersonalize?: (p: ProductType) => void;
};

export const ProductCard: React.FC<Props> = ({ p, onPersonalize }) => {
    const navigate = useNavigate();
    const { add } = useCart();
    const [showAdded, setShowAdded] = useState(false);
    const [showPersonalizeModal, setShowPersonalizeModal] = useState(false);
    const [pendingMessage, setPendingMessage] = useState("");
    const [avg, setAvg] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });
    const { InfoModal, showInfo } = useInfoModal();

    function openDetail() {
        try { scrollToTop(); } catch {}
        navigate(`/detalle?code=${encodeURIComponent(p.code)}`);
    }

    useEffect(() => {
        // initial average
        try {
            setAvg(getAverage(p.code));
        } catch (err) {
            // ignore
        }

        const handler = (ev: Event) => {
            try {
                const ce = ev as CustomEvent;
                if (ce?.detail?.productCode === p.code) {
                    setAvg(getAverage(p.code));
                }
            } catch {
                // ignore
            }
        };

        window.addEventListener('ratings-updated', handler as EventListener);
        // also listen to storage events for cross-tab updates
        const storageHandler = (ev: StorageEvent) => {
            if (ev.key === 'product_ratings_v1') {
                setAvg(getAverage(p.code));
            }
        };
        window.addEventListener('storage', storageHandler);

        return () => {
            window.removeEventListener('ratings-updated', handler as EventListener);
            window.removeEventListener('storage', storageHandler);
        };
    }, [p.code]);

    function addToCart(e?: React.MouseEvent) {
        if (e) e.stopPropagation();
        if (isPersonalizable(p.code)) {
            if (onPersonalize) {
                return onPersonalize(p);
            }
            setPendingMessage("");
            setShowPersonalizeModal(true);
            return;
        }
        finalizeAdd();
    }

    function finalizeAdd(message?: string) {
        const trimmed = message ? message.trim() : "";
        const payloadMessage = trimmed.length > 0 ? trimmed : undefined;
        const added = add({ code: p.code, productName: p.productName, price: p.price, img: p.img, mensaje: payloadMessage });
        if (!added) {
            showInfo(STOCK_INSUFICIENTE_TITLE, STOCK_INSUFICIENTE_MSG);
            return;
        }
        setShowAdded(true);
    }

    function confirmPersonalize() {
        finalizeAdd(pendingMessage);
        setShowPersonalizeModal(false);
        setPendingMessage("");
    }

    function cancelPersonalize() {
        setShowPersonalizeModal(false);
        setPendingMessage("");
    }

    function viewCart() {
        setShowAdded(false);
        try {
            const ev = new CustomEvent("open-cart");
            window.dispatchEvent(ev);
        } catch (err) {
            navigate("/carrito");
        }
    }

    function closeAddedModal() {
        setShowAdded(false);
    }

    return (
        <div className={shared.gridItem}>
            <div className={`card ${shared.productCard} h-100`} role="button" tabIndex={0} onClick={openDetail} onKeyDown={(e) => e.key === "Enter" && openDetail()}>
                <img src={p.img} alt={p.productName} className={`${shared.productImg} card-img-top`} onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/images/placeholder.png")} />

                <div className="card-body d-flex flex-column">
                    <h5 className={`card-title ${shared.titleClamp}`}>{p.productName}</h5>

                    {/* Rating moved: display under title for better layout */}
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="small">
                            {avg.count > 0 ? (
                                <>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <i key={i} className={`bi ${i < Math.round(avg.avg) ? 'bi-star-fill' : 'bi-star'} text-warning me-1`} />
                                    ))}
                                    <span className="ms-1 small text-muted">{avg.avg.toFixed(1)}</span>
                                </>
                            ) : (
                                <span className="text-muted small">Sin calificaciones</span>
                            )}
                        </div>
                        <div className="ms-auto small text-muted">{avg.count > 0 ? `(${avg.count})` : ''}</div>
                    </div>

                    <p className="text-muted small mb-2">Stock: {typeof p.stock === "number" ? p.stock : "—"}</p>

                    <div className="d-flex align-items-center justify-content-between mb-3 mt-auto">
                        <span className={`${shared.price} fw-bold`}>{formatCLP(p.price, "-")}</span>
                        <div className={`${shared.badgesInline}`}> 
                            {p.category === 'productos-sin-azucar' && <span className="badge text-bg-dark">Sin azúcar</span>}
                            {p.category === 'productos-sin-gluten' && <span className="badge text-bg-warning">Sin gluten</span>}
                            {p.category === 'productos-veganos' && <span className="badge text-bg-success">Vegano</span>}
                            {isPersonalizable(p.code) && <span className="badge text-bg-info">Personalizable</span>}
                            {typeof p.stock === 'number' && p.stock === 0 && (
                                <span className="badge text-bg-danger ms-1">Agotado</span>
                            )}
                            {typeof p.stock === 'number' && typeof p.stockCritico === 'number' && p.stock > 0 && p.stock <= (p.stockCritico as number) && (
                                <span className="badge text-bg-warning ms-1">Stock bajo</span>
                            )}
                        </div>
                    </div>
                    <button className={`btn btn-sm w-100 ${shared.btnCart}`} onClick={addToCart} disabled={typeof p.stock === 'number' && p.stock <= 0}>
                        <i className="bi bi-cart-plus me-2" /> {typeof p.stock === 'number' && p.stock <= 0 ? 'Agotado' : 'Agregar al carrito'}
                    </button>
                </div>
            </div>
            <Modal
                show={showAdded}
                title="Producto agregado"
                onClose={closeAddedModal}
                onConfirm={viewCart}
                confirmLabel="Ver carrito"
                cancelLabel="Seguir comprando"
            >
                <div className="text-center">
                    <i className="bi bi-cart-check text-success fs-1 mb-2"></i>
                    <p className="mb-0">{p.productName ? <strong>{p.productName}</strong> : "El producto"} ha sido agregado al carrito.</p>
                </div>
            </Modal>
            <PersonalizeMessageModal
                show={showPersonalizeModal}
                productName={p.productName}
                onCancel={cancelPersonalize}
                onConfirm={confirmPersonalize}
                value={pendingMessage}
                onChange={setPendingMessage}
                inputId={`personalize-${p.code}`}
            />
            <InfoModal />
        </div>
    );
};

export default ProductCard;
