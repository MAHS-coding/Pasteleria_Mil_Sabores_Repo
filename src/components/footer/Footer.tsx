// src/components/footer/footer.tsx
import React from 'react';
import './footer.css';

const Footer: React.FC = () => {
    return (
        <footer className="footer">
            <div className="footer-container">

                {/* Logo + descripción */}
                <div className="footer-section about">
                    <img
                        src="/images/logos/logo-principal.png"
                        alt="Logo Pastelería Mil Sabores"
                        className="footer-logo"
                    />
                    <p>
                        En <strong>Pastelería Mil Sabores</strong> elaboramos postres, tortas y dulces
                        con amor, tradición y los mejores ingredientes 🍰.
                    </p>
                </div>

                {/* Enlaces rápidos */}
                <div className="footer-section links">
                    <h3>Enlaces</h3>
                    <ul>
                        <li><a href="/">Inicio</a></li>
                        <li><a href="/productos">Productos</a></li>
                        <li><a href="/nosotros">Nosotros</a></li>
                        <li><a href="/blog">Blog</a></li>
                    </ul>
                </div>

                {/* Contacto */}
                <div className="footer-section contact">
                    <h3>Contacto</h3>
                    <p>📍 Concepción, Chile</p>
                    <p>📞 +56 9 1234 5678</p>
                    <p>📧 contacto@milsabores.cl</p>

                    <div className="socials">
                        <a href="https://www.facebook.com" target="_blank">Facebook</a>
                        <a href="https://www.instagram.com" target="_blank">Instagram</a>
                        <a href="https://wa.me/56912345678" target="_blank">WhatsApp</a>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="footer-bottom">
                <p>© {new Date().getFullYear()} Pastelería Mil Sabores. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;
