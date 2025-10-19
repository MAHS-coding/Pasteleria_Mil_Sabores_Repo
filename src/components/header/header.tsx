// src/components/header/header.tsx
import React from 'react';
import './header.css';

const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="header-content">
                <h1>El arte de endulzar momentos</h1>
                <p>Repostería artesanal con amor y dedicación desde 2020 💕</p>
            </div>
        </header>
    );
};

export default Header;
