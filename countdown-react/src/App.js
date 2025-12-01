import React, { useEffect, useRef, useState } from 'react';
import './App.css';

const UNIT_MS = {
  days: 24 * 60 * 60 * 1000,
  hours: 60 * 60 * 1000,
  minutes: 60 * 1000,
  seconds: 1000,
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function useRafInterval(fn, delay, active = true) {
  const savedRef = useRef();
  useEffect(() => { savedRef.current = fn; }, [fn]);
  useEffect(() => {
    if (!active) return;
    let id = null;
    let last = performance.now();
    function loop(now) {
      if (now - last >= delay) {
        savedRef.current(now);
        last = now;
      }
      id = requestAnimationFrame(loop);
    }
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [delay, active]);
}

function App() {
  const [inputs, setInputs] = useState({ days: 0, hours: 0, minutes: 0, seconds: 10 });
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [target, setTarget] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [initialMs, setInitialMs] = useState(0);
  const [showTimer, setShowTimer] = useState(false);

  const formRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      setRunning(false);
      setPaused(false);
    }
  }, [remaining, running]);

  // RAF-based tick for smooth updates (200ms granularity)
  useRafInterval(() => {
    if (!running || paused || !target) return;
    const now = Date.now();
    const ms = Math.max(0, target - now);
    setRemaining(ms);
  }, 200, running && !paused);

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs(i => ({ ...i, [name]: Math.max(0, Number(value)) }));
  }

  function computeTotalMs(fromInputs) {
    return (fromInputs.days || 0) * UNIT_MS.days
      + (fromInputs.hours || 0) * UNIT_MS.hours
      + (fromInputs.minutes || 0) * UNIT_MS.minutes
      + (fromInputs.seconds || 0) * UNIT_MS.seconds;
  }

  function handleStart(e) {
    e.preventDefault();
    const total = computeTotalMs(inputs);
    if (!total) return;
    setInitialMs(total);
    setTarget(Date.now() + total);
    setRemaining(total);
    setRunning(true);
    setPaused(false);
    // trigger transition
    setShowTimer(true);
  }

  function handleCancel() {
    setRunning(false);
    setPaused(false);
    setTarget(null);
    setRemaining(0);
    setInitialMs(0);
    setShowTimer(false);
  }

  function handlePause() {
    setPaused(p => !p);
  }

  function handleReset() {
    if (!initialMs) return;
    setTarget(Date.now() + initialMs);
    setRemaining(initialMs);
    setRunning(true);
    setPaused(false);
  }

  // Derive units from remaining ms
  const days = Math.floor(remaining / UNIT_MS.days);
  const hours = Math.floor((remaining % UNIT_MS.days) / UNIT_MS.hours);
  const minutes = Math.floor((remaining % UNIT_MS.hours) / UNIT_MS.minutes);
  const seconds = Math.floor((remaining % UNIT_MS.minutes) / UNIT_MS.seconds);

  // initial maxima for circles
  const initialDays = Math.floor(initialMs / UNIT_MS.days);

  const units = [
    { key: 'days', label: 'Days', value: days, max: Math.max(1, initialDays), hide: initialDays === 0 },
    { key: 'hours', label: 'Hours', value: hours, max: 24, hide: false },
    { key: 'minutes', label: 'Minutes', value: minutes, max: 60, hide: false },
    { key: 'seconds', label: 'Seconds', value: seconds, max: 60, hide: false },
  ];

  return (
    <main className="page">
      <header className="header">
        <h1>Countdown Timer</h1>
      </header>

      <section className="controls" id="inputSection" style={{ display: showTimer ? 'none' : undefined }}>
        <form id="countdownForm" className="form" onSubmit={handleStart} ref={formRef} autoComplete="off">
          <div className="row">
            <label>
              Days
              <input name="days" type="number" min="0" value={inputs.days} onChange={handleChange} />
            </label>
            <label>
              Hours
              <input name="hours" type="number" min="0" max="23" value={inputs.hours} onChange={handleChange} />
            </label>
            <label>
              Minutes
              <input name="minutes" type="number" min="0" max="59" value={inputs.minutes} onChange={handleChange} />
            </label>
            <label>
              Seconds
              <input name="seconds" type="number" min="0" max="59" value={inputs.seconds} onChange={handleChange} />
            </label>
          </div>

          <div className="row">
            <button type="submit" className="btn primary">Start Countdown</button>
            <button type="button" id="cancelBtn" className="btn" onClick={handleCancel} disabled={!running && !showTimer}>Cancel</button>
          </div>
        </form>
        <p className="hint">Enter a duration and press Start. The input will transition into circular countdowns.</p>
      </section>

      <section className={`timer ${showTimer ? 'finished' : 'hidden'}`} id="timerSection" aria-live="polite" style={{ display: showTimer ? undefined : 'none' }}>
        <div className="circles-grid" id="circlesGrid">
          {units.map(u => (
            u.hide ? null : (
              <div className="circle-wrap" key={u.key}>
                <svg className="svg-circle" viewBox="0 0 120 120">
                  <circle className="bg-ring" cx="60" cy="60" r="48" />
                  <circle
                    className="fg-ring"
                    cx="60"
                    cy="60"
                    r="48"
                    style={{
                      strokeDasharray: 2 * Math.PI * 48,
                      strokeDashoffset: (1 - (u.value / u.max)) * 2 * Math.PI * 48,
                    }}
                  />
                </svg>
                <div className="time-num">{u.key === 'days' ? u.value : pad(u.value)}</div>
                <div className="label">{u.label}</div>
              </div>
            )
          ))}
        </div>

        <div className="legend">
          <div className="time-values" id="timeValues">
            {units.map(u => (
              u.hide ? null : (
                <div className="time-value" key={u.key}>
                  <div className="num">{u.key === 'days' ? u.value : pad(u.value)}</div>
                  <div className="unit">{u.label}</div>
                </div>
              )
            ))}
          </div>
        </div>

        <div className="controls small">
          <button id="resetBtn" className="btn" onClick={handleReset}>Reset</button>
          <button id="pauseBtn" className="btn" onClick={handlePause}>{paused ? 'Resume' : 'Pause'}</button>
        </div>
      </section>

      <footer className="footer">
        <small>Built with React · CSS · JavaScript — Easing transition to circular timers</small>
      </footer>
    </main>
  );
}

export default App;
