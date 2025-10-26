import { getJSON } from "./storage";
import { readUsers } from "./registro";

// Basic admin detection strategy:
// 1) Hardcoded primary admin email
// 2) If a user exists in localStorage key 'usuarios' with rol 'Administrador' matching the email

const PRIMARY_ADMIN_EMAIL = "pasteleriamilsabores.fm@gmail.com";

function isAdminRole(role?: string | null): boolean {
  const r = String(role || '').toLowerCase();
  return r === 'administrador' || r === 'superadmin';
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = String(email).toLowerCase();
  if (e === PRIMARY_ADMIN_EMAIL) return true;
  // 1) Check registered users store (authoritative for login accounts)
  const users = readUsers();
  const found = users.find(u => String(u.email || '').toLowerCase() === e);
  if (found && isAdminRole((found as any).role)) return true;
  // 2) Fallback: check legacy 'usuarios' store used by admin UI
  try {
    const usuarios = getJSON<any[]>("usuarios") || [];
    const legacy = usuarios.find((u) => String(u.correo || "").toLowerCase() === e);
    if (legacy && isAdminRole(legacy.rol)) return true;
  } catch {}
  return false;
}

export default { isAdminEmail };
