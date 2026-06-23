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
function __dartDouble(value) {
  const number = Number(value);
  const boxed = new Number(number);
  Object.defineProperty(boxed, "__dartType", { value: "double" });
  Object.defineProperty(boxed, "toString", { value() {
    if (Number.isNaN(number)) return "NaN";
    if (number === Infinity) return "Infinity";
    if (number === -Infinity) return "-Infinity";
    if (Object.is(number, -0)) return "-0.0";
    return Number.isInteger(number) ? String(number) + ".0" : String(number);
  } });
  return boxed;
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
function __dartStringReplaceFirst(source, pattern, replacement, startIndex = 0) {
  const text = String(source);
  const needle = String(pattern);
  const index = text.indexOf(needle, startIndex);
  if (index < 0) return text;
  return text.slice(0, index) + String(replacement) + text.slice(index + needle.length);
}
function __dartStringReplaceRange(source, start, end, replacement) {
  const text = String(source);
  const actualEnd = end == null ? text.length : end;
  return text.slice(0, start) + String(replacement) + text.slice(actualEnd);
}
function __dartFormatException(message) {
  const error = new Error(String(message));
  error.name = "FormatException";
  return error;
}
function __dartIntTryParse(source, radix = null) {
  const text = String(source).trim();
  let base = radix == null ? null : Number(radix);
  if (base != null && (!Number.isInteger(base) || base < 2 || base > 36)) return null;
  if (base == null && /^[+-]?0x[0-9a-f]+$/i.test(text)) return Number.parseInt(text, 16);
  base ??= 10;
  const sign = /^[+-]/.test(text) ? text[0] : "";
  const digits = sign === "" ? text : text.slice(1);
  if (digits.length === 0) return null;
  for (const char of digits.toLowerCase()) {
    const code = char.charCodeAt(0);
    const value = code >= 48 && code <= 57 ? code - 48 : code >= 97 && code <= 122 ? code - 87 : -1;
    if (value < 0 || value >= base) return null;
  }
  return Number.parseInt(text, base);
}
function __dartIntParse(source, radix = null) {
  const value = __dartIntTryParse(source, radix);
  if (value == null) throw __dartFormatException("Invalid integer literal");
  return value;
}
function __dartDoubleTryParse(source) {
  const text = String(source).trim();
  if (text === "") return null;
  const value = Number(text);
  return Number.isNaN(value) ? null : value;
}
function __dartDoubleParse(source) {
  const value = __dartDoubleTryParse(source);
  if (value == null) throw __dartFormatException("Invalid double literal");
  return value;
}
function __dartNumTryParse(source) {
  return __dartDoubleTryParse(source);
}
function __dartNumParse(source) {
  const value = __dartNumTryParse(source);
  if (value == null) throw __dartFormatException("Invalid number literal");
  return value;
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
function __dartUriEncodeQueryComponent(value, encoding = null) {
  const text = String(value);
  if (encoding == null || typeof encoding.encode !== "function") return encodeURIComponent(text).replace(/%20/g, "+");
  let result = "";
  for (const byte of encoding.encode(text)) {
    const value = Number(byte) & 255;
    if (value === 0x20) { result += "+"; continue; }
    const char = String.fromCharCode(value);
    result += /[A-Za-z0-9\-._~]/.test(char) ? char : "%" + value.toString(16).toUpperCase().padStart(2, "0");
  }
  return result;
}
function __dartUriDecodeQueryComponent(value, encoding = null) {
  const text = String(value).replace(/\+/g, " ");
  if (encoding == null || typeof encoding.decode !== "function") return decodeURIComponent(text);
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "%" && i + 2 < text.length) {
      const hex = text.slice(i + 1, i + 3);
      if (/^[0-9a-fA-F]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(char.charCodeAt(0));
  }
  return encoding.decode(bytes);
}
function __dartUriSplitQueryString(query, encoding = null) {
  const map = new Map();
  for (const element of String(query).split("&")) {
    const index = element.indexOf("=");
    if (index === -1) {
      if (element !== "") map.set(__dartUriDecodeQueryComponent(element, encoding), "");
      continue;
    }
    if (index === 0) continue;
    const key = element.slice(0, index);
    const value = element.slice(index + 1);
    map.set(__dartUriDecodeQueryComponent(key, encoding), __dartUriDecodeQueryComponent(value, encoding));
  }
  return map;
}
function __dartUriBuildQuery(queryParameters) {
  const parts = [];
  for (const [key, value] of queryParameters) {
    const encodedKey = __dartUriEncodeQueryComponent(key);
    if (value == null) {
      parts.push(encodedKey);
    } else if (typeof value !== "string" && typeof value[Symbol.iterator] === "function") {
      for (const item of value) parts.push(encodedKey + "=" + __dartUriEncodeQueryComponent(item));
    } else {
      parts.push(encodedKey + "=" + __dartUriEncodeQueryComponent(value));
    }
  }
  return parts.join("&");
}
function __dartUri(options = {}) {
  const scheme = options.scheme == null ? "" : String(options.scheme);
  const userInfo = options.userInfo == null ? "" : String(options.userInfo);
  const host = options.host == null ? "" : String(options.host);
  const port = options.port == null ? null : Number(options.port);
  let path = "";
  if (options.pathSegments != null) {
    path = Array.from(options.pathSegments, (segment) => encodeURIComponent(String(segment))).join("/");
  } else if (options.path != null) {
    path = __dartUriEncodePath(options.path);
  }
  const authority = host === ""
    ? ""
    : (userInfo === "" ? "" : userInfo + "@") + host + (port == null ? "" : ":" + port);
  let text = scheme === "" ? "" : scheme + ":";
  if (authority !== "") text += "//" + authority;
  if (path !== "") {
    if (authority !== "" && !path.startsWith("/")) text += "/";
    text += path;
  }
  if (options.queryParameters != null) {
    const query = __dartUriBuildQuery(options.queryParameters);
    if (query !== "") text += "?" + query;
  } else if (options.query != null) {
    text += "?" + String(options.query);
  }
  if (options.fragment != null) {
    text += "#" + encodeURIComponent(String(options.fragment));
  }
  return __dartUriParse(text, false);
}
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
function __dartUriNormalizePath(uri) {
  return __dartUriParse(new URL(String(uri)).toString());
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
  return Array.from(iterable, (value) => __dartStr(value)).join(String(separator));
}
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
  if ((typeof left === "number" || left.__dartType === "double") && (typeof right === "number" || right.__dartType === "double")) return Number(left) === Number(right);
  const equals = left["=="];
  return typeof equals === "function" ? equals.call(left, right) : false;
}
function __dartRoundToInt(value) {
  return value < 0 ? Math.ceil(value - 0.5) : Math.floor(value + 0.5);
}
function __dartNumClamp(value, lower, upper) {
  if (value < lower) return lower;
  if (value > upper) return upper;
  return value;
}
function __dartIntGcd(left, right) {
  let a = Math.abs(Math.trunc(left));
  let b = Math.abs(Math.trunc(right));
  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a;
}
function __dartIntModInverse(value, modulus) {
  const m = Math.trunc(modulus);
  if (m < 1) throw __dartCoreError("RangeError", "Invalid value");
  const a = ((Math.trunc(value) % m) + m) % m;
  let t = 0;
  let nextT = 1;
  let r = m;
  let nextR = a;
  while (nextR !== 0) {
    const quotient = Math.trunc(r / nextR);
    const oldT = t;
    t = nextT;
    nextT = oldT - quotient * nextT;
    const oldR = r;
    r = nextR;
    nextR = oldR - quotient * nextR;
  }
  if (r !== 1) throw __dartCoreError("Exception", "Not coprime");
  return t < 0 ? t + m : t;
}
function __dartIntModPow(value, exponent, modulus) {
  let exp = Math.trunc(exponent);
  const m = Math.trunc(modulus);
  if (exp < 0) throw __dartCoreError("RangeError", "Invalid value");
  if (m < 1) throw __dartCoreError("RangeError", "Invalid value");
  let result = 1 % m;
  let base = ((Math.trunc(value) % m) + m) % m;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % m;
    exp = Math.trunc(exp / 2);
    base = (base * base) % m;
  }
  return result;
}
function __dartIntToRadixString(value, radix) {
  const base = Math.trunc(radix);
  if (base < 2 || base > 36) throw __dartCoreError("RangeError", "Invalid value");
  return Math.trunc(value).toString(base);
}
const __dartConstValues = new Map();
function __dartConst(key, create) {
  if (!__dartConstValues.has(key)) {
    __dartConstValues.set(key, create());
  }
  return __dartConstValues.get(key);
}

// Generated by dart2esm.

export function main() {
  const parsedInt = __dartIntParse("42", null);
  const parsedHex = __dartIntParse("ff", 16);
  const maybeInt = (__dartIntTryParse("nope", null) ?? (-1));
  __dartPrint("ints " + __dartStr(parsedInt) + " " + __dartStr(parsedHex) + " " + __dartStr(maybeInt));
  const parsedDouble = __dartDoubleParse("3.5");
  const maybeDouble = (__dartDoubleTryParse("bad") ?? 1.25);
  const parsedNum = __dartNumParse("7.25");
  __dartPrint("nums " + __dartStr(parsedDouble) + " " + __dartStr(maybeDouble) + " " + __dartStr(parsedNum));
  const char = String.fromCodePoint(65);
  const chars = String.fromCodePoint(...Array.from([68, 97, 114, 116]));
  const text = "  hello,dart  ";
  const trimmed = text.trim();
  __dartPrint("strings " + __dartStr(char) + " " + __dartStr(chars) + " " + __dartStr(trimmed.charCodeAt(0)) + " " + __dartStr(trimmed.substring(1, 4)));
  __dartPrint("checks " + __dartStr(trimmed.startsWith("he")) + " " + __dartStr(trimmed.endsWith("rt")) + " " + __dartStr(trimmed.indexOf("dart")) + " " + __dartStr(__dartIterableJoin(trimmed.split(","), "|")));
  __dartPrint("replace " + __dartStr(trimmed.replaceAll("l", "L").toUpperCase()));
  __dartPrint("stringMeta " + __dartStr(trimmed.length) + " " + __dartStr(trimmed.length !== 0) + " " + __dartStr("".length === 0) + " " + __dartStr(trimmed.includes("l", 3)) + " " + __dartStr("7".padStart(3, "0")) + " " + __dartStr("x".padEnd(3, ".")) + " " + __dartStr("  left".trimStart()) + " " + __dartStr("right  ".trimEnd()) + " " + __dartStr(("abc" < "abd" ? -1 : ("abc" > "abd" ? 1 : 0))));
  __dartPrint("stringOps " + __dartStr(__dartStringReplaceFirst(trimmed, "l", "L", 0)) + " " + __dartStr(__dartStringReplaceFirst(trimmed, "l", "L", 3)) + " " + __dartStr(__dartStringReplaceRange(trimmed, 1, 4, "EL")) + " " + __dartStr(__dartIterableJoin(Array.from(Array.from({ length: trimmed.length }, (_, index) => trimmed.charCodeAt(index))).slice(0, 3), "-")));
  const numeric = (-3.6);
  __dartPrint("numOps " + __dartStr(Math.abs(numeric)) + " " + __dartStr(((Number.isNaN(Number(numeric)) ? Number.NaN : (Number(numeric) < 0 ? -1 : (Number(numeric) > 0 ? 1 : Number(numeric)))) < 0)) + " " + __dartStr(__dartRoundToInt(numeric)) + " " + __dartStr(Math.floor(numeric)) + " " + __dartStr(Math.ceil(numeric)) + " " + __dartStr(Math.trunc(numeric)));
  __dartPrint("numFormat " + __dartStr(__dartNumClamp(numeric, (-3), 2)) + " " + __dartStr((numeric % 2)) + " " + __dartStr(Number(3.14159).toFixed(2)) + " " + __dartStr(Number(3.14159).toPrecision(3)));
  __dartPrint("numMeta " + __dartStr(Number.isNaN(Number(Number.NaN))) + " " + __dartStr((Number(Infinity) === Infinity || Number(Infinity) === -Infinity)) + " " + __dartStr(Number.isFinite(Number(3.0))) + " " + __dartStr((Number((-0.0)) < 0 || Object.is(Number((-0.0)), -0))));
  __dartPrint("intMore " + __dartStr((Math.trunc(5) % 2 === 0)) + " " + __dartStr((Math.trunc(5) % 2 !== 0)) + " " + __dartStr(__dartIntGcd(5, 15)) + " " + __dartStr(__dartIntGcd((-12), 18)) + " " + __dartStr(__dartIntModInverse(5, 7)) + " " + __dartStr(__dartIntModPow(5, 3, 7)) + " " + __dartStr(__dartIntToRadixString((-31), 16)));
  const bits = 3855;
  const lowerBits = 255;
  __dartPrint("bitOps " + __dartStr((bits & lowerBits)) + " " + __dartStr((bits | 4096)) + " " + __dartStr((bits ^ lowerBits)) + " " + __dartStr((3 << 4)) + " " + __dartStr((16 >> 2)) + " " + __dartStr((16 >>> 2)));
  __dartPrint("doubleMore " + __dartStr(__dartDouble(__dartRoundToInt(3.7))) + " " + __dartStr(__dartDouble(Math.floor(3.7))) + " " + __dartStr(__dartDouble(Math.ceil(3.2))) + " " + __dartStr(__dartDouble(Math.trunc(3.2))));
  try {
    {
      __dartIntModInverse(6, 9);
    }
  } catch ($error) {
    if (__dartIsCoreError($error, "Exception")) {
      const error = $error;
      {
        __dartPrint("modInverseError " + __dartStr(__dartObjectToString(error).includes("Not coprime")));
      }
    } else {
      throw $error;
    }
  }
  try {
    {
      __dartIntModPow(5, (-1), 7);
    }
  } catch ($error_1) {
    if (__dartIsCoreError($error_1, "RangeError")) {
      {
        __dartPrint("modPowError true");
      }
    } else {
      throw $error_1;
    }
  }
  const uri = __dartUriParse("https://user:pass@example.test:8443/a/b?x=1&x=2&empty=#frag", false);
  __dartPrint("uri " + __dartStr(uri.scheme) + " " + __dartStr(uri.host) + " " + __dartStr(uri.path) + " " + __dartStr(uri.query) + " " + __dartStr(uri.fragment));
  __dartPrint("uri meta " + __dartStr(uri.authority) + " " + __dartStr(uri.userInfo) + " " + __dartStr(uri.port) + " " + __dartStr(__dartIterableJoin(uri.pathSegments, "|")) + " " + __dartStr(uri.hasScheme) + " " + __dartStr(uri.hasAuthority) + " " + __dartStr(uri.hasPort) + " " + __dartStr(uri.hasQuery) + " " + __dartStr(uri.hasFragment) + " " + __dartStr(uri.isAbsolute));
  __dartPrint("uri query " + __dartStr(__dartMapGet(uri.queryParameters, "x")) + " " + __dartStr(__dartMapGet(uri.queryParameters, "empty")) + " " + __dartStr(__dartIterableJoin(__dartNullCheck(__dartMapGet(uri.queryParametersAll, "x")), "|")));
  const queryEncoded = __dartUriEncodeQueryComponent("a b/é", null);
  const queryDecoded = __dartUriDecodeQueryComponent("a+b%2F%C3%A9", null);
  const latinEncoded = __dartUriEncodeQueryComponent("é", __dartConst("[\"instance\",\"dart:convert::Latin1Codec\",[\"field\",\"dart:convert::Latin1Codec::@fields::dart:convert::_allowInvalid\",[\"bool\",false]]]", () => __dartLatin1Codec(false)));
  const latinDecoded = __dartUriDecodeQueryComponent("caf%E9", __dartConst("[\"instance\",\"dart:convert::Latin1Codec\",[\"field\",\"dart:convert::Latin1Codec::@fields::dart:convert::_allowInvalid\",[\"bool\",false]]]", () => __dartLatin1Codec(false)));
  const splitQuery = __dartUriSplitQueryString("a=1&empty&space=a+b&latin=caf%E9", __dartConst("[\"instance\",\"dart:convert::Latin1Codec\",[\"field\",\"dart:convert::Latin1Codec::@fields::dart:convert::_allowInvalid\",[\"bool\",false]]]", () => __dartLatin1Codec(false)));
  __dartPrint("uri queryOps " + __dartStr(queryEncoded) + " " + __dartStr(queryDecoded) + " " + __dartStr(latinEncoded) + " " + __dartStr(latinDecoded) + " " + __dartStr(__dartMapGet(splitQuery, "empty")) + " " + __dartStr(__dartMapGet(splitQuery, "space")) + " " + __dartStr(__dartMapGet(splitQuery, "latin")));
  __dartPrint("uri string " + __dartStr(__dartStr(uri)));
  const https = __dartUriBuild("https", "example.test", "/a/b", new Map([["q", "dart esm"], ["page", "1"]]));
  const http = __dartUriBuild("http", "example.test:8080", "plain path", new Map([["x", "a/b"]]));
  __dartPrint("uri build " + __dartStr(https.scheme) + " " + __dartStr(https.host) + " " + __dartStr(https.path) + " " + __dartStr(https.query));
  __dartPrint("uri built " + __dartStr(__dartStr(https)) + " " + __dartStr(__dartStr(http)));
  const replaced = __dartUriReplace(uri, { path: "/c/d", queryParameters: new Map([["z", "9"], ["many", ["a", "b"]]]), fragment: null });
  const resolved = __dartUriResolve(uri, "../c?q=1");
  const resolvedUri = __dartUriResolve(uri, __dartUriParse("/root?q=2", false));
  const normalized = __dartUriNormalizePath(__dartUriParse("https://example.test/a/../b/./c", false));
  __dartPrint("uri ops " + __dartStr(__dartStr(replaced)) + " " + __dartStr(__dartUriReplace(uri, { __removeFragment: true }).hasFragment) + " " + __dartStr(resolved.path) + " " + __dartStr(resolved.query) + " " + __dartStr(resolvedUri.path) + " " + __dartStr(normalized.path));
  const relative = __dartUriParse("relative/path.txt", false);
  const file = __dartUriFile("/tmp/a b.txt", false, false);
  const directory = __dartUriFile("/tmp/a b", false, true);
  const relativeFile = __dartUriFile("relative/path.txt", false, false);
  __dartPrint("uri factories " + __dartStr(relative.path) + " " + __dartStr(relative.isAbsolute) + " " + __dartStr(file.scheme) + " " + __dartStr(file.path) + " " + __dartStr(directory.path.endsWith("/")) + " " + __dartStr(relativeFile.scheme) + " " + __dartStr(relativeFile.path));
  const constructedUri = __dartUri({ scheme: "https", host: "example.test", pathSegments: ["a b", "c"], queryParameters: new Map([["q", "x y"]]) });
  const authorityUri = __dartUri({ userInfo: "u:p", host: "example.test", port: 8080, path: "/p", fragment: "f" });
  const relativeCtor = __dartUri({ path: "/a b", queryParameters: new Map([["x", ["1", "2"]], ["empty", null]]) });
  __dartPrint("uri ctor " + __dartStr(__dartStr(constructedUri)) + " " + __dartStr(constructedUri.path) + " " + __dartStr(__dartMapGet(constructedUri.queryParameters, "q")) + " " + __dartStr(__dartStr(authorityUri)) + " " + __dartStr(authorityUri.host) + " " + __dartStr(__dartStr(relativeCtor)));
  const dataText = __dartUriDataFromString("hello world", null, null, null, false);
  const dataJson = __dartUriDataFromString("hello world", "application/json", null, null, false);
  const dataUtf8 = __dartUriDataFromString("å", null, __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)), null, false);
  const dataBase64 = __dartUriDataFromString("hello", null, null, null, true);
  const dataBytes = __dartUriDataFromBytes([65, 66, 67], null, null, false);
  const dataBytesText = __dartUriDataFromBytes([65, 66, 67], "text/plain", null, false);
  const dataBytesPercent = __dartUriDataFromBytes([65, 66, 67], null, null, true);
  __dartPrint("uri data " + __dartStr(__dartStr(dataText)) + " " + __dartStr(__dartStr(dataJson)) + " " + __dartStr(__dartStr(dataUtf8)) + " " + __dartStr(__dartStr(dataBase64)) + " " + __dartStr(__dartStr(dataBytes)) + " " + __dartStr(__dartStr(dataBytesText)) + " " + __dartStr(__dartStr(dataBytesPercent)));
  const tryUri = __dartUriParse("https://example.test/try", true);
  const invalidUri = __dartUriParse("http://[::1", true);
  __dartPrint("uri try " + __dartStr(__dartNullCheck(tryUri).host) + " " + __dartStr((invalidUri === null)));
  try {
    {
      __dartUriParse("http://[::1", false);
    }
  } catch ($error_2) {
    if (__dartIsCoreError($error_2, "FormatException")) {
      {
        __dartPrint("uri parseError true");
      }
    } else {
      throw $error_2;
    }
  }
}

main();
