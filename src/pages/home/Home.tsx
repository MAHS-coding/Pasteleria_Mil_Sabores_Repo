import React from 'react';
import './Home.css';

const Home: React.FC = () => {
    return (
        <main className="home">
            <section className="hero">
                <h1>Bienvenido a Pastelería Mil Sabores 🍰</h1>
                <p>Disfruta nuestras tortas, postres y dulces únicos</p>
                <img src="/images/background/fondo.jpg" alt="Fondo principal" />
            </section>
        </main>
    );
};

export default Home;
