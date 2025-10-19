// src/App.tsx
import React from "react";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Home from "./pages/home/Home";

export function App() {
    return (
        <div className = "d-flex flex-column min-vh-100">
            {/* Barra de navegacion (fija arriba por .sticky-top dentro de Header) */}
            <Header />

            {/* Contenido principal (Home ya retorna <main className="home">) */}
            <Home />

            {/* Pie de página (con mt-auto dentro del componente para aferrarse abajo) */}
            <Footer />
        </div>
    );
}
