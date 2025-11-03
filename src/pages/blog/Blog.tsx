import React, { useEffect, useState } from 'react';
import posts from '../../data/blogs.json';
import './Blog.css';

type Post = {
	id: string;
	titulo: string;
	resumen: string;
	imagen: string;
	fecha: string;
	autor: string;
	link: string;
};

type Mensaje = { nombre: string; texto: string; categoria?: string; receta?: string; img?: string };

const DemoMessages: Mensaje[] = [
	{ nombre: 'Ana', texto: '¡Me encantó el cheesecake!', img: '' },
	{ nombre: 'Luis', texto: '¿Alguien probó la receta de brownies?', img: '' },
	{ nombre: 'Sofía', texto: 'Recomiendo usar cacao amargo.', img: '' },
	{ nombre: 'Carlos', texto: '¿Dónde compran los ingredientes?', img: '' },
	{ nombre: 'Valentina', texto: 'Suban más recetas veganas!', img: '' }
];

const ChatPreview: React.FC<{ mensajes: Mensaje[]; onOpen: () => void }> = ({ mensajes, onOpen }) => {
	const preview = mensajes.slice(0, 10);
	return (
		<>
			<div id="chat-comunidad" className="card p-3 mb-3 chat-preview" style={{ maxHeight: 340, overflowY: 'auto' }}>
				{preview.map((m, i) => (
					<div key={i} className="mb-2">
						{m.categoria ? <span className={`badge me-1 ${m.categoria === 'Recetas' ? 'bg-success' : 'bg-primary'}`}>{m.categoria}</span> : null}
						{m.receta ? <span className="badge bg-warning text-dark me-1">{m.receta}</span> : null}
						<strong>{m.nombre}:</strong> {m.texto}
					</div>
				))}
			</div>
			<div className="d-flex">
				<button id="btn-ver-mas-chat" className="btn btn-outline-primary ms-auto" onClick={onOpen}>Ver más</button>
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

	useEffect(() => {
		try {
			const raw = localStorage.getItem('chatMensajes');
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) {
					// Ensure categoria present
					parsed.forEach((p) => { if (!p.categoria) p.categoria = 'General'; });
					setMensajes(parsed);
					return;
				}
			}
		} catch (e) {}
		setMensajes(DemoMessages);
	}, []);

	function saveMensajes(items: Mensaje[]) {
		try { localStorage.setItem('chatMensajes', JSON.stringify(items)); } catch {}
	}

	function handleSubmitChat(e?: React.FormEvent) {
		e?.preventDefault();
		const palabras = texto.trim().split(/\s+/).filter(Boolean);
		if (palabras.length > 30) return;
		if (categoria === 'Recetas' && !receta) return;
		const nombre = 'Usuario';
		const nuevo: Mensaje = { nombre, texto: texto.trim(), categoria, receta, img: '' };
		const next = [nuevo, ...mensajes].slice(0, 50);
		setMensajes(next);
		saveMensajes(next);
		setTexto('');
		setReceta('');
	}

	return (
		<main>
			<section className="hero-blog py-5 text-white">
				<div className="container">
					<h1 className="display-5 fw-bold mb-2">Blog • Recetas & Impacto Comunitario</h1>
					<p className="lead mb-0">Ideas dulces cada semana y cómo tu compra apoya a estudiantes de gastronomía y a la comunidad.</p>
				</div>
			</section>

			<section className="py-5 bg-light">
				<div className="container">
					<div className="mb-4 section-title">
						<h2 className="h3 fw-bold mb-1">Recetas de la semana <span className="bar" /></h2>
						<p className="text-secondary mb-0">Tres recetas simples, diferentes cada semana. ¡Manos a la obra!</p>
					</div>

					<div className="row g-4" id="lista-blogs">
						{(posts as Post[]).map((post) => (
							<div key={post.id} className="col-12 col-sm-6 col-lg-4">
								<article className="card h-100 card-blog shadow-sm">
									<img src={post.imagen} className="card-img-top" alt={post.titulo} />
									<div className="card-body d-flex flex-column">
										<h5 className="card-title">{post.titulo}</h5>
										<p className="text-muted mb-2">{new Date(post.fecha).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })} · {post.autor}</p>
										<p className="card-text flex-grow-1">{post.resumen}</p>
										<div className="mt-3">
											<a href={post.link} className="btn btn-outline-dark w-100">Leer más</a>
										</div>
									</div>
								</article>
							</div>
						))}
					</div>

					<div className="mt-5">
						<h3 className="h4 mb-3">Habla con la comunidad</h3>
						<ChatPreview mensajes={mensajes} onOpen={() => setShowModal(true)} />

						<form id="chat-form" className="mt-3" onSubmit={(e) => handleSubmitChat(e)}>
							<div className="input-group align-items-center">
								<button className="btn btn-outline-secondary dropdown-toggle" type="button" id="chat-categoria-btn">{categoria}</button>
								<select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="form-select form-select-sm ms-2" style={{maxWidth: 160}}>
									<option value="Recetas">Recetas</option>
									<option value="General">General</option>
									<option value="Otros">Otros</option>
								</select>

								<input type="text" id="chat-input" className="form-control ms-2" placeholder="Escribe tu mensaje..." maxLength={240} value={texto} onChange={(e) => setTexto(e.target.value)} />
								<button className="btn btn-primary" type="submit">Enviar</button>
								<span id="chat-palabras-contador" className="ms-2 text-secondary small" style={{minWidth:70,textAlign:'right'}}>{texto.trim().split(/\s+/).filter(Boolean).length}/30</span>
							</div>
							<div id="chat-receta-select" style={{display: categoria === 'Recetas' ? 'block' : 'none'}} className="mt-2">
								<select id="chat-receta" value={receta} onChange={(e) => setReceta(e.target.value)} className="form-select form-select-sm">
									<option value="">Selecciona una receta…</option>
									{(posts as Post[]).slice(0,3).map(p => <option key={p.id} value={p.titulo}>{p.titulo}</option>)}
								</select>
							</div>
						</form>
					</div>
				</div>
			</section>

			{showModal && (
				<div className="chat-modal-backdrop" onClick={() => setShowModal(false)}>
					<div className="chat-modal" onClick={(e) => e.stopPropagation()}>
						<div className="chat-modal-header d-flex justify-content-between align-items-center">
							<h5 className="m-0">Mensajes de la comunidad</h5>
							<button className="btn-close" onClick={() => setShowModal(false)} aria-label="Cerrar" />
						</div>
						<div className="chat-modal-body">
							{mensajes.map((m, i) => (
								<div key={i} className="mb-3">
									{m.categoria ? <span className={`badge me-1 ${m.categoria === 'Recetas' ? 'bg-success' : 'bg-primary'}`}>{m.categoria}</span> : null}
									{m.receta ? <span className="badge bg-warning text-dark me-1">{m.receta}</span> : null}
									<strong>{m.nombre}:</strong> {m.texto}
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</main>
	);
};

export default Blog;
