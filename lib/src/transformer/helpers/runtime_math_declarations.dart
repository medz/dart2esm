part of 'runtime_helpers.dart';

extension _Mathhelperdeclaration on EsmRuntimeHelperRegistry {
  EsmModuleItem _mathHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.mathPoint => EsmRawModuleItem('''
function __dartPoint(x, y) {
  const point = {
    x,
    y,
    get magnitude() { return Math.hypot(x, y); },
    distanceTo(other) {
      return Math.hypot(x - other.x, y - other.y);
    },
    squaredDistanceTo(other) {
      const dx = x - other.x;
      const dy = y - other.y;
      return dx * dx + dy * dy;
    },
    ["+"](other) { return __dartPoint(x + other.x, y + other.y); },
    ["-"](other) { return __dartPoint(x - other.x, y - other.y); },
    ["*"](factor) { return __dartPoint(x * factor, y * factor); },
    ["=="](other) { return other != null && other.__dartType === "Point" && other.x === x && other.y === y; },
    toString() { return "Point(" + x + ", " + y + ")"; },
  };
  Object.defineProperty(point, "__dartType", { value: "Point" });
  return Object.freeze(point);
}
'''),
      EsmRuntimeHelper.mathRandom => EsmRawModuleItem('''
function __dartRandom(seed = null, secure = false) {
  let state = seed == null ? 0 : Number(seed) >>> 0;
  function nextUint32() {
    if (secure) {
      const crypto = globalThis.crypto || globalThis.msCrypto;
      if (crypto && typeof crypto.getRandomValues === "function") {
        const values = new Uint32Array(1);
        crypto.getRandomValues(values);
        return values[0] >>> 0;
      }
    }
    if (seed == null) {
      return Math.floor(Math.random() * 0x100000000) >>> 0;
    }
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  }
  return {
    nextInt(max) {
      if (!Number.isInteger(max) || max <= 0) throw new RangeError("max must be positive");
      return nextUint32() % max;
    },
    nextDouble() { return nextUint32() / 0x100000000; },
    nextBool() { return (nextUint32() & 1) === 1; },
  };
}
'''),
      EsmRuntimeHelper.mathRectangle => EsmRawModuleItem('''
function __dartRectangle(left, top, width, height) {
  const rectangle = {
    left,
    top,
    width,
    height,
    get right() { return left + width; },
    get bottom() { return top + height; },
    get topLeft() { return __dartPoint(left, top); },
    get topRight() { return __dartPoint(left + width, top); },
    get bottomLeft() { return __dartPoint(left, top + height); },
    get bottomRight() { return __dartPoint(left + width, top + height); },
    containsPoint(point) { return point.x >= left && point.x <= this.right && point.y >= top && point.y <= this.bottom; },
    containsRectangle(other) { return other.left >= left && other.right <= this.right && other.top >= top && other.bottom <= this.bottom; },
    intersects(other) { return left <= other.right && other.left <= this.right && top <= other.bottom && other.top <= this.bottom; },
    intersection(other) {
      const nextLeft = Math.max(left, other.left);
      const nextTop = Math.max(top, other.top);
      const nextRight = Math.min(this.right, other.right);
      const nextBottom = Math.min(this.bottom, other.bottom);
      if (nextLeft > nextRight || nextTop > nextBottom) return null;
      return __dartRectangle(nextLeft, nextTop, nextRight - nextLeft, nextBottom - nextTop);
    },
    boundingBox(other) {
      const nextLeft = Math.min(left, other.left);
      const nextTop = Math.min(top, other.top);
      const nextRight = Math.max(this.right, other.right);
      const nextBottom = Math.max(this.bottom, other.bottom);
      return __dartRectangle(nextLeft, nextTop, nextRight - nextLeft, nextBottom - nextTop);
    },
    ["=="](other) { return other != null && other.__dartType === "Rectangle" && other.left === left && other.top === top && other.width === width && other.height === height; },
    toString() { return "Rectangle (" + left + ", " + top + ") " + width + " x " + height; },
  };
  Object.defineProperty(rectangle, "__dartType", { value: "Rectangle" });
  return Object.freeze(rectangle);
}
function __dartRectangleFromPoints(a, b) {
  const left = Math.min(a.x, b.x);
  const top = Math.min(a.y, b.y);
  return __dartRectangle(left, top, Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
'''),
      _ => throw StateError('Unexpected runtime helper declaration: $helper'),
    };
  }
}
