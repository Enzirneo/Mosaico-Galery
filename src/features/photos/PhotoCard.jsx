import { memo, useState } from 'react';
import { Heart } from 'lucide-react';

function PhotoCard({ photo, isFavorite, onOpen, onToggleFavorite, priority }) {
  const [loaded, setLoaded] = useState(false);
  const ratio = photo.width && photo.height ? photo.width / photo.height : 1;

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-ink/5">
      <button
        type="button"
        onClick={() => onOpen(photo)}
        aria-label={`Abrir ${photo.title}`}
        className="block w-full text-left"
      >
        {/* aspect-ratio reserva o espaço e evita o layout "pular" ao carregar */}
        <img
          src={photo.thumb}
          alt={photo.title}
          width={photo.width}
          height={photo.height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          style={{ aspectRatio: ratio, backgroundColor: photo.color ?? undefined }}
          className={`w-full object-cover transition duration-500 group-hover:scale-[1.03] ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent
            p-3 pt-10 text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <p className="line-clamp-2 text-sm font-medium leading-snug">{photo.title}</p>
          {photo.author && <p className="mt-0.5 text-xs text-white/75">{photo.author}</p>}
        </div>
      </button>

      <button
        type="button"
        onClick={() => onToggleFavorite(photo)}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full shadow-md
          transition active:scale-90 ${
            isFavorite
              ? 'bg-brand text-brand-ink'
              : 'bg-white/90 text-neutral-800 opacity-100 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'
          }`}
      >
        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}

export default memo(PhotoCard);
