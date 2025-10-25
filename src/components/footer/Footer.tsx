import React from "react";
import "./Footer.css"; // Importa los estilos específicos del footer

// Componente funcional Footer (define el pie de página del sitio)
const Footer: React.FC = () => {
    // Obtiene el año actual dinámicamente para mostrarlo en el copyright
    const year = new Date().getFullYear();

    return (
        // Contenedor principal del footer con clases de Bootstrap y personalizadas
        <footer className="site-footer mt-auto">
            <div className="container py-4">
                {/* --- Sección superior: columnas principales --- */}
                <div className="row gy-4 align-items-start">
                    
                    {/* Columna 1: Logo y redes sociales */}
                    <div className="col-12 col-md-3">
                        <a
                            className="navbar-brand mb-2 d-inline-flex align-items-center"
                            href="/"
                        >
                            {/* Logo principal */}
                            <img
                                src="/images/logos/logo_titulo.png"
                                alt="Pastelería Mil Sabores"
                                height={44}
                                className="footer-logo"
                            />
                        </a>

                        {/* Enlaces a redes sociales */}
                        <div className="d-flex align-items-center gap-2 mt-2">
                            <span>Síguenos en:</span>
                            <div className="d-flex gap-3 social-icons">
                                <a href="#" aria-label="WhatsApp">
                                    <i className="bi bi-whatsapp"></i>
                                </a>
                                <a href="#" aria-label="Instagram">
                                    <i className="bi bi-instagram"></i>
                                </a>
                                <a href="#" aria-label="Facebook">
                                    <i className="bi bi-facebook"></i>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Columna 2: Enlaces de Pastelería */}
                    <div className="col-6 col-md-2">
                        <div className="footer-col-title">PASTELERÍA</div>
                        <ul className="list-unstyled footer-links">
                            <li><a href="#">Nosotros</a></li>
                            <li><a href="#">Blog</a></li>
                            <li><a href="#">Catálogo</a></li>
                            <li><a href="#">Recetas</a></li>
                        </ul>
                    </div>

                    {/* Columna 3: Enlaces de Ayuda */}
                    <div className="col-6 col-md-2">
                        <div className="footer-col-title">AYUDA</div>
                        <ul className="list-unstyled footer-links">
                            <li><a href="#">Contacto</a></li>
                            <li><a href="#">Mis pedidos</a></li>
                        </ul>
                    </div>

                    {/* Columna 4: Enlaces de Menú */}
                    <div className="col-6 col-md-2">
                        <div className="footer-col-title">MENÚ</div>
                        <ul className="list-unstyled footer-links">
                            <li><a href="#">Tortas Cuadradas</a></li>
                            <li><a href="#">Tortas Circulares</a></li>
                            <li><a href="#">Postres Individuales</a></li>
                            <li><a href="#">Sin Azúcar</a></li>
                            <li><a href="#">Sin Gluten</a></li>
                        </ul>
                    </div>

                    {/* Columna 5: Enlaces legales */}
                    <div className="col-6 col-md-3">
                        <div className="footer-col-title">LEGAL</div>
                        <ul className="list-unstyled footer-links">
                            <li><a href="#">Términos y Condiciones</a></li>
                            <li><a href="#">Política de Privacidad</a></li>
                        </ul>
                    </div>
                </div>

                {/* Línea divisoria entre secciones */}
                <hr className="my-4" />

                {/* --- Sección inferior: derechos y enlaces legales --- */}
                <div className="d-flex flex-column flex-md-row justify-content-between small text-secondary">
                    <div>
                        © {year} Pastelería Mil Sabores. Todos los derechos reservados.
                    </div>
                    <div className="d-flex gap-3">
                        <a href="#" className="text-decoration-none text-secondary">
                            Términos
                        </a>
                        <a href="#" className="text-decoration-none text-secondary">
                            Privacidad
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Exporta el componente para ser utilizado en App.tsx u otras vistas
export default Footer;
