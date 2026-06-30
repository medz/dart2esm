import '../ir/esm_ir.dart';

enum EsmRuntimeHelper {
  coreError,
  constMap,
  constSet,
  constValue,
  dynamicCall,
  dynamicGet,
  dynamicInvoke,
  dynamicSet,
  equals,
  enumAsNameMap,
  enumByName,
  extensionTypeRep,
  functionApply,
  intParse,
  iterator,
  lazyField,
  listAdd,
  listAddAll,
  mapAddAll,
  mapSet,
  nullCheck,
  objectHash,
  print,
  recordShape,
  isRecord,
  record,
  safeToString,
  setAddAll,
  stringify,
  symbol,
  throwWithStackTrace,
  type,
  typeCast,
}

final class EsmRuntimeHelperRegistry {
  const EsmRuntimeHelperRegistry();

  static const generatedGlobalNames = {
    '__dartAs',
    '__dartCoreError',
    '__dartConst',
    '__dartConstMap',
    '__dartConstSet',
    '__dartConstValues',
    '__dartDynamicCall',
    '__dartDynamicGet',
    '__dartDynamicInvoke',
    '__dartDynamicSet',
    '__dartEnumAsNameMap',
    '__dartEnumByName',
    '__dartEquals',
    '__dartExtensionTypeRep',
    '__dartFunctionApply',
    '__dartFormatException',
    '__dartIntParse',
    '__dartIntTryParse',
    '__dartIterator',
    '__dartLazyField',
    '__dartListAdd',
    '__dartListAddAll',
    '__dartMapAddAll',
    '__dartMapSet',
    '__dartCombineHash',
    '__dartFinishHash',
    '__dartHashValue',
    '__dartIdentityHashes',
    '__dartNextIdentityHash',
    '__dartIsRecord',
    '__dartIsCoreError',
    '__dartNullCheck',
    '__dartObjectHash',
    '__dartObjectHashUnordered',
    '__dartPrint',
    '__dartRecord',
    '__dartRecordShape',
    '__dartSafeToString',
    '__dartSetAddAll',
    '__dartStr',
    '__dartSymbol',
    '__dartSymbolCache',
    '__dartThrowWithStackTrace',
    '__dartType',
    '__dartTypeCache',
  };

  String name(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.coreError => '__dartCoreError',
      EsmRuntimeHelper.constMap => '__dartConstMap',
      EsmRuntimeHelper.constSet => '__dartConstSet',
      EsmRuntimeHelper.constValue => '__dartConst',
      EsmRuntimeHelper.dynamicCall => '__dartDynamicCall',
      EsmRuntimeHelper.dynamicGet => '__dartDynamicGet',
      EsmRuntimeHelper.dynamicInvoke => '__dartDynamicInvoke',
      EsmRuntimeHelper.dynamicSet => '__dartDynamicSet',
      EsmRuntimeHelper.equals => '__dartEquals',
      EsmRuntimeHelper.enumAsNameMap => '__dartEnumAsNameMap',
      EsmRuntimeHelper.enumByName => '__dartEnumByName',
      EsmRuntimeHelper.extensionTypeRep => '__dartExtensionTypeRep',
      EsmRuntimeHelper.functionApply => '__dartFunctionApply',
      EsmRuntimeHelper.intParse => '__dartIntParse',
      EsmRuntimeHelper.iterator => '__dartIterator',
      EsmRuntimeHelper.isRecord => '__dartIsRecord',
      EsmRuntimeHelper.lazyField => '__dartLazyField',
      EsmRuntimeHelper.listAdd => '__dartListAdd',
      EsmRuntimeHelper.listAddAll => '__dartListAddAll',
      EsmRuntimeHelper.mapAddAll => '__dartMapAddAll',
      EsmRuntimeHelper.mapSet => '__dartMapSet',
      EsmRuntimeHelper.nullCheck => '__dartNullCheck',
      EsmRuntimeHelper.objectHash => '__dartObjectHash',
      EsmRuntimeHelper.print => '__dartPrint',
      EsmRuntimeHelper.record => '__dartRecord',
      EsmRuntimeHelper.recordShape => '__dartRecordShape',
      EsmRuntimeHelper.safeToString => '__dartSafeToString',
      EsmRuntimeHelper.setAddAll => '__dartSetAddAll',
      EsmRuntimeHelper.stringify => '__dartStr',
      EsmRuntimeHelper.symbol => '__dartSymbol',
      EsmRuntimeHelper.throwWithStackTrace => '__dartThrowWithStackTrace',
      EsmRuntimeHelper.type => '__dartType',
      EsmRuntimeHelper.typeCast => '__dartAs',
    };
  }

  EsmIdentifierIr reference(EsmRuntimeHelper helper) {
    return EsmIdentifierIr(name(helper));
  }

  EsmModuleItemIr declaration(EsmRuntimeHelper helper) {
    return switch (helper) {
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
      EsmRuntimeHelper.constSet => EsmRawModuleItemIr('''
function __dartConstSet(values) {
  const set = new Set(values);
  const throwConst = () => { throw new TypeError("Cannot modify const Set"); };
  Object.defineProperty(set, "add", { value: throwConst });
  Object.defineProperty(set, "delete", { value: throwConst });
  Object.defineProperty(set, "clear", { value: throwConst });
  return Object.freeze(set);
}
'''),
      EsmRuntimeHelper.constMap => EsmRawModuleItemIr('''
function __dartConstMap(entries) {
  const map = new Map(entries);
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
function __dartSetAddAll(set, values) {
  for (const value of values) set.add(value);
  return null;
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
      EsmRuntimeHelper.mapSet => EsmRawModuleItemIr('''
function __dartMapSet(map, key, value) {
  map.set(key, value);
  return null;
}
'''),
      EsmRuntimeHelper.mapAddAll => EsmRawModuleItemIr('''
function __dartMapAddAll(map, entries) {
  for (const [key, value] of entries) map.set(key, value);
  return null;
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
      case EsmRuntimeHelper.coreError:
      case EsmRuntimeHelper.constValue:
      case EsmRuntimeHelper.constMap:
      case EsmRuntimeHelper.constSet:
      case EsmRuntimeHelper.dynamicCall:
      case EsmRuntimeHelper.dynamicGet:
      case EsmRuntimeHelper.dynamicInvoke:
      case EsmRuntimeHelper.dynamicSet:
      case EsmRuntimeHelper.enumAsNameMap:
      case EsmRuntimeHelper.enumByName:
      case EsmRuntimeHelper.extensionTypeRep:
        break;
      case EsmRuntimeHelper.equals:
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.isRecord:
        _helpers.add(EsmRuntimeHelper.recordShape);
      case EsmRuntimeHelper.record:
        _helpers.add(EsmRuntimeHelper.recordShape);
        _helpers.add(EsmRuntimeHelper.isRecord);
      case EsmRuntimeHelper.functionApply:
      case EsmRuntimeHelper.intParse:
      case EsmRuntimeHelper.iterator:
      case EsmRuntimeHelper.lazyField:
      case EsmRuntimeHelper.listAdd:
      case EsmRuntimeHelper.listAddAll:
      case EsmRuntimeHelper.mapAddAll:
      case EsmRuntimeHelper.mapSet:
      case EsmRuntimeHelper.nullCheck:
      case EsmRuntimeHelper.print:
        _helpers.add(EsmRuntimeHelper.stringify);
      case EsmRuntimeHelper.recordShape:
      case EsmRuntimeHelper.objectHash:
      case EsmRuntimeHelper.safeToString:
      case EsmRuntimeHelper.setAddAll:
      case EsmRuntimeHelper.stringify:
      case EsmRuntimeHelper.symbol:
      case EsmRuntimeHelper.throwWithStackTrace:
      case EsmRuntimeHelper.type:
      case EsmRuntimeHelper.typeCast:
        break;
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
