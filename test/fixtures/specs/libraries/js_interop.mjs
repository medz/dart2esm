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
function __dartExtensionTypeRep(value, field) {
  if (value != null && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, field)) return value[field];
  return value;
}
function __dartJsNumberToDartInt(value) {
  if (Number.isInteger(value)) return value;
  throw new TypeError("JavaScript number is not a Dart int");
}
function __dartJsTrimOptionalArgs(args) {
  const values = Array.from(args);
  while (values.length > 0 && values[values.length - 1] == null) values.pop();
  return values;
}
function __dartJsCallMethodOptional(receiver, method, args) {
  return receiver[method](...__dartJsTrimOptionalArgs(args));
}
function __dartJsInstanceOfString(value, constructorName) {
  if (constructorName == null) return false;
  const text = String(constructorName);
  if (text.length === 0) return false;
  let constructor = globalThis;
  for (const part of text.split(".")) {
    constructor = constructor?.[part];
    if (constructor == null) return false;
  }
  return typeof constructor === "function" && value instanceof constructor;
}
function __dartJsConstructOptional(constructor, args) {
  return new constructor(...__dartJsTrimOptionalArgs(args));
}
const __dartJsExportedFunctionProperty = Symbol("dart2esm.jsExportedDartFunction");
function __dartJsExportFunction(fn) {
  Object.defineProperty(fn, __dartJsExportedFunctionProperty, { value: fn, configurable: true });
  return fn;
}
function __dartJsExportCaptureThis(fn) {
  const wrapper = function(...args) { return fn(this, ...args); };
  Object.defineProperty(wrapper, __dartJsExportedFunctionProperty, { value: fn, configurable: true });
  return wrapper;
}
function __dartJsExportedFunctionToDart(fn) {
  if (__dartIsJsExportedFunction(fn)) {
    return fn[__dartJsExportedFunctionProperty];
  }
  throw new TypeError("Expected a JS-exported Dart function");
}
function __dartIsJsExportedFunction(value) {
  return typeof value === "function" && Object.prototype.hasOwnProperty.call(value, __dartJsExportedFunctionProperty);
}
const __dartJsBoxedDartObjectProperty = Symbol("jsBoxedDartObjectProperty");
function __dartJsBox(value) {
  const box = {};
  box[__dartJsBoxedDartObjectProperty] = value;
  return box;
}
function __dartJsUnbox(value) {
  if (__dartIsJsBox(value)) {
    return value[__dartJsBoxedDartObjectProperty];
  }
  throw new TypeError("Expected a wrapped Dart object");
}
function __dartIsJsBox(value) {
  return value != null && (typeof value === "object" || typeof value === "function") && Object.prototype.hasOwnProperty.call(value, __dartJsBoxedDartObjectProperty);
}
function __dartJsIteratorFromDartIterator(iterator) {
  return {
    next() {
      return iterator.moveNext() ? { value: iterator.current, done: false } : { done: true };
    },
    [Symbol.iterator]() { return this; },
  };
}
function __dartJsIterableFromDartIterable(iterable) {
  return {
    [Symbol.iterator]() { return __dartJsIteratorFromDartIterator(__dartIterator(iterable)); },
  };
}
function __dartJsIteratorToDartIterator(iterator) {
  return {
    current: undefined,
    moveNext() {
      const next = iterator.next();
      if (next.done === true) {
        this.current = undefined;
        return false;
      }
      this.current = next.value;
      return true;
    },
  };
}
function __dartJsify(value) {
  if (value == null) return value;
  if (typeof value !== "object") return value;
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer || value instanceof Date) return value;
  if (value instanceof Map) {
    const object = {};
    for (const [key, entryValue] of value) object[key] = __dartJsify(entryValue);
    return object;
  }
  if (Array.isArray(value) || value instanceof Set || typeof value[Symbol.iterator] === "function") return Array.from(value, __dartJsify);
  return value;
}
function __dartJsDartify(value) {
  if (value == null) return null;
  if (typeof value !== "object") return value;
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer || value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(__dartJsDartify);
  if (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) {
    const map = new Map();
    for (const key of Object.keys(value)) map.set(key, __dartJsDartify(value[key]));
    return map;
  }
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
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
  if ((typeof left === "number" || left.__dartType === "double") && (typeof right === "number" || right.__dartType === "double")) return Number(left) === Number(right);
  const equals = left["=="];
  return typeof equals === "function" ? equals.call(left, right) : false;
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

export class JsExportedCounter {
  constructor(value) {
    this.value = value;
  }
  static __new_tearOff(value) {
    return new JsExportedCounter(value);
  }
  increment(amount) {
    this.value = (this.value + __dartJsNumberToDartInt(amount));
    return this.value;
  }
  get label() {
    return "counter:" + __dartStr(this.value);
  }
  set label(nextValue) {
    this.value = __dartIntParse(nextValue, null);
  }
}

export class JsDate {
  getUTCFullYear() {
    return new JSNumber(__dartExtensionTypeRep(JsDate_getUTCFullYear(__dartExtensionTypeRep(this, "_")), "_jsNumber"));
  }
  static _(__wc0_formal) {
    const self = Object.create(this.prototype);
    self._ = JsDate_constructor__(__wc0_formal);
    return self;
  }
  static ""(value) {
    return new JsDate(__dartExtensionTypeRep(JsDate_constructor_(value), "_"));
  }
}

function JsDate_get_getUTCFullYear(_this) {
  return function() { return _this["getUTCFullYear"](); };
}

function JsDate_constructor__(__wc0_formal) {
  const _this = __wc0_formal;
  return _this;
}

function JsDate_constructor_____tearOff(__wc0_formal) {
  return JsDate_constructor__(__wc0_formal);
}

function JsDate_constructor___new_tearOff(value) {
  return new globalThis["Date"](value);
}

export async function main() {
  let hiddenGlobal = globalThis["globalThis"];
  const math = globalThis["globalThis"]["Math"];
  let hiddenMath = math;
  const max = __dartNullCheck(math)["max"](3, 7, 5);
  (globalThis["globalThis"]["__dart2esmProbe"] = "ok");
  const probe = globalThis["globalThis"]["__dart2esmProbe"];
  const hasConsole = ("console" in globalThis["globalThis"]);
  __dartPrint("jsInterop " + __dartStr(__dartExtensionTypeRep(hiddenGlobal, "_jsObject") != null && (typeof __dartExtensionTypeRep(hiddenGlobal, "_jsObject") === "object" || typeof __dartExtensionTypeRep(hiddenGlobal, "_jsObject") === "function")) + " " + __dartStr(__dartExtensionTypeRep(hiddenMath, "_jsObject") != null && (typeof __dartExtensionTypeRep(hiddenMath, "_jsObject") === "object" || typeof __dartExtensionTypeRep(hiddenMath, "_jsObject") === "function")) + " " + __dartStr(max) + " " + __dartStr(probe) + " " + __dartStr(hasConsole));
  const jsString = "hello";
  const jsNumber = 42;
  const jsBool = true;
  const jsArray = ["x", 3];
  const obj = ({});
  (obj["answer"] = jsNumber);
  const got = __dartJsNumberToDartInt(obj["answer"]);
  const hasAnswer = ("answer" in obj);
  const deletedAnswer = (delete obj["answer"]);
  const modernMath = globalThis["Math"];
  const modernMax = __dartJsNumberToDartInt(__dartJsCallMethodOptional(modernMath, "max", [1, 9, 4]));
  const missingIsUndefined = globalThis["__dart2esmMissing"] === undefined;
  (obj["nothing"] = null);
  const nothingIsNull = obj["nothing"] === null;
  (obj["shortcut"] = "yes");
  const shortcut = __dartAs(obj["shortcut"], value => typeof __dartExtensionTypeRep(value, "_jsString") === "string", "JSString");
  const hasShortcut = ("shortcut" in obj);
  const dateConstructor = globalThis["Date"];
  const date = __dartJsConstructOptional(dateConstructor, [0]);
  const dateYear = __dartJsNumberToDartInt(__dartJsCallMethodOptional(date, "getUTCFullYear", []));
  const stringTypeof = typeof jsString === "string";
  const arrayInstanceOf = jsArray instanceof globalThis["Array"];
  const isArray = (!((jsArray === null)) && __dartJsInstanceOfString(jsArray, "Array"));
  const jsified = __dartAs(__dartJsify(new Map([["a", 1], ["nested", [2]]])), value => __dartExtensionTypeRep(value, "_jsObject") != null && (typeof __dartExtensionTypeRep(value, "_jsObject") === "object" || typeof __dartExtensionTypeRep(value, "_jsObject") === "function"), "JSObject");
  const dartified = __dartAs(__dartJsDartify(jsified), value => value instanceof Map, "Map<Object?, Object?>");
  __dartPrint("jsInteropModern " + __dartStr(jsString) + " " + __dartStr(jsBool) + " " + __dartStr(jsArray.length) + " " + __dartStr(got) + " " + __dartStr(hasAnswer) + " " + __dartStr(deletedAnswer) + " " + __dartStr(modernMax) + " " + __dartStr(missingIsUndefined) + " " + __dartStr(nothingIsNull) + " " + __dartStr(stringTypeof) + " " + __dartStr(arrayInstanceOf) + " " + __dartStr(isArray) + " " + __dartStr(__dartMapGet(dartified, "a")) + " " + __dartStr(shortcut) + " " + __dartStr(hasShortcut) + " " + __dartStr(dateYear));
  const utilObject = ({});
  (utilObject["x"] = 3);
  const utilAdd = ("a" + 2);
  const utilMath = __dartIterableJoin([(9 - 4), (3 * 4), (9 / 2), (2 ** 3), (9 % 4)], ",");
  const utilCompare = __dartIterableJoin([(1 == "1"), (1 === "1"), (1 != 2), (1 !== "1"), (3 > 2), (3 >= 3), (2 < 3), (3 <= 3)], ",");
  const utilTypeof = typeof "x" === "string";
  const utilTruthy = (((!!1) && !((!!0))) && (!0));
  const utilOr = (0 || "fallback");
  const utilAnd = (1 && "ok");
  const utilShift = ((-1) >>> 1);
  const utilProtoSame = (Object.getPrototypeOf(utilObject) === Object.prototype);
  const utilKeys = __dartIterableJoin(Object.keys(utilObject), ",");
  const utilArrayObject = __dartJsify([1, 2]);
  const utilArray = Array.isArray(utilArrayObject);
  const utilSimple = (utilObject != null && typeof utilObject === "object" && (Object.getPrototypeOf(utilObject) === Object.prototype || Object.getPrototypeOf(utilObject) === null));
  const utilDartified = __dartAs(__dartJsDartify(__dartJsify(new Map([["k", [1]]]))), value => value instanceof Map, "Map<Object?, Object?>");
  const utilDeleted = (delete utilObject["x"]);
  const utilHasAfterDelete = ("x" in utilObject);
  const utilArrayConstructor = globalThis["Array"];
  const utilInstance = utilArrayObject instanceof utilArrayConstructor;
  const utilInstanceString = __dartJsInstanceOfString(utilArrayObject, "Array");
  __dartPrint("jsUtil " + __dartStr(utilAdd) + " " + __dartStr(utilMath) + " " + __dartStr(utilCompare) + " " + __dartStr(utilTypeof) + " " + __dartStr(utilTruthy) + " " + __dartStr(utilOr) + "," + __dartStr(utilAnd) + "," + __dartStr(utilShift) + " " + __dartStr(utilProtoSame) + "," + __dartStr(utilArray) + "," + __dartStr(utilSimple) + "," + __dartStr(utilKeys) + "," + __dartStr((Array.isArray(__dartMapGet(utilDartified, "k")) || (ArrayBuffer.isView(__dartMapGet(utilDartified, "k")) && !(__dartMapGet(utilDartified, "k") instanceof DataView)))) + "," + __dartStr(utilDeleted) + "," + __dartStr(utilHasAfterDelete) + "," + __dartStr(utilInstance) + "," + __dartStr(utilInstanceString));
  const externalMax = __dartJsNumberToDartInt(globalThis["Math"]["max"](3, 8));
  const externalPi = Math.floor(globalThis["Math"]["PI"]);
  const externalDate = new globalThis["Date"](0);
  __dartPrint("jsExternal " + __dartStr(externalMax) + " " + __dartStr(externalPi) + " " + __dartStr(__dartJsNumberToDartInt(externalDate["getUTCFullYear"]())));
  const promiseConstructor = globalThis["Promise"];
  const resolvedPromise = __dartJsCallMethodOptional(promiseConstructor, "resolve", [11]);
  const viaJsUtil = await Promise.resolve(resolvedPromise);
  const viaToDart = await Promise.resolve(resolvedPromise);
  const viaFutureToJs = await Promise.resolve(Promise.resolve(Promise.resolve(13)));
  const constructedPromise = Promise.resolve(new globalThis["Promise"](__dartJsExportFunction(function(resolve, _reject) {
    resolve["call"](resolve, 19);
})));
  const module = await Promise.resolve(import("data:text/javascript,export const answer=17"));
  const moduleAnswer = module["answer"];
  __dartPrint("jsPromise " + __dartStr(__dartJsNumberToDartInt(viaJsUtil)) + " " + __dartStr(__dartJsNumberToDartInt(viaToDart)) + " " + __dartStr(__dartJsNumberToDartInt(viaFutureToJs)) + " " + __dartStr(__dartJsNumberToDartInt(moduleAnswer)) + " " + __dartStr(__dartJsNumberToDartInt(await constructedPromise)));
  const uniqueSymbol = Symbol("unique");
  const sharedSymbol = globalThis["Symbol"]["for"]("dart2esm.shared");
  const jsIterable = __dartJsIterableFromDartIterable([1, 2]);
  const jsIterator = jsIterable[Symbol.iterator]();
  const firstResult = jsIterator["next"]();
  const secondResult = jsIterator["next"]();
  const doneResult = jsIterator["next"]();
  const dartValues = __dartIterableJoin(Array.from(Array.from(jsIterable), function(value) { return __dartJsNumberToDartInt(value); }), ",");
  const dartIterator = __dartJsIteratorFromDartIterator(__dartIterator([3, 4]));
  const dartIteratorFirst = __dartJsNumberToDartInt(__dartNullCheck(dartIterator["next"]()["value"]));
  const jsToDartIterator = __dartJsIteratorToDartIterator([5][Symbol.iterator]());
  const moved = jsToDartIterator.moveNext();
  const manualValue = ({ value: 21, done: false });
  const manualDone = ({ done: true });
  __dartPrint("jsIterator " + __dartStr(uniqueSymbol["description"]) + " " + __dartStr((Symbol.keyFor(sharedSymbol) ?? null)) + " " + __dartStr(typeof __dartExtensionTypeRep(globalThis["Symbol"]["iterator"], "_jsSymbol") === "symbol") + " " + __dartStr(__dartJsNumberToDartInt(__dartNullCheck(firstResult["value"]))) + " " + __dartStr(__dartJsNumberToDartInt(__dartNullCheck(secondResult["value"]))) + " " + __dartStr((doneResult.done === true)) + " " + __dartStr(dartValues) + " " + __dartStr(dartIteratorFirst) + " " + __dartStr(moved) + " " + __dartStr(__dartJsNumberToDartInt(jsToDartIterator.current)) + " " + __dartStr(__dartJsNumberToDartInt(__dartNullCheck(manualValue["value"]))) + " " + __dartStr((manualDone.done === true)));
  const jsBuffer = new globalThis["ArrayBuffer"](4);
  const dartBuffer = jsBuffer;
  const jsView = new globalThis["DataView"](dartBuffer);
  const dartView = jsView;
  dartView.setUint8(0, 23);
  const jsBytes = new globalThis["Uint8Array"](3);
  const dartBytes = jsBytes;
  __dartIndexSet(dartBytes, 0, 7);
  __dartIndexSet(dartBytes, 1, 8);
  __dartIndexSet(dartBytes, 2, 9);
  const roundTripBytes = dartBytes;
  const bufferBytes = new globalThis["Uint8Array"](dartBuffer);
  __dartPrint("jsTyped " + __dartStr(dartBuffer.byteLength) + " " + __dartStr(dartView.getUint8(0)) + " " + __dartStr(__dartIterableJoin(roundTripBytes, ",")) + " " + __dartStr(__dartIndexGet(bufferBytes, 0)));
  const boxed = __dartJsBox(new Map([["answer", 31]]));
  const unboxed = __dartAs(__dartJsUnbox(boxed), value => value instanceof Map, "Map<String, int>");
  const reference = ["dart-ref"];
  const unreferenced = reference;
  __dartPrint("jsBox " + __dartStr(__dartMapGet(unboxed, "answer")) + " " + __dartStr(__dartIterableSingle(unreferenced)) + " " + __dartStr(__dartIsJsBox(boxed)));
  const exportedCounter = (function() {
    let _dartInstance = new JsExportedCounter(5);
    let _jsExporter = __dartAs(globalThis["Object"], value => __dartExtensionTypeRep(value, "_jsObject") != null && (typeof __dartExtensionTypeRep(value, "_jsObject") === "object" || typeof __dartExtensionTypeRep(value, "_jsObject") === "function"), "JSObject")["create"](...Array.from([__dartAs(null, value => (value === null || __dartExtensionTypeRep(value, "_jsObject") != null && (typeof __dartExtensionTypeRep(value, "_jsObject") === "object" || typeof __dartExtensionTypeRep(value, "_jsObject") === "function")), "JSObject?")] ?? []));
    (_jsExporter["incBy"] = __dartJsExportFunction(__dartBind(_dartInstance, "increment")));
    let _0Mapping = __dartAs(globalThis["Object"], value => __dartExtensionTypeRep(value, "_jsObject") != null && (typeof __dartExtensionTypeRep(value, "_jsObject") === "object" || typeof __dartExtensionTypeRep(value, "_jsObject") === "function"), "JSObject")["create"](...Array.from([__dartAs(null, value => (value === null || __dartExtensionTypeRep(value, "_jsObject") != null && (typeof __dartExtensionTypeRep(value, "_jsObject") === "object" || typeof __dartExtensionTypeRep(value, "_jsObject") === "function")), "JSObject?")] ?? []));
    (_0Mapping["get"] = __dartJsExportFunction(function() { return _dartInstance.label; }));
    (_0Mapping["set"] = __dartJsExportFunction(function(_val) {
      _dartInstance.label = _val;
}));
    __dartAs(globalThis["Object"], value => __dartExtensionTypeRep(value, "_jsObject") != null && (typeof __dartExtensionTypeRep(value, "_jsObject") === "object" || typeof __dartExtensionTypeRep(value, "_jsObject") === "function"), "JSObject")["defineProperty"](...Array.from([_jsExporter, "label", _0Mapping] ?? []));
    let _1Mapping = __dartAs(globalThis["Object"], value => __dartExtensionTypeRep(value, "_jsObject") != null && (typeof __dartExtensionTypeRep(value, "_jsObject") === "object" || typeof __dartExtensionTypeRep(value, "_jsObject") === "function"), "JSObject")["create"](...Array.from([__dartAs(null, value => (value === null || __dartExtensionTypeRep(value, "_jsObject") != null && (typeof __dartExtensionTypeRep(value, "_jsObject") === "object" || typeof __dartExtensionTypeRep(value, "_jsObject") === "function")), "JSObject?")] ?? []));
    (_1Mapping["get"] = __dartJsExportFunction(function() { return _dartInstance.value; }));
    (_1Mapping["set"] = __dartJsExportFunction(function(_val) {
      _dartInstance.value = _val;
}));
    __dartAs(globalThis["Object"], value => __dartExtensionTypeRep(value, "_jsObject") != null && (typeof __dartExtensionTypeRep(value, "_jsObject") === "object" || typeof __dartExtensionTypeRep(value, "_jsObject") === "function"), "JSObject")["defineProperty"](...Array.from([_jsExporter, "value", _1Mapping] ?? []));
    return __dartAs(_jsExporter, value => __dartExtensionTypeRep(value, "_jsObject") != null && (typeof __dartExtensionTypeRep(value, "_jsObject") === "object" || typeof __dartExtensionTypeRep(value, "_jsObject") === "function"), "JSObject");
})();
  const exportInc = __dartJsNumberToDartInt(__dartJsCallMethodOptional(exportedCounter, "incBy", [4]));
  const exportLabel = exportedCounter["label"];
  (exportedCounter["label"] = "13");
  const exportUpdated = __dartJsNumberToDartInt(__dartJsCallMethodOptional(exportedCounter, "incBy", [2]));
  __dartPrint("jsExport " + __dartStr(exportInc) + " " + __dartStr(exportLabel) + " " + __dartStr(exportUpdated));
  const exportedFunction = __dartJsExportFunction(function(value) { return (__dartJsNumberToDartInt(value) + 1); });
  const exportedCall = __dartJsNumberToDartInt(__dartAs(exportedFunction["call"](null, 6), value => typeof __dartExtensionTypeRep(value, "_jsNumber") === "number", "JSNumber"));
  const exportedDartCall = (__dartAs(__dartJsExportedFunctionToDart(exportedFunction), value => typeof value === "function", "int Function(JSNumber)"))(7);
  const thisObject = ({});
  (thisObject["prefix"] = "this");
  const captureThis = __dartJsExportCaptureThis(function(self, value) {
    const prefix = self["prefix"];
    return __dartStr(prefix) + ":" + __dartStr(value);
});
  const captured = __dartAs(captureThis["call"](thisObject, "ok"), value => typeof __dartExtensionTypeRep(value, "_jsString") === "string", "JSString");
  __dartPrint("jsFunction " + __dartStr(exportedCall) + " " + __dartStr(exportedDartCall) + " " + __dartStr(__dartIsJsExportedFunction(exportedFunction)) + " " + __dartStr(captured));
}

await main();
