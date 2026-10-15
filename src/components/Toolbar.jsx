import { Compass, Heart, ImageIcon } from 'lucide-react';
import { CATEGORIES } from '../features/photos/categories';

const TABS = [
  { id: 'discover', label: 'Descobrir', Icon: Compass },
  { id: 'mine', label: 'Minhas fotos', Icon: ImageIcon },
  { id: 'favorites', label: 'Favoritas', Icon: Heart },
];

export default function Toolbar({ tab, onTab, category, onCategory, counts }) {
  return (
    <div className="mx-auto max-w-[1800px] space-y-3 px-4 pb-4 pt-5 sm:px-6">
      <div role="tablist" aria-label="Seções" className="flex gap-1 overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => onTab(id)}
              className={`btn shrink-0 ${active ? 'bg-ink text-bg' : 'btn-ghost text-muted hover:text-ink'}`}
            >
              <Icon size={16} />
              {label}
              {counts[id] > 0 && <span className="text-xs opacity-60">{counts[id]}</span>}
            </button>
          );
        })}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Categorias">
        {[null, ...CATEGORIES.map((c) => c.label)].map((label) => {
          const active = category === label;
          return (
            <button
              key={label ?? 'all'}
              onClick={() => onCategory(label)}
              aria-pressed={active}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition ${
                active
                  ? 'border-brand bg-brand text-brand-ink'
                  : 'border-line bg-surface text-muted hover:border-ink/30 hover:text-ink'
              }`}
            >
              {label ?? 'Tudo'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
