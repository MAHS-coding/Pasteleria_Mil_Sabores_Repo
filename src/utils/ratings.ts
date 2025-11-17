export type Rating = {
  userEmail: string;
  userName?: string;
  stars: number; // 1-5
  comment: string;
  date: string; // ISO
};

const STORAGE_KEY = 'product_ratings_v1';

type RatingsMap = Record<string, Rating[]>;

function readStorage(): RatingsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as RatingsMap;
  } catch (err) {
    return {};
  }
}

// Initialize from seed data (productos.json) if storage is empty.
function initFromSeedIfEmpty() {
  try {
    const existing = readStorage();
    if (Object.keys(existing).length > 0) return; // already seeded or used
    // dynamic import of seed data (asynchronously)
    // also load users to validate that seeded ratings belong to existing client users
    Promise.all([import('../data/products/productos.json'), import('../data/users/users.json')]).then(([module, usersModule]) => {
      try {
        const catalogData = module.default || module;
        const users = (usersModule && (usersModule.default || usersModule)) || [];
        const clientEmails = new Set(((users as any[]) || []).filter(u => String(u.tipoUsuario).toLowerCase() === 'cliente').map(u => String(u.correo || '').toLowerCase()));
        const map: RatingsMap = {};
        for (const cat of (catalogData.categorias || [])) {
          for (const prod of (cat.productos || [])) {
            const ratingsArr = (prod as any).ratings as any[] | undefined;
            if (prod && prod.codigo_producto && Array.isArray(ratingsArr) && ratingsArr.length > 0) {
              // Only include ratings where the userEmail belongs to an existing client user
              const filtered = ratingsArr.filter((r: any) => {
                const email = String(r.userEmail || '').toLowerCase();
                return email && clientEmails.has(email);
              }).map((r: any) => ({
                userEmail: String(r.userEmail || ''),
                userName: r.userName || undefined,
                stars: Number(r.stars || 0),
                comment: String(r.comment || ''),
                date: String(r.date || new Date().toISOString()),
              }));
              if (filtered.length > 0) map[prod.codigo_producto] = filtered;
            }
          }
        }
        if (Object.keys(map).length > 0) writeStorage(map);
      } catch (e) {
        // ignore
      }
    }).catch(() => { /* ignore */ });
  } catch (err) {
    // ignore
  }
}

// Run on module load
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  initFromSeedIfEmpty();
}

function writeStorage(map: RatingsMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    // ignore
  }
}

export function getRatings(productCode: string) {
  const map = readStorage();
  return map[productCode] ? [...map[productCode]] : [];
}

export function addRating(productCode: string, rating: Rating) {
  const map = readStorage();
  const list = map[productCode] ? [...map[productCode]] : [];
  // prevent duplicate from same user at same date; allow multiple reviews by same user
  list.unshift(rating);
  map[productCode] = list;
  writeStorage(map);
  try {
    // notify running app that ratings changed so UI can update without reload
    if (typeof window !== 'undefined' && typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('ratings-updated', { detail: { productCode, rating } }));
    }
  } catch (err) {
    // ignore
  }
}

export function removeRating(productCode: string, index: number) {
  const map = readStorage();
  const list = map[productCode] ? [...map[productCode]] : [];
  if (index < 0 || index >= list.length) return;
  list.splice(index, 1);
  map[productCode] = list;
  writeStorage(map);
  try {
    if (typeof window !== 'undefined' && typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('ratings-updated', { detail: { productCode } }));
    }
  } catch (err) {
    // ignore
  }
}

export function getAverage(productCode: string) {
  const list = getRatings(productCode);
  if (!list || list.length === 0) return { avg: 0, count: 0 };
  const sum = list.reduce((s, r) => s + (r.stars || 0), 0);
  return { avg: sum / list.length, count: list.length };
}

export default {
  getRatings,
  addRating,
  getAverage,
  removeRating,
};
