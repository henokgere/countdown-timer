import React, { useEffect, useRef, useState } from 'react';
import './App.css';

import useRafInterval from './hooks/useRafInterval';
import { computeTotalMs } from './utils/time';
import CountdownForm from './components/CountdownForm';
import CountdownTimer from './components/CountdownTimer';

function App() {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [target, setTarget] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [initialMs, setInitialMs] = useState(0);
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      setRunning(false);
      setPaused(false);
    }
  }, [remaining, running]);

  // tick while running and not paused
  useRafInterval(() => {
    if (!running || paused || !target) return;
    const now = Date.now();
    const ms = Math.max(0, target - now);
    setRemaining(ms);
  }, 200, running && !paused);

  function handleStart(inputs) {
    const total = computeTotalMs(inputs);
    if (!total) return;
    setInitialMs(total);
    setTarget(Date.now() + total);
    setRemaining(total);
    setRunning(true);
    setPaused(false);
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

  return (
    <main className="page">
      <header className="header">
        <h1>Countdown Timer</h1>
      </header>

      {!showTimer && (
        <CountdownForm onStart={handleStart} defaultValues={{ days:0, hours:0, minutes:0, seconds:10 }} />
      )}

      {showTimer && (
        <div>
          <CountdownTimer remaining={remaining} initialMs={initialMs} paused={paused} onPause={handlePause} onReset={handleReset} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" id="cancelBtn" className="btn cancel" onClick={handleCancel} disabled={!running && !showTimer}>Cancel</button>
          </div>
        </div>
      )}

      <footer className="footer">
        <small>Built with React · CSS · JavaScript — Easing transition to circular timers</small>
      </footer>
    </main>
  );
}

export default App;
