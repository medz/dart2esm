import '../ir/esm_ir.dart';

enum EsmRuntimeHelper {
  coreError,
  constMap,
  constSet,
  constValue,
  dynamicCall,
  equals,
  enumAsNameMap,
  enumByName,
  functionApply,
  lazyField,
  nullCheck,
  print,
  recordShape,
  isRecord,
  record,
  safeToString,
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
    '__dartEnumAsNameMap',
    '__dartEnumByName',
    '__dartEquals',
    '__dartFunctionApply',
    '__dartLazyField',
    '__dartIsRecord',
    '__dartIsCoreError',
    '__dartNullCheck',
    '__dartPrint',
    '__dartRecord',
    '__dartRecordShape',
    '__dartSafeToString',
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
      EsmRuntimeHelper.equals => '__dartEquals',
      EsmRuntimeHelper.enumAsNameMap => '__dartEnumAsNameMap',
      EsmRuntimeHelper.enumByName => '__dartEnumByName',
      EsmRuntimeHelper.functionApply => '__dartFunctionApply',
      EsmRuntimeHelper.isRecord => '__dartIsRecord',
      EsmRuntimeHelper.lazyField => '__dartLazyField',
      EsmRuntimeHelper.nullCheck => '__dartNullCheck',
      EsmRuntimeHelper.print => '__dartPrint',
      EsmRuntimeHelper.record => '__dartRecord',
      EsmRuntimeHelper.recordShape => '__dartRecordShape',
      EsmRuntimeHelper.safeToString => '__dartSafeToString',
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
      EsmRuntimeHelper.nullCheck => EsmRawModuleItemIr('''
function __dartNullCheck(value) {
  if (value == null) throw new TypeError("Null check operator used on a null value");
  return value;
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
              arguments: [EsmIdentifierIr('value')],
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
      case EsmRuntimeHelper.enumAsNameMap:
      case EsmRuntimeHelper.enumByName:
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
      case EsmRuntimeHelper.lazyField:
      case EsmRuntimeHelper.nullCheck:
      case EsmRuntimeHelper.print:
      case EsmRuntimeHelper.recordShape:
      case EsmRuntimeHelper.safeToString:
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
