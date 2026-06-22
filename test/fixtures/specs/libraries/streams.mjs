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
      for (const listener of listeners) if (stateHasPending(listener)) return;
      resolveDone(null);
      return;
    }
    if (!stateHasPending(singleState)) resolveDone(null);
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
        if (listener.queue.length === 0) clearWaiters(listener);
      }
    } else if (singleState.queue.length === 0) {
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
    try {
      while (!canceled) {
        await waitWhilePaused();
        if (canceled) break;
        const next = await iterator.next();
        if (next.done) break;
        if (typeof onData === "function") onData(next.value);
      }
      if (!canceled && typeof onDone === "function") onDone();
    } catch (error) {
      if (typeof onError === "function") onError(error);
      else throw error;
      if (cancelOnError) canceled = true;
    }
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
