import React from "react";
import "./ParallaxHero.css";

type ParallaxHeroProps = {
    /** Ruta desde /public (ej: /images/background/fondo.jpg) */
    image: string;
    /** Alto del hero (por defecto: 100vh - navbar) */
    height?: string;
    /** Mostrar flecha de scroll y a qué id baja */
    arrowToId?: string;
    /** Contenido centrado dentro del hero (títulos, párrafos, botones) */
    children?: React.ReactNode;
};

const ParallaxHero: React.FC<ParallaxHeroProps> = ({ image, height, arrowToId, children }) => {
    return (
        <section
            className="parallax-hero"
            style={{
                backgroundImage: `url("${image}")`,
                height: height || `calc(100vh - var(--nav-h))`,
            }}
            role="img"
            aria-label="Sección destacada"
        >
            <div className="hero-content container text-center text-white">
                {children}
            </div>

            {arrowToId && (
                <a href={`#${arrowToId}`} className="scroll-down-arrow" aria-label="Bajar">
                    <i className="bi bi-chevron-down" />
                </a>
            )}
        </section>
    );
};

export default ParallaxHero;
