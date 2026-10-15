/**
 * Modelo único de foto usado em toda a aplicação, venha ela do Pexels,
 * do Supabase ou do modo local:
 * { id, source, title, category, url, thumb, width, height, color,
 *   author, authorUrl, createdAt, ownerId, privacy }
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
    privacy: 'public',
  };
}

/** Converte uma linha da tabela `items` em foto. `signedUrl` só é usado em uploads. */
export function fromItem(item, signedUrl) {
  const meta = item.metadata ?? {};
  const isExternal = item.source !== 'upload';
  const url = isExternal ? meta.url : signedUrl;
  if (!url) return null;
  return {
    id: isExternal ? item.external_id : item.id,
    source: isExternal ? item.source : 'user',
    title: item.title,
    category: item.tags?.[0] ?? null,
    url,
    thumb: isExternal ? meta.thumb || url : url,
    width: item.width,
    height: item.height,
    color: meta.color ?? null,
    author: meta.author ?? null,
    authorUrl: meta.authorUrl ?? null,
    createdAt: item.created_at,
    ownerId: item.owner_id,
    privacy: item.privacy,
  };
}
