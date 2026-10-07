// Minimal single-series line chart (0-100 scale) with tap/hover tooltips.
// One series, so no legend: the card title names it.

export function lineChart(el, values, labels) {
  if (!values.length) return;
  const W = 320; const H = 150;
  const pad = { l: 28, r: 12, t: 12, b: 18 };
  const iw = W - pad.l - pad.r; const ih = H - pad.t - pad.b;
  const x = (i) => pad.l + (values.length === 1 ? iw / 2 : (i * iw) / (values.length - 1));
  const y = (v) => pad.t + ih - (Math.max(0, Math.min(100, v)) / 100) * ih;

  const grid = [0, 25, 50, 75, 100].map((g) => `
    <line x1="${pad.l}" x2="${W - pad.r}" y1="${y(g)}" y2="${y(g)}" class="grid"/>
    <text x="${pad.l - 6}" y="${y(g) + 3}" class="axis" text-anchor="end">${g}</text>`).join('');
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${d} L${x(values.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const dots = values.map((v, i) => `
    <circle cx="${x(i)}" cy="${y(v)}" r="4" class="dot"/>
    <rect x="${x(i) - 14}" y="${pad.t}" width="28" height="${ih}" class="hit" data-i="${i}"/>`).join('');

  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart: ${values.join(', ')}">
      <defs><linearGradient id="lg-${el.dataset.uid || 'a'}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="var(--accent)" stop-opacity=".28"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/>
      </linearGradient></defs>
      ${grid}
      <path d="${area}" fill="url(#lg-${el.dataset.uid || 'a'})"/>
      <path d="${d}" class="line"/>
      ${dots}
    </svg>
    <div class="tooltip" hidden></div>`;

  const tip = el.querySelector('.tooltip');
  const show = (i) => {
    tip.hidden = false;
    tip.innerHTML = `<b>${values[i]}</b> <span>${labels[i] ?? ''}</span>`;
    const rect = el.getBoundingClientRect();
    const px = (x(i) / W) * rect.width;
    tip.style.left = `${Math.max(4, Math.min(rect.width - 140, px - 70))}px`;
    tip.style.top = `${(y(values[i]) / H) * rect.height - 40}px`;
  };
  el.querySelectorAll('.hit').forEach((r) => {
    r.addEventListener('pointerenter', () => show(+r.dataset.i));
    r.addEventListener('click', () => show(+r.dataset.i));
  });
  el.addEventListener('pointerleave', () => { tip.hidden = true; });
}
