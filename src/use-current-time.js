import { useEffect, useState } from 'react';

// Read wall-clock time after resume; background interval ticks are not a clock.
export function useCurrentTime(active) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    let timer;
    const refresh = () => {
      clearInterval(timer);
      setNow(Date.now());
      if (active && !document.hidden) timer = setInterval(() => setNow(Date.now()), 1000);
    };
    refresh();
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, [active]);
  return [now, () => setNow(Date.now())];
}
