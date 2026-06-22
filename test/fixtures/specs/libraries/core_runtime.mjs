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
    writeCharCode(charCode) { value += String.fromCharCode(charCode); },
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
  __dartPrint("writeAll " + __dartStr(__dartIterableLast(__dartStr(buffer).split("\n"))));
  buffer.clear();
  __dartPrint("cleared " + __dartStr(buffer.isEmpty) + " " + __dartStr(__dartStr(buffer)));
  const expando = __dartExpando("count");
  const expandoKey = new PlainObject();
  expando.set(expandoKey, 7);
  __dartPrint("expando " + __dartStr(expando.get(expandoKey)) + " " + __dartStr(expando.get(new PlainObject())) + " " + __dartStr(hide(expando) != null && typeof hide(expando) === "object" && hide(expando).__dartType === "Expando") + " " + __dartStr(__dartStr(expando).includes("count")));
  const encoded = encodeURIComponent("a b/ç");
  __dartPrint("uri " + __dartStr(encoded) + " " + __dartStr(decodeURIComponent(encoded)));
  const full = encodeURI("https://example.test/a b?q=ç");
  __dartPrint("full " + __dartStr(decodeURI(full)));
  const plain = new PlainObject();
  const other = new PlainObject();
  const object = ({});
  const hash = __dartHashValue(plain);
  const stableHash = __dartEquals(hash, __dartHashValue(plain));
  __dartPrint("object " + __dartStr(typeof hash === "number") + " " + __dartStr(stableHash) + " " + __dartStr(Object.is(plain, plain)) + " " + __dartStr(Object.is(plain, other)));
  __dartPrint("runtime " + __dartStr(__dartRuntimeType(plain)) + " " + __dartStr(__dartRuntimeType(1)) + " " + __dartStr(__dartRuntimeType(1.5)));
  __dartPrint("objectString " + __dartStr(__dartObjectToString(plain).includes("PlainObject")) + " " + __dartStr(__dartObjectToString(object).includes("Object")));
}

main();
