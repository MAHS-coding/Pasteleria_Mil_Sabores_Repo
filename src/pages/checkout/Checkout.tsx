import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { findUserByEmail, updateUser, isDuocEmail, isBirthdayToday, type StoredUser } from "../../utils/registro";
import { products as allProducts, regions } from "../../utils/dataLoaders";
import { formatCLP } from "../../utils/currency";
import Modal from "../../components/ui/Modal";
import FormField from "../../components/ui/FormField";
import styles from './Checkout.module.css';
import { formatCardNumber, formatExpMonth, formatExpYear, normalizeHolderName, detectBrand, maskLast4 } from '../../utils/cardUtils';
import PaymentCards from '../../components/payments/PaymentCards';
import { getJSON, setJSON } from "../../utils/storage";
import { useNavigate } from "react-router-dom";

const SHIPPING_COST = 5000;

export type OrderItem = { productId?: string; code?: string; qty?: number; cantidad?: number; price?: number };
export type Order = {
  id: number | string;
  tsISO: string;
  usuarioCorreo?: string;
  usuarioId?: string | number | null;
  total: number;
  items: OrderItem[];
  fechaEntrega: string;
  direccionEntrega: string;
  estado?: string;
  paymentMethodId?: string;
  paymentMethod?: string;
  discounts?: any;
};

function todayYYYYMMDD() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, clear } = useCart();
  const { user } = useAuth();
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null);
  useEffect(() => {
    if (!user?.email) { setStoredUser(null); return; }
    setStoredUser(findUserByEmail(user.email) ?? null);
  }, [user]);

  useEffect(() => {
    setBlockedMsg(storedUser?.blocked ? "Tu cuenta está bloqueada. Contacta al administrador para desbloquearla." : "");
  }, [storedUser]);

  // address management
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrLine, setAddrLine] = useState("");
  const [addrRegion, setAddrRegion] = useState("");
  const [addrComuna, setAddrComuna] = useState("");
  const [addAddressError, setAddAddressError] = useState("");

  const [fechaEntrega, setFechaEntrega] = useState<string>(todayYYYYMMDD());
  const maxFechaEntrega = useMemo(() => {
    const t = new Date();
    const future = new Date(t.getFullYear(), t.getMonth() + 3, t.getDate());
    const y = future.getFullYear();
    const m = String(future.getMonth() + 1).padStart(2, "0");
    const d = String(future.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  // confirmation modal after placing order
  const [confirmPlacedOpen, setConfirmPlacedOpen] = useState(false);
  const [blockedMsg, setBlockedMsg] = useState<string>("");

  const discountPercent = storedUser?.discountPercent ?? 0;
  // determine contributors to the discount for clearer UI
  const ageDiscountPercent = (() => {
    try {
      if (!storedUser?.birthdate) return 0;
      const bd = new Date(storedUser.birthdate);
      if (isNaN(bd.getTime())) return 0;
      const today = new Date();
      let age = today.getFullYear() - bd.getFullYear();
      const m = today.getMonth() - bd.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
      return age >= 50 ? 50 : 0;
    } catch { return 0; }
  })();
  const codeDiscountPercent = storedUser?.lifetimeDiscount ? 10 : 0;
  const dynamicBirthdayVoucher = !!(storedUser && isDuocEmail(storedUser.email) && isBirthdayToday(storedUser.birthdate) && !storedUser.freeCakeRedeemed);
  const hasFreeCakeVoucher = !!(storedUser?.freeCakeVoucher && !storedUser?.freeCakeRedeemed) || dynamicBirthdayVoucher;

  // Respect user's choice (from Cart) to apply the birthday voucher
  const userKey = (storedUser?.email || "guest").toLowerCase();
  const PREF_KEY = `cart.useBirthdayVoucher:${userKey}`;
  const wantsVoucherFromStorage = (() => {
    try {
      const v = sessionStorage.getItem(PREF_KEY);
      return v == null ? true : v === "true";
    } catch { return true; }
  })();

  const [useBirthdayVoucher, setUseBirthdayVoucher] = useState<boolean>(wantsVoucherFromStorage);

  useEffect(() => {
    try { sessionStorage.setItem(PREF_KEY, String(useBirthdayVoucher)); } catch {}
  }, [PREF_KEY, useBirthdayVoucher]);

  const applyFreeCakeVoucher = hasFreeCakeVoucher && useBirthdayVoucher;

  const tortaItems = useMemo(() => {
    return items.filter((it) => {
      const p = allProducts.find((p) => p.code === it.code);
      return !!p && typeof p.category === "string" && p.category.startsWith("tortas");
    });
  }, [items]);

  const [selectedTortaKey, setSelectedTortaKey] = useState<string | null>(null);

  // initialize selected torta when tortaItems change
  useEffect(() => {
    if (!applyFreeCakeVoucher || tortaItems.length === 0) { setSelectedTortaKey(null); return; }
    const first = `${tortaItems[0].code}::${tortaItems[0].mensaje || ""}`;
    setSelectedTortaKey((prev) => prev ?? first);
  }, [applyFreeCakeVoucher, tortaItems]);

  function keyOf(it: typeof items[number]) { return `${it.code}::${it.mensaje || ""}`; }

  const subtotal = useMemo(() => items.reduce((s, it) => s + ((it.price || 0) * (it.cantidad || 0)), 0), [items]);
  const freeCakeAmount = useMemo(() => {
    if (!applyFreeCakeVoucher || !selectedTortaKey) return 0;
    const target = items.find((it) => keyOf(it) === selectedTortaKey);
    if (!target) return 0;
    const p = allProducts.find((p) => p.code === target.code);
    return p?.price || 0;
  }, [items, applyFreeCakeVoucher, selectedTortaKey]);
  const discountAmount = useMemo(() => Math.round(subtotal * (discountPercent / 100)), [subtotal, discountPercent]);
  const shippingAmount = items.length > 0 ? SHIPPING_COST : 0;
  const totalBeforeShipping = Math.max(0, subtotal - discountAmount - freeCakeAmount);
  const total = totalBeforeShipping + shippingAmount;

  function openAddAddressModal() {
    setAddrLine(""); setAddrRegion(""); setAddrComuna(""); setAddAddressError(""); setShowAddAddr(true);
  }

  function cancelAddAddress() {
    setShowAddAddr(false); setAddAddressError("");
  }

  function handleAddAddress() {
    if (!user?.email) return;
    if (!addrLine.trim() || !addrRegion || !addrComuna) {
      setAddAddressError("Completa dirección, región y comuna para guardar.");
      return;
    }
    const id = `${Date.now()}`;
    const addr = { id, address: addrLine, region: addrRegion, comuna: addrComuna };
    const existing = storedUser?.addresses ?? [];
    const updated = updateUser(user.email, { addresses: [...existing, addr] });
    if (updated) {
      setStoredUser(updated);
      setSelectedAddressId(id);
    }
    setShowAddAddr(false);
  }

  function getSelectedAddressLabel(): string {
    const a = storedUser?.addresses?.find((x) => x.id === selectedAddressId);
    if (a) return `${a.address}${a.comuna ? ", " + a.comuna : ""}${a.region ? ", " + a.region : ""}`;
    return "";
  }

  // Payment cards support
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const [paymentMethodError, setPaymentMethodError] = useState<string>("");

  useEffect(() => {
    if (storedUser?.paymentCards && storedUser.paymentCards.length > 0) {
      setSelectedCardId(storedUser.defaultPaymentCardId ?? storedUser.paymentCards[0].id);
    } else {
      setSelectedCardId(null);
    }
  }, [storedUser]);

  

  function addCard(cardData: { number: string; holder?: string; expMonth?: string; expYear?: string }) {
    if (!user?.email) return;
    const last4 = maskLast4(cardData.number);
    if (!last4) return;
    const brand = detectBrand(cardData.number);
    const id = `card-${Date.now()}`;
    const card = { id, brand, last4, expMonth: cardData.expMonth, expYear: cardData.expYear, holderName: cardData.holder } as any;
    const existing = storedUser?.paymentCards ?? [];
    const willSetDefault = !storedUser?.defaultPaymentCardId;
    const updated = updateUser(user.email, { paymentCards: [card, ...existing], defaultPaymentCardId: willSetDefault ? id : storedUser?.defaultPaymentCardId });
    if (updated) setStoredUser(updated);
    setSelectedCardId(id);
  }

  function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    if (storedUser?.blocked) {
      setBlockedMsg("Tu cuenta está bloqueada. Contacta al administrador para desbloquearla.");
      return;
    }
    if (!fechaEntrega) return;
    const today = new Date();
    const selected = new Date(fechaEntrega + "T00:00:00");
    if (selected.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) {
      // simple guard; UI already restricts min
      return;
    }
    // guard max: cannot schedule beyond maxFechaEntrega (today + 3 months)
    try {
      const maxAllowed = new Date(maxFechaEntrega + "T00:00:00");
      if (selected.getTime() > maxAllowed.getTime()) {
        // selected date is too far in the future
        return;
      }
    } catch { }

    // require a payment method to be selected
    if (!selectedCardId) {
      setPaymentMethodError("Selecciona un método de pago antes de confirmar el pedido.");
      return;
    }

    let addressText = getSelectedAddressLabel();
    if (!addressText) {
      // if no address saved/selected, force modal to add one
      setShowAddAddr(true);
      return;
    }

    // compute discount breakdown to persist with the order
    const agePercentApplied = ageDiscountPercent;
    const codePercentApplied = codeDiscountPercent;
    const ageDiscountMoney = Math.round(subtotal * (agePercentApplied / 100));
    const codeDiscountMoney = Math.round(subtotal * (codePercentApplied / 100));
    const discountPercentMoney = ageDiscountMoney + codeDiscountMoney;
    const freeCakeApplied = applyFreeCakeVoucher && freeCakeAmount > 0 && !!selectedTortaKey;
    const freeCakeMoney = freeCakeApplied ? freeCakeAmount : 0;
    const totalDiscountMoney = discountPercentMoney + freeCakeMoney;

    // build order
    const order: Order = {
      id: Date.now(),
      tsISO: new Date().toISOString(),
      usuarioCorreo: storedUser?.email,
      usuarioId: undefined,
      total,
      items: items.map((it) => ({ productId: it.code, code: it.code, qty: it.cantidad, price: it.price })),
      fechaEntrega,
      direccionEntrega: addressText,
      estado: "Pendiente",
      paymentMethodId: selectedCardId ?? undefined,
      paymentMethod: selectedCardId ? (storedUser?.paymentCards?.find(pc => String(pc.id) === String(selectedCardId)) ? `${storedUser?.paymentCards?.find(pc => String(pc.id) === String(selectedCardId))?.brand} **** ${storedUser?.paymentCards?.find(pc => String(pc.id) === String(selectedCardId))?.last4}` : String(selectedCardId)) : undefined,
      discounts: {
        agePercent: agePercentApplied,
        codePercent: codePercentApplied,
        ageDiscountMoney,
        codeDiscountMoney,
        discountPercentMoney,
        freeCakeApplied,
        freeCakeMoney,
        freeCakeTortaKey: freeCakeApplied ? selectedTortaKey : null,
        totalDiscountMoney,
      },
    };

    // persist into 'ordenes'
    try {
      const prev: Order[] = getJSON<Order[]>("ordenes") || [];
      prev.push(order);
      setJSON("ordenes", prev as any);
    } catch { }

    // decrement stock in 'catalogo'
    try {
      const catalogo: any[] = getJSON<any[]>("catalogo") || [];
      for (const it of items) {
        const idx = catalogo.findIndex((p) => String(p.code) === String(it.code));
        if (idx >= 0) {
          const base = Number(catalogo[idx].stock || 0);
          const next = Math.max(0, base - Number(it.cantidad || 0));
          catalogo[idx].stock = next;
        }
      }
      setJSON("catalogo", catalogo);
    } catch { }

    // mark free cake redeemed if applied
    try {
      if (applyFreeCakeVoucher && freeCakeAmount > 0 && storedUser?.email) {
        updateUser(storedUser.email, { freeCakeVoucher: false, freeCakeRedeemed: true });
      }
    } catch { }

    // clear cart
    clear();

    // show confirmation and redirect to perfil
    setConfirmPlacedOpen(true);
  }

  function afterModalClose() {
    setConfirmPlacedOpen(false);
    navigate("/perfil");
  }

  return (
    <main className="container py-4">
      <h1 className="h3 mb-3">Confirmación de Pedido</h1>

      <div className="row g-4">
        <div className="col-12 col-lg-8 order-1 order-lg-0">
          <form className={`card p-3 shadow-sm ${styles['checkout-form']}`} onSubmit={placeOrder}>
            <div className="mb-3">
              <label htmlFor="fechaEntrega" className="form-label">Fecha de entrega</label>
              <input id="fechaEntrega" type="date" className="form-control" required min={todayYYYYMMDD()} max={maxFechaEntrega} value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
            </div>
            <div className="mb-3">
              <label htmlFor="direccionSelect" className="form-label">Dirección de entrega</label>
              <div className="input-group">
                <select id="direccionSelect" className="form-select" required={!!(storedUser?.addresses?.length)} value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
                  {!storedUser?.addresses?.length ? (
                    <option value="">No tienes direcciones guardadas</option>
                  ) : (
                    <>
                      <option value="">Selecciona…</option>
                      {(storedUser.addresses || []).map((a) => (
                        <option key={a.id} value={a.id}>{a.address}{a.comuna ? `, ${a.comuna}` : ''}{a.region ? `, ${a.region}` : ''}</option>
                      ))}
                    </>
                  )}
                </select>
                <button className={`btn ${styles['accentOutlineBtn']}`} type="button" title="Agregar nueva dirección" onClick={openAddAddressModal}><i className="bi bi-plus-circle"></i></button>
              </div>
            </div>
            {/* Payment methods */}
            <div className="mb-3">
              <label className="form-label">Método de pago</label>
              {user ? (
                <div>
                  <PaymentCards
                    mode="select"
                    paymentCards={storedUser?.paymentCards || []}
                    defaultCardId={storedUser?.defaultPaymentCardId}
                    selectedId={selectedCardId}
                    onSelectedChange={(id) => { setSelectedCardId(id); setPaymentMethodError(""); }}
                    onAdd={(data) => addCard({ number: formatCardNumber(data.number), holder: normalizeHolderName(data.holder || ''), expMonth: formatExpMonth(data.expMonth || ''), expYear: formatExpYear(data.expYear || '') })}
                  />
                </div>
              ) : (
                <div className="small text-muted">Inicia sesión para guardar tarjetas</div>
              )}
            </div>
            {paymentMethodError ? <div className="alert alert-danger mb-2">{paymentMethodError}</div> : null}
            {blockedMsg ? <div className="alert alert-danger mb-2">{blockedMsg}</div> : null}
            <button type="submit" className={`btn w-100 ${styles['confirmBtn']}`} disabled={items.length === 0 || !!storedUser?.blocked || !selectedCardId}>Confirmar pedido</button>
          </form>
        </div>

        <div className="col-12 col-lg-4 order-0 order-lg-1">
          <div id="checkout-resumen" className={`card ${styles['card-resumen']} p-3 mb-3`}>
            <h5 className="mb-3">Resumen del Pedido</h5>
            {items.length === 0 ? (
              <div className="alert alert-warning">Tu carrito está vacío.</div>
            ) : (
              <>
                <ul className="list-group mb-2">
                  {items.map((p) => (
                    <li key={`${p.code}::${p.mensaje || ''}`} className="list-group-item d-flex justify-content-between align-items-center">
                      <span>{p.productName}{p.mensaje ? <span className='text-secondary'> – "{p.mensaje}"</span> : null} <span className='text-secondary'>x{p.cantidad}</span></span>
                      <span>{formatCLP((p.price || 0) * (p.cantidad || 0))}</span>
                    </li>
                  ))}
                </ul>
                {hasFreeCakeVoucher && tortaItems.length > 0 ? (
                  <div className="mb-3">
                    <div className="form-check mb-2">
                      <input className="form-check-input" type="checkbox" id="useBirthdayVoucher" checked={useBirthdayVoucher} onChange={(e) => setUseBirthdayVoucher(e.target.checked)} />
                      <label className="form-check-label" htmlFor="useBirthdayVoucher">Usar torta gratis por cumpleaños</label>
                    </div>
                    {useBirthdayVoucher ? (
                      <div>
                        <label className="form-label small mb-1">Selecciona la torta a aplicar</label>
                        <select className="form-select form-select-sm" value={selectedTortaKey ?? ""} onChange={(e) => setSelectedTortaKey(e.target.value || null)}>
                          {tortaItems.map((it) => {
                            const key = `${it.code}::${it.mensaje || ""}`;
                            const p = allProducts.find(p => p.code === it.code);
                            const label = `${p?.productName || it.code}${it.mensaje ? ` – "${it.mensaje}"` : ''} (${formatCLP(p?.price || 0)})`;
                            return <option key={key} value={key}>{label}</option>;
                          })}
                        </select>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="d-flex justify-content-between">
                  <span>Subtotal</span>
                  <span>{formatCLP(subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Despacho</span>
                  <span>{formatCLP(items.length > 0 ? SHIPPING_COST : 0)}</span>
                </div>
                {(discountPercent > 0 || (hasFreeCakeVoucher && freeCakeAmount > 0)) && (
                  <div>
                    <div className="mb-1">Descuentos aplicados:</div>
                    <ul className="list-unstyled small mb-0">
                      {ageDiscountPercent > 0 ? (
                        <li className="d-flex justify-content-between text-success"> 
                          <span>50% beneficio mayores</span>
                          <span>-{formatCLP(Math.round(subtotal * (ageDiscountPercent / 100)))}</span>
                        </li>
                      ) : null}
                      {codeDiscountPercent > 0 ? (
                        <li className="d-flex justify-content-between text-success"> 
                          <span>10% descuento de por vida (FELICES50)</span>
                          <span>-{formatCLP(Math.round(subtotal * (codeDiscountPercent / 100)))}</span>
                        </li>
                      ) : null}
                      {hasFreeCakeVoucher && freeCakeAmount > 0 ? (
                        <li className="d-flex justify-content-between text-success"> 
                          <span>Torta gratis</span>
                          <span>-{formatCLP(freeCakeAmount)}</span>
                        </li>
                      ) : null}
                      <li className="d-flex justify-content-between fw-semibold mt-1">
                        <span>Total descuentos</span>
                        <span>-{formatCLP(Math.round(subtotal * ((ageDiscountPercent + codeDiscountPercent) / 100) + (hasFreeCakeVoucher ? freeCakeAmount : 0)))}</span>
                      </li>
                    </ul>
                  </div>
                )}
                <hr />
                <div className="d-flex justify-content-between fw-bold fs-5">
                  <span>Total</span>
                  <span>{formatCLP(total)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add address modal */}
      <Modal
        show={showAddAddr}
        title="Añadir Dirección"
        onClose={cancelAddAddress}
        onConfirm={handleAddAddress}
        confirmLabel="Guardar"
        cancelLabel="Cancelar"
      >
        <div className="d-flex flex-column gap-3">
          <FormField id="addAddressLine1" label="Dirección">
            <input type="text" className="form-control" id="addAddressLine1" value={addrLine} onChange={(e) => setAddrLine(e.target.value)} />
          </FormField>
          <FormField id="addAddressRegion" label="Región">
            <select className="form-select" id="addAddressRegion" value={addrRegion} onChange={(e) => setAddrRegion(e.target.value)}>
              <option value="">Selecciona…</option>
              {regions.map((r) => (<option key={r.id} value={r.name}>{r.name}</option>))}
            </select>
          </FormField>
          <FormField id="addAddressCity" label="Comuna">
            <select className="form-select" id="addAddressCity" value={addrComuna} onChange={(e) => setAddrComuna(e.target.value)} disabled={!addrRegion}>
              <option value="">Selecciona…</option>
              {addrRegion && regions.find((r) => r.name === addrRegion)?.comunas.map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}
            </select>
          </FormField>
          {addAddressError ? <p className="text-danger small mb-0">{addAddressError}</p> : null}
        </div>
      </Modal>

      {/* Confirmation modal */}
      <Modal
        show={confirmPlacedOpen}
        title="Pedido confirmado"
        onClose={afterModalClose}
        onConfirm={afterModalClose}
        confirmLabel="Aceptar"
        cancelLabel="Cerrar"
      >
        <div>
          ¡Tu pedido ha sido confirmado con éxito! Serás redirigido a tu perfil.
        </div>
      </Modal>
    </main>
  );
};

export default Checkout;
