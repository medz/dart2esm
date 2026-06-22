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
function __dartAs(value, test, typeName) {
  if (test(value)) return value;
  throw new TypeError("Type cast failed: expected " + typeName);
}
function __dartSetAdd(set, value) {
  if (set.__dartIdentitySet) {
    if (set.has(value)) return false;
    set.add(value);
    return true;
  }
  if (__dartIterableContains(set, value)) return false;
  set.add(value);
  return true;
}
function __dartIterableContains(iterable, needle) {
  if (iterable instanceof Set && iterable.__dartIdentitySet) return iterable.has(needle);
  for (const value of iterable) {
    if (__dartEquals(value, needle)) return true;
  }
  return false;
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
function __dartStreamController(broadcast = false) {
  const listeners = new Set();
  let closed = false;
  let singleListened = false;
  let resolveDone;
  const done = new Promise((resolve) => { resolveDone = resolve; });
  function makeState(bufferBeforeListen = false) {
    return { queue: [], waiters: [], active: false, bufferBeforeListen };
  }
  const singleState = makeState(true);
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
        if (listener.queue.length === 0) { listener.active = false; clearWaiters(listener); listeners.delete(listener); }
      }
    } else if (singleState.queue.length === 0) {
      singleState.active = false;
      clearWaiters(singleState);
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
          if (remove) remove();
          maybeResolveDone();
          return Promise.resolve({ done: true });
        }
        return new Promise((resolve, reject) => state.waiters.push({ resolve, reject }));
      },
      return() {
        cancelState(state);
        if (remove) remove();
        return Promise.resolve({ done: true });
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
      try {
        for await (const value of source) deliver({ value });
      } catch (error) {
        deliver({ error });
        if (options.cancelOnError === true) return null;
      }
      return null;
    },
  };
  const stream = {
    [Symbol.asyncIterator]() {
      if (broadcast) {
        const state = makeState();
        state.active = true;
        listeners.add(state);
        return iteratorForState(state, () => { listeners.delete(state); maybeResolveDone(); });
      }
      if (singleListened) {
        throw new Error("Bad state: Stream has already been listened to.");
      }
      singleListened = true;
      singleState.active = true;
      singleState.bufferBeforeListen = false;
      return iteratorForState(singleState, null);
    },
  };
  return controller;
}
function __dartStreamIterator(stream) {
  const iterator = stream[Symbol.asyncIterator]();
  return {
    current: undefined,
    _subscription: true,
    async moveNext() {
      const next = await iterator.next();
      if (next.done) {
        this.current = undefined;
        this._subscription = null;
        return false;
      }
      this.current = next.value;
      return true;
    },
    async cancel() {
      this._subscription = null;
      if (typeof iterator.return === "function") await iterator.return();
      return null;
    },
  };
}
function __dartStreamFromIterable(values) {
  return (async function*() {
    for (const value of values) yield value;
  })();
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
    pause() { paused = true; return null; },
    resume() {
      paused = false;
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
const __dartConstValues = new Map();
function __dartConst(key, create) {
  if (!__dartConstValues.has(key)) {
    __dartConstValues.set(key, create());
  }
  return __dartConstValues.get(key);
}

// Generated by dart2esm.

export async function main() {
  const doubled = __dartStreamWhere(__dartStreamMap(__dartStreamFromIterable([1, 2, 3]), function(value) { return (value * 2); }), function(value) { return (value > 2); });
  const values = new Array(0).fill(null);
  {
    let _stream = doubled;
    let _for_iterator = __dartStreamIterator(_stream);
    try {
      while (await _for_iterator.moveNext()) {
        {
          const value = _for_iterator.current;
          {
            (values.push(value), null);
          }
        }
      }
    } finally {
      if (!((_for_iterator._subscription === null))) {
        await _for_iterator.cancel();
      }
    }
  }
  __dartPrint("stream " + __dartStr(__dartIterableJoin(values, ",")));
  const single = await __dartStreamFirst(__dartStreamFromIterable(["ok"]));
  const listed = await __dartStreamToList(__dartStreamFromIterable(["a", "b"]));
  __dartPrint("future " + __dartStr(single) + " " + __dartStr(__dartIterableJoin(listed, "|")));
  __dartPrint("query " + __dartStr(await __dartStreamLength(__dartStreamFromIterable([1, 2, 3]))) + " " + __dartStr(await __dartStreamIsEmpty(__dartStreamFromIterable([]))) + " " + __dartStr(await __dartStreamLast(__dartStreamFromIterable([1, 2, 3]))) + " " + __dartStr(await __dartStreamSingle(__dartStreamFromIterable([9]))));
  __dartPrint("checks " + __dartStr(await __dartStreamAny(__dartStreamFromIterable([1, 2, 3]), function(value) { return (value > 2); })) + " " + __dartStr(await __dartStreamEvery(__dartStreamFromIterable([1, 2, 3]), function(value) { return (value > 0); })) + " " + __dartStr(await __dartStreamContains(__dartStreamFromIterable([1, 2, 3]), 2)) + " " + __dartStr(await __dartStreamJoin(__dartStreamFromIterable(["a", "b"]), "-")) + " " + __dartStr(await __dartStreamDrain(__dartStreamFromIterable([1, 2]), "done")));
  __dartPrint("slice " + __dartStr(await __dartStreamJoin(__dartStreamTake(__dartStreamSkip(__dartStreamFromIterable([1, 2, 3, 4, 5]), 1), 3), ",")) + " " + __dartStr(await __dartStreamJoin(__dartStreamTakeWhile(__dartStreamFromIterable([1, 2, 3, 4]), function(value) { return (value < 3); }), ",")) + " " + __dartStr(await __dartStreamJoin(__dartStreamSkipWhile(__dartStreamFromIterable([1, 2, 3, 4]), function(value) { return (value < 3); }), ",")));
  __dartPrint("whereQuery " + __dartStr(await __dartStreamFirstWhere(__dartStreamFromIterable([1, 2, 3, 4]), function(value) { return (value > 2); }, null)) + " " + __dartStr(await __dartStreamLastWhere(__dartStreamFromIterable([1, 2, 3, 4]), function(value) { return (Math.trunc(value) % 2 !== 0); }, null)) + " " + __dartStr(await __dartStreamSingleWhere(__dartStreamFromIterable([1, 2, 3, 4]), function(value) { return __dartEquals(value, 3); }, null)) + " " + __dartStr(await __dartStreamFirstWhere(__dartStreamFromIterable([1, 2]), function(value) { return (value > 9); }, function() { return (-1); })));
  const asyncMapped = await __dartStreamJoin(__dartStreamAsyncMap(__dartStreamFromIterable([1, 2]), async function(value) { return (value * 3); }), ",");
  const asyncExpanded = await __dartStreamJoin(__dartStreamAsyncExpand(__dartStreamFromIterable([1, 2]), function(value) { return __dartStreamFromIterable([value, (value + 10)]); }), ",");
  const distinctValues = await __dartStreamJoin(__dartStreamDistinct(__dartStreamFromIterable([1, 1, 2, 1]), null), ",");
  const parityDistinct = await __dartStreamJoin(__dartStreamDistinct(__dartStreamFromIterable([1, 3, 4, 6]), function(previous, next) { return __dartEquals((Math.trunc(previous) % 2 !== 0), (Math.trunc(next) % 2 !== 0)); }), ",");
  const handledErrors = new Array(0).fill(null);
  const handledController = __dartStreamController(false);
  const handled = __dartStreamJoin(__dartStreamHandleError(handledController.stream, function(error) {
    (handledErrors.push(__dartStr(error)), null);
}, null), ",");
  handledController.add(1);
  handledController.addError("handled");
  handledController.add(2);
  await handledController.close();
  let skippedError = "";
  try {
    {
      await __dartStreamDrain(__dartStreamHandleError(__dartStreamError("skipped"), function(error) {
        (handledErrors.push("wrong"), null);
}, function(error) { return false; }), null);
    }
  } catch ($error) {
    if ($error != null) {
      const error = $error;
      {
        skippedError = __dartStr(error);
      }
    } else {
      throw $error;
    }
  }
  __dartPrint("streamMore " + __dartStr(asyncMapped) + " " + __dartStr(asyncExpanded) + " " + __dartStr(distinctValues) + " " + __dartStr(parityDistinct) + " " + __dartStr(await handled) + " " + __dartStr(__dartIterableJoin(handledErrors, ",")) + " " + __dartStr(skippedError));
  const aggregateSet = await __dartStreamToSet(__dartStreamFromIterable([1, 2, 2]));
  const folded = await __dartStreamFold(__dartStreamFromIterable([1, 2, 3]), 10, function(previous, value) { return (previous + value); });
  const reduced = await __dartStreamReduce(__dartStreamFromIterable([2, 3, 4]), function(previous, value) { return (previous * value); });
  let forEachTotal = 0;
  await __dartStreamForEach(__dartStreamFromIterable([1, 2, 3]), async function(value) {
    forEachTotal = (forEachTotal + value);
});
  const casted = await __dartStreamJoin(__dartStreamCast(__dartStreamFromIterable([1, 2]), (value) => typeof value === "number", "InterfaceType(int)"), ",");
  __dartPrint("aggregate " + __dartStr(__dartIterableJoin(aggregateSet, ",")) + " " + __dartStr(folded) + " " + __dartStr(reduced) + " " + __dartStr(forEachTotal) + " " + __dartStr(casted));
  let broadcastListenCount = 0;
  const broadcastedFromSingle = __dartStreamAsBroadcastStream(__dartStreamFromIterable([1, 2, 3]), function(__wc0_formal) {
    broadcastListenCount = (broadcastListenCount + 1);
}, null);
  const broadcastOdds = __dartStreamToList(__dartStreamWhere(broadcastedFromSingle, function(value) { return (Math.trunc(value) % 2 !== 0); }));
  const broadcastDoubled = __dartStreamToList(__dartStreamMap(broadcastedFromSingle, function(value) { return (value * 2); }));
  __dartPrint("asBroadcast " + __dartStr(__dartIterableJoin(await broadcastOdds, ",")) + " " + __dartStr(__dartIterableJoin(await broadcastDoubled, ",")) + " " + __dartStr(broadcastListenCount) + " " + __dartStr(broadcastedFromSingle.isBroadcast));
  const timeoutController = __dartStreamController(false);
  const timeoutValues = __dartStreamToList(__dartStreamTimeout(timeoutController.stream, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"1000\"]]]", () => __dartDuration({ microseconds: 1000 })), function(sink) {
    sink.add(9);
    sink.close();
}));
  await new Promise((resolve, reject) => setTimeout(() => { try { resolve(null); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"5000\"]]]", () => __dartDuration({ microseconds: 5000 })).inMilliseconds)));
  __dartPrint("streamTimeout " + __dartStr(__dartIterableJoin(await timeoutValues, ",")));
  const pipeController = __dartStreamController(false);
  const pipeValues = __dartStreamToList(pipeController.stream);
  await __dartStreamPipe(__dartStreamFromIterable([10, 11]), pipeController);
  __dartPrint("pipe " + __dartStr(__dartIterableJoin(await pipeValues, ",")) + " " + __dartStr(pipeController.isClosed));
  const listened = new Array(0).fill(null);
  const listenDone = __dartCompleter();
  const subscription = __dartStreamListen(__dartStreamFromIterable([6, 7]), function(value) {
    (listened.push(value), null);
}, null, function() {
    listenDone.complete("done");
}, false);
  subscription.pause();
  const paused = subscription.isPaused;
  subscription.resume();
  const listenState = await listenDone.future;
  const listenFuture = __dartStreamListen(__dartStreamFromIterable([8]), function(value) {
    (listened.push(value), null);
}, null, null, false).asFuture("future");
  __dartPrint("listen " + __dartStr(listenState) + " " + __dartStr(__dartIterableJoin(listened, ",")) + " " + __dartStr(paused) + " " + __dartStr(await listenFuture) + " " + __dartStr(__dartIterableJoin(listened, ",")));
  const updateController = __dartStreamController(false);
  const updated = new Array(0).fill(null);
  const updateErrors = new Array(0).fill(null);
  const updateDone = __dartCompleter();
  const updateSubscription = __dartStreamListen(updateController.stream, function(value) {
    (updated.push(value), null);
}, null, null, false);
  updateSubscription.onData(function(value) {
    (updated.push((value * 2)), null);
});
  updateSubscription.onError(function(error) {
    (updateErrors.push(__dartStr(error)), null);
});
  updateSubscription.onDone(function() {
    updateDone.complete("done");
});
  updateController.add(3);
  updateController.addError("changed-error");
  updateController.add(4);
  await updateController.close();
  __dartPrint("listenUpdate " + __dartStr(__dartIterableJoin(updated, ",")) + " " + __dartStr(__dartIterableJoin(updateErrors, ",")) + " " + __dartStr(await updateDone.future));
  const controller = __dartStreamController(false);
  const controlledFuture = __dartStreamToList(controller.stream);
  __dartPrint("state " + __dartStr(controller.isClosed) + " " + __dartStr(controller.hasListener));
  controller.add(4);
  controller.add(5);
  await controller.close();
  const controlled = await controlledFuture;
  __dartPrint("controller " + __dartStr(__dartIterableJoin(controlled, ",")) + " " + __dartStr(controller.isClosed));
  __dartPrint("done " + __dartStr(await controller.done));
  const errorController = __dartStreamController(false);
  const errorFuture = (async function() {
    try {
      {
        await __dartStreamToList(errorController.stream);
      }
    } catch ($error) {
      if ($error != null) {
        const error = $error;
        {
          __dartPrint("streamError " + __dartStr(error));
        }
      } else {
        throw $error;
      }
    }
})();
  errorController.addError("stream-error");
  await errorController.close();
  await errorFuture;
}

await main();
