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
function __dartToJson(value, toEncodable) {
  if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.map((entry) => __dartToJson(entry, toEncodable));
  }
  if (value instanceof Set) {
    return Array.from(value, (entry) => __dartToJson(entry, toEncodable));
  }
  if (value instanceof Map) {
    const object = {};
    for (const [key, entry] of value) {
      object[String(key)] = __dartToJson(entry, toEncodable);
    }
    return object;
  }
  if (typeof toEncodable === "function") {
    return __dartToJson(toEncodable(value), toEncodable);
  }
  if (typeof value.toJson === "function") {
    return __dartToJson(value.toJson(), toEncodable);
  }
  throw new TypeError("Converting object to an encodable object failed");
}
function __dartFromJson(value) {
  if (Array.isArray(value)) {
    return value.map(__dartFromJson);
  }
  if (value != null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return new Map(Object.entries(value).map(([key, entry]) => [key, __dartFromJson(entry)]));
  }
  return value;
}
function __dartJsonRevive(key, value, reviver) {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = __dartJsonRevive(i, value[i], reviver);
  } else if (value instanceof Map) {
    for (const [entryKey, entryValue] of Array.from(value.entries())) {
      value.set(entryKey, __dartJsonRevive(entryKey, entryValue, reviver));
    }
  }
  return reviver(key, value);
}
function __dartJsonEncode(value, toEncodable = null, indent = null) {
  return JSON.stringify(__dartToJson(value, toEncodable), null, indent ?? undefined);
}
function __dartJsonDecode(source, reviver = null) {
  const value = __dartFromJson(JSON.parse(source));
  return typeof reviver === "function" ? __dartJsonRevive(null, value, reviver) : value;
}
function __dartJsonEncoder(toEncodable = null, indent = null) {
  return {
    indent,
    convert(value) { return __dartJsonEncode(value, toEncodable, indent); },
    encode(value) { return __dartJsonEncode(value, toEncodable, indent); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartJsonDecoder(reviver = null) {
  return {
    convert(source) { return __dartJsonDecode(source, reviver); },
    decode(source) { return __dartJsonDecode(source, reviver); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartJsonUtf8Encoder(indent = null, toEncodable = null, bufferSize = null) {
  return {
    indent,
    bufferSize,
    convert(value) { return __dartUtf8Encode(__dartJsonEncode(value, toEncodable, indent)); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartJsonCodec(reviver = null, toEncodable = null) {
  return {
    encode(value, options = {}) { return __dartJsonEncode(value, options.toEncodable ?? toEncodable); },
    convert(value) { return __dartJsonEncode(value, toEncodable); },
    decode(source, options = {}) { return __dartJsonDecode(source, options.reviver ?? reviver); },
    get encoder() { return __dartJsonEncoder(toEncodable, null); },
    get decoder() { return __dartJsonDecoder(reviver); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
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
function __dartAsciiEncode(source, start = 0, end = null) {
  const text = String(source);
  const bytes = [];
  const stop = end ?? text.length;
  for (let i = start; i < stop; i++) {
    const code = text.charCodeAt(i);
    if (code > 0x7f) throw new RangeError("Invalid ASCII character");
    bytes.push(code);
  }
  return bytes;
}
function __dartAsciiDecode(bytes, allowInvalid = false, start = 0, end = null) {
  const values = Array.from(bytes).slice(start, end ?? undefined);
  const chars = [];
  for (const byte of values) {
    if (byte < 0 || byte > 0x7f) { if (!allowInvalid) throw new RangeError("Invalid ASCII byte"); chars.push("\uFFFD"); continue; }
    chars.push(String.fromCharCode(byte));
  }
  return chars.join("");
}
function __dartAsciiEncoder() {
  return {
    convert(source, start = 0, end = null) { return __dartAsciiEncode(source, start, end); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartAsciiDecoder(allowInvalid = false) {
  return {
    convert(bytes, start = 0, end = null) { return __dartAsciiDecode(bytes, allowInvalid, start, end); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartAsciiCodec(allowInvalid = false) {
  return {
    encode(source) { return __dartAsciiEncode(source); },
    convert(source) { return __dartAsciiEncode(source); },
    decode(bytes, options = {}) { return __dartAsciiDecode(bytes, options.allowInvalid ?? allowInvalid); },
    get encoder() { return __dartAsciiEncoder(); },
    get decoder() { return __dartAsciiDecoder(allowInvalid); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartLatin1Encode(source, start = 0, end = null) {
  const text = String(source);
  const bytes = [];
  const stop = end ?? text.length;
  for (let i = start; i < stop; i++) {
    const code = text.charCodeAt(i);
    if (code > 0xff) throw new RangeError("Invalid Latin-1 character");
    bytes.push(code);
  }
  return bytes;
}
function __dartLatin1Decode(bytes, allowInvalid = false, start = 0, end = null) {
  const values = Array.from(bytes).slice(start, end ?? undefined);
  const chars = [];
  for (const byte of values) {
    if (byte < 0 || byte > 0xff) { if (!allowInvalid) throw new RangeError("Invalid Latin-1 byte"); chars.push("\uFFFD"); continue; }
    chars.push(String.fromCharCode(byte));
  }
  return chars.join("");
}
function __dartLatin1Encoder() {
  return {
    convert(source, start = 0, end = null) { return __dartLatin1Encode(source, start, end); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartLatin1Decoder(allowInvalid = false) {
  return {
    convert(bytes, start = 0, end = null) { return __dartLatin1Decode(bytes, allowInvalid, start, end); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartLatin1Codec(allowInvalid = false) {
  return {
    encode(source) { return __dartLatin1Encode(source); },
    convert(source) { return __dartLatin1Encode(source); },
    decode(bytes, options = {}) { return __dartLatin1Decode(bytes, options.allowInvalid ?? allowInvalid); },
    get encoder() { return __dartLatin1Encoder(); },
    get decoder() { return __dartLatin1Decoder(allowInvalid); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartBase64Encode(bytes, urlSafe = false) {
  const array = Uint8Array.from(bytes);
  let encoded;
  if (globalThis.Buffer) encoded = Buffer.from(array).toString("base64");
  else {
    let binary = "";
    for (const byte of array) binary += String.fromCharCode(byte);
    encoded = btoa(binary);
  }
  return urlSafe ? encoded.replace(/\+/g, "-").replace(/\//g, "_") : encoded;
}
function __dartBase64Decode(source) {
  let normalized = String(source).replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4 !== 0) normalized += "=";
  if (globalThis.Buffer) return Array.from(Buffer.from(normalized, "base64"));
  const binary = atob(normalized);
  const bytes = new Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function __dartBase64Normalize(source, start = 0, end = null) {
  const text = String(source);
  const stop = end ?? text.length;
  let segment = text.slice(start, stop);
  segment = segment.replace(/%[0-9a-fA-F]{2}/g, (escape) => String.fromCharCode(parseInt(escape.slice(1), 16)));
  segment = segment.replace(/-/g, "+").replace(/_/g, "/");
  const firstPadding = segment.indexOf("=");
  if (firstPadding !== -1 && !/^=*$/.test(segment.slice(firstPadding))) throw new Error("FormatException: Invalid base64 padding");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(segment)) throw new Error("FormatException: Invalid base64 data");
  if (firstPadding !== -1 && segment.length % 4 !== 0) throw new Error("FormatException: Invalid base64 padding");
  if (firstPadding === -1) {
    const remainder = segment.length % 4;
    if (remainder === 1) throw new Error("FormatException: Invalid base64 encoding length");
    if (remainder > 1) segment += "=".repeat(4 - remainder);
  }
  return text.slice(0, start) + segment + text.slice(stop);
}
function __dartBase64Encoder(urlSafe = false) {
  return {
    convert(bytes) { return __dartBase64Encode(bytes, urlSafe); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartBase64Decoder() {
  return {
    convert(source, start = 0, end = null) { return __dartBase64Decode(String(source).slice(start, end ?? undefined)); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartBase64Codec(urlSafe = false) {
  return {
    encode(bytes) { return __dartBase64Encode(bytes, urlSafe); },
    convert(bytes) { return __dartBase64Encode(bytes, urlSafe); },
    decode(source) { return __dartBase64Decode(source); },
    normalize(source, start = 0, end = null) { return __dartBase64Normalize(source, start, end); },
    get encoder() { return __dartBase64Encoder(urlSafe); },
    get decoder() { return __dartBase64Decoder(); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartLineSplit(source) {
  const text = String(source);
  if (text.length === 0) return [];
  const lines = text.split(/\r\n|\n|\r/);
  if (text.endsWith("\n") || text.endsWith("\r")) lines.pop();
  return lines;
}
function __dartLineSplitterSink(sink) {
  let carry = "";
  return {
    add(chunk) {
      const text = carry + String(chunk);
      const parts = text.split(/\r\n|\n|\r/);
      const terminated = text.endsWith("\n") || text.endsWith("\r");
      const stop = parts.length - 1;
      for (let i = 0; i < stop; i++) sink.add(parts[i]);
      carry = terminated ? "" : parts[stop];
      return null;
    },
    addSlice(chunk, start, end, isLast = false) {
      this.add(String(chunk).slice(start, end));
      if (isLast) this.close();
      return null;
    },
    close() {
      if (carry.length > 0) sink.add(carry);
      carry = "";
      if (typeof sink.close === "function") sink.close();
      return null;
    },
  };
}
function __dartLineSplitterBind(stream) {
  return (async function*() {
    let carry = "";
    for await (const chunk of stream) {
      const text = carry + String(chunk);
      const parts = text.split(/\r\n|\n|\r/);
      const terminated = text.endsWith("\n") || text.endsWith("\r");
      const stop = parts.length - 1;
      for (let i = 0; i < stop; i++) yield parts[i];
      carry = terminated ? "" : parts[stop];
    }
    if (carry.length > 0) yield carry;
  })();
}
function __dartLineSplitter() {
  return {
    convert(source) { return __dartLineSplit(source); },
    startChunkedConversion(sink) { return __dartLineSplitterSink(sink); },
    bind(stream) { return __dartLineSplitterBind(stream); },
  };
}
function __dartHtmlEscapeMode(name = "custom", escapeLtGt = false, escapeQuot = false, escapeApos = false, escapeSlash = false) {
  return Object.freeze({ name, escapeLtGt, escapeQuot, escapeApos, escapeSlash, toString() { return name; } });
}
function __dartHtmlEscapeChar(char, mode) {
  switch (char) {
    case "&": return "&amp;";
    case "<": return mode.escapeLtGt ? "&lt;" : char;
    case ">": return mode.escapeLtGt ? "&gt;" : char;
    case '"': return mode.escapeQuot ? "&quot;" : char;
    case "'": return mode.escapeApos ? "&#39;" : char;
    case "/": return mode.escapeSlash ? "&#47;" : char;
    default: return char;
  }
}
function __dartHtmlEscape(mode = null) {
  const activeMode = mode ?? __dartHtmlEscapeMode("unknown", true, true, true, true);
  return {
    mode: activeMode,
    convert(source) { return String(source).replace(/[&<>"'/]/g, (char) => __dartHtmlEscapeChar(char, activeMode)); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
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
function __dartAs(value, test, typeName) {
  if (test(value)) return value;
  throw new TypeError("Type cast failed: expected " + typeName);
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
  const actualKey = __dartMapKey(map, key);
  return actualKey === __dartMapMissingKey ? null : map.get(actualKey);
}
function __dartIterableJoin(iterable, separator = "") {
  if (iterable != null && typeof iterable["[]"] === "function" && typeof iterable.length === "number") {
    const values = [];
    for (let index = 0; index < iterable.length; index++) values.push(__dartStr(iterable["[]"](index)));
    return values.join(String(separator));
  }
  return Array.from(iterable, (value) => __dartStr(value)).join(String(separator));
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
function __dartStreamIterable(stream) {
  if (stream != null && typeof stream[Symbol.asyncIterator] === "function") return stream;
  if (stream == null || typeof stream.listen !== "function") return stream;
  return {
    [Symbol.asyncIterator]() {
      const queue = [];
      const waiters = [];
      let done = false;
      let error = null;
      let subscription = null;
      function push(record) {
        if (waiters.length > 0) waiters.shift()(record);
        else queue.push(record);
      }
      function finish(doneError = null) {
        if (done) return;
        done = true;
        error = doneError;
        push({ done: true });
      }
      subscription = stream.listen(
        (value) => push({ value, done: false }),
        { onError: (listenError) => finish(listenError), onDone: () => finish(), cancelOnError: true },
      );
      return {
        async next() {
          if (queue.length === 0 && done) {
            if (error != null) throw error;
            return { done: true };
          }
          const record = queue.length > 0 ? queue.shift() : await new Promise((resolve) => waiters.push(resolve));
          if (record.done) {
            if (error != null) throw error;
            return { done: true };
          }
          return { value: record.value, done: false };
        },
        async return() {
          done = true;
          queue.length = 0;
          while (waiters.length > 0) waiters.shift()({ done: true });
          if (subscription != null && typeof subscription.cancel === "function") await subscription.cancel();
          return { done: true };
        },
      };
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
async function __dartStreamJoin(stream, separator = "") {
  const values = [];
  for await (const value of __dartStreamIterable(stream)) values.push(__dartStr(value));
  return values.join(String(separator));
}
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
  if ((typeof left === "number" || left.__dartType === "double") && (typeof right === "number" || right.__dartType === "double")) return Number(left) === Number(right);
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

export async function main() {
  const payload = new Map([["name", "dart2esm"], ["values", [1, 2, 3]], ["ok", true]]);
  const encoded = __dartJsonEncode(payload, null);
  const decoded = __dartAs(__dartJsonDecode(encoded), value => value instanceof Map, "Map<dynamic, dynamic>");
  __dartPrint("json " + __dartStr(__dartMapGet(decoded, "name")) + " " + __dartStr(__dartAs(__dartMapGet(decoded, "values"), value => (Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView))), "List<dynamic>").length));
  const codecEncoded = __dartConst("[\"instance\",\"dart:convert::JsonCodec\",[\"field\",\"dart:convert::JsonCodec::@fields::dart:convert::_reviver\",[\"null\"]],[\"field\",\"dart:convert::JsonCodec::@fields::dart:convert::_toEncodable\",[\"null\"]]]", () => __dartJsonCodec(null, null)).encode(new Map([["answer", 42]]));
  const codecDecoded = __dartAs(__dartConst("[\"instance\",\"dart:convert::JsonCodec\",[\"field\",\"dart:convert::JsonCodec::@fields::dart:convert::_reviver\",[\"null\"]],[\"field\",\"dart:convert::JsonCodec::@fields::dart:convert::_toEncodable\",[\"null\"]]]", () => __dartJsonCodec(null, null)).decode(codecEncoded), value => value instanceof Map, "Map<dynamic, dynamic>");
  __dartPrint("codec " + __dartStr(__dartMapGet(codecDecoded, "answer")));
  const bytes = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).encode("hello");
  __dartPrint("utf8 " + __dartStr(bytes.length) + " " + __dartStr(__dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).decode(bytes)));
  const asciiBytes = __dartConst("[\"instance\",\"dart:convert::AsciiCodec\",[\"field\",\"dart:convert::AsciiCodec::@fields::dart:convert::_allowInvalid\",[\"bool\",false]]]", () => __dartAsciiCodec(false)).encode("AZ");
  const latinBytes = __dartConst("[\"instance\",\"dart:convert::Latin1Codec\",[\"field\",\"dart:convert::Latin1Codec::@fields::dart:convert::_allowInvalid\",[\"bool\",false]]]", () => __dartLatin1Codec(false)).encode("Aÿ");
  const constAscii = __dartConst("[\"instance\",\"dart:convert::AsciiCodec\",[\"field\",\"dart:convert::AsciiCodec::@fields::dart:convert::_allowInvalid\",[\"bool\",false]]]", () => __dartAsciiCodec(false)).decode([79, 75]);
  const constLatin = __dartConst("[\"instance\",\"dart:convert::Latin1Codec\",[\"field\",\"dart:convert::Latin1Codec::@fields::dart:convert::_allowInvalid\",[\"bool\",false]]]", () => __dartLatin1Codec(false)).decode([65, 255]);
  __dartPrint("singleByte " + __dartStr(__dartIterableJoin(asciiBytes, ",")) + " " + __dartStr(__dartConst("[\"instance\",\"dart:convert::AsciiCodec\",[\"field\",\"dart:convert::AsciiCodec::@fields::dart:convert::_allowInvalid\",[\"bool\",false]]]", () => __dartAsciiCodec(false)).decode([65, 90])) + " " + __dartStr(__dartIterableJoin(latinBytes, ",")) + " " + __dartStr(__dartConst("[\"instance\",\"dart:convert::Latin1Codec\",[\"field\",\"dart:convert::Latin1Codec::@fields::dart:convert::_allowInvalid\",[\"bool\",false]]]", () => __dartLatin1Codec(false)).decode([65, 255])) + " " + __dartStr(constAscii) + " " + __dartStr(constLatin));
  const malformedUtf8 = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",true]]]", () => __dartUtf8Codec(true)).decode([255]);
  const malformedUtf8Override = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).decode([255], { allowMalformed: true });
  const invalidAscii = __dartConst("[\"instance\",\"dart:convert::AsciiCodec\",[\"field\",\"dart:convert::AsciiCodec::@fields::dart:convert::_allowInvalid\",[\"bool\",true]]]", () => __dartAsciiCodec(true)).decode([65, 200]);
  const invalidLatin = __dartConst("[\"instance\",\"dart:convert::Latin1Codec\",[\"field\",\"dart:convert::Latin1Codec::@fields::dart:convert::_allowInvalid\",[\"bool\",true]]]", () => __dartLatin1Codec(true)).decode([65, 300]);
  __dartPrint("malformed " + __dartStr(__dartIndexGet(Array.from(malformedUtf8, (char) => char.codePointAt(0)), 0)) + " " + __dartStr(__dartIndexGet(Array.from(malformedUtf8Override, (char) => char.codePointAt(0)), 0)) + " " + __dartStr(__dartIndexGet(Array.from(invalidAscii, (char) => char.codePointAt(0)), Array.from(invalidAscii, (char) => char.codePointAt(0)).length - 1)) + " " + __dartStr(__dartIndexGet(Array.from(invalidLatin, (char) => char.codePointAt(0)), Array.from(invalidLatin, (char) => char.codePointAt(0)).length - 1)));
  const token = __dartBase64Encode(bytes);
  __dartPrint("base64 " + __dartStr(token) + " " + __dartStr(__dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).decode(__dartBase64Decode(token))));
  const urlToken = __dartConst("[\"instance\",\"dart:convert::Base64Codec\",[\"field\",\"dart:convert::Base64Codec::@fields::dart:convert::_encoder\",[\"instance\",\"dart:convert::Base64Encoder\",[\"field\",\"dart:convert::Base64Encoder::@fields::dart:convert::_urlSafe\",[\"bool\",true]]]]]", () => __dartBase64Codec(true)).encode(bytes);
  __dartPrint("base64Url " + __dartStr(urlToken) + " " + __dartStr(__dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).decode(__dartConst("[\"instance\",\"dart:convert::Base64Codec\",[\"field\",\"dart:convert::Base64Codec::@fields::dart:convert::_encoder\",[\"instance\",\"dart:convert::Base64Encoder\",[\"field\",\"dart:convert::Base64Encoder::@fields::dart:convert::_urlSafe\",[\"bool\",true]]]]]", () => __dartBase64Codec(true)).decode(urlToken))));
  const lines = __dartConst("[\"instance\",\"dart:convert::LineSplitter\"]", () => __dartLineSplitter()).convert("a\nb\r\nc");
  const staticLines = __dartIterableJoin(__dartLineSplit("x\ry"), "/");
  __dartPrint("lines " + __dartStr(__dartIterableJoin(lines, "|")) + " " + __dartStr(staticLines));
  const boundUtf8 = await __dartStreamJoin(__dartConverterBind(__dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).decoder, __dartStreamFromIterable([[104], [105]])), "|");
  const transformedUtf8 = await __dartStreamJoin(__dartStreamTransform(__dartStreamFromIterable([[33]]), __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).decoder), ",");
  const lineBound = await __dartStreamJoin(__dartConst("[\"instance\",\"dart:convert::LineSplitter\"]", () => __dartLineSplitter()).bind(__dartStreamFromIterable(["a\nb", "\nc"])), "|");
  const lineSinkChunks = new Array(0).fill(null);
  const lineSink = __dartConst("[\"instance\",\"dart:convert::LineSplitter\"]", () => __dartLineSplitter()).startChunkedConversion(__dartStringConversionSinkFrom(new _ListSink(lineSinkChunks)));
  lineSink.add("x\ny");
  lineSink.add("\nz");
  lineSink.close();
  const escapedChunks = new Array(0).fill(null);
  const htmlSink = __dartConst("[\"instance\",\"dart:convert::HtmlEscape\",[\"field\",\"dart:convert::HtmlEscape::@fields::mode\",[\"instance\",\"dart:convert::HtmlEscapeMode\",[\"field\",\"dart:convert::HtmlEscapeMode::@fields::dart:convert::_name\",[\"string\",\"unknown\"]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeApos\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeLtGt\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeQuot\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeSlash\",[\"bool\",true]]]]]", () => __dartHtmlEscape(__dartConst("[\"instance\",\"dart:convert::HtmlEscapeMode\",[\"field\",\"dart:convert::HtmlEscapeMode::@fields::dart:convert::_name\",[\"string\",\"unknown\"]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeApos\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeLtGt\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeQuot\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeSlash\",[\"bool\",true]]]", () => __dartHtmlEscapeMode("custom", true, true, true, true)))).startChunkedConversion(__dartStringConversionSink(function(value) {
    (escapedChunks.push(value), null);
}));
  htmlSink.add("<");
  htmlSink.add("&");
  htmlSink.close();
  __dartPrint("converterStreams " + __dartStr(boundUtf8) + " " + __dartStr(transformedUtf8) + " " + __dartStr(lineBound) + " " + __dartStr(__dartIterableJoin(lineSinkChunks, "|")) + " " + __dartStr(__dartIterableJoin(escapedChunks, "|")));
  const fusedCodec = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).fuse(__dartConst("[\"instance\",\"dart:convert::Base64Codec\",[\"field\",\"dart:convert::Base64Codec::@fields::dart:convert::_encoder\",[\"instance\",\"dart:convert::Base64Encoder\",[\"field\",\"dart:convert::Base64Encoder::@fields::dart:convert::_urlSafe\",[\"bool\",false]]]]]", () => __dartBase64Codec(false)));
  const fusedEncoded = fusedCodec.encode("fuse");
  const fusedDecoded = fusedCodec.decode(fusedEncoded);
  const fusedConverter = __dartConst("[\"instance\",\"dart:convert::Utf8Encoder\"]", () => __dartUtf8Encoder()).fuse(__dartConst("[\"instance\",\"dart:convert::Base64Encoder\",[\"field\",\"dart:convert::Base64Encoder::@fields::dart:convert::_urlSafe\",[\"bool\",false]]]", () => __dartBase64Encoder(false))).convert("hi");
  const fusedJsonUtf8 = __dartIterableJoin(__dartConst("[\"instance\",\"dart:convert::JsonEncoder\",[\"field\",\"dart:convert::JsonEncoder::@fields::dart:convert::_toEncodable\",[\"null\"]],[\"field\",\"dart:convert::JsonEncoder::@fields::indent\",[\"null\"]]]", () => __dartJsonEncoder(null, null)).fuse(__dartConst("[\"instance\",\"dart:convert::Utf8Encoder\"]", () => __dartUtf8Encoder())).convert(new Map([["x", 1]])), ",");
  __dartPrint("fuse " + __dartStr(fusedEncoded) + " " + __dartStr(fusedDecoded) + " " + __dartStr(fusedConverter) + " " + __dartStr(fusedJsonUtf8));
  const chunkedBytes = new Array(0).fill(null);
  const byteSink = __dartByteConversionSink(function(bytes) {
    (chunkedBytes.push(...Array.from(bytes)), null);
});
  const chunkedEncoder = __dartConst("[\"instance\",\"dart:convert::Utf8Encoder\"]", () => __dartUtf8Encoder()).startChunkedConversion(byteSink);
  chunkedEncoder.add("h");
  chunkedEncoder.add("é");
  chunkedEncoder.close();
  const chunkedText = new Array(0).fill(null);
  const stringSink = __dartStringConversionSink(function(value) {
    (chunkedText.push(value), null);
});
  const chunkedDecoder = __dartConst("[\"instance\",\"dart:convert::Utf8Decoder\",[\"field\",\"dart:convert::Utf8Decoder::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Decoder(false)).startChunkedConversion(stringSink);
  chunkedDecoder.add([104]);
  chunkedDecoder.add([105]);
  chunkedDecoder.close();
  __dartPrint("chunked " + __dartStr(__dartIterableJoin(chunkedBytes, ",")) + " " + __dartStr(__dartIterableJoin(chunkedText, "|")));
  const adaptedByteChunks = new Array(0).fill(null);
  const adaptedByteSink = new _ListSink(adaptedByteChunks);
  const byteFrom = __dartByteConversionSinkFrom(adaptedByteSink);
  byteFrom.add([1]);
  byteFrom.addSlice([2, 3, 4], 1, 3, true);
  const adaptedStringChunks = new Array(0).fill(null);
  const adaptedStringSink = new _ListSink(adaptedStringChunks);
  const stringFrom = __dartStringConversionSinkFrom(adaptedStringSink);
  stringFrom.add("a");
  stringFrom.addSlice("bcde", 1, 3, true);
  const stringBuffer = __dartStringBuffer("");
  const fromStringSink = __dartStringConversionSinkFromStringSink(stringBuffer);
  fromStringSink.add("x");
  fromStringSink.addSlice("yz!", 0, 2, true);
  const utf8SinkText = new Array(0).fill(null);
  const utf8ViewTarget = __dartStringConversionSink(function(value) {
    (utf8SinkText.push(value), null);
});
  const utf8View = utf8ViewTarget.asUtf8Sink(false);
  utf8View.add([104]);
  utf8View.addSlice([195, 169, 33], 0, 2, false);
  utf8View.addSlice([33], 0, 1, true);
  const chunkedValues = new Array(0).fill(null);
  const genericSink = __dartChunkedConversionSink(function(values) {
    (chunkedValues.push(__dartIterableJoin(values, "/")), null);
});
  genericSink.add("g");
  genericSink.add(7);
  genericSink.close();
  __dartPrint("sinkAdapters " + __dartStr(__dartIterableJoin(Array.from(adaptedByteChunks, function(chunk) { return __dartIterableJoin(chunk, "-"); }), "|")) + " " + __dartStr(adaptedByteSink.closed) + " " + __dartStr(__dartIterableJoin(adaptedStringChunks, "|")) + " " + __dartStr(adaptedStringSink.closed) + " " + __dartStr(__dartStr(stringBuffer)) + " " + __dartStr(__dartIterableJoin(utf8SinkText, "|")) + " " + __dartStr(__dartIterableJoin(chunkedValues, "|")));
  const escaped = __dartConst("[\"instance\",\"dart:convert::HtmlEscape\",[\"field\",\"dart:convert::HtmlEscape::@fields::mode\",[\"instance\",\"dart:convert::HtmlEscapeMode\",[\"field\",\"dart:convert::HtmlEscapeMode::@fields::dart:convert::_name\",[\"string\",\"unknown\"]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeApos\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeLtGt\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeQuot\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeSlash\",[\"bool\",true]]]]]", () => __dartHtmlEscape(__dartConst("[\"instance\",\"dart:convert::HtmlEscapeMode\",[\"field\",\"dart:convert::HtmlEscapeMode::@fields::dart:convert::_name\",[\"string\",\"unknown\"]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeApos\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeLtGt\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeQuot\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeSlash\",[\"bool\",true]]]", () => __dartHtmlEscapeMode("custom", true, true, true, true)))).convert("<a&b>\"'/");
  __dartPrint("html " + __dartStr(escaped));
  const indented = __dartConst("[\"instance\",\"dart:convert::JsonEncoder\",[\"field\",\"dart:convert::JsonEncoder::@fields::dart:convert::_toEncodable\",[\"null\"]],[\"field\",\"dart:convert::JsonEncoder::@fields::indent\",[\"string\",\"  \"]]]", () => __dartJsonEncoder(null, "  ")).convert(new Map([["a", [1, true]]]));
  const jsonUtf8Bytes = __dartJsonUtf8Encoder(" ", null, null).convert(new Map([["b", 2]]));
  const decodedObject = __dartAs(__dartConst("[\"instance\",\"dart:convert::JsonDecoder\",[\"field\",\"dart:convert::JsonDecoder::@fields::dart:convert::_reviver\",[\"null\"]]]", () => __dartJsonDecoder(null)).convert("{\"c\":3}"), value => value instanceof Map, "Map<dynamic, dynamic>");
  const revivedObject = __dartAs(__dartJsonDecoder(function(key, value) { return (__dartEquals(key, "n") ? 7 : value); }).convert("{\"n\":1}"), value => value instanceof Map, "Map<dynamic, dynamic>");
  __dartPrint("jsonObjects " + __dartStr(indented.includes("\n  \"a\"")) + " " + __dartStr(indented.includes("\n    1")) + " " + __dartStr(__dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).decode(jsonUtf8Bytes).includes("\n \"b\"")) + " " + __dartStr(__dartMapGet(decodedObject, "c")) + " " + __dartStr(__dartMapGet(revivedObject, "n")));
  const utf8Partial = __dartIterableJoin(__dartConst("[\"instance\",\"dart:convert::Utf8Encoder\"]", () => __dartUtf8Encoder()).convert("hé", 1), ",");
  const utf8Decoded = __dartConst("[\"instance\",\"dart:convert::Utf8Decoder\",[\"field\",\"dart:convert::Utf8Decoder::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Decoder(false)).convert([120, 195, 169, 121], 1, 3);
  const malformedDecoded = __dartIndexGet(Array.from(__dartConst("[\"instance\",\"dart:convert::Utf8Decoder\",[\"field\",\"dart:convert::Utf8Decoder::@fields::dart:convert::_allowMalformed\",[\"bool\",true]]]", () => __dartUtf8Decoder(true)).convert([255]), (char) => char.codePointAt(0)), 0);
  const asciiPartial = __dartIterableJoin(__dartConst("[\"instance\",\"dart:convert::AsciiEncoder\",[\"field\",\"dart:convert::_UnicodeSubsetEncoder::@fields::dart:convert::_subsetMask\",[\"int\",\"127\"]]]", () => __dartAsciiEncoder()).convert("AZ", 1), ",");
  const asciiDecoded = __dartConst("[\"instance\",\"dart:convert::AsciiDecoder\",[\"field\",\"dart:convert::_UnicodeSubsetDecoder::@fields::dart:convert::_allowInvalid\",[\"bool\",false]],[\"field\",\"dart:convert::_UnicodeSubsetDecoder::@fields::dart:convert::_subsetMask\",[\"int\",\"127\"]]]", () => __dartAsciiDecoder(false)).convert([88, 89, 90], 1, 3);
  const asciiInvalid = __dartIndexGet(Array.from(__dartConst("[\"instance\",\"dart:convert::AsciiDecoder\",[\"field\",\"dart:convert::_UnicodeSubsetDecoder::@fields::dart:convert::_allowInvalid\",[\"bool\",true]],[\"field\",\"dart:convert::_UnicodeSubsetDecoder::@fields::dart:convert::_subsetMask\",[\"int\",\"127\"]]]", () => __dartAsciiDecoder(true)).convert([65, 200]), (char) => char.codePointAt(0)), Array.from(__dartConst("[\"instance\",\"dart:convert::AsciiDecoder\",[\"field\",\"dart:convert::_UnicodeSubsetDecoder::@fields::dart:convert::_allowInvalid\",[\"bool\",true]],[\"field\",\"dart:convert::_UnicodeSubsetDecoder::@fields::dart:convert::_subsetMask\",[\"int\",\"127\"]]]", () => __dartAsciiDecoder(true)).convert([65, 200]), (char) => char.codePointAt(0)).length - 1);
  const latinPartial = __dartIterableJoin(__dartConst("[\"instance\",\"dart:convert::Latin1Encoder\",[\"field\",\"dart:convert::_UnicodeSubsetEncoder::@fields::dart:convert::_subsetMask\",[\"int\",\"255\"]]]", () => __dartLatin1Encoder()).convert("Aÿ", 1), ",");
  const latinDecoded = __dartConst("[\"instance\",\"dart:convert::Latin1Decoder\",[\"field\",\"dart:convert::_UnicodeSubsetDecoder::@fields::dart:convert::_allowInvalid\",[\"bool\",false]],[\"field\",\"dart:convert::_UnicodeSubsetDecoder::@fields::dart:convert::_subsetMask\",[\"int\",\"255\"]]]", () => __dartLatin1Decoder(false)).convert([65, 255], 1);
  const latinInvalid = __dartIndexGet(Array.from(__dartConst("[\"instance\",\"dart:convert::Latin1Decoder\",[\"field\",\"dart:convert::_UnicodeSubsetDecoder::@fields::dart:convert::_allowInvalid\",[\"bool\",true]],[\"field\",\"dart:convert::_UnicodeSubsetDecoder::@fields::dart:convert::_subsetMask\",[\"int\",\"255\"]]]", () => __dartLatin1Decoder(true)).convert([300]), (char) => char.codePointAt(0)), 0);
  __dartPrint("converterObjects " + __dartStr(utf8Partial) + " " + __dartStr(utf8Decoded) + " " + __dartStr(malformedDecoded) + " " + __dartStr(asciiPartial) + " " + __dartStr(asciiDecoded) + " " + __dartStr(asciiInvalid) + " " + __dartStr(latinPartial) + " " + __dartStr(latinDecoded) + " " + __dartStr(latinInvalid));
  const urlObjectToken = __dartConst("[\"instance\",\"dart:convert::Base64Encoder\",[\"field\",\"dart:convert::Base64Encoder::@fields::dart:convert::_urlSafe\",[\"bool\",true]]]", () => __dartBase64Encoder(true)).convert([251, 255]);
  const decodedUrlObject = __dartConst("[\"instance\",\"dart:convert::Base64Decoder\"]", () => __dartBase64Decoder()).convert(urlObjectToken);
  const normalizedUrlToken = __dartConst("[\"instance\",\"dart:convert::Base64Codec\",[\"field\",\"dart:convert::Base64Codec::@fields::dart:convert::_encoder\",[\"instance\",\"dart:convert::Base64Encoder\",[\"field\",\"dart:convert::Base64Encoder::@fields::dart:convert::_urlSafe\",[\"bool\",true]]]]]", () => __dartBase64Codec(true)).normalize("-_8");
  __dartPrint("base64Objects " + __dartStr(urlObjectToken) + " " + __dartStr(__dartIterableJoin(decodedUrlObject, ",")) + " " + __dartStr(normalizedUrlToken) + " " + __dartStr(__dartConst("[\"instance\",\"dart:convert::Base64Encoder\",[\"field\",\"dart:convert::Base64Encoder::@fields::dart:convert::_urlSafe\",[\"bool\",false]]]", () => __dartBase64Encoder(false)).convert([251, 255])));
  const attrEscaped = __dartConst("[\"instance\",\"dart:convert::HtmlEscape\",[\"field\",\"dart:convert::HtmlEscape::@fields::mode\",[\"instance\",\"dart:convert::HtmlEscapeMode\",[\"field\",\"dart:convert::HtmlEscapeMode::@fields::dart:convert::_name\",[\"string\",\"attribute\"]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeApos\",[\"bool\",false]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeLtGt\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeQuot\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeSlash\",[\"bool\",false]]]]]", () => __dartHtmlEscape(__dartConst("[\"instance\",\"dart:convert::HtmlEscapeMode\",[\"field\",\"dart:convert::HtmlEscapeMode::@fields::dart:convert::_name\",[\"string\",\"attribute\"]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeApos\",[\"bool\",false]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeLtGt\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeQuot\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeSlash\",[\"bool\",false]]]", () => __dartHtmlEscapeMode("custom", true, true, false, false)))).convert("<a&>\"'/");
  const elementEscaped = __dartConst("[\"instance\",\"dart:convert::HtmlEscape\",[\"field\",\"dart:convert::HtmlEscape::@fields::mode\",[\"instance\",\"dart:convert::HtmlEscapeMode\",[\"field\",\"dart:convert::HtmlEscapeMode::@fields::dart:convert::_name\",[\"string\",\"element\"]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeApos\",[\"bool\",false]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeLtGt\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeQuot\",[\"bool\",false]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeSlash\",[\"bool\",false]]]]]", () => __dartHtmlEscape(__dartConst("[\"instance\",\"dart:convert::HtmlEscapeMode\",[\"field\",\"dart:convert::HtmlEscapeMode::@fields::dart:convert::_name\",[\"string\",\"element\"]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeApos\",[\"bool\",false]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeLtGt\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeQuot\",[\"bool\",false]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeSlash\",[\"bool\",false]]]", () => __dartHtmlEscapeMode("custom", true, false, false, false)))).convert("<a&>\"'/");
  const customEscaped = __dartConst("[\"instance\",\"dart:convert::HtmlEscape\",[\"field\",\"dart:convert::HtmlEscape::@fields::mode\",[\"instance\",\"dart:convert::HtmlEscapeMode\",[\"field\",\"dart:convert::HtmlEscapeMode::@fields::dart:convert::_name\",[\"string\",\"custom\"]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeApos\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeLtGt\",[\"bool\",false]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeQuot\",[\"bool\",false]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeSlash\",[\"bool\",false]]]]]", () => __dartHtmlEscape(__dartConst("[\"instance\",\"dart:convert::HtmlEscapeMode\",[\"field\",\"dart:convert::HtmlEscapeMode::@fields::dart:convert::_name\",[\"string\",\"custom\"]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeApos\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeLtGt\",[\"bool\",false]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeQuot\",[\"bool\",false]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeSlash\",[\"bool\",false]]]", () => __dartHtmlEscapeMode("custom", false, false, true, false)))).convert("<a&>\"'/");
  const globalEscaped = __dartConst("[\"instance\",\"dart:convert::HtmlEscape\",[\"field\",\"dart:convert::HtmlEscape::@fields::mode\",[\"instance\",\"dart:convert::HtmlEscapeMode\",[\"field\",\"dart:convert::HtmlEscapeMode::@fields::dart:convert::_name\",[\"string\",\"unknown\"]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeApos\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeLtGt\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeQuot\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeSlash\",[\"bool\",true]]]]]", () => __dartHtmlEscape(__dartConst("[\"instance\",\"dart:convert::HtmlEscapeMode\",[\"field\",\"dart:convert::HtmlEscapeMode::@fields::dart:convert::_name\",[\"string\",\"unknown\"]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeApos\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeLtGt\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeQuot\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeSlash\",[\"bool\",true]]]", () => __dartHtmlEscapeMode("custom", true, true, true, true)))).convert("&");
  __dartPrint("htmlModes " + __dartStr(attrEscaped.includes("&quot;")) + " " + __dartStr(attrEscaped.includes("&#39;")) + " " + __dartStr(attrEscaped.includes("&#47;")) + " " + __dartStr(elementEscaped.includes("&lt;")) + " " + __dartStr(elementEscaped.includes("&quot;")) + " " + __dartStr(customEscaped.includes("&#39;")) + " " + __dartStr(customEscaped.includes("&lt;")) + " " + __dartStr(globalEscaped));
}

await main();
