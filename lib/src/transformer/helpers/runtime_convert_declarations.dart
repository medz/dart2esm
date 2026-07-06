part of 'runtime_helpers.dart';

extension _Converthelperdeclaration on EsmRuntimeHelperRegistry {
  EsmModuleItem _convertHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.encoding => EsmRawModuleItem('''
function __dartLatin1Codec(allowInvalid = false) {
  return __dartCodec("latin1", __dartLatin1Encoder(), __dartLatin1Decoder(allowInvalid));
}
function __dartAsciiCodec(allowInvalid = false) {
  return __dartCodec("ascii", __dartAsciiEncoder(), __dartAsciiDecoder(allowInvalid));
}
function __dartUtf8Codec(allowMalformed = false) {
  return __dartCodec("utf8", __dartUtf8Encoder(), __dartUtf8Decoder(allowMalformed));
}
function __dartSliceInput(input, start = 0, end = null) {
  return Array.from(input).slice(Number(start), end == null ? undefined : Number(end));
}
function __dartStringSlice(input, start = 0, end = null) {
  return String(input).slice(Number(start), end == null ? undefined : Number(end));
}
function __dartConverter(convert, options = {}) {
  const converter = {
    __dartType: "Converter",
    convert,
    bind(stream) {
      if (typeof options.bind === "function") return options.bind(stream);
      return __dartStreamMap(stream, (value) => convert(value));
    },
    cast() { return converter; },
    fuse(next) { return __dartFusedConverter(converter, next); },
    startChunkedConversion(sink) {
      if (typeof options.startChunkedConversion === "function") {
        return options.startChunkedConversion(sink);
      }
      return __dartChunkedSink((values) => __dartSinkAdd(sink, convert(values.length === 1 ? values[0] : values)), sink);
    },
  };
  return Object.freeze(converter);
}
function __dartFusedConverter(first, second) {
  return __dartConverter((input, ...rest) => second.convert(first.convert(input, ...rest)), {
    bind(stream) { return second.bind(first.bind(stream)); },
  });
}
function __dartCodec(name, encoder, decoder) {
  const codec = {
    __dartType: "Codec",
    name,
    get encoder() { return encoder; },
    get decoder() { return decoder; },
    encode(input) { return encoder.convert(input); },
    decode(input, options = {}) {
      if (name === "utf8" && options?.allowMalformed != null) return __dartUtf8Decoder(options.allowMalformed).convert(input);
      if ((name === "ascii" || name === "latin1") && options?.allowInvalid != null) return (name === "ascii" ? __dartAsciiDecoder(options.allowInvalid) : __dartLatin1Decoder(options.allowInvalid)).convert(input);
      return decoder.convert(input);
    },
    fuse(next) {
      return {
        __dartType: "Codec",
        get encoder() { return encoder.fuse(next.encoder ?? next); },
        get decoder() { return (next.decoder ?? next).fuse(decoder); },
        encode(input) { return (next.encoder ?? next).convert(encoder.convert(input)); },
        decode(input) { return decoder.convert((next.decoder ?? next).convert(input)); },
      };
    },
  };
  return Object.freeze(codec);
}
function __dartUtf8Encoder() {
  const convert = (source, start = 0, end = null) => Array.from(new TextEncoder().encode(__dartStringSlice(source, start, end)));
  return __dartConverter(convert, { startChunkedConversion: (sink) => __dartStringCollectingSink((text) => { __dartSinkAdd(sink, convert(text)); __dartSinkClose(sink); }) });
}
function __dartUtf8Decoder(allowMalformed = false) {
  const convert = (bytes, start = 0, end = null) => new TextDecoder("utf-8", { fatal: !allowMalformed }).decode(Uint8Array.from(__dartSliceInput(bytes, start, end)));
  return __dartConverter(convert, { startChunkedConversion: (sink) => __dartByteCollectingSink((bytes) => { __dartSinkAdd(sink, convert(bytes)); __dartSinkClose(sink); }) });
}
function __dartAsciiEncoder() {
  const convert = (source, start = 0, end = null) => Array.from(__dartStringSlice(source, start, end), (char) => {
    const code = char.charCodeAt(0);
    if (code > 0x7f) throw __dartCoreError("FormatException", "Invalid ASCII character");
    return code;
  });
  return __dartConverter(convert, { startChunkedConversion: (sink) => __dartStringCollectingSink((text) => { __dartSinkAdd(sink, convert(text)); __dartSinkClose(sink); }) });
}
function __dartAsciiDecoder(allowInvalid = false) {
  const convert = (bytes, start = 0, end = null) => String.fromCharCode.apply(null, __dartSliceInput(bytes, start, end).map((byte) => {
    const code = Number(byte) & 255;
    if (code > 0x7f && !allowInvalid) throw __dartCoreError("FormatException", "Invalid ASCII byte");
    return code > 0x7f ? 0xfffd : code;
  }));
  return __dartConverter(convert, { startChunkedConversion: (sink) => __dartByteCollectingSink((bytes) => { __dartSinkAdd(sink, convert(bytes)); __dartSinkClose(sink); }) });
}
function __dartLatin1Encoder() {
  const convert = (source, start = 0, end = null) => Array.from(__dartStringSlice(source, start, end), (char) => char.charCodeAt(0) & 255);
  return __dartConverter(convert, { startChunkedConversion: (sink) => __dartStringCollectingSink((text) => { __dartSinkAdd(sink, convert(text)); __dartSinkClose(sink); }) });
}
function __dartLatin1Decoder(allowInvalid = false) {
  const convert = (bytes, start = 0, end = null) => String.fromCharCode.apply(null, __dartSliceInput(bytes, start, end).map((byte) => {
    const code = Number(byte);
    if ((code < 0 || code > 255) && !allowInvalid) throw __dartCoreError("FormatException", "Invalid Latin-1 byte");
    return code < 0 || code > 255 ? 0xfffd : code;
  }));
  return __dartConverter(convert, { startChunkedConversion: (sink) => __dartByteCollectingSink((bytes) => { __dartSinkAdd(sink, convert(bytes)); __dartSinkClose(sink); }) });
}
function __dartBase64BytesToString(bytes, urlSafe = false) {
  const values = Uint8Array.from(Array.from(bytes, (byte) => Number(byte) & 255));
  let encoded;
  if (typeof Buffer !== "undefined") encoded = Buffer.from(values).toString("base64");
  else encoded = btoa(String.fromCharCode.apply(null, values));
  return urlSafe ? encoded.replaceAll("+", "-").replaceAll("/", "_") : encoded;
}
function __dartBase64StringToBytes(source) {
  let text = __dartBase64Normalize(source);
  if (typeof Buffer !== "undefined") return Array.from(Buffer.from(text, "base64"));
  return Array.from(atob(text), (char) => char.charCodeAt(0));
}
function __dartBase64Normalize(source, start = 0, end = null) {
  const before = String(source).slice(0, start);
  const selected = String(source).slice(start, end == null ? undefined : end).replaceAll("-", "+").replaceAll("_", "/");
  const after = end == null ? "" : String(source).slice(end);
  let normalized = selected;
  const remainder = normalized.length % 4;
  if (remainder === 1) throw __dartCoreError("FormatException", "Invalid base64 encoding length");
  if (remainder > 1) normalized += "=".repeat(4 - remainder);
  return before + normalized + after;
}
function __dartBase64Encoder(urlSafe = false) {
  return __dartConverter((bytes, start = 0, end = null) => __dartBase64BytesToString(__dartSliceInput(bytes, start, end), urlSafe));
}
function __dartBase64Decoder() {
  return __dartConverter((source, start = 0, end = null) => __dartBase64StringToBytes(__dartStringSlice(source, start, end)));
}
function __dartBase64Codec(urlSafe = false) {
  const codec = __dartCodec("base64", __dartBase64Encoder(urlSafe), __dartBase64Decoder());
  return Object.freeze({
    ...codec,
    normalize(source, start = 0, end = null) { return __dartBase64Normalize(source, start, end); },
  });
}
function __dartJsonToPlain(value) {
  if (value instanceof Map) return Object.fromEntries(Array.from(value, ([key, entryValue]) => [String(key), __dartJsonToPlain(entryValue)]));
  if (value instanceof Set) return Array.from(value, __dartJsonToPlain);
  if (Array.isArray(value) || ArrayBuffer.isView(value)) return Array.from(value, __dartJsonToPlain);
  if (value != null && typeof value.toJson === "function") return __dartJsonToPlain(value.toJson());
  return value;
}
function __dartJsonFromPlain(value, reviver = null, key = null) {
  let result;
  if (Array.isArray(value)) result = value.map((entry, index) => __dartJsonFromPlain(entry, reviver, index));
  else if (value != null && typeof value === "object") result = new Map(Object.entries(value).map(([name, entry]) => [name, __dartJsonFromPlain(entry, reviver, name)]));
  else result = value;
  return typeof reviver === "function" ? reviver(key, result) : result;
}
function __dartJsonEncode(value, toEncodable = null, indent = null) {
  const plain = __dartJsonToPlain(toEncodable == null ? value : toEncodable(value));
  return JSON.stringify(plain, null, indent == null ? undefined : String(indent));
}
function __dartJsonDecode(source, reviver = null) {
  return __dartJsonFromPlain(JSON.parse(String(source)), reviver);
}
function __dartJsonEncoder(indent = null, toEncodable = null) {
  return __dartConverter((value) => __dartJsonEncode(value, toEncodable, indent));
}
function __dartJsonDecoder(reviver = null) {
  return __dartConverter((source) => __dartJsonDecode(source, reviver));
}
function __dartJsonCodec(reviver = null, toEncodable = null) {
  return __dartCodec("json", __dartJsonEncoder(null, toEncodable), __dartJsonDecoder(reviver));
}
function __dartJsonUtf8Encoder(indent = null, toEncodable = null) {
  return __dartConverter((value) => __dartUtf8Encoder().convert(__dartJsonEncode(value, toEncodable, indent)));
}
function __dartLineSplitter() {
  const splitLines = (text) => String(text).split(/\\r\\n|\\n|\\r/).filter((line, index, lines) => !(index === lines.length - 1 && line === ""));
  return __dartConverter(splitLines, {
    bind(stream) {
      return {
        __dartType: "Stream",
        isBroadcast: stream?.isBroadcast === true,
        async *[Symbol.asyncIterator]() {
          let buffered = "";
          for await (const chunk of __dartStreamValues(stream)) buffered += String(chunk);
          for (const line of splitLines(buffered)) yield line;
        },
      };
    },
    startChunkedConversion(sink) {
      let buffered = "";
      return Object.freeze({
        add(chunk) { buffered += String(chunk); return null; },
        addSlice(chunk, start, end, isLast) {
          buffered += String(chunk).slice(start, end);
          if (isLast) this.close();
          return null;
        },
        close() {
          for (const line of splitLines(buffered)) __dartSinkAdd(sink, line);
          __dartSinkClose(sink);
          return null;
        },
      });
    },
  });
}
function __dartHtmlEscapeMode(options = {}) {
  return Object.freeze({
    __dartType: "HtmlEscapeMode",
    escapeLtGt: options.escapeLtGt ?? true,
    escapeQuot: options.escapeQuot ?? true,
    escapeApos: options.escapeApos ?? true,
    escapeSlash: options.escapeSlash ?? true,
  });
}
function __dartHtmlEscape(mode = null) {
  const active = mode ?? __dartHtmlEscapeMode();
  const convert = (source) => String(source).replace(/[&<>"'\\/]/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<" && active.escapeLtGt) return "&lt;";
    if (char === ">" && active.escapeLtGt) return "&gt;";
    if (char === "\\\"" && active.escapeQuot) return "&quot;";
    if (char === "'" && active.escapeApos) return "&#39;";
    if (char === "/" && active.escapeSlash) return "&#47;";
    return char;
  });
  return __dartConverter(convert, { startChunkedConversion: (sink) => __dartStringCollectingSink((text) => { __dartSinkAdd(sink, convert(text)); __dartSinkClose(sink); }) });
}
function __dartStringCollectingSink(callback) {
  let text = "";
  return Object.freeze({
    add(chunk) { text += String(chunk); return null; },
    addSlice(chunk, start, end, isLast) {
      text += String(chunk).slice(start, end);
      if (isLast) this.close();
      return null;
    },
    close() { callback(text); return null; },
  });
}
function __dartByteCollectingSink(callback) {
  const bytes = [];
  return Object.freeze({
    add(chunk) { bytes.push(...Array.from(chunk)); return null; },
    addSlice(chunk, start, end, isLast) {
      bytes.push(...Array.from(chunk).slice(start, end));
      if (isLast) this.close();
      return null;
    },
    close() { callback(bytes); return null; },
  });
}
function __dartChunkedSink(callback, target = null) {
  const values = [];
  return Object.freeze({
    add(value) { values.push(value); return null; },
    addSlice(valuesSource, start, end, isLast) {
      values.push(...Array.from(valuesSource).slice(start, end));
      if (isLast) this.close();
      return null;
    },
    close() {
      callback(values);
      if (target != null) __dartSinkClose(target);
      return null;
    },
  });
}
function __dartStringConversionSinkWithCallback(callback) {
  let text = "";
  return Object.freeze({
    add(chunk) { text += String(chunk); return null; },
    addSlice(chunk, start, end, isLast) {
      text += String(chunk).slice(start, end);
      if (isLast) this.close();
      return null;
    },
    close() { callback(text); return null; },
    asUtf8Sink(allowMalformed = false) { return __dartUtf8Decoder(allowMalformed).startChunkedConversion(this); },
  });
}
function __dartStringConversionSinkFrom(sink) {
  return Object.freeze({
    add(chunk) { __dartSinkAdd(sink, String(chunk)); return null; },
    addSlice(chunk, start, end, isLast) {
      __dartSinkAdd(sink, String(chunk).slice(start, end));
      if (isLast) __dartSinkClose(sink);
      return null;
    },
    close() { __dartSinkClose(sink); return null; },
    asUtf8Sink(allowMalformed = false) { return __dartUtf8Decoder(allowMalformed).startChunkedConversion(this); },
  });
}
function __dartStringConversionSinkFromStringSink(sink) {
  return Object.freeze({
    add(chunk) {
      if (typeof sink.write === "function") sink.write(String(chunk));
      else __dartSinkAdd(sink, String(chunk));
      return null;
    },
    addSlice(chunk, start, end, isLast) {
      this.add(String(chunk).slice(start, end));
      if (isLast) this.close();
      return null;
    },
    close() { return null; },
    asUtf8Sink(allowMalformed = false) { return __dartUtf8Decoder(allowMalformed).startChunkedConversion(this); },
  });
}
'''),
      EsmRuntimeHelper.byteConversionSink => EsmRawModuleItem('''
function __dartSinkAdd(sink, value) {
  if (sink != null && typeof sink.add === "function") return sink.add(value);
  if (typeof sink === "function") return sink(value);
  throw new TypeError("Sink has no add method");
}
function __dartSinkClose(sink) {
  if (sink != null && typeof sink.close === "function") return sink.close();
  return null;
}
function __dartByteConversionSink(callback) {
  return Object.freeze({
    add(chunk) {
      callback(Array.from(chunk));
      return null;
    },
    addSlice(chunk, start, end, isLast) {
      callback(Array.from(chunk).slice(start, end));
      if (isLast) this.close();
      return null;
    },
    addByte(byte) {
      callback([Number(byte) & 255]);
      return null;
    },
    close() {
      return null;
    },
  });
}
function __dartByteConversionSinkFrom(sink) {
  return Object.freeze({
    add(chunk) {
      __dartSinkAdd(sink, Array.from(chunk));
      return null;
    },
    addSlice(chunk, start, end, isLast) {
      __dartSinkAdd(sink, Array.from(chunk).slice(start, end));
      if (isLast) __dartSinkClose(sink);
      return null;
    },
    addByte(byte) {
      __dartSinkAdd(sink, [Number(byte) & 255]);
      return null;
    },
    close() {
      __dartSinkClose(sink);
      return null;
    },
  });
}
'''),
      _ => throw StateError('Unexpected runtime helper declaration: $helper'),
    };
  }
}
