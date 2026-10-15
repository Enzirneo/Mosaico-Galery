import { useEffect, useState } from 'react';

const BREAKPOINTS = [
  [1536, 6],
  [1280, 5],
  [1024, 4],
  [640, 3],
  [0, 2],
];

const countFor = (width) => BREAKPOINTS.find(([min]) => width >= min)[1];

export function useColumnCount() {
  const [count, setCount] = useState(() => countFor(window.innerWidth));
  useEffect(() => {
    const onResize = () => setCount(countFor(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return count;
}
