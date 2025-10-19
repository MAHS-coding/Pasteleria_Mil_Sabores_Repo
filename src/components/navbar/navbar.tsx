// src/components/navbar/navbar.tsx
import React from 'react';
import './navbar.css';

const Navbar: React.FC = () => {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <img src="/images/logos/logo-principal.png" alt="Logo Pastelería Mil Sabores" />
                <h2>Pastelería Mil Sabores</h2>
            </div>
            <ul className="navbar-links">
                <li><a href="/">Inicio</a></li>
                <li><a href="/productos">Productos</a></li>
                <li><a href="/nosotros">Nosotros</a></li>
                <li><a href="/blog">Blog</a></li>
            </ul>
        </nav>
    );
};

export default Navbar;
