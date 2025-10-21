// src/App.tsx
import React from "react";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";

/* ===== Paginas ===== */
import { Productos } from "./pages/productos/Productos";


import { BrowserRouter, Route, Routes } from "react-router"
import Home from "./pages/home/Home";

export function App() {
    return (
        <div className = "d-flex flex-column min-vh-100">
            {/* Barra de navegacion (fija arriba por .sticky-top dentro de Header) */}
            <Header />
            <BrowserRouter>
            </BrowserRouter>
            {/* Pie de página (con mt-auto dentro del componente para aferrarse abajo) */}
            <Footer />
        </div>
    );
}
