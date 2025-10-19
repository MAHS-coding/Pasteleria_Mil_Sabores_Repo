// src/main.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/main.css";


import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

/**
 * Main es el punto de entrada de la app.
 * - Monta <App />. en #root
 *  - StrictMode ayuda a detectar practicas inseguras en desarrollo (no se como jajaja)
 */

createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
