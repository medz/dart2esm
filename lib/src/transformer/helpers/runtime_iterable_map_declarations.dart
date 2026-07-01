part of 'runtime_helpers.dart';

extension _Iterablemaphelperdeclaration on EsmRuntimeHelperRegistry {
  EsmModuleItem _iterableMapHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.iterableToArray => EsmRawModuleItem('''
function __dartIterableToArray(iterable) {
  if (Array.isArray(iterable)) return Array.from(iterable);
  if (iterable != null && typeof iterable["[]"] === "function" && typeof iterable.length === "number") {
    return Array.from({ length: Number(iterable.length) }, (_, index) => iterable["[]"](index));
  }
  return Array.from(iterable);
}
'''),
      EsmRuntimeHelper.iterableJoin => EsmRawModuleItem('''
function __dartIterableJoin(iterable, separator = "") {
  return __dartIterableToArray(iterable).map((value) => __dartStr(value)).join(String(separator));
}
'''),
      EsmRuntimeHelper.iterableWindow => EsmRawModuleItem('''
function __dartIterableTakeWhile(iterable, test) {
  const values = [];
  for (const value of __dartIterableToArray(iterable)) {
    if (!test(value)) break;
    values.push(value);
  }
  return values;
}
function __dartIterableSkipWhile(iterable, test) {
  const values = [];
  let skipping = true;
  for (const value of __dartIterableToArray(iterable)) {
    if (skipping && test(value)) continue;
    skipping = false;
    values.push(value);
  }
  return values;
}
'''),
      EsmRuntimeHelper.iterableSearch => EsmRawModuleItem('''
function __dartIterableFirstWhere(iterable, test, orElse = null) {
  for (const value of __dartIterableToArray(iterable)) {
    if (test(value)) return value;
  }
  if (typeof orElse === "function") return orElse();
  throw new Error("No element");
}
function __dartIterableFirstOrNull(iterable) {
  for (const value of __dartIterableToArray(iterable)) return value;
  return null;
}
function __dartIterableLastWhere(iterable, test, orElse = null) {
  let found = false;
  let result;
  for (const value of __dartIterableToArray(iterable)) {
    if (test(value)) {
      found = true;
      result = value;
    }
  }
  if (found) return result;
  if (typeof orElse === "function") return orElse();
  throw new Error("No element");
}
function __dartIterableLastOrNull(iterable) {
  let found = false;
  let result;
  for (const value of __dartIterableToArray(iterable)) {
    found = true;
    result = value;
  }
  return found ? result : null;
}
function __dartIterableSingle(iterable) {
  const values = __dartIterableToArray(iterable);
  if (values.length !== 1) throw new Error(values.length === 0 ? "No element" : "Too many elements");
  return values[0];
}
function __dartIterableSingleWhere(iterable, test, orElse = null) {
  let found = false;
  let result;
  for (const value of __dartIterableToArray(iterable)) {
    if (!test(value)) continue;
    if (found) throw new Error("Too many elements");
    found = true;
    result = value;
  }
  if (found) return result;
  if (typeof orElse === "function") return orElse();
  throw new Error("No element");
}
function __dartIterableSingleOrNull(iterable) {
  let found = false;
  let result;
  for (const value of __dartIterableToArray(iterable)) {
    if (found) return null;
    found = true;
    result = value;
  }
  return found ? result : null;
}
function __dartIterableElementAtOrNull(iterable, index) {
  const values = __dartIterableToArray(iterable);
  const offset = Number(index);
  return offset >= 0 && offset < values.length ? values[offset] : null;
}
'''),
      EsmRuntimeHelper.iterator => EsmRawModuleItem('''
function __dartIterator(iterable) {
  const values = __dartIterableToArray(iterable);
  let index = -1;
  return {
    current: undefined,
    moveNext() {
      index++;
      if (index < values.length) {
        this.current = values[index];
        return true;
      }
      this.current = undefined;
      return false;
    },
  };
}
'''),
      EsmRuntimeHelper.mapFactories => EsmRawModuleItem('''
function __dartMapFromEntries(entries) {
  const map = new Map();
  Object.defineProperty(map, "__dartEqualityMap", { value: true });
  __dartMapAddAll(map, entries);
  return map;
}
function __dartMapFromIterable(iterable, key = null, value = null) {
  const map = new Map();
  Object.defineProperty(map, "__dartEqualityMap", { value: true });
  for (const element of iterable) {
    __dartMapSet(
      map,
      typeof key === "function" ? key(element) : element,
      typeof value === "function" ? value(element) : element,
    );
  }
  return map;
}
function __dartMapFromIterables(keys, values) {
  const keyList = Array.from(keys);
  const valueList = Array.from(values);
  if (keyList.length !== valueList.length) throw new Error("Iterables do not have same length");
  const map = new Map();
  Object.defineProperty(map, "__dartEqualityMap", { value: true });
  for (let index = 0; index < keyList.length; index++) {
    __dartMapSet(map, keyList[index], valueList[index]);
  }
  return map;
}
'''),
      EsmRuntimeHelper.mapGet => EsmRawModuleItem('''
const __dartMapMissingKey = Symbol("dart.mapMissingKey");
function __dartMapKey(map, key) {
  if (typeof map.__dartSplayIsValidKey === "function" && !map.__dartSplayIsValidKey(key)) return __dartMapMissingKey;
  if (map.__dartSplayCompare !== undefined) {
    for (const candidate of map.keys()) {
      if (__dartCompare(candidate, key, map.__dartSplayCompare) === 0) return candidate;
    }
    return __dartMapMissingKey;
  }
  if (typeof map.__dartMapIsValidKey === "function" && !map.__dartMapIsValidKey(key)) return __dartMapMissingKey;
  if (typeof map.__dartMapEquals === "function") {
    for (const candidate of map.keys()) {
      if (map.__dartMapEquals(candidate, key)) return candidate;
    }
    return __dartMapMissingKey;
  }
  if (!map.__dartEqualityMap) return map.has(key) ? key : __dartMapMissingKey;
  for (const candidate of map.keys()) {
    if (__dartEquals(candidate, key)) return candidate;
  }
  return __dartMapMissingKey;
}
function __dartMapGet(map, key) {
  if (!(map instanceof Map) && map != null && typeof map["[]"] === "function") return map["[]"](key);
  const actualKey = __dartMapKey(map, key);
  return actualKey === __dartMapMissingKey ? null : map.get(actualKey);
}
'''),
      EsmRuntimeHelper.customHashMap => EsmRawModuleItem('''
function __dartCustomHashMap(equals = null, hashCode = null, isValidKey = null) {
  const map = new Map();
  Object.defineProperty(map, "__dartEqualityMap", { value: true });
  Object.defineProperty(map, "__dartMapEquals", { value: equals });
  Object.defineProperty(map, "__dartMapHashCode", { value: hashCode });
  Object.defineProperty(map, "__dartMapIsValidKey", { value: isValidKey });
  return map;
}
'''),
      EsmRuntimeHelper.mapSet => EsmRawModuleItem('''
function __dartMapSet(map, key, value) {
  const actualKey = __dartMapKey(map, key);
  map.set(actualKey === __dartMapMissingKey ? key : actualKey, value);
  if (map.__dartSplayCompare !== undefined) __dartSplaySortMap(map);
  return value;
}
'''),
      EsmRuntimeHelper.mapAddAll => EsmRawModuleItem('''
function __dartMapAddAll(map, entries) {
  for (const [key, value] of entries) __dartMapSet(map, key, value);
  return null;
}
'''),
      EsmRuntimeHelper.mapContainsKey => EsmRawModuleItem('''
function __dartMapContainsKey(map, key) {
  if (!(map instanceof Map) && map != null && typeof map.containsKey === "function") return map.containsKey(key);
  return __dartMapKey(map, key) !== __dartMapMissingKey;
}
'''),
      EsmRuntimeHelper.mapOps => EsmRawModuleItem('''
function __dartMapAddEntries(map, entries) {
  for (const [key, value] of entries) __dartMapSet(map, key, value);
  return null;
}
function __dartMapContainsValue(map, value) {
  for (const candidate of map.values()) {
    if (__dartEquals(candidate, value)) return true;
  }
  return false;
}
function __dartMapPutIfAbsent(map, key, ifAbsent) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey !== __dartMapMissingKey) return map.get(actualKey);
  const value = ifAbsent();
  __dartMapSet(map, key, value);
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
    __dartMapSet(map, key, value);
    return value;
  }
  throw new Error("Key not found");
}
function __dartMapForEach(map, action) {
  for (const [key, value] of map) action(key, value);
  return null;
}
function __dartMapMap(map, transform) {
  const result = new Map();
  Object.defineProperty(result, "__dartEqualityMap", { value: true });
  for (const [key, value] of map) {
    const entry = transform(key, value);
    __dartMapSet(result, entry[0], entry[1]);
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
function __dartMapUpdateAll(map, update) {
  for (const [key, value] of Array.from(map)) {
    map.set(key, update(key, value));
  }
  return null;
}
function __dartMapRemoveWhere(map, test) {
  for (const [key, value] of Array.from(map)) {
    if (test(key, value)) map.delete(key);
  }
  return null;
}
function __dartMapClear(map) {
  map.clear();
  return null;
}
'''),
      _ => throw StateError('Unexpected runtime helper declaration: $helper'),
    };
  }
}
