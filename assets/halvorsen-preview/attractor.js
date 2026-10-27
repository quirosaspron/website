class Attractor {
  constructor(x, y, z, c) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.c = c;
    this.points = [];
    this.particleX = x;
    this.particleY = y;
    this.particleZ = z;
    this.trail = [];
    this.trailLength = 48;
  }

  // Build the fixed gray attractor path during the sketch's preparation phase.
  update() {
    const next = this.rk4(this.x, this.y, this.z);
    this.x = next.x;
    this.y = next.y;
    this.z = next.z;
    this.points.push(createVector(this.x, this.y, this.z));
    if (this.points.length > maxPoints) this.points.shift();
  }

  // Start the live particle where the precomputed path ends.
  startParticle() {
    this.particleX = this.x;
    this.particleY = this.y;
    this.particleZ = this.z;
    this.trail = [createVector(this.particleX, this.particleY, this.particleZ)];
  }

  updateParticle() {
    const next = this.rk4(this.particleX, this.particleY, this.particleZ);
    this.particleX = next.x;
    this.particleY = next.y;
    this.particleZ = next.z;
    this.trail.push(createVector(this.particleX, this.particleY, this.particleZ));
    if (this.trail.length > this.trailLength) this.trail.shift();
  }

  rk4(x, y, z) {
    const f = (x, y, z) => [
      -a * x - 4 * y - 4 * z - y * y,
      -a * y - 4 * z - 4 * x - z * z,
      -a * z - 4 * x - 4 * y - x * x
    ];

    const k1 = f(x, y, z);
    const k2 = f(x + dt * k1[0] / 2, y + dt * k1[1] / 2, z + dt * k1[2] / 2);
    const k3 = f(x + dt * k2[0] / 2, y + dt * k2[1] / 2, z + dt * k2[2] / 2);
    const k4 = f(x + dt * k3[0], y + dt * k3[1], z + dt * k3[2]);

    return {
      x: x + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
      y: y + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
      z: z + dt / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])
    };
  }

  display() {
    if (this.points.length < 2) return;
    push();
    noFill();
    stroke(this.c);
    strokeWeight(2.2);
    beginShape();
    for (let i = 0; i < this.points.length; i += 3) {
      const sample = this.points[i];
      vertex(sample.x, sample.y, sample.z);
    }
    const lastPathPoint = this.points[this.points.length - 1];
    vertex(lastPathPoint.x, lastPathPoint.y, lastPathPoint.z);
    endShape();

    if (this.trail.length > 1) {
      stroke(tracerColor);
      strokeWeight(3.5);
      beginShape();
      for (const sample of this.trail) {
        vertex(sample.x, sample.y, sample.z);
      }
      endShape();
    }

    stroke(tracerHaloColor);
    strokeWeight(18);
    point(this.particleX, this.particleY, this.particleZ);
    stroke(tracerColor);
    strokeWeight(8);
    point(this.particleX, this.particleY, this.particleZ);
    pop();
  }
}