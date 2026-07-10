part of 'runtime_helpers.dart';

extension _IoWebHelperDeclarations on EsmRuntimeHelperRegistry {
  EsmModuleItem _ioWebHelperDeclaration(EsmRuntimeHelper helper) {
    if (helper != EsmRuntimeHelper.ioWeb) {
      throw StateError('Unexpected web io helper declaration: $helper');
    }
    return EsmRawModuleItem(r'''
function __dartIoWebApi(name) {
  const value = globalThis[name];
  if (typeof value !== "function") {
    throw new Error(name + " Web API is unavailable in this runtime");
  }
  return value;
}
function __dartIoHeaderValueList(value) {
  if (value == null) return ["null"];
  if (typeof value === "string") return [value];
  if (Array.isArray(value) || value instanceof Set) return Array.from(value, String);
  return [String(value)];
}
function __dartIoHttpHeaders(nativeHeaders = null, mutable = true) {
  const HeadersClass = __dartIoWebApi("Headers");
  const native = nativeHeaders instanceof HeadersClass ? nativeHeaders : new HeadersClass(nativeHeaders ?? undefined);
  const values = new Map();
  for (const [name, value] of native.entries()) values.set(name.toLowerCase(), [value]);
  if (typeof native.getSetCookie === "function") {
    const cookies = native.getSetCookie();
    if (cookies.length > 0) values.set("set-cookie", cookies.map(String));
  }
  function ensureMutable() {
    if (!mutable) throw new Error("HTTP headers are immutable");
  }
  function sync(name) {
    const key = String(name).toLowerCase();
    native.delete(key);
    for (const value of values.get(key) ?? []) native.append(key, value);
  }
  const headers = {
    __dartType: "HttpHeaders",
    get _native() { return native; },
    valuesFor(name) {
      const current = values.get(String(name).toLowerCase());
      return current == null ? null : Array.from(current);
    },
    value(name) {
      const current = values.get(String(name).toLowerCase());
      if (current == null || current.length === 0) return null;
      if (current.length > 1) throw new Error("More than one value for HTTP header " + name);
      return current[0];
    },
    add(name, value, options = {}) {
      ensureMutable();
      const key = String(name).toLowerCase();
      const current = values.get(key) ?? [];
      current.push(...__dartIoHeaderValueList(value));
      values.set(key, current);
      sync(key);
      return null;
    },
    set(name, value, options = {}) {
      ensureMutable();
      const key = String(name).toLowerCase();
      values.set(key, __dartIoHeaderValueList(value));
      sync(key);
      return null;
    },
    remove(name, value) {
      ensureMutable();
      const key = String(name).toLowerCase();
      const removed = new Set(__dartIoHeaderValueList(value));
      const next = (values.get(key) ?? []).filter((entry) => !removed.has(entry));
      if (next.length === 0) values.delete(key);
      else values.set(key, next);
      sync(key);
      return null;
    },
    removeAll(name) {
      ensureMutable();
      const key = String(name).toLowerCase();
      values.delete(key);
      native.delete(key);
      return null;
    },
    clear() {
      ensureMutable();
      for (const key of values.keys()) native.delete(key);
      values.clear();
      return null;
    },
    forEach(action) {
      for (const [name, entries] of values) action(name, Array.from(entries));
      return null;
    },
    noFolding(name) { return null; },
    get contentLength() {
      const value = this.value("content-length");
      return value == null ? -1 : Number(value);
    },
    set contentLength(value) {
      if (Number(value) < 0) this.removeAll("content-length");
      else this.set("content-length", String(value));
    },
    get contentType() {
      const value = this.value("content-type");
      return value == null ? null : __dartIoContentTypeParse(value);
    },
    set contentType(value) {
      if (value == null) this.removeAll("content-type");
      else this.set("content-type", String(value));
    },
    toString() {
      let result = "";
      for (const [name, entries] of values) {
        for (const entry of entries) result += name + ": " + entry + "\n";
      }
      return result;
    },
  };
  return headers;
}
function __dartIoByteChunk(value) {
  if (value instanceof Uint8Array) return value;
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (Array.isArray(value)) return Uint8Array.from(value);
  return new TextEncoder().encode(String(value));
}
function __dartIoHttpResponse(response) {
  const headers = __dartIoHttpHeaders(response.headers, false);
  const contentLength = headers.contentLength;
  const encoding = headers.value("content-encoding");
  const stream = {
    __dartType: "HttpClientResponse",
    isBroadcast: false,
    statusCode: response.status,
    reasonPhrase: response.statusText,
    contentLength,
    headers,
    cookies: [],
    certificate: null,
    connectionInfo: null,
    persistentConnection: false,
    redirects: [],
    isRedirect: [301, 302, 303, 307, 308].includes(response.status),
    compressionState: __dartIoEnum(
      "HttpClientResponseCompressionState",
      encoding == null ? "notCompressed" : "decompressed",
      encoding == null ? 0 : 1,
    ),
    async *[Symbol.asyncIterator]() {
      if (response.body == null) return;
      const reader = response.body.getReader();
      try {
        while (true) {
          const item = await reader.read();
          if (item.done) return;
          yield Array.from(item.value);
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
  return stream;
}
function __dartIoHttpRequest(method, url) {
  const headers = __dartIoHttpHeaders();
  const cookies = [];
  const chunks = [];
  const controller = new AbortController();
  let responseFuture = null;
  let aborted = false;
  const request = {
    __dartType: "HttpClientRequest",
    method: String(method).toUpperCase(),
    uri: url,
    headers,
    cookies,
    contentLength: -1,
    bufferOutput: true,
    persistentConnection: true,
    followRedirects: true,
    maxRedirects: 5,
    connectionInfo: null,
    get done() { return this.close(); },
    write(value) { chunks.push(__dartIoByteChunk(value)); return null; },
    writeln(value = "") { chunks.push(__dartIoByteChunk(String(value) + "\n")); return null; },
    writeAll(objects, separator = "") { this.write(Array.from(objects).join(String(separator))); return null; },
    writeCharCode(code) { this.write(String.fromCharCode(Number(code))); return null; },
    add(bytes) { chunks.push(__dartIoByteChunk(bytes)); return null; },
    addError(error, stackTrace = null) { throw error; },
    async addStream(stream) {
      for await (const chunk of stream) chunks.push(__dartIoByteChunk(chunk));
      return null;
    },
    flush() { return Promise.resolve(null); },
    close() {
      if (responseFuture != null) return responseFuture;
      if (aborted) return Promise.reject(new Error("HTTP request aborted"));
      if (cookies.length > 0) headers.set("cookie", cookies.map(String).join("; "));
      const hasBody = this.method !== "GET" && this.method !== "HEAD" && chunks.length > 0;
      const body = hasBody ? new Blob(chunks) : undefined;
      responseFuture = globalThis.fetch(String(url), {
        method: this.method,
        headers: headers._native,
        body,
        redirect: this.followRedirects ? "follow" : "manual",
        credentials: "same-origin",
        signal: controller.signal,
      }).then(__dartIoHttpResponse);
      return responseFuture;
    },
    abort(exception = null, stackTrace = null) {
      aborted = true;
      controller.abort(exception ?? new Error("HTTP request aborted"));
      return null;
    },
  };
  return request;
}
function __dartIoHttpUrl(host, port, path) {
  const hostname = String(host);
  const portText = Number(port) === 80 ? "" : ":" + Number(port);
  const pathText = String(path).startsWith("/") ? String(path) : "/" + String(path);
  return __dartUriParse("http://" + hostname + portText + pathText, false);
}
function __dartIoHttpClient(options = {}) {
  if (options.context != null) {
    throw new Error("SecurityContext cannot be represented by the Fetch API");
  }
  __dartIoWebApi("fetch");
  const client = {
    __dartType: "HttpClient",
    idleTimeout: null,
    connectionTimeout: null,
    maxConnectionsPerHost: null,
    autoUncompress: true,
    userAgent: null,
    open(method, host, port, path) {
      return Promise.resolve(__dartIoHttpRequest(method, __dartIoHttpUrl(host, port, path)));
    },
    openUrl(method, url) { return Promise.resolve(__dartIoHttpRequest(method, url)); },
    get(host, port, path) { return this.open("GET", host, port, path); },
    getUrl(url) { return this.openUrl("GET", url); },
    post(host, port, path) { return this.open("POST", host, port, path); },
    postUrl(url) { return this.openUrl("POST", url); },
    put(host, port, path) { return this.open("PUT", host, port, path); },
    putUrl(url) { return this.openUrl("PUT", url); },
    patch(host, port, path) { return this.open("PATCH", host, port, path); },
    patchUrl(url) { return this.openUrl("PATCH", url); },
    delete(host, port, path) { return this.open("DELETE", host, port, path); },
    deleteUrl(url) { return this.openUrl("DELETE", url); },
    head(host, port, path) { return this.open("HEAD", host, port, path); },
    headUrl(url) { return this.openUrl("HEAD", url); },
    close(options = {}) { return null; },
  };
  return client;
}
function __dartIoWebSocketConnect(url, options = {}) {
  const headerCount = options.headers instanceof Map
    ? options.headers.size
    : Object.keys(options.headers ?? {}).length;
  if (headerCount > 0) {
    return Promise.reject(new Error("WebSocket headers cannot be represented by the WebSocket Web API"));
  }
  if (options.customClient != null) {
    return Promise.reject(new Error("WebSocket customClient cannot be represented by the WebSocket Web API"));
  }
  const WebSocketClass = __dartIoWebApi("WebSocket");
  const protocols = options.protocols == null ? undefined : Array.from(options.protocols, String);
  return new Promise((resolve, reject) => {
    const socket = new WebSocketClass(String(url), protocols);
    socket.binaryType = "arraybuffer";
    const queue = [];
    const waiters = [];
    let terminalError = null;
    let closed = false;
    let closeCode = null;
    let closeReason = null;
    let opened = false;
    let resolveDone;
    const done = new Promise((doneResolve) => { resolveDone = doneResolve; });
    const push = (value) => {
      queue.push(value);
      const waiter = waiters.shift();
      if (waiter != null) waiter();
    };
    const wake = () => {
      const waiter = waiters.shift();
      if (waiter != null) waiter();
    };
    const websocket = {
      __dartType: "WebSocket",
      isBroadcast: false,
      get readyState() { return socket.readyState; },
      get extensions() { return socket.extensions ?? ""; },
      get protocol() { return socket.protocol || null; },
      get closeCode() { return closeCode; },
      get closeReason() { return closeReason; },
      get done() { return done; },
      get pingInterval() { return null; },
      set pingInterval(value) {
        if (value != null) throw new Error("WebSocket pingInterval is unavailable in the WebSocket Web API");
      },
      add(data) {
        socket.send(typeof data === "string" ? data : __dartIoByteChunk(data));
        return null;
      },
      addUtf8Text(bytes) { socket.send(new TextDecoder().decode(__dartIoByteChunk(bytes))); return null; },
      async addStream(stream) { for await (const value of stream) this.add(value); return null; },
      addError(error, stackTrace = null) { throw error; },
      close(code = null, reason = null) {
        if (!closed) socket.close(code ?? undefined, reason ?? undefined);
        return done;
      },
      async *[Symbol.asyncIterator]() {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift();
            continue;
          }
          if (terminalError != null) throw terminalError;
          if (closed) return;
          await new Promise((wake) => waiters.push(wake));
        }
      },
    };
    socket.addEventListener("open", () => {
      opened = true;
      resolve(websocket);
    }, { once: true });
    socket.addEventListener("message", (event) => {
      const data = event.data;
      if (typeof data === "string") push(data);
      else if (data instanceof ArrayBuffer) push(Array.from(new Uint8Array(data)));
      else if (ArrayBuffer.isView(data)) push(Array.from(new Uint8Array(data.buffer, data.byteOffset, data.byteLength)));
      else if (data != null && typeof data.arrayBuffer === "function") {
        data.arrayBuffer().then((buffer) => push(Array.from(new Uint8Array(buffer))), (error) => {
          terminalError = error;
          wake();
        });
      }
    });
    socket.addEventListener("error", () => {
      terminalError = new Error("WebSocket connection failed");
      if (!opened) reject(terminalError);
      wake();
    });
    socket.addEventListener("close", (event) => {
      closed = true;
      closeCode = event.code ?? null;
      closeReason = event.reason || null;
      resolveDone(null);
      wake();
    }, { once: true });
  });
}
''');
  }
}
