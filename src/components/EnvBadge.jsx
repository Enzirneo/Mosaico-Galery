import { env, isLocalBackend } from '../lib/env';

/** Selo fixo que só existe em desenvolvimento: evita confundir o banco local com o real. */
export default function EnvBadge() {
  if (env.mode !== 'development') return null;
  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-[70] rounded-full bg-sun px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-900 shadow-lg">
      DEV · {isLocalBackend ? 'banco local' : 'modo local do navegador'}
    </div>
  );
}
