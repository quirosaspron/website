import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Deliberately small handwritten alphabet: every mathematical mark is an SVG path.
const glyph = {
  x: { w: 14, d: 'M2 5 C6 8 9 12 12 17 M12 4 C9 8 5 13 1 17' },
  y: { w: 14, d: 'M2 5 C3 10 4 15 7 16 C10 13 11 9 12 5 M12 5 C10 16 8 21 3 24' },
  z: { w: 14, d: 'M2 6 C6 4 10 5 12 5 C9 9 5 14 2 17 C6 15 10 16 13 16' },
  a: { w: 14, d: 'M11 7 C8 4 3 5 2 10 C1 14 3 17 7 16 C10 15 11 11 11 7 M11 6 C10 11 10 14 13 17' },
  '4': { w: 15, d: 'M10 2 C8 7 5 11 2 14 C6 13 11 13 14 13 M11 7 C11 12 11 17 11 21' },
  '1': { w: 12, d: 'M3 7 C5 6 7 5 9 3 C9 9 9 15 8 20 M4 20 C7 20 10 20 11 20' },
  '6': { w: 14, d: 'M11 3 C5 6 2 12 3 17 C3 21 7 22 10 19 C13 16 11 13 8 13 C6 13 4 15 3 17' },
  '.': { w: 6, d: 'M2 20 L2.8 20.2' },
  '=': { w: 18, d: 'M2 10 C6 9 12 9 16 9 M2 16 C7 15 12 16 16 15' },
  '-': { w: 13, d: 'M1 13 C5 12 9 12 12 13' },
  '²': { w: 10, d: 'M1 2 C3 -1 8 -1 8 2 C8 5 4 7 1 10 C4 9 7 9 9 9' },
};
const lines = [
  'x = -ax - 4y - 4z - y²',
  'y = -ay - 4z - 4x - z²',
  'z = -az - 4x - 4y - x²',
];
const scale = 1.22;
const output = [];
lines.forEach((line, row) => {
  let x = row * 3.4 + 8;
  const y = 16 + row * 44;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === ' ') { x += 9; continue; }
    const g = glyph[char];
    if (!g) throw Error(`Missing glyph: ${char}`);
    output.push(`<path d="${g.d}" transform="translate(${x.toFixed(1)} ${y}) scale(${scale})"/>`);
    if (i === 0) output.push(`<path d="M${(x + 6.6).toFixed(1)} ${y - 3}l.8-.5"/>`);
    x += g.w * scale + (char === '-' ? 2 : 1.2);
  }
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 132" fill="none" stroke="#444541" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\n${output.join('\n')}\n</svg>\n`;
writeFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'halvorsen-equations.svg'), svg);
