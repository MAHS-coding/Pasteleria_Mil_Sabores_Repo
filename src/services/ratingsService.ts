import httpClient from "./httpClient";

export type RatingDto = {
  id?: number | string;
  userRun?: string;
  userName?: string;
  productoCodigoProducto?: string;
  stars: number;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchRatingsByProduct(productCode: string): Promise<RatingDto[]> {
  if (!productCode) return [];
  try {
    const resp = await httpClient.get(`/api/ratings/producto/${encodeURIComponent(productCode)}`);
    return (resp.data || []) as RatingDto[];
  } catch (error: any) {
    // 404 Not Found - product has no ratings (normal, return empty array)
    if (error?.response?.status === 404) {
      return [];
    }
    // 403 Forbidden or other errors should be re-thrown
    // These indicate a real problem that should be visible
    throw error;
  }
}

export async function createRating(payload: RatingDto): Promise<RatingDto | null> {
  if (!payload || !payload.productoCodigoProducto || !payload.userRun) return null;
  const resp = await httpClient.post(
    `/api/ratings/usuario/${encodeURIComponent(payload.userRun)}/producto/${encodeURIComponent(payload.productoCodigoProducto)}`,
    { stars: payload.stars, comment: payload.comment }
  );
  return (resp.data || null) as RatingDto | null;
}

export async function deleteRating(ratingId: string | number, userRun: string): Promise<boolean> {
  if (!ratingId || !userRun) return false;
  await httpClient.delete(`/api/ratings/${encodeURIComponent(ratingId)}/usuario/${encodeURIComponent(userRun)}`);
  return true;
}
