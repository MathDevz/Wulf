import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import logoMark from '../assets/logo-mark.png';

const api = () => (window as any).wulf as any;

export function TitleBar({ subtitle }: { subtitle?: string }) {
  const [max, setMax] = useState(false);

  useEffect(() => {
    api().window.isMaximized().then(setMax).catch(() => {});
    return api().window.onState((s: any) => setMax(s.maximized));
  }, []);

  return (
    <div className="titlebar">
      <div className="tb-left">
        <img src={logoMark} className="tb-mark" alt="" />
        <span className="tb-title">Wulf</span>
        {subtitle && <span className="tb-sub">— {subtitle}</span>}
      </div>
      <div className="win-controls">
        <button onClick={() => api().window.minimize()} aria-label="Minimize" title="Minimize">
          <Icon name="minimize" size={14} />
        </button>
        <button onClick={() => api().window.toggleMaximize()} aria-label={max ? 'Restore' : 'Maximize'} title={max ? 'Restore' : 'Maximize'}>
          <Icon name={max ? 'restore' : 'maximize'} size={13} />
        </button>
        <button className="close" onClick={() => api().window.close()} aria-label="Close" title="Close">
          <Icon name="x" size={14} />
        </button>
      </div>
    </div>
  );
}
