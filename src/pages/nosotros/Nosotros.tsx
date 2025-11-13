import React from 'react';
import ParallaxHero from "../../components/parallaxHero/ParallaxHero";
import './Nosotros.css';

const Nosotros: React.FC = () => {
    return (
        <main className="nosotros-page d-flex flex-column min-vh-100">
            <ParallaxHero image="/images/background/fondo.jpg" arrowToId="frescura">
                <h1 className="display-5 fw-bold titulo-home">Postres y momentos dulces</h1>
                <p className="lead subtitulo-home">Sabores que celebran cada ocasión</p>
            </ParallaxHero>

                        <section id="frescura" className="py-5">
                                <div className="container">
                                    <div className="text-center mb-5">
                                        <h2 className="m-0">En Pastelería Mil Sabores todo es frescura y calidad</h2>
                                    </div>
                                        <div className="row align-items-center g-5">
                                                <div className="col-lg-6 order-lg-2">
                                                        <div className="pe-lg-4">
                                                                <h2 className="h3 mb-4" style={{ color: '#2d3748' }}>
                                                                        Nuestra Historia
                                                                </h2>
                                                                <p className="text-muted mb-4 lh-lg">
                                                                        Pastelería Mil Sabores fue fundada hace más de 20 años y se ha consolidado como un referente en la repostería chilena. En 1995, la
                                                                        pastelería hizo historia al colaborar en la creación de la <strong>torta más grande del mundo</strong>, un evento que la posicionó a nivel internacional.
                                                                </p>

                                                                <p className="text-muted mb-4 lh-lg">
                                                                        Con una misión clara: ofrecer <strong>una experiencia dulce y memorable</strong> a cada cliente, Pastelería Mil Sabores ha mantenido un enfoque en la calidad, la creatividad y la personalización de sus productos. A lo largo de los años, hemos crecido con un compromiso constante hacia la excelencia.
                                                                </p>

                                                                <div className="row g-4">
                                                                    <div className="col-6">
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="me-3">
                                                                                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                                                    <i className="bi bi-egg-fried text-success"></i>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="fw-semibold mb-1">Artesanal</div>
                                                                                <small className="text-muted">Hecho a mano</small>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-6">
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="me-3">
                                                                                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                                                    <i className="bi bi-truck text-success"></i>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="fw-semibold mb-1">Entrega a domicilio</div>
                                                                                <small className="text-muted">Directo a tu mesa</small>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-6">
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="me-3">
                                                                                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                                                    <i className="bi bi-people text-success"></i>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="fw-semibold mb-1">Apoyo local</div>
                                                                                <small className="text-muted">Productores y proveedores</small>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-6">
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="me-3">
                                                                                <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                                                    <i className="bi bi-recycle text-success"></i>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="fw-semibold mb-1">Sostenible</div>
                                                                                <small className="text-muted">Prácticas responsables</small>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                        </div>
                                                </div>
                                                <div className="col-lg-6 order-lg-1">
                                                        <div className="position-relative">
                                                                <img src="/images/nosotros/Tortamasgrande.jpg" alt="Historia de la pastelería" className="img-fluid rounded-3 shadow-lg embedded-video" />
                                                                <div className="position-absolute top-0 start-0 w-100 h-100 bg-success bg-opacity-10 rounded-3"></div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </section>

            <section className="py-5 bg-light">
                <div className="container">
                    <div className="row align-items-center g-5 flex-md-row-reverse">
                        <div className="col-md-6">
                            <img src="/images/nosotros/Fundadora.jpg" alt="María Isabel Pérez" className="img-fluid rounded shadow" />
                        </div>
                        <div className="col-md-6">
                            <h2 className="mb-3">Conoce a Nuestra Fundadora</h2>
                            <p>
                                María Isabel Pérez, fundadora de Pastelería Mil Sabores, comenzó su carrera en el mundo de la repostería desde joven. Con el tiempo, su pasión por la cocina y el deseo de ofrecer lo mejor a sus clientes la llevaron a crear la pastelería que hoy conocemos.
                            </p>
                            <p>
                                Con una visión clara de calidad y un amor por la tradición, María Isabel ha logrado posicionar la pastelería como un referente en la industria, siendo parte activa en su evolución hacia una plataforma online que permita a los clientes acceder a sus productos de manera fácil y segura.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-5 bg-white">
                <div className="container">
                    <div className="row align-items-center g-5">
                        <div className="col-md-6">
                            <img src="/images/nosotros/chefs.jpg" alt="Valores Pastelería Mil Sabores" className="img-fluid rounded shadow" />
                        </div>
                        <div className="col-md-6">
                            <h2 className="mb-3">Nuestros Valores</h2>
                            <ul>
                                <li><strong>Calidad:</strong> Nos comprometemos a ofrecer siempre lo mejor en sabor y presentación, utilizando los mejores ingredientes en cada creación.</li>
                                <li><strong>Creatividad:</strong> Fomentamos la innovación en cada uno de nuestros productos, adaptándonos a las tendencias y necesidades de nuestros clientes.</li>
                                <li><strong>Compromiso:</strong> Estamos comprometidos con nuestros clientes, ofreciendo un servicio excepcional y una experiencia de compra memorable.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Nosotros;
