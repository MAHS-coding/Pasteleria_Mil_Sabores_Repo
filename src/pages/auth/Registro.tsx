import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { formatearRun, validarRun, emailDominioValido } from "../../utils/validation";
import { createUser } from "../../utils/registro";
import { sha256Hex } from "../../utils/hash";
import Modal from "../../components/ui/Modal";
import FieldFeedback from "../../components/ui/FieldFeedback";
import FormField from "../../components/ui/FormField";
import styles from "./Registro.module.css";

const Registro: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [run, setRun] = useState("");
    const [name, setName] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [codigo, setCodigo] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    
    // removed single-address field: users can store multiple addresses via the profile addresses flow
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showSuccess, setShowSuccess] = useState(false);

    function clearFieldError(field: string) {
        setErrors(prev => {
            const copy = { ...prev } as Record<string,string>;
            delete copy[field];
            return copy;
        });
    }

    function validate() {
        const e: Record<string, string> = {};
        if (!run.trim()) e.run = "Por favor ingresa tu RUN.";
        else if (!validarRun(run)) e.run = "El RUN ingresado no es válido. Debe tener el dígito verificador correcto.";
        if (!name.trim()) e.name = "Por favor ingresa tu nombre.";
        if (!lastname.trim()) e.lastname = "Por favor ingresa tu apellido.";
        if (!email.trim()) e.email = "Por favor ingresa un correo.";
        else if (String(email).trim().length > 100) e.email = "El correo debe tener como máximo 100 caracteres.";
        else if (!emailDominioValido(email)) e.email = "Solo se permiten correos @duoc.cl, @profesor.duoc.cl o @gmail.com.";
        if (!birthdate) e.birthdate = "Por favor ingresa tu fecha de nacimiento.";
    // region/comuna are not requested at registration (part of addresses)

        if (!password) e.password = "Por favor ingresa una contraseña.";
        else if (String(password).length < 4 || String(password).length > 10) e.password = "La contraseña debe tener entre 4 y 10 caracteres.";
        if (password !== password2) e.password2 = "Las contraseñas no coinciden.";
        if (!termsAccepted) e.terms = "Debes aceptar los términos y condiciones.";
        return e;
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const v = validate();
        setErrors(v);
        if (Object.keys(v).length) return;

        // Hash password before storing
        const hashed = await sha256Hex(password);

    const result = createUser({ run, name, lastname, email, birthdate, codigo, password: hashed });
        if (!result.ok) {
            if (result.error === 'email_exists') setErrors({ email: "Ya existe una cuenta con ese correo." });
            else setErrors({ email: "No se pudo crear la cuenta." });
            return;
        }

        login({ name, email });

        setShowSuccess(true);
    }

    function closeSuccess() {
        setShowSuccess(false);
        navigate("/");
    }

    function onRunChange(v: string) {
        setRun(formatearRun(v));
        clearFieldError('run');
    }

    const maxBirth = new Date().toISOString().split('T')[0];

    return (
        <>
            <main className="mt-0">
                <section className="position-relative overflow-hidden text-white" style={{ backgroundImage: `linear-gradient(135deg, rgba(238, 121, 25, 0.75), rgba(90, 63, 5, 0.55)), url('/src/assets/images/carrusel/diversidad_pasteles.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center center', backgroundRepeat: 'no-repeat' }}>
                    <div className="container py-3 position-relative">
                        <div className="row justify-content-center">
                            <div className="col-11 col-md-10 col-lg-12">
                                <div className="d-flex flex-column flex-lg-row align-items-center gap-3 text-center text-lg-start p-3 p-lg-4 rounded-4 shadow-lg" style={{ background: 'rgba(31, 8, 56, 0.5)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    <img alt="Pastelería Mil Sabores" width={140} className={`${styles.logo} rounded-pill shadow border border-light border-opacity-50`} src="/src/assets/images/logo_tienda.png" />
                                    <div>
                                        <span className="badge text-uppercase fw-semibold mb-3 bg-white text-body-secondary px-3 py-2">Tu pastelería favorita</span>
                                        <h1 className="mb-2 brand-name text-white">Pastelería Mil Sabores</h1>
                                        <h2 className="h4 mb-3" style={{ color: 'rgba(255,255,255,0.85)' }}>Crea tu cuenta</h2>
                                        <p className="lead mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>Accede a beneficios dulces, seguimiento de pedidos y novedades exclusivas.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-5">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-12 col-lg-8 col-xl-6">
                                <div className="bg-body border rounded-3 shadow-sm p-4 p-lg-5">
                                    <header className={`d-flex align-items-start justify-content-between mb-4 ${styles.header}`}>
                                        <div>
                                            <span className="badge text-uppercase fw-semibold mb-2">Nuevo registro</span>
                                            <h2 className="h4 mb-0"><i className="bi bi-person-plus me-2" aria-hidden="true"></i>Crear cuenta</h2>
                                        </div>
                                        <a className={`btn ${styles['btn-sec']} btn-sm`} aria-label="Volver al inicio" href="/" data-discover="true"><i className="bi bi-x-lg" aria-hidden="true"></i></a>
                                    </header>

                                    <p className="mb-4">Completa tus datos para disfrutar de promociones personalizadas y un proceso de compra más ágil.</p>

                                    <form noValidate onSubmit={onSubmit}>
                                        <FormField id="run" label="RUN" inputWrapperClassName={`d-flex align-items-center gap-2 ${styles.runRow}`} error={errors.run}>
                                            <input id="run" className={`form-control ${errors.run ? 'is-invalid' : ''}`} inputMode="numeric" pattern="[0-9]*" placeholder="12.345.678-9" autoComplete="off" maxLength={12} type="text" value={run} name="run" style={{ flex: '1 1 0%' }} onChange={(e) => onRunChange(e.target.value)} />
                                        </FormField>

                                        <FormField id="nombre" label="Nombre" error={errors.name}>
                                            <input id="nombre" className={`form-control ${errors.name ? 'is-invalid' : ''}`} placeholder="María Luisa" value={name} name="nombre" onChange={(e) => { setName(e.target.value); clearFieldError('name'); }} />
                                        </FormField>

                                        <FormField id="apellidos" label="Apellidos" error={errors.lastname}>
                                            <input id="apellidos" className={`form-control ${errors.lastname ? 'is-invalid' : ''}`} placeholder="Pérez González" value={lastname} name="apellidos" onChange={(e) => { setLastname(e.target.value); clearFieldError('lastname'); }} />
                                        </FormField>

                                        <FormField id="correo" label="Correo electrónico" help={<>Dominios permitidos: @duoc.cl, @profesor.duoc.cl, @gmail.com</>} error={errors.email}>
                                            <input id="correo" className={`form-control ${errors.email ? 'is-invalid' : ''}`} aria-describedby="correo-help" placeholder="usuario@dominio.com" type="email" value={email} name="correo" onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }} />
                                        </FormField>

                                        <div className="row g-3">
                                            <div className="col-12 col-lg-6">
                                                <FormField id="birthdate" label="Fecha de nacimiento (opcional)" help={"Debes tener al menos 18 años."} error={errors.birthdate}>
                                                    <input id="birthdate" className={`form-control ${errors.birthdate ? 'is-invalid' : ''}`} max={maxBirth} type="date" value={birthdate} name="fechaNacimiento" onChange={(e) => { setBirthdate(e.target.value); clearFieldError('birthdate'); }} />
                                                </FormField>
                                            </div>
                                            <div className="col-12 col-lg-6">
                                                {/* address removed from registration; users can add addresses later in profile */}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label" htmlFor="codigoDescuento">Código promocional (opcional)</label>
                                            <input id="codigoDescuento" className="form-control" aria-describedby="codigoDescuento-help" placeholder="Ej: FELICES50" value={codigo} name="codigoDescuento" onChange={(e) => { setCodigo(e.target.value); clearFieldError('codigo'); }} />
                                            <div id="codigoDescuento-help" className="form-text">Ingresa tu código si cuentas con una campaña vigente.</div>
                                        </div>

                                        <FormField id="password" label="Contraseña" help={"Debe tener entre 4 y 10 caracteres."} error={errors.password}>
                                            <div className="input-group">
                                                <input className={`form-control ${errors.password ? 'is-invalid' : ''}`} id="password" aria-describedby="passwordHelp" type={showPassword ? 'text' : 'password'} value={password} name="password" onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); if (password2) { if (e.target.value !== password2) setErrors(prev => ({ ...prev, password2: 'Las contraseñas no coinciden.' })); else clearFieldError('password2'); } }} />
                                                <button type="button" className={`btn ${styles['btn-sec']}`} aria-label="Mostrar contraseña" onClick={() => setShowPassword(s => !s)}><i className="bi bi-eye" aria-hidden="true"></i></button>
                                            </div>
                                        </FormField>

                                        <FormField id="confirmPassword" label="Confirmar contraseña" error={errors.password2}>
                                            <div className="input-group">
                                                <input className={`form-control ${errors.password2 ? 'is-invalid' : ''}`} id="confirmPassword" type={showConfirm ? 'text' : 'password'} value={password2} name="confirmPassword" onChange={(e) => { setPassword2(e.target.value); clearFieldError('password2'); if (password && e.target.value !== password) setErrors(prev => ({ ...prev, password2: 'Las contraseñas no coinciden.' })); else clearFieldError('password2'); }} />
                                                <button type="button" className={`btn ${styles['btn-sec']}`} aria-label="Mostrar confirmación" onClick={() => setShowConfirm(s => !s)}><i className="bi bi-eye" aria-hidden="true"></i></button>
                                            </div>
                                        </FormField>

                                        <div className="form-check mb-4">
                                            <input className={`${styles['checkbox']} form-check-input ${errors.terms ? 'is-invalid' : ''}`} id="terms" required type="checkbox" name="termsAccepted" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); clearFieldError('terms'); }} />
                                            <label className="form-check-label" htmlFor="terms">Acepto los <a className="link-body-emphasis" href="/terminos">términos y condiciones</a></label>
                                            <FieldFeedback className={`d-block ${styles.termsFeedback}`}>{errors.terms}</FieldFeedback>
                                        </div>

                                        <div className={`d-grid ${styles.ctaWrap}`}>
                                            <button className={`btn btn-lg ${styles['btn-registro']}`} type="submit">Registrarse</button>
                                        </div>

                                        <hr className="my-4" />
                                        <p className="mb-0 text-center">¿Ya tienes cuenta? <a className="link-body-emphasis" href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-login')); }}>Inicia sesión</a></p>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Modal show={showSuccess} title="Registro exitoso" onClose={closeSuccess} hideFooter>
                <div className="text-center">
                    <i className="bi bi-check-circle-fill text-success fs-1 mb-3"></i>
                    <p>¡Tu cuenta ha sido creada correctamente! Ahora estás conectado.</p>
                    <div className="d-flex justify-content-center mt-3">
                        <button type="button" className="btn btn-primary" onClick={closeSuccess}>Aceptar</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Registro;
