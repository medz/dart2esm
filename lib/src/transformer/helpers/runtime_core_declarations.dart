part of 'runtime_helpers.dart';

extension _Corehelperdeclaration on EsmRuntimeHelperRegistry {
  EsmModuleItem _coreHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.compare => EsmRawModuleItem('''
function __dartCompare(left, right, compare = null) {
  if (typeof compare === "function") return Number(compare(left, right));
  const compareTo = left == null ? null : left.compareTo;
  if (typeof compareTo === "function") return Number(compareTo.call(left, right));
  return left < right ? -1 : left > right ? 1 : 0;
}
'''),
      EsmRuntimeHelper.coreError => EsmRawModuleItem('''
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
      EsmRuntimeHelper.argumentChecks => EsmRawModuleItem('''
function __dartCheckNotNull(value, name = null) {
  if (value == null) throw __dartCoreError("ArgumentError", name == null ? "null value" : String(name) + " must not be null");
  return value;
}
'''),
      EsmRuntimeHelper.constValue => EsmRawModuleItem('''
const __dartConstValues = new Map();
function __dartConst(key, create) {
  if (!__dartConstValues.has(key)) {
    __dartConstValues.set(key, create());
  }
  return __dartConstValues.get(key);
}
'''),
      EsmRuntimeHelper.constSet => EsmRawModuleItem('''
function __dartConstSet(values) {
  const set = __dartSetFrom(values);
  const throwConst = () => { throw new TypeError("Cannot modify const Set"); };
  Object.defineProperty(set, "add", { value: throwConst });
  Object.defineProperty(set, "delete", { value: throwConst });
  Object.defineProperty(set, "clear", { value: throwConst });
  return Object.freeze(set);
}
'''),
      EsmRuntimeHelper.constMap => EsmRawModuleItem('''
function __dartConstMap(entries) {
  const map = __dartMapFromEntries(entries);
  const throwConst = () => { throw new TypeError("Cannot modify const Map"); };
  Object.defineProperty(map, "set", { value: throwConst });
  Object.defineProperty(map, "delete", { value: throwConst });
  Object.defineProperty(map, "clear", { value: throwConst });
  return Object.freeze(map);
}
'''),
      EsmRuntimeHelper.enumAsNameMap => EsmRawModuleItem('''
function __dartEnumAsNameMap(values) {
  const map = new Map();
  for (const value of values) map.set(value.name, value);
  return map;
}
'''),
      EsmRuntimeHelper.enumByName => EsmRawModuleItem('''
function __dartEnumByName(values, name) {
  for (const value of values) {
    if (value.name === name) return value;
  }
  throw new RangeError("No enum value with name " + name);
}
'''),
      EsmRuntimeHelper.extensionTypeRep => EsmRawModuleItem('''
function __dartExtensionTypeRep(value, field) {
  if (value != null && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, field)) return value[field];
  return value;
}
'''),
      EsmRuntimeHelper.equals => EsmRawModuleItem('''
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
      EsmRuntimeHelper.functionApply => EsmRawModuleItem('''
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
      EsmRuntimeHelper.objectRuntimeType => EsmRawModuleItem('''
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
      EsmRuntimeHelper.safeToString => EsmRawModuleItem('''
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
      EsmRuntimeHelper.nullCheck => EsmRawModuleItem('''
function __dartNullCheck(value) {
  if (value == null) throw new TypeError("Null check operator used on a null value");
  return value;
}
'''),
      EsmRuntimeHelper.objectHash => EsmRawModuleItem(r'''
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
      EsmRuntimeHelper.print => EsmFunction(
        name: name(helper),
        export: false,
        parameters: const [EsmIdentifierParameter(name: 'value')],
        body: const [
          EsmExpressionStatement(
            EsmCall(
              callee: EsmPropertyAccess(
                receiver: EsmIdentifier('console'),
                property: 'log',
              ),
              arguments: [
                EsmCall(
                  callee: EsmIdentifier('__dartStr'),
                  arguments: [EsmIdentifier('value')],
                ),
              ],
            ),
          ),
        ],
      ),
      EsmRuntimeHelper.rangeChecks => EsmRawModuleItem('''
function __dartCheckValueInInterval(value, minValue, maxValue, name = null, message = null) {
  if (value < minValue || value > maxValue) throw __dartCoreError("RangeError", message ?? (String(name ?? "value") + " out of range"));
  return value;
}
function __dartCheckValidIndex(index, indexable, name = null, length = null, message = null) {
  length ??= indexable.length;
  if (index < 0 || index >= length) throw __dartCoreError("RangeError", message ?? (String(name ?? "index") + " out of range"));
  return index;
}
function __dartCheckValidRange(start, end, length, startName = null, endName = null, message = null) {
  if (start < 0 || start > length) throw __dartCoreError("RangeError", message ?? (String(startName ?? "start") + " out of range"));
  if (end == null) return length;
  if (end < start || end > length) throw __dartCoreError("RangeError", message ?? (String(endName ?? "end") + " out of range"));
  return end;
}
function __dartCheckNotNegative(value, name = null, message = null) {
  if (value < 0) throw __dartCoreError("RangeError", message ?? (String(name ?? "index") + " must not be negative"));
  return value;
}
'''),
      EsmRuntimeHelper.stringify => EsmRawModuleItem(r'''
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
      EsmRuntimeHelper.symbol => EsmRawModuleItem('''
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
      EsmRuntimeHelper.throwWithStackTrace => EsmRawModuleItem('''
function __dartThrowWithStackTrace(error, stackTrace) {
  if (error != null && (typeof error === "object" || typeof error === "function")) {
    try { error.stack = String(stackTrace); } catch (_) {}
  }
  throw error;
}
'''),
      EsmRuntimeHelper.type => EsmRawModuleItem('''
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
      EsmRuntimeHelper.typeCast => EsmFunction(
        name: name(helper),
        export: false,
        parameters: const [
          EsmIdentifierParameter(name: 'value'),
          EsmIdentifierParameter(name: 'test'),
          EsmIdentifierParameter(name: 'typeName'),
        ],
        body: const [
          EsmIfStatement(
            condition: EsmCall(
              callee: EsmIdentifier('test'),
              arguments: [EsmIdentifier('value')],
            ),
            thenBody: [EsmReturnStatement(EsmIdentifier('value'))],
            otherwiseBody: null,
          ),
          EsmThrowStatement(
            EsmNew(
              callee: EsmIdentifier('TypeError'),
              arguments: [
                EsmBinary(
                  left: EsmStringLiteral('Type cast failed: expected '),
                  operator: EsmBinaryOperator.add,
                  right: EsmIdentifier('typeName'),
                ),
              ],
            ),
          ),
        ],
      ),
      _ => throw StateError('Unexpected runtime helper declaration: $helper'),
    };
  }
}
