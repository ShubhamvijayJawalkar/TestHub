// ============================================================
// TESTHUB CHARTS — zero dependencies SVG helpers
// ============================================================

// ---------- SCORE RING ----------
// Renders a circular progress ring with score in the center.
// Usage: scoreRing(containerEl, { pct: 75, size: 120, stroke: 8, color: '#2F5DE3' })
// Returns the container element.

function scoreRing(container, opts) {
  opts = opts || {};
  const pct = Math.max(0, Math.min(100, opts.pct || 0));
  const size = opts.size || 120;
  const stroke = opts.stroke || 8;
  const color = opts.color || '#2F5DE3';
  const trackColor = opts.trackColor || '#E4E7F0';
  const label = opts.label || pct + '%';

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.style.display = 'block';

  // Track circle
  const track = document.createElementNS(svgNS, 'circle');
  track.setAttribute('cx', cx);
  track.setAttribute('cy', cy);
  track.setAttribute('r', r);
  track.setAttribute('fill', 'none');
  track.setAttribute('stroke', trackColor);
  track.setAttribute('stroke-width', stroke);
  svg.appendChild(track);

  // Progress circle
  const prog = document.createElementNS(svgNS, 'circle');
  prog.setAttribute('cx', cx);
  prog.setAttribute('cy', cy);
  prog.setAttribute('r', r);
  prog.setAttribute('fill', 'none');
  prog.setAttribute('stroke', color);
  prog.setAttribute('stroke-width', stroke);
  prog.setAttribute('stroke-linecap', 'round');
  prog.setAttribute('stroke-dasharray', circ);
  prog.setAttribute('stroke-dashoffset', offset);
  prog.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
  svg.appendChild(prog);

  // Label
  const text = document.createElementNS(svgNS, 'text');
  text.setAttribute('x', cx);
  text.setAttribute('y', cy);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'central');
  text.setAttribute('fill', 'var(--ink, #101A33)');
  text.setAttribute('font-family', "var(--font-mono, 'IBM Plex Mono', monospace)");
  text.setAttribute('font-size', Math.max(12, size * 0.22));
  text.setAttribute('font-weight', '700');
  text.textContent = label;
  svg.appendChild(text);

  container.innerHTML = '';
  container.appendChild(svg);
  return container;
}

// ---------- BAR CHART ----------
// Simple horizontal bar chart for category breakdowns.
// Usage: barChart(containerEl, { data: [{ label, value, color }], height: 200 })
// Returns the container.

function barChart(container, opts) {
  opts = opts || {};
  const data = opts.data || [];
  const height = opts.height || data.length * 36 + 20;
  const barHeight = opts.barHeight || 20;
  const gap = opts.gap || 8;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const labelWidth = 140;

  const w = container.clientWidth || 400;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${w} ${height}`);
  svg.style.display = 'block';

  data.forEach((d, i) => {
    const y = i * (barHeight + gap) + 4;
    const barW = (d.value / maxVal) * (w - labelWidth - 60);

    // Label
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', 4);
    label.setAttribute('y', y + barHeight / 2);
    label.setAttribute('dominant-baseline', 'central');
    label.setAttribute('fill', 'var(--slate, #4A5578)');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-family', "var(--font-body, sans-serif)");
    label.textContent = d.label;
    svg.appendChild(label);

    // Bar background
    const bg = document.createElementNS(svgNS, 'rect');
    bg.setAttribute('x', labelWidth);
    bg.setAttribute('y', y);
    bg.setAttribute('width', Math.max(barW, 4));
    bg.setAttribute('height', barHeight);
    bg.setAttribute('rx', '3');
    bg.setAttribute('fill', d.color || '#2F5DE3');
    bg.setAttribute('opacity', '0.85');
    svg.appendChild(bg);

    // Value text
    const vt = document.createElementNS(svgNS, 'text');
    vt.setAttribute('x', labelWidth + Math.max(barW, 4) + 6);
    vt.setAttribute('y', y + barHeight / 2);
    vt.setAttribute('dominant-baseline', 'central');
    vt.setAttribute('fill', 'var(--ink, #101A33)');
    vt.setAttribute('font-size', '12');
    vt.setAttribute('font-weight', '600');
    vt.setAttribute('font-family', "var(--font-mono, 'IBM Plex Mono', monospace)");
    vt.textContent = Math.round(d.value) + '%';
    svg.appendChild(vt);
  });

  container.innerHTML = '';
  container.appendChild(svg);
  return container;
}

// ---------- SPARKLINE ----------
// Mini line chart for score trends (history).
// Usage: sparkline(containerEl, { data: [60,75,80,90], width: 120, height: 32, color: '#2F5DE3' })
// Returns the container.

function sparkline(container, opts) {
  opts = opts || {};
  const data = opts.data || [];
  const width = opts.width || 120;
  const height = opts.height || 32;
  const color = opts.color || '#2F5DE3';

  if (!data.length) {
    container.innerHTML = '<span style="color:var(--slate);font-size:11px;">No data</span>';
    return container;
  }

  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * w;
    const y = padding + h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.style.display = 'block';

  const polyline = document.createElementNS(svgNS, 'polyline');
  polyline.setAttribute('points', points.join(' '));
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', color);
  polyline.setAttribute('stroke-width', '2');
  polyline.setAttribute('stroke-linejoin', 'round');
  polyline.setAttribute('stroke-linecap', 'round');
  svg.appendChild(polyline);

  // Fill area under the line
  // Build fill path
  const first = points[0].split(',');
  const last = points[points.length - 1].split(',');
  const fillD = `M${points.join(' L')} L${last[0]},${padding + h} L${first[0]},${padding + h} Z`;
  const fillPath = document.createElementNS(svgNS, 'path');
  fillPath.setAttribute('d', fillD);
  fillPath.setAttribute('fill', color);
  fillPath.setAttribute('opacity', '0.1');
  svg.appendChild(fillPath);

  container.innerHTML = '';
  container.appendChild(svg);
  return container;
}
