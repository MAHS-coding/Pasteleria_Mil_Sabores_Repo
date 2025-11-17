import React, { useEffect, useMemo, useState } from "react";
import RatingsSection from "../../components/product/RatingsSection";
import { getRatings, getAverage } from '../../utils/ratings';
import { useSearchParams, useNavigate } from "react-router-dom";
import { products as seedProducts } from "../../utils/dataLoaders";
import type { Product } from "../../types/product";
import styles from "./Detalle.module.css";
import { scrollToTop } from "../../utils/scroll";
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

  // Asegura que al navegar al detalle la vista quede al inicio (importante en mobile)
  useEffect(() => {
    try {
      scrollToTop();
    } catch {
      // no-op
    }
  }, [code]);

  const related = useMemo(() => getRelatedProducts(producto, seedProducts), [producto]);

  if (producto === null) return <div className="container py-5"><p className="text-danger">Producto no encontrado</p></div>;

  const stock = producto?.stock ?? 0;
  const stockBadgeClass = stock > 5 ? styles.stockBadgeHigh : stock > 0 ? styles.stockBadgeLow : styles.stockBadgeEmpty;

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
    // Instead of navigating to /carrito, open the floating cart if present
    try {
      window.dispatchEvent(new CustomEvent('open-cart'));
    } catch (e) {
      // Fallback: navigate to the cart page if dispatch isn't supported
      navigate('/carrito');
    }
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
      <div className="mb-3">
        <button className={styles.backButton} onClick={() => {
          try {
            if (window.history && window.history.length > 1) navigate(-1);
            else navigate('/productos');
          } catch (e) {
            navigate('/productos');
          }
        }} aria-label="Volver">
          <i className="bi bi-arrow-left me-2"></i>Volver
        </button>
      </div>
      <div className="row mb-5 align-items-start">
        <div className="col-lg-6 mb-4">
          <div className={styles.imageCard}>
            <img
              src={producto?.img}
              alt={producto?.productName}
              className="img-fluid"
              onError={(e) => { e.currentTarget.src = '/img/default.jpg'; }}
            />
          </div>
        </div>

        <div className="col-lg-6 d-flex">
          {/* details */}
          <div className={`product-details h-100 flex-fill ${styles.detailsCard}`}>
            <div className="mb-2">
              {isPersonalizable(producto.code) && (
                <span className="badge text-bg-info me-1">Personalizable</span>
              )}
              {(producto.category === 'productos-sin-azucar' || (producto.category || '').includes('sin-azucar')) && (
                <span className="badge text-bg-dark me-1">Sin azúcar</span>
              )}
              {(producto.category === 'productos-sin-gluten' || (producto.category || '').includes('sin-gluten')) && (
                <span className="badge text-bg-warning me-1">Sin gluten</span>
              )}
              {(producto.category === 'productos-veganos' || (producto.category || '').includes('vegan')) && (
                <span className={`badge ${styles.badgeVegano}`}>Vegano</span>
              )}
            </div>
            
            <h1 className={`display-5 fw-bold mb-3 ${styles.title}`}>
              {producto?.productName}
            </h1>

            {/* ratings */}
            {(() => {
              const rese = getRatings(producto.code);
              const avg = getAverage(producto.code).avg || 0;
              return (
                <div className="mb-3">
                  <span className="me-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className={`bi ${i < Math.round(avg) ? 'bi-star-fill' : 'bi-star'} text-warning me-1`} />
                    ))}
                  </span>
                  <span className={styles.ratingMeta}>{(avg).toFixed(1)} ({rese.length} {rese.length === 1 ? 'reseña' : 'reseñas'})</span>
                </div>
              );
            })()}

            <p className={`lead mb-4 ${styles.descripcion}`}>
              {producto?.desc || producto?.productName}
            </p>

            <div className={`${styles.priceCard} ${styles.uniformCard}`}>
              <div className={styles.priceLabel}>Precio</div>
              <div className={styles.priceValue}>
                {formatCLP(producto.price)}
              </div>
            </div>

            <div className="mb-4">
              <div className={`${styles.metaBox} ${styles.uniformCard}`}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className={styles.qtyLabel}>Stock:</span>
                  <span className={`badge ${stockBadgeClass}`}>{stock > 0 ? `${stock} disponibles` : 'Agotado'}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className={styles.qtyLabel}>Código:</span>
                  <span className={styles.codeText}>{producto.code}</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className={`form-label ${styles.qtyLabel}`}>Cantidad:</label>
              <div className={`input-group ${styles.qtyGroup}`}>
                <button className={`btn ${styles.qtyBtn}`} onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>−</button>
                <input type="number" className={`form-control text-center ${styles.qtyInput}`} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(producto?.stock || 1, Number(e.target.value))))} min={1} max={producto?.stock} />
                <button className={`btn ${styles.qtyBtn}`} onClick={() => setQty(Math.min((producto?.stock || 1), qty + 1))} disabled={qty >= (producto?.stock || 0)}>+</button>
              </div>
            </div>

            <div className="d-grid gap-2">
              <button
                className={`btn btn-lg ${styles.addBtn}`}
                onClick={() => addToCart()}
                disabled={!producto || stock === 0}
              >
                <i className="bi bi-bag-plus me-2" />{stock === 0 ? 'Producto Agotado' : 'Agregar al Carrito'}
              </button>
            </div>

            

          </div>
        </div>
      </div>
          <div className="container mt-3">
            <div className="row">
                <div className="col-12">
                <div className={`card shadow-sm ${styles.uniformCard}`}>
                  <div className="card-body">
                    <h5 className="card-title mb-3">Servicios</h5>
                    <ul className="list-unstyled mb-0">
                      <li className="mb-2 small text-muted"><i className="bi bi-shield-check text-success me-2" />Compra protegida y garantizada</li>
                      <li className="mb-2 small text-muted"><i className="bi bi-truck text-primary me-2" />Envíos a todo Chile</li>
                      <li className="mb-2 small text-muted"><i className="bi bi-credit-card-2-front text-warning me-2" />Aceptamos tarjetas y transferencias</li>
                      <li className="small text-muted"><i className="bi bi-clock-history text-info me-2" />Atención personalizada</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ratings section: placed below personalization/add-to-cart and above related products */}
            <div className={`container my-4 ${styles.commentsWrapper}`}>
            <div className={`${styles.commentsCard} ${styles.uniformCard}`}>
              <RatingsSection productCode={producto.code} />
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
