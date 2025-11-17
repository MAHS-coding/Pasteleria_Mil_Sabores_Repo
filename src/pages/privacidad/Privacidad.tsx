import React from 'react';

const Privacidad: React.FC = () => {
    const updated = new Date().toLocaleDateString();
    return (
        <main className="container py-4">
            <h1 className="h3 mb-3">Política de Privacidad</h1>

            <div className="card p-3">
                <p className="mb-3">En <strong>Pastelería Mil Sabores</strong> valoramos y protegemos la privacidad de nuestros usuarios. A continuación, te explicamos cómo recopilamos, usamos y protegemos tu información personal.</p>

                <h2 className="h6 mt-3">1. Información que recopilamos</h2>
                <p>Recopilamos información personal que tú nos proporcionas al registrarte, realizar compras, contactarnos o interactuar con nuestro sitio web. Esto puede incluir nombre, correo electrónico, dirección, teléfono y datos de pago.</p>

                <h2 className="h6 mt-3">2. Uso de la información</h2>
                <p>Utilizamos tu información para procesar pedidos, responder consultas, mejorar nuestros servicios y enviarte información relevante sobre productos, promociones y novedades.</p>

                <h2 className="h6 mt-3">3. Protección de datos</h2>
                <p>Implementamos medidas de seguridad para proteger tu información personal contra accesos no autorizados, alteraciones o divulgaciones. Solo el personal autorizado puede acceder a tus datos.</p>

                <h2 className="h6 mt-3">4. Compartir información</h2>
                <p>No compartimos tu información personal con terceros, salvo por requerimiento legal o para procesar pagos y entregas a través de proveedores de servicios confiables.</p>

                <h2 className="h6 mt-3">5. Cookies y tecnologías similares</h2>
                <p>Utilizamos cookies para mejorar la experiencia de navegación y analizar el uso del sitio. Puedes configurar tu navegador para rechazar cookies, aunque esto podría afectar el funcionamiento del sitio.</p>

                <h2 className="h6 mt-3">6. Derechos del usuario</h2>
                <p>Tienes derecho a acceder, rectificar o eliminar tu información personal. Para ejercer estos derechos, contáctanos a través de nuestro formulario de Contacto.</p>

                <h2 className="h6 mt-3">7. Cambios en la política</h2>
                <p>Nos reservamos el derecho de modificar esta política en cualquier momento. Te recomendamos revisarla periódicamente para estar informado sobre cómo protegemos tu información.</p>

                <h2 className="h6 mt-3">8. Contacto</h2>
                <p>Si tienes dudas o inquietudes sobre nuestra política de privacidad, escríbenos a través de nuestro formulario de Contacto.</p>

                <p className="small text-secondary mt-3">Última actualización: {updated}</p>
            </div>
        </main>
    );
}

export default Privacidad;
