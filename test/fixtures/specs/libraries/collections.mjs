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
function __dartAs(value, test, typeName) {
  if (test(value)) return value;
  throw new TypeError("Type cast failed: expected " + typeName);
}
function __dartSetAdd(set, value) {
  const hadValue = set.has(value);
  set.add(value);
  return !hadValue;
}
function __dartSetDifference(set, other) {
  const otherSet = new Set(other);
  return new Set(Array.from(set).filter((value) => !otherSet.has(value)));
}
function __dartSetIntersection(set, other) {
  const otherSet = new Set(other);
  return new Set(Array.from(set).filter((value) => otherSet.has(value)));
}
function __dartSetUnion(set, other) {
  return new Set([...set, ...other]);
}
function __dartMapAddEntries(map, entries) {
  for (const entry of entries) map.set(entry.key, entry.value);
  return null;
}
function __dartMapMap(map, convert) {
  const result = new Map();
  for (const [key, value] of map) {
    const entry = convert(key, value);
    result.set(entry.key, entry.value);
  }
  return result;
}
function __dartMapRemove(map, key) {
  const value = map.has(key) ? map.get(key) : null;
  map.delete(key);
  return value;
}
function __dartMapContainsValue(map, needle) {
  for (const value of map.values()) {
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
function __dartMapPutIfAbsent(map, key, ifAbsent) {
  if (map.has(key)) return map.get(key);
  const value = ifAbsent();
  map.set(key, value);
  return value;
}
function __dartMapUpdate(map, key, update, ifAbsent = null) {
  if (map.has(key)) {
    const value = update(map.get(key));
    map.set(key, value);
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
function __dartListRemove(list, needle) {
  const index = list.findIndex((value) => __dartEquals(value, needle));
  if (index < 0) return false;
  list.splice(index, 1);
  return true;
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
  return new Map(Array.from(list, (value, index) => [index, value]));
}
function __dartIterableContains(iterable, needle) {
  for (const value of iterable) {
    if (__dartEquals(value, needle)) return true;
  }
  return false;
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
  for (const value of set) {
    if (__dartEquals(value, needle)) return value;
  }
  return null;
}
function __dartSetContainsAll(set, values) {
  for (const value of values) {
    let found = false;
    for (const candidate of set) {
      if (__dartEquals(candidate, value)) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}
function __dartSetRemoveAll(set, values) {
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
    if (retained.findIndex((needle) => __dartEquals(value, needle)) < 0) set.delete(value);
  }
  return null;
}
function __dartIterableJoin(iterable, separator = "") {
  return Array.from(iterable, (value) => __dartStr(value)).join(String(separator));
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
  return false;
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
  const filtered = Array.from(Array.from(Array.from(values).filter(function(value) { return __dartEquals((value % 2), 0); }), function(value) { return (value * 10); }));
  __dartPrint("filtered " + __dartStr(__dartIterableJoin(filtered, "|")));
  __dartPrint("fold " + __dartStr(Array.from(values).reduce((previous, value) => (function(total, value) { return (total + value); })(previous, value), 0)) + " " + __dartStr(Array.from(values).some(function(value) { return (value > 5); })) + " " + __dartStr(Array.from(values).every(function(value) { return (value > 0); })));
  __dartPrint("iter " + __dartStr(__dartIterableJoin(Array.from(Array.from(values).slice(2)).slice(0, 3), ",")) + " " + __dartStr(Array.from(values)[2]) + " " + __dartStr(Array.from(values).reduce((previous, value) => (function(total, value) { return (total + value); })(previous, value))));
  __dartPrint("iterMore " + __dartStr(__dartIterableJoin(__dartIterableTakeWhile(values, function(value) { return (value < 4); }), ",")) + " " + __dartStr(__dartIterableJoin(__dartIterableSkipWhile(values, function(value) { return (value < 4); }), ",")) + " " + __dartStr(__dartIterableJoin([...Array.from(values), ...Array.from([7])], ",")) + " " + __dartStr(__dartIterableJoin(Array.from(Array.from(values).flatMap((value) => Array.from((function(value) { return [value, (value * 10)]; })(value)))).slice(0, 4), ",")));
  __dartPrint("listQuery " + __dartStr(values.findIndex((value, index) => index >= 0 && (function(value) { return __dartEquals(value, 4); })(value))) + " " + __dartStr(__dartListLastIndexWhere(values, function(value) { return __dartEquals(value, 1); }, null)) + " " + __dartStr(__dartIterableJoin(values.slice(1, 4), ",")));
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
  const removed = mutable.splice(1, 1)[0];
  (mutable.splice(1, 0, 9), null);
  __dartPrint("mutable " + __dartStr(__dartIterableJoin(mutable, ",")) + " " + __dartStr(removed) + " " + __dartStr(__dartIterableJoin(mutable.slice(1), ",")) + " " + __dartStr(__dartIterableJoin(Array.from(mutable).reverse(), ",")));
  const indexed = __dartListAsMap(mutable);
  __dartPrint("asMap " + __dartStr(indexed.size) + " " + __dartStr(indexed.get(1)));
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
  names.delete("bob");
  __dartPrint("set " + __dartStr(names.size) + " " + __dartStr(names.has("ada")) + " " + __dartStr(names.has("bob")));
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
  __dartPrint("set algebra " + __dartStr(__dartIterableJoin(setUnion, ",")) + " " + __dartStr(__dartIterableJoin(setIntersection, ",")) + " " + __dartStr(__dartIterableJoin(setDifference, ",")) + " " + __dartStr(castNames.has("ada")));
  const counts = new Map([["one", 1]]);
  counts.set("two", 2);
  __dartPrint("map " + __dartStr(counts.size) + " " + __dartStr(counts.has("two")) + " " + __dartStr(counts.get("one")));
  __dartPrint("map iter " + __dartStr(__dartIterableJoin(counts.keys(), ",")) + " " + __dartStr(__dartIterableJoin(counts.values(), ",")));
  const three = __dartMapPutIfAbsent(counts, "three", function() { return 3; });
  __dartMapUpdate(counts, "two", function(value) { return (value * 10); }, null);
  __dartMapUpdate(counts, "missing", function(value) { return value; }, function() { return 4; });
  const mapPairs = new Array(0).fill(null);
  (counts.forEach((value, key) => (function(key, value) {
    (mapPairs.push(__dartStr(key) + "=" + __dartStr(value)), null);
})(key, value)), null);
  __dartPrint("map ops " + __dartStr(three) + " " + __dartStr(counts.get("two")) + " " + __dartStr(counts.get("missing")) + " " + __dartStr(__dartIterableJoin(mapPairs, "|")));
  const transformSource = new Map([["a", 1], ["b", 2]]);
  __dartMapAddEntries(transformSource, [Object.freeze({ key: "c", value: 3 })]);
  const transformed = __dartMapMap(transformSource, function(key, value) { return Object.freeze({ key: __dartStr(key) + __dartStr(value), value: (value + 10) }); });
  const transformedCast = new Map(Array.from(transformSource, ([key, value]) => [__dartAs(key, (key) => typeof key === "string", "InterfaceType(String)"), __dartAs(value, (value) => typeof value === "number", "InterfaceType(num)")]));
  __dartPrint("map transforms " + __dartStr(transformSource.get("c")) + " " + __dartStr(transformed.get("b2")) + " " + __dartStr(((() => { let v = transformedCast.get("a"); return ((v === null) ? 0 : v); })() + 1)));
  __dartMapRemove(counts, "one");
  __dartPrint("map removed " + __dartStr(counts.size) + " " + __dartStr(counts.get("one")));
  __dartMapUpdateAll(counts, function(key, value) { return (value + key.length); });
  const entries = Array.from(Array.from(counts, ([key, value]) => ({ key, value })), function(entry) { return __dartStr(entry.key) + ":" + __dartStr(entry.value); });
  __dartPrint("map more " + __dartStr(__dartMapContainsValue(counts, 27)) + " " + __dartStr(__dartIterableJoin(entries, "|")));
  (counts.clear(), null);
  __dartPrint("map cleared " + __dartStr(counts.size === 0));
}

main();
