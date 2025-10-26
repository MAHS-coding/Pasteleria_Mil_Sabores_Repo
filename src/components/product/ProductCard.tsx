import React, { useState } from "react";
import shared from "./productShared.module.css";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import Modal from "../ui/Modal";
import { isPersonalizable } from "../../utils/products";
import { formatCLP } from "../../utils/currency";
import PersonalizeMessageModal from "./PersonalizeMessageModal";
import { STOCK_INSUFICIENTE_TITLE, STOCK_INSUFICIENTE_MSG } from "../../utils/messages";
import useInfoModal from "../../hooks/useInfoModal";

export type Product = {
    code: string;
    productName: string;
    price?: number;
    img?: string;
    category?: string;
};

type Props = {
    p: Product;
    onPersonalize?: (p: Product) => void;
};

export const ProductCard: React.FC<Props> = ({ p, onPersonalize }) => {
    const navigate = useNavigate();
    const { add } = useCart();
    const [showAdded, setShowAdded] = useState(false);
    const [showPersonalizeModal, setShowPersonalizeModal] = useState(false);
    const [pendingMessage, setPendingMessage] = useState("");
    const { InfoModal, showInfo } = useInfoModal();

    function openDetail() {
        navigate(`/detalle?code=${encodeURIComponent(p.code)}`);
    }

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
        navigate("/carrito");
    }

    function closeAddedModal() {
        setShowAdded(false);
    }

    return (
        <div className={shared.gridItem}>
            <div className={`card ${shared.productCard} h-100`} role="button" tabIndex={0} onClick={openDetail} onKeyDown={(e) => e.key === "Enter" && openDetail()}>
                <img src={p.img} alt={p.productName} className={`${shared.productImg} card-img-top`} onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/images/placeholder.png")} />

                <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{p.productName}</h5>
                    <p className="text-muted small mb-2">Código: {p.code}</p>

                    <div className="d-flex align-items-center justify-content-between mb-3 mt-auto">
                        <span className={`${shared.price} fw-bold`}>{formatCLP(p.price, "-")}</span>
                        <div className={`${shared.badgesInline}`}>
                            {p.category === 'productos-sin-azucar' && <span className="badge text-bg-dark">Sin azúcar</span>}
                            {p.category === 'productos-sin-gluten' && <span className="badge text-bg-warning">Sin gluten</span>}
                            {p.category === 'productos-veganos' && <span className="badge text-bg-success">Vegano</span>}
                            {isPersonalizable(p.code) && <span className="badge text-bg-info">Personalizable</span>}
                        </div>
                    </div>

                    <button className={`btn btn-sm w-100 ${shared.btnCart}`} onClick={addToCart}>
                        <i className="bi bi-cart-plus me-2" /> Agregar al carrito
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
