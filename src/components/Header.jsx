import { LogOut, Moon, Plus, Search, Sun, User, X } from 'lucide-react';
import Logo from './Logo';

export default function Header({
  search,
  onSearch,
  isDark,
  onToggleTheme,
  onUpload,
  auth,
  onSignIn,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1800px] items-center gap-3 px-4 py-3 sm:px-6">
        <Logo className="shrink-0" />

        <label className="relative mx-auto block w-full max-w-2xl">
          <span className="sr-only">Buscar fotos</span>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar por tema, título ou autor"
            className="w-full rounded-full border border-transparent bg-ink/5 py-2.5 pl-11 pr-10 text-sm
              placeholder:text-muted focus:border-brand focus:bg-surface focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch('')}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-ink/10"
            >
              <X size={16} />
            </button>
          )}
        </label>

        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={onUpload} className="btn btn-primary">
            <Plus size={18} />
            <span className="hidden sm:inline">Enviar foto</span>
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
            className="btn btn-ghost btn-icon"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {auth.enabled &&
            (auth.user ? (
              <button
                type="button"
                onClick={auth.signOut}
                aria-label={`Sair (${auth.user.email})`}
                title={`Sair (${auth.user.email})`}
                className="btn btn-ghost btn-icon"
              >
                <LogOut size={20} />
              </button>
            ) : (
              <button type="button" onClick={onSignIn} className="btn btn-outline">
                <User size={18} />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            ))}
        </div>
      </div>
    </header>
  );
}
