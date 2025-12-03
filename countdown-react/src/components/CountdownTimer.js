import React from 'react';
import { msToParts, pad } from '../utils/time';

function Circle({ label, value, max, hide }) {
  if (hide) return null;
  const r = 48;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, value / max));
  return (
    <div className="circle-wrap">
      <svg className="svg-circle" viewBox="0 0 120 120">
        <circle className="bg-ring" cx="60" cy="60" r={r} />
        <circle
          className="fg-ring"
          cx="60"
          cy="60"
          r={r}
          style={{ strokeDasharray: c, strokeDashoffset: (1 - frac) * c }}
        />
      </svg>
      <div className="time-num">{label === 'Days' ? value : pad(value)}</div>
      <div className="label">{label}</div>
    </div>
  );
}

export default function CountdownTimer({ remaining, initialMs, paused, onPause, onReset }) {
  const parts = msToParts(remaining);
  const initialDays = Math.floor(initialMs / (24 * 60 * 60 * 1000));

  const units = [
    { key: 'days', label: 'Days', value: parts.days, max: Math.max(1, initialDays), hide: initialDays === 0 },
    { key: 'hours', label: 'Hours', value: parts.hours, max: 24, hide: false },
    { key: 'minutes', label: 'Minutes', value: parts.minutes, max: 60, hide: false },
    { key: 'seconds', label: 'Seconds', value: parts.seconds, max: 60, hide: false },
  ];

  return (
    <section className={`timer ${remaining === 0 ? 'finished' : ''}`} id="timerSection" aria-live="polite">
      <div className="circles-grid" id="circlesGrid">
        {units.map(u => (
          <Circle key={u.key} label={u.label} value={u.value} max={u.max} hide={u.hide} />
        ))}
      </div>

      <div className="legend">
        <div className="time-values" id="timeValues">
          {units.map(u => (
            u.hide ? null : (
              <div className="time-value" key={u.key}>
                <div className="num">{u.label === 'Days' ? u.value : pad(u.value)}</div>
                <div className="unit">{u.label}</div>
              </div>
            )
          ))}
        </div>
      </div>

      <div className="controls small">
        <button id="resetBtn" className="btn" onClick={onReset}>Reset</button>
        <button id="pauseBtn" className="btn" onClick={onPause}>{paused ? 'Resume' : 'Pause'}</button>
      </div>
    </section>
  );
}
