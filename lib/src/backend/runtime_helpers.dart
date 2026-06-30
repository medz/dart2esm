import 'dart:collection';

enum EsmRuntimeHelperCategory {
  core,
  async,
  stream,
  convert,
  collection,
  jsInterop,
  sdk,
}

final class EsmRuntimeHelperSpec {
  const EsmRuntimeHelperSpec({
    required this.name,
    required this.category,
    this.dependencies = const [],
    this.description = '',
    this.source,
  });

  final String name;
  final EsmRuntimeHelperCategory category;
  final List<String> dependencies;
  final String description;
  final String? source;
}

final class EsmRuntimeHelperUseSet extends SetBase<String> {
  EsmRuntimeHelperUseSet([Iterable<String> helpers = const []]) {
    addAll(helpers);
  }

  final _helpers = <String>{};

  @override
  bool add(String value) => _helpers.add(value);

  @override
  bool contains(Object? element) => _helpers.contains(element);

  @override
  Iterator<String> get iterator => _helpers.iterator;

  @override
  int get length => _helpers.length;

  @override
  String? lookup(Object? object) => _helpers.lookup(object);

  @override
  bool remove(Object? value) => _helpers.remove(value);

  @override
  Set<String> toSet() => _helpers.toSet();

  void closeDependencies() {
    addAll(resolveEsmRuntimeHelperDependencies(_helpers));
  }

  bool get usesLegacyStreamRuntime => any(isEsmLegacyStreamRuntimeHelper);

  String? registeredSource(String name) => esmRuntimeHelperSource(name);
}

const esmRuntimeGlobalNames = {
  '__dartAs',
  '__dartAsyncError',
  '__dartAsciiCodec',
  '__dartAsciiDecode',
  '__dartAsciiDecoder',
  '__dartAsciiEncode',
  '__dartAsciiEncoder',
  '__dartBase64Codec',
  '__dartBase64Decode',
  '__dartBase64Decoder',
  '__dartBase64Encode',
  '__dartBase64Encoder',
  '__dartBase64Normalize',
  '__dartBind',
  '__dartBigIntBitLength',
  '__dartBigIntParse',
  '__dartBoundSubscriptionStream',
  '__dartBytesBuilder',
  '__dartByteConversionSink',
  '__dartByteConversionSinkFrom',
  '__dartCall',
  '__dartChunkedConversionSink',
  '__dartCompleter',
  '__dartConst',
  '__dartConstMap',
  '__dartConstSet',
  '__dartConstValues',
  '__dartConverterBind',
  '__dartConverterConvert',
  '__dartConverterFuse',
  '__dartConverterStartChunked',
  '__dartCompare',
  '__dartCoreError',
  '__dartCreateZone',
  '__dartCurrentZone',
  '__dartCustomHashMap',
  '__dartDateTime',
  '__dartDateTimeCopyWith',
  '__dartDateTimeFromMicros',
  '__dartDateTimeFromParts',
  '__dartDateTimeParse',
  '__dartDeveloperServiceInfo',
  '__dartDeveloperUserTag',
  '__dartDouble',
  '__dartDoubleParse',
  '__dartDoubleTryParse',
  '__dartDuration',
  '__dartDurationToString',
  '__dartEnumAsNameMap',
  '__dartEnumByName',
  '__dartExtensionTypeRep',
  '__dartExpando',
  '__dartEquals',
  '__dartFinalizer',
  '__dartFixedList',
  '__dartFormatException',
  '__dartFunctionApply',
  '__dartFromJson',
  '__dartFutureAsStream',
  '__dartFutureDoWhile',
  '__dartFutureForEach',
  '__dartFutureIterableWait',
  '__dartFutureRecordWait',
  '__dartFutureTimeout',
  '__dartFutureWaitAllSettled',
  '__dartFutureWait',
  '__dartGet',
  '__dartIndexGet',
  '__dartIndexSet',
  '__dartIntGcd',
  '__dartIntModInverse',
  '__dartIntModPow',
  '__dartIntParse',
  '__dartIntToRadixString',
  '__dartIntTryParse',
  '__dartInvocation',
  '__dartIterableContains',
  '__dartIterableElementAtOrNull',
  '__dartIterableFirst',
  '__dartIterableFirstOrNull',
  '__dartIterableFirstWhere',
  '__dartIterableIsEmpty',
  '__dartIterableJoin',
  '__dartIterableLast',
  '__dartIterableLastOrNull',
  '__dartIterableLastWhere',
  '__dartIterableLength',
  '__dartIterableNoElement',
  '__dartIterableSkipWhile',
  '__dartIterableSingle',
  '__dartIterableSingleOrNull',
  '__dartIterableSingleWhere',
  '__dartIterableTakeWhile',
  '__dartCombineHash',
  '__dartFinishHash',
  '__dartHashValue',
  '__dartHtmlEscape',
  '__dartHtmlEscapeChar',
  '__dartHtmlEscapeMode',
  '__dartIdentityHashes',
  '__dartIdentityMap',
  '__dartIdentitySet',
  '__dartIsCoreError',
  '__dartIsRecord',
  '__dartIterator',
  '__dartIsolate',
  '__dartIsolateSpawn',
  '__dartJsonCodec',
  '__dartJsonDecode',
  '__dartJsonDecoder',
  '__dartJsonEncode',
  '__dartJsonEncoder',
  '__dartJsonRevive',
  '__dartJsonUtf8Encoder',
  '__dartLazyField',
  '__dartLatin1Codec',
  '__dartLatin1Decode',
  '__dartLatin1Decoder',
  '__dartLatin1Encode',
  '__dartLatin1Encoder',
  '__dartLineSplit',
  '__dartLineSplitterBind',
  '__dartLineSplitter',
  '__dartLineSplitterSink',
  '__dartListAsMap',
  '__dartListCopyRange',
  '__dartListIndexOf',
  '__dartListLastIndexOf',
  '__dartListRemove',
  '__dartListLastIndexWhere',
  '__dartListRemoveWhere',
  '__dartListRetainWhere',
  '__dartListSetAll',
  '__dartListSetRange',
  '__dartListShuffle',
  '__dartListSort',
  '__dartListWhereMutate',
  '__dartListWriteIterable',
  '__dartUnmodifiableListView',
  '__dartUnmodifiableMapView',
  '__dartMapAddAll',
  '__dartMapAddEntries',
  '__dartMapBaseValues',
  '__dartMapContainsKey',
  '__dartMapContainsValue',
  '__dartMapFromEntries',
  '__dartMapFromIterable',
  '__dartMapFromIterables',
  '__dartMapForEach',
  '__dartMapGet',
  '__dartMapKey',
  '__dartMapMap',
  '__dartMapMissingKey',
  '__dartMapPutIfAbsent',
  '__dartMapRemove',
  '__dartMapRemoveWhere',
  '__dartMapSet',
  '__dartMapUpdate',
  '__dartMapUpdateAll',
  '__dartNoSuchMethod',
  '__dartNullCheck',
  '__dartNumClamp',
  '__dartNumParse',
  '__dartNumberParse',
  '__dartNumTryParse',
  '__dartNextIdentityHash',
  '__dartObjectHash',
  '__dartObjectHashUnordered',
  '__dartObjectToString',
  '__dartPatternAllMatches',
  '__dartPatternMatchAsPrefix',
  '__dartPatternRegExp',
  '__dartParallelWaitError',
  '__dartPoint',
  '__dartPrint',
  '__dartRandom',
  '__dartRecord',
  '__dartRecordShape',
  '__dartRangeChecks',
  '__dartRegExp',
  '__dartRegExpEscape',
  '__dartRegExpMatch',
  '__dartRawReceivePort',
  '__dartReceivePort',
  '__dartRectangle',
  '__dartRectangleFromPoints',
  '__dartRuntimeType',
  '__dartRootZone',
  '__dartRoundToInt',
  '__dartRunInZone',
  '__dartRunZoned',
  '__dartRunZonedGuarded',
  '__dartScheduleMicrotask',
  '__dartSafeToString',
  '__dartSendPort',
  '__dartSet',
  '__dartSetAdd',
  '__dartSetAddAll',
  '__dartSetAlgebra',
  '__dartSetContainsAll',
  '__dartSetDifference',
  '__dartSetFrom',
  '__dartSetIntersection',
  '__dartSetLookup',
  '__dartSetRemoveAll',
  '__dartSetRemove',
  '__dartSetRetainAll',
  '__dartSetRemoveWhere',
  '__dartSetRetainWhere',
  '__dartSetUnion',
  '__dartSetWhereMutate',
  '__dartShr',
  '__dartSinkAdd',
  '__dartSinkClose',
  '__dartSplaySortMap',
  '__dartSplaySortSet',
  '__dartSplayTreeMap',
  '__dartSplayTreeMapFromEntries',
  '__dartSplayTreeSet',
  '__dartSplayTreeSetFrom',
  '__dartStr',
  '__dartStreamAny',
  '__dartStreamAsBroadcastStream',
  '__dartStreamAsyncExpand',
  '__dartStreamAsyncMap',
  '__dartStreamCast',
  '__dartStreamContains',
  '__dartStreamDistinct',
  '__dartStreamDrain',
  '__dartStreamEvery',
  '__dartStreamEventTransformed',
  '__dartStreamExpand',
  '__dartStreamFirst',
  '__dartStreamFirstWhere',
  '__dartStreamFold',
  '__dartStreamForEach',
  '__dartStreamError',
  '__dartStreamFromFuture',
  '__dartStreamFromFutures',
  '__dartStreamFromIterable',
  '__dartStreamHandleError',
  '__dartStreamIsEmpty',
  '__dartStreamIterable',
  '__dartStreamJoin',
  '__dartStreamLast',
  '__dartStreamLastWhere',
  '__dartStreamLength',
  '__dartStreamListen',
  '__dartStreamMap',
  '__dartStreamMulti',
  '__dartStreamPeriodic',
  '__dartStreamPipe',
  '__dartStreamReduce',
  '__dartStreamSkip',
  '__dartStreamSkipWhile',
  '__dartStreamSingle',
  '__dartStreamSingleWhere',
  '__dartStreamTake',
  '__dartStreamTakeWhile',
  '__dartStreamTimeout',
  '__dartStreamToList',
  '__dartStreamToSet',
  '__dartStreamTransform',
  '__dartStreamTransformerBind',
  '__dartStreamTransformerFromBind',
  '__dartStreamTransformerFromHandlers',
  '__dartStreamWhere',
  '__dartStreamController',
  '__dartStreamIterator',
  '__dartStringBuffer',
  '__dartStringConversionSink',
  '__dartStringConversionSinkAsUtf8Sink',
  '__dartStringConversionSinkFrom',
  '__dartStringConversionSinkFromStringSink',
  '__dartStringAllMatches',
  '__dartStringContains',
  '__dartStringIndexOf',
  '__dartStringLastIndexOf',
  '__dartStringMatchAsPrefix',
  '__dartStringPattern',
  '__dartStringPatternMatches',
  '__dartStringReplaceAllMapped',
  '__dartStringReplaceFirst',
  '__dartStringReplaceFirstMapped',
  '__dartStringReplaceFirstPattern',
  '__dartStringReplaceAll',
  '__dartStringReplaceStringMapped',
  '__dartStringSplitMapJoin',
  '__dartStringMatch',
  '__dartJsRegExpReplacementMatch',
  '__dartStringReplaceRange',
  '__dartStringSplit',
  '__dartStringStartsWith',
  '__dartThrowWithStackTrace',
  '__dartTruncDiv',
  '__dartStopwatch',
  '__dartStopwatchNowMicros',
  '__dartSymbol',
  '__dartSymbolCache',
  '__dartTimer',
  '__dartToJson',
  '__dartType',
  '__dartTypeCache',
  '__dartTypedDataSublistView',
  '__dartUri',
  '__dartUriAssignQueryParameters',
  '__dartUriBuild',
  '__dartUriBuildQuery',
  '__dartUriData',
  '__dartUriDataFromBytes',
  '__dartUriDataFromString',
  '__dartUriDataMediaType',
  '__dartUriDataParameters',
  '__dartUriDecodeQueryComponent',
  '__dartUriEncodeQueryComponent',
  '__dartUriEncodePath',
  '__dartUriFile',
  '__dartUriNormalizePath',
  '__dartUriParse',
  '__dartUriPercentEncodeBytes',
  '__dartUriReplace',
  '__dartUriResolve',
  '__dartUriSplitQueryString',
  '__dartUtf8Codec',
  '__dartUtf8Decode',
  '__dartUtf8Decoder',
  '__dartUtf8Encode',
  '__dartUtf8Encoder',
  '__dartWeakReference',
  '__dartZoneValuesMap',
};

const _dartStrSource = r'''function __dartStr(value) {
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
}''';

const _dartDoubleSource = r'''function __dartDouble(value) {
  const number = Number(value);
  const boxed = new Number(number);
  Object.defineProperty(boxed, "__dartType", { value: "double" });
  Object.defineProperty(boxed, "toString", { value() {
    if (Number.isNaN(number)) return "NaN";
    if (number === Infinity) return "Infinity";
    if (number === -Infinity) return "-Infinity";
    if (Object.is(number, -0)) return "-0.0";
    return Number.isInteger(number) ? String(number) + ".0" : String(number);
  } });
  return boxed;
}''';

const _dartObjectToStringSource = r'''function __dartObjectToString(value) {
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
}''';

const _dartSafeToStringSource = r'''function __dartSafeToString(value) {
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
}''';

const _dartThrowWithStackTraceSource =
    r'''function __dartThrowWithStackTrace(error, stackTrace) {
  if (error != null && (typeof error === "object" || typeof error === "function")) {
    try { error.stack = String(stackTrace); } catch (_) {}
  }
  throw error;
}''';

const _dartPrintSource = r'''function __dartPrint(value) {
  console.log(__dartStr(value));
}''';

const _dartStringBufferSource = r'''function __dartStringBuffer(initial = "") {
  let value = initial == null ? "" : String(initial);
  return {
    write(next) { value += String(next); },
    writeAll(values, separator = "") { const parts = []; if (values != null && typeof values["[]"] === "function" && typeof values.length === "number") { for (let index = 0; index < values.length; index++) parts.push(String(values["[]"](index))); } else { for (const item of values) parts.push(String(item)); } value += parts.join(String(separator)); },
    writeCharCode(charCode) { value += String.fromCodePoint(charCode); },
    writeln(next = "") { value += String(next) + "\n"; },
    clear() { value = ""; },
    toString() { return value; },
    get length() { return value.length; },
    get isEmpty() { return value.length === 0; },
    get isNotEmpty() { return value.length !== 0; },
  };
}''';

const _dartExpandoSource = r'''function __dartExpando(name = null) {
  const values = new WeakMap();
  const expando = {
    get(object) { return values.has(object) ? values.get(object) : null; },
    set(object, value) { values.set(object, value); return null; },
    toString() { return name == null ? "Expando" : "Expando:" + String(name); },
  };
  Object.defineProperty(expando, "__dartType", { value: "Expando" });
  return Object.freeze(expando);
}''';

const _dartWeakReferenceSource = r'''function __dartWeakReference(target) {
  const ref = typeof WeakRef === "function" ? new WeakRef(target) : { deref() { return target; } };
  const weak = {
    get target() { return ref.deref() ?? null; },
    toString() { return "WeakReference"; },
  };
  Object.defineProperty(weak, "__dartType", { value: "WeakReference" });
  return Object.freeze(weak);
}''';

const _dartFinalizerSource = r'''function __dartFinalizer(callback) {
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
    toString() { return "Finalizer"; },
  };
  Object.defineProperty(finalizer, "__dartType", { value: "Finalizer" });
  return Object.freeze(finalizer);
}''';

const _dartMapForEachSource = r'''function __dartMapForEach(map, callback) {
  if (map instanceof Map) {
    map.forEach((value, key) => callback(key, value));
    return null;
  }
  if (map != null && typeof map.forEach === "function") {
    map.forEach(callback);
    return null;
  }
  for (const entry of map) {
    if (Array.isArray(entry)) {
      callback(entry[0], entry[1]);
    } else {
      callback(entry.key, entry.value);
    }
  }
  return null;
}''';

const _dartLazyFieldSource =
    r'''function __dartLazyField(name, initialize, writable, publish) {
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
}''';

const _dartIteratorSource = r'''function __dartIterator(iterable) {
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
}''';

const _dartConstSource = r'''const __dartConstValues = new Map();
function __dartConst(key, create) {
  if (!__dartConstValues.has(key)) {
    __dartConstValues.set(key, create());
  }
  return __dartConstValues.get(key);
}''';

const _dartConstSetSource = r'''function __dartConstSet(values) {
  const set = new Set();
  for (const value of values) __dartSetAdd(set, value);
  const throwConst = () => { throw new TypeError("Cannot modify const Set"); };
  Object.defineProperty(set, "add", { value: throwConst });
  Object.defineProperty(set, "delete", { value: throwConst });
  Object.defineProperty(set, "clear", { value: throwConst });
  return Object.freeze(set);
}''';

const _dartConstMapSource = r'''function __dartConstMap(entries) {
  const map = new Map();
  for (const [key, value] of entries) __dartMapSet(map, key, value);
  const throwConst = () => { throw new TypeError("Cannot modify const Map"); };
  Object.defineProperty(map, "set", { value: throwConst });
  Object.defineProperty(map, "delete", { value: throwConst });
  Object.defineProperty(map, "clear", { value: throwConst });
  return Object.freeze(map);
}''';

const _dartRoundToIntSource = r'''function __dartRoundToInt(value) {
  return value < 0 ? Math.ceil(value - 0.5) : Math.floor(value + 0.5);
}''';

const _dartNumClampSource = r'''function __dartNumClamp(value, lower, upper) {
  if (value < lower) return lower;
  if (value > upper) return upper;
  return value;
}''';

const _dartTruncDivSource = r'''function __dartTruncDiv(left, right) {
  return Math.trunc(left / right);
}''';

const _dartShrSource = r'''function __dartShr(left, right) {
  return Math.floor(left / (2 ** right));
}''';

const _dartRecordShapeSource =
    r'''const __dartRecordShape = Symbol("dart.recordShape");''';

const _dartIsRecordSource = r'''function __dartIsRecord(value) {
  return value != null && typeof value === "object" && Array.isArray(value[__dartRecordShape]);
}''';

const _dartRecordSource = r'''function __dartRecord(positional, named) {
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
}''';

const _dartNullCheckSource = r'''function __dartNullCheck(value) {
  if (value == null) {
    throw new TypeError("Null check operator used on a null value");
  }
  return value;
}''';

const _dartExtensionTypeRepSource =
    r'''function __dartExtensionTypeRep(value, field) {
  if (value != null && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, field)) return value[field];
  return value;
}''';

const _dartJsNumberToDartIntSource =
    r'''function __dartJsNumberToDartInt(value) {
  if (Number.isInteger(value)) return value;
  throw new TypeError("JavaScript number is not a Dart int");
}''';

const _dartJsTrimOptionalArgsSource =
    r'''function __dartJsTrimOptionalArgs(args) {
  const values = Array.from(args);
  while (values.length > 0 && values[values.length - 1] == null) values.pop();
  return values;
}''';

const _dartJsCallMethodOptionalSource =
    r'''function __dartJsCallMethodOptional(receiver, method, args) {
  return receiver[method](...__dartJsTrimOptionalArgs(args));
}''';

const _dartJsInstanceOfStringSource =
    r'''function __dartJsInstanceOfString(value, constructorName) {
  if (constructorName == null) return false;
  const text = String(constructorName);
  if (text.length === 0) return false;
  let constructor = globalThis;
  for (const part of text.split(".")) {
    constructor = constructor?.[part];
    if (constructor == null) return false;
  }
  return typeof constructor === "function" && value instanceof constructor;
}''';

const _dartJsConstructOptionalSource =
    r'''function __dartJsConstructOptional(constructor, args) {
  return new constructor(...__dartJsTrimOptionalArgs(args));
}''';

const _helperSpecs = <String, EsmRuntimeHelperSpec>{
  '__dartPrint': EsmRuntimeHelperSpec(
    name: '__dartPrint',
    category: EsmRuntimeHelperCategory.core,
    dependencies: ['__dartStr'],
    description: 'Dart print() sink backed by console.log.',
    source: _dartPrintSource,
  ),
  '__dartStr': EsmRuntimeHelperSpec(
    name: '__dartStr',
    category: EsmRuntimeHelperCategory.core,
    source: _dartStrSource,
  ),
  '__dartDouble': EsmRuntimeHelperSpec(
    name: '__dartDouble',
    category: EsmRuntimeHelperCategory.core,
    source: _dartDoubleSource,
  ),
  '__dartObjectToString': EsmRuntimeHelperSpec(
    name: '__dartObjectToString',
    category: EsmRuntimeHelperCategory.core,
    source: _dartObjectToStringSource,
  ),
  '__dartSafeToString': EsmRuntimeHelperSpec(
    name: '__dartSafeToString',
    category: EsmRuntimeHelperCategory.core,
    source: _dartSafeToStringSource,
  ),
  '__dartThrowWithStackTrace': EsmRuntimeHelperSpec(
    name: '__dartThrowWithStackTrace',
    category: EsmRuntimeHelperCategory.core,
    source: _dartThrowWithStackTraceSource,
  ),
  '__dartStringBuffer': EsmRuntimeHelperSpec(
    name: '__dartStringBuffer',
    category: EsmRuntimeHelperCategory.core,
    source: _dartStringBufferSource,
  ),
  '__dartExpando': EsmRuntimeHelperSpec(
    name: '__dartExpando',
    category: EsmRuntimeHelperCategory.core,
    source: _dartExpandoSource,
  ),
  '__dartWeakReference': EsmRuntimeHelperSpec(
    name: '__dartWeakReference',
    category: EsmRuntimeHelperCategory.core,
    source: _dartWeakReferenceSource,
  ),
  '__dartFinalizer': EsmRuntimeHelperSpec(
    name: '__dartFinalizer',
    category: EsmRuntimeHelperCategory.core,
    source: _dartFinalizerSource,
  ),
  '__dartMapForEach': EsmRuntimeHelperSpec(
    name: '__dartMapForEach',
    category: EsmRuntimeHelperCategory.collection,
    source: _dartMapForEachSource,
  ),
  '__dartLazyField': EsmRuntimeHelperSpec(
    name: '__dartLazyField',
    category: EsmRuntimeHelperCategory.core,
    source: _dartLazyFieldSource,
  ),
  '__dartIterator': EsmRuntimeHelperSpec(
    name: '__dartIterator',
    category: EsmRuntimeHelperCategory.collection,
    source: _dartIteratorSource,
  ),
  '__dartConst': EsmRuntimeHelperSpec(
    name: '__dartConst',
    category: EsmRuntimeHelperCategory.core,
    source: _dartConstSource,
  ),
  '__dartConstSet': EsmRuntimeHelperSpec(
    name: '__dartConstSet',
    category: EsmRuntimeHelperCategory.collection,
    dependencies: ['__dartSetAdd'],
    source: _dartConstSetSource,
  ),
  '__dartConstMap': EsmRuntimeHelperSpec(
    name: '__dartConstMap',
    category: EsmRuntimeHelperCategory.collection,
    dependencies: ['__dartMapSet'],
    source: _dartConstMapSource,
  ),
  '__dartRoundToInt': EsmRuntimeHelperSpec(
    name: '__dartRoundToInt',
    category: EsmRuntimeHelperCategory.core,
    source: _dartRoundToIntSource,
  ),
  '__dartNumClamp': EsmRuntimeHelperSpec(
    name: '__dartNumClamp',
    category: EsmRuntimeHelperCategory.core,
    source: _dartNumClampSource,
  ),
  '__dartTruncDiv': EsmRuntimeHelperSpec(
    name: '__dartTruncDiv',
    category: EsmRuntimeHelperCategory.core,
    source: _dartTruncDivSource,
  ),
  '__dartShr': EsmRuntimeHelperSpec(
    name: '__dartShr',
    category: EsmRuntimeHelperCategory.core,
    source: _dartShrSource,
  ),
  '__dartRecordShape': EsmRuntimeHelperSpec(
    name: '__dartRecordShape',
    category: EsmRuntimeHelperCategory.core,
    source: _dartRecordShapeSource,
  ),
  '__dartIsRecord': EsmRuntimeHelperSpec(
    name: '__dartIsRecord',
    category: EsmRuntimeHelperCategory.core,
    dependencies: ['__dartRecordShape'],
    source: _dartIsRecordSource,
  ),
  '__dartRecord': EsmRuntimeHelperSpec(
    name: '__dartRecord',
    category: EsmRuntimeHelperCategory.core,
    dependencies: ['__dartRecordShape', '__dartIsRecord'],
    source: _dartRecordSource,
  ),
  '__dartNullCheck': EsmRuntimeHelperSpec(
    name: '__dartNullCheck',
    category: EsmRuntimeHelperCategory.core,
    source: _dartNullCheckSource,
  ),
  '__dartExtensionTypeRep': EsmRuntimeHelperSpec(
    name: '__dartExtensionTypeRep',
    category: EsmRuntimeHelperCategory.core,
    source: _dartExtensionTypeRepSource,
  ),
  '__dartJsNumberToDartInt': EsmRuntimeHelperSpec(
    name: '__dartJsNumberToDartInt',
    category: EsmRuntimeHelperCategory.jsInterop,
    source: _dartJsNumberToDartIntSource,
  ),
  '__dartJsTrimOptionalArgs': EsmRuntimeHelperSpec(
    name: '__dartJsTrimOptionalArgs',
    category: EsmRuntimeHelperCategory.jsInterop,
    source: _dartJsTrimOptionalArgsSource,
  ),
  '__dartJsCallMethodOptional': EsmRuntimeHelperSpec(
    name: '__dartJsCallMethodOptional',
    category: EsmRuntimeHelperCategory.jsInterop,
    dependencies: ['__dartJsTrimOptionalArgs'],
    source: _dartJsCallMethodOptionalSource,
  ),
  '__dartJsInstanceOfString': EsmRuntimeHelperSpec(
    name: '__dartJsInstanceOfString',
    category: EsmRuntimeHelperCategory.jsInterop,
    source: _dartJsInstanceOfStringSource,
  ),
  '__dartJsConstructOptional': EsmRuntimeHelperSpec(
    name: '__dartJsConstructOptional',
    category: EsmRuntimeHelperCategory.jsInterop,
    dependencies: ['__dartJsTrimOptionalArgs'],
    source: _dartJsConstructOptionalSource,
  ),
  '__dartScheduleMicrotask': EsmRuntimeHelperSpec(
    name: '__dartScheduleMicrotask',
    category: EsmRuntimeHelperCategory.async,
    dependencies: ['__dartZone'],
  ),
  '__dartFutureIterableWait': EsmRuntimeHelperSpec(
    name: '__dartFutureIterableWait',
    category: EsmRuntimeHelperCategory.async,
    dependencies: ['__dartAsyncError', '__dartFutureWaitAllSettled'],
  ),
  '__dartFutureRecordWait': EsmRuntimeHelperSpec(
    name: '__dartFutureRecordWait',
    category: EsmRuntimeHelperCategory.async,
    dependencies: [
      '__dartAsyncError',
      '__dartFutureWaitAllSettled',
      '__dartRecord',
    ],
  ),
  '__dartBoundSubscriptionStream': EsmRuntimeHelperSpec(
    name: '__dartBoundSubscriptionStream',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController'],
  ),
  '__dartReceivePort': EsmRuntimeHelperSpec(
    name: '__dartReceivePort',
    category: EsmRuntimeHelperCategory.async,
    dependencies: [
      '__dartSendPort',
      '__dartStreamController',
      '__dartStreamListen',
    ],
  ),
  '__dartRawReceivePort': EsmRuntimeHelperSpec(
    name: '__dartRawReceivePort',
    category: EsmRuntimeHelperCategory.async,
    dependencies: ['__dartSendPort'],
  ),
  '__dartIsolateSpawn': EsmRuntimeHelperSpec(
    name: '__dartIsolateSpawn',
    category: EsmRuntimeHelperCategory.async,
    dependencies: ['__dartIsolate'],
  ),
  '__dartJsonCodec': EsmRuntimeHelperSpec(
    name: '__dartJsonCodec',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartJsonEncode',
      '__dartJsonDecode',
      '__dartJsonEncoder',
      '__dartJsonDecoder',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartJsonEncoder': EsmRuntimeHelperSpec(
    name: '__dartJsonEncoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartJsonEncode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartJsonUtf8Encoder': EsmRuntimeHelperSpec(
    name: '__dartJsonUtf8Encoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartJsonEncode',
      '__dartUtf8Encode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartJsonDecoder': EsmRuntimeHelperSpec(
    name: '__dartJsonDecoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartJsonDecode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartJsonEncode': EsmRuntimeHelperSpec(
    name: '__dartJsonEncode',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartToJson'],
  ),
  '__dartJsonDecode': EsmRuntimeHelperSpec(
    name: '__dartJsonDecode',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartFromJson', '__dartJsonRevive'],
  ),
  '__dartToJson': EsmRuntimeHelperSpec(
    name: '__dartToJson',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartFromJson': EsmRuntimeHelperSpec(
    name: '__dartFromJson',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartJsonRevive': EsmRuntimeHelperSpec(
    name: '__dartJsonRevive',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartUtf8Codec': EsmRuntimeHelperSpec(
    name: '__dartUtf8Codec',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartUtf8Encode',
      '__dartUtf8Decode',
      '__dartUtf8Encoder',
      '__dartUtf8Decoder',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartUtf8Encoder': EsmRuntimeHelperSpec(
    name: '__dartUtf8Encoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartUtf8Encode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartUtf8Decoder': EsmRuntimeHelperSpec(
    name: '__dartUtf8Decoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartUtf8Decode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartUtf8Encode': EsmRuntimeHelperSpec(
    name: '__dartUtf8Encode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartUtf8Decode': EsmRuntimeHelperSpec(
    name: '__dartUtf8Decode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartAsciiCodec': EsmRuntimeHelperSpec(
    name: '__dartAsciiCodec',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartAsciiEncode',
      '__dartAsciiDecode',
      '__dartAsciiEncoder',
      '__dartAsciiDecoder',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartAsciiEncoder': EsmRuntimeHelperSpec(
    name: '__dartAsciiEncoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartAsciiEncode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartAsciiDecoder': EsmRuntimeHelperSpec(
    name: '__dartAsciiDecoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartAsciiDecode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartAsciiEncode': EsmRuntimeHelperSpec(
    name: '__dartAsciiEncode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartAsciiDecode': EsmRuntimeHelperSpec(
    name: '__dartAsciiDecode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartLatin1Codec': EsmRuntimeHelperSpec(
    name: '__dartLatin1Codec',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartLatin1Encode',
      '__dartLatin1Decode',
      '__dartLatin1Encoder',
      '__dartLatin1Decoder',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartLatin1Encoder': EsmRuntimeHelperSpec(
    name: '__dartLatin1Encoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartLatin1Encode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartLatin1Decoder': EsmRuntimeHelperSpec(
    name: '__dartLatin1Decoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartLatin1Decode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartLatin1Encode': EsmRuntimeHelperSpec(
    name: '__dartLatin1Encode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartLatin1Decode': EsmRuntimeHelperSpec(
    name: '__dartLatin1Decode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartBase64Codec': EsmRuntimeHelperSpec(
    name: '__dartBase64Codec',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartBase64Encode',
      '__dartBase64Decode',
      '__dartBase64Normalize',
      '__dartBase64Encoder',
      '__dartBase64Decoder',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartBase64Encoder': EsmRuntimeHelperSpec(
    name: '__dartBase64Encoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartBase64Encode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartBase64Decoder': EsmRuntimeHelperSpec(
    name: '__dartBase64Decoder',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartBase64Decode',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartBase64Encode': EsmRuntimeHelperSpec(
    name: '__dartBase64Encode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartBase64Decode': EsmRuntimeHelperSpec(
    name: '__dartBase64Decode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartBase64Normalize': EsmRuntimeHelperSpec(
    name: '__dartBase64Normalize',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartLineSplitter': EsmRuntimeHelperSpec(
    name: '__dartLineSplitter',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartLineSplit',
      '__dartLineSplitterSink',
      '__dartLineSplitterBind',
    ],
  ),
  '__dartLineSplit': EsmRuntimeHelperSpec(
    name: '__dartLineSplit',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartLineSplitterSink': EsmRuntimeHelperSpec(
    name: '__dartLineSplitterSink',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartLineSplitterBind': EsmRuntimeHelperSpec(
    name: '__dartLineSplitterBind',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartHtmlEscape': EsmRuntimeHelperSpec(
    name: '__dartHtmlEscape',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartHtmlEscapeMode',
      '__dartHtmlEscapeChar',
      '__dartConverterFuse',
      '__dartConverterStartChunked',
    ],
  ),
  '__dartHtmlEscapeMode': EsmRuntimeHelperSpec(
    name: '__dartHtmlEscapeMode',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartHtmlEscapeChar': EsmRuntimeHelperSpec(
    name: '__dartHtmlEscapeChar',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartSinkAdd': EsmRuntimeHelperSpec(
    name: '__dartSinkAdd',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartSinkClose': EsmRuntimeHelperSpec(
    name: '__dartSinkClose',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartConverterConvert': EsmRuntimeHelperSpec(
    name: '__dartConverterConvert',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartConverterBind': EsmRuntimeHelperSpec(
    name: '__dartConverterBind',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartConverterConvert'],
  ),
  '__dartConverterFuse': EsmRuntimeHelperSpec(
    name: '__dartConverterFuse',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartConverterConvert',
      '__dartConverterStartChunked',
      '__dartConverterBind',
    ],
  ),
  '__dartConverterStartChunked': EsmRuntimeHelperSpec(
    name: '__dartConverterStartChunked',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartConverterConvert'],
  ),
  '__dartChunkedConversionSink': EsmRuntimeHelperSpec(
    name: '__dartChunkedConversionSink',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartByteConversionSink': EsmRuntimeHelperSpec(
    name: '__dartByteConversionSink',
    category: EsmRuntimeHelperCategory.convert,
  ),
  '__dartByteConversionSinkFrom': EsmRuntimeHelperSpec(
    name: '__dartByteConversionSinkFrom',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartSinkAdd', '__dartSinkClose'],
  ),
  '__dartStringConversionSinkAsUtf8Sink': EsmRuntimeHelperSpec(
    name: '__dartStringConversionSinkAsUtf8Sink',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartUtf8Decode'],
  ),
  '__dartStringConversionSink': EsmRuntimeHelperSpec(
    name: '__dartStringConversionSink',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartStringConversionSinkAsUtf8Sink'],
  ),
  '__dartStringConversionSinkFrom': EsmRuntimeHelperSpec(
    name: '__dartStringConversionSinkFrom',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: [
      '__dartSinkAdd',
      '__dartSinkClose',
      '__dartStringConversionSinkAsUtf8Sink',
    ],
  ),
  '__dartStringConversionSinkFromStringSink': EsmRuntimeHelperSpec(
    name: '__dartStringConversionSinkFromStringSink',
    category: EsmRuntimeHelperCategory.convert,
    dependencies: ['__dartSinkAdd', '__dartStringConversionSinkAsUtf8Sink'],
  ),
  '__dartStreamFromFutures': EsmRuntimeHelperSpec(
    name: '__dartStreamFromFutures',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController'],
  ),
  '__dartStreamFromIterable': EsmRuntimeHelperSpec(
    name: '__dartStreamFromIterable',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamFromFuture': EsmRuntimeHelperSpec(
    name: '__dartStreamFromFuture',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamMulti': EsmRuntimeHelperSpec(
    name: '__dartStreamMulti',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController'],
  ),
  '__dartStreamError': EsmRuntimeHelperSpec(
    name: '__dartStreamError',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamPeriodic': EsmRuntimeHelperSpec(
    name: '__dartStreamPeriodic',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamAsBroadcastStream': EsmRuntimeHelperSpec(
    name: '__dartStreamAsBroadcastStream',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController', '__dartStreamIterable'],
  ),
  '__dartStreamMap': EsmRuntimeHelperSpec(
    name: '__dartStreamMap',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamWhere': EsmRuntimeHelperSpec(
    name: '__dartStreamWhere',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamAsyncMap': EsmRuntimeHelperSpec(
    name: '__dartStreamAsyncMap',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamAsyncExpand': EsmRuntimeHelperSpec(
    name: '__dartStreamAsyncExpand',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamExpand': EsmRuntimeHelperSpec(
    name: '__dartStreamExpand',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamTransformerFromHandlers': EsmRuntimeHelperSpec(
    name: '__dartStreamTransformerFromHandlers',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController', '__dartStreamIterable'],
  ),
  '__dartStreamTransformerFromBind': EsmRuntimeHelperSpec(
    name: '__dartStreamTransformerFromBind',
    category: EsmRuntimeHelperCategory.stream,
  ),
  '__dartStreamTransformerBind': EsmRuntimeHelperSpec(
    name: '__dartStreamTransformerBind',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartConverterBind'],
  ),
  '__dartStreamTransform': EsmRuntimeHelperSpec(
    name: '__dartStreamTransform',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamTransformerBind'],
  ),
  '__dartStreamEventTransformed': EsmRuntimeHelperSpec(
    name: '__dartStreamEventTransformed',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController', '__dartStreamIterable'],
  ),
  '__dartStreamDistinct': EsmRuntimeHelperSpec(
    name: '__dartStreamDistinct',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartEquals', '__dartStreamIterable'],
  ),
  '__dartStreamHandleError': EsmRuntimeHelperSpec(
    name: '__dartStreamHandleError',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamTake': EsmRuntimeHelperSpec(
    name: '__dartStreamTake',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamSkip': EsmRuntimeHelperSpec(
    name: '__dartStreamSkip',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamTimeout': EsmRuntimeHelperSpec(
    name: '__dartStreamTimeout',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamController', '__dartStreamIterable'],
  ),
  '__dartStreamTakeWhile': EsmRuntimeHelperSpec(
    name: '__dartStreamTakeWhile',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamSkipWhile': EsmRuntimeHelperSpec(
    name: '__dartStreamSkipWhile',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamToList': EsmRuntimeHelperSpec(
    name: '__dartStreamToList',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamToSet': EsmRuntimeHelperSpec(
    name: '__dartStreamToSet',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartSetAdd', '__dartStreamIterable'],
  ),
  '__dartStreamFold': EsmRuntimeHelperSpec(
    name: '__dartStreamFold',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamReduce': EsmRuntimeHelperSpec(
    name: '__dartStreamReduce',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamForEach': EsmRuntimeHelperSpec(
    name: '__dartStreamForEach',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamCast': EsmRuntimeHelperSpec(
    name: '__dartStreamCast',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartAs', '__dartStreamIterable'],
  ),
  '__dartStreamFirst': EsmRuntimeHelperSpec(
    name: '__dartStreamFirst',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamLast': EsmRuntimeHelperSpec(
    name: '__dartStreamLast',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamSingle': EsmRuntimeHelperSpec(
    name: '__dartStreamSingle',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamLength': EsmRuntimeHelperSpec(
    name: '__dartStreamLength',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamIsEmpty': EsmRuntimeHelperSpec(
    name: '__dartStreamIsEmpty',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamAny': EsmRuntimeHelperSpec(
    name: '__dartStreamAny',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamEvery': EsmRuntimeHelperSpec(
    name: '__dartStreamEvery',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamFirstWhere': EsmRuntimeHelperSpec(
    name: '__dartStreamFirstWhere',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamLastWhere': EsmRuntimeHelperSpec(
    name: '__dartStreamLastWhere',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamSingleWhere': EsmRuntimeHelperSpec(
    name: '__dartStreamSingleWhere',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamContains': EsmRuntimeHelperSpec(
    name: '__dartStreamContains',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartEquals', '__dartStreamIterable'],
  ),
  '__dartStreamJoin': EsmRuntimeHelperSpec(
    name: '__dartStreamJoin',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStr', '__dartStreamIterable'],
  ),
  '__dartStreamDrain': EsmRuntimeHelperSpec(
    name: '__dartStreamDrain',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamPipe': EsmRuntimeHelperSpec(
    name: '__dartStreamPipe',
    category: EsmRuntimeHelperCategory.stream,
    dependencies: ['__dartStreamIterable'],
  ),
  '__dartStreamListen': EsmRuntimeHelperSpec(
    name: '__dartStreamListen',
    category: EsmRuntimeHelperCategory.stream,
  ),
};

const _legacyStreamRuntimeHelpers = {
  '__dartStreamFromIterable',
  '__dartStreamFromFuture',
  '__dartStreamIterable',
  '__dartStreamFromFutures',
  '__dartStreamMulti',
  '__dartStreamError',
  '__dartStreamPeriodic',
  '__dartStreamAsBroadcastStream',
  '__dartStreamMap',
  '__dartStreamWhere',
  '__dartStreamAsyncMap',
  '__dartStreamAsyncExpand',
  '__dartStreamExpand',
  '__dartStreamTransformerFromBind',
  '__dartStreamTransformerFromHandlers',
  '__dartStreamTransformerBind',
  '__dartStreamTransform',
  '__dartStreamEventTransformed',
  '__dartStreamDistinct',
  '__dartStreamHandleError',
  '__dartStreamTake',
  '__dartStreamSkip',
  '__dartStreamTimeout',
  '__dartStreamTakeWhile',
  '__dartStreamSkipWhile',
  '__dartStreamToList',
  '__dartStreamToSet',
  '__dartStreamFold',
  '__dartStreamReduce',
  '__dartStreamForEach',
  '__dartStreamCast',
  '__dartStreamFirst',
  '__dartStreamLast',
  '__dartStreamSingle',
  '__dartStreamLength',
  '__dartStreamIsEmpty',
  '__dartStreamAny',
  '__dartStreamEvery',
  '__dartStreamFirstWhere',
  '__dartStreamLastWhere',
  '__dartStreamSingleWhere',
  '__dartStreamContains',
  '__dartStreamJoin',
  '__dartStreamDrain',
  '__dartStreamPipe',
  '__dartStreamListen',
};

Set<String> resolveEsmRuntimeHelperDependencies(Iterable<String> helpers) {
  final resolved = <String>{};

  void visit(String name) {
    if (!resolved.add(name)) {
      return;
    }
    final spec = _helperSpecs[name];
    if (spec == null) {
      return;
    }
    for (final dependency in spec.dependencies) {
      visit(dependency);
    }
  }

  for (final helper in helpers) {
    visit(helper);
  }
  return resolved;
}

bool isEsmLegacyStreamRuntimeHelper(String name) =>
    _legacyStreamRuntimeHelpers.contains(name);

String? esmRuntimeHelperSource(String name) => _helperSpecs[name]?.source;
