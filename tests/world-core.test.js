const test = require('node:test');
const assert = require('node:assert/strict');

const { WORLD_WIDTH, WORLD_HEIGHT, clampWorldCoordinate, buildBrushPoints } = require('../world-core.js');

test('world constants are defined at the intended size', () => {
  assert.equal(WORLD_WIDTH, 10000);
  assert.equal(WORLD_HEIGHT, 10000);
});

test('brush geometry covers the expected square area', () => {
  const points = buildBrushPoints(0, 0, 3, WORLD_WIDTH, WORLD_HEIGHT);

  assert.equal(points.length, 9);
  assert.ok(points.some((point) => point.x === 0 && point.y === 0));
  assert.ok(points.every((point) => point.x >= 0 && point.y >= 0));
});

test('brush offsets are deterministic and clamped to world bounds', () => {
  const points = buildBrushPoints(9999, 9999, 3, WORLD_WIDTH, WORLD_HEIGHT);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  assert.ok(Math.min(...xs) >= 0);
  assert.ok(Math.max(...xs) < WORLD_WIDTH);
  assert.ok(Math.min(...ys) >= 0);
  assert.ok(Math.max(...ys) < WORLD_HEIGHT);
});

test('world clamp keeps values inside the world bounds', () => {
  assert.equal(clampWorldCoordinate(-5, WORLD_WIDTH, WORLD_HEIGHT), 0);
  assert.equal(clampWorldCoordinate(10000, WORLD_WIDTH, WORLD_HEIGHT), WORLD_WIDTH - 1);
  assert.equal(clampWorldCoordinate(5000, WORLD_WIDTH, WORLD_HEIGHT), 5000);
});
