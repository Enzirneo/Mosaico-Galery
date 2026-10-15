import { normalize } from '../../lib/text';

export function filterPhotos(photos, { query = '', category = null } = {}) {
  const q = normalize(query);
  return photos.filter((p) => {
    if (category && p.category !== category) return false;
    if (!q) return true;
    return normalize(`${p.title} ${p.category ?? ''} ${p.author ?? ''}`).includes(q);
  });
}
