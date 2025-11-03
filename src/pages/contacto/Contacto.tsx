import React, { useState, useEffect } from 'react';
import './Contacto.css';
import ParallaxHero from "../../components/parallaxHero/ParallaxHero";


const Contacto: React.FC = () => {
    const [mensaje, setMensaje] = useState('');
    const [contador, setContador] = useState(0);

    useEffect(() => {
        const palabras = mensaje.trim().split(/\s+/).filter(Boolean);
        setContador(palabras.length);
    }, [mensaje]);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        if (contador > 100) {
            e.preventDefault();
            alert('El mensaje no puede tener más de 100 palabras.');
        }
    }

    return (
        <main>
            <ParallaxHero image="/images/background/fondo.jpg" arrowToId="frescura">
                <h1 className="display-5 fw-bold titulo-home">Postres y momentos dulces</h1>
                <p className="lead subtitulo-home">Sabores que celebran cada ocasión</p>
            </ParallaxHero>

            <h2 className="m-5 text-center anchor-offset" id="frescura">
                En Pastelería Mil Sabores todo es frescura y calidad
            </h2>

            <section className="container my-5">
                <div className="row g-4 align-items-stretch">
                    <div className="col-lg-5">
                        <div className="contact-card h-100 p-4">
                            <h2 className="h4 mb-3">Contáctanos</h2>
                            <p className="mb-4">La forma más rápida: escríbenos por WhatsApp y cuéntanos qué necesitas.</p>

                            <a className="btn btn-success btn-lg w-100 mb-3"
                                href="https://wa.me/56912345678?text=Hola%20Pasteler%C3%ADa%20Mil%20Sabores%2C%20quiero%20hacer%20un%20pedido%20%F0%9F%8D%B0"
                                target="_blank" rel="noopener noreferrer">
                                <i className="bi bi-whatsapp me-2" /> Pedir por WhatsApp
                            </a>

                            <ul className="list-unstyled small mb-4">
                                <li className="mb-2"><i className="bi bi-envelope me-2" />pasteleriamilsabores.fm@gmail.com</li>
                                <li className="mb-2"><i className="bi bi-geo-alt me-2" />Paicaví 3280, Concepción, Bío Bío</li>
                                <li className="mb-2"><i className="bi bi-clock me-2" />Lun–Sáb 09:00–19:00</li>
                            </ul>

                            <div className="social-row d-flex gap-3">
                                <a href="#" className="btn-social" aria-label="Instagram"><i className="bi bi-instagram" /></a>
                                <a href="#" className="btn-social" aria-label="Facebook"><i className="bi bi-facebook" /></a>
                                <a href="#" className="btn-social" aria-label="WhatsApp"><i className="bi bi-whatsapp" /></a>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-7">
                        <div className="contact-card h-100 p-4">
                            <h2 className="h4 mb-3">¿Prefieres dejarnos un mensaje?</h2>

                            <form id="contactoForm" className="needs-validation" noValidate
                                action="https://formsubmit.co/pasteleriamilsabores.fm@gmail.com" method="POST"
                                onSubmit={handleSubmit}>

                                <input type="hidden" name="_subject" value="Nuevo mensaje desde Contacto | Pastelería Mil Sabores" />
                                <input type="hidden" name="_template" value="table" />
                                <input type="hidden" name="_captcha" value="false" />
                                <input type="hidden" name="_next" value="/agradecimiento" />
                                <input type="text" name="_honey" style={{ display: 'none' }} />

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label htmlFor="nombre" className="form-label">Nombre</label>
                                        <input type="text" id="nombre" name="Nombre" className="form-control" placeholder="Tu nombre" required minLength={2} aria-describedby="ayudaNombre" />
                                        <div id="ayudaNombre" className="form-text">Escribe tu nombre y apellido si deseas.</div>
                                        <div className="invalid-feedback">Ingresa tu nombre (mínimo 2 caracteres).</div>
                                    </div>

                                    <div className="col-md-6">
                                        <label htmlFor="correo" className="form-label">Correo</label>
                                        <input type="email" id="correo" name="Correo" className="form-control" placeholder="tucorreo@mail.com" inputMode="email" autoComplete="email" required aria-describedby="ayudaCorreo" />
                                        <div id="ayudaCorreo" className="form-text">Usa un correo válido (ej: nombre@dominio.com).</div>
                                        <div className="invalid-feedback">El formato del correo no es válido.</div>
                                    </div>

                                    <div className="col-12">
                                        <label htmlFor="mensaje" className="form-label">Mensaje</label>
                                        <textarea id="mensaje" name="Mensaje" className="form-control" rows={4}
                                            placeholder="Cuéntanos tu consulta o pedido..." required aria-describedby="contadorPalabras ayudaMensaje"
                                            value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
                                        <div id="contadorPalabras" className="form-text mt-1">{contador}/100 palabras</div>
                                        <div id="ayudaMensaje" className="form-text">Máximo 100 palabras.</div>
                                        <div className="invalid-feedback">Tu mensaje es obligatorio (máx. 100 palabras).</div>
                                    </div>

                                    <p className="form-text mt-2">También puedes escribirnos directo al WhatsApp usando el botón verde.</p>

                                    <div className="col-12 d-grid">
                                        <button type="submit" className="btn btn-primary">Enviar</button>
                                    </div>
                                </div>
                            </form>

                        </div>
                    </div>

                </div>
            </section>

            <section className="container mb-5">
                <div className="contact-card p-2">
                    <iframe className="w-100 map-iframe" height={360} style={{ border: 0 }} loading="lazy" title="Ubicación" allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src="https://www.google.com/maps?q=Duoc%20UC%20Concepci%C3%B3n&z=16&output=embed" />
                </div>
            </section>
        </main>
    );
};

export default Contacto;
