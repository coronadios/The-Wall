(function (global) {
  const WORLD_WIDTH = 10000;
  const WORLD_HEIGHT = 10000;
  const MIN_ZOOM = 0.03;
  const MAX_ZOOM = 40;

  function clampWorldCoordinate(value, width = WORLD_WIDTH, height = WORLD_HEIGHT) {
    const maxValue = Math.max(0, (width || WORLD_WIDTH) - 1);
    return Math.max(0, Math.min(maxValue, value));
  }

  function buildBrushPoints(centerX, centerY, brushSize = 1, worldWidth = WORLD_WIDTH, worldHeight = WORLD_HEIGHT) {
    const size = Math.max(1, Math.floor(Number(brushSize) || 1));
    const radius = Math.floor((size - 1) / 2);
    const end = size - 1 - radius;
    const points = [];

    for (let dy = -radius; dy <= end; dy += 1) {
      for (let dx = -radius; dx <= end; dx += 1) {
        const x = clampWorldCoordinate(centerX + dx, worldWidth, worldHeight);
        const y = clampWorldCoordinate(centerY + dy, worldWidth, worldHeight);

        points.push({ x, y });
      }
    }

    return points;
  }

  function buildLinePoints(start, end) {
    if (!start || !end) {
      return [];
    }

    const points = [];
    let x0 = Math.round(start.x);
    let y0 = Math.round(start.y);
    const x1 = Math.round(end.x);
    const y1 = Math.round(end.y);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      points.push({ x: x0, y: y0 });

      if (x0 === x1 && y0 === y1) {
        break;
      }

      const e2 = err * 2;

      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }

      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }

    return points;
  }

  const api = {
    WORLD_WIDTH,
    WORLD_HEIGHT,
    MIN_ZOOM,
    MAX_ZOOM,
    clampWorldCoordinate,
    buildBrushPoints,
    buildLinePoints
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.TheWallCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
