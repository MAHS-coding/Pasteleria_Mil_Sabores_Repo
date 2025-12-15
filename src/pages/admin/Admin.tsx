import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../components/ui/Modal";
import Charts from "../../components/admin/Charts";
import type { Product } from "../../types/product";
import slugify from "../../utils/slugify";
import { formatearRun } from "../../utils/validation";
import { useAuth } from "../../context/AuthContext";
import { isAdminEmail } from "../../utils/roles";
import { fetchOrders, fetchAdminOrders } from "../../services/pedidosService";
import type { OrderResponse } from "../../services/pedidosService";
import {
    fetchAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    dtoToProduct,
    productToDto,
} from "../../services/productosService";
import { fetchAllCategories, createCategoria } from "../../services/categoriasService";
import { fetchVentasEnRango } from "../../services/ventasService";
import type { VentaResumen } from "../../services/ventasService";
import { fetchAllUsers, toggleUserActive } from "../../services/userService";
import './Admin.module.css';

type Usuario = {
    id: number;
    rut?: string;
    nombre?: string;
    apellido?: string;
    correo?: string;
    password?: string;
    fechaNacimiento?: string | null;
    rol?: string;
    bloqueado?: boolean;
    creadoEn?: string;
    protegido?: boolean;
};

type Orden = {
    id: number | string;
    tsISO?: string;
    fecha?: string;
    usuarioId?: number | string;
    usuarioCorreo?: string;
    total?: number;
    items?: Array<{ productId?: string; code?: string; qty?: number; cantidad?: number; price?: number }>;
    discounts?: any;
    status?: string;
    freeCakeApplied?: boolean;
    freeCakeAmount?: number;
    freeCakeTortaKey?: string;
    discountAppliedPercent?: number;
    lifetimeDiscountAppliedPercent?: number;
    subtotal?: number;
    discountAmount?: number;
    purchaserRun?: string;
    purchaserNombre?: string;
    purchaserApellidos?: string;
    purchaserCorreo?: string;
    purchaserTelefono?: string;
};

// Helpers generales (adaptación TS)
const CLP = (v: number | string | undefined | null) => Number(v || 0).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const today = new Date();
const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const isSameDay = (iso?: string | null, ref = startOfDay) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
};
const timeHHMM = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) : "");
const dateCL = (iso?: string | Date) => (iso instanceof Date ? iso : new Date(iso || Date.now())).toLocaleDateString("es-CL");
const yyyymm = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const yyyy = (d: Date) => `${d.getFullYear()}`;

const ROLES = Object.freeze({ ADMIN: "Administrador", VENDEDOR: "Vendedor", CLIENTE: "Cliente", SUPERADMIN: "SuperAdmin" });

const validarEmailPermitido = (email?: string) => {
    const e = String(email || "").toLowerCase();
    return ["@duoc.cl", "@profesor.duoc.cl", "@gmail.com"].some((dom) => e.endsWith(dom));
};
const limpiarRut = (rut?: string) => String(rut || "").trim().toUpperCase().replace(/[^0-9K]/g, "");
function dvRut(numero: number) {
    let M = 0,
        S = 1;
    for (; numero; numero = Math.floor(numero / 10)) S = (S + (numero % 10) * (9 - (M++ % 6))) % 11;
    return S ? String(S - 1) : "K";
}
function validarRut(rut?: string) {
    const r = limpiarRut(rut);
    if (r.length < 7 || r.length > 9) return false;
    const cuerpo = r.slice(0, -1),
        dv = r.slice(-1);
    if (!/^\d+$/.test(cuerpo)) return false;
    return dvRut(Number(cuerpo)) === dv;
}

// Loaders (localStorage-first)
// Note: initCatalogLocal is no longer used - products are loaded from backend via fetchAllProducts
/*
function initCatalogLocal_DEPRECATED(seed: Product[], key = "catalogo"): Product[] {
    try {
        let cat = getJSON<Product[] | null>(key) || null;
        if (!Array.isArray(cat) || cat.length === 0) {
            const seedArr = Array.isArray(seed) ? seed : [];
            cat = seedArr.map((p) => ({
                ...p,
                stock: Number.isFinite((p as any).stock) ? (p as any).stock : 10,
                stockCritico: Number.isFinite((p as any).stockCritico) ? (p as any).stockCritico : 5,
                capacidadDiaria: Number.isFinite((p as any).capacidadDiaria) ? (p as any).capacidadDiaria : 20,
            } as any));
            setJSON(key, cat);
        } else {
            cat = cat.map((p: any) => ({
                ...p,
                stock: Number.isFinite(p.stock) ? p.stock : 10,
                stockCritico: Number.isFinite(p.stockCritico) ? p.stockCritico : 5,
                capacidadDiaria: Number.isFinite(p.capacidadDiaria) ? p.capacidadDiaria : 20,
            }));
            setJSON(key, cat);
        }
        return cat as Product[];
    } catch {
        return Array.isArray(seed) ? (seed as Product[]) : [];
    }
}
*/

// Usuarios y órdenes se cargan desde la API, no desde localStorage

function adaptOrderResponse(payload: OrderResponse): Orden {
    const baseTs = payload.createdAt || payload.tsISO || payload.fechaPedido;
    const tsISO = baseTs || new Date().toISOString();
    const items = (payload.items || []).map((it) => {
        const code = String(it.productoCodigo ?? it.productCode ?? "").trim();
        const qty = Number(it.cantidad ?? it.qty ?? 0);
        const price = Number(it.precioUnitario ?? it.price ?? it.precio ?? 0);
        return {
            productId: code || undefined,
            code: code || undefined,
            cantidad: qty,
            qty,
            price,
        };
    });
    const discounts = payload.discounts ? { ...payload.discounts } : undefined;
    return {
        id: payload.pedidoId || payload.id || "",
        tsISO,
        fecha: baseTs,
        usuarioCorreo: payload.usuarioCorreo || payload.purchaserCorreo,
        total: payload.total,
        items,
        discounts,
        status: payload.status,
        freeCakeApplied: payload.freeCakeApplied,
        freeCakeAmount: payload.freeCakeAmount,
        freeCakeTortaKey: payload.freeCakeTortaKey ?? (payload.discounts?.freeCakeTortaKey ?? undefined),
        discountAppliedPercent: payload.discountAppliedPercent,
        lifetimeDiscountAppliedPercent: payload.lifetimeDiscountAppliedPercent,
        subtotal: payload.subtotal,
        discountAmount: payload.discountAmount,
        purchaserRun: payload.purchaserRun,
        purchaserNombre: payload.purchaserNombre,
        purchaserApellidos: payload.purchaserApellidos,
        purchaserCorreo: payload.purchaserCorreo,
        purchaserTelefono: payload.purchaserTelefono,
    };
}

/*
function loadVentas_DEPRECATED() {
    // Note: loadVentas is no longer used - ventas are loaded from backend via fetchVentasEnRango
    let v = getJSON<any[]>("ventas");
    if (!Array.isArray(v)) {
        const ords = loadOrdenes();
        v = [];
        for (const o of ords) {
            for (const it of o.items || []) {
                v.push({
                    productId: it.productId ?? it.code,
                    qty: Number(it.qty || it.cantidad || 0),
                    price: Number(it.price || 0),
                    tsISO: (o.tsISO as string) || (o.fecha as string) || new Date().toISOString(),
                });
            }
        }
    }
    return v;
}
*/

// Órdenes y ventas se cargan desde la API

// Admin page component
const Admin: React.FC = () => {
    const [section, setSection] = useState<string>(() => {
        try {
            const allowed = new Set(["dashboard", "productos", "usuarios", "ordenes", "reportes"]);
            const hash = (typeof window !== "undefined" ? window.location.hash.replace("#", "") : "") || "";
            const stored = (typeof window !== "undefined" ? sessionStorage.getItem("admin.section") : null) || "";
            const first = hash && allowed.has(hash) ? hash : stored && allowed.has(stored) ? stored : "dashboard";
            return first;
        } catch {
            return "dashboard";
        }
    });
    const [confirm, setConfirm] = useState<{ show: boolean; title?: string; body?: React.ReactNode; onConfirm?: () => void; confirmLabel?: string; cancelLabel?: string }>({ show: false });

    const [catalogo, setCatalogo] = useState<Product[]>([]);
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [categoriasApi, setCategoriasApi] = useState<Array<{ id?: number | string; slug: string; label: string }>>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [ventas, setVentas] = useState<VentaResumen[]>([]);
    const { user } = useAuth();
    const isAdminUser = useMemo(() => isAdminEmail(user?.email), [user?.email]);
    const persistCatalog = (items: Product[]) => {
        setCatalogo(items);
    };
    const updateCatalog = (updater: (prev: Product[]) => Product[]) => {
        setCatalogo((prev) => {
            const next = updater(prev);
            return next;
        });
    };

    // Todos los datos se cargan desde la API, no desde localStorage

    // Load usuarios from API instead of localStorage
    useEffect(() => {
        if (!isAdminUser) {
            return;
        }
        let active = true;
        (async () => {
            try {
                const remoteUsers = await fetchAllUsers();
                if (!active) return;
                const mapped: Usuario[] = (remoteUsers || []).map((raw: any) => ({
                    id: Number(raw.id || raw.userId || 0) || Math.random() * 100000,
                    rut: raw.run,
                    nombre: raw.nombre || raw.name,
                    apellido: raw.apellidos || raw.lastname,
                    correo: raw.correo || raw.email,
                    password: undefined,
                    fechaNacimiento: raw.fechaNacimiento || raw.birthdate,
                    rol: raw.tipoUsuario || raw.role || ROLES.CLIENTE,
                    bloqueado: raw.activo === false || raw.blocked === true,
                    creadoEn: raw.createdAt,
                    protegido: String(raw.correo || raw.email || '').toLowerCase() === 'pasteleriamilsabores.fm@gmail.com',
                } as Usuario));
                setUsuarios(mapped);
            } catch (error) {
                console.error("No se pudieron cargar los usuarios desde el backend.", error);
                // Si falla la API, mostrar lista vacía
                if (!active) return;
                setUsuarios([]);
            }
        })();
        return () => { active = false; };
    }, [isAdminUser]);

    useEffect(() => {
        if (!user?.email) return;
        let active = true;
        setCatalogError(null);
        setCatalogLoading(true);
        (async () => {
            try {
                const remote = await fetchAllProducts();
                if (!active) return;
                const mapped = remote.map(dtoToProduct);
                persistCatalog(mapped);
            } catch (error) {
                console.error("No se pudieron cargar los productos desde el backend.", error);
                if (!active) return;
                setCatalogError("No se pudo sincronizar el catálogo.");
            } finally {
                if (active) setCatalogLoading(false);
            }
        })();
        return () => { active = false; };
    }, [user?.email]);

    // Load categorías desde API
    useEffect(() => {
        if (!user?.email) return;
        let active = true;
        (async () => {
            try {
                const remote = await fetchAllCategories();
                if (!active) return;
                const normalized = (remote || []).map((c) => ({
                    id: c.id,
                    slug: c.slug,
                    label: c.label,
                }));
                setCategoriasApi(normalized);
            } catch (error) {
                console.error("No se pudieron cargar las categorías desde el backend.", error);
                if (!active) return;
                setCategoriasApi([]);
            }
        })();
        return () => { active = false; };
    }, [user?.email]);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const remote = isAdminUser ? await fetchAdminOrders() : await fetchOrders();
                if (!active) return;
                const adapted = (remote || []).map(adaptOrderResponse);
                setOrdenes(adapted);
            } catch (error) {
                console.error("No se pudieron cargar las órdenes desde el backend.", error);
            }
        })();
        return () => { active = false; };
    }, [isAdminUser]);

    useEffect(() => {
        if (!user?.email) return;
        let active = true;
        (async () => {
            try {
                const hoy = new Date();
                const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                const fechaInicio = inicioMes.toISOString().split("T")[0];
                const fechaFin = hoy.toISOString().split("T")[0];
                
                const remoteVentas = await fetchVentasEnRango(fechaInicio, fechaFin);
                if (!active) return;
                setVentas(remoteVentas || []);
            } catch (error) {
                console.error("No se pudieron cargar las ventas desde el backend.", error);
                if (!active) return;
                setVentas([]);
            }
        })();
        return () => { active = false; };
    }, [user?.email]);

    // Keep admin section in URL hash and session storage so browser Back navigates within Admin
    useEffect(() => {
        try { sessionStorage.setItem("admin.section", section); } catch {}
        const currentHash = (typeof window !== "undefined" ? window.location.hash.replace("#", "") : "") || "";
        if (typeof window !== "undefined" && currentHash !== section) {
            const newUrl = `${window.location.pathname}#${section}`;
            window.history.pushState({ adminSection: section }, "", newUrl);
        }
    }, [section]);

    // Initialize hash on first load and listen to hash/popstate to sync section
    useEffect(() => {
        if (typeof window === "undefined") return;
        // Ensure hash reflects current section without adding a new history entry
        const initHash = window.location.hash.replace("#", "");
        if (!initHash) {
            window.history.replaceState({ adminSection: section }, "", `${window.location.pathname}#${section}`);
        }
        const onHashOrPop = () => {
            const h = window.location.hash.replace("#", "");
            if (h) setSection(h);
        };
        window.addEventListener("hashchange", onHashOrPop);
        window.addEventListener("popstate", onHashOrPop);
        return () => {
            window.removeEventListener("hashchange", onHashOrPop);
            window.removeEventListener("popstate", onHashOrPop);
        };
    }, []);

    // Dashboard derived values
    const productosStockBajo = (catalogo || []).filter((p: any) => Number(p.stock || 0) <= 5);
    const bajo = productosStockBajo.length;
    
    // Calcular ventas y totales del mes desde ventas diarias
    const ventasMes = ventas.filter((v: any) => {
        const fechaVenta = String(v.fecha || "").slice(0, 7);
        return fechaVenta === yyyymm(today);
    });
    const totalUnidMes = ventasMes.reduce((a: number, v: any) => a + Number(v.cantidadVendida || 0), 0);
    const totalCLPMes = ventasMes.reduce((a: number, v: any) => a + Number(v.ingresosTotal || 0), 0);

    // Use `ordenes` state (if available) to compute orders and totals for the month.
    const ordenesMes = (ordenes || []).filter((o: any) => {
        const iso = String(o.tsISO || o.fecha || o.fechaPedido || o.fechaOrder || "");
        return iso.slice(0, 7) === yyyymm(today);
    });
    const totalCLPMesFromOrders = ordenesMes.reduce((a: number, o: any) => a + Number(o.total || 0), 0);
    const ordMes = ordenesMes.length || ventasMes.length || 1;
    const totalCLPFinal = totalCLPMesFromOrders > 0 ? totalCLPMesFromOrders : totalCLPMes;
    const ticket = totalCLPFinal / ordMes;

    const countAdmins = usuarios.filter((u) => u.rol === ROLES.ADMIN).length;
    const countVendedores = usuarios.filter((u) => u.rol === ROLES.VENDEDOR).length;
    const countClientes = usuarios.filter((u) => u.rol === ROLES.CLIENTE).length;



    // Usuarios helpers
    const parseAge = (u: Usuario) => {
        const f = (u as any).fechaNacimiento || (u as any).nacimiento || null;
        if (!f) return null;
        const d = new Date(f);
        const time = d.getTime();
        if (Number.isNaN(time)) return null;
        const t = new Date();
        let age = t.getFullYear() - d.getFullYear();
        const m = t.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
        return Number.isFinite(age) ? age : null;
    };
    const domainOf = (email = "") => String(email).toLowerCase().split("@")[1] || "";
    const isDuoc = (u: Usuario) => ["duoc.cl", "profesor.duoc.cl"].includes(domainOf(u.correo));
    const isMayor75 = (u: Usuario) => {
        const a = parseAge(u);
        return a !== null && a >= 50; // ahora mayores de 50
    };
    const isNormalCliente = (u: Usuario) => u.rol === ROLES.CLIENTE && !isDuoc(u) && !isMayor75(u);

    // Usuarios state (tabla derecha ajustes)
    const [filtroTipo, setFiltroTipo] = useState(() => {
        try { return sessionStorage.getItem("admin.usuarios.filtroTipo") || "clientes"; } catch { return "clientes"; }
    });
    const [orderDesc, setOrderDesc] = useState<boolean>(() => {
        try {
            const v = sessionStorage.getItem("admin.usuarios.orderDesc");
            return v == null ? true : v === "true";
        } catch { return true; }
    });
    useEffect(() => { try { sessionStorage.setItem("admin.usuarios.filtroTipo", String(filtroTipo)); } catch {} }, [filtroTipo]);
    useEffect(() => { try { sessionStorage.setItem("admin.usuarios.orderDesc", String(orderDesc)); } catch {} }, [orderDesc]);

    function handleUserRoleChange(id: number, value: string) {
        const u = usuarios.find((x) => x.id === id);
        if (!u) return;
        if (u.rol === ROLES.SUPERADMIN || u.rol === ROLES.ADMIN) return; // UI ya lo bloquea
        if (u.rol === value) return;
        const prevRol = u.rol || "";
        setConfirm({
            show: true,
            title: "Confirmar cambio de rol",
            body: (
                <div>
                    ¿Cambiar el rol de <strong>{u.nombre || u.correo || u.id}</strong> de <strong>{prevRol}</strong> a <strong>{value}</strong>?
                </div>
            ),
            confirmLabel: "Cambiar rol",
            cancelLabel: "Cancelar",
            onConfirm: () => {
                setUsuarios((prev) => {
                    const next = prev.map((ux) => (ux.id === id ? { ...ux, rol: value } : ux));
                    // El rol se actualiza en el estado local; la persistencia en BD se haría mediante una API
                    return next;
                });
                setConfirm({ show: false });
            },
        });
    }
    function handleUserBlockToggle(id: number, checked: boolean) {
        const u = usuarios.find((x) => x.id === id);
        if (!u) return;
        if (u.rol === ROLES.SUPERADMIN) {
            setConfirm({ show: true, title: "Bloqueo no permitido", body: <div className="text-danger">No se puede bloquear un usuario SuperAdmin.</div> });
            return;
        }
        const accion = checked ? "Bloquear" : "Desbloquear";
        setConfirm({
            show: true,
            title: "Confirmar cambio de bloqueo",
            body: (
                <div>
                    ¿{accion} a <strong>{u.nombre || u.correo || u.id}</strong>? El usuario {checked ? "no podrá" : "podrá"} comprar.
                </div>
            ),
            confirmLabel: accion,
            cancelLabel: "Cancelar",
            onConfirm: async () => {
                const run = u.rut || "";
                if (!run) {
                    setConfirm({ show: false });
                    return;
                }
                try {
                    // Enviar al backend: activo=true para usuario activo, activo=false para bloqueado
                    const result = await toggleUserActive(run, !checked);
                    if (result) {
                        // Actualizar el estado local con la respuesta del servidor
                        setUsuarios((prev) => {
                            const next = prev.map((ux) => {
                                if (ux.id === id) {
                                    return { ...ux, bloqueado: result.activo === false };
                                }
                                return ux;
                            });
                            return next;
                        });
                    }
                } catch (err) {
                    console.error('Error al actualizar bloqueo en backend:', err);
                } finally {
                    setConfirm({ show: false });
                }
            },
        });
    }
    function requestDeleteUser(u: Usuario) {
        // confirm via Modal
            if (u.rol === ROLES.SUPERADMIN) {
                setConfirm({ show: true, title: "Eliminar usuario", body: <div className="text-danger"><i className="bi bi-shield-lock" /> No se puede eliminar un usuario SuperAdmin.</div> });
                return;
            }
        const tieneOrdenes = ordenes.some((o) => String(o.usuarioId) === String(u.id) || String(o.usuarioCorreo || "") === String(u.correo || ""));
        if (tieneOrdenes) {
            setConfirm({ show: true, title: "Confirmar eliminación", body: <div className="text-danger"><i className="bi bi-exclamation-triangle" /> No se puede eliminar este usuario porque tiene órdenes registradas.</div> });
            return;
        }
        setConfirm({
            show: true,
            title: "Confirmar eliminación",
            body: (
                <div>
                    ¿Eliminar la cuenta de <strong>{u.nombre || ""}</strong> ({u.correo})? Esta acción no se puede deshacer.
                </div>
            ),
            onConfirm: () => {
                setUsuarios((prev) => {
                    const next = prev.filter((x) => x.id !== u.id && x.rut !== u.rut);
                    return next;
                });
                setConfirm({ show: false });
            },
        });
    }

    // Productos: vendidas hoy y producibles
    const vendidasHoy = useMemo(() => {
        const m = new Map<string, number>();
        const hoyStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
        for (const v of ventas) {
            const fechaVenta = String(v.fecha || "");
            if (fechaVenta !== hoyStr) continue;
            const id = String(v.productoCodigo || (v as any).productId || "");
            const cantidad = Number(v.cantidadVendida !== undefined ? v.cantidadVendida : (v as any).qty || 0);
            m.set(id, (m.get(id) || 0) + cantidad);
        }
        return m;
    }, [ventas]);

    function SectionDashboard() {
        return (
            <>
                <div className="d-flex flex-wrap align-items-center justify-content-between mb-3">
                    <div>
                        <h1 className="h4 mb-1">Dashboard</h1>
                        <div className="text-secondary small">Resumen de {today.toLocaleString("es-CL", { month: "long", year: "numeric" })}</div>
                    </div>
                </div>

                <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6 col-xl-3">
                        <div className="card stat-card h-100 dashboard-productos-card" style={{ cursor: "pointer" }} onClick={() => setSection("productos")}>
                            <div className="card-body d-flex justify-content-between align-items-center">
                                <div><div className="text-secondary small">Productos totales</div><div className="fs-4 fw-semibold">{catalogo.length}</div></div>
                                <i className="bi bi-box-seam icon" />
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-xl-3">
                        <div className="card stat-card h-100 dashboard-stockbajo-card" style={{ cursor: "pointer" }} onClick={() => setSection("productos")}>
                            <div className="card-body">
                                <div className="text-secondary small">Stock bajo (≤ 5)</div>
                                <div className="fs-4 fw-semibold mb-2">{bajo}</div>
                                <ul className="list-unstyled mb-0" style={{ maxHeight: 120, overflowY: "auto" }}>
                                    {productosStockBajo.length === 0 ? (
                                        <li className="text-muted small">Sin productos críticos</li>
                                    ) : (
                                        productosStockBajo.map((p: any) => (
                                            <li key={p.code}>
                                                {p.nombre || p.name || p.productName || "Producto"} <span className="badge bg-danger">{p.stock}</span>
                                            </li>
                                        ))
                                    )}
                                </ul>
                                <i className="bi bi-exclamation-triangle icon position-absolute end-0 bottom-0 m-3" />
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-xl-3">
                        <div className="card stat-card h-100 dashboard-unidadesvendidas-card" style={{ cursor: "pointer" }} onClick={() => setSection("reportes")}>
                            <div className="card-body d-flex justify-content-between align-items-center">
                                <div><div className="text-secondary small">Unidades vendidas (mes)</div><div className="fs-4 fw-semibold">{totalUnidMes}</div></div>
                                <i className="bi bi-graph-up-arrow icon" />
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-xl-3">
                        <div className="card stat-card h-100 dashboard-ticketpromedio-card" style={{ cursor: "pointer" }} onClick={() => setSection("ordenes")}>
                            <div className="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-secondary small">Ticket promedio (mes)</div>
                                    <div className="fs-5 fw-semibold">{CLP(ticket)}</div>
                                    <div className="small text-secondary">Basado en {ordMes} orden(es) este mes</div>
                                </div>
                                <i className="bi bi-receipt icon" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-3">
                    <div className="col-12 col-md-3">
                        <div className="card h-100 dashboard-usuarios-card" style={{ cursor: "pointer" }} onClick={() => setSection("usuarios")}>
                            <div className="card-body">
                                <div className="text-secondary small">Usuarios</div>
                                <div className="fs-3 fw-semibold">{usuarios.length}</div>
                                <div className="small mt-2 text-secondary">Admins: {countAdmins} • Vendedores: {countVendedores} • Clientes: {countClientes}</div>
                            </div>
                        </div>
                    </div>

                    
                </div>

                <div className="row g-3 mb-3">
                    <div className="col-12">
                        <Charts ventas={ventas} catalogo={catalogo} ordenes={ordenes} usuarios={usuarios} />
                    </div>
                </div>

            </>
        );
    }

        function SectionProductos() {
            const [sub, setSub] = useState<'catalogo'|'agregar'|'editar'|'eliminar'|'stock'|'categorias'>(() => {
                try {
                    const v = sessionStorage.getItem("admin.productos.sub") as any;
                    const allowed = ["catalogo","agregar","editar","eliminar","stock","categorias"];
                    return allowed.includes(v) ? v : "catalogo";
                } catch { return "catalogo"; }
            });
            useEffect(() => { try { sessionStorage.setItem("admin.productos.sub", sub); } catch {} }, [sub]);

            const [addMsg, setAddMsg] = useState<{text:string; ok:boolean|null}>({text:"", ok:null});
            const [editMsg, setEditMsg] = useState<{text:string; ok:boolean|null}>({text:"", ok:null});
            const [delMsg, setDelMsg] = useState<{text:string; ok:boolean|null}>({text:"", ok:null});
            const [stkMsg, setStkMsg] = useState<{text:string; ok:boolean|null}>({text:"", ok:null});
            
            // Extraer categorías desde API (con id) y complementar con catálogo
            const categoryOptions = useMemo(() => {
                const map = new Map<string, { label: string; id?: number | string }>();
                (categoriasApi || []).forEach((c) => {
                    if (!c?.slug) return;
                    map.set(c.slug, { label: c.label || c.slug, id: c.id });
                });
                (catalogo || []).forEach((p: any) => {
                    const categoryId = p.categoryId || p.categoriaId;
                    const categoryName = p.categoryLabel || p.nombreCategoria || p.category || p.categoria;
                    if (!categoryName) return;
                    const slug = slugify(String(categoryName));
                    if (!map.has(slug)) {
                        map.set(slug, { label: categoryName, id: categoryId });
                    }
                });
                return Array.from(map.entries()).map(([slug, meta]) => ({
                    id: meta.id,
                    slug,
                    label: meta.label,
                }));
            }, [categoriasApi, catalogo]);

            const extractFriendlyError = (error: unknown): string => {
                if (error && typeof error === "object") {
                    const resp = (error as any).response;
                    if (resp && resp.data) {
                        const msg = resp.data.message || resp.data.error || resp.data.mensaje;
                        if (msg) return String(msg);
                    }
                    const dataMsg = (error as any).message;
                    if (dataMsg) return String(dataMsg);
                }
                return "";
            };

            // Add product state
            const [newProd, setNewProd] = useState<any>({ code: "", productName: "", price: "", category: "", img: "", desc: "", stock: 0, stockCritico: 5, capacidadDiaria: 20 });
                const [addCatMode, setAddCatMode] = useState<'existing'|'new'>("existing");
                const [addNewCat, setAddNewCat] = useState<string>("");

                // Helper: convierte File a DataURL (base64) para almacenar en localStorage
                const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
                    const fr = new FileReader();
                    fr.onload = () => resolve(String(fr.result || ''));
                    fr.onerror = () => reject(new Error('Error leyendo archivo'));
                    fr.readAsDataURL(file);
                });

                const categories = useMemo(() => {
                    const set = new Set<string>();
                    (catalogo || []).forEach((p:any) => {
                        const c = String(p.category || p.categoria || '').trim();
                        if (c) set.add(c);
                    });
                    return Array.from(set).sort((a,b)=>a.localeCompare(b));
                }, [catalogo]);

                const availableCategoryOptions = useMemo(() => {
                    const map = new Map<string, { label: string; id?: number | string }>();
                    categoryOptions.forEach((opt) => {
                        const slug = String(opt.slug || '').trim();
                        if (!slug) return;
                        map.set(slug, { label: opt.label || slug, id: opt.id });
                    });
                    categories.forEach((slug) => {
                        if (!slug) return;
                        if (!map.has(slug)) {
                            map.set(slug, { label: slug.replace(/-/g, " ") });
                        }
                    });
                    return Array.from(map.entries()).map(([slug, meta]) => ({ slug, label: meta.label, id: meta.id }));
                }, [categoryOptions, categories]);

                useEffect(() => {
                    if (availableCategoryOptions.length === 0) {
                        setAddCatMode('new');
                    }
                }, [availableCategoryOptions]);
                const categorySelectPlaceholder = availableCategoryOptions.length ? 'Selecciona una categoría' : 'No hay categorías disponibles';
                const buildCategoryPayloadMeta = (slug: string, fallbackLabel?: string) => {
                    const normalized = String(slug || '').trim();
                    const option = availableCategoryOptions.find((opt) => String(opt.slug || '') === normalized);
                    let label = String(option?.label || fallbackLabel || normalized || '').trim();
                    if (!label) label = normalized.replace(/-/g, ' ') || 'sin-categoria';
                    let categoryId: number | undefined;
                    if (option?.id != null) {
                        if (typeof option.id === 'number') {
                            categoryId = option.id;
                        } else {
                            const parsed = Number(option.id);
                            if (Number.isFinite(parsed)) categoryId = parsed;
                        }
                    }
                    return { categoryId, categoryLabel: label, nombreCategoria: label };
                };

                function handleAddProduct(e: React.FormEvent) {
                e.preventDefault();
                setAddMsg({text:"", ok:null});
                    const code = String(newProd.code || '').trim();
                    const name = String(newProd.productName || '').trim();
                    const categoryInput = addCatMode === 'existing' ? String(newProd.category || '').trim() : String(addNewCat || '').trim();
                const price = Number(newProd.price);
                if (!code) return setAddMsg({text:"Debes ingresar un código único.", ok:false});
                if (!name) return setAddMsg({text:"Debes ingresar un nombre de producto.", ok:false});
                    if (!categoryInput) return setAddMsg({text:"Debes indicar una categoría.", ok:false});
                if (!Number.isFinite(price) || price <= 0) return setAddMsg({text:"Precio inválido.", ok:false});
                // Require either an image URL or an uploaded image (stored in newProd.img)
                if (!newProd.img || String(newProd.img).trim() === "") return setAddMsg({ text: "Debes adjuntar una imagen o indicar una URL de imagen.", ok: false });
                if ((catalogo || []).some(p => String(p.code) === code)) return setAddMsg({text:"Ya existe un producto con ese código.", ok:false});
                    const category = slugify(categoryInput);
                    const categoryMeta = buildCategoryPayloadMeta(category, categoryInput);
                const candidate: Product = {
                    code,
                    productName: name,
                    category,
                    categoryId: categoryMeta.categoryId,
                    categoriaId: categoryMeta.categoryId,
                    categoryLabel: categoryMeta.categoryLabel,
                    nombreCategoria: categoryMeta.nombreCategoria,
                    price,
                    img: String(newProd.img || ''),
                    desc: String(newProd.desc || ''),
                    stock: Number(newProd.stock || 0),
                    stockCritico: Number(newProd.stockCritico ?? 5),
                    capacidadDiaria: Number(newProd.capacidadDiaria ?? 20),
                };
                setConfirm({
                    show: true,
                    title: "Confirmar agregado",
                    body: (<div>¿Agregar el producto <strong>{candidate.productName}</strong> en la categoría <strong>{candidate.category}</strong> por <strong>{CLP(candidate.price)}</strong>?</div>),
                    confirmLabel: "Agregar",
                    cancelLabel: "Cancelar",
                    onConfirm: async () => {
                        try {
                            // Resolver/crear categoría y obtener id válido
                            let resolvedCategoryId = candidate.categoryId || candidate.categoriaId;
                            const selectedSlug = candidate.category;
                            const opt = availableCategoryOptions.find((o) => o.slug === selectedSlug);
                            if (!resolvedCategoryId && opt?.id != null) {
                                const parsed = Number(opt.id);
                                if (Number.isFinite(parsed)) resolvedCategoryId = parsed;
                            }
                            if (!resolvedCategoryId && addCatMode === 'new') {
                                const newCatName = String(addNewCat || candidate.categoryLabel || candidate.nombreCategoria || selectedSlug || "Categoria").trim();
                                const createdCat = await createCategoria(newCatName);
                                const createdId = (createdCat as any)?.id ?? (createdCat as any)?.idCategoria ?? (createdCat as any)?.categoria_id ?? (createdCat as any)?.categoriaId;
                                if (createdId != null) {
                                    resolvedCategoryId = Number(createdId);
                                    const slug = slugify(newCatName);
                                    setCategoriasApi((prev) => [...prev, { id: resolvedCategoryId, slug, label: newCatName }]);
                                }
                            }
                            if (!resolvedCategoryId) {
                                throw new Error("No se pudo resolver la categoría. Recarga categorías e intenta nuevamente.");
                            }
                            candidate.categoryId = resolvedCategoryId;
                            candidate.categoriaId = resolvedCategoryId;
                            const created = await createProduct(productToDto(candidate));
                            const added = dtoToProduct(created);
                            updateCatalog((prev) => [...prev, added]);
                            setAddMsg({text:`Producto "${added.productName}" agregado.`, ok:true});
                            setNewProd({ code: "", productName: "", price: "", category: "", img: "", desc: "", stock: 0, stockCritico: 5, capacidadDiaria: 20 });
                            setAddNewCat("");
                            setAddCatMode(availableCategoryOptions.length ? 'existing' : 'new');
                            setSub('catalogo');
                        } catch (error) {
                            console.error("Error al crear producto", error);
                            const detail = extractFriendlyError(error);
                            setAddMsg({ text: `No se pudo crear el producto${detail ? `: ${detail}` : ". Intenta nuevamente."}`, ok: false });
                        } finally {
                            setConfirm({ show: false });
                        }
                    },
                });
            }

            // Edit product (reuse selection)
            const [editCode, setEditCode] = useState<string>((catalogo[0] as any)?.code || "");
            const currentEdit = useMemo(() => (catalogo || []).find((p:any) => String(p.code) === String(editCode)), [catalogo, editCode]);
                const [editFields, setEditFields] = useState<any>({ productName:"", desc:"", price:"", stock:"", category:"", img:"", stockCritico:"", capacidadDiaria:"" });
                const [editCatMode, setEditCatMode] = useState<'existing'|'new'>("existing");
                const [editNewCat, setEditNewCat] = useState<string>("");
            useEffect(() => {
                if (!currentEdit) return;
                setEditFields({
                    productName: (currentEdit as any).productName || '',
                    desc: (currentEdit as any).desc || (currentEdit as any).descripcion || '',
                    price: (currentEdit as any).price ?? '',
                    stock: (currentEdit as any).stock ?? '',
                    category: (currentEdit as any).category || '',
                    img: (currentEdit as any).img || '',
                    stockCritico: (currentEdit as any).stockCritico ?? 5,
                    capacidadDiaria: (currentEdit as any).capacidadDiaria ?? 20,
                });
                    setEditCatMode('existing');
                    setEditNewCat('');
            }, [currentEdit]);

                function handleSaveEdit(e: React.FormEvent) {
                e.preventDefault();
                setEditMsg({text:"", ok:null});
                const target = (catalogo || []).find((p:any) => String(p.code) === String(editCode));
                if (!target) return setEditMsg({text:"Producto no encontrado.", ok:false});
                const newCategoryInput = editCatMode === 'existing' ? String(editFields.category || '').trim() : String(editNewCat || '').trim();
                if (!newCategoryInput) return setEditMsg({text:"Debes indicar una categoría (selecciona o crea una nueva).", ok:false});
                const newCategorySlug = slugify(newCategoryInput);
                const categoryMeta = buildCategoryPayloadMeta(newCategorySlug, newCategoryInput);
                const updatedProduct: Product = {
                    ...target,
                    productName: editFields.productName ? String(editFields.productName).trim() : target.productName,
                    desc: editFields.desc ?? target.desc ?? '',
                    category: newCategorySlug,
                    categoryId: categoryMeta.categoryId,
                    categoriaId: categoryMeta.categoryId,
                    categoryLabel: categoryMeta.categoryLabel,
                    nombreCategoria: categoryMeta.nombreCategoria,
                    img: editFields.img != null ? String(editFields.img || '') : target.img,
                    price: editFields.price !== "" ? Number(editFields.price) : target.price || 0,
                    stock: editFields.stock !== "" ? Number(editFields.stock) : target.stock,
                    stockCritico: editFields.stockCritico !== "" ? Number(editFields.stockCritico) : target.stockCritico,
                    capacidadDiaria: editFields.capacidadDiaria !== "" ? Number(editFields.capacidadDiaria) : target.capacidadDiaria,
                };
                setConfirm({
                    show: true,
                    title: "Confirmar edición",
                    body: (<div>¿Guardar cambios en <strong>{updatedProduct.productName || updatedProduct.code}</strong>?</div>),
                    confirmLabel: "Guardar",
                    cancelLabel: "Cancelar",
                    onConfirm: async () => {
                        try {
                            const saved = await updateProduct(editCode, productToDto(updatedProduct));
                            const synced = dtoToProduct(saved);
                            updateCatalog((prev) => prev.map((p) => (String(p.code) === String(editCode) ? synced : p)));
                            setEditMsg({text:"Cambios guardados.", ok:true});
                            setSub('catalogo');
                        } catch (error) {
                            console.error("Error actualizando producto", error);
                            setEditMsg({text:"No se pudo guardar el producto.", ok:false});
                        } finally {
                            setConfirm({ show: false });
                        }
                    },
                });
            }

            // Delete product
            const [delCode, setDelCode] = useState<string>((catalogo[0] as any)?.code || "");
            function handleDeleteProduct(e: React.FormEvent) {
                e.preventDefault();
                setDelMsg({text:"", ok:null});
                const target = (catalogo || []).find((p:any) => String(p.code) === String(delCode));
                if (!target) return setDelMsg({text:"Producto no encontrado.", ok:false});
                const nombre = target.productName || target.code;
                setConfirm({
                    show: true,
                    title: "Confirmar eliminación",
                    body: (<div>¿Eliminar el producto <strong>{nombre}</strong> ({delCode})?</div>),
                    confirmLabel: "Eliminar",
                    cancelLabel: "Cancelar",
                    onConfirm: async () => {
                        try {
                            await deleteProduct(delCode);
                            updateCatalog((prev) => prev.filter((p) => String(p.code) !== String(delCode)));
                            setDelMsg({text:"Producto eliminado.", ok:true});
                            setSub('catalogo');
                        } catch (error) {
                            console.error("Error eliminando producto", error);
                            setDelMsg({text:"No se pudo eliminar el producto.", ok:false});
                        } finally {
                            setConfirm({ show: false });
                        }
                    },
                });
            }

            // Stock adjust
            const [stkCode, setStkCode] = useState<string>((catalogo[0] as any)?.code || "");
            const [stkQty, setStkQty] = useState<number>(1);
            const [stkOp, setStkOp] = useState<'add'|'remove'>("add");
            const currentStock = useMemo(() => {
                const p = (catalogo || []).find((x:any) => String(x.code) === String(stkCode));
                return p ? Number((p as any).stock || 0) : 0;
            }, [catalogo, stkCode]);
            function handleStockChange(e: React.FormEvent) {
                e.preventDefault();
                setStkMsg({text:"", ok:null});
                const target = (catalogo || []).find((p:any) => String(p.code) === String(stkCode));
                if (!target) return setStkMsg({text:"Producto no encontrado.", ok:false});
                const base = Number(target.stock || 0);
                const q = Math.max(0, Number(stkQty || 0));
                if (stkOp === 'remove' && q > base) return setStkMsg({text:`No puedes eliminar más de las unidades disponibles. Stock actual: ${base}`, ok:false});
                const nuevo = stkOp === 'add' ? base + q : base - q;
                const nombre = target.productName || target.code;
                setConfirm({
                    show: true,
                    title: "Confirmar actualización de stock",
                    body: (<div>{stkOp==='add' ? 'Agregar' : 'Eliminar'} <strong>{q}</strong> unidades de <strong>{nombre}</strong>? (Stock: {base} → {nuevo})</div>),
                    confirmLabel: "Actualizar",
                    cancelLabel: "Cancelar",
                    onConfirm: async () => {
                        try {
                            const updated = { ...target, stock: nuevo } as Product;
                            const saved = await updateProduct(target.code, productToDto(updated));
                            const synced = dtoToProduct(saved);
                            updateCatalog((prev) => prev.map((p) => (String(p.code) === String(target.code) ? synced : p)));
                            setStkMsg({text:"Stock actualizado.", ok:true});
                            setSub('catalogo');
                        } catch (error) {
                            console.error("Error actualizando stock", error);
                            setStkMsg({text:"No se pudo actualizar el stock.", ok:false});
                        } finally {
                            setConfirm({ show: false });
                        }
                    },
                });
            }

            function CatalogTable() {
                return (
                    <div className="table-responsive">
                        <table className="table align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Código</th><th>Producto</th><th>Categoría</th>
                                    <th className="text-end">Precio</th><th className="text-end">Stock</th>
                                    <th className="text-end">Vendidas (hoy)</th>
                                    <th className="text-end">Capacidad día</th>
                                    <th className="text-end">Producibles hoy</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(catalogo || []).length === 0 ? (
                                    <tr><td colSpan={8}><div className="empty-state">Sin productos</div></td></tr>
                                ) : (
                                    (catalogo || []).map((p: any) => {
                                        const id = p.code;
                                        const vHoy = vendidasHoy.get(id) || 0;
                                        const prodHoy = Math.max(0, Number(p.capacidadDiaria || 20) - vHoy);
                                        const displayCategory = p.categoryLabel || p.nombreCategoria || p.category || p.categoria || '';
                                        return (
                                            <tr key={p.code}>
                                                <td>{p.code || ''}</td>
                                                <td>{p.productName || p.nombre || ''}</td>
                                                <td>{displayCategory}</td>
                                                <td className="text-end">{CLP(p.price || p.precio || 0)}</td>
                                                <td className="text-end">{Number(p.stock || 0)}</td>
                                                <td className="text-end">{vHoy}</td>
                                                <td className="text-end">{Number(p.capacidadDiaria || 20)}</td>
                                                <td className="text-end">{prodHoy}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            }

            return (
                <div className="card">
                            <div className="card-header bg-white d-flex flex-wrap gap-2 align-items-center">
                        <div className="btn-group" role="group" aria-label="Productos actions">
                            <button className={`btn btn-sm ${sub==='catalogo'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setSub('catalogo')}>Catálogo</button>
                            <button className={`btn btn-sm ${sub==='agregar'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setSub('agregar')}>Agregar</button>
                            <button className={`btn btn-sm ${sub==='editar'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setSub('editar')}>Editar</button>
                            <button className={`btn btn-sm ${sub==='eliminar'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setSub('eliminar')}>Eliminar</button>
                            <button className={`btn btn-sm ${sub==='stock'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setSub('stock')}>Stock</button>
                                    <button className={`btn btn-sm ${sub==='categorias'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setSub('categorias')}>Categorías</button>
                        </div>
                    </div>
                    <div className="card-body">
                        {catalogLoading && <div className="alert alert-info small mb-3">Sincronizando el catálogo con el backend…</div>}
                        {catalogError && <div className="alert alert-danger small mb-3">{catalogError}</div>}
                        {sub === 'catalogo' && <CatalogTable />}

                                    {sub === 'agregar' && (
                            <form className="row g-3" onSubmit={handleAddProduct}>
                                <div className="col-md-3"><label className="form-label">Código</label><input className="form-control" value={newProd.code} onChange={(e)=>setNewProd((p:any)=>({...p, code:e.target.value}))} required /></div>
                                <div className="col-md-5"><label className="form-label">Nombre</label><input className="form-control" value={newProd.productName} onChange={(e)=>setNewProd((p:any)=>({...p, productName:e.target.value}))} required /></div>
                                            <div className="col-md-4">
                                                <label className="form-label">Categoría</label>
                                                <select className="form-select" value={addCatMode==='existing' ? (newProd.category || '') : '__new__'} onChange={(e)=>{
                                                    const v = e.target.value;
                                                    if (v === '__new__') { setAddCatMode('new'); setNewProd((p:any)=>({...p, category:''})); }
                                                    else { setAddCatMode('existing'); setNewProd((p:any)=>({...p, category:v})); }
                                                }} required={addCatMode==='existing'}>
                                                        <option value="" disabled>{categorySelectPlaceholder}</option>
                                                        {availableCategoryOptions.map(opt => <option key={opt.slug} value={opt.slug}>{opt.label || opt.slug}</option>)}
                                                    <option value="__new__">+ Nueva categoría…</option>
                                                </select>
                                                {addCatMode==='new' && (
                                                    <div className="mt-2">
                                                        <input className="form-control" placeholder="Nombre nueva categoría" value={addNewCat} onChange={(e)=>setAddNewCat(e.target.value)} required />
                                                    </div>
                                                )}
                                            </div>
                                <div className="col-md-3"><label className="form-label">Precio</label><input type="number" min={0} className="form-control" value={newProd.price} onChange={(e)=>setNewProd((p:any)=>({...p, price:e.target.value}))} required /></div>
                                <div className="col-md-3"><label className="form-label">Stock inicial</label><input type="number" min={0} className="form-control" value={newProd.stock} onChange={(e)=>setNewProd((p:any)=>({...p, stock:Number(e.target.value)}))} /></div>
                                <div className="col-md-3"><label className="form-label">Stock crítico</label><input type="number" min={0} className="form-control" value={newProd.stockCritico} onChange={(e)=>setNewProd((p:any)=>({...p, stockCritico:Number(e.target.value)}))} /></div>
                                <div className="col-md-3"><label className="form-label">Capacidad diaria</label><input type="number" min={0} className="form-control" value={newProd.capacidadDiaria} onChange={(e)=>setNewProd((p:any)=>({...p, capacidadDiaria:Number(e.target.value)}))} /></div>
                                <div className="col-12"><label className="form-label">Descripción</label><textarea className="form-control" rows={2} value={newProd.desc} onChange={(e)=>setNewProd((p:any)=>({...p, desc:e.target.value}))} /></div>
                                <div className="col-md-6">
                                    <label className="form-label">URL imagen</label>
                                    <input className="form-control mb-2" placeholder="https://..." value={newProd.img} onChange={(e)=>setNewProd((p:any)=>({...p, img:e.target.value}))} />
                                    {newProd.img && (
                                        <div className="mt-2"><img src={newProd.img} alt="Preview" style={{ maxWidth: 160, maxHeight: 120 }} /></div>
                                    )}
                                </div>
                                <div className="col-12"><button className="btn btn-primary" type="submit">Agregar</button></div>
                                {addMsg.text && <div className={`col-12 ${addMsg.ok? 'text-success':'text-danger'}`}>{addMsg.text}</div>}
                            </form>
                        )}

                                    {sub === 'editar' && (
                            <form className="row g-3" onSubmit={handleSaveEdit}>
                                <div className="col-md-6">
                                    <label className="form-label">Producto</label>
                                    <select className="form-select" value={editCode} onChange={(e)=>setEditCode(e.target.value)} required>
                                        {(catalogo||[]).map((p:any)=>(<option key={p.code} value={p.code}>{p.productName || p.nombre}</option>))}
                                    </select>
                                </div>
                                <div className="col-md-6"><label className="form-label">Nombre</label><input className="form-control" value={editFields.productName} onChange={(e)=>setEditFields((f:any)=>({...f, productName:e.target.value}))} /></div>
                                            <div className="col-md-6">
                                                <label className="form-label">Categoría</label>
                                                <select className="form-select" value={editCatMode==='existing' ? (editFields.category || '') : '__new__'} onChange={(e)=>{
                                                    const v = e.target.value;
                                                    if (v === '__new__') { setEditCatMode('new'); }
                                                    else { setEditCatMode('existing'); setEditFields((f:any)=>({...f, category:v})); }
                                                }}>
                                                    <option value="" disabled>{categorySelectPlaceholder}</option>
                                                    {availableCategoryOptions.map(opt => <option key={opt.slug} value={opt.slug}>{opt.label || opt.slug}</option>)}
                                                    <option value="__new__">+ Nueva categoría…</option>
                                                </select>
                                                {editCatMode==='new' && (
                                                    <div className="mt-2">
                                                        <input className="form-control" placeholder="Nombre nueva categoría" value={editNewCat} onChange={(e)=>setEditNewCat(e.target.value)} required />
                                                    </div>
                                                )}
                                            </div>
                                <div className="col-md-6">
                                    <label className="form-label">URL imagen (o subir archivo)</label>
                                    <input className="form-control mb-2" placeholder="https://..." value={editFields.img} onChange={(e)=>setEditFields((f:any)=>({...f, img:e.target.value}))} />
                                    <input type="file" accept="image/*" className="form-control" onChange={(e)=>{
                                        const f = (e.target as HTMLInputElement).files && (e.target as HTMLInputElement).files![0];
                                        if (!f) return;
                                        fileToDataUrl(f).then((data) => setEditFields((p:any)=>({...p, img: data}))).catch(()=>{});
                                    }} />
                                    {editFields.img && (
                                        <div className="mt-2"><img src={editFields.img} alt="Preview" style={{ maxWidth: 160, maxHeight: 120 }} /></div>
                                    )}
                                </div>
                                <div className="col-12"><label className="form-label">Descripción</label><textarea className="form-control" rows={2} value={editFields.desc} onChange={(e)=>setEditFields((f:any)=>({...f, desc:e.target.value}))} /></div>
                                <div className="col-md-3"><label className="form-label">Precio</label><input type="number" className="form-control" min={0} value={String(editFields.price)} onChange={(e)=>setEditFields((f:any)=>({...f, price:e.target.value}))} /></div>
                                <div className="col-md-3"><label className="form-label">Stock</label><input type="number" className="form-control" min={0} value={String(editFields.stock)} onChange={(e)=>setEditFields((f:any)=>({...f, stock:e.target.value}))} /></div>
                                <div className="col-md-3"><label className="form-label">Stock crítico</label><input type="number" className="form-control" min={0} value={String(editFields.stockCritico)} onChange={(e)=>setEditFields((f:any)=>({...f, stockCritico:e.target.value}))} /></div>
                                <div className="col-md-3"><label className="form-label">Capacidad diaria</label><input type="number" className="form-control" min={0} value={String(editFields.capacidadDiaria)} onChange={(e)=>setEditFields((f:any)=>({...f, capacidadDiaria:e.target.value}))} /></div>
                                <div className="col-12"><button className="btn btn-primary" type="submit">Guardar cambios</button></div>
                                {editMsg.text && <div className={`col-12 ${editMsg.ok? 'text-success':'text-danger'}`}>{editMsg.text}</div>}
                            </form>
                        )}

                        {sub === 'eliminar' && (
                            <form className="row g-3" onSubmit={handleDeleteProduct}>
                                <div className="col-md-8">
                                    <label className="form-label">Producto</label>
                                    <select className="form-select" value={delCode} onChange={(e)=>setDelCode(e.target.value)} required>
                                        {(catalogo||[]).map((p:any)=>(<option key={p.code} value={p.code}>{p.productName || p.nombre}</option>))}
                                    </select>
                                </div>
                                <div className="col-md-4 d-flex align-items-end"><button className="btn btn-danger" type="submit">Eliminar</button></div>
                                {delMsg.text && <div className={`col-12 ${delMsg.ok? 'text-success':'text-danger'}`}>{delMsg.text}</div>}
                            </form>
                        )}

                        {sub === 'stock' && (
                            <form className="row g-3" onSubmit={handleStockChange}>
                                <div className="col-md-6">
                                    <label className="form-label">Producto</label>
                                    <div className="input-group">
                                        <select className="form-select" value={stkCode} onChange={(e)=>setStkCode(e.target.value)} required>
                                            {(catalogo||[]).map((p:any)=>(<option key={p.code} value={p.code}>{p.productName || p.nombre}</option>))}
                                        </select>
                                        <span className="input-group-text">Stock: {currentStock}</span>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Cantidad</label>
                                    <input type="number" className="form-control" min={1} value={stkQty} onChange={(e)=>setStkQty(Number(e.target.value))} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Acción</label>
                                    <select className="form-select" value={stkOp} onChange={(e)=>setStkOp(e.target.value as any)}>
                                        <option value="add">Agregar</option>
                                        <option value="remove">Eliminar</option>
                                    </select>
                                </div>
                                <div className="col-12"><button className="btn btn-primary" type="submit">Actualizar stock</button></div>
                                {stkMsg.text && <div className={`col-12 ${stkMsg.ok? 'text-success':'text-danger'}`}>{stkMsg.text}</div>}
                            </form>
                        )}

                                    {sub === 'categorias' && (
                                        <SectionCategorias />
                                    )}
                    </div>
                </div>
            );
        }

                    function SectionCategorias() {
                        const catList = useMemo(() => {
                            const map = new Map<string, number>();
                            (catalogo || []).forEach((p:any) => {
                                const c = String(p.category || '').trim();
                                if (!c) return;
                                map.set(c, (map.get(c) || 0) + 1);
                            });
                            return Array.from(map.entries()).map(([id,count]) => ({ id, label: id.replace(/-/g,' ').replace(/\b\w/g, (m)=>m.toUpperCase()), count }))
                                .sort((a,b)=>a.label.localeCompare(b.label));
                        }, [catalogo]);

                        const [selected, setSelected] = useState<string>(catList[0]?.id || "");
                        useEffect(()=>{ if (!selected && catList.length) setSelected(catList[0].id); }, [catList, selected]);

                        const [action, setAction] = useState<'reassign'|'delete-products'>("reassign");
                        const [targetMode, setTargetMode] = useState<'existing'|'new'>("existing");
                        const [target, setTarget] = useState<string>("");
                        const [targetNew, setTargetNew] = useState<string>("");
                        const [msg, setMsg] = useState<{text:string; ok:boolean|null}>({text:"", ok:null});

                        const otherCategories = useMemo(() => (catList || []).filter(c => c.id !== selected), [catList, selected]);

                        function handleDeleteCategory(e: React.FormEvent) {
                            e.preventDefault();
                            setMsg({text:"", ok:null});
                            const sel = String(selected || '').trim();
                            if (!sel) return setMsg({text:"Selecciona una categoría.", ok:false});
                            const productos = (catalogo || []).slice();
                            const hasAny = productos.some(p => String(p.category || '').trim() === sel);
                            if (!hasAny) {
                                setMsg({text:"La categoría no tiene productos asociados. Se quitará de la lista automáticamente.", ok:true});
                                return;
                            }

                            if (action === 'reassign') {
                                const targetInput = targetMode === 'existing' ? String(target||'').trim() : String(targetNew||'').trim();
                                if (!targetInput) return setMsg({text:"Debes indicar la nueva categoría.", ok:false});
                                const targetSlug = slugify(targetInput);
                                if (targetSlug === sel) return setMsg({text:"La nueva categoría no puede ser la misma.", ok:false});
                                updateCatalog((prev) => prev.map((p) => (String(p.category || '').trim() === sel ? { ...p, category: targetSlug } : p)));
                                setMsg({text:`Categoría reasignada a "${targetInput}".`, ok:true});
                            } else {
                                updateCatalog((prev) => prev.filter((p) => String(p.category || '').trim() !== sel));
                                setMsg({text:"Categoría eliminada junto con sus productos.", ok:true});
                            }
                        }

                        return (
                            <form className="row g-3" onSubmit={handleDeleteCategory}>
                                <div className="col-md-6">
                                    <label className="form-label">Categoría a eliminar</label>
                                    <div className="input-group">
                                        <select className="form-select" value={selected} onChange={(e)=>setSelected(e.target.value)} required>
                                            {catList.map(c => (
                                                <option key={c.id} value={c.id}>{c.label} ({c.count})</option>
                                            ))}
                                        </select>
                                        <span className="input-group-text">{(catList.find(c=>c.id===selected)?.count)||0} productos</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Acción</label>
                                    <select className="form-select" value={action} onChange={(e)=>setAction(e.target.value as any)}>
                                        <option value="reassign">Reasignar productos a otra categoría</option>
                                        <option value="delete-products">Eliminar productos de esta categoría</option>
                                    </select>
                                </div>

                                {action === 'reassign' && (
                                    <>
                                        <div className="col-md-6">
                                            <label className="form-label">Nueva categoría</label>
                                            <select className="form-select" value={targetMode==='existing' ? (target || '') : '__new__'} onChange={(e)=>{
                                                const v = e.target.value;
                                                if (v === '__new__') { setTargetMode('new'); setTarget(''); }
                                                else { setTargetMode('existing'); setTarget(v); }
                                            }}>
                                                <option value="" disabled>{otherCategories.length ? 'Selecciona una categoría' : 'No hay otras categorías'}</option>
                                                {otherCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                                <option value="__new__">+ Nueva categoría…</option>
                                            </select>
                                        </div>
                                        {targetMode === 'new' && (
                                            <div className="col-md-6">
                                                <label className="form-label">Nombre nueva categoría</label>
                                                <input className="form-control" value={targetNew} onChange={(e)=>setTargetNew(e.target.value)} required />
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="col-12">
                                    <button className={`btn ${action==='delete-products' ? 'btn-danger' : 'btn-primary'}`} type="submit">
                                        {action==='delete-products' ? 'Eliminar categoría y sus productos' : 'Reasignar y eliminar categoría'}
                                    </button>
                                </div>
                                {msg.text && <div className={`col-12 ${msg.ok? 'text-success':'text-danger'}`}>{msg.text}</div>}
                            </form>
                        );
                    }

    function SectionUsuarios() {
        // Crear vendedor form state (moved inside SectionUsuarios to avoid parent re-renders)
        const [ven, setVen] = useState({ rut: "", nombre: "", correo: "", pass: "", pass2: "", fechaNacimiento: "" });
        const [venMsg, setVenMsg] = useState<{ text: string; ok: boolean | null }>({ text: "", ok: null });

        // Max birthdate allowed (must be at least 18 years old)
        const _max = new Date();
        _max.setFullYear(_max.getFullYear() - 18);
        const maxBirthStr = _max.toISOString().split('T')[0];

        async function crearVendedor() {
            setVenMsg({ text: "", ok: null });
            const { rut, nombre, correo, pass, pass2, fechaNacimiento } = ven;
            if (pass !== pass2) return setVenMsg({ text: "Las contraseñas no coinciden.", ok: false });
            if (!pass || pass.length < 4) return setVenMsg({ text: "La contraseña debe tener al menos 4 caracteres.", ok: false });
            if (!rut || !validarRut(rut)) return setVenMsg({ text: "RUN inválido. Ej: 19011022K (sin puntos ni guión).", ok: false });
            if (!nombre || nombre.trim().length === 0 || nombre.length > 50) return setVenMsg({ text: "Nombre requerido (máx 50).", ok: false });
            if (!correo || !validarEmailPermitido(correo)) return setVenMsg({ text: "Correo no permitido. Usa @duoc.cl, @profesor.duoc.cl o @gmail.com.", ok: false });

            if (!fechaNacimiento) return setVenMsg({ text: "Fecha de nacimiento requerida.", ok: false });
            // Validate age >= 18
            try {
                const bd = new Date(fechaNacimiento);
                if (isNaN(bd.getTime())) return setVenMsg({ text: "Fecha de nacimiento inválida.", ok: false });
                const today = new Date();
                let age = today.getFullYear() - bd.getFullYear();
                const m = today.getMonth() - bd.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
                if (age < 18) return setVenMsg({ text: "El vendedor debe ser mayor de 18 años.", ok: false });
            } catch {
                return setVenMsg({ text: "Fecha de nacimiento inválida.", ok: false });
            }

            const lista = usuarios;
            const correoLower = String(correo || "").toLowerCase();
            const rutNormalized = limpiarRut(rut || "");

            const existsEmail = lista.find((u) => String(u.correo || "").toLowerCase() === correoLower);
            if (existsEmail) return setVenMsg({ text: "Ya existe un usuario con ese correo.", ok: false });

            const existsRut = lista.find((u) => String(u.rut || "") && String(limpiarRut(String(u.rut || ""))) === rutNormalized);
            if (existsRut) return setVenMsg({ text: "Ya existe un usuario con ese RUN.", ok: false });

            const hoy = new Date().toISOString();
            const nuevo: Usuario = {
                id: Date.now(),
                rut: rutNormalized,
                nombre: nombre.trim(),
                apellido: "",
                correo: correoLower,
                password: String(pass),
                fechaNacimiento: fechaNacimiento || null,
                rol: ROLES.VENDEDOR,
                bloqueado: false,
                creadoEn: hoy,
                protegido: false,
            };
            // El nuevo vendedor se crea en la API y se refleja al recargar la lista de usuarios
            // La validación de duplicados se hace contra la lista actual de usuarios de la API

            // Clear form on success
            setVen({ rut: "", nombre: "", correo: "", pass: "", pass2: "", fechaNacimiento: "" });
            setVenMsg({ text: `Vendedor creado: ${nuevo.nombre} (${nuevo.correo}). Ya puede iniciar sesión.`, ok: true });
        }

        const ADMIN_EMAIL_PROTEGIDO = "pasteleriamilsabores.fm@gmail.com";
        const isProtected = (u: Usuario) => Boolean(u.protegido) || String(u.correo || "").toLowerCase() === ADMIN_EMAIL_PROTEGIDO;

        const vendedores = usuarios.filter((u) => u.rol === ROLES.VENDEDOR);
        const countRoles = (rol: string) => usuarios.filter((u) => u.rol === rol).length;

            // filtros (rol y subfiltros para clientes)
            let list = usuarios.slice();
            if (filtroTipo === "todos") {
                // keep all
            } else if (filtroTipo === "vendedores") {
                list = list.filter((u) => u.rol === ROLES.VENDEDOR);
            } else if (filtroTipo === "admins") {
                list = list.filter((u) => u.rol === ROLES.ADMIN || u.rol === ROLES.SUPERADMIN);
            } else {
                // clientes + subfiltros
                list = list.filter((u) => u.rol === ROLES.CLIENTE);
                if (filtroTipo === "normal") list = list.filter(isNormalCliente);
                else if (filtroTipo === "duoc") list = list.filter(isDuoc);
                else if (filtroTipo === "mayor") list = list.filter(isMayor75);
                // filtroTipo === 'clientes' => sin subfiltro
            }
        // No search filter: removed per request
        const ageVal = (u: Usuario) => {
            const a = parseAge(u);
            return a === null ? -1 : a;
        };
        list.sort((a, b) => {
            const A = ageVal(a), B = ageVal(b);
            if (A === -1 && B === -1) return 0;
            if (A === -1) return 1;
            if (B === -1) return -1;
            return orderDesc ? B - A : A - B;
        });

        const RoleSelect: React.FC<{ u: Usuario }> = ({ u }) => {
            if (u.rol === ROLES.SUPERADMIN) {
                return (<select className="form-select form-select-sm" disabled><option>{ROLES.SUPERADMIN}</option></select>);
            }
            if (u.rol === ROLES.ADMIN) {
                return (<select className="form-select form-select-sm" disabled><option>{ROLES.ADMIN}</option></select>);
            }
            const disabled = isProtected(u);
            return (
                <select className="form-select form-select-sm" value={u.rol} disabled={disabled} onChange={(e) => handleUserRoleChange(u.id, e.target.value)}>
                    {[ROLES.ADMIN, ROLES.VENDEDOR, ROLES.CLIENTE].map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
            );
        };

        return (
            <div className="row g-3">
                <div className="col-12">
                    <div className="card mb-3">
                        <div className="card-body py-3">
                            <div className="text-secondary small">Admins</div>
                            <div className="fs-3 fw-semibold">{countRoles(ROLES.ADMIN)}</div>
                            <div className="text-secondary small mt-2">Vendedores</div>
                            <div className="fs-5 fw-semibold">{countRoles(ROLES.VENDEDOR)}</div>
                            <div className="text-secondary small mt-2">Clientes</div>
                            <div className="fs-5 fw-semibold">{countRoles(ROLES.CLIENTE)}</div>
                        </div>
                    </div>

                    <div className="card mb-3">
                        <div className="card-header bg-white d-flex justify-content-between">
                            <strong>Vendedores</strong>
                            <span className="badge text-bg-light">{vendedores.length}</span>
                        </div>
                        <div className="card-body py-3">
                            <div className="mb-2"><strong>Crear Vendedor</strong></div>
                            <div className="row g-2 align-items-end">
                                <div className="col-auto" style={{minWidth: 180}}>
                                    <label className="form-label small mb-1">RUN</label>
                                    <input
                                        className="form-control form-control-sm"
                                        inputMode="numeric"
                                        placeholder="12.345.678-9"
                                        maxLength={12}
                                        value={ven.rut}
                                        onChange={(e) => setVen((p) => ({ ...p, rut: formatearRun(e.target.value) }))}
                                    />
                                </div>
                                <div className="col-auto" style={{minWidth: 220}}>
                                    <label className="form-label small mb-1">Nombre</label>
                                    <input className="form-control form-control-sm" value={ven.nombre} onChange={(e) => setVen((p) => ({ ...p, nombre: e.target.value }))} />
                                </div>
                                <div className="col-auto" style={{minWidth: 220}}>
                                    <label className="form-label small mb-1">Correo</label>
                                    <input className="form-control form-control-sm" value={ven.correo} onChange={(e) => setVen((p) => ({ ...p, correo: e.target.value }))} />
                                </div>
                                <div className="col-auto" style={{minWidth: 170}}>
                                    <label className="form-label small mb-1">Fecha Nac.</label>
                                    <input type="date" className="form-control form-control-sm" max={maxBirthStr} value={ven.fechaNacimiento} onChange={(e) => setVen((p) => ({ ...p, fechaNacimiento: e.target.value }))} />
                                </div>
                                <div className="col-auto" style={{minWidth: 140}}>
                                    <label className="form-label small mb-1">Contraseña</label>
                                    <input type="password" className="form-control form-control-sm" value={ven.pass} onChange={(e) => setVen((p) => ({ ...p, pass: e.target.value }))} />
                                </div>
                                <div className="col-auto" style={{minWidth: 140}}>
                                    <label className="form-label small mb-1">Repetir</label>
                                    <input type="password" className="form-control form-control-sm" value={ven.pass2} onChange={(e) => setVen((p) => ({ ...p, pass2: e.target.value }))} />
                                </div>
                                <div className="col-auto">
                                    <button className="btn btn-sm btn-primary" type="button" onClick={crearVendedor}>Crear</button>
                                </div>
                                <div className="col-12 mt-2">
                                    {venMsg.text ? (
                                        <div className={venMsg.ok ? "text-success small" : "text-danger small"}>{venMsg.text}</div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-sm align-middle mb-0">
                                <thead className="table-light"><tr><th>Nombre</th><th>Correo</th><th>RUT</th></tr></thead>
                                <tbody>
                                    {vendedores.length ? vendedores.map((u) => (
                                        <tr key={u.id}><td>{u.nombre || ''} {u.apellido || ''}</td><td>{u.correo || ''}</td><td>{formatearRun(String(u.rut || ''))}</td></tr>
                                    )) : <tr><td colSpan={3} className="text-center text-secondary">Sin registros</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header bg-white d-flex flex-wrap gap-2 align-items-center justify-content-between">
                            <div><strong>Usuarios</strong></div>
                            <div className="d-flex gap-2 align-items-center">
                                <select className="form-select form-select-sm" style={{ width: 220 }} value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                                    <option value="clientes">Clientes</option>
                                    <option value="normal">Clientes (normales)</option>
                                    <option value="duoc">Clientes (DUOC)</option>
                                    <option value="mayor">Clientes (mayores 50)</option>
                                    <option value="vendedores">Vendedores</option>
                                    <option value="admins">Admins</option>
                                    <option value="todos">Todos</option>
                                </select>
                                <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setOrderDesc((p) => !p)}>
                                    Orden: Edad <span>{orderDesc ? "↓" : "↑"}</span>
                                </button>
                                <span className="badge text-bg-light">{list.length}</span>
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="table align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: 50 }}>#</th>
                                        <th>Nombre</th>
                                        <th>Correo</th>
                                        <th>RUT</th>
                                        <th>Edad</th>
                                        <th>Rol</th>
                                        <th className="text-center">Bloqueado</th>
                                        <th className="text-end" style={{ width: 70 }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.length ? list.map((u, i) => (
                                        <tr key={u.id}>
                                            <td>{i + 1}</td>
                                            <td>{u.nombre || ''} {u.apellido || ''}</td>
                                            <td>{u.correo || ''}</td>
                                            <td>{formatearRun(String(u.rut || ''))}</td>
                                            <td>{parseAge(u) ?? ''}</td>
                                            <td style={{ minWidth: 160 }}><RoleSelect u={u} /></td>
                                            <td className="text-center">
                                                <div className="form-check form-switch d-inline-block">
                                                    <input className="form-check-input" type="checkbox" role="switch" checked={!!u.bloqueado} disabled={isProtected(u) || u.rol === ROLES.SUPERADMIN} onChange={(e) => handleUserBlockToggle(u.id, e.target.checked)} />
                                                </div>
                                            </td>
                                            <td className="text-end" style={{ width: 70 }}>
                                                <button className="btn btn-sm btn-outline-danger" disabled={u.rol === ROLES.SUPERADMIN} onClick={() => requestDeleteUser(u)}><i className="bi bi-trash" /></button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={8} className="text-center text-secondary py-4">Sin usuarios</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function SectionOrdenes() {
        const byCode = new Map((catalogo || []).map((p: any) => [String(p.code), p]));
        const [expandedOrderId, setExpandedOrderId] = useState<number | string | null>(null);
        const [filtroOrdenes, setFiltroOrdenes] = useState('hoy');

        // Filtrar órdenes según el periodo seleccionado
        const ordenesFiltradas = ordenes.filter((o) => {
            const fechaOrden = o.tsISO || o.fecha || '';
            if (filtroOrdenes === 'hoy') return isSameDay(fechaOrden);
            if (filtroOrdenes === 'mes') return String(fechaOrden).slice(0, 7) === yyyymm(today);
            if (filtroOrdenes === 'anio') return String(fechaOrden).slice(0, 4) === yyyy(today);
            return true; // 'todas'
        });

        const itemsHTML = (it: Orden["items"]) => (
            (it || []).map((x, idx) => {
                const code = String(x.productId ?? x.code ?? '');
                const prod = byCode.get(code) as any;
                const name = prod ? (prod.productName || prod.nombre || code) : (code || '(desconocido)');
                const img = prod ? (prod.img || prod.image || prod.picture) : null;
                const qty = Number(x.qty || x.cantidad || 0);
                const unit = Number(x.price || 0);
                const subtotal = qty * unit;
                return (
                    <li key={idx} className="list-group-item d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            {img ? <img src={img} alt={name} style={{ width: 48, height: 48, objectFit: 'cover', marginRight: 12, borderRadius: 6 }} /> : <div style={{ width: 48, height: 48, marginRight: 12, background: '#f5f5f5', borderRadius: 6 }} />}
                            <div>
                                <div className="fw-semibold">{name}</div>
                                <div className="small text-secondary">x{qty} • {CLP(unit)}</div>
                            </div>
                        </div>
                        <div className="fw-semibold">{CLP(subtotal)}</div>
                    </li>
                );
            })
        );

        const rows = ordenesFiltradas.flatMap((o) => {
            const names = (o.items || []).map((it: any) => {
                const code = String(it.productId ?? it.code ?? '');
                const p = byCode.get(code);
                return p ? (p.productName || p.nombre || code) : code;
            });
            const namesShort = names.length ? names.slice(0, 2).join(', ') + (names.length > 2 ? ' …' : '') : '';
            const totalItems = (o.items || []).reduce((a: number, x: any) => a + Number(x.qty || x.cantidad || 0), 0);
            const isExpanded = expandedOrderId === o.id;

            const mainRow = (
                <tr key={String(o.id)}>
                    <td>{timeHHMM((o.tsISO as string) || (o.fecha as string))}</td>
                    <td>
                        {(() => {
                            const nombre = o.purchaserNombre || "";
                            const apellidos = o.purchaserApellidos || "";
                            const fullName = [nombre, apellidos].filter(Boolean).join(" ").trim();
                            const correo = o.usuarioCorreo || "—";
                            if (fullName) {
                                return (
                                    <div>
                                        <div className="fw-semibold">{fullName}</div>
                                        <div className="small text-secondary">{correo}</div>
                                    </div>
                                );
                            }
                            return correo;
                        })()}
                    </td>
                    <td className="text-end">{CLP(Number(o.total || 0))}</td>
                    <td className="text-end" title={names.join(', ')}>{totalItems}{namesShort ? <div className="small text-secondary">{namesShort}</div> : null}</td>
                    <td className="text-center">
                        {(() => {
                            const parts: string[] = [];
                            const codePercent = Number(o.discountAppliedPercent ?? (o.discounts as any)?.codePercent ?? 0);
                            const agePercent = Number(o.lifetimeDiscountAppliedPercent ?? (o.discounts as any)?.agePercent ?? 0);
                            const totalDiscountMoney = Number(o.discountAmount ?? (o.discounts as any)?.totalDiscountMoney ?? 0);
                            const hasFreeCake = Boolean(o.freeCakeApplied || (o.discounts as any)?.freeCakeApplied);
                            const freeCakeKey = o.freeCakeTortaKey ?? (o.discounts as any)?.freeCakeTortaKey;
                            if (codePercent > 0) parts.push('Cupón');
                            if (agePercent > 0) parts.push('Mayores');
                            if (hasFreeCake || freeCakeKey) parts.push('Torta');
                            if (totalDiscountMoney > 0) parts.push(`${CLP(totalDiscountMoney)}`);
                            if (!parts.length) return <span className="text-muted small">—</span>;
                            const label = parts.join(' • ') || 'Beneficio';
                            return <span className="badge bg-success" title={label}>{parts[0] || 'Sí'}</span>;
                        })()}
                    </td>
                    <td className="text-end">
                        <button 
                            className="btn btn-sm btn-outline-secondary" 
                            onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                        >
                            {isExpanded ? 'Ocultar' : 'Ver'}
                        </button>
                    </td>
                </tr>
            );

            if (!isExpanded) return [mainRow];

            const detailRow = (
                <tr key={`${o.id}-detail`}>
                    <td colSpan={6} style={{ padding: 0, background: '#f8f9fa' }}>
                        <div className="p-3">
                            <div className="card mb-0">
                                <div className="card-header bg-white d-flex justify-content-between">
                                    <strong>Pedido #{o.id}</strong>
                                    <span className="text-secondary small">{timeHHMM((o.tsISO as string) || (o.fecha as string))}</span>
                                </div>
                                <ul className="list-group list-group-flush">{itemsHTML(o.items)}</ul>
                                {(() => {
                                    const totalDiscountMoney = Number(o.discountAmount ?? (o.discounts as any)?.totalDiscountMoney ?? 0);
                                    const agePercent = Number(o.lifetimeDiscountAppliedPercent ?? (o.discounts as any)?.agePercent ?? 0);
                                    const codePercent = Number(o.discountAppliedPercent ?? (o.discounts as any)?.codePercent ?? 0);
                                    const freeCakeMoney = Number(o.freeCakeAmount ?? (o.discounts as any)?.freeCakeMoney ?? 0);
                                    const freeCakeKey = o.freeCakeTortaKey ?? (o.discounts as any)?.freeCakeTortaKey;
                                    const freeCakeApplied = Boolean(o.freeCakeApplied || (o.discounts as any)?.freeCakeApplied);
                                    
                                    // Calcular montos individuales de descuentos
                                    const subtotalItems = (o.items || []).reduce((sum: number, it: any) => {
                                        const qty = Number(it.qty || it.cantidad || 0);
                                        const price = Number(it.price || 0);
                                        return sum + (qty * price);
                                    }, 0);
                                    
                                    // Si existen en discounts, usarlos; si no, calcular
                                    let couponMoney = Number((o.discounts as any)?.codeDiscountMoney ?? 0);
                                    let ageMoney = Number((o.discounts as any)?.ageDiscountMoney ?? 0);
                                    
                                    if (!couponMoney && codePercent > 0) {
                                        couponMoney = subtotalItems * (codePercent / 100);
                                    }
                                    if (!ageMoney && agePercent > 0) {
                                        const afterCoupon = subtotalItems - couponMoney;
                                        ageMoney = afterCoupon * (agePercent / 100);
                                    }
                                    
                                    const hasDetails = agePercent > 0 || codePercent > 0 || freeCakeApplied || totalDiscountMoney > 0;
                                    if (!hasDetails) return null;
                                    return (
                                        <div className="card-body">
                                            <div className="fw-semibold">Descuentos aplicados</div>
                                            <div className="small text-secondary">
                                                <ul className="mb-0">
                                                    {codePercent > 0 ? (
                                                        <li>{codePercent}% descuento de por vida (FELICES50) — {CLP(couponMoney)}</li>
                                                    ) : null}
                                                    {agePercent > 0 ? (
                                                        <li>{agePercent}% beneficio mayores — {CLP(ageMoney)}</li>
                                                    ) : null}
                                                    {freeCakeApplied ? (
                                                        <li>
                                                            Torta gratis
                                                            {freeCakeKey ? (() => {
                                                                const parts = freeCakeKey.split('::');
                                                                const code = parts[0];
                                                                const prod = (catalogo || []).find((p) => String(p.code) === String(code));
                                                                return prod ? ` — ${prod.productName || code}` : '';
                                                            })() : ''} — {CLP(freeCakeMoney)}
                                                        </li>
                                                    ) : null}
                                                    <li className="fw-semibold mt-1">Total descuentos — {CLP(totalDiscountMoney)}</li>
                                                </ul>
                                            </div>
                                        </div>
                                    );
                                })()}
                                <div className="card-footer bg-white text-end"><strong>Total: {CLP(Number(o.total || 0))}</strong></div>
                            </div>
                        </div>
                    </td>
                </tr>
            );

            return [mainRow, detailRow];
        });

        return (
            <>
                <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
                    <h1 className="h5 mb-0">Órdenes</h1>
                    <div className="btn-group btn-group-sm" role="group">
                        <button 
                            type="button" 
                            className={`btn ${filtroOrdenes === 'hoy' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFiltroOrdenes('hoy')}
                        >
                            Hoy
                        </button>
                        <button 
                            type="button" 
                            className={`btn ${filtroOrdenes === 'mes' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFiltroOrdenes('mes')}
                        >
                            Este mes
                        </button>
                        <button 
                            type="button" 
                            className={`btn ${filtroOrdenes === 'anio' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFiltroOrdenes('anio')}
                        >
                            Este año
                        </button>
                        <button 
                            type="button" 
                            className={`btn ${filtroOrdenes === 'todas' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFiltroOrdenes('todas')}
                        >
                            Todas
                        </button>
                    </div>
                </div>
                <div className="card">
                    <div className="table-responsive">
                        <table className="table align-middle mb-0" id="tblOrdenes">
                            <thead className="table-light">
                                <tr>
                                    <th>Hora</th><th>Cliente</th>
                                    <th className="text-end">Total</th><th className="text-end">Items</th>
                                    <th className="text-center">Beneficio</th>
                                    <th className="text-end"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length ? rows : (<tr><td colSpan={6}><div className="empty-state">No hay órdenes en el periodo seleccionado.</div></td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        );
    }

    function SectionReportes() {
        const [periodo, setPeriodo] = useState("mes");
        const byId = new Map((catalogo || []).map((p: any) => [p.code, p]));

        const candidatos = useMemo(() => {
            const inPeriodo: Record<string, (v: any) => boolean> = {
                hoy: (v) => {
                    const fechaStr = v.fecha || (v.tsISO ? v.tsISO.split('T')[0] : '');
                    return fechaStr === today.toISOString().split('T')[0];
                },
                mes: (v) => {
                    const fechaStr = v.fecha || (v.tsISO ? v.tsISO.split('T')[0] : '');
                    return fechaStr.slice(0, 7) === yyyymm(today);
                },
                anio: (v) => {
                    const fechaStr = v.fecha || (v.tsISO ? v.tsISO.split('T')[0] : '');
                    return fechaStr.slice(0, 4) === yyyy(today);
                },
                todo: (_) => true,
            };
            return ventas.filter(inPeriodo[periodo]);
        }, [periodo, ventas]);

        const periodRows = useMemo(() => {
            let perGroup: Record<string, any[]> = {};
            if (periodo === "hoy" || periodo === "mes") {
                perGroup = groupBy(candidatos, (v) => {
                    const fechaStr = String(v.fecha || "");
                    return dateCL(fechaStr);
                });
            } else if (periodo === "anio") {
                perGroup = groupBy(candidatos, (v) => {
                    const fechaStr = String(v.fecha || "");
                    return fechaStr.slice(0, 7);
                });
            } else {
                perGroup = groupBy(candidatos, (v) => {
                    const fechaStr = String(v.fecha || "");
                    return fechaStr.slice(0, 4);
                });
            }
            const entries = Object.entries(perGroup).map(([k, arr]) => {
                const unid = arr.reduce((a, x) => a + Number(x.cantidadVendida ?? x.qty ?? 0), 0);
                const monto = arr.reduce((a, x) => a + Number(x.ingresosTotal ?? (Number(x.qty || 0) * Number(x.price || 0))), 0);
                return { k, unid, monto };
            });
            return entries;
        }, [candidatos, periodo]);

        function groupBy<T>(arr: T[], keyFn: (x: T) => string) {
            return arr.reduce((acc: Record<string, T[]>, x) => {
                const k = keyFn(x);
                (acc[k] ||= []).push(x);
                return acc;
            }, {} as Record<string, T[]>);
        }

        const byProd = useMemo(() => {
            const map: Record<string, number> = {};
            for (const v of candidatos) {
                const pid = String(v.productoCodigo ?? (v as any).productId ?? '');
                const cantidad = Number(v.cantidadVendida ?? (v as any).qty ?? 0);
                map[pid] = (map[pid] || 0) + cantidad;
            }
            return map;
        }, [candidatos]);

        const pares = Object.entries(byProd).map(([pid, unid]) => {
            const p = byId.get(pid) as any;
            const nombre = p?.productName || p?.nombre || pid || "(desconocido)";
            return { pid, nombre, unid };
        });
        const top = [...pares].sort((a, b) => b.unid - a.unid).slice(0, 10);
        const bottom = [...pares].sort((a, b) => a.unid - b.unid).slice(0, 10);

        return (
            <>
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h1 className="h5 mb-0">Reportes de venta</h1>
                    <div className="d-flex align-items-center gap-2">
                        <label className="small text-secondary">Período</label>
                        <select className="form-select form-select-sm" style={{ width: "auto" }} value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                            <option value="hoy">Hoy</option>
                            <option value="mes">Este mes</option>
                            <option value="anio">Este año</option>
                            <option value="todo">Todo</option>
                        </select>
                    </div>
                </div>
                <div className="row g-3">
                    <div className="col-12 col-lg-6">
                        <div className="card h-100">
                            <div className="card-header bg-white"><strong>Ventas por día/mes/año</strong></div>
                            <div className="table-responsive">
                                <table className="table align-middle mb-0">
                                    <thead className="table-light"><tr><th>Periodo</th><th className="text-end">Unidades</th><th className="text-end">Monto</th></tr></thead>
                                    <tbody>
                                        {periodRows.length ? (
                                            periodRows.map((r) => (<tr key={r.k}><td>{r.k}</td><td className="text-end">{r.unid}</td><td className="text-end">{CLP(r.monto)}</td></tr>))
                                        ) : (
                                            <tr><td colSpan={3}><div className="empty-state">Sin ventas en el período.</div></td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-lg-6">
                        <div className="card h-100">
                            <div className="card-header bg-white d-flex justify-content-between">
                                <strong>Top / Bottom productos</strong>
                                <span className="badge text-bg-light">según período</span>
                            </div>
                            <div className="row g-0">
                                <div className="col-12 col-md-6 border-end">
                                    <div className="table-responsive">
                                        <table className="table align-middle mb-0">
                                            <thead className="table-light"><tr><th>#</th><th>Producto</th><th className="text-end">Unid</th></tr></thead>
                                            <tbody>
                                                {top.length ? top.map((x, i) => (<tr key={x.pid}><td>{i + 1}</td><td>{x.nombre}</td><td className="text-end">{x.unid}</td></tr>)) : (<tr><td colSpan={3}><div className="empty-state">Sin datos</div></td></tr>)}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="col-12 col-md-6">
                                    <div className="table-responsive">
                                        <table className="table align-middle mb-0">
                                            <thead className="table-light"><tr><th>#</th><th>Producto</th><th className="text-end">Unid</th></tr></thead>
                                            <tbody>
                                                {bottom.length ? bottom.map((x, i) => (<tr key={x.pid}><td>{i + 1}</td><td>{x.nombre}</td><td className="text-end">{x.unid}</td></tr>)) : (<tr><td colSpan={3}><div className="empty-state">Sin datos</div></td></tr>)}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // (Se removieron secciones independientes de agregar/eliminar stock y editar producto)

    // Sección 'Ajustes' eliminada por solicitud.

    return (
        <div className="container py-4">
            <div className="row g-3">
                <aside className="col-12 col-md-3 col-xl-2">
                    <div className="list-group admin-menu">
                        {[
                            { id: "dashboard", label: "Dashboard", icon: "bi-speedometer2" },
                            { id: "productos", label: "Productos", icon: "bi-box-seam" },
                            { id: "usuarios", label: "Usuarios", icon: "bi-people" },
                            { id: "ordenes", label: "Órdenes", icon: "bi-receipt" },
                            { id: "reportes", label: "Reportes", icon: "bi-graph-up" },
                            
                            // Ajustes eliminado
                        ].map((m) => (
                            <button key={m.id} className={`list-group-item list-group-item-action d-flex align-items-center ${section === m.id ? "active" : ""}`} onClick={() => setSection(m.id)}>
                                <i className={`bi ${m.icon} me-2`} /> {m.label}
                            </button>
                        ))}
                    </div>
                </aside>
                <section className="col-12 col-md-9 col-xl-10" id="sectionRoot">
                    {section === "dashboard" && <SectionDashboard />}
                    {section === "productos" && <SectionProductos />}
                    {section === "usuarios" && <SectionUsuarios />}
                    {section === "ordenes" && <SectionOrdenes />}
                    {section === "reportes" && <SectionReportes />}
                    
                    {/* Sección 'Ajustes' eliminada */}
                </section>
            </div>

            <Modal
                show={confirm.show}
                title={confirm.title}
                onClose={() => setConfirm({ show: false })}
                onConfirm={confirm.onConfirm}
                confirmLabel={confirm.confirmLabel || "Confirmar"}
                cancelLabel={confirm.cancelLabel || "Cancelar"}
            >
                <div>{confirm.body}</div>
            </Modal>
        </div>
    );
};

export default Admin;
