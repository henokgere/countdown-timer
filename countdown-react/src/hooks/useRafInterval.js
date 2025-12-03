import { useEffect, useRef } from 'react';

// tiny RAF-based interval hook that calls fn roughly every `delay` ms while active
export default function useRafInterval(fn, delay = 200, active = true) {
  const savedRef = useRef();
  useEffect(() => { savedRef.current = fn; }, [fn]);

  useEffect(() => {
    if (!active) return;
    let id = null;
    let last = performance.now();
    function loop(now) {
      if (now - last >= delay) {
        savedRef.current(now);
        last = now;
      }
      id = requestAnimationFrame(loop);
    }
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [delay, active]);
}
