import { useEffect, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import Dialog from '../../components/Dialog';
import { useToast } from '../../components/Toast';
import { CATEGORIES } from './categories';

const titleFromFile = (name) => name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();

export default function UploadDialog({ onSubmit, onClose, showVisibility }) {
  const toast = useToast();
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].label);
  const [isPublic, setIsPublic] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('Escolha um arquivo de imagem.');
    setFile(f);
    setTitle((t) => t || titleFromFile(f.name));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ file, title: title.trim(), category, isPublic });
      toast.success('Foto adicionada!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Não foi possível enviar a foto.');
      setSaving(false);
    }
  };

  return (
    <Dialog label="Enviar foto" onClose={onClose}>
      <h2 className="font-display text-2xl font-bold">Enviar foto</h2>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <button
          type="button"
          onClick={() => input.current.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files[0]);
          }}
          className={`flex min-h-44 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed
            text-sm text-muted transition ${dragging ? 'border-brand bg-brand/5' : 'border-line hover:border-ink/30'}`}
        >
          {preview ? (
            <img src={preview} alt="Pré-visualização" className="max-h-64 w-full object-contain" />
          ) : (
            <>
              <ImagePlus size={28} />
              <span>Arraste uma imagem ou clique para escolher</span>
              <span className="text-xs">JPG, PNG ou WebP até 15 MB</span>
            </>
          )}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pick(e.target.files[0])}
        />

        <div>
          <label htmlFor="up-title" className="label">Título</label>
          <input
            id="up-title"
            className="field"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Dê um nome à foto"
            required
          />
        </div>

        <div>
          <label htmlFor="up-category" className="label">Categoria</label>
          <select
            id="up-category"
            className="field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.label}>{c.label}</option>
            ))}
          </select>
        </div>

        {showVisibility && (
          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--brand))]"
            />
            Mostrar na aba Descobrir para todo mundo
          </label>
        )}

        <button type="submit" disabled={!file || !title.trim() || saving} className="btn btn-primary w-full py-3">
          {saving ? 'Enviando…' : 'Publicar'}
        </button>
      </form>
    </Dialog>
  );
}
