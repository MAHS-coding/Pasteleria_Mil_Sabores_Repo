import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { isDuocEmail, isBirthdayToday, type StoredUser } from "../../utils/registro";
import { products as allProducts, regions } from "../../utils/dataLoaders";
import { formatCLP } from "../../utils/currency";
import Modal from "../../components/ui/Modal";
import FormField from "../../components/ui/FormField";
import styles from './Checkout.module.css';
import { formatCardNumber, formatExpMonth, formatExpYear, normalizeHolderName, maskLast4 } from '../../utils/cardUtils';
import { fetchUserAddresses, fetchUserCards, fetchUserProfile, type AddressDto } from "../../services/userService";
import PaymentCards from '../../components/payments/PaymentCards';
import { useNavigate } from "react-router-dom";
import { createOrder, type OrderRequest, type OrderResponse } from "../../services/pedidosService";
import { addUserAddress, addUserCard, cardDtoToStoredCard } from "../../services/userService";
import { clearCart } from "../../services/cartService";

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
  // Local, server-backed cards state (no LocalStorage)
  const [checkoutCards, setCheckoutCards] = useState<StoredUser['paymentCards']>([]);
  const [defaultCardId, setDefaultCardId] = useState<string | undefined>(undefined);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  
  useEffect(() => {
    if (!user?.email) { 
      setStoredUser(null);
      setAddresses([]);
      return; 
    }
    // Reset local user and reload from server
    setStoredUser(null);
    
    // Load profile (brings discounts/benefits)
    if (user?.run) {
      fetchUserProfile(user.run).then(raw => {
        if (raw) {
          setStoredUser({
            run: raw.run || user.run,
            name: raw.nombre || raw.name || user.name || '',
            lastname: raw.apellidos || raw.lastname || '',
            email: raw.correo || raw.email || user.email || '',
            birthdate: raw.fechaNacimiento || raw.birthdate || '',
            role: raw.tipoUsuario || raw.role,
            discountPercent: typeof raw.discountPercent === 'number' ? raw.discountPercent : undefined,
            lifetimeDiscount: raw.lifetimeDiscount ?? (typeof raw.lifetimeDiscountPercent === 'number' ? raw.lifetimeDiscountPercent > 0 : undefined),
            freeCakeVoucher: raw.freeCakeVoucher ?? raw.freeCakeEligible ?? undefined,
            freeCakeRedeemed: raw.freeCakeRedeemed ?? undefined,
            blocked: raw.blocked ?? false,
          } as StoredUser);
        }
      }).catch(err => {
        console.error('Error loading profile:', err);
        setStoredUser(null);
      });

      // Load addresses from server
      fetchUserAddresses(user.run).then(addrs => {
        if (addrs) setAddresses(addrs);
      }).catch(err => {
        console.error('Error loading addresses:', err);
        setAddresses([]);
      });

      // Load cards from server
      fetchUserCards(user.run).then(cards => {
        if (cards) {
          const result: any[] = [];
          for (const card of cards) {
            const mapped = cardDtoToStoredCard(card);
            if (mapped) result.push(mapped);
          }
          setCheckoutCards(result);
          // Select the card marked as default from server, or first one if none is marked
          const defaultCard = result.find((c) => c.isDefault) || result[0];
          setDefaultCardId(defaultCard?.id);
        } else {
          setCheckoutCards([]);
          setDefaultCardId(undefined);
        }
      }).catch(err => {
        console.error('Error loading cards:', err);
        setCheckoutCards([]);
        setDefaultCardId(undefined);
      });
    }
  }, [user]);

  useEffect(() => {
    setBlockedMsg(storedUser?.blocked ? "Tu cuenta está bloqueada. Contacta al administrador para desbloquearla." : "");
  }, [storedUser]);

  // Periodically re-validate blocking status (every 30 seconds) to catch real-time updates
  useEffect(() => {
    const userRun = user?.run;
    if (!userRun) return;
    
    const interval = setInterval(async () => {
      try {
        const freshProfile = await fetchUserProfile(userRun);
        if (freshProfile && (freshProfile.blocked === true || freshProfile.activo === false)) {
          // User was blocked while on checkout page
          if (!storedUser?.blocked) {
            setStoredUser(prev => prev ? { ...prev, blocked: true } : null);
            setBlockedMsg("Tu cuenta ha sido bloqueada. No puedes confirmar pedidos.");
          }
        } else if (freshProfile && freshProfile.blocked === false && storedUser?.blocked) {
          // User was unblocked
          setStoredUser(prev => prev ? { ...prev, blocked: false } : null);
          setBlockedMsg("");
        }
      } catch (err) {
        // Silent fail on validation checks
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [user?.run, storedUser?.blocked]);

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
  const [serverOrder, setServerOrder] = useState<OrderResponse | null>(null);
  const [blockedMsg, setBlockedMsg] = useState<string>("");
  const [orderError, setOrderError] = useState<string>("");

  // determine contributors to the discount for clearer UI
  const isBirthdayTodayFlag = isBirthdayToday(storedUser?.birthdate);
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
  const dynamicBirthdayVoucher = !!(storedUser && isDuocEmail(storedUser.email) && isBirthdayTodayFlag && !storedUser.freeCakeRedeemed);
  // Solo permitir torta gratis si es el día de cumpleaños
  const hasFreeCakeVoucher = (storedUser?.freeCakeVoucher && !storedUser?.freeCakeRedeemed && isBirthdayTodayFlag) || dynamicBirthdayVoucher;

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
  // Apply free cake first, then 50% age discount, then 10% lifetime over the remaining (sequential)
  const { ageDiscountMoneyCalc, codeDiscountMoneyCalc, discountAmount } = useMemo(() => {
    const baseAfterCake = Math.max(0, subtotal - (applyFreeCakeVoucher ? freeCakeAmount : 0));
    // Apply age discount first (50%), then code discount (10%) on the remaining
    const ageMoney = Math.round(baseAfterCake * (ageDiscountPercent / 100));
    const remainingAfterAge = Math.max(0, baseAfterCake - ageMoney);
    const codeMoney = Math.round(remainingAfterAge * (codeDiscountPercent / 100));
    return {
      ageDiscountMoneyCalc: ageMoney,
      codeDiscountMoneyCalc: codeMoney,
      discountAmount: ageMoney + codeMoney,
    };
  }, [subtotal, ageDiscountPercent, codeDiscountPercent, freeCakeAmount, applyFreeCakeVoucher]);
  const shippingAmount = items.length > 0 ? SHIPPING_COST : 0;
  const totalBeforeShipping = Math.max(0, subtotal - discountAmount - freeCakeAmount);
  const total = totalBeforeShipping + shippingAmount;

  function openAddAddressModal() {
    setAddrLine(""); setAddrRegion(""); setAddrComuna(""); setAddAddressError(""); setShowAddAddr(true);
  }

  function cancelAddAddress() {
    setShowAddAddr(false); setAddAddressError("");
  }

  async function handleAddAddress() {
    if (!user?.email) return;
    if (!addrLine.trim() || !addrRegion || !addrComuna) {
      setAddAddressError("Completa dirección, región y comuna para guardar.");
      return;
    }
    if (!user.run) {
      setAddAddressError("No se pudo identificar el usuario. Intenta nuevamente.");
      return;
    }
    setAddAddressError("");
    try {
      const added = await addUserAddress(user.run, { address: addrLine, region: addrRegion, comuna: addrComuna });
      if (!added || !added.id) {
        throw new Error("No se obtuvo la dirección guardada");
      }
      // Add the new address to the local list
      setAddresses([...addresses, added]);
      setSelectedAddressId(added.id);
      setShowAddAddr(false);
    } catch (error) {
      setAddAddressError("No fue posible guardar la dirección. Intenta de nuevo más tarde.");
    }
  }

  function getSelectedAddressLabel(): string {
    const a = addresses.find((x) => x.id === selectedAddressId);
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

  

  async function addCard(cardData: { number: string; holder?: string; expMonth?: string; expYear?: string }) {
    if (!user?.email || !user?.run) return;
    setPaymentMethodError("");
    const last4 = maskLast4(cardData.number);
    if (!last4) {
      setPaymentMethodError("Número de tarjeta inválido.");
      return;
    }
    try {
      const saved = await addUserCard(user.run, {
        cardNumber: cardData.number,
        month: cardData.expMonth ? Number(cardData.expMonth) : undefined,
        year: cardData.expYear ? Number(cardData.expYear) : undefined,
        cardholderName: cardData.holder,
      });
      const storedCard = cardDtoToStoredCard(saved || undefined);
      if (!storedCard) {
        throw new Error("No se pudo formatear la tarjeta");
      }
      // Optimistically update local cards state: append at end
      setCheckoutCards(prev => ([...(prev || []), storedCard]));
      // Light server sync to reconcile without losing the new item
      try {
        const serverCards = await fetchUserCards(user.run);
        if (serverCards) {
          const result: any[] = [];
          for (const card of serverCards) {
            const mapped = cardDtoToStoredCard(card);
            if (mapped) result.push(mapped);
          }
          const normalized = result;
          // Merge by id, preserve optimistic order with new card at the end
          const existingById = new Map<string, any>();
          (normalized || []).forEach(c => { if (c?.id) existingById.set(String(c.id), c); });
          setCheckoutCards(prev => {
            const base = [...(prev || [])];
            const seen = new Set(base.map(c => String(c.id)));
            const merged = [...base];
            normalized.forEach(c => {
              const id = String(c.id);
              if (!seen.has(id)) merged.push(c);
            });
            // Also refresh any details for duplicates from server
            return merged.map(c => existingById.get(String(c.id)) || c);
          });
        }
      } catch {}
      // Set default if none
      setDefaultCardId(prev => prev ?? (storedCard as any).id);
      setSelectedCardId((storedCard as any).id);
    } catch (error) {
      setPaymentMethodError("No fue posible guardar la tarjeta. Intenta de nuevo más tarde.");
    }
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    
    // Re-validate user blocking status before placing order (check for real-time updates)
    if (user?.run) {
      try {
        const freshProfile = await fetchUserProfile(user.run);
        if (freshProfile && (freshProfile.blocked === true || freshProfile.activo === false)) {
          setBlockedMsg("Tu cuenta está bloqueada. Contacta al administrador para desbloquearla.");
          return;
        }
      } catch (err) {
        console.error('Error validating user status:', err);
        // Continue even if validation fails, let backend handle it
      }
    }
    
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
    const freeCakeApplied = applyFreeCakeVoucher && freeCakeAmount > 0 && !!selectedTortaKey;
    const freeCakeMoney = freeCakeApplied ? freeCakeAmount : 0;
    // Apply percent discounts sequentially: age discount first, then code discount on the remaining
    const baseForPercent = Math.max(0, subtotal - freeCakeMoney);
    const ageDiscountMoney = Math.round(baseForPercent * (agePercentApplied / 100));
    const remainingAfterAge = Math.max(0, baseForPercent - ageDiscountMoney);
    const codeDiscountMoney = Math.round(remainingAfterAge * (codePercentApplied / 100));
    const discountPercentMoney = codeDiscountMoney + ageDiscountMoney;
    const totalDiscountMoney = discountPercentMoney + freeCakeMoney;

    const selectedCard = (checkoutCards || []).find(pc => String(pc.id) === String(selectedCardId));

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
      paymentMethodId: selectedCard?.id ?? selectedCardId ?? undefined,
      paymentMethod: selectedCardId ? (() => {
        const pc = selectedCard;
        return pc ? `${pc.brand} **** ${pc.last4}` : String(selectedCardId);
      })() : undefined,
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

    const orderRequest: OrderRequest = {
      userRun: user?.run,
      purchaserCorreo: storedUser?.email,
      total,
      subtotal,
      shippingCost: shippingAmount,
      freeCakeAmount,
      discountAmount: discountAmount,
      fechaEntrega,
      deliveryAddress: addressText,
      applyDiscounts: true,
      applyFreeCakeCoupon: applyFreeCakeVoucher,
      estado: order.estado,
      paymentMethodId: order.paymentMethodId,
      paymentMethod: order.paymentMethod,
      // Provide explicit card metadata for backend variants
      cardId: selectedCard?.id ?? selectedCardId ?? undefined,
      cardLastFour: selectedCard?.last4,
      cardBrand: selectedCard?.brand,
      paymentLastFour: selectedCard?.last4,
      paymentBrand: selectedCard?.brand,
      items: items.map((it) => ({
        productoCodigo: it.code,
        cantidad: it.cantidad || 0,
        mensaje: it.mensaje,
        precioUnitario: it.price,
      })),
      discounts: order.discounts,
    };

    setOrderError("");
    try {
      const response = await createOrder(orderRequest);
      setServerOrder(response || null);
    } catch (err) {
      setOrderError("No fue posible guardar el pedido. Intenta de nuevo más tarde.");
      return;
    }

    // NOTE: localStorage persistence disabled - orders now saved only via API
    // NOTE: Stock updates now handled by backend API
    // NOTE: Free cake redemption now handled by backend when order is created

    // clear cart from database (fallback handles 403 bulk delete)
    if (user?.run) {
      const cleared = await clearCart(user.run);
      if (!cleared) {
        console.warn('No se pudo limpiar el carrito en el servidor.');
      }
    }

    // clear cart locally
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
                <select id="direccionSelect" className="form-select" required={!!addresses.length} value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
                  {!addresses.length ? (
                    <option value="">No tienes direcciones guardadas</option>
                  ) : (
                    <>
                      <option value="">Selecciona…</option>
                      {(addresses || []).map((a) => (
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
                    key={(checkoutCards || []).length}
                    mode="select"
                    paymentCards={checkoutCards || []}
                    defaultCardId={defaultCardId}
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
            {orderError ? <div className="alert alert-danger mb-2">{orderError}</div> : null}
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
                {(ageDiscountPercent > 0 || codeDiscountPercent > 0 || (hasFreeCakeVoucher && freeCakeAmount > 0)) && (
                  <div>
                    <div className="mb-1">Descuentos aplicados:</div>
                    <ul className="list-unstyled small mb-0">
                      {ageDiscountPercent > 0 ? (
                        <li className="d-flex justify-content-between text-success"> 
                          <span>50% beneficio mayores</span>
                          <span>-{formatCLP(ageDiscountMoneyCalc)}</span>
                        </li>
                      ) : null}
                      {codeDiscountPercent > 0 ? (
                        <li className="d-flex justify-content-between text-success"> 
                          <span>10% descuento de por vida (FELICES50)</span>
                          <span>-{formatCLP(codeDiscountMoneyCalc)}</span>
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
                        <span>-{formatCLP(Math.round(discountAmount + (hasFreeCakeVoucher ? freeCakeAmount : 0)))}</span>
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
            <div className="mt-3 text-muted" style={{ fontSize: "0.75rem" }}>
              * Los descuentos se aplican secuencialmente: primero el 50% de mayores, luego el 10% sobre el monto restante.
            </div>
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
          <p className="mb-2">¡Tu pedido ha sido confirmado con éxito!</p>
          {serverOrder ? (
            <div className="small">
              <div className="d-flex justify-content-between"><span>Subtotal</span><span>{formatCLP(serverOrder.subtotal ?? subtotal)}</span></div>
              {serverOrder.freeCakeApplied && typeof serverOrder.freeCakeAmount === 'number' ? (
                <div className="d-flex justify-content-between text-success"><span>Torta gratis</span><span>-{formatCLP(serverOrder.freeCakeAmount)}</span></div>
              ) : null}
              {typeof serverOrder.discountAmount === 'number' && serverOrder.discountAmount > 0 ? (
                <div className="d-flex justify-content-between text-success"><span>Descuentos</span><span>-{formatCLP(serverOrder.discountAmount)}</span></div>
              ) : null}
              <div className="d-flex justify-content-between"><span>Despacho</span><span>{formatCLP(typeof serverOrder.shippingCost === 'number' ? serverOrder.shippingCost : (items.length > 0 ? SHIPPING_COST : 0))}</span></div>
              <hr />
              <div className="d-flex justify-content-between fw-semibold"><span>Total</span><span>{formatCLP(typeof serverOrder.totalConDescuento === 'number' ? serverOrder.totalConDescuento : (serverOrder.total ?? total))}</span></div>
            </div>
          ) : (
            <div>Serás redirigido a tu perfil.</div>
          )}
        </div>
      </Modal>
    </main>
  );
};

export default Checkout;
