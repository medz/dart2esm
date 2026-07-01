part of 'runtime_helpers.dart';

extension _Converthelperdeclaration on EsmRuntimeHelperRegistry {
  EsmModuleItem _convertHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.encoding => EsmRawModuleItem('''
function __dartLatin1Codec(allowInvalid = false) {
  return Object.freeze({
    name: "latin1",
    encode(source) {
      return Array.from(String(source), (char) => char.charCodeAt(0) & 255);
    },
    decode(bytes) {
      return String.fromCharCode.apply(null, Array.from(bytes, (byte) => Number(byte) & 255));
    },
  });
}
function __dartUtf8Codec(allowMalformed = false) {
  return Object.freeze({
    name: "utf8",
    encode(source) {
      return Array.from(new TextEncoder().encode(String(source)));
    },
    decode(bytes) {
      return new TextDecoder("utf-8", { fatal: !allowMalformed }).decode(Uint8Array.from(Array.from(bytes, (byte) => Number(byte) & 255)));
    },
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
