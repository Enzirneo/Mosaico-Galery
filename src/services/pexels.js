import { env } from '../lib/env';
import { supabase } from '../lib/supabase';
import { fromPexels } from '../features/photos/model';

const PER_PAGE = 24;

export class PexelsUnavailableError extends Error {}

/**
 * Busca fotos no Pexels. Em produção passa pela Edge Function `pexels`
 * (a chave fica no servidor); em dev sem Supabase usa VITE_PEXELS_API_KEY.
 */
export async function fetchPexels({ query = '', page = 1, category = null, signal }) {
  const params = new URLSearchParams({ page, per_page: PER_PAGE, locale: 'pt-BR' });
  if (query) params.set('query', query);

  let url;
  let headers = {};
  if (supabase) {
    url = `${env.supabaseUrl}/functions/v1/pexels?${params}`;
    headers = { apikey: env.supabaseKey, Authorization: `Bearer ${env.supabaseKey}` };
  } else if (env.pexelsDevKey) {
    url = `https://api.pexels.com/v1/${query ? 'search' : 'curated'}?${params}`;
    headers = { Authorization: env.pexelsDevKey };
  } else {
    throw new PexelsUnavailableError('Nenhuma fonte de fotos configurada.');
  }

  const res = await fetch(url, { headers, signal });
  if (!res.ok) throw new Error(`Falha ao carregar fotos (${res.status}).`);
  const data = await res.json();
  return {
    photos: data.photos.map((p) => fromPexels(p, category)),
    hasMore: Boolean(data.next_page),
  };
}
