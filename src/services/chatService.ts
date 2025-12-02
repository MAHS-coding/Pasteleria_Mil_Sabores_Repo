import { getJSON, setJSON } from "../utils/storage";

export const CHAT_KEY = "chatMensajes";
export const CHAT_UPDATED_EVENT = "chatMensajesUpdated";

export type ChatMensaje = {
    id: string;
    nombre: string;
    texto: string;
    categoria?: string;
    receta?: string;
    img?: string;
    createdAt: string;
};

const STORAGE_DEFAULT: ChatMensaje[] = [];

function emitUpdate(detail?: ChatMensaje[]) {
    try {
        window.dispatchEvent(new CustomEvent(CHAT_UPDATED_EVENT, { detail }));
    } catch {}
}

function readAll(): ChatMensaje[] {
    try {
        const stored = getJSON<ChatMensaje[]>(CHAT_KEY);
        if (Array.isArray(stored)) return stored;
    } catch {}
    return STORAGE_DEFAULT;
}

function writeAll(items: ChatMensaje[]): void {
    try {
        setJSON(CHAT_KEY, items);
        emitUpdate(items);
    } catch {}
}

function generateId(): string {
    try {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }
    } catch {}
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getAllMensajes(): Promise<ChatMensaje[]> {
    return Promise.resolve(readAll());
}

export async function postMensaje(payload: Omit<ChatMensaje, "id" | "createdAt">): Promise<ChatMensaje> {
    const all = readAll();
    const next: ChatMensaje = {
        ...payload,
        id: generateId(),
        createdAt: new Date().toISOString(),
    } as ChatMensaje;
    writeAll([...all, next]);
    return next;
}

export async function deleteMensajeById(id: string): Promise<boolean> {
    if (!id) return false;
    const all = readAll();
    const idx = all.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    const next = [...all.slice(0, idx), ...all.slice(idx + 1)];
    writeAll(next);
    return true;
}

const chatService = { CHAT_KEY, CHAT_UPDATED_EVENT, getAllMensajes, postMensaje, deleteMensajeById };
export default chatService;