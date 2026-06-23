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
function __dartAs(value, test, typeName) {
  if (test(value)) return value;
  throw new TypeError("Type cast failed: expected " + typeName);
}
function __dartFixedList(list) {
  return Object.seal(list);
}
function __dartInvocation(kind, name, positionalArguments = [], namedArguments = null) {
  const memberName = name != null && typeof name === "object" && "name" in name ? name : __dartSymbol(name, name);
  const displayName = memberName?.name ?? String(name);
  const named = new Map();
  if (namedArguments instanceof Map) {
    for (const [key, value] of namedArguments) {
      named.set(key, value);
    }
  } else if (namedArguments != null) {
    for (const [key, value] of Object.entries(namedArguments)) {
      named.set(__dartSymbol(key, key), value);
    }
  }
  return Object.freeze({
    memberName,
    positionalArguments: Array.from(positionalArguments),
    namedArguments: named,
    get isMethod() { return kind === "method"; },
    get isGetter() { return kind === "getter"; },
    get isSetter() { return kind === "setter"; },
    get isAccessor() { return kind !== "method"; },
    toString() { return "Invocation(" + kind + " " + displayName + ")"; },
  });
}
function __dartNoSuchMethod(receiver, kind, name, positionalArguments = [], namedArguments = null) {
  const noSuchMethod = receiver?.noSuchMethod;
  if (typeof noSuchMethod === "function") {
    return noSuchMethod.call(receiver, __dartInvocation(kind, name, positionalArguments, namedArguments));
  }
  throw new TypeError("No such method " + String(name));
}
function __dartGet(receiver, name) {
  if (Array.isArray(receiver)) {
    if (name === "isEmpty") return receiver.length === 0;
    if (name === "isNotEmpty") return receiver.length !== 0;
    if (name === "first") return receiver[0];
    if (name === "last") return receiver[receiver.length - 1];
  }
  if (receiver instanceof Map || receiver instanceof Set) {
    if (name === "length") return receiver.size;
    if (name === "isEmpty") return receiver.size === 0;
    if (name === "isNotEmpty") return receiver.size !== 0;
  }
  if (typeof receiver === "string") {
    if (name === "isEmpty") return receiver.length === 0;
    if (name === "isNotEmpty") return receiver.length !== 0;
  }
  if (receiver != null && (typeof receiver === "object" || typeof receiver === "function") && !(name in receiver)) return __dartNoSuchMethod(receiver, "getter", name);
  const value = receiver[name];
  return typeof value === "function" ? value.bind(receiver) : value;
}
function __dartCall(receiver, name, args, namedArgs = null) {
  const callArgs = namedArgs == null ? args : [...args, namedArgs];
  if (name === "call") {
    if (typeof receiver === "function") return receiver(...callArgs);
    const call = receiver.call;
    if (typeof call === "function") return call.apply(receiver, callArgs);
  }
  if (Array.isArray(receiver)) {
    switch (name) {
      case "[]": return receiver[args[0]];
      case "[]=": receiver[args[0]] = args[1]; return args[1];
      case "add": receiver.push(args[0]); return null;
      case "addAll": receiver.push(...Array.from(args[0])); return null;
      case "clear": receiver.length = 0; return null;
      case "contains": return __dartIterableContains(receiver, args[0]);
      case "elementAt": return receiver[args[0]];
      case "join": return receiver.map(__dartStr).join(args.length === 0 ? "" : args[0]);
      case "remove": { const index = receiver.findIndex(value => __dartEquals(value, args[0])); if (index < 0) return false; receiver.splice(index, 1); return true; }
      case "removeAt": return receiver.splice(args[0], 1)[0];
      case "removeLast": return receiver.pop();
      case "toList": return Array.from(receiver);
      case "toSet": return new Set(receiver);
    }
  }
  if (receiver instanceof Map) {
    switch (name) {
      case "[]": return __dartMapGet(receiver, args[0]);
      case "[]=": return __dartMapSet(receiver, args[0], args[1]);
      case "clear": receiver.clear(); return null;
      case "containsKey": return __dartMapContainsKey(receiver, args[0]);
      case "remove": return __dartMapRemove(receiver, args[0]);
    }
  }
  if (receiver instanceof Set) {
    switch (name) {
      case "add": return __dartSetAdd(receiver, args[0]);
      case "addAll": for (const value of args[0]) __dartSetAdd(receiver, value); return null;
      case "clear": receiver.clear(); return null;
      case "contains": return __dartIterableContains(receiver, args[0]);
      case "remove": return __dartSetRemove(receiver, args[0]);
      case "toList": return Array.from(receiver);
      case "toSet": return new Set(receiver);
    }
  }
  if (typeof receiver === "string") {
    switch (name) {
      case "contains": return receiver.includes(args[0], args.length > 1 ? args[1] : 0);
      case "endsWith": return receiver.endsWith(args[0]);
      case "indexOf": return receiver.indexOf(args[0], args.length > 1 ? args[1] : 0);
      case "lastIndexOf": return args.length > 1 ? receiver.lastIndexOf(args[0], args[1]) : receiver.lastIndexOf(args[0]);
      case "split": return receiver.split(args[0]);
      case "startsWith": return receiver.startsWith(args[0], args.length > 1 ? args[1] : 0);
      case "substring": return receiver.substring(args[0], args.length > 1 ? args[1] : undefined);
      case "toLowerCase": return receiver.toLowerCase();
      case "toUpperCase": return receiver.toUpperCase();
      case "trim": return receiver.trim();
    }
  }
  const method = receiver[name];
  if (typeof method === "function") return method.apply(receiver, callArgs);
  return __dartNoSuchMethod(receiver, "method", name, args, namedArgs);
}
function __dartCompare(left, right, compare = null) {
  if (typeof compare === "function") return Number(compare(left, right));
  const compareTo = left?.compareTo;
  if (typeof compareTo === "function") return Number(compareTo.call(left, right));
  return left < right ? -1 : (left > right ? 1 : 0);
}
function __dartSplaySortSet(set) {
  const values = Array.from(set).sort((left, right) => __dartCompare(left, right, set.__dartSplayCompare));
  set.clear();
  for (const value of values) set.add(value);
}
function __dartSplaySortMap(map) {
  const entries = Array.from(map).sort(([left], [right]) => __dartCompare(left, right, map.__dartSplayCompare));
  map.clear();
  for (const [key, value] of entries) map.set(key, value);
}
function __dartSetAdd(set, value) {
  if (set.__dartIdentitySet) {
    if (set.has(value)) return false;
    set.add(value);
    return true;
  }
  if (set.__dartSplayCompare !== undefined) {
    for (const candidate of set) {
      if (__dartCompare(candidate, value, set.__dartSplayCompare) === 0) return false;
    }
    set.add(value);
    __dartSplaySortSet(set);
    return true;
  }
  if (__dartIterableContains(set, value)) return false;
  set.add(value);
  return true;
}
function __dartIdentitySet() {
  const set = new Set();
  Object.defineProperty(set, "__dartIdentitySet", { value: true });
  return set;
}
function __dartSetFrom(values) {
  const set = new Set();
  for (const value of values) __dartSetAdd(set, value);
  return set;
}
function __dartSetRemove(set, needle) {
  if (set.__dartIdentitySet) {
    const found = set.has(needle);
    set.delete(needle);
    return found;
  }
  for (const value of set) {
    if (set.__dartSplayCompare !== undefined && __dartCompare(value, needle, set.__dartSplayCompare) === 0) {
      set.delete(value);
      return true;
    }
    if (__dartEquals(value, needle)) {
      set.delete(value);
      return true;
    }
  }
  return false;
}
function __dartIdentityMap() {
  const map = new Map();
  Object.defineProperty(map, "__dartIdentityMap", { value: true });
  return map;
}
const __dartMapMissingKey = Symbol("dart.mapMissingKey");
function __dartMapKey(map, key) {
  if (map.__dartIdentityMap) return map.has(key) ? key : __dartMapMissingKey;
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
function __dartMapContainsKey(map, key) {
  return __dartMapKey(map, key) !== __dartMapMissingKey;
}
function __dartMapGet(map, key) {
  const actualKey = __dartMapKey(map, key);
  return actualKey === __dartMapMissingKey ? null : map.get(actualKey);
}
function __dartMapSet(map, key, value) {
  const actualKey = __dartMapKey(map, key);
  map.set(actualKey === __dartMapMissingKey ? key : actualKey, value);
  if (map.__dartSplayCompare !== undefined) __dartSplaySortMap(map);
  return value;
}
function __dartMapRemove(map, key) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey === __dartMapMissingKey) return null;
  const value = map.get(actualKey);
  map.delete(actualKey);
  return value;
}
function __dartMapFromEntries(entries) {
  const map = new Map();
  for (const [key, value] of entries) {
    __dartMapSet(map, key, value);
  }
  return map;
}
function __dartMapFromIterable(iterable, key = null, value = null) {
  const map = new Map();
  for (const element of iterable) {
    __dartMapSet(map, key == null ? element : key(element), value == null ? element : value(element));
  }
  return map;
}
function __dartMapFromIterables(keys, values) {
  const keyList = Array.from(keys);
  const valueList = Array.from(values);
  if (keyList.length !== valueList.length) throw new Error("Iterables do not have same length");
  const map = new Map();
  for (let index = 0; index < keyList.length; index++) {
    __dartMapSet(map, keyList[index], valueList[index]);
  }
  return map;
}
function __dartIterableContains(iterable, needle) {
  if (iterable instanceof Set && iterable.__dartIdentitySet) return iterable.has(needle);
  for (const value of iterable) {
    if (iterable instanceof Set && iterable.__dartSplayCompare !== undefined && __dartCompare(value, needle, iterable.__dartSplayCompare) === 0) return true;
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
function __dartIterableJoin(iterable, separator = "") {
  return Array.from(iterable, (value) => __dartStr(value)).join(String(separator));
}
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
  if ((typeof left === "number" || left.__dartType === "double") && (typeof right === "number" || right.__dartType === "double")) return Number(left) === Number(right);
  const equals = left["=="];
  return typeof equals === "function" ? equals.call(left, right) : false;
}
function __dartConstSet(values) {
  const set = new Set();
  for (const value of values) __dartSetAdd(set, value);
  const throwConst = () => { throw new TypeError("Cannot modify const Set"); };
  Object.defineProperty(set, "add", { value: throwConst });
  Object.defineProperty(set, "delete", { value: throwConst });
  Object.defineProperty(set, "clear", { value: throwConst });
  return Object.freeze(set);
}
function __dartConstMap(entries) {
  const map = new Map();
  for (const [key, value] of entries) __dartMapSet(map, key, value);
  const throwConst = () => { throw new TypeError("Cannot modify const Map"); };
  Object.defineProperty(map, "set", { value: throwConst });
  Object.defineProperty(map, "delete", { value: throwConst });
  Object.defineProperty(map, "clear", { value: throwConst });
  return Object.freeze(map);
}

// Generated by dart2esm.

export class EqBox {
  constructor(value) {
    this.value = value;
  }
  "=="(other) {
    return (other instanceof EqBox && __dartEquals(other.value, this.value));
  }
  get hashCode() {
    return this.value.hashCode;
  }
}

export function main() {
  const list = Array.from((() => {
    const v = new Set();
    __dartSetAdd(v, 1);
    __dartSetAdd(v, 2);
    __dartSetAdd(v, 3);
    return v;
  })());
  const listFrom = Array.from(list);
  const listFixed = Object.freeze(Array.from(listFrom));
  __dartPrint("list " + __dartStr(listFixed.length) + " " + __dartStr(__dartIterableJoin(listFixed, ",")));
  const fixedFilled = __dartFixedList(new Array(2).fill(7));
  fixedFilled[0] = 8;
  let fixedAddFailed = false;
  try {
    {
      (fixedFilled.push(9), null);
    }
  } catch ($error) {
    if ($error != null) {
      const __wc0_formal = $error;
      {
        fixedAddFailed = true;
      }
    } else {
      throw $error;
    }
  }
  const growableEmpty = [];
  (growableEmpty.push(1), null);
  const fixedCopy = __dartFixedList(Array.from([1, 2, 3]));
  fixedCopy[0] = 4;
  let fixedCopyAddFailed = false;
  try {
    {
      (fixedCopy.push(5), null);
    }
  } catch ($error_1) {
    if ($error_1 != null) {
      const __wc1_formal = $error_1;
      {
        fixedCopyAddFailed = true;
      }
    } else {
      throw $error_1;
    }
  }
  const fixedFrom = __dartFixedList(Array.from([5, 6]));
  __dartPrint("fixedList " + __dartStr(__dartIterableJoin(fixedFilled, ",")) + " " + __dartStr(fixedAddFailed) + " " + __dartStr(__dartIterableJoin(growableEmpty, ",")) + " " + __dartStr(__dartIterableJoin(fixedCopy, ",")) + " " + __dartStr(fixedCopyAddFailed) + " " + __dartStr(fixedFrom.length));
  const set = __dartSetFrom(["a", "b", "a"]);
  const setOf = __dartSetFrom(set);
  const setFixed = __dartConstSet(__dartSetFrom(setOf));
  __dartPrint("set " + __dartStr(setFixed.size) + " " + __dartStr(__dartIterableContains(setFixed, "a")) + " " + __dartStr(__dartIterableJoin(setFixed, "|")));
  const eqSetFrom = __dartSetFrom([new EqBox(1), new EqBox(1), new EqBox(2)]);
  const eqSetOf = __dartSetFrom((() => {
    const v = Array.from(eqSetFrom);
    (v.push(new EqBox(2)), null);
    (v.push(new EqBox(3)), null);
    return v;
  })());
  const eqSetFixed = __dartConstSet(__dartSetFrom([new EqBox(1), new EqBox(1)]));
  __dartPrint("setFactories " + __dartStr(eqSetFrom.size) + " " + __dartStr(__dartIterableContains(eqSetFrom, new EqBox(1))) + " " + __dartStr(eqSetOf.size) + " " + __dartStr(eqSetFixed.size) + " " + __dartStr(__dartIterableContains(eqSetFixed, new EqBox(1))));
  const identitySet = __dartIdentitySet();
  const identityBox = new EqBox(1);
  __dartSetAdd(identitySet, identityBox);
  __dartSetAdd(identitySet, new EqBox(1));
  __dartPrint("setIdentity " + __dartStr(__dartIterableContains(identitySet, identityBox)) + " " + __dartStr(__dartIterableContains(identitySet, new EqBox(1))) + " " + __dartStr(identitySet.size));
  const map = __dartMapFromEntries(new Map([["one", 1], ["two", 2]]));
  const mapOf = __dartMapFromEntries(map);
  const mapFixed = __dartConstMap(mapOf);
  __dartPrint("map " + __dartStr(mapFixed.size) + " " + __dartStr(__dartMapGet(mapFixed, "one")) + " " + __dartStr(__dartIterableJoin(Array.from(mapFixed.keys()), ",")));
  const eqMapSource = new Map([]);
  __dartMapSet(eqMapSource, new EqBox(1), "one");
  __dartMapSet(eqMapSource, new EqBox(1), "uno");
  const eqMapFixed = __dartConstMap(eqMapSource);
  __dartPrint("mapFixed " + __dartStr(eqMapFixed.size) + " " + __dartStr(__dartMapGet(eqMapFixed, new EqBox(1))) + " " + __dartStr(__dartMapContainsKey(eqMapFixed, new EqBox(1))));
  const entries = __dartMapFromEntries(Array.from([Object.freeze({ key: "three", value: 3 }), Object.freeze({ key: "four", value: 4 })], (entry) => [entry.key, entry.value]));
  const iterable = __dartMapFromIterable(["aa", "bbb"], function(value) { return __dartAs(__dartGet(value, "length"), value => typeof value === "number", "int"); }, function(value) { return __dartAs(__dartCall(value, "toUpperCase", [], null), value => typeof value === "string", "String"); });
  const iterables = __dartMapFromIterables(["x", "y"], [10, 20]);
  const identity = __dartIdentityMap();
  const identityKey = [1];
  __dartMapSet(identity, identityKey, "same");
  __dartPrint("mapFactories " + __dartStr(__dartMapGet(entries, "four")) + " " + __dartStr(__dartMapGet(iterable, 3)) + " " + __dartStr(__dartMapGet(iterables, "y")) + " " + __dartStr(__dartMapContainsKey(identity, identityKey)));
}

main();
