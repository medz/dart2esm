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
    toString() { return String(micros) + "us"; },
  };
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
function __dartStreamFromIterable(values) {
  return (async function*() {
    for (const value of values) yield value;
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
  let canceled = false;
  let paused = false;
  let resumeWaiter = null;
  function waitWhilePaused() {
    if (!paused) return Promise.resolve();
    return new Promise((resolve) => { resumeWaiter = resolve; });
  }
  const done = (async () => {
    try {
      for await (const value of stream) {
        await waitWhilePaused();
        if (canceled) break;
        if (typeof onData === "function") onData(value);
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
    cancel() { canceled = true; this.resume(); return done; },
    asFuture(value = null) { return done.then(() => value); },
  };
}
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
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
  const microtask = await Promise.resolve().then(() => (function() { return 4; })());
  const any = await Promise.race(Array.from([new Promise((resolve, reject) => setTimeout(() => { try { resolve((function() { return 99; })()); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"5000\"]]]", () => __dartDuration({ microseconds: 5000 })).inMilliseconds))), Promise.resolve(5)]));
  __dartPrint("more " + __dartStr(microtask) + " " + __dartStr(any));
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
  } catch ($error_2) {
    if ($error_2 != null) {
      const error_2 = $error_2;
      {
        __dartPrint("completeError " + __dartStr(error_2));
      }
    } else {
      throw $error_2;
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
  __dartPrint("chain " + __dartStr(chained) + " " + __dartStr(recovered) + " " + __dartStr(completed) + " " + __dartStr(finalized) + " " + __dartStr(handledThen) + " " + __dartStr(filtered));
  const streamed = await __dartStreamFirst(__dartFutureAsStream(Promise.resolve("streamed")));
  const fast = await __dartFutureTimeout(Promise.resolve("fast"), __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"10000\"]]]", () => __dartDuration({ microseconds: 10000 })), null);
  const fallback = await __dartFutureTimeout(new Promise((resolve, reject) => setTimeout(() => { try { resolve((function() { return "slow"; })()); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"10000\"]]]", () => __dartDuration({ microseconds: 10000 })).inMilliseconds))), __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"1000\"]]]", () => __dartDuration({ microseconds: 1000 })), function() { return "fallback"; });
  __dartPrint("futureStream " + __dartStr(streamed) + " " + __dartStr(fast) + " " + __dartStr(fallback));
  try {
    {
      await Promise.reject("boom");
    }
  } catch ($error_3) {
    if ($error_3 != null) {
      const error_3 = $error_3;
      {
        __dartPrint("caught " + __dartStr(error_3));
      }
    } else {
      throw $error_3;
    }
  }
}

await main();
