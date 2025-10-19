import React from "react";
import "./ParallaxHero.css";

type ParallaxHeroProps = {
    /** Ruta desde /public (ej: /images/background/fondo.jpg) */
    image: string;
    /** Alto; por defecto usa altura de viewport menos la navbar */
    height?: string; // ej: "70vh"
    /** Contenido centrado dentro del hero */
    children?: React.ReactNode;
};

const ParallaxHero: React.FC<ParallaxHeroProps> = ({ image, height, children }) => {
    return (
        <div
            className="parallax"
            style={{
                backgroundImage: `url("${image}")`,
                height: height || `calc(100vh - var(--nav-h))`,
            }}
            role="img"
            aria-label="Sección destacada"
        >
            {children}
        </div>
    );
};

export default ParallaxHero;
