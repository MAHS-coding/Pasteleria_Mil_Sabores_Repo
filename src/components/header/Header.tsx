import { Link, useNavigate } from "react-router-dom";
import "./Header.css"; // Importa los estilos específicos para el encabezado
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import FormField from "../ui/FormField";
import { readUsers } from "../../utils/registro";
import { isAdminEmail } from "../../utils/roles";
import { sha256Hex } from "../../utils/hash";

function CartBadge() {
    const { count } = useCart();
    return (
        <Link to="/carrito" className="nav-link ms-3 position-relative" style={{ marginRight: "16px" }}>
            <i className="bi bi-cart fs-4"></i>
            <span className={`position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger ${count > 0 ? "" : "d-none"}`}>{count}</span>
        </Link>
    );
}

const Header: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout, login } = useAuth();
    const [showLogin, setShowLogin] = useState(false);
    const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");

    useEffect(() => {
        const handler = () => setShowLogin(true);
        window.addEventListener('open-login', handler as EventListener);
        return () => window.removeEventListener('open-login', handler as EventListener);
    }, []);

    useEffect(() => {
        if (showLogin) {
            setLoginEmail("");
            setLoginPassword("");
            setLoginError("");
        }
    }, [showLogin]);

    async function handleLoginSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const users = readUsers();
            const hashed = await sha256Hex(loginPassword);
            const found = users.find(
                (candidate) =>
                    String(candidate.email).toLowerCase() === String(loginEmail).toLowerCase() &&
                    candidate.password === hashed
            );
            if (!found) {
                setLoginError("Usuario o contraseña incorrectos.");
                return;
            }
            login({ name: found.name || "Usuario", email: found.email });
            setShowLogin(false);
            // No redirección automática al panel; se muestra item "Admin" en el navbar si corresponde
            navigate("/");
        } catch (err) {
            setLoginError("Ocurrió un problema al iniciar sesión.");
        }
    }
    return (
        <header className="sticky-top">
            <nav className="navbar navbar-expand-lg primary-nav">
                <div className="container">
                    
                    {/* === LOGO === */}
                    <Link className="navbar-brand" to="/">
                        <img
                            src="/images/logos/logo_titulo.png"
                            alt="Pastelería Mil Sabores"
                            height={40}
                            className="brand-logo"
                        />
                    </Link>

                    {/* BOTÓN MÓVIL */}
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                        aria-controls="navbarNav"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav mx-auto">
                            
                            <li className="nav-item dropdown">
                                <button
                                    className="nav-link dropdown-toggle btn btn-link"
                                    id="navbarDropdown"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    type="button"
                                >
                                    Productos
                                </button>

                                <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                                    <li><Link className="dropdown-item" to="/productos">Todos</Link></li>
                                    <li><Link className="dropdown-item" to="/productos/tortas-cuadradas">Tortas Cuadradas</Link></li>
                                    <li><Link className="dropdown-item" to="/productos/tortas-circulares">Tortas Circulares</Link></li>
                                    <li><Link className="dropdown-item" to="/productos/postres-individuales">Postres Individuales</Link></li>
                                    <li><Link className="dropdown-item" to="/productos/sin-azucar">Productos Sin Azúcar</Link></li>
                                    <li><Link className="dropdown-item" to="/productos/tradicional">Pastelería Tradicional</Link></li>
                                    <li><Link className="dropdown-item" to="/productos/sin-gluten">Productos sin Gluten</Link></li>
                                    <li><Link className="dropdown-item" to="/productos/veganos">Productos Veganos</Link></li>
                                    <li><Link className="dropdown-item" to="/productos/especiales">Tortas Especiales</Link></li>
                                </ul>
                            </li>

                            <li className="nav-item">
                                <Link className="nav-link" to="/nosotros">Nosotros</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/blogs">Blogs</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/contacto">Contacto</Link>
                            </li>
                            {user && isAdminEmail(user.email) ? (
                                <li className="nav-item">
                                    <Link className="nav-link" to="/admin">Admin</Link>
                                </li>
                            ) : null}
                        </ul>

                        <div className="d-flex align-items-center">
                            {user ? <span className="me-2 d-none d-lg-inline">Hola, {user.name}!</span> : null}

                            <div className="nav-item dropdown account-dropdown ms-2">
                                <button
                                    className="nav-link btn btn-link p-0 dropdown-toggle"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <i className="bi bi-person-circle fs-4"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end" id="account-menu">
                                    {user ? (
                                        <>
                                            {isAdminEmail(user.email) ? (
                                                <li><Link className="dropdown-item" to="/admin">Panel de administración</Link></li>
                                            ) : null}
                                            <li><Link className="dropdown-item" to="/perfil">Mi perfil</Link></li>
                                            <li><button className="dropdown-item" onClick={() => setConfirmLogoutOpen(true)}>Cerrar sesión</button></li>
                                        </>
                                    ) : (
                                        <>
                                            <li><button className="dropdown-item" onClick={() => setShowLogin(true)}>Iniciar sesión</button></li>
                                            <li><Link className="dropdown-item" to="/registro">Registrarse</Link></li>
                                        </>
                                    )}
                                </ul>
                            </div>

                            <CartBadge />
                        </div>
                    </div>
                </div>
            </nav>
            <Modal
                show={showLogin}
                title="Iniciar sesión"
                onClose={() => setShowLogin(false)}
                hideFooter
                id="loginModal"
                labelledBy="loginTitle"
                contentClassName="border-0 shadow-lg rounded-4"
            >
                <form onSubmit={handleLoginSubmit} noValidate>
                    <FormField id="loginEmail" label="Correo" feedback="Ingresa un correo válido." className="mb-1">
                        <input
                            id="loginEmail"
                            type="email"
                            className="form-control"
                            placeholder="tu@correo.com"
                            value={loginEmail}
                            onChange={(event) => setLoginEmail(event.target.value)}
                            required
                        />
                    </FormField>

                    <FormField id="loginPass" label="Contraseña" feedback="La contraseña es obligatoria." className="mb-2">
                        <input
                            id="loginPass"
                            type="password"
                            className="form-control"
                            placeholder="********"
                            value={loginPassword}
                            onChange={(event) => setLoginPassword(event.target.value)}
                            required
                        />
                    </FormField>

                    {loginError ? <div className="alert alert-danger p-1">{loginError}</div> : null}

                    <div className="d-flex justify-content-end align-items-center mb-3">
                        <a href="#" className="small">¿Olvidaste tu contraseña?</a>
                    </div>

                    <button type="submit" className="btn btn-primary w-100">Entrar</button>

                    <p className="text-center small mt-3 mb-0">
                        ¿No tienes cuenta? <a href="/registro">Regístrate</a>
                    </p>
                </form>
            </Modal>
            <Modal
                show={confirmLogoutOpen}
                title="Cerrar sesión"
                onClose={() => setConfirmLogoutOpen(false)}
                onConfirm={() => {
                    logout();
                    navigate('/');
                    setConfirmLogoutOpen(false);
                }}
                confirmLabel="Sí, cerrar"
                cancelLabel="Cancelar"
            >
                <p className="mb-0">¿Deseas cerrar tu sesión actual?</p>
            </Modal>
        </header>
    );
};

export default Header;
