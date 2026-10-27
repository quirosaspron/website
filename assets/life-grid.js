// The Conway rules from the tutorial sketch, with dimensions owned by the grid.
export class LifeGrid {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.cells = Array.from({ length: cols }, () => Array(rows).fill(0));
    this.randomize();
  }

  clear() {
    for (const column of this.cells) column.fill(0);
  }

  randomize(density = 0.3) {
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        this.cells[x][y] = Number(Math.random() < density);
      }
    }
  }

  paint(centerX, centerY, radius = 2) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      for (let y = centerY - radius; y <= centerY + radius; y++) {
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) this.cells[x][y] = 1;
      }
    }
  }

  resize(cols, rows) {
    if (cols === this.cols && rows === this.rows) return;
    const previous = this.cells;
    const oldCols = this.cols;
    const oldRows = this.rows;
    this.cells = Array.from({ length: cols }, (_, x) =>
      Array.from({ length: rows }, (_, y) =>
        previous[Math.min(oldCols - 1, Math.floor(x * oldCols / cols))]
          [Math.min(oldRows - 1, Math.floor(y * oldRows / rows))]
      )
    );
    this.cols = cols;
    this.rows = rows;
  }

  neighbors(x, y) {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        count += this.cells[(x + dx + this.cols) % this.cols]
          [(y + dy + this.rows) % this.rows];
      }
    }
    return count - this.cells[x][y];
  }

  step() {
    const next = Array.from({ length: this.cols }, () => Array(this.rows).fill(0));
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const count = this.neighbors(x, y);
        next[x][y] = Number(count === 3 || (this.cells[x][y] === 1 && count === 2));
      }
    }
    this.cells = next;
  }
}
