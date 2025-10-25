import Home from "./pages/home/Home";
import Productos from "./pages/productos/Productos";
import Detalle from "./pages/productos/Detalle";
import Registro from "./pages/auth/Registro";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Carrito from "./pages/cart/Carrito";
import Perfil from "./pages/account/Perfil";
import ProtectedRoute from "./components/routes/ProtectedRoute";


import { BrowserRouter, Route, Routes } from "react-router"

export function App() {
    return (
        <div className = "d-flex flex-column min-vh-100">
            <BrowserRouter>
            <Header />
            <Routes>
                <Route path = '/' element = {<Home/>}/>
                <Route path = '/productos' element = {<Productos/>}/>
                <Route path = '/productos/:category' element = {<Productos/>}/>
                <Route path = '/detalle' element = {<Detalle/>}/>
                <Route path = '/registro' element = {<Registro/>}/>
                <Route path = '/carrito' element = {<ProtectedRoute><Carrito/></ProtectedRoute>} />
                <Route path = '/perfil' element = {<ProtectedRoute><Perfil/></ProtectedRoute>} />
            </Routes>
            <Footer />
            </BrowserRouter>
        </div>
    );
}

export default App
