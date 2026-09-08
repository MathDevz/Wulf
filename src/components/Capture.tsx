import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { CAPTURE_HELP } from '../lib/capture';

interface Props {
  placeholder?: string;
  onSubmit: (text: string) => void;
  autoFocus?: boolean;
  focusSignal?: number;
  showHints?: boolean;
}

export function Capture({ placeholder = 'What do you want to do?', onSubmit, autoFocus, focusSignal, showHints = true }: Props) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (focusSignal) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [focusSignal]);

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onSubmit(v);
    setValue('');
  };

  return (
    <>
      <div className="capture">
        <span className="cap-icon">
          <Icon name="plus" size={17} strokeWidth={1.8} />
        </span>
        <input
          ref={ref}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') {
              setValue('');
              (e.target as HTMLInputElement).blur();
            }
          }}
          aria-label={placeholder}
          spellCheck
        />
        <span className="enter-hint">ENTER</span>
      </div>
      {showHints && (
        <div className="capture-hint" aria-hidden={!focused}>
          {focused || value
            ? CAPTURE_HELP.map((h) => (
                <span key={h.token}>
                  <code>{h.token}</code> {h.meaning}
                </span>
              ))
            : null}
        </div>
      )}
    </>
  );
}
