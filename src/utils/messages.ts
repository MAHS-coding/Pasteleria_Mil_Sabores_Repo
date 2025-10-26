// Centralized user-facing messages (titles and common strings)

export const STOCK_INSUFICIENTE_TITLE = "Stock insuficiente";
export const STOCK_INSUFICIENTE_MSG = "No hay stock disponible para este producto.";

export const STOCK_LIMITADO_TITLE = "Stock limitado";
export function stockLimitAdjusted(qty: number, subject = "este producto") {
  const s = qty === 1 ? "unidad" : "unidades";
  return `Se ajustó ${subject} a ${qty} ${s} por disponibilidad.`;
}

export const CANTIDAD_AJUSTADA_TITLE = "Cantidad ajustada por stock";
export function soloQuedanUnidades(qty: number) {
  const s = qty === 1 ? "unidad" : "unidades";
  return `Solo quedan ${qty} ${s} disponibles.`;
}
export function seSolicitaranMensajes(qty: number) {
  const s = qty === 1 ? "mensaje" : "mensajes";
  return `Se solicitarán ${qty} ${s}.`;
}

export const CARRITO_VACIO_TITLE = "Carrito vacío";
export const CARRITO_VACIO_MSG = "No hay productos en el carrito.";
