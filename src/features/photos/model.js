/**
 * Modelo único de foto usado em toda a aplicação, venha ela do Pexels,
 * do Supabase ou do modo local:
 * { id, source, title, category, url, thumb, width, height, color,
 *   author, authorUrl, createdAt, ownerId, isPublic }
 */
export const photoKey = (photo) => `${photo.source}:${photo.id}`;

export function fromPexels(raw, category = null) {
  return {
    id: String(raw.id),
    source: 'pexels',
    title: raw.alt || `Foto de ${raw.photographer}`,
    category,
    url: raw.src.large2x || raw.src.large || raw.src.original,
    thumb: raw.src.large || raw.src.medium,
    width: raw.width,
    height: raw.height,
    color: raw.avg_color || null,
    author: raw.photographer,
    authorUrl: raw.photographer_url,
    createdAt: null,
    ownerId: null,
    isPublic: true,
  };
}

export function fromRow(row, publicUrl) {
  return {
    id: row.id,
    source: 'user',
    title: row.title,
    category: row.category,
    url: publicUrl,
    thumb: publicUrl,
    width: row.width,
    height: row.height,
    color: null,
    author: null,
    authorUrl: null,
    createdAt: row.created_at,
    ownerId: row.owner_id,
    isPublic: row.is_public,
  };
}
