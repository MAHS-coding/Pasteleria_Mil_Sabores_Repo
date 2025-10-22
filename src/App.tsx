// src/App.tsx
/* ===== Paginas ===== */
import { Home } from "./pages/home/Home";
import { Productos } from "./pages/productos/Productos";
import { Detalle } from "./pages/productos/Detalle";
import { Header } from "./components/header/Header";
import { Footer } from "./components/footer/Footer";


import { BrowserRouter, Route, Routes } from "react-router"

export function App() {
    return (
        <div className = "d-flex flex-column min-vh-100">
            <BrowserRouter>
            {/* Barra de navegacion (fija arriba por .sticky-top dentro de Header) */}
            <Header />
            <Routes>
                <Route path = '/' element = {<Home/>}/>
                <Route path = '/productos' element = {<Productos/>}/>
                <Route path = '/detalle' element = {<Detalle/>}/>
            </Routes>
            {/* Pie de página (con mt-auto dentro del componente para aferrarse abajo) */}
            <Footer />
            </BrowserRouter>
        </div>
    );
}

export default App
