import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { upsertStoredUser, isDuocEmail, isBirthdayToday } from '../../utils/registro';
import type { StoredUser } from '../../utils/registro';
import { addUserAddress, addUserCard, cardDtoToStoredCard, deleteUserAddress, deleteUserCard, fetchUserAddresses, fetchUserCards, fetchUserProfile, syncLocalUserProfile, setDefaultCard, type UserProfileUpdateRequest, updateUserProfile, extractErrorMessage } from '../../services/userService';
import { fetchOrders, type OrderResponse } from '../../services/pedidosService';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import { regions, products as allProducts } from '../../utils/dataLoaders';
import styles from './Perfil.module.css';
// checkout styles are used by the shared PaymentCards component when needed
import PaymentCards from '../../components/payments/PaymentCards';
import { formatCardNumber, formatExpMonth, formatExpYear, normalizeHolderName, detectBrand, sanitizeCardNumber } from '../../utils/cardUtils';

import { formatCLP } from '../../utils/currency';

const Perfil: React.FC = () => {
    const { user, login } = useAuth();
    const [storedUser, setStoredUser] = useState<StoredUser | null>(null);

    const [showAddAddr, setShowAddAddr] = useState(false);
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
    const [cardSaveError, setCardSaveError] = useState('');

    // payment cards (managed here similarly to addresses)

    // editing mode for personal data
    const [isEditing, setIsEditing] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSaveError, setProfileSaveError] = useState('');

    // orders
    const [orders, setOrders] = useState<Array<any>>([]);
    const [expandedOrders, setExpandedOrders] = useState<string[]>([]);

    function productNameByCode(code?: string) {
        if (!code) return '';
        const p = allProducts.find(pp => String(pp.code) === String(code));
        return p?.productName || String(code);
    }

    function orderResponseToProfileOrder(payload: OrderResponse) {
        const items = (payload.items || []).map((it: any) => ({
            code: it.productCode ?? it.productoCodigo,
            productId: it.productCode ?? it.productoCodigo,
            qty: Number(it.qty ?? it.cantidad ?? 0),
            cantidad: Number(it.cantidad ?? it.qty ?? 0),
            price: Number(it.price ?? it.precioUnitario ?? 0),
        }));

        // Normalize card info variations from backend
        const cardLastFour = (payload as any).cardLastFour
            || (payload as any).cardLast4
            || (payload as any).paymentLastFour
            || (payload as any).cardLastDigits
            || (payload as any).last4
            || (payload as any).lastFour;
        const cardBrand = (payload as any).cardBrand || (payload as any).paymentBrand || (payload as any).brand;
        
        // Construct discounts object from server fields if not already present
        const discounts = payload.discounts || {
            agePercent: payload.discountPercentApplied ? (payload.discountPercentApplied >= 50 ? 50 : 0) : 0,
            codePercent: payload.lifetimeDiscountPercentApplied ?? 0,
            ageDiscountMoney: 0,
            codeDiscountMoney: 0,
            discountPercentMoney: Number(payload.discountAmount ?? 0),
            freeCakeApplied: payload.freeCakeApplied ?? false,
            freeCakeMoney: Number(payload.freeCakeAmount ?? 0),
            totalDiscountMoney: Number(payload.discountAmount ?? 0) + (payload.freeCakeApplied ? Number(payload.freeCakeAmount ?? 0) : 0),
        };
        
        return {
            id: payload.pedidoId || payload.id || '',
            items,
            total: Number(payload.totalConDescuento ?? payload.total ?? 0),
            subtotal: Number(payload.subtotal ?? 0),
            estado: payload.status || payload.estado || 'Pendiente',
            tsISO: payload.createdAt || payload.tsISO || payload.fechaPedido,
            direccionEntrega: payload.deliveryAddress || '',
            usuarioCorreo: payload.usuarioCorreo,
            purchaserCorreo: payload.purchaserCorreo,
            discounts,
            freeCakeAmount: payload.freeCakeAmount,
            discountAmount: payload.discountAmount,
            cardId: payload.cardId,
            cardLastFour,
            cardBrand,
        };
    }

    useEffect(() => {
        let active = true;
        const loadProfile = async () => {
            if (!user?.run) {
                if (active) setStoredUser(null);
                return;
            }
            try {
                const raw = await fetchUserProfile(user.run);
                if (!active) return;
                if (!raw) {
                    setStoredUser(null);
                    return;
                }
                const profileEmail = String(raw.email || raw.correo || user.email || '').trim();
                if (!profileEmail) {
                    setStoredUser(null);
                    return;
                }
                let addresses: any[] | undefined;
                let paymentCards: StoredUser['paymentCards'] | undefined;
                try {
                    const fetched = await fetchUserAddresses(user.run);
                    if (fetched && fetched.length) {
                        addresses = fetched;
                    }
                } catch {
                    // use whatever addresses we already have
                }
                try {
                    const fetchedCards = await fetchUserCards(user.run);
                    if (fetchedCards && fetchedCards.length) {
                        const normalized: any[] = fetchedCards
                            .map(cardDtoToStoredCard)
                            .filter((c): c is Exclude<ReturnType<typeof cardDtoToStoredCard>, null> => c !== null);
                        if (normalized.length) {
                            paymentCards = normalized as StoredUser['paymentCards'];
                        }
                    }
                } catch {
                    // use existing cards
                }
                // upsertStoredUser writes to LocalStorage but now strips paymentCards, so we manually build storedUser
                const runValue = raw.run || user.run || 'unknown';
                const updated: StoredUser = {
                    run: runValue,
                    name: String(raw.nombre || raw.name || user.name || ''),
                    lastname: String(raw.apellidos || raw.lastname || ''),
                    email: profileEmail,
                    birthdate: String(raw.fechaNacimiento || raw.birthdate || ''),
                    role: (String(raw.tipoUsuario || raw.role || '') as StoredUser['role']) || 'Cliente',
                    codigo: undefined,
                    password: '',
                    phone: (String(raw.telefono || raw.phone || '') || undefined) as string | undefined,
                    addresses: addresses as any,
                    paymentCards: paymentCards || undefined,
                    defaultPaymentCardId: raw.defaultPaymentCardId ?? undefined,
                    avatarDataUrl: raw.avatarDataUrl ? String(raw.avatarDataUrl) : undefined,
                    discountPercent: typeof raw.discountPercent === 'number' ? raw.discountPercent : undefined,
                    lifetimeDiscount: raw.lifetimeDiscount ?? (typeof raw.lifetimeDiscountPercent === 'number' ? raw.lifetimeDiscountPercent > 0 : undefined),
                    freeCakeVoucher: raw.freeCakeVoucher ?? raw.freeCakeEligible ?? undefined,
                    freeCakeRedeemed: raw.freeCakeRedeemed ?? undefined,
                    blocked: Boolean(raw.blocked ?? false),
                    createdAt: String(raw.createdAt || new Date().toISOString()),
                };
                // Still upsert basic user data to LocalStorage (without cards)
                upsertStoredUser({
                    run: updated.run,
                    name: updated.name,
                    lastname: updated.lastname,
                    email: updated.email,
                    birthdate: updated.birthdate,
                    role: updated.role,
                    phone: updated.phone,
                    addresses: updated.addresses,
                });
                setStoredUser(updated);
            } catch {
                if (!active) return;
                setStoredUser(null);
            }
        };
        loadProfile();
        return () => { active = false; };
    }, [user?.run, user?.email, user?.name]);

    // refresh local editable fields when stored changes
    useEffect(() => {
        setNombre(storedUser?.name ?? '');
        setApellido(storedUser?.lastname ?? '');
        setTelefono(storedUser?.phone ?? '');
        setBirthdate(storedUser?.birthdate ?? '');
        setAvatarPreview(storedUser?.avatarDataUrl ?? null);
        // exit editing mode when stored user changes
        setIsEditing(false);
    }, [storedUser]);

    useEffect(() => {
        let active = true;
        if (!storedUser?.email) return undefined;
        (async () => {
            try {
                const remote = await fetchOrders();
                if (!active) return;
                const emailLower = String(storedUser.email).toLowerCase();
                const normalized = remote
                    .map(orderResponseToProfileOrder)
                    .filter((o) => String(o.usuarioCorreo || o.purchaserCorreo || '').toLowerCase() === emailLower);
                normalized.sort((a, b) => String(b.tsISO || '').localeCompare(String(a.tsISO || '')));
                setOrders(normalized as any[]);
            } catch (error) {
                console.error('Error cargando órdenes del servidor', error);
            }
        })();
        return () => { active = false; };
    }, [storedUser?.email]);

    useEffect(() => {
        let active = true;
        if (!storedUser?.email) return undefined;
        (async () => {
            try {
                const remote = await fetchOrders();
                if (!active) return;
                const emailLower = String(storedUser.email).toLowerCase();
                const normalized = remote
                    .map(orderResponseToProfileOrder)
                    .filter((o) => String(o.usuarioCorreo || o.purchaserCorreo || '').toLowerCase() === emailLower);
                normalized.sort((a, b) => String(b.tsISO || '').localeCompare(String(a.tsISO || '')));
                setOrders(normalized as any[]);
            } catch (error) {
                console.error('Error cargando órdenes del servidor', error);
            }
        })();
        return () => { active = false; };
    }, [storedUser?.email]);

    async function persistProfilePayload(payload: UserProfileUpdateRequest) {
        if (!user?.run || !storedUser) return undefined;
        try {
            // Merge with current stored user data to ensure all required fields are sent
            const fullPayload: UserProfileUpdateRequest = {
                nombre: payload.nombre ?? storedUser.name,
                apellidos: payload.apellidos ?? storedUser.lastname,
                correo: payload.correo ?? storedUser.email,
                fechaNacimiento: payload.fechaNacimiento ?? storedUser.birthdate,
                telefono: payload.telefono ?? storedUser.phone,
                tipoUsuario: payload.tipoUsuario ?? storedUser.role,
                ...payload, // Override with any explicitly provided values
            };
            console.log('📤 Enviando payload al servidor:', fullPayload);
            const serverResponse = await updateUserProfile(user.run, fullPayload);
            if (!serverResponse) {
                setProfileSaveError('No se recibió respuesta del servidor.');
                return undefined;
            }
            return syncLocalUserProfile(serverResponse, user.run);
        } catch (error) {
            console.error('❌ Error en persistProfilePayload:', error);
            const errorMsg = extractErrorMessage(error);
            setProfileSaveError(errorMsg);
            throw error;
        }
    }

    async function handleSaveProfile() {
        if (!user?.email || !storedUser) return false;
        
        // Create payload with updated values
        const payload: UserProfileUpdateRequest = {
            nombre: nombre,
            apellidos: apellido,
            correo: storedUser.email,
            telefono: telefono || undefined,
            fechaNacimiento: storedUser.birthdate ?? undefined,
            tipoUsuario: storedUser.role ?? undefined,
        };
        
        try {
            const serverUser = await persistProfilePayload(payload);
            if (serverUser) {
                console.log('✅ Perfil actualizado:', serverUser);
                login({ name: serverUser.name, email: serverUser.email, run: serverUser.run });
                // Preserve existing cards (syncLocalUserProfile doesn't return them anymore)
                const merged: StoredUser = {
                    ...serverUser,
                    paymentCards: storedUser.paymentCards,
                    defaultPaymentCardId: storedUser.defaultPaymentCardId,
                };
                setStoredUser(merged);
                return true;
            }
        } catch (error) {
            console.error('Error en handleSaveProfile:', error);
        }
        return false;
    }

    async function persistAvatar(nextAvatar: string | null) {
        if (!user?.email || !storedUser) return;
        
        // Create updated user object in memory (don't save to localStorage)
        const updated: StoredUser = {
            ...storedUser,
            avatarDataUrl: nextAvatar ?? undefined,
        };
        
        login({ name: updated.name, email: updated.email, run: updated.run });
        setStoredUser(updated);
        
        const serverUser = await persistProfilePayload({ 
            nombre: updated.name,
            apellidos: updated.lastname,
            correo: updated.email,
            avatarDataUrl: nextAvatar ?? undefined,
            telefono: updated.phone ?? undefined,
            fechaNacimiento: updated.birthdate ?? undefined,
            tipoUsuario: updated.role ?? undefined,
        });
        if (serverUser) {
            login({ name: serverUser.name, email: serverUser.email, run: serverUser.run });
            // Preserve existing cards
            const merged: StoredUser = {
                ...serverUser,
                paymentCards: storedUser.paymentCards,
                defaultPaymentCardId: storedUser.defaultPaymentCardId,
            };
            setStoredUser(merged);
        }
    }

    async function requestSaveProfile() {
        if (!user?.email) return;
        if (!isDirty) return;
        setProfileSaving(true);
        setProfileSaveError('');
        try {
            const saved = await handleSaveProfile();
            if (saved) {
                // Los valores ya están actualizados en storedUser desde handleSaveProfile
                // Solo necesitamos salir del modo edición
                setIsEditing(false);
                setProfileSaveError('');
            } else {
                setProfileSaveError('No se pudo actualizar perfil en el servidor. Intenta de nuevo.');
            }
        } catch (error) {
            console.error(error);
            setProfileSaveError('Ocurrió un error al guardar los cambios.');
        } finally {
            setProfileSaving(false);
        }
    }

    // detect if any editable field differs from stored user -> used to enable/disable Guardar
    const isDirty = useMemo(() => {
        if (!storedUser) return false;
        const storedAvatar = storedUser.avatarDataUrl ?? null;
        return (
            nombre !== (storedUser.name ?? '') ||
            apellido !== (storedUser.lastname ?? '') ||
            telefono !== (storedUser.phone ?? '') ||
            avatarPreview !== storedAvatar
        );
    }, [nombre, apellido, telefono, avatarPreview, storedUser]);

    function cancelEdit() {
        // revert local fields to stored values
        setNombre(storedUser?.name ?? '');
        setApellido(storedUser?.lastname ?? '');
        setTelefono(storedUser?.phone ?? '');
        setAvatarPreview(storedUser?.avatarDataUrl ?? null);
        setIsEditing(false);
        setProfileSaveError('');
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

    async function handleAddAddress() {
        if (!user?.email || !user?.run || !storedUser) return;
        if (!addrLine.trim() || !addrRegion || !addrComuna) {
            setAddAddressError('Completa dirección, región y comuna para guardar.');
            return;
        }
        const payload = { address: addrLine.trim(), region: addrRegion, comuna: addrComuna };
        const created = await addUserAddress(user.run, payload);
        if (!created) {
            setAddAddressError('No pudimos guardar la dirección. Intenta nuevamente.');
            return;
        }
        const existing = storedUser?.addresses ?? [];
        const updated: StoredUser = { ...storedUser, addresses: [...existing, created] };
        setStoredUser(updated);
        setAddrLine(''); setAddrRegion(''); setAddrComuna('');
        setAddAddressError('');
        setShowAddAddr(false);
    }

    async function removeAddress(id: string) {
        if (!user?.email || !storedUser || !user?.run) return;
        const existing = storedUser?.addresses ?? [];
        const updated: StoredUser = { ...storedUser, addresses: existing.filter(a => a.id !== id) };
        setStoredUser(updated);
        try {
            await deleteUserAddress(user.run, id);
        } catch (error) {
            console.error('Error eliminando dirección del servidor:', error);
        }
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

    function paymentMethodLabel(o: any) {
        if (!o) return '—';
        if (o.paymentMethodId) {
            const c = storedUser?.paymentCards?.find((pc: any) => String(pc.id) === String(o.paymentMethodId));
            return c ? `${c.brand} **** ${c.last4}` : String(o.paymentMethodId);
        }
        if (o.cardLastFour) {
            const brand = o.cardBrand || 'Tarjeta';
            return `${brand} **** ${o.cardLastFour}`;
        }
        return o.paymentMethod || '—';
    }

    // --- Payment cards helpers (shared in utils/cardUtils) ---

    async function refreshPaymentCardsFromServer() {
        const runId = user?.run ?? storedUser?.run;
        const email = user?.email ?? storedUser?.email;
        if (!runId || !email || !storedUser) return;
        try {
            const fetchedCards = await fetchUserCards(runId);
            if (!fetchedCards) return;
            const normalized: any[] = fetchedCards
                .map(cardDtoToStoredCard)
                .filter((c): c is Exclude<ReturnType<typeof cardDtoToStoredCard>, null> => c !== null);
            // Merge fetched cards with existing to avoid losing freshly added items
            const byId: Record<string, any> = {};
            (storedUser.paymentCards || []).forEach((c: any) => { if (c?.id) byId[String(c.id)] = c; });
            normalized.forEach((c: any) => { if (c?.id) byId[String(c.id)] = c; });
            const merged = Object.values(byId) as StoredUser['paymentCards'];
            const updated: StoredUser = { ...storedUser, paymentCards: merged };
            setStoredUser(updated);
        } catch (refreshError) {
            console.error('Error sincronizando tarjetas', refreshError);
        }
    }

    async function addCard(cardData: { number: string; holder?: string; expMonth?: string; expYear?: string }) {
        const runId = user?.run ?? storedUser?.run;
        if (!user?.email || !runId) {
            setCardSaveError('Necesitas iniciar sesión para guardar tarjetas.');
            return;
        }
        setCardSaveError('');
        const cleanNumber = sanitizeCardNumber(cardData.number);
        if (!cleanNumber || cleanNumber.length < 12) {
            setCardSaveError('El número de la tarjeta no es válido.');
            return;
        }
        try {
            const payload = {
                cardNumber: cleanNumber,
                month: cardData.expMonth ? Number(cardData.expMonth) : undefined,
                year: cardData.expYear ? Number(cardData.expYear) : undefined,
                cardholderName: normalizeHolderName(cardData.holder || ''),
            };
            const created = await addUserCard(runId, payload);
            if (!created) {
                throw new Error('No se pudo guardar la tarjeta en el servidor.');
            }
            const storedCard = cardDtoToStoredCard(created) ?? {
                id: created.id,
                brand: created.brand ?? detectBrand(cleanNumber),
                last4: cleanNumber.slice(-4),
                expMonth: created.month ?? cardData.expMonth,
                expYear: created.year ?? cardData.expYear,
                holderName: created.cardholderName ?? normalizeHolderName(cardData.holder || ''),
            };
            const existing = storedUser?.paymentCards ?? [];
            const willSetDefault = !storedUser?.defaultPaymentCardId;
            // Append new card at the end
            const updatedCards = [...existing, storedCard];
            if (storedUser) {
                const updated: StoredUser = {
                    ...storedUser,
                    paymentCards: updatedCards,
                    defaultPaymentCardId: willSetDefault ? storedCard.id : storedUser?.defaultPaymentCardId,
                };
                setStoredUser(updated);
            }
            setCardSaveError('');
            
            if (willSetDefault && storedCard.id) {
                try {
                    const serverUser = await persistProfilePayload({ defaultPaymentCardId: storedCard.id });
                    if (serverUser) {
                        login({ name: serverUser.name, email: serverUser.email, run: serverUser.run });
                        // Preserve the updated cards list (with the new card)
                        const merged: StoredUser = {
                            ...serverUser,
                            paymentCards: updatedCards,
                            defaultPaymentCardId: storedCard.id,
                        };
                        setStoredUser(merged);
                    }
                } catch (syncError) {
                    console.error('No se pudo actualizar la tarjeta predeterminada', syncError);
                }
            }
            
            // Refresh from server to sync any additional details, merging with our local list
            await refreshPaymentCardsFromServer();
        } catch (error) {
            console.error(error);
            setCardSaveError('No fue posible guardar la tarjeta. Intenta de nuevo más tarde.');
        }
    }

    async function removeCard(id: string) {
        if (!user?.email || !storedUser || !user?.run) return;
        const existing = storedUser?.paymentCards ?? [];
        const remaining = existing.filter((c: any) => c.id !== id);
        // if removed card was default, pick a new default (first remaining) or clear
        const nextDefault = storedUser?.defaultPaymentCardId === id ? (remaining[0]?.id ?? undefined) : storedUser?.defaultPaymentCardId;
        const updated: StoredUser = { ...storedUser, paymentCards: remaining, defaultPaymentCardId: nextDefault };
        setStoredUser(updated);
        try {
            await deleteUserCard(user.run, id);
        } catch (error) {
            console.error('Error eliminando tarjeta del servidor:', error);
        }
        try {
            const serverUser = await persistProfilePayload({ defaultPaymentCardId: nextDefault });
            if (serverUser) {
                // Preserve the updated cards list AND existing addresses
                const merged: StoredUser = {
                    ...serverUser,
                    addresses: storedUser.addresses,
                    paymentCards: remaining,
                    defaultPaymentCardId: nextDefault,
                };
                setStoredUser(merged);
            }
        } catch (error) {
            console.error('No se pudo actualizar la tarjeta predeterminada', error);
        }
    }

    async function handleSetDefaultCard(id: string) {
        if (!user?.email || !user?.run || !storedUser) return;
        
        const userRun = user.run;
        
        // Update cards locally to mark the selected one as default
        const updatedCards = storedUser.paymentCards?.map(card => ({
            ...card,
            isDefault: card.id === id
        }));
        
        const updated: StoredUser = { 
            ...storedUser, 
            defaultPaymentCardId: id,
            paymentCards: updatedCards
        };
        setStoredUser(updated);
        
        try {
            // Call the server to set the default card
            console.log('Setting default card:', userRun, id);
            const response = await setDefaultCard(userRun, id);
            console.log('Server response:', response);
            
            if (response) {
                // Server confirmed, refresh all cards from server to get accurate state
                const refreshedCards = await fetchUserCards(userRun);
                console.log('Refreshed cards:', refreshedCards);
                
                if (refreshedCards && refreshedCards.length > 0) {
                    const normalized: any[] = refreshedCards
                        .map(cardDtoToStoredCard)
                        .filter((c): c is Exclude<ReturnType<typeof cardDtoToStoredCard>, null> => c !== null);
                    
                    // Update the profile with refreshed cards
                    const merged: StoredUser = {
                        ...storedUser,
                        paymentCards: normalized.length > 0 ? normalized : updatedCards,
                        defaultPaymentCardId: id,
                    };
                    setStoredUser(merged);
                    console.log('Cards updated successfully');
                }
            } else {
                console.warn('Server did not return a response for setting default card');
                // Still refresh cards to sync with server state
                const refreshedCards = await fetchUserCards(userRun);
                if (refreshedCards && refreshedCards.length > 0) {
                    const normalized: any[] = refreshedCards
                        .map(cardDtoToStoredCard)
                        .filter((c): c is Exclude<ReturnType<typeof cardDtoToStoredCard>, null> => c !== null);
                    
                    const merged: StoredUser = {
                        ...storedUser,
                        paymentCards: normalized.length > 0 ? normalized : updatedCards,
                        defaultPaymentCardId: id,
                    };
                    setStoredUser(merged);
                }
            }
        } catch (error) {
            console.error('Error al actualizar la tarjeta predeterminada:', error);
            // Even on error, try to refresh from server
            try {
                const refreshedCards = await fetchUserCards(userRun);
                if (refreshedCards && refreshedCards.length > 0) {
                    const normalized: any[] = refreshedCards
                        .map(cardDtoToStoredCard)
                        .filter((c): c is Exclude<ReturnType<typeof cardDtoToStoredCard>, null> => c !== null);
                    
                    const merged: StoredUser = {
                        ...storedUser,
                        paymentCards: normalized.length > 0 ? normalized : updatedCards,
                        defaultPaymentCardId: id,
                    };
                    setStoredUser(merged);
                }
            } catch (refreshError) {
                console.error('Error refreshing cards:', refreshError);
            }
        }
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
        void persistAvatar(null);
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
        void persistAvatar(pendingAvatarDataUrl);
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
    // Show age-based benefit separately (50% for mayores de 50)
    try {
        if (storedUser?.birthdate) {
            const bd = new Date(storedUser.birthdate);
            if (!isNaN(bd.getTime())) {
                const today = new Date();
                let age = today.getFullYear() - bd.getFullYear();
                const m = today.getMonth() - bd.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
                if (age >= 50) benefits.push('50% beneficio mayores');
            }
        }
    } catch {}

    // Show lifetime code benefit separately
    if (storedUser?.lifetimeDiscount) benefits.push('10% descuento de por vida (FELICES50)');

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
                                    <input id="telefono" className="form-control" placeholder="Ej: +56 9 1234 5678" value={telefono} name="telefono" onChange={(e) => setTelefono(e.target.value)} disabled={!isEditing} />
                                </div>

                                <div className="col-12 col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="nombre">Nombre</label>
                                        <input id="nombre" className="form-control" placeholder="María" value={nombre} name="nombre" onChange={(e) => setNombre(e.target.value)} disabled={!isEditing} />
                                    </div>
                                </div>
                                <div className="col-12 col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="apellidos">Apellidos</label>
                                        <input id="apellidos" className="form-control" placeholder="Pérez González" value={apellido} name="apellidos" onChange={(e) => setApellido(e.target.value)} disabled={!isEditing} />
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="mb-3">
                                        <label className="form-label" htmlFor="correo">Correo</label>
                                        <input id="correo" className="form-control" placeholder="usuario@dominio.com" type="email" value={storedUser?.email ?? ''} name="correo" disabled readOnly />
                                    </div>
                                </div>

                                

                                

                                <div className="d-flex flex-wrap gap-2 mt-3">
                                    {!isEditing ? (
                                        <button type="button" className={`btn ${styles.saveButton}`} onClick={() => { setProfileSaveError(''); setIsEditing(true); }}><i className="bi bi-pencil me-1" /> Editar</button>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className={`btn ${styles.saveButton}`}
                                                onClick={requestSaveProfile}
                                                disabled={!isDirty || profileSaving}
                                                title={profileSaving ? 'Guardando cambios…' : isDirty ? 'Guardar cambios' : 'No hay cambios para guardar'}
                                            >
                                                <i className="bi bi-save2 me-1" /> {profileSaving ? 'Guardando…' : 'Guardar'}
                                            </button>
                                            <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit}>Cancelar</button>
                                        </>
                                    )}
                                </div>
                                {profileSaveError ? <p className="text-danger small mb-0 mt-2">{profileSaveError}</p> : null}
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
                                                <React.Fragment key={String(o.id)}>
                                                    <tr style={{ cursor: 'pointer' }} onClick={() => {
                                                        const id = String(o.id);
                                                        setExpandedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                                                    }}>
                                                        <td>{String(o.id)}</td>
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
                                                        <td className="text-end"><small className="text-muted">Haz clic para ver detalles</small></td>
                                                    </tr>
                                                    {expandedOrders.includes(String(o.id)) ? (
                                                        <tr className="table-active">
                                                            <td colSpan={5}>
                                                                <div className="row">
                                                                    <div className="col-12 col-md-4 mb-2">
                                                                        <div className="fw-semibold">Fecha</div>
                                                                        <div className="small text-secondary">{new Date(o.tsISO || o.fecha || Date.now()).toLocaleString()}</div>
                                                                    </div>
                                                                    <div className="col-12 col-md-4 mb-2">
                                                                        <div className="fw-semibold">Método de pago</div>
                                                                        <div className="small text-secondary">{paymentMethodLabel(o)}</div>
                                                                    </div>
                                                                    <div className="col-12 col-md-4 mb-2">
                                                                        <div className="fw-semibold">Dirección</div>
                                                                        <div className="small text-secondary">{o.direccionEntrega || o.direccion || '—'}</div>
                                                                    </div>
                                                                    <div className="col-12 mt-2">
                                                                        <div className="fw-semibold">Productos</div>
                                                                        <div className="small text-secondary">
                                                                            {Array.isArray(o.items) && o.items.length > 0 ? (
                                                                                <ul className="mb-0">
                                                                                    {o.items.map((it: any, idx: number) => (
                                                                                        <li key={`detail-${idx}`}>{productNameByCode(it.code || it.productId)} — x{Number(it.qty || it.cantidad || 0)} {it.price ? ` — ${formatCLP(Number(it.price))}` : ''}</li>
                                                                                    ))}
                                                                                </ul>
                                                                            ) : '—'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-12 mt-3">
                                                                        <div className="fw-semibold mb-2">Resumen de pago</div>
                                                                        <div className="small text-secondary">
                                                                            {typeof o.subtotal === 'number' ? (
                                                                                <>
                                                                                    <div className="d-flex justify-content-between"><span>Subtotal</span><span>{formatCLP(o.subtotal)}</span></div>
                                                                                </>
                                                                            ) : null}
                                                                            {o.discounts ? (
                                                                                <>
                                                                                    {o.discounts.agePercent > 0 ? (
                                                                                        <div className="d-flex justify-content-between text-success"><span>50% beneficio mayores</span><span>-{formatCLP(Number(o.discounts.ageDiscountMoney || 0))}</span></div>
                                                                                    ) : null}
                                                                                    {o.discounts.codePercent > 0 ? (
                                                                                        <div className="d-flex justify-content-between text-success"><span>10% descuento de por vida</span><span>-{formatCLP(Number(o.discounts.codeDiscountMoney || 0))}</span></div>
                                                                                    ) : null}
                                                                                    {o.discounts.freeCakeApplied ? (
                                                                                        <div className="d-flex justify-content-between text-success"><span>Torta gratis</span><span>-{formatCLP(Number(o.discounts.freeCakeMoney || 0))}</span></div>
                                                                                    ) : null}
                                                                                </>
                                                                            ) : null}
                                                                            <div className="d-flex justify-content-between"><span>Total descuentos</span><span>-{formatCLP(Number(o.discountAmount ?? o.discounts?.totalDiscountMoney ?? 0))}</span></div>
                                                                            <div className="border-top pt-2 mt-2 d-flex justify-content-between fw-semibold"><span>Total</span><span>{formatCLP(Number(o.total || 0))}</span></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : null}
                                                </React.Fragment>
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

                    <div className="card mb-4">
                        <div className="card-body">
                            <h3 className="h5 mb-3"><i className="bi bi-credit-card-2-front-fill me-2"></i>Tarjetas</h3>
                            <div className="row g-3" id="cards-container">
                                <div className="col-12">
                                    <PaymentCards
                                        key={(storedUser?.paymentCards || []).length}
                                        mode="list"
                                        paymentCards={storedUser?.paymentCards || []}
                                        defaultCardId={storedUser?.defaultPaymentCardId}
                                        onSetDefault={(id) => handleSetDefaultCard(id)}
                                        onRemove={(id) => removeCard(id)}
                                        onAdd={(data) => addCard({ number: formatCardNumber(data.number), holder: normalizeHolderName(data.holder || ''), expMonth: formatExpMonth(data.expMonth || ''), expYear: formatExpYear(data.expYear || '') })}
                                    />
                                    {cardSaveError ? <div className="alert alert-danger mt-2">{cardSaveError}</div> : null}
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
