import { readUsers, createUser } from "../utils/registro";
import type { StoredUser } from "../utils/registro";
import { sha256Hex } from "../utils/hash";
import apiClient from "@/config/axiosConfig";

export type RegisterPayload = Omit<StoredUser, 'createdAt'> & { passwordPlain?: string };

// If Vite env VITE_API_BASE is set, prefer remote auth (JWT). Otherwise fall back
// to the local file-backed authentication used previously.

export async function authenticate(email: string, passwordPlain: string): Promise<StoredUser | undefined> {
    if (apiClient.hasApi()) {
        try {
            const res = await apiClient.request('/api/auth/login', { method: 'POST', data: { correo: email, password: passwordPlain } });
            if ((res as any).token) {
                apiClient.setToken((res as any).token);
                // backend does not return user object on login; try to fetch frontend-users
                const user = await fetchLocalOrRemoteUserByEmail(email);
                return user as StoredUser | undefined;
            }
        } catch (e) {
            console.warn('Remote auth failed, falling back:', e);
        }
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const hashed = await sha256Hex(passwordPlain || "");
    const users = readUsers();
    return users.find(u => String(u.email || '').toLowerCase() === normalizedEmail && u.password === hashed);
}

async function fetchLocalOrRemoteUserByEmail(email: string) {
    if (apiClient.hasApi()) {
        try {
            const list = await apiClient.request('/api/content/frontend-users');
            if (Array.isArray(list)) return list.find((u: any) => String(u.email || '').toLowerCase() === String(email || '').toLowerCase());
        } catch (e) { /* fallback below */ }
    }
    const users = readUsers();
    return users.find(u => String(u.email || '').toLowerCase() === String(email || '').toLowerCase());
}

// Register - prefer remote when available
export async function register(payload: RegisterPayload): Promise<{ ok: true; user: StoredUser } | { ok: false; error: string }> {
    // Normalize email
    const p: any = { ...payload };
    if (p.email) p.email = String(p.email).trim().toLowerCase();

    if (apiClient.hasApi()) {
        try {
            const res = await apiClient.request('/api/auth/register', { method: 'POST', data: { correo: p.email, password: p.passwordPlain || p.password, nombre: p.nombre } });
            if (res && res.user) {
                // token already set by auth controller
                if ((res as any).token) apiClient.setToken((res as any).token);
                return { ok: true, user: res.user as StoredUser };
            }
        } catch (e) {
            console.warn('Remote register failed, falling back to local:', e);
        }
    }

    // fallback to local file-backed registration
    if (p.passwordPlain) {
        p.password = await sha256Hex(String(p.passwordPlain));
        delete p.passwordPlain;
    }
    return createUser(p as any);
}

export default { authenticate, register };
