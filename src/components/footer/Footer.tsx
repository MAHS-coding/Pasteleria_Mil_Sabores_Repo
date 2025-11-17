import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { scrollToTop } from "../../utils/scroll";
import styles from "./Footer.module.css"; // Importa estilos del footer como módulo

// Componente funcional Footer (define el pie de página del sitio)
const Footer: React.FC = () => {
    // Obtiene el año actual dinámicamente para mostrarlo en el copyright
    const year = new Date().getFullYear();
    const { user } = useAuth();

    // usa el helper compartido
    

    return (
        // Contenedor principal del footer con clases de Bootstrap y personalizadas
    <footer className={`${styles['site-footer']} mt-auto`}> 
            <div className="container py-4">
                {/* --- Sección superior: columnas principales --- */}
                <div className="row gy-4 align-items-start">
                    
                    {/* Columna 1: Logo y redes sociales */}
                    <div className="col-12 col-md-3">
                        <Link to="/" onClick={scrollToTop} className="navbar-brand mb-2 d-inline-flex align-items-center">
                            {/* Logo principal */}
                            <img
                                src="/images/logos/logo_titulo.png"
                                alt="Pastelería Mil Sabores"
                                height={44}
                                className={styles['footer-logo']}
                            />
                        </Link>

                        {/* Enlaces a redes sociales */}
                        <div className="d-flex align-items-center gap-2 mt-2">
                            <span>Síguenos en:</span>
                            <div className={`d-flex gap-3 ${styles['social-icons']}`}>
                                <a href="https://wa.me/56900000000" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                                    <i className="bi bi-whatsapp"></i>
                                </a>
                                <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                    <i className="bi bi-instagram"></i>
                                </a>
                                <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                    <i className="bi bi-facebook"></i>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Columna 2: Enlaces de Pastelería */}
                    <div className="col-6 col-md-2">
                        <div className={styles['footer-col-title']}>PASTELERÍA</div>
                        <ul className={`list-unstyled ${styles['footer-links']}`}>
                            <li><Link to="/nosotros" onClick={scrollToTop}>Nosotros</Link></li>
                            <li><Link to="/blogs" onClick={scrollToTop}>Blog</Link></li>
                            <li><Link to="/productos" onClick={scrollToTop}>Catálogo</Link></li>
                        </ul>
                    </div>

                    {/* Columna 3: Enlaces de Ayuda */}
                    <div className="col-6 col-md-2">
                        <div className={styles['footer-col-title']}>AYUDA</div>
                            <ul className={`list-unstyled ${styles['footer-links']}`}>
                            <li><Link to="/contacto" onClick={scrollToTop}>Contacto</Link></li>
                            {user && (
                                <li><Link to="/perfil" onClick={scrollToTop}>Mis pedidos</Link></li>
                            )}
                        </ul>
                    </div>

                    {/* Columna 4: Enlaces de Menú */}
                    <div className="col-6 col-md-2">
                        <div className={styles['footer-col-title']}>MENÚ</div>
                        <ul className={`list-unstyled ${styles['footer-links']}`}>
                            <li><Link to="/productos/tortas-cuadradas" onClick={scrollToTop}>Tortas Cuadradas</Link></li>
                            <li><Link to="/productos/tortas-circulares" onClick={scrollToTop}>Tortas Circulares</Link></li>
                            <li><Link to="/productos/postres-individuales" onClick={scrollToTop}>Postres Individuales</Link></li>
                            <li><Link to="/productos/sin-azucar" onClick={scrollToTop}>Sin Azúcar</Link></li>
                            <li><Link to="/productos/sin-gluten" onClick={scrollToTop}>Sin Gluten</Link></li>
                        </ul>
                    </div>

                    {/* Columna 5: Enlaces legales */}
                    <div className="col-6 col-md-3">
                        <div className={styles['footer-col-title']}>LEGAL</div>
                        <ul className={`list-unstyled ${styles['footer-links']}`}>
                            <li><Link to="/terminos" onClick={scrollToTop}>Términos y Condiciones</Link></li>
                            <li><Link to="/privacidad" onClick={scrollToTop}>Política de Privacidad</Link></li>
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
                        <Link to="/terminos" onClick={scrollToTop} className="text-decoration-none text-secondary">Términos</Link>
                        <Link to="/privacidad" onClick={scrollToTop} className="text-decoration-none text-secondary">Privacidad</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Exporta el componente para ser utilizado en App.tsx u otras vistas
export default Footer;
