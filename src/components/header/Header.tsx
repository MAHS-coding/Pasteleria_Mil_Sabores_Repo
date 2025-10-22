import React from "react";
import { Link } from "react-router-dom";
import "./Header.css"; // Importa los estilos específicos para el encabezado

export function Header () {
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
                        </ul>

                        <div className="d-flex align-items-center">
                            <span className="me-2 d-none d-lg-inline">Hola, Matías!</span>

                            <div className="nav-item dropdown account-dropdown ms-2">
                                <button
                                    className="nav-link btn btn-link p-0"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <i className="bi bi-person-circle fs-4"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end" id="account-menu">
                                    <li><Link className="dropdown-item" to="/perfil">Mi perfil</Link></li>
                                    <li><Link className="dropdown-item" to="/logout">Cerrar sesión</Link></li>
                                </ul>
                            </div>

                            <Link to="/carrito" className="nav-link ms-3 position-relative" style={{ marginRight: "16px" }}>
                                <i className="bi bi-cart fs-4"></i>
                                <span id="cart-count" className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none">0</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
};
export default Header;