import React from 'react';

const Terminos: React.FC = () => {
    const updated = new Date().toLocaleDateString();
    return (
        <main className="container py-4">
            <h1 className="h3 mb-3">Términos y Condiciones</h1>

            <div className="card p-3">
                <p className="mb-3">Bienvenido a <strong>Pastelería Mil Sabores</strong>. Aquí encontrarás los términos y condiciones que rigen el uso de nuestro sitio web y nuestros servicios. Por favor, lee atentamente esta información antes de realizar cualquier compra o utilizar nuestros servicios.</p>

                <h2 className="h6 mt-3">1. Uso del sitio web</h2>
                <p>El acceso y uso de este sitio web implica la aceptación de estos términos y condiciones. Pastelería Mil Sabores se reserva el derecho de modificar, actualizar o eliminar cualquier contenido sin previo aviso. El usuario se compromete a utilizar el sitio conforme a la ley y a no emplearlo para fines ilícitos o que vulneren derechos de terceros.</p>

                <h2 className="h6 mt-3">2. Compras y pedidos</h2>
                <p>Las compras realizadas a través de nuestro sitio web están sujetas a la disponibilidad de productos y a la confirmación del pedido. Nos reservamos el derecho de rechazar o cancelar pedidos por motivos de stock, errores en los datos proporcionados, inconsistencias en el precio o cualquier otra razón justificada. En caso de cancelación, contactaremos al cliente y, si corresponde, reembolsaremos los importes ya pagados según el método de pago utilizado.</p>

                <h2 className="h6 mt-3">3. Precios y pagos</h2>
                <p>Todos los precios publicados incluyen impuestos cuando así se indica y pueden estar sujetos a cambios sin previo aviso. Los pagos se realizan a través de los métodos habilitados en el sitio y deben ser confirmados para procesar el pedido. No nos hacemos responsables por transacciones fallidas causadas por errores en plataformas externas de pago.</p>

                <h2 className="h6 mt-3">4. Entregas y retiros</h2>
                <p>Las entregas y retiros se realizan en los horarios y zonas indicadas en el sitio. Pastelería Mil Sabores no se responsabiliza por retrasos ocasionados por causas de fuerza mayor, eventos climáticos, problemas logísticos de terceros o por información incorrecta proporcionada por el cliente. El cliente debe revisar y confirmar la dirección de entrega al realizar el pedido.</p>

                <h2 className="h6 mt-3">5. Devoluciones y reembolsos</h2>
                <p>Dado que ofrecemos productos alimenticios, las devoluciones solo se aceptan en caso de productos defectuosos, con errores en el pedido o incumplimiento comprobable de lo solicitado. Si recibes un producto en condiciones inadecuadas, notifícanos dentro de las 24 horas siguientes a la recepción indicando el problema y adjuntando evidencia (fotografías). Evaluaremos cada caso y, de corresponder, procederemos a reembolso o reposición conforme a nuestra política interna.</p>

                <h2 className="h6 mt-3">6. Propiedad intelectual</h2>
                <p>Todo el contenido, imágenes, textos, diseños, marcas y elementos gráficos presentes en este sitio web son propiedad de Pastelería Mil Sabores o de terceros que nos han autorizado su uso. Queda prohibida la reproducción, distribución, transformación o comunicación pública de dichos contenidos sin autorización previa y por escrito.</p>

                <h2 className="h6 mt-3">7. Privacidad y protección de datos</h2>
                <p>La información personal proporcionada por los usuarios será tratada conforme a nuestra Política de Privacidad. No compartimos datos personales con terceros salvo cuando sea necesario para cumplir pedidos (por ejemplo, servicios de entrega o pago) o por requerimiento legal. Recomendamos revisar nuestra Política de Privacidad para más detalles sobre derechos y procedimientos de acceso, rectificación o eliminación.</p>

                <h2 className="h6 mt-3">8. Contacto</h2>
                <p>Para consultas, reclamos o sugerencias, puedes contactarnos a través del formulario disponible en la sección de Contacto o al correo electrónico indicado en el sitio. Intentaremos responder a la brevedad posible según la naturaleza de la consulta.</p>

                <h2 className="h6 mt-3">9. Legislación aplicable</h2>
                <p>Estos términos y condiciones se rigen por la legislación chilena. Cualquier controversia derivada de la interpretación o cumplimiento de estos términos será sometida a los tribunales competentes de Chile.</p>

                <p className="small text-secondary mt-3">Última actualización: {updated}</p>
            </div>
        </main>
    );
}

export default Terminos;
