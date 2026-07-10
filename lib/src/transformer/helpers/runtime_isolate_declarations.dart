part of 'runtime_helpers.dart';

extension _IsolateHelperDeclarations on EsmRuntimeHelperRegistry {
  EsmModuleItem _isolateHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.isolate => EsmRawModuleItem(r'''
const __dartIsolateEntries = new Map();
function __dartRegisterIsolateEntry(name, entry) {
  __dartIsolateEntries.set(String(name), entry);
  return null;
}
function __dartIsolateChannel() {
  if (typeof globalThis.MessageChannel !== "function") {
    throw new Error("MessageChannel is required for dart:isolate");
  }
  return new globalThis.MessageChannel();
}
function __dartIsolateEncode(value, state = null) {
  state ??= { transfer: [], bridges: [], seen: new Map() };
  if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return { value, transfer: state.transfer, bridges: state.bridges };
  }
  if (typeof value === "function" || typeof value === "symbol") {
    throw new TypeError("Value is not isolate-sendable: " + typeof value);
  }
  if (value.__dartType === "SendPort") {
    const channel = __dartIsolateChannel();
    channel.port1.onmessage = (event) => value.send(__dartIsolateDecode(event.data));
    channel.port1.start?.();
    state.transfer.push(channel.port2);
    state.bridges.push(channel.port1);
    return {
      value: { __dartIsolateSendPort: channel.port2 },
      transfer: state.transfer,
      bridges: state.bridges,
    };
  }
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value) || value instanceof Date || value instanceof RegExp) {
    return { value, transfer: state.transfer, bridges: state.bridges };
  }
  if (state.seen.has(value)) {
    return { value: state.seen.get(value), transfer: state.transfer, bridges: state.bridges };
  }
  if (Array.isArray(value)) {
    const result = [];
    state.seen.set(value, result);
    for (const entry of value) result.push(__dartIsolateEncode(entry, state).value);
    return { value: result, transfer: state.transfer, bridges: state.bridges };
  }
  if (value instanceof Map) {
    const result = new Map();
    state.seen.set(value, result);
    for (const [key, entry] of value) {
      result.set(__dartIsolateEncode(key, state).value, __dartIsolateEncode(entry, state).value);
    }
    return { value: result, transfer: state.transfer, bridges: state.bridges };
  }
  if (value instanceof Set) {
    const result = new Set();
    state.seen.set(value, result);
    for (const entry of value) result.add(__dartIsolateEncode(entry, state).value);
    return { value: result, transfer: state.transfer, bridges: state.bridges };
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("Value is not isolate-sendable: " + (value.constructor?.name ?? "object"));
  }
  const result = {};
  state.seen.set(value, result);
  for (const [key, entry] of Object.entries(value)) {
    result[key] = __dartIsolateEncode(entry, state).value;
  }
  return { value: result, transfer: state.transfer, bridges: state.bridges };
}
function __dartIsolateDecode(value, ownedPorts = null, seen = new Map()) {
  if (value == null || typeof value !== "object") return value;
  if (value.__dartIsolateSendPort != null) {
    ownedPorts?.push(value.__dartIsolateSendPort);
    return __dartSendPort(value.__dartIsolateSendPort);
  }
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value) || value instanceof Date || value instanceof RegExp) return value;
  if (seen.has(value)) return seen.get(value);
  if (Array.isArray(value)) {
    const result = [];
    seen.set(value, result);
    for (const entry of value) result.push(__dartIsolateDecode(entry, ownedPorts, seen));
    return result;
  }
  if (value instanceof Map) {
    const result = new Map();
    seen.set(value, result);
    for (const [key, entry] of value) {
      result.set(__dartIsolateDecode(key, ownedPorts, seen), __dartIsolateDecode(entry, ownedPorts, seen));
    }
    return result;
  }
  if (value instanceof Set) {
    const result = new Set();
    seen.set(value, result);
    for (const entry of value) result.add(__dartIsolateDecode(entry, ownedPorts, seen));
    return result;
  }
  const result = {};
  seen.set(value, result);
  for (const [key, entry] of Object.entries(value)) {
    result[key] = __dartIsolateDecode(entry, ownedPorts, seen);
  }
  return result;
}
function __dartSendPort(nativePort = null, deliver = null) {
  return Object.freeze({
    __dartType: "SendPort",
    get _nativePort() { return nativePort; },
    send(message) {
      if (nativePort == null) {
        __dartScheduleMicrotask(() => deliver(message));
        return null;
      }
      const encoded = __dartIsolateEncode(message);
      nativePort.postMessage(encoded.value, encoded.transfer);
      return null;
    },
  });
}
function __dartReceivePort(name = null) {
  const controller = __dartStreamController(false);
  let closed = false;
  const sendPort = __dartSendPort(null, (message) => {
    if (!closed) controller.add(message);
  });
  const port = {
    __dartType: "ReceivePort",
    get sendPort() { return sendPort; },
    listen(onData, options = {}) { return controller.stream.listen(onData, options); },
    close() {
      if (closed) return null;
      closed = true;
      controller.close();
      return null;
    },
  };
  return Object.freeze(port);
}
function __dartRawReceivePort(handler = null, name = null) {
  let closed = false;
  const sendPort = __dartSendPort(null, (message) => {
    if (!closed && typeof handler === "function") handler(message);
  });
  return {
    __dartType: "RawReceivePort",
    get handler() { return handler; },
    set handler(value) { handler = value; },
    get sendPort() { return sendPort; },
    close() {
      if (closed) return null;
      closed = true;
      return null;
    },
  };
}
function __dartIsolateHandle(worker, bridges, debugName = null) {
  const closeBridges = () => {
    for (const bridge of bridges) bridge.close();
    bridges.length = 0;
  };
  return Object.freeze({
    __dartType: "Isolate",
    debugName,
    kill() {
      closeBridges();
      worker.terminate();
      return null;
    },
    _closeBridges: closeBridges,
  });
}
async function __dartExecuteIsolateTask(task, send) {
  const entry = __dartIsolateEntries.get(String(task.entry));
  if (typeof entry !== "function") {
    throw new Error("Unknown isolate entry: " + task.entry);
  }
  const ownedPorts = [];
  try {
    const message = __dartIsolateDecode(task.message, ownedPorts);
    const result = task.__dart2esmIsolate === "run"
      ? await entry()
      : await entry(message);
    if (task.__dart2esmIsolate === "run") {
      const encoded = __dartIsolateEncode(result);
      send({ __dart2esmIsolate: "result", value: encoded.value }, encoded.transfer);
    } else {
      send({ __dart2esmIsolate: "done" });
    }
  } catch (error) {
    send({
      __dart2esmIsolate: "error",
      error: {
        name: String(error?.name ?? "Error"),
        message: String(error?.message ?? error),
        stack: String(error?.stack ?? ""),
      },
    });
  } finally {
    for (const port of ownedPorts) port.close();
  }
}
'''),
      EsmRuntimeHelper.isolateWeb => EsmRawModuleItem(r'''
function __dartSpawnWebIsolate(entry, message, debugName = null) {
  if (typeof globalThis.Worker !== "function") {
    throw new Error("Worker Web API is required for Isolate.spawn");
  }
  const encoded = __dartIsolateEncode(message);
  const url = new URL(import.meta.url);
  url.searchParams.set("dart2esm-worker", "1");
  const worker = new globalThis.Worker(url, { type: "module", name: debugName ?? undefined });
  return new Promise((resolve, reject) => {
    let started = false;
    const handle = __dartIsolateHandle(worker, encoded.bridges, debugName);
    worker.addEventListener("message", (event) => {
      const kind = event.data?.__dart2esmIsolate;
      if (kind === "ready") {
        started = true;
        resolve(handle);
      } else if (kind === "done") {
        handle._closeBridges();
      } else if (kind === "error") {
        handle._closeBridges();
        if (!started) reject(new Error(event.data.error?.message ?? "Isolate failed"));
      }
    });
    worker.addEventListener("error", (event) => {
      handle._closeBridges();
      if (!started) reject(event.error ?? new Error(event.message ?? "Isolate failed"));
    }, { once: true });
    worker.postMessage({
      __dart2esmIsolate: "spawn",
      entry,
      message: encoded.value,
    }, encoded.transfer);
  });
}
function __dartRunWebIsolate(entry, debugName = null) {
  if (typeof globalThis.Worker !== "function") {
    throw new Error("Worker Web API is required for Isolate.run");
  }
  const url = new URL(import.meta.url);
  url.searchParams.set("dart2esm-worker", "1");
  const worker = new globalThis.Worker(url, { type: "module", name: debugName ?? undefined });
  return new Promise((resolve, reject) => {
    worker.addEventListener("message", (event) => {
      const kind = event.data?.__dart2esmIsolate;
      if (kind === "ready") {
        worker.postMessage({ __dart2esmIsolate: "run", entry, message: null });
      } else if (kind === "result") {
        resolve(__dartIsolateDecode(event.data.value));
        worker.terminate();
      } else if (kind === "error") {
        reject(new Error(event.data.error?.message ?? "Isolate failed"));
        worker.terminate();
      }
    });
    worker.addEventListener("error", (event) => {
      reject(event.error ?? new Error(event.message ?? "Isolate failed"));
    }, { once: true });
  });
}
function __dartIsolateWorkerMode() {
  return new URL(import.meta.url).searchParams.get("dart2esm-worker") === "1";
}
async function __dartRunIsolateWorker() {
  const task = await new Promise((resolve) => {
    globalThis.addEventListener("message", (event) => resolve(event.data), { once: true });
    globalThis.postMessage({ __dart2esmIsolate: "ready" });
  });
  await __dartExecuteIsolateTask(
    task,
    (message, transfer = []) => globalThis.postMessage(message, transfer),
  );
  globalThis.close();
}
'''),
      EsmRuntimeHelper.isolateNode => EsmRawModuleItem(r'''
import * as __dartNodeWorkerThreads from "node:worker_threads";

function __dartSpawnNodeIsolate(entry, message, debugName = null) {
  const encoded = __dartIsolateEncode(message);
  const worker = new __dartNodeWorkerThreads.Worker(new URL(import.meta.url), {
    name: debugName ?? undefined,
    workerData: {
      __dart2esmIsolate: "spawn",
      entry,
      message: encoded.value,
    },
    transferList: encoded.transfer,
  });
  return new Promise((resolve, reject) => {
    let started = false;
    const handle = __dartIsolateHandle(worker, encoded.bridges, debugName);
    worker.on("message", (message) => {
      const kind = message?.__dart2esmIsolate;
      if (kind === "ready") {
        started = true;
        resolve(handle);
      } else if (kind === "done") {
        handle._closeBridges();
      } else if (kind === "error") {
        handle._closeBridges();
        if (!started) reject(new Error(message.error?.message ?? "Isolate failed"));
      }
    });
    worker.once("error", (error) => {
      handle._closeBridges();
      if (!started) reject(error);
    });
    worker.once("exit", () => handle._closeBridges());
  });
}
function __dartRunNodeIsolate(entry, debugName = null) {
  const worker = new __dartNodeWorkerThreads.Worker(new URL(import.meta.url), {
    name: debugName ?? undefined,
    workerData: {
      __dart2esmIsolate: "run",
      entry,
      message: null,
    },
  });
  return new Promise((resolve, reject) => {
    worker.on("message", (message) => {
      const kind = message?.__dart2esmIsolate;
      if (kind === "result") {
        resolve(__dartIsolateDecode(message.value));
        worker.terminate();
      } else if (kind === "error") {
        reject(new Error(message.error?.message ?? "Isolate failed"));
        worker.terminate();
      }
    });
    worker.once("error", reject);
  });
}
function __dartIsolateWorkerMode() {
  return __dartNodeWorkerThreads.isMainThread === false &&
    (__dartNodeWorkerThreads.workerData?.__dart2esmIsolate === "spawn" ||
      __dartNodeWorkerThreads.workerData?.__dart2esmIsolate === "run");
}
async function __dartRunIsolateWorker() {
  __dartNodeWorkerThreads.parentPort.postMessage({ __dart2esmIsolate: "ready" });
  await __dartExecuteIsolateTask(
    __dartNodeWorkerThreads.workerData,
    (message, transfer = []) => __dartNodeWorkerThreads.parentPort.postMessage(message, transfer),
  );
  __dartNodeWorkerThreads.parentPort.close();
}
'''),
      _ => throw StateError('Unexpected isolate helper declaration: $helper'),
    };
  }
}
