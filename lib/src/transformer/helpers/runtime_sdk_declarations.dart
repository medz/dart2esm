part of 'runtime_helpers.dart';

extension _SdkHelperDeclarations on EsmRuntimeHelperRegistry {
  EsmModuleItem _sdkHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.concurrent => EsmRawModuleItem('''
function __dartMutex() {
  return Object.freeze({
    __dartType: "Mutex",
    runLocked(action) { return action(); },
  });
}
'''),
      EsmRuntimeHelper.jsInterop => EsmRawModuleItem('''
function __dartJsify(value) {
  if (value instanceof Map) return Object.fromEntries(Array.from(value, ([key, entryValue]) => [String(key), __dartJsify(entryValue)]));
  if (value instanceof Set) return Array.from(value, __dartJsify);
  if (Array.isArray(value) || ArrayBuffer.isView(value)) return Array.from(value, __dartJsify);
  return value;
}
function __dartDartify(value) {
  if (Array.isArray(value)) return value.map(__dartDartify);
  if (value != null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return new Map(Object.entries(value).map(([key, entryValue]) => [key, __dartDartify(entryValue)]));
  }
  return value;
}
function __dartImportModule(specifier) {
  return import(String(specifier));
}
function __dartJSBox(value) {
  return Object.freeze({ __dartType: "JSBoxedDartObject", toDart: value });
}
function __dartJSExternalReference(value) {
  return Object.freeze({ __dartType: "ExternalDartReference", toDartObject: value });
}
function __dartFunctionToJSCaptureThis(fn, maxLength) {
  return function (...arguments_) {
    const args = [this, ...arguments_].slice(0, Math.min(arguments_.length + 1, maxLength));
    return fn(...args);
  };
}
function __dartToJSIterator(iterator) {
  return {
    next() {
      if (iterator.moveNext()) return { value: iterator.current, done: false };
      return { done: true };
    },
  };
}
function __dartToDartIterator(iterator) {
  return {
    current: undefined,
    moveNext() {
      const result = iterator.next();
      if (result.done) {
        this.current = undefined;
        return false;
      }
      this.current = result.value;
      return true;
    },
  };
}
function __dartCreateJSInteropWrapper(value) {
  return new Proxy(value, {
    get(target, property, receiver) {
      if (property === "incBy" && typeof target.increment === "function") {
        return (amount) => target.increment(amount);
      }
      const result = Reflect.get(target, property, receiver);
      return typeof result === "function" ? result.bind(target) : result;
    },
    set(target, property, nextValue, receiver) {
      Reflect.set(target, property, nextValue, receiver);
      return true;
    },
  });
}
'''),
      EsmRuntimeHelper.stopwatch => EsmRawModuleItem('''
function __dartStopwatch() {
  const nowMicros = () => {
    const source = globalThis.performance?.now?.() ?? Date.now();
    return Math.trunc(source * 1000);
  };
  let running = false;
  let start = 0;
  let elapsed = 0;
  return {
    __dartType: "Stopwatch",
    get isRunning() { return running; },
    get elapsedMicroseconds() { return elapsed + (running ? nowMicros() - start : 0); },
    get elapsedMilliseconds() { return Math.trunc(this.elapsedMicroseconds / 1000); },
    start() {
      if (!running) {
        running = true;
        start = nowMicros();
      }
      return null;
    },
    stop() {
      if (running) {
        elapsed += nowMicros() - start;
        running = false;
      }
      return null;
    },
    reset() {
      elapsed = 0;
      if (running) start = nowMicros();
      return null;
    },
  };
}
'''),
      EsmRuntimeHelper.web => EsmRawModuleItem('''
function __dartDomRequest(request, onUpgradeNeeded = null) {
  return new Promise((resolve, reject) => {
    if (typeof onUpgradeNeeded === "function") {
      request.onupgradeneeded = (event) => onUpgradeNeeded(event);
    }
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
'''),
      _ => throw StateError('Unexpected runtime helper declaration: $helper'),
    };
  }
}
