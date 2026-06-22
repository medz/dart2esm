const __dartRecordShape = Symbol("dart.recordShape");
function __dartIsRecord(value) {
  return value != null && typeof value === "object" && Array.isArray(value[__dartRecordShape]);
}
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
function __dartAs(value, test, typeName) {
  if (test(value)) return value;
  throw new TypeError("Type cast failed: expected " + typeName);
}
function __dartSetAdd(set, value) {
  if (set.__dartIdentitySet) {
    if (set.has(value)) return false;
    set.add(value);
    return true;
  }
  if (__dartIterableContains(set, value)) return false;
  set.add(value);
  return true;
}
function __dartSetAddAll(set, values) {
  for (const value of values) __dartSetAdd(set, value);
  return null;
}
function __dartSetFrom(values) {
  const set = new Set();
  for (const value of values) __dartSetAdd(set, value);
  return set;
}
function __dartSetDifference(set, other) {
  const result = new Set();
  if (set.__dartIdentitySet) Object.defineProperty(result, "__dartIdentitySet", { value: true });
  for (const value of set) {
    if (!__dartIterableContains(other, value)) result.add(value);
  }
  return result;
}
function __dartSetIntersection(set, other) {
  const result = new Set();
  if (set.__dartIdentitySet) Object.defineProperty(result, "__dartIdentitySet", { value: true });
  for (const value of set) {
    if (__dartIterableContains(other, value)) result.add(value);
  }
  return result;
}
function __dartSetUnion(set, other) {
  const result = new Set(set);
  if (set.__dartIdentitySet) Object.defineProperty(result, "__dartIdentitySet", { value: true });
  for (const value of other) __dartSetAdd(result, value);
  return result;
}
function __dartSetRemove(set, needle) {
  if (set.__dartIdentitySet) {
    const found = set.has(needle);
    set.delete(needle);
    return found;
  }
  for (const value of set) {
    if (__dartEquals(value, needle)) {
      set.delete(value);
      return true;
    }
  }
  return false;
}
function __dartSetRemoveWhere(set, test) {
  for (const value of Array.from(set)) {
    if (test(value)) set.delete(value);
  }
  return null;
}
function __dartSetRetainWhere(set, test) {
  for (const value of Array.from(set)) {
    if (!test(value)) set.delete(value);
  }
  return null;
}
function __dartIdentityMap() {
  const map = new Map();
  Object.defineProperty(map, "__dartIdentityMap", { value: true });
  return map;
}
const __dartMapMissingKey = Symbol("dart.mapMissingKey");
function __dartMapKey(map, key) {
  if (map.__dartIdentityMap) return map.has(key) ? key : __dartMapMissingKey;
  for (const candidate of map.keys()) {
    if (__dartEquals(candidate, key)) return candidate;
  }
  return __dartMapMissingKey;
}
function __dartMapContainsKey(map, key) {
  return __dartMapKey(map, key) !== __dartMapMissingKey;
}
function __dartMapGet(map, key) {
  const actualKey = __dartMapKey(map, key);
  return actualKey === __dartMapMissingKey ? null : map.get(actualKey);
}
function __dartMapSet(map, key, value) {
  const actualKey = __dartMapKey(map, key);
  map.set(actualKey === __dartMapMissingKey ? key : actualKey, value);
  return value;
}
function __dartMapAddAll(map, entries) {
  for (const [key, value] of entries) __dartMapSet(map, key, value);
  return null;
}
function __dartMapAddEntries(map, entries) {
  for (const entry of entries) __dartMapSet(map, entry.key, entry.value);
  return null;
}
function __dartMapMap(map, convert) {
  const result = new Map();
  for (const [key, value] of map) {
    const entry = convert(key, value);
    __dartMapSet(result, entry.key, entry.value);
  }
  return result;
}
function __dartMapRemove(map, key) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey === __dartMapMissingKey) return null;
  const value = map.get(actualKey);
  map.delete(actualKey);
  return value;
}
function __dartMapRemoveWhere(map, test) {
  for (const [key, value] of Array.from(map)) {
    if (test(key, value)) map.delete(key);
  }
  return null;
}
function __dartMapContainsValue(map, needle) {
  for (const value of map.values()) {
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
function __dartMapFromEntries(entries) {
  const map = new Map();
  for (const [key, value] of entries) {
    __dartMapSet(map, key, value);
  }
  return map;
}
function __dartMapPutIfAbsent(map, key, ifAbsent) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey !== __dartMapMissingKey) return map.get(actualKey);
  const value = ifAbsent();
  map.set(key, value);
  return value;
}
function __dartMapUpdate(map, key, update, ifAbsent = null) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey !== __dartMapMissingKey) {
    const value = update(map.get(actualKey));
    map.set(actualKey, value);
    return value;
  }
  if (typeof ifAbsent === "function") {
    const value = ifAbsent();
    map.set(key, value);
    return value;
  }
  throw new Error("Key not in map");
}
function __dartMapUpdateAll(map, update) {
  for (const [key, value] of Array.from(map)) {
    map.set(key, update(key, value));
  }
  return null;
}
function __dartListSort(list, compare = null) {
  if (typeof compare === "function") {
    list.sort((left, right) => compare(left, right));
  } else {
    list.sort((left, right) => left < right ? -1 : (left > right ? 1 : 0));
  }
  return null;
}
function __dartListShuffle(list, random = null) {
  for (let index = list.length - 1; index > 0; index--) {
    const selected = random == null ? Math.floor(Math.random() * (index + 1)) : random.nextInt(index + 1);
    const value = list[index];
    list[index] = list[selected];
    list[selected] = value;
  }
  return null;
}
function __dartListRemove(list, needle) {
  const index = list.findIndex((value) => __dartEquals(value, needle));
  if (index < 0) return false;
  list.splice(index, 1);
  return true;
}
function __dartListCopyRange(target, at, source, start = 0, end = null) {
  const values = Array.from(source).slice(start, end == null ? undefined : end);
  for (let index = 0; index < values.length; index++) target[at + index] = values[index];
  return null;
}
function __dartListWriteIterable(target, at, source) {
  let index = at;
  for (const value of source) target[index++] = value;
  return null;
}
function __dartListIndexOf(list, needle, start = 0) {
  const begin = Math.max(0, Math.trunc(start));
  for (let index = begin; index < list.length; index++) {
    if (__dartEquals(list[index], needle)) return index;
  }
  return -1;
}
function __dartListLastIndexOf(list, needle, start = null) {
  let index = start == null ? list.length - 1 : Math.trunc(start);
  if (index >= list.length) index = list.length - 1;
  for (; index >= 0; index--) {
    if (__dartEquals(list[index], needle)) return index;
  }
  return -1;
}
function __dartListSetAll(list, index, values) {
  let offset = 0;
  for (const value of values) {
    list[index + offset] = value;
    offset++;
  }
  return null;
}
function __dartListLastIndexWhere(list, test, start = null) {
  for (let index = start == null ? list.length - 1 : start; index >= 0; index--) {
    if (test(list[index])) return index;
  }
  return -1;
}
function __dartListRemoveWhere(list, test) {
  list.splice(0, list.length, ...list.filter((value) => !test(value)));
  return null;
}
function __dartListRetainWhere(list, test) {
  list.splice(0, list.length, ...list.filter((value) => test(value)));
  return null;
}
function __dartListAsMap(list) {
  return new (class extends Map {
    get size() { return list.length; }
    get(key) { return Number.isInteger(key) && key >= 0 && key < list.length ? list[key] : undefined; }
    has(key) { return Number.isInteger(key) && key >= 0 && key < list.length; }
    entries() { return Array.from(list, (value, index) => [index, value])[Symbol.iterator](); }
    keys() { return Array.from({ length: list.length }, (_, index) => index)[Symbol.iterator](); }
    values() { return Array.from(list)[Symbol.iterator](); }
    [Symbol.iterator]() { return this.entries(); }
    forEach(callback, thisArg = undefined) {
      for (let index = 0; index < list.length; index++) {
        callback.call(thisArg, list[index], index, this);
      }
    }
    set() { throw new TypeError("Unsupported operation: Cannot modify unmodifiable map"); }
    delete() { throw new TypeError("Unsupported operation: Cannot modify unmodifiable map"); }
    clear() { throw new TypeError("Unsupported operation: Cannot modify unmodifiable map"); }
  })();
}
function __dartIterableContains(iterable, needle) {
  if (iterable instanceof Set && iterable.__dartIdentitySet) return iterable.has(needle);
  for (const value of iterable) {
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
function __dartIterableIsEmpty(iterable) {
  if (typeof iterable.length === "number") return iterable.length === 0;
  if (typeof iterable.size === "number") return iterable.size === 0;
  for (const _ of iterable) return false;
  return true;
}
function __dartIterableLength(iterable) {
  if (typeof iterable.length === "number") return iterable.length;
  if (typeof iterable.size === "number") return iterable.size;
  let count = 0;
  for (const _ of iterable) count++;
  return count;
}
function __dartIterableTakeWhile(iterable, test) {
  const result = [];
  for (const value of iterable) {
    if (!test(value)) break;
    result.push(value);
  }
  return result;
}
function __dartIterableSkipWhile(iterable, test) {
  const result = [];
  let skipping = true;
  for (const value of iterable) {
    if (skipping && test(value)) continue;
    skipping = false;
    result.push(value);
  }
  return result;
}
function __dartSetLookup(set, needle) {
  if (set.__dartIdentitySet) return set.has(needle) ? needle : null;
  for (const value of set) {
    if (__dartEquals(value, needle)) return value;
  }
  return null;
}
function __dartSetContainsAll(set, values) {
  for (const value of values) {
    if (!__dartIterableContains(set, value)) return false;
  }
  return true;
}
function __dartSetRemoveAll(set, values) {
  if (set.__dartIdentitySet) {
    for (const value of values) set.delete(value);
    return null;
  }
  for (const value of values) {
    for (const candidate of Array.from(set)) {
      if (__dartEquals(candidate, value)) {
        set.delete(candidate);
        break;
      }
    }
  }
  return null;
}
function __dartSetRetainAll(set, values) {
  const retained = Array.from(values);
  for (const value of Array.from(set)) {
    if (set.__dartIdentitySet ? !retained.includes(value) : retained.findIndex((needle) => __dartEquals(value, needle)) < 0) set.delete(value);
  }
  return null;
}
function __dartIterableJoin(iterable, separator = "") {
  return Array.from(iterable, (value) => __dartStr(value)).join(String(separator));
}
function __dartIterableFirst(iterable) {
  for (const value of iterable) return value;
  throw new RangeError("No element");
}
function __dartIterableLast(iterable) {
  let found = false;
  let last;
  for (const value of iterable) {
    found = true;
    last = value;
  }
  if (!found) throw new RangeError("No element");
  return last;
}
function __dartIterableSingle(iterable) {
  let found = false;
  let single;
  for (const value of iterable) {
    if (found) throw new Error("Bad state: Too many elements");
    found = true;
    single = value;
  }
  if (!found) throw new RangeError("No element");
  return single;
}
function __dartIterableFirstOrNull(iterable) {
  for (const value of iterable) return value;
  return null;
}
function __dartIterableLastOrNull(iterable) {
  let found = false;
  let last;
  for (const value of iterable) {
    found = true;
    last = value;
  }
  return found ? last : null;
}
function __dartIterableSingleOrNull(iterable) {
  let found = false;
  let single;
  for (const value of iterable) {
    if (found) return null;
    found = true;
    single = value;
  }
  return found ? single : null;
}
function __dartIterableElementAtOrNull(iterable, index) {
  if (!Number.isInteger(index) || index < 0) throw new RangeError("index must be non-negative");
  let currentIndex = 0;
  for (const value of iterable) {
    if (currentIndex === index) return value;
    currentIndex++;
  }
  return null;
}
function __dartIterableNoElement(orElse) {
  if (typeof orElse === "function") return orElse();
  throw new Error("Bad state: No element");
}
function __dartIterableFirstWhere(iterable, test, orElse = null) {
  for (const value of iterable) {
    if (test(value)) return value;
  }
  return __dartIterableNoElement(orElse);
}
function __dartIterableLastWhere(iterable, test, orElse = null) {
  let found = false;
  let last;
  for (const value of iterable) {
    if (test(value)) { found = true; last = value; }
  }
  return found ? last : __dartIterableNoElement(orElse);
}
function __dartIterableSingleWhere(iterable, test, orElse = null) {
  let found = false;
  let single;
  for (const value of iterable) {
    if (!test(value)) continue;
    if (found) throw new Error("Bad state: Too many elements");
    found = true;
    single = value;
  }
  return found ? single : __dartIterableNoElement(orElse);
}
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
  if ((typeof left === "number" || left.__dartType === "double") && (typeof right === "number" || right.__dartType === "double")) return Number(left) === Number(right);
  if (__dartIsRecord(left) && __dartIsRecord(right)) {
    const leftShape = left[__dartRecordShape];
    const rightShape = right[__dartRecordShape];
    if (leftShape.length !== rightShape.length) return false;
    for (let i = 0; i < leftShape.length; i++) {
      const name = leftShape[i];
      if (name !== rightShape[i]) return false;
      if (!__dartEquals(left[name], right[name])) return false;
    }
    return true;
  }
  const equals = left["=="];
  return typeof equals === "function" ? equals.call(left, right) : false;
}
function __dartRecord(positional, named) {
  const record = {};
  const shape = [];
  for (let i = 0; i < positional.length; i++) {
    const name = "$" + (i + 1);
    shape.push(name);
    Object.defineProperty(record, name, { value: positional[i], enumerable: true });
  }
  for (const name of Object.keys(named).sort()) {
    shape.push(name);
    Object.defineProperty(record, name, { value: named[name], enumerable: true });
  }
  Object.defineProperty(record, __dartRecordShape, { value: Object.freeze(shape) });
  Object.defineProperty(record, "toString", {
    value() {
      return "(" + shape.map((name) => {
        const value = String(record[name]);
        return name.startsWith("$") ? value : name + ": " + value;
      }).join(", ") + ")";
    },
  });
  return Object.freeze(record);
}

// Generated by dart2esm.

export class EqBox {
  constructor(value) {
    this.value = value;
  }
  "=="(other) {
    return (other instanceof EqBox && __dartEquals(other.value, this.value));
  }
  get hashCode() {
    return this.value.hashCode;
  }
}

export function main() {
  const values = new Array(3).fill(1);
  values[1] = 2;
  (values.push(4), null);
  (values.push(...Array.from([5, 6])), null);
  __dartPrint("list " + __dartStr(values.length) + " " + __dartStr(values[0]) + " " + __dartStr(values[values.length - 1]));
  __dartPrint("list contains " + __dartStr(__dartIterableContains(values, 3)) + " " + __dartStr(__dartIterableContains(values, 4)));
  __dartPrint("list join " + __dartStr(__dartIterableJoin(values, ",")));
  const generated = Array.from({ length: 4 }, (_, index) => (function(index) { return (index * index); })(index));
  __dartPrint("generated " + __dartStr(__dartIterableJoin(generated, ":")));
  const iterableGenerated = Array.from({ length: 3 }, (_, index) => (function(index) { return (index + 1); })(index));
  const iterableGeneratedDefault = Array.from({ length: 3 }, (_, index) => index);
  const iterableEmpty = [];
  __dartPrint("iterableFactory " + __dartStr(__dartIterableJoin(iterableGenerated, ",")) + " " + __dartStr(__dartIterableJoin(iterableGeneratedDefault, ",")) + " " + __dartStr(__dartIterableIsEmpty(iterableEmpty)));
  const castList = Array.from([1, 2], (value) => __dartAs(value, (value) => typeof value === "number", "InterfaceType(num)"));
  const castSet = __dartSetFrom(Array.from((() => {
    const v = new Set();
    __dartSetAdd(v, 1);
    __dartSetAdd(v, 2);
    return v;
  })(), (value) => __dartAs(value, (value) => typeof value === "number", "InterfaceType(num)")));
  const castMap = __dartMapFromEntries(Array.from(new Map([["a", 1]]), ([key, value]) => [__dartAs(key, (key) => typeof key === "string", "InterfaceType(String)"), __dartAs(value, (value) => typeof value === "number", "InterfaceType(num)")]));
  const copyTarget = [0, 0, 0, 0];
  __dartListCopyRange(copyTarget, 1, [7, 8, 9], 0, 2);
  const writeTarget = [0, 0, 0];
  __dartListWriteIterable(writeTarget, 0, [4, 5]);
  __dartPrint("staticCollections " + __dartStr(__dartIterableJoin(castList, ",")) + " " + __dartStr(__dartIterableJoin(castSet, ",")) + " " + __dartStr(__dartMapGet(castMap, "a")) + " " + __dartStr(__dartIterableJoin(copyTarget, ",")) + " " + __dartStr(__dartIterableJoin(writeTarget, ",")));
  const filtered = Array.from(Array.from(Array.from(values).filter(function(value) { return __dartEquals((value % 2), 0); }), function(value) { return (value * 10); }));
  __dartPrint("filtered " + __dartStr(__dartIterableJoin(filtered, "|")));
  __dartPrint("fold " + __dartStr(Array.from(values).reduce((previous, value) => (function(total, value) { return (total + value); })(previous, value), 0)) + " " + __dartStr(Array.from(values).some(function(value) { return (value > 5); })) + " " + __dartStr(Array.from(values).every(function(value) { return (value > 0); })));
  __dartPrint("iter " + __dartStr(__dartIterableJoin(Array.from(Array.from(values).slice(2)).slice(0, 3), ",")) + " " + __dartStr(Array.from(values)[2]) + " " + __dartStr(Array.from(values).reduce((previous, value) => (function(total, value) { return (total + value); })(previous, value))));
  __dartPrint("iterMore " + __dartStr(__dartIterableJoin(__dartIterableTakeWhile(values, function(value) { return (value < 4); }), ",")) + " " + __dartStr(__dartIterableJoin(__dartIterableSkipWhile(values, function(value) { return (value < 4); }), ",")) + " " + __dartStr(__dartIterableJoin([...Array.from(values), ...Array.from([7])], ",")) + " " + __dartStr(__dartIterableJoin(Array.from(Array.from(values).flatMap((value) => Array.from((function(value) { return [value, (value * 10)]; })(value)))).slice(0, 4), ",")));
  __dartPrint("listQuery " + __dartStr(values.findIndex((value, index) => index >= 0 && (function(value) { return __dartEquals(value, 4); })(value))) + " " + __dartStr(__dartListLastIndexWhere(values, function(value) { return __dartEquals(value, 1); }, null)) + " " + __dartStr(__dartIterableJoin(values.slice(1, 4), ",")));
  const boxes = [new EqBox(1), new EqBox(2), new EqBox(1)];
  __dartPrint("listEquality " + __dartStr(__dartListIndexOf(boxes, new EqBox(1), 0)) + " " + __dartStr(__dartListIndexOf(boxes, new EqBox(1), 1)) + " " + __dartStr(__dartListLastIndexOf(boxes, new EqBox(1), null)) + " " + __dartStr(__dartListLastIndexOf(boxes, new EqBox(1), 1)));
  __dartPrint("where " + __dartStr(__dartIterableFirstWhere(values, function(value) { return (value > 3); }, null)) + " " + __dartStr(__dartIterableLastWhere(values, function(value) { return (Math.trunc(value) % 2 !== 0); }, null)) + " " + __dartStr(__dartIterableSingleWhere(values, function(value) { return __dartEquals(value, 4); }, null)) + " " + __dartStr(__dartIterableFirstWhere(values, function(value) { return (value > 99); }, function() { return (-1); })));
  const mixedValues = [1, "two", null, 3, "four"];
  __dartPrint("typed " + __dartStr(__dartIterableJoin(Array.from(mixedValues).filter((value) => typeof value === "number"), ",")) + " " + __dartStr(__dartIterableJoin(Array.from(mixedValues).filter((value) => value != null), "|")) + " " + __dartStr(__dartIterableJoin(Array.from(Array.from(values, (value) => __dartAs(value, (value) => typeof value === "number", "InterfaceType(num)")), function(value) { return (value + 1); }), ",")));
  __dartPrint("indexed " + __dartStr(__dartIterableJoin(Array.from(Array.from(Array.from(values, (value, index) => __dartRecord([index, value], {})), function(entry) { return __dartStr(entry.$1) + ":" + __dartStr(entry.$2); })).slice(0, 3), "|")));
  const singleValue = [42];
  const emptyValues = new Array(0).fill(null);
  __dartPrint("nullableQuery " + __dartStr(__dartIterableSingle(singleValue)) + " " + __dartStr(__dartIterableSingleOrNull(singleValue)) + " " + __dartStr(__dartIterableSingleOrNull(values)) + " " + __dartStr(__dartIterableFirstOrNull(emptyValues)) + " " + __dartStr(__dartIterableFirstOrNull(values)) + " " + __dartStr(__dartIterableLastOrNull(emptyValues)) + " " + __dartStr(__dartIterableLastOrNull(values)) + " " + __dartStr(__dartIterableSingleOrNull(emptyValues)) + " " + __dartStr(__dartIterableElementAtOrNull(values, 2)) + " " + __dartStr(__dartIterableElementAtOrNull(values, 99)));
  let visited = 0;
  (Array.from(values).forEach(function(value) {
    visited = (visited + value);
}), null);
  __dartPrint("forEach " + __dartStr(visited));
  const mutable = [3, 1, 2];
  __dartListSort(mutable, null);
  const shuffled = [1, 2, 3, 4, 5];
  __dartListShuffle(shuffled, __dartRandom(1, false));
  const removed = mutable.splice(1, 1)[0];
  (mutable.splice(1, 0, 9), null);
  __dartPrint("mutable " + __dartStr(__dartIterableJoin(mutable, ",")) + " " + __dartStr(removed) + " " + __dartStr(__dartIterableJoin(mutable.slice(1), ",")) + " " + __dartStr(__dartIterableJoin(Array.from(mutable).reverse(), ",")));
  __dartPrint("shuffle " + __dartStr(shuffled.length) + " " + __dartStr(__dartSetFrom(shuffled).size) + " " + __dartStr(Array.from(shuffled).every(function(value) { return ((value >= 1) && (value <= 5)); })));
  const indexed = __dartListAsMap(mutable);
  __dartPrint("asMap " + __dartStr(indexed.size) + " " + __dartStr(__dartMapGet(indexed, 1)));
  const removedValue = __dartListRemove(mutable, 9);
  const removedMissing = __dartListRemove(mutable, 99);
  const removedLast = mutable.pop();
  __dartPrint("list remove " + __dartStr(removedValue) + " " + __dartStr(removedMissing) + " " + __dartStr(removedLast) + " " + __dartStr(__dartIterableJoin(mutable, ",")));
  (mutable.splice(1, 0, ...Array.from([8, 7])), null);
  __dartListSetAll(mutable, 0, [4, 5]);
  (mutable.fill(6, 1, 2), null);
  (mutable.splice(2, 3 - 2, ...Array.from([10, 11])), null);
  (mutable.splice(0, 1 - 0), null);
  __dartListRemoveWhere(mutable, function(value) { return (value > 10); });
  __dartListRetainWhere(mutable, function(value) { return (value >= 6); });
  __dartPrint("list bulk " + __dartStr(__dartIterableJoin(mutable, ",")));
  const names = (() => {
    const v = new Set();
    __dartSetAdd(v, "ada");
    __dartSetAdd(v, "bob");
    return v;
  })();
  __dartSetAdd(names, "cy");
  __dartSetRemove(names, "bob");
  __dartPrint("set " + __dartStr(names.size) + " " + __dartStr(__dartIterableContains(names, "ada")) + " " + __dartStr(__dartIterableContains(names, "bob")));
  __dartPrint("set lookup " + __dartStr(__dartSetLookup(names, "ada")) + " " + __dartStr(__dartSetLookup(names, "missing")));
  __dartPrint("set join " + __dartStr(__dartIterableJoin(names, "/")));
  const setBulk = (() => {
    const v = new Set();
    __dartSetAdd(v, "a");
    __dartSetAdd(v, "b");
    __dartSetAdd(v, "c");
    return v;
  })();
  const hasAll = __dartSetContainsAll(setBulk, ["a", "c"]);
  __dartSetRemoveAll(setBulk, ["b", "x"]);
  __dartSetRetainAll(setBulk, ["a", "z"]);
  __dartPrint("set bulk " + __dartStr(hasAll) + " " + __dartStr(__dartIterableJoin(setBulk, ",")));
  const setWhere = (() => {
    const v = new Set();
    __dartSetAdd(v, 1);
    __dartSetAdd(v, 2);
    __dartSetAdd(v, 3);
    __dartSetAdd(v, 4);
    return v;
  })();
  __dartSetRemoveWhere(setWhere, function(value) { return (Math.trunc(value) % 2 !== 0); });
  __dartSetRetainWhere(setWhere, function(value) { return (value > 2); });
  __dartPrint("set where " + __dartStr(__dartIterableJoin(setWhere, ",")));
  const setUnion = __dartSetUnion(names, (() => {
    const v = new Set();
    __dartSetAdd(v, "ada");
    __dartSetAdd(v, "zoe");
    return v;
  })());
  const setIntersection = __dartSetIntersection(setUnion, (() => {
    const v = new Set();
    __dartSetAdd(v, "ada");
    __dartSetAdd(v, "missing");
    return v;
  })());
  const setDifference = __dartSetDifference(setUnion, (() => {
    const v = new Set();
    __dartSetAdd(v, "cy");
    return v;
  })());
  const castNames = new Set(Array.from(names, (value) => __dartAs(value, (value) => value != null, "InterfaceType(Object)")));
  __dartPrint("set algebra " + __dartStr(__dartIterableJoin(setUnion, ",")) + " " + __dartStr(__dartIterableJoin(setIntersection, ",")) + " " + __dartStr(__dartIterableJoin(setDifference, ",")) + " " + __dartStr(__dartIterableContains(castNames, "ada")));
  const eqSet = (() => {
    const v = new Set();
    return v;
  })();
  const firstBoxAdd = __dartSetAdd(eqSet, new EqBox(1));
  const duplicateBoxAdd = __dartSetAdd(eqSet, new EqBox(1));
  __dartSetAddAll(eqSet, [new EqBox(2), new EqBox(2)]);
  const containsBox = __dartIterableContains(eqSet, new EqBox(1));
  const removedBox = __dartSetRemove(eqSet, new EqBox(2));
  const eqUnion = __dartSetUnion(eqSet, (() => {
    const v = new Set();
    __dartSetAdd(v, new EqBox(1));
    __dartSetAdd(v, new EqBox(3));
    return v;
  })());
  const eqIntersection = __dartSetIntersection(eqUnion, (() => {
    const v = new Set();
    __dartSetAdd(v, new EqBox(1));
    __dartSetAdd(v, new EqBox(4));
    return v;
  })());
  const eqDifference = __dartSetDifference(eqUnion, (() => {
    const v = new Set();
    __dartSetAdd(v, new EqBox(1));
    return v;
  })());
  __dartPrint("setEquality " + __dartStr(firstBoxAdd) + " " + __dartStr(duplicateBoxAdd) + " " + __dartStr(eqSet.size) + " " + __dartStr(containsBox) + " " + __dartStr(removedBox) + " " + __dartStr(eqSet.size) + " " + __dartStr(eqUnion.size) + " " + __dartStr(eqIntersection.size) + " " + __dartStr(eqDifference.size));
  const eqToSet = __dartSetFrom([new EqBox(1), new EqBox(1), new EqBox(2)]);
  __dartPrint("setToSet " + __dartStr(eqToSet.size) + " " + __dartStr(__dartIterableContains(eqToSet, new EqBox(1))));
  const counts = new Map([["one", 1]]);
  __dartMapSet(counts, "two", 2);
  __dartPrint("map " + __dartStr(counts.size) + " " + __dartStr(__dartMapContainsKey(counts, "two")) + " " + __dartStr(__dartMapGet(counts, "one")));
  __dartPrint("map iter " + __dartStr(__dartIterableJoin(Array.from(counts.keys()), ",")) + " " + __dartStr(__dartIterableJoin(Array.from(counts.values()), ",")));
  const countKeys = Array.from(counts.keys());
  __dartPrint("map views " + __dartStr(__dartIterableIsEmpty(Array.from(new Map([]).keys()))) + " " + __dartStr(!__dartIterableIsEmpty(countKeys)) + " " + __dartStr(__dartIterableLength(countKeys)) + " " + __dartStr(__dartIterableFirst(countKeys)) + " " + __dartStr(__dartIterableLast(Array.from(counts.values()))) + " " + __dartStr(__dartIterableJoin(countKeys, "|")));
  const three = __dartMapPutIfAbsent(counts, "three", function() { return 3; });
  __dartMapUpdate(counts, "two", function(value) { return (value * 10); }, null);
  __dartMapUpdate(counts, "missing", function(value) { return value; }, function() { return 4; });
  const mapPairs = new Array(0).fill(null);
  (counts.forEach((value, key) => (function(key, value) {
    (mapPairs.push(__dartStr(key) + "=" + __dartStr(value)), null);
})(key, value)), null);
  __dartPrint("map ops " + __dartStr(three) + " " + __dartStr(__dartMapGet(counts, "two")) + " " + __dartStr(__dartMapGet(counts, "missing")) + " " + __dartStr(__dartIterableJoin(mapPairs, "|")));
  const transformSource = new Map([["a", 1], ["b", 2]]);
  __dartMapAddEntries(transformSource, [Object.freeze({ key: "c", value: 3 })]);
  const transformed = __dartMapMap(transformSource, function(key, value) { return Object.freeze({ key: __dartStr(key) + __dartStr(value), value: (value + 10) }); });
  const transformedCast = new Map(Array.from(transformSource, ([key, value]) => [__dartAs(key, (key) => typeof key === "string", "InterfaceType(String)"), __dartAs(value, (value) => typeof value === "number", "InterfaceType(num)")]));
  __dartPrint("map transforms " + __dartStr(__dartMapGet(transformSource, "c")) + " " + __dartStr(__dartMapGet(transformed, "b2")) + " " + __dartStr(((() => { let v = __dartMapGet(transformedCast, "a"); return ((v === null) ? 0 : v); })() + 1)));
  const eqMap = new Map([]);
  __dartMapSet(eqMap, new EqBox(1), "one");
  __dartMapSet(eqMap, new EqBox(1), "uno");
  const eqContains = __dartMapContainsKey(eqMap, new EqBox(1));
  const eqRead = __dartMapGet(eqMap, new EqBox(1));
  const eqExisting = __dartMapPutIfAbsent(eqMap, new EqBox(1), function() { return "new"; });
  const eqMissing = __dartMapPutIfAbsent(eqMap, new EqBox(2), function() { return "two"; });
  const eqUpdated = __dartMapUpdate(eqMap, new EqBox(2), function(value) { return __dartStr(value) + "!"; }, null);
  const eqRemoved = __dartMapRemove(eqMap, new EqBox(1));
  __dartMapAddAll(eqMap, new Map([[new EqBox(2), "twoAgain"], [new EqBox(3), "three"]]));
  __dartMapAddEntries(eqMap, [Object.freeze({ key: new EqBox(3), value: "tres" })]);
  const identityMap = __dartIdentityMap();
  __dartMapSet(identityMap, new EqBox(1), "one");
  __dartPrint("mapEquality " + __dartStr(eqContains) + " " + __dartStr(eqRead) + " " + __dartStr(eqExisting) + " " + __dartStr(eqMissing) + " " + __dartStr(eqUpdated) + " " + __dartStr(eqRemoved) + " " + __dartStr(__dartMapGet(eqMap, new EqBox(2))) + " " + __dartStr(__dartMapGet(eqMap, new EqBox(3))) + " " + __dartStr(eqMap.size) + " " + __dartStr(__dartMapContainsKey(identityMap, new EqBox(1))) + " " + __dartStr(identityMap.size));
  __dartMapRemove(counts, "one");
  __dartPrint("map removed " + __dartStr(counts.size) + " " + __dartStr(__dartMapGet(counts, "one")));
  __dartMapUpdateAll(counts, function(key, value) { return (value + key.length); });
  __dartMapRemoveWhere(counts, function(key, value) { return (Math.trunc(value) % 2 === 0); });
  const entries = Array.from(Array.from(counts, ([key, value]) => ({ key, value })), function(entry) { return __dartStr(entry.key) + ":" + __dartStr(entry.value); });
  __dartPrint("map more " + __dartStr(__dartMapContainsValue(counts, 27)) + " " + __dartStr(__dartIterableJoin(entries, "|")));
  (counts.clear(), null);
  __dartPrint("map cleared " + __dartStr(counts.size === 0));
}

main();
