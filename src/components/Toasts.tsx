import React from 'react';
import { store, useStore } from '../lib/store';

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div className={`toast ${t.tone}`} key={t.id}>
          <span className="dot" />
          <span className="msg">{t.message}</span>
          {t.action && (
            <button
              className="undo"
              onClick={() => {
                t.action?.();
                store.dismissToast(t.id);
              }}
            >
              {t.actionLabel || 'Undo'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
