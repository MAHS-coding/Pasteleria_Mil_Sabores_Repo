import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

type Venta = { 
    productId?: string; 
    qty?: number; 
    price?: number; 
    tsISO?: string;
    // Nuevos campos para VentaResumen
    fecha?: string;
    productoCodigo?: string;
    cantidadVendida?: number;
    ingresosTotal?: number | string;
};
type Product = { code?: string; productName?: string; nombre?: string };

function daysInMonthLabels(d: Date) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const n = new Date(y, m + 1, 0).getDate();
    const labels: string[] = [];
    for (let i = 1; i <= n; i++) labels.push(String(i));
    return labels;
}

// Simple collapsible Section component used by the charts
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [open, setOpen] = React.useState(true);
    return (
        <div className="mb-3 border rounded bg-white shadow-sm">
            <button
                className="w-100 text-start px-3 py-2 border-bottom bg-light d-flex justify-content-between align-items-center"
                onClick={() => setOpen((s) => !s)}
                type="button"
            >
                <span className="fw-semibold">{title}</span>
                <span style={{ fontSize: 18 }}>{open ? '▾' : '▸'}</span>
            </button>
            {open && <div className="p-3">{children}</div>}
        </div>
    );
};

export default function Charts({ ventas = [], catalogo = [], ordenes = [], usuarios = [] }: { ventas?: Venta[]; catalogo?: Product[]; ordenes?: any[]; usuarios?: any[] }) {
    const today = new Date();
    const labels = useMemo(() => daysInMonthLabels(today), [today]);

    const ventasPorDia = useMemo(() => {
        const map = new Array(labels.length).fill(0);
        for (const v of ventas) {
            try {
                // Soportar ambos formatos: antiguo (tsISO) y nuevo (fecha)
                const fechaStr = v.tsISO || v.fecha;
                const d = fechaStr ? new Date(fechaStr) : null;
                if (!d) continue;
                if (d.getFullYear() !== today.getFullYear() || d.getMonth() !== today.getMonth()) continue;
                const day = d.getDate();
                // Calcular monto: ingresosTotal (nuevo) o qty * price (antiguo)
                const monto = (v.ingresosTotal !== undefined) 
                    ? Number(v.ingresosTotal) 
                    : (Number(v.qty || 0) * Number(v.price || 0));
                map[day - 1] += monto;
            } catch { }
        }
        return map;
    }, [ventas, labels, today]);

    const topProducts = useMemo(() => {
        const m = new Map<string, number>();
        for (const v of ventas) {
            // Soportar ambos formatos: productId (antiguo) y productoCodigo (nuevo)
            const id = String(v.productoCodigo || v.productId || '');
            // Cantidad: cantidadVendida (nuevo) o qty (antiguo)
            const cantidad = Number(v.cantidadVendida !== undefined ? v.cantidadVendida : (v.qty || 0));
            m.set(id, (m.get(id) || 0) + cantidad);
        }
        const arr = Array.from(m.entries()).map(([id, qty]) => ({ id, qty }));
        arr.sort((a, b) => b.qty - a.qty);
        const top = arr.slice(0, 6);
        const labels = top.map((t) => {
            const p = (catalogo || []).find((c: any) => String(c.code) === String(t.id));
            return p ? (p.productName || p.nombre || String(t.id)) : String(t.id);
        });
        const values = top.map((t) => t.qty);
        return { labels, values };
    }, [ventas, catalogo]);

    // Order statuses (from ordenes) for doughnut
    const orderStatusCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const o of ordenes || []) {
            const s = String((o as any).status || (o as any).estado || 'pendiente');
            counts[s] = (counts[s] || 0) + 1;
        }
        return counts;
    }, [ordenes]);

    // Categories summary from catalogo
    const categoriesSummary = useMemo(() => {
        const m = new Map<string, number>();
        for (const p of catalogo || []) {
            const c = String((p as any).category || (p as any).categoria || 'Sin categoría');
            m.set(c, (m.get(c) || 0) + 1);
        }
        const labels = Array.from(m.keys());
        const values = Array.from(m.values());
        return { labels, values };
    }, [catalogo]);

    const lineData = {
        labels,
        datasets: [
            {
                label: `Ventas (${today.toLocaleString('es-CL', { month: 'long', year: 'numeric' })})`,
                data: ventasPorDia,
                fill: true,
                backgroundColor: 'rgba(59,130,246,0.08)',
                borderColor: 'rgba(59,130,246,0.9)',
                tension: 0.3,
            },
        ],
    };

    const barData = {
        labels: topProducts.labels.length ? topProducts.labels : ['Sin datos'],
        datasets: [
            {
                label: 'Unidades vendidas',
                data: topProducts.values.length ? topProducts.values : [0],
                backgroundColor: 'rgba(16,185,129,0.9)',
            },
        ],
    };

    const doughnutData = {
        labels: Object.keys(orderStatusCounts).length ? Object.keys(orderStatusCounts) : ['Sin datos'],
        datasets: [
            {
                data: Object.keys(orderStatusCounts).length ? Object.values(orderStatusCounts) : [0],
                backgroundColor: ['#8ecae6', '#219ebc', '#ffb703', '#fb8500', '#d00000'],
            },
        ],
    };

    const categoriesBar = {
        labels: categoriesSummary.labels.length ? categoriesSummary.labels : ['Sin datos'],
        datasets: [
            {
                label: 'Productos por categoría',
                data: categoriesSummary.values.length ? categoriesSummary.values : [0],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
        ],
    };

    return (
        <div className="row">
            <div className="col-12 py-3">
                <Section title={`Ventas por día (CLP)`}>
                    <div>
                        <div className="small text-secondary mb-2">Usuarios: {usuarios?.length || 0} • Órdenes: {ordenes?.length || 0}</div>
                        <h6 className="mb-2">Ventas por día (CLP)</h6>
                        <Line data={lineData} />
                    </div>
                </Section>

                <Section title={`Productos más vendidos (unidades)`}>
                    <div>
                        <h6 className="mb-2">Productos más vendidos (unidades)</h6>
                        <Bar data={barData} />
                    </div>
                </Section>

                <Section title={`Pedidos por estado`}>
                    <div>
                        <h6 className="mb-2">Pedidos por estado</h6>
                        <Doughnut data={doughnutData} />
                    </div>
                </Section>

                <Section title={`Productos por categoría`}>
                    <div>
                        <h6 className="mb-2">Productos por categoría</h6>
                        <Bar data={categoriesBar} />
                    </div>
                </Section>
            </div>
        </div>
    );
}
