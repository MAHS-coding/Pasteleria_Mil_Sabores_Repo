import React, { createContext, useContext, useEffect, useState } from "react";
const KEY_USER = "usuario";

import { getJSON, setJSON, remove } from "../utils/storage";

type User = { name: string; email?: string } | null;

type AuthContextValue = {
    user: User;
    login: (user: string | { name: string; email?: string }) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readUser(): User {
    try {
        return getJSON<User>(KEY_USER);
    } catch {
        return null;
    }
}

function writeUser(u: User) {
    try {
        if (!u) remove(KEY_USER);
        else setJSON(KEY_USER, u);
    } catch {}
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>(() => readUser());

    useEffect(() => {
        writeUser(user);
    }, [user]);

    function login(payload: string | { name: string; email?: string }) {
        if (typeof payload === "string") setUser({ name: payload });
        else setUser({ name: payload.name, email: payload.email });
    }

    function logout() {
        // Clear persisted admin UI state so Back won't land on stale admin section
        try {
            sessionStorage.removeItem("admin.section");
            sessionStorage.removeItem("admin.productos.sub");
            sessionStorage.removeItem("admin.usuarios.filtroTipo");
            sessionStorage.removeItem("admin.usuarios.orderDesc");
            sessionStorage.removeItem("admin.usuarios.qSearch");
        } catch {}
        setUser(null);
    }

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}

export default AuthContext;
