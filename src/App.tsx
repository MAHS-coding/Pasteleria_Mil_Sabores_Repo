import type { CSSProperties } from "react"

const nombre="Wacoldo"
let apellido="Soto"

const juegos:string[]=['Lol','Starcraft','Age of Empires','Roblox']

const isRestricted=true

const direccion={
    "calle":"Av. Falsa",
    "numero_dir":12
}

const valor=5;
const val2=2;

const micolor='whitesmoke'

const miestilo:CSSProperties={
    backgroundColor:'teal',
    padding:10,
    color:micolor,
}

export function App() {
    return (
        <>
            <div style={miestilo}>
                <h1 style={{
                    
                    fontFamily:"Verdana",
                    

                }}>Mi aplicación de Ejemplo</h1>
                <p style={{fontFamily:"monospace"}}>Usar React es la cumbia...</p>
            </div>
            <div>
                <h3>Datos del Usuario</h3>
                <p>Nombre: {nombre}</p>
                <p>Apellido: {apellido}</p>
                
                <h5>Dirección</h5>
                <p>{direccion.calle} {direccion.numero_dir}</p>

                <h4>Dirección con JSON</h4>
                <p>{JSON.stringify(direccion)}</p>
                <h4>Cálculo directo</h4>
                <p>{(valor+val2)*2}</p>
            </div>
            <h2>Juegos</h2>
            <p>{juegos.join(', ')}</p>
            <p>Restricción: {isRestricted? "Restringido" : "No Restringido"}</p>           
        </>
    )
}