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
function __dartStringReplaceFirst(source, pattern, replacement, startIndex = 0) {
  const text = String(source);
  const needle = String(pattern);
  const index = text.indexOf(needle, startIndex);
  if (index < 0) return text;
  return text.slice(0, index) + String(replacement) + text.slice(index + needle.length);
}
function __dartStringReplaceRange(source, start, end, replacement) {
  const text = String(source);
  const actualEnd = end == null ? text.length : end;
  return text.slice(0, start) + String(replacement) + text.slice(actualEnd);
}
function __dartFormatException(message) {
  const error = new Error(String(message));
  error.name = "FormatException";
  return error;
}
function __dartIntTryParse(source, radix = null) {
  const text = String(source).trim();
  let base = radix == null ? null : Number(radix);
  if (base != null && (!Number.isInteger(base) || base < 2 || base > 36)) return null;
  if (base == null && /^[+-]?0x[0-9a-f]+$/i.test(text)) return Number.parseInt(text, 16);
  base ??= 10;
  const sign = /^[+-]/.test(text) ? text[0] : "";
  const digits = sign === "" ? text : text.slice(1);
  if (digits.length === 0) return null;
  for (const char of digits.toLowerCase()) {
    const code = char.charCodeAt(0);
    const value = code >= 48 && code <= 57 ? code - 48 : code >= 97 && code <= 122 ? code - 87 : -1;
    if (value < 0 || value >= base) return null;
  }
  return Number.parseInt(text, base);
}
function __dartIntParse(source, radix = null) {
  const value = __dartIntTryParse(source, radix);
  if (value == null) throw __dartFormatException("Invalid integer literal");
  return value;
}
function __dartDoubleTryParse(source) {
  const text = String(source).trim();
  if (text === "") return null;
  const value = Number(text);
  return Number.isNaN(value) ? null : value;
}
function __dartDoubleParse(source) {
  const value = __dartDoubleTryParse(source);
  if (value == null) throw __dartFormatException("Invalid double literal");
  return value;
}
function __dartNumTryParse(source) {
  return __dartDoubleTryParse(source);
}
function __dartNumParse(source) {
  const value = __dartNumTryParse(source);
  if (value == null) throw __dartFormatException("Invalid number literal");
  return value;
}
function __dartUriParse(source, tryParse = false) {
  const text = String(source);
  let url;
  try {
    url = new URL(text);
  } catch (_) {
    try {
      url = new URL(text, "dart://relative");
    } catch (_) {
      if (tryParse) return null;
      throw __dartCoreError("FormatException", "Invalid URI");
    }
  }
  const isRelative = url.protocol === "dart:";
  const userInfo = isRelative ? "" : [url.username, url.password].filter((part) => part !== "").join(":");
  const defaultPort = url.protocol === "http:" ? 80 : url.protocol === "https:" ? 443 : 0;
  function queryParameters(all = false) {
    const map = new Map();
    for (const [key, value] of url.searchParams) {
      if (all) {
        const values = map.get(key) ?? [];
        values.push(value);
        map.set(key, values);
      } else {
        map.set(key, value);
      }
    }
    return map;
  }
  return Object.freeze({
    get scheme() { return isRelative ? "" : url.protocol.slice(0, -1); },
    get host() { return isRelative ? "" : url.hostname; },
    get authority() { return isRelative ? "" : (userInfo === "" ? url.host : userInfo + "@" + url.host); },
    get userInfo() { return userInfo; },
    get port() { return isRelative ? 0 : (url.port === "" ? defaultPort : Number(url.port)); },
    get path() { return url.pathname; },
    get pathSegments() { return url.pathname.split("/").filter((segment) => segment !== "").map(decodeURIComponent); },
    get query() { return url.search.startsWith("?") ? url.search.slice(1) : ""; },
    get queryParameters() { return queryParameters(false); },
    get queryParametersAll() { return queryParameters(true); },
    get fragment() { return url.hash.startsWith("#") ? url.hash.slice(1) : ""; },
    get hasScheme() { return !isRelative && url.protocol !== ""; },
    get hasAuthority() { return !isRelative && url.host !== ""; },
    get hasPort() { return !isRelative && url.port !== ""; },
    get hasQuery() { return url.search !== ""; },
    get hasFragment() { return url.hash !== ""; },
    get isAbsolute() { return !isRelative && url.protocol !== "" && url.hash === ""; },
    toString() { return text; },
  });
}
function __dartUriAssignQueryParameters(url, queryParameters) {
  const search = new URLSearchParams();
  for (const [key, value] of queryParameters) {
    if (value == null) continue;
    if (typeof value !== "string" && value != null && typeof value[Symbol.iterator] === "function") {
      for (const item of value) search.append(String(key), String(item));
    } else {
      search.append(String(key), String(value));
    }
  }
  url.search = search.toString();
}
function __dartUriResolve(uri, reference) {
  return __dartUriParse(new URL(String(reference), String(uri)).toString());
}
function __dartUriNormalizePath(uri) {
  return __dartUriParse(new URL(String(uri)).toString());
}
function __dartUriReplace(uri, options = {}) {
  const url = new URL(String(uri));
  if ("scheme" in options && options.scheme != null) url.protocol = String(options.scheme) + ":";
  if ("userInfo" in options && options.userInfo != null) {
    const parts = String(options.userInfo).split(":");
    url.username = parts[0] ?? "";
    url.password = parts.slice(1).join(":");
  }
  if ("host" in options && options.host != null) url.hostname = String(options.host);
  if ("port" in options && options.port != null) url.port = String(options.port);
  if ("pathSegments" in options && options.pathSegments != null) {
    url.pathname = Array.from(options.pathSegments, (segment) => encodeURIComponent(String(segment))).join("/");
  } else if ("path" in options && options.path != null) {
    url.pathname = String(options.path);
  }
  if ("queryParameters" in options) {
    if (options.queryParameters != null) __dartUriAssignQueryParameters(url, options.queryParameters);
  } else if ("query" in options) {
    if (options.query != null) url.search = String(options.query);
  }
  if (options.__removeFragment === true) url.hash = "";
  else if ("fragment" in options && options.fragment != null) url.hash = String(options.fragment);
  return __dartUriParse(url.toString());
}
function __dartUriBuild(scheme, authority, path, queryParameters = null) {
  const url = new URL(String(scheme) + "://" + String(authority));
  const rawPath = String(path);
  url.pathname = rawPath.startsWith("/") ? rawPath : "/" + rawPath;
  if (queryParameters != null) {
    __dartUriAssignQueryParameters(url, queryParameters);
  }
  return __dartUriParse(url.toString());
}
function __dartNullCheck(value) {
  if (value == null) {
    throw new TypeError("Null check operator used on a null value");
  }
  return value;
}
function __dartCoreError(typeName, message) {
  const text = message == null ? "" : String(message);
  const display = text === "" ? typeName : typeName + ": " + text;
  const error = new Error(text);
  error.name = typeName;
  Object.defineProperty(error, "__dartCoreErrorType", { value: typeName });
  Object.defineProperty(error, "toString", { value() { return display; } });
  return error;
}
function __dartIsCoreError(value, typeName) {
  const actual = value == null ? null : value.__dartCoreErrorType;
  if (actual != null) {
    if (actual === typeName) return true;
    if (typeName === "Exception" && actual === "FormatException") return true;
    return typeName === "Error" && actual !== "Exception" && actual !== "FormatException";
  }
  if (typeName === "TypeError" && value instanceof TypeError) return true;
  return typeName === "Error" && value instanceof Error;
}
function __dartIterableJoin(iterable, separator = "") {
  return Array.from(iterable, (value) => __dartStr(value)).join(String(separator));
}
function __dartRoundToInt(value) {
  return value < 0 ? Math.ceil(value - 0.5) : Math.floor(value + 0.5);
}
function __dartNumClamp(value, lower, upper) {
  if (value < lower) return lower;
  if (value > upper) return upper;
  return value;
}

// Generated by dart2esm.

export function main() {
  const parsedInt = __dartIntParse("42", null);
  const parsedHex = __dartIntParse("ff", 16);
  const maybeInt = (() => { let v = __dartIntTryParse("nope", null); return ((v === null) ? (-1) : v); })();
  __dartPrint("ints " + __dartStr(parsedInt) + " " + __dartStr(parsedHex) + " " + __dartStr(maybeInt));
  const parsedDouble = __dartDoubleParse("3.5");
  const maybeDouble = (() => { let v_1 = __dartDoubleTryParse("bad"); return ((v_1 === null) ? 1.25 : v_1); })();
  const parsedNum = __dartNumParse("7.25");
  __dartPrint("nums " + __dartStr(parsedDouble) + " " + __dartStr(maybeDouble) + " " + __dartStr(parsedNum));
  const char = String.fromCharCode(65);
  const chars = String.fromCharCode(...Array.from([68, 97, 114, 116]));
  const text = "  hello,dart  ";
  const trimmed = text.trim();
  __dartPrint("strings " + __dartStr(char) + " " + __dartStr(chars) + " " + __dartStr(trimmed.charCodeAt(0)) + " " + __dartStr(trimmed.substring(1, 4)));
  __dartPrint("checks " + __dartStr(trimmed.startsWith("he")) + " " + __dartStr(trimmed.endsWith("rt")) + " " + __dartStr(trimmed.indexOf("dart")) + " " + __dartStr(__dartIterableJoin(trimmed.split(","), "|")));
  __dartPrint("replace " + __dartStr(trimmed.replaceAll("l", "L").toUpperCase()));
  __dartPrint("stringMeta " + __dartStr(trimmed.length) + " " + __dartStr(trimmed.length !== 0) + " " + __dartStr("".length === 0) + " " + __dartStr(trimmed.includes("l", 3)) + " " + __dartStr("7".padStart(3, "0")) + " " + __dartStr("x".padEnd(3, ".")) + " " + __dartStr("  left".trimStart()) + " " + __dartStr("right  ".trimEnd()) + " " + __dartStr(("abc" < "abd" ? -1 : ("abc" > "abd" ? 1 : 0))));
  __dartPrint("stringOps " + __dartStr(__dartStringReplaceFirst(trimmed, "l", "L", 0)) + " " + __dartStr(__dartStringReplaceFirst(trimmed, "l", "L", 3)) + " " + __dartStr(__dartStringReplaceRange(trimmed, 1, 4, "EL")) + " " + __dartStr(__dartIterableJoin(Array.from(Array.from({ length: trimmed.length }, (_, index) => trimmed.charCodeAt(index))).slice(0, 3), "-")));
  const numeric = (-3.6);
  __dartPrint("numOps " + __dartStr(Math.abs(numeric)) + " " + __dartStr(((Number.isNaN(numeric) ? Number.NaN : (numeric < 0 ? -1 : (numeric > 0 ? 1 : numeric))) < 0)) + " " + __dartStr(__dartRoundToInt(numeric)) + " " + __dartStr(Math.floor(numeric)) + " " + __dartStr(Math.ceil(numeric)) + " " + __dartStr(Math.trunc(numeric)));
  __dartPrint("numFormat " + __dartStr(__dartNumClamp(numeric, (-3), 2)) + " " + __dartStr((numeric % 2)) + " " + __dartStr(Number(3.14159).toFixed(2)) + " " + __dartStr(Number(3.14159).toPrecision(3)));
  __dartPrint("numMeta " + __dartStr(Number.isNaN(Number.NaN)) + " " + __dartStr((Infinity === Infinity || Infinity === -Infinity)) + " " + __dartStr(Number.isFinite(3.0)) + " " + __dartStr(((-0.0) < 0 || Object.is((-0.0), -0))));
  const uri = __dartUriParse("https://user:pass@example.test:8443/a/b?x=1&x=2&empty=#frag", false);
  __dartPrint("uri " + __dartStr(uri.scheme) + " " + __dartStr(uri.host) + " " + __dartStr(uri.path) + " " + __dartStr(uri.query) + " " + __dartStr(uri.fragment));
  __dartPrint("uri meta " + __dartStr(uri.authority) + " " + __dartStr(uri.userInfo) + " " + __dartStr(uri.port) + " " + __dartStr(__dartIterableJoin(uri.pathSegments, "|")) + " " + __dartStr(uri.hasScheme) + " " + __dartStr(uri.hasAuthority) + " " + __dartStr(uri.hasPort) + " " + __dartStr(uri.hasQuery) + " " + __dartStr(uri.hasFragment) + " " + __dartStr(uri.isAbsolute));
  __dartPrint("uri query " + __dartStr(uri.queryParameters.get("x")) + " " + __dartStr(uri.queryParameters.get("empty")) + " " + __dartStr(__dartIterableJoin(__dartNullCheck(uri.queryParametersAll.get("x")), "|")));
  __dartPrint("uri string " + __dartStr(__dartStr(uri)));
  const https = __dartUriBuild("https", "example.test", "/a/b", new Map([["q", "dart esm"], ["page", "1"]]));
  const http = __dartUriBuild("http", "example.test:8080", "plain path", new Map([["x", "a/b"]]));
  __dartPrint("uri build " + __dartStr(https.scheme) + " " + __dartStr(https.host) + " " + __dartStr(https.path) + " " + __dartStr(https.query));
  __dartPrint("uri built " + __dartStr(__dartStr(https)) + " " + __dartStr(__dartStr(http)));
  const replaced = __dartUriReplace(uri, { path: "/c/d", queryParameters: new Map([["z", "9"], ["many", ["a", "b"]]]), fragment: null });
  const resolved = __dartUriResolve(uri, "../c?q=1");
  const resolvedUri = __dartUriResolve(uri, __dartUriParse("/root?q=2", false));
  const normalized = __dartUriNormalizePath(__dartUriParse("https://example.test/a/../b/./c", false));
  __dartPrint("uri ops " + __dartStr(__dartStr(replaced)) + " " + __dartStr(__dartUriReplace(uri, { __removeFragment: true }).hasFragment) + " " + __dartStr(resolved.path) + " " + __dartStr(resolved.query) + " " + __dartStr(resolvedUri.path) + " " + __dartStr(normalized.path));
  const tryUri = __dartUriParse("https://example.test/try", true);
  const invalidUri = __dartUriParse("http://[::1", true);
  __dartPrint("uri try " + __dartStr(__dartNullCheck(tryUri).host) + " " + __dartStr((invalidUri === null)));
  try {
    {
      __dartUriParse("http://[::1", false);
    }
  } catch ($error) {
    if (__dartIsCoreError($error, "FormatException")) {
      {
        __dartPrint("uri parseError true");
      }
    } else {
      throw $error;
    }
  }
}

main();
