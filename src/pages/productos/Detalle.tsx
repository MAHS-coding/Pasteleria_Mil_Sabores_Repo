import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { products as seedProducts } from "../../utils/dataLoaders";
import type { Product } from "../../types/product";
import styles from "./Detalle.module.css";
import ProductCard from "../../components/product/ProductCard";
import { useCart } from "../../context/CartContext";
import { getRelatedProducts, isPersonalizable, getProductByCode } from "../../utils/products";
import { formatCLP } from "../../utils/currency";
import Modal from "../../components/ui/Modal";
import { STOCK_INSUFICIENTE_TITLE, STOCK_INSUFICIENTE_MSG, CANTIDAD_AJUSTADA_TITLE, soloQuedanUnidades, seSolicitaranMensajes } from "../../utils/messages";

const Detalle: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");

  const [producto, setProducto] = useState<Product | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [mensaje, setMensaje] = useState("");
  const { items, addMultiple, add, addPersonalizedBatch } = useCart();
  const [showMessageWizard, setShowMessageWizard] = useState(false);
  const [wizardMessages, setWizardMessages] = useState<string[]>([]);
  const [wizardIndex, setWizardIndex] = useState(0);
  const [wizardInput, setWizardInput] = useState("");
  const [showAddedConfirm, setShowAddedConfirm] = useState(false);
  const [addedExtraMessage, setAddedExtraMessage] = useState<string>("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoTitle, setInfoTitle] = useState<string>("Aviso");
  const [infoMessage, setInfoMessage] = useState<string>("");
  const [adjustedFromQty, setAdjustedFromQty] = useState<number | null>(null);
  const [pendingWizardQtyToAdd, setPendingWizardQtyToAdd] = useState<number | null>(null);

  useEffect(() => {
    const found = getProductByCode(code, seedProducts);
    if (!found) {
      setProducto(null);
      return;
    }
    setProducto(found as Product);
  }, [code]);

  const related = useMemo(() => getRelatedProducts(producto, seedProducts), [producto]);

  if (producto === null) return <div className="container py-5"><p className="text-danger">Producto no encontrado</p></div>;

  const stock = typeof producto.stock === "number" ? producto.stock : 0;

  function buildInitialMessages(count: number) {
    return Array.from({ length: count }, (_, idx) => (idx === 0 ? mensaje : ""));
  }

  function openWizardWithCount(count: number) {
    const initialMessages = buildInitialMessages(count);
    setWizardMessages(initialMessages);
    setWizardIndex(0);
    setWizardInput(initialMessages[0] ?? "");
    setShowMessageWizard(true);
  }

  function addToCart() {
    if (!producto) return;
    const desiredQty = Math.max(1, qty);
    const esPersonalizable = isPersonalizable(producto.code);
    // clear any previous extra message for a fresh add attempt
    setAddedExtraMessage("");
    if (!esPersonalizable) {
      const addedUnits = addMultiple({ code: producto.code, productName: producto.productName, price: producto.price, img: producto.img }, desiredQty);
      if (addedUnits <= 0) {
        setInfoTitle(STOCK_INSUFICIENTE_TITLE);
        setInfoMessage(STOCK_INSUFICIENTE_MSG);
        setInfoOpen(true);
        return;
      }
      if (addedUnits < desiredQty) {
        setAddedExtraMessage(`Solo se agregaron ${addedUnits} de ${desiredQty} unidades por disponibilidad de stock.`);
      }
      setMensaje("");
      setShowAddedConfirm(true);
      return;
    }

    // Personalized flow: check available stock BEFORE opening the wizard
    const currentInCart = items.reduce((s, it) => it.code === producto.code ? s + (it.cantidad || 0) : s, 0);
    const prodStock = typeof producto.stock === 'number' ? producto.stock : 0;
    const available = Math.max(0, prodStock - currentInCart);

    if (available <= 0) {
      setInfoTitle(STOCK_INSUFICIENTE_TITLE);
      setInfoMessage(STOCK_INSUFICIENTE_MSG);
      setInfoOpen(true);
      return;
    }

    if (desiredQty <= 1) {
      const trimmed = mensaje.trim();
      const added = add({ code: producto.code, productName: producto.productName, price: producto.price, img: producto.img, mensaje: trimmed ? trimmed : undefined });
      if (!added) {
        setInfoTitle(STOCK_INSUFICIENTE_TITLE);
        setInfoMessage(STOCK_INSUFICIENTE_MSG);
        setInfoOpen(true);
        return;
      }
      setMensaje("");
      setShowAddedConfirm(true);
      return;
    }

    if (available === 1) {
      const qtyToAdd = 1;
      setInfoTitle(CANTIDAD_AJUSTADA_TITLE);
      setInfoMessage(`${soloQuedanUnidades(qtyToAdd)} ${seSolicitaranMensajes(qtyToAdd)}`);
      setAdjustedFromQty(desiredQty);
      setPendingWizardQtyToAdd(1);
      setInfoOpen(true);
      return;
    }

    const qtyToAdd = Math.min(desiredQty, available);
    if (qtyToAdd < desiredQty) {
      setInfoTitle(CANTIDAD_AJUSTADA_TITLE);
      setInfoMessage(`${soloQuedanUnidades(qtyToAdd)} ${seSolicitaranMensajes(qtyToAdd)}`);
      setAdjustedFromQty(desiredQty);
      setPendingWizardQtyToAdd(qtyToAdd);
      setInfoOpen(true);
      return;
    }

    // No adjustment needed, open wizard immediately
    openWizardWithCount(qtyToAdd);
  }

  function closeWizard() {
    setShowMessageWizard(false);
    setWizardMessages([]);
    setWizardIndex(0);
    setWizardInput("");
  }

  function handleWizardConfirm() {
    if (!producto) return;
    const nextMessages = [...wizardMessages];
    nextMessages[wizardIndex] = wizardInput;

    if (wizardIndex + 1 < nextMessages.length) {
      setWizardMessages(nextMessages);
      const nextIndex = wizardIndex + 1;
      setWizardIndex(nextIndex);
      setWizardInput(nextMessages[nextIndex] ?? "");
      return;
    }

    // All messages collected; add them atomically respecting stock
    const addedCount = addPersonalizedBatch(
      { code: producto.code, productName: producto.productName, price: producto.price, img: producto.img },
      nextMessages.map((m) => {
        const t = (m || "").trim();
        return t.length > 0 ? t : undefined;
      })
    );

    if (addedCount === 0) {
      setInfoTitle(STOCK_INSUFICIENTE_TITLE);
      setInfoMessage(STOCK_INSUFICIENTE_MSG);
      setInfoOpen(true);
      closeWizard();
      return;
    }
    // Show accurate "added of desired" message using original desired when it was adjusted
    const requestedTotal = adjustedFromQty ?? nextMessages.length;
    if (addedCount < requestedTotal) {
      setAddedExtraMessage(`Solo se agregaron ${addedCount} de ${requestedTotal} unidades por disponibilidad de stock.`);
    }
    closeWizard();
    setMensaje("");
    setShowAddedConfirm(true);
    if (adjustedFromQty) setAdjustedFromQty(null);
  }

  function closeAddedConfirm() {
    setShowAddedConfirm(false);
    // clear any leftover extra message
    setAddedExtraMessage("");
  }

  function goToCart() {
    setShowAddedConfirm(false);
    navigate("/carrito");
  }

  function handleWizardCancel() {
    closeWizard();
    // clear any pending single-add flow
    setAdjustedFromQty(null);
    setPendingWizardQtyToAdd(null);
  }

  // Info modal dismiss handler: if there is a pending wizard quantity, open the wizard now
  function handleInfoDismiss() {
    setInfoOpen(false);
    if (pendingWizardQtyToAdd && producto) {
      // open the multi-step wizard now that the info modal is closed
      const qtyToAdd = pendingWizardQtyToAdd;
      setPendingWizardQtyToAdd(null);
      openWizardWithCount(qtyToAdd);
    }
  }

  return (
    <main className={`container py-4 ${styles.detallePage}`}>
      <div className="row g-4" id="detalle-layout">
        <div className="col-lg-4 text-center">
          <img src={producto.img} alt={producto.productName} className="img-fluid rounded shadow" />
        </div>
        <div className="col-lg-4">
          <div className={`border rounded p-3 h-100 bg-light-subtle d-flex flex-column justify-content-between ${styles.detalleCardCentral}`}>
            <div>
              <h1 className="h4 mb-2">{producto.productName}</h1>
              <div id="badgesDetalle" className="d-flex gap-1 flex-wrap mb-3">{/* badges */}
                {producto.category === "productos-sin-azucar" && <span className="badge text-bg-dark">Sin azúcar</span>}
                {producto.category === "productos-sin-gluten" && <span className="badge text-bg-warning">Sin gluten</span>}
                {producto.category === "productos-veganos" && <span className="badge text-bg-success">Vegano</span>}
                {isPersonalizable(producto.code) && <span className="badge text-bg-info">Personalizable</span>}
              </div>
              <p className="small text-muted mb-3">{producto.desc || "Producto artesanal, hecho con ingredientes frescos."}</p>
            </div>
            <div>
              <h2 className="h6 mt-3">¿Por qué elegir este producto?</h2>
              <ul className="list-unstyled small mb-3">
                <li><i className="bi bi-check-circle-fill text-success me-2" />Ingredientes frescos y de calidad</li>
                <li><i className="bi bi-check-circle-fill text-success me-2" />Receta artesanal exclusiva</li>
                <li><i className="bi bi-check-circle-fill text-success me-2" />Personalización disponible</li>
                <li><i className="bi bi-check-circle-fill text-success me-2" />Entrega rápida y segura</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className={`border rounded p-3 h-100 bg-light-subtle d-flex flex-column justify-content-between ${styles.detalleCardCompra}`}>
            <div>
              <span className="h4 d-block mb-2">{formatCLP(producto.price)}</span>
              <div className="mt-3 d-flex align-items-center gap-2">
                <button className="btn btn-outline-secondary" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <input type="number" className="form-control text-center" style={{ maxWidth: 80 }} value={qty} min={1} onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))} />
                <button className="btn btn-outline-secondary" onClick={() => setQty(Math.min((typeof producto.stock === 'number' ? producto.stock : 0), qty + 1))}>+</button>
                <span className="badge bg-info text-dark ms-2">Stock: {stock}</span>
              </div>

              {isPersonalizable(producto.code) && (
                <div className="mb-3 mt-3">
                  <label htmlFor="mensajePersonalizado" className="form-label">Mensaje personalizado (opcional)</label>
                  <input id="mensajePersonalizado" className="form-control" value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={60} placeholder="Ej: ¡Feliz Cumpleaños, Ana!" />
                  <div className="form-text">Máx. 60 caracteres.</div>
                </div>
              )}

              <button className="btn btn-dark w-100 mt-3" onClick={() => { addToCart(); }}>
                <i className="bi bi-bag-plus me-2" /> Agregar al Carrito
              </button>
            </div>
            <div className="mt-4">
              <div className="mb-2 small text-muted"><i className="bi bi-shield-check text-success me-1" />Compra protegida y garantizada</div>
              <div className="mb-2 small text-muted"><i className="bi bi-truck text-primary me-1" />Envíos a todo Chile</div>
              <div className="mb-2 small text-muted"><i className="bi bi-credit-card-2-front text-warning me-1" />Aceptamos tarjetas y transferencias</div>
              <div className="mb-2 small text-muted"><i className="bi bi-clock-history text-info me-1" />Atención personalizada</div>
            </div>
          </div>
        </div>
      </div>

      {/* Productos relacionados */}
      <div className="container my-5">
        <h2 className="mb-4">También te podría interesar</h2>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
          {related.map((r: Product) => (
            <div key={r.code} className="col">
              <ProductCard p={r} />
            </div>
          ))}
        </div>
      </div>

      <Modal
        show={showMessageWizard}
        title={wizardMessages.length > 1 ? `Mensaje ${wizardIndex + 1} de ${wizardMessages.length}` : "Mensaje personalizado"}
        onClose={handleWizardCancel}
        onConfirm={handleWizardConfirm}
        confirmLabel={wizardIndex + 1 < wizardMessages.length ? "Siguiente" : "Agregar al carrito"}
        cancelLabel="Cancelar"
      >
        <div className="mb-3">
          <label htmlFor="detalleMensajeWizard" className="form-label">Mensaje para esta torta (opcional)</label>
          <input
            id="detalleMensajeWizard"
            className="form-control"
            maxLength={60}
            value={wizardInput}
            onChange={(event) => setWizardInput(event.target.value)}
            placeholder="Ej: ¡Feliz Cumpleaños, Ana!"
            autoFocus
          />
          <div className="form-text">Máximo 60 caracteres. Puedes dejarlo vacío.</div>
        </div>
      </Modal>

      {/* Confirmation when product added */}
      <Modal
        show={showAddedConfirm}
        title="Producto agregado"
        onClose={closeAddedConfirm}
        onConfirm={goToCart}
        confirmLabel="Ver carrito"
        cancelLabel="Seguir en este producto"
      >
        <div className="text-center">
          <i className="bi bi-cart-check text-success fs-1 mb-2"></i>
          <p className="mb-0">{producto ? <strong>{producto.productName}</strong> : "El producto"} ha sido agregado al carrito.</p>
          {addedExtraMessage && <p className="mt-2 text-muted">{addedExtraMessage}</p>}
        </div>
      </Modal>

      {/* Info modal replacing alerts */}
      <Modal
        show={infoOpen}
        title={infoTitle}
        onClose={handleInfoDismiss}
        onConfirm={handleInfoDismiss}
        confirmLabel="Aceptar"
      >
        <div>{infoMessage}</div>
      </Modal>
    </main>
  );
};

export default Detalle;
