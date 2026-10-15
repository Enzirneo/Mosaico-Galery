import { useMemo } from 'react';
import { useColumnCount } from '../../hooks/useColumnCount';
import { distributeColumns } from './layout';
import { photoKey } from './model';
import PhotoCard from './PhotoCard';

export default function Masonry({ photos, favoriteKeys, onOpen, onToggleFavorite }) {
  const count = useColumnCount();
  const columns = useMemo(() => distributeColumns(photos, count), [photos, count]);

  return (
    <div className="mx-auto flex max-w-[1800px] items-start gap-3 px-4 sm:gap-4 sm:px-6">
      {columns.map((column, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
          {column.map((photo) => (
            <PhotoCard
              key={photoKey(photo)}
              photo={photo}
              isFavorite={favoriteKeys.has(photoKey(photo))}
              onOpen={onOpen}
              onToggleFavorite={onToggleFavorite}
              priority={photos.indexOf(photo) < count}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function MasonrySkeleton() {
  const count = useColumnCount();
  const heights = [220, 300, 260, 340, 240, 280];
  return (
    <div className="mx-auto flex max-w-[1800px] gap-3 px-4 sm:gap-4 sm:px-6" aria-hidden="true">
      {Array.from({ length: count }, (_, c) => (
        <div key={c} className="flex flex-1 flex-col gap-3 sm:gap-4">
          {Array.from({ length: 3 }, (_, r) => (
            <div
              key={r}
              className="skeleton rounded-2xl"
              style={{ height: heights[(c * 2 + r * 3) % heights.length] }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
