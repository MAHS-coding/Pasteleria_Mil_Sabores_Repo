import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import recetas from '../../data/recetas.json';
// Parallax removed for recipe pages per request
import './Receta.css';
import { useNavigate } from 'react-router-dom';
import productStyles from '../productos/Detalle.module.css';
import blogStyles from './Blog.module.css';
import RecipeCard from '../../components/blog/RecipeCard';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import chatService, { CHAT_UPDATED_EVENT } from '../../services/chatService';

type Mensaje = { nombre: string; texto: string; categoria?: string; receta?: string; img?: string };

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const Receta: React.FC = () => {
    const params = useParams<{ id?: string }>();
    const query = useQuery();
    const idFromQuery = query.get('receta');
    const id = params.id || idFromQuery || '';

    const receta = (recetas as any[]).find(r => r.id === id);

    if (!receta) {
        return (
            <main className="container py-5">
                <h2>Receta no encontrada</h2>
                <p>No se encontró la receta solicitada.</p>
                <Link to="/blogs" className="btn btn-primary">Volver al blog</Link>
            </main>
        );
    }

    const navigate = useNavigate();

    const otros = (recetas as any[]).filter(r => r.id !== receta.id);

    return (
        <main>

            <div className="container my-5">
                <div className="mb-3">
                    <button className={productStyles.backButton} onClick={() => {
                        try {
                            if (window.history && window.history.length > 1) navigate(-1);
                            else navigate('/blog');
                        } catch (e) {
                            navigate('/blog');
                        }
                    }} aria-label="Volver">
                        <i className="bi bi-arrow-left me-2"></i>Volver
                    </button>
                </div>

                <div className="row mb-5 align-items-start">
                    <div className="col-lg-6 mb-4">
                        <div className={productStyles.imageCard}>
                            <img id="imagen-receta" src={receta.imagen} alt={receta.titulo}
                                style={{ width: '100%', height: 350, objectFit: 'cover', borderRadius: 16, display: 'block' }}
                                onError={(e) => { e.currentTarget.src = '/images/background/fondo.jpg'; }} />
                        </div>
                    </div>

                    <div className="col-lg-6 d-flex">
                        <div className={`product-details h-100 flex-fill ${productStyles.detailsCard}`}>
                            {receta.badge ? <div className="mb-2"><span className={`badge ${receta.badgeClass} me-2`}>{receta.badge}</span></div> : null}
                            <h1 id="titulo-receta" className="title">{receta.titulo}</h1>
                            <div id="detalle-receta">
                                <strong>Ingredientes:</strong>
                                <ul>{String(receta.ingredientes).split(',').map((i: string, idx: number) => <li key={idx}>{i.trim()}</li>)}</ul>
                                <strong>Preparación:</strong>
                                <div dangerouslySetInnerHTML={{ __html: String(receta.preparacion).replace(/\n/g, '<br/>') }} />
                            </div>
                            {/* Removed redundant 'Volver al blog' button (top backButton handles navigation) */}
                        </div>
                    </div>
                </div>
            </div>

            <section id="comunidad-receta" className="py-5">
                <div className="container">
                    <div className={`text-center mb-4 ${blogStyles.sectionHeader}`}>
                        <h3 className={blogStyles.sectionTitle}>Comentarios sobre esta receta</h3>
                        <p className={`${blogStyles.sectionLead} mb-0`}>Comparte dudas o consejos específicos para esta receta.</p>
                    </div>

                    <div className="row">
                        <div className="col-12">
                            <div className={blogStyles.chatWrapper}>
                                <RecipeChat recetaId={receta.id} recetaTitle={receta.titulo} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mb-5">
                <h2 className="h4 fw-bold mb-4">Otras recetas de la semana</h2>
                <div className="row g-4">
                    {otros.map((r: any) => (
                        <div className="col-md-4" key={r.id}>
                            <RecipeCard recipe={r} variant="detailed" />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
};

export default Receta;

// Inline recipe-scoped chat component
const RecipeChat: React.FC<{ recetaId: string; recetaTitle: string }> = ({ recetaId, recetaTitle }) => {
    const { user } = useAuth();
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [texto, setTexto] = useState('');
    const [nombre, setNombre] = useState(user?.name ?? '');

    // deletion modal state local to recipe page
    const [deleteTarget, setDeleteTarget] = useState<Mensaje | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        setNombre(user?.name ?? '');
    }, [user]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const msgs = await chatService.getMensajesForReceta(recetaTitle);
                if (!mounted) return;
                setMensajes(Array.isArray(msgs) ? msgs as any : []);
            } catch { if (mounted) setMensajes([]); }
        })();
        return () => { mounted = false; };
    }, [recetaTitle]);

    // sync across tabs
    useEffect(() => {
        const handler = (ev: StorageEvent) => {
            if (ev.key === chatService.CHAT_KEY || ev.key === 'chatMensajes') {
                chatService.getMensajesForReceta(recetaTitle).then((msgs) => setMensajes(msgs as any)).catch(() => {});
            }
        };
        window.addEventListener('storage', handler);
        // also listen for same-tab updates from the service
        const localHandler = (ev: Event) => {
            try {
                const detail = (ev as CustomEvent).detail as Mensaje[] | undefined;
                if (!detail) {
                    chatService.getMensajesForReceta(recetaTitle).then((msgs) => setMensajes(msgs as any)).catch(() => {});
                    return;
                }
                setMensajes(detail.filter(m => m.receta === recetaTitle));
            } catch {}
        };
        window.addEventListener(CHAT_UPDATED_EVENT, localHandler as EventListener);

        return () => {
            window.removeEventListener('storage', handler);
            window.removeEventListener(CHAT_UPDATED_EVENT, localHandler as EventListener);
        };
    }, [recetaId]);

    async function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault();
        if (!user) {
            // prompt login
            window.dispatchEvent(new CustomEvent('open-login'));
            return;
        }
        const t = texto.trim();
        if (!t) return;
        const msg = { nombre: user.name || 'Usuario', texto: t, categoria: 'Recetas', receta: recetaTitle };
        await chatService.postMensaje(msg as any);
        const msgs = await chatService.getMensajesForReceta(recetaTitle);
        setMensajes(msgs as any);
        setTexto('');
    }

    function handleRequestDelete(m: Mensaje) {
        // open local confirmation modal on recipe page
        setDeleteTarget(m);
        setShowDeleteConfirm(true);
    }

    async function deleteMensaje(target: Mensaje | null) {
        try {
            if (!target) return;
            const all = await chatService.getAllMensajes();
            const found = all.find(m => m.id === (target as any).id || (m.nombre === target.nombre && m.texto === target.texto && (m.receta || '') === (target.receta || '')));
            if (!found) return;
            const ok = await chatService.deleteMensajeById(found.id);
            if (ok) {
                const msgs = await chatService.getMensajesForReceta(recetaTitle);
                setMensajes(msgs as any);
                setShowDeleteConfirm(false);
                setDeleteTarget(null);
            }
        } catch {}
    }

    return (
        <div>
            <div className={`card p-3 mb-3 ${blogStyles['chat-preview']}`} style={{ maxHeight: 340, overflowY: 'auto' }}>
                {mensajes.length === 0 ? (
                    <div className="text-center text-muted">Sé el primero en comentar sobre esta receta.</div>
                ) : (
                    mensajes.slice(0, 50).map((m, i) => (
                        <div key={i} className="mb-2 d-flex align-items-start">
                            <div className="flex-fill"><strong>{m.nombre}:</strong> {m.texto}</div>
                                {user && m.nombre === user.name && (
                                    <button className="btn btn-sm btn-link text-danger p-0 ms-2" onClick={() => { handleRequestDelete(m); }} aria-label={`Eliminar comentario de ${m.nombre}`}><i className="bi bi-trash" /></button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={(e) => handleSubmit(e)} className={blogStyles.chatForm}>
                <div className={`input-group align-items-center ${blogStyles.chatInputGroup}`}>
                    <input type="text" className={`form-control ${blogStyles.chatInput}`} placeholder="Nombre (opcional)" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ maxWidth: 160 }} disabled={!user} />
                    <input type="text" className={`form-control ms-2 ${blogStyles.chatInput}`} placeholder="Escribe tu comentario..." maxLength={240} value={texto} onChange={(e) => setTexto(e.target.value)} disabled={!user} />
                    <button className={`btn ${blogStyles.chatSubmitBtn}`} type="submit" disabled={!user || texto.trim().length === 0}>Enviar</button>
                </div>
                {!user && (
                    <div className="mt-2 small text-muted">Debes <a href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-login')); }}>iniciar sesión</a> para comentar.</div>
                )}
            </form>

            <Modal show={showDeleteConfirm} title="Confirmar eliminación" onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} onConfirm={() => deleteMensaje(deleteTarget)} confirmLabel="Eliminar" cancelLabel="Cancelar" className="" contentClassName={blogStyles['chat-modal-content']}>
                {deleteTarget && (
                    <>
                        <p>¿Seguro que quieres eliminar este comentario de <strong>{deleteTarget.nombre}</strong>?</p>
                        <p className="small text-muted">"{deleteTarget.texto.length > 200 ? deleteTarget.texto.slice(0, 200) + '…' : deleteTarget.texto}"</p>
                    </>
                )}
            </Modal>
        </div>
    );
};
