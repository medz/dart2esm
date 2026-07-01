part of 'runtime_helpers.dart';

extension _Dynamichelperdeclaration on EsmRuntimeHelperRegistry {
  EsmModuleItem _dynamicHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.dynamicCall => EsmRawModuleItem('''
function __dartDynamicCall(receiver, positionalArguments, namedArguments = null) {
  const args = namedArguments == null ? Array.from(positionalArguments) : [...positionalArguments, namedArguments];
  if (typeof receiver === "function") return receiver(...args);
  const call = receiver?.call;
  if (typeof call === "function") return call.apply(receiver, args);
  throw new TypeError("Object is not callable");
}
'''),
      EsmRuntimeHelper.dynamicGet => EsmRawModuleItem('''
function __dartDynamicGet(receiver, name) {
  if (receiver == null) throw new TypeError("Cannot read property " + name + " of " + receiver);
  if ((receiver instanceof Set || receiver instanceof Map) && name === "length") return receiver.size;
  const value = receiver[name];
  return typeof value === "function" ? value.bind(receiver) : value;
}
'''),
      EsmRuntimeHelper.dynamicSet => EsmRawModuleItem('''
function __dartDynamicSet(receiver, name, value) {
  if (receiver == null) throw new TypeError("Cannot set property " + name + " of " + receiver);
  receiver[name] = value;
  return value;
}
'''),
      EsmRuntimeHelper.dynamicInvoke => EsmRawModuleItem('''
function __dartDynamicInvoke(receiver, name, positionalArguments, namedArguments = null) {
  if (receiver == null) throw new TypeError("Cannot call " + name + " on " + receiver);
  const args = namedArguments == null ? Array.from(positionalArguments) : [...positionalArguments, namedArguments];
  if (name === "[]") {
    const key = args[0];
    if (receiver instanceof Map) {
      return receiver.has(key) ? receiver.get(key) : null;
    }
    if (typeof receiver["[]"] === "function") return receiver["[]"](key);
    return receiver[key];
  }
  if (name === "[]=") {
    const key = args[0];
    const value = args[1];
    if (receiver instanceof Map) {
      receiver.set(key, value);
      return value;
    }
    if (typeof receiver["[]="] === "function") return receiver["[]="](key, value);
    receiver[key] = value;
    return value;
  }
  if (receiver instanceof Map) {
    if (name === "containsKey") return receiver.has(args[0]);
    if (name === "remove") {
      const key = args[0];
      const value = receiver.has(key) ? receiver.get(key) : null;
      receiver.delete(key);
      return value;
    }
  }
  if (receiver instanceof Set) {
    if (name === "add") {
      const value = args[0];
      const hadValue = receiver.has(value);
      receiver.add(value);
      return !hadValue;
    }
    if (name === "contains") return receiver.has(args[0]);
    if (name === "remove") return receiver.delete(args[0]);
  }
  const listLike = receiver != null && typeof receiver["[]"] === "function" && typeof receiver.length === "number";
  if (Array.isArray(receiver) || listLike) {
    if (name === "join") return __dartIterableJoin(receiver, args[0] ?? "");
    if (name === "contains") {
      if (Array.isArray(receiver)) return receiver.includes(args[0]);
      for (let index = 0; index < receiver.length; index++) {
        if (__dartEquals(receiver["[]"](index), args[0])) return true;
      }
      return false;
    }
    if (Array.isArray(receiver) && name === "add") {
      receiver.push(args[0]);
      return null;
    }
    if (Array.isArray(receiver) && name === "addAll") {
      receiver.push(...Array.from(args[0]));
      return null;
    }
  }
  if (typeof receiver === "string" && name === "contains") {
    return receiver.includes(args[0]);
  }
  const member = receiver[name];
  if (typeof member === "function") return member.apply(receiver, args);
  throw new TypeError("Object has no method " + name);
}
'''),
      EsmRuntimeHelper.expando => EsmRawModuleItem('''
function __dartExpando(name = null) {
  const values = new WeakMap();
  const expando = {
    get(object) {
      return values.has(object) ? values.get(object) : null;
    },
    set(object, value) {
      values.set(object, value);
      return null;
    },
    toString() {
      return name == null ? "Expando" : "Expando:" + String(name);
    },
  };
  Object.defineProperty(expando, "__dartType", { value: "Expando" });
  return Object.freeze(expando);
}
'''),
      EsmRuntimeHelper.finalizer => EsmRawModuleItem('''
function __dartFinalizer(callback) {
  const registry = typeof FinalizationRegistry === "function" ? new FinalizationRegistry(callback) : null;
  const detachTokens = new Map();
  const finalizer = {
    attach(value, token, options = {}) {
      if (registry != null) {
        const detach = options.detach ?? null;
        let unregisterToken = undefined;
        if (detach != null) {
          unregisterToken = detachTokens.get(detach);
          if (unregisterToken == null) {
            unregisterToken = {};
            detachTokens.set(detach, unregisterToken);
          }
        }
        registry.register(value, token, unregisterToken);
      }
      return null;
    },
    detach(detach) {
      if (registry != null) {
        const unregisterToken = detachTokens.get(detach);
        if (unregisterToken != null) {
          registry.unregister(unregisterToken);
          detachTokens.delete(detach);
        }
      }
      return null;
    },
    toString() {
      return "Finalizer";
    },
  };
  Object.defineProperty(finalizer, "__dartType", { value: "Finalizer" });
  return Object.freeze(finalizer);
}
'''),
      EsmRuntimeHelper.lazyField => EsmRawModuleItem('''
function __dartLazyField(name, initialize, writable, publish = null) {
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
'''),
      EsmRuntimeHelper.weakReference => EsmRawModuleItem('''
function __dartWeakReference(target) {
  const ref = typeof WeakRef === "function" ? new WeakRef(target) : { deref() { return target; } };
  const weak = {
    get target() {
      return ref.deref() ?? null;
    },
    toString() {
      return "WeakReference";
    },
  };
  Object.defineProperty(weak, "__dartType", { value: "WeakReference" });
  return Object.freeze(weak);
}
'''),
      _ => throw StateError('Unexpected runtime helper declaration: $helper'),
    };
  }
}
