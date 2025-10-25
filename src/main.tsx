// src/main.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/main.css";


import { StrictMode } from 'react'
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { seedUsersFromJson } from './utils/seedUsers';

/**
 * Main es el punto de entrada de la app.
 * - Monta <App />. en #root
 *  - StrictMode ayuda a detectar practicas inseguras en desarrollo (no se como jajaja)
 */

createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
        <AuthProvider>
            <CartProvider>
                <App />
            </CartProvider>
        </AuthProvider>
    </StrictMode>
)

// Seed dev users into localStorage on development builds so the demo accounts are available
if (import.meta.env.DEV) {
    try {
        seedUsersFromJson();
    } catch (err) {
        // ignore seed errors in dev
        // console.debug('seed error', err);
    }
}
