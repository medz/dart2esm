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
function __dartListSetRange(target, start, end, source, skipCount = 0) {
  const values = Array.from(source).slice(skipCount, skipCount + (end - start));
  for (let index = 0; index < values.length; index++) {
    target[start + index] = values[index];
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

// Generated by dart2esm.

class Digest {
  constructor(bytes) {
    this.bytes = bytes;
  }
  "=="(other) {
    if (other instanceof Digest) {
      {
        const a = this.bytes;
        const b = other.bytes;
        const n = a.length;
        if (!(__dartEquals(n, b.length))) {
          {
            return false;
          }
        }
        let mismatch = 0;
        for (let i = 0; (i < n); i = (i + 1)) {
          {
            mismatch = (mismatch | (a[i] ^ b[i]));
          }
        }
        return __dartEquals(mismatch, 0);
      }
    }
    return false;
  }
  get hashCode() {
    return __dartObjectHash(Array.from(this.bytes));
  }
  toString() {
    return _hexEncode(this.bytes);
  }
}

class DigestSink {
  constructor() {
    this._value = null;
  }
  get value() {
    return __dartNullCheck(this._value);
  }
  add(value) {
    if (!((this._value === null))) {
      (() => { throw __dartCoreError("StateError", "add may only be called once."); })();
    }
    this._value = value;
  }
  close() {
    if ((this._value === null)) {
      (() => { throw __dartCoreError("StateError", "add must be called once."); })();
    }
  }
}

class Hash {
  constructor() {
  }
  get blockSize() {
    throw new TypeError("Abstract member Hash.blockSize");
  }
  set blockSize(value) {
    Object.defineProperty(this, "blockSize", { value, writable: true, configurable: true, enumerable: true });
  }
  convert(input) {
    let innerSink = new DigestSink();
    let outerSink = this.startChunkedConversion(innerSink);
    outerSink.add(input);
    outerSink.close();
    return innerSink.value;
  }
  startChunkedConversion(sink) {
    throw new TypeError("Abstract member Hash.startChunkedConversion");
  }
  bind(stream) { return __dartConverterBind(this, stream); }
  fuse(next) { return __dartConverterFuse(this, next); }
}

class Hmac {
  constructor(hash, key) {
    this._hash = hash;
    this._key = new Uint8Array(hash.blockSize);
    if ((key.length > this._hash.blockSize)) {
      key = this._hash.convert(key).bytes;
    }
    __dartListSetRange(this._key, 0, key.length, key, 0);
  }
  convert(input) {
    let innerSink = new DigestSink();
    let outerSink = this.startChunkedConversion(innerSink);
    outerSink.add(input);
    outerSink.close();
    return innerSink.value;
  }
  startChunkedConversion(sink) {
    return new _HmacSink(sink, this._hash, this._key);
  }
  bind(stream) { return __dartConverterBind(this, stream); }
  fuse(next) { return __dartConverterFuse(this, next); }
}

class _HmacSink {
  constructor(sink, hash, key) {
    this._innerResultSink = new DigestSink();
    const $_innerSink = __dartLazyField("_HmacSink._innerSink", null, "once");
    Object.defineProperty(this, "_innerSink", {
      get() { return $_innerSink.get(); },
      set(value) { $_innerSink.set(value); },
      enumerable: true,
    });
    this._isClosed = false;
    this._outerSink = hash.startChunkedConversion(sink);
    this._innerSink = hash.startChunkedConversion(this._innerResultSink);
    let padding = new Uint8Array(key.length);
    for (let i = 0; (i < padding.length); i = (i + 1)) {
      {
        padding[i] = (92 ^ key[i]);
      }
    }
    this._outerSink.add(padding);
    for (let i_1 = 0; (i_1 < padding.length); i_1 = (i_1 + 1)) {
      {
        padding[i_1] = (54 ^ key[i_1]);
      }
    }
    this._innerSink.add(padding);
  }
  add(data) {
    if (this._isClosed) {
      (() => { throw __dartCoreError("StateError", "HMAC is closed"); })();
    }
    this._innerSink.add(data);
  }
  addSlice(data, start, end, isLast) {
    if (this._isClosed) {
      (() => { throw __dartCoreError("StateError", "HMAC is closed"); })();
    }
    this._innerSink.addSlice(data, start, end, isLast);
  }
  close() {
    if (this._isClosed) {
      return;
    }
    this._isClosed = true;
    this._innerSink.close();
    this._outerSink.add(this._innerResultSink.value.bytes);
    this._outerSink.close();
  }
  addByte(byte) { return this.add([byte]); }
}

class HashSink {
  constructor(_sink, chunkSizeInWords, { endian = false, signatureBytes = 8 } = {}) {
    this._byteDataView = null;
    this._lengthInBytes = 0;
    this._isClosed = false;
    this._sink = _sink;
    this._endian = endian;
    this._signatureBytes = signatureBytes;
    this._chunk = new Uint8Array((chunkSizeInWords * 4));
    this._chunkNextIndex = 0;
    this._chunk32 = new Uint32Array(chunkSizeInWords);
  }
  get digest() {
    throw new TypeError("Abstract member HashSink.digest");
  }
  set digest(value) {
    Object.defineProperty(this, "digest", { value, writable: true, configurable: true, enumerable: true });
  }
  updateHash(chunk) {
    throw new TypeError("Abstract member HashSink.updateHash");
  }
  add(data) {
    if (this._isClosed) {
      (() => { throw __dartCoreError("StateError", "Hash.add() called after close()."); })();
    }
    this._lengthInBytes = (this._lengthInBytes + data.length);
    this._addData(data);
  }
  _addData(data) {
    let dataIndex = 0;
    let chunkNextIndex = this._chunkNextIndex;
    const size = this._chunk.length;
    ((this._byteDataView === null) ? this._byteDataView = new DataView(this._chunk.buffer) : null);
    while (true) {
      {
        let restEnd = ((chunkNextIndex + data.length) - dataIndex);
        if ((restEnd < size)) {
          {
            __dartListSetRange(this._chunk, chunkNextIndex, restEnd, data, dataIndex);
            this._chunkNextIndex = restEnd;
            return;
          }
        }
        __dartListSetRange(this._chunk, chunkNextIndex, size, data, dataIndex);
        dataIndex = (dataIndex + (size - chunkNextIndex));
        let j = 0;
        do {
          {
            this._chunk32[j] = __dartNullCheck(this._byteDataView).getUint32((j * 4), this._endian);
            j = (j + 1);
          }
        } while ((j < this._chunk32.length));
        this.updateHash(this._chunk32);
        chunkNextIndex = 0;
      }
    }
  }
  close() {
    if (this._isClosed) {
      return;
    }
    this._isClosed = true;
    this._finalizeAndProcessData();
    this._sink.add(new Digest(this._byteDigest()));
    this._sink.close();
  }
  _byteDigest() {
    if (__dartEquals(this._endian, true)) {
      return new Uint8Array(this.digest.buffer);
    }
    const cachedDigest = this.digest;
    const byteDigest = new Uint8Array(cachedDigest.byteLength);
    const byteData = new DataView(byteDigest.buffer);
    for (let i = 0; (i < cachedDigest.length); i = (i + 1)) {
      {
        byteData.setUint32((i * 4), cachedDigest[i]);
      }
    }
    return byteDigest;
  }
  _finalizeAndProcessData() {
    if ((this._lengthInBytes > 1125899906842623)) {
      {
        (() => { throw __dartCoreError("UnsupportedError", "Hashing is unsupported for messages with more than 2^53 bits."); })();
      }
    }
    const contentsLength = ((this._lengthInBytes + 1) + this._signatureBytes);
    const finalizedLength = this._roundUp(contentsLength, this._chunk.byteLength);
    let padding = new Uint8Array((finalizedLength - this._lengthInBytes));
    padding[0] = 128;
    let lengthInBits = (this._lengthInBytes * 8);
    const offset = (padding.length - 8);
    let byteData = new DataView(padding.buffer);
    let highBits = __dartTruncDiv(lengthInBits, 4294967296);
    let lowBits = (lengthInBits >>> 0);
    if (__dartEquals(this._endian, false)) {
      {
        byteData.setUint32(offset, highBits, this._endian);
        byteData.setUint32((offset + 4), lowBits, this._endian);
      }
    } else {
      {
        byteData.setUint32(offset, lowBits, this._endian);
        byteData.setUint32((offset + 4), highBits, this._endian);
      }
    }
    this._addData(padding);
  }
  _roundUp(val, n) {
    return (((val + n) - 1) & (-n));
  }
}

class _MD5 extends Hash {
  constructor() {
    throw new TypeError("Class _MD5 has no unnamed constructor");
  }
  static _() {
    return $_MD5__(_MD5);
  }
  startChunkedConversion(sink) {
    return __dartByteConversionSinkFrom(new _MD5Sink(sink));
  }
}

function $_MD5__($newTarget) {
  const $self = Reflect.construct(Hash, [], $newTarget);
  $self.blockSize = (16 * 4);
  return $self;
}

class _MD5Sink extends HashSink {
  constructor(sink) {
    super(sink, 16, { endian: true });
    this.digest = new Uint32Array(4);
    this.digest[0] = 1732584193;
    this.digest[1] = 4023233417;
    this.digest[2] = 2562383102;
    this.digest[3] = 271733878;
  }
  updateHash(chunk) {
    chunk[15];
    let d = this.digest[3];
    let c = this.digest[2];
    let b = this.digest[1];
    let a = this.digest[0];
    let e = 0;
    let f = 0;
    function round(i) {
      let temp = d;
      d = c;
      c = b;
      b = add32(b, rotl32(add32(add32(a, e), add32(__dartConst("[\"list\",\"InterfaceType(int)\",[\"int\",\"3614090360\"],[\"int\",\"3905402710\"],[\"int\",\"606105819\"],[\"int\",\"3250441966\"],[\"int\",\"4118548399\"],[\"int\",\"1200080426\"],[\"int\",\"2821735955\"],[\"int\",\"4249261313\"],[\"int\",\"1770035416\"],[\"int\",\"2336552879\"],[\"int\",\"4294925233\"],[\"int\",\"2304563134\"],[\"int\",\"1804603682\"],[\"int\",\"4254626195\"],[\"int\",\"2792965006\"],[\"int\",\"1236535329\"],[\"int\",\"4129170786\"],[\"int\",\"3225465664\"],[\"int\",\"643717713\"],[\"int\",\"3921069994\"],[\"int\",\"3593408605\"],[\"int\",\"38016083\"],[\"int\",\"3634488961\"],[\"int\",\"3889429448\"],[\"int\",\"568446438\"],[\"int\",\"3275163606\"],[\"int\",\"4107603335\"],[\"int\",\"1163531501\"],[\"int\",\"2850285829\"],[\"int\",\"4243563512\"],[\"int\",\"1735328473\"],[\"int\",\"2368359562\"],[\"int\",\"4294588738\"],[\"int\",\"2272392833\"],[\"int\",\"1839030562\"],[\"int\",\"4259657740\"],[\"int\",\"2763975236\"],[\"int\",\"1272893353\"],[\"int\",\"4139469664\"],[\"int\",\"3200236656\"],[\"int\",\"681279174\"],[\"int\",\"3936430074\"],[\"int\",\"3572445317\"],[\"int\",\"76029189\"],[\"int\",\"3654602809\"],[\"int\",\"3873151461\"],[\"int\",\"530742520\"],[\"int\",\"3299628645\"],[\"int\",\"4096336452\"],[\"int\",\"1126891415\"],[\"int\",\"2878612391\"],[\"int\",\"4237533241\"],[\"int\",\"1700485571\"],[\"int\",\"2399980690\"],[\"int\",\"4293915773\"],[\"int\",\"2240044497\"],[\"int\",\"1873313359\"],[\"int\",\"4264355552\"],[\"int\",\"2734768916\"],[\"int\",\"1309151649\"],[\"int\",\"4149444226\"],[\"int\",\"3174756917\"],[\"int\",\"718787259\"],[\"int\",\"3951481745\"]]", () => Object.freeze([3614090360, 3905402710, 606105819, 3250441966, 4118548399, 1200080426, 2821735955, 4249261313, 1770035416, 2336552879, 4294925233, 2304563134, 1804603682, 4254626195, 2792965006, 1236535329, 4129170786, 3225465664, 643717713, 3921069994, 3593408605, 38016083, 3634488961, 3889429448, 568446438, 3275163606, 4107603335, 1163531501, 2850285829, 4243563512, 1735328473, 2368359562, 4294588738, 2272392833, 1839030562, 4259657740, 2763975236, 1272893353, 4139469664, 3200236656, 681279174, 3936430074, 3572445317, 76029189, 3654602809, 3873151461, 530742520, 3299628645, 4096336452, 1126891415, 2878612391, 4237533241, 1700485571, 2399980690, 4293915773, 2240044497, 1873313359, 4264355552, 2734768916, 1309151649, 4149444226, 3174756917, 718787259, 3951481745]))[i], chunk[f])), __dartConst("[\"list\",\"InterfaceType(int)\",[\"int\",\"7\"],[\"int\",\"12\"],[\"int\",\"17\"],[\"int\",\"22\"],[\"int\",\"7\"],[\"int\",\"12\"],[\"int\",\"17\"],[\"int\",\"22\"],[\"int\",\"7\"],[\"int\",\"12\"],[\"int\",\"17\"],[\"int\",\"22\"],[\"int\",\"7\"],[\"int\",\"12\"],[\"int\",\"17\"],[\"int\",\"22\"],[\"int\",\"5\"],[\"int\",\"9\"],[\"int\",\"14\"],[\"int\",\"20\"],[\"int\",\"5\"],[\"int\",\"9\"],[\"int\",\"14\"],[\"int\",\"20\"],[\"int\",\"5\"],[\"int\",\"9\"],[\"int\",\"14\"],[\"int\",\"20\"],[\"int\",\"5\"],[\"int\",\"9\"],[\"int\",\"14\"],[\"int\",\"20\"],[\"int\",\"4\"],[\"int\",\"11\"],[\"int\",\"16\"],[\"int\",\"23\"],[\"int\",\"4\"],[\"int\",\"11\"],[\"int\",\"16\"],[\"int\",\"23\"],[\"int\",\"4\"],[\"int\",\"11\"],[\"int\",\"16\"],[\"int\",\"23\"],[\"int\",\"4\"],[\"int\",\"11\"],[\"int\",\"16\"],[\"int\",\"23\"],[\"int\",\"6\"],[\"int\",\"10\"],[\"int\",\"15\"],[\"int\",\"21\"],[\"int\",\"6\"],[\"int\",\"10\"],[\"int\",\"15\"],[\"int\",\"21\"],[\"int\",\"6\"],[\"int\",\"10\"],[\"int\",\"15\"],[\"int\",\"21\"],[\"int\",\"6\"],[\"int\",\"10\"],[\"int\",\"15\"],[\"int\",\"21\"]]", () => Object.freeze([7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]))[i]));
      a = temp;
    }
    for (let i = 0; (i < 16); i = (i + 1)) {
      {
        e = ((b & c) | (((~b) >>> 0) & d));
        f = i;
        round(i);
      }
    }
    for (let i_1 = 16; (i_1 < 32); i_1 = (i_1 + 1)) {
      {
        e = ((d & b) | (((~d) >>> 0) & c));
        f = (((5 * i_1) + 1) % 16);
        round(i_1);
      }
    }
    for (let i_2 = 32; (i_2 < 48); i_2 = (i_2 + 1)) {
      {
        e = ((b ^ c) ^ d);
        f = (((3 * i_2) + 5) % 16);
        round(i_2);
      }
    }
    for (let i_3 = 48; (i_3 < 64); i_3 = (i_3 + 1)) {
      {
        e = (c ^ (b | ((~d) >>> 0)));
        f = ((7 * i_3) % 16);
        round(i_3);
      }
    }
    this.digest[0] = add32(a, this.digest[0]);
    this.digest[1] = add32(b, this.digest[1]);
    this.digest[2] = add32(c, this.digest[2]);
    this.digest[3] = add32(d, this.digest[3]);
  }
}

class _Sha1 extends Hash {
  constructor() {
    throw new TypeError("Class _Sha1 has no unnamed constructor");
  }
  static _() {
    return $_Sha1__(_Sha1);
  }
  startChunkedConversion(sink) {
    return __dartByteConversionSinkFrom(new _Sha1Sink(sink));
  }
}

function $_Sha1__($newTarget) {
  const $self = Reflect.construct(Hash, [], $newTarget);
  $self.blockSize = (16 * 4);
  return $self;
}

class _Sha1Sink extends HashSink {
  constructor(sink) {
    super(sink, 16);
    this.digest = new Uint32Array(5);
    this._extended = new Uint32Array(80);
    this.digest[0] = 1732584193;
    this.digest[1] = 4023233417;
    this.digest[2] = 2562383102;
    this.digest[3] = 271733878;
    this.digest[4] = 3285377520;
  }
  updateHash(chunk) {
    let a = this.digest[0];
    let b = this.digest[1];
    let c = this.digest[2];
    let d = this.digest[3];
    let e = this.digest[4];
    for (let i = 0; (i < 80); i = (i + 1)) {
      {
        if ((i < 16)) {
          {
            this._extended[i] = chunk[i];
          }
        } else {
          {
            this._extended[i] = rotl32((((this._extended[(i - 3)] ^ this._extended[(i - 8)]) ^ this._extended[(i - 14)]) ^ this._extended[(i - 16)]), 1);
          }
        }
        let newA = add32(add32(rotl32(a, 5), e), this._extended[i]);
        if ((i < 20)) {
          {
            newA = add32(add32(newA, ((b & c) | ((~b) & d))), 1518500249);
          }
        } else {
          if ((i < 40)) {
            {
              newA = add32(add32(newA, ((b ^ c) ^ d)), 1859775393);
            }
          } else {
            if ((i < 60)) {
              {
                newA = add32(add32(newA, (((b & c) | (b & d)) | (c & d))), 2400959708);
              }
            } else {
              {
                newA = add32(add32(newA, ((b ^ c) ^ d)), 3395469782);
              }
            }
          }
        }
        e = d;
        d = c;
        c = rotl32(b, 30);
        b = a;
        a = (newA >>> 0);
      }
    }
    this.digest[0] = add32(a, this.digest[0]);
    this.digest[1] = add32(b, this.digest[1]);
    this.digest[2] = add32(c, this.digest[2]);
    this.digest[3] = add32(d, this.digest[3]);
    this.digest[4] = add32(e, this.digest[4]);
  }
}

class _Sha256 extends Hash {
  constructor() {
    throw new TypeError("Class _Sha256 has no unnamed constructor");
  }
  static _() {
    return $_Sha256__(_Sha256);
  }
  startChunkedConversion(sink) {
    return __dartByteConversionSinkFrom(new _Sha256Sink(sink));
  }
}

function $_Sha256__($newTarget) {
  const $self = Reflect.construct(Hash, [], $newTarget);
  $self.blockSize = (16 * 4);
  return $self;
}

class _Sha224 extends Hash {
  constructor() {
    throw new TypeError("Class _Sha224 has no unnamed constructor");
  }
  static _() {
    return $_Sha224__(_Sha224);
  }
  startChunkedConversion(sink) {
    return __dartByteConversionSinkFrom(new _Sha224Sink(sink));
  }
}

function $_Sha224__($newTarget) {
  const $self = Reflect.construct(Hash, [], $newTarget);
  $self.blockSize = (16 * 4);
  return $self;
}

class _Sha32BitSink extends HashSink {
  constructor(sink, _digest) {
    super(sink, 16);
    this._extended = new Uint32Array(64);
    this._digest = _digest;
  }
  _rotr32(n, x) {
    return (__dartShr(x, n) | ((x << (32 - n)) >>> 0));
  }
  _ch(x, y, z) {
    return ((x & y) ^ (((~x) >>> 0) & z));
  }
  _maj(x, y, z) {
    return (((x & y) ^ (x & z)) ^ (y & z));
  }
  _bsig0(x) {
    return ((this._rotr32(2, x) ^ this._rotr32(13, x)) ^ this._rotr32(22, x));
  }
  _bsig1(x) {
    return ((this._rotr32(6, x) ^ this._rotr32(11, x)) ^ this._rotr32(25, x));
  }
  _ssig0(x) {
    return ((this._rotr32(7, x) ^ this._rotr32(18, x)) ^ __dartShr(x, 3));
  }
  _ssig1(x) {
    return ((this._rotr32(17, x) ^ this._rotr32(19, x)) ^ __dartShr(x, 10));
  }
  updateHash(chunk) {
    for (let i = 0; (i < 16); i = (i + 1)) {
      {
        this._extended[i] = chunk[i];
      }
    }
    for (let i_1 = 16; (i_1 < 64); i_1 = (i_1 + 1)) {
      {
        this._extended[i_1] = add32(add32(this._ssig1(this._extended[(i_1 - 2)]), this._extended[(i_1 - 7)]), add32(this._ssig0(this._extended[(i_1 - 15)]), this._extended[(i_1 - 16)]));
      }
    }
    let a = this._digest[0];
    let b = this._digest[1];
    let c = this._digest[2];
    let d = this._digest[3];
    let e = this._digest[4];
    let f = this._digest[5];
    let g = this._digest[6];
    let h = this._digest[7];
    for (let i_2 = 0; (i_2 < 64); i_2 = (i_2 + 1)) {
      {
        let temp1 = add32(add32(h, this._bsig1(e)), add32(this._ch(e, f, g), add32(__dartConst("[\"list\",\"InterfaceType(int)\",[\"int\",\"1116352408\"],[\"int\",\"1899447441\"],[\"int\",\"3049323471\"],[\"int\",\"3921009573\"],[\"int\",\"961987163\"],[\"int\",\"1508970993\"],[\"int\",\"2453635748\"],[\"int\",\"2870763221\"],[\"int\",\"3624381080\"],[\"int\",\"310598401\"],[\"int\",\"607225278\"],[\"int\",\"1426881987\"],[\"int\",\"1925078388\"],[\"int\",\"2162078206\"],[\"int\",\"2614888103\"],[\"int\",\"3248222580\"],[\"int\",\"3835390401\"],[\"int\",\"4022224774\"],[\"int\",\"264347078\"],[\"int\",\"604807628\"],[\"int\",\"770255983\"],[\"int\",\"1249150122\"],[\"int\",\"1555081692\"],[\"int\",\"1996064986\"],[\"int\",\"2554220882\"],[\"int\",\"2821834349\"],[\"int\",\"2952996808\"],[\"int\",\"3210313671\"],[\"int\",\"3336571891\"],[\"int\",\"3584528711\"],[\"int\",\"113926993\"],[\"int\",\"338241895\"],[\"int\",\"666307205\"],[\"int\",\"773529912\"],[\"int\",\"1294757372\"],[\"int\",\"1396182291\"],[\"int\",\"1695183700\"],[\"int\",\"1986661051\"],[\"int\",\"2177026350\"],[\"int\",\"2456956037\"],[\"int\",\"2730485921\"],[\"int\",\"2820302411\"],[\"int\",\"3259730800\"],[\"int\",\"3345764771\"],[\"int\",\"3516065817\"],[\"int\",\"3600352804\"],[\"int\",\"4094571909\"],[\"int\",\"275423344\"],[\"int\",\"430227734\"],[\"int\",\"506948616\"],[\"int\",\"659060556\"],[\"int\",\"883997877\"],[\"int\",\"958139571\"],[\"int\",\"1322822218\"],[\"int\",\"1537002063\"],[\"int\",\"1747873779\"],[\"int\",\"1955562222\"],[\"int\",\"2024104815\"],[\"int\",\"2227730452\"],[\"int\",\"2361852424\"],[\"int\",\"2428436474\"],[\"int\",\"2756734187\"],[\"int\",\"3204031479\"],[\"int\",\"3329325298\"]]", () => Object.freeze([1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298]))[i_2], this._extended[i_2])));
        let temp2 = add32(this._bsig0(a), this._maj(a, b, c));
        h = g;
        g = f;
        f = e;
        e = add32(d, temp1);
        d = c;
        c = b;
        b = a;
        a = add32(temp1, temp2);
      }
    }
    this._digest[0] = add32(a, this._digest[0]);
    this._digest[1] = add32(b, this._digest[1]);
    this._digest[2] = add32(c, this._digest[2]);
    this._digest[3] = add32(d, this._digest[3]);
    this._digest[4] = add32(e, this._digest[4]);
    this._digest[5] = add32(f, this._digest[5]);
    this._digest[6] = add32(g, this._digest[6]);
    this._digest[7] = add32(h, this._digest[7]);
  }
}

class _Sha256Sink extends _Sha32BitSink {
  constructor(sink) {
    super(sink, Uint32Array.from([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]));
  }
  get digest() {
    return this._digest;
  }
}

class _Sha224Sink extends _Sha32BitSink {
  constructor(sink) {
    super(sink, Uint32Array.from([3238371032, 914150663, 812702999, 4144912697, 4290775857, 1750603025, 1694076839, 3204075428]));
  }
  get digest() {
    return new Uint32Array(this._digest.buffer, 0, 7);
  }
}

class _Sha64BitSink extends HashSink {
  constructor(sink, _digest) {
    super(sink, 32, { signatureBytes: 16 });
    this._extended = new BigUint64Array(80);
    this._digest = _digest;
  }
  get digestBytes() {
    throw new TypeError("Abstract member _Sha64BitSink.digestBytes");
  }
  set digestBytes(value) {
    Object.defineProperty(this, "digestBytes", { value, writable: true, configurable: true, enumerable: true });
  }
  get digest() {
    let unordered = new Uint32Array(this._digest.buffer);
    let ordered = new Uint32Array(this.digestBytes);
    for (let i = 0; (i < this.digestBytes); i = (i + 1)) {
      {
        ordered[i] = unordered[(i + ((Math.trunc(i) % 2 === 0) ? 1 : (-1)))];
      }
    }
    return ordered;
  }
  static _rotr64(n, x) {
    return (_Sha64BitSink._shr64(n, x) | (x << (64 - n)));
  }
  static _shr64(n, x) {
    return (__dartShr(x, n) & (~((-1) << (64 - n))));
  }
  static _ch(x, y, z) {
    return ((x & y) ^ ((~x) & z));
  }
  static _maj(x, y, z) {
    return (((x & y) ^ (x & z)) ^ (y & z));
  }
  static _bsig0(x) {
    return ((_Sha64BitSink._rotr64(28, x) ^ _Sha64BitSink._rotr64(34, x)) ^ _Sha64BitSink._rotr64(39, x));
  }
  static _bsig1(x) {
    return ((_Sha64BitSink._rotr64(14, x) ^ _Sha64BitSink._rotr64(18, x)) ^ _Sha64BitSink._rotr64(41, x));
  }
  static _ssig0(x) {
    return ((_Sha64BitSink._rotr64(1, x) ^ _Sha64BitSink._rotr64(8, x)) ^ _Sha64BitSink._shr64(7, x));
  }
  static _ssig1(x) {
    return ((_Sha64BitSink._rotr64(19, x) ^ _Sha64BitSink._rotr64(61, x)) ^ _Sha64BitSink._shr64(6, x));
  }
  updateHash(chunk) {
    for (let i = 0, x = 0; (i < 32); i = (i + 2), x = (x + 1)) {
      {
        this._extended[x] = ((chunk[i] << 32) | chunk[(i + 1)]);
      }
    }
    for (let t = 16; (t < 80); t = (t + 1)) {
      {
        this._extended[t] = (((_Sha64BitSink._ssig1(this._extended[(t - 2)]) + this._extended[(t - 7)]) + _Sha64BitSink._ssig0(this._extended[(t - 15)])) + this._extended[(t - 16)]);
      }
    }
    let a = this._digest[0];
    let b = this._digest[1];
    let c = this._digest[2];
    let d = this._digest[3];
    let e = this._digest[4];
    let f = this._digest[5];
    let g = this._digest[6];
    let h = this._digest[7];
    for (let i_1 = 0; (i_1 < 80); i_1 = (i_1 + 1)) {
      {
        let temp1 = ((((h + _Sha64BitSink._bsig1(e)) + _Sha64BitSink._ch(e, f, g)) + _noise64[i_1]) + this._extended[i_1]);
        let temp2 = (_Sha64BitSink._bsig0(a) + _Sha64BitSink._maj(a, b, c));
        h = g;
        g = f;
        f = e;
        e = (d + temp1);
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2);
      }
    }
    (() => { let v = this._digest; return (() => { let v_1 = 0; return v[v_1] = (v[v_1] + a); })(); })();
    (() => { let v_2 = this._digest; return (() => { let v_3 = 1; return v_2[v_3] = (v_2[v_3] + b); })(); })();
    (() => { let v_4 = this._digest; return (() => { let v_5 = 2; return v_4[v_5] = (v_4[v_5] + c); })(); })();
    (() => { let v_6 = this._digest; return (() => { let v_7 = 3; return v_6[v_7] = (v_6[v_7] + d); })(); })();
    (() => { let v_8 = this._digest; return (() => { let v_9 = 4; return v_8[v_9] = (v_8[v_9] + e); })(); })();
    (() => { let v_10 = this._digest; return (() => { let v_11 = 5; return v_10[v_11] = (v_10[v_11] + f); })(); })();
    (() => { let v_12 = this._digest; return (() => { let v_13 = 6; return v_12[v_13] = (v_12[v_13] + g); })(); })();
    (() => { let v_14 = this._digest; return (() => { let v_15 = 7; return v_14[v_15] = (v_14[v_15] + h); })(); })();
  }
}

class Sha384Sink extends _Sha64BitSink {
  constructor(sink) {
    super(sink, BigUint64Array.from([-3766243637369397544, 7105036623409894663, -7973340178411365097, 1526699215303891257, 7436329637833083697, -8163818279084223215, -2662702644619276377, 5167115440072839076], (value) => BigInt(value)));
    this.digestBytes = 12;
  }
}

class Sha512Sink extends _Sha64BitSink {
  constructor(sink) {
    super(sink, BigUint64Array.from([7640891576956012808, -4942790177534073029, 4354685564936845355, -6534734903238641935, 5840696475078001361, -7276294671716946913, 2270897969802886507, 6620516959819538809], (value) => BigInt(value)));
    this.digestBytes = 16;
  }
}

class Sha512224Sink extends _Sha64BitSink {
  constructor(sink) {
    super(sink, BigUint64Array.from([-8341449602262348382, 8350123849800275158, 2160240930085379202, 7466358040605728719, 1111592415079452072, 8638871050018654530, 4583966954114332360, 1230299281376055969], (value) => BigInt(value)));
    this.digestBytes = 7;
  }
}

class Sha512256Sink extends _Sha64BitSink {
  constructor(sink) {
    super(sink, BigUint64Array.from([2463787394917988140, -6965556091613846334, 2563595384472711505, -7622211418569250115, -7626776825740460061, -4729309413028513390, 3098927326965381290, 1060366662362279074], (value) => BigInt(value)));
    this.digestBytes = 8;
  }
}

class _Sha384 extends Hash {
  constructor() {
    throw new TypeError("Class _Sha384 has no unnamed constructor");
  }
  static _() {
    return $_Sha384__(_Sha384);
  }
  startChunkedConversion(sink) {
    return __dartByteConversionSinkFrom(new Sha384Sink(sink));
  }
}

function $_Sha384__($newTarget) {
  const $self = Reflect.construct(Hash, [], $newTarget);
  $self.blockSize = (32 * 4);
  return $self;
}

class _Sha512 extends Hash {
  constructor() {
    throw new TypeError("Class _Sha512 has no unnamed constructor");
  }
  static _() {
    return $_Sha512__(_Sha512);
  }
  startChunkedConversion(sink) {
    return __dartByteConversionSinkFrom(new Sha512Sink(sink));
  }
}

function $_Sha512__($newTarget) {
  const $self = Reflect.construct(Hash, [], $newTarget);
  $self.blockSize = (32 * 4);
  return $self;
}

class _Sha512224 extends Hash {
  constructor() {
    super();
    this.blockSize = (32 * 4);
  }
  startChunkedConversion(sink) {
    return __dartByteConversionSinkFrom(new Sha512224Sink(sink));
  }
}

class _Sha512256 extends Hash {
  constructor() {
    super();
    this.blockSize = (32 * 4);
  }
  startChunkedConversion(sink) {
    return __dartByteConversionSinkFrom(new Sha512256Sink(sink));
  }
}

class _DigestSink {
  constructor() {
    this.value = null;
  }
  add(data) {
    this.value = data;
  }
  close() {
  }
}


Object.defineProperty(HashSink, "_maxMessageLengthInBytes", { value: 1125899906842623, enumerable: true });
function _hexEncode(bytes) {
  const hexDigits = "0123456789abcdef";
  let charCodes = new Uint8Array((bytes.length * 2));
  for (let i = 0, j = 0; (i < bytes.length); i = (i + 1)) {
    {
      let byte = bytes[i];
      charCodes[(() => { let v = j; return (() => { let v_1 = j = (v + 1); return v; })(); })()] = "0123456789abcdef".charCodeAt((__dartShr(byte, 4) & 15));
      charCodes[(() => { let v_2 = j; return (() => { let v_3 = j = (v_2 + 1); return v_2; })(); })()] = "0123456789abcdef".charCodeAt((byte & 15));
    }
  }
  return String.fromCodePoint(...Array.from(charCodes));
}

const mask32 = 4294967295;

const bitsPerByte = 8;

const bytesPerWord = 4;

function add32(x, y) {
  return ((x + y) >>> 0);
}

function rotl32(val, shift) {
  let modShift = (shift & 31);
  return (((val << modShift) >>> 0) | __dartShr((val >>> 0), (32 - modShift)));
}

const md5 = __dartConst("[\"instance\",\"class:_MD5\",[\"field\",\"field:_MD5.blockSize\",[\"int\",\"64\"]]]", () => Object.freeze(Object.assign(Object.create(_MD5.prototype), { blockSize: 64 })));

const _noise = __dartConst("[\"list\",\"InterfaceType(int)\",[\"int\",\"3614090360\"],[\"int\",\"3905402710\"],[\"int\",\"606105819\"],[\"int\",\"3250441966\"],[\"int\",\"4118548399\"],[\"int\",\"1200080426\"],[\"int\",\"2821735955\"],[\"int\",\"4249261313\"],[\"int\",\"1770035416\"],[\"int\",\"2336552879\"],[\"int\",\"4294925233\"],[\"int\",\"2304563134\"],[\"int\",\"1804603682\"],[\"int\",\"4254626195\"],[\"int\",\"2792965006\"],[\"int\",\"1236535329\"],[\"int\",\"4129170786\"],[\"int\",\"3225465664\"],[\"int\",\"643717713\"],[\"int\",\"3921069994\"],[\"int\",\"3593408605\"],[\"int\",\"38016083\"],[\"int\",\"3634488961\"],[\"int\",\"3889429448\"],[\"int\",\"568446438\"],[\"int\",\"3275163606\"],[\"int\",\"4107603335\"],[\"int\",\"1163531501\"],[\"int\",\"2850285829\"],[\"int\",\"4243563512\"],[\"int\",\"1735328473\"],[\"int\",\"2368359562\"],[\"int\",\"4294588738\"],[\"int\",\"2272392833\"],[\"int\",\"1839030562\"],[\"int\",\"4259657740\"],[\"int\",\"2763975236\"],[\"int\",\"1272893353\"],[\"int\",\"4139469664\"],[\"int\",\"3200236656\"],[\"int\",\"681279174\"],[\"int\",\"3936430074\"],[\"int\",\"3572445317\"],[\"int\",\"76029189\"],[\"int\",\"3654602809\"],[\"int\",\"3873151461\"],[\"int\",\"530742520\"],[\"int\",\"3299628645\"],[\"int\",\"4096336452\"],[\"int\",\"1126891415\"],[\"int\",\"2878612391\"],[\"int\",\"4237533241\"],[\"int\",\"1700485571\"],[\"int\",\"2399980690\"],[\"int\",\"4293915773\"],[\"int\",\"2240044497\"],[\"int\",\"1873313359\"],[\"int\",\"4264355552\"],[\"int\",\"2734768916\"],[\"int\",\"1309151649\"],[\"int\",\"4149444226\"],[\"int\",\"3174756917\"],[\"int\",\"718787259\"],[\"int\",\"3951481745\"]]", () => Object.freeze([3614090360, 3905402710, 606105819, 3250441966, 4118548399, 1200080426, 2821735955, 4249261313, 1770035416, 2336552879, 4294925233, 2304563134, 1804603682, 4254626195, 2792965006, 1236535329, 4129170786, 3225465664, 643717713, 3921069994, 3593408605, 38016083, 3634488961, 3889429448, 568446438, 3275163606, 4107603335, 1163531501, 2850285829, 4243563512, 1735328473, 2368359562, 4294588738, 2272392833, 1839030562, 4259657740, 2763975236, 1272893353, 4139469664, 3200236656, 681279174, 3936430074, 3572445317, 76029189, 3654602809, 3873151461, 530742520, 3299628645, 4096336452, 1126891415, 2878612391, 4237533241, 1700485571, 2399980690, 4293915773, 2240044497, 1873313359, 4264355552, 2734768916, 1309151649, 4149444226, 3174756917, 718787259, 3951481745]));

const _shiftAmounts = __dartConst("[\"list\",\"InterfaceType(int)\",[\"int\",\"7\"],[\"int\",\"12\"],[\"int\",\"17\"],[\"int\",\"22\"],[\"int\",\"7\"],[\"int\",\"12\"],[\"int\",\"17\"],[\"int\",\"22\"],[\"int\",\"7\"],[\"int\",\"12\"],[\"int\",\"17\"],[\"int\",\"22\"],[\"int\",\"7\"],[\"int\",\"12\"],[\"int\",\"17\"],[\"int\",\"22\"],[\"int\",\"5\"],[\"int\",\"9\"],[\"int\",\"14\"],[\"int\",\"20\"],[\"int\",\"5\"],[\"int\",\"9\"],[\"int\",\"14\"],[\"int\",\"20\"],[\"int\",\"5\"],[\"int\",\"9\"],[\"int\",\"14\"],[\"int\",\"20\"],[\"int\",\"5\"],[\"int\",\"9\"],[\"int\",\"14\"],[\"int\",\"20\"],[\"int\",\"4\"],[\"int\",\"11\"],[\"int\",\"16\"],[\"int\",\"23\"],[\"int\",\"4\"],[\"int\",\"11\"],[\"int\",\"16\"],[\"int\",\"23\"],[\"int\",\"4\"],[\"int\",\"11\"],[\"int\",\"16\"],[\"int\",\"23\"],[\"int\",\"4\"],[\"int\",\"11\"],[\"int\",\"16\"],[\"int\",\"23\"],[\"int\",\"6\"],[\"int\",\"10\"],[\"int\",\"15\"],[\"int\",\"21\"],[\"int\",\"6\"],[\"int\",\"10\"],[\"int\",\"15\"],[\"int\",\"21\"],[\"int\",\"6\"],[\"int\",\"10\"],[\"int\",\"15\"],[\"int\",\"21\"],[\"int\",\"6\"],[\"int\",\"10\"],[\"int\",\"15\"],[\"int\",\"21\"]]", () => Object.freeze([7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]));

const sha1 = __dartConst("[\"instance\",\"class:_Sha1\",[\"field\",\"field:_Sha1.blockSize\",[\"int\",\"64\"]]]", () => Object.freeze(Object.assign(Object.create(_Sha1.prototype), { blockSize: 64 })));

const sha256 = __dartConst("[\"instance\",\"class:_Sha256\",[\"field\",\"field:_Sha256.blockSize\",[\"int\",\"64\"]]]", () => Object.freeze(Object.assign(Object.create(_Sha256.prototype), { blockSize: 64 })));

const sha224 = __dartConst("[\"instance\",\"class:_Sha224\",[\"field\",\"field:_Sha224.blockSize\",[\"int\",\"64\"]]]", () => Object.freeze(Object.assign(Object.create(_Sha224.prototype), { blockSize: 64 })));

const _noise_1 = __dartConst("[\"list\",\"InterfaceType(int)\",[\"int\",\"1116352408\"],[\"int\",\"1899447441\"],[\"int\",\"3049323471\"],[\"int\",\"3921009573\"],[\"int\",\"961987163\"],[\"int\",\"1508970993\"],[\"int\",\"2453635748\"],[\"int\",\"2870763221\"],[\"int\",\"3624381080\"],[\"int\",\"310598401\"],[\"int\",\"607225278\"],[\"int\",\"1426881987\"],[\"int\",\"1925078388\"],[\"int\",\"2162078206\"],[\"int\",\"2614888103\"],[\"int\",\"3248222580\"],[\"int\",\"3835390401\"],[\"int\",\"4022224774\"],[\"int\",\"264347078\"],[\"int\",\"604807628\"],[\"int\",\"770255983\"],[\"int\",\"1249150122\"],[\"int\",\"1555081692\"],[\"int\",\"1996064986\"],[\"int\",\"2554220882\"],[\"int\",\"2821834349\"],[\"int\",\"2952996808\"],[\"int\",\"3210313671\"],[\"int\",\"3336571891\"],[\"int\",\"3584528711\"],[\"int\",\"113926993\"],[\"int\",\"338241895\"],[\"int\",\"666307205\"],[\"int\",\"773529912\"],[\"int\",\"1294757372\"],[\"int\",\"1396182291\"],[\"int\",\"1695183700\"],[\"int\",\"1986661051\"],[\"int\",\"2177026350\"],[\"int\",\"2456956037\"],[\"int\",\"2730485921\"],[\"int\",\"2820302411\"],[\"int\",\"3259730800\"],[\"int\",\"3345764771\"],[\"int\",\"3516065817\"],[\"int\",\"3600352804\"],[\"int\",\"4094571909\"],[\"int\",\"275423344\"],[\"int\",\"430227734\"],[\"int\",\"506948616\"],[\"int\",\"659060556\"],[\"int\",\"883997877\"],[\"int\",\"958139571\"],[\"int\",\"1322822218\"],[\"int\",\"1537002063\"],[\"int\",\"1747873779\"],[\"int\",\"1955562222\"],[\"int\",\"2024104815\"],[\"int\",\"2227730452\"],[\"int\",\"2361852424\"],[\"int\",\"2428436474\"],[\"int\",\"2756734187\"],[\"int\",\"3204031479\"],[\"int\",\"3329325298\"]]", () => Object.freeze([1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298]));

const _noise64 = BigUint64Array.from([4794697086780616226n, 8158064640168781261n, (-5349999486874862801n), (-1606136188198331460n), 4131703408338449720n, 6480981068601479193n, (-7908458776815382629n), (-6116909921290321640n), (-2880145864133508542n), 1334009975649890238n, 2608012711638119052n, 6128411473006802146n, 8268148722764581231n, (-9160688886553864527n), (-7215885187991268811n), (-4495734319001033068n), (-1973867731355612462n), (-1171420211273849373n), 1135362057144423861n, 2597628984639134821n, 3308224258029322869n, 5365058923640841347n, 6679025012923562964n, 8573033837759648693n, (-7476448914759557205n), (-6327057829258317296n), (-5763719355590565569n), (-4658551843659510044n), (-4116276920077217854n), (-3051310485924567259n), 489312712824947311n, 1452737877330783856n, 2861767655752347644n, 3322285676063803686n, 5560940570517711597n, 5996557281743188959n, 7280758554555802590n, 8532644243296465576n, (-9096487096722542874n), (-7894198246740708037n), (-6719396339535248540n), (-6333637450476146687n), (-4446306890439682159n), (-4076793802049405392n), (-3345356375505022440n), (-2983346525034927856n), (-860691631967231958n), 1182934255886127544n, 1847814050463011016n, 2177327727835720531n, 2830643537854262169n, 3796741975233480872n, 4115178125766777443n, 5681478168544905931n, 6601373596472566643n, 7507060721942968483n, 8399075790359081724n, 8693463985226723168n, (-8878714635349349518n), (-8302665154208450068n), (-8016688836872298968n), (-6606660893046293015n), (-4685533653050689259n), (-4147400797238176981n), (-3880063495543823972n), (-3348786107499101689n), (-1523767162380948706n), (-757361751448694408n), 500013540394364858n, 748580250866718886n, 1242879168328830382n, 1977374033974150939n, 2944078676154940804n, 3659926193048069267n, 4368137639120453308n, 4836135668995329356n, 5532061633213252278n, 6448918945643986474n, 6902733635092675308n, 7801388544844847127n]);

const sha384 = __dartConst("[\"instance\",\"class:_Sha384\",[\"field\",\"field:_Sha384.blockSize\",[\"int\",\"128\"]]]", () => Object.freeze(Object.assign(Object.create(_Sha384.prototype), { blockSize: 128 })));

const sha512 = __dartConst("[\"instance\",\"class:_Sha512\",[\"field\",\"field:_Sha512.blockSize\",[\"int\",\"128\"]]]", () => Object.freeze(Object.assign(Object.create(_Sha512.prototype), { blockSize: 128 })));

const sha512224 = __dartConst("[\"instance\",\"class:_Sha512224\",[\"field\",\"field:_Sha512224.blockSize\",[\"int\",\"128\"]]]", () => Object.freeze(Object.assign(Object.create(_Sha512224.prototype), { blockSize: 128 })));

const sha512256 = __dartConst("[\"instance\",\"class:_Sha512256\",[\"field\",\"field:_Sha512256.blockSize\",[\"int\",\"128\"]]]", () => Object.freeze(Object.assign(Object.create(_Sha512256.prototype), { blockSize: 128 })));

export function main() {
  const data = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).encode("dart2esm");
  const sha1Digest = __dartConst("[\"instance\",\"class:_Sha1\",[\"field\",\"field:_Sha1.blockSize\",[\"int\",\"64\"]]]", () => Object.freeze(Object.assign(Object.create(_Sha1.prototype), { blockSize: 64 }))).convert(data);
  const sha256Digest = __dartConst("[\"instance\",\"class:_Sha256\",[\"field\",\"field:_Sha256.blockSize\",[\"int\",\"64\"]]]", () => Object.freeze(Object.assign(Object.create(_Sha256.prototype), { blockSize: 64 }))).convert(data);
  const hmacDigest = new Hmac(__dartConst("[\"instance\",\"class:_Sha256\",[\"field\",\"field:_Sha256.blockSize\",[\"int\",\"64\"]]]", () => Object.freeze(Object.assign(Object.create(_Sha256.prototype), { blockSize: 64 }))), __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).encode("key")).convert(data);
  const sink = new _DigestSink();
  const input = __dartConst("[\"instance\",\"class:_Sha256\",[\"field\",\"field:_Sha256.blockSize\",[\"int\",\"64\"]]]", () => Object.freeze(Object.assign(Object.create(_Sha256.prototype), { blockSize: 64 }))).startChunkedConversion(sink);
  input.add(__dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).encode("dart"));
  input.add(__dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)).encode("2esm"));
  input.close();
  __dartPrint("crypto " + __dartStr(__dartStr(sha1Digest).substring(0, 8)) + " " + __dartStr(sha256Digest.bytes.length) + " " + __dartStr(__dartStr(sha256Digest).substring(0, 12)) + " " + __dartStr(__dartStr(hmacDigest).substring(0, 12)) + " " + __dartStr((() => { const $left_1 = sink.value; const $right_1 = sha256Digest; return $left_1 === null ? $right_1 === null : $left_1["=="]($right_1); })()));
}

main();
