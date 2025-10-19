import React from 'react';
import Navbar from './components/navbar/Navbar';
import Header from './components/header/Header';
import Home from './pages/home/Home';
import Footer from './components/footer/Footer';

export function App() {
    return (
    <>
    <Navbar />
    <Header />
    <Home />
    <Footer />
    </>
    );
}