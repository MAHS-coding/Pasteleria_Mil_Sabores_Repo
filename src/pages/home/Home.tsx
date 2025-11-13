import React from "react";
import ParallaxHero from "../../components/parallaxHero/ParallaxHero";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isAdminEmail } from "../../utils/roles";
import "./Home.css";
import { getRatings } from "../../utils/ratings";
import { products as seedProducts } from "../../utils/dataLoaders";
import usersData from "../../data/users/users.json";

const Testimonials: React.FC = () => {
  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    try {
      const all: any[] = [];
      for (const p of (seedProducts || [])) {
        const rs = getRatings(p.code);
        for (const r of rs) {
          if (r && r.stars === 5) {
            all.push({ ...r, productCode: p.code });
          }
        }
      }
      // shuffle
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      setItems(all.slice(0, 3));
    } catch (e) {
      // ignore
    }
  }, []);

  if (!items || items.length === 0) return <div className="row g-4"><div className="col-12 text-center text-muted">Aún no hay reseñas destacadas.</div></div>;

  return (
    <div className="row g-4">
      {items.map((r, idx) => (
        <div className="col-lg-4" key={idx}>
          <div className="bg-white p-4 rounded-3 shadow-sm h-100 border-0 d-flex flex-column">
            <div className="text-warning mb-3">★★★★★</div>
            <p className="text-muted mb-4 lh-lg">"{r.comment}"</p>
            <div className="d-flex align-items-center mt-auto">
              {(() => {
                const users = (usersData as any[]) || [];

                // Helpers
                const takeFirst = (s?: string) => (s || '').trim().split(/\s+/).filter(Boolean)[0] || '';
                const splitLocal = (local: string) => String(local || '').split(/[._\-]/).filter(Boolean);

                // Try to find a user by exact email
                const found = users.find(u => String(u.correo).toLowerCase() === String(r.userEmail).toLowerCase());

                let firstName = '';
                let firstSurname = '';

                if (found) {
                  firstName = takeFirst(found.nombre);
                  firstSurname = takeFirst(found.apellidos);
                } else if (r.userName) {
                  // userName may contain full name or a local-part; try space split first
                  const nameTokens = String(r.userName).trim().split(/\s+/).filter(Boolean);
                  if (nameTokens.length >= 2) {
                    firstName = nameTokens[0];
                    firstSurname = nameTokens[1];
                  } else {
                    // try splitting by common separators (for local-part like 'claudia.fernandez')
                    const local = String(r.userName).split('@')[0];
                    const parts = splitLocal(local);
                    if (parts.length >= 2) {
                      firstName = parts[0];
                      firstSurname = parts[1];
                    } else {
                      firstName = parts[0] || nameTokens[0] || '';
                    }
                  }
                } else if (r.userEmail) {
                  // fallback: use email local-part
                  const local = String(r.userEmail).split('@')[0];
                  const parts = splitLocal(local);
                  if (parts.length >= 2) {
                    firstName = parts[0];
                    firstSurname = parts[1];
                  } else {
                    firstName = parts[0] || '';
                  }
                }

                // If surname missing, try additional fallbacks: match by email local-part or use tokens from other fields
                if (!firstSurname) {
                  try {
                    if (r.userEmail) {
                      const local = String(r.userEmail).split('@')[0].toLowerCase();
                      const byLocal = users.find(u => String(u.correo).toLowerCase().startsWith(local));
                      if (byLocal) firstSurname = takeFirst(byLocal.apellidos) || firstSurname;
                    }
                    // sometimes surname might be present in the nombre field (bad data) — take its second token
                    if (!firstSurname && found) {
                      const nombreTokens = String(found.nombre || '').trim().split(/\s+/).filter(Boolean);
                      if (nombreTokens.length >= 2) firstSurname = nombreTokens[1];
                    }
                    // try r.userName second token or local-part separators
                    if (!firstSurname && r.userName) {
                      const nameTokens = String(r.userName).trim().split(/\s+/).filter(Boolean);
                      if (nameTokens.length >= 2) firstSurname = nameTokens[1];
                      else {
                        const parts = splitLocal(String(r.userName).split('@')[0]);
                        if (parts.length >= 2) firstSurname = parts[1];
                      }
                    }
                  } catch (e) {
                    // ignore fallback errors
                  }
                }

                const displayName = (firstName + (firstSurname ? ' ' + firstSurname : '')).trim();

                // initials: first letter of firstName + first letter of firstSurname (or second letter of firstName as fallback)
                const initials = ((firstName[0] || '') + (firstSurname[0] || firstName[1] || '')).toUpperCase();

                return (
                  <>
                    <div className="bg-success rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold" style={{ width: '45px', height: '45px' }}>{initials}</div>
                    <div className="ms-3"><h6 className="mb-0 fw-semibold">{displayName || (r.userName || r.userEmail || '')}</h6></div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Home: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = isAdminEmail(user?.email);

    return (
        <main className="home flex-grow-1">
            <ParallaxHero image="/images/background/fondo.jpg" arrowToId="presentacion">
                <h1 className="display-5 fw-bold titulo-home">Postres y momentos dulces</h1>
                <p className="lead subtitulo-home">Sabores que celebran cada ocasión</p>
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
                                    className="img-fluid rounded-3 shadow-lg embedded-video w-100"
                                    src="/videos/home/video_section.mp4"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    aria-label="Video de productos"
                                />
                                <div className="position-absolute top-0 start-0 w-100 h-100 bg-success bg-opacity-10 rounded-3"></div>
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
                            <div className="display-4 fw-bold text-success mb-2">50+</div>
                            <h5 className="fw-semibold mb-2">Años de Experiencia</h5>
                            <p className="text-muted small">Sabores que perduran</p>
                        </div>
                        <div className="col-lg-4 col-md-6 text-center">
                            <div className="display-4 fw-bold text-success mb-2">5000+</div>
                            <h5 className="fw-semibold mb-2">Clientes felices</h5>
                            <p className="text-muted small">Recomendaciones reales</p>
                        </div>
                        <div className="col-lg-4 col-md-6 text-center">
                            <div className="display-4 fw-bold text-success mb-2">100%</div>
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
                                                <Link to="/productos" className="btn btn-success btn-lg px-5 py-3 rounded-3"><i className="bi bi-basket me-2"></i> Ver Productos</Link>
                                            </>
                                        ) : (
                                            <>
                                                <Link to="/productos" className="btn btn-success btn-lg px-5 py-3 rounded-3"><i className="bi bi-basket me-2"></i> Ver Productos</Link>
                                                <Link to="/perfil" className="btn btn-outline-success btn-lg px-5 py-3 rounded-3"><i className="bi bi-person me-2"></i> Mi Perfil</Link>
                                            </>
                                        )
                                    ) : (
                                        <>
                                            <Link to="/productos" className="btn btn-success btn-lg px-5 py-3 rounded-3"><i className="bi bi-basket me-2"></i> Hacer mi Primer Pedido</Link>
                                            <Link to="/registro" className="btn btn-outline-success btn-lg px-5 py-3 rounded-3"><i className="bi bi-person-plus me-2"></i> Crear Cuenta</Link>
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
