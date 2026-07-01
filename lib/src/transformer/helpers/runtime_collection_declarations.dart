part of 'runtime_helpers.dart';

extension _Collectionhelperdeclaration on EsmRuntimeHelperRegistry {
  EsmModuleItem _collectionHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.unmodifiableViews => EsmRawModuleItem('''
function __dartUnmodifiableListView(source) {
  const list = Array.isArray(source) ? source : Array.from(source);
  const readonly = new Set(["copyWithin", "fill", "pop", "push", "reverse", "shift", "sort", "splice", "unshift"]);
  return new Proxy(list, {
    get(target, property, receiver) {
      if (readonly.has(property)) return () => { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable list"); };
      return Reflect.get(target, property, receiver);
    },
    set() { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable list"); },
    deleteProperty() { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable list"); },
    defineProperty() { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable list"); },
  });
}
function __dartUnmodifiableMapView(source) {
  const mapLike = source != null && typeof source === "object" && (source instanceof Map || typeof source["[]"] === "function");
  const map = mapLike ? source : new Map(source);
  const readonly = new Set(["set", "delete", "clear", "[]=", "addAll", "addEntries", "remove", "removeWhere", "update", "updateAll", "putIfAbsent"]);
  return new Proxy(map, {
    get(target, property) {
      if (readonly.has(property)) return () => { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable map"); };
      const descriptor = Reflect.getOwnPropertyDescriptor(target, property);
      if (descriptor != null && "value" in descriptor) return descriptor.value;
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
    set() { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable map"); },
    deleteProperty() { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable map"); },
    defineProperty() { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable map"); },
  });
}
'''),
      EsmRuntimeHelper.setAddAll => EsmRawModuleItem('''
function __dartSetContains(set, needle) {
  if (typeof set.__dartSplayIsValidKey === "function" && !set.__dartSplayIsValidKey(needle)) return false;
  if (set.__dartSplayCompare !== undefined) {
    for (const value of set) {
      if (__dartCompare(value, needle, set.__dartSplayCompare) === 0) return true;
    }
    return false;
  }
  if (!set.__dartEqualitySet) return set.has(needle);
  for (const value of set) {
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
function __dartSetAdd(set, value) {
  if (__dartSetContains(set, value)) return false;
  set.add(value);
  if (set.__dartSplayCompare !== undefined) __dartSplaySortSet(set);
  return true;
}
function __dartSetFrom(values) {
  const set = new Set();
  Object.defineProperty(set, "__dartEqualitySet", { value: true });
  for (const value of values) __dartSetAdd(set, value);
  return set;
}
function __dartSetAddAll(set, values) {
  for (const value of values) __dartSetAdd(set, value);
  return null;
}
'''),
      EsmRuntimeHelper.setOps => EsmRawModuleItem('''
function __dartSetLookup(set, needle) {
  for (const value of set) {
    if (__dartEquals(value, needle)) return value;
  }
  return null;
}
function __dartSetRemove(set, value) {
  for (const candidate of set) {
    if (__dartEquals(candidate, value)) {
      set.delete(candidate);
      return true;
    }
  }
  return false;
}
function __dartSetContainsAll(set, values) {
  for (const value of values) {
    if (!__dartSetContains(set, value)) return false;
  }
  return true;
}
function __dartSetRemoveAll(set, values) {
  for (const value of values) __dartSetRemove(set, value);
  return null;
}
function __dartSetRetainAll(set, values) {
  const keep = Array.from(values);
  for (const value of Array.from(set)) {
    if (!keep.some((candidate) => __dartEquals(candidate, value))) set.delete(value);
  }
  return null;
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
function __dartSetUnion(set, other) {
  const result = __dartSetFrom(set);
  __dartSetAddAll(result, other);
  return result;
}
function __dartSetIntersection(set, other) {
  const result = __dartSetFrom([]);
  for (const value of set) {
    if (__dartSetContains(other, value)) __dartSetAdd(result, value);
  }
  return result;
}
function __dartSetDifference(set, other) {
  const result = __dartSetFrom([]);
  for (const value of set) {
    if (!__dartSetContains(other, value)) __dartSetAdd(result, value);
  }
  return result;
}
'''),
      EsmRuntimeHelper.splayTree => EsmRawModuleItem('''
function __dartSplayTreeSet(compare = null, isValidKey = null) {
  const set = new Set();
  Object.defineProperty(set, "__dartEqualitySet", { value: true });
  Object.defineProperty(set, "__dartSplayCompare", { value: compare });
  Object.defineProperty(set, "__dartSplayIsValidKey", { value: isValidKey });
  return set;
}
function __dartSplaySortSet(set) {
  const values = Array.from(set).sort((left, right) => __dartCompare(left, right, set.__dartSplayCompare));
  set.clear();
  for (const value of values) set.add(value);
}
function __dartSplayTreeSetFrom(values, compare = null, isValidKey = null) {
  const set = __dartSplayTreeSet(compare, isValidKey);
  for (const value of values) __dartSetAdd(set, value);
  return set;
}
function __dartSplayTreeMap(compare = null, isValidKey = null) {
  const map = new Map();
  Object.defineProperty(map, "__dartEqualityMap", { value: true });
  Object.defineProperty(map, "__dartSplayCompare", { value: compare });
  Object.defineProperty(map, "__dartSplayIsValidKey", { value: isValidKey });
  return map;
}
function __dartSplaySortMap(map) {
  const entries = Array.from(map).sort(([left], [right]) => __dartCompare(left, right, map.__dartSplayCompare));
  map.clear();
  for (const [key, value] of entries) map.set(key, value);
}
function __dartSplayTreeMapFromEntries(entries, compare = null, isValidKey = null) {
  const map = __dartSplayTreeMap(compare, isValidKey);
  for (const [key, value] of entries) __dartMapSet(map, key, value);
  return map;
}
'''),
      EsmRuntimeHelper.stringBuffer => EsmRawModuleItem('''
function __dartStringBuffer(initial = "") {
  let value = initial == null ? "" : __dartStr(initial);
  return {
    write(next) {
      value += __dartStr(next);
      return null;
    },
    writeln(next = "") {
      value += __dartStr(next) + "\\n";
      return null;
    },
    writeAll(values, separator = "") {
      const parts = __dartIterableToArray(values).map((item) => __dartStr(item));
      value += parts.join(__dartStr(separator));
      return null;
    },
    writeCharCode(charCode) {
      value += String.fromCodePoint(Number(charCode));
      return null;
    },
    clear() {
      value = "";
      return null;
    },
    toString() {
      return value;
    },
    get length() {
      return value.length;
    },
    get isEmpty() {
      return value.length === 0;
    },
    get isNotEmpty() {
      return value.length !== 0;
    },
  };
}
'''),
      EsmRuntimeHelper.stringFactory => EsmRawModuleItem('''
function __dartStringFromCharCodes(codes, start = 0, end = null) {
  const values = Array.from(codes).slice(Number(start), end == null ? undefined : Number(end));
  return String.fromCodePoint(...values);
}
'''),
      EsmRuntimeHelper.stringOps => EsmRawModuleItem('''
function __dartStringCodeUnits(source) {
  const text = String(source);
  return Array.from({ length: text.length }, (_, index) => text.charCodeAt(index));
}
function __dartStringReplaceFirst(source, pattern, replacement, startIndex = 0) {
  const text = String(source);
  const needle = String(pattern);
  const index = text.indexOf(needle, Number(startIndex));
  if (index < 0) return text;
  return text.slice(0, index) + String(replacement) + text.slice(index + needle.length);
}
function __dartStringReplaceRange(source, start, end, replacement) {
  const text = String(source);
  const actualEnd = end == null ? text.length : Number(end);
  return text.slice(0, Number(start)) + String(replacement) + text.slice(actualEnd);
}
'''),
      EsmRuntimeHelper.listAdd => EsmRawModuleItem('''
function __dartListAdd(list, value) {
  if (Array.isArray(list)) {
    list.push(value);
  } else if (list != null && typeof list.add === "function") {
    list.add(value);
  } else {
    const index = list.length;
    list.length = index + 1;
    __dartListLikeSet(list, index, value);
  }
  return null;
}
'''),
      EsmRuntimeHelper.listAddAll => EsmRawModuleItem('''
function __dartListAddAll(list, values) {
  for (const value of __dartIterableToArray(values)) {
    __dartListAdd(list, value);
  }
  return null;
}
'''),
      EsmRuntimeHelper.listFactory => EsmRawModuleItem('''
function __dartFixedList(values) {
  const list = __dartIterableToArray(values);
  Object.preventExtensions(list);
  return list;
}
function __dartListOf(values, growable = true) {
  const list = __dartIterableToArray(values);
  return growable ? list : __dartFixedList(list);
}
function __dartListFilled(length, fill, growable = false) {
  const list = Array(Number(length)).fill(fill);
  return growable ? list : __dartFixedList(list);
}
function __dartListGenerate(length, generator, growable = true) {
  const list = Array.from({ length: Number(length) }, (_, index) => generator(index));
  return growable ? list : __dartFixedList(list);
}
function __dartUnmodifiableList(values) {
  return Object.freeze(__dartIterableToArray(values));
}
'''),
      EsmRuntimeHelper.listMixin => EsmRawModuleItem('''
function __dartListLikeGet(list, index) {
  if (Array.isArray(list) || ArrayBuffer.isView(list) || typeof list === "string") return list[index];
  const op = list == null ? null : list["[]"];
  return typeof op === "function" ? op.call(list, index) : list[index];
}
function __dartListLikeSet(list, index, value) {
  if (Array.isArray(list) || ArrayBuffer.isView(list)) {
    list[index] = value;
    return value;
  }
  const op = list == null ? null : list["[]="];
  if (typeof op === "function") return op.call(list, index, value);
  list[index] = value;
  return value;
}
function __dartListMixinFirst(list) {
  return __dartListLikeGet(list, 0);
}
function __dartListMixinLast(list) {
  return __dartListLikeGet(list, list.length - 1);
}
function __dartListMixinSingle(list) {
  if (list.length !== 1) throw __dartCoreError("StateError", "Too many elements");
  return __dartListLikeGet(list, 0);
}
function __dartListMixinInsert(list, index, value) {
  index = Number(index);
  const length = Number(list.length);
  list.length = length + 1;
  for (let i = length; i > index; i--) {
    __dartListLikeSet(list, i, __dartListLikeGet(list, i - 1));
  }
  __dartListLikeSet(list, index, value);
  return null;
}
'''),
      EsmRuntimeHelper.listMutation => EsmRawModuleItem('''
function __dartListMutationRead(list, index) {
  return list != null && typeof list["[]"] === "function" ? list["[]"](index) : list[index];
}
function __dartListMutationWrite(list, index, value) {
  if (list != null && typeof list["[]="] === "function") {
    list["[]="](index, value);
  } else {
    list[index] = value;
  }
}
function __dartListMutationValues(values) {
  return __dartIterableToArray(values);
}
function __dartListShuffle(list, random = null) {
  for (let index = list.length - 1; index > 0; index--) {
    const nextInt = random == null ? Math.floor(Math.random() * (index + 1)) : Number(random.nextInt(index + 1));
    const current = __dartListMutationRead(list, index);
    __dartListMutationWrite(list, index, __dartListMutationRead(list, nextInt));
    __dartListMutationWrite(list, nextInt, current);
  }
  return null;
}
function __dartListRemoveAt(list, index) {
  index = Number(index);
  const value = __dartListMutationRead(list, index);
  __dartListRemoveRange(list, index, index + 1);
  return value;
}
function __dartListInsert(list, index, value) {
  index = Number(index);
  if (Array.isArray(list)) {
    list.splice(index, 0, value);
    return null;
  }
  const length = Number(list.length);
  list.length = length + 1;
  for (let cursor = length; cursor > index; cursor--) {
    __dartListMutationWrite(list, cursor, __dartListMutationRead(list, cursor - 1));
  }
  __dartListMutationWrite(list, index, value);
  return null;
}
function __dartListRemove(list, value) {
  for (let index = 0; index < list.length; index++) {
    if (__dartEquals(__dartListMutationRead(list, index), value)) {
      __dartListRemoveRange(list, index, index + 1);
      return true;
    }
  }
  return false;
}
function __dartListRemoveLast(list) {
  return __dartListRemoveAt(list, list.length - 1);
}
function __dartListInsertAll(list, index, values) {
  index = Number(index);
  const inserted = __dartListMutationValues(values);
  if (Array.isArray(list)) {
    list.splice(index, 0, ...inserted);
    return null;
  }
  const length = Number(list.length);
  list.length = length + inserted.length;
  for (let cursor = length - 1; cursor >= index; cursor--) {
    __dartListMutationWrite(list, cursor + inserted.length, __dartListMutationRead(list, cursor));
  }
  for (let cursor = 0; cursor < inserted.length; cursor++) {
    __dartListMutationWrite(list, index + cursor, inserted[cursor]);
  }
  return null;
}
function __dartListSetAll(list, index, values) {
  let cursor = Number(index);
  for (const value of __dartListMutationValues(values)) {
    __dartListMutationWrite(list, cursor++, value);
  }
  return null;
}
function __dartListFillRange(list, start, end, fill = null) {
  for (let index = Number(start); index < Number(end); index++) {
    __dartListMutationWrite(list, index, fill);
  }
  return null;
}
function __dartListReplaceRange(list, start, end, values) {
  start = Number(start);
  end = Number(end);
  const replacement = __dartListMutationValues(values);
  __dartListRemoveRange(list, start, end);
  __dartListInsertAll(list, start, replacement);
  return null;
}
function __dartListRemoveRange(list, start, end) {
  start = Number(start);
  end = Number(end);
  if (Array.isArray(list)) {
    list.splice(start, end - start);
    return null;
  }
  const length = Number(list.length);
  const count = end - start;
  for (let cursor = end; cursor < length; cursor++) {
    __dartListMutationWrite(list, cursor - count, __dartListMutationRead(list, cursor));
  }
  list.length = length - count;
  return null;
}
function __dartListRemoveWhere(list, test) {
  for (let index = list.length - 1; index >= 0; index--) {
    if (test(__dartListMutationRead(list, index))) {
      __dartListRemoveRange(list, index, index + 1);
    }
  }
  return null;
}
function __dartListRetainWhere(list, test) {
  for (let index = list.length - 1; index >= 0; index--) {
    if (!test(__dartListMutationRead(list, index))) {
      __dartListRemoveRange(list, index, index + 1);
    }
  }
  return null;
}
function __dartListAsMap(list) {
  const map = new Map();
  for (let index = 0; index < list.length; index++) map.set(index, __dartListMutationRead(list, index));
  return map;
}
'''),
      EsmRuntimeHelper.listRangeOps => EsmRawModuleItem('''
function __dartListRangeRead(list, index) {
  return list != null && typeof list["[]"] === "function" ? list["[]"](index) : list[index];
}
function __dartListRangeWrite(list, index, value) {
  if (list != null && typeof list["[]="] === "function") {
    list["[]="](index, value);
  } else {
    list[index] = value;
  }
}
function __dartListRangeValues(source, start = 0, end = null) {
  const from = Number(start);
  return __dartIterableToArray(source).slice(from, end == null ? undefined : Number(end));
}
function __dartListCopyRange(target, at, source, start = 0, end = null) {
  const values = __dartListRangeValues(source, start, end);
  let index = Number(at);
  for (const value of values) __dartListRangeWrite(target, index++, value);
  return null;
}
function __dartListWriteIterable(target, at, source) {
  let index = Number(at);
  for (const value of __dartListRangeValues(source)) {
    __dartListRangeWrite(target, index++, value);
  }
  return null;
}
function __dartListSetRange(target, start, end, source, skipCount = 0) {
  const from = Number(skipCount);
  const count = Number(end) - Number(start);
  const values = __dartListRangeValues(source, from, from + count);
  let index = Number(start);
  for (const value of values) __dartListRangeWrite(target, index++, value);
  return null;
}
'''),
      EsmRuntimeHelper.listSearch => EsmRawModuleItem('''
function __dartListIndexOf(list, needle, start = 0) {
  const values = Array.from(list);
  for (let index = Math.max(0, Number(start)); index < values.length; index++) {
    if (__dartEquals(values[index], needle)) return index;
  }
  return -1;
}
function __dartListLastIndexOf(list, needle, start = null) {
  const values = Array.from(list);
  let index = start == null ? values.length - 1 : Math.min(Number(start), values.length - 1);
  for (; index >= 0; index--) {
    if (__dartEquals(values[index], needle)) return index;
  }
  return -1;
}
function __dartListIndexWhere(list, test, start = 0) {
  const values = Array.from(list);
  for (let index = Math.max(0, Number(start)); index < values.length; index++) {
    if (test(values[index])) return index;
  }
  return -1;
}
function __dartListLastIndexWhere(list, test, start = null) {
  const values = Array.from(list);
  let index = start == null ? values.length - 1 : Math.min(Number(start), values.length - 1);
  for (; index >= 0; index--) {
    if (test(values[index])) return index;
  }
  return -1;
}
'''),
      EsmRuntimeHelper.typedDataSublistView => EsmRawModuleItem('''
function __dartTypedDataSublistView(data, start, end, viewConstructor, bytesPerElement) {
  const elementSize = data instanceof DataView ? 1 : data.BYTES_PER_ELEMENT;
  const elementCount = Math.trunc(data.byteLength / elementSize);
  const effectiveEnd = end == null ? elementCount : end;
  const byteOffset = data.byteOffset + start * elementSize;
  const byteLength = (effectiveEnd - start) * elementSize;
  if (viewConstructor === DataView) return new DataView(data.buffer, byteOffset, byteLength);
  return new viewConstructor(data.buffer, byteOffset, Math.trunc(byteLength / bytesPerElement));
}
'''),
      _ => throw StateError('Unexpected runtime helper declaration: $helper'),
    };
  }
}
