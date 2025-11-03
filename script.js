(() => {
  const form = document.getElementById('countdownForm');
  const inputSection = document.getElementById('inputSection');
  const timerSection = document.getElementById('timerSection');
  const circlesGrid = document.getElementById('circlesGrid');
  const timeValues = document.getElementById('timeValues');
  const cancelBtn = document.getElementById('cancelBtn');
  const resetBtn = document.getElementById('resetBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const themeToggle = document.getElementById('themeToggle');

  // units we'll show
  const UNITS = [
    { key: 'days', label: 'Days' },
    { key: 'hours', label: 'Hours' },
    { key: 'minutes', label: 'Minutes' },
    { key: 'seconds', label: 'Seconds' },
  ];

  let totalDuration = 0; // ms
  let startTime = 0;
  let targetTime = 0;
  let rafTimer = null;
  let paused = false;
  let pauseRemaining = 0;

  // store the circle elements and initial circumference
  const circles = [];

  // theme handling
  function applyTheme(checked) {
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  // initialize theme from prefers-color-scheme or toggle
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  themeToggle.checked = prefersDark;
  applyTheme(prefersDark);

  themeToggle.addEventListener('change', (e) => applyTheme(e.target.checked));

  // helper: create a single circle UI
  function createCircle(id, colorVar) {
    const wrap = document.createElement('div');
    wrap.className = 'circle-wrap';

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.classList.add('svg-circle');

    const radius = 40;
    const cx = 50;
    const cy = 50;
    const circumference = 2 * Math.PI * radius;

    const bg = document.createElementNS(svgNS, 'circle');
    bg.classList.add('bg-ring');
    bg.setAttribute('cx', cx);
    bg.setAttribute('cy', cy);
    bg.setAttribute('r', radius);

    const fg = document.createElementNS(svgNS, 'circle');
    fg.classList.add('fg-ring');
    // set stroke color via inline style to pick up CSS variables
    fg.style.stroke = `var(${colorVar})` || 'var(--accent)';
    fg.setAttribute('cx', cx);
    fg.setAttribute('cy', cy);
    fg.setAttribute('r', radius);
    fg.setAttribute('stroke-dasharray', circumference);
    fg.setAttribute('stroke-dashoffset', 0);

    svg.appendChild(bg);
    svg.appendChild(fg);

    const num = document.createElement('div');
    num.className = 'time-num';
    num.textContent = '0';

    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = id;

    wrap.appendChild(svg);
    wrap.appendChild(num);
    wrap.appendChild(label);

    return {
      wrap,
      svg,
      fg,
      numEl: num,
      circumference,
      id,
    };
  }

  // build the circular UI for the four units
  function buildUI() {
    circlesGrid.innerHTML = '';
    timeValues.innerHTML = '';
    circles.length = 0;

    // different color variables for variety
    const colors = ['--accent', '--accent-2', '--accent', '--accent-2'];

    UNITS.forEach((u, idx) => {
      const c = createCircle(u.label, colors[idx % colors.length]);
      circlesGrid.appendChild(c.wrap);
      circles.push(c);

      // also create numeric legend
      const tv = document.createElement('div');
      tv.className = 'time-value';
      tv.innerHTML = `<div class="num" id="num-${u.key}">0</div><div class="unit">${u.label}</div>`;
      timeValues.appendChild(tv);
    });
  }

  // compute the broken down remaining time from ms
  function breakdown(ms) {
    if (ms < 0) ms = 0;
    const secs = Math.floor(ms / 1000);
    const days = Math.floor(secs / 86400);
    const hours = Math.floor((secs % 86400) / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60);
    return { days, hours, minutes, seconds };
  }

  // animate circles based on remaining / totalDuration
  // we compute for each circle a ratio = remaining / totalDuration (clamped)
  // and set stroke-dashoffset to show "disappearing ring"
  function updateUI(remainingMs) {
    // update numerical display
    const parts = breakdown(remainingMs);
    document.getElementById('num-days').textContent = parts.days;
    document.getElementById('num-hours').textContent = parts.hours;
    document.getElementById('num-minutes').textContent = parts.minutes;
    document.getElementById('num-seconds').textContent = parts.seconds;

    circles.forEach((c, idx) => {
      // ratio of remaining -> 1 -> full stroke visible, 0 -> gone
      const ratio = Math.max(0, Math.min(1, remainingMs / Math.max(1, totalDuration)));
      // optional staggering: give each circle a slightly different visible fraction
      // For direct mapping to the user's request we'll use same ratio for all circles.
      const offset = Math.round(c.circumference * (1 - ratio));
      // set dashoffset with a transition in CSS; this will animate easing-in
      c.fg.style.strokeDashoffset = offset;
      // update the visible number in the circle itself (primary number)
      switch (idx) {
        case 0: c.numEl.textContent = parts.days; break;
        case 1: c.numEl.textContent = parts.hours; break;
        case 2: c.numEl.textContent = parts.minutes; break;
        case 3: c.numEl.textContent = parts.seconds; break;
      }
    });
  }

  // main tick using requestAnimationFrame for smoothness
  function tick() {
    if (paused) return;
    const now = Date.now();
    let remaining = targetTime - now;
    if (remaining <= 0) {
      remaining = 0;
      updateUI(0);
      finishCountdown();
      return;
    } else {
      updateUI(remaining);
      rafTimer = requestAnimationFrame(tick);
    }
  }

  function finishCountdown() {
    // show finished state visually
    timerSection.classList.add('finished');
    pauseBtn.disabled = true;
    cancelBtn.disabled = true;
    resetBtn.disabled = false;
    if (rafTimer) {
      cancelAnimationFrame(rafTimer);
      rafTimer = null;
    }
  }

  function stopCountdown() {
    if (rafTimer) {
      cancelAnimationFrame(rafTimer);
      rafTimer = null;
    }
    paused = false;
    pauseRemaining = 0;
    timerSection.classList.remove('finished');
    pauseBtn.textContent = 'Pause';
    pauseBtn.disabled = true;
    cancelBtn.disabled = true;
    resetBtn.disabled = false;
  }

  // form submit handler: compute targetTime and transition
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    const days = Math.max(0, parseInt(fd.get('days') || 0, 10));
    const hours = Math.max(0, parseInt(fd.get('hours') || 0, 10));
    const minutes = Math.max(0, parseInt(fd.get('minutes') || 0, 10));
    const seconds = Math.max(0, parseInt(fd.get('seconds') || 0, 10));

    const durationMs = (((((days * 24) + hours) * 60 + minutes) * 60) + seconds) * 1000;
    if (durationMs <= 0) {
      alert('Please enter a duration greater than zero.');
      return;
    }

    // Build UI and prepare animation
    buildUI();

    // capture times
    startTime = Date.now();
    totalDuration = durationMs;
    targetTime = startTime + durationMs;

    // UI transition: collapse input section and show timer section with transition
    inputSection.classList.add('hidden');
    timerSection.classList.remove('hidden');

    // small entrance animation (uses CSS transitions)
    requestAnimationFrame(() => {
      timerSection.style.opacity = '0';
      timerSection.style.transform = 'translateY(8px)';
      requestAnimationFrame(() => {
        timerSection.style.transition = 'transform 600ms var(--ease), opacity 600ms var(--ease)';
        timerSection.style.opacity = '1';
        timerSection.style.transform = 'translateY(0)';
      });
    });

    // enable controls
    cancelBtn.disabled = false;
    resetBtn.disabled = false;
    pauseBtn.disabled = false;

    paused = false;
    pauseRemaining = 0;

    // initialize circles to full stroke (ratio = 1)
    updateUI(totalDuration);

    // begin tick after a slight delay so the first stroke animation eases in
    setTimeout(() => {
      if (rafTimer) cancelAnimationFrame(rafTimer);
      rafTimer = requestAnimationFrame(tick);
    }, 120);
  });

  // Cancel returns to input
  cancelBtn.addEventListener('click', () => {
    if (rafTimer) cancelAnimationFrame(rafTimer);
    rafTimer = null;
    inputSection.classList.remove('hidden');
    timerSection.classList.add('hidden');
    stopCountdown();
  });

  resetBtn.addEventListener('click', () => {
    // reset UI to input mode
    if (rafTimer) cancelAnimationFrame(rafTimer);
    rafTimer = null;
    inputSection.classList.remove('hidden');
    timerSection.classList.add('hidden');
    stopCountdown();
  });

  pauseBtn.addEventListener('click', () => {
    if (!rafTimer && !paused) return;
    if (!paused) {
      // pause
      paused = true;
      pauseRemaining = targetTime - Date.now();
      if (rafTimer) cancelAnimationFrame(rafTimer);
      rafTimer = null;
      pauseBtn.textContent = 'Resume';
    } else {
      // resume
      paused = false;
      targetTime = Date.now() + pauseRemaining;
      pauseRemaining = 0;
      pauseBtn.textContent = 'Pause';
      rafTimer = requestAnimationFrame(tick);
    }
  });

  // keyboard: Esc resets
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      resetBtn.click();
    }
  });

  // initial build to show placeholders (not active)
  buildUI();

  // Accessibility: expose simple text to screen readers when hidden/shown
  // (aria-live is on timerSection container)
})();