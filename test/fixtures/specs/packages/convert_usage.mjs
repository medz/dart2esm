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
    writeAll(values, separator = "") { const parts = []; if (values != null && typeof values["[]"] === "function" && typeof values.length === "number") { for (let index = 0; index < values.length; index++) parts.push(String(values["[]"](index))); } else { for (const item of values) parts.push(String(item)); } value += parts.join(String(separator)); },
    writeCharCode(charCode) { value += String.fromCodePoint(charCode); },
    writeln(next = "") { value += String(next) + "\n"; },
    clear() { value = ""; },
    toString() { return value; },
    get length() { return value.length; },
    get isEmpty() { return value.length === 0; },
    get isNotEmpty() { return value.length !== 0; },
  };
}
function __dartDurationToString(micros) {
  const sign = micros < 0 ? "-" : "";
  let rest = Math.abs(micros);
  const microseconds = rest % 1000000;
  const totalSeconds = Math.trunc(rest / 1000000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.trunc(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.trunc(totalMinutes / 60);
  return sign + hours + ":" + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0") + "." + String(microseconds).padStart(6, "0");
}
function __dartDuration(options = {}) {
  const micros = Math.trunc((options.days ?? 0) * 86400000000 + (options.hours ?? 0) * 3600000000 + (options.minutes ?? 0) * 60000000 + (options.seconds ?? 0) * 1000000 + (options.milliseconds ?? 0) * 1000 + (options.microseconds ?? 0));
  return {
    get inDays() { return Math.trunc(micros / 86400000000); },
    get inHours() { return Math.trunc(micros / 3600000000); },
    get inMinutes() { return Math.trunc(micros / 60000000); },
    get inSeconds() { return Math.trunc(micros / 1000000); },
    get inMilliseconds() { return Math.trunc(micros / 1000); },
    get inMicroseconds() { return micros; },
    get isNegative() { return micros < 0; },
    get hashCode() { return micros & 0x1fffffff; },
    "=="(other) { return other != null && other.inMicroseconds === micros; },
    compareTo(other) { const diff = micros - other.inMicroseconds; return diff < 0 ? -1 : diff > 0 ? 1 : 0; },
    abs() { return __dartDuration({ microseconds: Math.abs(micros) }); },
    toString() { return __dartDurationToString(micros); },
  };
}
function __dartDateTimeFromParts(isUtc, year, month = 1, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0, microsecond = 0) {
  const millis = isUtc ? Date.UTC(year, month - 1, day, hour, minute, second, millisecond) : new Date(year, month - 1, day, hour, minute, second, millisecond).getTime();
  return __dartDateTimeFromMicros(millis * 1000 + microsecond, isUtc);
}
function __dartDateTimeFromMicros(micros, isUtc) {
  const millis = Math.floor(micros / 1000);
  const microsecond = ((micros % 1000) + 1000) % 1000;
  return __dartDateTime(millis, isUtc, microsecond);
}
function __dartDateTime(millis, isUtc = false, microsecond = 0) {
  const date = new Date(millis);
  const read = (utcName, localName) => isUtc ? date[utcName]() : date[localName]();
  return {
    get millisecondsSinceEpoch() { return millis; },
    get microsecondsSinceEpoch() { return millis * 1000 + microsecond; },
    get microsecond() { return microsecond; },
    get millisecond() { return read("getUTCMilliseconds", "getMilliseconds"); },
    get second() { return read("getUTCSeconds", "getSeconds"); },
    get minute() { return read("getUTCMinutes", "getMinutes"); },
    get hour() { return read("getUTCHours", "getHours"); },
    get day() { return read("getUTCDate", "getDate"); },
    get month() { return read("getUTCMonth", "getMonth") + 1; },
    get year() { return read("getUTCFullYear", "getFullYear"); },
    get weekday() { const day = read("getUTCDay", "getDay"); return day === 0 ? 7 : day; },
    get isUtc() { return isUtc; },
    get timeZoneName() { return isUtc ? "UTC" : ""; },
    get timeZoneOffset() { return __dartDuration({ minutes: isUtc ? 0 : -date.getTimezoneOffset() }); },
    get hashCode() { return this.microsecondsSinceEpoch & 0x1fffffff; },
    "=="(other) { return other != null && typeof other.microsecondsSinceEpoch === "number" && this.microsecondsSinceEpoch === other.microsecondsSinceEpoch; },
    compareTo(other) { const diff = this.microsecondsSinceEpoch - other.microsecondsSinceEpoch; return diff < 0 ? -1 : diff > 0 ? 1 : 0; },
    isBefore(other) { return this.microsecondsSinceEpoch < other.microsecondsSinceEpoch; },
    isAfter(other) { return this.microsecondsSinceEpoch > other.microsecondsSinceEpoch; },
    isAtSameMomentAs(other) { return this.microsecondsSinceEpoch === other.microsecondsSinceEpoch; },
    add(duration) { return __dartDateTimeFromMicros(this.microsecondsSinceEpoch + duration.inMicroseconds, isUtc); },
    subtract(duration) { return __dartDateTimeFromMicros(this.microsecondsSinceEpoch - duration.inMicroseconds, isUtc); },
    difference(other) { return __dartDuration({ microseconds: this.microsecondsSinceEpoch - other.microsecondsSinceEpoch }); },
    toUtc() { return __dartDateTime(millis, true, microsecond); },
    toLocal() { return __dartDateTime(millis, false, microsecond); },
    toIso8601String() { const text = date.toISOString(); return microsecond === 0 ? text : text.replace(/(\.\d{3})Z$/, "$1" + String(microsecond).padStart(3, "0") + "Z"); },
    toString() { return this.toIso8601String(); },
  };
}
function __dartDateTimeParse(source, tryParse = false) {
  const text = String(source);
  const millis = Date.parse(text);
  if (Number.isNaN(millis)) {
    if (tryParse) return null;
    throw __dartCoreError("FormatException", "Invalid date format");
  }
  const isUtc = /(?:z|[+-]\d\d(?::?\d\d)?)$/i.test(text);
  const fraction = /\.(\d+)/.exec(text);
  const microsecond = fraction == null ? 0 : Number((fraction[1] + "000000").slice(0, 6).slice(3));
  return __dartDateTime(millis, isUtc, microsecond);
}
function __dartDateTimeCopyWith(value, options = {}) {
  const isUtc = options.isUtc ?? value.isUtc;
  return __dartDateTimeFromParts(isUtc, options.year ?? value.year, options.month ?? value.month, options.day ?? value.day, options.hour ?? value.hour, options.minute ?? value.minute, options.second ?? value.second, options.millisecond ?? value.millisecond, options.microsecond ?? value.microsecond);
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
function __dartIndexGet(receiver, index) {
  if (Array.isArray(receiver) || (ArrayBuffer.isView(receiver) && !(receiver instanceof DataView)) || typeof receiver === "string") return receiver[index];
  const op = receiver?.["[]"];
  if (typeof op === "function") return op.call(receiver, index);
  return receiver[index];
}
function __dartIndexSet(receiver, index, value) {
  if (Array.isArray(receiver) || (ArrayBuffer.isView(receiver) && !(receiver instanceof DataView))) { receiver[index] = value; return value; }
  const op = receiver?.["[]="];
  if (typeof op === "function") return op.call(receiver, index, value);
  receiver[index] = value;
  return value;
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
function __dartCustomHashMap(equals = null, hashCode = null, isValidKey = null) {
  const map = new Map();
  Object.defineProperty(map, "__dartMapEquals", { value: equals });
  Object.defineProperty(map, "__dartMapHashCode", { value: hashCode });
  Object.defineProperty(map, "__dartMapIsValidKey", { value: isValidKey });
  return map;
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
    if (__dartEquals(__dartIndexGet(list, index), needle)) return index;
  }
  return -1;
}
function __dartListLastIndexOf(list, needle, start = null) {
  let index = start == null ? list.length - 1 : Math.trunc(start);
  if (index >= list.length) index = list.length - 1;
  for (; index >= 0; index--) {
    if (__dartEquals(__dartIndexGet(list, index), needle)) return index;
  }
  return -1;
}
function __dartListSetAll(list, index, values) {
  let offset = 0;
  for (const value of values) {
    __dartIndexSet(list, index + offset, value);
    offset++;
  }
  return null;
}
function __dartListLastIndexWhere(list, test, start = null) {
  for (let index = start == null ? list.length - 1 : start; index >= 0; index--) {
    if (test(__dartIndexGet(list, index))) return index;
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
    get(key) { return Number.isInteger(key) && key >= 0 && key < list.length ? __dartIndexGet(list, key) : undefined; }
    has(key) { return Number.isInteger(key) && key >= 0 && key < list.length; }
    entries() { return Array.from({ length: list.length }, (_, index) => [index, __dartIndexGet(list, index)])[Symbol.iterator](); }
    keys() { return Array.from({ length: list.length }, (_, index) => index)[Symbol.iterator](); }
    values() { return Array.from({ length: list.length }, (_, index) => __dartIndexGet(list, index))[Symbol.iterator](); }
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
  if (iterable != null && typeof iterable["[]"] === "function" && typeof iterable.length === "number") {
    const values = [];
    for (let index = 0; index < iterable.length; index++) values.push(__dartStr(iterable["[]"](index)));
    return values.join(String(separator));
  }
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
function __dartListSetRange(target, start, end, source, skipCount = 0) {
  const values = [];
  const count = end - start;
  for (let index = 0; index < count; index++) values.push(__dartIndexGet(source, skipCount + index));
  for (let index = 0; index < values.length; index++) {
    __dartIndexSet(target, start + index, values[index]);
  }
  return null;
}
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
  if ((typeof left === "number" || left.__dartType === "double") && (typeof right === "number" || right.__dartType === "double")) return Number(left) === Number(right);
  const equals = left["=="];
  return typeof equals === "function" ? equals.call(left, right) : false;
}
function __dartIntToRadixString(value, radix) {
  const base = Math.trunc(radix);
  if (base < 2 || base > 36) throw __dartCoreError("RangeError", "Invalid value");
  return Math.trunc(value).toString(base);
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
function __dartShr(left, right) {
  return Math.floor(left / (2 ** right));
}
const __dartConstValues = new Map();
function __dartConst(key, create) {
  if (!__dartConstValues.has(key)) {
    __dartConstValues.set(key, create());
  }
  return __dartConstValues.get(key);
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
  const values = (iterable != null && typeof iterable["[]"] === "function" && typeof iterable.length === "number") ? { length: iterable.length, get(index) { return iterable["[]"](index); } } : Array.from(iterable);
  let index = -1;
  return {
    current: undefined,
    moveNext() {
      index++;
      if (index < values.length) {
        this.current = typeof values.get === "function" ? values.get(index) : values[index];
        return true;
      }
      this.current = undefined;
      return false;
    },
  };
}

// Generated by dart2esm.

const $CodePageDecoder_interface = Symbol("CodePageDecoder");
const $Equality_interface = Symbol("Equality");
const $NonGrowableListMixin_interface = Symbol("NonGrowableListMixin");
const $PriorityQueue_interface = Symbol("PriorityQueue");
const $QueueList_interface = Symbol("QueueList");
const $UnmodifiableSetMixin_interface = Symbol("UnmodifiableSetMixin");
const $UnmodifiableSetView_interface = Symbol("UnmodifiableSetView");

class _DelegatingIterableBase {
  constructor() {
  }
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
    return __dartIndexGet(this._base, index);
  }
  "[]="(index, value) {
    __dartIndexSet(this._base, index, value);
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
  get first() { return super.first; }
  get last() { return super.last; }
  get length() { return super.length; }
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
  constructor() {
    Object.defineProperty(this, $UnmodifiableSetMixin_interface, { value: true });
  }
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
Object.defineProperty(UnmodifiableSetMixin, Symbol.hasInstance, { value(value) { return value != null && value[$UnmodifiableSetMixin_interface] === true; } });

class _MapKeySet__DelegatingIterableBase_UnmodifiableSetMixin extends _DelegatingIterableBase {
  constructor() {
    super();
    Object.defineProperty(this, $UnmodifiableSetMixin_interface, { value: true });
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
    Object.defineProperty(this, $UnmodifiableSetMixin_interface, { value: true });
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
    Object.defineProperty(this, $UnmodifiableSetMixin_interface, { value: true });
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
    Object.defineProperty(this, $UnmodifiableSetView_interface, { value: true });
  }
  static empty() {
    return new EmptyUnmodifiableSet();
  }
}
Object.defineProperty(UnmodifiableSetView, Symbol.hasInstance, { value(value) { return value != null && value[$UnmodifiableSetView_interface] === true; } });

class EmptyUnmodifiableSet extends _EmptyUnmodifiableSet_IterableBase_UnmodifiableSetMixin {
  constructor() {
    super();
    Object.defineProperty(this, $UnmodifiableSetView_interface, { value: true });
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
}

class NonGrowableListMixin {
  constructor() {
    Object.defineProperty(this, $NonGrowableListMixin_interface, { value: true });
  }
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
Object.defineProperty(NonGrowableListMixin, Symbol.hasInstance, { value(value) { return value != null && value[$NonGrowableListMixin_interface] === true; } });

class _NonGrowableListView_DelegatingList_NonGrowableListMixin extends DelegatingList {
  constructor(base) {
    super(base);
    Object.defineProperty(this, $NonGrowableListMixin_interface, { value: true });
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
  get length() { return super.length; }
}

class NonGrowableListView extends _NonGrowableListView_DelegatingList_NonGrowableListMixin {
  constructor(listBase) {
    super(listBase);
  }
}

class UnmodifiableMapMixin {
  constructor() {
  }
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
        __dartIndexSet(this, i, value);
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
    return __dartIndexGet(this, 0);
  }
  set first(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    __dartIndexSet(this, 0, value);
  }
  get last() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return __dartIndexGet(this, (this.length - 1));
  }
  set last(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    __dartIndexSet(this, (this.length - 1), value);
  }
  elementAt(index) {
    return __dartIndexGet(this, index);
  }
  followedBy(other) {
    return Array.from(this).concat(Array.from(other));
  }
  forEach(action) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        (action)(__dartIndexGet(this, i));
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
    return !(this.length === 0);
  }
  get single() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    if ((this.length > 1)) {
      (() => { throw __dartCoreError("StateError", "Too many elements"); })();
    }
    return __dartIndexGet(this, 0);
  }
  contains(element) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
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
        if (!((test)(__dartIndexGet(this, i)))) {
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
        if ((test)(__dartIndexGet(this, i))) {
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
        let element = __dartIndexGet(this, i);
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
        let element = __dartIndexGet(this, i);
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
        let element = __dartIndexGet(this, i);
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
    let value = __dartIndexGet(this, 0);
    for (let i = 1; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, __dartIndexGet(this, i));
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
        value = (combine)(value, __dartIndexGet(this, i));
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
    if (this.length === 0) {
      return (growable ? [] : __dartFixedList([]));
    }
    let first = __dartIndexGet(this, 0);
    let result = (growable ? new Array(this.length).fill(first) : __dartFixedList(new Array(this.length).fill(first)));
    for (let i = 1; (i < this.length); i = (i + 1)) {
      {
        __dartIndexSet(result, i, __dartIndexGet(this, i));
      }
    }
    return result;
  }
  toSet() {
    let result = new Set();
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        __dartSetAdd(result, __dartIndexGet(this, i));
      }
    }
    return result;
  }
  add(element) {
    __dartIndexSet(this, (() => { let v = this.length; return (() => { let v_1 = this.length = (v + 1); return v; })(); })(), element);
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
        if (__dartEquals(__dartIndexGet(this, i), element)) {
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
        __dartIndexSet(this, (i - size), __dartIndexGet(this, i));
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
        let element = __dartIndexGet(this, i);
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
        __dartListSetRange(this, 0, retained.length, retained, 0);
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
    let result = __dartIndexGet(this, (this.length - 1));
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
        let tmp = __dartIndexGet(this, length);
        __dartIndexSet(this, length, __dartIndexGet(this, pos));
        __dartIndexSet(this, pos, tmp);
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
    return Array.from(this.slice(start, end));
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
            __dartIndexSet(this, (start + i), __dartIndexGet(otherList, (otherStart + i)));
          }
        }
      }
    } else {
      {
        for (let i_1 = 0; (i_1 < length); i_1 = (i_1 + 1)) {
          {
            __dartIndexSet(this, (start + i_1), __dartIndexGet(otherList, (otherStart + i_1)));
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
        __dartListSetRange(this, start, insertEnd, newContents, 0);
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
                      __dartIndexSet(this, i, element);
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
              this.add(__dartIndexGet(this, ((i_1 > 0) ? i_1 : 0)));
            }
          }
          if ((insertEnd_1 < oldLength)) {
            {
              __dartListSetRange(this, insertEnd_1, oldLength, this, end);
            }
          }
          __dartListSetRange(this, start, insertEnd_1, newContents, 0);
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
        if (__dartEquals(__dartIndexGet(this, i), element)) {
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
        if ((test)(__dartIndexGet(this, i))) {
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
        if (__dartEquals(__dartIndexGet(this, i), element)) {
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
        if ((test)(__dartIndexGet(this, i))) {
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
        __dartListSetRange(this, (index + 1), (length + 1), this, index);
        __dartIndexSet(this, index, element);
      }
    }
  }
  removeAt(index) {
    let result = __dartIndexGet(this, index);
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
        this.add(__dartIndexGet(this, ((i > 0) ? i : 0)));
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
        __dartListSetRange(this, oldCopyStart, oldLength, this, index);
      }
    }
    __dartListSetAll(this, index, iterable);
  }
  setAll(index, iterable) {
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        __dartListSetRange(this, index, (index + __dartIterableLength(iterable)), iterable, 0);
      }
    } else {
      {
        {
          let _sync_for_iterator = __dartIterator(iterable);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let element = _sync_for_iterator.current;
              {
                __dartIndexSet(this, (() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element);
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
    return !(__dartEquals((__dartIndexGet(this._data, __dartShr(index, 5)) & (1 << (index & 31))), 0));
  }
  "[]="(index, value) {
    __dartCheckValidIndex(index, this, "index", this._length, null);
    this._setBit(index, value);
  }
  fillRange(start, end, fill = null) {
    __dartCheckValidRange(start, end, this._length, null, null, null);
    ((fill === null) ? fill = false : null);
    let startWord = __dartShr(start, 5);
    let endWord = __dartShr((end - 1), 5);
    let startBit = (start & 31);
    let endBit = ((end - 1) & 31);
    if ((startWord < endWord)) {
      {
        if (fill) {
          {
            (() => { let v = this._data; return (() => { let v_1 = startWord; return __dartIndexSet(v, v_1, (__dartIndexGet(v, v_1) | ((-1) << startBit))); })(); })();
            (this._data.fill((-1), (startWord + 1), endWord), null);
            (() => { let v_2 = this._data; return (() => { let v_3 = endWord; return __dartIndexSet(v_2, v_3, (__dartIndexGet(v_2, v_3) | ((1 << (endBit + 1)) - 1))); })(); })();
          }
        } else {
          {
            (() => { let v_4 = this._data; return (() => { let v_5 = startWord; return __dartIndexSet(v_4, v_5, (__dartIndexGet(v_4, v_5) & ((1 << startBit) - 1))); })(); })();
            (this._data.fill(0, (startWord + 1), endWord), null);
            (() => { let v_6 = this._data; return (() => { let v_7 = endWord; return __dartIndexSet(v_6, v_7, (__dartIndexGet(v_6, v_7) & ((-1) << (endBit + 1)))); })(); })();
          }
        }
      }
    } else {
      {
        if (fill) {
          {
            (() => { let v_8 = this._data; return (() => { let v_9 = startWord; return __dartIndexSet(v_8, v_9, (__dartIndexGet(v_8, v_9) | (((1 << ((endBit - startBit) + 1)) - 1) << startBit))); })(); })();
          }
        } else {
          {
            (() => { let v_10 = this._data; return (() => { let v_11 = startWord; return __dartIndexSet(v_10, v_11, (__dartIndexGet(v_10, v_11) & (((1 << startBit) - 1) | ((-1) << (endBit + 1))))); })(); })();
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
        (() => { let v = this._data; return (() => { let v_1 = __dartShr(index, 5); return __dartIndexSet(v, v_1, (__dartIndexGet(v, v_1) | (1 << (index & 31)))); })(); })();
      }
    } else {
      {
        (() => { let v_2 = this._data; return (() => { let v_3 = __dartShr(index, 5); return __dartIndexSet(v_2, v_3, (__dartIndexGet(v_2, v_3) & (~(1 << (index & 31))))); })(); })();
      }
    }
  }
  static _lengthInWords(bitLength) {
    return __dartShr((bitLength + (32 - 1)), 5);
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
  get length() { return super.length; }
}

function $_GrowableBoolList__withCapacity($newTarget, length, capacity) {
  const $self = $BoolList__($newTarget, new Uint32Array(BoolList._lengthInWords(capacity)), length);
  return $self;
}

class __NonGrowableBoolList_BoolList_NonGrowableListMixin extends BoolList {
  constructor() {
    if (new.target === __NonGrowableBoolList_BoolList_NonGrowableListMixin) {
      throw new TypeError("Class __NonGrowableBoolList&BoolList&NonGrowableListMixin has no unnamed constructor");
    }
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
  get length() { return super.length; }
}

function $__NonGrowableBoolList_BoolList_NonGrowableListMixin__($newTarget, _data, _length) {
  const $self = $BoolList__($newTarget, _data, _length);
  Object.defineProperty($self, $NonGrowableListMixin_interface, { value: true });
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
        this._current = !(__dartEquals((__dartIndexGet(this._boolList._data, __dartShr(pos, 5)) & (1 << (pos & 31))), 0));
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
        let list = __dartIndexGet(this._lists, i);
        if ((index < list.length)) {
          {
            return __dartIndexGet(list, index);
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
Object.defineProperty(Equality, Symbol.hasInstance, { value(value) { return value != null && value[$Equality_interface] === true; } });

class EqualityBy {
  constructor(comparisonKey, inner = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    this._comparisonKey = comparisonKey;
    this._inner = inner;
    Object.defineProperty(this, $Equality_interface, { value: true });
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

class DefaultEquality {
  constructor() {
    Object.defineProperty(this, $Equality_interface, { value: true });
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

class IdentityEquality {
  constructor() {
    Object.defineProperty(this, $Equality_interface, { value: true });
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

class IterableEquality {
  constructor(elementEquality = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    this._elementEquality = elementEquality;
    Object.defineProperty(this, $Equality_interface, { value: true });
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
            hash = (hash ^ __dartShr(hash, 6));
          }
        }
      }
    }
    hash = ((hash + (hash << 3)) & 2147483647);
    hash = (hash ^ __dartShr(hash, 11));
    hash = ((hash + (hash << 15)) & 2147483647);
    return hash;
  }
  isValidKey(o) {
    return o != null && typeof o !== "string" && !(o instanceof Map) && typeof o[Symbol.iterator] === "function";
  }
}

class ListEquality {
  constructor(elementEquality = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    this._elementEquality = elementEquality;
    Object.defineProperty(this, $Equality_interface, { value: true });
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
        if (!(this._elementEquality.equals(__dartIndexGet(list1, i), __dartIndexGet(list2, i)))) {
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
        let c = this._elementEquality.hash(__dartIndexGet(list, i));
        hash = ((hash + c) & 2147483647);
        hash = ((hash + (hash << 10)) & 2147483647);
        hash = (hash ^ __dartShr(hash, 6));
      }
    }
    hash = ((hash + (hash << 3)) & 2147483647);
    hash = (hash ^ __dartShr(hash, 11));
    hash = ((hash + (hash << 15)) & 2147483647);
    return hash;
  }
  isValidKey(o) {
    return (Array.isArray(o) || (ArrayBuffer.isView(o) && !(o instanceof DataView)));
  }
}

class _UnorderedEquality {
  constructor(_elementEquality) {
    this._elementEquality = _elementEquality;
    Object.defineProperty(this, $Equality_interface, { value: true });
  }
  equals(elements1, elements2) {
    if (Object.is(elements1, elements2)) {
      return true;
    }
    if (((elements1 === null) || (elements2 === null))) {
      return false;
    }
    let counts = __dartCustomHashMap(__dartAs(__dartBind(this._elementEquality, "equals"), value => typeof value === "function", "bool Function(_UnorderedEquality.E%, _UnorderedEquality.E%)"), __dartAs(__dartBind(this._elementEquality, "hash"), value => typeof value === "function", "int Function(_UnorderedEquality.E%)"), __dartBind(this._elementEquality, "isValidKey"));
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
    hash = (hash ^ __dartShr(hash, 11));
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

class MapEquality {
  constructor({ keys = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))), values = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) } = {}) {
    this._keyEquality = keys;
    this._valueEquality = values;
    Object.defineProperty(this, $Equality_interface, { value: true });
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
    hash = (hash ^ __dartShr(hash, 11));
    hash = ((hash + (hash << 15)) & 2147483647);
    return hash;
  }
  isValidKey(o) {
    return o instanceof Map;
  }
}

class MultiEquality {
  constructor(equalities) {
    this._equalities = equalities;
    Object.defineProperty(this, $Equality_interface, { value: true });
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

class DeepCollectionEquality {
  constructor(base = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    this._base = base;
    this._unordered = false;
    Object.defineProperty(this, $Equality_interface, { value: true });
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
  const $self = Object.create($newTarget.prototype);
  Object.defineProperty($self, $Equality_interface, { value: true });
  $self._base = base;
  $self._unordered = true;
  return $self;
}

class CaseInsensitiveEquality {
  constructor() {
    Object.defineProperty(this, $Equality_interface, { value: true });
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
    super(__dartCustomHashMap(__dartAs(__dartBind(equality, "equals"), value => typeof value === "function", "bool Function(EqualityMap.K%, EqualityMap.K%)"), __dartAs(__dartBind(equality, "hash"), value => typeof value === "function", "int Function(EqualityMap.K%)"), __dartBind(equality, "isValidKey")));
  }
  static from(equality, other) {
    return $EqualityMap_from(EqualityMap, equality, other);
  }
}

function $EqualityMap_from($newTarget, equality, other) {
  const $self = Reflect.construct(DelegatingMap, [__dartCustomHashMap(__dartAs(__dartBind(equality, "equals"), value => typeof value === "function", "bool Function(EqualityMap.K%, EqualityMap.K%)"), __dartAs(__dartBind(equality, "hash"), value => typeof value === "function", "int Function(EqualityMap.K%)"), __dartBind(equality, "isValidKey"))], $newTarget);
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
        if (!(__dartIndexGet(this._iterators, i).moveNext())) {
          {
            this._current = null;
            return false;
          }
        }
      }
    }
    this._current = __dartFixedList(Array.from({ length: this._iterators.length }, (_, index) => ((i) => { return __dartIndexGet(this._iterators, i).current; })(index)));
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
    return __dartIndexGet(this.source, (this.start + index));
  }
  "[]="(index, value) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    __dartCheckValidIndex(index, this, null, this.length, null);
    __dartIndexSet(this.source, (this.start + index), value);
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
Object.defineProperty(PriorityQueue, Symbol.hasInstance, { value(value) { return value != null && value[$PriorityQueue_interface] === true; } });

class HeapPriorityQueue {
  constructor(comparison = null) {
    this._queue = __dartFixedList(new Array(7).fill(null));
    this._length = 0;
    this._modificationCount = 0;
    this.comparison = (comparison ?? defaultCompare);
    Object.defineProperty(this, $PriorityQueue_interface, { value: true });
  }
  _elementAt(index) {
    return (__dartIndexGet(this._queue, index) ?? (null ?? __dartAs(v, value => true, "E")));
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
                position = __dartShr(position, 1);
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
    __dartIndexSet(this._queue, newLength, null);
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
        __dartIndexSet(this._queue, index, parent);
        index = parentIndex;
      }
    }
    __dartIndexSet(this._queue, index, element);
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
            __dartIndexSet(this._queue, index, element);
            return;
          }
        }
        __dartIndexSet(this._queue, index, minChild);
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
            __dartIndexSet(this._queue, index, child);
            index = leftChildIndex_1;
          }
        }
      }
    }
    __dartIndexSet(this._queue, index, element);
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
        this._current = __dartIndexGet(this._queue._queue, nextIndex);
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
    __dartIndexSet(this, (() => { let v = this.length; return (() => { let v_1 = this.length = (v + 1); return v; })(); })(), element);
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
    let result = __dartIndexGet(this, (this.length - 1));
    this.length = (this.length - 1);
    return result;
  }
  get first() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return __dartIndexGet(this, 0);
  }
  set first(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    __dartIndexSet(this, 0, value);
  }
  get last() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return __dartIndexGet(this, (this.length - 1));
  }
  set last(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    __dartIndexSet(this, (this.length - 1), value);
  }
  get iterator() {
    return __dartIterator(this);
  }
  elementAt(index) {
    return __dartIndexGet(this, index);
  }
  followedBy(other) {
    return Array.from(this).concat(Array.from(other));
  }
  forEach(action) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        (action)(__dartIndexGet(this, i));
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
    return !(this.length === 0);
  }
  get single() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    if ((this.length > 1)) {
      (() => { throw __dartCoreError("StateError", "Too many elements"); })();
    }
    return __dartIndexGet(this, 0);
  }
  contains(element) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
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
        if (!((test)(__dartIndexGet(this, i)))) {
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
        if ((test)(__dartIndexGet(this, i))) {
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
        let element = __dartIndexGet(this, i);
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
        let element = __dartIndexGet(this, i);
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
        let element = __dartIndexGet(this, i);
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
    let value = __dartIndexGet(this, 0);
    for (let i = 1; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, __dartIndexGet(this, i));
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
        value = (combine)(value, __dartIndexGet(this, i));
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
    if (this.length === 0) {
      return (growable ? [] : __dartFixedList([]));
    }
    let first = __dartIndexGet(this, 0);
    let result = (growable ? new Array(this.length).fill(first) : __dartFixedList(new Array(this.length).fill(first)));
    for (let i = 1; (i < this.length); i = (i + 1)) {
      {
        __dartIndexSet(result, i, __dartIndexGet(this, i));
      }
    }
    return result;
  }
  toSet() {
    let result = new Set();
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        __dartSetAdd(result, __dartIndexGet(this, i));
      }
    }
    return result;
  }
  remove(element) {
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
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
        __dartIndexSet(this, (i - size), __dartIndexGet(this, i));
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
        let element = __dartIndexGet(this, i);
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
        __dartListSetRange(this, 0, retained.length, retained, 0);
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
        let tmp = __dartIndexGet(this, length);
        __dartIndexSet(this, length, __dartIndexGet(this, pos));
        __dartIndexSet(this, pos, tmp);
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
    return Array.from(this.slice(start, end));
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
        __dartIndexSet(this, i, value);
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
            __dartIndexSet(this, (start + i), __dartIndexGet(otherList, (otherStart + i)));
          }
        }
      }
    } else {
      {
        for (let i_1 = 0; (i_1 < length); i_1 = (i_1 + 1)) {
          {
            __dartIndexSet(this, (start + i_1), __dartIndexGet(otherList, (otherStart + i_1)));
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
        __dartListSetRange(this, start, insertEnd, newContents, 0);
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
                      __dartIndexSet(this, i, element);
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
              this.add(__dartIndexGet(this, ((i_1 > 0) ? i_1 : 0)));
            }
          }
          if ((insertEnd_1 < oldLength)) {
            {
              __dartListSetRange(this, insertEnd_1, oldLength, this, end);
            }
          }
          __dartListSetRange(this, start, insertEnd_1, newContents, 0);
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
        if (__dartEquals(__dartIndexGet(this, i), element)) {
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
        if ((test)(__dartIndexGet(this, i))) {
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
        if (__dartEquals(__dartIndexGet(this, i), element)) {
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
        if ((test)(__dartIndexGet(this, i))) {
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
        __dartListSetRange(this, (index + 1), (length + 1), this, index);
        __dartIndexSet(this, index, element);
      }
    }
  }
  removeAt(index) {
    let result = __dartIndexGet(this, index);
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
        this.add(__dartIndexGet(this, ((i > 0) ? i : 0)));
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
        __dartListSetRange(this, oldCopyStart, oldLength, this, index);
      }
    }
    __dartListSetAll(this, index, iterable);
  }
  setAll(index, iterable) {
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        __dartListSetRange(this, index, (index + __dartIterableLength(iterable)), iterable, 0);
      }
    } else {
      {
        {
          let _sync_for_iterator = __dartIterator(iterable);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let element = _sync_for_iterator.current;
              {
                __dartIndexSet(this, (() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element);
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
    __dartIndexSet(this._table, this._head, element);
    if (__dartEquals(this._head, this._tail)) {
      this._grow();
    }
  }
  removeFirst() {
    if (__dartEquals(this._head, this._tail)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    let result = (__dartIndexGet(this._table, this._head) ?? __dartAs(v, value => true, "E"));
    __dartIndexSet(this._table, this._head, null);
    this._head = ((this._head + 1) & (this._table.length - 1));
    return result;
  }
  removeLast() {
    if (__dartEquals(this._head, this._tail)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    this._tail = ((this._tail - 1) & (this._table.length - 1));
    let result = (__dartIndexGet(this._table, this._tail) ?? __dartAs(v, value => true, "E"));
    __dartIndexSet(this._table, this._tail, null);
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
    return (__dartIndexGet(this._table, ((this._head + index) & (this._table.length - 1))) ?? __dartAs(v, value => true, "E"));
  }
  "[]="(index, value) {
    if (((index < 0) || (index >= this.length))) {
      {
        (() => { throw __dartCoreError("RangeError", "Index " + __dartStr(index) + " must be in the range [0.." + __dartStr(this.length) + ")."); })();
      }
    }
    __dartIndexSet(this._table, ((this._head + index) & (this._table.length - 1)), value);
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
    __dartIndexSet(this._table, this._tail, element);
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
    newElementCount = (newElementCount + __dartShr(newElementCount, 1));
    let newCapacity = QueueList._nextPowerOf2(newElementCount);
    let newTable = __dartFixedList(new Array(newCapacity).fill(null));
    this._tail = this._writeToList(newTable);
    this._table = newTable;
    this._head = 0;
  }
}
Object.defineProperty(QueueList, Symbol.hasInstance, { value(value) { return value != null && value[$QueueList_interface] === true; } });

function $QueueList__init($newTarget, initialCapacity) {
  const $self = Reflect.construct(_QueueList_Object_ListMixin, [], $newTarget);
  Object.defineProperty($self, $QueueList_interface, { value: true });
  $self._table = __dartFixedList(new Array(initialCapacity).fill(null));
  $self._head = 0;
  $self._tail = 0;
  return $self;
}

function $QueueList__($newTarget, _head, _tail, _table) {
  const $self = Reflect.construct(_QueueList_Object_ListMixin, [], $newTarget);
  Object.defineProperty($self, $QueueList_interface, { value: true });
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
    Object.defineProperty(this, $UnmodifiableSetMixin_interface, { value: true });
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

class AccumulatorSink {
  constructor() {
    this._events = new Array(0).fill(null);
    this._isClosed = false;
  }
  get events() {
    return __dartUnmodifiableListView(this._events);
  }
  get isClosed() {
    return this._isClosed;
  }
  clear() {
    (this._events.length = 0, null);
  }
  add(event) {
    if (this._isClosed) {
      {
        (() => { throw __dartCoreError("StateError", "Can't add to a closed sink."); })();
      }
    }
    (this._events.push(event), null);
  }
  close() {
    this._isClosed = true;
  }
}

class TypedDataBuffer {
  constructor(buffer) {
    this._buffer = buffer;
    this._length = buffer.length;
  }
  get length() {
    return this._length;
  }
  "[]"(index) {
    if ((index >= this.length)) {
      (() => { throw __dartCoreError("IndexError", index); })();
    }
    return __dartIndexGet(this._buffer, index);
  }
  "[]="(index, value) {
    if ((index >= this.length)) {
      (() => { throw __dartCoreError("IndexError", index); })();
    }
    __dartIndexSet(this._buffer, index, value);
  }
  set length(newLength) {
    if ((newLength < this._length)) {
      {
        let defaultValue = this._defaultValue;
        for (let i = newLength; (i < this._length); i = (i + 1)) {
          {
            __dartIndexSet(this._buffer, i, defaultValue);
          }
        }
      }
    } else {
      if ((newLength > this._buffer.length)) {
        {
          let newBuffer = null;
          if (__dartIterableIsEmpty(this._buffer)) {
            {
              newBuffer = this._createBuffer(newLength);
            }
          } else {
            {
              newBuffer = this._createBiggerBuffer(newLength);
            }
          }
          __dartListSetRange(newBuffer, 0, this._length, this._buffer, 0);
          this._buffer = newBuffer;
        }
      }
    }
    this._length = newLength;
  }
  _add(value) {
    if (__dartEquals(this._length, this._buffer.length)) {
      this._grow(this._length);
    }
    __dartIndexSet(this._buffer, (() => { let v = this._length; return (() => { let v_1 = this._length = (v + 1); return v; })(); })(), value);
  }
  add(element) {
    this._add(element);
  }
  addAll(values, start = 0, end = null) {
    __dartCheckNotNegative(start, "start", null);
    if ((!((end === null)) && (start > end))) {
      {
        (() => { throw __dartCoreError("RangeError", end); })();
      }
    }
    this._addAll(values, start, end);
  }
  insertAll(index, values, start = 0, end = null) {
    __dartCheckValidIndex(index, this, "index", (this._length + 1), null);
    __dartCheckNotNegative(start, "start", null);
    if (!((end === null))) {
      {
        if ((start > end)) {
          {
            (() => { throw __dartCoreError("RangeError", end); })();
          }
        }
        if (__dartEquals(start, end)) {
          return;
        }
      }
    }
    if (__dartEquals(index, this._length)) {
      {
        this._addAll(values, start, end);
        return;
      }
    }
    if (((end === null) && (Array.isArray(values) || (ArrayBuffer.isView(values) && !(values instanceof DataView))))) {
      {
        end = __dartIterableLength(values);
      }
    }
    if (!((end === null))) {
      {
        this._insertKnownLength(index, values, start, end);
        return;
      }
    }
    let writeIndex = this._length;
    let skipCount = start;
    {
      let _sync_for_iterator = __dartIterator(values);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let value = _sync_for_iterator.current;
          L:
          {
            if ((skipCount > 0)) {
              {
                skipCount = (skipCount - 1);
                break L;
              }
            }
            if (__dartEquals(writeIndex, this._buffer.length)) {
              {
                this._grow(writeIndex);
              }
            }
            __dartIndexSet(this._buffer, (() => { let v = writeIndex; return (() => { let v_1 = writeIndex = (v + 1); return v; })(); })(), value);
          }
        }
      }
    }
    if ((skipCount > 0)) {
      {
        (() => { throw __dartCoreError("StateError", "Too few elements"); })();
      }
    }
    if ((!((end === null)) && (writeIndex < end))) {
      {
        (() => { throw __dartCoreError("RangeError", end); })();
      }
    }
    TypedDataBuffer._reverse(this._buffer, index, this._length);
    TypedDataBuffer._reverse(this._buffer, this._length, writeIndex);
    TypedDataBuffer._reverse(this._buffer, index, writeIndex);
    this._length = writeIndex;
    return;
  }
  static _reverse(buffer, start, end) {
    end = (end - 1);
    while ((start < end)) {
      {
        let first = __dartIndexGet(buffer, start);
        let last = __dartIndexGet(buffer, end);
        __dartIndexSet(buffer, end, first);
        __dartIndexSet(buffer, start, last);
        start = (start + 1);
        end = (end - 1);
      }
    }
  }
  _addAll(values, start = 0, end = null) {
    if ((Array.isArray(values) || (ArrayBuffer.isView(values) && !(values instanceof DataView)))) {
      ((end === null) ? end = __dartIterableLength(values) : null);
    }
    if (!((end === null))) {
      {
        this._insertKnownLength(this._length, values, start, end);
        return;
      }
    }
    let i = 0;
    {
      let _sync_for_iterator = __dartIterator(values);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let value = _sync_for_iterator.current;
          {
            if ((i >= start)) {
              this.add(value);
            }
            i = (i + 1);
          }
        }
      }
    }
    if ((i < start)) {
      (() => { throw __dartCoreError("StateError", "Too few elements"); })();
    }
  }
  _insertKnownLength(index, values, start, end) {
    if ((Array.isArray(values) || (ArrayBuffer.isView(values) && !(values instanceof DataView)))) {
      {
        if (((start > __dartIterableLength(values)) || (end > __dartIterableLength(values)))) {
          {
            (() => { throw __dartCoreError("StateError", "Too few elements"); })();
          }
        }
      }
    }
    let valuesLength = (end - start);
    let newLength = (this._length + valuesLength);
    this._ensureCapacity(newLength);
    __dartListSetRange(this._buffer, (index + valuesLength), (this._length + valuesLength), this._buffer, index);
    __dartListSetRange(this._buffer, index, (index + valuesLength), values, start);
    this._length = newLength;
  }
  insert(index, element) {
    if (((index < 0) || (index > this._length))) {
      {
        (() => { throw __dartCoreError("RangeError", index); })();
      }
    }
    if ((this._length < this._buffer.length)) {
      {
        __dartListSetRange(this._buffer, (index + 1), (this._length + 1), this._buffer, index);
        __dartIndexSet(this._buffer, index, element);
        this._length = (this._length + 1);
        return;
      }
    }
    let newBuffer = this._createBiggerBuffer(null);
    __dartListSetRange(newBuffer, 0, index, this._buffer, 0);
    __dartListSetRange(newBuffer, (index + 1), (this._length + 1), this._buffer, index);
    __dartIndexSet(newBuffer, index, element);
    this._length = (this._length + 1);
    this._buffer = newBuffer;
  }
  _ensureCapacity(requiredCapacity) {
    if ((requiredCapacity <= this._buffer.length)) {
      return;
    }
    let newBuffer = this._createBiggerBuffer(requiredCapacity);
    __dartListSetRange(newBuffer, 0, this._length, this._buffer, 0);
    this._buffer = newBuffer;
  }
  _createBiggerBuffer(requiredCapacity) {
    let newLength = (this._buffer.length * 2);
    if ((!((requiredCapacity === null)) && (newLength < requiredCapacity))) {
      {
        newLength = requiredCapacity;
      }
    } else {
      if ((newLength < 8)) {
        {
          newLength = 8;
        }
      }
    }
    return this._createBuffer(newLength);
  }
  _grow(length) {
    this._buffer = (() => { let v = this._createBiggerBuffer(null); return (() => {
      __dartListSetRange(v, 0, length, this._buffer, 0);
      return v;
    })(); })();
  }
  setRange(start, end, iterable, skipCount = 0) {
    if ((end > this._length)) {
      (() => { throw __dartCoreError("RangeError", end); })();
    }
    this._setRange(start, end, iterable, skipCount);
  }
  _setRange(start, end, source, skipCount) {
    if (source instanceof TypedDataBuffer) {
      {
        __dartListSetRange(this._buffer, start, end, source._buffer, skipCount);
      }
    } else {
      {
        __dartListSetRange(this._buffer, start, end, source, skipCount);
      }
    }
  }
  get elementSizeInBytes() {
    return (this._buffer instanceof DataView ? 1 : this._buffer.BYTES_PER_ELEMENT);
  }
  get lengthInBytes() {
    return (this._length * (this._buffer instanceof DataView ? 1 : this._buffer.BYTES_PER_ELEMENT));
  }
  get offsetInBytes() {
    return this._buffer.byteOffset;
  }
  get buffer() {
    return this._buffer.buffer;
  }
  get _defaultValue() {
    throw new TypeError("Abstract member TypedDataBuffer._defaultValue");
  }
  set _defaultValue(value) {
    Object.defineProperty(this, "_defaultValue", { value, writable: true, configurable: true, enumerable: true });
  }
  _createBuffer(size) {
    throw new TypeError("Abstract member TypedDataBuffer._createBuffer");
  }
}

class _IntBuffer extends TypedDataBuffer {
  constructor(buffer) {
    super(buffer);
  }
  get _defaultValue() {
    return 0;
  }
}

class _FloatBuffer extends TypedDataBuffer {
  constructor(buffer) {
    super(buffer);
  }
  get _defaultValue() {
    return 0.0;
  }
}

class Uint8Buffer extends _IntBuffer {
  constructor(initialLength = 0) {
    super(new Uint8Array(initialLength));
  }
  _createBuffer(size) {
    return new Uint8Array(size);
  }
}

class Int8Buffer extends _IntBuffer {
  constructor(initialLength = 0) {
    super(new Int8Array(initialLength));
  }
  _createBuffer(size) {
    return new Int8Array(size);
  }
}

class Uint8ClampedBuffer extends _IntBuffer {
  constructor(initialLength = 0) {
    super(new Uint8ClampedArray(initialLength));
  }
  _createBuffer(size) {
    return new Uint8ClampedArray(size);
  }
}

class Uint16Buffer extends _IntBuffer {
  constructor(initialLength = 0) {
    super(new Uint16Array(initialLength));
  }
  _createBuffer(size) {
    return new Uint16Array(size);
  }
}

class Int16Buffer extends _IntBuffer {
  constructor(initialLength = 0) {
    super(new Int16Array(initialLength));
  }
  _createBuffer(size) {
    return new Int16Array(size);
  }
}

class Uint32Buffer extends _IntBuffer {
  constructor(initialLength = 0) {
    super(new Uint32Array(initialLength));
  }
  _createBuffer(size) {
    return new Uint32Array(size);
  }
}

class Int32Buffer extends _IntBuffer {
  constructor(initialLength = 0) {
    super(new Int32Array(initialLength));
  }
  _createBuffer(size) {
    return new Int32Array(size);
  }
}

class Uint64Buffer extends _IntBuffer {
  constructor(initialLength = 0) {
    super(new BigUint64Array(initialLength));
  }
  _createBuffer(size) {
    return new BigUint64Array(size);
  }
}

class Int64Buffer extends _IntBuffer {
  constructor(initialLength = 0) {
    super(new BigInt64Array(initialLength));
  }
  _createBuffer(size) {
    return new BigInt64Array(size);
  }
}

class Float32Buffer extends _FloatBuffer {
  constructor(initialLength = 0) {
    super(new Float32Array(initialLength));
  }
  _createBuffer(size) {
    return new Float32Array(size);
  }
}

class Float64Buffer extends _FloatBuffer {
  constructor(initialLength = 0) {
    super(new Float64Array(initialLength));
  }
  _createBuffer(size) {
    return new Float64Array(size);
  }
}

class Int32x4Buffer extends TypedDataBuffer {
  constructor(initialLength = 0) {
    super(new Array(initialLength).fill(null));
  }
  get _defaultValue() {
    return Int32x4Buffer._zero;
  }
  _createBuffer(size) {
    return new Array(size).fill(null);
  }
}

class Float32x4Buffer extends TypedDataBuffer {
  constructor(initialLength = 0) {
    super(new Array(initialLength).fill(null));
  }
  get _defaultValue() {
    return Object.freeze({ __dartType: "Float32x4", x: 0, y: 0, z: 0, w: 0 });
  }
  _createBuffer(size) {
    return new Array(size).fill(null);
  }
}

class __TypedQueue_Object_ListMixin {
  constructor() {
  }
  toList({ growable = true } = {}) {
    if (this.length === 0) {
      return (growable ? [] : __dartFixedList([]));
    }
    let first = __dartIndexGet(this, 0);
    let result = (growable ? new Array(this.length).fill(first) : __dartFixedList(new Array(this.length).fill(first)));
    for (let i = 1; (i < this.length); i = (i + 1)) {
      {
        __dartIndexSet(result, i, __dartIndexGet(this, i));
      }
    }
    return result;
  }
  cast() {
    return Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(__TypedQueue&Object&ListMixin.cast.R%)"));
  }
  removeLast() {
    if (__dartEquals(this.length, 0)) {
      {
        (() => { throw __dartCoreError("StateError", "No element"); })();
      }
    }
    let result = __dartIndexGet(this, (this.length - 1));
    this.length = (this.length - 1);
    return result;
  }
  add(element) {
    __dartIndexSet(this, (() => { let v = this.length; return (() => { let v_1 = this.length = (v + 1); return v; })(); })(), element);
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
            __dartIndexSet(this, (start + i), __dartIndexGet(otherList, (otherStart + i)));
          }
        }
      }
    } else {
      {
        for (let i_1 = 0; (i_1 < length); i_1 = (i_1 + 1)) {
          {
            __dartIndexSet(this, (start + i_1), __dartIndexGet(otherList, (otherStart + i_1)));
          }
        }
      }
    }
  }
  fillRange(start, end, fill = null) {
    let value = (fill ?? (v ?? __dartAs(v_1, value => true, "E")));
    __dartCheckValidRange(start, end, this.length, null, null, null);
    for (let i = start; (i < end); i = (i + 1)) {
      {
        __dartIndexSet(this, i, value);
      }
    }
  }
  sublist(start, end = null) {
    let listLength = this.length;
    ((end === null) ? end = listLength : null);
    __dartCheckValidRange(start, end, listLength, null, null, null);
    return Array.from(this.slice(start, end));
  }
  get first() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return __dartIndexGet(this, 0);
  }
  set first(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    __dartIndexSet(this, 0, value);
  }
  get last() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return __dartIndexGet(this, (this.length - 1));
  }
  set last(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    __dartIndexSet(this, (this.length - 1), value);
  }
  get iterator() {
    return __dartIterator(this);
  }
  elementAt(index) {
    return __dartIndexGet(this, index);
  }
  followedBy(other) {
    return Array.from(this).concat(Array.from(other));
  }
  forEach(action) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        (action)(__dartIndexGet(this, i));
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
    return !(this.length === 0);
  }
  get single() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    if ((this.length > 1)) {
      (() => { throw __dartCoreError("StateError", "Too many elements"); })();
    }
    return __dartIndexGet(this, 0);
  }
  contains(element) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
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
        if (!((test)(__dartIndexGet(this, i)))) {
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
        if ((test)(__dartIndexGet(this, i))) {
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
        let element = __dartIndexGet(this, i);
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
        let element = __dartIndexGet(this, i);
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
        let element = __dartIndexGet(this, i);
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
    let value = __dartIndexGet(this, 0);
    for (let i = 1; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, __dartIndexGet(this, i));
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
        value = (combine)(value, __dartIndexGet(this, i));
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
  toSet() {
    let result = new Set();
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        __dartSetAdd(result, __dartIndexGet(this, i));
      }
    }
    return result;
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
        if (__dartEquals(__dartIndexGet(this, i), element)) {
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
        __dartIndexSet(this, (i - size), __dartIndexGet(this, i));
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
        let element = __dartIndexGet(this, i);
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
        __dartListSetRange(this, 0, retained.length, retained, 0);
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
        let tmp = __dartIndexGet(this, length);
        __dartIndexSet(this, length, __dartIndexGet(this, pos));
        __dartIndexSet(this, pos, tmp);
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
  getRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    return Array.from(this).slice(start, end ?? undefined);
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
        __dartListSetRange(this, start, insertEnd, newContents, 0);
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
                      __dartIndexSet(this, i, element);
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
              this.add(__dartIndexGet(this, ((i_1 > 0) ? i_1 : 0)));
            }
          }
          if ((insertEnd_1 < oldLength)) {
            {
              __dartListSetRange(this, insertEnd_1, oldLength, this, end);
            }
          }
          __dartListSetRange(this, start, insertEnd_1, newContents, 0);
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
        if (__dartEquals(__dartIndexGet(this, i), element)) {
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
        if ((test)(__dartIndexGet(this, i))) {
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
        if (__dartEquals(__dartIndexGet(this, i), element)) {
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
        if ((test)(__dartIndexGet(this, i))) {
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
        __dartListSetRange(this, (index + 1), (length + 1), this, index);
        __dartIndexSet(this, index, element);
      }
    }
  }
  removeAt(index) {
    let result = __dartIndexGet(this, index);
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
        this.add(__dartIndexGet(this, ((i > 0) ? i : 0)));
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
        __dartListSetRange(this, oldCopyStart, oldLength, this, index);
      }
    }
    __dartListSetAll(this, index, iterable);
  }
  setAll(index, iterable) {
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        __dartListSetRange(this, index, (index + __dartIterableLength(iterable)), iterable, 0);
      }
    } else {
      {
        {
          let _sync_for_iterator = __dartIterator(iterable);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let element = _sync_for_iterator.current;
              {
                __dartIndexSet(this, (() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element);
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

class _TypedQueue extends __TypedQueue_Object_ListMixin {
  constructor(_table) {
    super();
    this._table = _table;
    this._head = 0;
    this._tail = 0;
  }
  get length() {
    return ((this._tail - this._head) & (this._table.length - 1));
  }
  toList({ growable = true } = {}) {
    let list = (growable ? this._createBuffer(this.length) : this._createList(this.length));
    this._writeToList(list);
    return list;
  }
  cast() {
    if (this instanceof QueueList) {
      return __dartAs(this, value => value instanceof QueueList, "QueueList<_TypedQueue.cast.T%>");
    }
    (() => { throw __dartCoreError("UnsupportedError", __dartStr(this) + " cannot be cast to the desired type."); })();
  }
  retype() {
    return this.cast();
  }
  addLast(value) {
    __dartIndexSet(this._table, this._tail, value);
    this._tail = ((this._tail + 1) & (this._table.length - 1));
    if (__dartEquals(this._head, this._tail)) {
      this._growAtCapacity();
    }
  }
  addFirst(value) {
    this._head = ((this._head - 1) & (this._table.length - 1));
    __dartIndexSet(this._table, this._head, value);
    if (__dartEquals(this._head, this._tail)) {
      this._growAtCapacity();
    }
  }
  removeFirst() {
    if (__dartEquals(this._head, this._tail)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    let result = __dartIndexGet(this._table, this._head);
    this._head = ((this._head + 1) & (this._table.length - 1));
    return result;
  }
  removeLast() {
    if (__dartEquals(this._head, this._tail)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    this._tail = ((this._tail - 1) & (this._table.length - 1));
    return __dartIndexGet(this._table, this._tail);
  }
  add(value) {
    return this.addLast(value);
  }
  set length(value) {
    __dartCheckNotNegative(value, "length", null);
    let delta = (value - this.length);
    if ((delta >= 0)) {
      {
        let needsToGrow = (this._table.length <= value);
        if (needsToGrow) {
          this._growTo(value);
        }
        this._tail = ((this._tail + delta) & (this._table.length - 1));
        if (!(needsToGrow)) {
          this.fillRange((value - delta), value, this._defaultValue);
        }
      }
    } else {
      {
        this.removeRange(value, this.length);
      }
    }
  }
  "[]"(index) {
    __dartCheckValidIndex(index, this, null, this.length, null);
    return __dartIndexGet(this._table, ((this._head + index) & (this._table.length - 1)));
  }
  "[]="(index, value) {
    __dartCheckValidIndex(index, this, null, null, null);
    __dartIndexSet(this._table, ((this._head + index) & (this._table.length - 1)), value);
  }
  removeRange(start, end) {
    let length = this.length;
    __dartCheckValidRange(start, end, length, null, null, null);
    if (__dartEquals(start, 0)) {
      {
        this._head = ((this._head + end) & (this._table.length - 1));
        return;
      }
    }
    let elementsAfter = (length - end);
    if (__dartEquals(elementsAfter, 0)) {
      {
        this._tail = ((this._head + start) & (this._table.length - 1));
        return;
      }
    }
    let removedElements = (end - start);
    if ((start < elementsAfter)) {
      {
        this.setRange(removedElements, end, this);
        this._head = ((this._head + removedElements) & (this._table.length - 1));
      }
    } else {
      {
        this.setRange(start, (length - removedElements), this, end);
        this._tail = ((this._tail - removedElements) & (this._table.length - 1));
      }
    }
  }
  setRange(start, end, iterable, skipCount = 0) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if (__dartEquals(start, end)) {
      return;
    }
    let targetStart = ((this._head + start) & (this._table.length - 1));
    let targetEnd = ((this._head + end) & (this._table.length - 1));
    let targetIsContiguous = (targetStart < targetEnd);
    if (Object.is(iterable, this)) {
      {
        let sourceStart = ((this._head + skipCount) & (this._table.length - 1));
        let sourceEnd = ((sourceStart + (end - start)) & (this._table.length - 1));
        if (__dartEquals(sourceStart, targetStart)) {
          return;
        }
        let sourceIsContiguous = (sourceStart < sourceEnd);
        if ((targetIsContiguous && sourceIsContiguous)) {
          {
            __dartListSetRange(this._table, targetStart, targetEnd, this._table, sourceStart);
          }
        } else {
          if ((!(targetIsContiguous) && !(sourceIsContiguous))) {
            {
              if ((sourceStart > targetStart)) {
                {
                  let startGap = (sourceStart - targetStart);
                  let firstEnd = (this._table.length - startGap);
                  __dartListSetRange(this._table, targetStart, firstEnd, this._table, sourceStart);
                  __dartListSetRange(this._table, firstEnd, this._table.length, this._table, 0);
                  __dartListSetRange(this._table, 0, targetEnd, this._table, startGap);
                }
              } else {
                if ((sourceEnd < targetEnd)) {
                  {
                    let firstStart = (targetEnd - sourceEnd);
                    __dartListSetRange(this._table, firstStart, targetEnd, this._table, 0);
                    __dartListSetRange(this._table, 0, firstStart, this._table, (this._table.length - firstStart));
                    __dartListSetRange(this._table, targetStart, this._table.length, this._table, sourceStart);
                  }
                }
              }
            }
          } else {
            if ((sourceStart < targetEnd)) {
              {
                if (sourceIsContiguous) {
                  {
                    __dartListSetRange(this._table, targetStart, this._table.length, this._table, sourceStart);
                    __dartListSetRange(this._table, 0, targetEnd, this._table, (sourceStart + (this._table.length - targetStart)));
                  }
                } else {
                  {
                    let firstEnd_1 = (this._table.length - sourceStart);
                    __dartListSetRange(this._table, targetStart, firstEnd_1, this._table, sourceStart);
                    __dartListSetRange(this._table, firstEnd_1, targetEnd, this._table, 0);
                  }
                }
              }
            } else {
              {
                if (sourceIsContiguous) {
                  {
                    __dartListSetRange(this._table, 0, targetEnd, this._table, (sourceStart + (this._table.length - targetStart)));
                    __dartListSetRange(this._table, targetStart, this._table.length, this._table, sourceStart);
                  }
                } else {
                  {
                    let firstStart_1 = (targetEnd - sourceEnd);
                    __dartListSetRange(this._table, firstStart_1, targetEnd, this._table, 0);
                    __dartListSetRange(this._table, targetStart, firstStart_1, this._table, sourceStart);
                  }
                }
              }
            }
          }
        }
      }
    } else {
      if (targetIsContiguous) {
        {
          __dartListSetRange(this._table, targetStart, targetEnd, iterable, skipCount);
        }
      } else {
        if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
          {
            __dartListSetRange(this._table, targetStart, this._table.length, iterable, skipCount);
            __dartListSetRange(this._table, 0, targetEnd, iterable, (skipCount + (this._table.length - targetStart)));
          }
        } else {
          {
            super.setRange(start, end, iterable, skipCount);
          }
        }
      }
    }
  }
  fillRange(start, end, value = null) {
    let startInTable = ((this._head + start) & (this._table.length - 1));
    let endInTable = ((this._head + end) & (this._table.length - 1));
    if ((startInTable <= endInTable)) {
      {
        (this._table.fill(value, startInTable, endInTable), null);
      }
    } else {
      {
        (this._table.fill(value, startInTable, this._table.length), null);
        (this._table.fill(value, 0, endInTable), null);
      }
    }
  }
  sublist(start, end = null) {
    let length = this.length;
    let nonNullEnd = __dartCheckValidRange(start, end, length, null, null, null);
    let list = this._createList((nonNullEnd - start));
    this._writeToList(list, start, nonNullEnd);
    return list;
  }
  _writeToList(target, start = null, end = null) {
    ((start === null) ? start = 0 : null);
    ((end === null) ? end = this.length : null);
    let elementsToWrite = (end - start);
    let startInTable = ((this._head + start) & (this._table.length - 1));
    let endInTable = ((this._head + end) & (this._table.length - 1));
    if ((startInTable <= endInTable)) {
      {
        __dartListSetRange(target, 0, elementsToWrite, this._table, startInTable);
      }
    } else {
      {
        let firstPartSize = (this._table.length - startInTable);
        __dartListSetRange(target, 0, firstPartSize, this._table, startInTable);
        __dartListSetRange(target, firstPartSize, (firstPartSize + endInTable), this._table, 0);
      }
    }
    return elementsToWrite;
  }
  _growAtCapacity() {
    let newTable = this._createList((this._table.length * 2));
    let partitionPoint = (this._table.length - this._head);
    __dartListSetRange(newTable, 0, partitionPoint, this._table, this._head);
    if (!(__dartEquals(partitionPoint, this._table.length))) {
      {
        __dartListSetRange(newTable, partitionPoint, this._table.length, this._table, 0);
      }
    }
    this._head = 0;
    this._tail = this._table.length;
    this._table = newTable;
  }
  _growTo(newElementCount) {
    newElementCount = (newElementCount + __dartShr(newElementCount, 1));
    let newTable = this._createList(_nextPowerOf2(newElementCount));
    this._tail = this._writeToList(newTable);
    this._table = newTable;
    this._head = 0;
  }
  _createList(size) {
    throw new TypeError("Abstract member _TypedQueue._createList");
  }
  _createBuffer(size) {
    throw new TypeError("Abstract member _TypedQueue._createBuffer");
  }
  get _defaultValue() {
    throw new TypeError("Abstract member _TypedQueue._defaultValue");
  }
  set _defaultValue(value) {
    Object.defineProperty(this, "_defaultValue", { value, writable: true, configurable: true, enumerable: true });
  }
}

class _IntQueue extends _TypedQueue {
  constructor(queue) {
    super(queue);
  }
  get _defaultValue() {
    return 0;
  }
}

class _FloatQueue extends _TypedQueue {
  constructor(queue) {
    super(queue);
  }
  get _defaultValue() {
    return 0.0;
  }
}

class Uint8Queue extends _IntQueue {
  constructor(initialCapacity = null) {
    super(new Uint8Array(_chooseRealInitialCapacity(initialCapacity)));
    Object.defineProperty(this, $QueueList_interface, { value: true });
  }
  static fromList(elements) {
    return (() => { let v = new Uint8Queue(elements.length); return (() => {
      v.addAll(elements);
      return v;
    })(); })();
  }
  _createList(size) {
    return new Uint8Array(size);
  }
  _createBuffer(size) {
    return new Uint8Buffer(size);
  }
}

class Int8Queue extends _IntQueue {
  constructor(initialCapacity = null) {
    super(new Int8Array(_chooseRealInitialCapacity(initialCapacity)));
    Object.defineProperty(this, $QueueList_interface, { value: true });
  }
  static fromList(elements) {
    return (() => { let v = new Int8Queue(elements.length); return (() => {
      v.addAll(elements);
      return v;
    })(); })();
  }
  _createList(size) {
    return new Int8Array(size);
  }
  _createBuffer(size) {
    return new Int8Buffer(size);
  }
}

class Uint8ClampedQueue extends _IntQueue {
  constructor(initialCapacity = null) {
    super(new Uint8ClampedArray(_chooseRealInitialCapacity(initialCapacity)));
    Object.defineProperty(this, $QueueList_interface, { value: true });
  }
  static fromList(elements) {
    return (() => { let v = new Uint8ClampedQueue(elements.length); return (() => {
      v.addAll(elements);
      return v;
    })(); })();
  }
  _createList(size) {
    return new Uint8ClampedArray(size);
  }
  _createBuffer(size) {
    return new Uint8ClampedBuffer(size);
  }
}

class Uint16Queue extends _IntQueue {
  constructor(initialCapacity = null) {
    super(new Uint16Array(_chooseRealInitialCapacity(initialCapacity)));
    Object.defineProperty(this, $QueueList_interface, { value: true });
  }
  static fromList(elements) {
    return (() => { let v = new Uint16Queue(elements.length); return (() => {
      v.addAll(elements);
      return v;
    })(); })();
  }
  _createList(size) {
    return new Uint16Array(size);
  }
  _createBuffer(size) {
    return new Uint16Buffer(size);
  }
}

class Int16Queue extends _IntQueue {
  constructor(initialCapacity = null) {
    super(new Int16Array(_chooseRealInitialCapacity(initialCapacity)));
    Object.defineProperty(this, $QueueList_interface, { value: true });
  }
  static fromList(elements) {
    return (() => { let v = new Int16Queue(elements.length); return (() => {
      v.addAll(elements);
      return v;
    })(); })();
  }
  _createList(size) {
    return new Int16Array(size);
  }
  _createBuffer(size) {
    return new Int16Buffer(size);
  }
}

class Uint32Queue extends _IntQueue {
  constructor(initialCapacity = null) {
    super(new Uint32Array(_chooseRealInitialCapacity(initialCapacity)));
    Object.defineProperty(this, $QueueList_interface, { value: true });
  }
  static fromList(elements) {
    return (() => { let v = new Uint32Queue(elements.length); return (() => {
      v.addAll(elements);
      return v;
    })(); })();
  }
  _createList(size) {
    return new Uint32Array(size);
  }
  _createBuffer(size) {
    return new Uint32Buffer(size);
  }
}

class Int32Queue extends _IntQueue {
  constructor(initialCapacity = null) {
    super(new Int32Array(_chooseRealInitialCapacity(initialCapacity)));
    Object.defineProperty(this, $QueueList_interface, { value: true });
  }
  static fromList(elements) {
    return (() => { let v = new Int32Queue(elements.length); return (() => {
      v.addAll(elements);
      return v;
    })(); })();
  }
  _createList(size) {
    return new Int32Array(size);
  }
  _createBuffer(size) {
    return new Int32Buffer(size);
  }
}

class Uint64Queue extends _IntQueue {
  constructor(initialCapacity = null) {
    super(new BigUint64Array(_chooseRealInitialCapacity(initialCapacity)));
    Object.defineProperty(this, $QueueList_interface, { value: true });
  }
  static fromList(elements) {
    return (() => { let v = new Uint64Queue(elements.length); return (() => {
      v.addAll(elements);
      return v;
    })(); })();
  }
  _createList(size) {
    return new BigUint64Array(size);
  }
  _createBuffer(size) {
    return new Uint64Buffer(size);
  }
}

class Int64Queue extends _IntQueue {
  constructor(initialCapacity = null) {
    super(new BigInt64Array(_chooseRealInitialCapacity(initialCapacity)));
    Object.defineProperty(this, $QueueList_interface, { value: true });
  }
  static fromList(elements) {
    return (() => { let v = new Int64Queue(elements.length); return (() => {
      v.addAll(elements);
      return v;
    })(); })();
  }
  _createList(size) {
    return new BigInt64Array(size);
  }
  _createBuffer(size) {
    return new Int64Buffer(size);
  }
}

class Float32Queue extends _FloatQueue {
  constructor(initialCapacity = null) {
    super(new Float32Array(_chooseRealInitialCapacity(initialCapacity)));
    Object.defineProperty(this, $QueueList_interface, { value: true });
  }
  static fromList(elements) {
    return (() => { let v = new Float32Queue(elements.length); return (() => {
      v.addAll(elements);
      return v;
    })(); })();
  }
  _createList(size) {
    return new Float32Array(size);
  }
  _createBuffer(size) {
    return new Float32Buffer(size);
  }
}

class Float64Queue extends _FloatQueue {
  constructor(initialCapacity = null) {
    super(new Float64Array(_chooseRealInitialCapacity(initialCapacity)));
    Object.defineProperty(this, $QueueList_interface, { value: true });
  }
  static fromList(elements) {
    return (() => { let v = new Float64Queue(elements.length); return (() => {
      v.addAll(elements);
      return v;
    })(); })();
  }
  _createList(size) {
    return new Float64Array(size);
  }
  _createBuffer(size) {
    return new Float64Buffer(size);
  }
}

class Int32x4Queue extends _TypedQueue {
  constructor(initialCapacity = null) {
    super(new Array(_chooseRealInitialCapacity(initialCapacity)).fill(null));
    Object.defineProperty(this, $QueueList_interface, { value: true });
  }
  static fromList(elements) {
    return (() => { let v = new Int32x4Queue(elements.length); return (() => {
      v.addAll(elements);
      return v;
    })(); })();
  }
  _createList(size) {
    return new Array(size).fill(null);
  }
  _createBuffer(size) {
    return new Int32x4Buffer(size);
  }
  get _defaultValue() {
    return Int32x4Queue._zero;
  }
}

class Float32x4Queue extends _TypedQueue {
  constructor(initialCapacity = null) {
    super(new Array(_chooseRealInitialCapacity(initialCapacity)).fill(null));
    Object.defineProperty(this, $QueueList_interface, { value: true });
  }
  static fromList(elements) {
    return (() => { let v = new Float32x4Queue(elements.length); return (() => {
      v.addAll(elements);
      return v;
    })(); })();
  }
  _createList(size) {
    return new Array(size).fill(null);
  }
  _createBuffer(size) {
    return new Float32x4Buffer(size);
  }
  get _defaultValue() {
    return Object.freeze({ __dartType: "Float32x4", x: 0, y: 0, z: 0, w: 0 });
  }
}

class ByteAccumulatorSink {
  constructor() {
    this._buffer = new Uint8Buffer();
    this._isClosed = false;
  }
  get bytes() {
    return new Uint8Array(this._buffer.buffer, 0, this._buffer.length);
  }
  get isClosed() {
    return this._isClosed;
  }
  clear() {
    (this._buffer.length = 0, null);
  }
  add(chunk) {
    if (this._isClosed) {
      {
        (() => { throw __dartCoreError("StateError", "Can't add to a closed sink."); })();
      }
    }
    this._buffer.addAll(chunk);
  }
  addSlice(chunk, start, end, isLast) {
    if (this._isClosed) {
      {
        (() => { throw __dartCoreError("StateError", "Can't add to a closed sink."); })();
      }
    }
    this._buffer.addAll(chunk, start, end);
    if (isLast) {
      this._isClosed = true;
    }
  }
  close() {
    this._isClosed = true;
  }
  addByte(byte) { return this.add([byte]); }
}

class CodePage {
  static _general(name, characters) {
    return $CodePage__general(CodePage, name, characters);
  }
  static _bmp(name, characters) {
    return $CodePage__bmp(CodePage, name, characters);
  }
  constructor(name, characters) {
    return CodePage._general(name, characters);
  }
  "[]"(byte) {
    return this.decoder._char(byte);
  }
  encode(input, { invalidCharacter = null } = {}) {
    return this.encoder.convert(input, { invalidCharacter: invalidCharacter });
  }
  decode(bytes, { allowInvalid = false } = {}) {
    return this.decoder.convert(bytes, { allowInvalid: allowInvalid });
  }
  get encoder() {
    return (this._encoder ?? (this._encoder = this.decoder._createEncoder()));
  }
  fuse(other) { return __dartConverterFuse(this, other); }
}

function $CodePage__general($newTarget, name, characters) {
  const $self = Object.create($newTarget.prototype);
  $self._encoder = null;
  $self.name = name;
  $self.decoder = _createDecoder(characters);
  return $self;
}

function $CodePage__bmp($newTarget, name, characters) {
  const $self = Object.create($newTarget.prototype);
  $self._encoder = null;
  $self.name = name;
  $self.decoder = new _BmpCodePageDecoder(characters);
  return $self;
}

class CodePageDecoder {
  constructor() {
    Object.defineProperty(this, $CodePageDecoder_interface, { value: true });
  }
  convert(input, { allowInvalid = false } = {}) {
    throw new TypeError("Abstract member CodePageDecoder.convert");
  }
  _createEncoder() {
    throw new TypeError("Abstract member CodePageDecoder._createEncoder");
  }
  _char(byte) {
    throw new TypeError("Abstract member CodePageDecoder._char");
  }
  bind(stream) { return __dartConverterBind(this, stream); }
  fuse(next) { return __dartConverterFuse(this, next); }
  startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); }
}
Object.defineProperty(CodePageDecoder, Symbol.hasInstance, { value(value) { return value != null && value[$CodePageDecoder_interface] === true; } });

class _CodePageDecoderSink {
  constructor(_output, _decoder) {
    this._output = _output;
    this._decoder = _decoder;
  }
  add(chunk) {
    this._output.add(this._decoder.convert(chunk));
  }
  close() {
    this._output.close();
  }
  addSlice(chunk, start, end, isLast) { this.add(Array.from(chunk).slice(start, end)); if (isLast) this.close(); }
  addByte(byte) { return this.add([byte]); }
}

class _NonBmpCodePageDecoder {
  constructor(characters) {
    return $_NonBmpCodePageDecoder__(new.target, _NonBmpCodePageDecoder._buildMapping(characters));
  }
  static _(_characters) {
    return $_NonBmpCodePageDecoder__(_NonBmpCodePageDecoder, _characters);
  }
  _char(byte) {
    return __dartIndexGet(this._characters, byte);
  }
  static _buildMapping(characters) {
    let result = new Uint32Array(256);
    let i = 0;
    {
      let _sync_for_iterator = __dartIterator(Array.from(characters, (char) => char.codePointAt(0)));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let char = _sync_for_iterator.current;
          {
            if ((i >= 256)) {
              {
                (() => { throw __dartCoreError("ArgumentError", characters); })();
              }
            }
            __dartIndexSet(result, (() => { let v = i; return (() => { let v_1 = i = (v + 1); return v; })(); })(), char);
          }
        }
      }
    }
    if ((i < 256)) {
      {
        (() => { throw __dartCoreError("ArgumentError", characters); })();
      }
    }
    return result;
  }
  _createEncoder() {
    let result = new Map([]);
    for (let i = 0; (i < 256); i = (i + 1)) {
      {
        let char = __dartIndexGet(this._characters, i);
        if (!(__dartEquals(char, 65533))) {
          {
            __dartMapSet(result, char, i);
          }
        }
      }
    }
    return CodePageEncoder._(result);
  }
  convert(input, { allowInvalid = false } = {}) {
    let buffer = new Uint32Array(input.length);
    for (let i = 0; (i < input.length); i = (i + 1)) {
      {
        let byte = __dartIndexGet(input, i);
        if (!(__dartEquals((byte & 255), byte))) {
          (() => { throw __dartCoreError("FormatException", "Not a byte"); })();
        }
        __dartIndexSet(buffer, i, __dartIndexGet(this._characters, byte));
      }
    }
    return String.fromCodePoint(...Array.from(buffer));
  }
  startChunkedConversion(sink) {
    return new _CodePageDecoderSink(sink, this);
  }
  bind(stream) { return __dartConverterBind(this, stream); }
  fuse(next) { return __dartConverterFuse(this, next); }
}

function $_NonBmpCodePageDecoder__($newTarget, _characters) {
  const $self = Object.create($newTarget.prototype);
  Object.defineProperty($self, $CodePageDecoder_interface, { value: true });
  $self._characters = _characters;
  return $self;
}

class _BmpCodePageDecoder {
  constructor(characters) {
    this._characters = characters;
    Object.defineProperty(this, $CodePageDecoder_interface, { value: true });
    if (!(__dartEquals(characters.length, 256))) {
      {
        (() => { throw __dartCoreError("ArgumentError", characters); })();
      }
    }
  }
  _char(byte) {
    return this._characters.charCodeAt(byte);
  }
  convert(bytes, { allowInvalid = false } = {}) {
    if (allowInvalid) {
      return this._convertAllowInvalid(bytes);
    }
    let count = bytes.length;
    let codeUnits = new Uint16Array(count);
    for (let i = 0; (i < count); i = (i + 1)) {
      {
        let byte = __dartIndexGet(bytes, i);
        if (!(__dartEquals(byte, (byte & 255)))) {
          {
            (() => { throw __dartCoreError("FormatException", "Not a byte value"); })();
          }
        }
        let character = this._characters.charCodeAt(byte);
        if (__dartEquals(character, 65533)) {
          {
            (() => { throw __dartCoreError("FormatException", "Not defined in this code page"); })();
          }
        }
        __dartIndexSet(codeUnits, i, character);
      }
    }
    return String.fromCodePoint(...Array.from(codeUnits));
  }
  startChunkedConversion(sink) {
    return new _CodePageDecoderSink(sink, this);
  }
  _convertAllowInvalid(bytes) {
    let count = bytes.length;
    let codeUnits = new Uint16Array(count);
    for (let i = 0; (i < count); i = (i + 1)) {
      {
        let byte = __dartIndexGet(bytes, i);
        let character = null;
        if (__dartEquals(byte, (byte & 255))) {
          {
            character = this._characters.charCodeAt(byte);
          }
        } else {
          {
            character = 65533;
          }
        }
        __dartIndexSet(codeUnits, i, character);
      }
    }
    return String.fromCodePoint(...Array.from(codeUnits));
  }
  _createEncoder() {
    return CodePageEncoder._bmp(this._characters);
  }
  bind(stream) { return __dartConverterBind(this, stream); }
  fuse(next) { return __dartConverterFuse(this, next); }
}

class CodePageEncoder {
  constructor() {
    throw new TypeError("Class CodePageEncoder has no unnamed constructor");
  }
  static _bmp(characters) {
    return $CodePageEncoder__bmp(CodePageEncoder, characters);
  }
  static _(_encoding) {
    return $CodePageEncoder__(CodePageEncoder, _encoding);
  }
  static _createBmpEncoding(characters) {
    let encoding = new Map([]);
    for (let i = 0; (i < characters.length); i = (i + 1)) {
      {
        let char = characters.charCodeAt(i);
        if (!(__dartEquals(char, 65533))) {
          __dartMapSet(encoding, characters.charCodeAt(i), i);
        }
      }
    }
    return encoding;
  }
  convert(input, { invalidCharacter = null } = {}) {
    if (!((invalidCharacter === null))) {
      {
        __dartCheckValueInInterval(invalidCharacter, 0, 255, "invalidCharacter", null);
      }
    }
    let count = input.length;
    let result = new Uint8Array(count);
    let j = 0;
    for (let i = 0; (i < count); i = (i + 1)) {
      {
        let char = input.charCodeAt(i);
        let byte = __dartMapGet(this._encoding, char);
        L:
        if ((byte === null)) {
          {
            let offset = i;
            if ((__dartEquals((char & 64512), 55296) && ((i + 1) < count))) {
              {
                let next = input.charCodeAt((i + 1));
                if (__dartEquals((next & 64512), 56320)) {
                  {
                    i = (i + 1);
                    char = ((65536 + ((char & 1023) << 10)) + (next & 1023));
                    byte = __dartMapGet(this._encoding, char);
                    if (!((byte === null))) {
                      break L;
                    }
                  }
                }
              }
            }
            byte = (invalidCharacter ?? (() => { throw __dartCoreError("FormatException", "Not a character in this code page"); })());
          }
        }
        __dartIndexSet(result, (() => { let v = j; return (() => { let v_1 = j = (v + 1); return v; })(); })(), byte);
      }
    }
    return __dartTypedDataSublistView(result, 0, j, Uint8Array, 1);
  }
  bind(stream) { return __dartConverterBind(this, stream); }
  fuse(next) { return __dartConverterFuse(this, next); }
  startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); }
}

function $CodePageEncoder__bmp($newTarget, characters) {
  const $self = Object.create($newTarget.prototype);
  $self._encoding = CodePageEncoder._createBmpEncoding(characters);
  return $self;
}

function $CodePageEncoder__($newTarget, _encoding) {
  const $self = Object.create($newTarget.prototype);
  $self._encoding = _encoding;
  return $self;
}

class FixedDateTimeFormatter {
  constructor(pattern, { isUtc = true } = {}) {
    this._blocks = new _ParsedFormatBlocks();
    this.pattern = pattern;
    this.isUtc = isUtc;
    let currentCharacter = null;
    let start = 0;
    for (let i = 0; (i < this.pattern.length); i = (i + 1)) {
      {
        let formatCharacter = this.pattern.charCodeAt(i);
        if (!(__dartEquals(currentCharacter, formatCharacter))) {
          {
            this._blocks.saveBlock(currentCharacter, start, i);
            if (__dartIterableContains(__dartConst("[\"list\",\"InterfaceType(int)\",[\"int\",\"89\"],[\"int\",\"77\"],[\"int\",\"68\"],[\"int\",\"69\"],[\"int\",\"67\"],[\"int\",\"104\"],[\"int\",\"109\"],[\"int\",\"115\"],[\"int\",\"83\"]]", () => Object.freeze([89, 77, 68, 69, 67, 104, 109, 115, 83])), formatCharacter)) {
              {
                let hasSeenBefore = __dartListIndexOf(this._blocks.formatCharacters, formatCharacter, 0);
                if ((hasSeenBefore > (-1))) {
                  {
                    (() => { throw __dartCoreError("FormatException", "Pattern contains more than one '" + __dartStr(formatCharacter) + "' block.\n" + "Previous occurrence at index " + __dartStr(__dartIndexGet(this._blocks.starts, hasSeenBefore))); })();
                  }
                } else {
                  {
                    start = i;
                    currentCharacter = formatCharacter;
                  }
                }
              }
            } else {
              {
                currentCharacter = null;
              }
            }
          }
        }
      }
    }
    this._blocks.saveBlock(currentCharacter, start, this.pattern.length);
  }
  encode(dateTime) {
    if ((dateTime.year < 0)) {
      {
        (() => { throw __dartCoreError("ArgumentError", dateTime); })();
      }
    }
    let buffer = __dartStringBuffer("");
    for (let i = 0; (i < this._blocks.length); i = (i + 1)) {
      {
        let start = __dartIndexGet(this._blocks.starts, i);
        let end = __dartIndexGet(this._blocks.ends, i);
        let length = (end - start);
        let previousEnd = ((i > 0) ? __dartIndexGet(this._blocks.ends, (i - 1)) : 0);
        if ((previousEnd < start)) {
          {
            buffer.write(this.pattern.substring(previousEnd, start));
          }
        }
        let formatCharacter = __dartIndexGet(this._blocks.formatCharacters, i);
        let number = this._extractNumberFromDateTime(formatCharacter, dateTime, length);
        if ((number.length > length)) {
          {
            number = number.substring((number.length - length));
          }
        } else {
          if ((length > number.length)) {
            {
              number = number.padStart(length, "0");
            }
          }
        }
        buffer.write(number);
      }
    }
    if ((this._blocks.length > 0)) {
      {
        let lastEnd = __dartIterableLast(this._blocks.ends);
        if ((lastEnd < this.pattern.length)) {
          {
            buffer.write(this.pattern.substring(lastEnd, this.pattern.length));
          }
        }
      }
    }
    return __dartStr(buffer);
  }
  _extractNumberFromDateTime(formatCharacter, dateTime, length) {
    let value = null;
    L:
    switch (formatCharacter) {
      case 89:
        {
          value = dateTime.year;
          break L;
        }
      case 67:
        {
          value = __dartTruncDiv(dateTime.year, 100);
          break L;
        }
      case 69:
        {
          value = __dartTruncDiv(dateTime.year, 10);
          break L;
        }
      case 77:
        {
          value = dateTime.month;
          break L;
        }
      case 68:
        {
          value = dateTime.day;
          break L;
        }
      case 104:
        {
          value = dateTime.hour;
          break L;
        }
      case 109:
        {
          value = dateTime.minute;
          break L;
        }
      case 115:
        {
          value = dateTime.second;
          break L;
        }
      case 83:
        {
          value = dateTime.millisecond;
          L_1:
          switch (length) {
            case 1:
              {
                value = __dartTruncDiv(value, 100);
                break L_1;
              }
            case 2:
              {
                value = __dartTruncDiv(value, 10);
                break L_1;
              }
            case 3:
              {
                break L_1;
              }
            case 4:
              {
                value = ((value * 10) + __dartTruncDiv(dateTime.microsecond, 100));
                break L_1;
              }
            case 5:
              {
                value = ((value * 100) + __dartTruncDiv(dateTime.microsecond, 10));
                break L_1;
              }
            case 6:
              {
                value = ((value * 1000) + dateTime.microsecond);
                break L_1;
              }
            default:
              {
                (() => { throw __dartCoreError("AssertionError", "Unreachable, length is restricted to 6 in the constructor"); })();
              }
          }
          break L;
        }
      default:
        {
          (() => { throw __dartCoreError("AssertionError", "Unreachable, the key is checked in the constructor"); })();
        }
    }
    return __dartStr(value).padStart(length, "0");
  }
  decode(formattedDateTime) {
    return __dartNullCheck(this._decode(formattedDateTime, this.isUtc, true));
  }
  tryDecode(formattedDateTime) {
    return this._decode(formattedDateTime, this.isUtc, false);
  }
  _decode(formattedDateTime, isUtc, throwOnError) {
    let year = 0;
    let month = 1;
    let day = 1;
    let hour = 0;
    let minute = 0;
    let second = 0;
    let microsecond = 0;
    for (let i = 0; (i < this._blocks.length); i = (i + 1)) {
      {
        let formatCharacter = __dartIndexGet(this._blocks.formatCharacters, i);
        let number = this._extractNumberFromString(formattedDateTime, i, throwOnError);
        if (!((number === null))) {
          {
            if (__dartEquals(formatCharacter, 83)) {
              {
                number = (number * __dartIndexGet(__dartConst("[\"list\",\"InterfaceType(int)\",[\"int\",\"1\"],[\"int\",\"10\"],[\"int\",\"100\"],[\"int\",\"1000\"],[\"int\",\"10000\"],[\"int\",\"100000\"]]", () => Object.freeze([1, 10, 100, 1000, 10000, 100000])), (6 - (__dartIndexGet(this._blocks.ends, i) - __dartIndexGet(this._blocks.starts, i)))));
              }
            }
            L:
            switch (formatCharacter) {
              case 89:
                {
                  year = (year + number);
                  break L;
                }
              case 67:
                {
                  year = (year + (number * 100));
                  break L;
                }
              case 69:
                {
                  year = (year + (number * 10));
                  break L;
                }
              case 77:
                {
                  month = number;
                  break L;
                }
              case 68:
                {
                  day = number;
                  break L;
                }
              case 104:
                {
                  hour = number;
                  break L;
                }
              case 109:
                {
                  minute = number;
                  break L;
                }
              case 115:
                {
                  second = number;
                  break L;
                }
              case 83:
                {
                  microsecond = number;
                  break L;
                }
            }
          }
        } else {
          {
            return null;
          }
        }
      }
    }
    if (isUtc) {
      {
        return __dartDateTimeFromParts(true, year, month, day, hour, minute, second, 0, microsecond);
      }
    } else {
      {
        return __dartDateTimeFromParts(false, year, month, day, hour, minute, second, 0, microsecond);
      }
    }
  }
  _extractNumberFromString(formattedDateTime, index, throwOnError) {
    let parsed = this.tryParse(formattedDateTime, __dartIndexGet(this._blocks.starts, index), __dartIndexGet(this._blocks.ends, index));
    if (((parsed === null) && throwOnError)) {
      {
        (() => { throw __dartCoreError("FormatException", "Expected digits at " + __dartStr(formattedDateTime.substring(__dartIndexGet(this._blocks.starts, index), __dartIndexGet(this._blocks.ends, index)))); })();
      }
    }
    return parsed;
  }
  tryParse(formattedDateTime, start, end) {
    let result = 0;
    for (let i = start; (i < end); i = (i + 1)) {
      {
        let digit = (formattedDateTime.charCodeAt(i) ^ 48);
        if ((digit <= 9)) {
          {
            result = ((result * 10) + digit);
          }
        } else {
          {
            return null;
          }
        }
      }
    }
    return result;
  }
}

class _ParsedFormatBlocks {
  constructor() {
    this.formatCharacters = new Array(0).fill(null);
    this.starts = new Array(0).fill(null);
    this.ends = new Array(0).fill(null);
  }
  get length() {
    return this.formatCharacters.length;
  }
  saveBlock(char, start, end) {
    if (!((char === null))) {
      {
        if ((__dartEquals(char, 83) && ((end - start) > 6))) {
          {
            (() => { throw __dartCoreError("FormatException", "Fractional seconds can only be specified up to microseconds"); })();
          }
        } else {
          if (((end - start) > 9)) {
            {
              (() => { throw __dartCoreError("FormatException", "Length of a format char block cannot be larger than 9"); })();
            }
          }
        }
        (this.formatCharacters.push(char), null);
        (this.starts.push(start), null);
        (this.ends.push(end), null);
      }
    }
  }
}

class HexDecoder {
  constructor() {
    throw new TypeError("Class HexDecoder has no unnamed constructor");
  }
  static _() {
    return $HexDecoder__(HexDecoder);
  }
  convert(input) {
    if (!((Math.trunc(input.length) % 2 === 0))) {
      {
        (() => { throw __dartCoreError("FormatException", "Invalid input length, must be even."); })();
      }
    }
    let bytes = new Uint8Array(__dartTruncDiv(input.length, 2));
    _decode(Array.from({ length: input.length }, (_, index) => input.charCodeAt(index)), 0, input.length, bytes, 0);
    return bytes;
  }
  startChunkedConversion(sink) {
    return new _HexDecoderSink(sink);
  }
  bind(stream) { return __dartConverterBind(this, stream); }
  fuse(next) { return __dartConverterFuse(this, next); }
}

function $HexDecoder__($newTarget) {
  const $self = Object.create($newTarget.prototype);
  return $self;
}

class _HexDecoderSink {
  constructor(_sink) {
    this._lastDigit = null;
    this._sink = _sink;
  }
  addSlice(string, start, end, isLast) {
    __dartCheckValidRange(start, end, string.length, null, null, null);
    if (__dartEquals(start, end)) {
      {
        if (isLast) {
          this._close(string, end);
        }
        return;
      }
    }
    let codeUnits = Array.from({ length: string.length }, (_, index) => string.charCodeAt(index));
    let bytes = null;
    let bytesStart = null;
    if ((this._lastDigit === null)) {
      {
        bytes = new Uint8Array(__dartTruncDiv((end - start), 2));
        bytesStart = 0;
      }
    } else {
      {
        let hexPairs = __dartTruncDiv(((end - start) - 1), 2);
        bytes = new Uint8Array((1 + hexPairs));
        __dartIndexSet(bytes, 0, (__dartNullCheck(this._lastDigit) + digitForCodeUnit(codeUnits, start)));
        start = (start + 1);
        bytesStart = 1;
      }
    }
    this._lastDigit = _decode(codeUnits, start, end, bytes, bytesStart);
    this._sink.add(bytes);
    if (isLast) {
      this._close(string, end);
    }
  }
  asUtf8Sink(allowMalformed) {
    return new _HexDecoderByteSink(this._sink);
  }
  close() {
    return this._close();
  }
  _close(string = null, index = null) {
    if (!((this._lastDigit === null))) {
      {
        (() => { throw __dartCoreError("FormatException", "Input ended with incomplete encoded byte."); })();
      }
    }
    this._sink.close();
  }
  add(string) { return this.addSlice(string, 0, string.length, false); }
}

class _HexDecoderByteSink {
  constructor(_sink) {
    this._lastDigit = null;
    this._sink = _sink;
  }
  add(chunk) {
    return this.addSlice(chunk, 0, chunk.length, false);
  }
  addSlice(chunk, start, end, isLast) {
    __dartCheckValidRange(start, end, chunk.length, null, null, null);
    if (__dartEquals(start, end)) {
      {
        if (isLast) {
          this._close(chunk, end);
        }
        return;
      }
    }
    let bytes = null;
    let bytesStart = null;
    if ((this._lastDigit === null)) {
      {
        bytes = new Uint8Array(__dartTruncDiv((end - start), 2));
        bytesStart = 0;
      }
    } else {
      {
        let hexPairs = __dartTruncDiv(((end - start) - 1), 2);
        bytes = new Uint8Array((1 + hexPairs));
        __dartIndexSet(bytes, 0, (__dartNullCheck(this._lastDigit) + digitForCodeUnit(chunk, start)));
        start = (start + 1);
        bytesStart = 1;
      }
    }
    this._lastDigit = _decode(chunk, start, end, bytes, bytesStart);
    this._sink.add(bytes);
    if (isLast) {
      this._close(chunk, end);
    }
  }
  close() {
    return this._close();
  }
  _close(chunk = null, index = null) {
    if (!((this._lastDigit === null))) {
      {
        (() => { throw __dartCoreError("FormatException", "Input ended with incomplete encoded byte."); })();
      }
    }
    this._sink.close();
  }
  addByte(byte) { return this.add([byte]); }
}

class HexEncoder {
  constructor() {
    throw new TypeError("Class HexEncoder has no unnamed constructor");
  }
  static _() {
    return $HexEncoder__(HexEncoder);
  }
  convert(input) {
    return _convert(input, 0, input.length);
  }
  startChunkedConversion(sink) {
    return new _HexEncoderSink(sink);
  }
  bind(stream) { return __dartConverterBind(this, stream); }
  fuse(next) { return __dartConverterFuse(this, next); }
}

function $HexEncoder__($newTarget) {
  const $self = Object.create($newTarget.prototype);
  return $self;
}

class _HexEncoderSink {
  constructor(_sink) {
    this._sink = _sink;
  }
  add(chunk) {
    this._sink.add(_convert(chunk, 0, chunk.length));
  }
  addSlice(chunk, start, end, isLast) {
    __dartCheckValidRange(start, end, chunk.length, null, null, null);
    this._sink.add(_convert(chunk, start, end));
    if (isLast) {
      this._sink.close();
    }
  }
  close() {
    this._sink.close();
  }
  addByte(byte) { return this.add([byte]); }
}

class HexCodec {
  constructor() {
    throw new TypeError("Class HexCodec has no unnamed constructor");
  }
  static _() {
    return $HexCodec__(HexCodec);
  }
  get encoder() {
    return __dartConst("[\"instance\",\"class:HexEncoder\"]", () => Object.freeze(Object.create(HexEncoder.prototype)));
  }
  get decoder() {
    return __dartConst("[\"instance\",\"class:HexDecoder\"]", () => Object.freeze(Object.create(HexDecoder.prototype)));
  }
  encode(input) { return this.encoder.convert(input); }
  decode(encoded) { return this.decoder.convert(encoded); }
  fuse(other) { return __dartConverterFuse(this, other); }
}

function $HexCodec__($newTarget) {
  const $self = Object.create($newTarget.prototype);
  return $self;
}

class _IdentityConverter {
  convert(input) {
    return input;
  }
  bind(stream) { return __dartConverterBind(this, stream); }
  fuse(next) { return __dartConverterFuse(this, next); }
  startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); }
}

class IdentityCodec {
  get decoder() {
    return new _IdentityConverter();
  }
  get encoder() {
    return new _IdentityConverter();
  }
  fuse(other) {
    return other;
  }
  encode(input) { return this.encoder.convert(input); }
  decode(encoded) { return this.decoder.convert(encoded); }
}

class PercentDecoder {
  constructor() {
    throw new TypeError("Class PercentDecoder has no unnamed constructor");
  }
  static _() {
    return $PercentDecoder__(PercentDecoder);
  }
  convert(input) {
    let buffer = new Uint8Buffer();
    let lastDigit = _decode_1(Array.from({ length: input.length }, (_, index) => input.charCodeAt(index)), 0, input.length, buffer);
    if (!((lastDigit === null))) {
      {
        (() => { throw __dartCoreError("FormatException", "Input ended with incomplete encoded byte."); })();
      }
    }
    return new Uint8Array(buffer.buffer, 0, buffer.length);
  }
  startChunkedConversion(sink) {
    return new _PercentDecoderSink(sink);
  }
  bind(stream) { return __dartConverterBind(this, stream); }
  fuse(next) { return __dartConverterFuse(this, next); }
}

function $PercentDecoder__($newTarget) {
  const $self = Object.create($newTarget.prototype);
  return $self;
}

class _PercentDecoderSink {
  constructor(_sink) {
    this._lastDigit = null;
    this._sink = _sink;
  }
  addSlice(string, start, end, isLast) {
    __dartCheckValidRange(start, end, string.length, null, null, null);
    if (__dartEquals(start, end)) {
      {
        if (isLast) {
          this._close(string, end);
        }
        return;
      }
    }
    let buffer = new Uint8Buffer();
    let codeUnits = Array.from({ length: string.length }, (_, index) => string.charCodeAt(index));
    if (__dartEquals(this._lastDigit, -1)) {
      {
        this._lastDigit = (16 * digitForCodeUnit(codeUnits, start));
        start = (start + 1);
        if (__dartEquals(start, end)) {
          {
            if (isLast) {
              this._close(string, end);
            }
            return;
          }
        }
      }
    }
    if (!((this._lastDigit === null))) {
      {
        buffer.add((__dartNullCheck(this._lastDigit) + digitForCodeUnit(codeUnits, start)));
        start = (start + 1);
      }
    }
    this._lastDigit = _decode_1(codeUnits, start, end, buffer);
    this._sink.add(new Uint8Array(buffer.buffer, 0, buffer.length));
    if (isLast) {
      this._close(string, end);
    }
  }
  asUtf8Sink(allowMalformed) {
    return new _PercentDecoderByteSink(this._sink);
  }
  close() {
    return this._close();
  }
  _close(string = null, index = null) {
    if (!((this._lastDigit === null))) {
      {
        (() => { throw __dartCoreError("FormatException", "Input ended with incomplete encoded byte."); })();
      }
    }
    this._sink.close();
  }
  add(string) { return this.addSlice(string, 0, string.length, false); }
}

class _PercentDecoderByteSink {
  constructor(_sink) {
    this._lastDigit = null;
    this._sink = _sink;
  }
  add(chunk) {
    return this.addSlice(chunk, 0, chunk.length, false);
  }
  addSlice(chunk, start, end, isLast) {
    __dartCheckValidRange(start, end, chunk.length, null, null, null);
    if (__dartEquals(start, end)) {
      {
        if (isLast) {
          this._close(chunk, end);
        }
        return;
      }
    }
    let buffer = new Uint8Buffer();
    if (__dartEquals(this._lastDigit, -1)) {
      {
        this._lastDigit = (16 * digitForCodeUnit(chunk, start));
        start = (start + 1);
        if (__dartEquals(start, end)) {
          {
            if (isLast) {
              this._close(chunk, end);
            }
            return;
          }
        }
      }
    }
    if (!((this._lastDigit === null))) {
      {
        buffer.add((__dartNullCheck(this._lastDigit) + digitForCodeUnit(chunk, start)));
        start = (start + 1);
      }
    }
    this._lastDigit = _decode_1(chunk, start, end, buffer);
    this._sink.add(new Uint8Array(buffer.buffer, 0, buffer.length));
    if (isLast) {
      this._close(chunk, end);
    }
  }
  close() {
    return this._close();
  }
  _close(chunk = null, index = null) {
    if (!((this._lastDigit === null))) {
      {
        (() => { throw __dartCoreError("FormatException", "Input ended with incomplete encoded byte."); })();
      }
    }
    this._sink.close();
  }
  addByte(byte) { return this.add([byte]); }
}

class PercentEncoder {
  constructor() {
    throw new TypeError("Class PercentEncoder has no unnamed constructor");
  }
  static _() {
    return $PercentEncoder__(PercentEncoder);
  }
  convert(input) {
    return _convert_1(input, 0, input.length);
  }
  startChunkedConversion(sink) {
    return new _PercentEncoderSink(sink);
  }
  bind(stream) { return __dartConverterBind(this, stream); }
  fuse(next) { return __dartConverterFuse(this, next); }
}

function $PercentEncoder__($newTarget) {
  const $self = Object.create($newTarget.prototype);
  return $self;
}

class _PercentEncoderSink {
  constructor(_sink) {
    this._sink = _sink;
  }
  add(chunk) {
    this._sink.add(_convert_1(chunk, 0, chunk.length));
  }
  addSlice(chunk, start, end, isLast) {
    __dartCheckValidRange(start, end, chunk.length, null, null, null);
    this._sink.add(_convert_1(chunk, start, end));
    if (isLast) {
      this._sink.close();
    }
  }
  close() {
    this._sink.close();
  }
  addByte(byte) { return this.add([byte]); }
}

class PercentCodec {
  constructor() {
    throw new TypeError("Class PercentCodec has no unnamed constructor");
  }
  static _() {
    return $PercentCodec__(PercentCodec);
  }
  get encoder() {
    return __dartConst("[\"instance\",\"class:PercentEncoder\"]", () => Object.freeze(Object.create(PercentEncoder.prototype)));
  }
  get decoder() {
    return __dartConst("[\"instance\",\"class:PercentDecoder\"]", () => Object.freeze(Object.create(PercentDecoder.prototype)));
  }
  encode(input) { return this.encoder.convert(input); }
  decode(encoded) { return this.decoder.convert(encoded); }
  fuse(other) { return __dartConverterFuse(this, other); }
}

function $PercentCodec__($newTarget) {
  const $self = Object.create($newTarget.prototype);
  return $self;
}

class StringAccumulatorSink {
  constructor() {
    this._buffer = __dartStringBuffer("");
    this._isClosed = false;
  }
  get string() {
    return __dartStr(this._buffer);
  }
  get isClosed() {
    return this._isClosed;
  }
  clear() {
    this._buffer.clear();
  }
  add(str) {
    if (this._isClosed) {
      {
        (() => { throw __dartCoreError("StateError", "Can't add to a closed sink."); })();
      }
    }
    this._buffer.write(str);
  }
  addSlice(chunk, start, end, isLast) {
    if (this._isClosed) {
      {
        (() => { throw __dartCoreError("StateError", "Can't add to a closed sink."); })();
      }
    }
    this._buffer.write(chunk.substring(start, end));
    if (isLast) {
      this._isClosed = true;
    }
  }
  close() {
    this._isClosed = true;
  }
  asUtf8Sink(allowMalformed) { return __dartStringConversionSinkAsUtf8Sink(this, allowMalformed); }
}

class _ListSink {
  constructor(values) {
    this.closed = false;
    this.values = values;
  }
  add(data) {
    (this.values.push(data), null);
  }
  close() {
    this.closed = true;
  }
}


Object.defineProperty(BoolList, "_entryShift", { value: 5, enumerable: true });

Object.defineProperty(BoolList, "_bitsPerEntry", { value: 32, enumerable: true });

Object.defineProperty(BoolList, "_entrySignBitIndex", { value: 31, enumerable: true });

Object.defineProperty(_GrowableBoolList, "_growthFactor", { value: 2, enumerable: true });

Object.defineProperty(HeapPriorityQueue, "_initialCapacity", { value: 7, enumerable: true });

Object.defineProperty(QueueList, "_initialCapacity", { value: 8, enumerable: true });

Object.defineProperty(TypedDataBuffer, "_initialLength", { value: 8, enumerable: true });

const $Int32x4Buffer__zero = __dartLazyField("Int32x4Buffer._zero", () => Object.freeze({ __dartType: "Int32x4", x: 0, y: 0, z: 0, w: 0 }), false);
Object.defineProperty(Int32x4Buffer, "_zero", {
  get() { return $Int32x4Buffer__zero.get(); },
  set(value) { $Int32x4Buffer__zero.set(value); },
  enumerable: true,
});

const $Int32x4Queue__zero = __dartLazyField("Int32x4Queue._zero", () => Object.freeze({ __dartType: "Int32x4", x: 0, y: 0, z: 0, w: 0 }), false);
Object.defineProperty(Int32x4Queue, "_zero", {
  get() { return $Int32x4Queue__zero.get(); },
  set(value) { $Int32x4Queue__zero.set(value); },
  enumerable: true,
});

Object.defineProperty(FixedDateTimeFormatter, "_powersOfTen", { value: __dartConst("[\"list\",\"InterfaceType(int)\",[\"int\",\"1\"],[\"int\",\"10\"],[\"int\",\"100\"],[\"int\",\"1000\"],[\"int\",\"10000\"],[\"int\",\"100000\"]]", () => Object.freeze([1, 10, 100, 1000, 10000, 100000])), enumerable: true });

Object.defineProperty(FixedDateTimeFormatter, "_validFormatCharacters", { value: __dartConst("[\"list\",\"InterfaceType(int)\",[\"int\",\"89\"],[\"int\",\"77\"],[\"int\",\"68\"],[\"int\",\"69\"],[\"int\",\"67\"],[\"int\",\"104\"],[\"int\",\"109\"],[\"int\",\"115\"],[\"int\",\"83\"]]", () => Object.freeze([89, 77, 68, 69, 67, 104, 109, 115, 83])), enumerable: true });

Object.defineProperty(FixedDateTimeFormatter, "_yearCode", { value: 89, enumerable: true });

Object.defineProperty(FixedDateTimeFormatter, "_monthCode", { value: 77, enumerable: true });

Object.defineProperty(FixedDateTimeFormatter, "_dayCode", { value: 68, enumerable: true });

Object.defineProperty(FixedDateTimeFormatter, "_decadeCode", { value: 69, enumerable: true });

Object.defineProperty(FixedDateTimeFormatter, "_centuryCode", { value: 67, enumerable: true });

Object.defineProperty(FixedDateTimeFormatter, "_hourCode", { value: 104, enumerable: true });

Object.defineProperty(FixedDateTimeFormatter, "_minuteCode", { value: 109, enumerable: true });

Object.defineProperty(FixedDateTimeFormatter, "_secondCode", { value: 115, enumerable: true });

Object.defineProperty(FixedDateTimeFormatter, "_fractionSecondCode", { value: 83, enumerable: true });
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
      let mid = (min + __dartShr((max - min), 1));
      let element = __dartIndexGet(sortedList, mid);
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
      let mid = (min + __dartShr((max - min), 1));
      let element = __dartIndexGet(sortedList, mid);
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
      let tmp1 = __dartIndexGet(elements, (start + pos));
      __dartIndexSet(elements, (start + pos), __dartIndexGet(elements, (start + length)));
      __dartIndexSet(elements, (start + length), tmp1);
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
      let tmp = __dartIndexGet(elements, i);
      __dartIndexSet(elements, i, __dartIndexGet(elements, j));
      __dartIndexSet(elements, j, tmp);
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
      let element = __dartIndexGet(elements, pos);
      while ((min < max)) {
        {
          let mid = (min + __dartShr((max - min), 1));
          let comparison = (compare)(element, __dartIndexGet(elements, mid));
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
      __dartIndexSet(elements, min, element);
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
  let firstLength = __dartShr((end - start), 1);
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
  let middle = (start + __dartShr(length, 1));
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
  __dartIndexSet(target, targetOffset, __dartIndexGet(list, start));
  for (let i = 1; (i < length); i = (i + 1)) {
    {
      let element = __dartIndexGet(list, (start + i));
      let elementKey = (keyOf)(element);
      let min = targetOffset;
      let max = (targetOffset + i);
      while ((min < max)) {
        {
          let mid = (min + __dartShr((max - min), 1));
          if (((compare)(elementKey, (keyOf)(__dartIndexGet(target, mid))) < 0)) {
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
      __dartIndexSet(target, min, element);
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
  let middle = (start + __dartShr(length, 1));
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
  let firstElement = __dartIndexGet(firstList, (() => { let v = cursor1; return (() => { let v_1 = cursor1 = (v + 1); return v; })(); })());
  let firstKey = (keyOf)(firstElement);
  let secondElement = __dartIndexGet(secondList, (() => { let v_2 = cursor2; return (() => { let v_3 = cursor2 = (v_2 + 1); return v_2; })(); })());
  let secondKey = (keyOf)(secondElement);
  L:
  while (true) {
    L_1:
    {
      if (((compare)(firstKey, secondKey) <= 0)) {
        {
          __dartIndexSet(target, (() => { let v_4 = targetOffset; return (() => { let v_5 = targetOffset = (v_4 + 1); return v_4; })(); })(), firstElement);
          if (__dartEquals(cursor1, firstEnd)) {
            break L;
          }
          firstElement = __dartIndexGet(firstList, (() => { let v_6 = cursor1; return (() => { let v_7 = cursor1 = (v_6 + 1); return v_6; })(); })());
          firstKey = (keyOf)(firstElement);
        }
      } else {
        {
          __dartIndexSet(target, (() => { let v_8 = targetOffset; return (() => { let v_9 = targetOffset = (v_8 + 1); return v_8; })(); })(), secondElement);
          if (!(__dartEquals(cursor2, secondEnd))) {
            {
              secondElement = __dartIndexGet(secondList, (() => { let v_10 = cursor2; return (() => { let v_11 = cursor2 = (v_10 + 1); return v_10; })(); })());
              secondKey = (keyOf)(secondElement);
              break L_1;
            }
          }
          __dartIndexSet(target, (() => { let v_12 = targetOffset; return (() => { let v_13 = targetOffset = (v_12 + 1); return v_12; })(); })(), firstElement);
          __dartListSetRange(target, targetOffset, (targetOffset + (firstEnd - cursor1)), firstList, cursor1);
          return;
        }
      }
    }
  }
  __dartIndexSet(target, (() => { let v_14 = targetOffset; return (() => { let v_15 = targetOffset = (v_14 + 1); return v_14; })(); })(), secondElement);
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
      let pivot = __dartIndexGet(list, pivotIndex);
      let pivotKey = (keyOf)(pivot);
      let endSmaller = start;
      let startGreater = end;
      let startPivots = (end - 1);
      __dartIndexSet(list, pivotIndex, __dartIndexGet(list, startPivots));
      __dartIndexSet(list, startPivots, pivot);
      while ((endSmaller < startPivots)) {
        {
          let current = __dartIndexGet(list, endSmaller);
          let relation = (compare)((keyOf)(current), pivotKey);
          if ((relation < 0)) {
            {
              endSmaller = (endSmaller + 1);
            }
          } else {
            {
              startPivots = (startPivots - 1);
              let currentTarget = startPivots;
              __dartIndexSet(list, endSmaller, __dartIndexGet(list, startPivots));
              if ((relation > 0)) {
                {
                  startGreater = (startGreater - 1);
                  currentTarget = startGreater;
                  __dartIndexSet(list, startPivots, __dartIndexGet(list, startGreater));
                }
              }
              __dartIndexSet(list, currentTarget, current);
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
      hash = __dartShr(hash, 6);
    }
  }
  hash = (536870911 & (hash + ((67108863 & hash) << 3)));
  hash = __dartShr(hash, 11);
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
              (chosen.push(__dartIndexGet(chosen, position)), null);
              __dartIndexSet(chosen, position, nextElement);
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
        __dartIndexSet(chosen, position_1, iterator.current);
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
      (action)(index, __dartIndexGet(_this, index));
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
      if (!((action)(__dartIndexGet(_this, index)))) {
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
      if (!((action)(index, __dartIndexGet(_this, index)))) {
        break L;
      }
    }
  }
}

function* ListExtensions_mapIndexed(_this, convert) {
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      yield (convert)(index, __dartIndexGet(_this, index));
    }
  }
}

function ListExtensions_get_mapIndexed(_this) {
  return function(convert) { return ListExtensions_mapIndexed(_this, convert); };
}

function* ListExtensions_whereIndexed(_this, test) {
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      let element = __dartIndexGet(_this, index);
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
      let element = __dartIndexGet(_this, index);
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
      yield* (expand)(index, __dartIndexGet(_this, index));
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
      let tmp = __dartIndexGet(_this, start);
      __dartIndexSet(_this, start, __dartIndexGet(_this, end));
      __dartIndexSet(_this, end, tmp);
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
  let tmp = __dartIndexGet(_this, index1);
  __dartIndexSet(_this, index1, __dartIndexGet(_this, index2));
  __dartIndexSet(_this, index2, tmp);
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
      if (!(equality.equals(__dartIndexGet(_this, i), __dartIndexGet(other, i)))) {
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
  return ((index < _this.length) ? __dartIndexGet(_this, index) : null);
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

const _defaultInitialCapacity = 16;

function _chooseRealInitialCapacity(initialCapacity) {
  if (((initialCapacity === null) || (initialCapacity < 16))) {
    {
      return 16;
    }
  } else {
    if (!(_isPowerOf2(initialCapacity))) {
      {
        return _nextPowerOf2(initialCapacity);
      }
    } else {
      {
        return initialCapacity;
      }
    }
  }
}

function _isPowerOf2(number) {
  return __dartEquals((number & (number - 1)), 0);
}

function _nextPowerOf2(number) {
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

const latin2 = CodePage._bmp("latin-2", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� Ą˘Ł¤ĽŚ§¨ŠŞŤŹ­ŽŻ°ą˛ł´ľśˇ¸šşťź˝žżŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎĐŃŇÓÔŐÖ×ŘŮÚŰÜÝŢßŕáâăäĺćçčéęëěíîďđńňóôőö÷řůúűüýţ˙");

const latin3 = CodePage._bmp("latin-3", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� Ħ˘£�¤Ĥ§¨İŞĞĴ­�Ż°ħ²³´µĥ·¸ışğĵ½�żÀÁÂ�ÄĊĈÇÈÉÊËÌÍÎÏ�ÑÒÓÔĠÖ×ĜÙÚÛÜŬŜßàáâ�äċĉçèéêëìíîï�ñòóôġö÷ĝùúûüŭŝ˙");

const latin4 = CodePage._bmp("latin-4", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� ĄĸŖ¤ĨĻ§¨ŠĒĢŦ­Ž¯°ą˛ŗ´ĩļˇ¸šēģŧŊžŋĀÁÂÃÄÅÆĮČÉĘËĖÍÎĪĐŅŌĶÔÕÖ×ØŲÚÛÜŨŪßāáâãäåæįčéęëėíîīđņōķôõö÷øųúûüũū˙");

const latinCyrillic = CodePage._bmp("cyrillic", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� ЁЂЃЄЅІЇЈЉЊЋЌ­ЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя№ёђѓєѕіїјљњћќ§ўџ");

const latinArabic = CodePage._bmp("arabic", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� ���¤�������،­�������������؛���؟�ءآأؤإئابةتثجحخدذرزسشصضطظعغ�����ـفقكلمنهوىيًٌٍَُِّْ�������������");

const latinGreek = CodePage._bmp("greek", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� ‘’£€₯¦§¨©ͺ«¬­�―°±²³΄΅Ά·ΈΉΊ»Ό½ΎΏΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ�ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώ�");

const latinHebrew = CodePage._bmp("hebrew", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� �¢£¤¥¦§¨©×«¬­®¯°±²³´µ¶·¸¹÷»¼½¾��������������������������������‗אבגדהוזחטיךכלםמןנסעףפץצקרשת��‎‏�");

const latin5 = CodePage._bmp("latin-5", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏĞÑÒÓÔÕÖ×ØÙÚÛÜİŞßàáâãäåæçèéêëìíîïğñòóôõö÷øùúûüışÿ");

const latin6 = CodePage._bmp("latin-6", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� ĄĒĢĪĨĶ§ĻĐŠŦŽ­ŪŊ°ąēģīĩķ·ļđšŧž―ūŋĀÁÂÃÄÅÆĮČÉĘËĖÍÎÏÐŅŌÓÔÕÖŨØŲÚÛÜÝÞßāáâãäåæįčéęëėíîïðņōóôõöũøųúûüýþĸ");

const latinThai = CodePage._bmp("tis620", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����");

const latin7 = CodePage._bmp("latin-7", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� ”¢£¤„¦§Ø©Ŗ«¬­®Æ°±²³“µ¶·ø¹ŗ»¼½¾æĄĮĀĆÄÅĘĒČÉŹĖĢĶĪĻŠŃŅÓŌÕÖ×ŲŁŚŪÜŻŽßąįāćäåęēčéźėģķīļšńņóōõö÷ųłśūüżž’");

const latin8 = CodePage._bmp("latin-8", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� Ḃḃ£ĊċḊ§Ẁ©ẂḋỲ­®ŸḞḟĠġṀṁ¶ṖẁṗẃṠỳẄẅṡÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏŴÑÒÓÔÕÖṪØÙÚÛÜÝŶßàáâãäåæçèéêëìíîïŵñòóôõöṫøùúûüýŷÿ");

const latin9 = CodePage._bmp("latin-9", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� ¡¢£€¥Š§š©ª«¬­®¯°±²³Žµ¶·ž¹º»ŒœŸ¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ");

const latin10 = CodePage._bmp("latin-10", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� ĄąŁ€„Š§š©Ș«Ź­źŻ°±ČłŽ”¶·žčș»ŒœŸżÀÁÂĂÄĆÆÇÈÉÊËÌÍÎÏĐŃÒÓÔŐÖŚŰÙÚÛÜĘȚßàáâăäćæçèéêëìíîïđńòóôőöśűùúûüęțÿ");

const _top8859_2 = " Ą˘Ł¤ĽŚ§¨ŠŞŤŹ­ŽŻ°ą˛ł´ľśˇ¸šşťź˝žżŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎĐŃŇÓÔŐÖ×ŘŮÚŰÜÝŢßŕáâăäĺćçčéęëěíîďđńňóôőö÷řůúűüýţ˙";

const _top8859_3 = " Ħ˘£�¤Ĥ§¨İŞĞĴ­�Ż°ħ²³´µĥ·¸ışğĵ½�żÀÁÂ�ÄĊĈÇÈÉÊËÌÍÎÏ�ÑÒÓÔĠÖ×ĜÙÚÛÜŬŜßàáâ�äċĉçèéêëìíîï�ñòóôġö÷ĝùúûüŭŝ˙";

const _top8859_4 = " ĄĸŖ¤ĨĻ§¨ŠĒĢŦ­Ž¯°ą˛ŗ´ĩļˇ¸šēģŧŊžŋĀÁÂÃÄÅÆĮČÉĘËĖÍÎĪĐŅŌĶÔÕÖ×ØŲÚÛÜŨŪßāáâãäåæįčéęëėíîīđņōķôõö÷øųúûüũū˙";

const _top8859_5 = " ЁЂЃЄЅІЇЈЉЊЋЌ­ЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя№ёђѓєѕіїјљњћќ§ўџ";

const _top8859_6 = " ���¤�������،­�������������؛���؟�ءآأؤإئابةتثجحخدذرزسشصضطظعغ�����ـفقكلمنهوىيًٌٍَُِّْ�������������";

const _top8859_7 = " ‘’£€₯¦§¨©ͺ«¬­�―°±²³΄΅Ά·ΈΉΊ»Ό½ΎΏΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ�ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώ�";

const _top8859_8 = " �¢£¤¥¦§¨©×«¬­®¯°±²³´µ¶·¸¹÷»¼½¾��������������������������������‗אבגדהוזחטיךכלםמןנסעףפץצקרשת��‎‏�";

const _top8859_9 = " ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏĞÑÒÓÔÕÖ×ØÙÚÛÜİŞßàáâãäåæçèéêëìíîïğñòóôõö÷øùúûüışÿ";

const _top8859_10 = " ĄĒĢĪĨĶ§ĻĐŠŦŽ­ŪŊ°ąēģīĩķ·ļđšŧž―ūŋĀÁÂÃÄÅÆĮČÉĘËĖÍÎÏÐŅŌÓÔÕÖŨØŲÚÛÜÝÞßāáâãäåæįčéęëėíîïðņōóôõöũøųúûüýþĸ";

const _top8859_11 = " กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����";

const _top8859_13 = " ”¢£¤„¦§Ø©Ŗ«¬­®Æ°±²³“µ¶·ø¹ŗ»¼½¾æĄĮĀĆÄÅĘĒČÉŹĖĢĶĪĻŠŃŅÓŌÕÖ×ŲŁŚŪÜŻŽßąįāćäåęēčéźėģķīļšńņóōõö÷ųłśūüżž’";

const _top8859_14 = " Ḃḃ£ĊċḊ§Ẁ©ẂḋỲ­®ŸḞḟĠġṀṁ¶ṖẁṗẃṠỳẄẅṡÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏŴÑÒÓÔÕÖṪØÙÚÛÜÝŶßàáâãäåæçèéêëìíîïŵñòóôõöṫøùúûüýŷÿ";

const _top8859_15 = " ¡¢£€¥Š§š©ª«¬­®¯°±²³Žµ¶·ž¹º»ŒœŸ¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ";

const _top8859_16 = " ĄąŁ€„Š§š©Ș«Ź­źŻ°±ČłŽ”¶·žčș»ŒœŸżÀÁÂĂÄĆÆÇÈÉÊËÌÍÎÏĐŃÒÓÔŐÖŚŰÙÚÛÜĘȚßàáâăäćæçèéêëìíîïđńòóôőöśűùúûüęțÿ";

const _noControls = "��������������������������������";

const _ascii = "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~�";

function _createDecoder(characters) {
  let result = new Uint32Array(256);
  let i = 0;
  let allChars = 0;
  {
    let _sync_for_iterator = __dartIterator(Array.from(characters, (char) => char.codePointAt(0)));
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let char = _sync_for_iterator.current;
        {
          if ((i >= 256)) {
            {
              (() => { throw __dartCoreError("ArgumentError", characters); })();
            }
          }
          __dartIndexSet(result, (() => { let v = i; return (() => { let v_1 = i = (v + 1); return v; })(); })(), char);
          allChars = (allChars | char);
        }
      }
    }
  }
  if ((i < 256)) {
    {
      (() => { throw __dartCoreError("ArgumentError", characters); })();
    }
  }
  if ((allChars <= 65535)) {
    {
      return new _BmpCodePageDecoder(characters);
    }
  }
  return _NonBmpCodePageDecoder._(result);
}

const $percent = 37;

const $dash = 45;

const $dot = 46;

const $0 = 48;

const $9 = 57;

const $A = 65;

const $underscore = 95;

const $a = 97;

const $f = 102;

const $z = 122;

const $tilde = 126;

function digitForCodeUnit(codeUnits, index) {
  let codeUnit = __dartIndexGet(codeUnits, index);
  let digit = (48 ^ codeUnit);
  if ((digit <= 9)) {
    {
      if ((digit >= 0)) {
        return digit;
      }
    }
  } else {
    {
      let letter = (32 | codeUnit);
      if (((97 <= letter) && (letter <= 102))) {
        return ((letter - 97) + 10);
      }
    }
  }
  (() => { throw __dartCoreError("FormatException", "Invalid hexadecimal code unit " + "U+" + __dartStr(__dartIntToRadixString(codeUnit, 16).padStart(4, "0")) + "."); })();
}

const hexDecoder = __dartConst("[\"instance\",\"class:HexDecoder\"]", () => Object.freeze(Object.create(HexDecoder.prototype)));

function _decode(codeUnits, sourceStart, sourceEnd, destination, destinationStart) {
  let destinationIndex = destinationStart;
  for (let i = sourceStart; (i < (sourceEnd - 1)); i = (i + 2)) {
    {
      let firstDigit = digitForCodeUnit(codeUnits, i);
      let secondDigit = digitForCodeUnit(codeUnits, (i + 1));
      __dartIndexSet(destination, (() => { let v = destinationIndex; return (() => { let v_1 = destinationIndex = (v + 1); return v; })(); })(), ((16 * firstDigit) + secondDigit));
    }
  }
  if ((Math.trunc((sourceEnd - sourceStart)) % 2 === 0)) {
    return null;
  }
  return (16 * digitForCodeUnit(codeUnits, (sourceEnd - 1)));
}

const hexEncoder = __dartConst("[\"instance\",\"class:HexEncoder\"]", () => Object.freeze(Object.create(HexEncoder.prototype)));

function _convert(bytes, start, end) {
  let buffer = new Uint8Array(((end - start) * 2));
  let bufferIndex = 0;
  let byteOr = 0;
  for (let i = start; (i < end); i = (i + 1)) {
    {
      let byte = __dartIndexGet(bytes, i);
      byteOr = (byteOr | byte);
      __dartIndexSet(buffer, (() => { let v = bufferIndex; return (() => { let v_1 = bufferIndex = (v + 1); return v; })(); })(), _codeUnitForDigit(__dartShr((byte & 240), 4)));
      __dartIndexSet(buffer, (() => { let v_2 = bufferIndex; return (() => { let v_3 = bufferIndex = (v_2 + 1); return v_2; })(); })(), _codeUnitForDigit((byte & 15)));
    }
  }
  if (((byteOr >= 0) && (byteOr <= 255))) {
    return String.fromCodePoint(...Array.from(buffer));
  }
  for (let i_1 = start; (i_1 < end); i_1 = (i_1 + 1)) {
    L:
    {
      let byte_1 = __dartIndexGet(bytes, i_1);
      if (((byte_1 >= 0) && (byte_1 <= 255))) {
        break L;
      }
      (() => { throw __dartCoreError("FormatException", "Invalid byte " + __dartStr(((byte_1 < 0) ? "-" : "")) + "0x" + __dartStr(__dartIntToRadixString(Math.abs(byte_1), 16)) + "."); })();
    }
  }
  (() => { throw __dartCoreError("StateError", "unreachable"); })();
}

function _codeUnitForDigit(digit) {
  return ((digit < 10) ? (digit + 48) : ((digit + 97) - 10));
}

const hex = __dartConst("[\"instance\",\"class:HexCodec\"]", () => Object.freeze(Object.create(HexCodec.prototype)));

const percentDecoder = __dartConst("[\"instance\",\"class:PercentDecoder\"]", () => Object.freeze(Object.create(PercentDecoder.prototype)));

const _lastPercent = -1;

function _decode_1(codeUnits, start, end, buffer) {
  let codeUnitOr = 0;
  let sliceStart = start;
  for (let i = start; (i < end); i = (i + 1)) {
    L:
    {
      let codeUnit = __dartIndexGet(codeUnits, i);
      if (!(__dartEquals(__dartIndexGet(codeUnits, i), 37))) {
        {
          codeUnitOr = (codeUnitOr | codeUnit);
          break L;
        }
      }
      if ((i > sliceStart)) {
        {
          _checkForInvalidCodeUnit(codeUnitOr, codeUnits, sliceStart, i);
          buffer.addAll(codeUnits, sliceStart, i);
        }
      }
      i = (i + 1);
      if ((i >= end)) {
        return -1;
      }
      let firstDigit = digitForCodeUnit(codeUnits, i);
      i = (i + 1);
      if ((i >= end)) {
        return (16 * firstDigit);
      }
      let secondDigit = digitForCodeUnit(codeUnits, i);
      buffer.add(((16 * firstDigit) + secondDigit));
      sliceStart = (i + 1);
    }
  }
  if ((end > sliceStart)) {
    {
      _checkForInvalidCodeUnit(codeUnitOr, codeUnits, sliceStart, end);
      if (__dartEquals(start, sliceStart)) {
        {
          buffer.addAll(codeUnits);
        }
      } else {
        {
          buffer.addAll(codeUnits, sliceStart, end);
        }
      }
    }
  }
  return null;
}

function _checkForInvalidCodeUnit(codeUnitOr, codeUnits, start, end) {
  if (((codeUnitOr >= 0) && (codeUnitOr <= 127))) {
    return;
  }
  for (let i = start; (i < end); i = (i + 1)) {
    L:
    {
      let codeUnit = __dartIndexGet(codeUnits, i);
      if (((codeUnit >= 0) && (codeUnit <= 127))) {
        break L;
      }
      (() => { throw __dartCoreError("FormatException", "Non-ASCII code unit " + "U+" + __dartStr(__dartIntToRadixString(codeUnit, 16).padStart(4, "0"))); })();
    }
  }
}

const percentEncoder = __dartConst("[\"instance\",\"class:PercentEncoder\"]", () => Object.freeze(Object.create(PercentEncoder.prototype)));

function _convert_1(bytes, start, end) {
  let buffer = __dartStringBuffer("");
  let byteOr = 0;
  for (let i = start; (i < end); i = (i + 1)) {
    L:
    {
      let byte = __dartIndexGet(bytes, i);
      byteOr = (byteOr | byte);
      let letter = (32 | byte);
      if ((((((((letter >= 97) && (letter <= 122)) || ((byte >= 48) && (byte <= 57))) || __dartEquals(byte, 45)) || __dartEquals(byte, 46)) || __dartEquals(byte, 95)) || __dartEquals(byte, 126))) {
        {
          buffer.writeCharCode(byte);
          break L;
        }
      }
      buffer.writeCharCode(37);
      buffer.writeCharCode(_codeUnitForDigit_1(__dartShr((byte & 240), 4)));
      buffer.writeCharCode(_codeUnitForDigit_1((byte & 15)));
    }
  }
  if (((byteOr >= 0) && (byteOr <= 255))) {
    return __dartStr(buffer);
  }
  for (let i_1 = start; (i_1 < end); i_1 = (i_1 + 1)) {
    L_1:
    {
      let byte_1 = __dartIndexGet(bytes, i_1);
      if (((byte_1 >= 0) && (byte_1 <= 255))) {
        break L_1;
      }
      (() => { throw __dartCoreError("FormatException", "Invalid byte " + __dartStr(((byte_1 < 0) ? "-" : "")) + "0x" + __dartStr(__dartIntToRadixString(Math.abs(byte_1), 16)) + "."); })();
    }
  }
  (() => { throw __dartCoreError("StateError", "unreachable"); })();
}

function _codeUnitForDigit_1(digit) {
  return ((digit < 10) ? (digit + 48) : ((digit + 65) - 10));
}

const percent = __dartConst("[\"instance\",\"class:PercentCodec\"]", () => Object.freeze(Object.create(PercentCodec.prototype)));

export function main() {
  const decodedHex = __dartConst("[\"instance\",\"class:HexCodec\"]", () => Object.freeze(Object.create(HexCodec.prototype))).decode("48656c6c6f21");
  const encodedHex = __dartConst("[\"instance\",\"class:HexCodec\"]", () => Object.freeze(Object.create(HexCodec.prototype))).encode([0, 15, 16, 255]);
  const hexChunks = new Array(0).fill(null);
  const hexSink = __dartConst("[\"instance\",\"class:HexCodec\"]", () => Object.freeze(Object.create(HexCodec.prototype))).encoder.startChunkedConversion(new _ListSink(hexChunks));
  hexSink.add([1, 2]);
  hexSink.addSlice([3, 4, 5], 1, 3, true);
  const encodedPercent = __dartConst("[\"instance\",\"class:PercentCodec\"]", () => Object.freeze(Object.create(PercentCodec.prototype))).encode(__dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).encode("a b/~?"));
  const decodedPercent = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).decode(__dartConst("[\"instance\",\"class:PercentCodec\"]", () => Object.freeze(Object.create(PercentCodec.prototype))).decode(encodedPercent));
  const percentChunks = new Array(0).fill(null);
  const percentSink = __dartConst("[\"instance\",\"class:PercentCodec\"]", () => Object.freeze(Object.create(PercentCodec.prototype))).decoder.startChunkedConversion(new _ListSink(percentChunks));
  percentSink.add("a%20");
  percentSink.add("b%2F");
  percentSink.close();
  const byteSink = (() => { let v = new ByteAccumulatorSink(); return (() => {
    v.add([65, 66]);
    v.addSlice([67, 68, 69], 1, 3, true);
    return v;
  })(); })();
  const stringSink = (() => { let v_1 = new StringAccumulatorSink(); return (() => {
    v_1.add("dart");
    v_1.addSlice("2esm!", 0, 4, true);
    return v_1;
  })(); })();
  const values = (() => { let v_2 = new AccumulatorSink(); return (() => {
    v_2.add("one");
    v_2.add("two");
    return v_2;
  })(); })();
  const beforeClear = __dartIterableJoin(values.events, "|");
  (() => { let v_3 = values; return (() => {
    v_3.clear();
    v_3.add("three");
    v_3.close();
    return v_3;
  })(); })();
  const identityCodec = __dartConst("[\"instance\",\"class:IdentityCodec\",[\"typeArgument\",\"InterfaceType(Object?)\"]]", () => Object.freeze(Object.create(IdentityCodec.prototype)));
  const identity_1 = (__dartEquals(identityCodec.encode("id"), "id") && __dartEquals(identityCodec.decode(42), 42));
  const formatter = new FixedDateTimeFormatter("YYYY-MM-DD hh:mm:ss.SSSSSS");
  const formatted = formatter.encode(__dartDateTimeFromParts(true, 2026, 6, 23, 4, 5, 6, 7, 8));
  const parsed = new FixedDateTimeFormatter("YYYYMMDDhhmmssSSS").decode("20260623040506007");
  const failedParse = (new FixedDateTimeFormatter("YYYY").tryDecode("no") === null);
  const greekText = String.fromCodePoint(...Array.from([913, 946]));
  const greekBytes = latinGreek.encode(greekText);
  const greekRunes = __dartIterableJoin(Array.from(Array.from(latinGreek.decode(greekBytes), (char) => char.codePointAt(0)), function(rune) { return __dartIntToRadixString(rune, 16); }), ",");
  const invalidRune = __dartIndexGet(Array.from(latinGreek.decode([999], { allowInvalid: true }), (char) => char.codePointAt(0)), 0);
  __dartPrint("convert " + __dartStr(__dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).decode(decodedHex)) + " " + __dartStr(encodedHex) + " " + __dartStr(__dartIterableJoin(hexChunks, "|")) + " " + __dartStr(encodedPercent) + " " + __dartStr(decodedPercent) + " " + __dartStr(__dartIterableJoin(Array.from(percentChunks, function(chunk) { return __dartIterableJoin(chunk, "-"); }), "|")) + " " + __dartStr(__dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).decode(byteSink.bytes)) + " " + __dartStr(byteSink.isClosed) + " " + __dartStr(stringSink.string) + " " + __dartStr(stringSink.isClosed) + " " + __dartStr(beforeClear) + " " + __dartStr(__dartIterableJoin(values.events, "|")) + " " + __dartStr(values.isClosed) + " " + __dartStr(identity_1) + " " + __dartStr(formatted) + " " + __dartStr(parsed.toIso8601String()) + " " + __dartStr(failedParse) + " " + __dartStr(__dartIterableJoin(greekBytes, ",")) + " " + __dartStr(greekRunes) + " " + __dartStr(invalidRune));
}

main();
