import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { products as seedProducts, type Product } from "../../data/products";
import "./Detalle.css";

const personalizables = ["TC001", "TE001", "TE002"];

const clp = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

function getCart() {
  try { return JSON.parse(localStorage.getItem("carrito") || "[]"); } catch { return []; }
}
function setCart(cart: any[]) { localStorage.setItem("carrito", JSON.stringify(cart)); }

export const Detalle: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");

  const [producto, setProducto] = useState<Product | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const catalogo = (() => { try { return JSON.parse(localStorage.getItem("catalogo") || "null"); } catch { return null; } })();
    const fuente = Array.isArray(catalogo) && catalogo.length ? catalogo : seedProducts;
    const found = (fuente || []).find((p: Product) => p.code === code);
    if (!found) {
      setProducto(null);
      return;
    }
    setProducto(found as Product);
  }, [code]);

  const related = useMemo(() => {
    if (!producto) return [];
    const fuente = (() => { try { return JSON.parse(localStorage.getItem("catalogo") || "null"); } catch { return null; } })() || seedProducts;
    const others = (fuente || []).filter((p: Product) => p.code !== producto.code);
    // mezcla simple
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    return others.slice(0, 4);
  }, [producto]);

  if (producto === null) return <div className="container py-5"><p className="text-danger">Producto no encontrado</p></div>;

  const stock = typeof producto.stock === "number" ? producto.stock : 0;

  function addToCart() {
    if (!producto) return;
    const esPersonalizable = personalizables.includes(producto.code);
    // si personalizable y qty>1, aquí simplificamos: si hay mensaje se aplica a cada unidad; para multiselección se podría pedir modal
    const carrito = getCart();
    if (!esPersonalizable) {
      const existing = carrito.find((c: any) => c.code === producto.code && (c.mensaje || "") === "");
      if (existing) existing.cantidad += qty; else carrito.push({ code: producto.code, productName: producto.productName, price: producto.price, img: producto.img, cantidad: qty, mensaje: "" });
      setCart(carrito);
      if ((window as any).updateCartCount) (window as any).updateCartCount();
      return;
    }
    // personalizable: si qty===1 usamos mensaje, si qty>1 tratamos cada unidad como ítem separado con el mismo mensaje
    for (let i = 0; i < qty; i++) {
      const existing = carrito.find((c: any) => c.code === producto.code && (c.mensaje || "") === (mensaje || ""));
      if (existing) existing.cantidad += 1; else carrito.push({ code: producto.code, productName: producto.productName, price: producto.price, img: producto.img, cantidad: 1, mensaje: mensaje || "" });
    }
    setCart(carrito);
    if ((window as any).updateCartCount) (window as any).updateCartCount();
  }

  return (
    <main className="container py-4 detalle-page">
      <div className="row g-4" id="detalle-layout">
        <div className="col-lg-4 text-center">
          <img src={producto.img} alt={producto.productName} className="img-fluid rounded shadow" />
        </div>
        <div className="col-lg-4">
          <div className="border rounded p-3 h-100 bg-light-subtle d-flex flex-column justify-content-between detalle-card-central">
            <div>
              <h1 className="h4 mb-2">{producto.productName}</h1>
              <div id="badgesDetalle" className="d-flex gap-1 flex-wrap mb-3">{/* badges */}
                {producto.category === "productos-sin-azucar" && <span className="badge text-bg-dark">Sin azúcar</span>}
                {producto.category === "productos-sin-gluten" && <span className="badge text-bg-warning">Sin gluten</span>}
                {producto.category === "productos-veganos" && <span className="badge text-bg-success">Vegano</span>}
                {personalizables.includes(producto.code) && <span className="badge text-bg-info">Personalizable</span>}
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
          <div className="border rounded p-3 h-100 bg-light-subtle d-flex flex-column justify-content-between detalle-card-compra">
            <div>
              <span className="h4 d-block mb-2">{clp.format(producto.price)}</span>
              <div className="mt-3 d-flex align-items-center gap-2">
                <button className="btn btn-outline-secondary" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <input type="number" className="form-control text-center" style={{ maxWidth: 80 }} value={qty} min={1} onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))} />
                <button className="btn btn-outline-secondary" onClick={() => setQty(Math.min((typeof producto.stock === 'number' ? producto.stock : 0), qty + 1))}>+</button>
                <span className="badge bg-info text-dark ms-2">Stock: {stock}</span>
              </div>

              {personalizables.includes(producto.code) && (
                <div className="mb-3 mt-3">
                  <label htmlFor="mensajePersonalizado" className="form-label">Mensaje personalizado (opcional)</label>
                  <input id="mensajePersonalizado" className="form-control" value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={60} placeholder="Ej: ¡Feliz Cumpleaños, Ana!" />
                  <div className="form-text">Máx. 60 caracteres.</div>
                </div>
              )}

              <button className="btn btn-dark w-100 mt-3" onClick={() => { addToCart(); navigate('/productos'); }}>
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
              <div className="card-products text-start" tabIndex={0} role="link" style={{ cursor: 'pointer' }} onClick={() => navigate(`/detalle?code=${encodeURIComponent(r.code)}`)}>
                <img src={r.img} alt={r.productName} className="img-fluid" />
                <h3 className="mb-1">{r.productName}</h3>
                <p className="code text-muted mb-1">Código: {r.code}</p>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="price fw-semibold">{clp.format(r.price)}</span>
                  <div className="badges-inline d-flex gap-1 flex-wrap justify-content-end px-3">{/* badges */}
                    {r.category === 'productos-sin-azucar' && <span className="badge text-bg-dark">Sin azúcar</span>}
                    {r.category === 'productos-sin-gluten' && <span className="badge text-bg-warning">Sin gluten</span>}
                    {r.category === 'productos-veganos' && <span className="badge text-bg-success">Vegano</span>}
                    {personalizables.includes(r.code) && <span className="badge text-bg-info">Personalizable</span>}
                  </div>
                </div>
                <button data-code={r.code} className="btn btn-outline-secondary btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/detalle?code=${encodeURIComponent(r.code)}`); }}>
                  <i className="bi bi-eye" /> Ver detalle
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Detalle;
