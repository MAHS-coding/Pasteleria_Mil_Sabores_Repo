import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MiAplicacion } from './miApp'
import { NavBar } from './navbar'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NavBar/>
    <MiAplicacion/>

  </StrictMode>,
)