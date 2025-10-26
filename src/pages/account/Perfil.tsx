import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { findUserByEmail, updateUser, isDuocEmail, isBirthdayToday } from '../../utils/registro';
import type { StoredUser } from '../../utils/registro';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import { regions, products as allProducts } from '../../utils/dataLoaders';
import styles from './Perfil.module.css';
import { getJSON } from '../../utils/storage';
import { formatCLP } from '../../utils/currency';

const Perfil: React.FC = () => {
    const { user, login } = useAuth();
    const [storedUser, setStoredUser] = useState<StoredUser | null>(null);

    const [showAddAddr, setShowAddAddr] = useState(false);
    const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
    const [pendingAddressRemoval, setPendingAddressRemoval] = useState<{ id: string; label: string } | null>(null);
    const [confirmRemoveAvatarOpen, setConfirmRemoveAvatarOpen] = useState(false);
    const [confirmAvatarSaveOpen, setConfirmAvatarSaveOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // editable fields
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [telefono, setTelefono] = useState('');
    const [birthdate, setBirthdate] = useState('');
    // region/comuna are part of addresses now; not stored on the main profile fields
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState('');
    const [pendingAvatarDataUrl, setPendingAvatarDataUrl] = useState<string | null>(null);

    const [addrLine, setAddrLine] = useState('');
    const [addrRegion, setAddrRegion] = useState('');
    const [addrComuna, setAddrComuna] = useState('');
    const [addAddressError, setAddAddressError] = useState('');

    // orders
    const [orders, setOrders] = useState<Array<any>>([]);

    function productNameByCode(code?: string) {
        if (!code) return '';
        const p = allProducts.find(pp => String(pp.code) === String(code));
        return p?.productName || String(code);
    }

    useEffect(() => {
        if (!user?.email) {
            setStoredUser(null);
            return;
        }
        setStoredUser(findUserByEmail(user.email) ?? null);
    }, [user]);

    // refresh local editable fields when stored changes
    useEffect(() => {
        setNombre(storedUser?.name ?? '');
        setApellido(storedUser?.lastname ?? '');
        setTelefono(storedUser?.phone ?? '');
        setBirthdate(storedUser?.birthdate ?? '');
        setAvatarPreview(storedUser?.avatarDataUrl ?? null);
        // load orders for this user
        try {
            const all = getJSON<any[]>('ordenes') || [];
            const own = storedUser?.email ? all.filter(o => String(o.usuarioCorreo || '').toLowerCase() === String(storedUser.email).toLowerCase()) : [];
            own.sort((a: any, b: any) => String(b.tsISO || '').localeCompare(String(a.tsISO || '')));
            setOrders(own);
        } catch { setOrders([]); }
    }, [storedUser]);

    useEffect(() => {
        function onStorage(e: StorageEvent) {
            if (e.key === 'ordenes') {
                try {
                    const all = getJSON<any[]>('ordenes') || [];
                    const own = storedUser?.email ? all.filter(o => String(o.usuarioCorreo || '').toLowerCase() === String(storedUser.email).toLowerCase()) : [];
                    own.sort((a: any, b: any) => String(b.tsISO || '').localeCompare(String(a.tsISO || '')));
                    setOrders(own);
                } catch { }
            }
        }
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [storedUser]);

    function handleSaveProfile() {
        if (!user?.email) return;
        // Birthdate is read-only: do not allow updating it here
        const changes: Partial<StoredUser> = { name: nombre, lastname: apellido, phone: telefono, avatarDataUrl: avatarPreview ?? undefined };
        const updated = updateUser(user.email, changes);
        if (updated) {
            // update auth displayed name
            login({ name: updated.name, email: updated.email });
            setStoredUser(updated);
        }
    }

    function persistAvatar(nextAvatar: string | null) {
        if (!user?.email) return;
        const updated = updateUser(user.email, { avatarDataUrl: nextAvatar ?? undefined });
        if (updated) {
            login({ name: updated.name, email: updated.email });
            setStoredUser(updated);
        }
    }

    function requestSaveProfile() {
        if (!user?.email) return;
        setConfirmSaveOpen(true);
    }

    function confirmSaveProfile() {
        handleSaveProfile();
        setConfirmSaveOpen(false);
    }

    function cancelSaveProfile() {
        setConfirmSaveOpen(false);
    }

    function openAddAddressModal() {
        setAddrLine('');
        setAddrRegion('');
        setAddrComuna('');
        setAddAddressError('');
        setShowAddAddr(true);
    }

    function cancelAddAddress() {
        setShowAddAddr(false);
        setAddAddressError('');
    }

    function handleAddAddress() {
        if (!user?.email) return;
        if (!addrLine.trim() || !addrRegion || !addrComuna) {
            setAddAddressError('Completa dirección, región y comuna para guardar.');
            return;
        }
        const id = `${Date.now()}`;
        const addr = { id, address: addrLine, region: addrRegion, comuna: addrComuna };
        const existing = storedUser?.addresses ?? [];
        const updated = updateUser(user.email, { addresses: [...existing, addr] });
        if (updated) setStoredUser(updated);
        setAddrLine(''); setAddrRegion(''); setAddrComuna('');
        setAddAddressError('');
        setShowAddAddr(false);
    }

    function removeAddress(id: string) {
        if (!user?.email) return;
        const existing = storedUser?.addresses ?? [];
        const updated = updateUser(user.email, { addresses: existing.filter(a => a.id !== id) });
        if (updated) setStoredUser(updated);
    }

    function requestRemoveAddress(id: string, label: string) {
        setPendingAddressRemoval({ id, label });
    }

    function confirmRemoveAddress() {
        if (!pendingAddressRemoval) return;
        removeAddress(pendingAddressRemoval.id);
        setPendingAddressRemoval(null);
    }

    function cancelRemoveAddress() {
        setPendingAddressRemoval(null);
    }

    function triggerAvatarUpload() {
        setAvatarError('');
        fileInputRef.current?.click();
    }

    function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
    const type = file.type?.toLowerCase() ?? '';
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    const isAllowed = (type && allowedTypes.includes(type)) || allowedExtensions.includes(extension);
        if (!isAllowed) {
            setAvatarError('Formato no compatible. Usa una imagen JPG, PNG, WebP o AVIF.');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setPendingAvatarDataUrl(reader.result);
                setConfirmAvatarSaveOpen(true);
                setAvatarError('');
            }
        };
        reader.readAsDataURL(file);
    }

    function requestAvatarRemove() {
        setConfirmRemoveAvatarOpen(true);
    }

    function confirmAvatarRemove() {
        setAvatarPreview(null);
        persistAvatar(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setAvatarError('');
        setConfirmRemoveAvatarOpen(false);
    }

    function cancelAvatarRemove() {
        setConfirmRemoveAvatarOpen(false);
    }

    function confirmAvatarSave() {
        if (!pendingAvatarDataUrl) {
            setConfirmAvatarSaveOpen(false);
            return;
        }
        setAvatarPreview(pendingAvatarDataUrl);
        persistAvatar(pendingAvatarDataUrl);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setPendingAvatarDataUrl(null);
        setConfirmAvatarSaveOpen(false);
    }

    function cancelAvatarSave() {
        if (fileInputRef.current) fileInputRef.current.value = '';
        setPendingAvatarDataUrl(null);
        setConfirmAvatarSaveOpen(false);
    }

    const benefits = [] as string[];
    if (storedUser?.discountPercent) benefits.push(`${storedUser.discountPercent}% de descuento`);
    if (storedUser?.lifetimeDiscount) benefits.push('10% de descuento de por vida (FELICES50)');
    if (storedUser?.freeCakeVoucher && !storedUser?.freeCakeRedeemed) benefits.push('Torta gratis (voucher no canjeado)');
    // Institutional email benefit: free cake on birthday (eligibility)
    if (storedUser?.email && isDuocEmail(storedUser.email)) {
        if (isBirthdayToday(storedUser?.birthdate)) {
            benefits.push('Torta gratis por cumpleaños (email institucional)');
        } else {
            benefits.push('Torta gratis el día de tu cumpleaños (email institucional)');
        }
    }

    return (
        <main className="container my-5">
            <h1 className="h3 mb-4 d-flex align-items-center">Mi Perfil</h1>
            <div className="row g-4">
                <div className="col-12 col-lg-8 order-1 order-lg-0 mb-4 mb-lg-0">
                    <div className="card mb-4">
                        <div className="card-body">
                            <h3 className="h5 mb-4"><i className="bi bi-person-vcard me-2"></i>Datos personales</h3>
                            <form className="row g-3">
                                <div className="col-12 col-md-6">
                                    <label className="form-label fw-semibold" htmlFor="profileRunBody">RUN</label>
                                    <div className="d-flex align-items-center gap-2">
                                        <input id="profileRunBody" className={`form-control ${styles.runInput}`} inputMode="numeric" pattern="[0-9]*" placeholder="19011022" maxLength={12} disabled readOnly type="text" value={storedUser?.run ?? ''} name="runBody" />
                                    </div>
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label" htmlFor="birthdate">Fecha de nacimiento</label>
                                    <input id="birthdate" className="form-control" type="date" value={birthdate} name="fechaNacimiento" disabled readOnly />
                                </div>

                                <div className="col-12 col-md-6">
                                    <label className="form-label" htmlFor="telefono">Teléfono (opcional)</label>
                                    <input id="telefono" className="form-control" placeholder="Ej: +56 9 1234 5678" value={telefono} name="telefono" onChange={(e) => setTelefono(e.target.value)} />
                                </div>

                                <div className="col-12 col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="nombre">Nombre</label>
                                        <input id="nombre" className="form-control" placeholder="María" value={nombre} name="nombre" onChange={(e) => setNombre(e.target.value)} />
                                    </div>
                                </div>
                                <div className="col-12 col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="apellidos">Apellidos</label>
                                        <input id="apellidos" className="form-control" placeholder="Pérez González" value={apellido} name="apellidos" onChange={(e) => setApellido(e.target.value)} />
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="correo">Correo</label>
                                        <input id="correo" className="form-control" placeholder="usuario@dominio.com" type="email" value={storedUser?.email ?? ''} name="correo" disabled readOnly />
                                    </div>
                                </div>

                                

                                

                                <div className="d-flex flex-wrap gap-2 mt-3">
                                    <button type="button" className={`btn ${styles.saveButton}`} onClick={requestSaveProfile}><i className="bi bi-save2 me-1" /> Guardar cambios</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="card mb-4">
                        <div className="card-body">
                            <h3 className="h5 mb-4"><i className="bi bi-receipt me-2"></i>Historial de Pedidos</h3>
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>Pedido #</th>
                                            <th>Fecha</th>
                                            <th>Productos</th>
                                            <th>Total</th>
                                            <th>Estado</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center text-secondary">Aún nada por acá.</td>
                                            </tr>
                                        ) : (
                                            orders.map((o: any) => (
                                                <tr key={String(o.id)}>
                                                    <td>{String(o.id)}</td>
                                                    <td>{new Date(o.tsISO || o.fecha || Date.now()).toLocaleString()}</td>
                                                    <td>
                                                        {Array.isArray(o.items) && o.items.length > 0 ? (
                                                            <ul className="list-unstyled mb-0">
                                                                {o.items.map((it: any, idx: number) => (
                                                                    <li key={`${String(it.code || it.productId || idx)}-${idx}`}>
                                                                        {productNameByCode(it.code || it.productId)} <span className="text-secondary">x{Number(it.qty || it.cantidad || 0)}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <span className="text-secondary">—</span>
                                                        )}
                                                    </td>
                                                    <td>{formatCLP(Number(o.total || 0))}</td>
                                                    <td>{o.estado || 'Pendiente'}</td>
                                                    <td className="text-end">
                                                        {/* Placeholder for details button */}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="card mb-4">
                        <div className="card-body">
                            <h3 className="h5 mb-3"><i className="bi bi-geo-alt-fill me-2"></i>Direcciones</h3>
                            <div className="row g-3" id="addresses-container">
                                {(!storedUser?.addresses || storedUser.addresses.length === 0) ? (
                                    <div className="col-12">
                                        <div className="alert alert-secondary" role="alert">Aún no tienes direcciones guardadas.</div>
                                    </div>
                                ) : (
                                    storedUser.addresses.map(a => (
                                        <div key={a.id} className="col-12">
                                            <div className={styles.addressCard}>
                                                <div className={styles.addressInfo}>
                                                    <div className="fw-semibold">{a.address}</div>
                                                    <div className={`small ${styles.addressMeta}`}>{[a.region, a.comuna].filter(Boolean).join(' • ') || 'Sin región/comuna'}</div>
                                                </div>
                                                <div>
                                                    <button type="button" className={`btn btn-danger ${styles.removeAddressButton}`} onClick={() => requestRemoveAddress(a.id, a.address)}>Eliminar</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}

                                <div className="col-12 d-flex">
                                    <button className={`btn ${styles.addAddressButton} my-auto`} type="button" onClick={openAddAddressModal}><i className="bi bi-plus-lg"></i> Añadir Nueva Dirección</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-4 order-0 order-lg-1">
                    <div className={`card p-4 text-center mb-4 mb-lg-0 ${styles.profileCard}`}>
                        <div className={`${styles.avatarWrapper} mb-3`}>
                                <img src={avatarPreview || '/images/logos/logo.png'} alt="Avatar" className={`${styles.avatarImage} border border-2`} />
                        </div>
                            <div className={styles.avatarActions}>
                                <button type="button" className={`btn ${styles.changeAvatarButton}`} onClick={triggerAvatarUpload}><i className="bi bi-camera me-1"></i> Cambiar foto</button>
                                {avatarPreview ? (
                                    <button type="button" className={`btn btn-danger ${styles.removeAvatarButton}`} onClick={requestAvatarRemove}>Quitar foto</button>
                                ) : null}
                                <input ref={fileInputRef} type="file" accept="image/*" className="d-none" onChange={handleAvatarChange} />
                            </div>
                        {avatarError ? <p className="text-danger small mb-0">{avatarError}</p> : null}
                        <h2 className="h4" id="profileName">{storedUser?.name ?? '—'} {storedUser?.lastname ?? '—'} </h2>
                        <p className="text-secondary mb-1" id="profileEmailText">{storedUser?.email ?? '—'}</p>
                        {storedUser?.createdAt && <p className="text-secondary mb-1" id="memberSinceText"><small>Miembro desde: {new Date(storedUser.createdAt).toLocaleDateString()}</small></p>}

                        <div className="my-3">
                            <div className="small text-secondary mb-1">Beneficios</div>
                            <ul className="list-unstyled mb-0" id="profileBenefitsList">
                                {benefits.length === 0 ? <li className="text-muted">Sin beneficios especiales.</li> : benefits.map((b, i) => (<li key={i}>{b}</li>))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* inline edit form used instead of a modal; preserved add-address modal below */}

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
                            {regions.map(r => (<option key={r.id} value={r.name}>{r.name}</option>))}
                        </select>
                    </FormField>
                    <FormField id="addAddressCity" label="Comuna">
                        <select className="form-select" id="addAddressCity" value={addrComuna} onChange={(e) => setAddrComuna(e.target.value)} disabled={!addrRegion}>
                            <option value="">Selecciona…</option>
                            {addrRegion && regions.find(r => r.name === addrRegion)?.comunas.map(c => (<option key={c.id} value={c.name}>{c.name}</option>))}
                        </select>
                    </FormField>
                    {addAddressError ? <p className="text-danger small mb-0">{addAddressError}</p> : null}
                </div>
            </Modal>

            <Modal
                show={confirmSaveOpen}
                title="Confirmar cambios"
                onClose={cancelSaveProfile}
                onConfirm={confirmSaveProfile}
                confirmLabel="Sí, guardar"
                cancelLabel="Cancelar"
            >
                <p className="mb-0">¿Deseas guardar los cambios realizados en tu perfil?</p>
            </Modal>

            <Modal
                show={!!pendingAddressRemoval}
                title="Eliminar dirección"
                onClose={cancelRemoveAddress}
                onConfirm={confirmRemoveAddress}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
            >
                <p className="mb-0">¿Seguro que quieres eliminar <strong>{pendingAddressRemoval?.label}</strong> de tus direcciones guardadas?</p>
            </Modal>

            <Modal
                show={confirmRemoveAvatarOpen}
                title="Quitar foto"
                onClose={cancelAvatarRemove}
                onConfirm={confirmAvatarRemove}
                confirmLabel="Quitar"
                cancelLabel="Cancelar"
            >
                <p className="mb-0">¿Deseas quitar tu foto de perfil actual?</p>
            </Modal>

            <Modal
                show={confirmAvatarSaveOpen}
                title="Guardar nueva foto"
                onClose={cancelAvatarSave}
                onConfirm={confirmAvatarSave}
                confirmLabel="Guardar"
                cancelLabel="Cancelar"
            >
                <div className="text-center">
                    <p>¿Quieres usar esta imagen como tu nueva foto de perfil?</p>
                    {pendingAvatarDataUrl ? (
                        <img src={pendingAvatarDataUrl} alt="Vista previa" className={`${styles.avatarImage} border border-2`} />
                    ) : null}
                </div>
            </Modal>
        </main>
    );
};

export default Perfil;
