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
function __dartStreamController() {
  const queue = [];
  const waiters = [];
  let closed = false;
  let hasListener = false;
  let resolveDone;
  const done = new Promise((resolve) => { resolveDone = resolve; });
  function completeDoneIfDrained() {
    if (closed && queue.length === 0) resolveDone(null);
  }
  function deliver(item) {
    if (closed) throw new Error("Cannot add event after closing");
    const waiter = waiters.shift();
    if (waiter) waiter(item);
    else queue.push(item);
  }
  function closeQueue() {
    if (closed) return;
    closed = true;
    while (waiters.length > 0) waiters.shift()({ done: true });
    completeDoneIfDrained();
  }
  const controller = {
    get stream() { return stream; },
    get sink() { return controller; },
    get done() { return done; },
    get isClosed() { return closed; },
    get isPaused() { return !hasListener && !closed; },
    get hasListener() { return hasListener; },
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
      hasListener = true;
      return {
        next() {
          const item = queue.shift();
          if (item) {
            completeDoneIfDrained();
            if ("error" in item) return Promise.reject(item.error);
            return Promise.resolve({ value: item.value, done: false });
          }
          if (closed) {
            completeDoneIfDrained();
            return Promise.resolve({ done: true });
          }
          return new Promise((resolve, reject) => {
            waiters.push((nextItem) => {
              if (nextItem.done === true) {
                completeDoneIfDrained();
                resolve({ done: true });
              } else if ("error" in nextItem) {
                completeDoneIfDrained();
                reject(nextItem.error);
              } else {
                resolve({ value: nextItem.value, done: false });
              }
            });
          });
        },
      };
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
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
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
  const controller = __dartStreamController();
  const controlledFuture = __dartStreamToList(controller.stream);
  __dartPrint("state " + __dartStr(controller.isClosed) + " " + __dartStr(controller.hasListener));
  controller.add(4);
  controller.add(5);
  await controller.close();
  const controlled = await controlledFuture;
  __dartPrint("controller " + __dartStr(__dartIterableJoin(controlled, ",")) + " " + __dartStr(controller.isClosed));
  __dartPrint("done " + __dartStr(await controller.done));
  const errorController = __dartStreamController();
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
