import usersJson from '../data/users/users.json';
import { findUserByEmail, createUser, updateUser } from './registro';

function normalizeRole(t?: string): 'Cliente' | 'Vendedor' | 'Administrador' | 'SuperAdmin' | undefined {
    const v = String(t || '').trim().toLowerCase();
    if (!v) return undefined;
    if (v === 'cliente') return 'Cliente';
    if (v === 'vendedor') return 'Vendedor';
    if (v === 'administrador' || v === 'admin') return 'Administrador';
    if (v === 'superadmin' || v === 'super-admin' || v === 'super admin') return 'SuperAdmin';
    return undefined;
}

export function seedUsersFromJson(): void {
    if (!Array.isArray(usersJson)) return;

    for (const u of usersJson as any[]) {
        try {
            const email = String(u.correo || u.email || '').toLowerCase();
            if (!email) continue;
            const existing = findUserByEmail(email);
            if (existing) {
                // If already present, ensure role matches the seed's intended role
                const r = normalizeRole(u.tipoUsuario || u.rol || u.role);
                if (r && existing.role !== r) {
                    try { updateUser(email, { role: r }); } catch {}
                }
                continue; // skip creation
            }

            const payload = {
                run: String(u.run ?? u.id ?? ''),
                name: String(u.nombre ?? u.name ?? ''),
                lastname: String(u.apellidos ?? u.lastname ?? ''),
                email,
                birthdate: String(u.fechaNacimiento ?? u.birthdate ?? ''),
                codigo: String(u.codigo ?? ''),
                password: String(u.password ?? ''),
                role: normalizeRole(u.tipoUsuario || u.rol || u.role),
                addresses: (u.addresses && Array.isArray(u.addresses)) ? u.addresses : (u.direccion ? [{ id: `seed-${email}`, address: String(u.direccion), region: String(u.regionNombre ?? u.region ?? ''), comuna: String(u.comuna ?? '') }] : undefined),
            };

            // createUser will set createdAt and skip duplicates by email
            createUser(payload as any);
        } catch (err) {
            // ignore per-user errors during seeding
            // console.debug('seed user error', err);
        }
    }
}

export default seedUsersFromJson;
