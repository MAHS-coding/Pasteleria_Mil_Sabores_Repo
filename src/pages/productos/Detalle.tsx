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

const Detalle: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");

  const [producto, setProducto] = useState<Product | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [mensaje, setMensaje] = useState("");
  const { addMultiple, add } = useCart();
  const [showMessageWizard, setShowMessageWizard] = useState(false);
  const [wizardMessages, setWizardMessages] = useState<string[]>([]);
  const [wizardIndex, setWizardIndex] = useState(0);
  const [wizardInput, setWizardInput] = useState("");

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

  function addToCart() {
    if (!producto) return;
    const esPersonalizable = isPersonalizable(producto.code);
    if (!esPersonalizable) {
      // use addMultiple to add qty
      addMultiple({ code: producto.code, productName: producto.productName, price: producto.price, img: producto.img }, qty);
      setMensaje("");
      navigate("/productos");
      return;
    }

    if (qty <= 1) {
      const trimmed = mensaje.trim();
      add({ code: producto.code, productName: producto.productName, price: producto.price, img: producto.img, mensaje: trimmed ? trimmed : undefined });
      setMensaje("");
      navigate("/productos");
      return;
    }

    const initialMessages = Array.from({ length: qty }, (_, idx) => (idx === 0 ? mensaje : ""));
    setWizardMessages(initialMessages);
    setWizardIndex(0);
    setWizardInput(initialMessages[0] ?? "");
    setShowMessageWizard(true);
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

    nextMessages.forEach((msg) => {
      const trimmed = (msg || "").trim();
      add({ code: producto.code, productName: producto.productName, price: producto.price, img: producto.img, mensaje: trimmed ? trimmed : undefined });
    });
    closeWizard();
    setMensaje("");
    navigate("/productos");
  }

  function handleWizardCancel() {
    closeWizard();
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
    </main>
  );
};

export default Detalle;
