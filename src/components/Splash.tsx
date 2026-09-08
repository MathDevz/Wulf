import React, { useEffect, useState } from 'react';
import logoMark from '../assets/logo-mark.png';

/**
 * Brief launch animation. Purely cosmetic and strictly time-boxed — the app
 * is already mounted and interactive underneath, so this never delays work.
 */
export function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(onDone, reduced ? 60 : 1280);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="splash" aria-hidden="true">
      <img src={logoMark} alt="" />
      <div className="splash-word">WULF</div>
      <div className="splash-bar">
        <span />
      </div>
    </div>
  );
}

/** Shows the splash once per app launch. */
export function useSplash() {
  const [visible, setVisible] = useState(true);
  return { visible, hide: () => setVisible(false) };
}
