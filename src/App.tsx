// src/App.tsx
import React from "react";
import Header from "./components/header/Header";
import Home from "./pages/home/Home";
import Footer from "./components/footer/Footer";

export function App() {
    return (
        <>
            <Header />
            <Home />
            <Footer />
        </>
    );
}
