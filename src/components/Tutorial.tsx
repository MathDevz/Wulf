import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';

/**
 * A tiny animated demo of the four moves that matter. It is a looping
 * illustration, not an interactive walkthrough — the user is never blocked.
 */

interface Chapter {
  title: string;
  body: string;
  nav: 'queue' | 'today' | 'projects' | 'later';
}

const CHAPTERS: Chapter[] = [
  {
    title: 'Type it and forget it',
    body: 'One field, one Enter. No category, no date, no priority. The thought is out of your head and safely in Wulf.',
    nav: 'queue'
  },
  {
    title: 'Drag what you actually want to do',
    body: 'Today only fills up because you put something there. Wulf never decides your day for you.',
    nav: 'today'
  },
  {
    title: 'Group the big stuff',
    body: 'When one line stops being enough, drop those tasks into a project and watch the progress bar fill in.',
    nav: 'projects'
  },
  {
    title: 'Tick it off',
    body: 'Finished things move to Completed instead of vanishing, so you can see what you actually got done.',
    nav: 'later'
  }
];

const TASKS = ['finish my ESP32 project', 'buy solder', 'print enclosure'];

export function Tutorial({ chapter }: { chapter: number }) {
  const c = CHAPTERS[chapter];
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    const timers = [
      setTimeout(() => setFrame(1), 420),
      setTimeout(() => setFrame(2), 1050),
      setTimeout(() => setFrame(3), 1750)
    ];
    return () => timers.forEach(clearTimeout);
  }, [chapter]);

  const navRows: { key: Chapter['nav']; label: string; icon: string }[] = [
    { key: 'queue', label: 'Queue', icon: 'inbox' },
    { key: 'today', label: 'Today', icon: 'today' },
    { key: 'projects', label: 'Projects', icon: 'projects' },
    { key: 'later', label: 'Later', icon: 'later' }
  ];

  return (
    <div className="tut">
      <div className="tut-stage">
        <div className="tut-mini-nav" aria-hidden="true">
          <b>Wulf</b>
          {navRows.map((r) => (
            <div
              key={r.key}
              className={`tut-nav-row ${c.nav === r.key ? (chapter === 1 && frame >= 2 ? 'pulse' : 'on') : ''}`}
            >
              <Icon name={r.icon} size={10} />
              {r.label}
            </div>
          ))}
        </div>

        <div className="tut-body" aria-hidden="true">
          {chapter === 0 && (
            <>
              <div className="tut-field active">
                <Icon name="plus" size={11} />
                <span style={{ color: frame >= 1 ? 'var(--text)' : undefined }}>
                  {frame === 0 ? 'What do you want to do?' : 'finish my ESP32 project'}
                </span>
                {frame >= 1 && frame < 2 && <span className="caret" />}
              </div>
              {frame >= 2 &&
                TASKS.slice(0, frame >= 3 ? 3 : 1).map((t, i) => (
                  <div className="tut-task new" key={t} style={{ animationDelay: `${i * 60}ms` }}>
                    <span className="box" />
                    <span>{t}</span>
                  </div>
                ))}
            </>
          )}

          {chapter === 1 && (
            <>
              <div className="tut-field">
                <Icon name="list" size={11} />
                <span>Queue</span>
              </div>
              {TASKS.map((t, i) => (
                <div
                  className={`tut-task ${i === 0 && frame >= 1 ? 'lift' : ''} ${i === 0 && frame >= 3 ? 'gone' : ''}`}
                  key={t}
                >
                  <span className="box" />
                  <span>{t}</span>
                  {i === 0 && frame >= 1 && frame < 3 && (
                    <Icon name="arrowRight" size={11} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />
                  )}
                </div>
              ))}
            </>
          )}

          {chapter === 2 && (
            <>
              <div className="tut-field">
                <Icon name="folder" size={11} />
                <span style={{ color: 'var(--text)' }}>ESP32 Mini Device</span>
                <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: 600 }}>
                  {frame >= 3 ? '2 of 3' : frame >= 2 ? '1 of 3' : '0 of 3'}
                </span>
              </div>
              <div className="progress" style={{ height: 3, marginBottom: 3 }}>
                <span style={{ width: `${frame >= 3 ? 66 : frame >= 2 ? 33 : 4}%` }} />
              </div>
              {['Buy OLED', 'Wire buttons', 'Design enclosure'].map((t, i) => (
                <div className={`tut-task ${frame >= 2 + i && i < 2 ? 'checked' : ''}`} key={t}>
                  <span className={`box ${frame >= 2 + i && i < 2 ? 'ticked' : ''}`}>
                    {frame >= 2 + i && i < 2 && <Icon name="check" size={8} strokeWidth={2.6} />}
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </>
          )}

          {chapter === 3 && (
            <>
              <div className="tut-field">
                <Icon name="done" size={11} />
                <span>Completed</span>
              </div>
              {TASKS.map((t, i) => (
                <div className={`tut-task ${frame >= 1 + i ? 'checked' : ''}`} key={t}>
                  <span className={`box ${frame >= 1 + i ? 'ticked' : ''}`}>
                    {frame >= 1 + i && <Icon name="check" size={8} strokeWidth={2.6} />}
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="tut-copy">
        <h4>{c.title}</h4>
        <p>{c.body}</p>
      </div>
      <div className="tut-dots" aria-hidden="true">
        {CHAPTERS.map((_, i) => (
          <i key={i} className={i === chapter ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
}

export const TUTORIAL_CHAPTERS = CHAPTERS.length;
