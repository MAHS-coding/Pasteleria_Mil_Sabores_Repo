// Importa React para usar componentes funcionales
import React from "react";
// Importa los estilos específicos de la página de inicio
import "./Home.css";

// Componente funcional Home: representa la página principal del sitio
const Home: React.FC = () => {
    return (
        // <main> define la sección principal del contenido de la página
        <main className="home">
            {/* Título principal de bienvenida */}
            <h1>Bienvenido a Pastelería Mil Sabores 🍰</h1>

            {/* Subtítulo descriptivo */}
            <p>Descubre nuestras tortas, postres y dulces hechos con amor.</p>

            {/* Imagen principal o banner (hero section) */}
            <img
                src="/images/background/fondo.jpg" // Ruta de la imagen de fondo
                alt="Fondo de la pastelería"        // Texto alternativo accesible
                className="hero-img"               // Clase CSS para aplicar estilos
            />
        </main>
    );
};

// Exporta el componente para ser utilizado en App.tsx u otras rutas
export default Home;
