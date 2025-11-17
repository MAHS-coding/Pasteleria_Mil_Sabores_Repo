import React, { useState } from 'react';
import styles from '../../pages/checkout/Checkout.module.css';
import { formatCardNumber, formatExpMonth, formatExpYear, normalizeHolderName, sanitizeCardNumber, detectBrand } from '../../utils/cardUtils';
import Modal from '../ui/Modal';

type Card = { id: string; brand?: string; last4?: string; expMonth?: string; expYear?: string; holderName?: string };

type CardData = { number: string; holder?: string; expMonth?: string; expYear?: string };

type Props = {
    paymentCards: Card[];
    defaultCardId?: string | null;
    mode?: 'list' | 'select';
    selectedId?: string | null;
    onSelectedChange?: (id: string | null) => void;
    onSetDefault?: (id: string) => void;
    onRemove?: (id: string) => void;
    onAdd?: (data: CardData) => void;
};

const PaymentCards: React.FC<Props> = ({ paymentCards, defaultCardId, mode = 'list', selectedId, onSelectedChange, onSetDefault, onRemove, onAdd }) => {
    const [showNew, setShowNew] = useState(false);
    const [number, setNumber] = useState('');
    const [holder, setHolder] = useState('');
    const [expMonth, setExpMonth] = useState('');
    const [expYear, setExpYear] = useState('');
    const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

    function clearForm() {
        setNumber(''); setHolder(''); setExpMonth(''); setExpYear(''); setShowNew(false);
    }

    function handleAdd() {
        if (!onAdd) return;
        // normalize year: accept YY or YYYY from the form and send a 4-digit year
        const cleaned = String(expYear || '').replace(/\D/g, '');
        const normalizedExpYear = cleaned.length === 2 ? `20${cleaned}` : cleaned;
        // normalize holder before sending
        const normalizedHolder = normalizeHolderName(holder);
        onAdd({ number, holder: normalizedHolder, expMonth, expYear: normalizedExpYear });
        clearForm();
    }

    const sanitizedLen = sanitizeCardNumber(number).length;
    const brand = detectBrand(number);
    // expected length by brand (Amex 15, Visa/Mastercard 16), fall back to 16
    const expectedLen = brand === 'Amex' ? 15 : 16;
    const monthNum = Number(expMonth || 0);
    const cleanedYear = String(expYear || '').replace(/\D/g, '');
    const yearLen = cleanedYear.length;
    // accept 2-digit (YY) or 4-digit (YYYY) years and normalize for comparison
    const normalizedYearForCompare = yearLen === 2 ? 2000 + Number(cleanedYear || 0) : Number(cleanedYear || 0);
    const currentYear = new Date().getFullYear();
    const yearsMissing = Number.isFinite(normalizedYearForCompare) && normalizedYearForCompare > 0 ? (currentYear + 1) - normalizedYearForCompare : null;
    const yearIsValid = Number.isFinite(normalizedYearForCompare) && normalizedYearForCompare > currentYear;
    const monthIsValid = monthNum >= 1 && monthNum <= 12;
    const isExpValid = monthIsValid && yearIsValid && (yearLen === 2 || yearLen === 4);
    // require expected length for the detected brand
    const isFormValid = Boolean(number && holder && expMonth && expYear && isExpValid && sanitizedLen >= Math.min(expectedLen, 12) && sanitizedLen >= expectedLen);

    if (mode === 'select') {
        return (
            <div>
                <div className="input-group">
                    <select className="form-select" value={selectedId ?? ''} onChange={(e) => onSelectedChange?.(e.target.value || null)}>
                        {!paymentCards.length ? (
                            <option value="">No tienes tarjetas guardadas</option>
                        ) : (
                            <>
                                <option value="">Selecciona…</option>
                                {paymentCards.map((c) => (
                                    <option key={c.id} value={c.id}>{c.brand} **** {c.last4}{c.expMonth && c.expYear ? ` — ${c.expMonth}/${c.expYear}` : ''}{defaultCardId === c.id ? ' (predeterminada)' : ''}</option>
                                ))}
                            </>
                        )}
                    </select>
                    <button className={`btn ${styles['accentOutlineBtn']}`} type="button" title="Agregar nueva tarjeta" onClick={() => setShowNew((s) => !s)}><i className="bi bi-plus-circle"></i></button>
                </div>

                {showNew && (
                    <div className={styles['newCardForm'] + ' mt-2'}>
                        <input className="form-control mb-2" placeholder="Número de tarjeta (XXXX XXXX XXXX XXXX)" value={number} onChange={(e) => setNumber(formatCardNumber(e.target.value))} inputMode="numeric" maxLength={23} />
                        <div className="d-flex gap-2 mb-2">
                            <input className={`form-control ${styles['smallInput']}`} placeholder="MM" value={expMonth} onChange={(e) => setExpMonth(formatExpMonth(e.target.value))} inputMode="numeric" maxLength={2} />
                            <input className={`form-control ${styles['smallInput']}`} placeholder="YYYY" value={expYear} onChange={(e) => setExpYear(formatExpYear(e.target.value))} inputMode="numeric" maxLength={4} />
                            <input className="form-control" placeholder="Nombre en la tarjeta" value={holder} onChange={(e) => setHolder(e.target.value)} onBlur={(e) => setHolder(normalizeHolderName(e.target.value))} />
                        </div>
                        {( (sanitizedLen > 0 && sanitizedLen < expectedLen) || (!monthIsValid && expMonth) || (cleanedYear && !yearIsValid && yearsMissing !== null) ) && (
                            <div style={{ marginTop: 6 }}>
                                {sanitizedLen > 0 && sanitizedLen < expectedLen && (
                                    <div className="text-danger" style={{ fontSize: '0.85rem' }}>Número de tarjeta inválido</div>
                                )}
                                {!monthIsValid && expMonth && (
                                    <div className="text-danger" style={{ fontSize: '0.85rem' }}>Mes inválido: debe estar entre 01 y 12.</div>
                                )}
                                {cleanedYear && !yearIsValid && yearsMissing !== null && (
                                    <div className="text-danger" style={{ fontSize: '0.85rem' }}>Año inválido.</div>
                                )}
                            </div>
                        )}
                        <div className="d-flex gap-2">
                            <button type="button" className={`btn btn-sm ${styles['confirmBtn']}`} onClick={handleAdd} disabled={!isFormValid}>Guardar tarjeta</button>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={clearForm}>Cancelar</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // list mode
    return (
        <div>
            <div className={styles.cardsList}>
                {paymentCards.length ? paymentCards.map((c) => (
                    <div key={c.id} className={styles.cardItem}>
                        <div>
                            <div style={{ cursor: 'pointer' }}>
                                <span className={styles.cardMeta} style={{ marginLeft: 8 }}>{c.brand} **** {c.last4} {c.expMonth && c.expYear ? ` — ${c.expMonth}/${c.expYear}` : ''}</span>
                            </div>
                        </div>
                        <div>
                            {defaultCardId === c.id ? (
                                <span className="badge bg-success me-2">Predeterminada</span>
                            ) : (
                                <button type="button" className={`btn btn-sm ${styles['confirmBtn']} me-2`} onClick={() => onSetDefault?.(c.id)}>Establecer predeterminada</button>
                            )}
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => setPendingRemoveId(c.id)}>Eliminar</button>
                        </div>
                    </div>
                )) : (
                    <div className="alert alert-secondary">Aún no tienes tarjetas guardadas.</div>
                )}
            </div>

            <div className="mt-2">
                <button className={`btn ${styles['accentOutlineBtn']} my-auto`} type="button" onClick={() => setShowNew((s) => !s)}><i className="bi bi-plus-lg"></i> Añadir Nueva Tarjeta</button>
            </div>

            {showNew && (
                <div className={styles['newCardForm'] + ' mt-2'}>
                    <input className="form-control mb-2" placeholder="Número de tarjeta (XXXX XXXX XXXX XXXX)" value={number} onChange={(e) => setNumber(formatCardNumber(e.target.value))} inputMode="numeric" maxLength={23} />
                    <div className="d-flex gap-2 mb-2">
                        <input required className={`form-control ${styles['smallInput']}`} placeholder="MM" value={expMonth} onChange={(e) => setExpMonth(formatExpMonth(e.target.value))} inputMode="numeric" maxLength={2} />
                        <input required className={`form-control ${styles['smallInput']}`} placeholder="YYYY" value={expYear} onChange={(e) => setExpYear(formatExpYear(e.target.value))} inputMode="numeric" maxLength={4} />
                        <input required className="form-control" placeholder="Nombre en la tarjeta" value={holder} onChange={(e) => setHolder(e.target.value)} onBlur={(e) => setHolder(normalizeHolderName(e.target.value))} />
                    </div>
                    {( (sanitizedLen > 0 && sanitizedLen < expectedLen) || (!monthIsValid && expMonth) || (cleanedYear && !yearIsValid && yearsMissing !== null) ) && (
                        <div style={{ marginTop: 6 }}>
                            {sanitizedLen > 0 && sanitizedLen < expectedLen && (
                                <div className="text-danger" style={{ fontSize: '0.85rem' }}>Número de tarjeta inválido</div>
                            )}
                            {!monthIsValid && expMonth && (
                                <div className="text-danger" style={{ fontSize: '0.85rem' }}>Mes inválido: debe estar entre 01 y 12.</div>
                            )}
                            {cleanedYear && !yearIsValid && yearsMissing !== null && (
                                <div className="text-danger" style={{ fontSize: '0.85rem' }}>{`Año inválido.`}</div>
                            )}
                        </div>
                    )}
                    <div className="d-flex gap-2">
                        <button type="button" className={`btn btn-sm ${styles['confirmBtn']}`} onClick={handleAdd} disabled={!isFormValid}>Guardar</button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={clearForm}>Cancelar</button>
                    </div>
                </div>
            )}

            <Modal
                show={Boolean(pendingRemoveId)}
                title="Eliminar tarjeta"
                onClose={() => setPendingRemoveId(null)}
                onConfirm={() => {
                    if (pendingRemoveId) onRemove?.(pendingRemoveId);
                    setPendingRemoveId(null);
                }}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
            >
                <div>
                    {(() => {
                        const c = paymentCards.find((x) => x.id === pendingRemoveId);
                        const label = c ? `${c.brand || 'Tarjeta'} **** ${c.last4 || ''}` : 'esta tarjeta';
                        return <div>¿Eliminar {label}? Esta acción no se puede deshacer.</div>;
                    })()}
                </div>
            </Modal>
        </div>
    );
};

export default PaymentCards;
