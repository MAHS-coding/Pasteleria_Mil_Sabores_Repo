import React from "react";
import ParallaxHero from "../../components/parallaxHero/ParallaxHero";
import "./Home.css";

const Home: React.FC = () => {
    return (
        <main>
            <ParallaxHero image="/images/background/fondo.jpg">
                <div className="hero-content container text-center text-white">
                    <h1 className="display-5 fw-bold">Postres y momentos dulces</h1>
                    <p className="lead">Sabores que celebran cada ocasión</p>
                </div>
                <a href="#frescura" className="scroll-down-arrow" aria-label="Bajar">
                    <i className="bi bi-chevron-down" />
                </a>
            </ParallaxHero>

            <section id="frescura" className="container py-5">
                <h2 className="text-center mb-4">
                    En Pastelería Mil Sabores todo es frescura y calidad
                </h2>
                {/* aquí tus tarjetas / contenido */}
            </section>
        </main>
    );
};

export default Home;
