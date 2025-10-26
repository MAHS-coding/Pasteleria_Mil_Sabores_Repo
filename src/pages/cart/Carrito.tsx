import React, { useMemo, useState } from "react";
import { useCart } from "../../context/CartContext";
import Modal from "../../components/ui/Modal";
import { useAuth } from "../../context/AuthContext";
import { findUserByEmail, isDuocEmail, isBirthdayToday } from "../../utils/registro";
import { products as allProducts } from "../../utils/dataLoaders";
import { formatCLP } from "../../utils/currency";
import { STOCK_INSUFICIENTE_TITLE, STOCK_INSUFICIENTE_MSG, STOCK_LIMITADO_TITLE, stockLimitAdjusted, CARRITO_VACIO_TITLE, CARRITO_VACIO_MSG } from "../../utils/messages";
import useInfoModal from "../../hooks/useInfoModal";

const Carrito: React.FC = () => {
    const { items, count, add, remove, setQuantity, clear } = useCart();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toRemove, setToRemove] = useState<{ code: string; mensaje?: string; name?: string } | null>(null);
    const [selectedFreeCakeKey, setSelectedFreeCakeKey] = useState<string | null>(null);
    const { InfoModal, showInfo } = useInfoModal();
    const [confirmClearOpen, setConfirmClearOpen] = useState(false);

    const SHIPPING_COST = 5000;

    const subtotal = useMemo(() => items.reduce((s, it) => s + ((it.price || 0) * (it.cantidad || 0)), 0), [items]);

    function handleInc(it: typeof items[number]) {
        const added = add({ code: it.code, productName: it.productName, price: it.price, img: it.img, mensaje: it.mensaje });
        if (!added) {
            showInfo(STOCK_INSUFICIENTE_TITLE, STOCK_INSUFICIENTE_MSG);
        }
    }
    const { user } = useAuth();
    const storedUser = useMemo(() => {
        if (!user?.email) return null;
        return findUserByEmail(user.email);
    }, [user]);

    // Preference: apply birthday voucher or not (per-user, persisted in session storage)
    const userKey = (storedUser?.email || "guest").toLowerCase();
    const PREF_KEY = `cart.useBirthdayVoucher:${userKey}`;
    const [useBirthdayVoucher, setUseBirthdayVoucher] = React.useState<boolean>(() => {
        try {
            const v = sessionStorage.getItem(PREF_KEY);
            return v == null ? true : v === "true";
        } catch { return true; }
    });
    // When the active user changes, reload preference
    React.useEffect(() => {
        try {
            const k = `cart.useBirthdayVoucher:${(storedUser?.email || "guest").toLowerCase()}`;
            const v = sessionStorage.getItem(k);
            setUseBirthdayVoucher(v == null ? true : v === "true");
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userKey]);
    // Persist preference
    React.useEffect(() => {
        try { sessionStorage.setItem(PREF_KEY, String(useBirthdayVoucher)); } catch {}
    }, [PREF_KEY, useBirthdayVoucher]);

    const discountPercent = storedUser?.discountPercent ?? 0;
    const dynamicBirthdayVoucher = !!(storedUser && isDuocEmail(storedUser.email) && isBirthdayToday(storedUser.birthdate) && !storedUser.freeCakeRedeemed);
    const hasFreeCakeVoucher = !!(storedUser?.freeCakeVoucher && !storedUser?.freeCakeRedeemed) || dynamicBirthdayVoucher;
    const applyFreeCakeVoucher = hasFreeCakeVoucher && useBirthdayVoucher;

    const tortaItems = useMemo(() => {
        return items.filter(it => {
            const p = allProducts.find(p => p.code === it.code);
            return !!p && typeof p.category === 'string' && p.category.startsWith('tortas');
        });
    }, [items]);

    function keyOf(it: typeof items[number]) { return `${it.code}::${it.mensaje || ""}`; }

    React.useEffect(() => {
        if (!applyFreeCakeVoucher || tortaItems.length === 0) {
            if (selectedFreeCakeKey !== null) setSelectedFreeCakeKey(null);
            return;
        }
        const keys = tortaItems.map(keyOf);
        if (!selectedFreeCakeKey || !keys.includes(selectedFreeCakeKey)) {
            setSelectedFreeCakeKey(keys[0]);
        }
    }, [applyFreeCakeVoucher, tortaItems, selectedFreeCakeKey]);

    const freeCakeAmount = useMemo(() => {
        if (!applyFreeCakeVoucher) return 0;
        if (!selectedFreeCakeKey) return 0;
        const target = items.find(it => keyOf(it) === selectedFreeCakeKey);
        if (!target) return 0;
        const p = allProducts.find(p => p.code === target.code);
        return p?.price || 0;
    }, [items, applyFreeCakeVoucher, selectedFreeCakeKey]);

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
        const finalQty = setQuantity(it.code, it.mensaje, current);
        if (finalQty !== current) {
            showInfo(STOCK_INSUFICIENTE_TITLE, `No hay stock suficiente para ajustar ${it.productName || "este producto"}.`);
        }
    }

    function handleQtyChange(it: typeof items[number], n: number) {
        const qty = Math.max(0, Math.floor(n || 0));
        if (qty <= 0) {
            setToRemove({ code: it.code, mensaje: it.mensaje, name: it.productName });
            setConfirmOpen(true);
            return;
        }
        const finalQty = setQuantity(it.code, it.mensaje, qty);
        if (finalQty === 0) {
            showInfo(STOCK_INSUFICIENTE_TITLE, `${STOCK_INSUFICIENTE_MSG} Se eliminó del carrito.`);
        } else if (finalQty !== qty) {
            showInfo(STOCK_LIMITADO_TITLE, stockLimitAdjusted(finalQty, it.productName || "este producto"));
        }
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
                            {hasFreeCakeVoucher && (
                                <div className="mb-3">
                                    <div className="fw-semibold mb-1">Beneficio: Torta de cumpleaños</div>
                                    <div className="form-check form-switch mb-2">
                                        <input className="form-check-input" type="checkbox" id="toggleBirthdayVoucher" checked={useBirthdayVoucher} onChange={(e) => setUseBirthdayVoucher(e.target.checked)} />
                                        <label className="form-check-label" htmlFor="toggleBirthdayVoucher">Usar beneficio en este pedido</label>
                                    </div>
                                    {tortaItems.length > 0 ? (
                                        <div className="d-flex align-items-center gap-2">
                                            <select
                                                className="form-select form-select-sm"
                                                value={selectedFreeCakeKey ?? ''}
                                                onChange={(e) => setSelectedFreeCakeKey(e.target.value || null)}
                                                disabled={!applyFreeCakeVoucher}
                                            >
                                                {tortaItems.map((it) => (
                                                    <option key={keyOf(it)} value={keyOf(it)}>
                                                        {it.productName} {it.mensaje ? `– "${it.mensaje}"` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="small text-muted">Agrega una torta para usar tu beneficio.</div>
                                    )}
                                </div>
                            )}
                            <div id="carrito-subtotal" className="mb-2">Subtotal ({count} items): <span className="float-end">{formatCLP(subtotal)}</span></div>
                            <div className="d-flex justify-content-between small text-muted mb-1">
                                <span>Descuentos</span>
                                <span>-{formatCLP(discountAmount + freeCakeAmount)}</span>
                            </div>
                            {applyFreeCakeVoucher && freeCakeAmount > 0 && selectedFreeCakeKey && (
                                <div className="small text-muted mb-2">Torta gratis aplicada a: {tortaItems.find(it => keyOf(it) === selectedFreeCakeKey)?.productName}</div>
                            )}
                            <div className="d-flex justify-content-between mb-2">
                                <span>Despacho</span>
                                <span>{shippingAmount ? formatCLP(shippingAmount) : formatCLP(0)}</span>
                            </div>
                            <div id="carrito-total" className="fw-bold fs-5 mb-2">Total: <span className="float-end">{formatCLP(total)}</span></div>
                            <div className="d-grid mt-2">
                                <button className="btn btn-success" onClick={() => { if (items.length === 0) { showInfo(CARRITO_VACIO_TITLE, CARRITO_VACIO_MSG); } else { window.location.href = '/checkout'; } }}>Proceder al pago</button>
                                <button
                                    className="btn btn-outline-secondary mt-2"
                                    onClick={() => setConfirmClearOpen(true)}
                                    disabled={items.length === 0}
                                    title={items.length === 0 ? "No hay productos en el carrito" : undefined}
                                >
                                    Vaciar carrito
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={confirmOpen} title="Confirmar acción" onClose={confirmRemoveCancel} onConfirm={confirmRemoveOk} confirmLabel="Sí, eliminar" cancelLabel="Cancelar">
                <div>¿Estás seguro que quieres eliminar <strong>{toRemove?.name}</strong> del carrito?</div>
            </Modal>
            <InfoModal />
            <Modal
                show={confirmClearOpen}
                title="Vaciar carrito"
                onClose={() => setConfirmClearOpen(false)}
                onConfirm={() => { clear(); setConfirmClearOpen(false); }}
                confirmLabel="Sí, vaciar"
                cancelLabel="Cancelar"
            >
                <div>¿Estás seguro que quieres vaciar el carrito? Esta acción no se puede deshacer.</div>
            </Modal>
        </main>
    );
};

export default Carrito;
