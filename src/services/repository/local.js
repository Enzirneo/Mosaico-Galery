import { blobToDataUrl, prepareImage } from '../../lib/image';

const PHOTOS_KEY = 'mosaico:photos';
const FAVORITES_KEY = 'mosaico:favorites';

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? [];
  } catch {
    return [];
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error('Sem espaço no navegador. Remova algumas fotos e tente de novo.');
  }
}

/** Repositório do "modo local": tudo fica no navegador, sem contas. */
export function createLocalRepository() {
  return {
    mode: 'local',

    async listPhotos() {
      return read(PHOTOS_KEY);
    },

    async addPhoto({ file, title, category }) {
      // Imagens menores, porque o localStorage tem limite de ~5 MB.
      const { blob, width, height } = await prepareImage(file, { maxSide: 1000, quality: 0.75 });
      const url = await blobToDataUrl(blob);
      const photo = {
        id: crypto.randomUUID(),
        source: 'user',
        title,
        category,
        url,
        thumb: url,
        width,
        height,
        color: null,
        author: null,
        authorUrl: null,
        createdAt: new Date().toISOString(),
        ownerId: 'local',
        isPublic: false,
      };
      write(PHOTOS_KEY, [photo, ...read(PHOTOS_KEY)]);
      return photo;
    },

    async removePhoto(photo) {
      write(PHOTOS_KEY, read(PHOTOS_KEY).filter((p) => p.id !== photo.id));
    },

    async listFavorites() {
      return read(FAVORITES_KEY);
    },

    async addFavorite(key, photo) {
      const rest = read(FAVORITES_KEY).filter((p) => `${p.source}:${p.id}` !== key);
      write(FAVORITES_KEY, [photo, ...rest]);
    },

    async removeFavorite(key) {
      write(FAVORITES_KEY, read(FAVORITES_KEY).filter((p) => `${p.source}:${p.id}` !== key));
    },
  };
}
