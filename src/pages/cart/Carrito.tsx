import React, { useMemo, useState } from "react";
import { useCart } from "../../context/CartContext";
import Modal from "../../components/ui/Modal";
import { useAuth } from "../../context/AuthContext";
import { findUserByEmail } from "../../utils/registro";
import { products as allProducts } from "../../utils/dataLoaders";
import { formatCLP } from "../../utils/currency";

const Carrito: React.FC = () => {
    const { items, count, add, remove, setQuantity, clear } = useCart();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toRemove, setToRemove] = useState<{ code: string; mensaje?: string; name?: string } | null>(null);

    const SHIPPING_COST = 5000;

    const subtotal = useMemo(() => items.reduce((s, it) => s + ((it.price || 0) * (it.cantidad || 0)), 0), [items]);

    function handleInc(it: typeof items[number]) {
        add({ code: it.code, productName: it.productName, price: it.price, img: it.img, mensaje: it.mensaje });
    }
    const { user } = useAuth();
    // determine user perks
    const storedUser = useMemo(() => {
        if (!user?.email) return null;
        return findUserByEmail(user.email);
    }, [user]);

    const discountPercent = storedUser?.discountPercent ?? 0;
    const hasFreeCakeVoucher = !!(storedUser?.freeCakeVoucher && !storedUser?.freeCakeRedeemed);

    // free cake amount: price of one torta (first matching cart item whose product category startsWith 'tortas')
    const freeCakeAmount = useMemo(() => {
        if (!hasFreeCakeVoucher) return 0;
        // find first torta in cart
        for (const it of items) {
            const p = allProducts.find(p => p.code === it.code);
            if (!p) continue;
            if (typeof p.category === 'string' && p.category.startsWith('tortas')) {
                return p.price || 0;
            }
        }
        return 0;
    }, [items, hasFreeCakeVoucher]);

    const discountAmount = useMemo(() => Math.round(subtotal * (discountPercent / 100)), [subtotal, discountPercent]);
    const shippingAmount = items.length > 0 ? SHIPPING_COST : 0;
    const totalBeforeShipping = Math.max(0, subtotal - discountAmount - freeCakeAmount);
    const total = totalBeforeShipping + shippingAmount;

    function handleDec(it: typeof items[number]) {
        const current = (it.cantidad || 0) - 1;
        if (current <= 0) {
            // confirm remove
            setToRemove({ code: it.code, mensaje: it.mensaje, name: it.productName });
            setConfirmOpen(true);
            return;
        }
    setQuantity(it.code, it.mensaje, current);
    }

    function handleQtyChange(it: typeof items[number], n: number) {
        const qty = Math.max(0, Math.floor(n || 0));
        if (qty <= 0) {
            setToRemove({ code: it.code, mensaje: it.mensaje, name: it.productName });
            setConfirmOpen(true);
            return;
        }
    setQuantity(it.code, it.mensaje, qty);
    }

    function confirmRemoveOk() {
        if (toRemove) remove(toRemove.code, toRemove.mensaje);
        setConfirmOpen(false);
        setToRemove(null);
    }

    function confirmRemoveCancel() {
        setConfirmOpen(false);
        setToRemove(null);
    }

    return (
        <main className="container py-4">
            <h1 className="h3 mb-3">Carrito de Compras</h1>

            <div className="row">
                <div className="col-lg-9">
                    {items.length === 0 ? (
                        <>
                            <div className="alert alert-warning" id="empty-cart-message">No tienes artículos en tu carrito.</div>
                            <button className="btn btn-primary" onClick={() => (window.location.href = "/productos")}>Ir a Productos</button>
                        </>
                    ) : (
                        <ul id="carrito-lista" className="list-group mb-3">
                            {items.map((it) => (
                                <li key={`${it.code}::${it.mensaje || ""}`} className="list-group-item d-flex align-items-center">
                                    <div style={{ width: 88, height: 88, flex: "0 0 88px" }} className="me-3">
                                        {it.img ? (
                                            <img src={it.img} alt={it.productName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                                        ) : (
                                            <div style={{ width: "100%", height: "100%", background: "#f0f0f0" }} />
                                        )}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <div className="fw-semibold">{it.productName}</div>
                                                {it.mensaje && <div className="small text-muted">{it.mensaje}</div>}
                                            </div>
                                            <div className="text-end">
                                                <div className="fw-semibold">{formatCLP(it.price)}</div>
                                                <div className="small text-muted">{formatCLP((it.price || 0) * (it.cantidad || 0))}</div>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-center gap-2 mt-2">
                                            <div className="input-group input-group-sm" style={{ maxWidth: 150 }}>
                                                <button type="button" className="btn btn-outline-secondary" onClick={() => handleDec(it)}>-</button>
                                                <input type="number" className="form-control text-center" value={it.cantidad || 0} onChange={(e) => handleQtyChange(it, Number(e.target.value))} min={0} />
                                                <button type="button" className="btn btn-outline-secondary" onClick={() => handleInc(it)}>+</button>
                                            </div>

                                            <button className="btn btn-link text-danger small" onClick={() => { setToRemove({ code: it.code, mensaje: it.mensaje, name: it.productName }); setConfirmOpen(true); }}>Eliminar</button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="col-lg-3">
                    <div className="d-flex flex-column">
                        <div id="pedido-detalles" className="card card-resumen p-3">
                            <div id="carrito-subtotal" className="mb-2">Subtotal ({count} items): <span className="float-end">{formatCLP(subtotal)}</span></div>
                            <div className="d-flex justify-content-between small text-muted mb-1">
                                <span>Descuentos</span>
                                <span>-{formatCLP(discountAmount + freeCakeAmount)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Despacho</span>
                                <span>{shippingAmount ? formatCLP(shippingAmount) : formatCLP(0)}</span>
                            </div>
                            <div id="carrito-total" className="fw-bold fs-5 mb-2">Total: <span className="float-end">{formatCLP(total)}</span></div>
                            <div className="d-grid mt-2">
                                <button className="btn btn-success" onClick={() => { if (items.length === 0) { window.alert("No hay productos en el carrito"); } else { window.location.href = '/checkout'; } }}>Proceder al pago</button>
                                <button className="btn btn-outline-secondary mt-2" onClick={() => clear()}>Vaciar carrito</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={confirmOpen} title="Confirmar acción" onClose={confirmRemoveCancel} onConfirm={confirmRemoveOk} confirmLabel="Sí, eliminar" cancelLabel="Cancelar">
                <div>¿Estás seguro que quieres eliminar <strong>{toRemove?.name}</strong> del carrito?</div>
            </Modal>
        </main>
    );
};

export default Carrito;
