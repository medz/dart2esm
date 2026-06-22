function __dartStr(value) {
  if (value == null) return "null";
  if (Array.isArray(value)) {
    return "[" + value.map(__dartStr).join(", ") + "]";
  }
  if (value instanceof Set) {
    return "{" + Array.from(value).map(__dartStr).join(", ") + "}";
  }
  if (value instanceof Map) {
    return "{" + Array.from(value, ([key, entryValue]) => __dartStr(key) + ": " + __dartStr(entryValue)).join(", ") + "}";
  }
  if (typeof value === "object") {
    const toString = value.toString;
    if (typeof toString === "function" && toString !== Object.prototype.toString) {
      return String(toString.call(value));
    }
  }
  return String(value);
}
function __dartPrint(value) {
  console.log(__dartStr(value));
}
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
function __dartNullCheck(value) {
  if (value == null) {
    throw new TypeError("Null check operator used on a null value");
  }
  return value;
}
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
  const equals = left["=="];
  return typeof equals === "function" ? equals.call(left, right) : false;
}
const __dartConstValues = new Map();
function __dartConst(key, create) {
  if (!__dartConstValues.has(key)) {
    __dartConstValues.set(key, create());
  }
  return __dartConstValues.get(key);
}

// Generated by dart2esm.

export function hide(value) {
  return value;
}

export function main() {
  __dartPrint("min " + __dartStr(Math.min(2, 3)));
  __dartPrint("max " + __dartStr(Math.max(2, 3)));
  __dartPrint("pow " + __dartStr(Math.pow(2, 3)));
  __dartPrint("atan2 " + __dartStr(__dartEquals(Math.atan2(0, 1), 0)));
  __dartPrint("pi " + __dartStr((3.141592653589793 > 3)));
  __dartPrint("sqrt2 " + __dartStr((1.4142135623730951 > 1)));
  const seededA = __dartRandom(1, false);
  const seededB = __dartRandom(1, false);
  const firstA = seededA.nextInt(1000);
  const firstB = seededB.nextInt(1000);
  const doubleValue = seededA.nextDouble();
  const boolValue = seededA.nextBool();
  __dartPrint("random " + __dartStr(__dartEquals(firstA, firstB)) + " " + __dartStr(((firstA >= 0) && (firstA < 1000))) + " " + __dartStr(((doubleValue >= 0) && (doubleValue < 1))) + " " + __dartStr(typeof hide(boolValue) === "boolean"));
  const secure = __dartRandom(null, true).nextInt(10);
  __dartPrint("secure " + __dartStr(((secure >= 0) && (secure < 10))));
  const point = __dartPoint(3, 4);
  const otherPoint = __dartPoint(1, 2);
  const moved = point["+"](otherPoint);
  const delta = point["-"](otherPoint);
  const scaled = otherPoint["*"](3);
  const constPoint = __dartConst("[\"instance\",\"dart:math::Point\",[\"typeArgument\",\"InterfaceType(int)\"],[\"field\",\"dart:math::Point::@fields::x\",[\"int\",\"2\"]],[\"field\",\"dart:math::Point::@fields::y\",[\"int\",\"5\"]]]", () => __dartPoint(2, 5));
  __dartPrint("point " + __dartStr(point.x) + ":" + __dartStr(point.y) + " " + __dartStr(Number(point.magnitude).toFixed(1)) + " " + __dartStr(Number(point.distanceTo(otherPoint)).toFixed(2)) + " " + __dartStr(point.squaredDistanceTo(otherPoint)) + " " + __dartStr(moved.x) + ":" + __dartStr(moved.y) + " " + __dartStr(delta.x) + ":" + __dartStr(delta.y) + " " + __dartStr(scaled.x) + ":" + __dartStr(scaled.y) + " " + __dartStr((() => { const $left_1 = point; const $right_1 = __dartPoint(3, 4); return $left_1 === null ? $right_1 === null : $left_1["=="]($right_1); })()) + " " + __dartStr(hide(point) != null && typeof hide(point) === "object" && hide(point).__dartType === "Point") + " " + __dartStr((__dartConst("[\"instance\",\"dart:math::Point\",[\"typeArgument\",\"InterfaceType(int)\"],[\"field\",\"dart:math::Point::@fields::x\",[\"int\",\"2\"]],[\"field\",\"dart:math::Point::@fields::y\",[\"int\",\"5\"]]]", () => __dartPoint(2, 5)).x + __dartConst("[\"instance\",\"dart:math::Point\",[\"typeArgument\",\"InterfaceType(int)\"],[\"field\",\"dart:math::Point::@fields::x\",[\"int\",\"2\"]],[\"field\",\"dart:math::Point::@fields::y\",[\"int\",\"5\"]]]", () => __dartPoint(2, 5)).y)));
  const rectangle = __dartRectangle(1, 2, 3, 4);
  const otherRectangle = __dartRectangle(2, 3, 5, 1);
  const intersection = __dartNullCheck(rectangle.intersection(otherRectangle));
  const bounds = rectangle.boundingBox(otherRectangle);
  const fromPoints = __dartRectangleFromPoints(__dartPoint(5, 6), __dartPoint(2, 1));
  const constRectangle = __dartConst("[\"instance\",\"dart:math::Rectangle\",[\"typeArgument\",\"InterfaceType(int)\"],[\"field\",\"dart:math::Rectangle::@fields::height\",[\"int\",\"3\"]],[\"field\",\"dart:math::Rectangle::@fields::left\",[\"int\",\"0\"]],[\"field\",\"dart:math::Rectangle::@fields::top\",[\"int\",\"1\"]],[\"field\",\"dart:math::Rectangle::@fields::width\",[\"int\",\"2\"]]]", () => __dartRectangle(0, 1, 2, 3));
  __dartPrint("rect " + __dartStr(rectangle.left) + ":" + __dartStr(rectangle.top) + ":" + __dartStr(rectangle.right) + ":" + __dartStr(rectangle.bottom) + " " + __dartStr(rectangle.topLeft.x) + ":" + __dartStr(rectangle.bottomRight.y) + " " + __dartStr(rectangle.containsPoint(__dartPoint(2, 3))) + " " + __dartStr(rectangle.containsRectangle(__dartRectangle(1, 2, 1, 1))) + " " + __dartStr(rectangle.intersects(otherRectangle)) + " " + __dartStr(intersection.left) + ":" + __dartStr(intersection.top) + ":" + __dartStr(intersection.width) + ":" + __dartStr(intersection.height) + " " + __dartStr(bounds.left) + ":" + __dartStr(bounds.top) + ":" + __dartStr(bounds.width) + ":" + __dartStr(bounds.height) + " " + __dartStr(fromPoints.left) + ":" + __dartStr(fromPoints.top) + ":" + __dartStr(fromPoints.width) + ":" + __dartStr(fromPoints.height) + " " + __dartStr((() => { const $left_3 = rectangle; const $right_3 = __dartRectangle(1, 2, 3, 4); return $left_3 === null ? $right_3 === null : $left_3["=="]($right_3); })()) + " " + __dartStr(hide(rectangle) != null && typeof hide(rectangle) === "object" && hide(rectangle).__dartType === "Rectangle") + " " + __dartStr(__dartConst("[\"instance\",\"dart:math::Rectangle\",[\"typeArgument\",\"InterfaceType(int)\"],[\"field\",\"dart:math::Rectangle::@fields::height\",[\"int\",\"3\"]],[\"field\",\"dart:math::Rectangle::@fields::left\",[\"int\",\"0\"]],[\"field\",\"dart:math::Rectangle::@fields::top\",[\"int\",\"1\"]],[\"field\",\"dart:math::Rectangle::@fields::width\",[\"int\",\"2\"]]]", () => __dartRectangle(0, 1, 2, 3)).bottom));
}

main();
