import React from "react";
import "./Header.css"; // Importa los estilos específicos para el encabezado

// Componente funcional que define el encabezado global (navbar principal)
export function Header () {
    return (
        // "sticky-top" fija la barra superior al hacer scroll
        <header className="sticky-top">
            {/* Navbar principal con diseño expandible en pantallas grandes */}
            <nav className="navbar navbar-expand-lg primary-nav">
                <div className="container">
                    
                    {/* === LOGO === */}
                    <a className="navbar-brand" href="/">
                        <img
                            src="/images/logos/logo_titulo.png"
                            alt="Pastelería Mil Sabores"
                            height={40}
                            className="brand-logo" // Clase para ajustar el tamaño del logo
                        />
                    </a>

                    {/* === BOTÓN DE MENÚ MÓVIL ===
                        Aparece solo en pantallas pequeñas.
                        Bootstrap usa este botón para expandir o colapsar el menú. */}
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

                    {/* === MENÚ DE NAVEGACIÓN === */}
                    <div className="collapse navbar-collapse" id="navbarNav">
                        {/* Enlaces principales centrados (Productos, Nosotros, etc.) */}
                        <ul className="navbar-nav mx-auto">
                            
                            {/* Dropdown de productos con subcategorías */}
                            <li className="nav-item dropdown">
                                <a
                                    className="nav-link dropdown-toggle"
                                    href="#"
                                    id="navbarDropdown"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    Productos
                                </a>

                                {/* Lista desplegable del menú "Productos" */}
                                <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                                    <li><a className="dropdown-item" href="#">Todos</a></li>
                                    <li><a className="dropdown-item" href="#">Tortas Cuadradas</a></li>
                                    <li><a className="dropdown-item" href="#">Tortas Circulares</a></li>
                                    <li><a className="dropdown-item" href="#">Postres Individuales</a></li>
                                    <li><a className="dropdown-item" href="#">Productos Sin Azúcar</a></li>
                                    <li><a className="dropdown-item" href="#">Pastelería Tradicional</a></li>
                                    <li><a className="dropdown-item" href="#">Productos sin Gluten</a></li>
                                    <li><a className="dropdown-item" href="#">Productos Veganos</a></li>
                                    <li><a className="dropdown-item" href="#">Tortas Especiales</a></li>
                                </ul>
                            </li>

                            {/* Enlaces secundarios estáticos */}
                            <li className="nav-item">
                                <a className="nav-link" href="#">Nosotros</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#">Blogs</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#">Contacto</a>
                            </li>
                        </ul>

                        {/* === SECCIÓN DERECHA: ICONOS Y USUARIO === */}
                        <div className="d-flex align-items-center">
                            {/* Saludo visible solo en pantallas grandes */}
                            <span className="me-2 d-none d-lg-inline">Hola, Matías!</span>

                            {/* Dropdown de usuario (perfil / cerrar sesión) */}
                            <div className="nav-item dropdown account-dropdown ms-2">
                                <a
                                    className="nav-link"
                                    href="#"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    {/* Ícono de usuario (Bootstrap Icons) */}
                                    <i className="bi bi-person-circle fs-4"></i>
                                </a>
                                <ul
                                    className="dropdown-menu dropdown-menu-end"
                                    id="account-menu"
                                >
                                    <li><a className="dropdown-item" href="#">Mi perfil</a></li>
                                    <li><a className="dropdown-item" href="#">Cerrar sesión</a></li>
                                </ul>
                            </div>

                            {/* Icono del carrito con contador */}
                            <a
                                href="#"
                                className="nav-link ms-3 position-relative"
                                style={{ marginRight: "16px" }}
                            >
                                <i className="bi bi-cart fs-4"></i>
                                <span
                                    id="cart-count"
                                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none"
                                >
                                    0
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
};

// Exporta el componente para usarlo en App.tsx
export default Header;
