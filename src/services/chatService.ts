import { getJSON, setJSON } from "../utils/storage";

// Single-file chatService: uses remote API when VITE_API_BASE is set, otherwise localStorage.

export const CHAT_KEY = "chatMensajes";
export const CHAT_UPDATED_EVENT = "chatMensajesUpdated";

export type ChatMensaje = {
    id: string;
    nombre: string;
    texto: string;
    categoria?: string;
    receta?: string;
    createdAt: string; // ISO
};

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "";
const API_RESOURCE = "/chats"; // remote endpoint base (e.g. /api/chats)

function emitUpdate(detail?: ChatMensaje[]) {
    try {
        window.dispatchEvent(new CustomEvent(CHAT_UPDATED_EVENT, { detail }));
    } catch { }
}

function generateId(): string {
    try {
        // use browser crypto when available
        if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
            return (crypto as any).randomUUID();
        }
    } catch { }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// --- Local implementation (localStorage) ---
function getAllMensajesLocal(): ChatMensaje[] {
    try {
        const v = getJSON<ChatMensaje[]>(CHAT_KEY);
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
}

function saveMensajesLocal(items: ChatMensaje[]): void {
    try {
        setJSON(CHAT_KEY, items);
        emitUpdate(items);
    } catch { }
}

function postMensajeLocal(payload: Omit<ChatMensaje, 'id' | 'createdAt'>): ChatMensaje {
    const all = getAllMensajesLocal();
    const msg: ChatMensaje = {
        ...payload,
        id: generateId(),
        createdAt: new Date().toISOString(),
    };
    const next = [...all, msg];
    saveMensajesLocal(next);
    return msg;
}

function deleteMensajeByIdLocal(id: string): boolean {
    if (!id) return false;
    const all = getAllMensajesLocal();
    const idx = all.findIndex(m => m.id === id);
    if (idx === -1) return false;
    const next = [...all.slice(0, idx), ...all.slice(idx + 1)];
    saveMensajesLocal(next);
    return true;
}

// --- Remote implementation (fetch) ---
async function getAllMensajesRemote(): Promise<ChatMensaje[]> {
    const url = `${API_BASE}${API_RESOURCE}`;
    try {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data?.data ?? []);
    } catch {
        return [];
    }
}

async function postMensajeRemote(payload: Omit<ChatMensaje, 'id' | 'createdAt'>): Promise<ChatMensaje | undefined> {
    const url = `${API_BASE}${API_RESOURCE}`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) return undefined;
        const data = await res.json();
        // assume server returns created object or { data: ... }
        return data?.data ?? data;
    } catch {
        return undefined;
    }
}

async function deleteMensajeByIdRemote(id: string): Promise<boolean> {
    if (!id) return false;
    const url = `${API_BASE}${API_RESOURCE}/${encodeURIComponent(id)}`;
    try {
        const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
        return res.ok;
    } catch {
        return false;
    }
}

// --- Public API: choose remote when API_BASE configured; otherwise local ---
export async function getAllMensajes(): Promise<ChatMensaje[] | []> {
    if (API_BASE) return await getAllMensajesRemote();
    return getAllMensajesLocal();
}

export async function getMensajesForReceta(recetaTitle?: string): Promise<ChatMensaje[]> {
    if (!recetaTitle) return [];
    if (API_BASE) {
        const all = await getAllMensajesRemote();
        return all.filter(m => String(m.receta || '').trim() === String(recetaTitle).trim());
    }
    return getAllMensajesLocal().filter(m => String(m.receta || '').trim() === String(recetaTitle).trim());
}

export async function postMensaje(payload: Omit<ChatMensaje, 'id' | 'createdAt'>): Promise<ChatMensaje | undefined> {
    if (API_BASE) {
        const created = await postMensajeRemote(payload);
        if (created) emitUpdate(await getAllMensajesRemote());
        return created;
    }
    return postMensajeLocal(payload);
}

export async function deleteMensajeById(id: string): Promise<boolean> {
    if (API_BASE) {
        const ok = await deleteMensajeByIdRemote(id);
        if (ok) emitUpdate(await getAllMensajesRemote());
        return ok;
    }
    return deleteMensajeByIdLocal(id);
}

export default { CHAT_KEY, CHAT_UPDATED_EVENT, getAllMensajes, getMensajesForReceta, postMensaje, deleteMensajeById };
