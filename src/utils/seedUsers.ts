import usersJson from '../data/users/users.json';
import { findUserByEmail, createUser } from './registro';

export function seedUsersFromJson(): void {
    if (!Array.isArray(usersJson)) return;

    for (const u of usersJson as any[]) {
        try {
            const email = String(u.correo || u.email || '').toLowerCase();
            if (!email) continue;
            if (findUserByEmail(email)) continue; // already present

            const payload = {
                run: String(u.run ?? u.id ?? ''),
                name: String(u.nombre ?? u.name ?? ''),
                lastname: String(u.apellidos ?? u.lastname ?? ''),
                email,
                birthdate: String(u.fechaNacimiento ?? u.birthdate ?? ''),
                codigo: String(u.codigo ?? ''),
                password: String(u.password ?? ''),
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
