import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';
const TOKEN_KEY = 'product_service_token';

const instance: AxiosInstance = axios.create({
  baseURL: API_BASE || undefined,
  headers: { 'Content-Type': 'application/json' },
});

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete instance.defaults.headers.common['Authorization'];
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function hasApi(): boolean {
  return !!API_BASE;
}

export async function request(path: string, opts: AxiosRequestConfig = {}) {
  if (!hasApi()) throw new Error('API base not configured');
  const cfg = { ...(opts || {}) } as AxiosRequestConfig;
  const res = await instance.request({ url: path, ...cfg });
  return res.data;
}

// initialize token from storage
const stored = getToken();
if (stored) instance.defaults.headers.common['Authorization'] = `Bearer ${stored}`;

export default { request, setToken, getToken, hasApi, instance };
