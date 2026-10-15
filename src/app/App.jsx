import { useCallback, useMemo, useState } from 'react';
import { Heart, ImageIcon, SearchX, ImageOff } from 'lucide-react';
import { ToastProvider } from '../components/Toast';
import Header from '../components/Header';
import Toolbar from '../components/Toolbar';
import EmptyState from '../components/EmptyState';
import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
import AuthDialog from '../features/auth/AuthDialog';
import { LibraryProvider, useLibrary } from '../features/photos/LibraryProvider';
import Masonry, { MasonrySkeleton } from '../features/photos/Masonry';
import PhotoViewer from '../features/photos/PhotoViewer';
import UploadDialog from '../features/photos/UploadDialog';
import { categoryByLabel } from '../features/photos/categories';
import { filterPhotos } from '../features/photos/filters';
import { photoKey } from '../features/photos/model';
import { usePexelsFeed } from '../features/photos/usePexelsFeed';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useTheme } from '../hooks/useTheme';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LibraryProvider>
          <Shell />
        </LibraryProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

function Shell() {
  const auth = useAuth();
  const library = useLibrary();
  const { isDark, toggle } = useTheme();

  const [tab, setTab] = useState('discover');
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null); // { type: 'upload' | 'auth', reason? }
  const [viewingKey, setViewingKey] = useState(null);

  const debouncedSearch = useDebouncedValue(search.trim());
  const categoryInfo = categoryByLabel(category);
  const ownerId = library.userId ?? 'local';

  // Pexels: a busca digitada tem prioridade sobre a categoria selecionada.
  const feed = usePexelsFeed({
    query: debouncedSearch || categoryInfo?.query || '',
    category: debouncedSearch ? null : category,
    enabled: tab === 'discover',
  });
  const sentinel = useInfiniteScroll(feed.loadMore, tab === 'discover' && feed.hasMore && !feed.loading);

  const filters = { query: debouncedSearch, category };
  const mine = useMemo(
    () => filterPhotos(library.photos.filter((p) => p.ownerId === ownerId), filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [library.photos, ownerId, debouncedSearch, category],
  );
  const favorites = useMemo(
    () => filterPhotos(library.favorites, filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [library.favorites, debouncedSearch, category],
  );
  const discover = useMemo(() => {
    const community = filterPhotos(library.photos, filters);
    return [...community, ...feed.photos];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [library.photos, feed.photos, debouncedSearch, category]);

  const visible = { discover, mine, favorites }[tab];
  const counts = { mine: library.photos.filter((p) => p.ownerId === ownerId).length, favorites: library.favorites.length };

  const viewingIndex = viewingKey ? visible.findIndex((p) => photoKey(p) === viewingKey) : -1;
  const viewing = viewingIndex >= 0 ? visible[viewingIndex] : null;

  const openAuth = (reason) => setDialog({ type: 'auth', reason });
  const openUpload = () => (library.canPersist ? setDialog({ type: 'upload' }) : openAuth('Entre para publicar suas fotos.'));
  const closeDialog = useCallback(() => setDialog(null), []);
  const closeViewer = useCallback(() => setViewingKey(null), []);

  const toggleFavorite = (photo) =>
    library.canPersist ? library.toggleFavorite(photo) : openAuth('Entre para salvar seus favoritos.');

  const navigate = useCallback(
    (delta) => {
      const next = visible[viewingIndex + delta];
      if (next) setViewingKey(photoKey(next));
    },
    [visible, viewingIndex],
  );

  const showSkeleton = tab === 'discover' ? feed.loading && visible.length === 0 : library.loading;

  return (
    <div className="min-h-screen pb-16">
      <Header
        search={search}
        onSearch={setSearch}
        isDark={isDark}
        onToggleTheme={toggle}
        onUpload={openUpload}
        auth={auth}
        onSignIn={() => openAuth()}
      />
      <Toolbar tab={tab} onTab={setTab} category={category} onCategory={setCategory} counts={counts} />

      <main>
        {showSkeleton ? (
          <MasonrySkeleton />
        ) : visible.length > 0 ? (
          <Masonry
            photos={visible}
            favoriteKeys={library.favoriteKeys}
            onOpen={(p) => setViewingKey(photoKey(p))}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <Empty
            tab={tab}
            feed={feed}
            searching={Boolean(debouncedSearch || category)}
            needsLogin={tab === 'mine' && auth.enabled && !auth.user}
            onUpload={openUpload}
            onSignIn={() => openAuth()}
          />
        )}

        {tab === 'discover' && (
          <div ref={sentinel} className="flex h-24 items-center justify-center text-sm text-muted">
            {feed.loading && visible.length > 0 && 'Carregando mais fotos…'}
            {feed.error && visible.length > 0 && (
              <button className="btn btn-outline" onClick={feed.loadMore}>Tentar de novo</button>
            )}
          </div>
        )}
      </main>

      {viewing && (
        <PhotoViewer
          photo={viewing}
          hasPrev={viewingIndex > 0}
          hasNext={viewingIndex < visible.length - 1}
          onNavigate={navigate}
          isFavorite={library.favoriteKeys.has(photoKey(viewing))}
          onToggleFavorite={toggleFavorite}
          canDelete={viewing.source === 'user' && viewing.ownerId === ownerId}
          onDelete={library.removePhoto}
          onClose={closeViewer}
        />
      )}
      {dialog?.type === 'upload' && (
        <UploadDialog onSubmit={library.addPhoto} onClose={closeDialog} showVisibility={auth.enabled} />
      )}
      {dialog?.type === 'auth' && <AuthDialog reason={dialog.reason} onClose={closeDialog} />}
    </div>
  );
}

function Empty({ tab, feed, searching, needsLogin, onUpload, onSignIn }) {
  if (tab === 'discover') {
    if (feed.unavailable) {
      return (
        <EmptyState icon={ImageOff} title="Sem fonte de fotos">
          Configure o Supabase (ou VITE_PEXELS_API_KEY em desenvolvimento) para ver fotos do Pexels. Veja o README.
        </EmptyState>
      );
    }
    if (feed.error) {
      return (
        <EmptyState icon={ImageOff} title="Não deu para carregar" action={<button className="btn btn-primary" onClick={feed.loadMore}>Tentar de novo</button>}>
          {feed.error}
        </EmptyState>
      );
    }
    return (
      <EmptyState icon={SearchX} title="Nada por aqui">
        {searching ? 'Nenhuma foto encontrada. Tente outro termo ou categoria.' : 'Ainda não há fotos para mostrar.'}
      </EmptyState>
    );
  }
  if (tab === 'mine') {
    return needsLogin ? (
      <EmptyState icon={ImageIcon} title="Entre para ver suas fotos" action={<button className="btn btn-primary" onClick={onSignIn}>Entrar</button>}>
        Suas fotos ficam salvas na sua conta.
      </EmptyState>
    ) : (
      <EmptyState icon={ImageIcon} title={searching ? 'Nada encontrado' : 'Sua galeria está vazia'} action={!searching && <button className="btn btn-primary" onClick={onUpload}>Enviar primeira foto</button>}>
        {searching ? 'Nenhuma das suas fotos combina com o filtro.' : 'Publique uma foto e ela aparece aqui.'}
      </EmptyState>
    );
  }
  return (
    <EmptyState icon={Heart} title={searching ? 'Nada encontrado' : 'Nenhum favorito ainda'}>
      {searching ? 'Nenhum favorito combina com o filtro.' : 'Toque no coração de uma foto para guardá-la aqui.'}
    </EmptyState>
  );
}
