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
function __dartIndexGet(receiver, index) {
  if (Array.isArray(receiver) || (ArrayBuffer.isView(receiver) && !(receiver instanceof DataView)) || typeof receiver === "string") return receiver[index];
  const op = receiver?.["[]"];
  if (typeof op === "function") return op.call(receiver, index);
  return receiver[index];
}
function __dartCompare(left, right, compare = null) {
  if (typeof compare === "function") return Number(compare(left, right));
  const compareTo = left?.compareTo;
  if (typeof compareTo === "function") return Number(compareTo.call(left, right));
  return left < right ? -1 : (left > right ? 1 : 0);
}
function __dartSplayTreeSet(compare = null, isValidKey = null) {
  const set = new Set();
  Object.defineProperty(set, "__dartSplayCompare", { value: compare });
  Object.defineProperty(set, "__dartSplayIsValidKey", { value: isValidKey });
  return set;
}
function __dartSplayTreeSetFrom(values, compare = null, isValidKey = null) {
  const set = __dartSplayTreeSet(compare, isValidKey);
  for (const value of values) __dartSetAdd(set, value);
  return set;
}
function __dartSplaySortSet(set) {
  const values = Array.from(set).sort((left, right) => __dartCompare(left, right, set.__dartSplayCompare));
  set.clear();
  for (const value of values) set.add(value);
}
function __dartSplayTreeMap(compare = null, isValidKey = null) {
  const map = new Map();
  Object.defineProperty(map, "__dartSplayCompare", { value: compare });
  Object.defineProperty(map, "__dartSplayIsValidKey", { value: isValidKey });
  return map;
}
function __dartSplayTreeMapFromEntries(entries, compare = null, isValidKey = null) {
  const map = __dartSplayTreeMap(compare, isValidKey);
  for (const [key, value] of entries) __dartMapSet(map, key, value);
  return map;
}
function __dartSplaySortMap(map) {
  const entries = Array.from(map).sort(([left], [right]) => __dartCompare(left, right, map.__dartSplayCompare));
  map.clear();
  for (const [key, value] of entries) map.set(key, value);
}
function __dartSetAdd(set, value) {
  if (set.__dartIdentitySet) {
    if (set.has(value)) return false;
    set.add(value);
    return true;
  }
  if (set.__dartSplayCompare !== undefined) {
    for (const candidate of set) {
      if (__dartCompare(candidate, value, set.__dartSplayCompare) === 0) return false;
    }
    set.add(value);
    __dartSplaySortSet(set);
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
const __dartMapMissingKey = Symbol("dart.mapMissingKey");
function __dartMapKey(map, key) {
  if (map.__dartIdentityMap) return map.has(key) ? key : __dartMapMissingKey;
  if (map.__dartMapEquals != null) {
    if (map.__dartMapIsValidKey != null && !map.__dartMapIsValidKey(key)) return __dartMapMissingKey;
    for (const candidate of map.keys()) {
      if (map.__dartMapEquals(candidate, key)) return candidate;
    }
    return __dartMapMissingKey;
  }
  if (map.__dartSplayCompare !== undefined) {
    for (const candidate of map.keys()) {
      if (__dartCompare(candidate, key, map.__dartSplayCompare) === 0) return candidate;
    }
    return __dartMapMissingKey;
  }
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
  if (map.__dartSplayCompare !== undefined) __dartSplaySortMap(map);
  return value;
}
function __dartListRemove(list, needle) {
  const index = list.findIndex((value) => __dartEquals(value, needle));
  if (index < 0) return false;
  list.splice(index, 1);
  return true;
}
function __dartListRemoveWhere(list, test) {
  list.splice(0, list.length, ...list.filter((value) => !test(value)));
  return null;
}
function __dartListRetainWhere(list, test) {
  list.splice(0, list.length, ...list.filter((value) => test(value)));
  return null;
}
function __dartIterableContains(iterable, needle) {
  if (iterable instanceof Set && iterable.__dartIdentitySet) return iterable.has(needle);
  for (const value of iterable) {
    if (iterable instanceof Set && iterable.__dartSplayCompare !== undefined && __dartCompare(value, needle, iterable.__dartSplayCompare) === 0) return true;
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
function __dartIterableJoin(iterable, separator = "") {
  if (iterable != null && typeof iterable["[]"] === "function" && typeof iterable.length === "number") {
    const values = [];
    for (let index = 0; index < iterable.length; index++) values.push(__dartStr(iterable["[]"](index)));
    return values.join(String(separator));
  }
  return Array.from(iterable, (value) => __dartStr(value)).join(String(separator));
}
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
  if ((typeof left === "number" || left.__dartType === "double") && (typeof right === "number" || right.__dartType === "double")) return Number(left) === Number(right);
  const equals = left["=="];
  return typeof equals === "function" ? equals.call(left, right) : false;
}

// Generated by dart2esm.

export function descendingInt(left, right) {
  return (right < left ? -1 : (right > left ? 1 : 0));
}

export function descendingString(left, right) {
  return (right < left ? -1 : (right > left ? 1 : 0));
}

export function main() {
  const map = new Map();
  __dartMapSet(map, "one", 1);
  __dartMapSet(map, "two", 2);
  __dartPrint("hashMap " + __dartStr(map.size) + " " + __dartStr(__dartMapContainsKey(map, "two")) + " " + __dartStr(__dartMapGet(map, "one")));
  const set = new Set();
  __dartSetAdd(set, "a");
  __dartSetAdd(set, "b");
  __dartSetAdd(set, "a");
  __dartPrint("hashSet " + __dartStr(set.size) + " " + __dartStr(__dartIterableContains(set, "a")) + " " + __dartStr(__dartIterableJoin(set, ",")));
  const queue = [];
  (queue.push(1), null);
  (queue.unshift(0), null);
  (queue.push(2), null);
  __dartPrint("queue " + __dartStr(queue.length) + " " + __dartStr(__dartIndexGet(queue, 0)) + " " + __dartStr(__dartIndexGet(queue, queue.length - 1)) + " " + __dartStr(__dartIterableJoin(queue, ",")));
  __dartPrint("remove " + __dartStr(queue.shift()) + " " + __dartStr(queue.pop()) + " " + __dartStr(__dartIterableJoin(queue, ",")));
  const linked = [];
  (linked.push(...Array.from(["b", "c"])), null);
  (linked.unshift("a"), null);
  __dartPrint("linkedQueue " + __dartStr(linked.length) + " " + __dartStr(__dartListRemove(linked, "b")) + " " + __dartStr(__dartIterableJoin(linked, ",")));
  const copied = Array.from([1, 2, 3, 4]);
  __dartListRemoveWhere(copied, function(value) { return (Math.trunc(value) % 2 !== 0); });
  __dartListRetainWhere(copied, function(value) { return (value > 2); });
  (copied.push(...Array.from(Array.from([5, 6]))), null);
  __dartPrint("listQueue " + __dartStr(copied[0]) + " " + __dartStr(copied[copied.length - 1]) + " " + __dartStr(copied.length !== 0) + " " + __dartStr(__dartIterableJoin(copied, ",")));
  __dartPrint("queueIter " + __dartStr(Array.from(copied)[1]) + " " + __dartStr(__dartIterableJoin(Array.from(copied), "|")) + " " + __dartStr(Array.from(copied).some(function(value) { return __dartEquals(value, 5); })) + " " + __dartStr(Array.from(copied).every(function(value) { return (value > 0); })));
  (copied.length = 0, null);
  __dartPrint("queueClear " + __dartStr(copied.length) + " " + __dartStr(copied.length === 0));
  const sortedSet = __dartSplayTreeSet(null, null);
  __dartSetAddAll(sortedSet, [3, 1, 2]);
  __dartPrint("splaySet " + __dartStr(__dartIterableJoin(sortedSet, ",")) + " " + __dartStr(__dartIterableContains(sortedSet, 2)));
  const sortedMap = __dartSplayTreeMap(null, null);
  __dartMapSet(sortedMap, "b", 2);
  __dartMapSet(sortedMap, "a", 1);
  __dartPrint("splayMap " + __dartStr(__dartIterableJoin(Array.from(sortedMap.keys()), ",")) + " " + __dartStr(__dartIterableJoin(Array.from(sortedMap.values()), ",")) + " " + __dartStr(__dartMapGet(sortedMap, "b")));
  const reversedSet = __dartSplayTreeSetFrom([1, 3, 2], descendingInt, null);
  const duplicateAdded = __dartSetAdd(reversedSet, 2);
  const newAdded = __dartSetAdd(reversedSet, 0);
  __dartPrint("splaySetOf " + __dartStr(__dartIterableJoin(reversedSet, ",")) + " " + __dartStr(duplicateAdded) + " " + __dartStr(newAdded));
  const reversedMap = __dartSplayTreeMapFromEntries(new Map([["a", 1], ["c", 3], ["b", 2]]), descendingString, null);
  __dartMapSet(reversedMap, "d", 4);
  __dartMapSet(reversedMap, "a", 10);
  __dartPrint("splayMapOf " + __dartStr(__dartIterableJoin(Array.from(reversedMap.keys()), ",")) + " " + __dartStr(__dartIterableJoin(Array.from(reversedMap.values()), ",")) + " " + __dartStr(__dartMapGet(reversedMap, "a")));
}

main();
