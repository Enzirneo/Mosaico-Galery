import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ExternalLink, Heart, Trash2 } from 'lucide-react';
import Dialog from '../../components/Dialog';
import { useToast } from '../../components/Toast';

export default function PhotoViewer({
  photo,
  hasPrev,
  hasNext,
  onNavigate,
  isFavorite,
  onToggleFavorite,
  canDelete,
  onDelete,
  onClose,
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(-1);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hasPrev, hasNext, onNavigate]);

  const download = async () => {
    setBusy(true);
    try {
      const res = await fetch(photo.url);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), {
        href,
        download: `${photo.title.slice(0, 60) || 'foto'}.jpg`,
      });
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      window.open(photo.url, '_blank', 'noopener'); // CORS bloqueou: abre a imagem direto
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Excluir esta foto? Essa ação não pode ser desfeita.')) return;
    try {
      await onDelete(photo);
      toast.success('Foto excluída.');
      onClose();
    } catch {
      toast.error('Não foi possível excluir a foto.');
    }
  };

  return (
    <Dialog label={photo.title} onClose={onClose} wide bare>
      <div className="grid md:grid-cols-[minmax(0,1fr)_320px]">
        <div
          className="relative flex items-center justify-center bg-ink/5"
          style={{ backgroundColor: photo.color ?? undefined }}
        >
          <img src={photo.url} alt={photo.title} className="max-h-[80vh] w-full object-contain" />
          {hasPrev && (
            <button
              type="button"
              onClick={() => onNavigate(-1)}
              aria-label="Foto anterior"
              className="btn btn-icon absolute left-3 top-1/2 -translate-y-1/2 bg-white/85 text-neutral-900 hover:bg-white"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              onClick={() => onNavigate(1)}
              aria-label="Próxima foto"
              className="btn btn-icon absolute right-3 top-1/2 -translate-y-1/2 bg-white/85 text-neutral-900 hover:bg-white"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-5 p-6">
          <div>
            <h2 className="font-display text-2xl font-bold leading-tight">{photo.title}</h2>
            {photo.category && (
              <span className="mt-2 inline-block rounded-full bg-sun/30 px-3 py-1 text-xs font-medium">
                {photo.category}
              </span>
            )}
          </div>

          {photo.author && (
            <p className="text-sm text-muted">
              Foto de{' '}
              <a
                href={photo.authorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-ink underline-offset-2 hover:underline"
              >
                {photo.author} <ExternalLink size={12} />
              </a>{' '}
              no Pexels
            </p>
          )}

          <div className="mt-auto flex flex-col gap-2">
            <button type="button" onClick={() => onToggleFavorite(photo)} className="btn btn-outline">
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-brand' : ''} />
              {isFavorite ? 'Nos favoritos' : 'Favoritar'}
            </button>
            <button type="button" onClick={download} disabled={busy} className="btn btn-primary">
              <Download size={18} />
              {busy ? 'Baixando…' : 'Baixar imagem'}
            </button>
            {canDelete && (
              <button type="button" onClick={remove} className="btn btn-ghost text-brand">
                <Trash2 size={18} />
                Excluir foto
              </button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
