// Utilities to handle user storage and creation for the simple localStorage-backed auth used in the project.

export type StoredUser = {
    run: string;
    name: string;
    lastname: string;
    email: string;
    birthdate: string;
    role?: 'Cliente' | 'Vendedor' | 'Administrador' | 'SuperAdmin';
    codigo?: string;
    password: string;
    phone?: string;
    addresses?: Array<{ id: string; address: string; region?: string; comuna?: string }>;
    discountPercent?: number; // total discount percentage (age + lifetime)
    lifetimeDiscount?: boolean; // true when registered with FELICES50
    freeCakeVoucher?: boolean; // one-time free cake voucher (e.g., student birthday)
    freeCakeRedeemed?: boolean;
    blocked?: boolean; // admin can prevent purchases while allowing login
    avatarDataUrl?: string;
    createdAt: string;
};

const USERS_KEY = 'users';
import { getJSON, setJSON } from './storage';

export function readUsers(): StoredUser[] {
    const v = getJSON<StoredUser[]>(USERS_KEY);
    return Array.isArray(v) ? v : [];
}

export function writeUsers(users: StoredUser[]) {
    setJSON(USERS_KEY, users);
}

export function updateUser(email: string, changes: Partial<StoredUser>): StoredUser | undefined {
    if (!email) return undefined;
    const users = readUsers();
    const idx = users.findIndex(u => String(u.email || '').toLowerCase() === String(email).toLowerCase());
    if (idx === -1) return undefined;
    const updated = { ...users[idx], ...changes } as StoredUser;
    users[idx] = updated;
    writeUsers(users);
    return updated;
}

export function findUserByEmail(email?: string): StoredUser | undefined {
    if (!email) return undefined;
    const users = readUsers();
    return users.find(u => String(u.email || '').toLowerCase() === String(email).toLowerCase());
}

export function isDuocEmail(email?: string): boolean {
    if (!email) return false;
    const e = String(email).toLowerCase();
    return /@([a-z0-9.-]+\.)?duoc\.cl$/i.test(e);
}

export function isBirthdayToday(birthdate?: string): boolean {
    if (!birthdate) return false;
    // Parse YYYY-MM-DD safely to avoid timezone shifts
    const m = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(String(birthdate));
    let bd: Date | null = null;
    if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const d = Number(m[3]);
        bd = new Date(y, mo, d);
    } else {
        const t = new Date(birthdate);
        if (!isNaN(t.getTime())) bd = t; else bd = null;
    }
    if (!bd) return false;
    const today = new Date();
    return bd.getDate() === today.getDate() && bd.getMonth() === today.getMonth();
}

// Try to create a user. Returns { ok: true, user } on success or { ok: false, error } on failure.
export function createUser(payload: Omit<StoredUser, 'createdAt'>): { ok: true, user: StoredUser } | { ok: false, error: string } {
    const users = readUsers();
    if (users.find(u => String(u.email || '').toLowerCase() === String(payload.email).toLowerCase())) {
        return { ok: false, error: 'email_exists' };
    }
    // compute perks: age-based discount, lifetime code, and student birthday free cake
    let discount = 0;
    let lifetime = false;
    let freeCake = false;

    try {
        if (payload.birthdate) {
            const bd = new Date(payload.birthdate);
            if (!isNaN(bd.getTime())) {
                const today = new Date();
                let age = today.getFullYear() - bd.getFullYear();
                const m = today.getMonth() - bd.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
                if (age >= 50) discount += 50; // 50% for users >= 50 years
                // birthday student free cake: if registering on birthday and institutional email (any subdomain of duoc.cl)
                const isBday = bd.getDate() === today.getDate() && bd.getMonth() === today.getMonth();
                if (isBday && isDuocEmail(payload.email)) {
                    freeCake = true;
                }
            }
        }
    } catch (e) {}

    if (payload.codigo && String(payload.codigo).toUpperCase() === 'FELICES50') {
        lifetime = true;
        discount += 10; // 10% lifetime
    }

    if (discount > 100) discount = 100;

    // Default role if not provided
    const role = (payload.role as StoredUser['role']) || 'Cliente';
    const blocked = Boolean((payload as any).blocked) || false;
    const user: StoredUser = { ...payload, role, blocked, discountPercent: discount, lifetimeDiscount: lifetime, freeCakeVoucher: freeCake, freeCakeRedeemed: false, createdAt: new Date().toISOString() };
    users.push(user);
    writeUsers(users);
    return { ok: true, user };
}

export default { readUsers, writeUsers, findUserByEmail, createUser, isDuocEmail, isBirthdayToday };
