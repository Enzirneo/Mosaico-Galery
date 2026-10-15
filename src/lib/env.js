const isLocalUrl = (url) => /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

// Travas contra apontar para o banco errado (o erro mais caro de cometer):
//  - desenvolvimento só conversa com o banco local;
//  - build de produção nunca embute um endereço local.
if (supabaseUrl) {
  if (import.meta.env.DEV && !isLocalUrl(supabaseUrl)) {
    throw new Error(
      `Ambiente de desenvolvimento apontando para um banco remoto (${supabaseUrl}). ` +
        'Use o Supabase local (npm run db:start) ou ajuste o .env.development.',
    );
  }
  if (import.meta.env.PROD && isLocalUrl(supabaseUrl)) {
    throw new Error('Build de produção com VITE_SUPABASE_URL local. Revise as variáveis de produção.');
  }
}

export const env = {
  mode: import.meta.env.DEV ? 'development' : 'production',
  supabaseUrl,
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  // Só existe em desenvolvimento: no build de produção vira '' e a chave
  // nunca entra no bundle (em produção o Pexels é chamado pela Edge Function).
  pexelsDevKey: import.meta.env.DEV ? import.meta.env.VITE_PEXELS_API_KEY || '' : '',
};

export const isLocalBackend = Boolean(supabaseUrl) && isLocalUrl(supabaseUrl);
