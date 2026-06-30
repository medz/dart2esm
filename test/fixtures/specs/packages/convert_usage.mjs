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
function __dartStringConversionSinkAsUtf8Sink(sink, allowMalformed = false) {
  let closed = false;
  return {
    add(chunk) { if (closed) return null; sink.add(__dartUtf8Decode(chunk, allowMalformed)); return null; },
    addSlice(chunk, start, end, isLast = false) { if (closed) return null; sink.add(__dartUtf8Decode(chunk, allowMalformed, start, end)); if (isLast) this.close(); return null; },
    close() { if (closed) return null; closed = true; return typeof sink.close === "function" ? sink.close() : null; },
  };
}
function __dartNullCheck(value) {
  if (value == null) {
    throw new TypeError("Null check operator used on a null value");
  }
  return value;
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
function __dartSplaySortMap(map) {
  const entries = Array.from(map).sort(([left], [right]) => __dartCompare(left, right, map.__dartSplayCompare));
  map.clear();
  for (const [key, value] of entries) map.set(key, value);
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
function __dartMapGet(map, key) {
  if (!(map instanceof Map) && map != null && typeof map["[]"] === "function") return map["[]"](key);
  const actualKey = __dartMapKey(map, key);
  return actualKey === __dartMapMissingKey ? null : map.get(actualKey);
}
function __dartMapSet(map, key, value) {
  const actualKey = __dartMapKey(map, key);
  map.set(actualKey === __dartMapMissingKey ? key : actualKey, value);
  if (map.__dartSplayCompare !== undefined) __dartSplaySortMap(map);
  return value;
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
function __dartListIndexOf(list, needle, start = 0) {
  const begin = Math.max(0, Math.trunc(start));
  for (let index = begin; index < list.length; index++) {
    if (__dartEquals(__dartIndexGet(list, index), needle)) return index;
  }
  return -1;
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
function __dartIterableJoin(iterable, separator = "") {
  if (iterable != null && typeof iterable["[]"] === "function" && typeof iterable.length === "number") {
    const values = [];
    for (let index = 0; index < iterable.length; index++) values.push(__dartStr(iterable["[]"](index)));
    return values.join(String(separator));
  }
  return Array.from(iterable, (value) => __dartStr(value)).join(String(separator));
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

class Uint8Buffer extends _IntBuffer {
  constructor(initialLength = 0) {
    super(new Uint8Array(initialLength));
  }
  _createBuffer(size) {
    return new Uint8Array(size);
  }
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

Object.defineProperty(TypedDataBuffer, "_initialLength", { value: 8, enumerable: true });
const latinGreek = CodePage._bmp("greek", "�������������������������������� !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~��������������������������������� ‘’£€₯¦§¨©ͺ«¬­�―°±²³΄΅Ά·ΈΉΊ»Ό½ΎΏΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ�ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώ�");

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
  const identity = (__dartEquals(identityCodec.encode("id"), "id") && __dartEquals(identityCodec.decode(42), 42));
  const formatter = new FixedDateTimeFormatter("YYYY-MM-DD hh:mm:ss.SSSSSS");
  const formatted = formatter.encode(__dartDateTimeFromParts(true, 2026, 6, 23, 4, 5, 6, 7, 8));
  const parsed = new FixedDateTimeFormatter("YYYYMMDDhhmmssSSS").decode("20260623040506007");
  const failedParse = (new FixedDateTimeFormatter("YYYY").tryDecode("no") === null);
  const greekText = String.fromCodePoint(...Array.from([913, 946]));
  const greekBytes = latinGreek.encode(greekText);
  const greekRunes = __dartIterableJoin(Array.from(Array.from(latinGreek.decode(greekBytes), (char) => char.codePointAt(0)), function(rune) { return __dartIntToRadixString(rune, 16); }), ",");
  const invalidRune = __dartIndexGet(Array.from(latinGreek.decode([999], { allowInvalid: true }), (char) => char.codePointAt(0)), 0);
  __dartPrint("convert " + __dartStr(__dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).decode(decodedHex)) + " " + __dartStr(encodedHex) + " " + __dartStr(__dartIterableJoin(hexChunks, "|")) + " " + __dartStr(encodedPercent) + " " + __dartStr(decodedPercent) + " " + __dartStr(__dartIterableJoin(Array.from(percentChunks, function(chunk) { return __dartIterableJoin(chunk, "-"); }), "|")) + " " + __dartStr(__dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).decode(byteSink.bytes)) + " " + __dartStr(byteSink.isClosed) + " " + __dartStr(stringSink.string) + " " + __dartStr(stringSink.isClosed) + " " + __dartStr(beforeClear) + " " + __dartStr(__dartIterableJoin(values.events, "|")) + " " + __dartStr(values.isClosed) + " " + __dartStr(identity) + " " + __dartStr(formatted) + " " + __dartStr(parsed.toIso8601String()) + " " + __dartStr(failedParse) + " " + __dartStr(__dartIterableJoin(greekBytes, ",")) + " " + __dartStr(greekRunes) + " " + __dartStr(invalidRune));
}

main();
