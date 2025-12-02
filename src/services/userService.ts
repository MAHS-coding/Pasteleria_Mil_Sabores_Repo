import axios from "axios";
import httpClient from "./httpClient.ts";
import { persistSessionToken, persistSessionUser } from "./session.ts";
import type { SessionUser } from "./session.ts";
import { createUser as persistLocalUser, normalizeRun, upsertStoredUser } from "../utils/registro";
import type { StoredUser } from "../utils/registro";

type RawUserResponse = Record<string, unknown> & {
    run?: string;
    userId?: string;
    correo?: string;
    nombre?: string;
    apellidos?: string;
    email?: string;
    fechaNacimiento?: string;
    tipoUsuario?: string;
    discountPercent?: number;
    lifetimeDiscountPercent?: number;
    lifetimeDiscount?: boolean;
    freeCakeEligible?: boolean;
    freeCakeVoucher?: boolean;
    freeCakeRedeemed?: boolean;
    telefono?: string;
    phone?: string;
    addresses?: StoredUser['addresses'];
    paymentCards?: StoredUser['paymentCards'];
    defaultPaymentCardId?: string;
    avatarDataUrl?: string;
    role?: string;
};

function formatRunForApi(run?: string): string | undefined {
    const normalized = normalizeRun(run);
    if (!normalized || normalized.length < 2) return undefined;
    const dv = normalized.slice(-1).toUpperCase();
    const cuerpo = normalized.slice(0, -1);
    return `${cuerpo}-${dv}`;
}

function encodeRun(run?: string): string | null {
    if (!run) return null;
    const sanitized = formatRunForApi(run);
    if (sanitized) return encodeURIComponent(sanitized);
    const trimmed = String(run || "").trim();
    return trimmed ? encodeURIComponent(trimmed) : null;
}

export type RegistrationPayload = { 
    run: string;
    nombre: string;
    apellidos: string;
    correo: string;
    fechaNacimiento: string;
    registrationCode?: string;
    password: string;
};

export type RegisterResult = { ok: true; run: string } | { ok: false; error: string };

export type LoginResult = { ok: true; user: SessionUser; token: string } | { ok: false; error: string };

function normalizeUser(raw?: Record<string, unknown>): SessionUser {
    if (!raw) return { name: "Usuario" };
    const email = String(raw.email || raw.correo || raw.username || "").trim() || undefined;
    const run = String(raw.run || raw.userId || raw.id || "").trim() || undefined;
    const nameParts = [
        raw.name,
        raw.nombre,
        raw.firstName,
        raw.nombreCompleto,
        raw.fullName,
    ]
        .filter(Boolean)
        .map((value) => String(value).trim());
    const name = nameParts.find(Boolean) || (email ? email.split("@")[0] : "Usuario");
    return { name, email, run };
}

function extractErrorMessage(error: unknown, fallback = "Error al comunicarse con el servidor."): string {
    if (axios.isAxiosError(error)) {
        const respData = error.response?.data;
        if (respData) {
            if (typeof respData === "string") return respData;
            const message = (respData as any).message || (respData as any).error;
            if (message) return String(message);
        }
        if (error.response?.status === 409) return "Ya existe una cuenta con ese correo.";
        if (error.response?.status === 401) return "Credenciales inválidas.";
        if (error.response?.status === 400) return "Los datos enviados son incorrectos.";
    }
    return fallback;
}

export function syncLocalUserProfile(raw?: RawUserResponse | null, fallbackRun?: string): StoredUser | undefined {
    if (!raw) return;
    const email = String(raw.email || raw.correo || "").trim();
    if (!email) return;
    const runValue = String(raw.run || fallbackRun || raw.userId || "").trim() || undefined;
    const lifetimeDiscountFlag = raw.lifetimeDiscount ?? (typeof raw.lifetimeDiscountPercent === 'number' ? raw.lifetimeDiscountPercent > 0 : undefined);
    return upsertStoredUser({
        run: runValue,
        name: String(raw.nombre || raw.name || raw.firstName || raw.nombreCompleto || raw.fullName || ""),
        lastname: String(raw.apellidos || raw.lastname || ""),
        email,
        birthdate: String(raw.fechaNacimiento || raw.birthdate || ""),
        role: (String(raw.tipoUsuario || raw.role || "") as StoredUser['role']) || undefined,
        phone: String(raw.telefono || raw.phone || "") || undefined,
        discountPercent: typeof raw.discountPercent === 'number' ? raw.discountPercent : undefined,
        lifetimeDiscount: lifetimeDiscountFlag,
        freeCakeVoucher: raw.freeCakeVoucher ?? raw.freeCakeEligible ?? undefined,
        freeCakeRedeemed: raw.freeCakeRedeemed ?? undefined,
        addresses: Array.isArray(raw.addresses) ? raw.addresses as StoredUser['addresses'] : undefined,
        paymentCards: Array.isArray(raw.paymentCards) ? raw.paymentCards as StoredUser['paymentCards'] : undefined,
        defaultPaymentCardId: raw.defaultPaymentCardId ?? undefined,
        avatarDataUrl: raw.avatarDataUrl ? String(raw.avatarDataUrl) : undefined,
    });
}

export type UserProfileUpdateRequest = {
    nombre?: string;
    apellidos?: string;
    telefono?: string;
    avatarDataUrl?: string;
    addresses?: StoredUser['addresses'];
    paymentCards?: StoredUser['paymentCards'];
    defaultPaymentCardId?: string;
};

export async function updateUserProfile(run: string, payload: UserProfileUpdateRequest): Promise<RawUserResponse | null> {
    if (!run) return null;
    const encoded = encodeRun(run);
    if (!encoded) return null;
    try {
        const response = await httpClient.put(`/api/users/${encoded}`, payload);
        return (response.data || null) as RawUserResponse;
    } catch (error) {
        return null;
    }
}

export type AddressDto = {
    id: string;
    address: string;
    region?: string;
    comuna?: string;
};

export type AddressInput = Pick<AddressDto, 'address' | 'region' | 'comuna'>;

export async function fetchUserAddresses(run: string): Promise<AddressDto[] | null> {
    if (!run) return null;
    const encoded = encodeRun(run);
    if (!encoded) return null;
    try {
        const response = await httpClient.get(`/api/users/${encoded}/addresses`);
        return (response.data || null) as AddressDto[];
    } catch (error) {
        return null;
    }
}

export async function addUserAddress(run: string, payload: AddressInput): Promise<AddressDto | null> {
    if (!run) return null;
    const encoded = encodeRun(run);
    if (!encoded) return null;
    try {
        const response = await httpClient.post(`/api/users/${encoded}/addresses`, payload);
        return (response.data || null) as AddressDto;
    } catch (error) {
        return null;
    }
}

export type CardDto = {
    id: string;
    brand?: string;
    lastFourDigits?: string;
    cardNumber?: string;
    month?: string;
    year?: string;
    cardholderName?: string;
};

export type CardInput = {
    cardNumber: string;
    month?: string;
    year?: string;
    cardholderName?: string;
};

function extractLastFourDigits(cardNumber?: string): string | undefined {
    if (!cardNumber) return undefined;
    const numeric = String(cardNumber).replace(/[^0-9]/g, '');
    if (!numeric) return undefined;
    return numeric.slice(-4);
}

type StoredCard = StoredUser['paymentCards'] extends Array<infer C> ? C : never;

export function cardDtoToStoredCard(card?: CardDto): StoredCard | undefined {
    if (!card || !card.id) return undefined;
    const last4 = card.lastFourDigits || extractLastFourDigits(card.cardNumber);
    if (!last4) return undefined;
    return {
        id: card.id,
        brand: card.brand ?? undefined,
        last4,
        expMonth: card.month ?? undefined,
        expYear: card.year ?? undefined,
        holderName: card.cardholderName ?? undefined,
    } as StoredCard;
}

export async function fetchUserCards(run: string): Promise<CardDto[] | null> {
    if (!run) return null;
    const encoded = encodeRun(run);
    if (!encoded) return null;
    try {
        const response = await httpClient.get(`/api/users/${encoded}/cards`);
        return (response.data || null) as CardDto[];
    } catch (error) {
        return null;
    }
}

export async function addUserCard(run: string, payload: CardInput): Promise<CardDto | null> {
    if (!run) return null;
    const encoded = encodeRun(run);
    if (!encoded) return null;
    try {
        const response = await httpClient.post(`/api/users/${encoded}/cards`, payload);
        return (response.data || null) as CardDto;
    } catch (error) {
        return null;
    }
}

export async function register(payload: RegistrationPayload): Promise<RegisterResult> {
    try {
        const sanitizedRun = formatRunForApi(payload.run) ?? payload.run;
        const payloadWithNormalizedRun = { ...payload, run: sanitizedRun };
        await httpClient.post("/api/users/register", payloadWithNormalizedRun);
        try {
            persistLocalUser({
                ...payload,
                run: sanitizedRun,
                name: payload.nombre,
                lastname: payload.apellidos,
                email: payload.correo,
                birthdate: payload.fechaNacimiento,
                codigo: payload.registrationCode,
                password: payload.password,
            });
        } catch {
            // ignore local storage failures, backend is source of truth
        }
        return { ok: true, run: sanitizedRun };
    } catch (error) {
        return { ok: false, error: extractErrorMessage(error) };
    }
}

export async function login(email: string, password: string, runHint?: string): Promise<LoginResult> {
    try {
        const response = await httpClient.post("/api/auth/login", { correo: email, password });
        const { accessToken, token, user } = response.data || {};
        const { userId, run } = (response.data || {}) as RawUserResponse;
        const authToken = String(accessToken || token || "").trim();
        if (!authToken) {
            return { ok: false, error: "El servidor no devolvió un token." };
        }
        const resolvedRun = String(user?.run || runHint || userId || run || "").trim();
        persistSessionToken(authToken);
        const fetchedProfile = resolvedRun ? await fetchUserProfile(resolvedRun) : null;
        const profileSource = { ...(fetchedProfile ?? user ?? response.data) } as RawUserResponse;
        if (!profileSource.run && resolvedRun) {
            profileSource.run = resolvedRun;
        }
        syncLocalUserProfile(profileSource, resolvedRun || undefined);
        const normalizedUser = normalizeUser(profileSource);
        persistSessionUser(normalizedUser);
        return { ok: true, user: normalizedUser, token: authToken };
    } catch (error) {
        return { ok: false, error: extractErrorMessage(error) };
    }
}

export async function fetchUserProfile(run: string): Promise<RawUserResponse | null> {
    const encoded = encodeRun(run);
    if (!encoded) return null;
    try {
        const response = await httpClient.get(`/api/users/${encoded}`);
        return (response.data || null) as RawUserResponse;
    } catch (error) {
        return null;
    }
}

const userService = { register, login };
export default userService;
