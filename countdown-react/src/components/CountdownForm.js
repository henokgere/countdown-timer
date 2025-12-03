import React, { useState } from 'react';

export default function CountdownForm({ onStart, defaultValues = { days:0, hours:0, minutes:0, seconds:10 } }) {
  const [inputs, setInputs] = useState(defaultValues);

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs(i => ({ ...i, [name]: Math.max(0, Number(value)) }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (onStart) onStart(inputs);
  }

  return (
    <section className="controls" id="inputSection">
      <form id="countdownForm" className="form" onSubmit={handleSubmit} autoComplete="off">
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
        </div>
      </form>
      <p className="hint">Enter a duration and press Start. The input will transition into circular countdowns.</p>
    </section>
  );
}
