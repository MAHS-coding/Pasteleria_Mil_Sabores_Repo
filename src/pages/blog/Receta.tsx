import React from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import recetas from '../../data/recetas.json';
import './Receta.css';

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

    const otros = (recetas as any[]).filter(r => r.id !== receta.id);

    return (
        <main>
            <section className="parallax parallax-2">
                <div className="hero-content container text-center text-white">
                    <h1 className="display-5 fw-bold">{receta.titulo}</h1>
                    <p className="lead">{receta.resumen}</p>
                </div>
            </section>

            <div className="container my-5">
                <div className="row justify-content-center align-items-start">
                    <div className="col-md-7">
                        <h1 id="titulo-receta">{receta.titulo}</h1>
                        <div id="detalle-receta">
                            <strong>Ingredientes:</strong>
                            <ul>{String(receta.ingredientes).split(',').map((i: string, idx: number) => <li key={idx}>{i.trim()}</li>)}</ul>
                            <strong>Preparación:</strong>
                            <div dangerouslySetInnerHTML={{ __html: String(receta.preparacion).replace(/\n/g, '<br/>') }} />
                        </div>
                    </div>
                    <div className="col-md-5 text-center">
                        <img id="imagen-receta" src={receta.imagen} alt={receta.titulo} className="img-fluid rounded shadow" style={{ maxHeight: 350, objectFit: 'cover' }} />
                        <Link to="/blogs" className="btn btn-primary mt-4">Volver al blog</Link>
                    </div>
                </div>
            </div>

            <div className="container mb-5">
                <h2 className="h4 fw-bold mb-4">Otras recetas de la semana</h2>
                <div className="row g-4">
                    {otros.map((r: any) => (
                        <div className="col-md-4" key={r.id}>
                            <article className="card h-100 shadow-sm recetas-card">
                                <img src={r.imagen} className="card-img-top" alt={r.titulo} style={{ aspectRatio: '4/3', objectFit: 'cover' }} />
                                <div className="card-body">
                                    {r.badge ? <span className={`badge ${r.badgeClass} mb-2`}>{r.badge}</span> : null}
                                    <h3 className="h5">{r.titulo}</h3>
                                    <div className="mb-2"><strong>Ingredientes:</strong>
                                        <ul>{String(r.ingredientes).split(',').map((i: string, idx: number) => <li key={idx}>{i.trim()}</li>)}</ul>
                                    </div>
                                    <Link to={`/blog/${r.id}`} className="btn btn-outline-primary btn-sm">Ver receta</Link>
                                </div>
                            </article>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
};

export default Receta;
