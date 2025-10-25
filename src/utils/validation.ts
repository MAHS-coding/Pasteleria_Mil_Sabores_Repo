// Pure validation and formatting helpers for RUT and email
export function formatearRun(valor: string): string {
    valor = valor.replace(/[^0-9kK]/g, "").toUpperCase().trim();
    if (valor.length === 0) return "";
    let cuerpo = valor.slice(0, -1);
    let dv = valor.slice(-1);
    if (valor.length <= 1) return valor;
    if (cuerpo.length === 7)
        cuerpo = cuerpo.replace(/(\d{1})(\d{3})(\d{3})/, "$1.$2.$3");
    else if (cuerpo.length === 8)
        cuerpo = cuerpo.replace(/(\d{2})(\d{3})(\d{3})/, "$1.$2.$3");
    return cuerpo && dv ? cuerpo + "-" + dv : cuerpo;
}

export function validarRun(run: string): boolean {
    if (typeof run !== 'string') return false;
    run = run.trim();
    const rutRegex = /^[0-9]{1,2}(\.[0-9]{3}){2}-[0-9Kk]{1}$/;
    if (!rutRegex.test(run)) return false;
    const [cuerpo, dv] = run.split('-');
    const numero = cuerpo.replace(/\./g, '');
    let suma = 0, multiplo = 2;
    for (let i = numero.length - 1; i >= 0; i--) {
        suma += parseInt(numero.charAt(i), 10) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    const dvEsperado = 11 - (suma % 11);
    let dvCalc = '';
    if (dvEsperado === 11) dvCalc = '0';
    else if (dvEsperado === 10) dvCalc = 'K';
    else dvCalc = dvEsperado.toString();
    return dv.toUpperCase() === dvCalc;
}

const EMAIL_DOMINIOS_PERMITIDOS = ["@duoc.cl", "@profesor.duoc.cl", "@gmail.com"];
export function emailDominioValido(c?: string): boolean {
    const s = String(c || '').toLowerCase();
    return EMAIL_DOMINIOS_PERMITIDOS.some(d => s.endsWith(d));
}


export default { formatearRun, validarRun, emailDominioValido };
