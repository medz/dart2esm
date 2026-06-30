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
function __dartIdbListen(target, type, callback) {
  if (typeof target.addEventListener === "function") target.addEventListener(type, callback, { once: true });
  else target["on" + type] = callback;
}
function __dartIdbRequestPromise(request, resolveValue = (request) => request.result) {
  return new Promise((resolve, reject) => {
    __dartIdbListen(request, "success", (event) => resolve(resolveValue(request, event)));
    __dartIdbListen(request, "error", (event) => reject(request.error ?? event));
  });
}
function __dartIdbOpen(factory, name, version, onUpgradeNeeded, onBlocked) {
  const request = version == null ? factory.open(name) : factory.open(name, version);
  if (onUpgradeNeeded != null) __dartIdbListen(request, "upgradeneeded", onUpgradeNeeded);
  if (onBlocked != null) __dartIdbListen(request, "blocked", onBlocked);
  return __dartIdbRequestPromise(request);
}
function __dartIdbDeleteDatabase(factory, name, onBlocked) {
  const request = factory.deleteDatabase(name);
  if (onBlocked != null) __dartIdbListen(request, "blocked", onBlocked);
  return __dartIdbRequestPromise(request, () => factory);
}
function __dartIdbStoreRequest(store, method, args) {
  return __dartIdbRequestPromise(store[method](...args));
}
function __dartIdbStorePut(store, method, value, key) {
  const request = key == null ? store[method](value) : store[method](value, key);
  return __dartIdbRequestPromise(request);
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
function __dartMapContainsKey(map, key) {
  if (!(map instanceof Map) && map != null && typeof map.containsKey === "function") return map.containsKey(key);
  return __dartMapKey(map, key) !== __dartMapMissingKey;
}
function __dartMapGet(map, key) {
  if (!(map instanceof Map) && map != null && typeof map["[]"] === "function") return map["[]"](key);
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
  const equals = left["=="];
  return typeof equals === "function" ? equals.call(left, right) : false;
}

// Generated by dart2esm.

export async function main() {
  const supported = (!!(globalThis.window?.indexedDB || globalThis.window?.webkitIndexedDB || globalThis.window?.mozIndexedDB || globalThis.indexedDB));
  const factory = __dartNullCheck(globalThis.window.indexedDB);
  const db = await __dartIdbOpen(factory, "dart2esm", 1, function(event) {
    const request = __dartGet(event, "target");
    __dartCall(__dartGet(request, "result"), "createObjectStore", ["items"], null);
}, null);
  const transaction = db.transaction("items", "readwrite");
  const store = transaction.objectStore("items");
  await __dartIdbStorePut(store, "put", "ok", "key");
  const value = await __dartIdbStoreRequest(store, "get", ["key"]);
  db.close();
  await __dartIdbDeleteDatabase(factory, "dart2esm", null);
  __dartPrint("indexedDB " + __dartStr(supported) + " " + __dartStr(value) + " " + __dartStr(db.name));
}

await main();
