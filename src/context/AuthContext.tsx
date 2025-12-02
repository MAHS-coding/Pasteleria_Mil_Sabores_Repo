import React, { createContext, useContext, useEffect, useState } from "react";
import {
    initializeSession,
    persistSessionToken,
    persistSessionUser,
    readSessionUser,
} from "../services/session.ts";
import type { SessionUser } from "../services/session.ts";

type User = SessionUser | null;

type AuthContextValue = {
    user: User;
    login: (user: string | (SessionUser & { token?: string })) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>(() => readSessionUser());

    useEffect(() => {
        initializeSession();
    }, []);

    useEffect(() => {
        persistSessionUser(user);
    }, [user]);

    function login(payload: string | (SessionUser & { token?: string })) {
        if (typeof payload === "string") {
            setUser({ name: payload });
            return;
        }
        setUser({ name: payload.name, email: payload.email, run: payload.run });
        if (payload.token) {
            persistSessionToken(payload.token);
        }
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
        persistSessionUser(null);
        persistSessionToken(null);
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
