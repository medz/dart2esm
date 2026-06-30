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
function __dartStringBuffer(initial = "") {
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
}
function __dartMapForEach(map, callback) {
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
}
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
function __dartConverterConvert(converter, value) {
  if (converter != null && typeof converter.convert === "function") return converter.convert(value);
  if (converter != null && typeof converter.encode === "function") return converter.encode(value);
  throw new TypeError("Converter.convert is not available");
}
function __dartConverterBind(converter, stream) {
  return (async function*() {
    for await (const value of stream) {
      yield __dartConverterConvert(converter, value);
    }
  })();
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
function __dartFixedList(list) {
  return Object.seal(list);
}
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
function __dartMapPutIfAbsent(map, key, ifAbsent) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey !== __dartMapMissingKey) return map.get(actualKey);
  const value = ifAbsent();
  __dartMapSet(map, key, value);
  return value;
}
function __dartMapUpdateAll(map, update) {
  for (const [key, value] of Array.from(map)) {
    map.set(key, update(key, value));
  }
  return null;
}
function __dartListSort(list, compare = null) {
  if (typeof compare === "function") {
    list.sort((left, right) => compare(left, right));
  } else {
    list.sort((left, right) => left < right ? -1 : (left > right ? 1 : 0));
  }
  return null;
}
function __dartListSetAll(list, index, values) {
  let offset = 0;
  for (const value of values) {
    __dartIndexSet(list, index + offset, value);
    offset++;
  }
  return null;
}
function __dartIterableContains(iterable, needle) {
  if (iterable instanceof Set && iterable.__dartIdentitySet) return iterable.has(needle);
  for (const value of iterable) {
    if (iterable instanceof Set && iterable.__dartSplayCompare !== undefined && __dartCompare(value, needle, iterable.__dartSplayCompare) === 0) return true;
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
function __dartIterableIsEmpty(iterable) {
  if (typeof iterable.length === "number") return iterable.length === 0;
  if (typeof iterable.size === "number") return iterable.size === 0;
  for (const _ of iterable) return false;
  return true;
}
function __dartIterableLength(iterable) {
  if (typeof iterable.length === "number") return iterable.length;
  if (typeof iterable.size === "number") return iterable.size;
  let count = 0;
  for (const _ of iterable) count++;
  return count;
}
function __dartIterableTakeWhile(iterable, test) {
  const result = [];
  for (const value of iterable) {
    if (!test(value)) break;
    result.push(value);
  }
  return result;
}
function __dartIterableSkipWhile(iterable, test) {
  const result = [];
  let skipping = true;
  for (const value of iterable) {
    if (skipping && test(value)) continue;
    skipping = false;
    result.push(value);
  }
  return result;
}
function __dartIterableJoin(iterable, separator = "") {
  if (iterable != null && typeof iterable["[]"] === "function" && typeof iterable.length === "number") {
    const values = [];
    for (let index = 0; index < iterable.length; index++) values.push(__dartStr(iterable["[]"](index)));
    return values.join(String(separator));
  }
  return Array.from(iterable, (value) => __dartStr(value)).join(String(separator));
}
function __dartIterableFirst(iterable) {
  for (const value of iterable) return value;
  throw new RangeError("No element");
}
function __dartListSetRange(target, start, end, source, skipCount = 0) {
  const values = [];
  const count = end - start;
  for (let index = 0; index < count; index++) values.push(__dartIndexGet(source, skipCount + index));
  for (let index = 0; index < values.length; index++) {
    __dartIndexSet(target, start + index, values[index]);
  }
  return null;
}
function __dartCompleter() {
  let completed = false;
  let resolveFuture;
  let rejectFuture;
  const future = new Promise((resolve, reject) => { resolveFuture = resolve; rejectFuture = reject; });
  return {
    future,
    get isCompleted() { return completed; },
    complete(value = null) {
      if (completed) throw new Error("Future already completed");
      completed = true;
      Promise.resolve(value).then(resolveFuture, rejectFuture);
      return null;
    },
    completeError(error, stackTrace = null) {
      if (completed) throw new Error("Future already completed");
      completed = true;
      rejectFuture(error);
      return null;
    },
  };
}
function __dartTimer(duration, callback, periodic) {
  const delay = Math.max(0, typeof duration === "number" ? duration : duration.inMilliseconds);
  let active = true;
  let tick = 0;
  let id;
  const timer = {
    get tick() { return tick; },
    get isActive() { return active; },
    cancel() {
      if (!active) return null;
      active = false;
      periodic ? clearInterval(id) : clearTimeout(id);
      return null;
    },
  };
  if (periodic) {
    id = setInterval(() => {
      if (!active) return;
      tick++;
      callback(timer);
    }, delay);
  } else {
    id = setTimeout(() => {
      if (!active) return;
      active = false;
      tick = 1;
      callback();
    }, delay);
  }
  return timer;
}
function __dartCreateZone(parent = null, values = null) {
  const zoneValues = values instanceof Map ? values : new Map();
  const zone = {
    __dartType: "Zone",
    parent,
    get errorZone() { return zone; },
    get(key) {
      if (zoneValues.has(key)) return zoneValues.get(key);
      return parent == null ? null : parent.get(key);
    },
    "[]"(key) { return this.get(key); },
    run(body) { return __dartRunInZone(zone, body); },
    runUnary(body, argument) { return __dartRunInZone(zone, () => body(argument)); },
    runBinary(body, first, second) { return __dartRunInZone(zone, () => body(first, second)); },
    runGuarded(body) { try { return __dartRunInZone(zone, body); } catch (error) { return zone.handleUncaughtError(error, error?.stack ?? "<javascript stack unavailable>"); } },
    runUnaryGuarded(body, argument) { try { return __dartRunInZone(zone, () => body(argument)); } catch (error) { return zone.handleUncaughtError(error, error?.stack ?? "<javascript stack unavailable>"); } },
    runBinaryGuarded(body, first, second) { try { return __dartRunInZone(zone, () => body(first, second)); } catch (error) { return zone.handleUncaughtError(error, error?.stack ?? "<javascript stack unavailable>"); } },
    bindCallback(callback) { return () => zone.run(callback); },
    bindUnaryCallback(callback) { return argument => zone.runUnary(callback, argument); },
    bindBinaryCallback(callback) { return (first, second) => zone.runBinary(callback, first, second); },
    bindCallbackGuarded(callback) { return () => zone.runGuarded(callback); },
    bindUnaryCallbackGuarded(callback) { return argument => zone.runUnaryGuarded(callback, argument); },
    bindBinaryCallbackGuarded(callback) { return (first, second) => zone.runBinaryGuarded(callback, first, second); },
    registerCallback(callback) { return zone.bindCallback(callback); },
    registerUnaryCallback(callback) { return zone.bindUnaryCallback(callback); },
    registerBinaryCallback(callback) { return zone.bindBinaryCallback(callback); },
    fork(options = {}) { return __dartCreateZone(zone, options.zoneValues); },
    scheduleMicrotask(callback) { return __dartScheduleMicrotask(callback, zone); },
    handleUncaughtError(error, stackTrace = null) { throw error; },
    inSameErrorZone(other) { return true; },
    print(line) { console.log(String(line)); return null; },
    toString() { return "Zone"; },
  };
  return Object.freeze(zone);
}
const __dartRootZone = __dartCreateZone(null, new Map());
let __dartCurrentZone = __dartRootZone;
function __dartZoneValuesMap(zoneValues) {
  if (zoneValues == null) return new Map();
  if (zoneValues instanceof Map) return zoneValues;
  return new Map(Array.from(zoneValues));
}
function __dartScheduleMicrotask(callback, zone = __dartCurrentZone) {
  const run = () => __dartRunInZone(zone, callback);
  if (typeof queueMicrotask === "function") queueMicrotask(run);
  else Promise.resolve().then(run);
  return null;
}
function __dartRunInZone(zone, body) {
  const previous = __dartCurrentZone;
  __dartCurrentZone = zone;
  try {
    const result = body();
    if (result != null && typeof result.then === "function") {
      return result.finally(() => { __dartCurrentZone = previous; });
    }
    __dartCurrentZone = previous;
    return result;
  } catch (error) {
    __dartCurrentZone = previous;
    throw error;
  }
}
function __dartRunZoned(body, options = {}) {
  const parent = options.parentZone ?? __dartCurrentZone;
  const zone = __dartCreateZone(parent, __dartZoneValuesMap(options.zoneValues));
  try {
    return __dartRunInZone(zone, body);
  } catch (error) {
    if (typeof options.onError === "function") return options.onError(error, error?.stack ?? "<javascript stack unavailable>");
    throw error;
  }
}
function __dartRunZonedGuarded(body, onError, options = {}) {
  try {
    const result = __dartRunZoned(body, { zoneValues: options.zoneValues, parentZone: options.parentZone ?? __dartCurrentZone });
    if (result != null && typeof result.then === "function") {
      return result.catch((error) => { onError(error, error?.stack ?? "<javascript stack unavailable>"); return null; });
    }
    return result;
  } catch (error) {
    onError(error, error?.stack ?? "<javascript stack unavailable>");
    return null;
  }
}
function __dartFutureWait(futures, eagerError = false, cleanUp = null) {
  const entries = Array.from(futures);
  if (entries.length === 0) return Promise.resolve([]);
  const values = new Array(entries.length);
  const completed = new Array(entries.length).fill(false);
  let remaining = entries.length;
  let hasError = false;
  let firstError;
  let rejected = false;
  function runCleanUp(value) {
    if (value == null || typeof cleanUp !== "function") return;
    Promise.resolve().then(() => cleanUp(value));
  }
  return new Promise((resolve, reject) => {
    entries.forEach((future, index) => {
      Promise.resolve(future).then(
        (value) => {
          values[index] = value;
          completed[index] = true;
          if (hasError) runCleanUp(value);
          remaining--;
          if (remaining === 0 && !rejected) {
            rejected = hasError;
            hasError ? reject(firstError) : resolve(values);
          }
        },
        (error) => {
          if (!hasError) {
            hasError = true;
            firstError = error;
            for (let i = 0; i < values.length; i++) {
              if (completed[i]) runCleanUp(values[i]);
            }
          }
          remaining--;
          if ((eagerError || remaining === 0) && !rejected) {
            rejected = true;
            reject(firstError);
          }
        },
      );
    });
  });
}
function __dartStreamController(broadcast = false, options = {}) {
  let onListen = options.onListen ?? null;
  let onPause = options.onPause ?? null;
  let onResume = options.onResume ?? null;
  let onCancel = options.onCancel ?? null;
  const listeners = new Set();
  let closed = false;
  let singleListened = false;
  let activeSubscriptions = 0;
  let resolveDone;
  const done = new Promise((resolve) => { resolveDone = resolve; });
  function makeState(bufferBeforeListen = false) {
    return { queue: [], waiters: [], active: false, bufferBeforeListen, ended: false };
  }
  const singleState = makeState(true);
  function subscriptionStarted() {
    activeSubscriptions++;
    if (activeSubscriptions === 1 && typeof onListen === "function") onListen();
  }
  function subscriptionEnded(canceled) {
    if (activeSubscriptions > 0) activeSubscriptions--;
    if (canceled && activeSubscriptions === 0 && typeof onCancel === "function") return onCancel();
    return null;
  }
  function endState(state, canceled, remove) {
    if (state.ended) return null;
    state.ended = true;
    if (remove) remove();
    return subscriptionEnded(canceled);
  }
  function stateHasPending(state) {
    return state.queue.length > 0 || state.waiters.length > 0;
  }
  function hasActiveListener() {
    if (broadcast) return listeners.size > 0;
    return singleState.active;
  }
  function maybeResolveDone() {
    if (!closed) return;
    if (broadcast) {
      if (listeners.size > 0) return;
      resolveDone(null);
      return;
    }
    if (!singleState.active && !stateHasPending(singleState)) resolveDone(null);
  }
  function settle(waiter, item) {
    if (item.done === true) waiter.resolve({ done: true });
    else if ("error" in item) waiter.reject(item.error);
    else waiter.resolve({ value: item.value, done: false });
  }
  function nextResult(item) {
    if (item.done === true) return Promise.resolve({ done: true });
    if ("error" in item) return Promise.reject(item.error);
    return Promise.resolve({ value: item.value, done: false });
  }
  function enqueue(state, item) {
    if (!state.active && !state.bufferBeforeListen) return;
    const waiter = state.waiters.shift();
    if (waiter) settle(waiter, item);
    else state.queue.push(item);
  }
  function clearWaiters(state) {
    while (state.waiters.length > 0) settle(state.waiters.shift(), { done: true });
  }
  function cancelState(state) {
    state.active = false;
    state.bufferBeforeListen = false;
    state.queue.length = 0;
    clearWaiters(state);
    maybeResolveDone();
  }
  function deliver(item) {
    if (closed) throw new Error("Cannot add event after closing");
    if (broadcast) {
      for (const listener of listeners) enqueue(listener, item);
      return;
    }
    enqueue(singleState, item);
  }
  function closeQueue() {
    if (closed) return;
    closed = true;
    if (broadcast) {
      for (const listener of listeners) {
        const remove = () => listeners.delete(listener);
        if (listener.queue.length === 0) { listener.active = false; clearWaiters(listener); endState(listener, false, remove); }
      }
    } else if (singleState.queue.length === 0) {
      singleState.active = false;
      clearWaiters(singleState);
      endState(singleState, false, null);
    }
    maybeResolveDone();
  }
  function iteratorForState(state, remove) {
    return {
      next() {
        const item = state.queue.shift();
        if (item) {
          const result = nextResult(item);
          maybeResolveDone();
          return result;
        }
        if (closed || !state.active) {
          state.active = false;
          state.bufferBeforeListen = false;
          const endResult = endState(state, false, remove);
          maybeResolveDone();
          return Promise.resolve(endResult).then(() => ({ done: true }));
        }
        return new Promise((resolve, reject) => state.waiters.push({ resolve, reject }));
      },
      return() {
        cancelState(state);
        const endResult = endState(state, true, remove);
        return Promise.resolve(endResult).then(() => ({ done: true }));
      },
    };
  }
  const controller = {
    get stream() { return stream; },
    get sink() { return controller; },
    get done() { return done; },
    get isClosed() { return closed; },
    get isPaused() { return !hasActiveListener() && !closed; },
    get hasListener() { return hasActiveListener(); },
    get onListen() { return onListen; },
    set onListen(value) { onListen = value; },
    get onPause() { return onPause; },
    set onPause(value) { onPause = value; },
    get onResume() { return onResume; },
    set onResume(value) { onResume = value; },
    get onCancel() { return onCancel; },
    set onCancel(value) { onCancel = value; },
    add(value) { deliver({ value }); return null; },
    addError(error, stackTrace = null) { deliver({ error }); return null; },
    close() { closeQueue(); return done; },
    async addStream(source, options = {}) {
      const iterator = source?.[Symbol.asyncIterator]?.();
      if (iterator == null) {
        for (const value of Array.from(source ?? [])) deliver({ value });
        return null;
      }
      while (true) {
        let step;
        try {
          step = await iterator.next();
        } catch (error) {
          deliver({ error });
          if (options.cancelOnError === true) {
            if (typeof iterator.return === "function") await iterator.return();
            return null;
          }
          continue;
        }
        if (step.done === true) return null;
        deliver({ value: step.value });
      }
    },
  };
  const stream = {
    isBroadcast: broadcast,
    _onPause() { return typeof onPause === "function" ? onPause() : null; },
    _onResume() { return typeof onResume === "function" ? onResume() : null; },
    [Symbol.asyncIterator]() {
      if (broadcast) {
        const state = makeState();
        state.active = true;
        listeners.add(state);
        subscriptionStarted();
        return iteratorForState(state, () => { listeners.delete(state); maybeResolveDone(); });
      }
      if (singleListened) {
        throw new Error("Bad state: Stream has already been listened to.");
      }
      singleListened = true;
      singleState.active = true;
      singleState.bufferBeforeListen = false;
      subscriptionStarted();
      return iteratorForState(singleState, null);
    },
  };
  return controller;
}
function __dartStreamFromIterable(values, isBroadcast = false) {
  let listened = false;
  return {
    isBroadcast,
    [Symbol.asyncIterator]() {
      if (!isBroadcast) {
        if (listened) throw new Error("Bad state: Stream has already been listened to.");
        listened = true;
      }
      return (async function*() {
        for (const value of values) yield value;
      })();
    },
  };
}
function __dartStreamFromFuture(future) {
  return (async function*() {
    yield await future;
  })();
}
function __dartStreamIterable(stream) {
  if (stream != null && typeof stream[Symbol.asyncIterator] === "function") return stream;
  if (stream == null || typeof stream.listen !== "function") return stream;
  return {
    [Symbol.asyncIterator]() {
      const queue = [];
      const waiters = [];
      let done = false;
      let error = null;
      let subscription = null;
      function push(record) {
        if (waiters.length > 0) waiters.shift()(record);
        else queue.push(record);
      }
      function finish(doneError = null) {
        if (done) return;
        done = true;
        error = doneError;
        push({ done: true });
      }
      subscription = stream.listen(
        (value) => push({ value, done: false }),
        { onError: (listenError) => finish(listenError), onDone: () => finish(), cancelOnError: true },
      );
      return {
        async next() {
          if (queue.length === 0 && done) {
            if (error != null) throw error;
            return { done: true };
          }
          const record = queue.length > 0 ? queue.shift() : await new Promise((resolve) => waiters.push(resolve));
          if (record.done) {
            if (error != null) throw error;
            return { done: true };
          }
          return { value: record.value, done: false };
        },
        async return() {
          done = true;
          queue.length = 0;
          while (waiters.length > 0) waiters.shift()({ done: true });
          if (subscription != null && typeof subscription.cancel === "function") await subscription.cancel();
          return { done: true };
        },
      };
    },
  };
}
function __dartStreamTransformerFromHandlers({ handleData = null, handleError = null, handleDone = null } = {}) {
  return {
    bind(stream) {
      const controller = __dartStreamController(false);
      const sink = controller.sink;
      (async () => {
        let shouldClose = false;
        try {
          const iterator = __dartStreamIterable(stream)[Symbol.asyncIterator]();
          while (!controller.isClosed) {
            let next;
            try {
              next = await iterator.next();
            } catch (error) {
              if (typeof handleError === "function") {
                await handleError(error, error?.stack ?? "<javascript stack unavailable>", sink);
                continue;
              }
              sink.addError(error);
              continue;
            }
            if (next.done) {
              if (typeof handleDone === "function") {
                await handleDone(sink);
              } else {
                shouldClose = true;
              }
              break;
            }
            if (typeof handleData === "function") {
              await handleData(next.value, sink);
            } else {
              sink.add(next.value);
            }
          }
        } catch (error) {
          if (!controller.isClosed) sink.addError(error);
          shouldClose = true;
        } finally {
          if (shouldClose && !controller.isClosed) await controller.close();
        }
      })();
      return controller.stream;
    },
  };
}
function __dartStreamTransformerBind(transformer, stream) {
  if (transformer != null && typeof transformer.bind === "function") return transformer.bind(stream);
  if (transformer != null && typeof transformer.convert === "function") return __dartConverterBind(transformer, stream);
  if (typeof transformer === "function") return transformer(stream);
  throw new TypeError("StreamTransformer.bind is not available");
}
function __dartStreamTransform(stream, transformer) {
  return __dartStreamTransformerBind(transformer, stream);
}
function __dartStreamEventTransformed(stream, mapSink) {
  const controller = __dartStreamController(stream?.isBroadcast === true);
  const sink = mapSink(controller.sink);
  (async () => {
    try {
      const iterator = __dartStreamIterable(stream)[Symbol.asyncIterator]();
      while (!controller.isClosed) {
        let next;
        try {
          next = await iterator.next();
        } catch (error) {
          if (typeof sink.addError === "function") {
            sink.addError(error, error?.stack ?? "<javascript stack unavailable>");
          } else {
            controller.addError(error);
          }
          continue;
        }
        if (next.done) break;
        sink.add(next.value);
      }
      if (typeof sink.close === "function") {
        await sink.close();
      } else if (!controller.isClosed) {
        await controller.close();
      }
    } catch (error) {
      if (!controller.isClosed) controller.addError(error);
      if (!controller.isClosed) await controller.close();
    }
  })();
  return controller.stream;
}
async function __dartStreamToList(stream) {
  const values = [];
  for await (const value of __dartStreamIterable(stream)) values.push(value);
  return values;
}
function __dartStreamCast(stream, test, typeName) {
  return (async function*() {
    for await (const value of __dartStreamIterable(stream)) {
      yield __dartAs(value, test, typeName);
    }
  })();
}
async function __dartStreamPipe(stream, consumer) {
  if (typeof consumer.addStream === "function") {
    await consumer.addStream(stream);
  } else {
    for await (const value of __dartStreamIterable(stream)) consumer.add(value);
  }
  return typeof consumer.close === "function" ? await consumer.close() : null;
}
function __dartStreamListen(stream, onData, onError = null, onDone = null, cancelOnError = false) {
  if (stream != null && typeof stream.listen === "function" && typeof stream[Symbol.asyncIterator] !== "function") {
    return stream.listen(onData, { onError, onDone, cancelOnError });
  }
  const iteratorFactory = stream?.[Symbol.asyncIterator];
  if (typeof iteratorFactory !== "function") throw new TypeError("Object is not a Stream");
  const iterator = iteratorFactory.call(stream);
  let canceled = false;
  let paused = false;
  let resumeWaiter = null;
  function waitWhilePaused() {
    if (!paused) return Promise.resolve();
    return new Promise((resolve) => { resumeWaiter = resolve; });
  }
  const done = (async () => {
      while (!canceled) {
        await waitWhilePaused();
        if (canceled) break;
        let next;
        try {
          next = await iterator.next();
        } catch (error) {
          if (typeof onError === "function") onError(error);
          else throw error;
          if (cancelOnError) break;
          continue;
        }
        if (next.done) break;
        if (typeof onData === "function") onData(next.value);
      }
      if (!canceled && typeof onDone === "function") onDone();
    return null;
  })();
  return {
    get isPaused() { return paused; },
    pause(resumeSignal = null) {
      if (!paused) {
        paused = true;
        if (typeof stream._onPause === "function") stream._onPause();
      }
      if (resumeSignal != null) Promise.resolve(resumeSignal).then(() => this.resume());
      return null;
    },
    resume() {
      if (!paused) return null;
      paused = false;
      if (typeof stream._onResume === "function") stream._onResume();
      if (resumeWaiter != null) {
        const resolve = resumeWaiter;
        resumeWaiter = null;
        resolve();
      }
      return null;
    },
    onData(handleData) { onData = handleData; return null; },
    onError(handleError) { onError = handleError; return null; },
    onDone(handleDone) { onDone = handleDone; return null; },
    cancel() { canceled = true; this.resume(); if (typeof iterator.return === "function") return Promise.resolve(iterator.return()).then(() => done, () => done); return done; },
    asFuture(value = null) { return done.then(() => value); },
  };
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
function __dartShr(left, right) {
  return Math.floor(left / (2 ** right));
}
const __dartConstValues = new Map();
function __dartConst(key, create) {
  if (!__dartConstValues.has(key)) {
    __dartConstValues.set(key, create());
  }
  return __dartConstValues.get(key);
}
function __dartLazyField(name, initialize, writable, publish) {
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

const $Result_interface = Symbol("Result");
const $StreamSinkTransformer_interface = Symbol("StreamSinkTransformer");
const $_EventRequest_interface = Symbol("_EventRequest");

class AsyncCache {
  constructor(duration) {
    this._cachedStreamSplitter = null;
    this._cachedValueFuture = null;
    this._stale = null;
    this._duration = duration;
  }
  static ephemeral() {
    return $AsyncCache_ephemeral(AsyncCache);
  }
  async fetch(callback) {
    if (!((this._cachedStreamSplitter === null))) {
      {
        (() => { throw __dartCoreError("StateError", "Previously used to cache via `fetchStream`"); })();
      }
    }
    return (this._cachedValueFuture ?? (this._cachedValueFuture = (() => { let v = (callback)(); return (() => {
      (v.finally(__dartBind(this, "_startStaleTimer")).catch(() => null), null);
      return v;
    })(); })()));
  }
  fetchStream(callback) {
    if (!((this._cachedValueFuture === null))) {
      {
        (() => { throw __dartCoreError("StateError", "Previously used to cache via `fetch`"); })();
      }
    }
    let splitter = (this._cachedStreamSplitter ?? (this._cachedStreamSplitter = new StreamSplitter(__dartStreamTransform((callback)(), __dartStreamTransformerFromHandlers({ handleData: null, handleError: null, handleDone: (sink) => {
      this._startStaleTimer();
      sink.close();
} })))));
    return splitter.split();
  }
  invalidate() {
    this._cachedValueFuture = null;
    ((this._cachedStreamSplitter)?.close() ?? null);
    this._cachedStreamSplitter = null;
    ((this._stale)?.cancel() ?? null);
    this._stale = null;
  }
  _startStaleTimer() {
    let duration = this._duration;
    if (!((duration === null))) {
      {
        this._stale = __dartTimer(duration, __dartBind(this, "invalidate"), false);
      }
    } else {
      {
        this.invalidate();
      }
    }
  }
}

function $AsyncCache_ephemeral($newTarget) {
  const $self = Object.create($newTarget.prototype);
  $self._cachedStreamSplitter = null;
  $self._cachedValueFuture = null;
  $self._stale = null;
  $self._duration = null;
  return $self;
}

class CancelableOperation {
  constructor() {
    throw new TypeError("Class CancelableOperation has no unnamed constructor");
  }
  static _(_completer) {
    return $CancelableOperation__(CancelableOperation, _completer);
  }
  static fromFuture(result, { onCancel = null } = {}) {
    return (() => { let v = new CancelableCompleter({ onCancel: onCancel }); return (() => {
      v.complete(result);
      return v;
    })(); })().operation;
  }
  static fromValue(value) {
    return (() => { let v = new CancelableCompleter(); return (() => {
      v.complete(value);
      return v;
    })(); })().operation;
  }
  static fromSubscription(subscription) {
    let completer = new CancelableCompleter({ onCancel: __dartBind(subscription, "cancel") });
    subscription.onDone(__dartAs(__dartBind(completer, "complete"), value => typeof value === "function", "void Function([FutureOr<void>?])"));
    subscription.onError(function(error, stackTrace) {
      subscription.cancel().finally(function() {
        completer.completeError(error, stackTrace);
});
});
    return completer.operation;
  }
  static race(operations) {
    operations = Array.from(operations);
    if (__dartIterableIsEmpty(operations)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "May not be empty"); })();
      }
    }
    let done = false;
    function cancelAll() {
      done = true;
      return __dartFutureWait((() => {
        const v = new Array(0).fill(null);
        {
          let _sync_for_iterator = __dartIterator(operations);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let operation = _sync_for_iterator.current;
              if (!(operation.isCanceled)) {
                (v.push(operation.cancel()), null);
              }
            }
          }
        }
        return v;
      })(), false, null);
    }
    let completer = new CancelableCompleter({ onCancel: cancelAll });
    {
      let _sync_for_iterator = __dartIterator(operations);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let operation = _sync_for_iterator.current;
          {
            operation.then(function(value) {
              if (!(done)) {
                cancelAll().finally(function() { return completer.complete(value); });
              }
}, { onError: function(error, stackTrace) {
              if (!(done)) {
                {
                  cancelAll().finally(function() { return completer.completeError(error, stackTrace); });
                }
              }
}, propagateCancel: false });
          }
        }
      }
    }
    return completer.operation;
  }
  get value() {
    return ((this._completer._inner)?.future ?? __dartCompleter().future);
  }
  asStream() {
    let controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: __dartBind(this._completer, "_cancel") });
    (() => { let v = this._completer._inner; return ((v === null) ? null : v.future.then(function(value) {
      controller.add(value);
      controller.close();
}, function(error, stackTrace) {
      controller.addError(error, stackTrace);
      controller.close();
})); })();
    return controller.stream;
  }
  valueOrCancellation(cancellationValue = null) {
    let completer = __dartCompleter();
    this.value.then(__dartAs(__dartBind(completer, "complete"), value => typeof value === "function", "void Function([FutureOr<CancelableOperation.T?>?])"), __dartBind(completer, "completeError"));
    (() => { let v = this._completer._cancelCompleter; return ((v === null) ? null : v.future.then(function(_) {
      completer.complete(cancellationValue);
}, __dartBind(completer, "completeError"))); })();
    return completer.future;
  }
  then(onValue, { onError = null, onCancel = null, propagateCancel = true } = {}) {
    return this.thenOperation(function(value, completer) {
      completer.complete((onValue)(value));
}, { onError: ((onError === null) ? null : function(error, stackTrace, completer) {
      completer.complete((onError)(error, stackTrace));
}), onCancel: ((onCancel === null) ? null : function(completer) {
      completer.complete((onCancel)());
}), propagateCancel: propagateCancel });
  }
  thenOperation(onValue, { onError = null, onCancel = null, propagateCancel = true } = {}) {
    const completer = new CancelableCompleter({ onCancel: (propagateCancel ? __dartBind(this, "_cancelIfNotCanceled") : null) });
    (() => { let v = this._completer._inner; return ((v === null) ? null : v.future.then(async function(value) {
      if (completer.isCanceled) {
        return;
      }
      try {
        {
          await (onValue)(value, completer);
        }
      } catch ($error) {
        if ($error != null) {
          const error = $error;
          const stack = $error?.stack ?? "<javascript stack unavailable>";
          {
            completer.completeError(error, stack);
          }
        } else {
          throw $error;
        }
      }
}, ((onError === null) ? __dartBind(completer, "completeError") : async function(error, stack) {
      if (completer.isCanceled) {
        return;
      }
      try {
        {
          await (onError)(error, stack, completer);
        }
      } catch ($error) {
        if ($error != null) {
          const error2 = $error;
          const stack2 = $error?.stack ?? "<javascript stack unavailable>";
          {
            _extension_0_completeErrorIfPending(completer, error2, (Object.is(error, error2) ? stack : stack2));
          }
        } else {
          throw $error;
        }
      }
}))); })();
    const cancelForwarder = new _CancelForwarder(completer, onCancel);
    if (this._completer.isCanceled) {
      {
        cancelForwarder._forward();
      }
    } else {
      {
        ((() => { let v_1 = this._completer; return (v_1._cancelForwarders ?? (v_1._cancelForwarders = new Array(0).fill(null))); })().push(cancelForwarder), null);
      }
    }
    return completer.operation;
  }
  cancel() {
    return this._completer._cancel();
  }
  _cancelIfNotCanceled() {
    return (this.isCanceled ? null : this.cancel());
  }
  get isCanceled() {
    return this._completer._isCanceled;
  }
  get isCompleted() {
    return this._completer._isCompleted;
  }
}

function $CancelableOperation__($newTarget, _completer) {
  const $self = Object.create($newTarget.prototype);
  $self._completer = _completer;
  return $self;
}

class CancelableCompleter {
  constructor({ onCancel = null } = {}) {
    this._inner = __dartCompleter();
    this._cancelCompleter = __dartCompleter();
    this._cancelForwarders = null;
    this._mayComplete = true;
    const $operation = __dartLazyField("CancelableCompleter.operation", () => CancelableOperation._(this), false);
    Object.defineProperty(this, "operation", {
      get() { return $operation.get(); },
      set(value) { $operation.set(value); },
      enumerable: true,
    });
    this._onCancel = onCancel;
  }
  get _isCompleted() {
    return (this._cancelCompleter === null);
  }
  get _isCanceled() {
    return (this._inner === null);
  }
  get isCompleted() {
    return !(this._mayComplete);
  }
  get isCanceled() {
    return this._isCanceled;
  }
  complete(value = null) {
    if (!(this._mayComplete)) {
      (() => { throw __dartCoreError("StateError", "Operation already completed"); })();
    }
    this._mayComplete = false;
    if (!(value != null && typeof value.then === "function")) {
      {
        ((this._completeNow())?.complete(value) ?? null);
        return;
      }
    }
    if ((this._inner === null)) {
      {
        (value.catch(() => null), null);
        return;
      }
    }
    value.then((result) => {
      ((this._completeNow())?.complete(result) ?? null);
}, (error, stackTrace) => {
      ((this._completeNow())?.completeError(error, stackTrace) ?? null);
});
  }
  completeOperation(result, { propagateCancel = true } = {}) {
    if (!(this._mayComplete)) {
      (() => { throw __dartCoreError("StateError", "Already completed"); })();
    }
    this._mayComplete = false;
    if (this.isCanceled) {
      {
        if (propagateCancel) {
          result.cancel();
        }
        (result.value.catch(() => null), null);
        return;
      }
    }
    result.then((value) => {
      ((this._inner)?.complete(value) ?? null);
}, { onError: (error, stack) => {
      ((this._inner)?.completeError(error, stack) ?? null);
}, onCancel: () => {
      this.operation.cancel();
} });
    if (propagateCancel) {
      {
        (() => { let v = this._cancelCompleter; return ((v === null) ? null : v.future.finally(__dartBind(result, "cancel"))); })();
      }
    }
  }
  _completeNow() {
    let inner = this._inner;
    if ((inner === null)) {
      return null;
    }
    this._cancelCompleter = null;
    return inner;
  }
  completeError(error, stackTrace = null) {
    if (!(this._mayComplete)) {
      (() => { throw __dartCoreError("StateError", "Operation already completed"); })();
    }
    this._mayComplete = false;
    ((this._completeNow())?.completeError(error, stackTrace) ?? null);
  }
  _cancel() {
    let cancelCompleter = this._cancelCompleter;
    if ((cancelCompleter === null)) {
      return Promise.resolve(null);
    }
    if (!((this._inner === null))) {
      {
        this._inner = null;
        cancelCompleter.complete(this._invokeCancelCallbacks());
      }
    }
    return cancelCompleter.future;
  }
  async _invokeCancelCallbacks() {
    const toReturn = (() => { let v = this._onCancel; return ((v === null) ? null : (v)()); })();
    const isFuture = toReturn != null && typeof toReturn.then === "function";
    const cancelFutures = (() => {
      const v = new Array(0).fill(null);
      if (isFuture) {
        (v.push(toReturn), null);
      }
      const v_1 = (() => { let v_2 = this._cancelForwarders; return ((v_2 === null) ? null : Array.from(Array.from(v_2, _forward)).filter((value) => value != null)); })();
      if (!((v_1 === null))) {
        (v.push(...Array.from(v_1)), null);
      }
      return v;
    })();
    const results = ((isFuture && __dartEquals(cancelFutures.length, 1)) ? [await toReturn] : (cancelFutures.length !== 0 ? await __dartFutureWait(cancelFutures, false, null) : __dartConst("[\"list\",\"DynamicType(dynamic)\"]", () => Object.freeze([]))));
    return (isFuture ? __dartIndexGet(results, 0) : toReturn);
  }
}

class _CancelForwarder {
  constructor(completer, onCancel) {
    this.completer = completer;
    this.onCancel = onCancel;
  }
  _forward() {
    if (this.completer.isCanceled) {
      return null;
    }
    const onCancel = this.onCancel;
    if ((onCancel === null)) {
      return this.completer._cancel();
    }
    try {
      {
        const result = (onCancel)(this.completer);
        if (result != null && typeof result.then === "function") {
          {
            return result.catch(_extension_0_get_completeErrorIfPending(this.completer));
          }
        }
      }
    } catch ($error) {
      if ($error != null) {
        const error = $error;
        const stack = $error?.stack ?? "<javascript stack unavailable>";
        {
          _extension_0_completeErrorIfPending(this.completer, error, stack);
        }
      } else {
        throw $error;
      }
    }
    return null;
  }
}

class DelegatingStreamSink {
  constructor(sink) {
    this._sink = sink;
  }
  static _(_sink) {
    return $DelegatingStreamSink__(DelegatingStreamSink, _sink);
  }
  get done() {
    return this._sink.done;
  }
  static typed(sink) {
    return (sink != null && typeof sink === "object" && typeof sink.add === "function" && typeof sink.addError === "function" && typeof sink.close === "function" ? sink : DelegatingStreamSink._(sink));
  }
  add(data) {
    this._sink.add(data);
  }
  addError(error, stackTrace = null) {
    this._sink.addError(error, stackTrace);
  }
  addStream(stream) {
    return this._sink.addStream(stream, { cancelOnError: false });
  }
  close() {
    return this._sink.close();
  }
}

function $DelegatingStreamSink__($newTarget, _sink) {
  const $self = Object.create($newTarget.prototype);
  $self._sink = _sink;
  return $self;
}

class TypeSafeStreamSubscription {
  constructor(_subscription) {
    this._subscription = _subscription;
  }
  get isPaused() {
    return this._subscription.isPaused;
  }
  onData(handleData) {
    if ((handleData === null)) {
      return this._subscription.onData(null);
    }
    this._subscription.onData(function(data) { return (handleData)(__dartAs(data, value => true, "T")); });
  }
  onError(handleError) {
    this._subscription.onError(handleError);
  }
  onDone(handleDone) {
    this._subscription.onDone(handleDone);
  }
  pause(resumeFuture = null) {
    this._subscription.pause(resumeFuture);
  }
  resume() {
    this._subscription.resume();
  }
  cancel() {
    return this._subscription.cancel();
  }
  asFuture(futureValue = null) {
    return this._subscription.asFuture(futureValue);
  }
}

class DelegatingStreamSubscription {
  constructor(sourceSubscription) {
    this._source = sourceSubscription;
  }
  static typed(subscription) {
    return (subscription != null && typeof subscription === "object" && typeof subscription.pause === "function" && typeof subscription.resume === "function" && typeof subscription.cancel === "function" ? subscription : new TypeSafeStreamSubscription(subscription));
  }
  onData(handleData) {
    this._source.onData(handleData);
  }
  onError(handleError) {
    this._source.onError(handleError);
  }
  onDone(handleDone) {
    this._source.onDone(handleDone);
  }
  pause(resumeFuture = null) {
    this._source.pause(resumeFuture);
  }
  resume() {
    this._source.resume();
  }
  cancel() {
    return this._source.cancel();
  }
  asFuture(futureValue = null) {
    return this._source.asFuture(futureValue);
  }
  get isPaused() {
    return this._source.isPaused;
  }
}

class FutureGroup {
  constructor() {
    this._pending = 0;
    this._closed = false;
    this._completer = __dartCompleter();
    this._onIdleController = null;
    this._values = new Array(0).fill(null);
  }
  get isClosed() {
    return this._closed;
  }
  get future() {
    return this._completer.future;
  }
  get isIdle() {
    return __dartEquals(this._pending, 0);
  }
  get onIdle() {
    return (this._onIdleController ?? (this._onIdleController = __dartStreamController(true, { onListen: null, onPause: null, onResume: null, onCancel: null }))).stream;
  }
  add(task) {
    if (this._closed) {
      (() => { throw __dartCoreError("StateError", "The FutureGroup is closed."); })();
    }
    let index = this._values.length;
    (this._values.push(null), null);
    this._pending = (this._pending + 1);
    task.then((value) => {
      if (this._completer.isCompleted) {
        return null;
      }
      this._pending = (this._pending - 1);
      __dartIndexSet(this._values, index, value);
      if (!(__dartEquals(this._pending, 0))) {
        return null;
      }
      let onIdleController = this._onIdleController;
      if (!((onIdleController === null))) {
        onIdleController.add(null);
      }
      if (!(this._closed)) {
        return null;
      }
      if (!((onIdleController === null))) {
        onIdleController.close();
      }
      this._completer.complete(Array.from(Array.from(this._values).filter((value) => true)));
}).catch((error, stackTrace) => {
      if (this._completer.isCompleted) {
        return null;
      }
      this._completer.completeError(error, stackTrace);
});
  }
  close() {
    this._closed = true;
    if (!(__dartEquals(this._pending, 0))) {
      return;
    }
    if (this._completer.isCompleted) {
      return;
    }
    this._completer.complete(Array.from(Array.from(this._values).filter((value) => true)));
  }
}

class CaptureStreamTransformer {
  bind(source) {
    return __dartStreamEventTransformed(source, $CaptureSink_new_tearoff);
  }
}

class Result {
  constructor(computation) {
    if (new.target === Result) {
      try {
        {
          return new ValueResult((computation)());
        }
      } catch ($error) {
        if ($error != null) {
          const e = $error;
          const s = $error?.stack ?? "<javascript stack unavailable>";
          {
            return new ErrorResult(e, s);
          }
        } else {
          throw $error;
        }
      }
    }
  }
  static value(value) {
    return new ValueResult(value);
  }
  static error(error, stackTrace = null) {
    return new ErrorResult(error, stackTrace);
  }
  static capture(future) {
    return future.then($ValueResult_new_tearoff, $ErrorResult_new_tearoff);
  }
  static captureAll(elements) {
    let results = new Array(0).fill(null);
    let pending = 0;
    const completer = __dartLazyField("completer", null, true, null);
    {
      let _sync_for_iterator = __dartIterator(elements);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            if (element != null && typeof element.then === "function") {
              {
                let i = results.length;
                (results.push(null), null);
                pending = (pending + 1);
                Result.capture(element).then(function(result) {
                  __dartIndexSet(results, i, result);
                  if (__dartEquals(pending = (pending - 1), 0)) {
                    {
                      completer.get().complete(Array.from(results));
                    }
                  }
});
              }
            } else {
              {
                (results.push(new ValueResult(element)), null);
              }
            }
          }
        }
      }
    }
    if (__dartEquals(pending, 0)) {
      {
        return Promise.resolve(Array.from(results));
      }
    }
    completer.set(__dartCompleter());
    return completer.get().future;
  }
  static release(future) {
    return future.then(function(result) { return result.asFuture; });
  }
  static captureStream(source) {
    return __dartStreamTransform(source, new CaptureStreamTransformer());
  }
  static releaseStream(source) {
    return __dartStreamTransform(source, new ReleaseStreamTransformer());
  }
  static releaseSink(sink) {
    return new ReleaseSink(sink);
  }
  static captureSink(sink) {
    return new CaptureSink(sink);
  }
  static flatten(result) {
    if (result.isValue) {
      return __dartNullCheck(result.asValue).value;
    }
    return __dartNullCheck(result.asError);
  }
  static flattenAll(results) {
    let values = new Array(0).fill(null);
    {
      let _sync_for_iterator = __dartIterator(results);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let result = _sync_for_iterator.current;
          {
            if (result.isValue) {
              {
                (values.push(__dartNullCheck(result.asValue).value), null);
              }
            } else {
              {
                return __dartNullCheck(result.asError);
              }
            }
          }
        }
      }
    }
    return new ValueResult(values);
  }
  get isValue() {
    throw new TypeError("Abstract member Result.isValue");
  }
  set isValue(value) {
    Object.defineProperty(this, "isValue", { value, writable: true, configurable: true, enumerable: true });
  }
  get isError() {
    throw new TypeError("Abstract member Result.isError");
  }
  set isError(value) {
    Object.defineProperty(this, "isError", { value, writable: true, configurable: true, enumerable: true });
  }
  get asValue() {
    throw new TypeError("Abstract member Result.asValue");
  }
  set asValue(value) {
    Object.defineProperty(this, "asValue", { value, writable: true, configurable: true, enumerable: true });
  }
  get asError() {
    throw new TypeError("Abstract member Result.asError");
  }
  set asError(value) {
    Object.defineProperty(this, "asError", { value, writable: true, configurable: true, enumerable: true });
  }
  complete(completer) {
    throw new TypeError("Abstract member Result.complete");
  }
  addTo(sink) {
    throw new TypeError("Abstract member Result.addTo");
  }
  get asFuture() {
    throw new TypeError("Abstract member Result.asFuture");
  }
  set asFuture(value) {
    Object.defineProperty(this, "asFuture", { value, writable: true, configurable: true, enumerable: true });
  }
}
Object.defineProperty(Result, Symbol.hasInstance, { value(value) { return value != null && value[$Result_interface] === true; } });

class ValueResult {
  constructor(value) {
    this.value = value;
    Object.defineProperty(this, $Result_interface, { value: true });
  }
  get isValue() {
    return true;
  }
  get isError() {
    return false;
  }
  get asValue() {
    return this;
  }
  get asError() {
    return null;
  }
  complete(completer) {
    completer.complete(this.value);
  }
  addTo(sink) {
    sink.add(this.value);
  }
  get asFuture() {
    return Promise.resolve(this.value);
  }
  get hashCode() {
    return (__dartHashValue(this.value) ^ 842997089);
  }
  "=="(other) {
    return (other instanceof ValueResult && __dartEquals(this.value, other.value));
  }
}

class ErrorResult {
  constructor(error, stackTrace = null) {
    this.error = error;
    this.stackTrace = (stackTrace ?? (error?.stack ?? new Error().stack ?? "<javascript stack unavailable>"));
    Object.defineProperty(this, $Result_interface, { value: true });
  }
  get isValue() {
    return false;
  }
  get isError() {
    return true;
  }
  get asValue() {
    return null;
  }
  get asError() {
    return this;
  }
  complete(completer) {
    completer.completeError(this.error, this.stackTrace);
  }
  addTo(sink) {
    sink.addError(this.error, this.stackTrace);
  }
  get asFuture() {
    return Promise.reject(this.error);
  }
  handle(errorHandler) {
    if (typeof errorHandler === "function") {
      {
        (errorHandler)(this.error, this.stackTrace);
      }
    } else {
      if (typeof errorHandler === "function") {
        {
          (errorHandler)(this.error);
        }
      } else {
        {
          (() => { throw __dartCoreError("ArgumentError", "is neither Function(Object, StackTrace) nor Function(Object)"); })();
        }
      }
    }
  }
  get hashCode() {
    return ((__dartHashValue(this.error) ^ __dartHashValue(this.stackTrace)) ^ 492929599);
  }
  "=="(other) {
    return ((other instanceof ErrorResult && __dartEquals(this.error, other.error)) && __dartEquals(this.stackTrace, other.stackTrace));
  }
}

class ReleaseSink {
  constructor(_sink) {
    this._sink = _sink;
  }
  add(result) {
    result.addTo(this._sink);
  }
  addError(error, stackTrace = null) {
    this._sink.addError(error, stackTrace);
  }
  close() {
    this._sink.close();
  }
}

class ReleaseStreamTransformer {
  bind(source) {
    return __dartStreamEventTransformed(source, ReleaseStreamTransformer._createSink);
  }
  static _createSink(sink) {
    return new ReleaseSink(sink);
  }
}

class StreamSinkTransformer {
  constructor() {
    if (new.target === StreamSinkTransformer) {
      throw new TypeError("Class StreamSinkTransformer has no unnamed constructor");
    }
  }
  static fromStreamTransformer(transformer) {
    return new StreamTransformerWrapper(transformer);
  }
  static fromHandlers({ handleData = null, handleError = null, handleDone = null } = {}) {
    return new HandlerTransformer(handleData, handleError, handleDone);
  }
  bind(sink) {
    throw new TypeError("Abstract member StreamSinkTransformer.bind");
  }
  static typed(transformer) {
    return (transformer instanceof StreamSinkTransformer ? transformer : new TypeSafeStreamSinkTransformer(transformer));
  }
}
Object.defineProperty(StreamSinkTransformer, Symbol.hasInstance, { value(value) { return value != null && value[$StreamSinkTransformer_interface] === true; } });

class HandlerTransformer {
  constructor(_handleData, _handleError, _handleDone) {
    this._handleData = _handleData;
    this._handleError = _handleError;
    this._handleDone = _handleDone;
    Object.defineProperty(this, $StreamSinkTransformer_interface, { value: true });
  }
  bind(sink) {
    return new _HandlerSink(this, sink);
  }
}

class _HandlerSink {
  constructor(_transformer, inner) {
    this._transformer = _transformer;
    this._inner = inner;
    this._safeCloseInner = new _SafeCloseSink(inner);
  }
  get done() {
    return this._inner.done;
  }
  add(event) {
    let handleData = __dartAs(this._transformer._handleData, value => (value === null || typeof value === "function"), "void Function(_HandlerSink.S%, EventSink<_HandlerSink.T%>)?");
    if ((handleData === null)) {
      {
        this._inner.add(__dartAs(event, value => true, "T"));
      }
    } else {
      {
        (handleData)(event, this._safeCloseInner);
      }
    }
  }
  addError(error, stackTrace = null) {
    let handleError = __dartAs(this._transformer._handleError, value => (value === null || typeof value === "function"), "void Function(Object, StackTrace, EventSink<_HandlerSink.T%>)?");
    if ((handleError === null)) {
      {
        this._inner.addError(error, stackTrace);
      }
    } else {
      {
        (handleError)(error, (stackTrace ?? (error?.stack ?? new Error().stack ?? "<javascript stack unavailable>")), this._safeCloseInner);
      }
    }
  }
  addStream(stream) {
    return this._inner.addStream(__dartStreamTransform(stream, __dartStreamTransformerFromHandlers({ handleData: __dartAs(this._transformer._handleData, value => (value === null || typeof value === "function"), "void Function(_HandlerSink.S%, EventSink<_HandlerSink.T%>)?"), handleError: __dartAs(this._transformer._handleError, value => (value === null || typeof value === "function"), "void Function(Object, StackTrace, EventSink<_HandlerSink.T%>)?"), handleDone: _closeSink })), { cancelOnError: false });
  }
  close() {
    let handleDone = __dartAs(this._transformer._handleDone, value => (value === null || typeof value === "function"), "void Function(EventSink<_HandlerSink.T%>)?");
    if ((handleDone === null)) {
      return this._inner.close();
    }
    (handleDone)(this._safeCloseInner);
    return this._inner.done;
  }
}

class _SafeCloseSink extends DelegatingStreamSink {
  constructor(inner) {
    super(inner);
  }
  close() {
    return super.close().catch(function(_) {
});
  }
}

class StreamTransformerWrapper {
  constructor(_transformer) {
    this._transformer = _transformer;
    Object.defineProperty(this, $StreamSinkTransformer_interface, { value: true });
  }
  bind(sink) {
    return new _StreamTransformerWrapperSink(this._transformer, sink);
  }
}

class _StreamTransformerWrapperSink {
  constructor(transformer, _inner) {
    this._controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null });
    this._inner = _inner;
    __dartStreamListen(__dartStreamTransform(this._controller.stream, transformer), __dartAs(__dartBind(this._inner, "add"), value => typeof value === "function", "void Function(_StreamTransformerWrapperSink.T%)"), __dartBind(this._inner, "addError"), () => {
      this._inner.close().catch(function(_) {
});
}, false);
  }
  get done() {
    return this._inner.done;
  }
  add(event) {
    this._controller.add(event);
  }
  addError(error, stackTrace = null) {
    this._controller.addError(error, stackTrace);
  }
  addStream(stream) {
    return this._controller.addStream(stream, { cancelOnError: false });
  }
  close() {
    this._controller.close();
    return this._inner.done;
  }
}

class TypeSafeStreamSinkTransformer {
  constructor(_inner) {
    this._inner = _inner;
    Object.defineProperty(this, $StreamSinkTransformer_interface, { value: true });
  }
  bind(sink) {
    return (() => { let v = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null }); return (() => {
      __dartStreamPipe(__dartStreamCast(v.stream, (value) => true, "DynamicType(dynamic)"), this._inner.bind(sink));
      return v;
    })(); })();
  }
}

class CaptureSink {
  constructor(sink) {
    this._sink = sink;
  }
  add(value) {
    this._sink.add(new ValueResult(value));
  }
  addError(error, stackTrace = null) {
    this._sink.add(Result.error(error, stackTrace));
  }
  close() {
    this._sink.close();
  }
}

class StreamCompleter {
  constructor() {
    this._stream = new _CompleterStream();
  }
  static fromFuture(streamFuture) {
    let completer = new StreamCompleter();
    streamFuture.then(__dartAs(__dartBind(completer, "setSourceStream"), value => typeof value === "function", "void Function(Stream<StreamCompleter.fromFuture.T%>)"), __dartBind(completer, "setError"));
    return completer.stream;
  }
  get stream() {
    return this._stream;
  }
  setSourceStream(sourceStream) {
    if (this._stream._isSourceStreamSet) {
      {
        (() => { throw __dartCoreError("StateError", "Source stream already set"); })();
      }
    }
    this._stream._setSourceStream(sourceStream);
  }
  setEmpty() {
    if (this._stream._isSourceStreamSet) {
      {
        (() => { throw __dartCoreError("StateError", "Source stream already set"); })();
      }
    }
    this._stream._setEmpty();
  }
  setError(error, stackTrace = null) {
    this.setSourceStream(__dartStreamFromFuture(Promise.reject(error)));
  }
}

class _CompleterStream {
  constructor() {
    this._controller = null;
    this._sourceStream = null;
  }
  listen(onData, { onError = null, onDone = null, cancelOnError = null } = {}) {
    if ((this._controller === null)) {
      {
        let sourceStream = this._sourceStream;
        if ((!((sourceStream === null)) && !((sourceStream.isBroadcast === true)))) {
          {
            return __dartStreamListen(sourceStream, onData, onError, onDone, cancelOnError);
          }
        }
        this._ensureController();
        if (!((this._sourceStream === null))) {
          {
            this._linkStreamToController();
          }
        }
      }
    }
    return __dartStreamListen(__dartNullCheck(this._controller).stream, onData, onError, onDone, cancelOnError);
  }
  get _isSourceStreamSet() {
    return !((this._sourceStream === null));
  }
  _setSourceStream(sourceStream) {
    this._sourceStream = sourceStream;
    if (!((this._controller === null))) {
      {
        this._linkStreamToController();
      }
    }
  }
  _linkStreamToController() {
    let controller = __dartNullCheck(this._controller);
    controller.addStream(__dartNullCheck(this._sourceStream), { cancelOnError: false }).finally(__dartBind(controller, "close"));
  }
  _setEmpty() {
    let controller = this._ensureController();
    this._sourceStream = controller.stream;
    controller.close();
  }
  _ensureController() {
    return (this._controller ?? (this._controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null })));
  }
}

class StreamGroup {
  constructor() {
    const $_controller = __dartLazyField("StreamGroup._controller", null, true);
    Object.defineProperty(this, "_controller", {
      get() { return $_controller.get(); },
      set(value) { $_controller.set(value); },
      enumerable: true,
    });
    this._closed = false;
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" })));
    this._onIdleController = null;
    this._subscriptions = new Map([]);
    this._controller = __dartStreamController(false, { onListen: __dartBind(this, "_onListen"), onPause: __dartBind(this, "_onPause"), onResume: __dartBind(this, "_onResume"), onCancel: __dartBind(this, "_onCancel") });
  }
  static broadcast() {
    return $StreamGroup_broadcast(StreamGroup);
  }
  get stream() {
    return this._controller.stream;
  }
  get isClosed() {
    return this._closed;
  }
  get isIdle() {
    return this._subscriptions.size === 0;
  }
  get onIdle() {
    return (this._onIdleController ?? (this._onIdleController = __dartStreamController(true, { onListen: null, onPause: null, onResume: null, onCancel: null }))).stream;
  }
  static merge(streams) {
    let group = new StreamGroup();
    (Array.from(streams).forEach(__dartAs(__dartBind(group, "add"), value => typeof value === "function", "Future<void>? Function(Stream<StreamGroup.merge.T%>)")), null);
    group.close();
    return group.stream;
  }
  static mergeBroadcast(streams) {
    let group = StreamGroup.broadcast();
    (Array.from(streams).forEach(__dartAs(__dartBind(group, "add"), value => typeof value === "function", "Future<void>? Function(Stream<StreamGroup.mergeBroadcast.T%>)")), null);
    group.close();
    return group.stream;
  }
  add(stream) {
    if (this._closed) {
      {
        (() => { throw __dartCoreError("StateError", "Can't add a Stream to a closed StreamGroup."); })();
      }
    }
    if (__dartEquals(this._state, __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" }))))) {
      {
        __dartMapPutIfAbsent(this._subscriptions, stream, function() { return null; });
      }
    } else {
      if (__dartEquals(this._state, __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"canceled\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "canceled" }))))) {
        {
          return __dartStreamListen(stream, null, null, null, false).cancel();
        }
      } else {
        {
          __dartMapPutIfAbsent(this._subscriptions, stream, () => { return this._listenToStream(stream); });
        }
      }
    }
    return null;
  }
  remove(stream) {
    let subscription = __dartMapRemove(this._subscriptions, stream);
    let future = ((subscription)?.cancel() ?? null);
    if (this._subscriptions.size === 0) {
      {
        ((this._onIdleController)?.add(null) ?? null);
        if (this._closed) {
          {
            ((this._onIdleController)?.close() ?? null);
            __dartScheduleMicrotask(__dartBind(this._controller, "close"));
          }
        }
      }
    }
    return future;
  }
  _onListen() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"listening\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "listening" })));
    {
      let _sync_for_iterator = __dartIterator((() => {
        const v = Array.from(Array.from(this._subscriptions, ([key, value]) => ({ key, value })));
        return v;
      })());
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let entry = _sync_for_iterator.current;
          L:
          {
            if (!((entry.value === null))) {
              break L;
            }
            let stream = entry.key;
            try {
              {
                __dartMapSet(this._subscriptions, stream, this._listenToStream(stream));
              }
            } catch ($error) {
              if ($error != null) {
                const error = $error;
                {
                  ((this._onCancel())?.catchError(function(_) {
}) ?? null);
                  (() => { throw $error; })();
                }
              } else {
                throw $error;
              }
            }
          }
        }
      }
    }
  }
  _onPause() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"paused\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "paused" })));
    {
      let _sync_for_iterator = __dartIterator(Array.from(this._subscriptions.values()));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let subscription = _sync_for_iterator.current;
          {
            __dartNullCheck(subscription).pause();
          }
        }
      }
    }
  }
  _onResume() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"listening\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "listening" })));
    {
      let _sync_for_iterator = __dartIterator(Array.from(this._subscriptions.values()));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let subscription = _sync_for_iterator.current;
          {
            __dartNullCheck(subscription).resume();
          }
        }
      }
    }
  }
  _onCancel() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"canceled\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "canceled" })));
    let futures = Array.from(Array.from(Array.from(Array.from(this._subscriptions, ([key, value]) => ({ key, value })), function(entry) {
      let subscription = entry.value;
      try {
        {
          if (!((subscription === null))) {
            return subscription.cancel();
          }
          return __dartStreamListen(entry.key, null, null, null, false).cancel();
        }
      } catch ($error) {
        if ($error != null) {
          const _ = $error;
          {
            return null;
          }
        } else {
          throw $error;
        }
      }
})).filter((value) => value != null));
    (this._subscriptions.clear(), null);
    let onIdleController = this._onIdleController;
    if ((!((onIdleController === null)) && !(onIdleController.isClosed))) {
      {
        onIdleController.add(null);
        onIdleController.close();
      }
    }
    return (futures.length === 0 ? null : __dartFutureWait(futures, false, null));
  }
  _onCancelBroadcast() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" })));
    __dartMapForEach(this._subscriptions, (stream, subscription) => {
      if (!((stream.isBroadcast === true))) {
        return;
      }
      __dartNullCheck(subscription).cancel();
      __dartMapSet(this._subscriptions, stream, null);
});
  }
  _listenToStream(stream) {
    let subscription = __dartStreamListen(stream, __dartAs(__dartBind(this._controller, "add"), value => typeof value === "function", "void Function(StreamGroup.T%)"), __dartBind(this._controller, "addError"), () => { return this.remove(stream); }, false);
    if (__dartEquals(this._state, __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"paused\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "paused" }))))) {
      subscription.pause();
    }
    return subscription;
  }
  close() {
    if (this._closed) {
      return this._controller.done;
    }
    this._closed = true;
    if (this._subscriptions.size === 0) {
      {
        ((this._onIdleController)?.close() ?? null);
        this._controller.close();
        return this._controller.done;
      }
    }
    if ((this._controller.stream.isBroadcast === true)) {
      {
        let streamsToRemove = null;
        __dartMapUpdateAll(this._subscriptions, (stream, subscription) => {
          if (!((subscription === null))) {
            return subscription;
          }
          try {
            {
              return this._listenToStream(stream);
            }
          } catch ($error) {
            if ($error != null) {
              {
                ((streamsToRemove ?? (streamsToRemove = new Array(0).fill(null))).push(stream), null);
                return null;
              }
            } else {
              throw $error;
            }
          }
});
        ((streamsToRemove)?.forEach(__dartBind(this._subscriptions, "remove")) ?? null);
      }
    }
    return this._controller.done;
  }
}

function $StreamGroup_broadcast($newTarget) {
  const $self = Object.create($newTarget.prototype);
  const $_controller = __dartLazyField("StreamGroup._controller", null, true);
  Object.defineProperty($self, "_controller", {
    get() { return $_controller.get(); },
    set(value) { $_controller.set(value); },
    enumerable: true,
  });
  $self._closed = false;
  $self._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" })));
  $self._onIdleController = null;
  $self._subscriptions = new Map([]);
  $self._controller = __dartStreamController(true, { onListen: __dartBind($self, "_onListen"), onPause: null, onResume: null, onCancel: __dartBind($self, "_onCancelBroadcast") });
  return $self;
}

class _StreamGroupState {
  constructor(name) {
    this.name = name;
  }
  toString() {
    return this.name;
  }
}

class StreamSplitter {
  constructor(_stream) {
    this._subscription = null;
    this._buffer = new Array(0).fill(null);
    this._controllers = (() => {
      const v = new Set();
      return v;
    })();
    this._closeGroup = new FutureGroup();
    this._isDone = false;
    this._isClosed = false;
    this._stream = _stream;
  }
  static splitFrom(stream, count = null) {
    ((count === null) ? count = 2 : null);
    let splitter = new StreamSplitter(stream);
    let streams = Array.from({ length: count }, (_, index) => (function(_) { return splitter.split(); })(index));
    splitter.close();
    return streams;
  }
  split() {
    if (this._isClosed) {
      {
        (() => { throw __dartCoreError("StateError", "Can't call split() on a closed StreamSplitter."); })();
      }
    }
    let controller = __dartStreamController(false, { onListen: __dartBind(this, "_onListen"), onPause: __dartBind(this, "_onPause"), onResume: __dartBind(this, "_onResume"), onCancel: null });
    controller.onCancel = () => { return this._onCancel(controller); };
    {
      let _sync_for_iterator = __dartIterator(this._buffer);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let result = _sync_for_iterator.current;
          {
            result.addTo(controller);
          }
        }
      }
    }
    if (this._isDone) {
      {
        this._closeGroup.add(controller.close());
      }
    } else {
      {
        __dartSetAdd(this._controllers, controller);
      }
    }
    return controller.stream;
  }
  close() {
    if (this._isClosed) {
      return this._closeGroup.future;
    }
    this._isClosed = true;
    (this._buffer.length = 0, null);
    if (__dartIterableIsEmpty(this._controllers)) {
      this._cancelSubscription();
    }
    return this._closeGroup.future;
  }
  _cancelSubscription() {
    let future = null;
    if (!((this._subscription === null))) {
      future = __dartNullCheck(this._subscription).cancel();
    }
    if (!((future === null))) {
      this._closeGroup.add(future);
    }
    this._closeGroup.close();
  }
  _onListen() {
    if (this._isDone) {
      return;
    }
    if (!((this._subscription === null))) {
      {
        __dartNullCheck(this._subscription).resume();
      }
    } else {
      {
        this._subscription = __dartStreamListen(this._stream, __dartBind(this, "_onData"), __dartBind(this, "_onError"), __dartBind(this, "_onDone"), false);
      }
    }
  }
  _onPause() {
    if (!(Array.from(this._controllers).every(function(controller) { return controller.isPaused; }))) {
      return;
    }
    __dartNullCheck(this._subscription).pause();
  }
  _onResume() {
    __dartNullCheck(this._subscription).resume();
  }
  _onCancel(controller) {
    __dartSetRemove(this._controllers, controller);
    if (!__dartIterableIsEmpty(this._controllers)) {
      return;
    }
    if (this._isClosed) {
      {
        this._cancelSubscription();
      }
    } else {
      {
        __dartNullCheck(this._subscription).pause();
      }
    }
  }
  _onData(data) {
    if (!(this._isClosed)) {
      (this._buffer.push(new ValueResult(data)), null);
    }
    {
      let _sync_for_iterator = __dartIterator(this._controllers);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let controller = _sync_for_iterator.current;
          {
            controller.add(data);
          }
        }
      }
    }
  }
  _onError(error, stackTrace) {
    if (!(this._isClosed)) {
      (this._buffer.push(Result.error(error, stackTrace)), null);
    }
    {
      let _sync_for_iterator = __dartIterator(this._controllers);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let controller = _sync_for_iterator.current;
          {
            controller.addError(error, stackTrace);
          }
        }
      }
    }
  }
  _onDone() {
    this._isDone = true;
    {
      let _sync_for_iterator = __dartIterator(this._controllers);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let controller = _sync_for_iterator.current;
          {
            this._closeGroup.add(controller.close());
          }
        }
      }
    }
  }
}

class SubscriptionStream {
  constructor(subscription) {
    this._source = subscription;
    let source = __dartNullCheck(this._source);
    source.pause();
    source.onData(null);
    source.onError(null);
    source.onDone(null);
  }
  listen(onData, { onError = null, onDone = null, cancelOnError = null } = {}) {
    let subscription = this._source;
    if ((subscription === null)) {
      {
        (() => { throw __dartCoreError("StateError", "Stream has already been listened to."); })();
      }
    }
    cancelOnError = __dartEquals(true, cancelOnError);
    this._source = null;
    let result = (cancelOnError ? new _CancelOnErrorSubscriptionWrapper(subscription) : subscription);
    result.onData(onData);
    result.onError(onError);
    result.onDone(onDone);
    subscription.resume();
    return result;
  }
}

class _CancelOnErrorSubscriptionWrapper extends DelegatingStreamSubscription {
  constructor(subscription) {
    super(subscription);
  }
  onError(handleError) {
    super.onError((error, stackTrace) => {
      super.cancel().finally(function() {
        if (typeof handleError === "function") {
          {
            (handleError)(error, stackTrace);
          }
        } else {
          if (typeof handleError === "function") {
            {
              (handleError)(error);
            }
          }
        }
});
});
  }
}

class StreamQueue {
  static _(_source) {
    return $StreamQueue__(StreamQueue, _source);
  }
  get eventsDispatched() {
    return (this._eventsReceived - this._eventQueue.length);
  }
  constructor(source) {
    return StreamQueue._(source);
  }
  get hasNext() {
    this._checkNotClosed();
    let hasNextRequest = new _HasNextRequest();
    this._addRequest(hasNextRequest);
    return hasNextRequest.future;
  }
  lookAhead(count) {
    __dartCheckNotNegative(count, "count", null);
    this._checkNotClosed();
    let request = new _LookAheadRequest(count);
    this._addRequest(request);
    return request.future;
  }
  get next() {
    this._checkNotClosed();
    let nextRequest = new _NextRequest();
    this._addRequest(nextRequest);
    return nextRequest.future;
  }
  get peek() {
    this._checkNotClosed();
    let nextRequest = new _PeekRequest();
    this._addRequest(nextRequest);
    return nextRequest.future;
  }
  get rest() {
    this._checkNotClosed();
    let request = new _RestRequest(this);
    this._isClosed = true;
    this._addRequest(request);
    return request.stream;
  }
  skip(count) {
    __dartCheckNotNegative(count, "count", null);
    this._checkNotClosed();
    let request = new _SkipRequest(count);
    this._addRequest(request);
    return request.future;
  }
  take(count) {
    __dartCheckNotNegative(count, "count", null);
    this._checkNotClosed();
    let request = new _TakeRequest(count);
    this._addRequest(request);
    return request.future;
  }
  startTransaction() {
    this._checkNotClosed();
    let request = new _TransactionRequest(this);
    this._addRequest(request);
    return request.transaction;
  }
  async withTransaction(callback) {
    let transaction = this.startTransaction();
    let queue = transaction.newQueue();
    let result = null;
    try {
      {
        result = await (callback)(queue);
      }
    } catch ($error) {
      if ($error != null) {
        const _ = $error;
        {
          transaction.commit(queue);
          (() => { throw $error; })();
        }
      } else {
        throw $error;
      }
    }
    if (result) {
      {
        transaction.commit(queue);
      }
    } else {
      {
        transaction.reject();
      }
    }
    return result;
  }
  cancelable(callback) {
    let transaction = this.startTransaction();
    let completer = new CancelableCompleter({ onCancel: function() {
      transaction.reject();
} });
    let queue = transaction.newQueue();
    completer.complete((callback)(queue).finally(function() {
      if (!(completer.isCanceled)) {
        transaction.commit(queue);
      }
}));
    return completer.operation;
  }
  cancel({ immediate = false } = {}) {
    this._checkNotClosed();
    this._isClosed = true;
    if (!(immediate)) {
      {
        let request = new _CancelRequest(this);
        this._addRequest(request);
        return request.future;
      }
    }
    if ((this._isDone && this._eventQueue.isEmpty)) {
      return Promise.resolve(null);
    }
    return this._cancel();
  }
  _updateRequests() {
    while (!__dartIterableIsEmpty(this._requestQueue)) {
      {
        if (__dartIterableFirst(this._requestQueue).update(this._eventQueue, this._isDone)) {
          {
            this._requestQueue.shift();
          }
        } else {
          {
            return;
          }
        }
      }
    }
    if (!(this._isDone)) {
      {
        this._pause();
      }
    }
  }
  _extractStream() {
    if (this._isDone) {
      {
        return __dartStreamFromIterable([], true);
      }
    }
    this._isDone = true;
    let subscription = this._subscription;
    if ((subscription === null)) {
      {
        return this._source;
      }
    }
    this._subscription = null;
    let wasPaused = subscription.isPaused;
    let result = new SubscriptionStream(subscription);
    if (wasPaused) {
      subscription.resume();
    }
    return result;
  }
  _pause() {
    __dartNullCheck(this._subscription).pause();
  }
  _ensureListening() {
    if (this._isDone) {
      return;
    }
    if ((this._subscription === null)) {
      {
        this._subscription = __dartStreamListen(this._source, (data) => {
          this._addResult(new ValueResult(data));
}, (error, stackTrace) => {
          this._addResult(Result.error(error, stackTrace));
}, () => {
          this._subscription = null;
          this._close();
}, false);
      }
    } else {
      {
        __dartNullCheck(this._subscription).resume();
      }
    }
  }
  _cancel() {
    if (this._isDone) {
      return null;
    }
    ((this._subscription === null) ? this._subscription = __dartStreamListen(this._source, null, null, null, false) : null);
    let future = __dartNullCheck(this._subscription).cancel();
    this._close();
    return future;
  }
  _addResult(result) {
    this._eventsReceived = (this._eventsReceived + 1);
    this._eventQueue.add(result);
    this._updateRequests();
  }
  _close() {
    this._isDone = true;
    this._updateRequests();
  }
  _checkNotClosed() {
    if (this._isClosed) {
      (() => { throw __dartCoreError("StateError", "Already cancelled"); })();
    }
  }
  _addRequest(request) {
    if (__dartIterableIsEmpty(this._requestQueue)) {
      {
        if (request.update(this._eventQueue, this._isDone)) {
          return;
        }
        this._ensureListening();
      }
    }
    (this._requestQueue.push(request), null);
  }
}

function $StreamQueue__($newTarget, _source) {
  const $self = Object.create($newTarget.prototype);
  $self._subscription = null;
  $self._isDone = false;
  $self._isClosed = false;
  $self._eventsReceived = 0;
  $self._eventQueue = new QueueList();
  $self._requestQueue = [];
  $self._source = _source;
  if (($self._source.isBroadcast === true)) {
    {
      $self._ensureListening();
      $self._pause();
    }
  }
  return $self;
}

class StreamQueueTransaction {
  constructor() {
    throw new TypeError("Class StreamQueueTransaction has no unnamed constructor");
  }
  static _(_parent, source) {
    return $StreamQueueTransaction__(StreamQueueTransaction, _parent, source);
  }
  newQueue() {
    let queue = new StreamQueue(this._splitter.split());
    __dartSetAdd(this._queues, queue);
    return queue;
  }
  commit(queue) {
    this._assertActive();
    if (!(__dartIterableContains(this._queues, queue))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Queue doesn't belong to this transaction."); })();
      }
    } else {
      if (!__dartIterableIsEmpty(queue._requestQueue)) {
        {
          (() => { throw __dartCoreError("StateError", "A queue with pending requests can't be committed."); })();
        }
      }
    }
    this._committed = true;
    for (let j = 0; (j < queue.eventsDispatched); j = (j + 1)) {
      {
        this._parent._eventQueue.removeFirst();
      }
    }
    this._done();
  }
  reject() {
    this._assertActive();
    this._rejected = true;
    this._done();
  }
  _done() {
    this._splitter.close();
    {
      let _sync_for_iterator = __dartIterator(this._queues);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let queue = _sync_for_iterator.current;
          {
            queue._cancel();
          }
        }
      }
    }
    let currentRequest = __dartIterableFirst(this._parent._requestQueue);
    if ((currentRequest instanceof _TransactionRequest && __dartEquals(currentRequest.transaction, this))) {
      {
        this._parent._requestQueue.shift();
        this._parent._updateRequests();
      }
    }
  }
  _assertActive() {
    if (this._committed) {
      {
        (() => { throw __dartCoreError("StateError", "This transaction has already been accepted."); })();
      }
    } else {
      if (this._rejected) {
        {
          (() => { throw __dartCoreError("StateError", "This transaction has already been rejected."); })();
        }
      }
    }
  }
}

function $StreamQueueTransaction__($newTarget, _parent, source) {
  const $self = Object.create($newTarget.prototype);
  $self._queues = (() => {
    const v = new Set();
    return v;
  })();
  $self._committed = false;
  $self._rejected = false;
  $self._parent = _parent;
  $self._splitter = new StreamSplitter(source);
  return $self;
}

class _EventRequest {
  constructor() {
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  update(events, isDone) {
    throw new TypeError("Abstract member _EventRequest.update");
  }
}
Object.defineProperty(_EventRequest, Symbol.hasInstance, { value(value) { return value != null && value[$_EventRequest_interface] === true; } });

class _NextRequest {
  constructor() {
    this._completer = __dartCompleter();
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    if (events.length !== 0) {
      {
        events.removeFirst().complete(this._completer);
        return true;
      }
    }
    if (isDone) {
      {
        this._completer.completeError(__dartCoreError("StateError", "No elements"), (new Error().stack ?? "<javascript stack unavailable>"));
        return true;
      }
    }
    return false;
  }
}

class _PeekRequest {
  constructor() {
    this._completer = __dartCompleter();
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    if (events.length !== 0) {
      {
        __dartIndexGet(events, 0).complete(this._completer);
        return true;
      }
    }
    if (isDone) {
      {
        this._completer.completeError(__dartCoreError("StateError", "No elements"), (new Error().stack ?? "<javascript stack unavailable>"));
        return true;
      }
    }
    return false;
  }
}

class _SkipRequest {
  constructor(_eventsToSkip) {
    this._completer = __dartCompleter();
    this._eventsToSkip = _eventsToSkip;
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    L:
    while ((this._eventsToSkip > 0)) {
      {
        if (events.length === 0) {
          {
            if (isDone) {
              break L;
            }
            return false;
          }
        }
        this._eventsToSkip = (this._eventsToSkip - 1);
        let event = events.removeFirst();
        if (event.isError) {
          {
            this._completer.completeError(__dartNullCheck(event.asError).error, __dartNullCheck(event.asError).stackTrace);
            return true;
          }
        }
      }
    }
    this._completer.complete(this._eventsToSkip);
    return true;
  }
}

class _ListRequest {
  constructor(_eventsToTake) {
    this._completer = __dartCompleter();
    this._list = new Array(0).fill(null);
    this._eventsToTake = _eventsToTake;
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  get future() {
    return this._completer.future;
  }
}

class _TakeRequest extends _ListRequest {
  constructor(eventsToTake) {
    super(eventsToTake);
  }
  update(events, isDone) {
    L:
    while ((this._list.length < this._eventsToTake)) {
      {
        if (events.length === 0) {
          {
            if (isDone) {
              break L;
            }
            return false;
          }
        }
        let event = events.removeFirst();
        if (event.isError) {
          {
            __dartNullCheck(event.asError).complete(this._completer);
            return true;
          }
        }
        (this._list.push(__dartNullCheck(event.asValue).value), null);
      }
    }
    this._completer.complete(this._list);
    return true;
  }
}

class _LookAheadRequest extends _ListRequest {
  constructor(eventsToTake) {
    super(eventsToTake);
  }
  update(events, isDone) {
    L:
    while ((this._list.length < this._eventsToTake)) {
      {
        if (__dartEquals(events.length, this._list.length)) {
          {
            if (isDone) {
              break L;
            }
            return false;
          }
        }
        let event = Array.from(events)[this._list.length];
        if (event.isError) {
          {
            __dartNullCheck(event.asError).complete(this._completer);
            return true;
          }
        }
        (this._list.push(__dartNullCheck(event.asValue).value), null);
      }
    }
    this._completer.complete(this._list);
    return true;
  }
}

class _CancelRequest {
  constructor(_streamQueue) {
    this._completer = __dartCompleter();
    this._streamQueue = _streamQueue;
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    if (this._streamQueue._isDone) {
      {
        this._completer.complete();
      }
    } else {
      {
        this._streamQueue._ensureListening();
        this._completer.complete(__dartStreamListen(this._streamQueue._extractStream(), null, null, null, false).cancel());
      }
    }
    return true;
  }
}

class _RestRequest {
  constructor(_streamQueue) {
    this._completer = new StreamCompleter();
    this._streamQueue = _streamQueue;
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  get stream() {
    return this._completer.stream;
  }
  update(events, isDone) {
    if (events.length === 0) {
      {
        if (this._streamQueue._isDone) {
          {
            this._completer.setEmpty();
          }
        } else {
          {
            this._completer.setSourceStream(this._streamQueue._extractStream());
          }
        }
      }
    } else {
      {
        let controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null });
        {
          let _sync_for_iterator = __dartIterator(events);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let event = _sync_for_iterator.current;
              {
                event.addTo(controller);
              }
            }
          }
        }
        controller.addStream(this._streamQueue._extractStream(), { cancelOnError: false }).finally(__dartBind(controller, "close"));
        this._completer.setSourceStream(controller.stream);
      }
    }
    return true;
  }
}

class _HasNextRequest {
  constructor() {
    this._completer = __dartCompleter();
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    if (events.length !== 0) {
      {
        this._completer.complete(true);
        return true;
      }
    }
    if (isDone) {
      {
        this._completer.complete(false);
        return true;
      }
    }
    return false;
  }
}

class _TransactionRequest {
  constructor(parent) {
    const $transaction = __dartLazyField("_TransactionRequest.transaction", null, "once");
    Object.defineProperty(this, "transaction", {
      get() { return $transaction.get(); },
      set(value) { $transaction.set(value); },
      enumerable: true,
    });
    this._controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null });
    this._eventsSent = 0;
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
    this.transaction = StreamQueueTransaction._(parent, this._controller.stream);
  }
  update(events, isDone) {
    while ((this._eventsSent < events.length)) {
      {
        __dartIndexGet(events, (() => { let v = this._eventsSent; return (() => { let v_1 = this._eventsSent = (v + 1); return v; })(); })()).addTo(this._controller);
      }
    }
    if ((isDone && !(this._controller.isClosed))) {
      this._controller.close();
    }
    return (this.transaction._committed || this.transaction._rejected);
  }
}

class _QueueList_Object_ListMixin {
  constructor() {
  }
  add(element) {
    __dartIndexSet(this, (() => { let v = this.length; return (() => { let v_1 = this.length = (v + 1); return v; })(); })(), element);
  }
  addAll(iterable) {
    let i = this.length;
    {
      let _sync_for_iterator = __dartIterator(iterable);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            this.add(element);
            i = (i + 1);
          }
        }
      }
    }
  }
  cast() {
    return Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(_QueueList&Object&ListMixin.cast.R%)"));
  }
  toString() {
    return ("[" + Array.from(this, (value) => __dartStr(value)).join(", ") + "]");
  }
  removeLast() {
    if (__dartEquals(this.length, 0)) {
      {
        (() => { throw __dartCoreError("StateError", "No element"); })();
      }
    }
    let result = __dartIndexGet(this, (this.length - 1));
    this.length = (this.length - 1);
    return result;
  }
  get first() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return __dartIndexGet(this, 0);
  }
  set first(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    __dartIndexSet(this, 0, value);
  }
  get last() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return __dartIndexGet(this, (this.length - 1));
  }
  set last(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    __dartIndexSet(this, (this.length - 1), value);
  }
  get iterator() {
    return __dartIterator(this);
  }
  elementAt(index) {
    return __dartIndexGet(this, index);
  }
  followedBy(other) {
    return Array.from(this).concat(Array.from(other));
  }
  forEach(action) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        (action)(__dartIndexGet(this, i));
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
  }
  get isEmpty() {
    return __dartEquals(this.length, 0);
  }
  get isNotEmpty() {
    return !(this.length === 0);
  }
  get single() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    if ((this.length > 1)) {
      (() => { throw __dartCoreError("StateError", "Too many elements"); })();
    }
    return __dartIndexGet(this, 0);
  }
  contains(element) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          return true;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return false;
  }
  every(test) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (!((test)(__dartIndexGet(this, i)))) {
          return false;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return true;
  }
  any(test) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if ((test)(__dartIndexGet(this, i))) {
          return true;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return false;
  }
  firstWhere(test, { orElse = null } = {}) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = __dartIndexGet(this, i);
        if ((test)(element)) {
          return element;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  lastWhere(test, { orElse = null } = {}) {
    let length = this.length;
    for (let i = (length - 1); (i >= 0); i = (i - 1)) {
      {
        let element = __dartIndexGet(this, i);
        if ((test)(element)) {
          return element;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  singleWhere(test, { orElse = null } = {}) {
    let length = this.length;
    const match = __dartLazyField("match", null, true, null);
    let matchFound = false;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = __dartIndexGet(this, i);
        if ((test)(element)) {
          {
            if (matchFound) {
              {
                (() => { throw __dartCoreError("StateError", "Too many elements"); })();
              }
            }
            matchFound = true;
            match.set(element);
          }
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (matchFound) {
      return match.get();
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  join(separator = "") {
    if (__dartEquals(this.length, 0)) {
      return "";
    }
    let buffer = (() => { let v = __dartStringBuffer(""); return (() => {
      v.writeAll(this, separator);
      return v;
    })(); })();
    return __dartStr(buffer);
  }
  where(test) {
    return Array.from(this).filter((value) => test(value));
  }
  whereType() {
    return Array.from(this).filter((value) => true);
  }
  map(f) {
    return Array.from(this, (value) => f(value));
  }
  expand(f) {
    return Array.from(this).flatMap((value) => Array.from(f(value)));
  }
  reduce(combine) {
    let length = this.length;
    if (__dartEquals(length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    let value = __dartIndexGet(this, 0);
    for (let i = 1; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, __dartIndexGet(this, i));
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return value;
  }
  fold(initialValue, combine) {
    let value = initialValue;
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, __dartIndexGet(this, i));
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return value;
  }
  skip(count) {
    return Array.from(this).slice(count, null ?? undefined);
  }
  skipWhile(test) {
    return __dartIterableSkipWhile(this, test);
  }
  take(count) {
    return Array.from(this).slice(0, __dartNullCheck(count) ?? undefined);
  }
  takeWhile(test) {
    return __dartIterableTakeWhile(this, test);
  }
  toList({ growable = true } = {}) {
    if (this.length === 0) {
      return (growable ? [] : __dartFixedList([]));
    }
    let first = __dartIndexGet(this, 0);
    let result = (growable ? new Array(this.length).fill(first) : __dartFixedList(new Array(this.length).fill(first)));
    for (let i = 1; (i < this.length); i = (i + 1)) {
      {
        __dartIndexSet(result, i, __dartIndexGet(this, i));
      }
    }
    return result;
  }
  toSet() {
    let result = new Set();
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        __dartSetAdd(result, __dartIndexGet(this, i));
      }
    }
    return result;
  }
  remove(element) {
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          {
            this._closeGap(i, (i + 1));
            return true;
          }
        }
      }
    }
    return false;
  }
  _closeGap(start, end) {
    let length = this.length;
    let size = (end - start);
    for (let i = end; (i < length); i = (i + 1)) {
      {
        __dartIndexSet(this, (i - size), __dartIndexGet(this, i));
      }
    }
    this.length = (length - size);
  }
  removeWhere(test) {
    this._filter(test, false);
  }
  retainWhere(test) {
    this._filter(test, true);
  }
  _filter(test, retainMatching) {
    let retained = new Array(0).fill(null);
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = __dartIndexGet(this, i);
        if (__dartEquals((test)(element), retainMatching)) {
          {
            (retained.push(element), null);
          }
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!(__dartEquals(retained.length, this.length))) {
      {
        __dartListSetRange(this, 0, retained.length, retained, 0);
        this.length = retained.length;
      }
    }
  }
  clear() {
    this.length = 0;
  }
  sort(compare = null) {
    __dartListSort(this, (compare ?? ((left, right) => __dartCompare(left, right))));
  }
  shuffle(random = null) {
    ((random === null) ? random = __dartRandom(null, false) : null);
    let length = this.length;
    while ((length > 1)) {
      {
        let pos = random.nextInt(length);
        length = (length - 1);
        let tmp = __dartIndexGet(this, length);
        __dartIndexSet(this, length, __dartIndexGet(this, pos));
        __dartIndexSet(this, pos, tmp);
      }
    }
  }
  asMap() {
    return new Map(Array.from(this, (value, index) => [index, value]));
  }
  "+"(other) {
    return (() => {
      const v = Array.from(this);
      (v.push(...Array.from(other)), null);
      return v;
    })();
  }
  sublist(start, end = null) {
    let listLength = this.length;
    ((end === null) ? end = listLength : null);
    __dartCheckValidRange(start, end, listLength, null, null, null);
    return Array.from(this.slice(start, end));
  }
  getRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    return Array.from(this).slice(start, end ?? undefined);
  }
  removeRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if ((end > start)) {
      {
        this._closeGap(start, end);
      }
    }
  }
  fillRange(start, end, fill = null) {
    let value = (fill ?? (v ?? __dartAs(v_1, value => true, "E")));
    __dartCheckValidRange(start, end, this.length, null, null, null);
    for (let i = start; (i < end); i = (i + 1)) {
      {
        __dartIndexSet(this, i, value);
      }
    }
  }
  setRange(start, end, iterable, skipCount = 0) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    let length = (end - start);
    if (__dartEquals(length, 0)) {
      return;
    }
    __dartCheckNotNegative(skipCount, "skipCount", null);
    let otherList = null;
    let otherStart = null;
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        otherList = iterable;
        otherStart = skipCount;
      }
    } else {
      {
        otherList = __dartFixedList(Array.from(Array.from(iterable).slice(skipCount)));
        otherStart = 0;
      }
    }
    if (((otherStart + length) > otherList.length)) {
      {
        (() => { throw __dartCoreError("StateError", "Too few elements"); })();
      }
    }
    if ((otherStart < start)) {
      {
        for (let i = (length - 1); (i >= 0); i = (i - 1)) {
          {
            __dartIndexSet(this, (start + i), __dartIndexGet(otherList, (otherStart + i)));
          }
        }
      }
    } else {
      {
        for (let i_1 = 0; (i_1 < length); i_1 = (i_1 + 1)) {
          {
            __dartIndexSet(this, (start + i_1), __dartIndexGet(otherList, (otherStart + i_1)));
          }
        }
      }
    }
  }
  replaceRange(start, end, newContents) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if (__dartEquals(start, this.length)) {
      {
        this.addAll(newContents);
        return;
      }
    }
    if (!(newContents != null && typeof newContents !== "string" && typeof newContents.length === "number" && typeof newContents[Symbol.iterator] === "function")) {
      {
        newContents = Array.from(newContents);
      }
    }
    let removeLength = (end - start);
    let insertLength = __dartIterableLength(newContents);
    if ((removeLength >= insertLength)) {
      {
        let insertEnd = (start + insertLength);
        __dartListSetRange(this, start, insertEnd, newContents, 0);
        if ((removeLength > insertLength)) {
          {
            this._closeGap(insertEnd, end);
          }
        }
      }
    } else {
      if (__dartEquals(end, this.length)) {
        {
          let i = start;
          {
            let _sync_for_iterator = __dartIterator(newContents);
            for (; _sync_for_iterator.moveNext(); ) {
              {
                let element = _sync_for_iterator.current;
                {
                  if ((i < end)) {
                    {
                      __dartIndexSet(this, i, element);
                    }
                  } else {
                    {
                      this.add(element);
                    }
                  }
                  i = (i + 1);
                }
              }
            }
          }
        }
      } else {
        {
          let delta = (insertLength - removeLength);
          let oldLength = this.length;
          let insertEnd_1 = (start + insertLength);
          for (let i_1 = (oldLength - delta); (i_1 < oldLength); i_1 = (i_1 + 1)) {
            {
              this.add(__dartIndexGet(this, ((i_1 > 0) ? i_1 : 0)));
            }
          }
          if ((insertEnd_1 < oldLength)) {
            {
              __dartListSetRange(this, insertEnd_1, oldLength, this, end);
            }
          }
          __dartListSetRange(this, start, insertEnd_1, newContents, 0);
        }
      }
    }
  }
  indexOf(element, start = 0) {
    if ((start < 0)) {
      start = 0;
    }
    for (let i = start; (i < this.length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          return i;
        }
      }
    }
    return (-1);
  }
  indexWhere(test, start = 0) {
    if ((start < 0)) {
      start = 0;
    }
    for (let i = start; (i < this.length); i = (i + 1)) {
      {
        if ((test)(__dartIndexGet(this, i))) {
          return i;
        }
      }
    }
    return (-1);
  }
  lastIndexOf(element, start = null) {
    if (((start === null) || (start >= this.length))) {
      start = (this.length - 1);
    }
    for (let i = start; (i >= 0); i = (i - 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          return i;
        }
      }
    }
    return (-1);
  }
  lastIndexWhere(test, start = null) {
    if (((start === null) || (start >= this.length))) {
      start = (this.length - 1);
    }
    for (let i = start; (i >= 0); i = (i - 1)) {
      {
        if ((test)(__dartIndexGet(this, i))) {
          return i;
        }
      }
    }
    return (-1);
  }
  insert(index, element) {
    __dartNullCheck(index);
    let length = this.length;
    __dartCheckValueInInterval(index, 0, length, "index", null);
    this.add(element);
    if (!(__dartEquals(index, length))) {
      {
        __dartListSetRange(this, (index + 1), (length + 1), this, index);
        __dartIndexSet(this, index, element);
      }
    }
  }
  removeAt(index) {
    let result = __dartIndexGet(this, index);
    this._closeGap(index, (index + 1));
    return result;
  }
  insertAll(index, iterable) {
    __dartCheckValueInInterval(index, 0, this.length, "index", null);
    if (__dartEquals(index, this.length)) {
      {
        this.addAll(iterable);
        return;
      }
    }
    if ((!(iterable != null && typeof iterable !== "string" && typeof iterable.length === "number" && typeof iterable[Symbol.iterator] === "function") || Object.is(iterable, this))) {
      {
        iterable = Array.from(iterable);
      }
    }
    let insertionLength = __dartIterableLength(iterable);
    if (__dartEquals(insertionLength, 0)) {
      {
        return;
      }
    }
    let oldLength = this.length;
    for (let i = (oldLength - insertionLength); (i < oldLength); i = (i + 1)) {
      {
        this.add(__dartIndexGet(this, ((i > 0) ? i : 0)));
      }
    }
    if (!(__dartEquals(__dartIterableLength(iterable), insertionLength))) {
      {
        this.length = (this.length - insertionLength);
        (() => { throw __dartCoreError("ConcurrentModificationError", iterable); })();
      }
    }
    let oldCopyStart = (index + insertionLength);
    if ((oldCopyStart < oldLength)) {
      {
        __dartListSetRange(this, oldCopyStart, oldLength, this, index);
      }
    }
    __dartListSetAll(this, index, iterable);
  }
  setAll(index, iterable) {
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        __dartListSetRange(this, index, (index + __dartIterableLength(iterable)), iterable, 0);
      }
    } else {
      {
        {
          let _sync_for_iterator = __dartIterator(iterable);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let element = _sync_for_iterator.current;
              {
                __dartIndexSet(this, (() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element);
              }
            }
          }
        }
      }
    }
  }
  get reversed() {
    return Array.from(this).reverse();
  }
}

class QueueList extends _QueueList_Object_ListMixin {
  constructor(initialCapacity = null) {
    return $QueueList__init(new.target, QueueList._computeInitialCapacity(initialCapacity));
  }
  static _init(initialCapacity) {
    return $QueueList__init(QueueList, initialCapacity);
  }
  static _(_head, _tail, _table) {
    return $QueueList__(QueueList, _head, _tail, _table);
  }
  static _castFrom(source) {
    return new _CastQueueList(source);
  }
  static from(source) {
    if ((Array.isArray(source) || (ArrayBuffer.isView(source) && !(source instanceof DataView)))) {
      {
        let length = __dartIterableLength(source);
        let queue = new QueueList((length + 1));
        let sourceList = source;
        __dartListSetRange(queue._table, 0, length, sourceList, 0);
        queue._tail = length;
        return queue;
      }
    } else {
      {
        return (() => { let v = new QueueList(); return (() => {
          v.addAll(source);
          return v;
        })(); })();
      }
    }
  }
  static _computeInitialCapacity(initialCapacity) {
    if (((initialCapacity === null) || (initialCapacity < 8))) {
      {
        return 8;
      }
    }
    initialCapacity = (initialCapacity + 1);
    if (QueueList._isPowerOf2(initialCapacity)) {
      {
        return initialCapacity;
      }
    }
    return QueueList._nextPowerOf2(initialCapacity);
  }
  add(element) {
    this._add(element);
  }
  addAll(iterable) {
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        let list = iterable;
        let addCount = __dartIterableLength(list);
        let length = this.length;
        if (((length + addCount) >= this._table.length)) {
          {
            this._preGrow((length + addCount));
            __dartListSetRange(this._table, length, (length + addCount), list, 0);
            this._tail = (this._tail + addCount);
          }
        } else {
          {
            let endSpace = (this._table.length - this._tail);
            if ((addCount < endSpace)) {
              {
                __dartListSetRange(this._table, this._tail, (this._tail + addCount), list, 0);
                this._tail = (this._tail + addCount);
              }
            } else {
              {
                let preSpace = (addCount - endSpace);
                __dartListSetRange(this._table, this._tail, (this._tail + endSpace), list, 0);
                __dartListSetRange(this._table, 0, preSpace, list, endSpace);
                this._tail = preSpace;
              }
            }
          }
        }
      }
    } else {
      {
        {
          let _sync_for_iterator = __dartIterator(iterable);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let element = _sync_for_iterator.current;
              {
                this._add(element);
              }
            }
          }
        }
      }
    }
  }
  cast() {
    return QueueList._castFrom(this);
  }
  retype() {
    return this.cast();
  }
  toString() {
    return ("{" + Array.from(this, (value) => __dartStr(value)).join(", ") + "}");
  }
  addLast(element) {
    this._add(element);
  }
  addFirst(element) {
    this._head = ((this._head - 1) & (this._table.length - 1));
    __dartIndexSet(this._table, this._head, element);
    if (__dartEquals(this._head, this._tail)) {
      this._grow();
    }
  }
  removeFirst() {
    if (__dartEquals(this._head, this._tail)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    let result = (__dartIndexGet(this._table, this._head) ?? __dartAs(v, value => true, "E"));
    __dartIndexSet(this._table, this._head, null);
    this._head = ((this._head + 1) & (this._table.length - 1));
    return result;
  }
  removeLast() {
    if (__dartEquals(this._head, this._tail)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    this._tail = ((this._tail - 1) & (this._table.length - 1));
    let result = (__dartIndexGet(this._table, this._tail) ?? __dartAs(v, value => true, "E"));
    __dartIndexSet(this._table, this._tail, null);
    return result;
  }
  get length() {
    return ((this._tail - this._head) & (this._table.length - 1));
  }
  set length(value) {
    if ((value < 0)) {
      (() => { throw __dartCoreError("RangeError", "Length " + __dartStr(value) + " may not be negative."); })();
    }
    if (((value > this.length) && !(true))) {
      {
        (() => { throw __dartCoreError("UnsupportedError", "The length can only be increased when the element type is " + "nullable, but the current element type is `" + __dartStr(__dartType("E")) + "`."); })();
      }
    }
    let delta = (value - this.length);
    if ((delta >= 0)) {
      {
        if ((this._table.length <= value)) {
          {
            this._preGrow(value);
          }
        }
        this._tail = ((this._tail + delta) & (this._table.length - 1));
        return;
      }
    }
    let newTail = (this._tail + delta);
    if ((newTail >= 0)) {
      {
        (this._table.fill(null, newTail, this._tail), null);
      }
    } else {
      {
        newTail = (newTail + this._table.length);
        (this._table.fill(null, 0, this._tail), null);
        (this._table.fill(null, newTail, this._table.length), null);
      }
    }
    this._tail = newTail;
  }
  "[]"(index) {
    if (((index < 0) || (index >= this.length))) {
      {
        (() => { throw __dartCoreError("RangeError", "Index " + __dartStr(index) + " must be in the range [0.." + __dartStr(this.length) + ")."); })();
      }
    }
    return (__dartIndexGet(this._table, ((this._head + index) & (this._table.length - 1))) ?? __dartAs(v, value => true, "E"));
  }
  "[]="(index, value) {
    if (((index < 0) || (index >= this.length))) {
      {
        (() => { throw __dartCoreError("RangeError", "Index " + __dartStr(index) + " must be in the range [0.." + __dartStr(this.length) + ")."); })();
      }
    }
    __dartIndexSet(this._table, ((this._head + index) & (this._table.length - 1)), value);
  }
  static _isPowerOf2(number) {
    return __dartEquals((number & (number - 1)), 0);
  }
  static _nextPowerOf2(number) {
    number = ((number << 1) - 1);
    for (; ; ) {
      {
        let nextNumber = (number & (number - 1));
        if (__dartEquals(nextNumber, 0)) {
          return number;
        }
        number = nextNumber;
      }
    }
  }
  _add(element) {
    __dartIndexSet(this._table, this._tail, element);
    this._tail = ((this._tail + 1) & (this._table.length - 1));
    if (__dartEquals(this._head, this._tail)) {
      this._grow();
    }
  }
  _grow() {
    let newTable = __dartFixedList(new Array((this._table.length * 2)).fill(null));
    let split = (this._table.length - this._head);
    __dartListSetRange(newTable, 0, split, this._table, this._head);
    __dartListSetRange(newTable, split, (split + this._head), this._table, 0);
    this._head = 0;
    this._tail = this._table.length;
    this._table = newTable;
  }
  _writeToList(target) {
    if ((this._head <= this._tail)) {
      {
        let length = (this._tail - this._head);
        __dartListSetRange(target, 0, length, this._table, this._head);
        return length;
      }
    } else {
      {
        let firstPartSize = (this._table.length - this._head);
        __dartListSetRange(target, 0, firstPartSize, this._table, this._head);
        __dartListSetRange(target, firstPartSize, (firstPartSize + this._tail), this._table, 0);
        return (this._tail + firstPartSize);
      }
    }
  }
  _preGrow(newElementCount) {
    newElementCount = (newElementCount + __dartShr(newElementCount, 1));
    let newCapacity = QueueList._nextPowerOf2(newElementCount);
    let newTable = __dartFixedList(new Array(newCapacity).fill(null));
    this._tail = this._writeToList(newTable);
    this._table = newTable;
    this._head = 0;
  }
}

function $QueueList__init($newTarget, initialCapacity) {
  const $self = Reflect.construct(_QueueList_Object_ListMixin, [], $newTarget);
  $self._table = __dartFixedList(new Array(initialCapacity).fill(null));
  Object.defineProperty($self, "_head", {
    value: 0,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  Object.defineProperty($self, "_tail", {
    value: 0,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  return $self;
}

function $QueueList__($newTarget, _head, _tail, _table) {
  const $self = Reflect.construct(_QueueList_Object_ListMixin, [], $newTarget);
  Object.defineProperty($self, "_head", {
    value: _head,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  Object.defineProperty($self, "_tail", {
    value: _tail,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  $self._table = _table;
  return $self;
}

class _CastQueueList extends QueueList {
  constructor(_delegate) {
    const $self = $QueueList__(new.target, (-1), (-1), Array.from(_delegate._table, (value) => __dartAs(value, (value) => true, "TypeParameterType(_CastQueueList.T%)")));
    $self._delegate = _delegate;
    return $self;
  }
  get _head() {
    return this._delegate._head;
  }
  set _head(value) {
    return this._delegate._head = value;
  }
  get _tail() {
    return this._delegate._tail;
  }
  set _tail(value) {
    return this._delegate._tail = value;
  }
}


Object.defineProperty(Result, "captureStreamTransformer", { value: __dartConst("[\"instance\",\"class:CaptureStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]", () => Object.freeze(Object.create(CaptureStreamTransformer.prototype))), enumerable: true });

Object.defineProperty(Result, "releaseStreamTransformer", { value: __dartConst("[\"instance\",\"class:ReleaseStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]", () => Object.freeze(Object.create(ReleaseStreamTransformer.prototype))), enumerable: true });

Object.defineProperty(Result, "captureSinkTransformer", { value: __dartConst("[\"instance\",\"class:StreamTransformerWrapper\",[\"typeArgument\",\"InterfaceType(Object)\"],[\"typeArgument\",\"InterfaceType(Result<Object>)\"],[\"field\",\"field:StreamTransformerWrapper._transformer\",[\"instance\",\"class:CaptureStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]]]", () => Object.freeze(Object.assign(Object.create(StreamTransformerWrapper.prototype), { _transformer: __dartConst("[\"instance\",\"class:CaptureStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]", () => Object.freeze(Object.create(CaptureStreamTransformer.prototype))) }))), enumerable: true });

Object.defineProperty(Result, "releaseSinkTransformer", { value: __dartConst("[\"instance\",\"class:StreamTransformerWrapper\",[\"typeArgument\",\"InterfaceType(Result<Object>)\"],[\"typeArgument\",\"InterfaceType(Object)\"],[\"field\",\"field:StreamTransformerWrapper._transformer\",[\"instance\",\"class:ReleaseStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]]]", () => Object.freeze(Object.assign(Object.create(StreamTransformerWrapper.prototype), { _transformer: __dartConst("[\"instance\",\"class:ReleaseStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]", () => Object.freeze(Object.create(ReleaseStreamTransformer.prototype))) }))), enumerable: true });

Object.defineProperty(_StreamGroupState, "dormant", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" }))), enumerable: true });

Object.defineProperty(_StreamGroupState, "listening", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"listening\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "listening" }))), enumerable: true });

Object.defineProperty(_StreamGroupState, "paused", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"paused\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "paused" }))), enumerable: true });

Object.defineProperty(_StreamGroupState, "canceled", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"canceled\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "canceled" }))), enumerable: true });

Object.defineProperty(QueueList, "_initialCapacity", { value: 8, enumerable: true });
function _forward(forwarder) {
  return forwarder._forward();
}

function _extension_0_completeErrorIfPending(_this, error, stackTrace) {
  if (_this.isCompleted) {
    return;
  }
  _this.completeError(error, stackTrace);
}

function _extension_0_get_completeErrorIfPending(_this) {
  return function(error, stackTrace) { return _extension_0_completeErrorIfPending(_this, error, stackTrace); };
}

function _closeSink(sink) {
  sink.close();
}

export async function main() {
  const result = await Result.capture(Promise.resolve(42));
  const queue = new StreamQueue(__dartStreamFromIterable([1, 2, 3]));
  const first = await queue.next;
  await queue.skip(1);
  const last = await queue.next;
  await queue.cancel();
  const group = new StreamGroup();
  const groupedFuture = __dartStreamToList(group.stream);
  group.add(__dartStreamFromIterable([4, 5]));
  await group.close();
  const grouped = await groupedFuture;
  const cache = AsyncCache.ephemeral();
  const cached = await cache.fetch(function() { return Promise.resolve("cached"); });
  __dartPrint("async " + __dartStr(__dartNullCheck(result.asValue).value) + " " + __dartStr(first) + " " + __dartStr(last) + " " + __dartStr(__dartIterableJoin(grouped, "|")) + " " + __dartStr(cached));
}


function $CaptureSink_new_tearoff(sink) {
  return new CaptureSink(sink);
}

function $ValueResult_new_tearoff(value) {
  return new ValueResult(value);
}

function $ErrorResult_new_tearoff(error, stackTrace = null) {
  return new ErrorResult(error, stackTrace);
}
await main();
