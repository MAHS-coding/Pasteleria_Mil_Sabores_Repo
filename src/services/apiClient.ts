const API_BASE = (import.meta as any).env?.VITE_API_BASE || null;
const TOKEN_KEY = 'product_service_token';

export function setToken(token: string | null) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export async function request(path: string, opts: RequestInit = {}) {
    if (!API_BASE) throw new Error('API base not configured');
    const headers: Record<string,string> = { 'Content-Type': 'application/json', ...(opts.headers as any || {}) };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE.replace(/\/$/, '')}${path}`, { ...opts, headers });
    if (res.status === 401) {
        // token invalid/expired
        setToken(null);
        throw new Error('Unauthorized');
    }
    const text = await res.text();
    try { return JSON.parse(text); } catch(e) { return text; }
}

export function hasApi(): boolean { return !!API_BASE; }

export default { request, setToken, getToken, hasApi };
