export function getJSON<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export function setJSON(key: string, value: any): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
    }
}

export function remove(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {}
}

export default { getJSON, setJSON, remove };
