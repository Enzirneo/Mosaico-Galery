import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

/**
 * Diálogo acessível: Esc fecha, foco fica preso dentro e volta ao gatilho,
 * rolagem da página é travada enquanto aberto.
 */
export default function Dialog({ label, onClose, children, wide = false, bare = false }) {
  const panel = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (panel.current?.querySelector('[autofocus],input,select') ?? panel.current)?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      const nodes = panel.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`relative max-h-[92vh] w-full animate-pop overflow-y-auto bg-surface shadow-2xl outline-none
          rounded-t-3xl sm:rounded-3xl ${wide ? 'sm:max-w-5xl' : 'sm:max-w-md'} ${bare ? '' : 'p-6'}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="btn btn-icon absolute right-3 top-3 z-10 bg-surface/80 text-ink backdrop-blur hover:bg-ink/10"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
