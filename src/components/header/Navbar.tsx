import { Link, useNavigate } from "react-router-dom";
import "./Header.css"; // reuse header styles
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import FormField from "../ui/FormField";
import { readUsers } from "../../utils/registro";
import { isAdminEmail } from "../../utils/roles";
import { sha256Hex } from "../../utils/hash";



const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const handler = () => setShowLogin(true);
    window.addEventListener('open-login', handler as EventListener);
    return () => window.removeEventListener('open-login', handler as EventListener);
  }, []);

  useEffect(() => {
    if (showLogin) {
      setLoginEmail("");
      setLoginPassword("");
      setLoginError("");
    }
  }, [showLogin]);

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const users = readUsers();
      const hashed = await sha256Hex(loginPassword);
      const found = users.find(
        (candidate) =>
          String(candidate.email).toLowerCase() === String(loginEmail).toLowerCase() &&
          candidate.password === hashed
      );
      if (!found) {
        setLoginError("Usuario o contraseña incorrectos.");
        return;
      }
      login({ name: found.name || "Usuario", email: found.email });
      setShowLogin(false);
      navigate("/");
    } catch (err) {
      setLoginError("Ocurrió un problema al iniciar sesión.");
    }
  }

  // Cierra el collapse del navbar (si está abierto). Usa la API de Bootstrap si
  // existe, o hace un fallback quitando la clase 'show'.
  const closeCollapse = () => {
    const collapseEl = document.getElementById('navbarNav');
    if (!collapseEl) return;
    if (!collapseEl.classList.contains('show')) return;
    const bs = (window as any).bootstrap;
    try {
      if (bs && bs.Collapse) {
        const inst = bs.Collapse.getInstance(collapseEl) || new bs.Collapse(collapseEl, { toggle: false });
        inst.hide();
        return;
      }
    } catch (err) {
      // ignore and fallback
    }
    // Fallback simple
    collapseEl.classList.remove('show');
    collapseEl.style.height = '0px';
  };

  const handleNavClick = () => {
    // close immediately so menu doesn't overlay the new page
    closeCollapse();
  };

  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container">
          <Link to="/" className="navbar-brand d-flex align-items-center">
            <img src="/images/logos/logo_titulo.png" alt="Pastelería Mil Sabores" height={32} className="me-2" />
          </Link>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-lg-center">
              <li className="nav-item">
                <Link to="/" onClick={handleNavClick} className="nav-link"><i className="bi bi-house me-1"></i>Inicio</Link>
              </li>
              <li className="nav-item">
                <Link to="/productos" onClick={handleNavClick} className="nav-link"><i className="bi bi-shop me-1"></i>Catálogo</Link>
              </li>
              <li className="nav-item">
                <Link to="/nosotros" onClick={handleNavClick} className="nav-link"><i className="bi bi-info-circle me-1"></i>Nosotros</Link>
              </li>
              <li className="nav-item">
                <Link to="/blogs" onClick={handleNavClick} className="nav-link"><i className="bi bi-journal-text me-1"></i>Blog</Link>
              </li>

              {user ? (
                <>
                  <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
                      <i className="bi bi-person-circle me-1"></i>
                      {user.name || (user as any).nombre}
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <Link to="/perfil" onClick={handleNavClick} className="dropdown-item"><i className="bi bi-person-circle me-2"></i>Mi Perfil</Link>
                      </li>
                      {isAdminEmail(user.email) ? (
                        <li>
                          <Link to="/admin" onClick={handleNavClick} className="dropdown-item"><i className="bi bi-speedometer2 me-2"></i>Dashboard</Link>
                        </li>
                      ) : null}
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button onClick={() => { closeCollapse(); logout(); navigate('/'); }} className="dropdown-item text-danger"><i className="bi bi-box-arrow-right me-2"></i>Cerrar Sesión</button>
                      </li>
                    </ul>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <button className="nav-link btn btn-link" onClick={() => { handleNavClick(); setShowLogin(true); }}><i className="bi bi-box-arrow-in-right me-1"></i>Iniciar Sesión</button>
                  </li>
                  <li className="nav-item">
                    <Link to="/registro" onClick={handleNavClick} className="btn btn-success"><i className="bi bi-person-plus me-1"></i>Registrarse</Link>
                  </li>
                </>
              )}

            </ul>
          </div>

          
        </div>
      </nav>

      <Modal show={showLogin} title="Iniciar sesión" onClose={() => setShowLogin(false)} hideFooter id="loginModal" labelledBy="loginTitle" contentClassName="border-0 shadow-lg rounded-4">
        <form onSubmit={handleLoginSubmit} noValidate>
          <FormField id="loginEmail" label="Correo" feedback="Ingresa un correo válido." className="mb-1">
            <input id="loginEmail" type="email" className="form-control" placeholder="tu@correo.com" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} required />
          </FormField>

          <FormField id="loginPass" label="Contraseña" feedback="La contraseña es obligatoria." className="mb-2">
            <input id="loginPass" type="password" className="form-control" placeholder="********" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required />
          </FormField>

          {loginError ? <div className="alert alert-danger p-1">{loginError}</div> : null}

          <div className="d-flex justify-content-end align-items-center mb-3"><a href="#" className="small">¿Olvidaste tu contraseña?</a></div>

          <button type="submit" className="btn btn-primary w-100">Entrar</button>

          <p className="text-center small mt-3 mb-0">¿No tienes cuenta? <a href="/registro">Regístrate</a></p>
        </form>
      </Modal>

      <Modal show={confirmLogoutOpen} title="Cerrar sesión" onClose={() => setConfirmLogoutOpen(false)} onConfirm={() => { logout(); navigate('/'); setConfirmLogoutOpen(false); }} confirmLabel="Sí, cerrar" cancelLabel="Cancelar">
        <p className="mb-0">¿Deseas cerrar tu sesión actual?</p>
      </Modal>
    </header>
  );
};

export default Navbar;
