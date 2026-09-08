import React from 'react';
import mark from '../assets/logo-mark.png';

export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <img src={mark} className="mark" alt="" />
      <h3>{title}</h3>
      <p>{body}</p>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
