import { getJSON, setJSON, remove } from "../utils/storage";
import { updateAuthToken } from "./httpClient.ts";

const USER_KEY = "usuario";
const TOKEN_KEY = "auth_token";

export type SessionUser = { name: string; email?: string; run?: string };

export function readSessionUser(): SessionUser | null {
    return getJSON<SessionUser>(USER_KEY);
}

export function persistSessionUser(user: SessionUser | null): void {
    if (!user) {
        remove(USER_KEY);
        return;
    }
    setJSON(USER_KEY, user);
}

export function readSessionToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function persistSessionToken(token: string | null): void {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        localStorage.removeItem(TOKEN_KEY);
    }
    updateAuthToken(token);
}

export function initializeSession(): void {
    updateAuthToken(readSessionToken());
}
