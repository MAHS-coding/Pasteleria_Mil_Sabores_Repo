import httpClient from "./httpClient.ts";

export type VentaDiariaDto = {
    id?: number | string;
    fecha?: string; // LocalDate as ISO string
    productoCodiogo?: string; // Nota: typo en el backend
    productoNombre?: string;
    cantidadVendida?: number;
    ingresosTotal?: number | string;
};

export type VentaResumen = {
    fecha: string;
    productoCodigo: string;
    productoNombre: string;
    cantidadVendida: number;
    ingresosTotal: number;
};

function dtoToVentaResumen(dto: VentaDiariaDto): VentaResumen {
    return {
        fecha: String(dto.fecha || ""),
        productoCodigo: String(dto.productoCodiogo || ""),
        productoNombre: String(dto.productoNombre || ""),
        cantidadVendida: Number(dto.cantidadVendida || 0),
        ingresosTotal: Number(dto.ingresosTotal || 0),
    };
}

/**
 * Obtiene ventas de una fecha específica
 * @param fecha Fecha en formato ISO (YYYY-MM-DD)
 */
export async function fetchVentasPorFecha(fecha: string): Promise<VentaResumen[]> {
    try {
        const response = await httpClient.get(`/api/ventas-diarias/fecha/${encodeURIComponent(fecha)}`);
        const items = Array.isArray(response.data) ? response.data : [];
        return items.map(dtoToVentaResumen);
    } catch (error) {
        console.error("Error fetching ventas por fecha:", error);
        return [];
    }
}

/**
 * Obtiene ventas en un rango de fechas
 * @param fechaInicio Fecha inicial (ISO format: YYYY-MM-DD)
 * @param fechaFin Fecha final (ISO format: YYYY-MM-DD)
 */
export async function fetchVentasEnRango(fechaInicio: string, fechaFin: string): Promise<VentaResumen[]> {
    try {
        const response = await httpClient.get(
            `/api/ventas-diarias?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}`
        );
        const items = Array.isArray(response.data) ? response.data : [];
        return items.map(dtoToVentaResumen);
    } catch (error) {
        console.error("Error fetching ventas en rango:", error);
        return [];
    }
}

/**
 * Obtiene todas las ventas diarias (sin filtros)
 * Requiere parámetros fechaInicio y fechaFin o usa rango por defecto
 */
export async function fetchVentasDiarias(): Promise<VentaResumen[]> {
    try {
        // Obtener ventas del mes actual por defecto
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const fechaInicio = inicioMes.toISOString().split("T")[0];
        const fechaFin = hoy.toISOString().split("T")[0];
        
        return fetchVentasEnRango(fechaInicio, fechaFin);
    } catch (error) {
        console.error("Error fetching ventas diarias:", error);
        return [];
    }
}

/**
 * Obtiene ventas de un producto específico
 * @param codigoProducto Código del producto
 */
export async function fetchVentasPorProducto(codigoProducto: string): Promise<VentaResumen[]> {
    try {
        const response = await httpClient.get(`/api/ventas-diarias/producto/${encodeURIComponent(codigoProducto)}`);
        const items = Array.isArray(response.data) ? response.data : [];
        return items.map(dtoToVentaResumen);
    } catch (error) {
        console.error("Error fetching ventas por producto:", error);
        return [];
    }
}

/**
 * Obtiene ventas de un producto en un rango de fechas
 * @param codigoProducto Código del producto
 * @param fechaInicio Fecha inicial (ISO format: YYYY-MM-DD)
 * @param fechaFin Fecha final (ISO format: YYYY-MM-DD)
 */
export async function fetchVentasProductoEnRango(
    codigoProducto: string,
    fechaInicio: string,
    fechaFin: string
): Promise<VentaResumen[]> {
    try {
        const response = await httpClient.get(
            `/api/ventas-diarias/producto/${encodeURIComponent(codigoProducto)}/rango?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}`
        );
        const items = Array.isArray(response.data) ? response.data : [];
        return items.map(dtoToVentaResumen);
    } catch (error) {
        console.error("Error fetching ventas producto en rango:", error);
        return [];
    }
}

/**
 * Registra una nueva venta diaria
 */
export async function registrarVenta(payload: {
    fecha: string;
    productoCodiogo: string;
    cantidadVendida: number;
    ingresosTotal: number | string;
}): Promise<VentaResumen | null> {
    try {
        const response = await httpClient.post("/api/ventas-diarias", payload);
        return response.data ? dtoToVentaResumen(response.data) : null;
    } catch (error) {
        console.error("Error registering venta:", error);
        return null;
    }
}

/**
 * Obtiene el total de ingresos de un período
 */
export async function fetchTotalIngresosPeriodo(fechaInicio: string, fechaFin: string): Promise<number> {
    try {
        const ventas = await fetchVentasEnRango(fechaInicio, fechaFin);
        return ventas.reduce((total, venta) => total + venta.ingresosTotal, 0);
    } catch (error) {
        console.error("Error calculating total ingresos:", error);
        return 0;
    }
}

/**
 * Agrupa ventas por producto
 */
export async function fetchVentasAgrupPorProducto(fechaInicio: string, fechaFin: string): Promise<Map<string, VentaResumen[]>> {
    try {
        const ventas = await fetchVentasEnRango(fechaInicio, fechaFin);
        const grouped = new Map<string, VentaResumen[]>();
        ventas.forEach((venta) => {
            if (!grouped.has(venta.productoCodigo)) {
                grouped.set(venta.productoCodigo, []);
            }
            grouped.get(venta.productoCodigo)!.push(venta);
        });
        return grouped;
    } catch (error) {
        console.error("Error grouping ventas por producto:", error);
        return new Map();
    }
}

export default {
    fetchVentasPorFecha,
    fetchVentasEnRango,
    fetchVentasDiarias,
    fetchVentasPorProducto,
    fetchVentasProductoEnRango,
    registrarVenta,
    fetchTotalIngresosPeriodo,
    fetchVentasAgrupPorProducto,
};
