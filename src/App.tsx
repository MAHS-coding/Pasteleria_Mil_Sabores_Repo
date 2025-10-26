import Home from "./pages/home/Home";
import Productos from "./pages/productos/Productos";
import Detalle from "./pages/productos/Detalle";
import Registro from "./pages/auth/Registro";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Carrito from "./pages/cart/Carrito";
import Checkout from "./pages/checkout/Checkout";
import Perfil from "./pages/account/Perfil";
import ProtectedRoute from "./routes/ProtectedRoute";
import RequireAdmin from "./routes/RequireAdmin";
import Admin from "./pages/admin/Admin";


import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"

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
                <Route path = '/checkout' element = {<ProtectedRoute><Checkout/></ProtectedRoute>} />
                <Route path = '/perfil' element = {<ProtectedRoute><Perfil/></ProtectedRoute>} />
                {/* Common typo alias */}
                <Route path = '/chekout' element={<Navigate to='/checkout' replace />} />
                {/* Admin root */}
                <Route path = '/admin' element = {<ProtectedRoute><RequireAdmin><Admin/></RequireAdmin></ProtectedRoute>} />
                {/* Normalize any subpath like /admin/dashboard to the same Admin component */}
                <Route path = '/admin/*' element = {<ProtectedRoute><RequireAdmin><Admin/></RequireAdmin></ProtectedRoute>} />
                {/* Fallback: unknown routes -> home */}
                <Route path = '*' element={<Navigate to='/' replace />} />
            </Routes>
            <Footer />
            </BrowserRouter>
        </div>
    );
}

export default App
