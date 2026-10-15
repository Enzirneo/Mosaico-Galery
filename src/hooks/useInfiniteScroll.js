import { useEffect, useRef } from 'react';

/** Retorna um ref para o "sentinela": quando ele se aproxima da tela, chama `onReach`. */
export function useInfiniteScroll(onReach, enabled) {
  const ref = useRef(null);
  const callback = useRef(onReach);
  callback.current = onReach;

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return undefined;
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && callback.current(),
      { rootMargin: '800px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return ref;
}
