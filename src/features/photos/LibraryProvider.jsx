import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { repository } from '../../services/repository';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../../components/Toast';
import { photoKey } from './model';

const LibraryContext = createContext(null);

/**
 * Fotos enviadas pelas pessoas + favoritos, com atualização otimista.
 * No modo remoto, os dados são recarregados a cada troca de usuário.
 */
export function LibraryProvider({ children }) {
  const { user, loading: authLoading, enabled } = useAuth();
  const toast = useToast();
  const [photos, setPhotos] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id ?? null;
  const canPersist = !enabled || Boolean(user); // modo local sempre pode

  useEffect(() => {
    if (authLoading) return undefined;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      repository.listPhotos(),
      canPersist ? repository.listFavorites() : Promise.resolve([]),
    ])
      .then(([p, f]) => {
        if (cancelled) return;
        setPhotos(p);
        setFavorites(f);
      })
      .catch(() => !cancelled && toast.error('Não consegui carregar sua biblioteca.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, canPersist, toast]);

  const favoriteKeys = useMemo(() => new Set(favorites.map(photoKey)), [favorites]);

  const toggleFavorite = useCallback(
    async (photo) => {
      const key = photoKey(photo);
      const isFav = favoriteKeys.has(key);
      const before = favorites;
      setFavorites(isFav ? before.filter((p) => photoKey(p) !== key) : [photo, ...before]);
      try {
        if (isFav) await repository.removeFavorite(key);
        else await repository.addFavorite(key, photo);
      } catch {
        setFavorites(before); // desfaz a atualização otimista
        toast.error('Não foi possível atualizar o favorito.');
      }
    },
    [favoriteKeys, favorites, toast],
  );

  const addPhoto = useCallback(
    async (input) => {
      const photo = await repository.addPhoto({ ...input, userId });
      setPhotos((prev) => [photo, ...prev]);
      return photo;
    },
    [userId],
  );

  const removePhoto = useCallback(
    async (photo) => {
      await repository.removePhoto(photo);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setFavorites((prev) => prev.filter((p) => photoKey(p) !== photoKey(photo)));
    },
    [],
  );

  const value = useMemo(
    () => ({
      photos,
      favorites,
      favoriteKeys,
      loading,
      canPersist,
      userId,
      toggleFavorite,
      addPhoto,
      removePhoto,
    }),
    [photos, favorites, favoriteKeys, loading, canPersist, userId, toggleFavorite, addPhoto, removePhoto],
  );
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export const useLibrary = () => useContext(LibraryContext);
