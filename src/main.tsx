import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { NavBar } from './components/navbar/navbar'


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <NavBar />
        <App />

    </StrictMode>,
)