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
  if (typeof value.toJson === "function") {
    return __dartToJson(value.toJson(), toEncodable);
  }
  if (typeof toEncodable === "function") {
    return __dartToJson(toEncodable(value), toEncodable);
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
function __dartJsonEncode(value, toEncodable = null) {
  return JSON.stringify(__dartToJson(value, toEncodable));
}
function __dartJsonDecode(source) {
  return __dartFromJson(JSON.parse(source));
}
function __dartJsonCodec() {
  return {
    encode(value) { return __dartJsonEncode(value); },
    decode(source) { return __dartJsonDecode(source); },
  };
}
function __dartUtf8Encode(source) {
  return Array.from(new TextEncoder().encode(String(source)));
}
function __dartUtf8Decode(bytes, allowMalformed = false) {
  return new TextDecoder("utf-8", { fatal: !allowMalformed }).decode(Uint8Array.from(bytes));
}
function __dartUtf8Codec(allowMalformed = false) {
  return {
    encode(source) { return __dartUtf8Encode(source); },
    decode(bytes, options = {}) { return __dartUtf8Decode(bytes, options.allowMalformed ?? allowMalformed); },
  };
}
function __dartAsciiEncode(source) {
  const text = String(source);
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 0x7f) throw new RangeError("Invalid ASCII character");
    bytes.push(code);
  }
  return bytes;
}
function __dartAsciiDecode(bytes, allowInvalid = false) {
  const chars = [];
  for (const byte of bytes) {
    if (byte < 0 || byte > 0x7f) { if (!allowInvalid) throw new RangeError("Invalid ASCII byte"); chars.push("\uFFFD"); continue; }
    chars.push(String.fromCharCode(byte));
  }
  return chars.join("");
}
function __dartAsciiCodec(allowInvalid = false) {
  return {
    encode(source) { return __dartAsciiEncode(source); },
    decode(bytes, options = {}) { return __dartAsciiDecode(bytes, options.allowInvalid ?? allowInvalid); },
  };
}
function __dartLatin1Encode(source) {
  const text = String(source);
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 0xff) throw new RangeError("Invalid Latin-1 character");
    bytes.push(code);
  }
  return bytes;
}
function __dartLatin1Decode(bytes, allowInvalid = false) {
  const chars = [];
  for (const byte of bytes) {
    if (byte < 0 || byte > 0xff) { if (!allowInvalid) throw new RangeError("Invalid Latin-1 byte"); chars.push("\uFFFD"); continue; }
    chars.push(String.fromCharCode(byte));
  }
  return chars.join("");
}
function __dartLatin1Codec(allowInvalid = false) {
  return {
    encode(source) { return __dartLatin1Encode(source); },
    decode(bytes, options = {}) { return __dartLatin1Decode(bytes, options.allowInvalid ?? allowInvalid); },
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
function __dartBase64Codec(urlSafe = false) {
  return {
    encode(bytes) { return __dartBase64Encode(bytes, urlSafe); },
    decode(source) { return __dartBase64Decode(source); },
  };
}
function __dartLineSplit(source) {
  const text = String(source);
  if (text.length === 0) return [];
  const lines = text.split(/\r\n|\n|\r/);
  if (text.endsWith("\n") || text.endsWith("\r")) lines.pop();
  return lines;
}
function __dartLineSplitter() {
  return {
    convert(source) { return __dartLineSplit(source); },
  };
}
function __dartHtmlEscapeChar(char) {
  switch (char) {
    case "&": return "&amp;";
    case "<": return "&lt;";
    case ">": return "&gt;";
    case '"': return "&quot;";
    case "'": return "&#39;";
    case "/": return "&#47;";
    default: return char;
  }
}
function __dartHtmlEscape() {
  return {
    convert(source) { return String(source).replace(/[&<>"'/]/g, __dartHtmlEscapeChar); },
  };
}
function __dartAs(value, test, typeName) {
  if (test(value)) return value;
  throw new TypeError("Type cast failed: expected " + typeName);
}
const __dartMapMissingKey = Symbol("dart.mapMissingKey");
function __dartMapKey(map, key) {
  if (map.__dartIdentityMap) return map.has(key) ? key : __dartMapMissingKey;
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
const __dartConstValues = new Map();
function __dartConst(key, create) {
  if (!__dartConstValues.has(key)) {
    __dartConstValues.set(key, create());
  }
  return __dartConstValues.get(key);
}

// Generated by dart2esm.

export function main() {
  const payload = new Map([["name", "dart2esm"], ["values", [1, 2, 3]], ["ok", true]]);
  const encoded = __dartJsonEncode(payload, null);
  const decoded = __dartAs(__dartJsonDecode(encoded), value => value instanceof Map, "Map<dynamic, dynamic>");
  __dartPrint("json " + __dartStr(__dartMapGet(decoded, "name")) + " " + __dartStr(__dartAs(__dartMapGet(decoded, "values"), value => (Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView))), "List<dynamic>").length));
  const codecEncoded = __dartConst("[\"instance\",\"dart:convert::JsonCodec\",[\"field\",\"dart:convert::JsonCodec::@fields::dart:convert::_reviver\",[\"null\"]],[\"field\",\"dart:convert::JsonCodec::@fields::dart:convert::_toEncodable\",[\"null\"]]]", () => __dartJsonCodec()).encode(new Map([["answer", 42]]));
  const codecDecoded = __dartAs(__dartConst("[\"instance\",\"dart:convert::JsonCodec\",[\"field\",\"dart:convert::JsonCodec::@fields::dart:convert::_reviver\",[\"null\"]],[\"field\",\"dart:convert::JsonCodec::@fields::dart:convert::_toEncodable\",[\"null\"]]]", () => __dartJsonCodec()).decode(codecEncoded), value => value instanceof Map, "Map<dynamic, dynamic>");
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
  __dartPrint("malformed " + __dartStr(Array.from(malformedUtf8, (char) => char.codePointAt(0))[0]) + " " + __dartStr(Array.from(malformedUtf8Override, (char) => char.codePointAt(0))[0]) + " " + __dartStr(Array.from(invalidAscii, (char) => char.codePointAt(0))[Array.from(invalidAscii, (char) => char.codePointAt(0)).length - 1]) + " " + __dartStr(Array.from(invalidLatin, (char) => char.codePointAt(0))[Array.from(invalidLatin, (char) => char.codePointAt(0)).length - 1]));
  const token = __dartBase64Encode(bytes);
  __dartPrint("base64 " + __dartStr(token) + " " + __dartStr(__dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).decode(__dartBase64Decode(token))));
  const urlToken = __dartConst("[\"instance\",\"dart:convert::Base64Codec\",[\"field\",\"dart:convert::Base64Codec::@fields::dart:convert::_encoder\",[\"instance\",\"dart:convert::Base64Encoder\",[\"field\",\"dart:convert::Base64Encoder::@fields::dart:convert::_urlSafe\",[\"bool\",true]]]]]", () => __dartBase64Codec(true)).encode(bytes);
  __dartPrint("base64Url " + __dartStr(urlToken) + " " + __dartStr(__dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).decode(__dartConst("[\"instance\",\"dart:convert::Base64Codec\",[\"field\",\"dart:convert::Base64Codec::@fields::dart:convert::_encoder\",[\"instance\",\"dart:convert::Base64Encoder\",[\"field\",\"dart:convert::Base64Encoder::@fields::dart:convert::_urlSafe\",[\"bool\",true]]]]]", () => __dartBase64Codec(true)).decode(urlToken))));
  const lines = __dartConst("[\"instance\",\"dart:convert::LineSplitter\"]", () => __dartLineSplitter()).convert("a\nb\r\nc");
  const staticLines = __dartIterableJoin(__dartLineSplit("x\ry"), "/");
  __dartPrint("lines " + __dartStr(__dartIterableJoin(lines, "|")) + " " + __dartStr(staticLines));
  const escaped = __dartConst("[\"instance\",\"dart:convert::HtmlEscape\",[\"field\",\"dart:convert::HtmlEscape::@fields::mode\",[\"instance\",\"dart:convert::HtmlEscapeMode\",[\"field\",\"dart:convert::HtmlEscapeMode::@fields::dart:convert::_name\",[\"string\",\"unknown\"]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeApos\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeLtGt\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeQuot\",[\"bool\",true]],[\"field\",\"dart:convert::HtmlEscapeMode::@fields::escapeSlash\",[\"bool\",true]]]]]", () => __dartHtmlEscape()).convert("<a&b>\"'/");
  __dartPrint("html " + __dartStr(escaped));
}

main();
