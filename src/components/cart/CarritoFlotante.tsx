import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getProductByCode } from '../../utils/products';
import { formatCLP } from '../../utils/currency';
import './CarritoFlotante.css';

export const CarritoFlotante: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { items, count, setQuantity, remove, clear } = useCart();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const total = items.reduce((s, it) => s + ((it.price || 0) * (it.cantidad || 0)), 0);

  return (
    <>
      <button
        onClick={openCart}
        className="floating-cart-btn"
        aria-label="Abrir carrito"
      >
        <div className="cart-icon">
          <i className="bi bi-basket-fill"></i>
          {count > 0 && (
            <span className="cart-badge">{count > 99 ? '99+' : count}</span>
          )}
        </div>
      </button>

      <div className={`cart-overlay ${isOpen ? 'active' : ''}`} onClick={closeCart} />

      <aside className={`cart-sidebar ${isOpen ? 'active' : ''}`} aria-hidden={!isOpen}>
        <div className="cart-header">
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h5 className="mb-0 fw-bold text-white">
              <i className="bi bi-cart3 me-2"></i>
              Mi Carrito
            </h5>
            <button className="btn btn-link text-muted p-0" onClick={closeCart} aria-label="Cerrar carrito">
              <i className="bi bi-x fs-4"></i>
            </button>
          </div>
        </div>

        <div className="cart-body p-3">
          {items.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-basket fa-3x text-muted mb-3"></i>
              <p className="text-muted">Tu carrito está vacío</p>
              <Link to="/productos" className="btn" onClick={closeCart} style={{ background: 'var(--accent-main)', color: '#fff', border: 'none' }}>
                <i className="bi bi-shop me-2"></i> Ver Productos
              </Link>
            </div>
          ) : (
            <>
              {items.map((item) => {
                const product = getProductByCode(item.code) as any;
                const stock = typeof product?.stock === 'number' ? product.stock : Infinity;
                const subtotal = (item.price || 0) * (item.cantidad || 0);

                return (
                  <div key={`${item.code}::${item.mensaje || ''}`} className="cart-item mb-3 p-2 border rounded">
                    <div className="d-flex gap-3">
                      <img src={item.img || '/images/placeholder.png'} alt={item.productName} className="cart-item-image" />
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{item.productName}</h6>
                        <p className="fw-bold mb-2" style={{ color: 'var(--accent-main)' }}>{formatCLP(item.price || 0)}</p>

                        <div className="d-flex align-items-center gap-2">
                          <button
                            onClick={() => setQuantity(item.code, item.mensaje, (item.cantidad || 1) - 1)}
                            className="btn btn-sm btn-outline-secondary"
                            disabled={(item.cantidad || 0) <= 1}
                          >
                            <i className="bi bi-dash"></i>
                          </button>
                          <span className="fw-bold">{item.cantidad}</span>
                          <button
                            onClick={() => setQuantity(item.code, item.mensaje, (item.cantidad || 0) + 1)}
                            className="btn btn-sm btn-outline-secondary"
                            disabled={typeof stock === 'number' && (item.cantidad || 0) >= stock}
                          >
                            <i className="bi bi-plus"></i>
                          </button>

                          <button
                            onClick={() => remove(item.code, item.mensaje)}
                            className="btn btn-sm btn-outline-danger ms-auto"
                            title="Eliminar"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>

                        {typeof stock === 'number' && (item.cantidad || 0) >= stock && (
                          <small className="text-danger d-block mt-1">Stock máximo alcanzado</small>
                        )}
                      </div>
                    </div>

                    <div className="text-end mt-2 pt-2 border-top">
                      <small className="text-muted">Subtotal: </small>
                      <span className="fw-bold" style={{ color: 'var(--accent-main)' }}>{formatCLP(subtotal)}</span>
                    </div>
                  </div>
                );
              })}

              {items.length > 0 && (
                <button onClick={() => clear()} className="btn btn-outline-danger btn-sm w-100 mt-2">
                  <i className="bi bi-trash-fill me-2"></i> Vaciar Carrito
                </button>
              )}
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer p-3 border-top">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-bold">Total:</span>
              <span className="h5 mb-0 fw-bold" style={{ color: 'var(--accent-main)' }}>{formatCLP(total)}</span>
            </div>

            <Link to="/checkout" className="btn w-100 mb-2" onClick={closeCart}>
              <i className="bi bi-credit-card me-2"></i> Finalizar Compra
            </Link>

            <Link to="/productos" className="btn w-100" onClick={closeCart} style={{ background: 'transparent', border: '1px solid var(--accent-main)', color: 'var(--accent-main)' }}>
              <i className="bi bi-shop me-2"></i> Seguir Comprando
            </Link>
          </div>
        )}
      </aside>
    </>
  );
};

export default CarritoFlotante;
