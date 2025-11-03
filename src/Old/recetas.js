// Recetas de la semana (idénticas a las del blog)
const recetas = [
    {
        id: "cheesecake",
        titulo: "Cheesecake clásico sin horno",
        resumen: "Base de galleta, relleno cremoso y topping de frutas. 20 min + frío.",
        ingredientes: "200g galletas, 100g mantequilla, 400g queso crema, 200ml crema, 100g azúcar, 1 sobre gelatina sin sabor, frutas frescas",
        preparacion: "1. Tritura las galletas y mézclalas con la mantequilla derretida. Forra la base de un molde y refrigera.\n2. Hidrata la gelatina según instrucciones.\n3. Bate el queso crema con el azúcar, añade la crema y la gelatina disuelta.\n4. Vierte la mezcla sobre la base y refrigera 4 horas.\n5. Decora con frutas frescas antes de servir.",
        imagen: "/img/Blog/cheesecake_sin_horno.jpg",
        badge: "Sin horno",
        badgeClass: "text-bg-warning"
    },
    {
        id: "brownies",
        titulo: "Brownies húmedos en 1 bowl",
        resumen: "Textura fudge, cacao intenso y pocos ingredientes. 30 minutos.",
        ingredientes: "200g chocolate, 150g mantequilla, 3 huevos, 100g azúcar, 80g harina",
        preparacion: "1. Derretir el chocolate y la mantequilla.\n2. Batir los huevos con el azúcar.\n3. Mezclar todo y hornear a 180°C por 25 minutos.",
        imagen: "/img/Blog/Brownies.jpg",
        badge: "Económica",
        badgeClass: "text-bg-success"
    },
    {
        id: "tiramisu",
        titulo: "Tiramisú casero",
        resumen: "Capas de bizcotelas, café y crema suave. Montaje en 15 minutos.",
        ingredientes: "200g bizcotelas, 250g queso mascarpone, 2 huevos, 80g azúcar, 1 taza café fuerte, cacao en polvo",
        preparacion: "1. Batir las yemas con el azúcar y añadir el mascarpone.\n2. Batir las claras a nieve y mezclar suavemente.\n3. Remojar bizcotelas en café y alternar capas con la crema.\n4. Refrigerar 2 horas y espolvorear cacao antes de servir.",
        imagen: "/img/Blog/Tiramisu.jpg",
        badge: "Avanzado",
        badgeClass: "text-bg-primary"
    }
];

// Obtener el parámetro de la receta desde la URL
function getRecetaIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('receta');
}

// Buscar receta por ID
function buscarReceta(id) {
    return recetas.find(r => r.id === id);
}

// Mostrar receta en el HTML
function mostrarReceta(receta) {
    if (!receta) {
        document.getElementById('titulo-receta').textContent = "Receta no encontrada";
        document.getElementById('detalle-receta').textContent = "";
        document.getElementById('imagen-receta').style.display = "none";
        return;
    }
    const ingredientesArray = receta.ingredientes.split(',').map(i => i.trim());
    const ingredientesHtml = `<ul>${ingredientesArray.map(i => `<li>${i}</li>`).join('')}</ul>`;

    document.getElementById('titulo-receta').textContent = receta.titulo;
    document.getElementById('detalle-receta').innerHTML = `
        <strong>Ingredientes:</strong><br>${ingredientesHtml}
        <strong>Preparación:</strong><br>${receta.preparacion.replace(/\n/g, "<br>")}
    `;
    const img = document.getElementById('imagen-receta');
    if (img) {
        img.src = receta.imagen || "";
        img.alt = "Imagen de " + receta.titulo;
        img.style.display = receta.imagen ? "block" : "none";
    }
}

function mostrarOtrasRecetas(recetaActualId) {
    const row = document.getElementById('otras-recetas-row');
    if (!row) return;
    row.innerHTML = recetas
        .filter(r => r.id !== recetaActualId)
        .map(r => `
            <div class="col-md-4">
                <article class="card h-100 shadow-sm recetas-card">
                    <img src="${r.imagen}" class="card-img-top" alt="${r.titulo}" style="aspect-ratio:4/3;object-fit:cover;">
                    <div class="card-body">
                        ${r.badge ? `<span class="badge ${r.badgeClass} mb-2">${r.badge}</span>` : ""}
                        <h3 class="h5">${r.titulo}</h3>
                        <div class="mb-2">
                            <strong>Ingredientes:</strong>
                            <ul>${r.ingredientes.split(',').map(i => `<li>${i.trim()}</li>`).join('')}</ul>
                        </div>
                        <a href="recetas.html?receta=${r.id}" class="btn btn-outline-primary btn-sm">Ver receta</a>
                    </div>
                </article>
            </div>
        `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const recetaId = getRecetaIdFromUrl();
    const receta = buscarReceta(recetaId);
    mostrarReceta(receta);
    mostrarOtrasRecetas(recetaId);
});

