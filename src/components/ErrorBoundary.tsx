import React from 'react';
import { Icon } from './Icon';

interface State {
  error: Error | null;
}

const api = () => (window as any).wulf as any;

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    try {
      api()?.data?.flush?.();
    } catch {}
    // Keep the technical detail out of the user's face but available on demand.
    console.error('[Wulf]', error);
  }

  render() {
    if (!this.state.error) return this.props.children as any;
    return (
      <div className="error-screen">
        <div className="error-card">
          <Icon name="info" size={26} style={{ color: 'var(--primary)' }} />
          <h2>Wulf hit a snag drawing this screen.</h2>
          <p>
            Nothing has been lost — your items are written to disk as soon as you make them. Reloading usually clears it up.
          </p>
          <div className="rowflex" style={{ marginTop: 8 }}>
            <button className="btn primary" onClick={() => window.location.reload()}>
              <Icon name="refresh" size={14} /> Reload Wulf
            </button>
            <button className="btn" onClick={() => api().data.revealFolder()}>
              <Icon name="folder" size={14} /> Open data folder
            </button>
          </div>
          <details style={{ marginTop: 14, maxWidth: 420 }}>
            <summary style={{ cursor: 'pointer', fontSize: 12.5, color: 'var(--text-3)' }}>Technical detail</summary>
            <div className="mono" style={{ marginTop: 8, textAlign: 'left' }}>
              {this.state.error.message}
            </div>
          </details>
        </div>
      </div>
    );
  }
}
