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
function __dartObjectToString(value) {
  if (value == null) return "null";
  if (typeof value === "object") {
    const toString = value.toString;
    if (typeof toString === "function" && toString !== Object.prototype.toString) {
      return String(toString.call(value));
    }
    const typeName = value.constructor && value.constructor.name ? value.constructor.name : "Object";
    return "Instance of '" + typeName + "'";
  }
  return String(value);
}
function __dartPrint(value) {
  console.log(__dartStr(value));
}
function __dartStringBuffer(initial = "") {
  let value = initial == null ? "" : String(initial);
  return {
    write(next) { value += String(next); },
    writeAll(values, separator = "") { value += Array.from(values, String).join(String(separator)); },
    writeCharCode(charCode) { value += String.fromCodePoint(charCode); },
    writeln(next = "") { value += String(next) + "\n"; },
    clear() { value = ""; },
    toString() { return value; },
    get length() { return value.length; },
    get isEmpty() { return value.length === 0; },
    get isNotEmpty() { return value.length !== 0; },
  };
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
function __dartUtf8Encode(source, start = 0, end = null) {
  const text = String(source);
  return Array.from(new TextEncoder().encode(text.slice(start, end ?? undefined)));
}
function __dartUtf8Decode(bytes, allowMalformed = false, start = 0, end = null) {
  const slice = Array.from(bytes).slice(start, end ?? undefined);
  return new TextDecoder("utf-8", { fatal: !allowMalformed }).decode(Uint8Array.from(slice));
}
function __dartUtf8Encoder() {
  return {
    convert(source, start = 0, end = null) { return __dartUtf8Encode(source, start, end); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartUtf8Decoder(allowMalformed = false) {
  return {
    convert(bytes, start = 0, end = null) { return __dartUtf8Decode(bytes, allowMalformed, start, end); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartUtf8Codec(allowMalformed = false) {
  return {
    encode(source) { return __dartUtf8Encode(source); },
    convert(source) { return __dartUtf8Encode(source); },
    decode(bytes, options = {}) { return __dartUtf8Decode(bytes, options.allowMalformed ?? allowMalformed); },
    get encoder() { return __dartUtf8Encoder(); },
    get decoder() { return __dartUtf8Decoder(allowMalformed); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
const __dartTypeCache = new Map();
function __dartType(name) {
  if (__dartTypeCache.has(name)) return __dartTypeCache.get(name);
  const value = Object.freeze({
    name,
    toString() { return name; },
  });
  __dartTypeCache.set(name, value);
  return value;
}
function __dartSinkAdd(sink, value) {
  if (sink != null && typeof sink.add === "function") return sink.add(value);
  if (sink != null && typeof sink.write === "function") return sink.write(value);
  if (Array.isArray(sink)) { sink.push(value); return null; }
  throw new TypeError("Sink.add is not available");
}
function __dartSinkClose(sink) {
  if (sink != null && typeof sink.close === "function") return sink.close();
  return null;
}
function __dartConverterConvert(converter, value) {
  if (converter != null && typeof converter.convert === "function") return converter.convert(value);
  if (converter != null && typeof converter.encode === "function") return converter.encode(value);
  throw new TypeError("Converter.convert is not available");
}
function __dartConverterBind(converter, stream) {
  return (async function*() {
    for await (const value of stream) {
      yield __dartConverterConvert(converter, value);
    }
  })();
}
function __dartConverterFuse(first, second) {
  const fused = {
    convert(value) { return __dartConverterConvert(second, __dartConverterConvert(first, value)); },
    fuse(next) { return __dartConverterFuse(fused, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(fused, sink); },
    bind(stream) { return __dartConverterBind(fused, stream); },
  };
  if (typeof first?.encode === "function" && typeof first?.decode === "function" && typeof second?.encode === "function" && typeof second?.decode === "function") {
    fused.encode = (value) => second.encode(first.encode(value));
    fused.decode = (value) => first.decode(second.decode(value));
    Object.defineProperty(fused, "encoder", { get() { return __dartConverterFuse(first.encoder, second.encoder); } });
    Object.defineProperty(fused, "decoder", { get() { return __dartConverterFuse(second.decoder, first.decoder); } });
  }
  return fused;
}
function __dartConverterStartChunked(converter, sink) {
  const chunks = [];
  const input = {
    add(value) { chunks.push(value); return null; },
    addSlice(value, start, end, isLast = false) {
      const slice = typeof value === "string" ? value.slice(start, end) : Array.from(value).slice(start, end);
      chunks.push(slice);
      if (isLast) this.close();
      return null;
    },
    close() {
      let value;
      if (chunks.length === 0) value = "";
      else if (chunks.every((chunk) => typeof chunk === "string")) value = chunks.join("");
      else if (chunks.every((chunk) => Array.isArray(chunk) || ArrayBuffer.isView(chunk))) value = chunks.flatMap((chunk) => Array.from(chunk));
      else value = chunks.length === 1 ? chunks[0] : chunks;
      sink.add(__dartConverterConvert(converter, value));
      if (typeof sink.close === "function") sink.close();
      return null;
    },
  };
  return input;
}
function __dartChunkedConversionSink(callback) {
  const chunks = [];
  let closed = false;
  return {
    add(chunk) { if (closed) return null; chunks.push(chunk); return null; },
    close() { if (closed) return null; closed = true; callback(chunks); return null; },
  };
}
function __dartByteConversionSink(callback) {
  const bytes = [];
  let closed = false;
  return {
    add(chunk) { if (closed) return null; bytes.push(...Array.from(chunk)); return null; },
    addSlice(chunk, start, end, isLast = false) { if (closed) return null; bytes.push(...Array.from(chunk).slice(start, end)); if (isLast) this.close(); return null; },
    close() { if (closed) return null; closed = true; callback(bytes); return null; },
  };
}
function __dartByteConversionSinkFrom(sink) {
  let closed = false;
  return {
    add(chunk) { if (closed) return null; return __dartSinkAdd(sink, chunk); },
    addSlice(chunk, start, end, isLast = false) {
      if (closed) return null;
      __dartSinkAdd(sink, Array.from(chunk).slice(start, end));
      if (isLast) this.close();
      return null;
    },
    close() { if (closed) return null; closed = true; return __dartSinkClose(sink); },
  };
}
function __dartStringConversionSinkAsUtf8Sink(sink, allowMalformed = false) {
  let closed = false;
  return {
    add(chunk) { if (closed) return null; sink.add(__dartUtf8Decode(chunk, allowMalformed)); return null; },
    addSlice(chunk, start, end, isLast = false) { if (closed) return null; sink.add(__dartUtf8Decode(chunk, allowMalformed, start, end)); if (isLast) this.close(); return null; },
    close() { if (closed) return null; closed = true; return typeof sink.close === "function" ? sink.close() : null; },
  };
}
function __dartStringConversionSink(callback) {
  let text = "";
  let closed = false;
  return {
    add(chunk) { if (closed) return null; text += String(chunk); return null; },
    addSlice(chunk, start, end, isLast = false) { if (closed) return null; text += String(chunk).slice(start, end); if (isLast) this.close(); return null; },
    close() { if (closed) return null; closed = true; callback(text); return null; },
    asUtf8Sink(allowMalformed = false) { return __dartStringConversionSinkAsUtf8Sink(this, allowMalformed); },
  };
}
function __dartStringConversionSinkFrom(sink) {
  let closed = false;
  return {
    add(chunk) { if (closed) return null; return __dartSinkAdd(sink, String(chunk)); },
    addSlice(chunk, start, end, isLast = false) {
      if (closed) return null;
      __dartSinkAdd(sink, String(chunk).slice(start, end));
      if (isLast) this.close();
      return null;
    },
    close() { if (closed) return null; closed = true; return __dartSinkClose(sink); },
    asUtf8Sink(allowMalformed = false) { return __dartStringConversionSinkAsUtf8Sink(this, allowMalformed); },
  };
}
function __dartStringConversionSinkFromStringSink(sink) {
  let closed = false;
  return {
    add(chunk) { if (closed) return null; return __dartSinkAdd(sink, String(chunk)); },
    addSlice(chunk, start, end, isLast = false) {
      if (closed) return null;
      __dartSinkAdd(sink, String(chunk).slice(start, end));
      if (isLast) this.close();
      return null;
    },
    close() { closed = true; return null; },
    asUtf8Sink(allowMalformed = false) { return __dartStringConversionSinkAsUtf8Sink(this, allowMalformed); },
  };
}
const __dartSymbolCache = new Map();
function __dartSymbol(key, name) {
  if (__dartSymbolCache.has(key)) return __dartSymbolCache.get(key);
  const value = Object.freeze({
    name,
    toString() { return "Symbol(" + JSON.stringify(name) + ")"; },
  });
  __dartSymbolCache.set(key, value);
  return value;
}
function __dartNullCheck(value) {
  if (value == null) {
    throw new TypeError("Null check operator used on a null value");
  }
  return value;
}
function __dartAs(value, test, typeName) {
  if (test(value)) return value;
  throw new TypeError("Type cast failed: expected " + typeName);
}
function __dartFixedList(list) {
  return Object.seal(list);
}
function __dartCoreError(typeName, message) {
  const text = message == null ? "" : String(message);
  const display = text === "" ? typeName : typeName + ": " + text;
  const error = new Error(text);
  error.name = typeName;
  Object.defineProperty(error, "__dartCoreErrorType", { value: typeName });
  Object.defineProperty(error, "toString", { value() { return display; } });
  return error;
}
function __dartIsCoreError(value, typeName) {
  const actual = value == null ? null : value.__dartCoreErrorType;
  if (actual != null) {
    if (actual === typeName) return true;
    if (typeName === "Exception" && actual === "FormatException") return true;
    if (typeName === "RangeError" && actual === "IndexError") return true;
    if (typeName === "ArgumentError" && (actual === "RangeError" || actual === "IndexError")) return true;
    return typeName === "Error" && actual !== "Exception" && actual !== "FormatException";
  }
  if (typeName === "TypeError" && value instanceof TypeError) return true;
  return typeName === "Error" && value instanceof Error;
}
function __dartCheckValueInInterval(value, minValue, maxValue, name = null, message = null) {
  if (value < minValue || value > maxValue) throw __dartCoreError("RangeError", message ?? (String(name ?? "value") + " out of range"));
  return value;
}
function __dartCheckValidIndex(index, indexable, name = null, length = null, message = null) {
  length ??= indexable.length;
  if (index < 0 || index >= length) throw __dartCoreError("RangeError", message ?? (String(name ?? "index") + " out of range"));
  return index;
}
function __dartCheckValidRange(start, end, length, startName = null, endName = null, message = null) {
  if (start < 0 || start > length) throw __dartCoreError("RangeError", message ?? (String(startName ?? "start") + " out of range"));
  if (end == null) return length;
  if (end < start || end > length) throw __dartCoreError("RangeError", message ?? (String(endName ?? "end") + " out of range"));
  return end;
}
function __dartCheckNotNegative(value, name = null, message = null) {
  if (value < 0) throw __dartCoreError("RangeError", message ?? (String(name ?? "index") + " must not be negative"));
  return value;
}
function __dartBind(receiver, name) {
  if (Array.isArray(receiver) && name === "add") {
    return (value) => { receiver.push(value); return null; };
  }
  const value = receiver[name];
  return typeof value === "function" ? value.bind(receiver) : value;
}
function __dartInvocation(kind, name, positionalArguments = [], namedArguments = null) {
  const memberName = name != null && typeof name === "object" && "name" in name ? name : __dartSymbol(name, name);
  const displayName = memberName?.name ?? String(name);
  const named = new Map();
  if (namedArguments instanceof Map) {
    for (const [key, value] of namedArguments) {
      named.set(key, value);
    }
  } else if (namedArguments != null) {
    for (const [key, value] of Object.entries(namedArguments)) {
      named.set(__dartSymbol(key, key), value);
    }
  }
  return Object.freeze({
    memberName,
    positionalArguments: Array.from(positionalArguments),
    namedArguments: named,
    get isMethod() { return kind === "method"; },
    get isGetter() { return kind === "getter"; },
    get isSetter() { return kind === "setter"; },
    get isAccessor() { return kind !== "method"; },
    toString() { return "Invocation(" + kind + " " + displayName + ")"; },
  });
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
function __dartSplaySortSet(set) {
  const values = Array.from(set).sort((left, right) => __dartCompare(left, right, set.__dartSplayCompare));
  set.clear();
  for (const value of values) set.add(value);
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
function __dartIdentitySet() {
  const set = new Set();
  Object.defineProperty(set, "__dartIdentitySet", { value: true });
  return set;
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
  if (set.__dartSplayCompare !== undefined) Object.defineProperty(result, "__dartSplayCompare", { value: set.__dartSplayCompare });
  if (set.__dartSplayIsValidKey !== undefined) Object.defineProperty(result, "__dartSplayIsValidKey", { value: set.__dartSplayIsValidKey });
  for (const value of set) {
    if (!__dartIterableContains(other, value)) result.add(value);
  }
  return result;
}
function __dartSetIntersection(set, other) {
  const result = new Set();
  if (set.__dartIdentitySet) Object.defineProperty(result, "__dartIdentitySet", { value: true });
  if (set.__dartSplayCompare !== undefined) Object.defineProperty(result, "__dartSplayCompare", { value: set.__dartSplayCompare });
  if (set.__dartSplayIsValidKey !== undefined) Object.defineProperty(result, "__dartSplayIsValidKey", { value: set.__dartSplayIsValidKey });
  for (const value of set) {
    if (__dartIterableContains(other, value)) result.add(value);
  }
  return result;
}
function __dartSetUnion(set, other) {
  const result = new Set(set);
  if (set.__dartIdentitySet) Object.defineProperty(result, "__dartIdentitySet", { value: true });
  if (set.__dartSplayCompare !== undefined) Object.defineProperty(result, "__dartSplayCompare", { value: set.__dartSplayCompare });
  if (set.__dartSplayIsValidKey !== undefined) Object.defineProperty(result, "__dartSplayIsValidKey", { value: set.__dartSplayIsValidKey });
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
    if (set.__dartSplayCompare !== undefined && __dartCompare(value, needle, set.__dartSplayCompare) === 0) {
      set.delete(value);
      return true;
    }
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
const __dartMapMissingKey = Symbol("dart.mapMissingKey");
function __dartMapKey(map, key) {
  if (map.__dartIdentityMap) return map.has(key) ? key : __dartMapMissingKey;
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
  __dartMapSet(map, key, value);
  return value;
}
function __dartMapUpdate(map, key, update, ifAbsent = null) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey !== __dartMapMissingKey) {
    const value = update(map.get(actualKey));
    __dartMapSet(map, actualKey, value);
    return value;
  }
  if (typeof ifAbsent === "function") {
    const value = ifAbsent();
    __dartMapSet(map, key, value);
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
    if (iterable instanceof Set && iterable.__dartSplayCompare !== undefined && __dartCompare(value, needle, iterable.__dartSplayCompare) === 0) return true;
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
    if (set.__dartSplayCompare !== undefined && __dartCompare(value, needle, set.__dartSplayCompare) === 0) return value;
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
      if (set.__dartSplayCompare !== undefined && __dartCompare(candidate, value, set.__dartSplayCompare) === 0) {
        set.delete(candidate);
        break;
      }
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
    const index = set.__dartIdentitySet ? retained.indexOf(value) : retained.findIndex((needle) => set.__dartSplayCompare !== undefined ? __dartCompare(value, needle, set.__dartSplayCompare) === 0 : __dartEquals(value, needle));
    if (index < 0) set.delete(value);
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
function __dartTypedDataSublistView(data, start, end, viewConstructor, bytesPerElement) {
  const elementSize = data instanceof DataView ? 1 : data.BYTES_PER_ELEMENT;
  const elementCount = Math.trunc(data.byteLength / elementSize);
  const effectiveEnd = end == null ? elementCount : end;
  const byteOffset = data.byteOffset + start * elementSize;
  const byteLength = (effectiveEnd - start) * elementSize;
  if (viewConstructor === DataView) return new DataView(data.buffer, byteOffset, byteLength);
  return new viewConstructor(data.buffer, byteOffset, Math.trunc(byteLength / bytesPerElement));
}
function __dartBytesBuilder(copy = true) {
  let chunks = [];
  let length = 0;
  function asBytes(bytes) {
    if (bytes instanceof Uint8Array) return copy ? Uint8Array.from(bytes) : bytes;
    return Uint8Array.from(Array.from(bytes, (byte) => Number(byte) & 255));
  }
  function collect(clear) {
    const result = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    if (clear) { chunks = []; length = 0; }
    return result;
  }
  return {
    __dartType: "BytesBuilder",
    add(bytes) { const chunk = asBytes(bytes); if (chunk.length !== 0) { chunks.push(chunk); length += chunk.length; } return null; },
    addByte(byte) { chunks.push(Uint8Array.of(Number(byte) & 255)); length++; return null; },
    takeBytes() { return collect(true); },
    toBytes() { return collect(false); },
    clear() { chunks = []; length = 0; return null; },
    get length() { return length; },
    get isEmpty() { return length === 0; },
    get isNotEmpty() { return length !== 0; },
  };
}
function __dartListSetRange(target, start, end, source, skipCount = 0) {
  const values = Array.from(source).slice(skipCount, skipCount + (end - start));
  for (let index = 0; index < values.length; index++) {
    target[start + index] = values[index];
  }
  return null;
}
function __dartCompleter() {
  let completed = false;
  let resolveFuture;
  let rejectFuture;
  const future = new Promise((resolve, reject) => { resolveFuture = resolve; rejectFuture = reject; });
  return {
    future,
    get isCompleted() { return completed; },
    complete(value = null) {
      if (completed) throw new Error("Future already completed");
      completed = true;
      Promise.resolve(value).then(resolveFuture, rejectFuture);
      return null;
    },
    completeError(error, stackTrace = null) {
      if (completed) throw new Error("Future already completed");
      completed = true;
      rejectFuture(error);
      return null;
    },
  };
}
function __dartTimer(duration, callback, periodic) {
  const delay = Math.max(0, typeof duration === "number" ? duration : duration.inMilliseconds);
  let active = true;
  let tick = 0;
  let id;
  const timer = {
    get tick() { return tick; },
    get isActive() { return active; },
    cancel() {
      if (!active) return null;
      active = false;
      periodic ? clearInterval(id) : clearTimeout(id);
      return null;
    },
  };
  if (periodic) {
    id = setInterval(() => {
      if (!active) return;
      tick++;
      callback(timer);
    }, delay);
  } else {
    id = setTimeout(() => {
      if (!active) return;
      active = false;
      tick = 1;
      callback();
    }, delay);
  }
  return timer;
}
function __dartCreateZone(parent = null, values = null) {
  const zoneValues = values instanceof Map ? values : new Map();
  const zone = {
    __dartType: "Zone",
    parent,
    get errorZone() { return zone; },
    get(key) {
      if (zoneValues.has(key)) return zoneValues.get(key);
      return parent == null ? null : parent.get(key);
    },
    "[]"(key) { return this.get(key); },
    run(body) { return __dartRunInZone(zone, body); },
    runUnary(body, argument) { return __dartRunInZone(zone, () => body(argument)); },
    runBinary(body, first, second) { return __dartRunInZone(zone, () => body(first, second)); },
    runGuarded(body) { try { return __dartRunInZone(zone, body); } catch (error) { return zone.handleUncaughtError(error, error?.stack ?? "<javascript stack unavailable>"); } },
    runUnaryGuarded(body, argument) { try { return __dartRunInZone(zone, () => body(argument)); } catch (error) { return zone.handleUncaughtError(error, error?.stack ?? "<javascript stack unavailable>"); } },
    runBinaryGuarded(body, first, second) { try { return __dartRunInZone(zone, () => body(first, second)); } catch (error) { return zone.handleUncaughtError(error, error?.stack ?? "<javascript stack unavailable>"); } },
    bindCallback(callback) { return () => zone.run(callback); },
    bindUnaryCallback(callback) { return argument => zone.runUnary(callback, argument); },
    bindBinaryCallback(callback) { return (first, second) => zone.runBinary(callback, first, second); },
    bindCallbackGuarded(callback) { return () => zone.runGuarded(callback); },
    bindUnaryCallbackGuarded(callback) { return argument => zone.runUnaryGuarded(callback, argument); },
    bindBinaryCallbackGuarded(callback) { return (first, second) => zone.runBinaryGuarded(callback, first, second); },
    registerCallback(callback) { return zone.bindCallback(callback); },
    registerUnaryCallback(callback) { return zone.bindUnaryCallback(callback); },
    registerBinaryCallback(callback) { return zone.bindBinaryCallback(callback); },
    fork(options = {}) { return __dartCreateZone(zone, options.zoneValues); },
    scheduleMicrotask(callback) { return __dartScheduleMicrotask(callback, zone); },
    handleUncaughtError(error, stackTrace = null) { throw error; },
    inSameErrorZone(other) { return true; },
    print(line) { console.log(String(line)); return null; },
    toString() { return "Zone"; },
  };
  return Object.freeze(zone);
}
const __dartRootZone = __dartCreateZone(null, new Map());
let __dartCurrentZone = __dartRootZone;
function __dartZoneValuesMap(zoneValues) {
  if (zoneValues == null) return new Map();
  if (zoneValues instanceof Map) return zoneValues;
  return new Map(Array.from(zoneValues));
}
function __dartScheduleMicrotask(callback, zone = __dartCurrentZone) {
  const run = () => __dartRunInZone(zone, callback);
  if (typeof queueMicrotask === "function") queueMicrotask(run);
  else Promise.resolve().then(run);
  return null;
}
function __dartRunInZone(zone, body) {
  const previous = __dartCurrentZone;
  __dartCurrentZone = zone;
  try {
    const result = body();
    if (result != null && typeof result.then === "function") {
      return result.finally(() => { __dartCurrentZone = previous; });
    }
    __dartCurrentZone = previous;
    return result;
  } catch (error) {
    __dartCurrentZone = previous;
    throw error;
  }
}
function __dartRunZoned(body, options = {}) {
  const parent = options.parentZone ?? __dartCurrentZone;
  const zone = __dartCreateZone(parent, __dartZoneValuesMap(options.zoneValues));
  try {
    return __dartRunInZone(zone, body);
  } catch (error) {
    if (typeof options.onError === "function") return options.onError(error, error?.stack ?? "<javascript stack unavailable>");
    throw error;
  }
}
function __dartRunZonedGuarded(body, onError, options = {}) {
  try {
    const result = __dartRunZoned(body, { zoneValues: options.zoneValues, parentZone: options.parentZone ?? __dartCurrentZone });
    if (result != null && typeof result.then === "function") {
      return result.catch((error) => { onError(error, error?.stack ?? "<javascript stack unavailable>"); return null; });
    }
    return result;
  } catch (error) {
    onError(error, error?.stack ?? "<javascript stack unavailable>");
    return null;
  }
}
function __dartFutureAsStream(future) {
  return (async function*() {
    yield await future;
  })();
}
function __dartFutureWait(futures, eagerError = false, cleanUp = null) {
  const entries = Array.from(futures);
  if (entries.length === 0) return Promise.resolve([]);
  const values = new Array(entries.length);
  const completed = new Array(entries.length).fill(false);
  let remaining = entries.length;
  let hasError = false;
  let firstError;
  let rejected = false;
  function runCleanUp(value) {
    if (value == null || typeof cleanUp !== "function") return;
    Promise.resolve().then(() => cleanUp(value));
  }
  return new Promise((resolve, reject) => {
    entries.forEach((future, index) => {
      Promise.resolve(future).then(
        (value) => {
          values[index] = value;
          completed[index] = true;
          if (hasError) runCleanUp(value);
          remaining--;
          if (remaining === 0 && !rejected) {
            rejected = hasError;
            hasError ? reject(firstError) : resolve(values);
          }
        },
        (error) => {
          if (!hasError) {
            hasError = true;
            firstError = error;
            for (let i = 0; i < values.length; i++) {
              if (completed[i]) runCleanUp(values[i]);
            }
          }
          remaining--;
          if ((eagerError || remaining === 0) && !rejected) {
            rejected = true;
            reject(firstError);
          }
        },
      );
    });
  });
}
function __dartFutureTimeout(future, duration, onTimeout = null) {
  const delay = Math.max(0, typeof duration === "number" ? duration : duration.inMilliseconds);
  return new Promise((resolve, reject) => {
    let settled = false;
    const id = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        if (typeof onTimeout === "function") {
          resolve(onTimeout());
        } else {
          reject(new Error("TimeoutException: Future not completed"));
        }
      } catch (error) {
        reject(error);
      }
    }, delay);
    Promise.resolve(future).then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(id);
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(id);
        reject(error);
      },
    );
  });
}
function __dartStreamController(broadcast = false, options = {}) {
  const onListen = options.onListen ?? null;
  const onPause = options.onPause ?? null;
  const onResume = options.onResume ?? null;
  const onCancel = options.onCancel ?? null;
  const listeners = new Set();
  let closed = false;
  let singleListened = false;
  let activeSubscriptions = 0;
  let resolveDone;
  const done = new Promise((resolve) => { resolveDone = resolve; });
  function makeState(bufferBeforeListen = false) {
    return { queue: [], waiters: [], active: false, bufferBeforeListen, ended: false };
  }
  const singleState = makeState(true);
  function subscriptionStarted() {
    activeSubscriptions++;
    if (activeSubscriptions === 1 && typeof onListen === "function") onListen();
  }
  function subscriptionEnded(canceled) {
    if (activeSubscriptions > 0) activeSubscriptions--;
    if (canceled && activeSubscriptions === 0 && typeof onCancel === "function") return onCancel();
    return null;
  }
  function endState(state, canceled, remove) {
    if (state.ended) return null;
    state.ended = true;
    if (remove) remove();
    return subscriptionEnded(canceled);
  }
  function stateHasPending(state) {
    return state.queue.length > 0 || state.waiters.length > 0;
  }
  function hasActiveListener() {
    if (broadcast) return listeners.size > 0;
    return singleState.active;
  }
  function maybeResolveDone() {
    if (!closed) return;
    if (broadcast) {
      if (listeners.size > 0) return;
      resolveDone(null);
      return;
    }
    if (!singleState.active && !stateHasPending(singleState)) resolveDone(null);
  }
  function settle(waiter, item) {
    if (item.done === true) waiter.resolve({ done: true });
    else if ("error" in item) waiter.reject(item.error);
    else waiter.resolve({ value: item.value, done: false });
  }
  function nextResult(item) {
    if (item.done === true) return Promise.resolve({ done: true });
    if ("error" in item) return Promise.reject(item.error);
    return Promise.resolve({ value: item.value, done: false });
  }
  function enqueue(state, item) {
    if (!state.active && !state.bufferBeforeListen) return;
    const waiter = state.waiters.shift();
    if (waiter) settle(waiter, item);
    else state.queue.push(item);
  }
  function clearWaiters(state) {
    while (state.waiters.length > 0) settle(state.waiters.shift(), { done: true });
  }
  function cancelState(state) {
    state.active = false;
    state.bufferBeforeListen = false;
    state.queue.length = 0;
    clearWaiters(state);
    maybeResolveDone();
  }
  function deliver(item) {
    if (closed) throw new Error("Cannot add event after closing");
    if (broadcast) {
      for (const listener of listeners) enqueue(listener, item);
      return;
    }
    enqueue(singleState, item);
  }
  function closeQueue() {
    if (closed) return;
    closed = true;
    if (broadcast) {
      for (const listener of listeners) {
        const remove = () => listeners.delete(listener);
        if (listener.queue.length === 0) { listener.active = false; clearWaiters(listener); endState(listener, false, remove); }
      }
    } else if (singleState.queue.length === 0) {
      singleState.active = false;
      clearWaiters(singleState);
      endState(singleState, false, null);
    }
    maybeResolveDone();
  }
  function iteratorForState(state, remove) {
    return {
      next() {
        const item = state.queue.shift();
        if (item) {
          const result = nextResult(item);
          maybeResolveDone();
          return result;
        }
        if (closed || !state.active) {
          state.active = false;
          state.bufferBeforeListen = false;
          const endResult = endState(state, false, remove);
          maybeResolveDone();
          return Promise.resolve(endResult).then(() => ({ done: true }));
        }
        return new Promise((resolve, reject) => state.waiters.push({ resolve, reject }));
      },
      return() {
        cancelState(state);
        const endResult = endState(state, true, remove);
        return Promise.resolve(endResult).then(() => ({ done: true }));
      },
    };
  }
  const controller = {
    get stream() { return stream; },
    get sink() { return controller; },
    get done() { return done; },
    get isClosed() { return closed; },
    get isPaused() { return !hasActiveListener() && !closed; },
    get hasListener() { return hasActiveListener(); },
    add(value) { deliver({ value }); return null; },
    addError(error, stackTrace = null) { deliver({ error }); return null; },
    close() { closeQueue(); return done; },
    async addStream(source, options = {}) {
      const iterator = source?.[Symbol.asyncIterator]?.();
      if (iterator == null) {
        for (const value of Array.from(source ?? [])) deliver({ value });
        return null;
      }
      while (true) {
        let step;
        try {
          step = await iterator.next();
        } catch (error) {
          deliver({ error });
          if (options.cancelOnError === true) {
            if (typeof iterator.return === "function") await iterator.return();
            return null;
          }
          continue;
        }
        if (step.done === true) return null;
        deliver({ value: step.value });
      }
    },
  };
  const stream = {
    isBroadcast: broadcast,
    _onPause() { return typeof onPause === "function" ? onPause() : null; },
    _onResume() { return typeof onResume === "function" ? onResume() : null; },
    [Symbol.asyncIterator]() {
      if (broadcast) {
        const state = makeState();
        state.active = true;
        listeners.add(state);
        subscriptionStarted();
        return iteratorForState(state, () => { listeners.delete(state); maybeResolveDone(); });
      }
      if (singleListened) {
        throw new Error("Bad state: Stream has already been listened to.");
      }
      singleListened = true;
      singleState.active = true;
      singleState.bufferBeforeListen = false;
      subscriptionStarted();
      return iteratorForState(singleState, null);
    },
  };
  return controller;
}
function __dartBoundSubscriptionStream(source, onListen) {
  const stream = {
    get isBroadcast() { return source?.isBroadcast === true; },
    listen(onData, options = {}) {
      const subscription = onListen(source, options.cancelOnError ?? false);
      if (typeof subscription.onData === "function") subscription.onData(onData);
      if (typeof subscription.onError === "function") subscription.onError(options.onError ?? null);
      if (typeof subscription.onDone === "function") subscription.onDone(options.onDone ?? null);
      return subscription;
    },
    [Symbol.asyncIterator]() {
      const controller = __dartStreamController(false);
      const subscription = stream.listen((value) => controller.add(value), { onError: (error) => controller.addError(error), onDone: () => controller.close(), cancelOnError: false });
      const iterator = controller.stream[Symbol.asyncIterator]();
      return {
        next() { return iterator.next(); },
        return() {
          return Promise.resolve(subscription.cancel()).then(() => {
            if (typeof iterator.return === "function") return iterator.return();
            return { done: true };
          });
        },
      };
    },
  };
  return stream;
}
function __dartStreamIterator(stream) {
  const iterator = stream[Symbol.asyncIterator]();
  return {
    current: undefined,
    _subscription: true,
    async moveNext() {
      const next = await iterator.next();
      if (next.done) {
        this.current = undefined;
        this._subscription = null;
        return false;
      }
      this.current = next.value;
      return true;
    },
    async cancel() {
      this._subscription = null;
      if (typeof iterator.return === "function") await iterator.return();
      return null;
    },
  };
}
function __dartStreamFromIterable(values, isBroadcast = false) {
  let listened = false;
  return {
    isBroadcast,
    [Symbol.asyncIterator]() {
      if (!isBroadcast) {
        if (listened) throw new Error("Bad state: Stream has already been listened to.");
        listened = true;
      }
      return (async function*() {
        for (const value of values) yield value;
      })();
    },
  };
}
function __dartStreamFromFuture(future) {
  return (async function*() {
    yield await future;
  })();
}
function __dartStreamFromFutures(futures) {
  const controller = __dartStreamController(false);
  const pending = Array.from(futures);
  if (pending.length === 0) {
    controller.close();
    return controller.stream;
  }
  let remaining = pending.length;
  for (const future of pending) {
    Promise.resolve(future).then(
      (value) => controller.add(value),
      (error) => controller.addError(error),
    ).finally(() => {
      remaining--;
      if (remaining === 0) controller.close();
    });
  }
  return controller.stream;
}
function __dartStreamMulti(onListen, isBroadcast = false) {
  let listened = false;
  return {
    isBroadcast,
    [Symbol.asyncIterator]() {
      if (!isBroadcast) {
        if (listened) throw new Error("Bad state: Stream has already been listened to.");
        listened = true;
      }
      const controller = __dartStreamController(false);
      onListen(controller);
      return controller.stream[Symbol.asyncIterator]();
    },
  };
}
function __dartStreamError(error) {
  return (async function*() {
    throw error;
  })();
}
function __dartStreamPeriodic(period, computation = null) {
  return (async function*() {
    let tick = 0;
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, period.inMilliseconds)));
      yield typeof computation === "function" ? computation(tick) : null;
      tick++;
    }
  })();
}
function __dartStreamAsBroadcastStream(stream, onListen = null, onCancel = null) {
  const controller = __dartStreamController(true);
  let started = false;
  let canceled = false;
  function makeSubscription() {
    return {
      pause() { return null; },
      resume() { return null; },
      cancel() { canceled = true; return controller.close(); },
      get isPaused() { return false; },
    };
  }
  async function pump() {
    try {
      for await (const value of stream) {
        if (canceled) break;
        controller.add(value);
      }
    } catch (error) {
      if (!canceled) controller.addError(error);
    } finally {
      await controller.close();
    }
  }
  return {
    isBroadcast: true,
    [Symbol.asyncIterator]() {
      if (!started) {
        started = true;
        if (typeof onListen === "function") onListen(makeSubscription());
        Promise.resolve().then(pump);
      }
      const iterator = controller.stream[Symbol.asyncIterator]();
      return {
        next() { return iterator.next(); },
        return() {
          if (typeof onCancel === "function") onCancel(makeSubscription());
          if (typeof iterator.return === "function") return iterator.return();
          return Promise.resolve({ done: true });
        },
      };
    },
  };
}
function __dartStreamMap(stream, convert) {
  return (async function*() {
    for await (const value of stream) {
      yield convert(value);
    }
  })();
}
function __dartStreamWhere(stream, test) {
  return (async function*() {
    for await (const value of stream) {
      if (test(value)) yield value;
    }
  })();
}
function __dartStreamAsyncMap(stream, convert) {
  return (async function*() {
    for await (const value of stream) {
      yield await convert(value);
    }
  })();
}
function __dartStreamAsyncExpand(stream, convert) {
  return (async function*() {
    for await (const value of stream) {
      const inner = convert(value);
      if (inner == null) continue;
      for await (const expanded of inner) yield expanded;
    }
  })();
}
function __dartStreamTransformerFromBind(bind) {
  return { bind };
}
function __dartStreamTransformerFromHandlers({ handleData = null, handleError = null, handleDone = null } = {}) {
  return {
    bind(stream) {
      const controller = __dartStreamController(false);
      const sink = controller.sink;
      (async () => {
        let shouldClose = false;
        try {
          const iterator = stream[Symbol.asyncIterator]();
          while (!controller.isClosed) {
            let next;
            try {
              next = await iterator.next();
            } catch (error) {
              if (typeof handleError === "function") {
                await handleError(error, error?.stack ?? "<javascript stack unavailable>", sink);
                continue;
              }
              sink.addError(error);
              continue;
            }
            if (next.done) {
              if (typeof handleDone === "function") {
                await handleDone(sink);
              } else {
                shouldClose = true;
              }
              break;
            }
            if (typeof handleData === "function") {
              await handleData(next.value, sink);
            } else {
              sink.add(next.value);
            }
          }
        } catch (error) {
          if (!controller.isClosed) sink.addError(error);
          shouldClose = true;
        } finally {
          if (shouldClose && !controller.isClosed) await controller.close();
        }
      })();
      return controller.stream;
    },
  };
}
function __dartStreamTransformerBind(transformer, stream) {
  if (transformer != null && typeof transformer.bind === "function") return transformer.bind(stream);
  if (transformer != null && typeof transformer.convert === "function") return __dartConverterBind(transformer, stream);
  if (typeof transformer === "function") return transformer(stream);
  throw new TypeError("StreamTransformer.bind is not available");
}
function __dartStreamTransform(stream, transformer) {
  return __dartStreamTransformerBind(transformer, stream);
}
function __dartStreamEventTransformed(stream, mapSink) {
  const controller = __dartStreamController(stream?.isBroadcast === true);
  const sink = mapSink(controller.sink);
  (async () => {
    try {
      const iterator = stream[Symbol.asyncIterator]();
      while (!controller.isClosed) {
        let next;
        try {
          next = await iterator.next();
        } catch (error) {
          if (typeof sink.addError === "function") {
            sink.addError(error, error?.stack ?? "<javascript stack unavailable>");
          } else {
            controller.addError(error);
          }
          continue;
        }
        if (next.done) break;
        sink.add(next.value);
      }
      if (typeof sink.close === "function") {
        await sink.close();
      } else if (!controller.isClosed) {
        await controller.close();
      }
    } catch (error) {
      if (!controller.isClosed) controller.addError(error);
      if (!controller.isClosed) await controller.close();
    }
  })();
  return controller.stream;
}
function __dartStreamDistinct(stream, equals = null) {
  return (async function*() {
    let hasPrevious = false;
    let previous;
    for await (const value of stream) {
      const same = hasPrevious && (typeof equals === "function" ? equals(previous, value) : __dartEquals(previous, value));
      if (same) continue;
      previous = value;
      hasPrevious = true;
      yield value;
    }
  })();
}
function __dartStreamHandleError(stream, onError, test = null) {
  return (async function*() {
    const iterator = stream[Symbol.asyncIterator]();
    while (true) {
      let next;
      try {
        next = await iterator.next();
        if (next.done) break;
        yield next.value;
      } catch (error) {
        if (typeof test === "function" && !test(error)) throw error;
        if (typeof onError !== "function") continue;
        const result = onError.length >= 2 ? onError(error, error?.stack ?? "<javascript stack unavailable>") : onError(error);
        await result;
      }
    }
  })();
}
function __dartStreamTake(stream, count) {
  return (async function*() {
    let remaining = Math.max(0, Math.trunc(count));
    if (remaining === 0) return;
    for await (const value of stream) {
      yield value;
      remaining--;
      if (remaining === 0) break;
    }
  })();
}
function __dartStreamSkip(stream, count) {
  return (async function*() {
    let remaining = Math.max(0, Math.trunc(count));
    for await (const value of stream) {
      if (remaining > 0) {
        remaining--;
        continue;
      }
      yield value;
    }
  })();
}
function __dartStreamTimeout(stream, duration, onTimeout = null) {
  const controller = __dartStreamController(false);
  const delay = Math.max(0, typeof duration === "number" ? duration : duration.inMilliseconds);
  const iterator = stream[Symbol.asyncIterator]();
  let pendingNext = null;
  function nextEvent() {
    pendingNext ??= Promise.resolve(iterator.next()).then((next) => ({ next }), (error) => ({ error }));
    return pendingNext;
  }
  function timeoutEvent() {
    return new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), delay));
  }
  (async () => {
    try {
      while (!controller.isClosed) {
        const result = await Promise.race([nextEvent(), timeoutEvent()]);
        if (result.timeout) {
          if (typeof onTimeout === "function") {
            onTimeout(controller.sink);
          } else {
            controller.addError(new Error("TimeoutException: Stream timeout"));
          }
          continue;
        }
        pendingNext = null;
        if ("error" in result) {
          controller.addError(result.error);
          continue;
        }
        if (result.next.done) break;
        controller.add(result.next.value);
      }
    } finally {
      if (typeof iterator.return === "function") {
        try { await iterator.return(); } catch (_) {}
      }
      await controller.close();
    }
  })();
  return controller.stream;
}
function __dartStreamTakeWhile(stream, test) {
  return (async function*() {
    for await (const value of stream) {
      if (!test(value)) break;
      yield value;
    }
  })();
}
function __dartStreamSkipWhile(stream, test) {
  return (async function*() {
    let skipping = true;
    for await (const value of stream) {
      if (skipping && test(value)) continue;
      skipping = false;
      yield value;
    }
  })();
}
async function __dartStreamToList(stream) {
  const values = [];
  for await (const value of stream) values.push(value);
  return values;
}
async function __dartStreamToSet(stream) {
  const values = new Set();
  for await (const value of stream) {
    __dartSetAdd(values, value);
  }
  return values;
}
async function __dartStreamFold(stream, initialValue, combine) {
  let result = initialValue;
  for await (const value of stream) {
    result = await combine(result, value);
  }
  return result;
}
async function __dartStreamReduce(stream, combine) {
  let found = false;
  let result;
  for await (const value of stream) {
    if (!found) {
      found = true;
      result = value;
    } else {
      result = await combine(result, value);
    }
  }
  if (!found) throw new RangeError("No element");
  return result;
}
async function __dartStreamForEach(stream, action) {
  for await (const value of stream) await action(value);
  return null;
}
function __dartStreamCast(stream, test, typeName) {
  return (async function*() {
    for await (const value of stream) {
      yield __dartAs(value, test, typeName);
    }
  })();
}
async function __dartStreamFirst(stream) {
  for await (const value of stream) return value;
  throw new RangeError("No element");
}
async function __dartStreamLast(stream) {
  let found = false;
  let last;
  for await (const value of stream) {
    found = true;
    last = value;
  }
  if (!found) throw new RangeError("No element");
  return last;
}
async function __dartStreamSingle(stream) {
  let found = false;
  let single;
  for await (const value of stream) {
    if (found) throw new Error("Bad state: Too many elements");
    found = true;
    single = value;
  }
  if (!found) throw new RangeError("No element");
  return single;
}
async function __dartStreamLength(stream) {
  let count = 0;
  for await (const _ of stream) count++;
  return count;
}
async function __dartStreamIsEmpty(stream) {
  for await (const _ of stream) return false;
  return true;
}
async function __dartStreamAny(stream, test) {
  for await (const value of stream) {
    if (test(value)) return true;
  }
  return false;
}
async function __dartStreamEvery(stream, test) {
  for await (const value of stream) {
    if (!test(value)) return false;
  }
  return true;
}
async function __dartStreamFirstWhere(stream, test, orElse = null) {
  for await (const value of stream) {
    if (test(value)) return value;
  }
  if (typeof orElse === "function") return orElse();
  throw new RangeError("No element");
}
async function __dartStreamLastWhere(stream, test, orElse = null) {
  let found = false;
  let last;
  for await (const value of stream) {
    if (test(value)) {
      found = true;
      last = value;
    }
  }
  if (found) return last;
  if (typeof orElse === "function") return orElse();
  throw new RangeError("No element");
}
async function __dartStreamSingleWhere(stream, test, orElse = null) {
  let found = false;
  let single;
  for await (const value of stream) {
    if (!test(value)) continue;
    if (found) throw new Error("Bad state: Too many elements");
    found = true;
    single = value;
  }
  if (found) return single;
  if (typeof orElse === "function") return orElse();
  throw new RangeError("No element");
}
async function __dartStreamContains(stream, needle) {
  for await (const value of stream) {
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
async function __dartStreamJoin(stream, separator = "") {
  const values = [];
  for await (const value of stream) values.push(__dartStr(value));
  return values.join(String(separator));
}
async function __dartStreamDrain(stream, futureValue = null) {
  for await (const _ of stream) {}
  return futureValue;
}
async function __dartStreamPipe(stream, consumer) {
  if (typeof consumer.addStream === "function") {
    await consumer.addStream(stream);
  } else {
    for await (const value of stream) consumer.add(value);
  }
  return typeof consumer.close === "function" ? await consumer.close() : null;
}
function __dartStreamListen(stream, onData, onError = null, onDone = null, cancelOnError = false) {
  if (stream != null && typeof stream.listen === "function" && typeof stream[Symbol.asyncIterator] !== "function") {
    return stream.listen(onData, { onError, onDone, cancelOnError });
  }
  const iteratorFactory = stream?.[Symbol.asyncIterator];
  if (typeof iteratorFactory !== "function") throw new TypeError("Object is not a Stream");
  const iterator = iteratorFactory.call(stream);
  let canceled = false;
  let paused = false;
  let resumeWaiter = null;
  function waitWhilePaused() {
    if (!paused) return Promise.resolve();
    return new Promise((resolve) => { resumeWaiter = resolve; });
  }
  const done = (async () => {
      while (!canceled) {
        await waitWhilePaused();
        if (canceled) break;
        let next;
        try {
          next = await iterator.next();
        } catch (error) {
          if (typeof onError === "function") onError(error);
          else throw error;
          if (cancelOnError) break;
          continue;
        }
        if (next.done) break;
        if (typeof onData === "function") onData(next.value);
      }
      if (!canceled && typeof onDone === "function") onDone();
    return null;
  })();
  return {
    get isPaused() { return paused; },
    pause(resumeSignal = null) {
      if (!paused) {
        paused = true;
        if (typeof stream._onPause === "function") stream._onPause();
      }
      if (resumeSignal != null) Promise.resolve(resumeSignal).then(() => this.resume());
      return null;
    },
    resume() {
      if (!paused) return null;
      paused = false;
      if (typeof stream._onResume === "function") stream._onResume();
      if (resumeWaiter != null) {
        const resolve = resumeWaiter;
        resumeWaiter = null;
        resolve();
      }
      return null;
    },
    onData(handleData) { onData = handleData; return null; },
    onError(handleError) { onError = handleError; return null; },
    onDone(handleDone) { onDone = handleDone; return null; },
    cancel() { canceled = true; this.resume(); if (typeof iterator.return === "function") return Promise.resolve(iterator.return()).then(() => done, () => done); return done; },
    asFuture(value = null) { return done.then(() => value); },
  };
}
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
  if ((typeof left === "number" || left.__dartType === "double") && (typeof right === "number" || right.__dartType === "double")) return Number(left) === Number(right);
  const equals = left["=="];
  return typeof equals === "function" ? equals.call(left, right) : false;
}
const __dartIdentityHashes = new WeakMap();
let __dartNextIdentityHash = 1;
function __dartCombineHash(hash, value) {
  hash = (((hash + value) & 0x1fffffff) + (((hash & 0x0007ffff) << 10) & 0x1fffffff)) & 0x1fffffff;
  return hash ^ (hash >> 6);
}
function __dartFinishHash(hash) {
  hash = (((hash + (((hash & 0x03ffffff) << 3) & 0x1fffffff)) & 0x1fffffff) ^ (hash >> 11));
  return (hash + (((hash & 0x00003fff) << 15) & 0x1fffffff)) & 0x1fffffff;
}
function __dartHashValue(value) {
  if (value == null) return 0;
  if (typeof value === "boolean") return value ? 1231 : 1237;
  if (typeof value === "number") return Number.isFinite(value) ? Math.trunc(value) & 0x1fffffff : 0;
  if (typeof value === "string") {
    let hash = 0;
    for (let i = 0; i < value.length; i++) hash = __dartCombineHash(hash, value.charCodeAt(i));
    return __dartFinishHash(hash);
  }
  if (typeof value === "bigint") return Number(value & 0x1fffffffn);
  if (!__dartIdentityHashes.has(value)) {
    __dartIdentityHashes.set(value, __dartNextIdentityHash);
    __dartNextIdentityHash = (__dartNextIdentityHash + 1) & 0x1fffffff || 1;
  }
  return __dartIdentityHashes.get(value);
}
function __dartObjectHash(values) {
  let hash = 0;
  for (const value of values) hash = __dartCombineHash(hash, __dartHashValue(value));
  return __dartFinishHash(hash);
}
function __dartObjectHashUnordered(values) {
  let sum = 0;
  let xor = 0;
  let count = 0;
  for (const value of values) {
    const hash = __dartHashValue(value);
    sum = (sum + hash) & 0x1fffffff;
    xor ^= hash;
    count++;
  }
  return __dartObjectHash([sum, xor, count]);
}
function __dartTruncDiv(left, right) {
  return Math.trunc(left / right);
}
const __dartConstValues = new Map();
function __dartConst(key, create) {
  if (!__dartConstValues.has(key)) {
    __dartConstValues.set(key, create());
  }
  return __dartConstValues.get(key);
}
function __dartConstMap(entries) {
  const map = new Map();
  for (const [key, value] of entries) __dartMapSet(map, key, value);
  const throwConst = () => { throw new TypeError("Cannot modify const Map"); };
  Object.defineProperty(map, "set", { value: throwConst });
  Object.defineProperty(map, "delete", { value: throwConst });
  Object.defineProperty(map, "clear", { value: throwConst });
  return Object.freeze(map);
}
function __dartLazyField(name, initialize, writable, publish) {
  let state = 0;
  let value;
  function get() {
    if (state === 2) return value;
    if (state === 1) {
      throw new Error("Cyclic initialization of field " + name);
    }
    if (initialize == null) {
      throw new Error("Late field " + name + " has not been initialized");
    }
    state = 1;
    try {
      value = initialize();
      if (publish) publish(value);
      state = 2;
      return value;
    } catch (error) {
      state = 0;
      throw error;
    }
  }
  function set(next) {
    if (writable === false || (writable === "once" && state === 2)) {
      throw new TypeError("Cannot assign to final field " + name);
    }
    value = next;
    if (publish) publish(value);
    state = 2;
    return next;
  }
  return { get, set };
}
function __dartIterator(iterable) {
  const values = Array.isArray(iterable) ? iterable : Array.from(iterable);
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

// Generated by dart2esm.

class AsyncCache {
  constructor(duration) {
    this._cachedStreamSplitter = null;
    this._cachedValueFuture = null;
    this._stale = null;
    this._duration = duration;
  }
  static ephemeral() {
    return $AsyncCache_ephemeral(AsyncCache);
  }
  async fetch(callback) {
    if (!((this._cachedStreamSplitter === null))) {
      {
        (() => { throw __dartCoreError("StateError", "Previously used to cache via `fetchStream`"); })();
      }
    }
    return (this._cachedValueFuture ?? (this._cachedValueFuture = (() => { let v = (callback)(); return (() => {
      (v.finally(__dartBind(this, "_startStaleTimer")).catch(() => null), null);
      return v;
    })(); })()));
  }
  fetchStream(callback) {
    if (!((this._cachedValueFuture === null))) {
      {
        (() => { throw __dartCoreError("StateError", "Previously used to cache via `fetch`"); })();
      }
    }
    let splitter = (this._cachedStreamSplitter ?? (this._cachedStreamSplitter = new StreamSplitter(__dartStreamTransform((callback)(), __dartStreamTransformerFromHandlers({ handleData: null, handleError: null, handleDone: (sink) => {
      this._startStaleTimer();
      sink.close();
} })))));
    return splitter.split();
  }
  invalidate() {
    this._cachedValueFuture = null;
    ((this._cachedStreamSplitter)?.close() ?? null);
    this._cachedStreamSplitter = null;
    ((this._stale)?.cancel() ?? null);
    this._stale = null;
  }
  _startStaleTimer() {
    let duration = this._duration;
    if (!((duration === null))) {
      {
        this._stale = __dartTimer(duration, __dartBind(this, "invalidate"), false);
      }
    } else {
      {
        this.invalidate();
      }
    }
  }
}

function $AsyncCache_ephemeral($newTarget) {
  const $self = Object.create($newTarget.prototype);
  $self._cachedStreamSplitter = null;
  $self._cachedValueFuture = null;
  $self._stale = null;
  $self._duration = null;
  return $self;
}

class AsyncMemoizer {
  constructor() {
    this._completer = __dartCompleter();
  }
  get future() {
    return this._completer.future;
  }
  get hasRun() {
    return this._completer.isCompleted;
  }
  runOnce(computation) {
    if (!(this.hasRun)) {
      this._completer.complete(Promise.resolve().then(() => (computation)()));
    }
    return this.future;
  }
}

class CancelableOperation {
  constructor() {
    throw new TypeError("Class CancelableOperation has no unnamed constructor");
  }
  static _(_completer) {
    return $CancelableOperation__(CancelableOperation, _completer);
  }
  static fromFuture(result, { onCancel = null } = {}) {
    return (() => { let v = new CancelableCompleter({ onCancel: onCancel }); return (() => {
      v.complete(result);
      return v;
    })(); })().operation;
  }
  static fromValue(value) {
    return (() => { let v = new CancelableCompleter(); return (() => {
      v.complete(value);
      return v;
    })(); })().operation;
  }
  static fromSubscription(subscription) {
    let completer = new CancelableCompleter({ onCancel: __dartBind(subscription, "cancel") });
    subscription.onDone(__dartAs(__dartBind(completer, "complete"), value => typeof value === "function", "void Function([FutureOr<void>?])"));
    subscription.onError(function(error, stackTrace) {
      subscription.cancel().finally(function() {
        completer.completeError(error, stackTrace);
});
});
    return completer.operation;
  }
  static race(operations) {
    operations = Array.from(operations);
    if (__dartIterableIsEmpty(operations)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "May not be empty"); })();
      }
    }
    let done = false;
    function cancelAll() {
      done = true;
      return __dartFutureWait((() => {
        const v = new Array(0).fill(null);
        {
          let _sync_for_iterator = __dartIterator(operations);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let operation = _sync_for_iterator.current;
              if (!(operation.isCanceled)) {
                (v.push(operation.cancel()), null);
              }
            }
          }
        }
        return v;
      })(), false, null);
    }
    let completer = new CancelableCompleter({ onCancel: cancelAll });
    {
      let _sync_for_iterator = __dartIterator(operations);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let operation = _sync_for_iterator.current;
          {
            operation.then(function(value) {
              if (!(done)) {
                cancelAll().finally(function() { return completer.complete(value); });
              }
}, { onError: function(error, stackTrace) {
              if (!(done)) {
                {
                  cancelAll().finally(function() { return completer.completeError(error, stackTrace); });
                }
              }
}, propagateCancel: false });
          }
        }
      }
    }
    return completer.operation;
  }
  get value() {
    return ((this._completer._inner)?.future ?? __dartCompleter().future);
  }
  asStream() {
    let controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: __dartBind(this._completer, "_cancel") });
    (() => { let v = this._completer._inner; return ((v === null) ? null : v.future.then(function(value) {
      controller.add(value);
      controller.close();
}, function(error, stackTrace) {
      controller.addError(error, stackTrace);
      controller.close();
})); })();
    return controller.stream;
  }
  valueOrCancellation(cancellationValue = null) {
    let completer = __dartCompleter();
    this.value.then(__dartAs(__dartBind(completer, "complete"), value => typeof value === "function", "void Function([FutureOr<CancelableOperation.T?>?])"), __dartBind(completer, "completeError"));
    (() => { let v = this._completer._cancelCompleter; return ((v === null) ? null : v.future.then(function(_) {
      completer.complete(cancellationValue);
}, __dartBind(completer, "completeError"))); })();
    return completer.future;
  }
  then(onValue, { onError = null, onCancel = null, propagateCancel = true } = {}) {
    return this.thenOperation(function(value, completer) {
      completer.complete((onValue)(value));
}, { onError: ((onError === null) ? null : function(error, stackTrace, completer) {
      completer.complete((onError)(error, stackTrace));
}), onCancel: ((onCancel === null) ? null : function(completer) {
      completer.complete((onCancel)());
}), propagateCancel: propagateCancel });
  }
  thenOperation(onValue, { onError = null, onCancel = null, propagateCancel = true } = {}) {
    const completer = new CancelableCompleter({ onCancel: (propagateCancel ? __dartBind(this, "_cancelIfNotCanceled") : null) });
    (() => { let v = this._completer._inner; return ((v === null) ? null : v.future.then(async function(value) {
      if (completer.isCanceled) {
        return;
      }
      try {
        {
          await (onValue)(value, completer);
        }
      } catch ($error) {
        if ($error != null) {
          const error = $error;
          const stack = $error?.stack ?? "<javascript stack unavailable>";
          {
            completer.completeError(error, stack);
          }
        } else {
          throw $error;
        }
      }
}, ((onError === null) ? __dartBind(completer, "completeError") : async function(error, stack) {
      if (completer.isCanceled) {
        return;
      }
      try {
        {
          await (onError)(error, stack, completer);
        }
      } catch ($error) {
        if ($error != null) {
          const error2 = $error;
          const stack2 = $error?.stack ?? "<javascript stack unavailable>";
          {
            _extension_0_completeErrorIfPending(completer, error2, (Object.is(error, error2) ? stack : stack2));
          }
        } else {
          throw $error;
        }
      }
}))); })();
    const cancelForwarder = new _CancelForwarder(completer, onCancel);
    if (this._completer.isCanceled) {
      {
        cancelForwarder._forward();
      }
    } else {
      {
        ((() => { let v_1 = this._completer; return (v_1._cancelForwarders ?? (v_1._cancelForwarders = new Array(0).fill(null))); })().push(cancelForwarder), null);
      }
    }
    return completer.operation;
  }
  cancel() {
    return this._completer._cancel();
  }
  _cancelIfNotCanceled() {
    return (this.isCanceled ? null : this.cancel());
  }
  get isCanceled() {
    return this._completer._isCanceled;
  }
  get isCompleted() {
    return this._completer._isCompleted;
  }
}

function $CancelableOperation__($newTarget, _completer) {
  const $self = Object.create($newTarget.prototype);
  $self._completer = _completer;
  return $self;
}

class CancelableCompleter {
  constructor({ onCancel = null } = {}) {
    this._inner = __dartCompleter();
    this._cancelCompleter = __dartCompleter();
    this._cancelForwarders = null;
    this._mayComplete = true;
    const $operation = __dartLazyField("CancelableCompleter.operation", () => CancelableOperation._(this), false);
    Object.defineProperty(this, "operation", {
      get() { return $operation.get(); },
      set(value) { $operation.set(value); },
      enumerable: true,
    });
    this._onCancel = onCancel;
  }
  get _isCompleted() {
    return (this._cancelCompleter === null);
  }
  get _isCanceled() {
    return (this._inner === null);
  }
  get isCompleted() {
    return !(this._mayComplete);
  }
  get isCanceled() {
    return this._isCanceled;
  }
  complete(value = null) {
    if (!(this._mayComplete)) {
      (() => { throw __dartCoreError("StateError", "Operation already completed"); })();
    }
    this._mayComplete = false;
    if (!(value != null && typeof value.then === "function")) {
      {
        ((this._completeNow())?.complete(value) ?? null);
        return;
      }
    }
    if ((this._inner === null)) {
      {
        (value.catch(() => null), null);
        return;
      }
    }
    value.then((result) => {
      ((this._completeNow())?.complete(result) ?? null);
}, (error, stackTrace) => {
      ((this._completeNow())?.completeError(error, stackTrace) ?? null);
});
  }
  completeOperation(result, { propagateCancel = true } = {}) {
    if (!(this._mayComplete)) {
      (() => { throw __dartCoreError("StateError", "Already completed"); })();
    }
    this._mayComplete = false;
    if (this.isCanceled) {
      {
        if (propagateCancel) {
          result.cancel();
        }
        (result.value.catch(() => null), null);
        return;
      }
    }
    result.then((value) => {
      ((this._inner)?.complete(value) ?? null);
}, { onError: (error, stack) => {
      ((this._inner)?.completeError(error, stack) ?? null);
}, onCancel: () => {
      this.operation.cancel();
} });
    if (propagateCancel) {
      {
        (() => { let v = this._cancelCompleter; return ((v === null) ? null : v.future.finally(__dartBind(result, "cancel"))); })();
      }
    }
  }
  _completeNow() {
    let inner = this._inner;
    if ((inner === null)) {
      return null;
    }
    this._cancelCompleter = null;
    return inner;
  }
  completeError(error, stackTrace = null) {
    if (!(this._mayComplete)) {
      (() => { throw __dartCoreError("StateError", "Operation already completed"); })();
    }
    this._mayComplete = false;
    ((this._completeNow())?.completeError(error, stackTrace) ?? null);
  }
  _cancel() {
    let cancelCompleter = this._cancelCompleter;
    if ((cancelCompleter === null)) {
      return Promise.resolve(null);
    }
    if (!((this._inner === null))) {
      {
        this._inner = null;
        cancelCompleter.complete(this._invokeCancelCallbacks());
      }
    }
    return cancelCompleter.future;
  }
  async _invokeCancelCallbacks() {
    const toReturn = (() => { let v = this._onCancel; return ((v === null) ? null : (v)()); })();
    const isFuture = toReturn != null && typeof toReturn.then === "function";
    const cancelFutures = (() => {
      const v = new Array(0).fill(null);
      if (isFuture) {
        (v.push(toReturn), null);
      }
      const v_1 = (() => { let v_2 = this._cancelForwarders; return ((v_2 === null) ? null : Array.from(Array.from(v_2, _forward)).filter((value) => value != null)); })();
      if (!((v_1 === null))) {
        (v.push(...Array.from(v_1)), null);
      }
      return v;
    })();
    const results = ((isFuture && __dartEquals(cancelFutures.length, 1)) ? [await toReturn] : (cancelFutures.length !== 0 ? await __dartFutureWait(cancelFutures, false, null) : __dartConst("[\"list\",\"DynamicType(dynamic)\"]", () => Object.freeze([]))));
    return (isFuture ? results[0] : toReturn);
  }
}

class _CancelForwarder {
  constructor(completer, onCancel) {
    this.completer = completer;
    this.onCancel = onCancel;
  }
  _forward() {
    if (this.completer.isCanceled) {
      return null;
    }
    const onCancel = this.onCancel;
    if ((onCancel === null)) {
      return this.completer._cancel();
    }
    try {
      {
        const result = (onCancel)(this.completer);
        if (result != null && typeof result.then === "function") {
          {
            return result.catch(_extension_0_get_completeErrorIfPending(this.completer));
          }
        }
      }
    } catch ($error) {
      if ($error != null) {
        const error = $error;
        const stack = $error?.stack ?? "<javascript stack unavailable>";
        {
          _extension_0_completeErrorIfPending(this.completer, error, stack);
        }
      } else {
        throw $error;
      }
    }
    return null;
  }
}

class ChunkedStreamReader {
  static _(_input) {
    return $ChunkedStreamReader__(ChunkedStreamReader, _input);
  }
  constructor(stream) {
    return ChunkedStreamReader._(__dartStreamIterator(stream));
  }
  async readChunk(size) {
    const result = new Array(0).fill(null);
    {
      let _stream = this.readStream(size);
      let _for_iterator = __dartStreamIterator(_stream);
      try {
        while (await _for_iterator.moveNext()) {
          {
            const chunk = _for_iterator.current;
            {
              (result.push(...Array.from(chunk)), null);
            }
          }
        }
      } finally {
        if (!((_for_iterator._subscription === null))) {
          await _for_iterator.cancel();
        }
      }
    }
    return result;
  }
  readStream(size) {
    __dartCheckNotNegative(size, "size", null);
    if (this._reading) {
      {
        (() => { throw __dartCoreError("StateError", "Concurrent read operations are not allowed!"); })();
      }
    }
    this._reading = true;
    async function* substream() {
      L:
      while ((size > 0)) {
        {
          if (__dartEquals(this._offset, this._buffer.length)) {
            {
              if (!(await this._input.moveNext())) {
                {
                  size = 0;
                  this._reading = false;
                  break L;
                }
              }
              this._buffer = this._input.current;
              this._offset = 0;
            }
          }
          const remainingBuffer = (this._buffer.length - this._offset);
          if ((remainingBuffer > 0)) {
            {
              if ((remainingBuffer >= size)) {
                {
                  let output = null;
                  if (this._buffer instanceof Uint8Array) {
                    {
                      output = __dartAs(__dartTypedDataSublistView(__dartAs(this._buffer, value => value instanceof Uint8Array, "Uint8List"), this._offset, (this._offset + size), Uint8Array, 1), value => (Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView))), "List<ChunkedStreamReader.T%>");
                    }
                  } else {
                    {
                      output = this._buffer.slice(this._offset, (this._offset + size));
                    }
                  }
                  this._offset = (this._offset + size);
                  size = 0;
                  yield output;
                  this._reading = false;
                  break L;
                }
              }
              const output_1 = (__dartEquals(this._offset, 0) ? this._buffer : this._buffer.slice(this._offset));
              size = (size - remainingBuffer);
              this._buffer = this._emptyList;
              this._offset = 0;
              yield output_1;
            }
          }
        }
      }
    }
    const c = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null });
    c.onListen = function() { return c.addStream(substream(), { cancelOnError: false }).finally(__dartBind(c, "close")); };
    c.onCancel = async () => {
      L:
      while ((size > 0)) {
        {
          if (__dartEquals(this._buffer.length, this._offset)) {
            {
              if (!(await this._input.moveNext())) {
                {
                  size = 0;
                  break L;
                }
              }
              this._buffer = this._input.current;
              this._offset = 0;
            }
          }
          const remainingBuffer = (this._buffer.length - this._offset);
          if ((remainingBuffer >= size)) {
            {
              this._offset = (this._offset + size);
              size = 0;
              break L;
            }
          }
          size = (size - remainingBuffer);
          this._buffer = this._emptyList;
          this._offset = 0;
        }
      }
      this._reading = false;
};
    return c.stream;
  }
  async cancel() {
    return await this._input.cancel();
  }
}

function $ChunkedStreamReader__($newTarget, _input) {
  const $self = Object.create($newTarget.prototype);
  $self._emptyList = __dartConst("[\"list\",\"NeverType(Never)\"]", () => Object.freeze([]));
  $self._buffer = new Array(0).fill(null);
  $self._offset = 0;
  $self._reading = false;
  $self._input = _input;
  return $self;
}

class DelegatingEventSink {
  constructor(sink) {
    this._sink = sink;
  }
  static _(_sink) {
    return $DelegatingEventSink__(DelegatingEventSink, _sink);
  }
  static typed(sink) {
    return (sink != null && typeof sink === "object" && typeof sink.add === "function" && typeof sink.addError === "function" && typeof sink.close === "function" ? sink : DelegatingEventSink._(sink));
  }
  add(data) {
    this._sink.add(data);
  }
  addError(error, stackTrace = null) {
    this._sink.addError(error, stackTrace);
  }
  close() {
    this._sink.close();
  }
}

function $DelegatingEventSink__($newTarget, _sink) {
  const $self = Object.create($newTarget.prototype);
  $self._sink = _sink;
  return $self;
}

class DelegatingFuture {
  constructor(_future) {
    this._future = _future;
  }
  static typed(future) {
    return (future != null && typeof future.then === "function" ? future : future.then(function(v) { return __dartAs(v, value => true, "T"); }));
  }
  asStream() {
    return __dartFutureAsStream(this._future);
  }
  catchError(onError, { test = null } = {}) {
    return this._future.catch((error) => (test)(error) ? (onError)(error) : Promise.reject(error));
  }
  then(onValue, { onError = null } = {}) {
    return this._future.then(onValue, onError);
  }
  whenComplete(action) {
    return this._future.finally(action);
  }
  timeout(timeLimit, { onTimeout = null } = {}) {
    return __dartFutureTimeout(this._future, timeLimit, onTimeout);
  }
}

class DelegatingSink {
  constructor(sink) {
    this._sink = sink;
  }
  static _(_sink) {
    return $DelegatingSink__(DelegatingSink, _sink);
  }
  static typed(sink) {
    return (sink != null && typeof sink === "object" && typeof sink.add === "function" && typeof sink.close === "function" ? sink : DelegatingSink._(sink));
  }
  add(data) {
    this._sink.add(data);
  }
  close() {
    this._sink.close();
  }
}

function $DelegatingSink__($newTarget, _sink) {
  const $self = Object.create($newTarget.prototype);
  $self._sink = _sink;
  return $self;
}

class DelegatingStream {
  constructor(stream) {
  }
  static typed(stream) {
    return __dartStreamCast(stream, (value) => true, "TypeParameterType(DelegatingStream.typed.T%)");
  }
}

class DelegatingStreamConsumer {
  constructor(consumer) {
    this._consumer = consumer;
  }
  static _(_consumer) {
    return $DelegatingStreamConsumer__(DelegatingStreamConsumer, _consumer);
  }
  static typed(consumer) {
    return (consumer != null && typeof consumer === "object" && typeof consumer.addStream === "function" && typeof consumer.close === "function" ? consumer : DelegatingStreamConsumer._(consumer));
  }
  addStream(stream) {
    return this._consumer.addStream(stream, { cancelOnError: false });
  }
  close() {
    return this._consumer.close();
  }
}

function $DelegatingStreamConsumer__($newTarget, _consumer) {
  const $self = Object.create($newTarget.prototype);
  $self._consumer = _consumer;
  return $self;
}

class DelegatingStreamSink {
  constructor(sink) {
    this._sink = sink;
  }
  static _(_sink) {
    return $DelegatingStreamSink__(DelegatingStreamSink, _sink);
  }
  get done() {
    return this._sink.done;
  }
  static typed(sink) {
    return (sink != null && typeof sink === "object" && typeof sink.add === "function" && typeof sink.addError === "function" && typeof sink.close === "function" ? sink : DelegatingStreamSink._(sink));
  }
  add(data) {
    this._sink.add(data);
  }
  addError(error, stackTrace = null) {
    this._sink.addError(error, stackTrace);
  }
  addStream(stream) {
    return this._sink.addStream(stream, { cancelOnError: false });
  }
  close() {
    return this._sink.close();
  }
}

function $DelegatingStreamSink__($newTarget, _sink) {
  const $self = Object.create($newTarget.prototype);
  $self._sink = _sink;
  return $self;
}

class TypeSafeStreamSubscription {
  constructor(_subscription) {
    this._subscription = _subscription;
  }
  get isPaused() {
    return this._subscription.isPaused;
  }
  onData(handleData) {
    if ((handleData === null)) {
      return this._subscription.onData(null);
    }
    this._subscription.onData(function(data) { return (handleData)(__dartAs(data, value => true, "T")); });
  }
  onError(handleError) {
    this._subscription.onError(handleError);
  }
  onDone(handleDone) {
    this._subscription.onDone(handleDone);
  }
  pause(resumeFuture = null) {
    this._subscription.pause(resumeFuture);
  }
  resume() {
    this._subscription.resume();
  }
  cancel() {
    return this._subscription.cancel();
  }
  asFuture(futureValue = null) {
    return this._subscription.asFuture(futureValue);
  }
}

class DelegatingStreamSubscription {
  constructor(sourceSubscription) {
    this._source = sourceSubscription;
  }
  static typed(subscription) {
    return (subscription != null && typeof subscription === "object" && typeof subscription.pause === "function" && typeof subscription.resume === "function" && typeof subscription.cancel === "function" ? subscription : new TypeSafeStreamSubscription(subscription));
  }
  onData(handleData) {
    this._source.onData(handleData);
  }
  onError(handleError) {
    this._source.onError(handleError);
  }
  onDone(handleDone) {
    this._source.onDone(handleDone);
  }
  pause(resumeFuture = null) {
    this._source.pause(resumeFuture);
  }
  resume() {
    this._source.resume();
  }
  cancel() {
    return this._source.cancel();
  }
  asFuture(futureValue = null) {
    return this._source.asFuture(futureValue);
  }
  get isPaused() {
    return this._source.isPaused;
  }
}

class FutureGroup {
  constructor() {
    this._pending = 0;
    this._closed = false;
    this._completer = __dartCompleter();
    this._onIdleController = null;
    this._values = new Array(0).fill(null);
  }
  get isClosed() {
    return this._closed;
  }
  get future() {
    return this._completer.future;
  }
  get isIdle() {
    return __dartEquals(this._pending, 0);
  }
  get onIdle() {
    return (this._onIdleController ?? (this._onIdleController = __dartStreamController(true, { onListen: null, onPause: null, onResume: null, onCancel: null }))).stream;
  }
  add(task) {
    if (this._closed) {
      (() => { throw __dartCoreError("StateError", "The FutureGroup is closed."); })();
    }
    let index = this._values.length;
    (this._values.push(null), null);
    this._pending = (this._pending + 1);
    task.then((value) => {
      if (this._completer.isCompleted) {
        return null;
      }
      this._pending = (this._pending - 1);
      this._values[index] = value;
      if (!(__dartEquals(this._pending, 0))) {
        return null;
      }
      let onIdleController = this._onIdleController;
      if (!((onIdleController === null))) {
        onIdleController.add(null);
      }
      if (!(this._closed)) {
        return null;
      }
      if (!((onIdleController === null))) {
        onIdleController.close();
      }
      this._completer.complete(Array.from(Array.from(this._values).filter((value) => true)));
}).catch((error, stackTrace) => {
      if (this._completer.isCompleted) {
        return null;
      }
      this._completer.completeError(error, stackTrace);
});
  }
  close() {
    this._closed = true;
    if (!(__dartEquals(this._pending, 0))) {
      return;
    }
    if (this._completer.isCompleted) {
      return;
    }
    this._completer.complete(Array.from(Array.from(this._values).filter((value) => true)));
  }
}

class StreamCompleter {
  constructor() {
    this._stream = new _CompleterStream();
  }
  static fromFuture(streamFuture) {
    let completer = new StreamCompleter();
    streamFuture.then(__dartAs(__dartBind(completer, "setSourceStream"), value => typeof value === "function", "void Function(Stream<StreamCompleter.fromFuture.T%>)"), __dartBind(completer, "setError"));
    return completer.stream;
  }
  get stream() {
    return this._stream;
  }
  setSourceStream(sourceStream) {
    if (this._stream._isSourceStreamSet) {
      {
        (() => { throw __dartCoreError("StateError", "Source stream already set"); })();
      }
    }
    this._stream._setSourceStream(sourceStream);
  }
  setEmpty() {
    if (this._stream._isSourceStreamSet) {
      {
        (() => { throw __dartCoreError("StateError", "Source stream already set"); })();
      }
    }
    this._stream._setEmpty();
  }
  setError(error, stackTrace = null) {
    this.setSourceStream(__dartStreamFromFuture(Promise.reject(error)));
  }
}

class _CompleterStream {
  constructor() {
    this._controller = null;
    this._sourceStream = null;
  }
  listen(onData, { onError = null, onDone = null, cancelOnError = null } = {}) {
    if ((this._controller === null)) {
      {
        let sourceStream = this._sourceStream;
        if ((!((sourceStream === null)) && !((sourceStream.isBroadcast === true)))) {
          {
            return __dartStreamListen(sourceStream, onData, onError, onDone, cancelOnError);
          }
        }
        this._ensureController();
        if (!((this._sourceStream === null))) {
          {
            this._linkStreamToController();
          }
        }
      }
    }
    return __dartStreamListen(__dartNullCheck(this._controller).stream, onData, onError, onDone, cancelOnError);
  }
  get _isSourceStreamSet() {
    return !((this._sourceStream === null));
  }
  _setSourceStream(sourceStream) {
    this._sourceStream = sourceStream;
    if (!((this._controller === null))) {
      {
        this._linkStreamToController();
      }
    }
  }
  _linkStreamToController() {
    let controller = __dartNullCheck(this._controller);
    controller.addStream(__dartNullCheck(this._sourceStream), { cancelOnError: false }).finally(__dartBind(controller, "close"));
  }
  _setEmpty() {
    let controller = this._ensureController();
    this._sourceStream = controller.stream;
    controller.close();
  }
  _ensureController() {
    return (this._controller ?? (this._controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null })));
  }
}

class LazyStream {
  constructor(callback) {
    this._callback = callback;
    if ((this._callback === null)) {
      (() => { throw __dartCoreError("ArgumentError", "callback"); })();
    }
  }
  listen(onData, { onError = null, onDone = null, cancelOnError = null } = {}) {
    let callback = this._callback;
    if ((callback === null)) {
      {
        (() => { throw __dartCoreError("StateError", "Stream has already been listened to."); })();
      }
    }
    this._callback = null;
    let result = (callback)();
    let stream = null;
    if (result != null && typeof result.then === "function") {
      {
        stream = StreamCompleter.fromFuture(result);
      }
    } else {
      {
        stream = result;
      }
    }
    return __dartStreamListen(stream, onData, onError, onDone, cancelOnError);
  }
}

class NullStreamSink {
  constructor({ done = null } = {}) {
    this._closed = false;
    this._addingStream = false;
    this.done = (done ?? Promise.resolve(null));
  }
  static error(error, stackTrace = null) {
    return $NullStreamSink_error(NullStreamSink, error, stackTrace);
  }
  add(data) {
    this._checkEventAllowed();
  }
  addError(error, stackTrace = null) {
    this._checkEventAllowed();
  }
  addStream(stream) {
    this._checkEventAllowed();
    this._addingStream = true;
    let future = __dartStreamListen(stream, null, null, null, false).cancel();
    return future.finally(() => {
      this._addingStream = false;
});
  }
  _checkEventAllowed() {
    if (this._closed) {
      (() => { throw __dartCoreError("StateError", "Cannot add to a closed sink."); })();
    }
    if (this._addingStream) {
      {
        (() => { throw __dartCoreError("StateError", "Cannot add to a sink while adding a stream."); })();
      }
    }
  }
  close() {
    this._closed = true;
    return this.done;
  }
}

function $NullStreamSink_error($newTarget, error, stackTrace = null) {
  const $self = Object.create($newTarget.prototype);
  $self._closed = false;
  $self._addingStream = false;
  $self.done = (() => { let v = Promise.reject(error); return (() => {
    v.catch(function(_) {
});
    return v;
  })(); })();
  return $self;
}

class RestartableTimer {
  constructor(_duration, _callback) {
    this._duration = _duration;
    this._callback = _callback;
    this._timer = __dartTimer(_duration, _callback, false);
  }
  get isActive() {
    return this._timer.isActive;
  }
  reset() {
    this._timer.cancel();
    this._timer = __dartTimer(this._duration, this._callback, false);
  }
  cancel() {
    this._timer.cancel();
  }
  get tick() {
    return this._timer.tick;
  }
}

class CaptureSink {
  constructor(sink) {
    this._sink = sink;
  }
  add(value) {
    this._sink.add(new ValueResult(value));
  }
  addError(error, stackTrace = null) {
    this._sink.add(Result.error(error, stackTrace));
  }
  close() {
    this._sink.close();
  }
}

class CaptureStreamTransformer {
  bind(source) {
    return __dartStreamEventTransformed(source, $CaptureSink_new_tearoff);
  }
}

class ReleaseSink {
  constructor(_sink) {
    this._sink = _sink;
  }
  add(result) {
    result.addTo(this._sink);
  }
  addError(error, stackTrace = null) {
    this._sink.addError(error, stackTrace);
  }
  close() {
    this._sink.close();
  }
}

class ReleaseStreamTransformer {
  bind(source) {
    return __dartStreamEventTransformed(source, ReleaseStreamTransformer._createSink);
  }
  static _createSink(sink) {
    return new ReleaseSink(sink);
  }
}

class Result {
  constructor(computation) {
    if (new.target === Result) {
      try {
        {
          return new ValueResult((computation)());
        }
      } catch ($error) {
        if ($error != null) {
          const e = $error;
          const s = $error?.stack ?? "<javascript stack unavailable>";
          {
            return new ErrorResult(e, s);
          }
        } else {
          throw $error;
        }
      }
    }
  }
  static value(value) {
    return new ValueResult(value);
  }
  static error(error, stackTrace = null) {
    return new ErrorResult(error, stackTrace);
  }
  static capture(future) {
    return future.then($ValueResult_new_tearoff, $ErrorResult_new_tearoff);
  }
  static captureAll(elements) {
    let results = new Array(0).fill(null);
    let pending = 0;
    const completer = __dartLazyField("completer", null, true, null);
    {
      let _sync_for_iterator = __dartIterator(elements);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            if (element != null && typeof element.then === "function") {
              {
                let i = results.length;
                (results.push(null), null);
                pending = (pending + 1);
                Result.capture(element).then(function(result) {
                  results[i] = result;
                  if (__dartEquals(pending = (pending - 1), 0)) {
                    {
                      completer.get().complete(Array.from(results));
                    }
                  }
});
              }
            } else {
              {
                (results.push(new ValueResult(element)), null);
              }
            }
          }
        }
      }
    }
    if (__dartEquals(pending, 0)) {
      {
        return Promise.resolve(Array.from(results));
      }
    }
    completer.set(__dartCompleter());
    return completer.get().future;
  }
  static release(future) {
    return future.then(function(result) { return result.asFuture; });
  }
  static captureStream(source) {
    return __dartStreamTransform(source, new CaptureStreamTransformer());
  }
  static releaseStream(source) {
    return __dartStreamTransform(source, new ReleaseStreamTransformer());
  }
  static releaseSink(sink) {
    return new ReleaseSink(sink);
  }
  static captureSink(sink) {
    return new CaptureSink(sink);
  }
  static flatten(result) {
    if (result.isValue) {
      return __dartNullCheck(result.asValue).value;
    }
    return __dartNullCheck(result.asError);
  }
  static flattenAll(results) {
    let values = new Array(0).fill(null);
    {
      let _sync_for_iterator = __dartIterator(results);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let result = _sync_for_iterator.current;
          {
            if (result.isValue) {
              {
                (values.push(__dartNullCheck(result.asValue).value), null);
              }
            } else {
              {
                return __dartNullCheck(result.asError);
              }
            }
          }
        }
      }
    }
    return new ValueResult(values);
  }
  get isValue() {
    throw new TypeError("Abstract member Result.isValue");
  }
  set isValue(value) {
    Object.defineProperty(this, "isValue", { value, writable: true, configurable: true, enumerable: true });
  }
  get isError() {
    throw new TypeError("Abstract member Result.isError");
  }
  set isError(value) {
    Object.defineProperty(this, "isError", { value, writable: true, configurable: true, enumerable: true });
  }
  get asValue() {
    throw new TypeError("Abstract member Result.asValue");
  }
  set asValue(value) {
    Object.defineProperty(this, "asValue", { value, writable: true, configurable: true, enumerable: true });
  }
  get asError() {
    throw new TypeError("Abstract member Result.asError");
  }
  set asError(value) {
    Object.defineProperty(this, "asError", { value, writable: true, configurable: true, enumerable: true });
  }
  complete(completer) {
    throw new TypeError("Abstract member Result.complete");
  }
  addTo(sink) {
    throw new TypeError("Abstract member Result.addTo");
  }
  get asFuture() {
    throw new TypeError("Abstract member Result.asFuture");
  }
  set asFuture(value) {
    Object.defineProperty(this, "asFuture", { value, writable: true, configurable: true, enumerable: true });
  }
}

class ValueResult extends Result {
  constructor(value) {
    super();
    this.value = value;
  }
  get isValue() {
    return true;
  }
  get isError() {
    return false;
  }
  get asValue() {
    return this;
  }
  get asError() {
    return null;
  }
  complete(completer) {
    completer.complete(this.value);
  }
  addTo(sink) {
    sink.add(this.value);
  }
  get asFuture() {
    return Promise.resolve(this.value);
  }
  get hashCode() {
    return (__dartHashValue(this.value) ^ 842997089);
  }
  "=="(other) {
    return (other instanceof ValueResult && __dartEquals(this.value, other.value));
  }
}

class StreamSinkTransformer {
  constructor() {
    if (new.target === StreamSinkTransformer) {
      throw new TypeError("Class StreamSinkTransformer has no unnamed constructor");
    }
  }
  static fromStreamTransformer(transformer) {
    return new StreamTransformerWrapper(transformer);
  }
  static fromHandlers({ handleData = null, handleError = null, handleDone = null } = {}) {
    return new HandlerTransformer(handleData, handleError, handleDone);
  }
  bind(sink) {
    throw new TypeError("Abstract member StreamSinkTransformer.bind");
  }
  static typed(transformer) {
    return (transformer instanceof StreamSinkTransformer ? transformer : new TypeSafeStreamSinkTransformer(transformer));
  }
}

class HandlerTransformer extends StreamSinkTransformer {
  constructor(_handleData, _handleError, _handleDone) {
    super();
    this._handleData = _handleData;
    this._handleError = _handleError;
    this._handleDone = _handleDone;
  }
  bind(sink) {
    return new _HandlerSink(this, sink);
  }
}

class _HandlerSink {
  constructor(_transformer, inner) {
    this._transformer = _transformer;
    this._inner = inner;
    this._safeCloseInner = new _SafeCloseSink(inner);
  }
  get done() {
    return this._inner.done;
  }
  add(event) {
    let handleData = __dartAs(this._transformer._handleData, value => (value === null || typeof value === "function"), "void Function(_HandlerSink.S%, EventSink<_HandlerSink.T%>)?");
    if ((handleData === null)) {
      {
        this._inner.add(__dartAs(event, value => true, "T"));
      }
    } else {
      {
        (handleData)(event, this._safeCloseInner);
      }
    }
  }
  addError(error, stackTrace = null) {
    let handleError = __dartAs(this._transformer._handleError, value => (value === null || typeof value === "function"), "void Function(Object, StackTrace, EventSink<_HandlerSink.T%>)?");
    if ((handleError === null)) {
      {
        this._inner.addError(error, stackTrace);
      }
    } else {
      {
        (handleError)(error, (stackTrace ?? (error?.stack ?? new Error().stack ?? "<javascript stack unavailable>")), this._safeCloseInner);
      }
    }
  }
  addStream(stream) {
    return this._inner.addStream(__dartStreamTransform(stream, __dartStreamTransformerFromHandlers({ handleData: __dartAs(this._transformer._handleData, value => (value === null || typeof value === "function"), "void Function(_HandlerSink.S%, EventSink<_HandlerSink.T%>)?"), handleError: __dartAs(this._transformer._handleError, value => (value === null || typeof value === "function"), "void Function(Object, StackTrace, EventSink<_HandlerSink.T%>)?"), handleDone: _closeSink })), { cancelOnError: false });
  }
  close() {
    let handleDone = __dartAs(this._transformer._handleDone, value => (value === null || typeof value === "function"), "void Function(EventSink<_HandlerSink.T%>)?");
    if ((handleDone === null)) {
      return this._inner.close();
    }
    (handleDone)(this._safeCloseInner);
    return this._inner.done;
  }
}

class _SafeCloseSink extends DelegatingStreamSink {
  constructor(inner) {
    super(inner);
  }
  close() {
    return super.close().catch(function(_) {
});
  }
}

class StreamTransformerWrapper extends StreamSinkTransformer {
  constructor(_transformer) {
    super();
    this._transformer = _transformer;
  }
  bind(sink) {
    return new _StreamTransformerWrapperSink(this._transformer, sink);
  }
}

class _StreamTransformerWrapperSink {
  constructor(transformer, _inner) {
    this._controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null });
    this._inner = _inner;
    __dartStreamListen(__dartStreamTransform(this._controller.stream, transformer), __dartAs(__dartBind(this._inner, "add"), value => typeof value === "function", "void Function(_StreamTransformerWrapperSink.T%)"), __dartBind(this._inner, "addError"), () => {
      this._inner.close().catch(function(_) {
});
}, false);
  }
  get done() {
    return this._inner.done;
  }
  add(event) {
    this._controller.add(event);
  }
  addError(error, stackTrace = null) {
    this._controller.addError(error, stackTrace);
  }
  addStream(stream) {
    return this._controller.addStream(stream, { cancelOnError: false });
  }
  close() {
    this._controller.close();
    return this._inner.done;
  }
}

class TypeSafeStreamSinkTransformer extends StreamSinkTransformer {
  constructor(_inner) {
    super();
    this._inner = _inner;
  }
  bind(sink) {
    return (() => { let v = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null }); return (() => {
      __dartStreamPipe(__dartStreamCast(v.stream, (value) => true, "DynamicType(dynamic)"), this._inner.bind(sink));
      return v;
    })(); })();
  }
}

class ErrorResult extends Result {
  constructor(error, stackTrace = null) {
    super();
    this.error = error;
    this.stackTrace = (stackTrace ?? (error?.stack ?? new Error().stack ?? "<javascript stack unavailable>"));
  }
  get isValue() {
    return false;
  }
  get isError() {
    return true;
  }
  get asValue() {
    return null;
  }
  get asError() {
    return this;
  }
  complete(completer) {
    completer.completeError(this.error, this.stackTrace);
  }
  addTo(sink) {
    sink.addError(this.error, this.stackTrace);
  }
  get asFuture() {
    return Promise.reject(this.error);
  }
  handle(errorHandler) {
    if (typeof errorHandler === "function") {
      {
        (errorHandler)(this.error, this.stackTrace);
      }
    } else {
      if (typeof errorHandler === "function") {
        {
          (errorHandler)(this.error);
        }
      } else {
        {
          (() => { throw __dartCoreError("ArgumentError", "is neither Function(Object, StackTrace) nor Function(Object)"); })();
        }
      }
    }
  }
  get hashCode() {
    return ((__dartHashValue(this.error) ^ __dartHashValue(this.stackTrace)) ^ 492929599);
  }
  "=="(other) {
    return ((other instanceof ErrorResult && __dartEquals(this.error, other.error)) && __dartEquals(this.stackTrace, other.stackTrace));
  }
}

class ResultFuture extends DelegatingFuture {
  constructor(future) {
    super(future);
    this._result = null;
    Result.capture(future).then((result) => {
      this._result = result;
});
  }
  get isComplete() {
    return !((this.result === null));
  }
  get result() {
    return this._result;
  }
}

class SingleSubscriptionTransformer {
  bind(stream) {
    const subscription = __dartLazyField("subscription", null, true, null);
    let controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: function() { return subscription.get().cancel(); } });
    subscription.set(__dartStreamListen(stream, function(value) {
      try {
        {
          controller.add(__dartAs(value, value => true, "T"));
        }
      } catch ($error) {
        if (__dartIsCoreError($error, "TypeError")) {
          const error = $error;
          const stackTrace = $error?.stack ?? "<javascript stack unavailable>";
          {
            controller.addError(error, stackTrace);
          }
        } else {
          throw $error;
        }
      }
}, __dartBind(controller, "addError"), __dartBind(controller, "close"), false));
    return controller.stream;
  }
}

class Target {
  constructor(kinds) {
    this.kinds = kinds;
  }
}

class TargetKind {
  constructor() {
    throw new TypeError("Class TargetKind has no unnamed constructor");
  }
  static _(displayString, name) {
    return $TargetKind__(TargetKind, displayString, name);
  }
  get index() {
    return __dartListIndexOf(__dartConst("[\"list\",\"InterfaceType(TargetKind)\",[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"classes\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"classType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"constructors\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"constructor\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"directive\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enums\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enum values\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumValue\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"export directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"exportDirective\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extensions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extension\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extension types\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extensionType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"fields\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"field\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level functions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"function\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"libraries\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"library\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"getters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"getter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"import directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"importDirective\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"methods\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"method\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"mixins\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"mixinType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"optional parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"optionalParameter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"overridable members\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"overridableMember\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"parameter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"\\\"part of\\\" directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"partOfDirective\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"setters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"setter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level variables\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"topLevelVariable\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"types (classes, enums, mixins, or typedefs)\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"type\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"typedefs\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typedefType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"type parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typeParameter\"]]]]", () => Object.freeze([__dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"classes\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"classType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "classes", name: "classType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"constructors\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"constructor\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "constructors", name: "constructor" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"directive\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "directives", name: "directive" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enums\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "enums", name: "enumType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enum values\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumValue\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "enum values", name: "enumValue" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"export directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"exportDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "export directives", name: "exportDirective" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extensions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extension\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "extensions", name: "extension" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extension types\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extensionType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "extension types", name: "extensionType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"fields\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"field\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "fields", name: "field" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level functions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"function\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "top-level functions", name: "function" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"libraries\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"library\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "libraries", name: "library" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"getters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"getter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "getters", name: "getter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"import directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"importDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "import directives", name: "importDirective" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"methods\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"method\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "methods", name: "method" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"mixins\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"mixinType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "mixins", name: "mixinType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"optional parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"optionalParameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "optional parameters", name: "optionalParameter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"overridable members\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"overridableMember\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "overridable members", name: "overridableMember" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"parameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "parameters", name: "parameter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"\\\"part of\\\" directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"partOfDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "\"part of\" directives", name: "partOfDirective" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"setters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"setter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "setters", name: "setter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level variables\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"topLevelVariable\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "top-level variables", name: "topLevelVariable" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"types (classes, enums, mixins, or typedefs)\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"type\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "types (classes, enums, mixins, or typedefs)", name: "type" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"typedefs\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typedefType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "typedefs", name: "typedefType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"type parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typeParameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "type parameters", name: "typeParameter" })))])), this, 0);
  }
  toString() {
    return "TargetKind." + __dartStr(this.name);
  }
}

function $TargetKind__($newTarget, displayString, name) {
  const $self = Object.create($newTarget.prototype);
  $self.displayString = displayString;
  $self.name = name;
  return $self;
}

class Immutable {
  constructor(reason = "") {
    this.reason = reason;
  }
}

class RecordUse {
}

class Required {
  constructor(reason = "") {
    this.reason = reason;
  }
}

class UseResult {
  constructor(reason = "") {
    this.reason = reason;
    this.parameterDefined = null;
  }
  static unless({ parameterDefined, reason = "" } = {}) {
    return $UseResult_unless(UseResult, { parameterDefined: parameterDefined, reason: reason });
  }
}

function $UseResult_unless($newTarget, { parameterDefined, reason = "" } = {}) {
  const $self = Object.create($newTarget.prototype);
  $self.parameterDefined = parameterDefined;
  $self.reason = reason;
  return $self;
}

class _AlwaysThrows {
}

class _AwaitNotRequired {
}

class _Checked {
}

class _DoNotStore {
}

class _DoNotSubmit {
}

class _Experimental {
}

class _Factory {
}

class _Internal {
}

class _IsTest {
}

class _IsTestGroup {
}

class _Literal {
}

class _MustBeConst {
}

class _MustBeOverridden {
}

class _MustCallSuper {
}

class _NonVirtual {
}

class _OptionalTypeArgs {
}

class _Protected {
}

class _Redeclare {
}

class _Reopen {
}

class _Sealed {
}

class _Virtual {
}

class _VisibleForOverriding {
}

class _VisibleForTesting {
}

class EventSinkBase {
  constructor() {
    this._closeMemo = new AsyncMemoizer();
  }
  get _closed() {
    return this._closeMemo.hasRun;
  }
  add(data) {
    this._checkCanAddEvent();
    this.onAdd(data);
  }
  onAdd(data) {
    throw new TypeError("Abstract member EventSinkBase.onAdd");
  }
  addError(error, stackTrace = null) {
    this._checkCanAddEvent();
    this.onError(error, stackTrace);
  }
  onError(error, stackTrace = null) {
    throw new TypeError("Abstract member EventSinkBase.onError");
  }
  close() {
    return this._closeMemo.runOnce(__dartBind(this, "onClose"));
  }
  onClose() {
    throw new TypeError("Abstract member EventSinkBase.onClose");
  }
  _checkCanAddEvent() {
    if (this._closed) {
      (() => { throw __dartCoreError("StateError", "Cannot add event after closing"); })();
    }
  }
}

class StreamSinkBase extends EventSinkBase {
  constructor() {
    super();
    this._addingStream = false;
  }
  get done() {
    return this._closeMemo.future;
  }
  addStream(stream) {
    this._checkCanAddEvent();
    this._addingStream = true;
    let completer = __dartCompleter();
    __dartStreamListen(stream, __dartBind(this, "onAdd"), __dartBind(this, "onError"), () => {
      this._addingStream = false;
      completer.complete();
}, false);
    return completer.future;
  }
  close() {
    if (this._addingStream) {
      (() => { throw __dartCoreError("StateError", "StreamSink is bound to a stream"); })();
    }
    return super.close();
  }
  _checkCanAddEvent() {
    super._checkCanAddEvent();
    if (this._addingStream) {
      (() => { throw __dartCoreError("StateError", "StreamSink is bound to a stream"); })();
    }
  }
}

class IOSinkBase extends StreamSinkBase {
  constructor(encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false))) {
    super();
    this.encoding = encoding;
  }
  flush() {
    if (this._addingStream) {
      (() => { throw __dartCoreError("StateError", "StreamSink is bound to a stream"); })();
    }
    if (this._closed) {
      return Promise.resolve(null);
    }
    this._addingStream = true;
    return this.onFlush().finally(() => {
      this._addingStream = false;
});
  }
  onFlush() {
    throw new TypeError("Abstract member IOSinkBase.onFlush");
  }
  write(object) {
    let string = __dartObjectToString(object);
    if (string.length === 0) {
      return;
    }
    this.add(this.encoding.encode(string));
  }
  writeAll(objects, separator = "") {
    let first = true;
    {
      let _sync_for_iterator = __dartIterator(objects);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let object = _sync_for_iterator.current;
          {
            if (first) {
              {
                first = false;
              }
            } else {
              {
                this.write(separator);
              }
            }
            this.write(object);
          }
        }
      }
    }
  }
  writeln(object = "") {
    this.write(object);
    this.write("\n");
  }
  writeCharCode(charCode) {
    this.write(String.fromCodePoint(charCode));
  }
}

class StreamCloser {
  constructor() {
    this._subscriptions = (() => {
      const v = new Set();
      return v;
    })();
    this._controllers = (() => {
      const v = new Set();
      return v;
    })();
    this._closeFuture = null;
  }
  close() {
    return (this._closeFuture ?? (this._closeFuture = (() => {
      let futures = (() => {
        const v = new Array(0).fill(null);
        {
          let _sync_for_iterator = __dartIterator(this._subscriptions);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let subscription = _sync_for_iterator.current;
              (v.push(subscription.cancel()), null);
            }
          }
        }
        return v;
      })();
      this._subscriptions.clear();
      let controllers = Array.from(this._controllers);
      this._controllers.clear();
      __dartScheduleMicrotask(function() {
        {
          let _sync_for_iterator = __dartIterator(controllers);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let controller = _sync_for_iterator.current;
              {
                __dartScheduleMicrotask(__dartBind(controller, "close"));
              }
            }
          }
        }
});
      return __dartFutureWait(futures, true, null);
})()));
  }
  get isClosed() {
    return !((this._closeFuture === null));
  }
  bind(stream) {
    let controller = ((stream.isBroadcast === true) ? __dartStreamController(true, { onListen: null, onPause: null, onResume: null, onCancel: null }) : __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null }));
    controller.onListen = () => {
      if (this.isClosed) {
        {
          __dartStreamListen(stream, null, null, null, false).cancel().catch(function(_) {
});
          return;
        }
      }
      let subscription = __dartStreamListen(stream, __dartAs(__dartBind(controller, "add"), value => typeof value === "function", "void Function(StreamCloser.T%)"), __dartBind(controller, "addError"), null, false);
      subscription.onDone(() => {
        __dartSetRemove(this._subscriptions, subscription);
        __dartSetRemove(this._controllers, controller);
        controller.close();
});
      __dartSetAdd(this._subscriptions, subscription);
      if (!((stream.isBroadcast === true))) {
        {
          controller.onPause = __dartBind(subscription, "pause");
          controller.onResume = __dartBind(subscription, "resume");
        }
      }
      controller.onCancel = () => {
        __dartSetRemove(this._controllers, controller);
        if (__dartSetRemove(this._subscriptions, subscription)) {
          return subscription.cancel();
        }
        return null;
};
};
    if (this.isClosed) {
      {
        controller.close();
      }
    } else {
      {
        __dartSetAdd(this._controllers, controller);
      }
    }
    return controller.stream;
  }
}

class StreamGroup {
  constructor() {
    const $_controller = __dartLazyField("StreamGroup._controller", null, true);
    Object.defineProperty(this, "_controller", {
      get() { return $_controller.get(); },
      set(value) { $_controller.set(value); },
      enumerable: true,
    });
    this._closed = false;
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" })));
    this._onIdleController = null;
    this._subscriptions = new Map([]);
    this._controller = __dartStreamController(false, { onListen: __dartBind(this, "_onListen"), onPause: __dartBind(this, "_onPause"), onResume: __dartBind(this, "_onResume"), onCancel: __dartBind(this, "_onCancel") });
  }
  static broadcast() {
    return $StreamGroup_broadcast(StreamGroup);
  }
  get stream() {
    return this._controller.stream;
  }
  get isClosed() {
    return this._closed;
  }
  get isIdle() {
    return this._subscriptions.size === 0;
  }
  get onIdle() {
    return (this._onIdleController ?? (this._onIdleController = __dartStreamController(true, { onListen: null, onPause: null, onResume: null, onCancel: null }))).stream;
  }
  static merge(streams) {
    let group = new StreamGroup();
    (Array.from(streams).forEach(__dartAs(__dartBind(group, "add"), value => typeof value === "function", "Future<void>? Function(Stream<StreamGroup.merge.T%>)")), null);
    group.close();
    return group.stream;
  }
  static mergeBroadcast(streams) {
    let group = StreamGroup.broadcast();
    (Array.from(streams).forEach(__dartAs(__dartBind(group, "add"), value => typeof value === "function", "Future<void>? Function(Stream<StreamGroup.mergeBroadcast.T%>)")), null);
    group.close();
    return group.stream;
  }
  add(stream) {
    if (this._closed) {
      {
        (() => { throw __dartCoreError("StateError", "Can't add a Stream to a closed StreamGroup."); })();
      }
    }
    if (__dartEquals(this._state, __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" }))))) {
      {
        __dartMapPutIfAbsent(this._subscriptions, stream, function() { return null; });
      }
    } else {
      if (__dartEquals(this._state, __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"canceled\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "canceled" }))))) {
        {
          return __dartStreamListen(stream, null, null, null, false).cancel();
        }
      } else {
        {
          __dartMapPutIfAbsent(this._subscriptions, stream, () => { return this._listenToStream(stream); });
        }
      }
    }
    return null;
  }
  remove(stream) {
    let subscription = __dartMapRemove(this._subscriptions, stream);
    let future = ((subscription)?.cancel() ?? null);
    if (this._subscriptions.size === 0) {
      {
        ((this._onIdleController)?.add(null) ?? null);
        if (this._closed) {
          {
            ((this._onIdleController)?.close() ?? null);
            __dartScheduleMicrotask(__dartBind(this._controller, "close"));
          }
        }
      }
    }
    return future;
  }
  _onListen() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"listening\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "listening" })));
    {
      let _sync_for_iterator = __dartIterator((() => {
        const v = Array.from(Array.from(this._subscriptions, ([key, value]) => ({ key, value })));
        return v;
      })());
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let entry = _sync_for_iterator.current;
          L:
          {
            if (!((entry.value === null))) {
              break L;
            }
            let stream = entry.key;
            try {
              {
                __dartMapSet(this._subscriptions, stream, this._listenToStream(stream));
              }
            } catch ($error) {
              if ($error != null) {
                const error = $error;
                {
                  ((this._onCancel())?.catchError(function(_) {
}) ?? null);
                  (() => { throw $error; })();
                }
              } else {
                throw $error;
              }
            }
          }
        }
      }
    }
  }
  _onPause() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"paused\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "paused" })));
    {
      let _sync_for_iterator = __dartIterator(Array.from(this._subscriptions.values()));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let subscription = _sync_for_iterator.current;
          {
            __dartNullCheck(subscription).pause();
          }
        }
      }
    }
  }
  _onResume() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"listening\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "listening" })));
    {
      let _sync_for_iterator = __dartIterator(Array.from(this._subscriptions.values()));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let subscription = _sync_for_iterator.current;
          {
            __dartNullCheck(subscription).resume();
          }
        }
      }
    }
  }
  _onCancel() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"canceled\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "canceled" })));
    let futures = Array.from(Array.from(Array.from(Array.from(this._subscriptions, ([key, value]) => ({ key, value })), function(entry) {
      let subscription = entry.value;
      try {
        {
          if (!((subscription === null))) {
            return subscription.cancel();
          }
          return __dartStreamListen(entry.key, null, null, null, false).cancel();
        }
      } catch ($error) {
        if ($error != null) {
          const _ = $error;
          {
            return null;
          }
        } else {
          throw $error;
        }
      }
})).filter((value) => value != null));
    (this._subscriptions.clear(), null);
    let onIdleController = this._onIdleController;
    if ((!((onIdleController === null)) && !(onIdleController.isClosed))) {
      {
        onIdleController.add(null);
        onIdleController.close();
      }
    }
    return (futures.length === 0 ? null : __dartFutureWait(futures, false, null));
  }
  _onCancelBroadcast() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" })));
    (this._subscriptions.forEach((value, key) => ((stream, subscription) => {
      if (!((stream.isBroadcast === true))) {
        return;
      }
      __dartNullCheck(subscription).cancel();
      __dartMapSet(this._subscriptions, stream, null);
})(key, value)), null);
  }
  _listenToStream(stream) {
    let subscription = __dartStreamListen(stream, __dartAs(__dartBind(this._controller, "add"), value => typeof value === "function", "void Function(StreamGroup.T%)"), __dartBind(this._controller, "addError"), () => { return this.remove(stream); }, false);
    if (__dartEquals(this._state, __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"paused\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "paused" }))))) {
      subscription.pause();
    }
    return subscription;
  }
  close() {
    if (this._closed) {
      return this._controller.done;
    }
    this._closed = true;
    if (this._subscriptions.size === 0) {
      {
        ((this._onIdleController)?.close() ?? null);
        this._controller.close();
        return this._controller.done;
      }
    }
    if ((this._controller.stream.isBroadcast === true)) {
      {
        let streamsToRemove = null;
        __dartMapUpdateAll(this._subscriptions, (stream, subscription) => {
          if (!((subscription === null))) {
            return subscription;
          }
          try {
            {
              return this._listenToStream(stream);
            }
          } catch ($error) {
            if ($error != null) {
              {
                ((streamsToRemove ?? (streamsToRemove = new Array(0).fill(null))).push(stream), null);
                return null;
              }
            } else {
              throw $error;
            }
          }
});
        ((streamsToRemove)?.forEach(__dartBind(this._subscriptions, "remove")) ?? null);
      }
    }
    return this._controller.done;
  }
}

function $StreamGroup_broadcast($newTarget) {
  const $self = Object.create($newTarget.prototype);
  const $_controller = __dartLazyField("StreamGroup._controller", null, true);
  Object.defineProperty($self, "_controller", {
    get() { return $_controller.get(); },
    set(value) { $_controller.set(value); },
    enumerable: true,
  });
  $self._closed = false;
  $self._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" })));
  $self._onIdleController = null;
  $self._subscriptions = new Map([]);
  $self._controller = __dartStreamController(true, { onListen: __dartBind($self, "_onListen"), onPause: null, onResume: null, onCancel: __dartBind($self, "_onCancelBroadcast") });
  return $self;
}

class _StreamGroupState {
  constructor(name) {
    this.name = name;
  }
  toString() {
    return this.name;
  }
}

class StreamSplitter {
  constructor(_stream) {
    this._subscription = null;
    this._buffer = new Array(0).fill(null);
    this._controllers = (() => {
      const v = new Set();
      return v;
    })();
    this._closeGroup = new FutureGroup();
    this._isDone = false;
    this._isClosed = false;
    this._stream = _stream;
  }
  static splitFrom(stream, count = null) {
    ((count === null) ? count = 2 : null);
    let splitter = new StreamSplitter(stream);
    let streams = Array.from({ length: count }, (_, index) => (function(_) { return splitter.split(); })(index));
    splitter.close();
    return streams;
  }
  split() {
    if (this._isClosed) {
      {
        (() => { throw __dartCoreError("StateError", "Can't call split() on a closed StreamSplitter."); })();
      }
    }
    let controller = __dartStreamController(false, { onListen: __dartBind(this, "_onListen"), onPause: __dartBind(this, "_onPause"), onResume: __dartBind(this, "_onResume"), onCancel: null });
    controller.onCancel = () => { return this._onCancel(controller); };
    {
      let _sync_for_iterator = __dartIterator(this._buffer);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let result = _sync_for_iterator.current;
          {
            result.addTo(controller);
          }
        }
      }
    }
    if (this._isDone) {
      {
        this._closeGroup.add(controller.close());
      }
    } else {
      {
        __dartSetAdd(this._controllers, controller);
      }
    }
    return controller.stream;
  }
  close() {
    if (this._isClosed) {
      return this._closeGroup.future;
    }
    this._isClosed = true;
    (this._buffer.length = 0, null);
    if (__dartIterableIsEmpty(this._controllers)) {
      this._cancelSubscription();
    }
    return this._closeGroup.future;
  }
  _cancelSubscription() {
    let future = null;
    if (!((this._subscription === null))) {
      future = __dartNullCheck(this._subscription).cancel();
    }
    if (!((future === null))) {
      this._closeGroup.add(future);
    }
    this._closeGroup.close();
  }
  _onListen() {
    if (this._isDone) {
      return;
    }
    if (!((this._subscription === null))) {
      {
        __dartNullCheck(this._subscription).resume();
      }
    } else {
      {
        this._subscription = __dartStreamListen(this._stream, __dartBind(this, "_onData"), __dartBind(this, "_onError"), __dartBind(this, "_onDone"), false);
      }
    }
  }
  _onPause() {
    if (!(Array.from(this._controllers).every(function(controller) { return controller.isPaused; }))) {
      return;
    }
    __dartNullCheck(this._subscription).pause();
  }
  _onResume() {
    __dartNullCheck(this._subscription).resume();
  }
  _onCancel(controller) {
    __dartSetRemove(this._controllers, controller);
    if (!__dartIterableIsEmpty(this._controllers)) {
      return;
    }
    if (this._isClosed) {
      {
        this._cancelSubscription();
      }
    } else {
      {
        __dartNullCheck(this._subscription).pause();
      }
    }
  }
  _onData(data) {
    if (!(this._isClosed)) {
      (this._buffer.push(new ValueResult(data)), null);
    }
    {
      let _sync_for_iterator = __dartIterator(this._controllers);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let controller = _sync_for_iterator.current;
          {
            controller.add(data);
          }
        }
      }
    }
  }
  _onError(error, stackTrace) {
    if (!(this._isClosed)) {
      (this._buffer.push(Result.error(error, stackTrace)), null);
    }
    {
      let _sync_for_iterator = __dartIterator(this._controllers);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let controller = _sync_for_iterator.current;
          {
            controller.addError(error, stackTrace);
          }
        }
      }
    }
  }
  _onDone() {
    this._isDone = true;
    {
      let _sync_for_iterator = __dartIterator(this._controllers);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let controller = _sync_for_iterator.current;
          {
            this._closeGroup.add(controller.close());
          }
        }
      }
    }
  }
}

class SubscriptionStream {
  constructor(subscription) {
    this._source = subscription;
    let source = __dartNullCheck(this._source);
    source.pause();
    source.onData(null);
    source.onError(null);
    source.onDone(null);
  }
  listen(onData, { onError = null, onDone = null, cancelOnError = null } = {}) {
    let subscription = this._source;
    if ((subscription === null)) {
      {
        (() => { throw __dartCoreError("StateError", "Stream has already been listened to."); })();
      }
    }
    cancelOnError = __dartEquals(true, cancelOnError);
    this._source = null;
    let result = (cancelOnError ? new _CancelOnErrorSubscriptionWrapper(subscription) : subscription);
    result.onData(onData);
    result.onError(onError);
    result.onDone(onDone);
    subscription.resume();
    return result;
  }
}

class _CancelOnErrorSubscriptionWrapper extends DelegatingStreamSubscription {
  constructor(subscription) {
    super(subscription);
  }
  onError(handleError) {
    super.onError((error, stackTrace) => {
      super.cancel().finally(function() {
        if (typeof handleError === "function") {
          {
            (handleError)(error, stackTrace);
          }
        } else {
          if (typeof handleError === "function") {
            {
              (handleError)(error);
            }
          }
        }
});
});
  }
}

class _DelegatingIterableBase {
  get _base() {
    throw new TypeError("Abstract member _DelegatingIterableBase._base");
  }
  set _base(value) {
    Object.defineProperty(this, "_base", { value, writable: true, configurable: true, enumerable: true });
  }
  any(test) {
    return Array.from(this._base).some(test);
  }
  cast() {
    return Array.from(this._base, (value) => __dartAs(value, (value) => true, "TypeParameterType(_DelegatingIterableBase.cast.T%)"));
  }
  contains(element) {
    return __dartIterableContains(this._base, element);
  }
  elementAt(index) {
    return Array.from(this._base)[index];
  }
  every(test) {
    return Array.from(this._base).every(test);
  }
  expand(f) {
    return Array.from(this._base).flatMap((value) => Array.from((f)(value)));
  }
  get first() {
    return __dartIterableFirst(this._base);
  }
  firstWhere(test, { orElse = null } = {}) {
    return __dartIterableFirstWhere(this._base, test, orElse);
  }
  fold(initialValue, combine) {
    return Array.from(this._base).reduce((previous, value) => (combine)(previous, value), initialValue);
  }
  followedBy(other) {
    return [...Array.from(this._base), ...Array.from(other)];
  }
  forEach(f) {
    return (Array.from(this._base).forEach(f), null);
  }
  get isEmpty() {
    return __dartIterableIsEmpty(this._base);
  }
  get isNotEmpty() {
    return !__dartIterableIsEmpty(this._base);
  }
  get iterator() {
    return __dartIterator(this._base);
  }
  join(separator = "") {
    return __dartIterableJoin(this._base, separator);
  }
  get last() {
    return __dartIterableLast(this._base);
  }
  lastWhere(test, { orElse = null } = {}) {
    return __dartIterableLastWhere(this._base, test, orElse);
  }
  get length() {
    return __dartIterableLength(this._base);
  }
  map(f) {
    return Array.from(this._base, f);
  }
  reduce(combine) {
    return Array.from(this._base).reduce((previous, value) => (combine)(previous, value));
  }
  retype() {
    return this.cast();
  }
  get single() {
    return __dartIterableSingle(this._base);
  }
  singleWhere(test, { orElse = null } = {}) {
    return __dartIterableSingleWhere(this._base, test, orElse);
  }
  skip(n) {
    return Array.from(this._base).slice(n);
  }
  skipWhile(test) {
    return __dartIterableSkipWhile(this._base, test);
  }
  take(n) {
    return Array.from(this._base).slice(0, n);
  }
  takeWhile(test) {
    return __dartIterableTakeWhile(this._base, test);
  }
  toList({ growable = true } = {}) {
    return (growable ? Array.from(this._base) : __dartFixedList(Array.from(this._base)));
  }
  toSet() {
    return __dartSetFrom(this._base);
  }
  where(test) {
    return Array.from(this._base).filter(test);
  }
  whereType() {
    return Array.from(this._base).filter((value) => true);
  }
  toString() {
    return __dartStr(this._base);
  }
}

class DelegatingIterable extends _DelegatingIterableBase {
  constructor(base) {
    super();
    this._base = base;
  }
  static typed(base) {
    return Array.from(base, (value) => __dartAs(value, (value) => true, "TypeParameterType(DelegatingIterable.typed.E%)"));
  }
}

class DelegatingList extends _DelegatingIterableBase {
  constructor(base) {
    super();
    this._base = base;
  }
  static typed(base) {
    return Array.from(base, (value) => __dartAs(value, (value) => true, "TypeParameterType(DelegatingList.typed.E%)"));
  }
  "[]"(index) {
    return this._base[index];
  }
  "[]="(index, value) {
    this._base[index] = value;
  }
  "+"(other) {
    return (this._base + other);
  }
  add(value) {
    (this._base.push(value), null);
  }
  addAll(iterable) {
    (this._base.push(...Array.from(iterable)), null);
  }
  asMap() {
    return __dartListAsMap(this._base);
  }
  cast() {
    return Array.from(this._base, (value) => __dartAs(value, (value) => true, "TypeParameterType(DelegatingList.cast.T%)"));
  }
  clear() {
    (this._base.length = 0, null);
  }
  fillRange(start, end, fillValue = null) {
    (this._base.fill(fillValue, start, end), null);
  }
  set first(value) {
    if (this.isEmpty) {
      (() => { throw __dartCoreError("IndexError", 0); })();
    }
    this["[]="](0, value);
  }
  getRange(start, end) {
    return this._base.slice(start, end);
  }
  indexOf(element, start = 0) {
    return __dartListIndexOf(this._base, element, start);
  }
  indexWhere(test, start = 0) {
    return this._base.findIndex((value, index) => index >= start && (test)(value));
  }
  insert(index, element) {
    (this._base.splice(index, 0, element), null);
  }
  insertAll(index, iterable) {
    (this._base.splice(index, 0, ...Array.from(iterable)), null);
  }
  set last(value) {
    if (this.isEmpty) {
      (() => { throw __dartCoreError("IndexError", 0); })();
    }
    this["[]="]((this.length - 1), value);
  }
  lastIndexOf(element, start = null) {
    return __dartListLastIndexOf(this._base, element, start);
  }
  lastIndexWhere(test, start = null) {
    return __dartListLastIndexWhere(this._base, test, start);
  }
  set length(newLength) {
    this._base.length = newLength;
  }
  remove(value) {
    return __dartListRemove(this._base, value);
  }
  removeAt(index) {
    return this._base.splice(index, 1)[0];
  }
  removeLast() {
    return this._base.pop();
  }
  removeRange(start, end) {
    (this._base.splice(start, end - start), null);
  }
  removeWhere(test) {
    __dartListRemoveWhere(this._base, test);
  }
  replaceRange(start, end, iterable) {
    (this._base.splice(start, end - start, ...Array.from(iterable)), null);
  }
  retainWhere(test) {
    __dartListRetainWhere(this._base, test);
  }
  retype() {
    return this.cast();
  }
  get reversed() {
    return Array.from(this._base).reverse();
  }
  setAll(index, iterable) {
    __dartListSetAll(this._base, index, iterable);
  }
  setRange(start, end, iterable, skipCount = 0) {
    __dartListSetRange(this._base, start, end, iterable, skipCount);
  }
  shuffle(random = null) {
    __dartListShuffle(this._base, random);
  }
  sort(compare = null) {
    __dartListSort(this._base, compare);
  }
  sublist(start, end = null) {
    return this._base.slice(start, end);
  }
}

class DelegatingSet extends _DelegatingIterableBase {
  constructor(base) {
    super();
    this._base = base;
  }
  static typed(base) {
    return new Set(Array.from(base, (value) => __dartAs(value, (value) => true, "TypeParameterType(DelegatingSet.typed.E%)")));
  }
  add(value) {
    return __dartSetAdd(this._base, value);
  }
  addAll(elements) {
    __dartSetAddAll(this._base, elements);
  }
  cast() {
    return new Set(Array.from(this._base, (value) => __dartAs(value, (value) => true, "TypeParameterType(DelegatingSet.cast.T%)")));
  }
  clear() {
    this._base.clear();
  }
  containsAll(other) {
    return __dartSetContainsAll(this._base, other);
  }
  difference(other) {
    return __dartSetDifference(this._base, other);
  }
  intersection(other) {
    return __dartSetIntersection(this._base, other);
  }
  lookup(element) {
    return __dartSetLookup(this._base, element);
  }
  remove(value) {
    return __dartSetRemove(this._base, value);
  }
  removeAll(elements) {
    __dartSetRemoveAll(this._base, elements);
  }
  removeWhere(test) {
    __dartSetRemoveWhere(this._base, test);
  }
  retainAll(elements) {
    __dartSetRetainAll(this._base, elements);
  }
  retype() {
    return this.cast();
  }
  retainWhere(test) {
    __dartSetRetainWhere(this._base, test);
  }
  union(other) {
    return __dartSetUnion(this._base, other);
  }
  toSet() {
    return new DelegatingSet(__dartSetFrom(this._base));
  }
}

class DelegatingQueue extends _DelegatingIterableBase {
  constructor(queue) {
    super();
    this._base = queue;
  }
  static typed(base) {
    return Array.from(base, (value) => __dartAs(value, (value) => true, "TypeParameterType(DelegatingQueue.typed.E%)"));
  }
  add(value) {
    (this._base.push(value), null);
  }
  addAll(iterable) {
    (this._base.push(...Array.from(iterable)), null);
  }
  addFirst(value) {
    (this._base.unshift(value), null);
  }
  addLast(value) {
    (this._base.push(value), null);
  }
  cast() {
    return Array.from(this._base, (value) => __dartAs(value, (value) => true, "TypeParameterType(DelegatingQueue.cast.T%)"));
  }
  clear() {
    (this._base.length = 0, null);
  }
  remove(object) {
    return __dartListRemove(this._base, object);
  }
  removeWhere(test) {
    __dartListRemoveWhere(this._base, test);
  }
  retainWhere(test) {
    __dartListRetainWhere(this._base, test);
  }
  retype() {
    return this.cast();
  }
  removeFirst() {
    return this._base.shift();
  }
  removeLast() {
    return this._base.pop();
  }
}

class DelegatingMap {
  constructor(base) {
    this._base = base;
  }
  static typed(base) {
    return new Map(Array.from(base, ([key, value]) => [__dartAs(key, (key) => true, "TypeParameterType(DelegatingMap.typed.K%)"), __dartAs(value, (value) => true, "TypeParameterType(DelegatingMap.typed.V%)")]));
  }
  "[]"(key) {
    return __dartMapGet(this._base, key);
  }
  "[]="(key, value) {
    __dartMapSet(this._base, key, value);
  }
  addAll(other) {
    __dartMapAddAll(this._base, other);
  }
  addEntries(entries) {
    __dartMapAddEntries(this._base, entries);
  }
  clear() {
    (this._base.clear(), null);
  }
  cast() {
    return new Map(Array.from(this._base, ([key, value]) => [__dartAs(key, (key) => true, "TypeParameterType(DelegatingMap.cast.K2%)"), __dartAs(value, (value) => true, "TypeParameterType(DelegatingMap.cast.V2%)")]));
  }
  containsKey(key) {
    return __dartMapContainsKey(this._base, key);
  }
  containsValue(value) {
    return __dartMapContainsValue(this._base, value);
  }
  get entries() {
    return Array.from(this._base, ([key, value]) => ({ key, value }));
  }
  forEach(f) {
    (this._base.forEach((value, key) => (f)(key, value)), null);
  }
  get isEmpty() {
    return this._base.size === 0;
  }
  get isNotEmpty() {
    return this._base.size !== 0;
  }
  get keys() {
    return Array.from(this._base.keys());
  }
  get length() {
    return this._base.size;
  }
  map(transform) {
    return __dartMapMap(this._base, transform);
  }
  putIfAbsent(key, ifAbsent) {
    return __dartMapPutIfAbsent(this._base, key, ifAbsent);
  }
  remove(key) {
    return __dartMapRemove(this._base, key);
  }
  removeWhere(test) {
    return __dartMapRemoveWhere(this._base, test);
  }
  retype() {
    return this.cast();
  }
  get values() {
    return Array.from(this._base.values());
  }
  toString() {
    return __dartObjectToString(this._base);
  }
  update(key, update, { ifAbsent = null } = {}) {
    return __dartMapUpdate(this._base, key, update, ifAbsent);
  }
  updateAll(update) {
    return __dartMapUpdateAll(this._base, update);
  }
}

class UnmodifiableSetMixin {
  static _throw() {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot modify an unmodifiable Set"); })();
  }
  add(value) {
    return UnmodifiableSetMixin._throw();
  }
  addAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  remove(value) {
    return UnmodifiableSetMixin._throw();
  }
  removeAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  retainAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  removeWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  retainWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  clear() {
    return UnmodifiableSetMixin._throw();
  }
}

class _MapKeySet__DelegatingIterableBase_UnmodifiableSetMixin extends _DelegatingIterableBase {
  constructor() {
    super();
  }
  cast() {
    throw new TypeError("Abstract member _MapKeySet&_DelegatingIterableBase&UnmodifiableSetMixin.cast");
  }
  add(value) {
    return UnmodifiableSetMixin._throw();
  }
  addAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  remove(value) {
    return UnmodifiableSetMixin._throw();
  }
  removeAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  retainAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  removeWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  retainWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  clear() {
    return UnmodifiableSetMixin._throw();
  }
}

class MapKeySet extends _MapKeySet__DelegatingIterableBase_UnmodifiableSetMixin {
  constructor(_baseMap) {
    super();
    this._baseMap = _baseMap;
  }
  get _base() {
    return Array.from(this._baseMap.keys());
  }
  cast() {
    if (this instanceof MapKeySet) {
      {
        return __dartAs(this, value => value instanceof MapKeySet, "MapKeySet<MapKeySet.cast.T%>");
      }
    }
    return __dartSetFrom(Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(MapKeySet.cast.T%)")));
  }
  contains(element) {
    return __dartMapContainsKey(this._baseMap, element);
  }
  get isEmpty() {
    return this._baseMap.size === 0;
  }
  get isNotEmpty() {
    return this._baseMap.size !== 0;
  }
  get length() {
    return this._baseMap.size;
  }
  toString() {
    return ("{" + Array.from(this, (value) => __dartStr(value)).join(", ") + "}");
  }
  containsAll(other) {
    return Array.from(other).every(__dartBind(this, "contains"));
  }
  difference(other) {
    return __dartSetFrom(this.where(function(element) { return !(__dartIterableContains(other, element)); }));
  }
  intersection(other) {
    return __dartSetFrom(this.where(__dartBind(other, "contains")));
  }
  lookup(element) {
    return (() => { throw __dartCoreError("UnsupportedError", "MapKeySet doesn't support lookup()."); })();
  }
  retype() {
    return __dartSetFrom(Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(MapKeySet.retype.T%)")));
  }
  union(other) {
    return (() => { let v = this.toSet(); return (() => {
      __dartSetAddAll(v, other);
      return v;
    })(); })();
  }
}

class MapValueSet extends _DelegatingIterableBase {
  constructor(_baseMap, _keyForValue) {
    super();
    this._baseMap = _baseMap;
    this._keyForValue = _keyForValue;
  }
  get _base() {
    return Array.from(this._baseMap.values());
  }
  cast() {
    if (this instanceof Set) {
      {
        return __dartAs(this, value => value instanceof Set, "Set<MapValueSet.cast.T%>");
      }
    }
    return __dartSetFrom(Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(MapValueSet.cast.T%)")));
  }
  contains(element) {
    if (!(true)) {
      return false;
    }
    let key = (() => { let v = element; return (this._keyForValue)(v); })();
    return __dartMapContainsKey(this._baseMap, key);
  }
  get isEmpty() {
    return this._baseMap.size === 0;
  }
  get isNotEmpty() {
    return this._baseMap.size !== 0;
  }
  get length() {
    return this._baseMap.size;
  }
  toString() {
    return __dartObjectToString(this.toSet());
  }
  add(value) {
    let key = (() => { let v = value; return (this._keyForValue)(v); })();
    let result = false;
    __dartMapPutIfAbsent(this._baseMap, key, function() {
      result = true;
      return value;
});
    return result;
  }
  addAll(elements) {
    return (Array.from(elements).forEach(__dartBind(this, "add")), null);
  }
  clear() {
    return (this._baseMap.clear(), null);
  }
  containsAll(other) {
    return Array.from(other).every(__dartBind(this, "contains"));
  }
  difference(other) {
    return __dartSetFrom(this.where(function(element) { return !(__dartIterableContains(other, element)); }));
  }
  intersection(other) {
    return __dartSetFrom(this.where(__dartBind(other, "contains")));
  }
  lookup(element) {
    if (!(true)) {
      return null;
    }
    let key = (() => { let v = element; return (this._keyForValue)(v); })();
    return __dartMapGet(this._baseMap, key);
  }
  remove(element) {
    if (!(true)) {
      return false;
    }
    let key = (() => { let v = element; return (this._keyForValue)(v); })();
    if (!(__dartMapContainsKey(this._baseMap, key))) {
      return false;
    }
    __dartMapRemove(this._baseMap, key);
    return true;
  }
  removeAll(elements) {
    return (Array.from(elements).forEach(__dartBind(this, "remove")), null);
  }
  removeWhere(test) {
    let toRemove = new Array(0).fill(null);
    (this._baseMap.forEach((value, key) => (function(key, value) {
      if ((test)(value)) {
        (toRemove.push(key), null);
      }
})(key, value)), null);
    (Array.from(toRemove).forEach(__dartBind(this._baseMap, "remove")), null);
  }
  retainAll(elements) {
    let valuesToRetain = __dartIdentitySet();
    {
      let _sync_for_iterator = __dartIterator(elements);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          L:
          {
            if (!(true)) {
              break L;
            }
            let key = (() => { let v = element; return (this._keyForValue)(v); })();
            if (!(__dartMapContainsKey(this._baseMap, key))) {
              break L;
            }
            __dartSetAdd(valuesToRetain, (__dartMapGet(this._baseMap, key) ?? (null ?? __dartAs(v_1, value => true, "V"))));
          }
        }
      }
    }
    let keysToRemove = new Array(0).fill(null);
    (this._baseMap.forEach((value, key) => (function(k, v) {
      if (!(__dartIterableContains(valuesToRetain, v))) {
        (keysToRemove.push(k), null);
      }
})(key, value)), null);
    (Array.from(keysToRemove).forEach(__dartBind(this._baseMap, "remove")), null);
  }
  retainWhere(test) {
    return this.removeWhere(function(element) { return !((test)(element)); });
  }
  retype() {
    return __dartSetFrom(Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(MapValueSet.retype.T%)")));
  }
  union(other) {
    return (() => { let v = this.toSet(); return (() => {
      __dartSetAddAll(v, other);
      return v;
    })(); })();
  }
}

class _EmptyUnmodifiableSet_IterableBase_UnmodifiableSetMixin {
  constructor() {
  }
  cast() {
    throw new TypeError("Abstract member _EmptyUnmodifiableSet&IterableBase&UnmodifiableSetMixin.cast");
  }
  add(value) {
    return UnmodifiableSetMixin._throw();
  }
  addAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  remove(value) {
    return UnmodifiableSetMixin._throw();
  }
  removeAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  retainAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  removeWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  retainWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  clear() {
    return UnmodifiableSetMixin._throw();
  }
}

class _UnmodifiableSetView_DelegatingSet_UnmodifiableSetMixin extends DelegatingSet {
  constructor(base) {
    super(base);
  }
  add(value) {
    return UnmodifiableSetMixin._throw();
  }
  addAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  remove(value) {
    return UnmodifiableSetMixin._throw();
  }
  removeAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  retainAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  removeWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  retainWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  clear() {
    return UnmodifiableSetMixin._throw();
  }
}

class UnmodifiableSetView extends _UnmodifiableSetView_DelegatingSet_UnmodifiableSetMixin {
  constructor(setBase) {
    super(setBase);
  }
  static empty() {
    return new EmptyUnmodifiableSet();
  }
}

class EmptyUnmodifiableSet extends _EmptyUnmodifiableSet_IterableBase_UnmodifiableSetMixin {
  constructor() {
    super();
  }
  get iterator() {
    return __dartIterator([]);
  }
  get length() {
    return 0;
  }
  cast() {
    return new EmptyUnmodifiableSet();
  }
  contains(element) {
    return false;
  }
  containsAll(other) {
    return __dartIterableIsEmpty(other);
  }
  followedBy(other) {
    return new DelegatingIterable(other);
  }
  lookup(element) {
    return null;
  }
  retype() {
    return new EmptyUnmodifiableSet();
  }
  singleWhere(test, { orElse = null } = {}) {
    return (!((orElse === null)) ? (orElse)() : (() => { throw __dartCoreError("StateError", "No element"); })());
  }
  whereType() {
    return [];
  }
  toSet() {
    return (() => {
      const v = new Set();
      return v;
    })();
  }
  union(other) {
    return __dartSetFrom(other);
  }
  intersection(other) {
    return (() => {
      const v = new Set();
      return v;
    })();
  }
  difference(other) {
    return (() => {
      const v = new Set();
      return v;
    })();
  }
  get _base() {
    return (() => { throw __dartCoreError("NoSuchMethodError", this); })();
  }
}

class NonGrowableListMixin {
  static _throw() {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot change the length of a fixed-length list"); })();
  }
  set length(newLength) {
    return NonGrowableListMixin._throw();
  }
  add(value) {
    return NonGrowableListMixin._throw();
  }
  addAll(iterable) {
    return NonGrowableListMixin._throw();
  }
  insert(index, element) {
    return NonGrowableListMixin._throw();
  }
  insertAll(index, iterable) {
    return NonGrowableListMixin._throw();
  }
  remove(value) {
    return NonGrowableListMixin._throw();
  }
  removeAt(index) {
    return NonGrowableListMixin._throw();
  }
  removeLast() {
    return NonGrowableListMixin._throw();
  }
  removeWhere(test) {
    return NonGrowableListMixin._throw();
  }
  retainWhere(test) {
    return NonGrowableListMixin._throw();
  }
  removeRange(start, end) {
    return NonGrowableListMixin._throw();
  }
  replaceRange(start, end, iterable) {
    return NonGrowableListMixin._throw();
  }
  clear() {
    return NonGrowableListMixin._throw();
  }
}

class _NonGrowableListView_DelegatingList_NonGrowableListMixin extends DelegatingList {
  constructor(base) {
    super(base);
  }
  set length(newLength) {
    return NonGrowableListMixin._throw();
  }
  add(value) {
    return NonGrowableListMixin._throw();
  }
  addAll(iterable) {
    return NonGrowableListMixin._throw();
  }
  insert(index, element) {
    return NonGrowableListMixin._throw();
  }
  insertAll(index, iterable) {
    return NonGrowableListMixin._throw();
  }
  remove(value) {
    return NonGrowableListMixin._throw();
  }
  removeAt(index) {
    return NonGrowableListMixin._throw();
  }
  removeLast() {
    return NonGrowableListMixin._throw();
  }
  removeWhere(test) {
    return NonGrowableListMixin._throw();
  }
  retainWhere(test) {
    return NonGrowableListMixin._throw();
  }
  removeRange(start, end) {
    return NonGrowableListMixin._throw();
  }
  replaceRange(start, end, iterable) {
    return NonGrowableListMixin._throw();
  }
  clear() {
    return NonGrowableListMixin._throw();
  }
}

class NonGrowableListView extends _NonGrowableListView_DelegatingList_NonGrowableListMixin {
  constructor(listBase) {
    super(listBase);
  }
}

class UnmodifiableMapMixin {
  static _throw() {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot modify an unmodifiable Map"); })();
  }
  "[]="(key, value) {
    return UnmodifiableMapMixin._throw();
  }
  putIfAbsent(key, ifAbsent) {
    return UnmodifiableMapMixin._throw();
  }
  addAll(other) {
    return UnmodifiableMapMixin._throw();
  }
  remove(key) {
    return UnmodifiableMapMixin._throw();
  }
  clear() {
    return UnmodifiableMapMixin._throw();
  }
  set first(_) {
    return UnmodifiableMapMixin._throw();
  }
  set last(_) {
    return UnmodifiableMapMixin._throw();
  }
}

class _BoolList_Object_ListMixin {
  constructor() {
  }
  fillRange(start, end, fill = null) {
    let value = (fill ?? (v ?? __dartAs(v_1, value => typeof value === "boolean", "bool")));
    __dartCheckValidRange(start, end, this.length, null, null, null);
    for (let i = start; (i < end); i = (i + 1)) {
      {
        this[i] = value;
      }
    }
  }
  get iterator() {
    return __dartIterator(this);
  }
  get first() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return this[0];
  }
  set first(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    this[0] = value;
  }
  get last() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return this[(this.length - 1)];
  }
  set last(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    this[(this.length - 1)] = value;
  }
  elementAt(index) {
    return this[index];
  }
  followedBy(other) {
    return Array.from(this).concat(Array.from(other));
  }
  forEach(action) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        (action)(this[i]);
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
  }
  get isEmpty() {
    return __dartEquals(this.length, 0);
  }
  get isNotEmpty() {
    return !(this.isEmpty);
  }
  get single() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    if ((this.length > 1)) {
      (() => { throw __dartCoreError("StateError", "Too many elements"); })();
    }
    return this[0];
  }
  contains(element) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (__dartEquals(this[i], element)) {
          return true;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return false;
  }
  every(test) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (!((test)(this[i]))) {
          return false;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return true;
  }
  any(test) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if ((test)(this[i])) {
          return true;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return false;
  }
  firstWhere(test, { orElse = null } = {}) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = this[i];
        if ((test)(element)) {
          return element;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  lastWhere(test, { orElse = null } = {}) {
    let length = this.length;
    for (let i = (length - 1); (i >= 0); i = (i - 1)) {
      {
        let element = this[i];
        if ((test)(element)) {
          return element;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  singleWhere(test, { orElse = null } = {}) {
    let length = this.length;
    const match = __dartLazyField("match", null, true, null);
    let matchFound = false;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = this[i];
        if ((test)(element)) {
          {
            if (matchFound) {
              {
                (() => { throw __dartCoreError("StateError", "Too many elements"); })();
              }
            }
            matchFound = true;
            match.set(element);
          }
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (matchFound) {
      return match.get();
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  join(separator = "") {
    if (__dartEquals(this.length, 0)) {
      return "";
    }
    let buffer = (() => { let v = __dartStringBuffer(""); return (() => {
      v.writeAll(this, separator);
      return v;
    })(); })();
    return __dartStr(buffer);
  }
  where(test) {
    return Array.from(this).filter((value) => test(value));
  }
  whereType() {
    return Array.from(this).filter((value) => true);
  }
  map(f) {
    return Array.from(this, (value) => f(value));
  }
  expand(f) {
    return Array.from(this).flatMap((value) => Array.from(f(value)));
  }
  reduce(combine) {
    let length = this.length;
    if (__dartEquals(length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    let value = this[0];
    for (let i = 1; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, this[i]);
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return value;
  }
  fold(initialValue, combine) {
    let value = initialValue;
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, this[i]);
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return value;
  }
  skip(count) {
    return Array.from(this).slice(count, null ?? undefined);
  }
  skipWhile(test) {
    return __dartIterableSkipWhile(this, test);
  }
  take(count) {
    return Array.from(this).slice(0, __dartNullCheck(count) ?? undefined);
  }
  takeWhile(test) {
    return __dartIterableTakeWhile(this, test);
  }
  toList({ growable = true } = {}) {
    if (this.isEmpty) {
      return (growable ? [] : __dartFixedList([]));
    }
    let first = this[0];
    let result = (growable ? new Array(this.length).fill(first) : __dartFixedList(new Array(this.length).fill(first)));
    for (let i = 1; (i < this.length); i = (i + 1)) {
      {
        result[i] = this[i];
      }
    }
    return result;
  }
  toSet() {
    let result = new Set();
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        __dartSetAdd(result, this[i]);
      }
    }
    return result;
  }
  add(element) {
    this[(() => { let v = this.length; return (() => { let v_1 = this.length = (v + 1); return v; })(); })()] = element;
  }
  addAll(iterable) {
    let i = this.length;
    {
      let _sync_for_iterator = __dartIterator(iterable);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            this.add(element);
            i = (i + 1);
          }
        }
      }
    }
  }
  remove(element) {
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        if (__dartEquals(this[i], element)) {
          {
            this._closeGap(i, (i + 1));
            return true;
          }
        }
      }
    }
    return false;
  }
  _closeGap(start, end) {
    let length = this.length;
    let size = (end - start);
    for (let i = end; (i < length); i = (i + 1)) {
      {
        this[(i - size)] = this[i];
      }
    }
    this.length = (length - size);
  }
  removeWhere(test) {
    this._filter(test, false);
  }
  retainWhere(test) {
    this._filter(test, true);
  }
  _filter(test, retainMatching) {
    let retained = new Array(0).fill(null);
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = this[i];
        if (__dartEquals((test)(element), retainMatching)) {
          {
            (retained.push(element), null);
          }
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!(__dartEquals(retained.length, this.length))) {
      {
        this.setRange(0, retained.length, retained);
        this.length = retained.length;
      }
    }
  }
  clear() {
    this.length = 0;
  }
  cast() {
    return Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(_BoolList&Object&ListMixin.cast.R%)"));
  }
  removeLast() {
    if (__dartEquals(this.length, 0)) {
      {
        (() => { throw __dartCoreError("StateError", "No element"); })();
      }
    }
    let result = this[(this.length - 1)];
    this.length = (this.length - 1);
    return result;
  }
  sort(compare = null) {
    __dartListSort(this, (compare ?? ((left, right) => __dartCompare(left, right))));
  }
  shuffle(random = null) {
    ((random === null) ? random = __dartRandom(null, false) : null);
    let length = this.length;
    while ((length > 1)) {
      {
        let pos = random.nextInt(length);
        length = (length - 1);
        let tmp = this[length];
        this[length] = this[pos];
        this[pos] = tmp;
      }
    }
  }
  asMap() {
    return new Map(Array.from(this, (value, index) => [index, value]));
  }
  "+"(other) {
    return (() => {
      const v = Array.from(this);
      (v.push(...Array.from(other)), null);
      return v;
    })();
  }
  sublist(start, end = null) {
    let listLength = this.length;
    ((end === null) ? end = listLength : null);
    __dartCheckValidRange(start, end, listLength, null, null, null);
    return Array.from(this.getRange(start, end));
  }
  getRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    return Array.from(this).slice(start, end ?? undefined);
  }
  removeRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if ((end > start)) {
      {
        this._closeGap(start, end);
      }
    }
  }
  setRange(start, end, iterable, skipCount = 0) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    let length = (end - start);
    if (__dartEquals(length, 0)) {
      return;
    }
    __dartCheckNotNegative(skipCount, "skipCount", null);
    let otherList = null;
    let otherStart = null;
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        otherList = iterable;
        otherStart = skipCount;
      }
    } else {
      {
        otherList = __dartFixedList(Array.from(Array.from(iterable).slice(skipCount)));
        otherStart = 0;
      }
    }
    if (((otherStart + length) > otherList.length)) {
      {
        (() => { throw __dartCoreError("StateError", "Too few elements"); })();
      }
    }
    if ((otherStart < start)) {
      {
        for (let i = (length - 1); (i >= 0); i = (i - 1)) {
          {
            this[(start + i)] = otherList[(otherStart + i)];
          }
        }
      }
    } else {
      {
        for (let i_1 = 0; (i_1 < length); i_1 = (i_1 + 1)) {
          {
            this[(start + i_1)] = otherList[(otherStart + i_1)];
          }
        }
      }
    }
  }
  replaceRange(start, end, newContents) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if (__dartEquals(start, this.length)) {
      {
        this.addAll(newContents);
        return;
      }
    }
    if (!(newContents != null && typeof newContents !== "string" && typeof newContents.length === "number" && typeof newContents[Symbol.iterator] === "function")) {
      {
        newContents = Array.from(newContents);
      }
    }
    let removeLength = (end - start);
    let insertLength = __dartIterableLength(newContents);
    if ((removeLength >= insertLength)) {
      {
        let insertEnd = (start + insertLength);
        this.setRange(start, insertEnd, newContents);
        if ((removeLength > insertLength)) {
          {
            this._closeGap(insertEnd, end);
          }
        }
      }
    } else {
      if (__dartEquals(end, this.length)) {
        {
          let i = start;
          {
            let _sync_for_iterator = __dartIterator(newContents);
            for (; _sync_for_iterator.moveNext(); ) {
              {
                let element = _sync_for_iterator.current;
                {
                  if ((i < end)) {
                    {
                      this[i] = element;
                    }
                  } else {
                    {
                      this.add(element);
                    }
                  }
                  i = (i + 1);
                }
              }
            }
          }
        }
      } else {
        {
          let delta = (insertLength - removeLength);
          let oldLength = this.length;
          let insertEnd_1 = (start + insertLength);
          for (let i_1 = (oldLength - delta); (i_1 < oldLength); i_1 = (i_1 + 1)) {
            {
              this.add(this[((i_1 > 0) ? i_1 : 0)]);
            }
          }
          if ((insertEnd_1 < oldLength)) {
            {
              this.setRange(insertEnd_1, oldLength, this, end);
            }
          }
          this.setRange(start, insertEnd_1, newContents);
        }
      }
    }
  }
  indexOf(element, start = 0) {
    if ((start < 0)) {
      start = 0;
    }
    for (let i = start; (i < this.length); i = (i + 1)) {
      {
        if (__dartEquals(this[i], element)) {
          return i;
        }
      }
    }
    return (-1);
  }
  indexWhere(test, start = 0) {
    if ((start < 0)) {
      start = 0;
    }
    for (let i = start; (i < this.length); i = (i + 1)) {
      {
        if ((test)(this[i])) {
          return i;
        }
      }
    }
    return (-1);
  }
  lastIndexOf(element, start = null) {
    if (((start === null) || (start >= this.length))) {
      start = (this.length - 1);
    }
    for (let i = start; (i >= 0); i = (i - 1)) {
      {
        if (__dartEquals(this[i], element)) {
          return i;
        }
      }
    }
    return (-1);
  }
  lastIndexWhere(test, start = null) {
    if (((start === null) || (start >= this.length))) {
      start = (this.length - 1);
    }
    for (let i = start; (i >= 0); i = (i - 1)) {
      {
        if ((test)(this[i])) {
          return i;
        }
      }
    }
    return (-1);
  }
  insert(index, element) {
    __dartNullCheck(index);
    let length = this.length;
    __dartCheckValueInInterval(index, 0, length, "index", null);
    this.add(element);
    if (!(__dartEquals(index, length))) {
      {
        this.setRange((index + 1), (length + 1), this, index);
        this[index] = element;
      }
    }
  }
  removeAt(index) {
    let result = this[index];
    this._closeGap(index, (index + 1));
    return result;
  }
  insertAll(index, iterable) {
    __dartCheckValueInInterval(index, 0, this.length, "index", null);
    if (__dartEquals(index, this.length)) {
      {
        this.addAll(iterable);
        return;
      }
    }
    if ((!(iterable != null && typeof iterable !== "string" && typeof iterable.length === "number" && typeof iterable[Symbol.iterator] === "function") || Object.is(iterable, this))) {
      {
        iterable = Array.from(iterable);
      }
    }
    let insertionLength = __dartIterableLength(iterable);
    if (__dartEquals(insertionLength, 0)) {
      {
        return;
      }
    }
    let oldLength = this.length;
    for (let i = (oldLength - insertionLength); (i < oldLength); i = (i + 1)) {
      {
        this.add(this[((i > 0) ? i : 0)]);
      }
    }
    if (!(__dartEquals(__dartIterableLength(iterable), insertionLength))) {
      {
        this.length = (this.length - insertionLength);
        (() => { throw __dartCoreError("ConcurrentModificationError", iterable); })();
      }
    }
    let oldCopyStart = (index + insertionLength);
    if ((oldCopyStart < oldLength)) {
      {
        this.setRange(oldCopyStart, oldLength, this, index);
      }
    }
    this.setAll(index, iterable);
  }
  setAll(index, iterable) {
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        this.setRange(index, (index + __dartIterableLength(iterable)), iterable);
      }
    } else {
      {
        {
          let _sync_for_iterator = __dartIterator(iterable);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let element = _sync_for_iterator.current;
              {
                this[(() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })()] = element;
              }
            }
          }
        }
      }
    }
  }
  get reversed() {
    return Array.from(this).reverse();
  }
  toString() {
    return ("[" + Array.from(this, (value) => __dartStr(value)).join(", ") + "]");
  }
}

class BoolList extends _BoolList_Object_ListMixin {
  static _(_data, _length) {
    return $BoolList__(BoolList, _data, _length);
  }
  static _selectType(length, growable) {
    if (growable) {
      {
        return new _GrowableBoolList(length);
      }
    } else {
      {
        return new _NonGrowableBoolList(length);
      }
    }
  }
  constructor(length, { fill = false, growable = false } = {}) {
    if (new.target === BoolList) {
      __dartCheckNotNegative(length, "length", null);
      let boolList = null;
      if (growable) {
        {
          boolList = new _GrowableBoolList(length);
        }
      } else {
        {
          boolList = new _NonGrowableBoolList(length);
        }
      }
      if (fill) {
        {
          boolList.fillRange(0, length, true);
        }
      }
      return boolList;
    }
  }
  static empty({ growable = true, capacity = 0 } = {}) {
    __dartCheckNotNegative(capacity, "length", null);
    if (growable) {
      {
        return _GrowableBoolList._withCapacity(0, capacity);
      }
    } else {
      {
        return _NonGrowableBoolList._withCapacity(0, capacity);
      }
    }
  }
  static generate(length, generator, { growable = true } = {}) {
    __dartCheckNotNegative(length, "length", null);
    let instance = BoolList._selectType(length, growable);
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        instance._setBit(i, (generator)(i));
      }
    }
    return instance;
  }
  static of(elements, { growable = false } = {}) {
    return (() => { let v = BoolList._selectType(__dartIterableLength(elements), growable); return (() => {
      v.setAll(0, elements);
      return v;
    })(); })();
  }
  get length() {
    return this._length;
  }
  "[]"(index) {
    __dartCheckValidIndex(index, this, "index", this._length, null);
    return !(__dartEquals((this._data[(index >> 5)] & (1 << (index & 31))), 0));
  }
  "[]="(index, value) {
    __dartCheckValidIndex(index, this, "index", this._length, null);
    this._setBit(index, value);
  }
  fillRange(start, end, fill = null) {
    __dartCheckValidRange(start, end, this._length, null, null, null);
    ((fill === null) ? fill = false : null);
    let startWord = (start >> 5);
    let endWord = ((end - 1) >> 5);
    let startBit = (start & 31);
    let endBit = ((end - 1) & 31);
    if ((startWord < endWord)) {
      {
        if (fill) {
          {
            (() => { let v = this._data; return (() => { let v_1 = startWord; return v[v_1] = (v[v_1] | ((-1) << startBit)); })(); })();
            (this._data.fill((-1), (startWord + 1), endWord), null);
            (() => { let v_2 = this._data; return (() => { let v_3 = endWord; return v_2[v_3] = (v_2[v_3] | ((1 << (endBit + 1)) - 1)); })(); })();
          }
        } else {
          {
            (() => { let v_4 = this._data; return (() => { let v_5 = startWord; return v_4[v_5] = (v_4[v_5] & ((1 << startBit) - 1)); })(); })();
            (this._data.fill(0, (startWord + 1), endWord), null);
            (() => { let v_6 = this._data; return (() => { let v_7 = endWord; return v_6[v_7] = (v_6[v_7] & ((-1) << (endBit + 1))); })(); })();
          }
        }
      }
    } else {
      {
        if (fill) {
          {
            (() => { let v_8 = this._data; return (() => { let v_9 = startWord; return v_8[v_9] = (v_8[v_9] | (((1 << ((endBit - startBit) + 1)) - 1) << startBit)); })(); })();
          }
        } else {
          {
            (() => { let v_10 = this._data; return (() => { let v_11 = startWord; return v_10[v_11] = (v_10[v_11] & (((1 << startBit) - 1) | ((-1) << (endBit + 1)))); })(); })();
          }
        }
      }
    }
  }
  get iterator() {
    return new _BoolListIterator(this);
  }
  _setBit(index, value) {
    if (value) {
      {
        (() => { let v = this._data; return (() => { let v_1 = (index >> 5); return v[v_1] = (v[v_1] | (1 << (index & 31))); })(); })();
      }
    } else {
      {
        (() => { let v_2 = this._data; return (() => { let v_3 = (index >> 5); return v_2[v_3] = (v_2[v_3] & (~(1 << (index & 31)))); })(); })();
      }
    }
  }
  static _lengthInWords(bitLength) {
    return ((bitLength + (32 - 1)) >> 5);
  }
}

function $BoolList__($newTarget, _data, _length) {
  const $self = Reflect.construct(_BoolList_Object_ListMixin, [], $newTarget);
  $self._data = _data;
  $self._length = _length;
  return $self;
}

class _GrowableBoolList extends BoolList {
  static _withCapacity(length, capacity) {
    return $_GrowableBoolList__withCapacity(_GrowableBoolList, length, capacity);
  }
  constructor(length) {
    const $self = $BoolList__(new.target, new Uint32Array(BoolList._lengthInWords((length * 2))), length);
    return $self;
  }
  set length(length) {
    __dartCheckNotNegative(length, "length", null);
    if ((length > this._length)) {
      {
        this._expand(length);
      }
    } else {
      if ((length < this._length)) {
        {
          this._shrink(length);
        }
      }
    }
  }
  _expand(length) {
    if ((length > (this._data.length * 32))) {
      {
        this._data = (() => { let v = new Uint32Array(BoolList._lengthInWords((length * 2))); return (() => {
          __dartListSetRange(v, 0, this._data.length, this._data, 0);
          return v;
        })(); })();
      }
    }
    this._length = length;
  }
  _shrink(length) {
    if ((length < __dartTruncDiv(this._length, 2))) {
      {
        let newDataLength = BoolList._lengthInWords(length);
        this._data = (() => { let v = new Uint32Array(newDataLength); return (() => {
          __dartListSetRange(v, 0, newDataLength, this._data, 0);
          return v;
        })(); })();
      }
    }
    for (let i = length; (i < (this._data.length * 32)); i = (i + 1)) {
      {
        this._setBit(i, false);
      }
    }
    this._length = length;
  }
}

function $_GrowableBoolList__withCapacity($newTarget, length, capacity) {
  const $self = $BoolList__($newTarget, new Uint32Array(BoolList._lengthInWords(capacity)), length);
  return $self;
}

class __NonGrowableBoolList_BoolList_NonGrowableListMixin extends BoolList {
  constructor() {
    throw new TypeError("Class __NonGrowableBoolList&BoolList&NonGrowableListMixin has no unnamed constructor");
  }
  static _(_data, _length) {
    return $__NonGrowableBoolList_BoolList_NonGrowableListMixin__(__NonGrowableBoolList_BoolList_NonGrowableListMixin, _data, _length);
  }
  set length(newLength) {
    return NonGrowableListMixin._throw();
  }
  add(value) {
    return NonGrowableListMixin._throw();
  }
  addAll(iterable) {
    return NonGrowableListMixin._throw();
  }
  insert(index, element) {
    return NonGrowableListMixin._throw();
  }
  insertAll(index, iterable) {
    return NonGrowableListMixin._throw();
  }
  remove(value) {
    return NonGrowableListMixin._throw();
  }
  removeAt(index) {
    return NonGrowableListMixin._throw();
  }
  removeLast() {
    return NonGrowableListMixin._throw();
  }
  removeWhere(test) {
    return NonGrowableListMixin._throw();
  }
  retainWhere(test) {
    return NonGrowableListMixin._throw();
  }
  removeRange(start, end) {
    return NonGrowableListMixin._throw();
  }
  replaceRange(start, end, iterable) {
    return NonGrowableListMixin._throw();
  }
  clear() {
    return NonGrowableListMixin._throw();
  }
}

function $__NonGrowableBoolList_BoolList_NonGrowableListMixin__($newTarget, _data, _length) {
  const $self = $BoolList__($newTarget, _data, _length);
  return $self;
}

class _NonGrowableBoolList extends __NonGrowableBoolList_BoolList_NonGrowableListMixin {
  static _withCapacity(length, capacity) {
    return $_NonGrowableBoolList__withCapacity(_NonGrowableBoolList, length, capacity);
  }
  constructor(length) {
    const $self = $__NonGrowableBoolList_BoolList_NonGrowableListMixin__(new.target, new Uint32Array(BoolList._lengthInWords(length)), length);
    return $self;
  }
}

function $_NonGrowableBoolList__withCapacity($newTarget, length, capacity) {
  const $self = $__NonGrowableBoolList_BoolList_NonGrowableListMixin__($newTarget, new Uint32Array(BoolList._lengthInWords(capacity)), length);
  return $self;
}

class _BoolListIterator {
  constructor(_boolList) {
    this._current = false;
    this._pos = 0;
    this._boolList = _boolList;
    this._length = _boolList._length;
  }
  get current() {
    return this._current;
  }
  moveNext() {
    if (!(__dartEquals(this._boolList._length, this._length))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this._boolList); })();
      }
    }
    if ((this._pos < this._boolList.length)) {
      {
        let pos = (() => { let v = this._pos; return (() => { let v_1 = this._pos = (v + 1); return v; })(); })();
        this._current = !(__dartEquals((this._boolList._data[(pos >> 5)] & (1 << (pos & 31))), 0));
        return true;
      }
    }
    this._current = false;
    return false;
  }
}

class CanonicalizedMap {
  constructor(canonicalize, { isValidKey = null } = {}) {
    this._base = new Map([]);
    this._canonicalize = canonicalize;
    this._isValidKeyFn = isValidKey;
  }
  static from(other, canonicalize, { isValidKey = null } = {}) {
    return $CanonicalizedMap_from(CanonicalizedMap, other, canonicalize, { isValidKey: isValidKey });
  }
  static fromEntries(entries, canonicalize, { isValidKey = null } = {}) {
    return $CanonicalizedMap_fromEntries(CanonicalizedMap, entries, canonicalize, { isValidKey: isValidKey });
  }
  static _(_canonicalize, _isValidKeyFn, base) {
    return $CanonicalizedMap__(CanonicalizedMap, _canonicalize, _isValidKeyFn, base);
  }
  copy() {
    return CanonicalizedMap._(this._canonicalize, this._isValidKeyFn, this._base);
  }
  "[]"(key) {
    if (!(this._isValidKey(key))) {
      return null;
    }
    let pair = __dartMapGet(this._base, (() => { let v = __dartAs(key, value => true, "K"); return (this._canonicalize)(v); })());
    return ((pair)?.value ?? null);
  }
  "[]="(key, value) {
    if (!(this._isValidKey(key))) {
      return;
    }
    __dartMapSet(this._base, (() => { let v = key; return (this._canonicalize)(v); })(), Object.freeze({ key: key, value: value }));
  }
  addAll(other) {
    (other.forEach((value, key) => ((key, value) => { return (() => { let v = key; return (() => { let v_1 = value; return (() => { let v_2 = this["[]="](v, v_1); return v_1; })(); })(); })(); })(key, value)), null);
  }
  addEntries(entries) {
    return __dartMapAddEntries(this._base, Array.from(entries, (e) => { return Object.freeze({ key: (() => { let v = e.key; return (this._canonicalize)(v); })(), value: Object.freeze({ key: e.key, value: e.value }) }); }));
  }
  cast() {
    return new Map(Array.from(this._base, ([key, value]) => [__dartAs(key, (key) => true, "TypeParameterType(CanonicalizedMap.cast.K2%)"), __dartAs(value, (value) => true, "TypeParameterType(CanonicalizedMap.cast.V2%)")]));
  }
  clear() {
    (this._base.clear(), null);
  }
  containsKey(key) {
    if (!(this._isValidKey(key))) {
      return false;
    }
    return __dartMapContainsKey(this._base, (() => { let v = __dartAs(key, value => true, "K"); return (this._canonicalize)(v); })());
  }
  containsValue(value) {
    return Array.from(Array.from(this._base.values())).some(function(pair) { return __dartEquals(pair.value, value); });
  }
  get entries() {
    return Array.from(Array.from(this._base, ([key, value]) => ({ key, value })), function(e) { return Object.freeze({ key: e.value.key, value: e.value.value }); });
  }
  forEach(f) {
    (this._base.forEach((value, key) => (function(key, pair) { return (f)(pair.key, pair.value); })(key, value)), null);
  }
  get isEmpty() {
    return this._base.size === 0;
  }
  get isNotEmpty() {
    return this._base.size !== 0;
  }
  get keys() {
    return Array.from(Array.from(this._base.values()), function(pair) { return pair.key; });
  }
  get length() {
    return this._base.size;
  }
  map(transform) {
    return __dartMapMap(this._base, function(_, pair) { return (transform)(pair.key, pair.value); });
  }
  putIfAbsent(key, ifAbsent) {
    return __dartMapPutIfAbsent(this._base, (() => { let v = key; return (this._canonicalize)(v); })(), function() { return Object.freeze({ key: key, value: (ifAbsent)() }); }).value;
  }
  remove(key) {
    if (!(this._isValidKey(key))) {
      return null;
    }
    let pair = __dartMapRemove(this._base, (() => { let v = __dartAs(key, value => true, "K"); return (this._canonicalize)(v); })());
    return ((pair)?.value ?? null);
  }
  removeWhere(test) {
    return __dartMapRemoveWhere(this._base, function(_, pair) { return (test)(pair.key, pair.value); });
  }
  retype() {
    return this.cast();
  }
  update(key, update, { ifAbsent = null } = {}) {
    return __dartMapUpdate(this._base, (() => { let v = key; return (this._canonicalize)(v); })(), function(pair) {
      let value = pair.value;
      let newValue = (update)(value);
      if (Object.is(newValue, value)) {
        return pair;
      }
      return Object.freeze({ key: key, value: newValue });
}, ((ifAbsent === null) ? null : function() { return Object.freeze({ key: key, value: (ifAbsent)() }); })).value;
  }
  updateAll(update) {
    return __dartMapUpdateAll(this._base, function(_, pair) {
      let value = pair.value;
      let key = pair.key;
      let newValue = (update)(key, value);
      if (Object.is(value, newValue)) {
        return pair;
      }
      return Object.freeze({ key: key, value: newValue });
});
  }
  get values() {
    return Array.from(Array.from(this._base.values()), function(pair) { return pair.value; });
  }
  toString() {
    return ("{" + Array.from(this, ([key, value]) => __dartStr(key) + ": " + __dartStr(value)).join(", ") + "}");
  }
  _isValidKey(key) {
    return (true && ((this._isValidKeyFn === null) || (() => { let v = key; return ((this._isValidKeyFn ?? __dartAs(v_1, value => typeof value === "function", "bool Function(CanonicalizedMap.K%)")))(v); })()));
  }
  toMap() {
    return __dartMapFromEntries(Array.from(Array.from(this._base.values()), (entry) => [entry.key, entry.value]));
  }
  toMapOfCanonicalKeys() {
    return __dartMapFromEntries(Array.from(Array.from(Array.from(this._base, ([key, value]) => ({ key, value })), function(e) { return Object.freeze({ key: e.key, value: e.value.value }); }), (entry) => [entry.key, entry.value]));
  }
}

function $CanonicalizedMap_from($newTarget, other, canonicalize, { isValidKey = null } = {}) {
  const $self = Object.create($newTarget.prototype);
  $self._base = new Map([]);
  $self._canonicalize = canonicalize;
  $self._isValidKeyFn = isValidKey;
  $self.addAll(other);
  return $self;
}

function $CanonicalizedMap_fromEntries($newTarget, entries, canonicalize, { isValidKey = null } = {}) {
  const $self = Object.create($newTarget.prototype);
  $self._base = new Map([]);
  $self._canonicalize = canonicalize;
  $self._isValidKeyFn = isValidKey;
  $self.addEntries(entries);
  return $self;
}

function $CanonicalizedMap__($newTarget, _canonicalize, _isValidKeyFn, base) {
  const $self = Object.create($newTarget.prototype);
  $self._base = new Map([]);
  $self._canonicalize = _canonicalize;
  $self._isValidKeyFn = _isValidKeyFn;
  __dartMapAddAll($self._base, base);
  return $self;
}

class CombinedIterator {
  constructor(iterators) {
    this._iterators = iterators;
    if (!(iterators.moveNext())) {
      this._iterators = null;
    }
  }
  get current() {
    let iterators = this._iterators;
    if (!((iterators === null))) {
      return iterators.current.current;
    }
    return (null ?? __dartAs(v, value => true, "T"));
  }
  moveNext() {
    let iterators = this._iterators;
    if (!((iterators === null))) {
      {
        do {
          {
            if (iterators.current.moveNext()) {
              {
                return true;
              }
            }
          }
        } while (iterators.moveNext());
        this._iterators = null;
      }
    }
    return false;
  }
}

class CombinedIterableView {
  constructor(_iterables) {
    this._iterables = _iterables;
  }
  get iterator() {
    return new CombinedIterator(__dartIterator(Array.from(this._iterables, function(i) { return __dartIterator(i); })));
  }
  contains(element) {
    return Array.from(this._iterables).some(function(i) { return __dartIterableContains(i, element); });
  }
  get isEmpty() {
    return Array.from(this._iterables).every(function(i) { return __dartIterableIsEmpty(i); });
  }
  get length() {
    return Array.from(this._iterables).reduce((previous, value) => (function(length, i) { return (length + __dartIterableLength(i)); })(previous, value), 0);
  }
}

class CombinedListView {
  constructor(_lists) {
    this._lists = _lists;
  }
  static _throw() {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot modify an unmodifiable List"); })();
  }
  get iterator() {
    return new CombinedIterator(__dartIterator(Array.from(this._lists, function(i) { return __dartIterator(i); })));
  }
  set length(length) {
    CombinedListView._throw();
  }
  get length() {
    return Array.from(this._lists).reduce((previous, value) => (function(length, list) { return (length + list.length); })(previous, value), 0);
  }
  "[]"(index) {
    let initialIndex = index;
    for (let i = 0; (i < this._lists.length); i = (i + 1)) {
      {
        let list = this._lists[i];
        if ((index < list.length)) {
          {
            return list[index];
          }
        }
        index = (index - list.length);
      }
    }
    (() => { throw __dartCoreError("IndexError", initialIndex); })();
  }
  "[]="(index, value) {
    CombinedListView._throw();
  }
  clear() {
    CombinedListView._throw();
  }
  remove(element) {
    CombinedListView._throw();
  }
  removeWhere(test) {
    CombinedListView._throw();
  }
  retainWhere(test) {
    CombinedListView._throw();
  }
  get _source() {
    return (() => { throw __dartCoreError("NoSuchMethodError", this); })();
  }
}

class CombinedMapView {
  constructor(_maps) {
    this._maps = _maps;
  }
  "[]"(key) {
    {
      let _sync_for_iterator = __dartIterator(this._maps);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let map = _sync_for_iterator.current;
          {
            let value = __dartMapGet(map, key);
            if ((!((value === null)) || __dartMapContainsKey(map, value))) {
              {
                return value;
              }
            }
          }
        }
      }
    }
    return null;
  }
  get keys() {
    return new _DeduplicatingIterableView(new CombinedIterableView(Array.from(this._maps, function(m) { return Array.from(m.keys()); })));
  }
}

class _DeduplicatingIterableView {
  constructor(_iterable) {
    this._iterable = _iterable;
  }
  get iterator() {
    return new _DeduplicatingIterator(__dartIterator(this._iterable));
  }
  contains(element) {
    return __dartIterableContains(this._iterable, element);
  }
  get isEmpty() {
    return __dartIterableIsEmpty(this._iterable);
  }
}

class _DeduplicatingIterator {
  constructor(_iterator) {
    this._emitted = new Set();
    this._iterator = _iterator;
  }
  get current() {
    return this._iterator.current;
  }
  moveNext() {
    while (this._iterator.moveNext()) {
      {
        if (__dartSetAdd(this._emitted, this.current)) {
          {
            return true;
          }
        }
      }
    }
    return false;
  }
}

class Equality {
  constructor() {
    if (new.target === Equality) {
      return new DefaultEquality();
    }
  }
  equals(e1, e2) {
    throw new TypeError("Abstract member Equality.equals");
  }
  hash(e) {
    throw new TypeError("Abstract member Equality.hash");
  }
  isValidKey(o) {
    throw new TypeError("Abstract member Equality.isValidKey");
  }
}

class EqualityBy extends Equality {
  constructor(comparisonKey, inner = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    super();
    this._comparisonKey = comparisonKey;
    this._inner = inner;
  }
  equals(e1, e2) {
    return this._inner.equals((() => { let v = e1; return (this._comparisonKey)(v); })(), (() => { let v_1 = e2; return (this._comparisonKey)(v_1); })());
  }
  hash(e) {
    return this._inner.hash((() => { let v = e; return (this._comparisonKey)(v); })());
  }
  isValidKey(o) {
    if (true) {
      {
        const value = (() => { let v = o; return (this._comparisonKey)(v); })();
        return this._inner.isValidKey(value);
      }
    }
    return false;
  }
}

class DefaultEquality extends Equality {
  constructor() {
    super();
  }
  equals(e1, e2) {
    return __dartEquals(e1, e2);
  }
  hash(e) {
    return __dartHashValue(e);
  }
  isValidKey(o) {
    return true;
  }
}

class IdentityEquality extends Equality {
  constructor() {
    super();
  }
  equals(e1, e2) {
    return Object.is(e1, e2);
  }
  hash(e) {
    return __dartHashValue(e);
  }
  isValidKey(o) {
    return true;
  }
}

class IterableEquality extends Equality {
  constructor(elementEquality = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    super();
    this._elementEquality = elementEquality;
  }
  equals(elements1, elements2) {
    if (Object.is(elements1, elements2)) {
      return true;
    }
    if (((elements1 === null) || (elements2 === null))) {
      return false;
    }
    let it1 = __dartIterator(elements1);
    let it2 = __dartIterator(elements2);
    while (true) {
      {
        let hasNext = it1.moveNext();
        if (!(__dartEquals(hasNext, it2.moveNext()))) {
          return false;
        }
        if (!(hasNext)) {
          return true;
        }
        if (!(this._elementEquality.equals(it1.current, it2.current))) {
          return false;
        }
      }
    }
  }
  hash(elements) {
    if ((elements === null)) {
      return __dartHashValue(null);
    }
    let hash = 0;
    {
      let _sync_for_iterator = __dartIterator(elements);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            let c = this._elementEquality.hash(element);
            hash = ((hash + c) & 2147483647);
            hash = ((hash + (hash << 10)) & 2147483647);
            hash = (hash ^ (hash >> 6));
          }
        }
      }
    }
    hash = ((hash + (hash << 3)) & 2147483647);
    hash = (hash ^ (hash >> 11));
    hash = ((hash + (hash << 15)) & 2147483647);
    return hash;
  }
  isValidKey(o) {
    return o != null && typeof o !== "string" && !(o instanceof Map) && typeof o[Symbol.iterator] === "function";
  }
}

class ListEquality extends Equality {
  constructor(elementEquality = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    super();
    this._elementEquality = elementEquality;
  }
  equals(list1, list2) {
    if (Object.is(list1, list2)) {
      return true;
    }
    if (((list1 === null) || (list2 === null))) {
      return false;
    }
    let length = list1.length;
    if (!(__dartEquals(length, list2.length))) {
      return false;
    }
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (!(this._elementEquality.equals(list1[i], list2[i]))) {
          return false;
        }
      }
    }
    return true;
  }
  hash(list) {
    if ((list === null)) {
      return __dartHashValue(null);
    }
    let hash = 0;
    for (let i = 0; (i < list.length); i = (i + 1)) {
      {
        let c = this._elementEquality.hash(list[i]);
        hash = ((hash + c) & 2147483647);
        hash = ((hash + (hash << 10)) & 2147483647);
        hash = (hash ^ (hash >> 6));
      }
    }
    hash = ((hash + (hash << 3)) & 2147483647);
    hash = (hash ^ (hash >> 11));
    hash = ((hash + (hash << 15)) & 2147483647);
    return hash;
  }
  isValidKey(o) {
    return (Array.isArray(o) || (ArrayBuffer.isView(o) && !(o instanceof DataView)));
  }
}

class _UnorderedEquality extends Equality {
  constructor(_elementEquality) {
    super();
    this._elementEquality = _elementEquality;
  }
  equals(elements1, elements2) {
    if (Object.is(elements1, elements2)) {
      return true;
    }
    if (((elements1 === null) || (elements2 === null))) {
      return false;
    }
    let counts = new Map();
    let length = 0;
    {
      let _sync_for_iterator = __dartIterator(elements1);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let e = _sync_for_iterator.current;
          {
            let count = (__dartMapGet(counts, e) ?? 0);
            __dartMapSet(counts, e, (count + 1));
            length = (length + 1);
          }
        }
      }
    }
    {
      let _sync_for_iterator_1 = __dartIterator(elements2);
      for (; _sync_for_iterator_1.moveNext(); ) {
        {
          let e_1 = _sync_for_iterator_1.current;
          {
            let count_1 = __dartMapGet(counts, e_1);
            if (((count_1 === null) || __dartEquals(count_1, 0))) {
              return false;
            }
            __dartMapSet(counts, e_1, (count_1 - 1));
            length = (length - 1);
          }
        }
      }
    }
    return __dartEquals(length, 0);
  }
  hash(elements) {
    if ((elements === null)) {
      return __dartHashValue(null);
    }
    let hash = 0;
    {
      let _sync_for_iterator = __dartIterator(elements);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            let c = this._elementEquality.hash(element);
            hash = ((hash + c) & 2147483647);
          }
        }
      }
    }
    hash = ((hash + (hash << 3)) & 2147483647);
    hash = (hash ^ (hash >> 11));
    hash = ((hash + (hash << 15)) & 2147483647);
    return hash;
  }
}

class UnorderedIterableEquality extends _UnorderedEquality {
  constructor(elementEquality = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    super(elementEquality);
  }
  isValidKey(o) {
    return o != null && typeof o !== "string" && !(o instanceof Map) && typeof o[Symbol.iterator] === "function";
  }
}

class SetEquality extends _UnorderedEquality {
  constructor(elementEquality = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    super(elementEquality);
  }
  isValidKey(o) {
    return o instanceof Set;
  }
}

class _MapEntry {
  constructor(equality, key, value) {
    this.equality = equality;
    this.key = key;
    this.value = value;
  }
  get hashCode() {
    return (((3 * this.equality._keyEquality.hash(this.key)) + (7 * this.equality._valueEquality.hash(this.value))) & 2147483647);
  }
  "=="(other) {
    return ((other instanceof _MapEntry && this.equality._keyEquality.equals(this.key, other.key)) && this.equality._valueEquality.equals(this.value, other.value));
  }
}

class MapEquality extends Equality {
  constructor({ keys = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))), values = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) } = {}) {
    super();
    this._keyEquality = keys;
    this._valueEquality = values;
  }
  equals(map1, map2) {
    if (Object.is(map1, map2)) {
      return true;
    }
    if (((map1 === null) || (map2 === null))) {
      return false;
    }
    let length = map1.size;
    if (!(__dartEquals(length, map2.size))) {
      return false;
    }
    let equalElementCounts = new Map();
    {
      let _sync_for_iterator = __dartIterator(Array.from(map1.keys()));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let key = _sync_for_iterator.current;
          {
            let entry = new _MapEntry(this, key, __dartMapGet(map1, key));
            let count = (__dartMapGet(equalElementCounts, entry) ?? 0);
            __dartMapSet(equalElementCounts, entry, (count + 1));
          }
        }
      }
    }
    {
      let _sync_for_iterator_1 = __dartIterator(Array.from(map2.keys()));
      for (; _sync_for_iterator_1.moveNext(); ) {
        {
          let key_1 = _sync_for_iterator_1.current;
          {
            let entry_1 = new _MapEntry(this, key_1, __dartMapGet(map2, key_1));
            let count_1 = __dartMapGet(equalElementCounts, entry_1);
            if (((count_1 === null) || __dartEquals(count_1, 0))) {
              return false;
            }
            __dartMapSet(equalElementCounts, entry_1, (count_1 - 1));
          }
        }
      }
    }
    return true;
  }
  hash(map) {
    if ((map === null)) {
      return __dartHashValue(null);
    }
    let hash = 0;
    {
      let _sync_for_iterator = __dartIterator(Array.from(map.keys()));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let key = _sync_for_iterator.current;
          {
            let keyHash = this._keyEquality.hash(key);
            let valueHash = this._valueEquality.hash((__dartMapGet(map, key) ?? __dartAs(v, value => true, "V")));
            hash = (((hash + (3 * keyHash)) + (7 * valueHash)) & 2147483647);
          }
        }
      }
    }
    hash = ((hash + (hash << 3)) & 2147483647);
    hash = (hash ^ (hash >> 11));
    hash = ((hash + (hash << 15)) & 2147483647);
    return hash;
  }
  isValidKey(o) {
    return o instanceof Map;
  }
}

class MultiEquality extends Equality {
  constructor(equalities) {
    super();
    this._equalities = equalities;
  }
  equals(e1, e2) {
    {
      let _sync_for_iterator = __dartIterator(this._equalities);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let eq = _sync_for_iterator.current;
          {
            if (eq.isValidKey(e1)) {
              return (eq.isValidKey(e2) && eq.equals(e1, e2));
            }
          }
        }
      }
    }
    return false;
  }
  hash(e) {
    {
      let _sync_for_iterator = __dartIterator(this._equalities);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let eq = _sync_for_iterator.current;
          {
            if (eq.isValidKey(e)) {
              return eq.hash(e);
            }
          }
        }
      }
    }
    return 0;
  }
  isValidKey(o) {
    {
      let _sync_for_iterator = __dartIterator(this._equalities);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let eq = _sync_for_iterator.current;
          {
            if (eq.isValidKey(o)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }
}

class DeepCollectionEquality extends Equality {
  constructor(base = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    super();
    this._base = base;
    this._unordered = false;
  }
  static unordered(base = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    return $DeepCollectionEquality_unordered(DeepCollectionEquality, base);
  }
  equals(e1, e2) {
    if (e1 instanceof Set) {
      {
        return (e2 instanceof Set && new SetEquality(this).equals(e1, e2));
      }
    }
    if (e1 instanceof Map) {
      {
        return (e2 instanceof Map && new MapEquality({ keys: this, values: this }).equals(e1, e2));
      }
    }
    if (!(this._unordered)) {
      {
        if ((Array.isArray(e1) || (ArrayBuffer.isView(e1) && !(e1 instanceof DataView)))) {
          {
            return ((Array.isArray(e2) || (ArrayBuffer.isView(e2) && !(e2 instanceof DataView))) && new ListEquality(this).equals(e1, e2));
          }
        }
        if (e1 != null && typeof e1 !== "string" && !(e1 instanceof Map) && typeof e1[Symbol.iterator] === "function") {
          {
            return (e2 != null && typeof e2 !== "string" && !(e2 instanceof Map) && typeof e2[Symbol.iterator] === "function" && new IterableEquality(this).equals(e1, e2));
          }
        }
      }
    } else {
      if (e1 != null && typeof e1 !== "string" && !(e1 instanceof Map) && typeof e1[Symbol.iterator] === "function") {
        {
          if (!(__dartEquals((Array.isArray(e1) || (ArrayBuffer.isView(e1) && !(e1 instanceof DataView))), (Array.isArray(e2) || (ArrayBuffer.isView(e2) && !(e2 instanceof DataView)))))) {
            return false;
          }
          return (e2 != null && typeof e2 !== "string" && !(e2 instanceof Map) && typeof e2[Symbol.iterator] === "function" && new UnorderedIterableEquality(this).equals(e1, e2));
        }
      }
    }
    return this._base.equals(e1, e2);
  }
  hash(o) {
    if (o instanceof Set) {
      return new SetEquality(this).hash(o);
    }
    if (o instanceof Map) {
      return new MapEquality({ keys: this, values: this }).hash(o);
    }
    if (!(this._unordered)) {
      {
        if ((Array.isArray(o) || (ArrayBuffer.isView(o) && !(o instanceof DataView)))) {
          return new ListEquality(this).hash(o);
        }
        if (o != null && typeof o !== "string" && !(o instanceof Map) && typeof o[Symbol.iterator] === "function") {
          return new IterableEquality(this).hash(o);
        }
      }
    } else {
      if (o != null && typeof o !== "string" && !(o instanceof Map) && typeof o[Symbol.iterator] === "function") {
        {
          return new UnorderedIterableEquality(this).hash(o);
        }
      }
    }
    return this._base.hash(o);
  }
  isValidKey(o) {
    return ((o != null && typeof o !== "string" && !(o instanceof Map) && typeof o[Symbol.iterator] === "function" || o instanceof Map) || this._base.isValidKey(o));
  }
}

function $DeepCollectionEquality_unordered($newTarget, base = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
  const $self = Reflect.construct(Equality, [], $newTarget);
  $self._base = base;
  $self._unordered = true;
  return $self;
}

class CaseInsensitiveEquality extends Equality {
  constructor() {
    super();
  }
  equals(string1, string2) {
    return equalsIgnoreAsciiCase(string1, string2);
  }
  hash(string) {
    return hashIgnoreAsciiCase(string);
  }
  isValidKey(object) {
    return typeof object === "string";
  }
}

class EqualityMap extends DelegatingMap {
  constructor(equality) {
    super(new Map());
  }
  static from(equality, other) {
    return $EqualityMap_from(EqualityMap, equality, other);
  }
}

function $EqualityMap_from($newTarget, equality, other) {
  const $self = Reflect.construct(DelegatingMap, [new Map()], $newTarget);
  $self.addAll(other);
  return $self;
}

class EqualitySet extends DelegatingSet {
  constructor(equality) {
    super(new Set());
  }
  static from(equality, other) {
    return $EqualitySet_from(EqualitySet, equality, other);
  }
}

function $EqualitySet_from($newTarget, equality, other) {
  const $self = Reflect.construct(DelegatingSet, [new Set()], $newTarget);
  $self.addAll(other);
  return $self;
}

class IterableZip {
  constructor(iterables) {
    this._iterables = iterables;
  }
  get iterator() {
    let iterators = __dartFixedList(Array.from(Array.from(this._iterables, function(x) { return __dartIterator(x); })));
    return new _IteratorZip(iterators);
  }
}

class _IteratorZip {
  constructor(iterators) {
    this._current = null;
    this._iterators = iterators;
  }
  moveNext() {
    if (__dartIterableIsEmpty(this._iterators)) {
      return false;
    }
    for (let i = 0; (i < this._iterators.length); i = (i + 1)) {
      {
        if (!(this._iterators[i].moveNext())) {
          {
            this._current = null;
            return false;
          }
        }
      }
    }
    this._current = __dartFixedList(Array.from({ length: this._iterators.length }, (_, index) => ((i) => { return this._iterators[i].current; })(index)));
    return true;
  }
  get current() {
    return (this._current ?? (() => { throw __dartCoreError("StateError", "No element"); })());
  }
}

class ListSlice {
  constructor(source, start, end) {
    this.source = source;
    this.start = start;
    this.length = (end - start);
    this._initialSize = source.length;
    __dartCheckValidRange(this.start, end, this.source.length, null, null, null);
  }
  static _(_initialSize, source, start, length) {
    return $ListSlice__(ListSlice, _initialSize, source, start, length);
  }
  get end() {
    return (this.start + this.length);
  }
  "[]"(index) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    __dartCheckValidIndex(index, this, null, this.length, null);
    return this.source[(this.start + index)];
  }
  "[]="(index, value) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    __dartCheckValidIndex(index, this, null, this.length, null);
    this.source[(this.start + index)] = value;
  }
  setRange(start, end, iterable, skipCount = 0) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    __dartCheckValidRange(start, end, this.length, null, null, null);
    __dartListSetRange(this.source, (start + start), (start + end), iterable, skipCount);
  }
  slice(start, end = null) {
    end = __dartCheckValidRange(start, end, this.length, null, null, null);
    return ListSlice._(this._initialSize, this.source, (this.start + start), (end - start));
  }
  shuffle(random = null) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    shuffle(this.source, this.start, this.end, random);
  }
  sort(compare = null) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    ((compare === null) ? compare = defaultCompare : null);
    quickSort(this.source, compare, this.start, (this.start + this.length));
  }
  sortRange(start, end, compare) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    ListExtensions_sortRange(this.source, start, end, compare);
  }
  shuffleRange(start, end, random = null) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    __dartCheckValidRange(start, end, this.length, null, null, null);
    shuffle(this.source, (this.start + start), (this.start + end), random);
  }
  reverseRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    ListExtensions_reverseRange(this.source, (this.start + start), (this.start + end));
  }
  set length(newLength) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot change the length of a fixed-length list"); })();
  }
  add(element) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot add to a fixed-length list"); })();
  }
  insert(index, element) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot add to a fixed-length list"); })();
  }
  insertAll(index, iterable) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot add to a fixed-length list"); })();
  }
  addAll(iterable) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot add to a fixed-length list"); })();
  }
  remove(element) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot remove from a fixed-length list"); })();
  }
  removeWhere(test) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot remove from a fixed-length list"); })();
  }
  retainWhere(test) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot remove from a fixed-length list"); })();
  }
  clear() {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot clear a fixed-length list"); })();
  }
  removeAt(index) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot remove from a fixed-length list"); })();
  }
  removeLast() {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot remove from a fixed-length list"); })();
  }
  removeRange(start, end) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot remove from a fixed-length list"); })();
  }
  replaceRange(start, end, newContents) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot remove from a fixed-length list"); })();
  }
}

function $ListSlice__($newTarget, _initialSize, source, start, length) {
  const $self = Object.create($newTarget.prototype);
  $self._initialSize = _initialSize;
  $self.source = source;
  $self.start = start;
  $self.length = length;
  return $self;
}

class PriorityQueue {
  constructor(comparison = null) {
    if (new.target === PriorityQueue) {
      return new HeapPriorityQueue(comparison);
    }
  }
  get length() {
    throw new TypeError("Abstract member PriorityQueue.length");
  }
  set length(value) {
    Object.defineProperty(this, "length", { value, writable: true, configurable: true, enumerable: true });
  }
  get isEmpty() {
    throw new TypeError("Abstract member PriorityQueue.isEmpty");
  }
  set isEmpty(value) {
    Object.defineProperty(this, "isEmpty", { value, writable: true, configurable: true, enumerable: true });
  }
  get isNotEmpty() {
    throw new TypeError("Abstract member PriorityQueue.isNotEmpty");
  }
  set isNotEmpty(value) {
    Object.defineProperty(this, "isNotEmpty", { value, writable: true, configurable: true, enumerable: true });
  }
  contains(object) {
    throw new TypeError("Abstract member PriorityQueue.contains");
  }
  get unorderedElements() {
    throw new TypeError("Abstract member PriorityQueue.unorderedElements");
  }
  set unorderedElements(value) {
    Object.defineProperty(this, "unorderedElements", { value, writable: true, configurable: true, enumerable: true });
  }
  add(element) {
    throw new TypeError("Abstract member PriorityQueue.add");
  }
  addAll(elements) {
    throw new TypeError("Abstract member PriorityQueue.addAll");
  }
  get first() {
    throw new TypeError("Abstract member PriorityQueue.first");
  }
  set first(value) {
    Object.defineProperty(this, "first", { value, writable: true, configurable: true, enumerable: true });
  }
  removeFirst() {
    throw new TypeError("Abstract member PriorityQueue.removeFirst");
  }
  remove(element) {
    throw new TypeError("Abstract member PriorityQueue.remove");
  }
  removeAll() {
    throw new TypeError("Abstract member PriorityQueue.removeAll");
  }
  clear() {
    throw new TypeError("Abstract member PriorityQueue.clear");
  }
  toList() {
    throw new TypeError("Abstract member PriorityQueue.toList");
  }
  toUnorderedList() {
    throw new TypeError("Abstract member PriorityQueue.toUnorderedList");
  }
  toSet() {
    throw new TypeError("Abstract member PriorityQueue.toSet");
  }
}

class HeapPriorityQueue extends PriorityQueue {
  constructor(comparison = null) {
    super();
    this._queue = __dartFixedList(new Array(7).fill(null));
    this._length = 0;
    this._modificationCount = 0;
    this.comparison = (comparison ?? defaultCompare);
  }
  _elementAt(index) {
    return (this._queue[index] ?? (null ?? __dartAs(v, value => true, "E")));
  }
  add(element) {
    this._modificationCount = (this._modificationCount + 1);
    this._add(element);
  }
  addAll(elements) {
    let modified = 0;
    {
      let _sync_for_iterator = __dartIterator(elements);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            modified = 1;
            this._add(element);
          }
        }
      }
    }
    this._modificationCount = (this._modificationCount + modified);
  }
  clear() {
    this._modificationCount = (this._modificationCount + 1);
    this._queue = __dartConst("[\"list\",\"NeverType(Never)\"]", () => Object.freeze([]));
    this._length = 0;
  }
  contains(object) {
    return (this._locate(object) >= 0);
  }
  get unorderedElements() {
    return new _UnorderedElementsIterable(this);
  }
  get first() {
    if (__dartEquals(this._length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return this._elementAt(0);
  }
  get isEmpty() {
    return __dartEquals(this._length, 0);
  }
  get isNotEmpty() {
    return !(__dartEquals(this._length, 0));
  }
  get length() {
    return this._length;
  }
  remove(element) {
    let index = this._locate(element);
    if ((index < 0)) {
      return false;
    }
    this._modificationCount = (this._modificationCount + 1);
    let last = this._removeLast();
    if ((index < this._length)) {
      {
        let comp = (() => { let v = last; return (() => { let v_1 = element; return (this.comparison)(v, v_1); })(); })();
        if ((comp <= 0)) {
          {
            this._bubbleUp(last, index);
          }
        } else {
          {
            this._bubbleDown(last, index);
          }
        }
      }
    }
    return true;
  }
  removeAll() {
    this._modificationCount = (this._modificationCount + 1);
    let result = this._queue;
    let length = this._length;
    this._queue = __dartConst("[\"list\",\"NeverType(Never)\"]", () => Object.freeze([]));
    this._length = 0;
    return Array.from(Array.from(result).slice(0, length), (value) => __dartAs(value, (value) => true, "TypeParameterType(HeapPriorityQueue.E%)"));
  }
  removeFirst() {
    if (__dartEquals(this._length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    this._modificationCount = (this._modificationCount + 1);
    let result = this._elementAt(0);
    let last = this._removeLast();
    if ((this._length > 0)) {
      {
        this._bubbleDown(last, 0);
      }
    }
    return result;
  }
  toList() {
    return (() => { let v = this._toUnorderedList(); return (() => {
      __dartListSort(v, this.comparison);
      return v;
    })(); })();
  }
  toSet() {
    let set = __dartSplayTreeSet(this.comparison, null);
    for (let i = 0; (i < this._length); i = (i + 1)) {
      {
        __dartSetAdd(set, this._elementAt(i));
      }
    }
    return set;
  }
  toUnorderedList() {
    return this._toUnorderedList();
  }
  _toUnorderedList() {
    return (() => {
      const v = new Array(0).fill(null);
      for (let i = 0; (i < this._length); i = (i + 1)) {
        (v.push(this._elementAt(i)), null);
      }
      return v;
    })();
  }
  toString() {
    return __dartStr(Array.from(this._queue).slice(0, this._length));
  }
  _add(element) {
    if (__dartEquals(this._length, this._queue.length)) {
      this._grow();
    }
    this._bubbleUp(element, (() => { let v = this._length; return (() => { let v_1 = this._length = (v + 1); return v; })(); })());
  }
  _locate(object) {
    if (__dartEquals(this._length, 0)) {
      return (-1);
    }
    let position = 1;
    do {
      L:
      {
        let index = (position - 1);
        let element = this._elementAt(index);
        let comp = (() => { let v = element; return (() => { let v_1 = object; return (this.comparison)(v, v_1); })(); })();
        if ((comp <= 0)) {
          {
            if ((__dartEquals(comp, 0) && __dartEquals(element, object))) {
              return index;
            }
            let leftChildPosition = (position * 2);
            if ((leftChildPosition <= this._length)) {
              {
                position = leftChildPosition;
                break L;
              }
            }
          }
        }
        do {
          {
            while ((Math.trunc(position) % 2 !== 0)) {
              {
                position = (position >> 1);
              }
            }
            position = (position + 1);
          }
        } while ((position > this._length));
      }
    } while (!(__dartEquals(position, 1)));
    return (-1);
  }
  _removeLast() {
    let newLength = (this._length - 1);
    let last = this._elementAt(newLength);
    this._queue[newLength] = null;
    this._length = newLength;
    return last;
  }
  _bubbleUp(element, index) {
    L:
    while ((index > 0)) {
      {
        let parentIndex = __dartTruncDiv((index - 1), 2);
        let parent = this._elementAt(parentIndex);
        if (((() => { let v = element; return (() => { let v_1 = parent; return (this.comparison)(v, v_1); })(); })() > 0)) {
          break L;
        }
        this._queue[index] = parent;
        index = parentIndex;
      }
    }
    this._queue[index] = element;
  }
  _bubbleDown(element, index) {
    let rightChildIndex = ((index * 2) + 2);
    while ((rightChildIndex < this._length)) {
      {
        let leftChildIndex = (rightChildIndex - 1);
        let leftChild = this._elementAt(leftChildIndex);
        let rightChild = this._elementAt(rightChildIndex);
        let comp = (() => { let v = leftChild; return (() => { let v_1 = rightChild; return (this.comparison)(v, v_1); })(); })();
        let minChildIndex = null;
        let minChild = null;
        if ((comp < 0)) {
          {
            minChild = leftChild;
            minChildIndex = leftChildIndex;
          }
        } else {
          {
            minChild = rightChild;
            minChildIndex = rightChildIndex;
          }
        }
        comp = (() => { let v_2 = element; return (() => { let v_3 = minChild; return (this.comparison)(v_2, v_3); })(); })();
        if ((comp <= 0)) {
          {
            this._queue[index] = element;
            return;
          }
        }
        this._queue[index] = minChild;
        index = minChildIndex;
        rightChildIndex = ((index * 2) + 2);
      }
    }
    let leftChildIndex_1 = (rightChildIndex - 1);
    if ((leftChildIndex_1 < this._length)) {
      {
        let child = this._elementAt(leftChildIndex_1);
        let comp_1 = (() => { let v_4 = element; return (() => { let v_5 = child; return (this.comparison)(v_4, v_5); })(); })();
        if ((comp_1 > 0)) {
          {
            this._queue[index] = child;
            index = leftChildIndex_1;
          }
        }
      }
    }
    this._queue[index] = element;
  }
  _grow() {
    let newCapacity = ((this._queue.length * 2) + 1);
    if ((newCapacity < 7)) {
      newCapacity = 7;
    }
    let newQueue = __dartFixedList(new Array(newCapacity).fill(null));
    __dartListSetRange(newQueue, 0, this._length, this._queue, 0);
    this._queue = newQueue;
  }
}

class _UnorderedElementsIterable {
  constructor(_queue) {
    this._queue = _queue;
  }
  get iterator() {
    return new _UnorderedElementsIterator(this._queue);
  }
}

class _UnorderedElementsIterator {
  constructor(_queue) {
    this._current = null;
    this._index = (-1);
    this._queue = _queue;
    this._initialModificationCount = _queue._modificationCount;
  }
  moveNext() {
    if (!(__dartEquals(this._initialModificationCount, this._queue._modificationCount))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this._queue); })();
      }
    }
    let nextIndex = (this._index + 1);
    if (((0 <= nextIndex) && (nextIndex < this._queue.length))) {
      {
        this._current = this._queue._queue[nextIndex];
        this._index = nextIndex;
        return true;
      }
    }
    this._current = null;
    this._index = (-2);
    return false;
  }
  get current() {
    return ((this._index < 0) ? (() => { throw __dartCoreError("StateError", "No element"); })() : (this._current ?? (null ?? __dartAs(v, value => true, "E"))));
  }
}

class _QueueList_Object_ListMixin {
  constructor() {
  }
  add(element) {
    this[(() => { let v = this.length; return (() => { let v_1 = this.length = (v + 1); return v; })(); })()] = element;
  }
  addAll(iterable) {
    let i = this.length;
    {
      let _sync_for_iterator = __dartIterator(iterable);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            this.add(element);
            i = (i + 1);
          }
        }
      }
    }
  }
  cast() {
    return Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(_QueueList&Object&ListMixin.cast.R%)"));
  }
  toString() {
    return ("[" + Array.from(this, (value) => __dartStr(value)).join(", ") + "]");
  }
  removeLast() {
    if (__dartEquals(this.length, 0)) {
      {
        (() => { throw __dartCoreError("StateError", "No element"); })();
      }
    }
    let result = this[(this.length - 1)];
    this.length = (this.length - 1);
    return result;
  }
  get first() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return this[0];
  }
  set first(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    this[0] = value;
  }
  get last() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return this[(this.length - 1)];
  }
  set last(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    this[(this.length - 1)] = value;
  }
  get iterator() {
    return __dartIterator(this);
  }
  elementAt(index) {
    return this[index];
  }
  followedBy(other) {
    return Array.from(this).concat(Array.from(other));
  }
  forEach(action) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        (action)(this[i]);
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
  }
  get isEmpty() {
    return __dartEquals(this.length, 0);
  }
  get isNotEmpty() {
    return !(this.isEmpty);
  }
  get single() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    if ((this.length > 1)) {
      (() => { throw __dartCoreError("StateError", "Too many elements"); })();
    }
    return this[0];
  }
  contains(element) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (__dartEquals(this[i], element)) {
          return true;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return false;
  }
  every(test) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (!((test)(this[i]))) {
          return false;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return true;
  }
  any(test) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if ((test)(this[i])) {
          return true;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return false;
  }
  firstWhere(test, { orElse = null } = {}) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = this[i];
        if ((test)(element)) {
          return element;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  lastWhere(test, { orElse = null } = {}) {
    let length = this.length;
    for (let i = (length - 1); (i >= 0); i = (i - 1)) {
      {
        let element = this[i];
        if ((test)(element)) {
          return element;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  singleWhere(test, { orElse = null } = {}) {
    let length = this.length;
    const match = __dartLazyField("match", null, true, null);
    let matchFound = false;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = this[i];
        if ((test)(element)) {
          {
            if (matchFound) {
              {
                (() => { throw __dartCoreError("StateError", "Too many elements"); })();
              }
            }
            matchFound = true;
            match.set(element);
          }
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (matchFound) {
      return match.get();
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  join(separator = "") {
    if (__dartEquals(this.length, 0)) {
      return "";
    }
    let buffer = (() => { let v = __dartStringBuffer(""); return (() => {
      v.writeAll(this, separator);
      return v;
    })(); })();
    return __dartStr(buffer);
  }
  where(test) {
    return Array.from(this).filter((value) => test(value));
  }
  whereType() {
    return Array.from(this).filter((value) => true);
  }
  map(f) {
    return Array.from(this, (value) => f(value));
  }
  expand(f) {
    return Array.from(this).flatMap((value) => Array.from(f(value)));
  }
  reduce(combine) {
    let length = this.length;
    if (__dartEquals(length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    let value = this[0];
    for (let i = 1; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, this[i]);
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return value;
  }
  fold(initialValue, combine) {
    let value = initialValue;
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, this[i]);
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return value;
  }
  skip(count) {
    return Array.from(this).slice(count, null ?? undefined);
  }
  skipWhile(test) {
    return __dartIterableSkipWhile(this, test);
  }
  take(count) {
    return Array.from(this).slice(0, __dartNullCheck(count) ?? undefined);
  }
  takeWhile(test) {
    return __dartIterableTakeWhile(this, test);
  }
  toList({ growable = true } = {}) {
    if (this.isEmpty) {
      return (growable ? [] : __dartFixedList([]));
    }
    let first = this[0];
    let result = (growable ? new Array(this.length).fill(first) : __dartFixedList(new Array(this.length).fill(first)));
    for (let i = 1; (i < this.length); i = (i + 1)) {
      {
        result[i] = this[i];
      }
    }
    return result;
  }
  toSet() {
    let result = new Set();
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        __dartSetAdd(result, this[i]);
      }
    }
    return result;
  }
  remove(element) {
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        if (__dartEquals(this[i], element)) {
          {
            this._closeGap(i, (i + 1));
            return true;
          }
        }
      }
    }
    return false;
  }
  _closeGap(start, end) {
    let length = this.length;
    let size = (end - start);
    for (let i = end; (i < length); i = (i + 1)) {
      {
        this[(i - size)] = this[i];
      }
    }
    this.length = (length - size);
  }
  removeWhere(test) {
    this._filter(test, false);
  }
  retainWhere(test) {
    this._filter(test, true);
  }
  _filter(test, retainMatching) {
    let retained = new Array(0).fill(null);
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = this[i];
        if (__dartEquals((test)(element), retainMatching)) {
          {
            (retained.push(element), null);
          }
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!(__dartEquals(retained.length, this.length))) {
      {
        this.setRange(0, retained.length, retained);
        this.length = retained.length;
      }
    }
  }
  clear() {
    this.length = 0;
  }
  sort(compare = null) {
    __dartListSort(this, (compare ?? ((left, right) => __dartCompare(left, right))));
  }
  shuffle(random = null) {
    ((random === null) ? random = __dartRandom(null, false) : null);
    let length = this.length;
    while ((length > 1)) {
      {
        let pos = random.nextInt(length);
        length = (length - 1);
        let tmp = this[length];
        this[length] = this[pos];
        this[pos] = tmp;
      }
    }
  }
  asMap() {
    return new Map(Array.from(this, (value, index) => [index, value]));
  }
  "+"(other) {
    return (() => {
      const v = Array.from(this);
      (v.push(...Array.from(other)), null);
      return v;
    })();
  }
  sublist(start, end = null) {
    let listLength = this.length;
    ((end === null) ? end = listLength : null);
    __dartCheckValidRange(start, end, listLength, null, null, null);
    return Array.from(this.getRange(start, end));
  }
  getRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    return Array.from(this).slice(start, end ?? undefined);
  }
  removeRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if ((end > start)) {
      {
        this._closeGap(start, end);
      }
    }
  }
  fillRange(start, end, fill = null) {
    let value = (fill ?? (v ?? __dartAs(v_1, value => true, "E")));
    __dartCheckValidRange(start, end, this.length, null, null, null);
    for (let i = start; (i < end); i = (i + 1)) {
      {
        this[i] = value;
      }
    }
  }
  setRange(start, end, iterable, skipCount = 0) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    let length = (end - start);
    if (__dartEquals(length, 0)) {
      return;
    }
    __dartCheckNotNegative(skipCount, "skipCount", null);
    let otherList = null;
    let otherStart = null;
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        otherList = iterable;
        otherStart = skipCount;
      }
    } else {
      {
        otherList = __dartFixedList(Array.from(Array.from(iterable).slice(skipCount)));
        otherStart = 0;
      }
    }
    if (((otherStart + length) > otherList.length)) {
      {
        (() => { throw __dartCoreError("StateError", "Too few elements"); })();
      }
    }
    if ((otherStart < start)) {
      {
        for (let i = (length - 1); (i >= 0); i = (i - 1)) {
          {
            this[(start + i)] = otherList[(otherStart + i)];
          }
        }
      }
    } else {
      {
        for (let i_1 = 0; (i_1 < length); i_1 = (i_1 + 1)) {
          {
            this[(start + i_1)] = otherList[(otherStart + i_1)];
          }
        }
      }
    }
  }
  replaceRange(start, end, newContents) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if (__dartEquals(start, this.length)) {
      {
        this.addAll(newContents);
        return;
      }
    }
    if (!(newContents != null && typeof newContents !== "string" && typeof newContents.length === "number" && typeof newContents[Symbol.iterator] === "function")) {
      {
        newContents = Array.from(newContents);
      }
    }
    let removeLength = (end - start);
    let insertLength = __dartIterableLength(newContents);
    if ((removeLength >= insertLength)) {
      {
        let insertEnd = (start + insertLength);
        this.setRange(start, insertEnd, newContents);
        if ((removeLength > insertLength)) {
          {
            this._closeGap(insertEnd, end);
          }
        }
      }
    } else {
      if (__dartEquals(end, this.length)) {
        {
          let i = start;
          {
            let _sync_for_iterator = __dartIterator(newContents);
            for (; _sync_for_iterator.moveNext(); ) {
              {
                let element = _sync_for_iterator.current;
                {
                  if ((i < end)) {
                    {
                      this[i] = element;
                    }
                  } else {
                    {
                      this.add(element);
                    }
                  }
                  i = (i + 1);
                }
              }
            }
          }
        }
      } else {
        {
          let delta = (insertLength - removeLength);
          let oldLength = this.length;
          let insertEnd_1 = (start + insertLength);
          for (let i_1 = (oldLength - delta); (i_1 < oldLength); i_1 = (i_1 + 1)) {
            {
              this.add(this[((i_1 > 0) ? i_1 : 0)]);
            }
          }
          if ((insertEnd_1 < oldLength)) {
            {
              this.setRange(insertEnd_1, oldLength, this, end);
            }
          }
          this.setRange(start, insertEnd_1, newContents);
        }
      }
    }
  }
  indexOf(element, start = 0) {
    if ((start < 0)) {
      start = 0;
    }
    for (let i = start; (i < this.length); i = (i + 1)) {
      {
        if (__dartEquals(this[i], element)) {
          return i;
        }
      }
    }
    return (-1);
  }
  indexWhere(test, start = 0) {
    if ((start < 0)) {
      start = 0;
    }
    for (let i = start; (i < this.length); i = (i + 1)) {
      {
        if ((test)(this[i])) {
          return i;
        }
      }
    }
    return (-1);
  }
  lastIndexOf(element, start = null) {
    if (((start === null) || (start >= this.length))) {
      start = (this.length - 1);
    }
    for (let i = start; (i >= 0); i = (i - 1)) {
      {
        if (__dartEquals(this[i], element)) {
          return i;
        }
      }
    }
    return (-1);
  }
  lastIndexWhere(test, start = null) {
    if (((start === null) || (start >= this.length))) {
      start = (this.length - 1);
    }
    for (let i = start; (i >= 0); i = (i - 1)) {
      {
        if ((test)(this[i])) {
          return i;
        }
      }
    }
    return (-1);
  }
  insert(index, element) {
    __dartNullCheck(index);
    let length = this.length;
    __dartCheckValueInInterval(index, 0, length, "index", null);
    this.add(element);
    if (!(__dartEquals(index, length))) {
      {
        this.setRange((index + 1), (length + 1), this, index);
        this[index] = element;
      }
    }
  }
  removeAt(index) {
    let result = this[index];
    this._closeGap(index, (index + 1));
    return result;
  }
  insertAll(index, iterable) {
    __dartCheckValueInInterval(index, 0, this.length, "index", null);
    if (__dartEquals(index, this.length)) {
      {
        this.addAll(iterable);
        return;
      }
    }
    if ((!(iterable != null && typeof iterable !== "string" && typeof iterable.length === "number" && typeof iterable[Symbol.iterator] === "function") || Object.is(iterable, this))) {
      {
        iterable = Array.from(iterable);
      }
    }
    let insertionLength = __dartIterableLength(iterable);
    if (__dartEquals(insertionLength, 0)) {
      {
        return;
      }
    }
    let oldLength = this.length;
    for (let i = (oldLength - insertionLength); (i < oldLength); i = (i + 1)) {
      {
        this.add(this[((i > 0) ? i : 0)]);
      }
    }
    if (!(__dartEquals(__dartIterableLength(iterable), insertionLength))) {
      {
        this.length = (this.length - insertionLength);
        (() => { throw __dartCoreError("ConcurrentModificationError", iterable); })();
      }
    }
    let oldCopyStart = (index + insertionLength);
    if ((oldCopyStart < oldLength)) {
      {
        this.setRange(oldCopyStart, oldLength, this, index);
      }
    }
    this.setAll(index, iterable);
  }
  setAll(index, iterable) {
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        this.setRange(index, (index + __dartIterableLength(iterable)), iterable);
      }
    } else {
      {
        {
          let _sync_for_iterator = __dartIterator(iterable);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let element = _sync_for_iterator.current;
              {
                this[(() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })()] = element;
              }
            }
          }
        }
      }
    }
  }
  get reversed() {
    return Array.from(this).reverse();
  }
}

class QueueList extends _QueueList_Object_ListMixin {
  constructor(initialCapacity = null) {
    return $QueueList__init(new.target, QueueList._computeInitialCapacity(initialCapacity));
  }
  static _init(initialCapacity) {
    return $QueueList__init(QueueList, initialCapacity);
  }
  static _(_head, _tail, _table) {
    return $QueueList__(QueueList, _head, _tail, _table);
  }
  static _castFrom(source) {
    return new _CastQueueList(source);
  }
  static from(source) {
    if ((Array.isArray(source) || (ArrayBuffer.isView(source) && !(source instanceof DataView)))) {
      {
        let length = __dartIterableLength(source);
        let queue = new QueueList((length + 1));
        let sourceList = source;
        __dartListSetRange(queue._table, 0, length, sourceList, 0);
        queue._tail = length;
        return queue;
      }
    } else {
      {
        return (() => { let v = new QueueList(); return (() => {
          v.addAll(source);
          return v;
        })(); })();
      }
    }
  }
  static _computeInitialCapacity(initialCapacity) {
    if (((initialCapacity === null) || (initialCapacity < 8))) {
      {
        return 8;
      }
    }
    initialCapacity = (initialCapacity + 1);
    if (QueueList._isPowerOf2(initialCapacity)) {
      {
        return initialCapacity;
      }
    }
    return QueueList._nextPowerOf2(initialCapacity);
  }
  add(element) {
    this._add(element);
  }
  addAll(iterable) {
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        let list = iterable;
        let addCount = __dartIterableLength(list);
        let length = this.length;
        if (((length + addCount) >= this._table.length)) {
          {
            this._preGrow((length + addCount));
            __dartListSetRange(this._table, length, (length + addCount), list, 0);
            this._tail = (this._tail + addCount);
          }
        } else {
          {
            let endSpace = (this._table.length - this._tail);
            if ((addCount < endSpace)) {
              {
                __dartListSetRange(this._table, this._tail, (this._tail + addCount), list, 0);
                this._tail = (this._tail + addCount);
              }
            } else {
              {
                let preSpace = (addCount - endSpace);
                __dartListSetRange(this._table, this._tail, (this._tail + endSpace), list, 0);
                __dartListSetRange(this._table, 0, preSpace, list, endSpace);
                this._tail = preSpace;
              }
            }
          }
        }
      }
    } else {
      {
        {
          let _sync_for_iterator = __dartIterator(iterable);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let element = _sync_for_iterator.current;
              {
                this._add(element);
              }
            }
          }
        }
      }
    }
  }
  cast() {
    return QueueList._castFrom(this);
  }
  retype() {
    return this.cast();
  }
  toString() {
    return ("{" + Array.from(this, (value) => __dartStr(value)).join(", ") + "}");
  }
  addLast(element) {
    this._add(element);
  }
  addFirst(element) {
    this._head = ((this._head - 1) & (this._table.length - 1));
    this._table[this._head] = element;
    if (__dartEquals(this._head, this._tail)) {
      this._grow();
    }
  }
  removeFirst() {
    if (__dartEquals(this._head, this._tail)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    let result = (this._table[this._head] ?? __dartAs(v, value => true, "E"));
    this._table[this._head] = null;
    this._head = ((this._head + 1) & (this._table.length - 1));
    return result;
  }
  removeLast() {
    if (__dartEquals(this._head, this._tail)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    this._tail = ((this._tail - 1) & (this._table.length - 1));
    let result = (this._table[this._tail] ?? __dartAs(v, value => true, "E"));
    this._table[this._tail] = null;
    return result;
  }
  get length() {
    return ((this._tail - this._head) & (this._table.length - 1));
  }
  set length(value) {
    if ((value < 0)) {
      (() => { throw __dartCoreError("RangeError", "Length " + __dartStr(value) + " may not be negative."); })();
    }
    if (((value > this.length) && !(true))) {
      {
        (() => { throw __dartCoreError("UnsupportedError", "The length can only be increased when the element type is " + "nullable, but the current element type is `" + __dartStr(__dartType("E")) + "`."); })();
      }
    }
    let delta = (value - this.length);
    if ((delta >= 0)) {
      {
        if ((this._table.length <= value)) {
          {
            this._preGrow(value);
          }
        }
        this._tail = ((this._tail + delta) & (this._table.length - 1));
        return;
      }
    }
    let newTail = (this._tail + delta);
    if ((newTail >= 0)) {
      {
        (this._table.fill(null, newTail, this._tail), null);
      }
    } else {
      {
        newTail = (newTail + this._table.length);
        (this._table.fill(null, 0, this._tail), null);
        (this._table.fill(null, newTail, this._table.length), null);
      }
    }
    this._tail = newTail;
  }
  "[]"(index) {
    if (((index < 0) || (index >= this.length))) {
      {
        (() => { throw __dartCoreError("RangeError", "Index " + __dartStr(index) + " must be in the range [0.." + __dartStr(this.length) + ")."); })();
      }
    }
    return (this._table[((this._head + index) & (this._table.length - 1))] ?? __dartAs(v, value => true, "E"));
  }
  "[]="(index, value) {
    if (((index < 0) || (index >= this.length))) {
      {
        (() => { throw __dartCoreError("RangeError", "Index " + __dartStr(index) + " must be in the range [0.." + __dartStr(this.length) + ")."); })();
      }
    }
    this._table[((this._head + index) & (this._table.length - 1))] = value;
  }
  static _isPowerOf2(number) {
    return __dartEquals((number & (number - 1)), 0);
  }
  static _nextPowerOf2(number) {
    number = ((number << 1) - 1);
    for (; ; ) {
      {
        let nextNumber = (number & (number - 1));
        if (__dartEquals(nextNumber, 0)) {
          return number;
        }
        number = nextNumber;
      }
    }
  }
  _add(element) {
    this._table[this._tail] = element;
    this._tail = ((this._tail + 1) & (this._table.length - 1));
    if (__dartEquals(this._head, this._tail)) {
      this._grow();
    }
  }
  _grow() {
    let newTable = __dartFixedList(new Array((this._table.length * 2)).fill(null));
    let split = (this._table.length - this._head);
    __dartListSetRange(newTable, 0, split, this._table, this._head);
    __dartListSetRange(newTable, split, (split + this._head), this._table, 0);
    this._head = 0;
    this._tail = this._table.length;
    this._table = newTable;
  }
  _writeToList(target) {
    if ((this._head <= this._tail)) {
      {
        let length = (this._tail - this._head);
        __dartListSetRange(target, 0, length, this._table, this._head);
        return length;
      }
    } else {
      {
        let firstPartSize = (this._table.length - this._head);
        __dartListSetRange(target, 0, firstPartSize, this._table, this._head);
        __dartListSetRange(target, firstPartSize, (firstPartSize + this._tail), this._table, 0);
        return (this._tail + firstPartSize);
      }
    }
  }
  _preGrow(newElementCount) {
    newElementCount = (newElementCount + (newElementCount >> 1));
    let newCapacity = QueueList._nextPowerOf2(newElementCount);
    let newTable = __dartFixedList(new Array(newCapacity).fill(null));
    this._tail = this._writeToList(newTable);
    this._table = newTable;
    this._head = 0;
  }
}

function $QueueList__init($newTarget, initialCapacity) {
  const $self = Reflect.construct(_QueueList_Object_ListMixin, [], $newTarget);
  $self._table = __dartFixedList(new Array(initialCapacity).fill(null));
  $self._head = 0;
  $self._tail = 0;
  return $self;
}

function $QueueList__($newTarget, _head, _tail, _table) {
  const $self = Reflect.construct(_QueueList_Object_ListMixin, [], $newTarget);
  $self._head = _head;
  $self._tail = _tail;
  $self._table = _table;
  return $self;
}

class _CastQueueList extends QueueList {
  constructor(_delegate) {
    const $self = $QueueList__(new.target, (-1), (-1), Array.from(_delegate._table, (value) => __dartAs(value, (value) => true, "TypeParameterType(_CastQueueList.T%)")));
    $self._delegate = _delegate;
    return $self;
  }
  get _head() {
    return this._delegate._head;
  }
  set _head(value) {
    return this._delegate._head = value;
  }
  get _tail() {
    return this._delegate._tail;
  }
  set _tail(value) {
    return this._delegate._tail = value;
  }
}

class _UnionSet_SetBase_UnmodifiableSetMixin {
  constructor() {
  }
  add(value) {
    return UnmodifiableSetMixin._throw();
  }
  addAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  remove(value) {
    return UnmodifiableSetMixin._throw();
  }
  removeAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  retainAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  removeWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  retainWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  clear() {
    return UnmodifiableSetMixin._throw();
  }
}

class UnionSet extends _UnionSet_SetBase_UnmodifiableSetMixin {
  constructor(sets, { disjoint = false } = {}) {
    super();
    this._sets = sets;
    this._disjoint = disjoint;
  }
  static from(sets, { disjoint = false } = {}) {
    return $UnionSet_from(UnionSet, sets, { disjoint: disjoint });
  }
  get length() {
    return (this._disjoint ? Array.from(this._sets).reduce((previous, value) => (function(length, set) { return (length + set.size); })(previous, value), 0) : __dartIterableLength(this._iterable));
  }
  get iterator() {
    return __dartIterator(this._iterable);
  }
  get _iterable() {
    let allElements = Array.from(this._sets).flatMap((value) => Array.from((function(set) { return set; })(value)));
    return (this._disjoint ? allElements : Array.from(allElements).filter(__dartAs(__dartBind((() => {
      const v = new Set();
      return v;
    })(), "add"), value => typeof value === "function", "bool Function(UnionSet.E%)")));
  }
  contains(element) {
    return Array.from(this._sets).some(function(set) { return __dartIterableContains(set, element); });
  }
  lookup(element) {
    {
      let _sync_for_iterator = __dartIterator(this._sets);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let set = _sync_for_iterator.current;
          {
            let result = __dartSetLookup(set, element);
            if ((!((result === null)) || __dartIterableContains(set, null))) {
              return result;
            }
          }
        }
      }
    }
    return null;
  }
  toSet() {
    return (() => {
      const v = new Set();
      {
        let _sync_for_iterator = __dartIterator(this._sets);
        for (; _sync_for_iterator.moveNext(); ) {
          {
            let set = _sync_for_iterator.current;
            __dartSetAddAll(v, set);
          }
        }
      }
      return v;
    })();
  }
}

function $UnionSet_from($newTarget, sets, { disjoint = false } = {}) {
  return Reflect.construct(UnionSet, [__dartSetFrom(sets), { disjoint: disjoint }], $newTarget);
}

class UnionSetController {
  constructor({ disjoint = false } = {}) {
    return $UnionSetController__(new.target, (() => {
      const v = new Set();
      return v;
    })(), disjoint);
  }
  static _(_sets, disjoint) {
    return $UnionSetController__(UnionSetController, _sets, disjoint);
  }
  add(component) {
    __dartSetAdd(this._sets, component);
  }
  remove(component) {
    return __dartSetRemove(this._sets, component);
  }
}

function $UnionSetController__($newTarget, _sets, disjoint) {
  const $self = Object.create($newTarget.prototype);
  $self._sets = _sets;
  $self.set = new UnionSet(_sets, { disjoint: disjoint });
  return $self;
}

class StreamQueue {
  static _(_source) {
    return $StreamQueue__(StreamQueue, _source);
  }
  get eventsDispatched() {
    return (this._eventsReceived - this._eventQueue.length);
  }
  constructor(source) {
    return StreamQueue._(source);
  }
  get hasNext() {
    this._checkNotClosed();
    let hasNextRequest = new _HasNextRequest();
    this._addRequest(hasNextRequest);
    return hasNextRequest.future;
  }
  lookAhead(count) {
    __dartCheckNotNegative(count, "count", null);
    this._checkNotClosed();
    let request = new _LookAheadRequest(count);
    this._addRequest(request);
    return request.future;
  }
  get next() {
    this._checkNotClosed();
    let nextRequest = new _NextRequest();
    this._addRequest(nextRequest);
    return nextRequest.future;
  }
  get peek() {
    this._checkNotClosed();
    let nextRequest = new _PeekRequest();
    this._addRequest(nextRequest);
    return nextRequest.future;
  }
  get rest() {
    this._checkNotClosed();
    let request = new _RestRequest(this);
    this._isClosed = true;
    this._addRequest(request);
    return request.stream;
  }
  skip(count) {
    __dartCheckNotNegative(count, "count", null);
    this._checkNotClosed();
    let request = new _SkipRequest(count);
    this._addRequest(request);
    return request.future;
  }
  take(count) {
    __dartCheckNotNegative(count, "count", null);
    this._checkNotClosed();
    let request = new _TakeRequest(count);
    this._addRequest(request);
    return request.future;
  }
  startTransaction() {
    this._checkNotClosed();
    let request = new _TransactionRequest(this);
    this._addRequest(request);
    return request.transaction;
  }
  async withTransaction(callback) {
    let transaction = this.startTransaction();
    let queue = transaction.newQueue();
    let result = null;
    try {
      {
        result = await (callback)(queue);
      }
    } catch ($error) {
      if ($error != null) {
        const _ = $error;
        {
          transaction.commit(queue);
          (() => { throw $error; })();
        }
      } else {
        throw $error;
      }
    }
    if (result) {
      {
        transaction.commit(queue);
      }
    } else {
      {
        transaction.reject();
      }
    }
    return result;
  }
  cancelable(callback) {
    let transaction = this.startTransaction();
    let completer = new CancelableCompleter({ onCancel: function() {
      transaction.reject();
} });
    let queue = transaction.newQueue();
    completer.complete((callback)(queue).finally(function() {
      if (!(completer.isCanceled)) {
        transaction.commit(queue);
      }
}));
    return completer.operation;
  }
  cancel({ immediate = false } = {}) {
    this._checkNotClosed();
    this._isClosed = true;
    if (!(immediate)) {
      {
        let request = new _CancelRequest(this);
        this._addRequest(request);
        return request.future;
      }
    }
    if ((this._isDone && this._eventQueue.isEmpty)) {
      return Promise.resolve(null);
    }
    return this._cancel();
  }
  _updateRequests() {
    while (!__dartIterableIsEmpty(this._requestQueue)) {
      {
        if (__dartIterableFirst(this._requestQueue).update(this._eventQueue, this._isDone)) {
          {
            this._requestQueue.shift();
          }
        } else {
          {
            return;
          }
        }
      }
    }
    if (!(this._isDone)) {
      {
        this._pause();
      }
    }
  }
  _extractStream() {
    if (this._isDone) {
      {
        return __dartStreamFromIterable([], true);
      }
    }
    this._isDone = true;
    let subscription = this._subscription;
    if ((subscription === null)) {
      {
        return this._source;
      }
    }
    this._subscription = null;
    let wasPaused = subscription.isPaused;
    let result = new SubscriptionStream(subscription);
    if (wasPaused) {
      subscription.resume();
    }
    return result;
  }
  _pause() {
    __dartNullCheck(this._subscription).pause();
  }
  _ensureListening() {
    if (this._isDone) {
      return;
    }
    if ((this._subscription === null)) {
      {
        this._subscription = __dartStreamListen(this._source, (data) => {
          this._addResult(new ValueResult(data));
}, (error, stackTrace) => {
          this._addResult(Result.error(error, stackTrace));
}, () => {
          this._subscription = null;
          this._close();
}, false);
      }
    } else {
      {
        __dartNullCheck(this._subscription).resume();
      }
    }
  }
  _cancel() {
    if (this._isDone) {
      return null;
    }
    ((this._subscription === null) ? this._subscription = __dartStreamListen(this._source, null, null, null, false) : null);
    let future = __dartNullCheck(this._subscription).cancel();
    this._close();
    return future;
  }
  _addResult(result) {
    this._eventsReceived = (this._eventsReceived + 1);
    this._eventQueue.add(result);
    this._updateRequests();
  }
  _close() {
    this._isDone = true;
    this._updateRequests();
  }
  _checkNotClosed() {
    if (this._isClosed) {
      (() => { throw __dartCoreError("StateError", "Already cancelled"); })();
    }
  }
  _addRequest(request) {
    if (__dartIterableIsEmpty(this._requestQueue)) {
      {
        if (request.update(this._eventQueue, this._isDone)) {
          return;
        }
        this._ensureListening();
      }
    }
    (this._requestQueue.push(request), null);
  }
}

function $StreamQueue__($newTarget, _source) {
  const $self = Object.create($newTarget.prototype);
  $self._subscription = null;
  $self._isDone = false;
  $self._isClosed = false;
  $self._eventsReceived = 0;
  $self._eventQueue = new QueueList();
  $self._requestQueue = [];
  $self._source = _source;
  if (($self._source.isBroadcast === true)) {
    {
      $self._ensureListening();
      $self._pause();
    }
  }
  return $self;
}

class StreamQueueTransaction {
  constructor() {
    throw new TypeError("Class StreamQueueTransaction has no unnamed constructor");
  }
  static _(_parent, source) {
    return $StreamQueueTransaction__(StreamQueueTransaction, _parent, source);
  }
  newQueue() {
    let queue = new StreamQueue(this._splitter.split());
    __dartSetAdd(this._queues, queue);
    return queue;
  }
  commit(queue) {
    this._assertActive();
    if (!(__dartIterableContains(this._queues, queue))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Queue doesn't belong to this transaction."); })();
      }
    } else {
      if (!__dartIterableIsEmpty(queue._requestQueue)) {
        {
          (() => { throw __dartCoreError("StateError", "A queue with pending requests can't be committed."); })();
        }
      }
    }
    this._committed = true;
    for (let j = 0; (j < queue.eventsDispatched); j = (j + 1)) {
      {
        this._parent._eventQueue.removeFirst();
      }
    }
    this._done();
  }
  reject() {
    this._assertActive();
    this._rejected = true;
    this._done();
  }
  _done() {
    this._splitter.close();
    {
      let _sync_for_iterator = __dartIterator(this._queues);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let queue = _sync_for_iterator.current;
          {
            queue._cancel();
          }
        }
      }
    }
    let currentRequest = __dartIterableFirst(this._parent._requestQueue);
    if ((currentRequest instanceof _TransactionRequest && __dartEquals(currentRequest.transaction, this))) {
      {
        this._parent._requestQueue.shift();
        this._parent._updateRequests();
      }
    }
  }
  _assertActive() {
    if (this._committed) {
      {
        (() => { throw __dartCoreError("StateError", "This transaction has already been accepted."); })();
      }
    } else {
      if (this._rejected) {
        {
          (() => { throw __dartCoreError("StateError", "This transaction has already been rejected."); })();
        }
      }
    }
  }
}

function $StreamQueueTransaction__($newTarget, _parent, source) {
  const $self = Object.create($newTarget.prototype);
  $self._queues = (() => {
    const v = new Set();
    return v;
  })();
  $self._committed = false;
  $self._rejected = false;
  $self._parent = _parent;
  $self._splitter = new StreamSplitter(source);
  return $self;
}

class _EventRequest {
  update(events, isDone) {
    throw new TypeError("Abstract member _EventRequest.update");
  }
}

class _NextRequest extends _EventRequest {
  constructor() {
    super();
    this._completer = __dartCompleter();
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    if (events.isNotEmpty) {
      {
        events.removeFirst().complete(this._completer);
        return true;
      }
    }
    if (isDone) {
      {
        this._completer.completeError(__dartCoreError("StateError", "No elements"), (new Error().stack ?? "<javascript stack unavailable>"));
        return true;
      }
    }
    return false;
  }
}

class _PeekRequest extends _EventRequest {
  constructor() {
    super();
    this._completer = __dartCompleter();
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    if (events.isNotEmpty) {
      {
        events.first.complete(this._completer);
        return true;
      }
    }
    if (isDone) {
      {
        this._completer.completeError(__dartCoreError("StateError", "No elements"), (new Error().stack ?? "<javascript stack unavailable>"));
        return true;
      }
    }
    return false;
  }
}

class _SkipRequest extends _EventRequest {
  constructor(_eventsToSkip) {
    super();
    this._completer = __dartCompleter();
    this._eventsToSkip = _eventsToSkip;
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    L:
    while ((this._eventsToSkip > 0)) {
      {
        if (events.isEmpty) {
          {
            if (isDone) {
              break L;
            }
            return false;
          }
        }
        this._eventsToSkip = (this._eventsToSkip - 1);
        let event = events.removeFirst();
        if (event.isError) {
          {
            this._completer.completeError(__dartNullCheck(event.asError).error, __dartNullCheck(event.asError).stackTrace);
            return true;
          }
        }
      }
    }
    this._completer.complete(this._eventsToSkip);
    return true;
  }
}

class _ListRequest extends _EventRequest {
  constructor(_eventsToTake) {
    super();
    this._completer = __dartCompleter();
    this._list = new Array(0).fill(null);
    this._eventsToTake = _eventsToTake;
  }
  get future() {
    return this._completer.future;
  }
}

class _TakeRequest extends _ListRequest {
  constructor(eventsToTake) {
    super(eventsToTake);
  }
  update(events, isDone) {
    L:
    while ((this._list.length < this._eventsToTake)) {
      {
        if (events.isEmpty) {
          {
            if (isDone) {
              break L;
            }
            return false;
          }
        }
        let event = events.removeFirst();
        if (event.isError) {
          {
            __dartNullCheck(event.asError).complete(this._completer);
            return true;
          }
        }
        (this._list.push(__dartNullCheck(event.asValue).value), null);
      }
    }
    this._completer.complete(this._list);
    return true;
  }
}

class _LookAheadRequest extends _ListRequest {
  constructor(eventsToTake) {
    super(eventsToTake);
  }
  update(events, isDone) {
    L:
    while ((this._list.length < this._eventsToTake)) {
      {
        if (__dartEquals(events.length, this._list.length)) {
          {
            if (isDone) {
              break L;
            }
            return false;
          }
        }
        let event = events.elementAt(this._list.length);
        if (event.isError) {
          {
            __dartNullCheck(event.asError).complete(this._completer);
            return true;
          }
        }
        (this._list.push(__dartNullCheck(event.asValue).value), null);
      }
    }
    this._completer.complete(this._list);
    return true;
  }
}

class _CancelRequest extends _EventRequest {
  constructor(_streamQueue) {
    super();
    this._completer = __dartCompleter();
    this._streamQueue = _streamQueue;
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    if (this._streamQueue._isDone) {
      {
        this._completer.complete();
      }
    } else {
      {
        this._streamQueue._ensureListening();
        this._completer.complete(__dartStreamListen(this._streamQueue._extractStream(), null, null, null, false).cancel());
      }
    }
    return true;
  }
}

class _RestRequest extends _EventRequest {
  constructor(_streamQueue) {
    super();
    this._completer = new StreamCompleter();
    this._streamQueue = _streamQueue;
  }
  get stream() {
    return this._completer.stream;
  }
  update(events, isDone) {
    if (events.isEmpty) {
      {
        if (this._streamQueue._isDone) {
          {
            this._completer.setEmpty();
          }
        } else {
          {
            this._completer.setSourceStream(this._streamQueue._extractStream());
          }
        }
      }
    } else {
      {
        let controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null });
        {
          let _sync_for_iterator = __dartIterator(events);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let event = _sync_for_iterator.current;
              {
                event.addTo(controller);
              }
            }
          }
        }
        controller.addStream(this._streamQueue._extractStream(), { cancelOnError: false }).finally(__dartBind(controller, "close"));
        this._completer.setSourceStream(controller.stream);
      }
    }
    return true;
  }
}

class _HasNextRequest extends _EventRequest {
  constructor() {
    super();
    this._completer = __dartCompleter();
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    if (events.isNotEmpty) {
      {
        this._completer.complete(true);
        return true;
      }
    }
    if (isDone) {
      {
        this._completer.complete(false);
        return true;
      }
    }
    return false;
  }
}

class _TransactionRequest extends _EventRequest {
  constructor(parent) {
    super();
    const $transaction = __dartLazyField("_TransactionRequest.transaction", null, "once");
    Object.defineProperty(this, "transaction", {
      get() { return $transaction.get(); },
      set(value) { $transaction.set(value); },
      enumerable: true,
    });
    this._controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null });
    this._eventsSent = 0;
    this.transaction = StreamQueueTransaction._(parent, this._controller.stream);
  }
  update(events, isDone) {
    while ((this._eventsSent < events.length)) {
      {
        events["[]"]((() => { let v = this._eventsSent; return (() => { let v_1 = this._eventsSent = (v + 1); return v; })(); })()).addTo(this._controller);
      }
    }
    if ((isDone && !(this._controller.isClosed))) {
      this._controller.close();
    }
    return (this.transaction._committed || this.transaction._rejected);
  }
}

class StreamSinkCompleter {
  constructor() {
    this.sink = new _CompleterSink();
  }
  get _sink() {
    return __dartAs(this.sink, value => value instanceof _CompleterSink, "_CompleterSink<StreamSinkCompleter.T%>");
  }
  static fromFuture(sinkFuture) {
    let completer = new StreamSinkCompleter();
    sinkFuture.then(__dartAs(__dartBind(completer, "setDestinationSink"), value => typeof value === "function", "void Function(StreamSink<StreamSinkCompleter.fromFuture.T%>)"), __dartBind(completer, "setError"));
    return completer.sink;
  }
  setDestinationSink(destinationSink) {
    if (!((this._sink._destinationSink === null))) {
      {
        (() => { throw __dartCoreError("StateError", "Destination sink already set"); })();
      }
    }
    this._sink._setDestinationSink(destinationSink);
  }
  setError(error, stackTrace = null) {
    this.setDestinationSink(NullStreamSink.error(error, stackTrace));
  }
}

class _CompleterSink {
  constructor() {
    this._controller = null;
    this._doneCompleter = null;
    this._destinationSink = null;
  }
  get _canSendDirectly() {
    return ((this._controller === null) && !((this._destinationSink === null)));
  }
  get done() {
    if (!((this._doneCompleter === null))) {
      return __dartNullCheck(this._doneCompleter).future;
    }
    if ((this._destinationSink === null)) {
      {
        this._doneCompleter = __dartCompleter();
        return __dartNullCheck(this._doneCompleter).future;
      }
    }
    return __dartNullCheck(this._destinationSink).done;
  }
  add(event) {
    if (this._canSendDirectly) {
      {
        __dartNullCheck(this._destinationSink).add(event);
      }
    } else {
      {
        this._ensureController().add(event);
      }
    }
  }
  addError(error, stackTrace = null) {
    if (this._canSendDirectly) {
      {
        __dartNullCheck(this._destinationSink).addError(error, stackTrace);
      }
    } else {
      {
        this._ensureController().addError(error, stackTrace);
      }
    }
  }
  addStream(stream) {
    if (this._canSendDirectly) {
      return __dartNullCheck(this._destinationSink).addStream(stream, { cancelOnError: false });
    }
    return this._ensureController().addStream(stream, { cancelOnError: false });
  }
  close() {
    if (this._canSendDirectly) {
      {
        __dartNullCheck(this._destinationSink).close();
      }
    } else {
      {
        this._ensureController().close();
      }
    }
    return this.done;
  }
  _ensureController() {
    return (this._controller ?? (this._controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null })));
  }
  _setDestinationSink(sink) {
    this._destinationSink = sink;
    if (!((this._controller === null))) {
      {
        sink.addStream(__dartNullCheck(this._controller).stream, { cancelOnError: false }).finally(__dartBind(sink, "close")).catch(function(_) {
});
      }
    }
    if (!((this._doneCompleter === null))) {
      {
        __dartNullCheck(this._doneCompleter).complete(sink.done);
      }
    }
  }
}

class RejectErrorsSink {
  constructor(_inner) {
    this._doneCompleter = __dartCompleter();
    this._closed = false;
    this._addStreamSubscription = null;
    this._addStreamCompleter = null;
    this._inner = _inner;
    this._inner.done.then((value) => {
      this._cancelAddStream();
      if (!(this._canceled)) {
        this._doneCompleter.complete(value);
      }
}).catch((error) => ((error, stackTrace) => {
      this._cancelAddStream();
      if (!(this._canceled)) {
        this._doneCompleter.completeError(error, stackTrace);
      }
})(error, error?.stack ?? "<javascript stack unavailable>"));
  }
  get done() {
    return this._doneCompleter.future;
  }
  get _inAddStream() {
    return !((this._addStreamSubscription === null));
  }
  get _canceled() {
    return this._doneCompleter.isCompleted;
  }
  add(data) {
    if (this._closed) {
      (() => { throw __dartCoreError("StateError", "Cannot add event after closing."); })();
    }
    if (this._inAddStream) {
      {
        (() => { throw __dartCoreError("StateError", "Cannot add event while adding stream."); })();
      }
    }
    if (this._canceled) {
      return;
    }
    this._inner.add(data);
  }
  addError(error, stackTrace = null) {
    if (this._closed) {
      (() => { throw __dartCoreError("StateError", "Cannot add event after closing."); })();
    }
    if (this._inAddStream) {
      {
        (() => { throw __dartCoreError("StateError", "Cannot add event while adding stream."); })();
      }
    }
    if (this._canceled) {
      return;
    }
    this._addError(error, stackTrace);
  }
  _addError(error, stackTrace = null) {
    this._cancelAddStream();
    this._doneCompleter.completeError(error, stackTrace);
    this._inner.close().catch(function(_) {
});
  }
  addStream(stream) {
    if (this._closed) {
      (() => { throw __dartCoreError("StateError", "Cannot add stream after closing."); })();
    }
    if (this._inAddStream) {
      {
        (() => { throw __dartCoreError("StateError", "Cannot add stream while adding stream."); })();
      }
    }
    if (this._canceled) {
      return Promise.resolve(null);
    }
    let addStreamCompleter = this._addStreamCompleter = __dartCompleter();
    this._addStreamSubscription = __dartStreamListen(stream, __dartAs(__dartBind(this._inner, "add"), value => typeof value === "function", "void Function(RejectErrorsSink.T%)"), __dartBind(this, "_addError"), __dartAs(__dartBind(addStreamCompleter, "complete"), value => typeof value === "function", "void Function([FutureOr<void>?])"), false);
    return addStreamCompleter.future.then((_) => {
      this._addStreamCompleter = null;
      this._addStreamSubscription = null;
});
  }
  close() {
    if (this._inAddStream) {
      {
        (() => { throw __dartCoreError("StateError", "Cannot close sink while adding stream."); })();
      }
    }
    if (this._closed) {
      return this.done;
    }
    this._closed = true;
    if (!(this._canceled)) {
      {
        this._doneCompleter.complete(this._inner.close());
      }
    }
    return this.done;
  }
  _cancelAddStream() {
    if (!(this._inAddStream)) {
      return;
    }
    __dartNullCheck(this._addStreamCompleter).complete(__dartNullCheck(this._addStreamSubscription).cancel());
    this._addStreamCompleter = null;
    this._addStreamSubscription = null;
  }
}

class _TransformedSubscription {
  constructor(_inner, _handleCancel, _handlePause, _handleResume) {
    this._cancelMemoizer = new AsyncMemoizer();
    this._inner = _inner;
    this._handleCancel = _handleCancel;
    this._handlePause = _handlePause;
    this._handleResume = _handleResume;
  }
  get isPaused() {
    return ((this._inner)?.isPaused ?? false);
  }
  onData(handleData) {
    ((this._inner)?.onData(handleData) ?? null);
  }
  onError(handleError) {
    ((this._inner)?.onError(handleError) ?? null);
  }
  onDone(handleDone) {
    ((this._inner)?.onDone(handleDone) ?? null);
  }
  cancel() {
    return this._cancelMemoizer.runOnce(() => {
      let inner = __dartNullCheck(this._inner);
      inner.onData(null);
      inner.onDone(null);
      inner.onError(function(_, __) {
});
      this._inner = null;
      return (() => { let v = inner; return (this._handleCancel)(v); })();
});
  }
  pause(resumeFuture = null) {
    if (this._cancelMemoizer.hasRun) {
      return;
    }
    if (!((resumeFuture === null))) {
      resumeFuture.finally(__dartBind(this, "resume"));
    }
    (() => { let v = __dartNullCheck(this._inner); return (this._handlePause)(v); })();
  }
  resume() {
    if (this._cancelMemoizer.hasRun) {
      return;
    }
    (() => { let v = __dartNullCheck(this._inner); return (this._handleResume)(v); })();
  }
  asFuture(futureValue = null) {
    return ((this._inner)?.asFuture(futureValue) ?? __dartCompleter().future);
  }
}

class StreamZip {
  constructor(streams) {
    this._streams = streams;
  }
  listen(onData, { onError = null, onDone = null, cancelOnError = null } = {}) {
    cancelOnError = Object.is(true, cancelOnError);
    let subscriptions = new Array(0).fill(null);
    const controller = __dartLazyField("controller", null, true, null);
    const current = __dartLazyField("current", null, true, null);
    let dataCount = 0;
    function handleData(index, data) {
      current.get()[index] = data;
      dataCount = (dataCount + 1);
      if (__dartEquals(dataCount, subscriptions.length)) {
        {
          let data_1 = Array.from(current.get());
          current.set(__dartFixedList(new Array(subscriptions.length).fill(null)));
          dataCount = 0;
          for (let i = 0; (i < subscriptions.length); i = (i + 1)) {
            {
              if (!(__dartEquals(i, index))) {
                subscriptions[i].resume();
              }
            }
          }
          controller.get().add(data_1);
        }
      } else {
        {
          subscriptions[index].pause();
        }
      }
    }
    function handleError(error, stackTrace) {
      controller.get().addError(error, stackTrace);
    }
    function handleErrorCancel(error, stackTrace) {
      for (let i = 0; (i < subscriptions.length); i = (i + 1)) {
        {
          subscriptions[i].cancel();
        }
      }
      controller.get().addError(error, stackTrace);
    }
    function handleDone() {
      for (let i = 0; (i < subscriptions.length); i = (i + 1)) {
        {
          subscriptions[i].cancel();
        }
      }
      controller.get().close();
    }
    try {
      {
        {
          let _sync_for_iterator = __dartIterator(this._streams);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let stream = _sync_for_iterator.current;
              {
                let index = subscriptions.length;
                (subscriptions.push(__dartStreamListen(stream, function(data) {
                  handleData(index, data);
}, (cancelOnError ? handleError : handleErrorCancel), handleDone, cancelOnError)), null);
              }
            }
          }
        }
      }
    } catch ($error) {
      if ($error != null) {
        const e = $error;
        {
          for (let i = (subscriptions.length - 1); (i >= 0); i = (i - 1)) {
            {
              subscriptions[i].cancel();
            }
          }
          (() => { throw $error; })();
        }
      } else {
        throw $error;
      }
    }
    current.set(__dartFixedList(new Array(subscriptions.length).fill(null)));
    controller.set(__dartStreamController(false, { onListen: null, onPause: function() {
      for (let i = 0; (i < subscriptions.length); i = (i + 1)) {
        {
          subscriptions[i].pause();
        }
      }
}, onResume: function() {
      for (let i = 0; (i < subscriptions.length); i = (i + 1)) {
        {
          subscriptions[i].resume();
        }
      }
}, onCancel: function() {
      for (let i = 0; (i < subscriptions.length); i = (i + 1)) {
        {
          subscriptions[i].cancel();
        }
      }
} }));
    if (subscriptions.length === 0) {
      {
        controller.get().close();
      }
    }
    return __dartStreamListen(controller.get().stream, onData, onError, onDone, cancelOnError);
  }
}

class _TypeSafeStreamTransformer {
  constructor(_inner) {
    this._inner = _inner;
  }
  bind(stream) {
    return __dartStreamCast(__dartStreamTransformerBind(this._inner, stream), (value) => true, "TypeParameterType(_TypeSafeStreamTransformer.T%)");
  }
}


Object.defineProperty(Result, "captureStreamTransformer", { value: __dartConst("[\"instance\",\"class:CaptureStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]", () => Object.freeze(Object.create(CaptureStreamTransformer.prototype))), enumerable: true });

Object.defineProperty(Result, "releaseStreamTransformer", { value: __dartConst("[\"instance\",\"class:ReleaseStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]", () => Object.freeze(Object.create(ReleaseStreamTransformer.prototype))), enumerable: true });

Object.defineProperty(Result, "captureSinkTransformer", { value: __dartConst("[\"instance\",\"class:StreamTransformerWrapper\",[\"typeArgument\",\"InterfaceType(Object)\"],[\"typeArgument\",\"InterfaceType(Result<Object>)\"],[\"field\",\"field:StreamTransformerWrapper._transformer\",[\"instance\",\"class:CaptureStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]]]", () => Object.freeze(Object.assign(Object.create(StreamTransformerWrapper.prototype), { _transformer: __dartConst("[\"instance\",\"class:CaptureStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]", () => Object.freeze(Object.create(CaptureStreamTransformer.prototype))) }))), enumerable: true });

Object.defineProperty(Result, "releaseSinkTransformer", { value: __dartConst("[\"instance\",\"class:StreamTransformerWrapper\",[\"typeArgument\",\"InterfaceType(Result<Object>)\"],[\"typeArgument\",\"InterfaceType(Object)\"],[\"field\",\"field:StreamTransformerWrapper._transformer\",[\"instance\",\"class:ReleaseStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]]]", () => Object.freeze(Object.assign(Object.create(StreamTransformerWrapper.prototype), { _transformer: __dartConst("[\"instance\",\"class:ReleaseStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]", () => Object.freeze(Object.create(ReleaseStreamTransformer.prototype))) }))), enumerable: true });

Object.defineProperty(TargetKind, "classType", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"classes\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"classType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "classes", name: "classType" }))), enumerable: true });

Object.defineProperty(TargetKind, "constructor", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"constructors\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"constructor\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "constructors", name: "constructor" }))), enumerable: true });

Object.defineProperty(TargetKind, "directive", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"directive\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "directives", name: "directive" }))), enumerable: true });

Object.defineProperty(TargetKind, "enumType", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enums\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "enums", name: "enumType" }))), enumerable: true });

Object.defineProperty(TargetKind, "enumValue", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enum values\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumValue\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "enum values", name: "enumValue" }))), enumerable: true });

Object.defineProperty(TargetKind, "exportDirective", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"export directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"exportDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "export directives", name: "exportDirective" }))), enumerable: true });

Object.defineProperty(TargetKind, "extension", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extensions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extension\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "extensions", name: "extension" }))), enumerable: true });

Object.defineProperty(TargetKind, "extensionType", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extension types\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extensionType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "extension types", name: "extensionType" }))), enumerable: true });

Object.defineProperty(TargetKind, "field", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"fields\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"field\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "fields", name: "field" }))), enumerable: true });

Object.defineProperty(TargetKind, "function", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level functions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"function\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "top-level functions", name: "function" }))), enumerable: true });

Object.defineProperty(TargetKind, "library", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"libraries\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"library\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "libraries", name: "library" }))), enumerable: true });

Object.defineProperty(TargetKind, "getter", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"getters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"getter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "getters", name: "getter" }))), enumerable: true });

Object.defineProperty(TargetKind, "importDirective", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"import directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"importDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "import directives", name: "importDirective" }))), enumerable: true });

Object.defineProperty(TargetKind, "method", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"methods\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"method\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "methods", name: "method" }))), enumerable: true });

Object.defineProperty(TargetKind, "mixinType", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"mixins\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"mixinType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "mixins", name: "mixinType" }))), enumerable: true });

Object.defineProperty(TargetKind, "optionalParameter", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"optional parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"optionalParameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "optional parameters", name: "optionalParameter" }))), enumerable: true });

Object.defineProperty(TargetKind, "overridableMember", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"overridable members\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"overridableMember\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "overridable members", name: "overridableMember" }))), enumerable: true });

Object.defineProperty(TargetKind, "parameter", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"parameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "parameters", name: "parameter" }))), enumerable: true });

Object.defineProperty(TargetKind, "partOfDirective", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"\\\"part of\\\" directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"partOfDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "\"part of\" directives", name: "partOfDirective" }))), enumerable: true });

Object.defineProperty(TargetKind, "setter", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"setters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"setter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "setters", name: "setter" }))), enumerable: true });

Object.defineProperty(TargetKind, "topLevelVariable", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level variables\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"topLevelVariable\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "top-level variables", name: "topLevelVariable" }))), enumerable: true });

Object.defineProperty(TargetKind, "type", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"types (classes, enums, mixins, or typedefs)\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"type\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "types (classes, enums, mixins, or typedefs)", name: "type" }))), enumerable: true });

Object.defineProperty(TargetKind, "typedefType", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"typedefs\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typedefType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "typedefs", name: "typedefType" }))), enumerable: true });

Object.defineProperty(TargetKind, "typeParameter", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"type parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typeParameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "type parameters", name: "typeParameter" }))), enumerable: true });

Object.defineProperty(TargetKind, "values", { value: __dartConst("[\"list\",\"InterfaceType(TargetKind)\",[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"classes\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"classType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"constructors\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"constructor\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"directive\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enums\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enum values\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumValue\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"export directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"exportDirective\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extensions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extension\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extension types\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extensionType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"fields\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"field\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level functions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"function\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"libraries\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"library\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"getters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"getter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"import directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"importDirective\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"methods\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"method\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"mixins\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"mixinType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"optional parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"optionalParameter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"overridable members\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"overridableMember\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"parameter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"\\\"part of\\\" directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"partOfDirective\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"setters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"setter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level variables\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"topLevelVariable\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"types (classes, enums, mixins, or typedefs)\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"type\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"typedefs\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typedefType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"type parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typeParameter\"]]]]", () => Object.freeze([__dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"classes\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"classType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "classes", name: "classType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"constructors\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"constructor\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "constructors", name: "constructor" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"directive\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "directives", name: "directive" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enums\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "enums", name: "enumType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enum values\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumValue\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "enum values", name: "enumValue" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"export directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"exportDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "export directives", name: "exportDirective" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extensions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extension\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "extensions", name: "extension" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extension types\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extensionType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "extension types", name: "extensionType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"fields\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"field\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "fields", name: "field" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level functions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"function\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "top-level functions", name: "function" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"libraries\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"library\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "libraries", name: "library" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"getters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"getter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "getters", name: "getter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"import directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"importDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "import directives", name: "importDirective" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"methods\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"method\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "methods", name: "method" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"mixins\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"mixinType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "mixins", name: "mixinType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"optional parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"optionalParameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "optional parameters", name: "optionalParameter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"overridable members\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"overridableMember\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "overridable members", name: "overridableMember" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"parameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "parameters", name: "parameter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"\\\"part of\\\" directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"partOfDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "\"part of\" directives", name: "partOfDirective" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"setters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"setter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "setters", name: "setter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level variables\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"topLevelVariable\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "top-level variables", name: "topLevelVariable" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"types (classes, enums, mixins, or typedefs)\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"type\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "types (classes, enums, mixins, or typedefs)", name: "type" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"typedefs\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typedefType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "typedefs", name: "typedefType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"type parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typeParameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "type parameters", name: "typeParameter" })))])), enumerable: true });

Object.defineProperty(_StreamGroupState, "dormant", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" }))), enumerable: true });

Object.defineProperty(_StreamGroupState, "listening", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"listening\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "listening" }))), enumerable: true });

Object.defineProperty(_StreamGroupState, "paused", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"paused\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "paused" }))), enumerable: true });

Object.defineProperty(_StreamGroupState, "canceled", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"canceled\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "canceled" }))), enumerable: true });

Object.defineProperty(BoolList, "_entryShift", { value: 5, enumerable: true });

Object.defineProperty(BoolList, "_bitsPerEntry", { value: 32, enumerable: true });

Object.defineProperty(BoolList, "_entrySignBitIndex", { value: 31, enumerable: true });

Object.defineProperty(_GrowableBoolList, "_growthFactor", { value: 2, enumerable: true });

Object.defineProperty(HeapPriorityQueue, "_initialCapacity", { value: 7, enumerable: true });

Object.defineProperty(QueueList, "_initialCapacity", { value: 8, enumerable: true });
function _forward(forwarder) {
  return forwarder._forward();
}

function _extension_0_completeErrorIfPending(_this, error, stackTrace) {
  if (_this.isCompleted) {
    return;
  }
  _this.completeError(error, stackTrace);
}

function _extension_0_get_completeErrorIfPending(_this) {
  return function(error, stackTrace) { return _extension_0_completeErrorIfPending(_this, error, stackTrace); };
}

function collectBytes(source) {
  return _collectBytes(source, function(_, result) { return result; });
}

function collectBytesCancelable(source) {
  return _collectBytes(source, function(subscription, result) { return CancelableOperation.fromFuture(result, { onCancel: __dartBind(subscription, "cancel") }); });
}

function _collectBytes(source, result) {
  let bytes = __dartBytesBuilder(false);
  let completer = __dartCompleter();
  let subscription = __dartStreamListen(source, __dartBind(bytes, "add"), __dartBind(completer, "completeError"), function() {
    completer.complete(bytes.takeBytes());
}, true);
  return (result)(subscription, completer.future);
}

async function ChunkedStreamReaderByteStreamExt_readBytes(_this, size) {
  return await collectBytes(_this.readStream(size));
}

function ChunkedStreamReaderByteStreamExt_get_readBytes(_this) {
  return function(size) { return ChunkedStreamReaderByteStreamExt_readBytes(_this, size); };
}

function _closeSink(sink) {
  sink.close();
}

const alwaysThrows = __dartConst("[\"instance\",\"class:_AlwaysThrows\"]", () => Object.freeze(Object.create(_AlwaysThrows.prototype)));

const awaitNotRequired = __dartConst("[\"instance\",\"class:_AwaitNotRequired\"]", () => Object.freeze(Object.create(_AwaitNotRequired.prototype)));

const checked = __dartConst("[\"instance\",\"class:_Checked\"]", () => Object.freeze(Object.create(_Checked.prototype)));

const doNotStore = __dartConst("[\"instance\",\"class:_DoNotStore\"]", () => Object.freeze(Object.create(_DoNotStore.prototype)));

const doNotSubmit = __dartConst("[\"instance\",\"class:_DoNotSubmit\"]", () => Object.freeze(Object.create(_DoNotSubmit.prototype)));

const experimental = __dartConst("[\"instance\",\"class:_Experimental\"]", () => Object.freeze(Object.create(_Experimental.prototype)));

const factory = __dartConst("[\"instance\",\"class:_Factory\"]", () => Object.freeze(Object.create(_Factory.prototype)));

const immutable = __dartConst("[\"instance\",\"class:Immutable\",[\"field\",\"field:Immutable.reason\",[\"string\",\"\"]]]", () => Object.freeze(Object.assign(Object.create(Immutable.prototype), { reason: "" })));

const internal = __dartConst("[\"instance\",\"class:_Internal\"]", () => Object.freeze(Object.create(_Internal.prototype)));

const isTest = __dartConst("[\"instance\",\"class:_IsTest\"]", () => Object.freeze(Object.create(_IsTest.prototype)));

const isTestGroup = __dartConst("[\"instance\",\"class:_IsTestGroup\"]", () => Object.freeze(Object.create(_IsTestGroup.prototype)));

const literal = __dartConst("[\"instance\",\"class:_Literal\"]", () => Object.freeze(Object.create(_Literal.prototype)));

const mustBeConst = __dartConst("[\"instance\",\"class:_MustBeConst\"]", () => Object.freeze(Object.create(_MustBeConst.prototype)));

const mustBeOverridden = __dartConst("[\"instance\",\"class:_MustBeOverridden\"]", () => Object.freeze(Object.create(_MustBeOverridden.prototype)));

const mustCallSuper = __dartConst("[\"instance\",\"class:_MustCallSuper\"]", () => Object.freeze(Object.create(_MustCallSuper.prototype)));

const nonVirtual = __dartConst("[\"instance\",\"class:_NonVirtual\"]", () => Object.freeze(Object.create(_NonVirtual.prototype)));

const optionalTypeArgs = __dartConst("[\"instance\",\"class:_OptionalTypeArgs\"]", () => Object.freeze(Object.create(_OptionalTypeArgs.prototype)));

const protected_1 = __dartConst("[\"instance\",\"class:_Protected\"]", () => Object.freeze(Object.create(_Protected.prototype)));

const redeclare = __dartConst("[\"instance\",\"class:_Redeclare\"]", () => Object.freeze(Object.create(_Redeclare.prototype)));

const reopen = __dartConst("[\"instance\",\"class:_Reopen\"]", () => Object.freeze(Object.create(_Reopen.prototype)));

const required = __dartConst("[\"instance\",\"class:Required\",[\"field\",\"field:Required.reason\",[\"string\",\"\"]]]", () => Object.freeze(Object.assign(Object.create(Required.prototype), { reason: "" })));

const sealed = __dartConst("[\"instance\",\"class:_Sealed\"]", () => Object.freeze(Object.create(_Sealed.prototype)));

const useResult = __dartConst("[\"instance\",\"class:UseResult\",[\"field\",\"field:UseResult.parameterDefined\",[\"null\"]],[\"field\",\"field:UseResult.reason\",[\"string\",\"\"]]]", () => Object.freeze(Object.assign(Object.create(UseResult.prototype), { reason: "", parameterDefined: null })));

const virtual = __dartConst("[\"instance\",\"class:_Virtual\"]", () => Object.freeze(Object.create(_Virtual.prototype)));

const visibleForOverriding = __dartConst("[\"instance\",\"class:_VisibleForOverriding\"]", () => Object.freeze(Object.create(_VisibleForOverriding.prototype)));

const visibleForTesting = __dartConst("[\"instance\",\"class:_VisibleForTesting\"]", () => Object.freeze(Object.create(_VisibleForTesting.prototype)));

function StreamExtensions_slices(_this, length) {
  if ((length < 1)) {
    (() => { throw __dartCoreError("RangeError", length); })();
  }
  let slice = new Array(0).fill(null);
  return __dartStreamTransform(_this, __dartStreamTransformerFromHandlers({ handleData: function(data, sink) {
    (slice.push(data), null);
    if (__dartEquals(slice.length, length)) {
      {
        sink.add(slice);
        slice = new Array(0).fill(null);
      }
    }
}, handleError: null, handleDone: function(sink) {
    if (slice.length !== 0) {
      sink.add(slice);
    }
    sink.close();
} }));
}

function StreamExtensions_get_slices(_this) {
  return function(length) { return StreamExtensions_slices(_this, length); };
}

function StreamExtensions_get_firstOrNull(_this) {
  let completer = __dartCompleter();
  const subscription = __dartStreamListen(_this, null, __dartBind(completer, "completeError"), __dartAs(__dartBind(completer, "complete"), value => typeof value === "function", "void Function([FutureOr<StreamExtensions|get#firstOrNull.T?>?])"), true);
  subscription.onData(function(event) {
    subscription.cancel().finally(function() {
      completer.complete(event);
});
});
  return completer.future;
}

function StreamExtensions_listenAndBuffer(_this) {
  let controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null });
  let subscription = __dartStreamListen(_this, __dartAs(__dartBind(controller, "add"), value => typeof value === "function", "void Function(StreamExtensions|listenAndBuffer.T%)"), __dartBind(controller, "addError"), __dartBind(controller, "close"), false);
  (() => { let v = controller; return (() => {
    v.onPause = __dartBind(subscription, "pause");
    v.onResume = __dartBind(subscription, "resume");
    v.onCancel = __dartBind(subscription, "cancel");
    return v;
  })(); })();
  return controller.stream;
}

function StreamExtensions_get_listenAndBuffer(_this) {
  return function() { return StreamExtensions_listenAndBuffer(_this); };
}

function defaultCompare(value1, value2) {
  return __dartCompare(__dartAs(value1, value => value != null && (typeof value === "number" || typeof value === "string" || typeof value === "bigint" || typeof value.compareTo === "function"), "Comparable<Object?>"), value2);
}

function identity(value) {
  return value;
}

function compareComparable(a, b) {
  return __dartCompare(a, b);
}

const _mergeSortLimit = 32;

function binarySearch(sortedList, value, { compare = null } = {}) {
  ((compare === null) ? compare = defaultCompare : null);
  return binarySearchBy(sortedList, identity, compare, value);
}

function binarySearchBy(sortedList, keyOf, compare, value, start = 0, end = null) {
  end = __dartCheckValidRange(start, end, sortedList.length, null, null, null);
  let min = start;
  let max = end;
  let key = (keyOf)(value);
  while ((min < max)) {
    {
      let mid = (min + ((max - min) >> 1));
      let element = sortedList[mid];
      let comp = (compare)((keyOf)(element), key);
      if (__dartEquals(comp, 0)) {
        return mid;
      }
      if ((comp < 0)) {
        {
          min = (mid + 1);
        }
      } else {
        {
          max = mid;
        }
      }
    }
  }
  return (-1);
}

function lowerBound(sortedList, value, { compare = null } = {}) {
  ((compare === null) ? compare = defaultCompare : null);
  return lowerBoundBy(sortedList, identity, compare, value);
}

function lowerBoundBy(sortedList, keyOf, compare, value, start = 0, end = null) {
  end = __dartCheckValidRange(start, end, sortedList.length, null, null, null);
  let min = start;
  let max = end;
  let key = (keyOf)(value);
  while ((min < max)) {
    {
      let mid = (min + ((max - min) >> 1));
      let element = sortedList[mid];
      let comp = (compare)((keyOf)(element), key);
      if ((comp < 0)) {
        {
          min = (mid + 1);
        }
      } else {
        {
          max = mid;
        }
      }
    }
  }
  return min;
}

function shuffle(elements, start = 0, end = null, random = null) {
  ((random === null) ? random = __dartRandom(null, false) : null);
  ((end === null) ? end = elements.length : null);
  let length = (end - start);
  while ((length > 1)) {
    {
      let pos = random.nextInt(length);
      length = (length - 1);
      let tmp1 = elements[(start + pos)];
      elements[(start + pos)] = elements[(start + length)];
      elements[(start + length)] = tmp1;
    }
  }
}

function reverse(elements, start = 0, end = null) {
  end = __dartCheckValidRange(start, end, elements.length, null, null, null);
  _reverse(elements, start, end);
}

function _reverse(elements, start, end) {
  for (let i = start, j = (end - 1); (i < j); i = (i + 1), j = (j - 1)) {
    {
      let tmp = elements[i];
      elements[i] = elements[j];
      elements[j] = tmp;
    }
  }
}

function insertionSort(elements, { compare = null, start = 0, end = null } = {}) {
  ((compare === null) ? compare = defaultCompare : null);
  ((end === null) ? end = elements.length : null);
  for (let pos = (start + 1); (pos < end); pos = (pos + 1)) {
    {
      let min = start;
      let max = pos;
      let element = elements[pos];
      while ((min < max)) {
        {
          let mid = (min + ((max - min) >> 1));
          let comparison = (compare)(element, elements[mid]);
          if ((comparison < 0)) {
            {
              max = mid;
            }
          } else {
            {
              min = (mid + 1);
            }
          }
        }
      }
      __dartListSetRange(elements, (min + 1), (pos + 1), elements, min);
      elements[min] = element;
    }
  }
}

function insertionSortBy(elements, keyOf, compare, start = 0, end = null) {
  end = __dartCheckValidRange(start, end, elements.length, null, null, null);
  _movingInsertionSort(elements, keyOf, compare, start, end, elements, start);
}

function mergeSort(elements, { start = 0, end = null, compare = null } = {}) {
  end = __dartCheckValidRange(start, end, elements.length, null, null, null);
  ((compare === null) ? compare = defaultCompare : null);
  let length = (end - start);
  if ((length < 2)) {
    return;
  }
  if ((length < 32)) {
    {
      insertionSort(elements, { compare: compare, start: start, end: end });
      return;
    }
  }
  let firstLength = ((end - start) >> 1);
  let middle = (start + firstLength);
  let secondLength = (end - middle);
  let scratchSpace = elements.slice(0, secondLength);
  _mergeSort(elements, identity, compare, middle, end, scratchSpace, 0);
  let firstTarget = (end - firstLength);
  _mergeSort(elements, identity, compare, start, middle, elements, firstTarget);
  _merge(identity, compare, elements, firstTarget, end, scratchSpace, 0, secondLength, elements, start);
}

function mergeSortBy(elements, keyOf, compare, start = 0, end = null) {
  end = __dartCheckValidRange(start, end, elements.length, null, null, null);
  let length = (end - start);
  if ((length < 2)) {
    return;
  }
  if ((length < 32)) {
    {
      _movingInsertionSort(elements, keyOf, compare, start, end, elements, start);
      return;
    }
  }
  let middle = (start + (length >> 1));
  let firstLength = (middle - start);
  let secondLength = (end - middle);
  let scratchSpace = elements.slice(0, secondLength);
  _mergeSort(elements, keyOf, compare, middle, end, scratchSpace, 0);
  let firstTarget = (end - firstLength);
  _mergeSort(elements, keyOf, compare, start, middle, elements, firstTarget);
  _merge(keyOf, compare, elements, firstTarget, end, scratchSpace, 0, secondLength, elements, start);
}

function _movingInsertionSort(list, keyOf, compare, start, end, target, targetOffset) {
  let length = (end - start);
  if (__dartEquals(length, 0)) {
    return;
  }
  target[targetOffset] = list[start];
  for (let i = 1; (i < length); i = (i + 1)) {
    {
      let element = list[(start + i)];
      let elementKey = (keyOf)(element);
      let min = targetOffset;
      let max = (targetOffset + i);
      while ((min < max)) {
        {
          let mid = (min + ((max - min) >> 1));
          if (((compare)(elementKey, (keyOf)(target[mid])) < 0)) {
            {
              max = mid;
            }
          } else {
            {
              min = (mid + 1);
            }
          }
        }
      }
      __dartListSetRange(target, (min + 1), ((targetOffset + i) + 1), target, min);
      target[min] = element;
    }
  }
}

function _mergeSort(elements, keyOf, compare, start, end, target, targetOffset) {
  let length = (end - start);
  if ((length < 32)) {
    {
      _movingInsertionSort(elements, keyOf, compare, start, end, target, targetOffset);
      return;
    }
  }
  let middle = (start + (length >> 1));
  let firstLength = (middle - start);
  let secondLength = (end - middle);
  let targetMiddle = (targetOffset + firstLength);
  _mergeSort(elements, keyOf, compare, middle, end, target, targetMiddle);
  _mergeSort(elements, keyOf, compare, start, middle, elements, middle);
  _merge(keyOf, compare, elements, middle, (middle + firstLength), target, targetMiddle, (targetMiddle + secondLength), target, targetOffset);
}

function _merge(keyOf, compare, firstList, firstStart, firstEnd, secondList, secondStart, secondEnd, target, targetOffset) {
  let cursor1 = firstStart;
  let cursor2 = secondStart;
  let firstElement = firstList[(() => { let v = cursor1; return (() => { let v_1 = cursor1 = (v + 1); return v; })(); })()];
  let firstKey = (keyOf)(firstElement);
  let secondElement = secondList[(() => { let v_2 = cursor2; return (() => { let v_3 = cursor2 = (v_2 + 1); return v_2; })(); })()];
  let secondKey = (keyOf)(secondElement);
  L:
  while (true) {
    L_1:
    {
      if (((compare)(firstKey, secondKey) <= 0)) {
        {
          target[(() => { let v_4 = targetOffset; return (() => { let v_5 = targetOffset = (v_4 + 1); return v_4; })(); })()] = firstElement;
          if (__dartEquals(cursor1, firstEnd)) {
            break L;
          }
          firstElement = firstList[(() => { let v_6 = cursor1; return (() => { let v_7 = cursor1 = (v_6 + 1); return v_6; })(); })()];
          firstKey = (keyOf)(firstElement);
        }
      } else {
        {
          target[(() => { let v_8 = targetOffset; return (() => { let v_9 = targetOffset = (v_8 + 1); return v_8; })(); })()] = secondElement;
          if (!(__dartEquals(cursor2, secondEnd))) {
            {
              secondElement = secondList[(() => { let v_10 = cursor2; return (() => { let v_11 = cursor2 = (v_10 + 1); return v_10; })(); })()];
              secondKey = (keyOf)(secondElement);
              break L_1;
            }
          }
          target[(() => { let v_12 = targetOffset; return (() => { let v_13 = targetOffset = (v_12 + 1); return v_12; })(); })()] = firstElement;
          __dartListSetRange(target, targetOffset, (targetOffset + (firstEnd - cursor1)), firstList, cursor1);
          return;
        }
      }
    }
  }
  target[(() => { let v_14 = targetOffset; return (() => { let v_15 = targetOffset = (v_14 + 1); return v_14; })(); })()] = secondElement;
  __dartListSetRange(target, targetOffset, (targetOffset + (secondEnd - cursor2)), secondList, cursor2);
}

function quickSort(elements, compare, start = 0, end = null) {
  end = __dartCheckValidRange(start, end, elements.length, null, null, null);
  _quickSort(elements, identity, compare, __dartRandom(null, false), start, end);
}

function quickSortBy(list, keyOf, compare, start = 0, end = null) {
  end = __dartCheckValidRange(start, end, list.length, null, null, null);
  _quickSort(list, keyOf, compare, __dartRandom(null, false), start, end);
}

function _quickSort(list, keyOf, compare, random, start, end) {
  const minQuickSortLength = 24;
  let length = (end - start);
  while ((length >= 24)) {
    {
      let pivotIndex = (random.nextInt(length) + start);
      let pivot = list[pivotIndex];
      let pivotKey = (keyOf)(pivot);
      let endSmaller = start;
      let startGreater = end;
      let startPivots = (end - 1);
      list[pivotIndex] = list[startPivots];
      list[startPivots] = pivot;
      while ((endSmaller < startPivots)) {
        {
          let current = list[endSmaller];
          let relation = (compare)((keyOf)(current), pivotKey);
          if ((relation < 0)) {
            {
              endSmaller = (endSmaller + 1);
            }
          } else {
            {
              startPivots = (startPivots - 1);
              let currentTarget = startPivots;
              list[endSmaller] = list[startPivots];
              if ((relation > 0)) {
                {
                  startGreater = (startGreater - 1);
                  currentTarget = startGreater;
                  list[startPivots] = list[startGreater];
                }
              }
              list[currentTarget] = current;
            }
          }
        }
      }
      if (((endSmaller - start) < (end - startGreater))) {
        {
          _quickSort(list, keyOf, compare, random, start, endSmaller);
          start = startGreater;
        }
      } else {
        {
          _quickSort(list, keyOf, compare, random, startGreater, end);
          end = endSmaller;
        }
      }
      length = (end - start);
    }
  }
  _movingInsertionSort(list, keyOf, compare, start, end, list, start);
}

const _zero = 48;

const _upperCaseA = 65;

const _upperCaseZ = 90;

const _lowerCaseA = 97;

const _lowerCaseZ = 122;

const _asciiCaseBit = 32;

function equalsIgnoreAsciiCase(a, b) {
  if (!(__dartEquals(a.length, b.length))) {
    return false;
  }
  for (let i = 0; (i < a.length); i = (i + 1)) {
    L:
    {
      let aChar = a.charCodeAt(i);
      let bChar = b.charCodeAt(i);
      if (__dartEquals(aChar, bChar)) {
        break L;
      }
      if (!(__dartEquals((aChar ^ bChar), 32))) {
        return false;
      }
      let aCharLowerCase = (aChar | 32);
      if (((97 <= aCharLowerCase) && (aCharLowerCase <= 122))) {
        {
          break L;
        }
      }
      return false;
    }
  }
  return true;
}

function hashIgnoreAsciiCase(string) {
  let hash = 0;
  for (let i = 0; (i < string.length); i = (i + 1)) {
    {
      let char = string.charCodeAt(i);
      if (((97 <= char) && (char <= 122))) {
        char = (char - 32);
      }
      hash = (536870911 & (hash + char));
      hash = (536870911 & (hash + ((524287 & hash) << 10)));
      hash = (hash >> 6);
    }
  }
  hash = (536870911 & (hash + ((67108863 & hash) << 3)));
  hash = (hash >> 11);
  return (536870911 & (hash + ((16383 & hash) << 15)));
}

function compareAsciiUpperCase(a, b) {
  let defaultResult = 0;
  for (let i = 0; (i < a.length); i = (i + 1)) {
    L:
    {
      if ((i >= b.length)) {
        return 1;
      }
      let aChar = a.charCodeAt(i);
      let bChar = b.charCodeAt(i);
      if (__dartEquals(aChar, bChar)) {
        break L;
      }
      let aUpperCase = aChar;
      let bUpperCase = bChar;
      if (((97 <= aChar) && (aChar <= 122))) {
        {
          aUpperCase = (aUpperCase - 32);
        }
      }
      if (((97 <= bChar) && (bChar <= 122))) {
        {
          bUpperCase = (bUpperCase - 32);
        }
      }
      if (!(__dartEquals(aUpperCase, bUpperCase))) {
        return (Number.isNaN(Number((aUpperCase - bUpperCase))) ? Number.NaN : (Number((aUpperCase - bUpperCase)) < 0 ? -1 : (Number((aUpperCase - bUpperCase)) > 0 ? 1 : Number((aUpperCase - bUpperCase)))));
      }
      if (__dartEquals(defaultResult, 0)) {
        defaultResult = (aChar - bChar);
      }
    }
  }
  if ((b.length > a.length)) {
    return (-1);
  }
  return (Number.isNaN(Number(defaultResult)) ? Number.NaN : (Number(defaultResult) < 0 ? -1 : (Number(defaultResult) > 0 ? 1 : Number(defaultResult))));
}

function compareAsciiLowerCase(a, b) {
  let defaultResult = 0;
  for (let i = 0; (i < a.length); i = (i + 1)) {
    L:
    {
      if ((i >= b.length)) {
        return 1;
      }
      let aChar = a.charCodeAt(i);
      let bChar = b.charCodeAt(i);
      if (__dartEquals(aChar, bChar)) {
        break L;
      }
      let aLowerCase = aChar;
      let bLowerCase = bChar;
      if (((65 <= bChar) && (bChar <= 90))) {
        {
          bLowerCase = (bLowerCase + 32);
        }
      }
      if (((65 <= aChar) && (aChar <= 90))) {
        {
          aLowerCase = (aLowerCase + 32);
        }
      }
      if (!(__dartEquals(aLowerCase, bLowerCase))) {
        return (Number.isNaN(Number((aLowerCase - bLowerCase))) ? Number.NaN : (Number((aLowerCase - bLowerCase)) < 0 ? -1 : (Number((aLowerCase - bLowerCase)) > 0 ? 1 : Number((aLowerCase - bLowerCase)))));
      }
      if (__dartEquals(defaultResult, 0)) {
        defaultResult = (aChar - bChar);
      }
    }
  }
  if ((b.length > a.length)) {
    return (-1);
  }
  return (Number.isNaN(Number(defaultResult)) ? Number.NaN : (Number(defaultResult) < 0 ? -1 : (Number(defaultResult) > 0 ? 1 : Number(defaultResult))));
}

function compareNatural(a, b) {
  for (let i = 0; (i < a.length); i = (i + 1)) {
    {
      if ((i >= b.length)) {
        return 1;
      }
      let aChar = a.charCodeAt(i);
      let bChar = b.charCodeAt(i);
      if (!(__dartEquals(aChar, bChar))) {
        {
          return _compareNaturally(a, b, i, aChar, bChar);
        }
      }
    }
  }
  if ((b.length > a.length)) {
    return (-1);
  }
  return 0;
}

function compareAsciiLowerCaseNatural(a, b) {
  let defaultResult = 0;
  for (let i = 0; (i < a.length); i = (i + 1)) {
    L:
    {
      if ((i >= b.length)) {
        return 1;
      }
      let aChar = a.charCodeAt(i);
      let bChar = b.charCodeAt(i);
      if (__dartEquals(aChar, bChar)) {
        break L;
      }
      let aLowerCase = aChar;
      let bLowerCase = bChar;
      if (((65 <= aChar) && (aChar <= 90))) {
        {
          aLowerCase = (aLowerCase + 32);
        }
      }
      if (((65 <= bChar) && (bChar <= 90))) {
        {
          bLowerCase = (bLowerCase + 32);
        }
      }
      if (!(__dartEquals(aLowerCase, bLowerCase))) {
        {
          return _compareNaturally(a, b, i, aLowerCase, bLowerCase);
        }
      }
      if (__dartEquals(defaultResult, 0)) {
        defaultResult = (aChar - bChar);
      }
    }
  }
  if ((b.length > a.length)) {
    return (-1);
  }
  return (Number.isNaN(Number(defaultResult)) ? Number.NaN : (Number(defaultResult) < 0 ? -1 : (Number(defaultResult) > 0 ? 1 : Number(defaultResult))));
}

function compareAsciiUpperCaseNatural(a, b) {
  let defaultResult = 0;
  for (let i = 0; (i < a.length); i = (i + 1)) {
    L:
    {
      if ((i >= b.length)) {
        return 1;
      }
      let aChar = a.charCodeAt(i);
      let bChar = b.charCodeAt(i);
      if (__dartEquals(aChar, bChar)) {
        break L;
      }
      let aUpperCase = aChar;
      let bUpperCase = bChar;
      if (((97 <= aChar) && (aChar <= 122))) {
        {
          aUpperCase = (aUpperCase - 32);
        }
      }
      if (((97 <= bChar) && (bChar <= 122))) {
        {
          bUpperCase = (bUpperCase - 32);
        }
      }
      if (!(__dartEquals(aUpperCase, bUpperCase))) {
        {
          return _compareNaturally(a, b, i, aUpperCase, bUpperCase);
        }
      }
      if (__dartEquals(defaultResult, 0)) {
        defaultResult = (aChar - bChar);
      }
    }
  }
  if ((b.length > a.length)) {
    return (-1);
  }
  return (Number.isNaN(Number(defaultResult)) ? Number.NaN : (Number(defaultResult) < 0 ? -1 : (Number(defaultResult) > 0 ? 1 : Number(defaultResult))));
}

function _compareNaturally(a, b, index, aChar, bChar) {
  let aIsDigit = _isDigit(aChar);
  let bIsDigit = _isDigit(bChar);
  if (aIsDigit) {
    {
      if (bIsDigit) {
        {
          return _compareNumerically(a, b, aChar, bChar, index);
        }
      } else {
        if (((index > 0) && _isDigit(a.charCodeAt((index - 1))))) {
          {
            return 1;
          }
        }
      }
    }
  } else {
    if (((bIsDigit && (index > 0)) && _isDigit(b.charCodeAt((index - 1))))) {
      {
        return (-1);
      }
    }
  }
  return (Number.isNaN(Number((aChar - bChar))) ? Number.NaN : (Number((aChar - bChar)) < 0 ? -1 : (Number((aChar - bChar)) > 0 ? 1 : Number((aChar - bChar)))));
}

function _compareNumerically(a, b, aChar, bChar, index) {
  if (_isNonZeroNumberSuffix(a, index)) {
    {
      let result = _compareDigitCount(a, b, index, index);
      if (!(__dartEquals(result, 0))) {
        return result;
      }
      return (Number.isNaN(Number((aChar - bChar))) ? Number.NaN : (Number((aChar - bChar)) < 0 ? -1 : (Number((aChar - bChar)) > 0 ? 1 : Number((aChar - bChar)))));
    }
  }
  let aIndex = index;
  let bIndex = index;
  if (__dartEquals(aChar, 48)) {
    {
      do {
        {
          aIndex = (aIndex + 1);
          if (__dartEquals(aIndex, a.length)) {
            return (-1);
          }
          aChar = a.charCodeAt(aIndex);
        }
      } while (__dartEquals(aChar, 48));
      if (!(_isDigit(aChar))) {
        return (-1);
      }
    }
  } else {
    if (__dartEquals(bChar, 48)) {
      {
        do {
          {
            bIndex = (bIndex + 1);
            if (__dartEquals(bIndex, b.length)) {
              return 1;
            }
            bChar = b.charCodeAt(bIndex);
          }
        } while (__dartEquals(bChar, 48));
        if (!(_isDigit(bChar))) {
          return 1;
        }
      }
    }
  }
  if (!(__dartEquals(aChar, bChar))) {
    {
      let result_1 = _compareDigitCount(a, b, aIndex, bIndex);
      if (!(__dartEquals(result_1, 0))) {
        return result_1;
      }
      return (Number.isNaN(Number((aChar - bChar))) ? Number.NaN : (Number((aChar - bChar)) < 0 ? -1 : (Number((aChar - bChar)) > 0 ? 1 : Number((aChar - bChar)))));
    }
  }
  L:
  while (true) {
    L_1:
    {
      let aIsDigit = false;
      let bIsDigit = false;
      aChar = 0;
      bChar = 0;
      if (((aIndex = (aIndex + 1)) < a.length)) {
        {
          aChar = a.charCodeAt(aIndex);
          aIsDigit = _isDigit(aChar);
        }
      }
      if (((bIndex = (bIndex + 1)) < b.length)) {
        {
          bChar = b.charCodeAt(bIndex);
          bIsDigit = _isDigit(bChar);
        }
      }
      if (aIsDigit) {
        {
          if (bIsDigit) {
            {
              if (__dartEquals(aChar, bChar)) {
                break L_1;
              }
              break L;
            }
          }
          return 1;
        }
      } else {
        if (bIsDigit) {
          {
            return (-1);
          }
        } else {
          {
            return (Number.isNaN(Number((aIndex - bIndex))) ? Number.NaN : (Number((aIndex - bIndex)) < 0 ? -1 : (Number((aIndex - bIndex)) > 0 ? 1 : Number((aIndex - bIndex)))));
          }
        }
      }
    }
  }
  let result_2 = _compareDigitCount(a, b, aIndex, bIndex);
  if (!(__dartEquals(result_2, 0))) {
    return result_2;
  }
  return (Number.isNaN(Number((aChar - bChar))) ? Number.NaN : (Number((aChar - bChar)) < 0 ? -1 : (Number((aChar - bChar)) > 0 ? 1 : Number((aChar - bChar)))));
}

function _compareDigitCount(a, b, i, j) {
  while (((i = (i + 1)) < a.length)) {
    L:
    {
      let aIsDigit = _isDigit(a.charCodeAt(i));
      if (__dartEquals(j = (j + 1), b.length)) {
        return (aIsDigit ? 1 : 0);
      }
      let bIsDigit = _isDigit(b.charCodeAt(j));
      if (aIsDigit) {
        {
          if (bIsDigit) {
            break L;
          }
          return 1;
        }
      } else {
        if (bIsDigit) {
          {
            return (-1);
          }
        } else {
          {
            return 0;
          }
        }
      }
    }
  }
  if ((((j = (j + 1)) < b.length) && _isDigit(b.charCodeAt(j)))) {
    {
      return (-1);
    }
  }
  return 0;
}

function _isDigit(charCode) {
  return ((charCode ^ 48) <= 9);
}

function _isNonZeroNumberSuffix(string, index) {
  while (((index = (index - 1)) >= 0)) {
    {
      let char = string.charCodeAt(index);
      if (!(__dartEquals(char, 48))) {
        return _isDigit(char);
      }
    }
  }
  return false;
}

const _hashMask = 2147483647;

function mapMap(map, { key = null, value = null } = {}) {
  let keyFn = (key ?? function(mapKey, _) { return __dartAs(mapKey, value => true, "K2"); });
  let valueFn = (value ?? function(_, mapValue) { return __dartAs(mapValue, value => true, "V2"); });
  let result = new Map([]);
  (map.forEach((value, key) => (function(mapKey, mapValue) {
    __dartMapSet(result, (keyFn)(mapKey, mapValue), (valueFn)(mapKey, mapValue));
})(key, value)), null);
  return result;
}

function mergeMaps(map1, map2, { value = null } = {}) {
  let result = __dartMapFromEntries(map1);
  if ((value === null)) {
    return (() => { let v = result; return (() => {
      __dartMapAddAll(v, map2);
      return v;
    })(); })();
  }
  (map2.forEach((value, key) => (function(key, mapValue) {
    __dartMapSet(result, key, (__dartMapContainsKey(result, key) ? (value)((__dartMapGet(result, key) ?? __dartAs(v, value => true, "V")), mapValue) : mapValue));
})(key, value)), null);
  return result;
}

function lastBy(values, key) {
  return (() => {
    const v = new Map([]);
    {
      let _sync_for_iterator = __dartIterator(values);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          __dartMapSet(v, (key)(element), element);
        }
      }
    }
    return v;
  })();
}

function groupBy(values, key) {
  let map = new Map([]);
  {
    let _sync_for_iterator = __dartIterator(values);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          ((() => { let v = map; return (() => { let v_1 = (key)(element); return (__dartMapGet(v, v_1) ?? (() => { let v_2 = new Array(0).fill(null); return (() => { let v_3 = __dartMapSet(v, v_1, v_2); return v_2; })(); })()); })(); })().push(element), null);
        }
      }
    }
  }
  return map;
}

function minBy(values, orderBy, { compare = null } = {}) {
  ((compare === null) ? compare = defaultCompare : null);
  let minValue = null;
  let minOrderBy = null;
  {
    let _sync_for_iterator = __dartIterator(values);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          let elementOrderBy = (orderBy)(element);
          if (((minOrderBy === null) || ((compare)(elementOrderBy, minOrderBy) < 0))) {
            {
              minValue = element;
              minOrderBy = elementOrderBy;
            }
          }
        }
      }
    }
  }
  return minValue;
}

function maxBy(values, orderBy, { compare = null } = {}) {
  ((compare === null) ? compare = defaultCompare : null);
  let maxValue = null;
  let maxOrderBy = null;
  {
    let _sync_for_iterator = __dartIterator(values);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          let elementOrderBy = (orderBy)(element);
          if (((maxOrderBy === null) || ((compare)(elementOrderBy, maxOrderBy) > 0))) {
            {
              maxValue = element;
              maxOrderBy = elementOrderBy;
            }
          }
        }
      }
    }
  }
  return maxValue;
}

function transitiveClosure(graph) {
  let result = new Map([]);
  (graph.forEach((value, key) => (function(vertex, edges) {
    __dartMapSet(result, vertex, __dartSetFrom(edges));
})(key, value)), null);
  let keys = Array.from(Array.from(graph.keys()));
  {
    let _sync_for_iterator = __dartIterator(keys);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let vertex1 = _sync_for_iterator.current;
        {
          {
            let _sync_for_iterator_1 = __dartIterator(keys);
            for (; _sync_for_iterator_1.moveNext(); ) {
              {
                let vertex2 = _sync_for_iterator_1.current;
                {
                  {
                    let _sync_for_iterator_2 = __dartIterator(keys);
                    for (; _sync_for_iterator_2.moveNext(); ) {
                      {
                        let vertex3 = _sync_for_iterator_2.current;
                        {
                          if ((__dartIterableContains(__dartNullCheck(__dartMapGet(result, vertex2)), vertex1) && __dartIterableContains(__dartNullCheck(__dartMapGet(result, vertex1)), vertex3))) {
                            {
                              __dartSetAdd(__dartNullCheck(__dartMapGet(result, vertex2)), vertex3);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return result;
}

function stronglyConnectedComponents(graph) {
  let index = 0;
  let stack = new Array(0).fill(null);
  let result = new Array(0).fill(null);
  let indices = new Map();
  let lowLinks = new Map();
  let onStack = new Set();
  function strongConnect(vertex) {
    __dartMapSet(indices, vertex, index);
    __dartMapSet(lowLinks, vertex, index);
    index = (index + 1);
    (stack.push(vertex), null);
    __dartSetAdd(onStack, vertex);
    {
      let _sync_for_iterator = __dartIterator(__dartNullCheck(__dartMapGet(graph, vertex)));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let successor = _sync_for_iterator.current;
          {
            if (!(__dartMapContainsKey(indices, successor))) {
              {
                strongConnect(successor);
                __dartMapSet(lowLinks, vertex, Math.min(__dartNullCheck(__dartMapGet(lowLinks, vertex)), __dartNullCheck(__dartMapGet(lowLinks, successor))));
              }
            } else {
              if (__dartIterableContains(onStack, successor)) {
                {
                  __dartMapSet(lowLinks, vertex, Math.min(__dartNullCheck(__dartMapGet(lowLinks, vertex)), __dartNullCheck(__dartMapGet(lowLinks, successor))));
                }
              }
            }
          }
        }
      }
    }
    if (__dartEquals(__dartMapGet(lowLinks, vertex), __dartMapGet(indices, vertex))) {
      {
        let component = (() => {
          const v = new Set();
          return v;
        })();
        let neighbor = null;
        do {
          {
            neighbor = stack.pop();
            __dartSetRemove(onStack, neighbor);
            __dartSetAdd(component, (neighbor ?? __dartAs(v, value => true, "T")));
          }
        } while (!(__dartEquals(neighbor, vertex)));
        (result.push(component), null);
      }
    }
  }
  {
    let _sync_for_iterator = __dartIterator(Array.from(graph.keys()));
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let vertex = _sync_for_iterator.current;
        {
          if (!(__dartMapContainsKey(indices, vertex))) {
            strongConnect(vertex);
          }
        }
      }
    }
  }
  return Array.from(Array.from(result).reverse());
}

function IterableExtension_sample(_this, count, random = null) {
  __dartCheckNotNegative(count, "count", null);
  let iterator = __dartIterator(_this);
  let chosen = new Array(0).fill(null);
  ((random === null) ? random = __dartRandom(null, false) : null);
  while ((chosen.length < count)) {
    {
      if (iterator.moveNext()) {
        {
          let nextElement = iterator.current;
          let position = random.nextInt((chosen.length + 1));
          if (__dartEquals(position, chosen.length)) {
            {
              (chosen.push(nextElement), null);
            }
          } else {
            {
              (chosen.push(chosen[position]), null);
              chosen[position] = nextElement;
            }
          }
        }
      } else {
        {
          return chosen;
        }
      }
    }
  }
  let index = count;
  while (iterator.moveNext()) {
    {
      index = (index + 1);
      let position_1 = random.nextInt(index);
      if ((position_1 < count)) {
        chosen[position_1] = iterator.current;
      }
    }
  }
  return chosen;
}

function IterableExtension_get_sample(_this) {
  return function(count, random = null) { return IterableExtension_sample(_this, count, random); };
}

function IterableExtension_whereNot(_this, test) {
  return Array.from(_this).filter(function(element) { return !((test)(element)); });
}

function IterableExtension_get_whereNot(_this) {
  return function(test) { return IterableExtension_whereNot(_this, test); };
}

function IterableExtension_sorted(_this, compare) {
  return (() => { let v = (() => {
    const v = Array.from(_this);
    return v;
  })(); return (() => {
    __dartListSort(v, compare);
    return v;
  })(); })();
}

function IterableExtension_get_sorted(_this) {
  return function(compare) { return IterableExtension_sorted(_this, compare); };
}

function IterableExtension_shuffled(_this, random = null) {
  return (() => { let v = (() => {
    const v = Array.from(_this);
    return v;
  })(); return (() => {
    __dartListShuffle(v, random);
    return v;
  })(); })();
}

function IterableExtension_get_shuffled(_this) {
  return function(random = null) { return IterableExtension_shuffled(_this, random); };
}

function IterableExtension_sortedBy(_this, keyOf) {
  let elements = (() => {
    const v = Array.from(_this);
    return v;
  })();
  mergeSortBy(elements, keyOf, compareComparable);
  return elements;
}

function IterableExtension_get_sortedBy(_this) {
  return function(keyOf) { return IterableExtension_sortedBy(_this, keyOf); };
}

function IterableExtension_get_sortedByCompare(_this) {
  return function(keyOf, compare) { return IterableExtension_sortedByCompare(_this, keyOf, compare); };
}

function IterableExtension_sortedByCompare(_this, keyOf, compare) {
  let elements = (() => {
    const v = Array.from(_this);
    return v;
  })();
  mergeSortBy(elements, keyOf, compare);
  return elements;
}

function IterableExtension_isSorted(_this, compare) {
  let iterator = __dartIterator(_this);
  if (!(iterator.moveNext())) {
    return true;
  }
  let previousElement = iterator.current;
  while (iterator.moveNext()) {
    {
      let element = iterator.current;
      if (((compare)(previousElement, element) > 0)) {
        return false;
      }
      previousElement = element;
    }
  }
  return true;
}

function IterableExtension_get_isSorted(_this) {
  return function(compare) { return IterableExtension_isSorted(_this, compare); };
}

function IterableExtension_isSortedBy(_this, keyOf) {
  let iterator = __dartIterator(_this);
  if (!(iterator.moveNext())) {
    return true;
  }
  let previousKey = (keyOf)(iterator.current);
  while (iterator.moveNext()) {
    {
      let key = (keyOf)(iterator.current);
      if ((__dartCompare(previousKey, key) > 0)) {
        return false;
      }
      previousKey = key;
    }
  }
  return true;
}

function IterableExtension_get_isSortedBy(_this) {
  return function(keyOf) { return IterableExtension_isSortedBy(_this, keyOf); };
}

function IterableExtension_isSortedByCompare(_this, keyOf, compare) {
  let iterator = __dartIterator(_this);
  if (!(iterator.moveNext())) {
    return true;
  }
  let previousKey = (keyOf)(iterator.current);
  while (iterator.moveNext()) {
    {
      let key = (keyOf)(iterator.current);
      if (((compare)(previousKey, key) > 0)) {
        return false;
      }
      previousKey = key;
    }
  }
  return true;
}

function IterableExtension_get_isSortedByCompare(_this) {
  return function(keyOf, compare) { return IterableExtension_isSortedByCompare(_this, keyOf, compare); };
}

function IterableExtension_forEachIndexed(_this, action) {
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          (action)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element);
        }
      }
    }
  }
}

function IterableExtension_get_forEachIndexed(_this) {
  return function(action) { return IterableExtension_forEachIndexed(_this, action); };
}

function IterableExtension_forEachWhile(_this, action) {
  L:
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if (!((action)(element))) {
            break L;
          }
        }
      }
    }
  }
}

function IterableExtension_get_forEachWhile(_this) {
  return function(action) { return IterableExtension_forEachWhile(_this, action); };
}

function IterableExtension_forEachIndexedWhile(_this, action) {
  let index = 0;
  L:
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if (!((action)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element))) {
            break L;
          }
        }
      }
    }
  }
}

function IterableExtension_get_forEachIndexedWhile(_this) {
  return function(action) { return IterableExtension_forEachIndexedWhile(_this, action); };
}

function* IterableExtension_mapIndexed(_this, convert) {
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          yield (convert)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element);
        }
      }
    }
  }
}

function IterableExtension_get_mapIndexed(_this) {
  return function(convert) { return IterableExtension_mapIndexed(_this, convert); };
}

function* IterableExtension_whereIndexed(_this, test) {
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element)) {
            yield element;
          }
        }
      }
    }
  }
}

function IterableExtension_get_whereIndexed(_this) {
  return function(test) { return IterableExtension_whereIndexed(_this, test); };
}

function* IterableExtension_whereNotIndexed(_this, test) {
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if (!((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element))) {
            yield element;
          }
        }
      }
    }
  }
}

function IterableExtension_get_whereNotIndexed(_this) {
  return function(test) { return IterableExtension_whereNotIndexed(_this, test); };
}

function* IterableExtension_expandIndexed(_this, expand) {
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          yield* (expand)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element);
        }
      }
    }
  }
}

function IterableExtension_get_expandIndexed(_this) {
  return function(expand) { return IterableExtension_expandIndexed(_this, expand); };
}

function IterableExtension_reduceIndexed(_this, combine) {
  let iterator = __dartIterator(_this);
  if (!(iterator.moveNext())) {
    {
      (() => { throw __dartCoreError("StateError", "no elements"); })();
    }
  }
  let index = 1;
  let result = iterator.current;
  while (iterator.moveNext()) {
    {
      result = (combine)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), result, iterator.current);
    }
  }
  return result;
}

function IterableExtension_get_reduceIndexed(_this) {
  return function(combine) { return IterableExtension_reduceIndexed(_this, combine); };
}

function IterableExtension_foldIndexed(_this, initialValue, combine) {
  let result = initialValue;
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          result = (combine)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), result, element);
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_foldIndexed(_this) {
  return function(initialValue, combine) { return IterableExtension_foldIndexed(_this, initialValue, combine); };
}

function IterableExtension_get_firstWhereOrNull(_this) {
  return function(test) { return IterableExtension_firstWhereOrNull(_this, test); };
}

function IterableExtension_firstWhereOrNull(_this, test) {
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)(element)) {
            return element;
          }
        }
      }
    }
  }
  return null;
}

function IterableExtension_firstWhereIndexedOrNull(_this, test) {
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element)) {
            return element;
          }
        }
      }
    }
  }
  return null;
}

function IterableExtension_get_firstWhereIndexedOrNull(_this) {
  return function(test) { return IterableExtension_firstWhereIndexedOrNull(_this, test); };
}

function IterableExtension_get_firstOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    return iterator.current;
  }
  return null;
}

function IterableExtension_lastWhereOrNull(_this, test) {
  let result = null;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)(element)) {
            result = element;
          }
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_lastWhereOrNull(_this) {
  return function(test) { return IterableExtension_lastWhereOrNull(_this, test); };
}

function IterableExtension_lastWhereIndexedOrNull(_this, test) {
  let result = null;
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element)) {
            result = element;
          }
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_lastWhereIndexedOrNull(_this) {
  return function(test) { return IterableExtension_lastWhereIndexedOrNull(_this, test); };
}

function IterableExtension_get_lastOrNull(_this) {
  if (__dartIterableIsEmpty(_this)) {
    return null;
  }
  return __dartIterableLast(_this);
}

function IterableExtension_singleWhereOrNull(_this, test) {
  let result = null;
  let found = false;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)(element)) {
            {
              if (!(found)) {
                {
                  result = element;
                  found = true;
                }
              } else {
                {
                  return null;
                }
              }
            }
          }
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_singleWhereOrNull(_this) {
  return function(test) { return IterableExtension_singleWhereOrNull(_this, test); };
}

function IterableExtension_get_singleWhereIndexedOrNull(_this) {
  return function(test) { return IterableExtension_singleWhereIndexedOrNull(_this, test); };
}

function IterableExtension_singleWhereIndexedOrNull(_this, test) {
  let result = null;
  let found = false;
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element)) {
            {
              if (!(found)) {
                {
                  result = element;
                  found = true;
                }
              } else {
                {
                  return null;
                }
              }
            }
          }
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_singleOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let result = iterator.current;
      if (!(iterator.moveNext())) {
        {
          return result;
        }
      }
    }
  }
  return null;
}

function IterableExtension_elementAtOrNull(_this, index) {
  return IterableExtension_get_firstOrNull(Array.from(_this).slice(index));
}

function IterableExtension_get_elementAtOrNull(_this) {
  return function(index) { return IterableExtension_elementAtOrNull(_this, index); };
}

function IterableExtension_lastBy(_this, key) {
  return lastBy(_this, key);
}

function IterableExtension_get_lastBy(_this) {
  return function(key) { return IterableExtension_lastBy(_this, key); };
}

function IterableExtension_groupFoldBy(_this, keyOf, combine) {
  let result = new Map([]);
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          let key = (keyOf)(element);
          __dartMapSet(result, key, (combine)(__dartMapGet(result, key), element));
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_groupFoldBy(_this) {
  return function(keyOf, combine) { return IterableExtension_groupFoldBy(_this, keyOf, combine); };
}

function IterableExtension_groupSetsBy(_this, keyOf) {
  let result = new Map([]);
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          __dartSetAdd((() => { let v = result; return (() => { let v_1 = (keyOf)(element); return (__dartMapGet(v, v_1) ?? (() => { let v_2 = (() => {
            const v = new Set();
            return v;
          })(); return (() => { let v_3 = __dartMapSet(v, v_1, v_2); return v_2; })(); })()); })(); })(), element);
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_groupSetsBy(_this) {
  return function(keyOf) { return IterableExtension_groupSetsBy(_this, keyOf); };
}

function IterableExtension_groupListsBy(_this, keyOf) {
  let result = new Map([]);
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          ((() => { let v = result; return (() => { let v_1 = (keyOf)(element); return (__dartMapGet(v, v_1) ?? (() => { let v_2 = new Array(0).fill(null); return (() => { let v_3 = __dartMapSet(v, v_1, v_2); return v_2; })(); })()); })(); })().push(element), null);
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_groupListsBy(_this) {
  return function(keyOf) { return IterableExtension_groupListsBy(_this, keyOf); };
}

function IterableExtension_get_splitBefore(_this) {
  return function(test) { return IterableExtension_splitBefore(_this, test); };
}

function IterableExtension_splitBefore(_this, test) {
  return IterableExtension_splitBeforeIndexed(_this, function(_, element) { return (test)(element); });
}

function IterableExtension_splitAfter(_this, test) {
  return IterableExtension_splitAfterIndexed(_this, function(_, element) { return (test)(element); });
}

function IterableExtension_get_splitAfter(_this) {
  return function(test) { return IterableExtension_splitAfter(_this, test); };
}

function IterableExtension_splitBetween(_this, test) {
  return IterableExtension_splitBetweenIndexed(_this, function(_, first, second) { return (test)(first, second); });
}

function IterableExtension_get_splitBetween(_this) {
  return function(test) { return IterableExtension_splitBetween(_this, test); };
}

function* IterableExtension_splitBeforeIndexed(_this, test) {
  let iterator = __dartIterator(_this);
  if (!(iterator.moveNext())) {
    {
      return;
    }
  }
  let index = 1;
  let chunk = [iterator.current];
  while (iterator.moveNext()) {
    {
      let element = iterator.current;
      if ((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element)) {
        {
          yield chunk;
          chunk = new Array(0).fill(null);
        }
      }
      (chunk.push(element), null);
    }
  }
  yield chunk;
}

function IterableExtension_get_splitBeforeIndexed(_this) {
  return function(test) { return IterableExtension_splitBeforeIndexed(_this, test); };
}

function* IterableExtension_splitAfterIndexed(_this, test) {
  let index = 0;
  let chunk = null;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          ((chunk ?? (chunk = new Array(0).fill(null))).push(element), null);
          if ((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element)) {
            {
              yield chunk;
              chunk = null;
            }
          }
        }
      }
    }
  }
  if (!((chunk === null))) {
    yield chunk;
  }
}

function IterableExtension_get_splitAfterIndexed(_this) {
  return function(test) { return IterableExtension_splitAfterIndexed(_this, test); };
}

function* IterableExtension_splitBetweenIndexed(_this, test) {
  let iterator = __dartIterator(_this);
  if (!(iterator.moveNext())) {
    return;
  }
  let previous = iterator.current;
  let chunk = [previous];
  let index = 1;
  while (iterator.moveNext()) {
    {
      let element = iterator.current;
      if ((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), previous, element)) {
        {
          yield chunk;
          chunk = new Array(0).fill(null);
        }
      }
      (chunk.push(element), null);
      previous = element;
    }
  }
  yield chunk;
}

function IterableExtension_get_splitBetweenIndexed(_this) {
  return function(test) { return IterableExtension_splitBetweenIndexed(_this, test); };
}

function IterableExtension_get_none(_this) {
  return function(test) { return IterableExtension_none(_this, test); };
}

function IterableExtension_none(_this, test) {
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)(element)) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

function* IterableExtension_slices(_this, length) {
  if ((length < 1)) {
    (() => { throw __dartCoreError("RangeError", length); })();
  }
  let iterator = __dartIterator(_this);
  while (iterator.moveNext()) {
    {
      let slice = [iterator.current];
      for (let i = 1; ((i < length) && iterator.moveNext()); i = (i + 1)) {
        {
          (slice.push(iterator.current), null);
        }
      }
      yield slice;
    }
  }
}

function IterableExtension_get_slices(_this) {
  return function(length) { return IterableExtension_slices(_this, length); };
}

function* IterableNullableExtension_whereNotNull(_this) {
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if (!((element === null))) {
            yield element;
          }
        }
      }
    }
  }
}

function IterableNullableExtension_get_whereNotNull(_this) {
  return function() { return IterableNullableExtension_whereNotNull(_this); };
}

function IterableNumberExtension_get_minOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      if (Number.isNaN(Number(value))) {
        {
          return value;
        }
      }
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if (Number.isNaN(Number(newValue))) {
            {
              return newValue;
            }
          }
          if ((newValue < value)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableNumberExtension_get_min(_this) {
  return (IterableNumberExtension_get_minOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableNumberExtension_get_maxOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      if (Number.isNaN(Number(value))) {
        {
          return value;
        }
      }
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if (Number.isNaN(Number(newValue))) {
            {
              return newValue;
            }
          }
          if ((newValue > value)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableNumberExtension_get_max(_this) {
  return (IterableNumberExtension_get_maxOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableNumberExtension_get_sum(_this) {
  let result = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let value = _sync_for_iterator.current;
        {
          result = (result + value);
        }
      }
    }
  }
  return result;
}

function IterableNumberExtension_get_average(_this) {
  let result = 0.0;
  let count = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let value = _sync_for_iterator.current;
        {
          count = (count + 1);
          result = (result + ((value - result) / count));
        }
      }
    }
  }
  if (__dartEquals(count, 0)) {
    (() => { throw __dartCoreError("StateError", "No elements"); })();
  }
  return result;
}

function IterableIntegerExtension_get_minOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if ((newValue < value)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableIntegerExtension_get_min(_this) {
  return (IterableIntegerExtension_get_minOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableIntegerExtension_get_maxOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if ((newValue > value)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableIntegerExtension_get_max(_this) {
  return (IterableIntegerExtension_get_maxOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableIntegerExtension_get_sum(_this) {
  let result = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let value = _sync_for_iterator.current;
        {
          result = (result + value);
        }
      }
    }
  }
  return result;
}

function IterableIntegerExtension_get_average(_this) {
  let average = 0;
  let remainder = 0;
  let count = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let value = _sync_for_iterator.current;
        {
          count = (count + 1);
          let delta = ((value - average) + remainder);
          average = (average + __dartTruncDiv(delta, count));
          remainder = (delta % count);
        }
      }
    }
  }
  if (__dartEquals(count, 0)) {
    (() => { throw __dartCoreError("StateError", "No elements"); })();
  }
  return (average + (remainder / count));
}

function IterableDoubleExtension_get_minOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      if (Number.isNaN(Number(value))) {
        {
          return value;
        }
      }
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if (Number.isNaN(Number(newValue))) {
            {
              return newValue;
            }
          }
          if ((newValue < value)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableDoubleExtension_get_min(_this) {
  return (IterableDoubleExtension_get_minOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableDoubleExtension_get_maxOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      if (Number.isNaN(Number(value))) {
        {
          return value;
        }
      }
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if (Number.isNaN(Number(newValue))) {
            {
              return newValue;
            }
          }
          if ((newValue > value)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableDoubleExtension_get_max(_this) {
  return (IterableDoubleExtension_get_maxOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableDoubleExtension_get_sum(_this) {
  let result = 0.0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let value = _sync_for_iterator.current;
        {
          result = (result + value);
        }
      }
    }
  }
  return result;
}

function* IterableIterableExtension_get_flattened(_this) {
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let elements = _sync_for_iterator.current;
        {
          yield* elements;
        }
      }
    }
  }
}

function IterableIterableExtension_get_flattenedToList(_this) {
  return (() => {
    const v = new Array(0).fill(null);
    {
      let _sync_for_iterator = __dartIterator(_this);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          const elements = _sync_for_iterator.current;
          (v.push(...Array.from(elements)), null);
        }
      }
    }
    return v;
  })();
}

function IterableIterableExtension_get_flattenedToSet(_this) {
  return (() => {
    const v = new Set();
    {
      let _sync_for_iterator = __dartIterator(_this);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          const elements = _sync_for_iterator.current;
          {
            let _sync_for_iterator_1 = __dartIterator(elements);
            for (; _sync_for_iterator_1.moveNext(); ) {
              {
                const v_1 = _sync_for_iterator_1.current;
                {
                  const v_2 = __dartAs(v_1, value => true, "T");
                  __dartSetAdd(v, v_2);
                }
              }
            }
          }
        }
      }
    }
    return v;
  })();
}

function IterableComparableExtension_get_minOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if ((__dartCompare(value, newValue) > 0)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableComparableExtension_get_min(_this) {
  return (IterableComparableExtension_get_minOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableComparableExtension_get_maxOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if ((__dartCompare(value, newValue) < 0)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableComparableExtension_get_max(_this) {
  return (IterableComparableExtension_get_maxOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableComparableExtension_sorted(_this, compare = null) {
  return (() => { let v = (() => {
    const v = Array.from(_this);
    return v;
  })(); return (() => {
    __dartListSort(v, compare);
    return v;
  })(); })();
}

function IterableComparableExtension_get_sorted(_this) {
  return function(compare = null) { return IterableComparableExtension_sorted(_this, compare); };
}

function IterableComparableExtension_isSorted(_this, compare = null) {
  if (!((compare === null))) {
    {
      return IterableExtension_isSorted(_this, compare);
    }
  }
  let iterator = __dartIterator(_this);
  if (!(iterator.moveNext())) {
    return true;
  }
  let previousElement = iterator.current;
  while (iterator.moveNext()) {
    {
      let element = iterator.current;
      if ((__dartCompare(previousElement, element) > 0)) {
        return false;
      }
      previousElement = element;
    }
  }
  return true;
}

function IterableComparableExtension_get_isSorted(_this) {
  return function(compare = null) { return IterableComparableExtension_isSorted(_this, compare); };
}

function ComparatorExtension_get_inverse(_this) {
  return function(a, b) { return (_this)(b, a); };
}

function ComparatorExtension_compareBy(_this, keyOf) {
  return function(a, b) { return (_this)((keyOf)(a), (keyOf)(b)); };
}

function ComparatorExtension_get_compareBy(_this) {
  return function(keyOf) { return ComparatorExtension_compareBy(_this, keyOf); };
}

function ComparatorExtension_then(_this, tieBreaker) {
  return function(a, b) {
    let result = (_this)(a, b);
    if (__dartEquals(result, 0)) {
      result = (tieBreaker)(a, b);
    }
    return result;
};
}

function ComparatorExtension_get_then(_this) {
  return function(tieBreaker) { return ComparatorExtension_then(_this, tieBreaker); };
}

function ListExtensions_binarySearch(_this, element, compare) {
  return binarySearchBy(_this, identity, compare, element);
}

function ListExtensions_get_binarySearch(_this) {
  return function(element, compare) { return ListExtensions_binarySearch(_this, element, compare); };
}

function ListExtensions_binarySearchByCompare(_this, element, keyOf, compare, start = 0, end = null) {
  return binarySearchBy(_this, keyOf, compare, element, start, end);
}

function ListExtensions_get_binarySearchByCompare(_this) {
  return function(element, keyOf, compare, start = 0, end = null) { return ListExtensions_binarySearchByCompare(_this, element, keyOf, compare, start, end); };
}

function ListExtensions_binarySearchBy(_this, element, keyOf, start = 0, end = null) {
  return binarySearchBy(_this, keyOf, function(a, b) { return __dartCompare(a, b); }, element, start, end);
}

function ListExtensions_get_binarySearchBy(_this) {
  return function(element, keyOf, start = 0, end = null) { return ListExtensions_binarySearchBy(_this, element, keyOf, start, end); };
}

function ListExtensions_lowerBound(_this, element, compare) {
  return lowerBoundBy(_this, identity, compare, element);
}

function ListExtensions_get_lowerBound(_this) {
  return function(element, compare) { return ListExtensions_lowerBound(_this, element, compare); };
}

function ListExtensions_lowerBoundByCompare(_this, element, keyOf, compare, start = 0, end = null) {
  return lowerBoundBy(_this, keyOf, compare, element, start, end);
}

function ListExtensions_get_lowerBoundByCompare(_this) {
  return function(element, keyOf, compare, start = 0, end = null) { return ListExtensions_lowerBoundByCompare(_this, element, keyOf, compare, start, end); };
}

function ListExtensions_lowerBoundBy(_this, element, keyOf, start = 0, end = null) {
  return lowerBoundBy(_this, keyOf, compareComparable, element, start, end);
}

function ListExtensions_get_lowerBoundBy(_this) {
  return function(element, keyOf, start = 0, end = null) { return ListExtensions_lowerBoundBy(_this, element, keyOf, start, end); };
}

function ListExtensions_forEachIndexed(_this, action) {
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      (action)(index, _this[index]);
    }
  }
}

function ListExtensions_get_forEachIndexed(_this) {
  return function(action) { return ListExtensions_forEachIndexed(_this, action); };
}

function ListExtensions_forEachWhile(_this, action) {
  L:
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      if (!((action)(_this[index]))) {
        break L;
      }
    }
  }
}

function ListExtensions_get_forEachWhile(_this) {
  return function(action) { return ListExtensions_forEachWhile(_this, action); };
}

function ListExtensions_get_forEachIndexedWhile(_this) {
  return function(action) { return ListExtensions_forEachIndexedWhile(_this, action); };
}

function ListExtensions_forEachIndexedWhile(_this, action) {
  L:
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      if (!((action)(index, _this[index]))) {
        break L;
      }
    }
  }
}

function* ListExtensions_mapIndexed(_this, convert) {
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      yield (convert)(index, _this[index]);
    }
  }
}

function ListExtensions_get_mapIndexed(_this) {
  return function(convert) { return ListExtensions_mapIndexed(_this, convert); };
}

function* ListExtensions_whereIndexed(_this, test) {
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      let element = _this[index];
      if ((test)(index, element)) {
        yield element;
      }
    }
  }
}

function ListExtensions_get_whereIndexed(_this) {
  return function(test) { return ListExtensions_whereIndexed(_this, test); };
}

function* ListExtensions_whereNotIndexed(_this, test) {
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      let element = _this[index];
      if (!((test)(index, element))) {
        yield element;
      }
    }
  }
}

function ListExtensions_get_whereNotIndexed(_this) {
  return function(test) { return ListExtensions_whereNotIndexed(_this, test); };
}

function* ListExtensions_expandIndexed(_this, expand) {
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      yield* (expand)(index, _this[index]);
    }
  }
}

function ListExtensions_get_expandIndexed(_this) {
  return function(expand) { return ListExtensions_expandIndexed(_this, expand); };
}

function ListExtensions_sortRange(_this, start, end, compare) {
  quickSortBy(_this, identity, compare, start, end);
}

function ListExtensions_get_sortRange(_this) {
  return function(start, end, compare) { return ListExtensions_sortRange(_this, start, end, compare); };
}

function ListExtensions_sortByCompare(_this, keyOf, compare, start = 0, end = null) {
  quickSortBy(_this, keyOf, compare, start, end);
}

function ListExtensions_get_sortByCompare(_this) {
  return function(keyOf, compare, start = 0, end = null) { return ListExtensions_sortByCompare(_this, keyOf, compare, start, end); };
}

function ListExtensions_sortBy(_this, keyOf, start = 0, end = null) {
  quickSortBy(_this, keyOf, compareComparable, start, end);
}

function ListExtensions_get_sortBy(_this) {
  return function(keyOf, start = 0, end = null) { return ListExtensions_sortBy(_this, keyOf, start, end); };
}

function ListExtensions_shuffleRange(_this, start, end, random = null) {
  __dartCheckValidRange(start, end, _this.length, null, null, null);
  shuffle(_this, start, end, random);
}

function ListExtensions_get_shuffleRange(_this) {
  return function(start, end, random = null) { return ListExtensions_shuffleRange(_this, start, end, random); };
}

function ListExtensions_reverseRange(_this, start, end) {
  __dartCheckValidRange(start, end, _this.length, null, null, null);
  while ((start < (end = (end - 1)))) {
    {
      let tmp = _this[start];
      _this[start] = _this[end];
      _this[end] = tmp;
      start = (start + 1);
    }
  }
}

function ListExtensions_get_reverseRange(_this) {
  return function(start, end) { return ListExtensions_reverseRange(_this, start, end); };
}

function ListExtensions_swap(_this, index1, index2) {
  __dartCheckValidIndex(index1, _this, "index1", null, null);
  __dartCheckValidIndex(index2, _this, "index2", null, null);
  let tmp = _this[index1];
  _this[index1] = _this[index2];
  _this[index2] = tmp;
}

function ListExtensions_get_swap(_this) {
  return function(index1, index2) { return ListExtensions_swap(_this, index1, index2); };
}

function ListExtensions_slice(_this, start, end = null) {
  end = __dartCheckValidRange(start, end, _this.length, null, null, null);
  let self = _this;
  if (self instanceof ListSlice) {
    return self.slice(start, end);
  }
  return new ListSlice(_this, start, end);
}

function ListExtensions_get_slice(_this) {
  return function(start, end = null) { return ListExtensions_slice(_this, start, end); };
}

function ListExtensions_equals(_this, other, equality = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
  if (!(__dartEquals(_this.length, other.length))) {
    return false;
  }
  for (let i = 0; (i < _this.length); i = (i + 1)) {
    {
      if (!(equality.equals(_this[i], other[i]))) {
        return false;
      }
    }
  }
  return true;
}

function ListExtensions_get_equals(_this) {
  return function(other, equality = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) { return ListExtensions_equals(_this, other, equality); };
}

function ListExtensions_elementAtOrNull(_this, index) {
  return ((index < _this.length) ? _this[index] : null);
}

function ListExtensions_get_elementAtOrNull(_this) {
  return function(index) { return ListExtensions_elementAtOrNull(_this, index); };
}

function* ListExtensions_slices(_this, length) {
  if ((length < 1)) {
    (() => { throw __dartCoreError("RangeError", length); })();
  }
  for (let i = 0; (i < _this.length); i = (i + length)) {
    {
      yield ListExtensions_slice(_this, i, Math.min((i + length), _this.length));
    }
  }
}

function ListExtensions_get_slices(_this) {
  return function(length) { return ListExtensions_slices(_this, length); };
}

function ListComparableExtensions_binarySearch(_this, element, compare = null) {
  return binarySearchBy(_this, identity, (compare ?? compareComparable), element);
}

function ListComparableExtensions_get_binarySearch(_this) {
  return function(element, compare = null) { return ListComparableExtensions_binarySearch(_this, element, compare); };
}

function ListComparableExtensions_lowerBound(_this, element, compare = null) {
  return lowerBoundBy(_this, identity, (compare ?? compareComparable), element);
}

function ListComparableExtensions_get_lowerBound(_this) {
  return function(element, compare = null) { return ListComparableExtensions_lowerBound(_this, element, compare); };
}

function ListComparableExtensions_sortRange(_this, start, end, compare = null) {
  __dartCheckValidRange(start, end, _this.length, null, null, null);
  quickSortBy(_this, identity, (compare ?? compareComparable), start, end);
}

function ListComparableExtensions_get_sortRange(_this) {
  return function(start, end, compare = null) { return ListComparableExtensions_sortRange(_this, start, end, compare); };
}

function StreamSinkExtensions_transform(_this, transformer) {
  return transformer.bind(_this);
}

function StreamSinkExtensions_get_transform(_this) {
  return function(transformer) { return StreamSinkExtensions_transform(_this, transformer); };
}

function StreamSinkExtensions_rejectErrors(_this) {
  return new RejectErrorsSink(_this);
}

function StreamSinkExtensions_get_rejectErrors(_this) {
  return function() { return StreamSinkExtensions_rejectErrors(_this); };
}

function subscriptionTransformer({ handleCancel = null, handlePause = null, handleResume = null } = {}) {
  return Object.freeze({ bind(stream) { return __dartBoundSubscriptionStream(stream, function(stream, cancelOnError) { return new _TransformedSubscription(__dartStreamListen(stream, null, null, null, cancelOnError), (handleCancel ?? function(inner) { return inner.cancel(); }), (handlePause ?? function(inner) {
    inner.pause();
}), (handleResume ?? function(inner) {
    inner.resume();
})); }); } });
}

function typedStreamTransformer(transformer) {
  return (transformer != null && typeof transformer === "object" && typeof transformer.bind === "function" ? transformer : new _TypeSafeStreamTransformer(transformer));
}

export async function main() {
  const result = await Result.capture(Promise.resolve(42));
  const queue = new StreamQueue(__dartStreamFromIterable([1, 2, 3]));
  const first = await queue.next;
  await queue.skip(1);
  const last = await queue.next;
  await queue.cancel();
  const group = new StreamGroup();
  const groupedFuture = __dartStreamToList(group.stream);
  group.add(__dartStreamFromIterable([4, 5]));
  await group.close();
  const grouped = await groupedFuture;
  const cache = AsyncCache.ephemeral();
  const cached = await cache.fetch(function() { return Promise.resolve("cached"); });
  __dartPrint("async " + __dartStr(__dartNullCheck(result.asValue).value) + " " + __dartStr(first) + " " + __dartStr(last) + " " + __dartStr(__dartIterableJoin(grouped, "|")) + " " + __dartStr(cached));
}


function $CaptureSink_new_tearoff(sink) {
  return new CaptureSink(sink);
}

function $ValueResult_new_tearoff(value) {
  return new ValueResult(value);
}

function $ErrorResult_new_tearoff(error, stackTrace = null) {
  return new ErrorResult(error, stackTrace);
}
await main();
