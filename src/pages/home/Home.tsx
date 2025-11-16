import React from "react";
import ParallaxHero from "../../components/parallaxHero/ParallaxHero";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isAdminEmail } from "../../utils/roles";
import styles from "./Home.module.css";
import Testimonials from "../../components/home/Testimonials";



const Home: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = isAdminEmail(user?.email);

    return (
        <main className="home flex-grow-1">
      <ParallaxHero image="/images/background/fondo.jpg" arrowToId="presentacion">
        <h1 className={`display-5 fw-bold ${styles['titulo-home']}`}>Postres y momentos dulces</h1>
        <p className={`lead ${styles['subtitulo-home']}`}>Sabores que celebran cada ocasión</p>
      </ParallaxHero>

            <section id="presentacion" className="py-5">
                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            <div className="pe-lg-4">
                                <h2 className="h3 mb-4 text-center" style={{ color: '#2d3748' }}>
                                    ¿Qué es Pastelería Mil Sabores?
                                </h2>
                <p className="text-muted mb-4 lh-lg text-center">
                  En Pastelería Mil Sabores elaboramos cada producto con ingredientes seleccionados y recetas artesanales que combinan tradición y modernidad. Nuestro obrador utiliza materias primas de calidad: harinas y mantequillas seleccionadas, chocolates y frutas frescas. Trabajamos con prácticas responsables con el medio ambiente.
                  Ofrecemos opciones personalizadas (tortas a medida, decoraciones y mensajes), alternativas sin azúcar y sin gluten, y un servicio de entrega confiable para particulares y eventos. Nuestro equipo de reposteros cuida la presentación y la textura en cada pieza para que tus celebraciones sean memorables.
                </p>
                            </div>
                        </div>
                    </div>

                    <div className="row mt-4">
                        <div className="col-12">
                <div className="position-relative">
                <video
                  className={`img-fluid rounded-3 shadow-lg ${styles['embedded-video']} w-100`}
                  src="/videos/home/video_section.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-label="Video de productos"
                />
                <div className="position-absolute top-0 start-0 w-100 h-100 rounded-3" style={{ background: 'rgba(var(--accent-main-rgb), 0.08)' }}></div>
              </div>
                        </div>
                    </div>
                </div>
            </section>

      <section className="py-5">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="h3" style={{ color: '#2d3748' }}>
                            Nuestro Impacto
                        </h2>
                        <p className="text-muted">Cifras que reflejan nuestro compromiso</p>
                    </div>
                    <div className="row g-4">
            <div className="col-lg-4 col-md-6 text-center">
              <div className="display-4 fw-bold mb-2" style={{ color: 'var(--accent-main)' }}>50+</div>
              <h5 className="fw-semibold mb-2">Años de Experiencia</h5>
              <p className="text-muted small">Sabores que perduran</p>
            </div>
            <div className="col-lg-4 col-md-6 text-center">
              <div className="display-4 fw-bold mb-2" style={{ color: 'var(--accent-main)' }}>5000+</div>
              <h5 className="fw-semibold mb-2">Clientes felices</h5>
              <p className="text-muted small">Recomendaciones reales</p>
            </div>
            <div className="col-lg-4 col-md-6 text-center">
              <div className="display-4 fw-bold mb-2" style={{ color: 'var(--accent-main)' }}>100%</div>
              <h5 className="fw-semibold mb-2">Ingredientes seleccionados</h5>
              <p className="text-muted small">Calidad garantizada</p>
            </div>
                    </div>
                </div>
            </section>

            {/* Nuestras Ubicaciones section removed per request */}

            <section className="py-5" style={{ backgroundColor: '#fafafa' }}>
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="h3" style={{ color: '#2d3748' }}>Lo que dicen nuestros clientes</h2>
                        <p className="text-muted">Experiencias reales de familias satisfechas</p>
                    </div>
                    <Testimonials />
                </div>
            </section>

            <section className="py-5 my-5">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <div className="text-center">
                                <h2 className="h3 mb-4" style={{ color: '#2d3748' }}>¿Listo para endulzar tu día?</h2>
                                <p className="text-muted mb-5 lh-lg">Únete a miles de clientes que disfrutan de nuestras recetas artesanales.</p>
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  {user ? (
                    isAdmin ? (
                      <>
                        <Link to="/admin" className="btn btn-warning btn-lg px-5 py-3 rounded-3"><i className="bi bi-speedometer2 me-2"></i> Dashboard Admin</Link>
                        <Link to="/productos" className="btn btn-lg px-5 py-3 rounded-3" style={{ background: 'var(--accent-main)', color: '#fff', border: 'none' }}><i className="bi bi-basket me-2"></i> Ver Productos</Link>
                      </>
                    ) : (
                      <>
                        <Link to="/productos" className="btn btn-lg px-5 py-3 rounded-3" style={{ background: 'var(--accent-main)', color: '#fff', border: 'none' }}><i className="bi bi-basket me-2"></i> Ver Productos</Link>
                        <Link to="/perfil" className="btn btn-lg px-5 py-3 rounded-3" style={{ background: 'transparent', border: '1px solid var(--accent-main)', color: 'var(--accent-main)' }}><i className="bi bi-person me-2"></i> Mi Perfil</Link>
                      </>
                    )
                  ) : (
                    <>
                      <Link to="/productos" className="btn btn-lg px-5 py-3 rounded-3" style={{ background: 'var(--accent-main)', color: '#fff', border: 'none' }}><i className="bi bi-basket me-2"></i> Hacer mi Primer Pedido</Link>
                      <Link to="/registro" className="btn btn-lg px-5 py-3 rounded-3" style={{ background: 'transparent', border: '1px solid var(--accent-main)', color: 'var(--accent-main)' }}><i className="bi bi-person-plus me-2"></i> Crear Cuenta</Link>
                    </>
                  )}
                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Home;
