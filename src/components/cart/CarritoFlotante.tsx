import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getProductByCode } from '../../utils/products';
import { formatCLP } from '../../utils/currency';
import styles from './CarritoFlotante.module.css';

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

  // Listen for a global event to open the cart from other components
  // Listen for a global event to open the cart from other components
  useEffect(() => {
    const onOpenCart = () => setIsOpen(true);
    window.addEventListener('open-cart', onOpenCart as EventListener);
    return () => window.removeEventListener('open-cart', onOpenCart as EventListener);
  }, []);

  // Ref to the aside so we can detect clicks inside the cart
  const asideRef = useRef<HTMLElement | null>(null);
  // Track touch start Y for touchmove edge handling
  const touchStartY = useRef<number | null>(null);

  // When the cart is open, prevent navigation by blocking clicks on
  // anchor (<a>) elements that are outside the cart. This stops user
  // from navigating away while the cart overlay is active. We use
  // capture phase to intercept before React Router handles the click.
  useEffect(() => {
    if (!isOpen) return;

    const clickHandler = (e: Event) => {
      try {
        const me = e as MouseEvent;
        const target = me.target as HTMLElement | null;
        if (!target) return;
        const anchor = target.closest('a');
        if (anchor && asideRef.current && !asideRef.current.contains(anchor)) {
          // Prevent navigation/clicks to links outside the cart
          e.preventDefault();
          e.stopPropagation();
        }
      } catch {
        // ignore
      }
    };

    const keyHandler = (e: KeyboardEvent) => {
      try {
        if (e.key === 'Enter') {
          const active = document.activeElement as HTMLElement | null;
          if (active) {
            const anchor = active.closest && active.closest('a');
            if (anchor && asideRef.current && !asideRef.current.contains(anchor)) {
              e.preventDefault();
              e.stopPropagation();
            }
          }
        }
      } catch {}
    };

    document.addEventListener('click', clickHandler, true);
    document.addEventListener('keydown', keyHandler, true);
    return () => {
      document.removeEventListener('click', clickHandler, true);
      document.removeEventListener('keydown', keyHandler, true);
    };
  }, [isOpen]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => {
    setIsOpen(false);
    try {
      // Clean up any temporary history marker we may have pushed when opening the cart
      window.history.replaceState(null, document.title, window.location.href);
    } catch {
      // ignore
    }
  };

  // Prevent browser back/forward while cart is open and disable scroll outside the aside
  useEffect(() => {
    if (!isOpen) return;

    const marker = { cartOpen: true };
    try {
      window.history.pushState(marker, document.title, window.location.href);
    } catch {}

    const onPop = () => {
      try {
        // Re-push the marker to avoid navigating away while cart is open
        window.history.pushState(marker, document.title, window.location.href);
      } catch {}
    };

    const wheelHandler = (e: WheelEvent) => {
      try {
        const target = e.target as Node | null;
        if (asideRef.current && target && !asideRef.current.contains(target)) {
          e.preventDefault();
        }
      } catch {}
    };

    const touchHandler = (e: TouchEvent) => {
      try {
        const target = e.target as Node | null;
        if (asideRef.current && target && !asideRef.current.contains(target)) {
          e.preventDefault();
        }
      } catch {}
    };

    window.addEventListener('popstate', onPop);
    document.addEventListener('wheel', wheelHandler, { passive: false });
    document.addEventListener('touchmove', touchHandler, { passive: false });

    return () => {
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('wheel', wheelHandler);
      document.removeEventListener('touchmove', touchHandler);
      try { window.history.replaceState(null, document.title, window.location.href); } catch {}
    };
  }, [isOpen]);

  // Prevent overscroll from propagating to the page when scrolling the aside.
  // When the aside reaches its top or bottom, consume the wheel/touchmove so the
  // underlying page does not start scrolling.
  useEffect(() => {
    if (!isOpen) return;
    const el = asideRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      try {
        const delta = e.deltaY;
        const scrollTop = el.scrollTop;
        const scrollHeight = el.scrollHeight;
        const clientHeight = el.clientHeight;

        const atTop = scrollTop <= 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1; // tolerance

        if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      } catch {}
    };

    const onTouchStart = (e: TouchEvent) => {
      try {
        touchStartY.current = e.touches && e.touches.length ? e.touches[0].clientY : null;
      } catch {}
    };

    const onTouchMove = (e: TouchEvent) => {
      try {
        const startY = touchStartY.current;
        if (startY == null) return;
        const currentY = e.touches && e.touches.length ? e.touches[0].clientY : startY;
        const delta = startY - currentY; // positive = scroll up

        const scrollTop = el.scrollTop;
        const scrollHeight = el.scrollHeight;
        const clientHeight = el.clientHeight;
        const atTop = scrollTop <= 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

        if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      } catch {}
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart as any);
      el.removeEventListener('touchmove', onTouchMove as any);
      touchStartY.current = null;
    };
  }, [isOpen]);

  const total = items.reduce((s, it) => s + ((it.price || 0) * (it.cantidad || 0)), 0);

  return (
    <>
      <button
        onClick={openCart}
        className={styles['floating-cart-btn']}
        aria-label="Abrir carrito"
      >
        <div className={styles['cart-icon']}>
          <i className="bi bi-basket-fill"></i>
          {count > 0 && (
            <span className={styles['cart-badge']}>{count > 99 ? '99+' : count}</span>
          )}
        </div>
      </button>

  <div className={`${styles['cart-overlay']} ${isOpen ? styles['overlayActive'] : ''}`} onClick={closeCart} />

  <aside ref={(el) => { asideRef.current = el; }} style={{ overflowY: 'auto', maxHeight: '100vh', overscrollBehavior: 'contain' }} className={`${styles['cart-sidebar']} ${isOpen ? styles['sidebarActive'] : ''}`} aria-hidden={!isOpen}>
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
                  <div key={`${item.code}::${item.mensaje || ''}`} className={`${styles['cart-item']} mb-3 p-2 border rounded`}>
                    <div className="d-flex gap-3">
                      <img src={item.img || '/images/placeholder.png'} alt={item.productName} className={styles['cart-item-image']} />
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
            <div className={`${styles['cart-footer']} p-3 border-top`}>
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
