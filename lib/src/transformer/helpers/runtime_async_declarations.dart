part of 'runtime_helpers.dart';

extension _AsyncHelperDeclaration on EsmRuntimeHelperRegistry {
  EsmModuleItem _asyncHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.completer => EsmRawModuleItem('''
function __dartCompleter() {
  let completed = false;
  let resolveFuture;
  let rejectFuture;
  const future = new Promise((resolve, reject) => { resolveFuture = resolve; rejectFuture = reject; });
  return {
    future,
    __dartType: "Completer",
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
'''),
      EsmRuntimeHelper.future => EsmRawModuleItem(r'''
function __dartFutureDelayed(duration, computation = null) {
  const delay = Math.max(0, duration == null ? 0 : (typeof duration === "number" ? duration : duration.inMilliseconds));
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(typeof computation === "function" ? computation() : null);
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}
function __dartFutureWait(futures, eagerError = false, cleanUp = null) {
  const entries = Array.from(futures);
  if (entries.length === 0) return Promise.resolve([]);
  const values = new Array(entries.length);
  const cleaned = new Set();
  let firstError;
  function clean(value, index) {
    if (cleanUp == null || value == null || cleaned.has(index)) return;
    cleaned.add(index);
    Promise.resolve().then(() => cleanUp(value));
  }
  return new Promise((resolve, reject) => {
    let remaining = entries.length;
    entries.forEach((future, index) => {
      Promise.resolve(future).then(
        (value) => {
          values[index] = value;
          if (firstError != null) clean(value, index);
          remaining -= 1;
          if (remaining === 0) {
            if (firstError != null) reject(firstError);
            else resolve(values);
          }
        },
        (error) => {
          if (firstError == null) {
            firstError = error;
            for (let i = 0; i < values.length; i++) clean(values[i], i);
            if (eagerError) {
              reject(error);
              return;
            }
          }
          remaining -= 1;
          if (remaining === 0) reject(firstError);
        },
      );
    });
  });
}
function __dartFutureForEach(elements, action) {
  let chain = Promise.resolve(null);
  for (const element of Array.from(elements)) {
    chain = chain.then(() => action(element));
  }
  return chain.then(() => null);
}
async function __dartFutureDoWhile(action) {
  while (await action()) {}
  return null;
}
function __dartFutureIgnore(future) {
  Promise.resolve(future).catch(() => null);
  return null;
}
function __dartFutureAsStream(future) {
  return __dartStreamFromFuture(future);
}
function __dartFutureTimeout(future, duration, onTimeout = null) {
  const delay = Math.max(0, duration == null ? 0 : (typeof duration === "number" ? duration : duration.inMilliseconds));
  let id;
  const timeout = new Promise((resolve, reject) => {
    id = setTimeout(() => {
      try {
        if (typeof onTimeout === "function") resolve(onTimeout());
        else reject(new Error("Future timeout"));
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
  return Promise.race([Promise.resolve(future), timeout]).finally(() => clearTimeout(id));
}
function __dartStreamFromIterable(values, isBroadcast = false) {
  return {
    __dartType: "Stream",
    isBroadcast,
    async *[Symbol.asyncIterator]() {
      for (const value of Array.from(values ?? [])) yield value;
    },
  };
}
function __dartStreamFromFuture(future) {
  return {
    __dartType: "Stream",
    isBroadcast: false,
    async *[Symbol.asyncIterator]() {
      yield await future;
    },
  };
}
function __dartStreamFromFutures(futures) {
  return {
    __dartType: "Stream",
    isBroadcast: false,
    async *[Symbol.asyncIterator]() {
      for (const future of Array.from(futures ?? [])) yield await future;
    },
  };
}
function __dartStreamError(error) {
  return {
    __dartType: "Stream",
    isBroadcast: false,
    async *[Symbol.asyncIterator]() {
      throw error;
    },
  };
}
function __dartStreamPeriodic(period, computation = null) {
  const delay = Math.max(0, period == null ? 0 : (typeof period === "number" ? period : period.inMilliseconds));
  return {
    __dartType: "Stream",
    isBroadcast: false,
    async *[Symbol.asyncIterator]() {
      let tick = 0;
      while (true) {
        await __dartFutureDelayed(delay);
        yield typeof computation === "function" ? computation(tick) : tick;
        tick++;
      }
    },
  };
}
async function* __dartStreamValues(stream) {
  const iterator = __dartStreamIterator(stream);
  try {
    while (await iterator.moveNext()) yield iterator.current;
  } finally {
    await iterator.cancel();
  }
}
function __dartStreamTake(stream, count) {
  return {
    __dartType: "Stream",
    isBroadcast: stream?.isBroadcast === true,
    async *[Symbol.asyncIterator]() {
      let seen = 0;
      for await (const value of __dartStreamValues(stream)) {
        if (seen++ >= count) break;
        yield value;
        if (seen >= count) break;
      }
    },
  };
}
function __dartStreamMap(stream, convert) {
  return {
    __dartType: "Stream",
    isBroadcast: stream?.isBroadcast === true,
    async *[Symbol.asyncIterator]() {
      for await (const value of __dartStreamValues(stream)) yield convert(value);
    },
  };
}
function __dartStreamWhere(stream, test) {
  return {
    __dartType: "Stream",
    isBroadcast: stream?.isBroadcast === true,
    async *[Symbol.asyncIterator]() {
      for await (const value of __dartStreamValues(stream)) {
        if (test(value)) yield value;
      }
    },
  };
}
function __dartStreamExpand(stream, convert) {
  return {
    __dartType: "Stream",
    isBroadcast: stream?.isBroadcast === true,
    async *[Symbol.asyncIterator]() {
      for await (const value of __dartStreamValues(stream)) {
        for (const expanded of Array.from(convert(value) ?? [])) yield expanded;
      }
    },
  };
}
function __dartStreamTransform(stream, transformer) {
  if (transformer != null && typeof transformer.bind === "function") {
    return transformer.bind(stream);
  }
  if (typeof transformer === "function") return transformer(stream);
  throw new TypeError("StreamTransformer has no bind method");
}
function __dartStreamIterator(stream) {
  const iterator = stream?.[Symbol.asyncIterator]?.();
  if (iterator == null && typeof stream?.listen === "function") {
    const controller = __dartStreamController(stream?.isBroadcast === true);
    const subscription = stream.listen(
      (value) => controller.add(value),
      { onError: (error) => controller.addError(error), onDone: () => controller.close(), cancelOnError: false },
    );
    const listenedIterator = controller.stream[Symbol.asyncIterator]();
    let current = null;
    return {
      __dartType: "StreamIterator",
      get current() { return current; },
      get _subscription() { return subscription ?? null; },
      async moveNext() {
        const step = await listenedIterator.next();
        if (step.done === true) {
          current = null;
          return false;
        }
        current = step.value;
        return true;
      },
      cancel() {
        if (subscription != null && typeof subscription.cancel === "function") {
          return Promise.resolve(subscription.cancel()).then(() => null, () => null);
        }
        if (typeof listenedIterator.return === "function") {
          return Promise.resolve(listenedIterator.return()).then(() => null, () => null);
        }
        return Promise.resolve(null);
      },
    };
  }
  let current = null;
  return {
    __dartType: "StreamIterator",
    get current() { return current; },
    get _subscription() { return null; },
    async moveNext() {
      const step = await iterator.next();
      if (step.done === true) {
        current = null;
        return false;
      }
      current = step.value;
      return true;
    },
    cancel() {
      if (iterator != null && typeof iterator.return === "function") {
        return Promise.resolve(iterator.return()).then(() => null, () => null);
      }
      return Promise.resolve(null);
    },
  };
}
async function __dartStreamToList(stream) {
  const values = [];
  for await (const value of __dartStreamValues(stream)) values.push(value);
  return values;
}
async function __dartStreamFirst(stream) {
  for await (const value of __dartStreamValues(stream)) return value;
  throw new Error("No element");
}
async function __dartStreamSingle(stream) {
  let found = false;
  let single;
  for await (const value of __dartStreamValues(stream)) {
    if (found) throw new Error("Too many elements");
    found = true;
    single = value;
  }
  if (!found) throw new Error("No element");
  return single;
}
async function __dartStreamJoin(stream, separator = "") {
  return (await __dartStreamToList(stream)).map((value) => __dartStr(value)).join(String(separator));
}
async function __dartStreamLength(stream) {
  let count = 0;
  for await (const _ of __dartStreamValues(stream)) count++;
  return count;
}
async function __dartStreamIsEmpty(stream) {
  for await (const _ of __dartStreamValues(stream)) return false;
  return true;
}
async function __dartStreamLast(stream) {
  let found = false;
  let last;
  for await (const value of __dartStreamValues(stream)) {
    found = true;
    last = value;
  }
  if (!found) throw new Error("No element");
  return last;
}
async function __dartStreamAny(stream, test) {
  for await (const value of __dartStreamValues(stream)) {
    if (await test(value)) return true;
  }
  return false;
}
async function __dartStreamEvery(stream, test) {
  for await (const value of __dartStreamValues(stream)) {
    if (!(await test(value))) return false;
  }
  return true;
}
async function __dartStreamContains(stream, needle) {
  for await (const value of __dartStreamValues(stream)) {
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
async function __dartStreamDrain(stream, value = null) {
  for await (const _ of __dartStreamValues(stream)) {}
  return value;
}
function __dartStreamSkip(stream, count) {
  return {
    __dartType: "Stream",
    isBroadcast: stream?.isBroadcast === true,
    async *[Symbol.asyncIterator]() {
      let seen = 0;
      for await (const value of __dartStreamValues(stream)) {
        if (seen++ < count) continue;
        yield value;
      }
    },
  };
}
function __dartStreamTakeWhile(stream, test) {
  return {
    __dartType: "Stream",
    isBroadcast: stream?.isBroadcast === true,
    async *[Symbol.asyncIterator]() {
      for await (const value of __dartStreamValues(stream)) {
        if (!test(value)) break;
        yield value;
      }
    },
  };
}
function __dartStreamSkipWhile(stream, test) {
  return {
    __dartType: "Stream",
    isBroadcast: stream?.isBroadcast === true,
    async *[Symbol.asyncIterator]() {
      let skipping = true;
      for await (const value of __dartStreamValues(stream)) {
        if (skipping && test(value)) continue;
        skipping = false;
        yield value;
      }
    },
  };
}
async function __dartStreamFirstWhere(stream, test, orElse = null) {
  for await (const value of __dartStreamValues(stream)) {
    if (test(value)) return value;
  }
  if (typeof orElse === "function") return orElse();
  throw new Error("No element");
}
async function __dartStreamLastWhere(stream, test, orElse = null) {
  let found = false;
  let result;
  for await (const value of __dartStreamValues(stream)) {
    if (test(value)) {
      found = true;
      result = value;
    }
  }
  if (found) return result;
  if (typeof orElse === "function") return orElse();
  throw new Error("No element");
}
async function __dartStreamSingleWhere(stream, test, orElse = null) {
  let found = false;
  let result;
  for await (const value of __dartStreamValues(stream)) {
    if (!test(value)) continue;
    if (found) throw new Error("Too many elements");
    found = true;
    result = value;
  }
  if (found) return result;
  if (typeof orElse === "function") return orElse();
  throw new Error("No element");
}
function __dartStreamAsyncMap(stream, convert) {
  return {
    __dartType: "Stream",
    isBroadcast: stream?.isBroadcast === true,
    async *[Symbol.asyncIterator]() {
      for await (const value of __dartStreamValues(stream)) yield await convert(value);
    },
  };
}
function __dartStreamAsyncExpand(stream, convert) {
  return {
    __dartType: "Stream",
    isBroadcast: stream?.isBroadcast === true,
    async *[Symbol.asyncIterator]() {
      for await (const value of __dartStreamValues(stream)) {
        for await (const expanded of __dartStreamValues(await convert(value))) yield expanded;
      }
    },
  };
}
function __dartStreamDistinct(stream, equals = null) {
  return {
    __dartType: "Stream",
    isBroadcast: stream?.isBroadcast === true,
    async *[Symbol.asyncIterator]() {
      let found = false;
      let previous;
      for await (const value of __dartStreamValues(stream)) {
        const same = found && (typeof equals === "function" ? equals(previous, value) : __dartEquals(previous, value));
        if (same) continue;
        found = true;
        previous = value;
        yield value;
      }
    },
  };
}
function __dartStreamHandleError(stream, onError, test = null) {
  return {
    __dartType: "Stream",
    isBroadcast: stream?.isBroadcast === true,
    async *[Symbol.asyncIterator]() {
      const iterator = __dartStreamIterator(stream);
      try {
        while (true) {
          try {
            if (!(await iterator.moveNext())) break;
            yield iterator.current;
          } catch (error) {
            if (typeof test === "function" && !test(error)) throw error;
            if (typeof onError === "function") onError(error);
          }
        }
      } finally {
        await iterator.cancel();
      }
    },
  };
}
async function __dartStreamToSet(stream) {
  return new Set(await __dartStreamToList(stream));
}
async function __dartStreamFold(stream, initialValue, combine) {
  let result = initialValue;
  for await (const value of __dartStreamValues(stream)) {
    result = await combine(result, value);
  }
  return result;
}
async function __dartStreamReduce(stream, combine) {
  let found = false;
  let result;
  for await (const value of __dartStreamValues(stream)) {
    result = found ? await combine(result, value) : value;
    found = true;
  }
  if (!found) throw new Error("No element");
  return result;
}
async function __dartStreamForEach(stream, action) {
  for await (const value of __dartStreamValues(stream)) await action(value);
  return null;
}
function __dartStreamAsBroadcast(stream, onListen = null, onCancel = null) {
  let valuesPromise = null;
  let subscription = null;
  return {
    __dartType: "Stream",
    isBroadcast: true,
    async *[Symbol.asyncIterator]() {
      if (valuesPromise == null) {
        if (typeof onListen === "function") onListen(subscription);
        valuesPromise = __dartStreamToList(stream);
      }
      for (const value of await valuesPromise) yield value;
    },
  };
}
function __dartStreamTransformerFromBind(bind) {
  return { bind };
}
function __dartStreamTransformerFromHandlers(options = {}) {
  return {
    bind(stream) {
      const controller = __dartStreamController(stream?.isBroadcast === true);
      __dartStreamListen(stream, (value) => {
        if (typeof options.handleData === "function") options.handleData(value, controller);
        else controller.add(value);
      }, (error, stackTrace = null) => {
        if (typeof options.handleError === "function") options.handleError(error, stackTrace, controller);
        else controller.addError(error, stackTrace);
      }, () => {
        if (typeof options.handleDone === "function") options.handleDone(controller);
        else controller.close();
      }, false);
      return controller.stream;
    },
  };
}
function __dartStreamEventTransformed(stream, sinkMapper) {
  const controller = __dartStreamController(stream?.isBroadcast === true);
  const sink = sinkMapper(controller);
  __dartStreamListen(stream, (value) => sink.add(value), (error, stackTrace = null) => sink.addError(error, stackTrace), () => sink.close(), false);
  return controller.stream;
}
function __dartStreamTimeout(stream, duration, onTimeout = null) {
  const delay = Math.max(0, duration == null ? 0 : (typeof duration === "number" ? duration : duration.inMilliseconds));
  return {
    __dartType: "Stream",
    isBroadcast: stream?.isBroadcast === true,
    [Symbol.asyncIterator]() {
      const controller = __dartStreamController(false);
      let timer = null;
      const reset = () => {
        if (timer != null) clearTimeout(timer);
        timer = setTimeout(() => {
          if (typeof onTimeout === "function") onTimeout(controller);
          else controller.addError(new Error("Stream timeout"));
        }, delay);
      };
      reset();
      __dartStreamListen(stream, (value) => {
        reset();
        controller.add(value);
      }, (error, stackTrace = null) => controller.addError(error, stackTrace), () => {
        if (timer != null) clearTimeout(timer);
        controller.close();
      }, false);
      return controller.stream[Symbol.asyncIterator]();
    },
  };
}
async function __dartStreamPipe(stream, consumer) {
  await consumer.addStream(stream);
  await consumer.close();
  return null;
}
function __dartStreamController(broadcast = false, options = {}) {
  let closed = false;
  let listened = false;
  let paused = false;
  const handlers = {
    onListen: options.onListen ?? null,
    onPause: options.onPause ?? null,
    onResume: options.onResume ?? null,
    onCancel: options.onCancel ?? null,
  };
  const queue = [];
  const waiters = [];
  const listeners = new Set();
  function ensureListened() {
    if (!listened) {
      listened = true;
      if (typeof handlers.onListen === "function") handlers.onListen();
    }
  }
  function deliver(item) {
    let delivered = false;
    for (const listener of Array.from(listeners)) {
      listener(item);
      delivered = true;
    }
    if (waiters.length > 0) {
      waiters.shift()(item);
      delivered = true;
    }
    if (!delivered) queue.push(item);
  }
  function closeQueue() {
    if (closed) return;
    closed = true;
    deliver({ done: true });
  }
  const stream = {
    __dartType: "Stream",
    get isBroadcast() { return broadcast; },
    listen(onData, options = {}) {
      return __dartStreamListen(stream, onData, options.onError ?? null, options.onDone ?? null, options.cancelOnError === true);
    },
    [Symbol.asyncIterator]() {
      ensureListened();
      let done = false;
      return {
        async next() {
          if (done) return { done: true };
          const item = queue.length > 0 ? queue.shift() : await new Promise((resolve) => waiters.push(resolve));
          if (item.done === true) {
            done = true;
            return { done: true };
          }
          if ("error" in item) throw item.error;
          return { value: item.value, done: false };
        },
        async return() {
          done = true;
          if (typeof handlers.onCancel === "function") await handlers.onCancel();
          return { done: true };
        },
      };
    },
    __dartListenRaw(listener) {
      ensureListened();
      listeners.add(listener);
      while (queue.length > 0) listener(queue.shift());
      return () => listeners.delete(listener);
    },
    __dartPauseRaw() {
      paused = true;
      if (typeof handlers.onPause === "function") handlers.onPause();
    },
    __dartResumeRaw() {
      paused = false;
      if (typeof handlers.onResume === "function") handlers.onResume();
    },
    __dartCancelRaw() {
      if (typeof handlers.onCancel === "function") return handlers.onCancel();
      return null;
    },
  };
  return {
    __dartType: "StreamController",
    get stream() { return stream; },
    get sink() { return this; },
    get done() { return Promise.resolve(null); },
    get isClosed() { return closed; },
    get isPaused() { return paused; },
    get hasListener() { return listeners.size > 0 || waiters.length > 0; },
    add(value) { if (!closed) deliver({ value }); return null; },
    addError(error, stackTrace = null) { if (!closed) deliver({ error }); return null; },
    async addStream(source, options = {}) {
      const iterator = __dartStreamIterator(source);
      try {
        while (!closed) {
          try {
            if (!(await iterator.moveNext())) break;
            deliver({ value: iterator.current });
          } catch (error) {
            deliver({ error });
            if (options.cancelOnError === true) break;
          }
        }
      } finally {
        await iterator.cancel();
      }
      return null;
    },
    close() { closeQueue(); return Promise.resolve(null); },
    get onListen() { return handlers.onListen; },
    set onListen(value) { handlers.onListen = value; },
    get onPause() { return handlers.onPause; },
    set onPause(value) { handlers.onPause = value; },
    get onResume() { return handlers.onResume; },
    set onResume(value) { handlers.onResume = value; },
    get onCancel() { return handlers.onCancel; },
    set onCancel(value) { handlers.onCancel = value; },
  };
}
function __dartStreamMulti(onListen, isBroadcast = false) {
  const controller = __dartStreamController(isBroadcast);
  Promise.resolve().then(() => onListen(controller));
  return controller.stream;
}
function __dartStreamListen(stream, onData, onError = null, onDone = null, cancelOnError = false) {
  let canceled = false;
  let paused = false;
  let done = false;
  let failed = false;
  let failure = null;
  let asFutureValue = null;
  let asFutureResolve = null;
  let asFutureReject = null;
  const pausedItems = [];
  const resumeWaiters = [];
  function completeAsFuture() {
    if (asFutureResolve == null) return;
    if (failed) asFutureReject(failure);
    else asFutureResolve(asFutureValue);
    asFutureResolve = null;
    asFutureReject = null;
  }
  function flushPausedItems() {
    while (!paused && pausedItems.length > 0 && !canceled) handleItem(pausedItems.shift());
  }
  function waitWhilePaused() {
    if (!paused) return Promise.resolve(null);
    return new Promise((resolve) => resumeWaiters.push(resolve));
  }
  const handleItem = (item) => {
    if (canceled) return;
    if (paused) {
      pausedItems.push(item);
      return;
    }
    if (item.done === true) {
      done = true;
      if (typeof onDone === "function") onDone();
      completeAsFuture();
      return;
    }
    if ("error" in item) {
      failed = true;
      failure = item.error;
      if (typeof onError === "function") onError(item.error);
      completeAsFuture();
      if (cancelOnError) canceled = true;
      return;
    }
    if (typeof onData === "function") onData(item.value);
  };
  const remove = typeof stream?.__dartListenRaw === "function" ? stream.__dartListenRaw(handleItem) : null;
  if (remove == null) {
    (async () => {
      try {
        for await (const value of __dartStreamValues(stream)) {
          if (canceled) break;
          await waitWhilePaused();
          if (canceled) break;
          if (typeof onData === "function") onData(value);
        }
        if (!canceled && typeof onDone === "function") onDone();
        done = true;
        completeAsFuture();
      } catch (error) {
        failed = true;
        failure = error;
        if (typeof onError === "function") onError(error);
        else throw error;
        completeAsFuture();
      }
    })();
  }
  return {
    __dartType: "StreamSubscription",
    get isPaused() { return paused; },
    cancel() {
      canceled = true;
      if (remove != null) remove();
      const result = typeof stream?.__dartCancelRaw === "function" ? stream.__dartCancelRaw() : null;
      return Promise.resolve(result).then(() => null);
    },
    pause() {
      if (!paused) {
        paused = true;
        if (typeof stream?.__dartPauseRaw === "function") stream.__dartPauseRaw();
      }
      return null;
    },
    resume() {
      if (paused) {
        paused = false;
        if (typeof stream?.__dartResumeRaw === "function") stream.__dartResumeRaw();
        while (resumeWaiters.length > 0) resumeWaiters.shift()(null);
        flushPausedItems();
      }
      return null;
    },
    onData(callback) { onData = callback; return null; },
    onError(callback) { onError = callback; return null; },
    onDone(callback) { onDone = callback; return null; },
    asFuture(value = null) {
      asFutureValue = value;
      if (done && !failed) return Promise.resolve(value);
      if (failed) return Promise.reject(failure);
      return new Promise((resolve, reject) => {
        asFutureResolve = resolve;
        asFutureReject = reject;
      });
    },
  };
}
function __dartTimer(duration, callback, periodic = false) {
  const delay = Math.max(0, duration == null ? 0 : (typeof duration === "number" ? duration : duration.inMilliseconds));
  let active = true;
  let tick = 0;
  let id;
  const timer = {
    __dartType: "Timer",
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
'''),
      _ => throw ArgumentError('not an async helper: $helper'),
    };
  }
}
