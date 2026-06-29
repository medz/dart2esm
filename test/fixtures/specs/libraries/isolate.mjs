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
function __dartIterableJoin(iterable, separator = "") {
  if (iterable != null && typeof iterable["[]"] === "function" && typeof iterable.length === "number") {
    const values = [];
    for (let index = 0; index < iterable.length; index++) values.push(__dartStr(iterable["[]"](index)));
    return values.join(String(separator));
  }
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
function __dartSendPort(deliver, label = null) {
  const port = {
    send(message) { Promise.resolve().then(() => deliver(message)); return null; },
    toString() { return label == null ? "SendPort" : "SendPort(" + String(label) + ")"; },
  };
  Object.defineProperty(port, "__dartType", { value: "SendPort" });
  return Object.freeze(port);
}
function __dartReceivePort(debugName = null) {
  const controller = __dartStreamController(false);
  const sendPort = __dartSendPort((message) => { if (!controller.isClosed) controller.add(message); }, debugName);
  const port = controller.stream;
  Object.defineProperty(port, "sendPort", { get() { return sendPort; } });
  Object.defineProperty(port, "close", { value() { controller.close(); return null; } });
  Object.defineProperty(port, "listen", { value(onData, options = {}) { return __dartStreamListen(port, onData, options.onError ?? null, options.onDone ?? null, options.cancelOnError ?? false); } });
  Object.defineProperty(port, "__dartType", { value: "ReceivePort" });
  return port;
}
function __dartRawReceivePort(handler = null, debugName = null) {
  let closed = false;
  let currentHandler = handler;
  const sendPort = __dartSendPort((message) => { if (!closed && typeof currentHandler === "function") currentHandler(message); }, debugName);
  const port = {
    get sendPort() { return sendPort; },
    get handler() { return currentHandler; },
    set handler(value) { currentHandler = value; return value; },
    close() { closed = true; return null; },
    toString() { return "RawReceivePort"; },
  };
  Object.defineProperty(port, "__dartType", { value: "RawReceivePort" });
  return port;
}
function __dartIsolate(debugName = null) {
  const isolate = {
    _killed: false,
    _resume: null,
    kill(options = {}) { this._killed = true; return null; },
    pause() { return {}; },
    resume(capability = null) { const resume = this._resume; this._resume = null; if (typeof resume === "function") Promise.resolve().then(resume); return null; },
    addOnExitListener(port, response = null) { return null; },
    removeOnExitListener(port) { return null; },
    addErrorListener(port) { return null; },
    removeErrorListener(port) { return null; },
    setErrorsFatal(errorsAreFatal = true) { return null; },
    toString() { return debugName == null ? "Isolate" : "Isolate(" + String(debugName) + ")"; },
  };
  Object.defineProperty(isolate, "__dartType", { value: "Isolate" });
  return isolate;
}
const __dartCurrentIsolate = __dartIsolate("main");
function __dartIsolateSpawn(entryPoint, message, options = {}) {
  const isolate = __dartIsolate(options.debugName ?? null);
  const run = () => {
    if (isolate._killed) return null;
    try {
      return Promise.resolve(entryPoint(message)).then(() => { if (options.onExit != null) options.onExit.send(null); return null; }, (error) => { if (options.onError != null) { options.onError.send([error, error?.stack ?? "<javascript stack unavailable>"]); return null; } throw error; });
    } catch (error) {
      if (options.onError != null) {
        options.onError.send([error, error?.stack ?? "<javascript stack unavailable>"]);
        return null;
      }
      throw error;
    }
  };
  if (options.paused === true) isolate._resume = run; else Promise.resolve().then(run);
  return Promise.resolve(isolate);
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

// Generated by dart2esm.

export function worker(port) {
  port.send("worker");
}

export async function main() {
  const receivePort = __dartReceivePort("dart2esm");
  const messages = new Array(0).fill(null);
  const done = __dartCompleter();
  const subscription = __dartLazyField("subscription", null, true, null);
  subscription.set(receivePort.listen(function(message) {
    (messages.push(message), null);
    if ((__dartEquals(messages.length, 2) && !(done.isCompleted))) {
      {
        receivePort.close();
        done.complete();
      }
    }
}));
  receivePort.sendPort.send("direct");
  await __dartIsolateSpawn(worker, receivePort.sendPort, { paused: false, onExit: null, onError: null, debugName: null, errorsAreFatal: true });
  await done.future;
  await subscription.get().cancel();
  const receiveSendPort = receivePort.sendPort;
  __dartPrint("receive " + __dartStr(__dartIterableJoin(messages, "|")) + " " + __dartStr(receiveSendPort != null && typeof receiveSendPort === "object" && receiveSendPort.__dartType === "SendPort"));
  const rawMessages = new Array(0).fill(null);
  const rawPort = __dartRawReceivePort(function(message) {
    (rawMessages.push(message), null);
}, "raw");
  rawPort.sendPort.send("raw");
  await new Promise((resolve, reject) => setTimeout(() => { try { resolve(null); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"0\"]]]", () => __dartDuration({ microseconds: 0 })).inMilliseconds)));
  rawPort.close();
  const rawSendPort = rawPort.sendPort;
  __dartPrint("raw " + __dartStr(__dartIterableJoin(rawMessages, "|")) + " " + __dartStr(rawSendPort != null && typeof rawSendPort === "object" && rawSendPort.__dartType === "SendPort"));
}

await main();
