export type Region = {
    id: string; // original id from source (may have leading zeros)
    name: string;
    slug: string;
};

export type Comuna = {
    id: string; // derived stable id (e.g. `${regionSlug}-${comunaSlug}`)
    name: string;
    slug: string;
    regionId: string;
    regionSlug: string;
};

export type RegionWithComunas = Region & { comunas: Comuna[] };
