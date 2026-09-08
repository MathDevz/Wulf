import React, { useState } from 'react';
import { Icon } from './Icon';
import { Capture } from './Capture';
import { Tutorial, TUTORIAL_CHAPTERS } from './Tutorial';
import { captureItem } from '../lib/actions';
import { store } from '../lib/store';
import { Settings } from '../types';
import logoFull from '../assets/logo-full.png';

const THEMES: { id: Settings['theme']; name: string; desc: string; bg: string; surface: string }[] = [
  { id: 'midnight', name: 'Midnight', desc: 'True black. The default.', bg: '#020202', surface: '#0a0908' },
  { id: 'ember', name: 'Ember', desc: 'Warmer, slightly softer.', bg: '#0c0805', surface: '#1a120b' },
  { id: 'paper', name: 'Paper', desc: 'Lifted charcoal, easier at night.', bg: '#12100e', surface: '#201c19' }
];

/** Steps: welcome → theme → tutorial → startup → first dump. */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [chapter, setChapter] = useState(0);
  const [dumped, setDumped] = useState<string[]>([]);
  const settings = store.settings;
  const theme = settings?.theme ?? 'midnight';
  const startup = !!settings?.launchOnStartup;

  const TOTAL = 5;

  return (
    <div className="onboard">
      <div className="onboard-inner" key={step}>
        {/* 0 — welcome ------------------------------------------------ */}
        {step === 0 && (
          <>
            <img src={logoFull} className="logo" alt="Wulf" />
            <h1>Dump your brain onto a table.</h1>
            <p className="lead">
              Everything you want to do, finish, buy, watch, build or remember goes in one pile. You sort it out
              afterwards — or you don't. Wulf will not nag you either way.
            </p>
            <button className="btn primary" style={{ marginTop: 22 }} onClick={() => setStep(1)} autoFocus>
              Get started <Icon name="arrowRight" size={14} />
            </button>
          </>
        )}

        {/* 1 — theme -------------------------------------------------- */}
        {step === 1 && (
          <>
            <h1>Pick your dark.</h1>
            <p className="lead">All three stay quiet and out of the way. You can change this any time in Settings.</p>
            <div className="theme-grid" role="radiogroup" aria-label="Theme">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  role="radio"
                  aria-checked={theme === t.id}
                  className={`theme-card ${theme === t.id ? 'on' : ''}`}
                  onClick={() => store.setSettings({ theme: t.id })}
                >
                  <span className="theme-swatch" style={{ background: t.bg }}>
                    <i className="accent" />
                    <i className="mid" />
                    <i className="short" />
                    <i className="surface" style={{ background: t.surface }} />
                  </span>
                  <span className="tname">
                    {t.name}
                    {theme === t.id && <Icon name="check" size={11} strokeWidth={2.4} />}
                  </span>
                  <span className="tdesc">{t.desc}</span>
                </button>
              ))}
            </div>
            <button className="btn primary" style={{ marginTop: 22 }} onClick={() => setStep(2)}>
              Continue <Icon name="arrowRight" size={14} />
            </button>
          </>
        )}

        {/* 2 — tutorial ----------------------------------------------- */}
        {step === 2 && (
          <>
            <h1>How Wulf works.</h1>
            <p className="lead">Four moves. That is the entire app.</p>
            <Tutorial chapter={chapter} />
            <div className="rowflex" style={{ marginTop: 18, gap: 8 }}>
              <button
                className="btn"
                onClick={() => (chapter === 0 ? setStep(1) : setChapter((c) => c - 1))}
              >
                <Icon name="chevronLeft" size={13} /> Back
              </button>
              <button
                className="btn primary"
                onClick={() => (chapter === TUTORIAL_CHAPTERS - 1 ? setStep(3) : setChapter((c) => c + 1))}
                autoFocus
              >
                {chapter === TUTORIAL_CHAPTERS - 1 ? 'Got it' : 'Next'} <Icon name="arrowRight" size={14} />
              </button>
            </div>
            <button className="btn ghost sm" style={{ marginTop: 6 }} onClick={() => setStep(3)}>
              Skip the tour
            </button>
          </>
        )}

        {/* 3 — startup ------------------------------------------------- */}
        {step === 3 && (
          <>
            <h1>Keep it within reach?</h1>
            <p className="lead">
              Wulf works best when it is already open the moment something crosses your mind. It starts quietly in the
              background and costs nothing while idle.
            </p>
            <div style={{ width: '100%', marginTop: 18 }}>
              <button
                className={`theme-card ${startup ? 'on' : ''}`}
                style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: '14px 15px' }}
                role="switch"
                aria-checked={startup}
                onClick={() => store.setSettings({ launchOnStartup: !startup })}
              >
                <span className="fi" style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--primary)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                  <Icon name="bolt" size={15} />
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <span className="tname" style={{ display: 'block', fontSize: 13.5 }}>Start Wulf when I sign in</span>
                  <span className="tdesc" style={{ fontSize: 11.5 }}>Adds Wulf to your Windows startup items.</span>
                </span>
                <span className={`switch ${startup ? 'on' : ''}`} aria-hidden="true" />
              </button>

              <button
                className={`theme-card ${settings?.minimizeToTray ? 'on' : ''}`}
                style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: '14px 15px', marginTop: 8 }}
                role="switch"
                aria-checked={!!settings?.minimizeToTray}
                onClick={() => store.setSettings({ minimizeToTray: !settings?.minimizeToTray })}
              >
                <span className="fi" style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--primary)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                  <Icon name="bell" size={15} />
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <span className="tname" style={{ display: 'block', fontSize: 13.5 }}>Keep running in the tray</span>
                  <span className="tdesc" style={{ fontSize: 11.5 }}>Closing the window keeps reminders alive.</span>
                </span>
                <span className={`switch ${settings?.minimizeToTray ? 'on' : ''}`} aria-hidden="true" />
              </button>
            </div>
            <div className="rowflex" style={{ marginTop: 20, gap: 8 }}>
              <button className="btn" onClick={() => setStep(2)}>
                <Icon name="chevronLeft" size={13} /> Back
              </button>
              <button className="btn primary" onClick={() => setStep(4)} autoFocus>
                Continue <Icon name="arrowRight" size={14} />
              </button>
            </div>
          </>
        )}

        {/* 4 — first dump ---------------------------------------------- */}
        {step === 4 && (
          <>
            <h1>Throw a few things in.</h1>
            <p className="lead">Type whatever is on your mind and press Enter. No categories, no dates, no decisions.</p>
            <Capture
              autoFocus
              showHints={false}
              placeholder="finish my ESP32 project"
              onSubmit={(t) => {
                captureItem(t);
                setDumped((d) => [t, ...d]);
              }}
            />
            <div className="dumped">
              {dumped.map((d, i) => (
                <div className="dumped-row" key={i}>
                  <Icon name="check" size={12} style={{ color: 'var(--primary)' }} />
                  {d}
                </div>
              ))}
            </div>
            <button className="btn primary" style={{ marginTop: 18 }} onClick={onDone}>
              {dumped.length ? 'Open Wulf' : 'Skip for now'} <Icon name="arrowRight" size={14} />
            </button>
          </>
        )}

        <div className="steps" aria-hidden="true">
          {Array.from({ length: TOTAL }, (_, i) => (
            <span key={i} className={`step-dot ${i <= step ? 'on' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
