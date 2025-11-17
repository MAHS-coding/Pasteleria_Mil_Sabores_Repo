import { getJSON, setJSON, remove as removeJSON } from "../utils/storage";
import { authenticate } from "./authService";
import { readUsers, findUserByEmail, updateUser } from "../utils/registro";
import type { StoredUser } from "../utils/registro";
import { sha256Hex } from "../utils/hash";

const SESSION_KEY = "usuario"; // match AuthContext

type LoginResult = { ok: true; user: StoredUser } | { ok: false; error: string };

function emitAuthChanged(detail?: any) {
    try {
        window.dispatchEvent(new CustomEvent('authChanged', { detail }));
    } catch {}
}

export async function login(email: string, passwordPlain: string): Promise<LoginResult> {
    const normalized = String(email || '').trim().toLowerCase();
    const user = await authenticate(normalized, passwordPlain);
    if (!user) return { ok: false, error: 'invalid_credentials' };
    try {
        setJSON(SESSION_KEY, { name: user.name, email: user.email });
        emitAuthChanged({ user });
    } catch {}
    return { ok: true, user };
}

export function logout(): void {
    try {
        removeJSON(SESSION_KEY);
        emitAuthChanged({ user: null });
    } catch {}
}

export function getCurrentSession(): { name: string; email?: string } | null {
    try {
        return getJSON<{ name: string; email?: string }>(SESSION_KEY);
    } catch {
        return null;
    }
}

export function getCurrentUser(): StoredUser | undefined {
    const session = getCurrentSession();
    if (!session || !session.email) return undefined;
    return findUserByEmail(session.email);
}

export function updateProfile(email: string, changes: Partial<StoredUser>): StoredUser | undefined {
    const normalized = String(email || '').trim().toLowerCase();
    const updated = updateUser(normalized, changes as Partial<StoredUser>);
    if (updated) emitAuthChanged({ user: updated });
    return updated;
}

export async function changePassword(email: string, newPasswordPlain: string): Promise<boolean> {
    const normalized = String(email || '').trim().toLowerCase();
    try {
        const hashed = await sha256Hex(newPasswordPlain || '');
        const updated = updateUser(normalized, { password: hashed } as Partial<StoredUser>);
        if (updated) {
            emitAuthChanged({ user: updated });
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

export function listUsers(): StoredUser[] {
    return readUsers();
}

export function blockUser(email: string): StoredUser | undefined {
    const normalized = String(email || '').trim().toLowerCase();
    const updated = updateUser(normalized, { blocked: true } as Partial<StoredUser>);
    if (updated) emitAuthChanged({ user: updated });
    return updated;
}

export function unblockUser(email: string): StoredUser | undefined {
    const normalized = String(email || '').trim().toLowerCase();
    const updated = updateUser(normalized, { blocked: false } as Partial<StoredUser>);
    if (updated) emitAuthChanged({ user: updated });
    return updated;
}

export default { login, logout, getCurrentSession, getCurrentUser, updateProfile, changePassword, listUsers, blockUser, unblockUser };
