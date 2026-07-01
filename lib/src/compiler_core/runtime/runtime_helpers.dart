import '../ir/esm_ir.dart';

enum EsmRuntimeHelper {
  bigIntBitLength,
  bigIntParse,
  compare,
  coreError,
  constMap,
  constSet,
  constValue,
  customHashMap,
  doubleParse,
  doubleValue,
  dynamicCall,
  dynamicGet,
  dynamicInvoke,
  dynamicSet,
  encoding,
  equals,
  enumAsNameMap,
  enumByName,
  expando,
  extensionTypeRep,
  finalizer,
  functionApply,
  intGcd,
  intModular,
  intParse,
  iterableSearch,
  iterableWindow,
  iterator,
  lazyField,
  listAdd,
  listAddAll,
  listFactory,
  listMutation,
  listRangeOps,
  listSearch,
  mapAddAll,
  mapContainsKey,
  mapFactories,
  mapGet,
  mapOps,
  mapSet,
  mathPoint,
  mathRandom,
  mathRectangle,
  nullCheck,
  objectHash,
  pattern,
  print,
  recordShape,
  isRecord,
  record,
  objectRuntimeType,
  regExp,
  regExpEscape,
  safeToString,
  setAddAll,
  setOps,
  splayTree,
  stringBuffer,
  stringFactory,
  stringOps,
  stringify,
  symbol,
  throwWithStackTrace,
  type,
  typeCast,
  uri,
  weakReference,
}

final class EsmRuntimeHelperRegistry {
  const EsmRuntimeHelperRegistry();

  static const generatedGlobalNames = {
    '__dartAs',
    '__dartBigIntBitLength',
    '__dartBigIntParse',
    '__dartCompare',
    '__dartCoreError',
    '__dartConst',
    '__dartConstMap',
    '__dartConstSet',
    '__dartConstValues',
    '__dartCustomHashMap',
    '__dartDoubleParse',
    '__dartDoubleTryParse',
    '__dartDoubleValue',
    '__dartDynamicCall',
    '__dartDynamicGet',
    '__dartDynamicInvoke',
    '__dartDynamicSet',
    '__dartEnumAsNameMap',
    '__dartEnumByName',
    '__dartEquals',
    '__dartExpando',
    '__dartExtensionTypeRep',
    '__dartFinalizer',
    '__dartFunctionApply',
    '__dartIntGcd',
    '__dartIntModInverse',
    '__dartIntModPow',
    '__dartFormatException',
    '__dartIntParse',
    '__dartIntTryParse',
    '__dartIterableFirstWhere',
    '__dartIterableFirstOrNull',
    '__dartIterableLastWhere',
    '__dartIterableLastOrNull',
    '__dartIterableSingle',
    '__dartIterableSingleWhere',
    '__dartIterableSingleOrNull',
    '__dartIterableElementAtOrNull',
    '__dartIterableSkipWhile',
    '__dartIterableTakeWhile',
    '__dartIterator',
    '__dartLazyField',
    '__dartLatin1Codec',
    '__dartFixedList',
    '__dartListCopyRange',
    '__dartListAdd',
    '__dartListAddAll',
    '__dartListAsMap',
    '__dartListFillRange',
    '__dartListFilled',
    '__dartListGenerate',
    '__dartListIndexOf',
    '__dartListIndexWhere',
    '__dartListLastIndexOf',
    '__dartListLastIndexWhere',
    '__dartListInsert',
    '__dartListInsertAll',
    '__dartListOf',
    '__dartListRemove',
    '__dartListRemoveAt',
    '__dartListRemoveLast',
    '__dartListRemoveRange',
    '__dartListRemoveWhere',
    '__dartListReplaceRange',
    '__dartListRetainWhere',
    '__dartListSetAll',
    '__dartListSetRange',
    '__dartListShuffle',
    '__dartListWriteIterable',
    '__dartUnmodifiableList',
    '__dartMapAddAll',
    '__dartMapAddEntries',
    '__dartMapClear',
    '__dartMapContainsKey',
    '__dartMapContainsValue',
    '__dartMapFromIterable',
    '__dartMapFromIterables',
    '__dartMapFromEntries',
    '__dartMapGet',
    '__dartMapKey',
    '__dartMapMap',
    '__dartMapMissingKey',
    '__dartMapForEach',
    '__dartMapPutIfAbsent',
    '__dartMapRemove',
    '__dartMapRemoveWhere',
    '__dartMapSet',
    '__dartMapUpdate',
    '__dartMapUpdateAll',
    '__dartPoint',
    '__dartRandom',
    '__dartRectangle',
    '__dartRectangleFromPoints',
    '__dartCombineHash',
    '__dartFinishHash',
    '__dartHashValue',
    '__dartIdentityHashes',
    '__dartNextIdentityHash',
    '__dartNumParse',
    '__dartNumTryParse',
    '__dartIsRecord',
    '__dartIsCoreError',
    '__dartNullCheck',
    '__dartObjectHash',
    '__dartObjectHashUnordered',
    '__dartPatternAllMatches',
    '__dartPatternMatchAsPrefix',
    '__dartPatternRegExp',
    '__dartPrint',
    '__dartRecord',
    '__dartRecordShape',
    '__dartRegExp',
    '__dartRegExpEscape',
    '__dartRegExpMatch',
    '__dartRuntimeType',
    '__dartSafeToString',
    '__dartSetAddAll',
    '__dartSetAdd',
    '__dartSetContains',
    '__dartSetContainsAll',
    '__dartSetDifference',
    '__dartSetFrom',
    '__dartSetIntersection',
    '__dartSetLookup',
    '__dartSetRemove',
    '__dartSetRemoveAll',
    '__dartSetRemoveWhere',
    '__dartSetRetainAll',
    '__dartSetRetainWhere',
    '__dartSetUnion',
    '__dartSplaySortMap',
    '__dartSplaySortSet',
    '__dartSplayTreeMap',
    '__dartSplayTreeMapFromEntries',
    '__dartSplayTreeSet',
    '__dartSplayTreeSetFrom',
    '__dartStringBuffer',
    '__dartStringAllMatches',
    '__dartStringContains',
    '__dartStringCodeUnits',
    '__dartStringFromCharCodes',
    '__dartStringIndexOf',
    '__dartStringLastIndexOf',
    '__dartStringMatch',
    '__dartStringMatchAsPrefix',
    '__dartStringPatternMatches',
    '__dartStringReplaceAll',
    '__dartStringReplaceAllMapped',
    '__dartStringReplaceFirst',
    '__dartStringReplaceFirstMapped',
    '__dartStringReplaceFirstPattern',
    '__dartStringReplaceRange',
    '__dartStringReplaceStringMapped',
    '__dartStringSplit',
    '__dartStringSplitMapJoin',
    '__dartStringStartsWith',
    '__dartStr',
    '__dartJsRegExpReplacementMatch',
    '__dartSymbol',
    '__dartSymbolCache',
    '__dartThrowWithStackTrace',
    '__dartType',
    '__dartTypeCache',
    '__dartUtf8Codec',
    '__dartUri',
    '__dartUriBuild',
    '__dartUriDataFromBytes',
    '__dartUriDataFromString',
    '__dartUriDecodeQueryComponent',
    '__dartUriEncodeQueryComponent',
    '__dartUriFile',
    '__dartUriNormalizePath',
    '__dartUriParse',
    '__dartUriReplace',
    '__dartUriResolve',
    '__dartUriSplitQueryString',
    '__dartWeakReference',
  };

  String name(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.bigIntBitLength => '__dartBigIntBitLength',
      EsmRuntimeHelper.bigIntParse => '__dartBigIntParse',
      EsmRuntimeHelper.compare => '__dartCompare',
      EsmRuntimeHelper.coreError => '__dartCoreError',
      EsmRuntimeHelper.constMap => '__dartConstMap',
      EsmRuntimeHelper.constSet => '__dartConstSet',
      EsmRuntimeHelper.constValue => '__dartConst',
      EsmRuntimeHelper.customHashMap => '__dartCustomHashMap',
      EsmRuntimeHelper.doubleParse => '__dartDoubleParse',
      EsmRuntimeHelper.doubleValue => '__dartDoubleValue',
      EsmRuntimeHelper.dynamicCall => '__dartDynamicCall',
      EsmRuntimeHelper.dynamicGet => '__dartDynamicGet',
      EsmRuntimeHelper.dynamicInvoke => '__dartDynamicInvoke',
      EsmRuntimeHelper.dynamicSet => '__dartDynamicSet',
      EsmRuntimeHelper.encoding => '__dartLatin1Codec',
      EsmRuntimeHelper.equals => '__dartEquals',
      EsmRuntimeHelper.enumAsNameMap => '__dartEnumAsNameMap',
      EsmRuntimeHelper.enumByName => '__dartEnumByName',
      EsmRuntimeHelper.expando => '__dartExpando',
      EsmRuntimeHelper.extensionTypeRep => '__dartExtensionTypeRep',
      EsmRuntimeHelper.finalizer => '__dartFinalizer',
      EsmRuntimeHelper.functionApply => '__dartFunctionApply',
      EsmRuntimeHelper.intGcd => '__dartIntGcd',
      EsmRuntimeHelper.intModular => '__dartIntModInverse',
      EsmRuntimeHelper.intParse => '__dartIntParse',
      EsmRuntimeHelper.iterableSearch => '__dartIterableFirstWhere',
      EsmRuntimeHelper.iterableWindow => '__dartIterableTakeWhile',
      EsmRuntimeHelper.iterator => '__dartIterator',
      EsmRuntimeHelper.isRecord => '__dartIsRecord',
      EsmRuntimeHelper.lazyField => '__dartLazyField',
      EsmRuntimeHelper.listAdd => '__dartListAdd',
      EsmRuntimeHelper.listAddAll => '__dartListAddAll',
      EsmRuntimeHelper.listFactory => '__dartListOf',
      EsmRuntimeHelper.listMutation => '__dartListShuffle',
      EsmRuntimeHelper.listRangeOps => '__dartListCopyRange',
      EsmRuntimeHelper.listSearch => '__dartListIndexOf',
      EsmRuntimeHelper.mapAddAll => '__dartMapAddAll',
      EsmRuntimeHelper.mapContainsKey => '__dartMapContainsKey',
      EsmRuntimeHelper.mapFactories => '__dartMapFromIterable',
      EsmRuntimeHelper.mapGet => '__dartMapGet',
      EsmRuntimeHelper.mapOps => '__dartMapAddEntries',
      EsmRuntimeHelper.mapSet => '__dartMapSet',
      EsmRuntimeHelper.mathPoint => '__dartPoint',
      EsmRuntimeHelper.mathRandom => '__dartRandom',
      EsmRuntimeHelper.mathRectangle => '__dartRectangle',
      EsmRuntimeHelper.nullCheck => '__dartNullCheck',
      EsmRuntimeHelper.objectHash => '__dartObjectHash',
      EsmRuntimeHelper.pattern => '__dartPatternRegExp',
      EsmRuntimeHelper.print => '__dartPrint',
      EsmRuntimeHelper.record => '__dartRecord',
      EsmRuntimeHelper.recordShape => '__dartRecordShape',
      EsmRuntimeHelper.objectRuntimeType => '__dartRuntimeType',
      EsmRuntimeHelper.regExp => '__dartRegExp',
      EsmRuntimeHelper.regExpEscape => '__dartRegExpEscape',
      EsmRuntimeHelper.safeToString => '__dartSafeToString',
      EsmRuntimeHelper.setAddAll => '__dartSetAddAll',
      EsmRuntimeHelper.setOps => '__dartSetLookup',
      EsmRuntimeHelper.splayTree => '__dartSplayTreeSet',
      EsmRuntimeHelper.stringBuffer => '__dartStringBuffer',
      EsmRuntimeHelper.stringFactory => '__dartStringFromCharCodes',
      EsmRuntimeHelper.stringOps => '__dartStringReplaceFirst',
      EsmRuntimeHelper.stringify => '__dartStr',
      EsmRuntimeHelper.symbol => '__dartSymbol',
      EsmRuntimeHelper.throwWithStackTrace => '__dartThrowWithStackTrace',
      EsmRuntimeHelper.type => '__dartType',
      EsmRuntimeHelper.typeCast => '__dartAs',
      EsmRuntimeHelper.uri => '__dartUriParse',
      EsmRuntimeHelper.weakReference => '__dartWeakReference',
    };
  }

  EsmIdentifierIr reference(EsmRuntimeHelper helper) {
    return EsmIdentifierIr(name(helper));
  }

  EsmModuleItemIr declaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.bigIntBitLength => EsmRawModuleItemIr('''
function __dartBigIntBitLength(value) {
  if (value === 0n || value === -1n) return 0;
  const magnitude = value < 0n ? -value - 1n : value;
  return magnitude.toString(2).length;
}
'''),
      EsmRuntimeHelper.bigIntParse => EsmRawModuleItemIr(r'''
function __dartBigIntParse(source, radix = null, tryParse = false) {
  try {
    const text = String(source).trim();
    const sign = /^[+-]/.test(text) ? text[0] : "";
    let digits = sign === "" ? text : text.slice(1);
    let base = radix == null ? null : Number(radix);
    if (base == null && /^0x[0-9a-f]+$/i.test(digits)) { base = 16; digits = digits.slice(2); }
    base ??= 10;
    if (!Number.isInteger(base) || base < 2 || base > 36) throw new RangeError("Radix out of range");
    if (digits.length === 0) throw new Error("Invalid BigInt literal");
    let value = 0n;
    const bigBase = BigInt(base);
    for (const char of digits.toLowerCase()) {
      const code = char.charCodeAt(0);
      const digit = code >= 48 && code <= 57 ? code - 48 : code >= 97 && code <= 122 ? code - 87 : -1;
      if (digit < 0 || digit >= base) throw new Error("Invalid BigInt literal");
      value = value * bigBase + BigInt(digit);
    }
    return sign === "-" ? -value : value;
  } catch (error) {
    if (tryParse) return null;
    throw error;
  }
}
'''),
      EsmRuntimeHelper.compare => EsmRawModuleItemIr('''
function __dartCompare(left, right, compare = null) {
  if (typeof compare === "function") return Number(compare(left, right));
  const compareTo = left == null ? null : left.compareTo;
  if (typeof compareTo === "function") return Number(compareTo.call(left, right));
  return left < right ? -1 : left > right ? 1 : 0;
}
'''),
      EsmRuntimeHelper.coreError => EsmRawModuleItemIr('''
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
'''),
      EsmRuntimeHelper.constValue => EsmRawModuleItemIr('''
const __dartConstValues = new Map();
function __dartConst(key, create) {
  if (!__dartConstValues.has(key)) {
    __dartConstValues.set(key, create());
  }
  return __dartConstValues.get(key);
}
'''),
      EsmRuntimeHelper.doubleParse => EsmRawModuleItemIr(r'''
function __dartDoubleTryParse(source) {
  const text = String(source).trim();
  if (text.length === 0) return null;
  if (/^[+-]?NaN$/i.test(text)) return NaN;
  const value = Number(text);
  return Number.isNaN(value) ? null : value;
}
function __dartDoubleParse(source) {
  const value = __dartDoubleTryParse(source);
  if (value === null) {
    const error = new Error("Invalid double literal");
    error.name = "FormatException";
    throw error;
  }
  return value;
}
function __dartNumTryParse(source) {
  return __dartDoubleTryParse(source);
}
function __dartNumParse(source) {
  const value = __dartNumTryParse(source);
  if (value === null) {
    const error = new Error("Invalid number literal");
    error.name = "FormatException";
    throw error;
  }
  return value;
}
'''),
      EsmRuntimeHelper.doubleValue => EsmRawModuleItemIr('''
function __dartDoubleValue(value) {
  const number = Number(value);
  return Object.freeze({
    __dartType: "double",
    valueOf() { return number; },
    toString() {
      if (Number.isNaN(number)) return "NaN";
      if (number === Infinity) return "Infinity";
      if (number === -Infinity) return "-Infinity";
      if (Object.is(number, -0)) return "-0.0";
      return Number.isInteger(number) ? number.toString() + ".0" : number.toString();
    },
  });
}
'''),
      EsmRuntimeHelper.constSet => EsmRawModuleItemIr('''
function __dartConstSet(values) {
  const set = __dartSetFrom(values);
  const throwConst = () => { throw new TypeError("Cannot modify const Set"); };
  Object.defineProperty(set, "add", { value: throwConst });
  Object.defineProperty(set, "delete", { value: throwConst });
  Object.defineProperty(set, "clear", { value: throwConst });
  return Object.freeze(set);
}
'''),
      EsmRuntimeHelper.constMap => EsmRawModuleItemIr('''
function __dartConstMap(entries) {
  const map = __dartMapFromEntries(entries);
  const throwConst = () => { throw new TypeError("Cannot modify const Map"); };
  Object.defineProperty(map, "set", { value: throwConst });
  Object.defineProperty(map, "delete", { value: throwConst });
  Object.defineProperty(map, "clear", { value: throwConst });
  return Object.freeze(map);
}
'''),
      EsmRuntimeHelper.dynamicCall => EsmRawModuleItemIr('''
function __dartDynamicCall(receiver, positionalArguments, namedArguments = null) {
  const args = namedArguments == null ? Array.from(positionalArguments) : [...positionalArguments, namedArguments];
  if (typeof receiver === "function") return receiver(...args);
  const call = receiver?.call;
  if (typeof call === "function") return call.apply(receiver, args);
  throw new TypeError("Object is not callable");
}
'''),
      EsmRuntimeHelper.dynamicGet => EsmRawModuleItemIr('''
function __dartDynamicGet(receiver, name) {
  if (receiver == null) throw new TypeError("Cannot read property " + name + " of " + receiver);
  if ((receiver instanceof Set || receiver instanceof Map) && name === "length") return receiver.size;
  const value = receiver[name];
  return typeof value === "function" ? value.bind(receiver) : value;
}
'''),
      EsmRuntimeHelper.dynamicSet => EsmRawModuleItemIr('''
function __dartDynamicSet(receiver, name, value) {
  if (receiver == null) throw new TypeError("Cannot set property " + name + " of " + receiver);
  receiver[name] = value;
  return value;
}
'''),
      EsmRuntimeHelper.dynamicInvoke => EsmRawModuleItemIr('''
function __dartDynamicInvoke(receiver, name, positionalArguments, namedArguments = null) {
  if (receiver == null) throw new TypeError("Cannot call " + name + " on " + receiver);
  const args = namedArguments == null ? Array.from(positionalArguments) : [...positionalArguments, namedArguments];
  if (name === "[]") {
    const key = args[0];
    if (receiver instanceof Map) {
      return receiver.has(key) ? receiver.get(key) : null;
    }
    return receiver[key];
  }
  if (name === "[]=") {
    const key = args[0];
    const value = args[1];
    if (receiver instanceof Map) {
      receiver.set(key, value);
      return value;
    }
    receiver[key] = value;
    return value;
  }
  if (receiver instanceof Map) {
    if (name === "containsKey") return receiver.has(args[0]);
    if (name === "remove") {
      const key = args[0];
      const value = receiver.has(key) ? receiver.get(key) : null;
      receiver.delete(key);
      return value;
    }
  }
  if (receiver instanceof Set) {
    if (name === "add") {
      const value = args[0];
      const hadValue = receiver.has(value);
      receiver.add(value);
      return !hadValue;
    }
    if (name === "contains") return receiver.has(args[0]);
    if (name === "remove") return receiver.delete(args[0]);
  }
  if (Array.isArray(receiver)) {
    if (name === "add") {
      receiver.push(args[0]);
      return null;
    }
    if (name === "addAll") {
      receiver.push(...Array.from(args[0]));
      return null;
    }
    if (name === "contains") return receiver.includes(args[0]);
  }
  if (typeof receiver === "string" && name === "contains") {
    return receiver.includes(args[0]);
  }
  const member = receiver[name];
  if (typeof member === "function") return member.apply(receiver, args);
  throw new TypeError("Object has no method " + name);
}
'''),
      EsmRuntimeHelper.encoding => EsmRawModuleItemIr('''
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
      EsmRuntimeHelper.enumAsNameMap => EsmRawModuleItemIr('''
function __dartEnumAsNameMap(values) {
  const map = new Map();
  for (const value of values) map.set(value.name, value);
  return map;
}
'''),
      EsmRuntimeHelper.enumByName => EsmRawModuleItemIr('''
function __dartEnumByName(values, name) {
  for (const value of values) {
    if (value.name === name) return value;
  }
  throw new RangeError("No enum value with name " + name);
}
'''),
      EsmRuntimeHelper.expando => EsmRawModuleItemIr('''
function __dartExpando(name = null) {
  const values = new WeakMap();
  const expando = {
    get(object) {
      return values.has(object) ? values.get(object) : null;
    },
    set(object, value) {
      values.set(object, value);
      return null;
    },
    toString() {
      return name == null ? "Expando" : "Expando:" + String(name);
    },
  };
  Object.defineProperty(expando, "__dartType", { value: "Expando" });
  return Object.freeze(expando);
}
'''),
      EsmRuntimeHelper.finalizer => EsmRawModuleItemIr('''
function __dartFinalizer(callback) {
  const registry = typeof FinalizationRegistry === "function" ? new FinalizationRegistry(callback) : null;
  const detachTokens = new Map();
  const finalizer = {
    attach(value, token, options = {}) {
      if (registry != null) {
        const detach = options.detach ?? null;
        let unregisterToken = undefined;
        if (detach != null) {
          unregisterToken = detachTokens.get(detach);
          if (unregisterToken == null) {
            unregisterToken = {};
            detachTokens.set(detach, unregisterToken);
          }
        }
        registry.register(value, token, unregisterToken);
      }
      return null;
    },
    detach(detach) {
      if (registry != null) {
        const unregisterToken = detachTokens.get(detach);
        if (unregisterToken != null) {
          registry.unregister(unregisterToken);
          detachTokens.delete(detach);
        }
      }
      return null;
    },
    toString() {
      return "Finalizer";
    },
  };
  Object.defineProperty(finalizer, "__dartType", { value: "Finalizer" });
  return Object.freeze(finalizer);
}
'''),
      EsmRuntimeHelper.mathPoint => EsmRawModuleItemIr('''
function __dartPoint(x, y) {
  const point = {
    x,
    y,
    get magnitude() { return Math.hypot(x, y); },
    distanceTo(other) {
      return Math.hypot(x - other.x, y - other.y);
    },
    squaredDistanceTo(other) {
      const dx = x - other.x;
      const dy = y - other.y;
      return dx * dx + dy * dy;
    },
    ["+"](other) { return __dartPoint(x + other.x, y + other.y); },
    ["-"](other) { return __dartPoint(x - other.x, y - other.y); },
    ["*"](factor) { return __dartPoint(x * factor, y * factor); },
    ["=="](other) { return other != null && other.__dartType === "Point" && other.x === x && other.y === y; },
    toString() { return "Point(" + x + ", " + y + ")"; },
  };
  Object.defineProperty(point, "__dartType", { value: "Point" });
  return Object.freeze(point);
}
'''),
      EsmRuntimeHelper.mathRandom => EsmRawModuleItemIr('''
function __dartRandom(seed = null, secure = false) {
  let state = seed == null ? 0 : Number(seed) >>> 0;
  function nextUint32() {
    if (secure) {
      const crypto = globalThis.crypto || globalThis.msCrypto;
      if (crypto && typeof crypto.getRandomValues === "function") {
        const values = new Uint32Array(1);
        crypto.getRandomValues(values);
        return values[0] >>> 0;
      }
    }
    if (seed == null) {
      return Math.floor(Math.random() * 0x100000000) >>> 0;
    }
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  }
  return {
    nextInt(max) {
      if (!Number.isInteger(max) || max <= 0) throw new RangeError("max must be positive");
      return nextUint32() % max;
    },
    nextDouble() { return nextUint32() / 0x100000000; },
    nextBool() { return (nextUint32() & 1) === 1; },
  };
}
'''),
      EsmRuntimeHelper.mathRectangle => EsmRawModuleItemIr('''
function __dartRectangle(left, top, width, height) {
  const rectangle = {
    left,
    top,
    width,
    height,
    get right() { return left + width; },
    get bottom() { return top + height; },
    get topLeft() { return __dartPoint(left, top); },
    get topRight() { return __dartPoint(left + width, top); },
    get bottomLeft() { return __dartPoint(left, top + height); },
    get bottomRight() { return __dartPoint(left + width, top + height); },
    containsPoint(point) { return point.x >= left && point.x <= this.right && point.y >= top && point.y <= this.bottom; },
    containsRectangle(other) { return other.left >= left && other.right <= this.right && other.top >= top && other.bottom <= this.bottom; },
    intersects(other) { return left <= other.right && other.left <= this.right && top <= other.bottom && other.top <= this.bottom; },
    intersection(other) {
      const nextLeft = Math.max(left, other.left);
      const nextTop = Math.max(top, other.top);
      const nextRight = Math.min(this.right, other.right);
      const nextBottom = Math.min(this.bottom, other.bottom);
      if (nextLeft > nextRight || nextTop > nextBottom) return null;
      return __dartRectangle(nextLeft, nextTop, nextRight - nextLeft, nextBottom - nextTop);
    },
    boundingBox(other) {
      const nextLeft = Math.min(left, other.left);
      const nextTop = Math.min(top, other.top);
      const nextRight = Math.max(this.right, other.right);
      const nextBottom = Math.max(this.bottom, other.bottom);
      return __dartRectangle(nextLeft, nextTop, nextRight - nextLeft, nextBottom - nextTop);
    },
    ["=="](other) { return other != null && other.__dartType === "Rectangle" && other.left === left && other.top === top && other.width === width && other.height === height; },
    toString() { return "Rectangle (" + left + ", " + top + ") " + width + " x " + height; },
  };
  Object.defineProperty(rectangle, "__dartType", { value: "Rectangle" });
  return Object.freeze(rectangle);
}
function __dartRectangleFromPoints(a, b) {
  const left = Math.min(a.x, b.x);
  const top = Math.min(a.y, b.y);
  return __dartRectangle(left, top, Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
'''),
      EsmRuntimeHelper.extensionTypeRep => EsmRawModuleItemIr('''
function __dartExtensionTypeRep(value, field) {
  if (value != null && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, field)) return value[field];
  return value;
}
'''),
      EsmRuntimeHelper.equals => EsmRawModuleItemIr('''
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
  if ((typeof left === "number" || left.__dartType === "double") && (typeof right === "number" || right.__dartType === "double")) return Number(left) === Number(right);
  if (__dartIsRecord(left) && __dartIsRecord(right)) {
    const leftShape = left[__dartRecordShape];
    const rightShape = right[__dartRecordShape];
    if (leftShape.length !== rightShape.length) return false;
    for (let i = 0; i < leftShape.length; i++) {
      const name = leftShape[i];
      if (name !== rightShape[i]) return false;
      if (!__dartEquals(left[name], right[name])) return false;
    }
    return true;
  }
  const equals = left["=="];
  return typeof equals === "function" ? equals.call(left, right) : false;
}
'''),
      EsmRuntimeHelper.functionApply => EsmRawModuleItemIr('''
function __dartFunctionApply(fn, positionalArguments, namedArguments = null) {
  const args = Array.from(positionalArguments);
  if (namedArguments != null) {
    const options = {};
    let hasNamed = false;
    const entries = namedArguments instanceof Map ? namedArguments.entries() : Object.entries(namedArguments);
    for (const [key, value] of entries) {
      const name = typeof key === "string" ? key : (typeof key === "symbol" ? key.description : key?.name);
      if (typeof name !== "string") throw new TypeError("Function.apply named argument keys must be Symbols");
      options[name] = value;
      hasNamed = true;
    }
    if (hasNamed) args.push(options);
  }
  return fn(...args);
}
'''),
      EsmRuntimeHelper.intGcd => EsmRawModuleItemIr('''
function __dartIntGcd(left, right) {
  let a = Math.abs(Math.trunc(Number(left)));
  let b = Math.abs(Math.trunc(Number(right)));
  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a;
}
'''),
      EsmRuntimeHelper.intModular => EsmRawModuleItemIr('''
function __dartIntModInverse(value, modulus) {
  let a = ((Math.trunc(Number(value)) % Math.trunc(Number(modulus))) + Math.trunc(Number(modulus))) % Math.trunc(Number(modulus));
  let m = Math.trunc(Number(modulus));
  if (m <= 0) throw __dartCoreError("RangeError", "Modulus must be positive");
  let x0 = 0;
  let x1 = 1;
  let b = m;
  while (a > 1 && b !== 0) {
    const q = Math.trunc(a / b);
    [a, b] = [b, a % b];
    [x0, x1] = [x1 - q * x0, x0];
  }
  if (a !== 1) {
    throw __dartCoreError("Exception", "Not coprime");
  }
  return ((x1 % m) + m) % m;
}
function __dartIntModPow(value, exponent, modulus) {
  let e = Math.trunc(Number(exponent));
  const m = Math.trunc(Number(modulus));
  if (e < 0) throw __dartCoreError("RangeError", "Exponent must be non-negative");
  if (m <= 0) throw __dartCoreError("RangeError", "Modulus must be positive");
  let base = ((Math.trunc(Number(value)) % m) + m) % m;
  let result = 1 % m;
  while (e > 0) {
    if ((e & 1) === 1) result = (result * base) % m;
    e = Math.floor(e / 2);
    base = (base * base) % m;
  }
  return result;
}
'''),
      EsmRuntimeHelper.intParse => EsmRawModuleItemIr(r'''
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
'''),
      EsmRuntimeHelper.iterableWindow => EsmRawModuleItemIr('''
function __dartIterableTakeWhile(iterable, test) {
  const values = [];
  for (const value of iterable) {
    if (!test(value)) break;
    values.push(value);
  }
  return values;
}
function __dartIterableSkipWhile(iterable, test) {
  const values = [];
  let skipping = true;
  for (const value of iterable) {
    if (skipping && test(value)) continue;
    skipping = false;
    values.push(value);
  }
  return values;
}
'''),
      EsmRuntimeHelper.iterableSearch => EsmRawModuleItemIr('''
function __dartIterableFirstWhere(iterable, test, orElse = null) {
  for (const value of iterable) {
    if (test(value)) return value;
  }
  if (typeof orElse === "function") return orElse();
  throw new Error("No element");
}
function __dartIterableFirstOrNull(iterable) {
  for (const value of iterable) return value;
  return null;
}
function __dartIterableLastWhere(iterable, test, orElse = null) {
  let found = false;
  let result;
  for (const value of iterable) {
    if (test(value)) {
      found = true;
      result = value;
    }
  }
  if (found) return result;
  if (typeof orElse === "function") return orElse();
  throw new Error("No element");
}
function __dartIterableLastOrNull(iterable) {
  let found = false;
  let result;
  for (const value of iterable) {
    found = true;
    result = value;
  }
  return found ? result : null;
}
function __dartIterableSingle(iterable) {
  const values = Array.from(iterable);
  if (values.length !== 1) throw new Error(values.length === 0 ? "No element" : "Too many elements");
  return values[0];
}
function __dartIterableSingleWhere(iterable, test, orElse = null) {
  let found = false;
  let result;
  for (const value of iterable) {
    if (!test(value)) continue;
    if (found) throw new Error("Too many elements");
    found = true;
    result = value;
  }
  if (found) return result;
  if (typeof orElse === "function") return orElse();
  throw new Error("No element");
}
function __dartIterableSingleOrNull(iterable) {
  let found = false;
  let result;
  for (const value of iterable) {
    if (found) return null;
    found = true;
    result = value;
  }
  return found ? result : null;
}
function __dartIterableElementAtOrNull(iterable, index) {
  const values = Array.from(iterable);
  const offset = Number(index);
  return offset >= 0 && offset < values.length ? values[offset] : null;
}
'''),
      EsmRuntimeHelper.iterator => EsmRawModuleItemIr('''
function __dartIterator(iterable) {
  const values = (iterable != null && typeof iterable["[]"] === "function" && typeof iterable.length === "number")
    ? { length: iterable.length, get(index) { return iterable["[]"](index); } }
    : Array.from(iterable);
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
'''),
      EsmRuntimeHelper.mapFactories => EsmRawModuleItemIr('''
function __dartMapFromEntries(entries) {
  const map = new Map();
  Object.defineProperty(map, "__dartEqualityMap", { value: true });
  __dartMapAddAll(map, entries);
  return map;
}
function __dartMapFromIterable(iterable, key = null, value = null) {
  const map = new Map();
  Object.defineProperty(map, "__dartEqualityMap", { value: true });
  for (const element of iterable) {
    __dartMapSet(
      map,
      typeof key === "function" ? key(element) : element,
      typeof value === "function" ? value(element) : element,
    );
  }
  return map;
}
function __dartMapFromIterables(keys, values) {
  const keyList = Array.from(keys);
  const valueList = Array.from(values);
  if (keyList.length !== valueList.length) throw new Error("Iterables do not have same length");
  const map = new Map();
  Object.defineProperty(map, "__dartEqualityMap", { value: true });
  for (let index = 0; index < keyList.length; index++) {
    __dartMapSet(map, keyList[index], valueList[index]);
  }
  return map;
}
'''),
      EsmRuntimeHelper.mapGet => EsmRawModuleItemIr('''
const __dartMapMissingKey = Symbol("dart.mapMissingKey");
function __dartMapKey(map, key) {
  if (typeof map.__dartSplayIsValidKey === "function" && !map.__dartSplayIsValidKey(key)) return __dartMapMissingKey;
  if (map.__dartSplayCompare !== undefined) {
    for (const candidate of map.keys()) {
      if (__dartCompare(candidate, key, map.__dartSplayCompare) === 0) return candidate;
    }
    return __dartMapMissingKey;
  }
  if (typeof map.__dartMapIsValidKey === "function" && !map.__dartMapIsValidKey(key)) return __dartMapMissingKey;
  if (typeof map.__dartMapEquals === "function") {
    for (const candidate of map.keys()) {
      if (map.__dartMapEquals(candidate, key)) return candidate;
    }
    return __dartMapMissingKey;
  }
  if (!map.__dartEqualityMap) return map.has(key) ? key : __dartMapMissingKey;
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
'''),
      EsmRuntimeHelper.customHashMap => EsmRawModuleItemIr('''
function __dartCustomHashMap(equals = null, hashCode = null, isValidKey = null) {
  const map = new Map();
  Object.defineProperty(map, "__dartEqualityMap", { value: true });
  Object.defineProperty(map, "__dartMapEquals", { value: equals });
  Object.defineProperty(map, "__dartMapHashCode", { value: hashCode });
  Object.defineProperty(map, "__dartMapIsValidKey", { value: isValidKey });
  return map;
}
'''),
      EsmRuntimeHelper.mapSet => EsmRawModuleItemIr('''
function __dartMapSet(map, key, value) {
  const actualKey = __dartMapKey(map, key);
  map.set(actualKey === __dartMapMissingKey ? key : actualKey, value);
  if (map.__dartSplayCompare !== undefined) __dartSplaySortMap(map);
  return value;
}
'''),
      EsmRuntimeHelper.mapAddAll => EsmRawModuleItemIr('''
function __dartMapAddAll(map, entries) {
  for (const [key, value] of entries) __dartMapSet(map, key, value);
  return null;
}
'''),
      EsmRuntimeHelper.mapContainsKey => EsmRawModuleItemIr('''
function __dartMapContainsKey(map, key) {
  if (!(map instanceof Map) && map != null && typeof map.containsKey === "function") return map.containsKey(key);
  return __dartMapKey(map, key) !== __dartMapMissingKey;
}
'''),
      EsmRuntimeHelper.mapOps => EsmRawModuleItemIr('''
function __dartMapAddEntries(map, entries) {
  for (const [key, value] of entries) __dartMapSet(map, key, value);
  return null;
}
function __dartMapContainsValue(map, value) {
  for (const candidate of map.values()) {
    if (__dartEquals(candidate, value)) return true;
  }
  return false;
}
function __dartMapPutIfAbsent(map, key, ifAbsent) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey !== __dartMapMissingKey) return map.get(actualKey);
  const value = ifAbsent();
  __dartMapSet(map, key, value);
  return value;
}
function __dartMapUpdate(map, key, update, ifAbsent = null) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey !== __dartMapMissingKey) {
    const value = update(map.get(actualKey));
    map.set(actualKey, value);
    return value;
  }
  if (typeof ifAbsent === "function") {
    const value = ifAbsent();
    __dartMapSet(map, key, value);
    return value;
  }
  throw new Error("Key not found");
}
function __dartMapForEach(map, action) {
  for (const [key, value] of map) action(key, value);
  return null;
}
function __dartMapMap(map, transform) {
  const result = new Map();
  Object.defineProperty(result, "__dartEqualityMap", { value: true });
  for (const [key, value] of map) {
    const entry = transform(key, value);
    __dartMapSet(result, entry[0], entry[1]);
  }
  return result;
}
function __dartMapRemove(map, key) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey === __dartMapMissingKey) return null;
  const value = map.get(actualKey);
  map.delete(actualKey);
  return value;
}
function __dartMapUpdateAll(map, update) {
  for (const [key, value] of Array.from(map)) {
    map.set(key, update(key, value));
  }
  return null;
}
function __dartMapRemoveWhere(map, test) {
  for (const [key, value] of Array.from(map)) {
    if (test(key, value)) map.delete(key);
  }
  return null;
}
function __dartMapClear(map) {
  map.clear();
  return null;
}
'''),
      EsmRuntimeHelper.recordShape => const EsmRawModuleItemIr(
        'const __dartRecordShape = Symbol("dart.recordShape");',
      ),
      EsmRuntimeHelper.isRecord => EsmRawModuleItemIr('''
function __dartIsRecord(value) {
  return value != null && typeof value === "object" && Array.isArray(value[__dartRecordShape]);
}
'''),
      EsmRuntimeHelper.record => EsmRawModuleItemIr(r'''
function __dartRecord(positional, named) {
  const record = {};
  const shape = [];
  for (let i = 0; i < positional.length; i++) {
    const name = "$" + (i + 1);
    shape.push(name);
    Object.defineProperty(record, name, { value: positional[i], enumerable: true });
  }
  for (const name of Object.keys(named).sort()) {
    shape.push(name);
    Object.defineProperty(record, name, { value: named[name], enumerable: true });
  }
  Object.defineProperty(record, __dartRecordShape, { value: Object.freeze(shape) });
  Object.defineProperty(record, "toString", {
    value() {
      return "(" + shape.map((name) => {
        const value = String(record[name]);
        return name.startsWith("$") ? value : name + ": " + value;
      }).join(", ") + ")";
    },
  });
  return Object.freeze(record);
}
'''),
      EsmRuntimeHelper.objectRuntimeType => EsmRawModuleItemIr('''
function __dartRuntimeType(value) {
  if (value == null) return __dartType("Null");
  if (typeof value === "number") return __dartType(Number.isInteger(value) ? "int" : "double");
  if (value.__dartType === "double") return __dartType("double");
  if (typeof value === "string") return __dartType("String");
  if (typeof value === "boolean") return __dartType("bool");
  if (typeof value === "bigint") return __dartType("BigInt");
  if (Array.isArray(value)) return __dartType("List");
  if (value instanceof Set) return __dartType("Set");
  if (value instanceof Map) return __dartType("Map");
  if (value.__dartType != null) return __dartType(String(value.__dartType));
  const constructor = value.constructor;
  return __dartType(constructor && constructor.name ? constructor.name : "Object");
}
'''),
      EsmRuntimeHelper.pattern => EsmRawModuleItemIr(r'''
function __dartPatternRegExp(pattern, global = false) {
  if (pattern != null && typeof pattern.__dartRegExpMake === "function") return pattern.__dartRegExpMake(global);
  if (pattern instanceof RegExp) {
    let flags = pattern.flags;
    flags = global ? (flags.includes("g") ? flags : flags + "g") : flags.replace(/g/g, "");
    return new RegExp(pattern.source, flags);
  }
  return null;
}
function __dartPatternAllMatches(pattern, input, start = 0) {
  if (pattern != null && typeof pattern !== "string" && !(pattern instanceof RegExp) && typeof pattern.allMatches === "function") return pattern.allMatches(input, start);
  const text = String(input);
  const regexp = __dartPatternRegExp(pattern, true);
  if (regexp != null) {
    const matches = [];
    regexp.lastIndex = start;
    let match;
    while ((match = regexp.exec(text)) !== null) {
      matches.push(__dartRegExpMatch(match, 0, text, pattern));
      if (match[0] === "") regexp.lastIndex++;
    }
    return matches;
  }
  return __dartStringAllMatches(pattern, text, start);
}
function __dartPatternMatchAsPrefix(pattern, input, start = 0) {
  if (pattern != null && typeof pattern !== "string" && !(pattern instanceof RegExp) && typeof pattern.matchAsPrefix === "function") return pattern.matchAsPrefix(input, start);
  const text = String(input);
  const regexp = __dartPatternRegExp(pattern, false);
  if (regexp != null) {
    const match = regexp.exec(text.slice(start));
    return match == null || match.index !== 0 ? null : __dartRegExpMatch(match, start, text, pattern);
  }
  return __dartStringMatchAsPrefix(pattern, text, start);
}
function __dartStringContains(source, pattern, start = 0) {
  const text = String(source);
  const regexp = __dartPatternRegExp(pattern, false);
  if (regexp != null) return regexp.test(text.slice(start));
  return text.includes(String(pattern), start);
}
function __dartStringStartsWith(source, pattern, start = 0) {
  const text = String(source);
  const regexp = __dartPatternRegExp(pattern, false);
  if (regexp != null) {
    const match = regexp.exec(text.slice(start));
    return match != null && match.index === 0;
  }
  return text.startsWith(String(pattern), start);
}
function __dartStringIndexOf(source, pattern, start = 0) {
  const text = String(source);
  const regexp = __dartPatternRegExp(pattern, false);
  if (regexp != null) {
    const match = regexp.exec(text.slice(start));
    return match == null ? -1 : start + match.index;
  }
  return text.indexOf(String(pattern), start);
}
function __dartStringLastIndexOf(source, pattern, start = null) {
  const text = String(source);
  const limit = start == null ? text.length : start;
  const regexp = __dartPatternRegExp(pattern, false);
  if (regexp != null) {
    for (let index = Math.min(limit, text.length); index >= 0; index--) {
      const match = regexp.exec(text.slice(index));
      if (match != null && match.index === 0) return index;
    }
    return -1;
  }
  return text.lastIndexOf(String(pattern), limit);
}
function __dartStringSplit(source, pattern) {
  const text = String(source);
  const regexp = __dartPatternRegExp(pattern, false);
  return regexp == null ? text.split(String(pattern)) : text.split(regexp);
}
function __dartStringReplaceAll(source, pattern, replacement) {
  const text = String(source);
  const replacementText = String(replacement);
  const regexp = __dartPatternRegExp(pattern, true);
  return regexp == null ? text.split(String(pattern)).join(replacementText) : text.replace(regexp, () => replacementText);
}
function __dartStringReplaceAllMapped(source, pattern, replace) {
  const text = String(source);
  const regexp = __dartPatternRegExp(pattern, true);
  if (regexp != null) return text.replace(regexp, (...args) => String(replace(__dartJsRegExpReplacementMatch(args))));
  return __dartStringReplaceStringMapped(text, String(pattern), replace, true, 0);
}
function __dartStringReplaceFirstMapped(source, pattern, replace, startIndex = 0) {
  const text = String(source);
  const regexp = __dartPatternRegExp(pattern, false);
  if (regexp != null) {
    const tail = text.slice(startIndex);
    const match = regexp.exec(tail);
    if (match == null) return text;
    const dartMatch = __dartRegExpMatch(match, startIndex);
    return text.slice(0, dartMatch.start) + String(replace(dartMatch)) + text.slice(dartMatch.end);
  }
  return __dartStringReplaceStringMapped(text, String(pattern), replace, false, startIndex);
}
function __dartStringReplaceStringMapped(text, needle, replace, all, startIndex) {
  if (needle === "") return text;
  let result = "";
  let cursor = 0;
  let index = text.indexOf(needle, startIndex);
  let replaced = false;
  while (index >= 0) {
    result += text.slice(cursor, index);
    result += String(replace(__dartStringMatch(text, index, needle)));
    cursor = index + needle.length;
    replaced = true;
    if (!all) break;
    index = text.indexOf(needle, cursor);
  }
  return replaced ? result + text.slice(cursor) : text;
}
function __dartStringSplitMapJoin(source, pattern, onMatch = null, onNonMatch = null) {
  const text = String(source);
  const matchMapper = typeof onMatch === "function" ? onMatch : (match) => match.group(0);
  const nonMatchMapper = typeof onNonMatch === "function" ? onNonMatch : (part) => part;
  const matches = __dartStringPatternMatches(text, pattern);
  if (matches.length === 0) return String(nonMatchMapper(text));
  let result = "";
  let cursor = 0;
  for (const match of matches) {
    result += String(nonMatchMapper(text.slice(cursor, match.start)));
    result += String(matchMapper(match));
    cursor = match.end;
  }
  result += String(nonMatchMapper(text.slice(cursor)));
  return result;
}
function __dartStringPatternMatches(text, pattern) {
  const regexp = __dartPatternRegExp(pattern, true);
  if (regexp != null) {
    const matches = [];
    let match;
    while ((match = regexp.exec(text)) !== null) {
      matches.push(__dartRegExpMatch(match));
      if (match[0] === "") regexp.lastIndex++;
    }
    return matches;
  }
  const needle = String(pattern);
  if (needle === "") return [];
  const matches = [];
  let index = text.indexOf(needle);
  while (index >= 0) {
    matches.push(__dartStringMatch(text, index, needle));
    index = text.indexOf(needle, index + needle.length);
  }
  return matches;
}
function __dartStringAllMatches(pattern, input, start = 0) {
  const text = String(input);
  const needle = String(pattern);
  const matches = [];
  if (needle === "") return matches;
  let index = text.indexOf(needle, start);
  while (index >= 0) {
    matches.push(__dartStringMatch(text, index, needle));
    index = text.indexOf(needle, index + needle.length);
  }
  return matches;
}
function __dartStringMatchAsPrefix(pattern, input, start = 0) {
  const text = String(input);
  const needle = String(pattern);
  return text.startsWith(needle, start) ? __dartStringMatch(text, start, needle) : null;
}
function __dartStringMatch(input, start, value) {
  return {
    input,
    start,
    end: start + value.length,
    get groupCount() { return 0; },
    group(index) { return index === 0 ? value : null; },
    groups(indices) { return Array.from(indices, (index) => this.group(index)); },
    namedGroup() { return null; },
    get groupNames() { return new Set(); },
    0: value,
  };
}
function __dartRegExpMatch(match, offset = 0, input = null, pattern = null) {
  const namedGroups = match.groups ?? {};
  const result = {
    start: offset + match.index,
    end: offset + match.index + match[0].length,
    get input() { return input; },
    get pattern() { return pattern; },
    get groupCount() { return match.length - 1; },
    group(index) { return index >= 0 && index < match.length ? (match[index] ?? null) : null; },
    groups(indices) { return Array.from(indices, (index) => this.group(index)); },
    namedGroup(name) { return Object.prototype.hasOwnProperty.call(namedGroups, name) ? (namedGroups[name] ?? null) : null; },
    get groupNames() { return new Set(Object.keys(namedGroups)); },
  };
  for (let i = 0; i < match.length; i++) {
    result[i] = match[i] ?? null;
  }
  return result;
}
function __dartJsRegExpReplacementMatch(args) {
  const hasNamedGroups = args.length > 0 && args[args.length - 1] != null && typeof args[args.length - 1] === "object";
  const input = args[args.length - (hasNamedGroups ? 2 : 1)];
  const offset = args[args.length - (hasNamedGroups ? 3 : 2)];
  const match = Array.prototype.slice.call(args, 0, args.length - (hasNamedGroups ? 3 : 2));
  match.index = offset;
  match.input = input;
  if (hasNamedGroups) match.groups = args[args.length - 1];
  return __dartRegExpMatch(match);
}
function __dartStringReplaceFirstPattern(source, pattern, replacement, startIndex = 0) {
  const text = String(source);
  const replacementText = String(replacement);
  const regexp = __dartPatternRegExp(pattern, false);
  if (regexp != null) {
    const tail = text.slice(startIndex);
    const match = regexp.exec(tail);
    if (match == null) return text;
    const index = startIndex + match.index;
    return text.slice(0, index) + replacementText + text.slice(index + match[0].length);
  }
  return __dartStringReplaceFirst(source, pattern, replacement, startIndex);
}
'''),
      EsmRuntimeHelper.regExp => EsmRawModuleItemIr(r'''
function __dartRegExp(pattern, options = {}) {
  const source = String(pattern);
  const caseSensitive = options.caseSensitive !== false;
  const multiLine = options.multiLine === true;
  const unicode = options.unicode === true;
  const dotAll = options.dotAll === true;
  function make(global = false) {
    let flags = global ? "g" : "";
    if (!caseSensitive) flags += "i";
    if (multiLine) flags += "m";
    if (unicode) flags += "u";
    if (dotAll) flags += "s";
    return new RegExp(source, flags);
  }
  function displayFlags() {
    return (caseSensitive ? "" : "i") + (multiLine ? "m" : "") + (dotAll ? "s" : "") + (unicode ? "u" : "");
  }
  return {
    __dartRegExpMake: make,
    pattern: source,
    isCaseSensitive: caseSensitive,
    isMultiLine: multiLine,
    isUnicode: unicode,
    isDotAll: dotAll,
    hasMatch(input) { return make(false).test(String(input)); },
    firstMatch(input) {
      const text = String(input);
      const match = make(false).exec(text);
      return match == null ? null : __dartRegExpMatch(match, 0, text, this);
    },
    stringMatch(input) {
      const match = this.firstMatch(input);
      return match == null ? null : match.group(0);
    },
    matchAsPrefix(input, start = 0) {
      const sourceText = String(input);
      const text = sourceText.slice(start);
      const match = make(false).exec(text);
      return match == null || match.index !== 0 ? null : __dartRegExpMatch(match, start, sourceText, this);
    },
    allMatches(input, start = 0) {
      const text = String(input);
      const regexp = make(true);
      regexp.lastIndex = start;
      const matches = [];
      let match;
      while ((match = regexp.exec(text)) !== null) {
        matches.push(__dartRegExpMatch(match, 0, text, this));
        if (match[0] === "") regexp.lastIndex++;
      }
      return matches;
    },
    toString() { return "RegExp: pattern=" + source + " flags=" + displayFlags(); },
  };
}
'''),
      EsmRuntimeHelper.regExpEscape => EsmRawModuleItemIr(r'''
function __dartRegExpEscape(source) {
  return String(source).replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");
}
'''),
      EsmRuntimeHelper.safeToString => EsmRawModuleItemIr('''
function __dartSafeToString(value) {
  try {
    if (value == null) return "null";
    if (typeof value === "object") {
      const toString = value.toString;
      if (typeof toString === "function" && toString !== Object.prototype.toString) return String(toString.call(value));
      const typeName = value.constructor && value.constructor.name ? value.constructor.name : "Object";
      return "Instance of '" + typeName + "'";
    }
    return String(value);
  } catch (_) {
    const typeName = value != null && value.constructor && value.constructor.name ? value.constructor.name : "Object";
    return "Instance of '" + typeName + "'";
  }
}
'''),
      EsmRuntimeHelper.setAddAll => EsmRawModuleItemIr('''
function __dartSetContains(set, needle) {
  if (typeof set.__dartSplayIsValidKey === "function" && !set.__dartSplayIsValidKey(needle)) return false;
  if (set.__dartSplayCompare !== undefined) {
    for (const value of set) {
      if (__dartCompare(value, needle, set.__dartSplayCompare) === 0) return true;
    }
    return false;
  }
  if (!set.__dartEqualitySet) return set.has(needle);
  for (const value of set) {
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
function __dartSetAdd(set, value) {
  if (__dartSetContains(set, value)) return false;
  set.add(value);
  if (set.__dartSplayCompare !== undefined) __dartSplaySortSet(set);
  return true;
}
function __dartSetFrom(values) {
  const set = new Set();
  Object.defineProperty(set, "__dartEqualitySet", { value: true });
  for (const value of values) __dartSetAdd(set, value);
  return set;
}
function __dartSetAddAll(set, values) {
  for (const value of values) __dartSetAdd(set, value);
  return null;
}
'''),
      EsmRuntimeHelper.setOps => EsmRawModuleItemIr('''
function __dartSetLookup(set, needle) {
  for (const value of set) {
    if (__dartEquals(value, needle)) return value;
  }
  return null;
}
function __dartSetRemove(set, value) {
  for (const candidate of set) {
    if (__dartEquals(candidate, value)) {
      set.delete(candidate);
      return true;
    }
  }
  return false;
}
function __dartSetContainsAll(set, values) {
  for (const value of values) {
    if (!__dartSetContains(set, value)) return false;
  }
  return true;
}
function __dartSetRemoveAll(set, values) {
  for (const value of values) __dartSetRemove(set, value);
  return null;
}
function __dartSetRetainAll(set, values) {
  const keep = Array.from(values);
  for (const value of Array.from(set)) {
    if (!keep.some((candidate) => __dartEquals(candidate, value))) set.delete(value);
  }
  return null;
}
function __dartSetRemoveWhere(set, test) {
  for (const value of Array.from(set)) {
    if (test(value)) set.delete(value);
  }
  return null;
}
function __dartSetRetainWhere(set, test) {
  for (const value of Array.from(set)) {
    if (!test(value)) set.delete(value);
  }
  return null;
}
function __dartSetUnion(set, other) {
  const result = __dartSetFrom(set);
  __dartSetAddAll(result, other);
  return result;
}
function __dartSetIntersection(set, other) {
  const result = __dartSetFrom([]);
  for (const value of set) {
    if (__dartSetContains(other, value)) __dartSetAdd(result, value);
  }
  return result;
}
function __dartSetDifference(set, other) {
  const result = __dartSetFrom([]);
  for (const value of set) {
    if (!__dartSetContains(other, value)) __dartSetAdd(result, value);
  }
  return result;
}
'''),
      EsmRuntimeHelper.splayTree => EsmRawModuleItemIr('''
function __dartSplayTreeSet(compare = null, isValidKey = null) {
  const set = new Set();
  Object.defineProperty(set, "__dartEqualitySet", { value: true });
  Object.defineProperty(set, "__dartSplayCompare", { value: compare });
  Object.defineProperty(set, "__dartSplayIsValidKey", { value: isValidKey });
  return set;
}
function __dartSplaySortSet(set) {
  const values = Array.from(set).sort((left, right) => __dartCompare(left, right, set.__dartSplayCompare));
  set.clear();
  for (const value of values) set.add(value);
}
function __dartSplayTreeSetFrom(values, compare = null, isValidKey = null) {
  const set = __dartSplayTreeSet(compare, isValidKey);
  for (const value of values) __dartSetAdd(set, value);
  return set;
}
function __dartSplayTreeMap(compare = null, isValidKey = null) {
  const map = new Map();
  Object.defineProperty(map, "__dartEqualityMap", { value: true });
  Object.defineProperty(map, "__dartSplayCompare", { value: compare });
  Object.defineProperty(map, "__dartSplayIsValidKey", { value: isValidKey });
  return map;
}
function __dartSplaySortMap(map) {
  const entries = Array.from(map).sort(([left], [right]) => __dartCompare(left, right, map.__dartSplayCompare));
  map.clear();
  for (const [key, value] of entries) map.set(key, value);
}
function __dartSplayTreeMapFromEntries(entries, compare = null, isValidKey = null) {
  const map = __dartSplayTreeMap(compare, isValidKey);
  for (const [key, value] of entries) __dartMapSet(map, key, value);
  return map;
}
'''),
      EsmRuntimeHelper.stringBuffer => EsmRawModuleItemIr('''
function __dartStringBuffer(initial = "") {
  let value = initial == null ? "" : __dartStr(initial);
  return {
    write(next) {
      value += __dartStr(next);
      return null;
    },
    writeln(next = "") {
      value += __dartStr(next) + "\\n";
      return null;
    },
    writeAll(values, separator = "") {
      const parts = Array.from(values, (item) => __dartStr(item));
      value += parts.join(__dartStr(separator));
      return null;
    },
    writeCharCode(charCode) {
      value += String.fromCodePoint(Number(charCode));
      return null;
    },
    clear() {
      value = "";
      return null;
    },
    toString() {
      return value;
    },
    get length() {
      return value.length;
    },
    get isEmpty() {
      return value.length === 0;
    },
    get isNotEmpty() {
      return value.length !== 0;
    },
  };
}
'''),
      EsmRuntimeHelper.stringFactory => EsmRawModuleItemIr('''
function __dartStringFromCharCodes(codes, start = 0, end = null) {
  const values = Array.from(codes).slice(Number(start), end == null ? undefined : Number(end));
  return String.fromCodePoint(...values);
}
'''),
      EsmRuntimeHelper.stringOps => EsmRawModuleItemIr('''
function __dartStringCodeUnits(source) {
  const text = String(source);
  return Array.from({ length: text.length }, (_, index) => text.charCodeAt(index));
}
function __dartStringReplaceFirst(source, pattern, replacement, startIndex = 0) {
  const text = String(source);
  const needle = String(pattern);
  const index = text.indexOf(needle, Number(startIndex));
  if (index < 0) return text;
  return text.slice(0, index) + String(replacement) + text.slice(index + needle.length);
}
function __dartStringReplaceRange(source, start, end, replacement) {
  const text = String(source);
  const actualEnd = end == null ? text.length : Number(end);
  return text.slice(0, Number(start)) + String(replacement) + text.slice(actualEnd);
}
'''),
      EsmRuntimeHelper.lazyField => EsmRawModuleItemIr('''
function __dartLazyField(name, initialize, writable, publish = null) {
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
'''),
      EsmRuntimeHelper.listAdd => EsmRawModuleItemIr('''
function __dartListAdd(list, value) {
  list.push(value);
  return null;
}
'''),
      EsmRuntimeHelper.listAddAll => EsmRawModuleItemIr('''
function __dartListAddAll(list, values) {
  list.push(...Array.from(values));
  return null;
}
'''),
      EsmRuntimeHelper.listFactory => EsmRawModuleItemIr('''
function __dartFixedList(values) {
  const list = Array.from(values);
  Object.preventExtensions(list);
  return list;
}
function __dartListOf(values, growable = true) {
  const list = Array.from(values);
  return growable ? list : __dartFixedList(list);
}
function __dartListFilled(length, fill, growable = false) {
  const list = Array(Number(length)).fill(fill);
  return growable ? list : __dartFixedList(list);
}
function __dartListGenerate(length, generator, growable = true) {
  const list = Array.from({ length: Number(length) }, (_, index) => generator(index));
  return growable ? list : __dartFixedList(list);
}
function __dartUnmodifiableList(values) {
  return Object.freeze(Array.from(values));
}
'''),
      EsmRuntimeHelper.listMutation => EsmRawModuleItemIr('''
function __dartListShuffle(list, random = null) {
  for (let index = list.length - 1; index > 0; index--) {
    const nextInt = random == null ? Math.floor(Math.random() * (index + 1)) : Number(random.nextInt(index + 1));
    [list[index], list[nextInt]] = [list[nextInt], list[index]];
  }
  return null;
}
function __dartListRemoveAt(list, index) {
  return list.splice(Number(index), 1)[0];
}
function __dartListInsert(list, index, value) {
  list.splice(Number(index), 0, value);
  return null;
}
function __dartListRemove(list, value) {
  for (let index = 0; index < list.length; index++) {
    if (__dartEquals(list[index], value)) {
      list.splice(index, 1);
      return true;
    }
  }
  return false;
}
function __dartListRemoveLast(list) {
  return list.pop();
}
function __dartListInsertAll(list, index, values) {
  list.splice(Number(index), 0, ...Array.from(values));
  return null;
}
function __dartListSetAll(list, index, values) {
  let cursor = Number(index);
  for (const value of values) list[cursor++] = value;
  return null;
}
function __dartListFillRange(list, start, end, fill = null) {
  list.fill(fill, Number(start), Number(end));
  return null;
}
function __dartListReplaceRange(list, start, end, values) {
  list.splice(Number(start), Number(end) - Number(start), ...Array.from(values));
  return null;
}
function __dartListRemoveRange(list, start, end) {
  list.splice(Number(start), Number(end) - Number(start));
  return null;
}
function __dartListRemoveWhere(list, test) {
  for (let index = list.length - 1; index >= 0; index--) {
    if (test(list[index])) list.splice(index, 1);
  }
  return null;
}
function __dartListRetainWhere(list, test) {
  for (let index = list.length - 1; index >= 0; index--) {
    if (!test(list[index])) list.splice(index, 1);
  }
  return null;
}
function __dartListAsMap(list) {
  const map = new Map();
  for (let index = 0; index < list.length; index++) map.set(index, list[index]);
  return map;
}
'''),
      EsmRuntimeHelper.listRangeOps => EsmRawModuleItemIr('''
function __dartListCopyRange(target, at, source, start = 0, end = null) {
  const values = Array.from(source).slice(Number(start), end == null ? undefined : Number(end));
  let index = Number(at);
  for (const value of values) target[index++] = value;
  return null;
}
function __dartListWriteIterable(target, at, source) {
  let index = Number(at);
  for (const value of source) target[index++] = value;
  return null;
}
function __dartListSetRange(target, start, end, source, skipCount = 0) {
  const from = Number(skipCount);
  const count = Number(end) - Number(start);
  const values = Array.from(source).slice(from, from + count);
  let index = Number(start);
  for (const value of values) target[index++] = value;
  return null;
}
'''),
      EsmRuntimeHelper.listSearch => EsmRawModuleItemIr('''
function __dartListIndexOf(list, needle, start = 0) {
  const values = Array.from(list);
  for (let index = Math.max(0, Number(start)); index < values.length; index++) {
    if (__dartEquals(values[index], needle)) return index;
  }
  return -1;
}
function __dartListLastIndexOf(list, needle, start = null) {
  const values = Array.from(list);
  let index = start == null ? values.length - 1 : Math.min(Number(start), values.length - 1);
  for (; index >= 0; index--) {
    if (__dartEquals(values[index], needle)) return index;
  }
  return -1;
}
function __dartListIndexWhere(list, test, start = 0) {
  const values = Array.from(list);
  for (let index = Math.max(0, Number(start)); index < values.length; index++) {
    if (test(values[index])) return index;
  }
  return -1;
}
function __dartListLastIndexWhere(list, test, start = null) {
  const values = Array.from(list);
  let index = start == null ? values.length - 1 : Math.min(Number(start), values.length - 1);
  for (; index >= 0; index--) {
    if (test(values[index])) return index;
  }
  return -1;
}
'''),
      EsmRuntimeHelper.nullCheck => EsmRawModuleItemIr('''
function __dartNullCheck(value) {
  if (value == null) throw new TypeError("Null check operator used on a null value");
  return value;
}
'''),
      EsmRuntimeHelper.objectHash => EsmRawModuleItemIr(r'''
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
  if (value.__dartType === "double") {
    const number = Number(value);
    return Number.isFinite(number) ? Math.trunc(number) & 0x1fffffff : 0;
  }
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
'''),
      EsmRuntimeHelper.print => EsmFunctionIr(
        name: name(helper),
        export: false,
        parameters: const [EsmIdentifierParameterIr(name: 'value')],
        body: const [
          EsmExpressionStatementIr(
            EsmCallIr(
              callee: EsmPropertyAccessIr(
                receiver: EsmIdentifierIr('console'),
                property: 'log',
              ),
              arguments: [
                EsmCallIr(
                  callee: EsmIdentifierIr('__dartStr'),
                  arguments: [EsmIdentifierIr('value')],
                ),
              ],
            ),
          ),
        ],
      ),
      EsmRuntimeHelper.stringify => EsmRawModuleItemIr(r'''
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
'''),
      EsmRuntimeHelper.symbol => EsmRawModuleItemIr('''
const __dartSymbolCache = new Map();
function __dartSymbol(key, name) {
  if (__dartSymbolCache.has(key)) return __dartSymbolCache.get(key);
  const value = Object.freeze({
    name,
    toString() { return "Symbol(" + JSON.stringify(name) + ")"; },
  });
  __dartSymbolCache.set(key, value);
  return value;
}
'''),
      EsmRuntimeHelper.throwWithStackTrace => EsmRawModuleItemIr('''
function __dartThrowWithStackTrace(error, stackTrace) {
  if (error != null && (typeof error === "object" || typeof error === "function")) {
    try { error.stack = String(stackTrace); } catch (_) {}
  }
  throw error;
}
'''),
      EsmRuntimeHelper.type => EsmRawModuleItemIr('''
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
'''),
      EsmRuntimeHelper.uri => EsmRawModuleItemIr(r'''
function __dartBase64Encode(bytes, urlSafe = false) {
  const values = Uint8Array.from(Array.from(bytes, (byte) => Number(byte) & 255));
  let encoded;
  if (typeof Buffer !== "undefined") {
    encoded = Buffer.from(values).toString("base64");
  } else {
    let binary = "";
    for (const byte of values) binary += String.fromCharCode(byte);
    encoded = btoa(binary);
  }
  return urlSafe ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "") : encoded;
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
'''),
      EsmRuntimeHelper.weakReference => EsmRawModuleItemIr('''
function __dartWeakReference(target) {
  const ref = typeof WeakRef === "function" ? new WeakRef(target) : { deref() { return target; } };
  const weak = {
    get target() {
      return ref.deref() ?? null;
    },
    toString() {
      return "WeakReference";
    },
  };
  Object.defineProperty(weak, "__dartType", { value: "WeakReference" });
  return Object.freeze(weak);
}
'''),
      EsmRuntimeHelper.typeCast => EsmFunctionIr(
        name: name(helper),
        export: false,
        parameters: const [
          EsmIdentifierParameterIr(name: 'value'),
          EsmIdentifierParameterIr(name: 'test'),
          EsmIdentifierParameterIr(name: 'typeName'),
        ],
        body: const [
          EsmIfStatementIr(
            condition: EsmCallIr(
              callee: EsmIdentifierIr('test'),
              arguments: [EsmIdentifierIr('value')],
            ),
            thenBody: [EsmReturnStatementIr(EsmIdentifierIr('value'))],
            otherwiseBody: null,
          ),
          EsmThrowStatementIr(
            EsmNewIr(
              callee: EsmIdentifierIr('TypeError'),
              arguments: [
                EsmBinaryIr(
                  left: EsmStringLiteralIr('Type cast failed: expected '),
                  operator: '+',
                  right: EsmIdentifierIr('typeName'),
                ),
              ],
            ),
          ),
        ],
      ),
    };
  }
}

final class EsmRuntimeHelperUseSet {
  final _helpers = <EsmRuntimeHelper>{};

  bool add(EsmRuntimeHelper helper) {
    switch (helper) {
      case EsmRuntimeHelper.bigIntBitLength:
      case EsmRuntimeHelper.bigIntParse:
      case EsmRuntimeHelper.compare:
      case EsmRuntimeHelper.coreError:
      case EsmRuntimeHelper.constValue:
      case EsmRuntimeHelper.customHashMap:
      case EsmRuntimeHelper.doubleParse:
      case EsmRuntimeHelper.doubleValue:
      case EsmRuntimeHelper.dynamicCall:
      case EsmRuntimeHelper.dynamicGet:
      case EsmRuntimeHelper.dynamicInvoke:
      case EsmRuntimeHelper.dynamicSet:
      case EsmRuntimeHelper.enumAsNameMap:
      case EsmRuntimeHelper.enumByName:
      case EsmRuntimeHelper.encoding:
      case EsmRuntimeHelper.expando:
      case EsmRuntimeHelper.extensionTypeRep:
      case EsmRuntimeHelper.finalizer:
      case EsmRuntimeHelper.listFactory:
      case EsmRuntimeHelper.listRangeOps:
      case EsmRuntimeHelper.intGcd:
      case EsmRuntimeHelper.iterableSearch:
      case EsmRuntimeHelper.iterableWindow:
      case EsmRuntimeHelper.mathPoint:
      case EsmRuntimeHelper.mathRandom:
      case EsmRuntimeHelper.stringFactory:
      case EsmRuntimeHelper.stringOps:
      case EsmRuntimeHelper.weakReference:
        break;
      case EsmRuntimeHelper.pattern:
        _helpers.add(EsmRuntimeHelper.stringOps);
      case EsmRuntimeHelper.regExp:
        _helpers.add(EsmRuntimeHelper.pattern);
      case EsmRuntimeHelper.regExpEscape:
        break;
      case EsmRuntimeHelper.stringBuffer:
        _helpers.add(EsmRuntimeHelper.stringify);
      case EsmRuntimeHelper.constMap:
        _helpers.add(EsmRuntimeHelper.mapFactories);
        _helpers.add(EsmRuntimeHelper.mapAddAll);
        _helpers.add(EsmRuntimeHelper.mapSet);
        _helpers.add(EsmRuntimeHelper.mapGet);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.constSet:
        _helpers.add(EsmRuntimeHelper.setAddAll);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.intModular:
        _helpers.add(EsmRuntimeHelper.coreError);
      case EsmRuntimeHelper.equals:
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.isRecord:
        _helpers.add(EsmRuntimeHelper.recordShape);
      case EsmRuntimeHelper.record:
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.objectRuntimeType:
        _helpers.add(EsmRuntimeHelper.type);
      case EsmRuntimeHelper.functionApply:
      case EsmRuntimeHelper.intParse:
      case EsmRuntimeHelper.iterator:
      case EsmRuntimeHelper.lazyField:
      case EsmRuntimeHelper.listAdd:
      case EsmRuntimeHelper.listAddAll:
      case EsmRuntimeHelper.nullCheck:
        break;
      case EsmRuntimeHelper.print:
        _helpers.add(EsmRuntimeHelper.stringify);
      case EsmRuntimeHelper.listMutation:
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.listSearch:
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mapAddAll:
      case EsmRuntimeHelper.mapSet:
        _helpers.add(EsmRuntimeHelper.mapGet);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mapContainsKey:
      case EsmRuntimeHelper.mapGet:
        _helpers.add(EsmRuntimeHelper.mapGet);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mapFactories:
        _helpers.add(EsmRuntimeHelper.mapAddAll);
        _helpers.add(EsmRuntimeHelper.mapSet);
        _helpers.add(EsmRuntimeHelper.mapGet);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mapOps:
        _helpers.add(EsmRuntimeHelper.mapSet);
        _helpers.add(EsmRuntimeHelper.mapGet);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.mathRectangle:
        _helpers.add(EsmRuntimeHelper.mathPoint);
      case EsmRuntimeHelper.recordShape:
      case EsmRuntimeHelper.objectHash:
      case EsmRuntimeHelper.safeToString:
      case EsmRuntimeHelper.stringify:
      case EsmRuntimeHelper.symbol:
      case EsmRuntimeHelper.throwWithStackTrace:
      case EsmRuntimeHelper.type:
      case EsmRuntimeHelper.typeCast:
        break;
      case EsmRuntimeHelper.uri:
        _helpers.add(EsmRuntimeHelper.coreError);
      case EsmRuntimeHelper.setAddAll:
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.setOps:
        _helpers.add(EsmRuntimeHelper.setAddAll);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.splayTree:
        _helpers.add(EsmRuntimeHelper.compare);
        _helpers.add(EsmRuntimeHelper.setAddAll);
        _helpers.add(EsmRuntimeHelper.mapAddAll);
        _helpers.add(EsmRuntimeHelper.mapSet);
        _helpers.add(EsmRuntimeHelper.mapGet);
        _helpers.add(EsmRuntimeHelper.equals);
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
    }
    return _helpers.add(helper);
  }

  bool contains(EsmRuntimeHelper helper) => _helpers.contains(helper);

  List<EsmRuntimeHelper> toList() {
    return EsmRuntimeHelper.values
        .where(_helpers.contains)
        .toList(growable: false);
  }
}
