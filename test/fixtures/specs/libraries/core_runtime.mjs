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
function __dartExpando(name = null) {
  const values = new WeakMap();
  const expando = {
    get(object) { return values.has(object) ? values.get(object) : null; },
    set(object, value) { values.set(object, value); return null; },
    toString() { return name == null ? "Expando" : "Expando:" + String(name); },
  };
  Object.defineProperty(expando, "__dartType", { value: "Expando" });
  return Object.freeze(expando);
}
function __dartUriParse(source, tryParse = false) {
  const text = String(source);
  let url;
  let isRelative = false;
  let isProtocolRelative = false;
  try {
    if (text.startsWith("//")) {
      url = new URL("dart:" + text);
      isProtocolRelative = true;
    } else {
      url = new URL(text);
    }
  } catch (_) {
    try {
      url = new URL(text, "dart://relative");
      isRelative = true;
    } catch (_) {
      if (tryParse) return null;
      throw __dartCoreError("FormatException", "Invalid URI");
    }
  }
  const relativePath = isRelative ? text.split(/[?#]/, 1)[0] : url.pathname;
  const userInfo = isRelative ? "" : [url.username, url.password].filter((part) => part !== "").join(":");
  const defaultPort = url.protocol === "http:" ? 80 : url.protocol === "https:" ? 443 : 0;
  function queryParameters(all = false) {
    const map = new Map();
    for (const [key, value] of url.searchParams) {
      if (all) {
        const values = map.get(key) ?? [];
        values.push(value);
        map.set(key, values);
      } else {
        map.set(key, value);
      }
    }
    return map;
  }
  return Object.freeze({
    __dartType: "Uri",
    get scheme() { return isRelative || isProtocolRelative ? "" : url.protocol.slice(0, -1); },
    get host() { return isRelative ? "" : url.hostname; },
    get authority() { return isRelative ? "" : (userInfo === "" ? url.host : userInfo + "@" + url.host); },
    get userInfo() { return userInfo; },
    get port() { return isRelative ? 0 : (url.port === "" ? defaultPort : Number(url.port)); },
    get path() { return relativePath; },
    get pathSegments() { return relativePath.split("/").filter((segment) => segment !== "").map(decodeURIComponent); },
    get query() { return url.search.startsWith("?") ? url.search.slice(1) : ""; },
    get queryParameters() { return queryParameters(false); },
    get queryParametersAll() { return queryParameters(true); },
    get fragment() { return url.hash.startsWith("#") ? url.hash.slice(1) : ""; },
    get hasScheme() { return !isRelative && url.protocol !== ""; },
    get hasAuthority() { return !isRelative && url.host !== ""; },
    get hasPort() { return !isRelative && url.port !== ""; },
    get hasQuery() { return url.search !== ""; },
    get hasFragment() { return url.hash !== ""; },
    get isAbsolute() { return !isRelative && !isProtocolRelative && url.protocol !== "" && url.hash === ""; },
    toString() { return text; },
  });
}
function __dartUriEncodePath(path) { return String(path).split("/").map(encodeURIComponent).join("/"); }
function __dartUriFile(path, windows = false, directory = false) {
  let text = String(path);
  if (windows) text = text.replace(/\\/g, "/");
  if (directory && text !== "" && !text.endsWith("/") && !(windows && /^[a-zA-Z]:$/.test(text))) text += "/";
  const isAbsolute = windows ? (/^[a-zA-Z]:\//.test(text) || text.startsWith("//")) : text.startsWith("/");
  const encoded = __dartUriEncodePath(text);
  if (!isAbsolute) return __dartUriParse(encoded, false);
  const filePath = windows && /^[a-zA-Z]:\//.test(encoded) ? "/" + encoded : encoded;
  return __dartUriParse("file://" + filePath, false);
}
function __dartUriDataParameters(parameters) {
  if (parameters == null) return "";
  let result = "";
  for (const [key, value] of parameters) {
    result += ";" + encodeURIComponent(String(key)) + "=" + encodeURIComponent(String(value));
  }
  return result;
}
function __dartUriDataMediaType(mimeType) {
  if (mimeType == null || String(mimeType).toLowerCase() === "text/plain") return "";
  return String(mimeType);
}
function __dartUriPercentEncodeBytes(bytes) {
  let result = "";
  for (const byte of bytes) {
    const value = Number(byte) & 255;
    const char = String.fromCharCode(value);
    result += /[A-Za-z0-9\-._~]/.test(char) ? char : "%" + value.toString(16).toUpperCase().padStart(2, "0");
  }
  return result;
}
function __dartUriDataFromString(content, mimeType = null, encoding = null, parameters = null, base64 = false) {
  const text = String(content);
  let metadata = __dartUriDataMediaType(mimeType);
  if (encoding != null) metadata += ";charset=utf-8";
  metadata += __dartUriDataParameters(parameters);
  if (base64) {
    const bytes = new TextEncoder().encode(text);
    return __dartUriParse("data:" + metadata + ";base64," + __dartBase64Encode(bytes), false);
  }
  return __dartUriParse("data:" + metadata + "," + encodeURIComponent(text), false);
}
function __dartUriDataFromBytes(bytes, mimeType = null, parameters = null, percentEncoded = false) {
  const byteList = Array.from(bytes, (byte) => Number(byte) & 255);
  let metadata = mimeType == null ? "application/octet-stream" : __dartUriDataMediaType(mimeType);
  metadata += __dartUriDataParameters(parameters);
  if (percentEncoded) {
    return __dartUriParse("data:" + metadata + "," + __dartUriPercentEncodeBytes(byteList), false);
  }
  return __dartUriParse("data:" + metadata + ";base64," + __dartBase64Encode(byteList), false);
}
function __dartUriAssignQueryParameters(url, queryParameters) {
  const search = new URLSearchParams();
  for (const [key, value] of queryParameters) {
    if (value == null) continue;
    if (typeof value !== "string" && value != null && typeof value[Symbol.iterator] === "function") {
      for (const item of value) search.append(String(key), String(item));
    } else {
      search.append(String(key), String(value));
    }
  }
  url.search = search.toString();
}
function __dartUriResolve(uri, reference) {
  return __dartUriParse(new URL(String(reference), String(uri)).toString());
}
function __dartUriReplace(uri, options = {}) {
  const url = new URL(String(uri));
  if ("scheme" in options && options.scheme != null) url.protocol = String(options.scheme) + ":";
  if ("userInfo" in options && options.userInfo != null) {
    const parts = String(options.userInfo).split(":");
    url.username = parts[0] ?? "";
    url.password = parts.slice(1).join(":");
  }
  if ("host" in options && options.host != null) url.hostname = String(options.host);
  if ("port" in options && options.port != null) url.port = String(options.port);
  if ("pathSegments" in options && options.pathSegments != null) {
    url.pathname = Array.from(options.pathSegments, (segment) => encodeURIComponent(String(segment))).join("/");
  } else if ("path" in options && options.path != null) {
    url.pathname = String(options.path);
  }
  if ("queryParameters" in options) {
    if (options.queryParameters != null) __dartUriAssignQueryParameters(url, options.queryParameters);
  } else if ("query" in options) {
    if (options.query != null) url.search = String(options.query);
  }
  if (options.__removeFragment === true) url.hash = "";
  else if ("fragment" in options && options.fragment != null) url.hash = String(options.fragment);
  return __dartUriParse(url.toString());
}
function __dartUriBuild(scheme, authority, path, queryParameters = null) {
  const url = new URL(String(scheme) + "://" + String(authority));
  const rawPath = String(path);
  url.pathname = rawPath.startsWith("/") ? rawPath : "/" + rawPath;
  if (queryParameters != null) {
    __dartUriAssignQueryParameters(url, queryParameters);
  }
  return __dartUriParse(url.toString());
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
function __dartRuntimeType(value) {
  if (value == null) return __dartType("Null");
  if (typeof value === "string") return __dartType("String");
  if (typeof value === "boolean") return __dartType("bool");
  if (typeof value === "bigint") return __dartType("BigInt");
  if (typeof value === "number") return __dartType(Number.isInteger(value) ? "int" : "double");
  if (typeof value.__dartType === "string") return __dartType(value.__dartType);
  if (Array.isArray(value)) return __dartType("List<dynamic>");
  if (value instanceof Set) return __dartType("Set<dynamic>");
  if (value instanceof Map) return __dartType("Map<dynamic, dynamic>");
  const name = value.constructor && value.constructor.name ? value.constructor.name : "Object";
  return __dartType(name);
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
function __dartCompare(left, right, compare = null) {
  if (typeof compare === "function") return Number(compare(left, right));
  const compareTo = left?.compareTo;
  if (typeof compareTo === "function") return Number(compareTo.call(left, right));
  return left < right ? -1 : (left > right ? 1 : 0);
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
const __dartConstValues = new Map();
function __dartConst(key, create) {
  if (!__dartConstValues.has(key)) {
    __dartConstValues.set(key, create());
  }
  return __dartConstValues.get(key);
}

// Generated by dart2esm.

export class PlainObject {
}

export function hide(value) {
  return value;
}

export function main() {
  const buffer = __dartStringBuffer("hello");
  buffer.write(" ");
  buffer.write(42);
  buffer.writeln();
  buffer.write("done");
  __dartPrint("buffer " + __dartStr(buffer.length) + " " + __dartStr(buffer.isNotEmpty) + " " + __dartStr(__dartStr(buffer).includes("\n")));
  buffer.writeAll(["x", "y"], "-");
  buffer.writeCharCode(33);
  buffer.writeCharCode(128512);
  __dartPrint("writeAll " + __dartStr(__dartIterableLast(__dartStr(buffer).split("\n"))));
  buffer.clear();
  __dartPrint("cleared " + __dartStr(buffer.isEmpty) + " " + __dartStr(__dartStr(buffer)));
  const textRunes = Array.from(Array.from("A😀B", (char) => char.codePointAt(0)));
  const constructedRunes = Array.from(String("Hi 😀"), (char) => char.codePointAt(0));
  __dartPrint("runes " + __dartStr(textRunes.length) + " " + __dartStr(__dartIntToRadixString(textRunes[1], 16)) + " " + __dartStr(String.fromCodePoint(...Array.from(constructedRunes))) + " " + __dartStr(String.fromCodePoint(128512)));
  const expando = __dartExpando("count");
  const expandoKey = new PlainObject();
  expando.set(expandoKey, 7);
  __dartPrint("expando " + __dartStr(expando.get(expandoKey)) + " " + __dartStr(expando.get(new PlainObject())) + " " + __dartStr(hide(expando) != null && typeof hide(expando) === "object" && hide(expando).__dartType === "Expando") + " " + __dartStr(__dartStr(expando).includes("count")));
  const encoded = encodeURIComponent("a b/ç");
  __dartPrint("uri " + __dartStr(encoded) + " " + __dartStr(decodeURIComponent(encoded)));
  const full = encodeURI("https://example.test/a b?q=ç");
  __dartPrint("full " + __dartStr(decodeURI(full)));
  const parsed = __dartUriParse("https://example.test/a/b?x=1&x=2&y=z#frag", false);
  __dartPrint("uriParse " + __dartStr(parsed.scheme) + " " + __dartStr(parsed.host) + " " + __dartStr(__dartIterableJoin(parsed.pathSegments, "|")) + " " + __dartStr(__dartMapGet(parsed.queryParameters, "x")) + " " + __dartStr(__dartIterableJoin(__dartNullCheck(__dartMapGet(parsed.queryParametersAll, "x")), ",")) + " " + __dartStr(parsed.fragment));
  const built = __dartUriBuild("https", "example.test", "/search", new Map([["q", "dart esm"], ["page", "1"]]));
  const replaced = __dartUriReplace(parsed, { pathSegments: ["c", "d"], queryParameters: new Map([["n", "1"]]), fragment: null });
  const resolved = __dartUriResolve(__dartUriParse("https://example.test/a/b/", false), "../c?d=1");
  const fileUri = __dartUriFile("/tmp/a b.txt", false, false);
  const dataUri = __dartUriDataFromString("hi", "text/plain", null, null, false);
  __dartPrint("uriBuild " + __dartStr(__dartStr(built)) + " " + __dartStr(__dartStr(replaced)) + " " + __dartStr(__dartStr(resolved)) + " " + __dartStr(__dartStr(fileUri)) + " " + __dartStr(__dartStr(dataUri).startsWith("data:text/plain,hi")));
  const plain = new PlainObject();
  const other = new PlainObject();
  const object = ({});
  const hash = __dartHashValue(plain);
  const stableHash = __dartEquals(hash, __dartHashValue(plain));
  __dartPrint("object " + __dartStr(typeof hash === "number") + " " + __dartStr(stableHash) + " " + __dartStr(Object.is(plain, plain)) + " " + __dartStr(Object.is(plain, other)));
  const identityHash = __dartHashValue(plain);
  __dartPrint("identityHash " + __dartStr(typeof identityHash === "number") + " " + __dartStr(__dartEquals(identityHash, __dartHashValue(plain))) + " " + __dartStr(__dartEquals(__dartHashValue("x"), __dartHashValue("x"))) + " " + __dartStr(__dartEquals(__dartHashValue(null), __dartHashValue(null))));
  __dartPrint("runtime " + __dartStr(__dartRuntimeType(plain)) + " " + __dartStr(__dartRuntimeType(1)) + " " + __dartStr(__dartRuntimeType(1.5)));
  __dartPrint("objectString " + __dartStr(__dartObjectToString(plain).includes("PlainObject")) + " " + __dartStr(__dartObjectToString(object).includes("Object")));
  const constObject = __dartConst("[\"instance\",\"dart:core::Object\"]", () => Object.freeze({}));
  __dartPrint("constObject " + __dartStr(Object.is(__dartConst("[\"instance\",\"dart:core::Object\"]", () => Object.freeze({})), __dartConst("[\"instance\",\"dart:core::Object\"]", () => Object.freeze({})))) + " " + __dartStr(__dartRuntimeType(__dartConst("[\"instance\",\"dart:core::Object\"]", () => Object.freeze({})))) + " " + __dartStr(__dartObjectToString(__dartConst("[\"instance\",\"dart:core::Object\"]", () => Object.freeze({}))).includes("Object")));
}

main();
