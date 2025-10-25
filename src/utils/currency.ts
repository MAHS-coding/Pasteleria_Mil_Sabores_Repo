const clFormatter = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});

export function formatCLP(value: number | null | undefined, fallback = clFormatter.format(0)): string {
    if (typeof value !== "number" || Number.isNaN(value)) return fallback;
    return clFormatter.format(value);
}

export default { formatCLP };
