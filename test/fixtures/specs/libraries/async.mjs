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
function __dartDurationToString(micros) {
  const sign = micros < 0 ? "-" : "";
  let rest = Math.abs(micros);
  const microseconds = rest % 1000000;
  const totalSeconds = Math.trunc(rest / 1000000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.trunc(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.trunc(totalMinutes / 60);
  return sign + hours + ":" + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0") + "." + String(microseconds).padStart(6, "0");
}
function __dartDuration(options = {}) {
  const micros = Math.trunc((options.days ?? 0) * 86400000000 + (options.hours ?? 0) * 3600000000 + (options.minutes ?? 0) * 60000000 + (options.seconds ?? 0) * 1000000 + (options.milliseconds ?? 0) * 1000 + (options.microseconds ?? 0));
  return {
    get inDays() { return Math.trunc(micros / 86400000000); },
    get inHours() { return Math.trunc(micros / 3600000000); },
    get inMinutes() { return Math.trunc(micros / 60000000); },
    get inSeconds() { return Math.trunc(micros / 1000000); },
    get inMilliseconds() { return Math.trunc(micros / 1000); },
    get inMicroseconds() { return micros; },
    get isNegative() { return micros < 0; },
    get hashCode() { return micros & 0x1fffffff; },
    "=="(other) { return other != null && other.inMicroseconds === micros; },
    compareTo(other) { const diff = micros - other.inMicroseconds; return diff < 0 ? -1 : diff > 0 ? 1 : 0; },
    abs() { return __dartDuration({ microseconds: Math.abs(micros) }); },
    toString() { return __dartDurationToString(micros); },
  };
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
function __dartAs(value, test, typeName) {
  if (test(value)) return value;
  throw new TypeError("Type cast failed: expected " + typeName);
}
function __dartBind(receiver, name) {
  if (Array.isArray(receiver) && name === "add") {
    return (value) => { receiver.push(value); return null; };
  }
  const value = receiver[name];
  return typeof value === "function" ? value.bind(receiver) : value;
}
function __dartListSort(list, compare = null) {
  if (typeof compare === "function") {
    list.sort((left, right) => compare(left, right));
  } else {
    list.sort((left, right) => left < right ? -1 : (left > right ? 1 : 0));
  }
  return null;
}
function __dartIterableJoin(iterable, separator = "") {
  return Array.from(iterable, (value) => __dartStr(value)).join(String(separator));
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
    get(key) {
      if (zoneValues.has(key)) return zoneValues.get(key);
      return parent == null ? null : parent.get(key);
    },
    "[]"(key) { return this.get(key); },
    run(body) { return __dartRunZoned(body, { zoneValues: null, parentZone: zone }); },
    runGuarded(body) { return __dartRunZonedGuarded(body, (error) => { throw error; }, { zoneValues: null, parentZone: zone }); },
    fork(options = {}) { return __dartCreateZone(zone, options.zoneValues); },
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
function __dartFutureAsStream(future) {
  return (async function*() {
    yield await future;
  })();
}
async function __dartFutureForEach(elements, action) {
  for (const element of elements) {
    await action(element);
  }
  return null;
}
async function __dartFutureDoWhile(action) {
  while (await action()) {}
  return null;
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
function __dartAsyncError(error, stackTrace = null) {
  return Object.freeze({
    __dartType: "AsyncError",
    error,
    stackTrace: stackTrace ?? error?.stack ?? "<javascript stack unavailable>",
    toString() { return "AsyncError: " + String(error); },
  });
}
function __dartParallelWaitError(values, errors, errorCount, defaultError) {
  const suffix = errorCount > 1 ? "(" + errorCount + " errors)" : "";
  const message = defaultError == null ? "ParallelWaitError" + suffix : "ParallelWaitError" + suffix + ": " + String(defaultError.error);
  const error = new Error(message);
  error.__dartType = "ParallelWaitError";
  error.values = values;
  error.errors = errors;
  error.errorCount = errorCount;
  error.defaultError = defaultError;
  error.stackTrace = defaultError?.stackTrace ?? error.stack ?? null;
  error.toString = function() { return message; };
  return error;
}
async function __dartFutureWaitAllSettled(futures) {
  const entries = Array.from(futures);
  return Promise.all(entries.map((future) => Promise.resolve(future).then(
    (value) => ({ value, asyncError: null }),
    (error) => ({ value: null, asyncError: __dartAsyncError(error) }),
  )));
}
async function __dartFutureIterableWait(futures) {
  const results = await __dartFutureWaitAllSettled(futures);
  const errorCount = results.reduce((count, result) => count + (result.asyncError == null ? 0 : 1), 0);
  if (errorCount === 0) return results.map((result) => result.value);
  const values = results.map((result) => result.value);
  const errors = results.map((result) => result.asyncError);
  throw __dartParallelWaitError(values, errors, errorCount, errors.find((error) => error != null));
}
async function __dartFutureRecordWait(record) {
  const shape = Array.isArray(record?.[__dartRecordShape]) ? record[__dartRecordShape].filter((name) => /^\$\d+$/.test(name)) : Object.keys(record).filter((name) => /^\$\d+$/.test(name)).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  const results = await __dartFutureWaitAllSettled(shape.map((name) => record[name]));
  const errorCount = results.reduce((count, result) => count + (result.asyncError == null ? 0 : 1), 0);
  if (errorCount === 0) return __dartRecord(results.map((result) => result.value), {});
  const values = __dartRecord(results.map((result) => result.value), {});
  const errors = __dartRecord(results.map((result) => result.asyncError), {});
  throw __dartParallelWaitError(values, errors, errorCount, results.map((result) => result.asyncError).find((error) => error != null));
}
function __dartFutureTimeout(future, duration, onTimeout = null) {
  const delay = Math.max(0, typeof duration === "number" ? duration : duration.inMilliseconds);
  return new Promise((resolve, reject) => {
    let settled = false;
    const id = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        if (typeof onTimeout === "function") {
          resolve(onTimeout());
        } else {
          reject(new Error("TimeoutException: Future not completed"));
        }
      } catch (error) {
        reject(error);
      }
    }, delay);
    Promise.resolve(future).then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(id);
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(id);
        reject(error);
      },
    );
  });
}
function __dartStreamController(broadcast = false, options = {}) {
  const onListen = options.onListen ?? null;
  const onPause = options.onPause ?? null;
  const onResume = options.onResume ?? null;
  const onCancel = options.onCancel ?? null;
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
function __dartStreamFromFutures(futures) {
  const controller = __dartStreamController(false);
  const pending = Array.from(futures);
  if (pending.length === 0) {
    controller.close();
    return controller.stream;
  }
  let remaining = pending.length;
  for (const future of pending) {
    Promise.resolve(future).then(
      (value) => controller.add(value),
      (error) => controller.addError(error),
    ).finally(() => {
      remaining--;
      if (remaining === 0) controller.close();
    });
  }
  return controller.stream;
}
function __dartStreamMulti(onListen, isBroadcast = false) {
  let listened = false;
  return {
    isBroadcast,
    [Symbol.asyncIterator]() {
      if (!isBroadcast) {
        if (listened) throw new Error("Bad state: Stream has already been listened to.");
        listened = true;
      }
      const controller = __dartStreamController(false);
      onListen(controller);
      return controller.stream[Symbol.asyncIterator]();
    },
  };
}
function __dartStreamError(error) {
  return (async function*() {
    throw error;
  })();
}
function __dartStreamPeriodic(period, computation = null) {
  return (async function*() {
    let tick = 0;
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, period.inMilliseconds)));
      yield typeof computation === "function" ? computation(tick) : null;
      tick++;
    }
  })();
}
function __dartStreamAsBroadcastStream(stream, onListen = null, onCancel = null) {
  const controller = __dartStreamController(true);
  let started = false;
  let canceled = false;
  function makeSubscription() {
    return {
      pause() { return null; },
      resume() { return null; },
      cancel() { canceled = true; return controller.close(); },
      get isPaused() { return false; },
    };
  }
  async function pump() {
    try {
      for await (const value of stream) {
        if (canceled) break;
        controller.add(value);
      }
    } catch (error) {
      if (!canceled) controller.addError(error);
    } finally {
      await controller.close();
    }
  }
  return {
    isBroadcast: true,
    [Symbol.asyncIterator]() {
      if (!started) {
        started = true;
        if (typeof onListen === "function") onListen(makeSubscription());
        Promise.resolve().then(pump);
      }
      const iterator = controller.stream[Symbol.asyncIterator]();
      return {
        next() { return iterator.next(); },
        return() {
          if (typeof onCancel === "function") onCancel(makeSubscription());
          if (typeof iterator.return === "function") return iterator.return();
          return Promise.resolve({ done: true });
        },
      };
    },
  };
}
function __dartStreamMap(stream, convert) {
  return (async function*() {
    for await (const value of stream) {
      yield convert(value);
    }
  })();
}
function __dartStreamWhere(stream, test) {
  return (async function*() {
    for await (const value of stream) {
      if (test(value)) yield value;
    }
  })();
}
function __dartStreamAsyncMap(stream, convert) {
  return (async function*() {
    for await (const value of stream) {
      yield await convert(value);
    }
  })();
}
function __dartStreamAsyncExpand(stream, convert) {
  return (async function*() {
    for await (const value of stream) {
      const inner = convert(value);
      if (inner == null) continue;
      for await (const expanded of inner) yield expanded;
    }
  })();
}
function __dartStreamTransformerFromBind(bind) {
  return { bind };
}
function __dartStreamTransformerFromHandlers({ handleData = null, handleError = null, handleDone = null } = {}) {
  return {
    bind(stream) {
      const controller = __dartStreamController(false);
      const sink = controller.sink;
      (async () => {
        let shouldClose = false;
        try {
          const iterator = stream[Symbol.asyncIterator]();
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
      const iterator = stream[Symbol.asyncIterator]();
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
function __dartStreamDistinct(stream, equals = null) {
  return (async function*() {
    let hasPrevious = false;
    let previous;
    for await (const value of stream) {
      const same = hasPrevious && (typeof equals === "function" ? equals(previous, value) : __dartEquals(previous, value));
      if (same) continue;
      previous = value;
      hasPrevious = true;
      yield value;
    }
  })();
}
function __dartStreamHandleError(stream, onError, test = null) {
  return (async function*() {
    const iterator = stream[Symbol.asyncIterator]();
    while (true) {
      let next;
      try {
        next = await iterator.next();
        if (next.done) break;
        yield next.value;
      } catch (error) {
        if (typeof test === "function" && !test(error)) throw error;
        if (typeof onError !== "function") continue;
        const result = onError.length >= 2 ? onError(error, error?.stack ?? "<javascript stack unavailable>") : onError(error);
        await result;
      }
    }
  })();
}
function __dartStreamTake(stream, count) {
  return (async function*() {
    let remaining = Math.max(0, Math.trunc(count));
    if (remaining === 0) return;
    for await (const value of stream) {
      yield value;
      remaining--;
      if (remaining === 0) break;
    }
  })();
}
function __dartStreamSkip(stream, count) {
  return (async function*() {
    let remaining = Math.max(0, Math.trunc(count));
    for await (const value of stream) {
      if (remaining > 0) {
        remaining--;
        continue;
      }
      yield value;
    }
  })();
}
function __dartStreamTimeout(stream, duration, onTimeout = null) {
  const controller = __dartStreamController(false);
  const delay = Math.max(0, typeof duration === "number" ? duration : duration.inMilliseconds);
  const iterator = stream[Symbol.asyncIterator]();
  let pendingNext = null;
  function nextEvent() {
    pendingNext ??= Promise.resolve(iterator.next()).then((next) => ({ next }), (error) => ({ error }));
    return pendingNext;
  }
  function timeoutEvent() {
    return new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), delay));
  }
  (async () => {
    try {
      while (!controller.isClosed) {
        const result = await Promise.race([nextEvent(), timeoutEvent()]);
        if (result.timeout) {
          if (typeof onTimeout === "function") {
            onTimeout(controller.sink);
          } else {
            controller.addError(new Error("TimeoutException: Stream timeout"));
          }
          continue;
        }
        pendingNext = null;
        if ("error" in result) {
          controller.addError(result.error);
          continue;
        }
        if (result.next.done) break;
        controller.add(result.next.value);
      }
    } finally {
      if (typeof iterator.return === "function") {
        try { await iterator.return(); } catch (_) {}
      }
      await controller.close();
    }
  })();
  return controller.stream;
}
function __dartStreamTakeWhile(stream, test) {
  return (async function*() {
    for await (const value of stream) {
      if (!test(value)) break;
      yield value;
    }
  })();
}
function __dartStreamSkipWhile(stream, test) {
  return (async function*() {
    let skipping = true;
    for await (const value of stream) {
      if (skipping && test(value)) continue;
      skipping = false;
      yield value;
    }
  })();
}
async function __dartStreamToList(stream) {
  const values = [];
  for await (const value of stream) values.push(value);
  return values;
}
async function __dartStreamToSet(stream) {
  const values = new Set();
  for await (const value of stream) {
    __dartSetAdd(values, value);
  }
  return values;
}
async function __dartStreamFold(stream, initialValue, combine) {
  let result = initialValue;
  for await (const value of stream) {
    result = await combine(result, value);
  }
  return result;
}
async function __dartStreamReduce(stream, combine) {
  let found = false;
  let result;
  for await (const value of stream) {
    if (!found) {
      found = true;
      result = value;
    } else {
      result = await combine(result, value);
    }
  }
  if (!found) throw new RangeError("No element");
  return result;
}
async function __dartStreamForEach(stream, action) {
  for await (const value of stream) await action(value);
  return null;
}
function __dartStreamCast(stream, test, typeName) {
  return (async function*() {
    for await (const value of stream) {
      yield __dartAs(value, test, typeName);
    }
  })();
}
async function __dartStreamFirst(stream) {
  for await (const value of stream) return value;
  throw new RangeError("No element");
}
async function __dartStreamLast(stream) {
  let found = false;
  let last;
  for await (const value of stream) {
    found = true;
    last = value;
  }
  if (!found) throw new RangeError("No element");
  return last;
}
async function __dartStreamSingle(stream) {
  let found = false;
  let single;
  for await (const value of stream) {
    if (found) throw new Error("Bad state: Too many elements");
    found = true;
    single = value;
  }
  if (!found) throw new RangeError("No element");
  return single;
}
async function __dartStreamLength(stream) {
  let count = 0;
  for await (const _ of stream) count++;
  return count;
}
async function __dartStreamIsEmpty(stream) {
  for await (const _ of stream) return false;
  return true;
}
async function __dartStreamAny(stream, test) {
  for await (const value of stream) {
    if (test(value)) return true;
  }
  return false;
}
async function __dartStreamEvery(stream, test) {
  for await (const value of stream) {
    if (!test(value)) return false;
  }
  return true;
}
async function __dartStreamFirstWhere(stream, test, orElse = null) {
  for await (const value of stream) {
    if (test(value)) return value;
  }
  if (typeof orElse === "function") return orElse();
  throw new RangeError("No element");
}
async function __dartStreamLastWhere(stream, test, orElse = null) {
  let found = false;
  let last;
  for await (const value of stream) {
    if (test(value)) {
      found = true;
      last = value;
    }
  }
  if (found) return last;
  if (typeof orElse === "function") return orElse();
  throw new RangeError("No element");
}
async function __dartStreamSingleWhere(stream, test, orElse = null) {
  let found = false;
  let single;
  for await (const value of stream) {
    if (!test(value)) continue;
    if (found) throw new Error("Bad state: Too many elements");
    found = true;
    single = value;
  }
  if (found) return single;
  if (typeof orElse === "function") return orElse();
  throw new RangeError("No element");
}
async function __dartStreamContains(stream, needle) {
  for await (const value of stream) {
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
async function __dartStreamJoin(stream, separator = "") {
  const values = [];
  for await (const value of stream) values.push(__dartStr(value));
  return values.join(String(separator));
}
async function __dartStreamDrain(stream, futureValue = null) {
  for await (const _ of stream) {}
  return futureValue;
}
async function __dartStreamPipe(stream, consumer) {
  if (typeof consumer.addStream === "function") {
    await consumer.addStream(stream);
  } else {
    for await (const value of stream) consumer.add(value);
  }
  return typeof consumer.close === "function" ? await consumer.close() : null;
}
function __dartStreamListen(stream, onData, onError = null, onDone = null, cancelOnError = false) {
  const iterator = stream[Symbol.asyncIterator]();
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
const __dartConstValues = new Map();
function __dartConst(key, create) {
  if (!__dartConstValues.has(key)) {
    __dartConstValues.set(key, create());
  }
  return __dartConstValues.get(key);
}

// Generated by dart2esm.

export function __dartTimer_1(value) {
  return "user:" + __dartStr(value);
}

export async function main() {
  __dartPrint(__dartTimer_1("timer"));
  const first = await Promise.resolve(1);
  const second = await Promise.resolve().then(() => (function() { return 2; })());
  const delayed = await new Promise((resolve, reject) => setTimeout(() => { try { resolve((function() { return 3; })()); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"1000\"]]]", () => __dartDuration({ microseconds: 1000 })).inMilliseconds)));
  const values = await __dartFutureWait([Promise.resolve(first), Promise.resolve(second), Promise.resolve(delayed)], false, null);
  __dartPrint("future " + __dartStr(__dartIterableJoin(values, ",")));
  const waitCleaned = new Array(0).fill(null);
  try {
    {
      await __dartFutureWait([new Promise((resolve, reject) => setTimeout(() => { try { resolve((function() { return 12; })()); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"2000\"]]]", () => __dartDuration({ microseconds: 2000 })).inMilliseconds))), Promise.reject("wait-error")], false, function(value) {
        (waitCleaned.push(value), null);
});
    }
  } catch ($error) {
    if ($error != null) {
      const error = $error;
      {
        __dartPrint("waitError " + __dartStr(error) + " " + __dartStr(__dartIterableJoin(waitCleaned, ",")));
      }
    } else {
      throw $error;
    }
  }
  const eagerCleaned = new Array(0).fill(null);
  try {
    {
      await __dartFutureWait([Promise.reject("eager-error"), new Promise((resolve, reject) => setTimeout(() => { try { resolve((function() { return 13; })()); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"2000\"]]]", () => __dartDuration({ microseconds: 2000 })).inMilliseconds)))], true, function(value) {
        (eagerCleaned.push(value), null);
});
    }
  } catch ($error_1) {
    if ($error_1 != null) {
      const error_1 = $error_1;
      {
        await new Promise((resolve, reject) => setTimeout(() => { try { resolve(null); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"5000\"]]]", () => __dartDuration({ microseconds: 5000 })).inMilliseconds)));
        __dartPrint("waitEager " + __dartStr(error_1) + " " + __dartStr(__dartIterableJoin(eagerCleaned, ",")));
      }
    } else {
      throw $error_1;
    }
  }
  const iterableWait = await __dartFutureIterableWait([Promise.resolve(21), Promise.resolve(22)]);
  const recordWait = await __dartFutureRecordWait(__dartRecord([Promise.resolve("r"), Promise.resolve(23)], {}));
  __dartPrint("extensionWait " + __dartStr(__dartIterableJoin(iterableWait, ",")) + " " + __dartStr(recordWait.$1) + __dartStr(recordWait.$2));
  try {
    {
      await __dartFutureIterableWait([Promise.resolve(24), Promise.reject("parallel-list")]);
    }
  } catch ($error_2) {
    if ($error_2 != null && typeof $error_2 === "object" && $error_2.__dartType === "ParallelWaitError") {
      const error_2 = $error_2;
      {
        __dartPrint("extensionWaitError " + __dartStr(__dartIterableJoin(error_2.values, ",")) + " " + __dartStr(__dartNullCheck(error_2.errors[1]).error) + " " + __dartStr(__dartStr(error_2).includes("parallel-list")));
      }
    } else {
      throw $error_2;
    }
  }
  try {
    {
      await __dartFutureRecordWait(__dartRecord([Promise.resolve("ok"), Promise.reject("parallel-record")], {}));
    }
  } catch ($error_3) {
    if ($error_3 != null && typeof $error_3 === "object" && $error_3.__dartType === "ParallelWaitError") {
      const error_3 = $error_3;
      {
        __dartPrint("recordWaitError " + __dartStr(error_3.values.$1) + " " + __dartStr((error_3.values.$2 === null)) + " " + __dartStr(__dartNullCheck(error_3.errors.$2).error) + " " + __dartStr(__dartStr(error_3).includes("parallel-record")));
      }
    } else {
      throw $error_3;
    }
  }
  const microtask = await Promise.resolve().then(() => (function() { return 4; })());
  const any = await Promise.race(Array.from([new Promise((resolve, reject) => setTimeout(() => { try { resolve((function() { return 99; })()); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"5000\"]]]", () => __dartDuration({ microseconds: 5000 })).inMilliseconds))), Promise.resolve(5)]));
  __dartPrint("more " + __dartStr(microtask) + " " + __dartStr(any));
  const constructed = await new Promise((resolve, reject) => setTimeout(() => { try { resolve((function() { return 12; })()); } catch (error) { reject(error); } }, 0));
  const syncValue = await Promise.resolve(13);
  __dartPrint("futureConstruct " + __dartStr(constructed) + " " + __dartStr(syncValue));
  let forEachTotal = 0;
  await __dartFutureForEach([1, 2, 3], async function(value) {
    forEachTotal = (forEachTotal + value);
});
  let doWhileCount = 0;
  await __dartFutureDoWhile(async function() {
    doWhileCount = (doWhileCount + 1);
    return (doWhileCount < 3);
});
  __dartPrint("futureLoop " + __dartStr(forEachTotal) + " " + __dartStr(doWhileCount));
  const microCompleter = __dartCompleter();
  const microValues = new Array(0).fill(null);
  (typeof queueMicrotask === "function" ? queueMicrotask(function() {
    (microValues.push("micro"), null);
    microCompleter.complete();
}) : Promise.resolve().then(function() {
    (microValues.push("micro"), null);
    microCompleter.complete();
}), null);
  (Promise.resolve(null), null);
  await microCompleter.future;
  const asyncError = __dartAsyncError("async-error", (new Error().stack ?? "<javascript stack unavailable>"));
  const asyncStackTrace = asyncError.stackTrace;
  const asyncErrorObject = asyncError;
  __dartPrint("asyncMisc " + __dartStr(__dartIterableJoin(microValues, ",")) + " " + __dartStr(asyncError.error) + " " + __dartStr(!((asyncStackTrace === null))) + " " + __dartStr(asyncErrorObject != null && typeof asyncErrorObject === "object" && asyncErrorObject.__dartType === "AsyncError") + " " + __dartStr(__dartStr(asyncError).includes("async-error")));
  const zoneValue = __dartRunZoned(function() { return __dartCurrentZone["[]"](__dartSymbol("answer", "answer")); }, { zoneValues: new Map([[__dartSymbol("answer", "answer"), 7]]), onError: null });
  let guardedError = "";
  const guardedResult = __dartRunZonedGuarded(function() {
    (() => { throw "zone-error"; })();
}, function(error, stackTrace) {
    guardedError = __dartStr(error) + ":" + __dartStr(__dartStr(stackTrace).length !== 0);
}, { zoneValues: null });
  __dartPrint("zone " + __dartStr(zoneValue) + " " + __dartStr(guardedResult) + " " + __dartStr(guardedError) + " " + __dartStr((__dartCurrentZone["[]"](__dartSymbol("missing", "missing")) === null)));
  const completer = __dartCompleter();
  Promise.resolve().then(() => (function() { return completer.complete(6); })());
  __dartPrint("complete " + __dartStr(await completer.future) + " " + __dartStr(completer.isCompleted));
  const syncCompleter = __dartCompleter();
  syncCompleter.complete("ok");
  __dartPrint("sync " + __dartStr(await syncCompleter.future));
  const failed = __dartCompleter();
  failed.completeError("broken");
  try {
    {
      await failed.future;
    }
  } catch ($error_4) {
    if ($error_4 != null) {
      const error_4 = $error_4;
      {
        __dartPrint("completeError " + __dartStr(error_4));
      }
    } else {
      throw $error_4;
    }
  }
  const timerDone = __dartCompleter();
  const timer = __dartTimer(__dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"1000\"]]]", () => __dartDuration({ microseconds: 1000 })), function() {
    timerDone.complete("fired");
}, false);
  __dartPrint("timer-start " + __dartStr(timer.isActive) + " " + __dartStr(timer.tick));
  __dartPrint("timer " + __dartStr(await timerDone.future) + " " + __dartStr(timer.isActive));
  let canceledFired = false;
  const canceled = __dartTimer(__dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"5000\"]]]", () => __dartDuration({ microseconds: 5000 })), function() {
    canceledFired = true;
}, false);
  canceled.cancel();
  await new Promise((resolve, reject) => setTimeout(() => { try { resolve(null); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"10000\"]]]", () => __dartDuration({ microseconds: 10000 })).inMilliseconds)));
  __dartPrint("cancel " + __dartStr(canceled.isActive) + " " + __dartStr(canceledFired));
  const runDone = __dartCompleter();
  (__dartTimer(0, function() {
    runDone.complete("run");
}, false), null);
  __dartPrint("run " + __dartStr(await runDone.future));
  const periodicDone = __dartCompleter();
  __dartTimer(__dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"1000\"]]]", () => __dartDuration({ microseconds: 1000 })), function(timer) {
    if ((timer.tick >= 2)) {
      {
        periodicDone.complete(timer.tick);
        timer.cancel();
      }
    }
}, true);
  __dartPrint("periodic " + __dartStr(await periodicDone.future));
  let finalized = false;
  const chained = await Promise.resolve(7).then(function(value) { return (value + 1); });
  const recovered = await Promise.reject("recover").catch(function(error) { return 8; });
  const completed = await Promise.resolve(9).finally(function() {
    finalized = true;
});
  const handledThen = await Promise.reject("then-error").then(function(__wc0_formal) { return 0; }, function(error) { return 10; });
  const filtered = await Promise.reject("filtered").catch((error) => (function(error) { return __dartEquals(error, "filtered"); })(error) ? (function(error) { return 11; })(error) : Promise.reject(error));
  (Promise.reject("ignored").catch(() => null), null);
  const onErrored = await Promise.reject("on-error").catch((error) => (function(error, stackTrace) { return 14; })(error, error?.stack ?? "<javascript stack unavailable>"));
  __dartPrint("chain " + __dartStr(chained) + " " + __dartStr(recovered) + " " + __dartStr(completed) + " " + __dartStr(finalized) + " " + __dartStr(handledThen) + " " + __dartStr(filtered) + " " + __dartStr(onErrored));
  const streamed = await __dartStreamFirst(__dartFutureAsStream(Promise.resolve("streamed")));
  const fast = await __dartFutureTimeout(Promise.resolve("fast"), __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"10000\"]]]", () => __dartDuration({ microseconds: 10000 })), null);
  const fallback = await __dartFutureTimeout(new Promise((resolve, reject) => setTimeout(() => { try { resolve((function() { return "slow"; })()); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"10000\"]]]", () => __dartDuration({ microseconds: 10000 })).inMilliseconds))), __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"1000\"]]]", () => __dartDuration({ microseconds: 1000 })), function() { return "fallback"; });
  __dartPrint("futureStream " + __dartStr(streamed) + " " + __dartStr(fast) + " " + __dartStr(fallback));
  const streamFromFuture = await __dartStreamSingle(__dartStreamFromFuture(Promise.resolve(14)));
  const streamFromFutures = await __dartStreamToList(__dartStreamFromFutures([new Promise((resolve, reject) => setTimeout(() => { try { resolve((function() { return 1; })()); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"2000\"]]]", () => __dartDuration({ microseconds: 2000 })).inMilliseconds))), Promise.resolve(2)]));
  __dartListSort(streamFromFutures, null);
  __dartPrint("streamFuture " + __dartStr(streamFromFuture) + " " + __dartStr(__dartIterableJoin(streamFromFutures, ",")));
  const streamMultiValues = await __dartStreamJoin(__dartStreamMulti(function(controller) {
    controller.add(3);
    controller.add(4);
    controller.close();
}, false), ",");
  const streamMultiBroadcast = __dartStreamMulti(function(controller) {
    controller.add(5);
    controller.close();
}, true);
  __dartPrint("streamMulti " + __dartStr(streamMultiValues) + " " + __dartStr(await __dartStreamSingle(streamMultiBroadcast)) + " " + __dartStr((streamMultiBroadcast.isBroadcast === true)));
  const streamValue = await __dartStreamSingle(__dartStreamFromIterable([7]));
  try {
    {
      await __dartStreamFirst(__dartStreamError("stream-boom"));
    }
  } catch ($error_5) {
    if ($error_5 != null) {
      const error_5 = $error_5;
      {
        const periodicValues = await __dartStreamToList(__dartStreamTake(__dartStreamPeriodic(__dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"1000\"]]]", () => __dartDuration({ microseconds: 1000 })), function(tick) { return (tick + 1); }), 3));
        __dartPrint("streamFactories " + __dartStr(streamValue) + " " + __dartStr(error_5) + " " + __dartStr(__dartIterableJoin(periodicValues, ",")));
      }
    } else {
      throw $error_5;
    }
  }
  const controller = __dartStreamController(true, { onListen: null, onPause: null, onResume: null, onCancel: null });
  const seenA = new Array(0).fill(null);
  const seenB = new Array(0).fill(null);
  const subA = __dartStreamListen(controller.stream, __dartAs(__dartBind(seenA, "add"), value => typeof value === "function", "void Function(int)"), null, null, false);
  const subB = __dartStreamListen(controller.stream, __dartAs(__dartBind(seenB, "add"), value => typeof value === "function", "void Function(int)"), null, null, false);
  controller.add(1);
  controller.add(2);
  await new Promise((resolve, reject) => setTimeout(() => { try { resolve(null); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"1000\"]]]", () => __dartDuration({ microseconds: 1000 })).inMilliseconds)));
  await subA.cancel();
  await subB.cancel();
  await controller.close();
  __dartPrint("broadcast " + __dartStr(__dartIterableJoin(seenA, ",")) + " " + __dartStr(__dartIterableJoin(seenB, ",")) + " " + __dartStr(controller.isClosed));
  try {
    {
      await Promise.reject("boom");
    }
  } catch ($error_6) {
    if ($error_6 != null) {
      const error_6 = $error_6;
      {
        __dartPrint("caught " + __dartStr(error_6));
      }
    } else {
      throw $error_6;
    }
  }
}

await main();
