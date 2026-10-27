let a = 1.6;
let dt = 0.01;
let maxPoints = 1600;
const PARTICLE_STEPS_PER_FRAME = 2;
let attractors = [];
let center;
let radius;
let prepared = 0;
let minX = Infinity, minY = Infinity, minZ = Infinity;
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
let tracerColor;
let tracerHaloColor;
let attractorVisible = true;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function syncAnimation() {
  if (!center) return;
  if (attractorVisible && !document.hidden && !reducedMotion) loop();
  else noLoop();
  redraw();
}

const starts = [
  [0.1, 0, 0],
  [0, 0.1, 0],
  [0, 0, 0.1]
];

function setup() {
  const frame = document.getElementById('attractor');
  createCanvas(frame.clientWidth, frame.clientHeight, WEBGL).parent(frame);
  pixelDensity(1);
  noLoop();

  tracerColor = color('#002FA7');
  tracerHaloColor = color(0, 47, 167, 90);
  const colors = [
    color('#cfd8d2'),
    color('#c1c3c2'),
    color('#AEB3B0')
  ];

  for (let i = 0; i < starts.length; i++) {
    const [x, y, z] = starts[i];
    attractors.push(new Attractor(x, y, z, colors[i]));
  }
  new IntersectionObserver(([entry]) => {
    attractorVisible = entry.isIntersecting;
    syncAnimation();
  }, { threshold: 0.01 }).observe(frame);
  document.addEventListener('visibilitychange', syncAnimation);
  new MutationObserver(syncAnimation).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  setTimeout(prepareBatch, 0);
}

function windowResized() {
  const frame = document.getElementById('attractor');
  resizeCanvas(frame.clientWidth, frame.clientHeight);
  if (center && !isLooping()) redraw();
}

function prepareBatch() {
  const end = Math.min(prepared + 25, maxPoints);
  while (prepared < end) {
    for (const attractor of attractors) {
      attractor.update();
      const p = attractor.points[attractor.points.length - 1];
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    prepared++;
  }

  if (prepared < maxPoints) {
    setTimeout(prepareBatch, 0);
  } else {
    center = createVector((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
    radius = Math.max(1, Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2);
    for (const attractor of attractors) attractor.startParticle();
    syncAnimation();
  }
}

function draw() {
  if (!center) return;
  background(document.body.classList.contains('dark') ? '#151515' : '#F7F7F2');
  rotateY(frameCount * 0.0018);
  rotateX(-0.2 + Math.sin(frameCount * 0.0011) * 0.12);
  scale(0.67 * Math.min(width, height) / radius);
  translate(-center.x, -center.y, -center.z);

  for (const attractor of attractors) {
    for (let i = 0; i < PARTICLE_STEPS_PER_FRAME; i++) {
      attractor.updateParticle();
    }
    attractor.display();
  }
}
