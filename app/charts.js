// Small dependency-free SVG charts for StatAtlas. Both charts take plain arrays
// and return an SVG string, so any page can embed them without a library.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

// Horizontal bar chart: rows of { label, value, display }. The longest bar
// fills the track; every bar shows its value at the end.
export function barChart(rows, opts = {}) {
  const width = opts.width ?? 640;
  const barH = opts.barHeight ?? 26;
  const gap = opts.gap ?? 10;
  const labelW = opts.labelWidth ?? 120;
  const valueW = opts.valueWidth ?? 88;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const trackW = width - labelW - valueW - 16;
  const height = rows.length * (barH + gap) + 8;
  const color = opts.color ?? '#0e7c7b';
  const bars = rows
    .map((r, i) => {
      const y = 8 + i * (barH + gap);
      const w = Math.max(2, (r.value / max) * trackW);
      return `<text x="0" y="${y + barH / 2 + 4}" class="chart-label">${esc(r.label)}</text>
  <rect x="${labelW}" y="${y}" width="${w}" height="${barH}" rx="4" fill="${r.color ?? color}"></rect>
  <text x="${labelW + w + 8}" y="${y + barH / 2 + 4}" class="chart-value">${esc(r.display)}</text>`;
    })
    .join('\n  ');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(opts.aria ?? 'Bar chart')}" class="chart">${bars}
</svg>`;
}

// Line chart over a year series: points of { year, value }. Draws the line,
// area fill, dots and year labels.
export function lineChart(points, opts = {}) {
  const width = opts.width ?? 640;
  const height = opts.height ?? 260;
  const padL = 64;
  const padR = 16;
  const padT = 14;
  const padB = 28;
  const values = points.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (max === min) max = min + 1;
  const span = max - min;
  min -= span * 0.08;
  max += span * 0.08;
  const x = (i) => padL + (i * (width - padL - padR)) / (points.length - 1);
  const y = (v) => padT + ((max - v) / (max - min)) * (height - padT - padB);
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${height - padB} L${x(0).toFixed(1)},${height - padB} Z`;
  const dots = points
    .map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="3.5" fill="#0e7c7b"></circle>`)
    .join('\n  ');
  const years = points
    .map((p, i) => `<text x="${x(i).toFixed(1)}" y="${height - 8}" class="chart-year" text-anchor="middle">${p.year}</text>`)
    .join('\n  ');
  const grid = [0, 0.5, 1]
    .map((f) => {
      const v = min + (max - min) * f;
      const gy = y(v);
      return `<line x1="${padL}" y1="${gy.toFixed(1)}" x2="${width - padR}" y2="${gy.toFixed(1)}" class="chart-grid"></line>
  <text x="${padL - 8}" y="${(gy + 4).toFixed(1)}" class="chart-grid-label" text-anchor="end">${esc(opts.formatTick ? opts.formatTick(v) : Math.round(v))}</text>`;
    })
    .join('\n  ');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(opts.aria ?? 'Line chart')}" class="chart">${grid}
  <path d="${area}" fill="#0e7c7b" opacity="0.12"></path>
  <path d="${line}" fill="none" stroke="#0e7c7b" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"></path>
  ${dots}
  ${years}
</svg>`;
}

// Vertical column chart for a year series, used for GDP over time.
export function columnChart(points, opts = {}) {
  const width = opts.width ?? 640;
  const height = opts.height ?? 260;
  const padB = 28;
  const padT = 14;
  const max = Math.max(...points.map((p) => p.value), 1);
  const slot = width / points.length;
  const barW = Math.min(44, slot * 0.62);
  const cols = points
    .map((p, i) => {
      const h = Math.max(2, ((p.value / max) * (height - padT - padB)));
      const cx = slot * i + slot / 2;
      return `<rect x="${(cx - barW / 2).toFixed(1)}" y="${(height - padB - h).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="#c98a1b"></rect>
  <text x="${cx.toFixed(1)}" y="${height - 8}" class="chart-year" text-anchor="middle">${p.year}</text>
  <text x="${cx.toFixed(1)}" y="${(height - padB - h - 6).toFixed(1)}" class="chart-col-value" text-anchor="middle">${esc(p.display)}</text>`;
    })
    .join('\n  ');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(opts.aria ?? 'Column chart')}" class="chart">${cols}
</svg>`;
}
