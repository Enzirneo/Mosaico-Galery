import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPexels, PexelsUnavailableError } from '../../services/pexels';

/** Feed paginado do Pexels. Reinicia a cada nova busca e cancela requisições obsoletas. */
export function usePexelsFeed({ query, category, enabled = true }) {
  const [state, setState] = useState({
    photos: [],
    page: 0,
    hasMore: true,
    loading: enabled,
    error: null,
    unavailable: false,
  });
  const controller = useRef(null);
  const busy = useRef(false);

  const load = useCallback(
    async (page) => {
      controller.current?.abort();
      const ctrl = new AbortController();
      controller.current = ctrl;
      busy.current = true;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await fetchPexels({ query, category, page, signal: ctrl.signal });
        setState((s) => {
          const seen = new Set(s.photos.map((p) => p.id));
          const fresh = res.photos.filter((p) => !seen.has(p.id));
          return {
            ...s,
            photos: page === 1 ? res.photos : [...s.photos, ...fresh],
            page,
            hasMore: res.hasMore,
            loading: false,
          };
        });
      } catch (err) {
        if (err.name === 'AbortError') return;
        setState((s) => ({
          ...s,
          loading: false,
          hasMore: false,
          error: err.message,
          unavailable: err instanceof PexelsUnavailableError,
        }));
      } finally {
        busy.current = false;
      }
    },
    [query, category],
  );

  useEffect(() => {
    if (!enabled) return undefined; // fora da aba "Descobrir" não gasta requisições
    setState({ photos: [], page: 0, hasMore: true, loading: true, error: null, unavailable: false });
    load(1);
    return () => controller.current?.abort();
  }, [load, enabled]);

  const loadMore = useCallback(() => {
    if (busy.current || !state.hasMore || state.error) return;
    load(state.page + 1);
  }, [load, state.hasMore, state.page, state.error]);

  return { ...state, loadMore };
}
