import axios from "axios";

const envBase = String(import.meta.env.VITE_API_BASE || "http://localhost:8080").replace(/\/+$/, "");
const API_BASE = envBase || "http://localhost:8080";
const TOKEN_KEY = "auth_token";

function safeReadToken(): string | null {
    if (typeof window === "undefined" || !window.localStorage) {
        return null;
    }
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

const httpClient = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
});

const initialToken = safeReadToken();
if (initialToken) {
    httpClient.defaults.headers.common["Authorization"] = `Bearer ${initialToken}`;
}

httpClient.interceptors.request.use((config) => {
    const token = safeReadToken();
    const headers = (config.headers ?? {}) as Record<string, string>;
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    } else {
        delete headers.Authorization;
    }
    config.headers = headers as typeof config.headers;
    return config;
});

export function updateAuthToken(token: string | null) {
    if (token) {
        httpClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete httpClient.defaults.headers.common["Authorization"];
    }
}

export default httpClient;
