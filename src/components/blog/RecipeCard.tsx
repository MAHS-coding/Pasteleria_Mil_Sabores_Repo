import React from 'react';
import { Link } from 'react-router-dom';
import styles from './RecipeCard.module.css';

type Recipe = {
    id: string;
    imagen?: string;
    titulo: string;
    resumen?: string;
    ingredientes?: string;
    badge?: string;
    badgeClass?: string;
};

type Props = {
    recipe: Recipe;
    variant?: 'compact' | 'detailed';
    className?: string;
};

const RecipeCard: React.FC<Props> = ({ recipe, variant = 'compact', className }) => {
    return (
        <article className={`card h-100 shadow-sm ${styles.recetasCard} ${className || ''}`}>
            {recipe.imagen && (
                <img src={recipe.imagen} className="card-img-top" alt={recipe.titulo} style={{ aspectRatio: '4/3', objectFit: 'cover' }} />
            )}
            <div className="card-body">
                {recipe.badge ? <span className={`badge mb-2 ${recipe.badgeClass || styles.recetaBadge}`}>{recipe.badge}</span> : null}
                <h3 className={`h5 ${styles.recetaTitle}`}>{recipe.titulo}</h3>
                {variant === 'compact' && recipe.resumen ? (
                    <p className={`mb-3 ${styles.recetaCopy}`}>{recipe.resumen}</p>
                ) : null}

                {variant === 'detailed' && recipe.ingredientes ? (
                    <div className="mb-2">
                        <strong>Ingredientes:</strong>
                        <ul>
                            {String(recipe.ingredientes).split(',').map((i, idx) => <li key={idx}>{i.trim()}</li>)}
                        </ul>
                    </div>
                ) : null}

                <Link to={`/blog/${recipe.id}`} className={`btn btn-outline-primary btn-sm ${styles.recetaBtn}`}>Ver receta</Link>
            </div>
        </article>
    );
};

export default RecipeCard;
