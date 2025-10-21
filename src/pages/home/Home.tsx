import React from "react";
import ParallaxHero from "../../components/parallaxHero/ParallaxHero";
import "./Home.css";

const Home: React.FC = () => {
    return (
        <main className="home flex-grow-1">
            {/* HERO con ParallaxHero (sin clases parallax-1/2/etc.) */}
            <ParallaxHero image="/images/background/fondo.jpg" arrowToId="frescura">
                <h1 className="display-5 fw-bold titulo-home">Postres y momentos dulces</h1>
                <p className="lead subtitulo-home">Sabores que celebran cada ocasión</p>
            </ParallaxHero>

            {/* MENSAJE CENTRAL */}
            <h2 className="m-5 text-center anchor-offset" id="frescura">
                En Pastelería Mil Sabores todo es frescura y calidad
            </h2>

            {/* PRODUCTOS DESTACADOS */}
            <section className="container my-4">
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
                    <div className="col">
                        <article className="card h-100 producto-destacado">
                            <img
                                src="/images/products/tortas/tradicional/torta-cuadrada-chocolate.png"
                                className="card-img-top"
                                alt="Torta Cuadrada de Chocolate"
                                loading="lazy"
                            />
                            <div className="card-body d-flex flex-column text-center">
                                <h5 className="card-title">Torta Cuadrada de Chocolate</h5>
                                <p className="card-text">Tortas cuadradas</p>
                            </div>
                        </article>
                    </div>

                    <div className="col">
                        <article className="card h-100 producto-destacado">
                            <img
                                src="/images/products/tiramisu/tradicional/tiramisu.jpg"
                                className="card-img-top"
                                alt="Tiramisú Clásico"
                                loading="lazy"
                            />
                            <div className="card-body d-flex flex-column text-center">
                                <h5 className="card-title">Tiramisú Clásico</h5>
                                <p className="card-text">Postres individuales</p>
                            </div>
                        </article>
                    </div>

                    <div className="col">
                        <article className="card h-100 producto-destacado">
                            <img
                                src="/images/products/brownie/sin-gluten/brownie-sin-gluten.jpg"
                                className="card-img-top"
                                alt="Brownie Sin Gluten"
                                loading="lazy"
                            />
                            <div className="card-body d-flex flex-column text-center">
                                <h5 className="card-title">Brownie Sin Gluten</h5>
                                <p className="card-text">Productos Sin Gluten</p>
                            </div>
                        </article>
                    </div>

                    <div className="col">
                        <article className="card h-100 producto-destacado">
                            <img
                                src="/images/products/cheesecake/sin-azucar/cheesecake-sin-azucar.avif"
                                className="card-img-top"
                                alt="Cheesecake Sin Azúcar"
                                loading="lazy"
                            />
                            <div className="card-body d-flex flex-column text-center">
                                <h5 className="card-title">Cheesecake Sin Azúcar</h5>
                                <p className="card-text">Productos sin azúcar</p>
                            </div>
                        </article>
                    </div>
                </div>
            </section>

            {/* VIDEO HERO */}
            <section className="video-hero" aria-label="Sección de video destacado">
                <video
                    className="video-hero-media"
                    autoPlay
                    muted
                    loop
                    playsInline
                    src="/videos/home/video_section.mp4"
                />
                <div className="video-hero-caption">
                    <h2>Comienza tu día con</h2>
                    <h1>Dulzura</h1>
                </div>
            </section>
        </main>
    );
};

export default Home;
