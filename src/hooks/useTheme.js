import { useCallback, useEffect, useState } from 'react';

const KEY = 'mosaico:theme';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#161311' : '#FAF6F0');
    try {
      localStorage.setItem(KEY, isDark ? 'dark' : 'light');
    } catch {
      /* armazenamento indisponível: o tema só não persiste */
    }
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((d) => !d), []);
  return { isDark, toggle };
}
