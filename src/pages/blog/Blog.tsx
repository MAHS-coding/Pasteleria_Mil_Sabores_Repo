import React, { useEffect, useState } from 'react';
// Link not used here directly; recipe card provides navigation
import recetas from '../../data/recetas.json';
import RecipeCard from '../../components/blog/RecipeCard';
import ParallaxHero from '../../components/parallaxHero/ParallaxHero';
import { useAuth } from '../../context/AuthContext';
import styles from './Blog.module.css';
import Modal from '../../components/ui/Modal';
import chatService, { CHAT_UPDATED_EVENT } from '../../services/chatService';

type Mensaje = { nombre: string; texto: string; categoria?: string; receta?: string; img?: string };

const DemoMessages: Mensaje[] = [
	{ nombre: 'Ana', texto: '¡Me encantó el cheesecake!', img: '' },
	{ nombre: 'Luis', texto: '¿Alguien probó la receta de brownies?', img: '' },
	{ nombre: 'Sofía', texto: 'Recomiendo usar cacao amargo.', img: '' },
	{ nombre: 'Carlos', texto: '¿Dónde compran los ingredientes?', img: '' },
	{ nombre: 'Valentina', texto: 'Suban más recetas veganas!', img: '' }
];



const ChatPreview: React.FC<{ mensajes: Mensaje[]; onOpen: () => void; onDelete?: (m: Mensaje) => void; userName?: string }> = ({ mensajes, onOpen, onDelete, userName }) => {
	const preview = mensajes.slice(0, 10);
	return (
		<>
			<div
				id="chat-comunidad"
				className={`card p-3 mb-3 ${styles['chat-preview']}`}
				style={{ maxHeight: 340, overflowY: 'auto' }}
			>
					{preview.length === 0 ? (
						<div className="text-center text-muted">Sé el primero en saludar a la comunidad.</div>
					) : (
						preview.map((m, i) => (
							<div key={i} className="mb-2 d-flex align-items-start">
								<div className="flex-fill">
									{m.categoria ? <span className={`badge me-1 ${m.categoria === 'Recetas' ? 'bg-success' : 'bg-primary'}`}>{m.categoria}</span> : null}
									{m.receta ? <span className="badge bg-warning text-dark me-1">{m.receta}</span> : null}
									<strong>{m.nombre}:</strong> {m.texto}
								</div>
								{onDelete && userName && m.nombre === userName && (
									<button className="btn btn-sm btn-link text-danger p-0 ms-2" onClick={() => onDelete(m)} aria-label={`Eliminar comentario de ${m.nombre}`}><i className="bi bi-trash" /></button>
								)}
							</div>
						))
					)}
			</div>
			<div className="d-flex">
				<button id="btn-ver-mas-chat" type="button" className={`btn ${styles.chatSubmitBtn} ms-auto`} onClick={onOpen}>Ver más</button>
			</div>
		</>
	);
};

const Blog: React.FC = () => {
	const [mensajes, setMensajes] = useState<Mensaje[]>([]);
	const [showModal, setShowModal] = useState(false);
	const [categoria, setCategoria] = useState('Recetas');
	const [receta, setReceta] = useState('');
	const [texto, setTexto] = useState('');
	const { user } = useAuth();
	const modalBodyRef = React.useRef<HTMLDivElement | null>(null);

	// delete confirmation state
	const [deleteTarget, setDeleteTarget] = useState<Mensaje | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const msgs = await chatService.getAllMensajes();
				if (!mounted) return;
				if (Array.isArray(msgs) && msgs.length > 0) {
					setMensajes(msgs as any);
					return;
				}
			} catch {}
			if (mounted) setMensajes(DemoMessages);
		})();
		return () => { mounted = false; };
	}, []);

	// Keep messages in sync across tabs (localStorage updates)
	useEffect(() => {
		function storageHandler(ev: StorageEvent) {
			if (ev.key === chatService.CHAT_KEY || ev.key === 'chatMensajes') {
				(async () => {
					try {
						const msgs = await chatService.getAllMensajes();
						if (Array.isArray(msgs)) setMensajes(msgs as any);
					} catch {}
				})();
			}
		}
		window.addEventListener('storage', storageHandler);

		// Listen for chat updates from the service
		function localUpdateHandler(ev: Event) {
			try {
				const detail = (ev as CustomEvent).detail as Mensaje[] | undefined;
				if (!detail) {
					// if no detail, reload full set
					chatService.getAllMensajes().then((m) => setMensajes(m as any)).catch(() => {});
					return;
				}
				if (Array.isArray(detail)) {
					setMensajes(detail as Mensaje[]);
				}
			} catch { }
		}
		window.addEventListener(CHAT_UPDATED_EVENT, localUpdateHandler as EventListener);

		// listen for delete requests from other components (same-tab)
		function requestDeleteHandler(ev: Event) {
			try {
				const detail = (ev as CustomEvent).detail as Mensaje | undefined;
				if (!detail) return;
				setDeleteTarget(detail);
				setShowDeleteConfirm(true);
			} catch {}
		}
		window.addEventListener('requestDeleteComment', requestDeleteHandler as EventListener);
		// cleanup for all listeners
		return () => {
			window.removeEventListener('storage', storageHandler);
			window.removeEventListener(CHAT_UPDATED_EVENT, localUpdateHandler as EventListener);
			window.removeEventListener('requestDeleteComment', requestDeleteHandler as EventListener);
		};
	}, []);

	async function deleteMensaje(target: Mensaje | null) {
		try {
			if (!target) return;
			// Find message id by matching fields
			const all = await chatService.getAllMensajes();
			const found = all.find(m => m.id === (target as any).id || (m.nombre === target.nombre && m.texto === target.texto && (m.categoria || '') === (target.categoria || '') && (m.receta || '') === (target.receta || '')));
			if (!found) return;
			const ok = await chatService.deleteMensajeById(found.id);
			if (ok) {
				const msgs = await chatService.getAllMensajes();
				setMensajes(msgs as any);
				setShowDeleteConfirm(false);
				setDeleteTarget(null);
			}
		} catch {}
	}

	async function handleSubmitChat(e?: React.FormEvent) {
		e?.preventDefault();
		const palabras = texto.trim().split(/\s+/).filter(Boolean);
		if (palabras.length > 30) return;
		if (texto.trim().length === 0) return;
		if (categoria === 'Recetas' && !receta) return;
		const nombre = 'Usuario';
		const payload = { nombre, texto: texto.trim(), categoria, receta };
		await chatService.postMensaje(payload as any);
		// refresh list from service
		const msgs = await chatService.getAllMensajes();
		setMensajes(msgs as any);
		setTexto('');
		setReceta('');
	}

	// Auto-scroll modal content to top & focus when opened
	useEffect(() => {
		if (showModal && modalBodyRef.current) {
			modalBodyRef.current.scrollTop = 0;
			// try focus for accessibility
			const btn = modalBodyRef.current.querySelector('button');
			if (btn && (btn as HTMLElement).focus) (btn as HTMLElement).focus();
		}
	}, [showModal]);

	const palabraCount = texto.trim().split(/\s+/).filter(Boolean).length;
	const canSubmit = !!user && texto.trim().length > 0 && palabraCount <= 30 && (categoria !== 'Recetas' || !!receta);

	return (
		<main className={`d-flex flex-column min-vh-100 ${styles['blog-page']}`}>
			<ParallaxHero image="/images/background/fondo.jpg" arrowToId="destacados-blog">
				<h1 className={`display-5 fw-bold ${styles['hero-title']}`}>Recetas &amp; Impacto Comunitario</h1>
				<p className={`lead ${styles['hero-subtitle']}`}>
					Ideas dulces cada semana y cómo tu compra apoya a estudiantes de gastronomía y a la comunidad.
				</p>
			</ParallaxHero>

			<section id="destacados-blog" className={`py-5`}>
				<div className="container">
					<div className={`text-center mb-5 ${styles.sectionHeader}`}>
						<h2 className={styles.sectionTitle}>Recetas guiadas</h2>
						<p className={`${styles.sectionLead} mb-0`}>Historias, técnicas y experiencias reales de nuestra comunidad pastelera.</p>
					</div>

					<div className={`row g-4 ${styles.recetasRow}`}>
						{(recetas as any[]).slice(0, 3).map((r) => (
							<div className="col-md-4" key={r.id}>
								<RecipeCard recipe={r} />
							</div>
						))}
					</div>
				</div>
			</section>

			<section id="comunidad-blog" className={`py-5`}>
				<div className="container">
					<div className={`text-center mb-4 ${styles.sectionHeader}`}>
						<h3 className={styles.sectionTitle}>Habla con la comunidad</h3>
						<p className={`${styles.sectionLead} mb-0`}>Comparte tus trucos, consulta dudas y recomienda tus preparaciones favoritas.</p>
					</div>

					<div className="row">
						<div className="col-12">
							<div className={styles.chatWrapper}>
								{/* Preview limited to maximum 10 messages (includes recipe-scoped messages). */}
								<ChatPreview mensajes={mensajes.slice(0, 10)} onOpen={() => setShowModal(true)} onDelete={(m) => { setDeleteTarget(m); setShowDeleteConfirm(true); }} userName={user?.name} />
							</div>
						</div>
					</div>

					<div className="row mt-4">
						<div className="col-12">
							<form id="chat-form" onSubmit={(e) => handleSubmitChat(e)} className={styles.chatForm}>
								<div className={`input-group align-items-center ${styles.chatInputGroup}`}>
									<select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={`form-select form-select-sm ${styles.chatSelect}`} style={{ maxWidth: 160 }} disabled={!user}>
										<option value="Recetas">Recetas</option>
										<option value="General">General</option>
										<option value="Otros">Otros</option>
									</select>

									<input type="text" id="chat-input" className={`form-control ms-2 ${styles.chatInput}`} placeholder="Escribe tu mensaje..." maxLength={240} value={texto} onChange={(e) => setTexto(e.target.value)} disabled={!user} />
									<button className={`btn ${styles.chatSubmitBtn}`} type="submit" disabled={!canSubmit}>Enviar</button>
									<span id="chat-palabras-contador" className={`ms-2 small ${styles.chatCounter}`} style={{ minWidth: 70, textAlign: 'right' }}>{texto.trim().split(/\s+/).filter(Boolean).length}/30</span>
								</div>
								<div id="chat-receta-select" style={{ display: categoria === 'Recetas' ? 'block' : 'none' }} className="mt-2">
									<select id="chat-receta" value={receta} onChange={(e) => setReceta(e.target.value)} className={`form-select form-select-sm ${styles.chatSelect}`} disabled={!user}>
										<option value="">Selecciona una receta…</option>
										{(recetas as any[]).map((r) => <option key={r.id} value={r.titulo}>{r.titulo}</option>)}
									</select>
								</div>
								{/* If not logged in, show prompt to log in */}
								{!user && (
									<div className="mt-2 small text-muted">Debes <a href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-login')); }}>iniciar sesión</a> para comentar.</div>
								)}
							</form>
						</div>
					</div>
				</div>
			</section>

			
			<section id="impacto-comunitario" className="py-5">
				<div className="container">
					<div className={`text-center mb-4 ${styles.sectionHeader}`}>
						<h2 className={styles.sectionTitle}>Impacto comunitario</h2>
						<p className={`${styles.sectionLead} mb-0`}>
							Escuela de Administración y Negocios • Cómo tus compras apoyan a estudiantes de gastronomía y al entorno local.
						</p>
					</div>

					<div className="row g-4">
						<div className="col-lg-6">
							<div className={`card shadow-sm h-100 ${styles.impactCard}`}>
								<div className="card-body p-4">
									<div className="d-flex align-items-center gap-3 mb-3">
										<div className={styles.impactIcon} aria-hidden="true">
											<i className="bi bi-mortarboard fs-4" />
										</div>
										<h3 className="h5 mb-0">Becas y prácticas formativas</h3>
									</div>
									<p className="mb-0 text-muted">
										Un porcentaje de cada compra se destina a <strong>becas y materiales</strong> para estudiantes de gastronomía. Además, mantenemos un programa de <strong>prácticas supervisadas</strong> donde participan en producción real, gestión de inventario y control de calidad.
									</p>
								</div>
							</div>
						</div>

						<div className="col-lg-6">
							<div className={`card shadow-sm h-100 ${styles.impactCard}`}>
								<div className="card-body p-4">
									<div className="d-flex align-items-center gap-3 mb-3">
										<div className={styles.impactIcon} aria-hidden="true">
											<i className="bi bi-people fs-4" />
										</div>
										<h3 className="h5 mb-0">Desarrollo local y encadenamiento</h3>
									</div>
									<p className="mb-0 text-muted">
										Priorizamos <strong>proveedores locales</strong> y talleres asociados a la Escuela de Administración y Negocios. Esto fomenta el <strong>emprendimiento</strong> y fortalece redes entre estudiantes, egresados y negocios de barrio.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<Modal show={showModal} title="Mensajes de la comunidad" onClose={() => setShowModal(false)} hideFooter contentClassName={styles['chat-modal-content']}>
				<div ref={modalBodyRef} className={styles['chat-modal-body']}>
					{mensajes.map((m, i) => (
						<div key={i} className="mb-3 d-flex align-items-start">
							<div className="flex-fill">
								{m.categoria ? <span className={`badge me-1 ${m.categoria === 'Recetas' ? 'bg-success' : 'bg-primary'}`}>{m.categoria}</span> : null}
								{m.receta ? <span className="badge bg-warning text-dark me-1">{m.receta}</span> : null}
								<strong>{m.nombre}:</strong> {m.texto}
							</div>
							{user && m.nombre === user.name && (
								<button className="btn btn-sm btn-link text-danger p-0 ms-2" onClick={() => { setDeleteTarget(m); setShowDeleteConfirm(true); }} aria-label={`Eliminar comentario de ${m.nombre}`}><i className="bi bi-trash" /></button>
							)}
						</div>
					))}
				</div>
			</Modal>

				<Modal show={showDeleteConfirm && !!deleteTarget} title="Confirmar eliminación" onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} onConfirm={() => deleteMensaje(deleteTarget)} confirmLabel="Eliminar" cancelLabel="Cancelar" contentClassName={styles['chat-modal-content']}>
					{deleteTarget && (
						<>
							<p>¿Seguro que quieres eliminar este comentario de <strong>{deleteTarget.nombre}</strong>?</p>
							<p className="small text-muted">"{deleteTarget.texto.length > 200 ? deleteTarget.texto.slice(0, 200) + '…' : deleteTarget.texto}"</p>
						</>
					)}
				</Modal>
		</main>
	);
};

export default Blog;
