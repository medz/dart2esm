const __dartRecordShape = Symbol("dart.recordShape");
function __dartIsRecord(value) {
  return value != null && typeof value === "object" && Array.isArray(value[__dartRecordShape]);
}
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
function __dartNullCheck(value) {
  if (value == null) {
    throw new TypeError("Null check operator used on a null value");
  }
  return value;
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
function __dartSet(receiver, name, value) {
  if (receiver != null && (typeof receiver === "object" || typeof receiver === "function") && !(name in receiver)) return __dartNoSuchMethod(receiver, "setter", name + "=", [value]);
  receiver[name] = value;
  return value;
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
function __dartSetAddAll(set, values) {
  for (const value of values) __dartSetAdd(set, value);
  return null;
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
function __dartMapAddAll(map, entries) {
  for (const [key, value] of entries) __dartMapSet(map, key, value);
  return null;
}
function __dartMapRemove(map, key) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey === __dartMapMissingKey) return null;
  const value = map.get(actualKey);
  map.delete(actualKey);
  return value;
}
function __dartIterableContains(iterable, needle) {
  if (iterable instanceof Set && iterable.__dartIdentitySet) return iterable.has(needle);
  for (const value of iterable) {
    if (iterable instanceof Set && iterable.__dartSplayCompare !== undefined && __dartCompare(value, needle, iterable.__dartSplayCompare) === 0) return true;
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
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
function __dartIterator(iterable) {
  const values = Array.isArray(iterable) ? iterable : Array.from(iterable);
  let index = -1;
  return {
    current: undefined,
    moveNext() {
      index++;
      if (index < values.length) {
        this.current = values[index];
        return true;
      }
      this.current = undefined;
      return false;
    },
  };
}

// Generated by dart2esm.

export class Bag {
  constructor(value) {
    this.value = value;
  }
  add(x) {
    return (this.value + x);
  }
}

export function describe(input) {
  const list = (() => {
    const v = [0];
    (v.push(...Array.from([1, 2])), null);
    if (!((input === null))) {
      (v.push(3), null);
    }
    {
      let _sync_for_iterator = __dartIterator([4, 5]);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          const x = _sync_for_iterator.current;
          (v.push(x), null);
        }
      }
    }
    return v;
  })();
  const set = (() => {
    const v = new Set();
    __dartSetAdd(v, 0);
    __dartSetAddAll(v, (() => {
      const v = new Set();
      __dartSetAdd(v, 1);
      __dartSetAdd(v, 2);
      return v;
    })());
    if (!((input === null))) {
      __dartSetAdd(v, 3);
    }
    {
      let _sync_for_iterator = __dartIterator([4, 5]);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          const x = _sync_for_iterator.current;
          __dartSetAdd(v, x);
        }
      }
    }
    return v;
  })();
  const map = (() => {
    const v = new Map([]);
    __dartMapSet(v, "a", 1);
    __dartMapAddAll(v, new Map([["b", 2]]));
    if (!((input === null))) {
      __dartMapSet(v, "c", 3);
    }
    {
      let _sync_for_iterator = __dartIterator([4, 5]);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          const x = _sync_for_iterator.current;
          __dartMapSet(v, __dartStr(x), x);
        }
      }
    }
    return v;
  })();
  let a = null;
  let b = null;
  {
    const _0_0 = __dartRecord([1, 2], {});
    a = _0_0.$1;
    b = _0_0.$2;
  }
  {
    const _1_0 = __dartRecord([b, a], {});
    a = _1_0.$1;
    b = _1_0.$2;
  }
  const result = (() => {
    let v = null;
    const _2_0 = input;
    L:
    {
      {
        let value = null;
        if (((typeof _2_0 === "number" && (() => { let v_1 = value = _2_0; return true; })()) && (value > 2))) {
          {
            v = "big " + __dartStr(value);
            break L;
          }
        }
      }
      {
        let value_1 = null;
        if (typeof _2_0 === "string") {
          {
            value_1 = _2_0;
            v = "string " + __dartStr(value_1);
            break L;
          }
        }
      }
      {
        if (true) {
          {
            v = "other";
            break L;
          }
        }
      }
    }
    return v;
  })();
  let d = new Bag(10);
  __dartSet(d, "value", __dartCall(d, "add", [1], null));
  const tear = __dartGet(d, "add");
  let dynList = [1, 2];
  __dartCall(dynList, "add", [3], null);
  __dartCall(dynList, "[]=", [1, 4], null);
  const dynListText = __dartStr(__dartCall(dynList, "[]", [0], null)) + ":" + __dartStr(__dartCall(dynList, "[]", [1], null)) + ":" + __dartStr(__dartCall(dynList, "join", ["|"], null)) + ":" + __dartStr(__dartCall(dynList, "contains", [3], null));
  let dynMap = new Map([["a", 1]]);
  __dartCall(dynMap, "[]=", ["b", 2], null);
  const dynMapText = __dartStr(__dartCall(dynMap, "[]", ["a"], null)) + ":" + __dartStr(__dartCall(dynMap, "containsKey", ["b"], null)) + ":" + __dartStr(__dartCall(dynMap, "remove", ["a"], null)) + ":" + __dartStr(__dartCall(dynMap, "[]", ["a"], null));
  let dynSet = (() => {
    const v = new Set();
    __dartSetAdd(v, "a");
    return v;
  })();
  const dynSetAdded = __dartCall(dynSet, "add", ["b"], null);
  const dynSetDuplicate = __dartCall(dynSet, "add", ["b"], null);
  const dynSetText = __dartStr(dynSetAdded) + ":" + __dartStr(dynSetDuplicate) + ":" + __dartStr(__dartCall(dynSet, "contains", ["a"], null)) + ":" + __dartStr(__dartCall(dynSet, "remove", ["a"], null)) + ":" + __dartStr(__dartGet(dynSet, "length"));
  let dynString = " Hello,Dart ";
  const dynStringText = __dartStr(__dartCall(__dartCall(dynString, "trim", [], null), "toUpperCase", [], null)) + ":" + __dartStr(__dartCall(dynString, "contains", ["Dart"], null)) + ":" + __dartStr(__dartCall(__dartCall(__dartCall(dynString, "split", [","], null), "[]", [1], null), "trim", [], null));
  const sure = __dartNullCheck(input);
  return __dartStr(list) + " " + __dartStr(set) + " " + __dartStr(map) + " " + __dartStr(a) + " " + __dartStr(b) + " " + __dartStr(result) + " " + __dartStr(__dartGet(d, "value")) + " " + __dartStr(__dartCall(tear, "call", [2], null)) + " " + __dartStr(dynListText) + " " + __dartStr(dynMapText) + " " + __dartStr(dynSetText) + " " + __dartStr(dynStringText) + " " + __dartStr(sure);
}

export function main() {
  __dartPrint(describe(4));
  __dartPrint(describe("x"));
}

main();
