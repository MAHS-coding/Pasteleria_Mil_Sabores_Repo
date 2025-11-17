// Utilities for formatting and sanitizing card inputs.
export function formatCardNumber(value: string) {
    const digits = (value || '').replace(/\D/g, '').slice(0, 19); // support up to 19 digits
    // group in 4-4-4-4-3 pattern as numbers allow
    return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function sanitizeCardNumber(value: string) {
    return (value || '').replace(/\D/g, '');
}

export function formatExpMonth(value: string) {
    const digits = (value || '').replace(/\D/g, '').slice(0, 2);
    return digits;
}

export function formatExpYear(value: string) {
    const digits = (value || '').replace(/\D/g, '').slice(0, 4);
    return digits;
}

export function normalizeHolderName(value: string) {
    return (value || '').replace(/\s+/g, ' ').trim();
}

export function detectBrand(pan: string) {
    const cleaned = (pan || '').replace(/\s+/g, '');
    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'Amex';
    return 'Tarjeta';
}

export function maskLast4(pan: string) {
    const cleaned = (pan || '').replace(/\D/g, '');
    return cleaned.slice(-4) || '';
}
