import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { findUserByEmail, updateUser, isDuocEmail, isBirthdayToday, type StoredUser } from "../../utils/registro";
import { products as allProducts, regions } from "../../utils/dataLoaders";
import { formatCLP } from "../../utils/currency";
import Modal from "../../components/ui/Modal";
import FormField from "../../components/ui/FormField";
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

  // address management
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrLine, setAddrLine] = useState("");
  const [addrRegion, setAddrRegion] = useState("");
  const [addrComuna, setAddrComuna] = useState("");
  const [addAddressError, setAddAddressError] = useState("");

  // delivery date
  const [fechaEntrega, setFechaEntrega] = useState<string>(todayYYYYMMDD());

  // confirmation modal after placing order
  const [confirmPlacedOpen, setConfirmPlacedOpen] = useState(false);

  const discountPercent = storedUser?.discountPercent ?? 0;
  const dynamicBirthdayVoucher = !!(storedUser && isDuocEmail(storedUser.email) && isBirthdayToday(storedUser.birthdate) && !storedUser.freeCakeRedeemed);
  const hasFreeCakeVoucher = !!(storedUser?.freeCakeVoucher && !storedUser?.freeCakeRedeemed) || dynamicBirthdayVoucher;

  // Respect user's choice (from Cart) to apply the birthday voucher
  const userKey = (storedUser?.email || "guest").toLowerCase();
  const PREF_KEY = `cart.useBirthdayVoucher:${userKey}`;
  const wantsVoucher = useMemo(() => {
    try {
      const v = sessionStorage.getItem(PREF_KEY);
      return v == null ? true : v === "true";
    } catch { return true; }
  }, [PREF_KEY]);
  const applyFreeCakeVoucher = hasFreeCakeVoucher && wantsVoucher;

  const tortaItems = useMemo(() => {
    return items.filter((it) => {
      const p = allProducts.find((p) => p.code === it.code);
      return !!p && typeof p.category === "string" && p.category.startsWith("tortas");
    });
  }, [items]);

  const selectedTortaKey = useMemo(() => {
    if (!applyFreeCakeVoucher || tortaItems.length === 0) return null;
    const it = tortaItems[0];
    return `${it.code}::${it.mensaje || ""}`;
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

  function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    if (!fechaEntrega) return;
    const today = new Date();
    const selected = new Date(fechaEntrega + "T00:00:00");
    if (selected.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) {
      // simple guard; UI already restricts min
      return;
    }

    let addressText = getSelectedAddressLabel();
    if (!addressText) {
      // if no address saved/selected, force modal to add one
      setShowAddAddr(true);
      return;
    }

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
    };

    // persist into 'ordenes'
    try {
      const prev: Order[] = getJSON<Order[]>("ordenes") || [];
      prev.push(order);
      setJSON("ordenes", prev as any);
    } catch {}

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
    } catch {}

    // mark free cake redeemed if applied
    try {
      if (applyFreeCakeVoucher && freeCakeAmount > 0 && storedUser?.email) {
        updateUser(storedUser.email, { freeCakeVoucher: false, freeCakeRedeemed: true });
      }
    } catch {}

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
          <form className="card p-3 shadow-sm" onSubmit={placeOrder}>
            <div className="mb-3">
              <label htmlFor="fechaEntrega" className="form-label">Fecha de entrega</label>
              <input id="fechaEntrega" type="date" className="form-control" required min={todayYYYYMMDD()} value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
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
                <button className="btn btn-outline-primary" type="button" title="Agregar nueva dirección" onClick={openAddAddressModal}><i className="bi bi-plus-circle"></i></button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={items.length === 0}>Confirmar pedido</button>
          </form>
        </div>

        <div className="col-12 col-lg-4 order-0 order-lg-1">
          <div id="checkout-resumen" className="card card-resumen p-3 mb-3">
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
                <div className="d-flex justify-content-between">
                  <span>Subtotal</span>
                  <span>{formatCLP(subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Despacho</span>
                  <span>{formatCLP(items.length > 0 ? SHIPPING_COST : 0)}</span>
                </div>
                {(discountPercent > 0 || (hasFreeCakeVoucher && freeCakeAmount > 0)) && (
                  <div className="d-flex justify-content-between">
                    <span>Descuentos</span>
                    <span className="text-success">-{formatCLP((subtotal * (discountPercent / 100)) + freeCakeAmount)}</span>
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
