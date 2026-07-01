part of 'runtime_helpers.dart';

extension _Urihelperdeclaration on EsmRuntimeHelperRegistry {
  EsmModuleItem _uriHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.uri => EsmRawModuleItem(r'''
function __dartBase64Encode(bytes, urlSafe = false) {
  const values = Uint8Array.from(Array.from(bytes, (byte) => Number(byte) & 255));
  let encoded;
  if (typeof Buffer !== "undefined") {
    encoded = Buffer.from(values).toString("base64");
  } else {
    let binary = "";
    for (const byte of values) binary += String.fromCharCode(byte);
    encoded = btoa(binary);
  }
  return urlSafe ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "") : encoded;
}
function __dartUriParse(source, tryParse = false) {
  const text = String(source);
  let url;
  let isRelative = false;
  let isProtocolRelative = false;
  try {
    if (text.startsWith("//")) {
      url = new URL("dart:" + text);
      isProtocolRelative = true;
    } else {
      url = new URL(text);
    }
  } catch (_) {
    try {
      url = new URL(text, "dart://relative");
      isRelative = true;
    } catch (_) {
      if (tryParse) return null;
      throw __dartCoreError("FormatException", "Invalid URI");
    }
  }
  const relativePath = isRelative ? text.split(/[?#]/, 1)[0] : url.pathname;
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
    __dartType: "Uri",
    get scheme() { return isRelative || isProtocolRelative ? "" : url.protocol.slice(0, -1); },
    get host() { return isRelative ? "" : url.hostname; },
    get authority() { return isRelative ? "" : (userInfo === "" ? url.host : userInfo + "@" + url.host); },
    get userInfo() { return userInfo; },
    get port() { return isRelative ? 0 : (url.port === "" ? defaultPort : Number(url.port)); },
    get path() { return relativePath; },
    get pathSegments() { return relativePath.split("/").filter((segment) => segment !== "").map(decodeURIComponent); },
    get query() { return url.search.startsWith("?") ? url.search.slice(1) : ""; },
    get queryParameters() { return queryParameters(false); },
    get queryParametersAll() { return queryParameters(true); },
    get fragment() { return url.hash.startsWith("#") ? url.hash.slice(1) : ""; },
    get hasScheme() { return !isRelative && url.protocol !== ""; },
    get hasAuthority() { return !isRelative && url.host !== ""; },
    get hasPort() { return !isRelative && url.port !== ""; },
    get hasQuery() { return url.search !== ""; },
    get hasFragment() { return url.hash !== ""; },
    get isAbsolute() { return !isRelative && !isProtocolRelative && url.protocol !== "" && url.hash === ""; },
    toString() { return text; },
  });
}
function __dartUriEncodePath(path) { return String(path).split("/").map(encodeURIComponent).join("/"); }
function __dartUriEncodeQueryComponent(value, encoding = null) {
  const text = String(value);
  if (encoding == null || typeof encoding.encode !== "function") return encodeURIComponent(text).replace(/%20/g, "+");
  let result = "";
  for (const byte of encoding.encode(text)) {
    const value = Number(byte) & 255;
    if (value === 0x20) { result += "+"; continue; }
    const char = String.fromCharCode(value);
    result += /[A-Za-z0-9\-._~]/.test(char) ? char : "%" + value.toString(16).toUpperCase().padStart(2, "0");
  }
  return result;
}
function __dartUriDecodeQueryComponent(value, encoding = null) {
  const text = String(value).replace(/\+/g, " ");
  if (encoding == null || typeof encoding.decode !== "function") return decodeURIComponent(text);
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "%" && i + 2 < text.length) {
      const hex = text.slice(i + 1, i + 3);
      if (/^[0-9a-fA-F]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(char.charCodeAt(0));
  }
  return encoding.decode(bytes);
}
function __dartUriSplitQueryString(query, encoding = null) {
  const map = new Map();
  for (const element of String(query).split("&")) {
    const index = element.indexOf("=");
    if (index === -1) {
      if (element !== "") map.set(__dartUriDecodeQueryComponent(element, encoding), "");
      continue;
    }
    if (index === 0) continue;
    const key = element.slice(0, index);
    const value = element.slice(index + 1);
    map.set(__dartUriDecodeQueryComponent(key, encoding), __dartUriDecodeQueryComponent(value, encoding));
  }
  return map;
}
function __dartUriBuildQuery(queryParameters) {
  const parts = [];
  for (const [key, value] of queryParameters) {
    const encodedKey = __dartUriEncodeQueryComponent(key);
    if (value == null) {
      parts.push(encodedKey);
    } else if (typeof value !== "string" && typeof value[Symbol.iterator] === "function") {
      for (const item of value) parts.push(encodedKey + "=" + __dartUriEncodeQueryComponent(item));
    } else {
      parts.push(encodedKey + "=" + __dartUriEncodeQueryComponent(value));
    }
  }
  return parts.join("&");
}
function __dartUri(options = {}) {
  const scheme = options.scheme == null ? "" : String(options.scheme);
  const userInfo = options.userInfo == null ? "" : String(options.userInfo);
  const host = options.host == null ? "" : String(options.host);
  const port = options.port == null ? null : Number(options.port);
  let path = "";
  if (options.pathSegments != null) {
    path = Array.from(options.pathSegments, (segment) => encodeURIComponent(String(segment))).join("/");
  } else if (options.path != null) {
    path = __dartUriEncodePath(options.path);
  }
  const authority = host === ""
    ? ""
    : (userInfo === "" ? "" : userInfo + "@") + host + (port == null ? "" : ":" + port);
  let text = scheme === "" ? "" : scheme + ":";
  if (authority !== "") text += "//" + authority;
  if (path !== "") {
    if (authority !== "" && !path.startsWith("/")) text += "/";
    text += path;
  }
  if (options.queryParameters != null) {
    const query = __dartUriBuildQuery(options.queryParameters);
    if (query !== "") text += "?" + query;
  } else if (options.query != null) {
    text += "?" + String(options.query);
  }
  if (options.fragment != null) {
    text += "#" + encodeURIComponent(String(options.fragment));
  }
  return __dartUriParse(text, false);
}
function __dartUriFile(path, windows = false, directory = false) {
  let text = String(path);
  if (windows) text = text.replace(/\\/g, "/");
  if (directory && text !== "" && !text.endsWith("/") && !(windows && /^[a-zA-Z]:$/.test(text))) text += "/";
  const isAbsolute = windows ? (/^[a-zA-Z]:\//.test(text) || text.startsWith("//")) : text.startsWith("/");
  const encoded = __dartUriEncodePath(text);
  if (!isAbsolute) return __dartUriParse(encoded, false);
  const filePath = windows && /^[a-zA-Z]:\//.test(encoded) ? "/" + encoded : encoded;
  return __dartUriParse("file://" + filePath, false);
}
function __dartUriDataParameters(parameters) {
  if (parameters == null) return "";
  let result = "";
  for (const [key, value] of parameters) {
    result += ";" + encodeURIComponent(String(key)) + "=" + encodeURIComponent(String(value));
  }
  return result;
}
function __dartUriDataMediaType(mimeType) {
  if (mimeType == null || String(mimeType).toLowerCase() === "text/plain") return "";
  return String(mimeType);
}
function __dartUriPercentEncodeBytes(bytes) {
  let result = "";
  for (const byte of bytes) {
    const value = Number(byte) & 255;
    const char = String.fromCharCode(value);
    result += /[A-Za-z0-9\-._~]/.test(char) ? char : "%" + value.toString(16).toUpperCase().padStart(2, "0");
  }
  return result;
}
function __dartUriDataFromString(content, mimeType = null, encoding = null, parameters = null, base64 = false) {
  const text = String(content);
  let metadata = __dartUriDataMediaType(mimeType);
  if (encoding != null) metadata += ";charset=utf-8";
  metadata += __dartUriDataParameters(parameters);
  if (base64) {
    const bytes = new TextEncoder().encode(text);
    return __dartUriParse("data:" + metadata + ";base64," + __dartBase64Encode(bytes), false);
  }
  return __dartUriParse("data:" + metadata + "," + encodeURIComponent(text), false);
}
function __dartUriDataFromBytes(bytes, mimeType = null, parameters = null, percentEncoded = false) {
  const byteList = Array.from(bytes, (byte) => Number(byte) & 255);
  let metadata = mimeType == null ? "application/octet-stream" : __dartUriDataMediaType(mimeType);
  metadata += __dartUriDataParameters(parameters);
  if (percentEncoded) {
    return __dartUriParse("data:" + metadata + "," + __dartUriPercentEncodeBytes(byteList), false);
  }
  return __dartUriParse("data:" + metadata + ";base64," + __dartBase64Encode(byteList), false);
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
'''),
      EsmRuntimeHelper.uriToFilePath => EsmRawModuleItem(r'''
function __dartUriToFilePath(uri, windows = false) {
  if (uri.scheme !== "" && uri.scheme !== "file") {
    throw __dartCoreError("UnsupportedError", "Cannot extract a file path from a non-file URI");
  }
  let path = decodeURIComponent(uri.path);
  if (windows) {
    if (/^\/[a-zA-Z]:/.test(path)) path = path.slice(1);
    path = path.replace(/\//g, "\\");
  }
  return path;
}
'''),
      _ => throw StateError('Unexpected runtime helper declaration: $helper'),
    };
  }
}
