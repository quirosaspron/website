import { LifeGrid } from './life-grid.js';

const host = document.querySelector('#life-art');
const playButton = document.querySelector('#life-play');
const clearButton = document.querySelector('#life-clear');
const randomButton = document.querySelector('#life-random');
const themeButton = document.querySelector('#life-theme');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

new window.p5((p) => {
  let grid;
  let cellWidth;
  let cellHeight;
  let playing = !reducedMotion;
  let inView = true;

  function dimensions(width, height) {
    const cellSize = 7;
    return {
      cols: Math.max(1, Math.ceil(width / cellSize)),
      rows: Math.max(1, Math.ceil(height / cellSize)),
    };
  }

  function updateButton() {
    playButton.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
    playButton.setAttribute('aria-pressed', String(playing));
  }

  function updateLoop() {
    if (playing && inView) p.loop();
    else {
      p.noLoop();
      p.redraw();
    }
  }

  function resizeToHost() {
    const width = Math.max(1, Math.round(host.clientWidth));
    const height = Math.max(1, Math.round(host.clientHeight));
    if (width === p.width && height === p.height) return;
    const next = dimensions(width, height);
    grid.resize(next.cols, next.rows);
    cellWidth = 7;
    cellHeight = 7;
    p.resizeCanvas(width, height);
  }

  p.setup = () => {
    const width = Math.max(1, Math.round(host.clientWidth));
    const height = Math.max(1, Math.round(host.clientHeight));
    p.createCanvas(width, height);
    p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
    p.frameRate(12);
    const initial = dimensions(width, height);
    grid = new LifeGrid(initial.cols, initial.rows);
    cellWidth = 7;
    cellHeight = 7;
    updateButton();
    new ResizeObserver(resizeToHost).observe(host);
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateLoop();
    }).observe(host);
    if (reducedMotion) updateLoop();
  };

  p.draw = () => {
    if (playing && inView) grid.step();
    p.clear(); // Transparent canvas: the site's CSS owns the background color.
    p.noStroke();
    p.fill('#4169e1'); // Royal blue at full opacity.
    for (let x = 0; x < grid.cols; x++) {
      for (let y = 0; y < grid.rows; y++) {
        if (grid.cells[x][y] && (x + 1) * cellWidth <= p.width && (y + 1) * cellHeight <= p.height) {
          p.rect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
      }
    }
    p.drawingContext.globalAlpha = 1;
  };

  p.mouseMoved = () => {
    if (p.mouseX < 0 || p.mouseX >= p.width || p.mouseY < 0 || p.mouseY >= p.height) return;
    grid.paint(Math.floor(p.mouseX / cellWidth), Math.floor(p.mouseY / cellHeight));
    if (!playing) p.redraw();
  };

  playButton.addEventListener('click', () => {
    playing = !playing;
    updateButton();
    updateLoop();
  });
  clearButton.addEventListener('click', () => {
    grid.clear();
    p.redraw();
  });
  randomButton.addEventListener('click', () => {
    grid.randomize();
    p.redraw();
  });
}, host);

const themeStorageKey = 'mateo-site-theme';

function setTheme(theme) {
  const dark = theme === 'dark';
  document.body.classList.toggle('dark', dark);
  themeButton.setAttribute('aria-label', dark ? 'Switch to bright mode' : 'Switch to dark mode');
  themeButton.textContent = dark ? '☼' : '◐';
  localStorage.setItem(themeStorageKey, theme);
}

setTheme(localStorage.getItem(themeStorageKey) || 'bright');
themeButton.addEventListener('click', () => {
  setTheme(document.body.classList.contains('dark') ? 'bright' : 'dark');
});
