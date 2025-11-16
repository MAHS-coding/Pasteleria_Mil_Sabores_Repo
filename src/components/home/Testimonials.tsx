import React from 'react';
import { products as seedProducts } from '../../utils/dataLoaders';
import { getRatings } from '../../utils/ratings';
import usersData from '../../data/users/users.json';
import styles from './Testimonials.module.css';

const Testimonials: React.FC = () => {
    const [items, setItems] = React.useState<any[]>([]);

    React.useEffect(() => {
        try {
            const all: any[] = [];
            for (const p of (seedProducts || [])) {
                const rs = getRatings(p.code);
                for (const r of rs) {
                    if (r && r.stars === 5) {
                        all.push({ ...r, productCode: p.code });
                    }
                }
            }
            // shuffle
            for (let i = all.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [all[i], all[j]] = [all[j], all[i]];
            }
            setItems(all.slice(0, 3));
        } catch (e) {
            // ignore
        }
    }, []);

    if (!items || items.length === 0) return <div className="row g-4"><div className="col-12 text-center text-muted">Aún no hay reseñas destacadas.</div></div>;

    return (
        <div className="row g-4">
            {items.map((r, idx) => (
                <div className="col-lg-4" key={idx}>
                                <div className={`bg-white p-4 rounded-3 shadow-sm h-100 border-0 d-flex flex-column ${styles.testimonialCard}`}>
                                    <div className={`${styles.stars} mb-3`}>★★★★★</div>
                                    <p className={`text-muted mb-4 lh-lg ${styles.comment}`}>"{r.comment}"</p>
                                    <div className="d-flex align-items-center mt-auto">
                            {(() => {
                                const users = (usersData as any[]) || [];

                                // Helpers
                                const takeFirst = (s?: string) => (s || '').trim().split(/\s+/).filter(Boolean)[0] || '';
                                const splitLocal = (local: string) => String(local || '').split(/[._\-]/).filter(Boolean);

                                // Try to find a user by exact email
                                const found = users.find(u => String(u.correo).toLowerCase() === String(r.userEmail).toLowerCase());

                                let firstName = '';
                                let firstSurname = '';

                                if (found) {
                                    firstName = takeFirst(found.nombre);
                                    firstSurname = takeFirst(found.apellidos);
                                } else if (r.userName) {
                                    // userName may contain full name or a local-part; try space split first
                                    const nameTokens = String(r.userName).trim().split(/\s+/).filter(Boolean);
                                    if (nameTokens.length >= 2) {
                                        firstName = nameTokens[0];
                                        firstSurname = nameTokens[1];
                                    } else {
                                        // try splitting by common separators (for local-part like 'claudia.fernandez')
                                        const local = String(r.userName).split('@')[0];
                                        const parts = splitLocal(local);
                                        if (parts.length >= 2) {
                                            firstName = parts[0];
                                            firstSurname = parts[1];
                                        } else {
                                            firstName = parts[0] || nameTokens[0] || '';
                                        }
                                    }
                                } else if (r.userEmail) {
                                    // fallback: use email local-part
                                    const local = String(r.userEmail).split('@')[0];
                                    const parts = splitLocal(local);
                                    if (parts.length >= 2) {
                                        firstName = parts[0];
                                        firstSurname = parts[1];
                                    } else {
                                        firstName = parts[0] || '';
                                    }
                                }

                                // If surname missing, try additional fallbacks: match by email local-part or use tokens from other fields
                                if (!firstSurname) {
                                    try {
                                        if (r.userEmail) {
                                            const local = String(r.userEmail).split('@')[0].toLowerCase();
                                            const byLocal = users.find(u => String(u.correo).toLowerCase().startsWith(local));
                                            if (byLocal) firstSurname = takeFirst(byLocal.apellidos) || firstSurname;
                                        }
                                        // sometimes surname might be present in the nombre field (bad data) — take its second token
                                        if (!firstSurname && found) {
                                            const nombreTokens = String(found.nombre || '').trim().split(/\s+/).filter(Boolean);
                                            if (nombreTokens.length >= 2) firstSurname = nombreTokens[1];
                                        }
                                        // try r.userName second token or local-part separators
                                        if (!firstSurname && r.userName) {
                                            const nameTokens = String(r.userName).trim().split(/\s+/).filter(Boolean);
                                            if (nameTokens.length >= 2) firstSurname = nameTokens[1];
                                            else {
                                                const parts = splitLocal(String(r.userName).split('@')[0]);
                                                if (parts.length >= 2) firstSurname = parts[1];
                                            }
                                        }
                                    } catch (e) {
                                        // ignore fallback errors
                                    }
                                }

                                const displayName = (firstName + (firstSurname ? ' ' + firstSurname : '')).trim();

                                // initials: first letter of firstName + first letter of firstSurname (or second letter of firstName as fallback)
                                const initials = ((firstName[0] || '') + (firstSurname[0] || firstName[1] || '')).toUpperCase();

                                return (
                                    <>
                                        <div className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold ${styles.avatar}`}>{initials}</div>
                                        <div className={`ms-3 ${styles.name}`}><h6 className="mb-0 fw-semibold">{displayName || (r.userName || r.userEmail || '')}</h6></div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Testimonials;
