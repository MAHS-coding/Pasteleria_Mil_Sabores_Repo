import React, { useEffect, useState } from "react";
import { getRatings, addRating, getAverage, removeRating, type Rating } from "../../utils/ratings";
import Modal from "../ui/Modal";
import { useAuth } from "../../context/AuthContext";
import useInfoModal from "../../hooks/useInfoModal";
import styles from "./RatingsSection.module.css";

type Props = {
  productCode: string;
};

const RatingsSection: React.FC<Props> = ({ productCode }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [avg, setAvg] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });
  const [newStars, setNewStars] = useState<number>(0);
  const [newComment, setNewComment] = useState<string>("");
  const { user } = useAuth();
  const { InfoModal, showInfo } = useInfoModal();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteIdx, setPendingDeleteIdx] = useState<number | null>(null);

  useEffect(() => {
    setRatings(getRatings(productCode));
    setAvg(getAverage(productCode));

    const handler = (ev: Event) => {
      try {
        const ce = ev as CustomEvent;
        if (!ce?.detail || ce.detail.productCode !== productCode) return;
        setRatings(getRatings(productCode));
        setAvg(getAverage(productCode));
      } catch {
        // ignore
      }
    };

    const storageHandler = (ev: StorageEvent) => {
      if (ev.key === 'product_ratings_v1') {
        setRatings(getRatings(productCode));
        setAvg(getAverage(productCode));
      }
    };

    window.addEventListener('ratings-updated', handler as EventListener);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('ratings-updated', handler as EventListener);
      window.removeEventListener('storage', storageHandler);
    };
  }, [productCode]);

  function submitRating(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!user || !user.email) {
      // trigger global login modal
      window.dispatchEvent(new CustomEvent('open-login'));
      return;
    }
    if (!newStars || newStars < 1 || newStars > 5) {
      showInfo('Calificación requerida', 'Por favor selecciona entre 1 y 5 estrellas.', 'Aceptar');
      return;
    }
    const txt = (newComment || "").trim();
    if (!txt) {
      showInfo('Comentario requerido', 'Por favor escribe un comentario para acompañar tu calificación.');
      return;
    }
    const r: Rating = {
      userEmail: String(user.email),
      userName: user.name || (user as any).nombre || undefined,
      stars: newStars,
      comment: txt,
      date: new Date().toISOString(),
    };
    addRating(productCode, r);
    // read fresh list from storage (addRating already persisted it and dispatched update)
    setRatings(getRatings(productCode));
    setAvg(getAverage(productCode));
    setNewStars(0);
    setNewComment("");
    showInfo('Gracias', 'Tu calificación fue registrada.');
  }

  function handleDelete(idx: number) {
    if (!user || !user.email) return;
    const r = ratings[idx];
    if (!r) return;
    if (String(r.userEmail).toLowerCase() !== String(user.email).toLowerCase()) return;
    setPendingDeleteIdx(idx);
    setConfirmOpen(true);
  }

  function confirmDelete() {
    const idx = pendingDeleteIdx;
    setConfirmOpen(false);
    setPendingDeleteIdx(null);
    if (idx === null || idx === undefined) return;
    removeRating(productCode, idx);
    setRatings(getRatings(productCode));
    setAvg(getAverage(productCode));
    showInfo('Eliminado', 'Tu calificación fue eliminada.', 'Aceptar');
  }

  function cancelDelete() {
    setConfirmOpen(false);
    setPendingDeleteIdx(null);
  }

  return (
    <section aria-label="Calificaciones" className={`mt-4 ${styles.ratingsSection}`}>
      <h3 className="h5">Calificaciones</h3>
      <div className={`${styles.ratingsCard} mt-2`}> 
        <div className={styles.headerRow}>
          <div className={styles.avgValue}>{avg.count > 0 ? avg.avg.toFixed(1) : '0.0'}</div>
          <div className={`${styles.starsInline}`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <i key={i} className={`bi ${i < Math.round(avg.avg) ? 'bi-star-fill' : 'bi-star'} me-1`} />
            ))}
            <small className={`ms-2 ${styles.countText}`}>{avg.count > 0 ? `(${avg.count})` : 'Sin calificaciones'}</small>
          </div>
        </div>

        <form onSubmit={submitRating} className={`mt-3 ${styles.formControls}`}>
          <div className="mb-2">
            <label className="form-label small">Tu calificación</label>
            <div>
              {Array.from({ length: 5 }).map((_, i) => {
                const idx = i + 1;
                const cls = newStars >= idx ? 'bi-star-fill' : 'bi-star';
                return (
                  <button key={idx} type="button" className="btn btn-sm btn-link p-0 me-1" onClick={() => setNewStars(idx)} aria-label={`${idx} estrellas`}>
                    <i className={`bi ${cls} text-warning fs-4`} />
                  </button>
                );
              })}
            </div>
          </div>

            <div className="mb-2">
              <textarea
                className={`form-control ${styles.fixedTextarea}`}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario (obligatorio)"
                rows={3}
                aria-label="Comentario sobre el producto"
              />
            </div>

          <div className={styles.submitRow}>
            <button className={`btn btn-sm ${styles.publishBtn}`} type="submit"><i className="bi bi-send-fill me-2" />Publicar calificación</button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setNewStars(0); setNewComment(''); }}>Limpiar</button>
          </div>
        </form>

        {ratings.length > 0 && (
          <div className="mt-3">
            {ratings.map((r, idx) => (
              <div key={idx} className={`mb-3 ${styles.reviewItem}`}>
                <div className={styles.avatar}>{(r.userName || r.userEmail || '').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>
                <div className={styles.reviewContent}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <strong className="me-2">{r.userName ?? r.userEmail}</strong>
                    </div>
                    <div className="d-flex align-items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i key={i} className={`bi ${i < r.stars ? 'bi-star-fill' : 'bi-star'} text-warning me-1`} />
                      ))}
                      {user && String(user.email).toLowerCase() === String(r.userEmail).toLowerCase() ? (
                        <button type="button" className="btn btn-sm btn-link ms-2 p-0" aria-label="Eliminar calificación" onClick={() => handleDelete(idx)}>
                          <i className="bi bi-trash-fill text-danger" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.reviewMeta}>{new Date(r.date).toLocaleString()}</div>
                  <div className={`mt-1 ${styles.reviewText}`}>{r.comment}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <InfoModal />
      <Modal
        show={confirmOpen}
        title="Eliminar calificación"
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
      >
        <div>¿Eliminar tu calificación? Esta acción no se puede deshacer.</div>
      </Modal>
    </section>
  );
};

export default RatingsSection;
