import { readUsers, createUser } from "../utils/registro";
import type { StoredUser } from "../utils/registro";
import { sha256Hex } from "../utils/hash";

export type RegisterPayload = Omit<StoredUser, 'createdAt'> & { passwordPlain?: string };

// Try to authenticate a user by email and plain password. Returns the stored user on success.
export async function authenticate(email: string, passwordPlain: string): Promise<StoredUser | undefined> {
    const hashed = await sha256Hex(passwordPlain || "");
    const users = readUsers();
    return users.find(u => String(u.email || '').toLowerCase() === String(email).toLowerCase() && u.password === hashed);
}

// Register a new user using plain password. Returns the same shape as createUser from utils.
export async function register(payload: RegisterPayload): Promise<{ ok: true; user: StoredUser } | { ok: false; error: string }> {
    const payloadCopy: any = { ...payload };
    // If caller provided plain password, hash it. Otherwise assume password is already hashed.
    if (payload.passwordPlain) {
        payloadCopy.password = await sha256Hex(String(payload.passwordPlain));
        delete payloadCopy.passwordPlain;
    }
    return createUser(payloadCopy as any);
}

export default { authenticate, register };
