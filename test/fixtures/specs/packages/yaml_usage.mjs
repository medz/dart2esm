const __dartRecordShape = Symbol("dart.recordShape");
function __dartIsRecord(value) {
  return value != null && typeof value === "object" && Array.isArray(value[__dartRecordShape]);
}
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
function __dartObjectToString(value) {
  if (value == null) return "null";
  if (typeof value === "object") {
    const toString = value.toString;
    if (typeof toString === "function" && toString !== Object.prototype.toString) {
      return String(toString.call(value));
    }
    const typeName = value.constructor && value.constructor.name ? value.constructor.name : "Object";
    return "Instance of '" + typeName + "'";
  }
  return String(value);
}
function __dartPrint(value) {
  console.log(__dartStr(value));
}
function __dartStringBuffer(initial = "") {
  let value = initial == null ? "" : String(initial);
  return {
    write(next) { value += String(next); },
    writeAll(values, separator = "") { const parts = []; if (values != null && typeof values["[]"] === "function" && typeof values.length === "number") { for (let index = 0; index < values.length; index++) parts.push(String(values["[]"](index))); } else { for (const item of values) parts.push(String(item)); } value += parts.join(String(separator)); },
    writeCharCode(charCode) { value += String.fromCodePoint(charCode); },
    writeln(next = "") { value += String(next) + "\n"; },
    clear() { value = ""; },
    toString() { return value; },
    get length() { return value.length; },
    get isEmpty() { return value.length === 0; },
    get isNotEmpty() { return value.length !== 0; },
  };
}
function __dartPatternRegExp(pattern, global = false) {
  if (pattern != null && typeof pattern.__dartRegExpMake === "function") return pattern.__dartRegExpMake(global);
  if (pattern instanceof RegExp) {
    let flags = pattern.flags;
    flags = global ? (flags.includes("g") ? flags : flags + "g") : flags.replace(/g/g, "");
    return new RegExp(pattern.source, flags);
  }
  return null;
}
function __dartPatternAllMatches(pattern, input, start = 0) {
  if (pattern != null && typeof pattern !== "string" && !(pattern instanceof RegExp) && typeof pattern.allMatches === "function") return pattern.allMatches(input, start);
  const text = String(input);
  const regexp = __dartPatternRegExp(pattern, true);
  if (regexp != null) {
    const matches = [];
    regexp.lastIndex = start;
    let match;
    while ((match = regexp.exec(text)) !== null) {
      matches.push(__dartRegExpMatch(match, 0, text, pattern));
      if (match[0] === "") regexp.lastIndex++;
    }
    return matches;
  }
  return __dartStringAllMatches(pattern, text, start);
}
function __dartPatternMatchAsPrefix(pattern, input, start = 0) {
  if (pattern != null && typeof pattern !== "string" && !(pattern instanceof RegExp) && typeof pattern.matchAsPrefix === "function") return pattern.matchAsPrefix(input, start);
  const text = String(input);
  const regexp = __dartPatternRegExp(pattern, false);
  if (regexp != null) {
    const match = regexp.exec(text.slice(start));
    return match == null || match.index !== 0 ? null : __dartRegExpMatch(match, start, text, pattern);
  }
  return __dartStringMatchAsPrefix(pattern, text, start);
}
function __dartStringContains(source, pattern, start = 0) {
  const text = String(source);
  const regexp = __dartPatternRegExp(pattern, false);
  if (regexp != null) return regexp.test(text.slice(start));
  return text.includes(String(pattern), start);
}
function __dartStringStartsWith(source, pattern, start = 0) {
  const text = String(source);
  const regexp = __dartPatternRegExp(pattern, false);
  if (regexp != null) {
    const match = regexp.exec(text.slice(start));
    return match != null && match.index === 0;
  }
  return text.startsWith(String(pattern), start);
}
function __dartStringIndexOf(source, pattern, start = 0) {
  const text = String(source);
  const regexp = __dartPatternRegExp(pattern, false);
  if (regexp != null) {
    const match = regexp.exec(text.slice(start));
    return match == null ? -1 : start + match.index;
  }
  return text.indexOf(String(pattern), start);
}
function __dartStringLastIndexOf(source, pattern, start = null) {
  const text = String(source);
  const limit = start == null ? text.length : start;
  const regexp = __dartPatternRegExp(pattern, false);
  if (regexp != null) {
    for (let index = Math.min(limit, text.length); index >= 0; index--) {
      const match = regexp.exec(text.slice(index));
      if (match != null && match.index === 0) {
        return index;
      }
    }
    return -1;
  }
  return text.lastIndexOf(String(pattern), limit);
}
function __dartStringSplit(source, pattern) {
  const text = String(source);
  const regexp = __dartPatternRegExp(pattern, false);
  return regexp == null ? text.split(String(pattern)) : text.split(regexp);
}
function __dartStringReplaceAll(source, pattern, replacement) {
  const text = String(source);
  const replacementText = String(replacement);
  const regexp = __dartPatternRegExp(pattern, true);
  return regexp == null ? text.split(String(pattern)).join(replacementText) : text.replace(regexp, () => replacementText);
}
function __dartStringReplaceAllMapped(source, pattern, replace) {
  const text = String(source);
  const regexp = __dartPatternRegExp(pattern, true);
  if (regexp != null) {
    return text.replace(regexp, (...args) => String(replace(__dartJsRegExpReplacementMatch(args))));
  }
  const needle = String(pattern);
  return __dartStringReplaceStringMapped(text, needle, replace, true, 0);
}
function __dartStringReplaceFirstMapped(source, pattern, replace, startIndex = 0) {
  const text = String(source);
  const regexp = __dartPatternRegExp(pattern, false);
  if (regexp != null) {
    const tail = text.slice(startIndex);
    const match = regexp.exec(tail);
    if (match == null) return text;
    const dartMatch = __dartRegExpMatch(match, startIndex);
    return text.slice(0, dartMatch.start) + String(replace(dartMatch)) + text.slice(dartMatch.end);
  }
  const needle = String(pattern);
  return __dartStringReplaceStringMapped(text, needle, replace, false, startIndex);
}
function __dartStringReplaceStringMapped(text, needle, replace, all, startIndex) {
  if (needle === "") return text;
  let result = "";
  let cursor = 0;
  let index = text.indexOf(needle, startIndex);
  let replaced = false;
  while (index >= 0) {
    result += text.slice(cursor, index);
    result += String(replace(__dartStringMatch(text, index, needle)));
    cursor = index + needle.length;
    replaced = true;
    if (!all) break;
    index = text.indexOf(needle, cursor);
  }
  return replaced ? result + text.slice(cursor) : text;
}
function __dartStringSplitMapJoin(source, pattern, onMatch = null, onNonMatch = null) {
  const text = String(source);
  const matchMapper = typeof onMatch === "function" ? onMatch : (match) => match.group(0);
  const nonMatchMapper = typeof onNonMatch === "function" ? onNonMatch : (part) => part;
  const matches = __dartStringPatternMatches(text, pattern);
  if (matches.length === 0) return String(nonMatchMapper(text));
  let result = "";
  let cursor = 0;
  for (const match of matches) {
    result += String(nonMatchMapper(text.slice(cursor, match.start)));
    result += String(matchMapper(match));
    cursor = match.end;
  }
  result += String(nonMatchMapper(text.slice(cursor)));
  return result;
}
function __dartStringPatternMatches(text, pattern) {
  const regexp = __dartPatternRegExp(pattern, true);
  if (regexp != null) {
    const matches = [];
    let match;
    while ((match = regexp.exec(text)) !== null) {
      matches.push(__dartRegExpMatch(match));
      if (match[0] === "") regexp.lastIndex++;
    }
    return matches;
  }
  const needle = String(pattern);
  if (needle === "") return [];
  const matches = [];
  let index = text.indexOf(needle);
  while (index >= 0) {
    matches.push(__dartStringMatch(text, index, needle));
    index = text.indexOf(needle, index + needle.length);
  }
  return matches;
}
function __dartStringAllMatches(pattern, input, start = 0) {
  const text = String(input);
  const needle = String(pattern);
  const matches = [];
  if (needle === "") return matches;
  let index = text.indexOf(needle, start);
  while (index >= 0) {
    matches.push(__dartStringMatch(text, index, needle));
    index = text.indexOf(needle, index + needle.length);
  }
  return matches;
}
function __dartStringMatchAsPrefix(pattern, input, start = 0) {
  const text = String(input);
  const needle = String(pattern);
  return text.startsWith(needle, start) ? __dartStringMatch(text, start, needle) : null;
}
function __dartStringMatch(input, start, value) {
  return {
    input,
    start,
    end: start + value.length,
    get groupCount() { return 0; },
    group(index) { return index === 0 ? value : null; },
    groups(indices) { return Array.from(indices, (index) => this.group(index)); },
    namedGroup() { return null; },
    get groupNames() { return new Set(); },
    0: value,
  };
}
function __dartJsRegExpReplacementMatch(args) {
  const hasNamedGroups = args.length > 0 && args[args.length - 1] != null && typeof args[args.length - 1] === "object";
  const input = args[args.length - (hasNamedGroups ? 2 : 1)];
  const offset = args[args.length - (hasNamedGroups ? 3 : 2)];
  const match = Array.prototype.slice.call(args, 0, args.length - (hasNamedGroups ? 3 : 2));
  match.index = offset;
  match.input = input;
  if (hasNamedGroups) match.groups = args[args.length - 1];
  return __dartRegExpMatch(match);
}
function __dartStringReplaceFirst(source, pattern, replacement, startIndex = 0) {
  const text = String(source);
  const needle = String(pattern);
  const index = text.indexOf(needle, startIndex);
  if (index < 0) return text;
  return text.slice(0, index) + String(replacement) + text.slice(index + needle.length);
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
function __dartRandom(seed = null, secure = false) {
  let state = seed == null ? 0 : Number(seed) >>> 0;
  function nextUint32() {
    if (secure) {
      const crypto = globalThis.crypto || globalThis.msCrypto;
      if (crypto && typeof crypto.getRandomValues === "function") {
        const values = new Uint32Array(1);
        crypto.getRandomValues(values);
        return values[0] >>> 0;
      }
    }
    if (seed == null) {
      return Math.floor(Math.random() * 0x100000000) >>> 0;
    }
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  }
  return {
    nextInt(max) {
      if (!Number.isInteger(max) || max <= 0) throw new RangeError("max must be positive");
      return nextUint32() % max;
    },
    nextDouble() { return nextUint32() / 0x100000000; },
    nextBool() { return (nextUint32() & 1) === 1; },
  };
}
function __dartRegExp(pattern, options = {}) {
  const source = String(pattern);
  const caseSensitive = options.caseSensitive !== false;
  const multiLine = options.multiLine === true;
  const unicode = options.unicode === true;
  const dotAll = options.dotAll === true;
  function make(global = false) {
    let flags = global ? "g" : "";
    if (!caseSensitive) flags += "i";
    if (multiLine) flags += "m";
    if (unicode) flags += "u";
    if (dotAll) flags += "s";
    return new RegExp(source, flags);
  }
  function displayFlags() {
    return (caseSensitive ? "" : "i") + (multiLine ? "m" : "") + (dotAll ? "s" : "") + (unicode ? "u" : "");
  }
  return {
    __dartRegExpMake: make,
    pattern: source,
    isCaseSensitive: caseSensitive,
    isMultiLine: multiLine,
    isUnicode: unicode,
    isDotAll: dotAll,
    hasMatch(input) { return make(false).test(String(input)); },
    firstMatch(input) {
      const text = String(input);
      const match = make(false).exec(text);
      return match == null ? null : __dartRegExpMatch(match, 0, text, this);
    },
    stringMatch(input) {
      const match = this.firstMatch(input);
      return match == null ? null : match.group(0);
    },
    matchAsPrefix(input, start = 0) {
      const sourceText = String(input);
      const text = sourceText.slice(start);
      const match = make(false).exec(text);
      return match == null || match.index !== 0 ? null : __dartRegExpMatch(match, start, sourceText, this);
    },
    allMatches(input, start = 0) {
      const text = String(input);
      const regexp = make(true);
      regexp.lastIndex = start;
      const matches = [];
      let match;
      while ((match = regexp.exec(text)) !== null) {
        matches.push(__dartRegExpMatch(match, 0, text, this));
        if (match[0] === "") regexp.lastIndex++;
      }
      return matches;
    },
    toString() { return "RegExp: pattern=" + source + " flags=" + displayFlags(); },
  };
}
function __dartRegExpMatch(match, offset = 0, input = null, pattern = null) {
  const namedGroups = match.groups ?? {};
  const result = {
    start: offset + match.index,
    end: offset + match.index + match[0].length,
    get input() { return input; },
    get pattern() { return pattern; },
    get groupCount() { return match.length - 1; },
    group(index) { return index >= 0 && index < match.length ? (match[index] ?? null) : null; },
    groups(indices) { return Array.from(indices, (index) => this.group(index)); },
    namedGroup(name) { return Object.prototype.hasOwnProperty.call(namedGroups, name) ? (namedGroups[name] ?? null) : null; },
    get groupNames() { return new Set(Object.keys(namedGroups)); },
  };
  for (let i = 0; i < match.length; i++) {
    result[i] = match[i] ?? null;
  }
  return result;
}
const __dartTypeCache = new Map();
function __dartType(name) {
  if (__dartTypeCache.has(name)) return __dartTypeCache.get(name);
  const value = Object.freeze({
    name,
    toString() { return name; },
  });
  __dartTypeCache.set(name, value);
  return value;
}
function __dartRuntimeType(value) {
  if (value == null) return __dartType("Null");
  if (typeof value === "string") return __dartType("String");
  if (typeof value === "boolean") return __dartType("bool");
  if (typeof value === "bigint") return __dartType("BigInt");
  if (typeof value === "number") return __dartType(Number.isInteger(value) ? "int" : "double");
  if (typeof value.__dartType === "string") return __dartType(value.__dartType);
  if (Array.isArray(value)) return __dartType("List<dynamic>");
  if (value instanceof Set) return __dartType("Set<dynamic>");
  if (value instanceof Map) return __dartType("Map<dynamic, dynamic>");
  const name = value.constructor && value.constructor.name ? value.constructor.name : "Object";
  return __dartType(name);
}
const __dartSymbolCache = new Map();
function __dartSymbol(key, name) {
  if (__dartSymbolCache.has(key)) return __dartSymbolCache.get(key);
  const value = Object.freeze({
    name,
    toString() { return "Symbol(" + JSON.stringify(name) + ")"; },
  });
  __dartSymbolCache.set(key, value);
  return value;
}
function __dartNullCheck(value) {
  if (value == null) {
    throw new TypeError("Null check operator used on a null value");
  }
  return value;
}
function __dartAs(value, test, typeName) {
  if (test(value)) return value;
  throw new TypeError("Type cast failed: expected " + typeName);
}
function __dartFixedList(list) {
  return Object.seal(list);
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
    if (typeName === "RangeError" && actual === "IndexError") return true;
    if (typeName === "ArgumentError" && (actual === "RangeError" || actual === "IndexError")) return true;
    return typeName === "Error" && actual !== "Exception" && actual !== "FormatException";
  }
  if (typeName === "TypeError" && value instanceof TypeError) return true;
  return typeName === "Error" && value instanceof Error;
}
function __dartCheckValueInInterval(value, minValue, maxValue, name = null, message = null) {
  if (value < minValue || value > maxValue) throw __dartCoreError("RangeError", message ?? (String(name ?? "value") + " out of range"));
  return value;
}
function __dartCheckValidIndex(index, indexable, name = null, length = null, message = null) {
  length ??= indexable.length;
  if (index < 0 || index >= length) throw __dartCoreError("RangeError", message ?? (String(name ?? "index") + " out of range"));
  return index;
}
function __dartCheckValidRange(start, end, length, startName = null, endName = null, message = null) {
  if (start < 0 || start > length) throw __dartCoreError("RangeError", message ?? (String(startName ?? "start") + " out of range"));
  if (end == null) return length;
  if (end < start || end > length) throw __dartCoreError("RangeError", message ?? (String(endName ?? "end") + " out of range"));
  return end;
}
function __dartCheckNotNegative(value, name = null, message = null) {
  if (value < 0) throw __dartCoreError("RangeError", message ?? (String(name ?? "index") + " must not be negative"));
  return value;
}
function __dartBind(receiver, name) {
  if (Array.isArray(receiver) && name === "add") {
    return (value) => { receiver.push(value); return null; };
  }
  const value = receiver[name];
  return typeof value === "function" ? value.bind(receiver) : value;
}
function __dartInvocation(kind, name, positionalArguments = [], namedArguments = null) {
  const memberName = name != null && typeof name === "object" && "name" in name ? name : __dartSymbol(name, name);
  const displayName = memberName?.name ?? String(name);
  const named = new Map();
  if (namedArguments instanceof Map) {
    for (const [key, value] of namedArguments) {
      named.set(key, value);
    }
  } else if (namedArguments != null) {
    for (const [key, value] of Object.entries(namedArguments)) {
      named.set(__dartSymbol(key, key), value);
    }
  }
  return Object.freeze({
    memberName,
    positionalArguments: Array.from(positionalArguments),
    namedArguments: named,
    get isMethod() { return kind === "method"; },
    get isGetter() { return kind === "getter"; },
    get isSetter() { return kind === "setter"; },
    get isAccessor() { return kind !== "method"; },
    toString() { return "Invocation(" + kind + " " + displayName + ")"; },
  });
}
function __dartNoSuchMethod(receiver, kind, name, positionalArguments = [], namedArguments = null) {
  const noSuchMethod = receiver?.noSuchMethod;
  if (typeof noSuchMethod === "function") {
    return noSuchMethod.call(receiver, __dartInvocation(kind, name, positionalArguments, namedArguments));
  }
  throw new TypeError("No such method " + String(name));
}
function __dartIndexGet(receiver, index) {
  if (Array.isArray(receiver) || (ArrayBuffer.isView(receiver) && !(receiver instanceof DataView)) || typeof receiver === "string") return receiver[index];
  const op = receiver?.["[]"];
  if (typeof op === "function") return op.call(receiver, index);
  return receiver[index];
}
function __dartIndexSet(receiver, index, value) {
  if (Array.isArray(receiver) || (ArrayBuffer.isView(receiver) && !(receiver instanceof DataView))) { receiver[index] = value; return value; }
  const op = receiver?.["[]="];
  if (typeof op === "function") return op.call(receiver, index, value);
  receiver[index] = value;
  return value;
}
function __dartCall(receiver, name, args, namedArgs = null) {
  const callArgs = namedArgs == null ? args : [...args, namedArgs];
  if (name === "call") {
    if (typeof receiver === "function") return receiver(...callArgs);
    const call = receiver.call;
    if (typeof call === "function") return call.apply(receiver, callArgs);
  }
  if (Array.isArray(receiver)) {
    switch (name) {
      case "[]": return receiver[args[0]];
      case "[]=": receiver[args[0]] = args[1]; return args[1];
      case "add": receiver.push(args[0]); return null;
      case "addAll": receiver.push(...Array.from(args[0])); return null;
      case "clear": receiver.length = 0; return null;
      case "contains": return __dartIterableContains(receiver, args[0]);
      case "elementAt": return receiver[args[0]];
      case "join": return receiver.map(__dartStr).join(args.length === 0 ? "" : args[0]);
      case "remove": { const index = receiver.findIndex(value => __dartEquals(value, args[0])); if (index < 0) return false; receiver.splice(index, 1); return true; }
      case "removeAt": return receiver.splice(args[0], 1)[0];
      case "removeLast": return receiver.pop();
      case "toList": return Array.from(receiver);
      case "toSet": return new Set(receiver);
    }
  }
  if (receiver instanceof Map) {
    switch (name) {
      case "[]": return __dartMapGet(receiver, args[0]);
      case "[]=": return __dartMapSet(receiver, args[0], args[1]);
      case "clear": receiver.clear(); return null;
      case "containsKey": return __dartMapContainsKey(receiver, args[0]);
      case "remove": return __dartMapRemove(receiver, args[0]);
    }
  }
  if (receiver instanceof Set) {
    switch (name) {
      case "add": return __dartSetAdd(receiver, args[0]);
      case "addAll": for (const value of args[0]) __dartSetAdd(receiver, value); return null;
      case "clear": receiver.clear(); return null;
      case "contains": return __dartIterableContains(receiver, args[0]);
      case "remove": return __dartSetRemove(receiver, args[0]);
      case "toList": return Array.from(receiver);
      case "toSet": return new Set(receiver);
    }
  }
  if (typeof receiver === "string") {
    switch (name) {
      case "contains": return receiver.includes(args[0], args.length > 1 ? args[1] : 0);
      case "endsWith": return receiver.endsWith(args[0]);
      case "indexOf": return receiver.indexOf(args[0], args.length > 1 ? args[1] : 0);
      case "lastIndexOf": return args.length > 1 ? receiver.lastIndexOf(args[0], args[1]) : receiver.lastIndexOf(args[0]);
      case "split": return receiver.split(args[0]);
      case "startsWith": return receiver.startsWith(args[0], args.length > 1 ? args[1] : 0);
      case "substring": return receiver.substring(args[0], args.length > 1 ? args[1] : undefined);
      case "toLowerCase": return receiver.toLowerCase();
      case "toUpperCase": return receiver.toUpperCase();
      case "trim": return receiver.trim();
    }
  }
  const method = receiver[name];
  if (typeof method === "function") return method.apply(receiver, callArgs);
  return __dartNoSuchMethod(receiver, "method", name, args, namedArgs);
}
function __dartCompare(left, right, compare = null) {
  if (typeof compare === "function") return Number(compare(left, right));
  const compareTo = left?.compareTo;
  if (typeof compareTo === "function") return Number(compareTo.call(left, right));
  return left < right ? -1 : (left > right ? 1 : 0);
}
function __dartSplayTreeSet(compare = null, isValidKey = null) {
  const set = new Set();
  Object.defineProperty(set, "__dartSplayCompare", { value: compare });
  Object.defineProperty(set, "__dartSplayIsValidKey", { value: isValidKey });
  return set;
}
function __dartSplaySortSet(set) {
  const values = Array.from(set).sort((left, right) => __dartCompare(left, right, set.__dartSplayCompare));
  set.clear();
  for (const value of values) set.add(value);
}
function __dartSplaySortMap(map) {
  const entries = Array.from(map).sort(([left], [right]) => __dartCompare(left, right, map.__dartSplayCompare));
  map.clear();
  for (const [key, value] of entries) map.set(key, value);
}
function __dartSetAdd(set, value) {
  if (set.__dartIdentitySet) {
    if (set.has(value)) return false;
    set.add(value);
    return true;
  }
  if (set.__dartSplayCompare !== undefined) {
    for (const candidate of set) {
      if (__dartCompare(candidate, value, set.__dartSplayCompare) === 0) return false;
    }
    set.add(value);
    __dartSplaySortSet(set);
    return true;
  }
  if (__dartIterableContains(set, value)) return false;
  set.add(value);
  return true;
}
function __dartIdentitySet() {
  const set = new Set();
  Object.defineProperty(set, "__dartIdentitySet", { value: true });
  return set;
}
function __dartSetAddAll(set, values) {
  for (const value of values) __dartSetAdd(set, value);
  return null;
}
function __dartSetFrom(values) {
  const set = new Set();
  for (const value of values) __dartSetAdd(set, value);
  return set;
}
function __dartSetDifference(set, other) {
  const result = new Set();
  if (set.__dartIdentitySet) Object.defineProperty(result, "__dartIdentitySet", { value: true });
  if (set.__dartSplayCompare !== undefined) Object.defineProperty(result, "__dartSplayCompare", { value: set.__dartSplayCompare });
  if (set.__dartSplayIsValidKey !== undefined) Object.defineProperty(result, "__dartSplayIsValidKey", { value: set.__dartSplayIsValidKey });
  for (const value of set) {
    if (!__dartIterableContains(other, value)) result.add(value);
  }
  return result;
}
function __dartSetIntersection(set, other) {
  const result = new Set();
  if (set.__dartIdentitySet) Object.defineProperty(result, "__dartIdentitySet", { value: true });
  if (set.__dartSplayCompare !== undefined) Object.defineProperty(result, "__dartSplayCompare", { value: set.__dartSplayCompare });
  if (set.__dartSplayIsValidKey !== undefined) Object.defineProperty(result, "__dartSplayIsValidKey", { value: set.__dartSplayIsValidKey });
  for (const value of set) {
    if (__dartIterableContains(other, value)) result.add(value);
  }
  return result;
}
function __dartSetUnion(set, other) {
  const result = new Set(set);
  if (set.__dartIdentitySet) Object.defineProperty(result, "__dartIdentitySet", { value: true });
  if (set.__dartSplayCompare !== undefined) Object.defineProperty(result, "__dartSplayCompare", { value: set.__dartSplayCompare });
  if (set.__dartSplayIsValidKey !== undefined) Object.defineProperty(result, "__dartSplayIsValidKey", { value: set.__dartSplayIsValidKey });
  for (const value of other) __dartSetAdd(result, value);
  return result;
}
function __dartSetRemove(set, needle) {
  if (set.__dartIdentitySet) {
    const found = set.has(needle);
    set.delete(needle);
    return found;
  }
  for (const value of set) {
    if (set.__dartSplayCompare !== undefined && __dartCompare(value, needle, set.__dartSplayCompare) === 0) {
      set.delete(value);
      return true;
    }
    if (__dartEquals(value, needle)) {
      set.delete(value);
      return true;
    }
  }
  return false;
}
function __dartSetRemoveWhere(set, test) {
  for (const value of Array.from(set)) {
    if (test(value)) set.delete(value);
  }
  return null;
}
function __dartSetRetainWhere(set, test) {
  for (const value of Array.from(set)) {
    if (!test(value)) set.delete(value);
  }
  return null;
}
function __dartCustomHashMap(equals = null, hashCode = null, isValidKey = null) {
  const map = new Map();
  Object.defineProperty(map, "__dartMapEquals", { value: equals });
  Object.defineProperty(map, "__dartMapHashCode", { value: hashCode });
  Object.defineProperty(map, "__dartMapIsValidKey", { value: isValidKey });
  return map;
}
const __dartMapMissingKey = Symbol("dart.mapMissingKey");
function __dartMapKey(map, key) {
  if (map.__dartIdentityMap) return map.has(key) ? key : __dartMapMissingKey;
  if (map.__dartMapEquals != null) {
    if (map.__dartMapIsValidKey != null && !map.__dartMapIsValidKey(key)) return __dartMapMissingKey;
    for (const candidate of map.keys()) {
      if (map.__dartMapEquals(candidate, key)) return candidate;
    }
    return __dartMapMissingKey;
  }
  if (map.__dartSplayCompare !== undefined) {
    for (const candidate of map.keys()) {
      if (__dartCompare(candidate, key, map.__dartSplayCompare) === 0) return candidate;
    }
    return __dartMapMissingKey;
  }
  for (const candidate of map.keys()) {
    if (__dartEquals(candidate, key)) return candidate;
  }
  return __dartMapMissingKey;
}
function __dartMapContainsKey(map, key) {
  return __dartMapKey(map, key) !== __dartMapMissingKey;
}
function __dartMapGet(map, key) {
  const actualKey = __dartMapKey(map, key);
  return actualKey === __dartMapMissingKey ? null : map.get(actualKey);
}
function __dartMapBaseKeys(map) {
  const keys = map.keys;
  return typeof keys === "function" ? keys.call(map) : keys;
}
function __dartMapBaseValue(map, key) {
  if (map instanceof Map) return __dartMapGet(map, key);
  if (map != null && typeof map["[]"] === "function") return map["[]"](key);
  if (map != null && typeof map.get === "function") return map.get(key);
  return map == null ? null : map[key];
}
function __dartMapBaseValues(map) {
  return Array.from(__dartMapBaseKeys(map), (key) => __dartMapBaseValue(map, key));
}
function __dartMapSet(map, key, value) {
  const actualKey = __dartMapKey(map, key);
  map.set(actualKey === __dartMapMissingKey ? key : actualKey, value);
  if (map.__dartSplayCompare !== undefined) __dartSplaySortMap(map);
  return value;
}
function __dartMapAddAll(map, entries) {
  for (const [key, value] of entries) __dartMapSet(map, key, value);
  return null;
}
function __dartMapAddEntries(map, entries) {
  for (const entry of entries) __dartMapSet(map, entry.key, entry.value);
  return null;
}
function __dartMapMap(map, convert) {
  const result = new Map();
  for (const [key, value] of map) {
    const entry = convert(key, value);
    __dartMapSet(result, entry.key, entry.value);
  }
  return result;
}
function __dartMapRemove(map, key) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey === __dartMapMissingKey) return null;
  const value = map.get(actualKey);
  map.delete(actualKey);
  return value;
}
function __dartMapRemoveWhere(map, test) {
  for (const [key, value] of Array.from(map)) {
    if (test(key, value)) map.delete(key);
  }
  return null;
}
function __dartMapContainsValue(map, needle) {
  for (const value of map.values()) {
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
function __dartMapFromEntries(entries) {
  const map = new Map();
  for (const [key, value] of entries) {
    __dartMapSet(map, key, value);
  }
  return map;
}
function __dartMapPutIfAbsent(map, key, ifAbsent) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey !== __dartMapMissingKey) return map.get(actualKey);
  const value = ifAbsent();
  __dartMapSet(map, key, value);
  return value;
}
function __dartMapUpdate(map, key, update, ifAbsent = null) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey !== __dartMapMissingKey) {
    const value = update(map.get(actualKey));
    __dartMapSet(map, actualKey, value);
    return value;
  }
  if (typeof ifAbsent === "function") {
    const value = ifAbsent();
    __dartMapSet(map, key, value);
    return value;
  }
  throw new Error("Key not in map");
}
function __dartMapUpdateAll(map, update) {
  for (const [key, value] of Array.from(map)) {
    map.set(key, update(key, value));
  }
  return null;
}
function __dartUnmodifiableListView(source) {
  const list = Array.isArray(source) ? source : Array.from(source);
  const readonly = new Set(["copyWithin", "fill", "pop", "push", "reverse", "shift", "sort", "splice", "unshift"]);
  return new Proxy(list, {
    get(target, property, receiver) {
      if (readonly.has(property)) return () => { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable list"); };
      return Reflect.get(target, property, receiver);
    },
    set() { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable list"); },
    deleteProperty() { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable list"); },
    defineProperty() { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable list"); },
  });
}
function __dartUnmodifiableMapView(source) {
  const map = source instanceof Map ? source : new Map(source);
  const readonly = new Set(["set", "delete", "clear"]);
  return new Proxy(map, {
    get(target, property) {
      if (readonly.has(property)) return () => { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable map"); };
      const descriptor = Reflect.getOwnPropertyDescriptor(target, property);
      if (descriptor != null && "value" in descriptor) return descriptor.value;
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
    set() { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable map"); },
    deleteProperty() { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable map"); },
    defineProperty() { throw new TypeError("Unsupported operation: Cannot modify an unmodifiable map"); },
  });
}
function __dartListSort(list, compare = null) {
  if (typeof compare === "function") {
    list.sort((left, right) => compare(left, right));
  } else {
    list.sort((left, right) => left < right ? -1 : (left > right ? 1 : 0));
  }
  return null;
}
function __dartListShuffle(list, random = null) {
  for (let index = list.length - 1; index > 0; index--) {
    const selected = random == null ? Math.floor(Math.random() * (index + 1)) : random.nextInt(index + 1);
    const value = list[index];
    list[index] = list[selected];
    list[selected] = value;
  }
  return null;
}
function __dartListRemove(list, needle) {
  const index = list.findIndex((value) => __dartEquals(value, needle));
  if (index < 0) return false;
  list.splice(index, 1);
  return true;
}
function __dartListIndexOf(list, needle, start = 0) {
  const begin = Math.max(0, Math.trunc(start));
  for (let index = begin; index < list.length; index++) {
    if (__dartEquals(__dartIndexGet(list, index), needle)) return index;
  }
  return -1;
}
function __dartListLastIndexOf(list, needle, start = null) {
  let index = start == null ? list.length - 1 : Math.trunc(start);
  if (index >= list.length) index = list.length - 1;
  for (; index >= 0; index--) {
    if (__dartEquals(__dartIndexGet(list, index), needle)) return index;
  }
  return -1;
}
function __dartListSetAll(list, index, values) {
  let offset = 0;
  for (const value of values) {
    __dartIndexSet(list, index + offset, value);
    offset++;
  }
  return null;
}
function __dartListLastIndexWhere(list, test, start = null) {
  for (let index = start == null ? list.length - 1 : start; index >= 0; index--) {
    if (test(__dartIndexGet(list, index))) return index;
  }
  return -1;
}
function __dartListRemoveWhere(list, test) {
  list.splice(0, list.length, ...list.filter((value) => !test(value)));
  return null;
}
function __dartListRetainWhere(list, test) {
  list.splice(0, list.length, ...list.filter((value) => test(value)));
  return null;
}
function __dartListAsMap(list) {
  return new (class extends Map {
    get size() { return list.length; }
    get(key) { return Number.isInteger(key) && key >= 0 && key < list.length ? __dartIndexGet(list, key) : undefined; }
    has(key) { return Number.isInteger(key) && key >= 0 && key < list.length; }
    entries() { return Array.from({ length: list.length }, (_, index) => [index, __dartIndexGet(list, index)])[Symbol.iterator](); }
    keys() { return Array.from({ length: list.length }, (_, index) => index)[Symbol.iterator](); }
    values() { return Array.from({ length: list.length }, (_, index) => __dartIndexGet(list, index))[Symbol.iterator](); }
    [Symbol.iterator]() { return this.entries(); }
    forEach(callback, thisArg = undefined) {
      for (let index = 0; index < list.length; index++) {
        callback.call(thisArg, list[index], index, this);
      }
    }
    set() { throw new TypeError("Unsupported operation: Cannot modify unmodifiable map"); }
    delete() { throw new TypeError("Unsupported operation: Cannot modify unmodifiable map"); }
    clear() { throw new TypeError("Unsupported operation: Cannot modify unmodifiable map"); }
  })();
}
function __dartIterableContains(iterable, needle) {
  if (iterable instanceof Set && iterable.__dartIdentitySet) return iterable.has(needle);
  for (const value of iterable) {
    if (iterable instanceof Set && iterable.__dartSplayCompare !== undefined && __dartCompare(value, needle, iterable.__dartSplayCompare) === 0) return true;
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
function __dartIterableIsEmpty(iterable) {
  if (typeof iterable.length === "number") return iterable.length === 0;
  if (typeof iterable.size === "number") return iterable.size === 0;
  for (const _ of iterable) return false;
  return true;
}
function __dartIterableLength(iterable) {
  if (typeof iterable.length === "number") return iterable.length;
  if (typeof iterable.size === "number") return iterable.size;
  let count = 0;
  for (const _ of iterable) count++;
  return count;
}
function __dartIterableTakeWhile(iterable, test) {
  const result = [];
  for (const value of iterable) {
    if (!test(value)) break;
    result.push(value);
  }
  return result;
}
function __dartIterableSkipWhile(iterable, test) {
  const result = [];
  let skipping = true;
  for (const value of iterable) {
    if (skipping && test(value)) continue;
    skipping = false;
    result.push(value);
  }
  return result;
}
function __dartSetLookup(set, needle) {
  if (set.__dartIdentitySet) return set.has(needle) ? needle : null;
  for (const value of set) {
    if (set.__dartSplayCompare !== undefined && __dartCompare(value, needle, set.__dartSplayCompare) === 0) return value;
    if (__dartEquals(value, needle)) return value;
  }
  return null;
}
function __dartSetContainsAll(set, values) {
  for (const value of values) {
    if (!__dartIterableContains(set, value)) return false;
  }
  return true;
}
function __dartSetRemoveAll(set, values) {
  if (set.__dartIdentitySet) {
    for (const value of values) set.delete(value);
    return null;
  }
  for (const value of values) {
    for (const candidate of Array.from(set)) {
      if (set.__dartSplayCompare !== undefined && __dartCompare(candidate, value, set.__dartSplayCompare) === 0) {
        set.delete(candidate);
        break;
      }
      if (__dartEquals(candidate, value)) {
        set.delete(candidate);
        break;
      }
    }
  }
  return null;
}
function __dartSetRetainAll(set, values) {
  const retained = Array.from(values);
  for (const value of Array.from(set)) {
    const index = set.__dartIdentitySet ? retained.indexOf(value) : retained.findIndex((needle) => set.__dartSplayCompare !== undefined ? __dartCompare(value, needle, set.__dartSplayCompare) === 0 : __dartEquals(value, needle));
    if (index < 0) set.delete(value);
  }
  return null;
}
function __dartIterableJoin(iterable, separator = "") {
  if (iterable != null && typeof iterable["[]"] === "function" && typeof iterable.length === "number") {
    const values = [];
    for (let index = 0; index < iterable.length; index++) values.push(__dartStr(iterable["[]"](index)));
    return values.join(String(separator));
  }
  return Array.from(iterable, (value) => __dartStr(value)).join(String(separator));
}
function __dartIterableFirst(iterable) {
  for (const value of iterable) return value;
  throw new RangeError("No element");
}
function __dartIterableLast(iterable) {
  let found = false;
  let last;
  for (const value of iterable) {
    found = true;
    last = value;
  }
  if (!found) throw new RangeError("No element");
  return last;
}
function __dartIterableSingle(iterable) {
  let found = false;
  let single;
  for (const value of iterable) {
    if (found) throw new Error("Bad state: Too many elements");
    found = true;
    single = value;
  }
  if (!found) throw new RangeError("No element");
  return single;
}
function __dartIterableNoElement(orElse) {
  if (typeof orElse === "function") return orElse();
  throw new Error("Bad state: No element");
}
function __dartIterableFirstWhere(iterable, test, orElse = null) {
  for (const value of iterable) {
    if (test(value)) return value;
  }
  return __dartIterableNoElement(orElse);
}
function __dartIterableLastWhere(iterable, test, orElse = null) {
  let found = false;
  let last;
  for (const value of iterable) {
    if (test(value)) { found = true; last = value; }
  }
  return found ? last : __dartIterableNoElement(orElse);
}
function __dartIterableSingleWhere(iterable, test, orElse = null) {
  let found = false;
  let single;
  for (const value of iterable) {
    if (!test(value)) continue;
    if (found) throw new Error("Bad state: Too many elements");
    found = true;
    single = value;
  }
  return found ? single : __dartIterableNoElement(orElse);
}
function __dartListSetRange(target, start, end, source, skipCount = 0) {
  const values = [];
  const count = end - start;
  for (let index = 0; index < count; index++) values.push(__dartIndexGet(source, skipCount + index));
  for (let index = 0; index < values.length; index++) {
    __dartIndexSet(target, start + index, values[index]);
  }
  return null;
}
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
  if ((typeof left === "number" || left.__dartType === "double") && (typeof right === "number" || right.__dartType === "double")) return Number(left) === Number(right);
  if (__dartIsRecord(left) && __dartIsRecord(right)) {
    const leftShape = left[__dartRecordShape];
    const rightShape = right[__dartRecordShape];
    if (leftShape.length !== rightShape.length) return false;
    for (let i = 0; i < leftShape.length; i++) {
      const name = leftShape[i];
      if (name !== rightShape[i]) return false;
      if (!__dartEquals(left[name], right[name])) return false;
    }
    return true;
  }
  const equals = left["=="];
  return typeof equals === "function" ? equals.call(left, right) : false;
}
const __dartIdentityHashes = new WeakMap();
let __dartNextIdentityHash = 1;
function __dartCombineHash(hash, value) {
  hash = (((hash + value) & 0x1fffffff) + (((hash & 0x0007ffff) << 10) & 0x1fffffff)) & 0x1fffffff;
  return hash ^ (hash >> 6);
}
function __dartFinishHash(hash) {
  hash = (((hash + (((hash & 0x03ffffff) << 3) & 0x1fffffff)) & 0x1fffffff) ^ (hash >> 11));
  return (hash + (((hash & 0x00003fff) << 15) & 0x1fffffff)) & 0x1fffffff;
}
function __dartHashValue(value) {
  if (value == null) return 0;
  if (typeof value === "boolean") return value ? 1231 : 1237;
  if (typeof value === "number") return Number.isFinite(value) ? Math.trunc(value) & 0x1fffffff : 0;
  if (typeof value === "string") {
    let hash = 0;
    for (let i = 0; i < value.length; i++) hash = __dartCombineHash(hash, value.charCodeAt(i));
    return __dartFinishHash(hash);
  }
  if (typeof value === "bigint") return Number(value & 0x1fffffffn);
  if (!__dartIdentityHashes.has(value)) {
    __dartIdentityHashes.set(value, __dartNextIdentityHash);
    __dartNextIdentityHash = (__dartNextIdentityHash + 1) & 0x1fffffff || 1;
  }
  return __dartIdentityHashes.get(value);
}
function __dartObjectHash(values) {
  let hash = 0;
  for (const value of values) hash = __dartCombineHash(hash, __dartHashValue(value));
  return __dartFinishHash(hash);
}
function __dartObjectHashUnordered(values) {
  let sum = 0;
  let xor = 0;
  let count = 0;
  for (const value of values) {
    const hash = __dartHashValue(value);
    sum = (sum + hash) & 0x1fffffff;
    xor ^= hash;
    count++;
  }
  return __dartObjectHash([sum, xor, count]);
}
function __dartTruncDiv(left, right) {
  return Math.trunc(left / right);
}
function __dartShr(left, right) {
  return Math.floor(left / (2 ** right));
}
function __dartRecord(positional, named) {
  const record = {};
  const shape = [];
  for (let i = 0; i < positional.length; i++) {
    const name = "$" + (i + 1);
    shape.push(name);
    Object.defineProperty(record, name, { value: positional[i], enumerable: true });
  }
  for (const name of Object.keys(named).sort()) {
    shape.push(name);
    Object.defineProperty(record, name, { value: named[name], enumerable: true });
  }
  Object.defineProperty(record, __dartRecordShape, { value: Object.freeze(shape) });
  Object.defineProperty(record, "toString", {
    value() {
      return "(" + shape.map((name) => {
        const value = String(record[name]);
        return name.startsWith("$") ? value : name + ": " + value;
      }).join(", ") + ")";
    },
  });
  return Object.freeze(record);
}
const __dartConstValues = new Map();
function __dartConst(key, create) {
  if (!__dartConstValues.has(key)) {
    __dartConstValues.set(key, create());
  }
  return __dartConstValues.get(key);
}
function __dartConstMap(entries) {
  const map = new Map();
  for (const [key, value] of entries) __dartMapSet(map, key, value);
  const throwConst = () => { throw new TypeError("Cannot modify const Map"); };
  Object.defineProperty(map, "set", { value: throwConst });
  Object.defineProperty(map, "delete", { value: throwConst });
  Object.defineProperty(map, "clear", { value: throwConst });
  return Object.freeze(map);
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
function __dartIterator(iterable) {
  const values = (iterable != null && typeof iterable["[]"] === "function" && typeof iterable.length === "number") ? { length: iterable.length, get(index) { return iterable["[]"](index); } } : Array.from(iterable);
  let index = -1;
  return {
    current: undefined,
    moveNext() {
      index++;
      if (index < values.length) {
        this.current = typeof values.get === "function" ? values.get(index) : values[index];
        return true;
      }
      this.current = undefined;
      return false;
    },
  };
}

// Generated by dart2esm.

const $Equality_interface = Symbol("Equality");
const $Event_interface = Symbol("Event");
const $FileSpan_interface = Symbol("FileSpan");
const $GlyphSet_interface = Symbol("GlyphSet");
const $LineScanner_interface = Symbol("LineScanner");
const $LineScannerState_interface = Symbol("LineScannerState");
const $NonGrowableListMixin_interface = Symbol("NonGrowableListMixin");
const $PriorityQueue_interface = Symbol("PriorityQueue");
const $SourceLocation_interface = Symbol("SourceLocation");
const $SourceSpan_interface = Symbol("SourceSpan");
const $SourceSpanWithContext_interface = Symbol("SourceSpanWithContext");
const $SpanScanner_interface = Symbol("SpanScanner");
const $Token_interface = Symbol("Token");
const $UnmodifiableMapMixin_interface = Symbol("UnmodifiableMapMixin");
const $UnmodifiableSetMixin_interface = Symbol("UnmodifiableSetMixin");
const $UnmodifiableSetView_interface = Symbol("UnmodifiableSetView");
const $YamlList_interface = Symbol("YamlList");
const $YamlMap_interface = Symbol("YamlMap");

class _DelegatingIterableBase {
  constructor() {
  }
  get _base() {
    throw new TypeError("Abstract member _DelegatingIterableBase._base");
  }
  set _base(value) {
    Object.defineProperty(this, "_base", { value, writable: true, configurable: true, enumerable: true });
  }
  any(test) {
    return Array.from(this._base).some(test);
  }
  cast() {
    return Array.from(this._base, (value) => __dartAs(value, (value) => true, "TypeParameterType(_DelegatingIterableBase.cast.T%)"));
  }
  contains(element) {
    return __dartIterableContains(this._base, element);
  }
  elementAt(index) {
    return Array.from(this._base)[index];
  }
  every(test) {
    return Array.from(this._base).every(test);
  }
  expand(f) {
    return Array.from(this._base).flatMap((value) => Array.from((f)(value)));
  }
  get first() {
    return __dartIterableFirst(this._base);
  }
  firstWhere(test, { orElse = null } = {}) {
    return __dartIterableFirstWhere(this._base, test, orElse);
  }
  fold(initialValue, combine) {
    return Array.from(this._base).reduce((previous, value) => (combine)(previous, value), initialValue);
  }
  followedBy(other) {
    return [...Array.from(this._base), ...Array.from(other)];
  }
  forEach(f) {
    return (Array.from(this._base).forEach(f), null);
  }
  get isEmpty() {
    return __dartIterableIsEmpty(this._base);
  }
  get isNotEmpty() {
    return !__dartIterableIsEmpty(this._base);
  }
  get iterator() {
    return __dartIterator(this._base);
  }
  join(separator_1 = "") {
    return __dartIterableJoin(this._base, separator_1);
  }
  get last() {
    return __dartIterableLast(this._base);
  }
  lastWhere(test, { orElse = null } = {}) {
    return __dartIterableLastWhere(this._base, test, orElse);
  }
  get length() {
    return __dartIterableLength(this._base);
  }
  map(f) {
    return Array.from(this._base, f);
  }
  reduce(combine) {
    return Array.from(this._base).reduce((previous, value) => (combine)(previous, value));
  }
  retype() {
    return this.cast();
  }
  get single() {
    return __dartIterableSingle(this._base);
  }
  singleWhere(test, { orElse = null } = {}) {
    return __dartIterableSingleWhere(this._base, test, orElse);
  }
  skip(n) {
    return Array.from(this._base).slice(n);
  }
  skipWhile(test) {
    return __dartIterableSkipWhile(this._base, test);
  }
  take(n) {
    return Array.from(this._base).slice(0, n);
  }
  takeWhile(test) {
    return __dartIterableTakeWhile(this._base, test);
  }
  toList({ growable = true } = {}) {
    return (growable ? Array.from(this._base) : __dartFixedList(Array.from(this._base)));
  }
  toSet() {
    return __dartSetFrom(this._base);
  }
  where(test) {
    return Array.from(this._base).filter(test);
  }
  whereType() {
    return Array.from(this._base).filter((value) => true);
  }
  toString() {
    return __dartStr(this._base);
  }
}

class DelegatingIterable extends _DelegatingIterableBase {
  constructor(base) {
    super();
    this._base = base;
  }
  static typed(base) {
    return Array.from(base, (value) => __dartAs(value, (value) => true, "TypeParameterType(DelegatingIterable.typed.E%)"));
  }
}

class DelegatingList extends _DelegatingIterableBase {
  constructor(base) {
    super();
    this._base = base;
  }
  static typed(base) {
    return Array.from(base, (value) => __dartAs(value, (value) => true, "TypeParameterType(DelegatingList.typed.E%)"));
  }
  "[]"(index) {
    return __dartIndexGet(this._base, index);
  }
  "[]="(index, value) {
    __dartIndexSet(this._base, index, value);
  }
  "+"(other) {
    return (this._base + other);
  }
  add(value) {
    (this._base.push(value), null);
  }
  addAll(iterable) {
    (this._base.push(...Array.from(iterable)), null);
  }
  asMap() {
    return __dartListAsMap(this._base);
  }
  cast() {
    return Array.from(this._base, (value) => __dartAs(value, (value) => true, "TypeParameterType(DelegatingList.cast.T%)"));
  }
  clear() {
    (this._base.length = 0, null);
  }
  fillRange(start, end, fillValue = null) {
    (this._base.fill(fillValue, start, end), null);
  }
  set first(value) {
    if (this.isEmpty) {
      (() => { throw __dartCoreError("IndexError", 0); })();
    }
    this["[]="](0, value);
  }
  getRange(start, end) {
    return this._base.slice(start, end);
  }
  indexOf(element, start = 0) {
    return __dartListIndexOf(this._base, element, start);
  }
  indexWhere(test, start = 0) {
    return this._base.findIndex((value, index) => index >= start && (test)(value));
  }
  insert(index, element) {
    (this._base.splice(index, 0, element), null);
  }
  insertAll(index, iterable) {
    (this._base.splice(index, 0, ...Array.from(iterable)), null);
  }
  set last(value) {
    if (this.isEmpty) {
      (() => { throw __dartCoreError("IndexError", 0); })();
    }
    this["[]="]((this.length - 1), value);
  }
  lastIndexOf(element, start = null) {
    return __dartListLastIndexOf(this._base, element, start);
  }
  lastIndexWhere(test, start = null) {
    return __dartListLastIndexWhere(this._base, test, start);
  }
  set length(newLength) {
    this._base.length = newLength;
  }
  remove(value) {
    return __dartListRemove(this._base, value);
  }
  removeAt(index) {
    return this._base.splice(index, 1)[0];
  }
  removeLast() {
    return this._base.pop();
  }
  removeRange(start, end) {
    (this._base.splice(start, end - start), null);
  }
  removeWhere(test) {
    __dartListRemoveWhere(this._base, test);
  }
  replaceRange(start, end, iterable) {
    (this._base.splice(start, end - start, ...Array.from(iterable)), null);
  }
  retainWhere(test) {
    __dartListRetainWhere(this._base, test);
  }
  retype() {
    return this.cast();
  }
  get reversed() {
    return Array.from(this._base).reverse();
  }
  setAll(index, iterable) {
    __dartListSetAll(this._base, index, iterable);
  }
  setRange(start, end, iterable, skipCount = 0) {
    __dartListSetRange(this._base, start, end, iterable, skipCount);
  }
  shuffle(random = null) {
    __dartListShuffle(this._base, random);
  }
  sort(compare = null) {
    __dartListSort(this._base, compare);
  }
  sublist(start, end = null) {
    return this._base.slice(start, end);
  }
  get first() { return super.first; }
  get last() { return super.last; }
  get length() { return super.length; }
}

class DelegatingSet extends _DelegatingIterableBase {
  constructor(base) {
    super();
    this._base = base;
  }
  static typed(base) {
    return new Set(Array.from(base, (value) => __dartAs(value, (value) => true, "TypeParameterType(DelegatingSet.typed.E%)")));
  }
  add(value) {
    return __dartSetAdd(this._base, value);
  }
  addAll(elements) {
    __dartSetAddAll(this._base, elements);
  }
  cast() {
    return new Set(Array.from(this._base, (value) => __dartAs(value, (value) => true, "TypeParameterType(DelegatingSet.cast.T%)")));
  }
  clear() {
    this._base.clear();
  }
  containsAll(other) {
    return __dartSetContainsAll(this._base, other);
  }
  difference(other) {
    return __dartSetDifference(this._base, other);
  }
  intersection(other) {
    return __dartSetIntersection(this._base, other);
  }
  lookup(element) {
    return __dartSetLookup(this._base, element);
  }
  remove(value) {
    return __dartSetRemove(this._base, value);
  }
  removeAll(elements) {
    __dartSetRemoveAll(this._base, elements);
  }
  removeWhere(test) {
    __dartSetRemoveWhere(this._base, test);
  }
  retainAll(elements) {
    __dartSetRetainAll(this._base, elements);
  }
  retype() {
    return this.cast();
  }
  retainWhere(test) {
    __dartSetRetainWhere(this._base, test);
  }
  union(other) {
    return __dartSetUnion(this._base, other);
  }
  toSet() {
    return new DelegatingSet(__dartSetFrom(this._base));
  }
}

class DelegatingQueue extends _DelegatingIterableBase {
  constructor(queue) {
    super();
    this._base = queue;
  }
  static typed(base) {
    return Array.from(base, (value) => __dartAs(value, (value) => true, "TypeParameterType(DelegatingQueue.typed.E%)"));
  }
  add(value) {
    (this._base.push(value), null);
  }
  addAll(iterable) {
    (this._base.push(...Array.from(iterable)), null);
  }
  addFirst(value) {
    (this._base.unshift(value), null);
  }
  addLast(value) {
    (this._base.push(value), null);
  }
  cast() {
    return Array.from(this._base, (value) => __dartAs(value, (value) => true, "TypeParameterType(DelegatingQueue.cast.T%)"));
  }
  clear() {
    (this._base.length = 0, null);
  }
  remove(object) {
    return __dartListRemove(this._base, object);
  }
  removeWhere(test) {
    __dartListRemoveWhere(this._base, test);
  }
  retainWhere(test) {
    __dartListRetainWhere(this._base, test);
  }
  retype() {
    return this.cast();
  }
  removeFirst() {
    return this._base.shift();
  }
  removeLast() {
    return this._base.pop();
  }
}

class DelegatingMap {
  constructor(base) {
    this._base = base;
  }
  static typed(base) {
    return new Map(Array.from(base, ([key, value]) => [__dartAs(key, (key) => true, "TypeParameterType(DelegatingMap.typed.K%)"), __dartAs(value, (value) => true, "TypeParameterType(DelegatingMap.typed.V%)")]));
  }
  "[]"(key) {
    return __dartMapGet(this._base, key);
  }
  "[]="(key, value) {
    __dartMapSet(this._base, key, value);
  }
  addAll(other) {
    __dartMapAddAll(this._base, other);
  }
  addEntries(entries) {
    __dartMapAddEntries(this._base, entries);
  }
  clear() {
    (this._base.clear(), null);
  }
  cast() {
    return new Map(Array.from(this._base, ([key, value]) => [__dartAs(key, (key) => true, "TypeParameterType(DelegatingMap.cast.K2%)"), __dartAs(value, (value) => true, "TypeParameterType(DelegatingMap.cast.V2%)")]));
  }
  containsKey(key) {
    return __dartMapContainsKey(this._base, key);
  }
  containsValue(value) {
    return __dartMapContainsValue(this._base, value);
  }
  get entries() {
    return Array.from(this._base, ([key, value]) => ({ key, value }));
  }
  forEach(f) {
    (this._base.forEach((value, key) => (f)(key, value)), null);
  }
  get isEmpty() {
    return this._base.size === 0;
  }
  get isNotEmpty() {
    return this._base.size !== 0;
  }
  get keys() {
    return Array.from(this._base.keys());
  }
  get length() {
    return this._base.size;
  }
  map(transform) {
    return __dartMapMap(this._base, transform);
  }
  putIfAbsent(key, ifAbsent) {
    return __dartMapPutIfAbsent(this._base, key, ifAbsent);
  }
  remove(key) {
    return __dartMapRemove(this._base, key);
  }
  removeWhere(test) {
    return __dartMapRemoveWhere(this._base, test);
  }
  retype() {
    return this.cast();
  }
  get values() {
    return Array.from(this._base.values());
  }
  toString() {
    return __dartObjectToString(this._base);
  }
  update(key, update, { ifAbsent = null } = {}) {
    return __dartMapUpdate(this._base, key, update, ifAbsent);
  }
  updateAll(update) {
    return __dartMapUpdateAll(this._base, update);
  }
}

class UnmodifiableSetMixin {
  constructor() {
    Object.defineProperty(this, $UnmodifiableSetMixin_interface, { value: true });
  }
  static _throw() {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot modify an unmodifiable Set"); })();
  }
  add(value) {
    return UnmodifiableSetMixin._throw();
  }
  addAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  remove(value) {
    return UnmodifiableSetMixin._throw();
  }
  removeAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  retainAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  removeWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  retainWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  clear() {
    return UnmodifiableSetMixin._throw();
  }
}
Object.defineProperty(UnmodifiableSetMixin, Symbol.hasInstance, { value(value) { return value != null && value[$UnmodifiableSetMixin_interface] === true; } });

class _MapKeySet__DelegatingIterableBase_UnmodifiableSetMixin extends _DelegatingIterableBase {
  constructor() {
    super();
    Object.defineProperty(this, $UnmodifiableSetMixin_interface, { value: true });
  }
  cast() {
    throw new TypeError("Abstract member _MapKeySet&_DelegatingIterableBase&UnmodifiableSetMixin.cast");
  }
  add(value) {
    return UnmodifiableSetMixin._throw();
  }
  addAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  remove(value) {
    return UnmodifiableSetMixin._throw();
  }
  removeAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  retainAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  removeWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  retainWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  clear() {
    return UnmodifiableSetMixin._throw();
  }
}

class MapKeySet extends _MapKeySet__DelegatingIterableBase_UnmodifiableSetMixin {
  constructor(_baseMap) {
    super();
    this._baseMap = _baseMap;
  }
  get _base() {
    return Array.from(this._baseMap.keys());
  }
  cast() {
    if (this instanceof MapKeySet) {
      {
        return __dartAs(this, value => value instanceof MapKeySet, "MapKeySet<MapKeySet.cast.T%>");
      }
    }
    return __dartSetFrom(Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(MapKeySet.cast.T%)")));
  }
  contains(element) {
    return __dartMapContainsKey(this._baseMap, element);
  }
  get isEmpty() {
    return this._baseMap.size === 0;
  }
  get isNotEmpty() {
    return this._baseMap.size !== 0;
  }
  get length() {
    return this._baseMap.size;
  }
  toString() {
    return ("{" + Array.from(this, (value) => __dartStr(value)).join(", ") + "}");
  }
  containsAll(other) {
    return Array.from(other).every(__dartBind(this, "contains"));
  }
  difference(other) {
    return __dartSetFrom(this.where(function(element) { return !(__dartIterableContains(other, element)); }));
  }
  intersection(other) {
    return __dartSetFrom(this.where(__dartBind(other, "contains")));
  }
  lookup(element) {
    return (() => { throw __dartCoreError("UnsupportedError", "MapKeySet doesn't support lookup()."); })();
  }
  retype() {
    return __dartSetFrom(Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(MapKeySet.retype.T%)")));
  }
  union(other) {
    return (() => { let v = this.toSet(); return (() => {
      __dartSetAddAll(v, other);
      return v;
    })(); })();
  }
}

class MapValueSet extends _DelegatingIterableBase {
  constructor(_baseMap, _keyForValue) {
    super();
    this._baseMap = _baseMap;
    this._keyForValue = _keyForValue;
  }
  get _base() {
    return Array.from(this._baseMap.values());
  }
  cast() {
    if (this instanceof Set) {
      {
        return __dartAs(this, value => value instanceof Set, "Set<MapValueSet.cast.T%>");
      }
    }
    return __dartSetFrom(Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(MapValueSet.cast.T%)")));
  }
  contains(element) {
    if (!(true)) {
      return false;
    }
    let key = (() => { let v = element; return (this._keyForValue)(v); })();
    return __dartMapContainsKey(this._baseMap, key);
  }
  get isEmpty() {
    return this._baseMap.size === 0;
  }
  get isNotEmpty() {
    return this._baseMap.size !== 0;
  }
  get length() {
    return this._baseMap.size;
  }
  toString() {
    return __dartObjectToString(this.toSet());
  }
  add(value) {
    let key = (() => { let v = value; return (this._keyForValue)(v); })();
    let result = false;
    __dartMapPutIfAbsent(this._baseMap, key, function() {
      result = true;
      return value;
});
    return result;
  }
  addAll(elements) {
    return (Array.from(elements).forEach(__dartBind(this, "add")), null);
  }
  clear() {
    return (this._baseMap.clear(), null);
  }
  containsAll(other) {
    return Array.from(other).every(__dartBind(this, "contains"));
  }
  difference(other) {
    return __dartSetFrom(this.where(function(element) { return !(__dartIterableContains(other, element)); }));
  }
  intersection(other) {
    return __dartSetFrom(this.where(__dartBind(other, "contains")));
  }
  lookup(element) {
    if (!(true)) {
      return null;
    }
    let key = (() => { let v = element; return (this._keyForValue)(v); })();
    return __dartMapGet(this._baseMap, key);
  }
  remove(element) {
    if (!(true)) {
      return false;
    }
    let key = (() => { let v = element; return (this._keyForValue)(v); })();
    if (!(__dartMapContainsKey(this._baseMap, key))) {
      return false;
    }
    __dartMapRemove(this._baseMap, key);
    return true;
  }
  removeAll(elements) {
    return (Array.from(elements).forEach(__dartBind(this, "remove")), null);
  }
  removeWhere(test) {
    let toRemove = new Array(0).fill(null);
    (this._baseMap.forEach((value, key) => (function(key, value) {
      if ((test)(value)) {
        (toRemove.push(key), null);
      }
})(key, value)), null);
    (Array.from(toRemove).forEach(__dartBind(this._baseMap, "remove")), null);
  }
  retainAll(elements) {
    let valuesToRetain = __dartIdentitySet();
    {
      let _sync_for_iterator = __dartIterator(elements);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          L:
          {
            if (!(true)) {
              break L;
            }
            let key = (() => { let v = element; return (this._keyForValue)(v); })();
            if (!(__dartMapContainsKey(this._baseMap, key))) {
              break L;
            }
            __dartSetAdd(valuesToRetain, (__dartMapGet(this._baseMap, key) ?? (null ?? __dartAs(v_1, value => true, "V"))));
          }
        }
      }
    }
    let keysToRemove = new Array(0).fill(null);
    (this._baseMap.forEach((value, key) => (function(k, v) {
      if (!(__dartIterableContains(valuesToRetain, v))) {
        (keysToRemove.push(k), null);
      }
})(key, value)), null);
    (Array.from(keysToRemove).forEach(__dartBind(this._baseMap, "remove")), null);
  }
  retainWhere(test) {
    return this.removeWhere(function(element) { return !((test)(element)); });
  }
  retype() {
    return __dartSetFrom(Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(MapValueSet.retype.T%)")));
  }
  union(other) {
    return (() => { let v = this.toSet(); return (() => {
      __dartSetAddAll(v, other);
      return v;
    })(); })();
  }
}

class _EmptyUnmodifiableSet_IterableBase_UnmodifiableSetMixin {
  constructor() {
    Object.defineProperty(this, $UnmodifiableSetMixin_interface, { value: true });
  }
  cast() {
    throw new TypeError("Abstract member _EmptyUnmodifiableSet&IterableBase&UnmodifiableSetMixin.cast");
  }
  add(value) {
    return UnmodifiableSetMixin._throw();
  }
  addAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  remove(value) {
    return UnmodifiableSetMixin._throw();
  }
  removeAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  retainAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  removeWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  retainWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  clear() {
    return UnmodifiableSetMixin._throw();
  }
}

class _UnmodifiableSetView_DelegatingSet_UnmodifiableSetMixin extends DelegatingSet {
  constructor(base) {
    super(base);
    Object.defineProperty(this, $UnmodifiableSetMixin_interface, { value: true });
  }
  add(value) {
    return UnmodifiableSetMixin._throw();
  }
  addAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  remove(value) {
    return UnmodifiableSetMixin._throw();
  }
  removeAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  retainAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  removeWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  retainWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  clear() {
    return UnmodifiableSetMixin._throw();
  }
}

class UnmodifiableSetView extends _UnmodifiableSetView_DelegatingSet_UnmodifiableSetMixin {
  constructor(setBase) {
    super(setBase);
    Object.defineProperty(this, $UnmodifiableSetView_interface, { value: true });
  }
  static empty() {
    return new EmptyUnmodifiableSet();
  }
}
Object.defineProperty(UnmodifiableSetView, Symbol.hasInstance, { value(value) { return value != null && value[$UnmodifiableSetView_interface] === true; } });

class EmptyUnmodifiableSet extends _EmptyUnmodifiableSet_IterableBase_UnmodifiableSetMixin {
  constructor() {
    super();
    Object.defineProperty(this, $UnmodifiableSetView_interface, { value: true });
  }
  get iterator() {
    return __dartIterator([]);
  }
  get length() {
    return 0;
  }
  cast() {
    return new EmptyUnmodifiableSet();
  }
  contains(element) {
    return false;
  }
  containsAll(other) {
    return __dartIterableIsEmpty(other);
  }
  followedBy(other) {
    return new DelegatingIterable(other);
  }
  lookup(element) {
    return null;
  }
  retype() {
    return new EmptyUnmodifiableSet();
  }
  singleWhere(test, { orElse = null } = {}) {
    return (!((orElse === null)) ? (orElse)() : (() => { throw __dartCoreError("StateError", "No element"); })());
  }
  whereType() {
    return [];
  }
  toSet() {
    return (() => {
      const v = new Set();
      return v;
    })();
  }
  union(other) {
    return __dartSetFrom(other);
  }
  intersection(other) {
    return (() => {
      const v = new Set();
      return v;
    })();
  }
  difference(other) {
    return (() => {
      const v = new Set();
      return v;
    })();
  }
}

class NonGrowableListMixin {
  constructor() {
    Object.defineProperty(this, $NonGrowableListMixin_interface, { value: true });
  }
  static _throw() {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot change the length of a fixed-length list"); })();
  }
  set length(newLength) {
    return NonGrowableListMixin._throw();
  }
  add(value) {
    return NonGrowableListMixin._throw();
  }
  addAll(iterable) {
    return NonGrowableListMixin._throw();
  }
  insert(index, element) {
    return NonGrowableListMixin._throw();
  }
  insertAll(index, iterable) {
    return NonGrowableListMixin._throw();
  }
  remove(value) {
    return NonGrowableListMixin._throw();
  }
  removeAt(index) {
    return NonGrowableListMixin._throw();
  }
  removeLast() {
    return NonGrowableListMixin._throw();
  }
  removeWhere(test) {
    return NonGrowableListMixin._throw();
  }
  retainWhere(test) {
    return NonGrowableListMixin._throw();
  }
  removeRange(start, end) {
    return NonGrowableListMixin._throw();
  }
  replaceRange(start, end, iterable) {
    return NonGrowableListMixin._throw();
  }
  clear() {
    return NonGrowableListMixin._throw();
  }
}
Object.defineProperty(NonGrowableListMixin, Symbol.hasInstance, { value(value) { return value != null && value[$NonGrowableListMixin_interface] === true; } });

class _NonGrowableListView_DelegatingList_NonGrowableListMixin extends DelegatingList {
  constructor(base) {
    super(base);
    Object.defineProperty(this, $NonGrowableListMixin_interface, { value: true });
  }
  set length(newLength) {
    return NonGrowableListMixin._throw();
  }
  add(value) {
    return NonGrowableListMixin._throw();
  }
  addAll(iterable) {
    return NonGrowableListMixin._throw();
  }
  insert(index, element) {
    return NonGrowableListMixin._throw();
  }
  insertAll(index, iterable) {
    return NonGrowableListMixin._throw();
  }
  remove(value) {
    return NonGrowableListMixin._throw();
  }
  removeAt(index) {
    return NonGrowableListMixin._throw();
  }
  removeLast() {
    return NonGrowableListMixin._throw();
  }
  removeWhere(test) {
    return NonGrowableListMixin._throw();
  }
  retainWhere(test) {
    return NonGrowableListMixin._throw();
  }
  removeRange(start, end) {
    return NonGrowableListMixin._throw();
  }
  replaceRange(start, end, iterable) {
    return NonGrowableListMixin._throw();
  }
  clear() {
    return NonGrowableListMixin._throw();
  }
  get length() { return super.length; }
}

class NonGrowableListView extends _NonGrowableListView_DelegatingList_NonGrowableListMixin {
  constructor(listBase) {
    super(listBase);
  }
}

class UnmodifiableMapMixin {
  constructor() {
    Object.defineProperty(this, $UnmodifiableMapMixin_interface, { value: true });
  }
  static _throw() {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot modify an unmodifiable Map"); })();
  }
  "[]="(key, value) {
    return UnmodifiableMapMixin._throw();
  }
  putIfAbsent(key, ifAbsent) {
    return UnmodifiableMapMixin._throw();
  }
  addAll(other) {
    return UnmodifiableMapMixin._throw();
  }
  remove(key) {
    return UnmodifiableMapMixin._throw();
  }
  clear() {
    return UnmodifiableMapMixin._throw();
  }
  set first(_) {
    return UnmodifiableMapMixin._throw();
  }
  set last(_) {
    return UnmodifiableMapMixin._throw();
  }
}
Object.defineProperty(UnmodifiableMapMixin, Symbol.hasInstance, { value(value) { return value != null && value[$UnmodifiableMapMixin_interface] === true; } });

class _BoolList_Object_ListMixin {
  constructor() {
  }
  fillRange(start, end, fill = null) {
    let value = (fill ?? (v ?? __dartAs(v_1, value => typeof value === "boolean", "bool")));
    __dartCheckValidRange(start, end, this.length, null, null, null);
    for (let i = start; (i < end); i = (i + 1)) {
      {
        __dartIndexSet(this, i, value);
      }
    }
  }
  get iterator() {
    return __dartIterator(this);
  }
  get first() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return __dartIndexGet(this, 0);
  }
  set first(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    __dartIndexSet(this, 0, value);
  }
  get last() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return __dartIndexGet(this, (this.length - 1));
  }
  set last(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    __dartIndexSet(this, (this.length - 1), value);
  }
  elementAt(index) {
    return __dartIndexGet(this, index);
  }
  followedBy(other) {
    return Array.from(this).concat(Array.from(other));
  }
  forEach(action) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        (action)(__dartIndexGet(this, i));
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
  }
  get isEmpty() {
    return __dartEquals(this.length, 0);
  }
  get isNotEmpty() {
    return !(this.length === 0);
  }
  get single() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    if ((this.length > 1)) {
      (() => { throw __dartCoreError("StateError", "Too many elements"); })();
    }
    return __dartIndexGet(this, 0);
  }
  contains(element) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          return true;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return false;
  }
  every(test) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (!((test)(__dartIndexGet(this, i)))) {
          return false;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return true;
  }
  any(test) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if ((test)(__dartIndexGet(this, i))) {
          return true;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return false;
  }
  firstWhere(test, { orElse = null } = {}) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = __dartIndexGet(this, i);
        if ((test)(element)) {
          return element;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  lastWhere(test, { orElse = null } = {}) {
    let length = this.length;
    for (let i = (length - 1); (i >= 0); i = (i - 1)) {
      {
        let element = __dartIndexGet(this, i);
        if ((test)(element)) {
          return element;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  singleWhere(test, { orElse = null } = {}) {
    let length = this.length;
    const match = __dartLazyField("match", null, true, null);
    let matchFound = false;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = __dartIndexGet(this, i);
        if ((test)(element)) {
          {
            if (matchFound) {
              {
                (() => { throw __dartCoreError("StateError", "Too many elements"); })();
              }
            }
            matchFound = true;
            match.set(element);
          }
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (matchFound) {
      return match.get();
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  join(separator_1 = "") {
    if (__dartEquals(this.length, 0)) {
      return "";
    }
    let buffer = (() => { let v = __dartStringBuffer(""); return (() => {
      v.writeAll(this, separator_1);
      return v;
    })(); })();
    return __dartStr(buffer);
  }
  where(test) {
    return Array.from(this).filter((value) => test(value));
  }
  whereType() {
    return Array.from(this).filter((value) => true);
  }
  map(f) {
    return Array.from(this, (value) => f(value));
  }
  expand(f) {
    return Array.from(this).flatMap((value) => Array.from(f(value)));
  }
  reduce(combine) {
    let length = this.length;
    if (__dartEquals(length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    let value = __dartIndexGet(this, 0);
    for (let i = 1; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, __dartIndexGet(this, i));
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return value;
  }
  fold(initialValue, combine) {
    let value = initialValue;
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, __dartIndexGet(this, i));
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return value;
  }
  skip(count) {
    return Array.from(this).slice(count, null ?? undefined);
  }
  skipWhile(test) {
    return __dartIterableSkipWhile(this, test);
  }
  take(count) {
    return Array.from(this).slice(0, __dartNullCheck(count) ?? undefined);
  }
  takeWhile(test) {
    return __dartIterableTakeWhile(this, test);
  }
  toList({ growable = true } = {}) {
    if (this.length === 0) {
      return (growable ? [] : __dartFixedList([]));
    }
    let first = __dartIndexGet(this, 0);
    let result = (growable ? new Array(this.length).fill(first) : __dartFixedList(new Array(this.length).fill(first)));
    for (let i = 1; (i < this.length); i = (i + 1)) {
      {
        __dartIndexSet(result, i, __dartIndexGet(this, i));
      }
    }
    return result;
  }
  toSet() {
    let result = new Set();
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        __dartSetAdd(result, __dartIndexGet(this, i));
      }
    }
    return result;
  }
  add(element) {
    __dartIndexSet(this, (() => { let v = this.length; return (() => { let v_1 = this.length = (v + 1); return v; })(); })(), element);
  }
  addAll(iterable) {
    let i = this.length;
    {
      let _sync_for_iterator = __dartIterator(iterable);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            this.add(element);
            i = (i + 1);
          }
        }
      }
    }
  }
  remove(element) {
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          {
            this._closeGap(i, (i + 1));
            return true;
          }
        }
      }
    }
    return false;
  }
  _closeGap(start, end) {
    let length = this.length;
    let size = (end - start);
    for (let i = end; (i < length); i = (i + 1)) {
      {
        __dartIndexSet(this, (i - size), __dartIndexGet(this, i));
      }
    }
    this.length = (length - size);
  }
  removeWhere(test) {
    this._filter(test, false);
  }
  retainWhere(test) {
    this._filter(test, true);
  }
  _filter(test, retainMatching) {
    let retained = new Array(0).fill(null);
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = __dartIndexGet(this, i);
        if (__dartEquals((test)(element), retainMatching)) {
          {
            (retained.push(element), null);
          }
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!(__dartEquals(retained.length, this.length))) {
      {
        __dartListSetRange(this, 0, retained.length, retained, 0);
        this.length = retained.length;
      }
    }
  }
  clear() {
    this.length = 0;
  }
  cast() {
    return Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(_BoolList&Object&ListMixin.cast.R%)"));
  }
  removeLast() {
    if (__dartEquals(this.length, 0)) {
      {
        (() => { throw __dartCoreError("StateError", "No element"); })();
      }
    }
    let result = __dartIndexGet(this, (this.length - 1));
    this.length = (this.length - 1);
    return result;
  }
  sort(compare = null) {
    __dartListSort(this, (compare ?? ((left, right) => __dartCompare(left, right))));
  }
  shuffle(random = null) {
    ((random === null) ? random = __dartRandom(null, false) : null);
    let length = this.length;
    while ((length > 1)) {
      {
        let pos = random.nextInt(length);
        length = (length - 1);
        let tmp = __dartIndexGet(this, length);
        __dartIndexSet(this, length, __dartIndexGet(this, pos));
        __dartIndexSet(this, pos, tmp);
      }
    }
  }
  asMap() {
    return new Map(Array.from(this, (value, index) => [index, value]));
  }
  "+"(other) {
    return (() => {
      const v = Array.from(this);
      (v.push(...Array.from(other)), null);
      return v;
    })();
  }
  sublist(start, end = null) {
    let listLength = this.length;
    ((end === null) ? end = listLength : null);
    __dartCheckValidRange(start, end, listLength, null, null, null);
    return Array.from(this.slice(start, end));
  }
  getRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    return Array.from(this).slice(start, end ?? undefined);
  }
  removeRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if ((end > start)) {
      {
        this._closeGap(start, end);
      }
    }
  }
  setRange(start, end, iterable, skipCount = 0) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    let length = (end - start);
    if (__dartEquals(length, 0)) {
      return;
    }
    __dartCheckNotNegative(skipCount, "skipCount", null);
    let otherList = null;
    let otherStart = null;
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        otherList = iterable;
        otherStart = skipCount;
      }
    } else {
      {
        otherList = __dartFixedList(Array.from(Array.from(iterable).slice(skipCount)));
        otherStart = 0;
      }
    }
    if (((otherStart + length) > otherList.length)) {
      {
        (() => { throw __dartCoreError("StateError", "Too few elements"); })();
      }
    }
    if ((otherStart < start)) {
      {
        for (let i = (length - 1); (i >= 0); i = (i - 1)) {
          {
            __dartIndexSet(this, (start + i), __dartIndexGet(otherList, (otherStart + i)));
          }
        }
      }
    } else {
      {
        for (let i_1 = 0; (i_1 < length); i_1 = (i_1 + 1)) {
          {
            __dartIndexSet(this, (start + i_1), __dartIndexGet(otherList, (otherStart + i_1)));
          }
        }
      }
    }
  }
  replaceRange(start, end, newContents) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if (__dartEquals(start, this.length)) {
      {
        this.addAll(newContents);
        return;
      }
    }
    if (!(newContents != null && typeof newContents !== "string" && typeof newContents.length === "number" && typeof newContents[Symbol.iterator] === "function")) {
      {
        newContents = Array.from(newContents);
      }
    }
    let removeLength = (end - start);
    let insertLength = __dartIterableLength(newContents);
    if ((removeLength >= insertLength)) {
      {
        let insertEnd = (start + insertLength);
        __dartListSetRange(this, start, insertEnd, newContents, 0);
        if ((removeLength > insertLength)) {
          {
            this._closeGap(insertEnd, end);
          }
        }
      }
    } else {
      if (__dartEquals(end, this.length)) {
        {
          let i = start;
          {
            let _sync_for_iterator = __dartIterator(newContents);
            for (; _sync_for_iterator.moveNext(); ) {
              {
                let element = _sync_for_iterator.current;
                {
                  if ((i < end)) {
                    {
                      __dartIndexSet(this, i, element);
                    }
                  } else {
                    {
                      this.add(element);
                    }
                  }
                  i = (i + 1);
                }
              }
            }
          }
        }
      } else {
        {
          let delta = (insertLength - removeLength);
          let oldLength = this.length;
          let insertEnd_1 = (start + insertLength);
          for (let i_1 = (oldLength - delta); (i_1 < oldLength); i_1 = (i_1 + 1)) {
            {
              this.add(__dartIndexGet(this, ((i_1 > 0) ? i_1 : 0)));
            }
          }
          if ((insertEnd_1 < oldLength)) {
            {
              __dartListSetRange(this, insertEnd_1, oldLength, this, end);
            }
          }
          __dartListSetRange(this, start, insertEnd_1, newContents, 0);
        }
      }
    }
  }
  indexOf(element, start = 0) {
    if ((start < 0)) {
      start = 0;
    }
    for (let i = start; (i < this.length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          return i;
        }
      }
    }
    return (-1);
  }
  indexWhere(test, start = 0) {
    if ((start < 0)) {
      start = 0;
    }
    for (let i = start; (i < this.length); i = (i + 1)) {
      {
        if ((test)(__dartIndexGet(this, i))) {
          return i;
        }
      }
    }
    return (-1);
  }
  lastIndexOf(element, start = null) {
    if (((start === null) || (start >= this.length))) {
      start = (this.length - 1);
    }
    for (let i = start; (i >= 0); i = (i - 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          return i;
        }
      }
    }
    return (-1);
  }
  lastIndexWhere(test, start = null) {
    if (((start === null) || (start >= this.length))) {
      start = (this.length - 1);
    }
    for (let i = start; (i >= 0); i = (i - 1)) {
      {
        if ((test)(__dartIndexGet(this, i))) {
          return i;
        }
      }
    }
    return (-1);
  }
  insert(index, element) {
    __dartNullCheck(index);
    let length = this.length;
    __dartCheckValueInInterval(index, 0, length, "index", null);
    this.add(element);
    if (!(__dartEquals(index, length))) {
      {
        __dartListSetRange(this, (index + 1), (length + 1), this, index);
        __dartIndexSet(this, index, element);
      }
    }
  }
  removeAt(index) {
    let result = __dartIndexGet(this, index);
    this._closeGap(index, (index + 1));
    return result;
  }
  insertAll(index, iterable) {
    __dartCheckValueInInterval(index, 0, this.length, "index", null);
    if (__dartEquals(index, this.length)) {
      {
        this.addAll(iterable);
        return;
      }
    }
    if ((!(iterable != null && typeof iterable !== "string" && typeof iterable.length === "number" && typeof iterable[Symbol.iterator] === "function") || Object.is(iterable, this))) {
      {
        iterable = Array.from(iterable);
      }
    }
    let insertionLength = __dartIterableLength(iterable);
    if (__dartEquals(insertionLength, 0)) {
      {
        return;
      }
    }
    let oldLength = this.length;
    for (let i = (oldLength - insertionLength); (i < oldLength); i = (i + 1)) {
      {
        this.add(__dartIndexGet(this, ((i > 0) ? i : 0)));
      }
    }
    if (!(__dartEquals(__dartIterableLength(iterable), insertionLength))) {
      {
        this.length = (this.length - insertionLength);
        (() => { throw __dartCoreError("ConcurrentModificationError", iterable); })();
      }
    }
    let oldCopyStart = (index + insertionLength);
    if ((oldCopyStart < oldLength)) {
      {
        __dartListSetRange(this, oldCopyStart, oldLength, this, index);
      }
    }
    __dartListSetAll(this, index, iterable);
  }
  setAll(index, iterable) {
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        __dartListSetRange(this, index, (index + __dartIterableLength(iterable)), iterable, 0);
      }
    } else {
      {
        {
          let _sync_for_iterator = __dartIterator(iterable);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let element = _sync_for_iterator.current;
              {
                __dartIndexSet(this, (() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element);
              }
            }
          }
        }
      }
    }
  }
  get reversed() {
    return Array.from(this).reverse();
  }
  toString() {
    return ("[" + Array.from(this, (value) => __dartStr(value)).join(", ") + "]");
  }
}

class BoolList extends _BoolList_Object_ListMixin {
  static _(_data, _length) {
    return $BoolList__(BoolList, _data, _length);
  }
  static _selectType(length, growable) {
    if (growable) {
      {
        return new _GrowableBoolList(length);
      }
    } else {
      {
        return new _NonGrowableBoolList(length);
      }
    }
  }
  constructor(length, { fill = false, growable = false } = {}) {
    if (new.target === BoolList) {
      __dartCheckNotNegative(length, "length", null);
      let boolList = null;
      if (growable) {
        {
          boolList = new _GrowableBoolList(length);
        }
      } else {
        {
          boolList = new _NonGrowableBoolList(length);
        }
      }
      if (fill) {
        {
          boolList.fillRange(0, length, true);
        }
      }
      return boolList;
    }
  }
  static empty({ growable = true, capacity = 0 } = {}) {
    __dartCheckNotNegative(capacity, "length", null);
    if (growable) {
      {
        return _GrowableBoolList._withCapacity(0, capacity);
      }
    } else {
      {
        return _NonGrowableBoolList._withCapacity(0, capacity);
      }
    }
  }
  static generate(length, generator, { growable = true } = {}) {
    __dartCheckNotNegative(length, "length", null);
    let instance = BoolList._selectType(length, growable);
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        instance._setBit(i, (generator)(i));
      }
    }
    return instance;
  }
  static of(elements, { growable = false } = {}) {
    return (() => { let v = BoolList._selectType(__dartIterableLength(elements), growable); return (() => {
      v.setAll(0, elements);
      return v;
    })(); })();
  }
  get length() {
    return this._length;
  }
  "[]"(index) {
    __dartCheckValidIndex(index, this, "index", this._length, null);
    return !(__dartEquals((__dartIndexGet(this._data, __dartShr(index, 5)) & (1 << (index & 31))), 0));
  }
  "[]="(index, value) {
    __dartCheckValidIndex(index, this, "index", this._length, null);
    this._setBit(index, value);
  }
  fillRange(start, end, fill = null) {
    __dartCheckValidRange(start, end, this._length, null, null, null);
    ((fill === null) ? fill = false : null);
    let startWord = __dartShr(start, 5);
    let endWord = __dartShr((end - 1), 5);
    let startBit = (start & 31);
    let endBit = ((end - 1) & 31);
    if ((startWord < endWord)) {
      {
        if (fill) {
          {
            (() => { let v = this._data; return (() => { let v_1 = startWord; return __dartIndexSet(v, v_1, (__dartIndexGet(v, v_1) | ((-1) << startBit))); })(); })();
            (this._data.fill((-1), (startWord + 1), endWord), null);
            (() => { let v_2 = this._data; return (() => { let v_3 = endWord; return __dartIndexSet(v_2, v_3, (__dartIndexGet(v_2, v_3) | ((1 << (endBit + 1)) - 1))); })(); })();
          }
        } else {
          {
            (() => { let v_4 = this._data; return (() => { let v_5 = startWord; return __dartIndexSet(v_4, v_5, (__dartIndexGet(v_4, v_5) & ((1 << startBit) - 1))); })(); })();
            (this._data.fill(0, (startWord + 1), endWord), null);
            (() => { let v_6 = this._data; return (() => { let v_7 = endWord; return __dartIndexSet(v_6, v_7, (__dartIndexGet(v_6, v_7) & ((-1) << (endBit + 1)))); })(); })();
          }
        }
      }
    } else {
      {
        if (fill) {
          {
            (() => { let v_8 = this._data; return (() => { let v_9 = startWord; return __dartIndexSet(v_8, v_9, (__dartIndexGet(v_8, v_9) | (((1 << ((endBit - startBit) + 1)) - 1) << startBit))); })(); })();
          }
        } else {
          {
            (() => { let v_10 = this._data; return (() => { let v_11 = startWord; return __dartIndexSet(v_10, v_11, (__dartIndexGet(v_10, v_11) & (((1 << startBit) - 1) | ((-1) << (endBit + 1))))); })(); })();
          }
        }
      }
    }
  }
  get iterator() {
    return new _BoolListIterator(this);
  }
  _setBit(index, value) {
    if (value) {
      {
        (() => { let v = this._data; return (() => { let v_1 = __dartShr(index, 5); return __dartIndexSet(v, v_1, (__dartIndexGet(v, v_1) | (1 << (index & 31)))); })(); })();
      }
    } else {
      {
        (() => { let v_2 = this._data; return (() => { let v_3 = __dartShr(index, 5); return __dartIndexSet(v_2, v_3, (__dartIndexGet(v_2, v_3) & (~(1 << (index & 31))))); })(); })();
      }
    }
  }
  static _lengthInWords(bitLength) {
    return __dartShr((bitLength + (32 - 1)), 5);
  }
}

function $BoolList__($newTarget, _data, _length) {
  const $self = Reflect.construct(_BoolList_Object_ListMixin, [], $newTarget);
  $self._data = _data;
  $self._length = _length;
  return $self;
}

class _GrowableBoolList extends BoolList {
  static _withCapacity(length, capacity) {
    return $_GrowableBoolList__withCapacity(_GrowableBoolList, length, capacity);
  }
  constructor(length) {
    const $self = $BoolList__(new.target, new Uint32Array(BoolList._lengthInWords((length * 2))), length);
    return $self;
  }
  set length(length) {
    __dartCheckNotNegative(length, "length", null);
    if ((length > this._length)) {
      {
        this._expand(length);
      }
    } else {
      if ((length < this._length)) {
        {
          this._shrink(length);
        }
      }
    }
  }
  _expand(length) {
    if ((length > (this._data.length * 32))) {
      {
        this._data = (() => { let v = new Uint32Array(BoolList._lengthInWords((length * 2))); return (() => {
          __dartListSetRange(v, 0, this._data.length, this._data, 0);
          return v;
        })(); })();
      }
    }
    this._length = length;
  }
  _shrink(length) {
    if ((length < __dartTruncDiv(this._length, 2))) {
      {
        let newDataLength = BoolList._lengthInWords(length);
        this._data = (() => { let v = new Uint32Array(newDataLength); return (() => {
          __dartListSetRange(v, 0, newDataLength, this._data, 0);
          return v;
        })(); })();
      }
    }
    for (let i = length; (i < (this._data.length * 32)); i = (i + 1)) {
      {
        this._setBit(i, false);
      }
    }
    this._length = length;
  }
  get length() { return super.length; }
}

function $_GrowableBoolList__withCapacity($newTarget, length, capacity) {
  const $self = $BoolList__($newTarget, new Uint32Array(BoolList._lengthInWords(capacity)), length);
  return $self;
}

class __NonGrowableBoolList_BoolList_NonGrowableListMixin extends BoolList {
  constructor() {
    if (new.target === __NonGrowableBoolList_BoolList_NonGrowableListMixin) {
      throw new TypeError("Class __NonGrowableBoolList&BoolList&NonGrowableListMixin has no unnamed constructor");
    }
  }
  static _(_data, _length) {
    return $__NonGrowableBoolList_BoolList_NonGrowableListMixin__(__NonGrowableBoolList_BoolList_NonGrowableListMixin, _data, _length);
  }
  set length(newLength) {
    return NonGrowableListMixin._throw();
  }
  add(value) {
    return NonGrowableListMixin._throw();
  }
  addAll(iterable) {
    return NonGrowableListMixin._throw();
  }
  insert(index, element) {
    return NonGrowableListMixin._throw();
  }
  insertAll(index, iterable) {
    return NonGrowableListMixin._throw();
  }
  remove(value) {
    return NonGrowableListMixin._throw();
  }
  removeAt(index) {
    return NonGrowableListMixin._throw();
  }
  removeLast() {
    return NonGrowableListMixin._throw();
  }
  removeWhere(test) {
    return NonGrowableListMixin._throw();
  }
  retainWhere(test) {
    return NonGrowableListMixin._throw();
  }
  removeRange(start, end) {
    return NonGrowableListMixin._throw();
  }
  replaceRange(start, end, iterable) {
    return NonGrowableListMixin._throw();
  }
  clear() {
    return NonGrowableListMixin._throw();
  }
  get length() { return super.length; }
}

function $__NonGrowableBoolList_BoolList_NonGrowableListMixin__($newTarget, _data, _length) {
  const $self = $BoolList__($newTarget, _data, _length);
  Object.defineProperty($self, $NonGrowableListMixin_interface, { value: true });
  return $self;
}

class _NonGrowableBoolList extends __NonGrowableBoolList_BoolList_NonGrowableListMixin {
  static _withCapacity(length, capacity) {
    return $_NonGrowableBoolList__withCapacity(_NonGrowableBoolList, length, capacity);
  }
  constructor(length) {
    const $self = $__NonGrowableBoolList_BoolList_NonGrowableListMixin__(new.target, new Uint32Array(BoolList._lengthInWords(length)), length);
    return $self;
  }
}

function $_NonGrowableBoolList__withCapacity($newTarget, length, capacity) {
  const $self = $__NonGrowableBoolList_BoolList_NonGrowableListMixin__($newTarget, new Uint32Array(BoolList._lengthInWords(capacity)), length);
  return $self;
}

class _BoolListIterator {
  constructor(_boolList) {
    this._current = false;
    this._pos = 0;
    this._boolList = _boolList;
    this._length = _boolList._length;
  }
  get current() {
    return this._current;
  }
  moveNext() {
    if (!(__dartEquals(this._boolList._length, this._length))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this._boolList); })();
      }
    }
    if ((this._pos < this._boolList.length)) {
      {
        let pos = (() => { let v = this._pos; return (() => { let v_1 = this._pos = (v + 1); return v; })(); })();
        this._current = !(__dartEquals((__dartIndexGet(this._boolList._data, __dartShr(pos, 5)) & (1 << (pos & 31))), 0));
        return true;
      }
    }
    this._current = false;
    return false;
  }
}

class CanonicalizedMap {
  constructor(canonicalize_1, { isValidKey = null } = {}) {
    this._base = new Map([]);
    this._canonicalize = canonicalize_1;
    this._isValidKeyFn = isValidKey;
  }
  static from(other, canonicalize_1, { isValidKey = null } = {}) {
    return $CanonicalizedMap_from(CanonicalizedMap, other, canonicalize_1, { isValidKey: isValidKey });
  }
  static fromEntries(entries, canonicalize_1, { isValidKey = null } = {}) {
    return $CanonicalizedMap_fromEntries(CanonicalizedMap, entries, canonicalize_1, { isValidKey: isValidKey });
  }
  static _(_canonicalize, _isValidKeyFn, base) {
    return $CanonicalizedMap__(CanonicalizedMap, _canonicalize, _isValidKeyFn, base);
  }
  copy() {
    return CanonicalizedMap._(this._canonicalize, this._isValidKeyFn, this._base);
  }
  "[]"(key) {
    if (!(this._isValidKey(key))) {
      return null;
    }
    let pair = __dartMapGet(this._base, (() => { let v = __dartAs(key, value => true, "K"); return (this._canonicalize)(v); })());
    return ((pair)?.value ?? null);
  }
  "[]="(key, value) {
    if (!(this._isValidKey(key))) {
      return;
    }
    __dartMapSet(this._base, (() => { let v = key; return (this._canonicalize)(v); })(), Object.freeze({ key: key, value: value }));
  }
  addAll(other) {
    (other.forEach((value, key) => ((key, value) => { return (() => { let v = key; return (() => { let v_1 = value; return (() => { let v_2 = this["[]="](v, v_1); return v_1; })(); })(); })(); })(key, value)), null);
  }
  addEntries(entries) {
    return __dartMapAddEntries(this._base, Array.from(entries, (e) => { return Object.freeze({ key: (() => { let v = e.key; return (this._canonicalize)(v); })(), value: Object.freeze({ key: e.key, value: e.value }) }); }));
  }
  cast() {
    return new Map(Array.from(this._base, ([key, value]) => [__dartAs(key, (key) => true, "TypeParameterType(CanonicalizedMap.cast.K2%)"), __dartAs(value, (value) => true, "TypeParameterType(CanonicalizedMap.cast.V2%)")]));
  }
  clear() {
    (this._base.clear(), null);
  }
  containsKey(key) {
    if (!(this._isValidKey(key))) {
      return false;
    }
    return __dartMapContainsKey(this._base, (() => { let v = __dartAs(key, value => true, "K"); return (this._canonicalize)(v); })());
  }
  containsValue(value) {
    return Array.from(Array.from(this._base.values())).some(function(pair) { return __dartEquals(pair.value, value); });
  }
  get entries() {
    return Array.from(Array.from(this._base, ([key, value]) => ({ key, value })), function(e) { return Object.freeze({ key: e.value.key, value: e.value.value }); });
  }
  forEach(f) {
    (this._base.forEach((value, key) => (function(key, pair) { return (f)(pair.key, pair.value); })(key, value)), null);
  }
  get isEmpty() {
    return this._base.size === 0;
  }
  get isNotEmpty() {
    return this._base.size !== 0;
  }
  get keys() {
    return Array.from(Array.from(this._base.values()), function(pair) { return pair.key; });
  }
  get length() {
    return this._base.size;
  }
  map(transform) {
    return __dartMapMap(this._base, function(_, pair) { return (transform)(pair.key, pair.value); });
  }
  putIfAbsent(key, ifAbsent) {
    return __dartMapPutIfAbsent(this._base, (() => { let v = key; return (this._canonicalize)(v); })(), function() { return Object.freeze({ key: key, value: (ifAbsent)() }); }).value;
  }
  remove(key) {
    if (!(this._isValidKey(key))) {
      return null;
    }
    let pair = __dartMapRemove(this._base, (() => { let v = __dartAs(key, value => true, "K"); return (this._canonicalize)(v); })());
    return ((pair)?.value ?? null);
  }
  removeWhere(test) {
    return __dartMapRemoveWhere(this._base, function(_, pair) { return (test)(pair.key, pair.value); });
  }
  retype() {
    return this.cast();
  }
  update(key, update, { ifAbsent = null } = {}) {
    return __dartMapUpdate(this._base, (() => { let v = key; return (this._canonicalize)(v); })(), function(pair) {
      let value = pair.value;
      let newValue = (update)(value);
      if (Object.is(newValue, value)) {
        return pair;
      }
      return Object.freeze({ key: key, value: newValue });
}, ((ifAbsent === null) ? null : function() { return Object.freeze({ key: key, value: (ifAbsent)() }); })).value;
  }
  updateAll(update) {
    return __dartMapUpdateAll(this._base, function(_, pair) {
      let value = pair.value;
      let key = pair.key;
      let newValue = (update)(key, value);
      if (Object.is(value, newValue)) {
        return pair;
      }
      return Object.freeze({ key: key, value: newValue });
});
  }
  get values() {
    return Array.from(Array.from(this._base.values()), function(pair) { return pair.value; });
  }
  toString() {
    return ("{" + Array.from(this, ([key, value]) => __dartStr(key) + ": " + __dartStr(value)).join(", ") + "}");
  }
  _isValidKey(key) {
    return (true && ((this._isValidKeyFn === null) || (() => { let v = key; return ((this._isValidKeyFn ?? __dartAs(v_1, value => typeof value === "function", "bool Function(CanonicalizedMap.K%)")))(v); })()));
  }
  toMap() {
    return __dartMapFromEntries(Array.from(Array.from(this._base.values()), (entry) => [entry.key, entry.value]));
  }
  toMapOfCanonicalKeys() {
    return __dartMapFromEntries(Array.from(Array.from(Array.from(this._base, ([key, value]) => ({ key, value })), function(e) { return Object.freeze({ key: e.key, value: e.value.value }); }), (entry) => [entry.key, entry.value]));
  }
}

function $CanonicalizedMap_from($newTarget, other, canonicalize_1, { isValidKey = null } = {}) {
  const $self = Object.create($newTarget.prototype);
  $self._base = new Map([]);
  $self._canonicalize = canonicalize_1;
  $self._isValidKeyFn = isValidKey;
  $self.addAll(other);
  return $self;
}

function $CanonicalizedMap_fromEntries($newTarget, entries, canonicalize_1, { isValidKey = null } = {}) {
  const $self = Object.create($newTarget.prototype);
  $self._base = new Map([]);
  $self._canonicalize = canonicalize_1;
  $self._isValidKeyFn = isValidKey;
  $self.addEntries(entries);
  return $self;
}

function $CanonicalizedMap__($newTarget, _canonicalize, _isValidKeyFn, base) {
  const $self = Object.create($newTarget.prototype);
  $self._base = new Map([]);
  $self._canonicalize = _canonicalize;
  $self._isValidKeyFn = _isValidKeyFn;
  __dartMapAddAll($self._base, base);
  return $self;
}

class CombinedIterator {
  constructor(iterators) {
    this._iterators = iterators;
    if (!(iterators.moveNext())) {
      this._iterators = null;
    }
  }
  get current() {
    let iterators = this._iterators;
    if (!((iterators === null))) {
      return iterators.current.current;
    }
    return (null ?? __dartAs(v, value => true, "T"));
  }
  moveNext() {
    let iterators = this._iterators;
    if (!((iterators === null))) {
      {
        do {
          {
            if (iterators.current.moveNext()) {
              {
                return true;
              }
            }
          }
        } while (iterators.moveNext());
        this._iterators = null;
      }
    }
    return false;
  }
}

class CombinedIterableView {
  constructor(_iterables) {
    this._iterables = _iterables;
  }
  get iterator() {
    return new CombinedIterator(__dartIterator(Array.from(this._iterables, function(i) { return __dartIterator(i); })));
  }
  contains(element) {
    return Array.from(this._iterables).some(function(i) { return __dartIterableContains(i, element); });
  }
  get isEmpty() {
    return Array.from(this._iterables).every(function(i) { return __dartIterableIsEmpty(i); });
  }
  get length() {
    return Array.from(this._iterables).reduce((previous, value) => (function(length, i) { return (length + __dartIterableLength(i)); })(previous, value), 0);
  }
}

class CombinedListView {
  constructor(_lists) {
    this._lists = _lists;
  }
  static _throw() {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot modify an unmodifiable List"); })();
  }
  get iterator() {
    return new CombinedIterator(__dartIterator(Array.from(this._lists, function(i) { return __dartIterator(i); })));
  }
  set length(length) {
    CombinedListView._throw();
  }
  get length() {
    return Array.from(this._lists).reduce((previous, value) => (function(length, list) { return (length + list.length); })(previous, value), 0);
  }
  "[]"(index) {
    let initialIndex = index;
    for (let i = 0; (i < this._lists.length); i = (i + 1)) {
      {
        let list = __dartIndexGet(this._lists, i);
        if ((index < list.length)) {
          {
            return __dartIndexGet(list, index);
          }
        }
        index = (index - list.length);
      }
    }
    (() => { throw __dartCoreError("IndexError", initialIndex); })();
  }
  "[]="(index, value) {
    CombinedListView._throw();
  }
  clear() {
    CombinedListView._throw();
  }
  remove(element) {
    CombinedListView._throw();
  }
  removeWhere(test) {
    CombinedListView._throw();
  }
  retainWhere(test) {
    CombinedListView._throw();
  }
}

class CombinedMapView {
  constructor(_maps) {
    this._maps = _maps;
  }
  "[]"(key) {
    {
      let _sync_for_iterator = __dartIterator(this._maps);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let map = _sync_for_iterator.current;
          {
            let value = __dartMapGet(map, key);
            if ((!((value === null)) || __dartMapContainsKey(map, value))) {
              {
                return value;
              }
            }
          }
        }
      }
    }
    return null;
  }
  get keys() {
    return new _DeduplicatingIterableView(new CombinedIterableView(Array.from(this._maps, function(m) { return Array.from(m.keys()); })));
  }
}

class _DeduplicatingIterableView {
  constructor(_iterable) {
    this._iterable = _iterable;
  }
  get iterator() {
    return new _DeduplicatingIterator(__dartIterator(this._iterable));
  }
  contains(element) {
    return __dartIterableContains(this._iterable, element);
  }
  get isEmpty() {
    return __dartIterableIsEmpty(this._iterable);
  }
}

class _DeduplicatingIterator {
  constructor(_iterator) {
    this._emitted = new Set();
    this._iterator = _iterator;
  }
  get current() {
    return this._iterator.current;
  }
  moveNext() {
    while (this._iterator.moveNext()) {
      {
        if (__dartSetAdd(this._emitted, this.current)) {
          {
            return true;
          }
        }
      }
    }
    return false;
  }
}

class Equality {
  constructor() {
    if (new.target === Equality) {
      return new DefaultEquality();
    }
  }
  equals(e1, e2) {
    throw new TypeError("Abstract member Equality.equals");
  }
  hash(e) {
    throw new TypeError("Abstract member Equality.hash");
  }
  isValidKey(o) {
    throw new TypeError("Abstract member Equality.isValidKey");
  }
}
Object.defineProperty(Equality, Symbol.hasInstance, { value(value) { return value != null && value[$Equality_interface] === true; } });

class EqualityBy {
  constructor(comparisonKey, inner = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    this._comparisonKey = comparisonKey;
    this._inner = inner;
    Object.defineProperty(this, $Equality_interface, { value: true });
  }
  equals(e1, e2) {
    return this._inner.equals((() => { let v = e1; return (this._comparisonKey)(v); })(), (() => { let v_1 = e2; return (this._comparisonKey)(v_1); })());
  }
  hash(e) {
    return this._inner.hash((() => { let v = e; return (this._comparisonKey)(v); })());
  }
  isValidKey(o) {
    if (true) {
      {
        const value = (() => { let v = o; return (this._comparisonKey)(v); })();
        return this._inner.isValidKey(value);
      }
    }
    return false;
  }
}

class DefaultEquality {
  constructor() {
    Object.defineProperty(this, $Equality_interface, { value: true });
  }
  equals(e1, e2) {
    return __dartEquals(e1, e2);
  }
  hash(e) {
    return __dartHashValue(e);
  }
  isValidKey(o) {
    return true;
  }
}

class IdentityEquality {
  constructor() {
    Object.defineProperty(this, $Equality_interface, { value: true });
  }
  equals(e1, e2) {
    return Object.is(e1, e2);
  }
  hash(e) {
    return __dartHashValue(e);
  }
  isValidKey(o) {
    return true;
  }
}

class IterableEquality {
  constructor(elementEquality = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    this._elementEquality = elementEquality;
    Object.defineProperty(this, $Equality_interface, { value: true });
  }
  equals(elements1, elements2) {
    if (Object.is(elements1, elements2)) {
      return true;
    }
    if (((elements1 === null) || (elements2 === null))) {
      return false;
    }
    let it1 = __dartIterator(elements1);
    let it2 = __dartIterator(elements2);
    while (true) {
      {
        let hasNext = it1.moveNext();
        if (!(__dartEquals(hasNext, it2.moveNext()))) {
          return false;
        }
        if (!(hasNext)) {
          return true;
        }
        if (!(this._elementEquality.equals(it1.current, it2.current))) {
          return false;
        }
      }
    }
  }
  hash(elements) {
    if ((elements === null)) {
      return __dartHashValue(null);
    }
    let hash_1 = 0;
    {
      let _sync_for_iterator = __dartIterator(elements);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            let c = this._elementEquality.hash(element);
            hash_1 = ((hash_1 + c) & 2147483647);
            hash_1 = ((hash_1 + (hash_1 << 10)) & 2147483647);
            hash_1 = (hash_1 ^ __dartShr(hash_1, 6));
          }
        }
      }
    }
    hash_1 = ((hash_1 + (hash_1 << 3)) & 2147483647);
    hash_1 = (hash_1 ^ __dartShr(hash_1, 11));
    hash_1 = ((hash_1 + (hash_1 << 15)) & 2147483647);
    return hash_1;
  }
  isValidKey(o) {
    return o != null && typeof o !== "string" && !(o instanceof Map) && typeof o[Symbol.iterator] === "function";
  }
}

class ListEquality {
  constructor(elementEquality = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    this._elementEquality = elementEquality;
    Object.defineProperty(this, $Equality_interface, { value: true });
  }
  equals(list1, list2) {
    if (Object.is(list1, list2)) {
      return true;
    }
    if (((list1 === null) || (list2 === null))) {
      return false;
    }
    let length = list1.length;
    if (!(__dartEquals(length, list2.length))) {
      return false;
    }
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (!(this._elementEquality.equals(__dartIndexGet(list1, i), __dartIndexGet(list2, i)))) {
          return false;
        }
      }
    }
    return true;
  }
  hash(list) {
    if ((list === null)) {
      return __dartHashValue(null);
    }
    let hash_1 = 0;
    for (let i = 0; (i < list.length); i = (i + 1)) {
      {
        let c = this._elementEquality.hash(__dartIndexGet(list, i));
        hash_1 = ((hash_1 + c) & 2147483647);
        hash_1 = ((hash_1 + (hash_1 << 10)) & 2147483647);
        hash_1 = (hash_1 ^ __dartShr(hash_1, 6));
      }
    }
    hash_1 = ((hash_1 + (hash_1 << 3)) & 2147483647);
    hash_1 = (hash_1 ^ __dartShr(hash_1, 11));
    hash_1 = ((hash_1 + (hash_1 << 15)) & 2147483647);
    return hash_1;
  }
  isValidKey(o) {
    return (Array.isArray(o) || (ArrayBuffer.isView(o) && !(o instanceof DataView)));
  }
}

class _UnorderedEquality {
  constructor(_elementEquality) {
    this._elementEquality = _elementEquality;
    Object.defineProperty(this, $Equality_interface, { value: true });
  }
  equals(elements1, elements2) {
    if (Object.is(elements1, elements2)) {
      return true;
    }
    if (((elements1 === null) || (elements2 === null))) {
      return false;
    }
    let counts = __dartCustomHashMap(__dartAs(__dartBind(this._elementEquality, "equals"), value => typeof value === "function", "bool Function(_UnorderedEquality.E%, _UnorderedEquality.E%)"), __dartAs(__dartBind(this._elementEquality, "hash"), value => typeof value === "function", "int Function(_UnorderedEquality.E%)"), __dartBind(this._elementEquality, "isValidKey"));
    let length = 0;
    {
      let _sync_for_iterator = __dartIterator(elements1);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let e = _sync_for_iterator.current;
          {
            let count = (__dartMapGet(counts, e) ?? 0);
            __dartMapSet(counts, e, (count + 1));
            length = (length + 1);
          }
        }
      }
    }
    {
      let _sync_for_iterator_1 = __dartIterator(elements2);
      for (; _sync_for_iterator_1.moveNext(); ) {
        {
          let e_1 = _sync_for_iterator_1.current;
          {
            let count_1 = __dartMapGet(counts, e_1);
            if (((count_1 === null) || __dartEquals(count_1, 0))) {
              return false;
            }
            __dartMapSet(counts, e_1, (count_1 - 1));
            length = (length - 1);
          }
        }
      }
    }
    return __dartEquals(length, 0);
  }
  hash(elements) {
    if ((elements === null)) {
      return __dartHashValue(null);
    }
    let hash_1 = 0;
    {
      let _sync_for_iterator = __dartIterator(elements);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            let c = this._elementEquality.hash(element);
            hash_1 = ((hash_1 + c) & 2147483647);
          }
        }
      }
    }
    hash_1 = ((hash_1 + (hash_1 << 3)) & 2147483647);
    hash_1 = (hash_1 ^ __dartShr(hash_1, 11));
    hash_1 = ((hash_1 + (hash_1 << 15)) & 2147483647);
    return hash_1;
  }
}

class UnorderedIterableEquality extends _UnorderedEquality {
  constructor(elementEquality = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    super(elementEquality);
  }
  isValidKey(o) {
    return o != null && typeof o !== "string" && !(o instanceof Map) && typeof o[Symbol.iterator] === "function";
  }
}

class SetEquality extends _UnorderedEquality {
  constructor(elementEquality = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    super(elementEquality);
  }
  isValidKey(o) {
    return o instanceof Set;
  }
}

class _MapEntry {
  constructor(equality, key, value) {
    this.equality = equality;
    this.key = key;
    this.value = value;
  }
  get hashCode() {
    return (((3 * this.equality._keyEquality.hash(this.key)) + (7 * this.equality._valueEquality.hash(this.value))) & 2147483647);
  }
  "=="(other) {
    return ((other instanceof _MapEntry && this.equality._keyEquality.equals(this.key, other.key)) && this.equality._valueEquality.equals(this.value, other.value));
  }
}

class MapEquality {
  constructor({ keys = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))), values = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) } = {}) {
    this._keyEquality = keys;
    this._valueEquality = values;
    Object.defineProperty(this, $Equality_interface, { value: true });
  }
  equals(map1, map2) {
    if (Object.is(map1, map2)) {
      return true;
    }
    if (((map1 === null) || (map2 === null))) {
      return false;
    }
    let length = map1.size;
    if (!(__dartEquals(length, map2.size))) {
      return false;
    }
    let equalElementCounts = new Map();
    {
      let _sync_for_iterator = __dartIterator(Array.from(map1.keys()));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let key = _sync_for_iterator.current;
          {
            let entry = new _MapEntry(this, key, __dartMapGet(map1, key));
            let count = (__dartMapGet(equalElementCounts, entry) ?? 0);
            __dartMapSet(equalElementCounts, entry, (count + 1));
          }
        }
      }
    }
    {
      let _sync_for_iterator_1 = __dartIterator(Array.from(map2.keys()));
      for (; _sync_for_iterator_1.moveNext(); ) {
        {
          let key_1 = _sync_for_iterator_1.current;
          {
            let entry_1 = new _MapEntry(this, key_1, __dartMapGet(map2, key_1));
            let count_1 = __dartMapGet(equalElementCounts, entry_1);
            if (((count_1 === null) || __dartEquals(count_1, 0))) {
              return false;
            }
            __dartMapSet(equalElementCounts, entry_1, (count_1 - 1));
          }
        }
      }
    }
    return true;
  }
  hash(map) {
    if ((map === null)) {
      return __dartHashValue(null);
    }
    let hash_1 = 0;
    {
      let _sync_for_iterator = __dartIterator(Array.from(map.keys()));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let key = _sync_for_iterator.current;
          {
            let keyHash = this._keyEquality.hash(key);
            let valueHash = this._valueEquality.hash((__dartMapGet(map, key) ?? __dartAs(v, value => true, "V")));
            hash_1 = (((hash_1 + (3 * keyHash)) + (7 * valueHash)) & 2147483647);
          }
        }
      }
    }
    hash_1 = ((hash_1 + (hash_1 << 3)) & 2147483647);
    hash_1 = (hash_1 ^ __dartShr(hash_1, 11));
    hash_1 = ((hash_1 + (hash_1 << 15)) & 2147483647);
    return hash_1;
  }
  isValidKey(o) {
    return o instanceof Map;
  }
}

class MultiEquality {
  constructor(equalities) {
    this._equalities = equalities;
    Object.defineProperty(this, $Equality_interface, { value: true });
  }
  equals(e1, e2) {
    {
      let _sync_for_iterator = __dartIterator(this._equalities);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let eq = _sync_for_iterator.current;
          {
            if (eq.isValidKey(e1)) {
              return (eq.isValidKey(e2) && eq.equals(e1, e2));
            }
          }
        }
      }
    }
    return false;
  }
  hash(e) {
    {
      let _sync_for_iterator = __dartIterator(this._equalities);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let eq = _sync_for_iterator.current;
          {
            if (eq.isValidKey(e)) {
              return eq.hash(e);
            }
          }
        }
      }
    }
    return 0;
  }
  isValidKey(o) {
    {
      let _sync_for_iterator = __dartIterator(this._equalities);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let eq = _sync_for_iterator.current;
          {
            if (eq.isValidKey(o)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }
}

class DeepCollectionEquality {
  constructor(base = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    this._base = base;
    this._unordered = false;
    Object.defineProperty(this, $Equality_interface, { value: true });
  }
  static unordered(base = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
    return $DeepCollectionEquality_unordered(DeepCollectionEquality, base);
  }
  equals(e1, e2) {
    if (e1 instanceof Set) {
      {
        return (e2 instanceof Set && new SetEquality(this).equals(e1, e2));
      }
    }
    if (e1 instanceof Map) {
      {
        return (e2 instanceof Map && new MapEquality({ keys: this, values: this }).equals(e1, e2));
      }
    }
    if (!(this._unordered)) {
      {
        if ((Array.isArray(e1) || (ArrayBuffer.isView(e1) && !(e1 instanceof DataView)))) {
          {
            return ((Array.isArray(e2) || (ArrayBuffer.isView(e2) && !(e2 instanceof DataView))) && new ListEquality(this).equals(e1, e2));
          }
        }
        if (e1 != null && typeof e1 !== "string" && !(e1 instanceof Map) && typeof e1[Symbol.iterator] === "function") {
          {
            return (e2 != null && typeof e2 !== "string" && !(e2 instanceof Map) && typeof e2[Symbol.iterator] === "function" && new IterableEquality(this).equals(e1, e2));
          }
        }
      }
    } else {
      if (e1 != null && typeof e1 !== "string" && !(e1 instanceof Map) && typeof e1[Symbol.iterator] === "function") {
        {
          if (!(__dartEquals((Array.isArray(e1) || (ArrayBuffer.isView(e1) && !(e1 instanceof DataView))), (Array.isArray(e2) || (ArrayBuffer.isView(e2) && !(e2 instanceof DataView)))))) {
            return false;
          }
          return (e2 != null && typeof e2 !== "string" && !(e2 instanceof Map) && typeof e2[Symbol.iterator] === "function" && new UnorderedIterableEquality(this).equals(e1, e2));
        }
      }
    }
    return this._base.equals(e1, e2);
  }
  hash(o) {
    if (o instanceof Set) {
      return new SetEquality(this).hash(o);
    }
    if (o instanceof Map) {
      return new MapEquality({ keys: this, values: this }).hash(o);
    }
    if (!(this._unordered)) {
      {
        if ((Array.isArray(o) || (ArrayBuffer.isView(o) && !(o instanceof DataView)))) {
          return new ListEquality(this).hash(o);
        }
        if (o != null && typeof o !== "string" && !(o instanceof Map) && typeof o[Symbol.iterator] === "function") {
          return new IterableEquality(this).hash(o);
        }
      }
    } else {
      if (o != null && typeof o !== "string" && !(o instanceof Map) && typeof o[Symbol.iterator] === "function") {
        {
          return new UnorderedIterableEquality(this).hash(o);
        }
      }
    }
    return this._base.hash(o);
  }
  isValidKey(o) {
    return ((o != null && typeof o !== "string" && !(o instanceof Map) && typeof o[Symbol.iterator] === "function" || o instanceof Map) || this._base.isValidKey(o));
  }
}

function $DeepCollectionEquality_unordered($newTarget, base = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
  const $self = Object.create($newTarget.prototype);
  Object.defineProperty($self, $Equality_interface, { value: true });
  $self._base = base;
  $self._unordered = true;
  return $self;
}

class CaseInsensitiveEquality {
  constructor() {
    Object.defineProperty(this, $Equality_interface, { value: true });
  }
  equals(string1, string2) {
    return equalsIgnoreAsciiCase(string1, string2);
  }
  hash(string) {
    return hashIgnoreAsciiCase(string);
  }
  isValidKey(object) {
    return typeof object === "string";
  }
}

class EqualityMap extends DelegatingMap {
  constructor(equality) {
    super(__dartCustomHashMap(__dartAs(__dartBind(equality, "equals"), value => typeof value === "function", "bool Function(EqualityMap.K%, EqualityMap.K%)"), __dartAs(__dartBind(equality, "hash"), value => typeof value === "function", "int Function(EqualityMap.K%)"), __dartBind(equality, "isValidKey")));
  }
  static from(equality, other) {
    return $EqualityMap_from(EqualityMap, equality, other);
  }
}

function $EqualityMap_from($newTarget, equality, other) {
  const $self = Reflect.construct(DelegatingMap, [__dartCustomHashMap(__dartAs(__dartBind(equality, "equals"), value => typeof value === "function", "bool Function(EqualityMap.K%, EqualityMap.K%)"), __dartAs(__dartBind(equality, "hash"), value => typeof value === "function", "int Function(EqualityMap.K%)"), __dartBind(equality, "isValidKey"))], $newTarget);
  $self.addAll(other);
  return $self;
}

class EqualitySet extends DelegatingSet {
  constructor(equality) {
    super(new Set());
  }
  static from(equality, other) {
    return $EqualitySet_from(EqualitySet, equality, other);
  }
}

function $EqualitySet_from($newTarget, equality, other) {
  const $self = Reflect.construct(DelegatingSet, [new Set()], $newTarget);
  $self.addAll(other);
  return $self;
}

class IterableZip {
  constructor(iterables) {
    this._iterables = iterables;
  }
  get iterator() {
    let iterators = __dartFixedList(Array.from(Array.from(this._iterables, function(x) { return __dartIterator(x); })));
    return new _IteratorZip(iterators);
  }
}

class _IteratorZip {
  constructor(iterators) {
    this._current = null;
    this._iterators = iterators;
  }
  moveNext() {
    if (__dartIterableIsEmpty(this._iterators)) {
      return false;
    }
    for (let i = 0; (i < this._iterators.length); i = (i + 1)) {
      {
        if (!(__dartIndexGet(this._iterators, i).moveNext())) {
          {
            this._current = null;
            return false;
          }
        }
      }
    }
    this._current = __dartFixedList(Array.from({ length: this._iterators.length }, (_, index) => ((i) => { return __dartIndexGet(this._iterators, i).current; })(index)));
    return true;
  }
  get current() {
    return (this._current ?? (() => { throw __dartCoreError("StateError", "No element"); })());
  }
}

class ListSlice {
  constructor(source, start, end) {
    this.source = source;
    this.start = start;
    this.length = (end - start);
    this._initialSize = source.length;
    __dartCheckValidRange(this.start, end, this.source.length, null, null, null);
  }
  static _(_initialSize, source, start, length) {
    return $ListSlice__(ListSlice, _initialSize, source, start, length);
  }
  get end() {
    return (this.start + this.length);
  }
  "[]"(index) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    __dartCheckValidIndex(index, this, null, this.length, null);
    return __dartIndexGet(this.source, (this.start + index));
  }
  "[]="(index, value) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    __dartCheckValidIndex(index, this, null, this.length, null);
    __dartIndexSet(this.source, (this.start + index), value);
  }
  setRange(start, end, iterable, skipCount = 0) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    __dartCheckValidRange(start, end, this.length, null, null, null);
    __dartListSetRange(this.source, (start + start), (start + end), iterable, skipCount);
  }
  slice(start, end = null) {
    end = __dartCheckValidRange(start, end, this.length, null, null, null);
    return ListSlice._(this._initialSize, this.source, (this.start + start), (end - start));
  }
  shuffle(random = null) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    shuffle(this.source, this.start, this.end, random);
  }
  sort(compare = null) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    ((compare === null) ? compare = defaultCompare : null);
    quickSort(this.source, compare, this.start, (this.start + this.length));
  }
  sortRange(start, end, compare) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    ListExtensions_sortRange(this.source, start, end, compare);
  }
  shuffleRange(start, end, random = null) {
    if (!(__dartEquals(this.source.length, this._initialSize))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this.source); })();
      }
    }
    __dartCheckValidRange(start, end, this.length, null, null, null);
    shuffle(this.source, (this.start + start), (this.start + end), random);
  }
  reverseRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    ListExtensions_reverseRange(this.source, (this.start + start), (this.start + end));
  }
  set length(newLength) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot change the length of a fixed-length list"); })();
  }
  add(element) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot add to a fixed-length list"); })();
  }
  insert(index, element) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot add to a fixed-length list"); })();
  }
  insertAll(index, iterable) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot add to a fixed-length list"); })();
  }
  addAll(iterable) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot add to a fixed-length list"); })();
  }
  remove(element) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot remove from a fixed-length list"); })();
  }
  removeWhere(test) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot remove from a fixed-length list"); })();
  }
  retainWhere(test) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot remove from a fixed-length list"); })();
  }
  clear() {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot clear a fixed-length list"); })();
  }
  removeAt(index) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot remove from a fixed-length list"); })();
  }
  removeLast() {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot remove from a fixed-length list"); })();
  }
  removeRange(start, end) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot remove from a fixed-length list"); })();
  }
  replaceRange(start, end, newContents) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot remove from a fixed-length list"); })();
  }
}

function $ListSlice__($newTarget, _initialSize, source, start, length) {
  const $self = Object.create($newTarget.prototype);
  $self._initialSize = _initialSize;
  $self.source = source;
  $self.start = start;
  $self.length = length;
  return $self;
}

class PriorityQueue {
  constructor(comparison = null) {
    if (new.target === PriorityQueue) {
      return new HeapPriorityQueue(comparison);
    }
  }
  get length() {
    throw new TypeError("Abstract member PriorityQueue.length");
  }
  set length(value) {
    Object.defineProperty(this, "length", { value, writable: true, configurable: true, enumerable: true });
  }
  get isEmpty() {
    throw new TypeError("Abstract member PriorityQueue.isEmpty");
  }
  set isEmpty(value) {
    Object.defineProperty(this, "isEmpty", { value, writable: true, configurable: true, enumerable: true });
  }
  get isNotEmpty() {
    throw new TypeError("Abstract member PriorityQueue.isNotEmpty");
  }
  set isNotEmpty(value) {
    Object.defineProperty(this, "isNotEmpty", { value, writable: true, configurable: true, enumerable: true });
  }
  contains(object) {
    throw new TypeError("Abstract member PriorityQueue.contains");
  }
  get unorderedElements() {
    throw new TypeError("Abstract member PriorityQueue.unorderedElements");
  }
  set unorderedElements(value) {
    Object.defineProperty(this, "unorderedElements", { value, writable: true, configurable: true, enumerable: true });
  }
  add(element) {
    throw new TypeError("Abstract member PriorityQueue.add");
  }
  addAll(elements) {
    throw new TypeError("Abstract member PriorityQueue.addAll");
  }
  get first() {
    throw new TypeError("Abstract member PriorityQueue.first");
  }
  set first(value) {
    Object.defineProperty(this, "first", { value, writable: true, configurable: true, enumerable: true });
  }
  removeFirst() {
    throw new TypeError("Abstract member PriorityQueue.removeFirst");
  }
  remove(element) {
    throw new TypeError("Abstract member PriorityQueue.remove");
  }
  removeAll() {
    throw new TypeError("Abstract member PriorityQueue.removeAll");
  }
  clear() {
    throw new TypeError("Abstract member PriorityQueue.clear");
  }
  toList() {
    throw new TypeError("Abstract member PriorityQueue.toList");
  }
  toUnorderedList() {
    throw new TypeError("Abstract member PriorityQueue.toUnorderedList");
  }
  toSet() {
    throw new TypeError("Abstract member PriorityQueue.toSet");
  }
}
Object.defineProperty(PriorityQueue, Symbol.hasInstance, { value(value) { return value != null && value[$PriorityQueue_interface] === true; } });

class HeapPriorityQueue {
  constructor(comparison = null) {
    this._queue = __dartFixedList(new Array(7).fill(null));
    this._length = 0;
    this._modificationCount = 0;
    this.comparison = (comparison ?? defaultCompare);
    Object.defineProperty(this, $PriorityQueue_interface, { value: true });
  }
  _elementAt(index) {
    return (__dartIndexGet(this._queue, index) ?? (null ?? __dartAs(v, value => true, "E")));
  }
  add(element) {
    this._modificationCount = (this._modificationCount + 1);
    this._add(element);
  }
  addAll(elements) {
    let modified = 0;
    {
      let _sync_for_iterator = __dartIterator(elements);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            modified = 1;
            this._add(element);
          }
        }
      }
    }
    this._modificationCount = (this._modificationCount + modified);
  }
  clear() {
    this._modificationCount = (this._modificationCount + 1);
    this._queue = __dartConst("[\"list\",\"NeverType(Never)\"]", () => Object.freeze([]));
    this._length = 0;
  }
  contains(object) {
    return (this._locate(object) >= 0);
  }
  get unorderedElements() {
    return new _UnorderedElementsIterable(this);
  }
  get first() {
    if (__dartEquals(this._length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return this._elementAt(0);
  }
  get isEmpty() {
    return __dartEquals(this._length, 0);
  }
  get isNotEmpty() {
    return !(__dartEquals(this._length, 0));
  }
  get length() {
    return this._length;
  }
  remove(element) {
    let index = this._locate(element);
    if ((index < 0)) {
      return false;
    }
    this._modificationCount = (this._modificationCount + 1);
    let last = this._removeLast();
    if ((index < this._length)) {
      {
        let comp = (() => { let v = last; return (() => { let v_1 = element; return (this.comparison)(v, v_1); })(); })();
        if ((comp <= 0)) {
          {
            this._bubbleUp(last, index);
          }
        } else {
          {
            this._bubbleDown(last, index);
          }
        }
      }
    }
    return true;
  }
  removeAll() {
    this._modificationCount = (this._modificationCount + 1);
    let result = this._queue;
    let length = this._length;
    this._queue = __dartConst("[\"list\",\"NeverType(Never)\"]", () => Object.freeze([]));
    this._length = 0;
    return Array.from(Array.from(result).slice(0, length), (value) => __dartAs(value, (value) => true, "TypeParameterType(HeapPriorityQueue.E%)"));
  }
  removeFirst() {
    if (__dartEquals(this._length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    this._modificationCount = (this._modificationCount + 1);
    let result = this._elementAt(0);
    let last = this._removeLast();
    if ((this._length > 0)) {
      {
        this._bubbleDown(last, 0);
      }
    }
    return result;
  }
  toList() {
    return (() => { let v = this._toUnorderedList(); return (() => {
      __dartListSort(v, this.comparison);
      return v;
    })(); })();
  }
  toSet() {
    let set = __dartSplayTreeSet(this.comparison, null);
    for (let i = 0; (i < this._length); i = (i + 1)) {
      {
        __dartSetAdd(set, this._elementAt(i));
      }
    }
    return set;
  }
  toUnorderedList() {
    return this._toUnorderedList();
  }
  _toUnorderedList() {
    return (() => {
      const v = new Array(0).fill(null);
      for (let i = 0; (i < this._length); i = (i + 1)) {
        (v.push(this._elementAt(i)), null);
      }
      return v;
    })();
  }
  toString() {
    return __dartStr(Array.from(this._queue).slice(0, this._length));
  }
  _add(element) {
    if (__dartEquals(this._length, this._queue.length)) {
      this._grow();
    }
    this._bubbleUp(element, (() => { let v = this._length; return (() => { let v_1 = this._length = (v + 1); return v; })(); })());
  }
  _locate(object) {
    if (__dartEquals(this._length, 0)) {
      return (-1);
    }
    let position = 1;
    do {
      L:
      {
        let index = (position - 1);
        let element = this._elementAt(index);
        let comp = (() => { let v = element; return (() => { let v_1 = object; return (this.comparison)(v, v_1); })(); })();
        if ((comp <= 0)) {
          {
            if ((__dartEquals(comp, 0) && __dartEquals(element, object))) {
              return index;
            }
            let leftChildPosition = (position * 2);
            if ((leftChildPosition <= this._length)) {
              {
                position = leftChildPosition;
                break L;
              }
            }
          }
        }
        do {
          {
            while ((Math.trunc(position) % 2 !== 0)) {
              {
                position = __dartShr(position, 1);
              }
            }
            position = (position + 1);
          }
        } while ((position > this._length));
      }
    } while (!(__dartEquals(position, 1)));
    return (-1);
  }
  _removeLast() {
    let newLength = (this._length - 1);
    let last = this._elementAt(newLength);
    __dartIndexSet(this._queue, newLength, null);
    this._length = newLength;
    return last;
  }
  _bubbleUp(element, index) {
    L:
    while ((index > 0)) {
      {
        let parentIndex = __dartTruncDiv((index - 1), 2);
        let parent = this._elementAt(parentIndex);
        if (((() => { let v = element; return (() => { let v_1 = parent; return (this.comparison)(v, v_1); })(); })() > 0)) {
          break L;
        }
        __dartIndexSet(this._queue, index, parent);
        index = parentIndex;
      }
    }
    __dartIndexSet(this._queue, index, element);
  }
  _bubbleDown(element, index) {
    let rightChildIndex = ((index * 2) + 2);
    while ((rightChildIndex < this._length)) {
      {
        let leftChildIndex = (rightChildIndex - 1);
        let leftChild = this._elementAt(leftChildIndex);
        let rightChild = this._elementAt(rightChildIndex);
        let comp = (() => { let v = leftChild; return (() => { let v_1 = rightChild; return (this.comparison)(v, v_1); })(); })();
        let minChildIndex = null;
        let minChild = null;
        if ((comp < 0)) {
          {
            minChild = leftChild;
            minChildIndex = leftChildIndex;
          }
        } else {
          {
            minChild = rightChild;
            minChildIndex = rightChildIndex;
          }
        }
        comp = (() => { let v_2 = element; return (() => { let v_3 = minChild; return (this.comparison)(v_2, v_3); })(); })();
        if ((comp <= 0)) {
          {
            __dartIndexSet(this._queue, index, element);
            return;
          }
        }
        __dartIndexSet(this._queue, index, minChild);
        index = minChildIndex;
        rightChildIndex = ((index * 2) + 2);
      }
    }
    let leftChildIndex_1 = (rightChildIndex - 1);
    if ((leftChildIndex_1 < this._length)) {
      {
        let child = this._elementAt(leftChildIndex_1);
        let comp_1 = (() => { let v_4 = element; return (() => { let v_5 = child; return (this.comparison)(v_4, v_5); })(); })();
        if ((comp_1 > 0)) {
          {
            __dartIndexSet(this._queue, index, child);
            index = leftChildIndex_1;
          }
        }
      }
    }
    __dartIndexSet(this._queue, index, element);
  }
  _grow() {
    let newCapacity = ((this._queue.length * 2) + 1);
    if ((newCapacity < 7)) {
      newCapacity = 7;
    }
    let newQueue = __dartFixedList(new Array(newCapacity).fill(null));
    __dartListSetRange(newQueue, 0, this._length, this._queue, 0);
    this._queue = newQueue;
  }
}

class _UnorderedElementsIterable {
  constructor(_queue) {
    this._queue = _queue;
  }
  get iterator() {
    return new _UnorderedElementsIterator(this._queue);
  }
}

class _UnorderedElementsIterator {
  constructor(_queue) {
    this._current = null;
    this._index = (-1);
    this._queue = _queue;
    this._initialModificationCount = _queue._modificationCount;
  }
  moveNext() {
    if (!(__dartEquals(this._initialModificationCount, this._queue._modificationCount))) {
      {
        (() => { throw __dartCoreError("ConcurrentModificationError", this._queue); })();
      }
    }
    let nextIndex = (this._index + 1);
    if (((0 <= nextIndex) && (nextIndex < this._queue.length))) {
      {
        this._current = __dartIndexGet(this._queue._queue, nextIndex);
        this._index = nextIndex;
        return true;
      }
    }
    this._current = null;
    this._index = (-2);
    return false;
  }
  get current() {
    return ((this._index < 0) ? (() => { throw __dartCoreError("StateError", "No element"); })() : (this._current ?? (null ?? __dartAs(v, value => true, "E"))));
  }
}

class _QueueList_Object_ListMixin {
  constructor() {
  }
  add(element) {
    __dartIndexSet(this, (() => { let v = this.length; return (() => { let v_1 = this.length = (v + 1); return v; })(); })(), element);
  }
  addAll(iterable) {
    let i = this.length;
    {
      let _sync_for_iterator = __dartIterator(iterable);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            this.add(element);
            i = (i + 1);
          }
        }
      }
    }
  }
  cast() {
    return Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(_QueueList&Object&ListMixin.cast.R%)"));
  }
  toString() {
    return ("[" + Array.from(this, (value) => __dartStr(value)).join(", ") + "]");
  }
  removeLast() {
    if (__dartEquals(this.length, 0)) {
      {
        (() => { throw __dartCoreError("StateError", "No element"); })();
      }
    }
    let result = __dartIndexGet(this, (this.length - 1));
    this.length = (this.length - 1);
    return result;
  }
  get first() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return __dartIndexGet(this, 0);
  }
  set first(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    __dartIndexSet(this, 0, value);
  }
  get last() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return __dartIndexGet(this, (this.length - 1));
  }
  set last(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    __dartIndexSet(this, (this.length - 1), value);
  }
  get iterator() {
    return __dartIterator(this);
  }
  elementAt(index) {
    return __dartIndexGet(this, index);
  }
  followedBy(other) {
    return Array.from(this).concat(Array.from(other));
  }
  forEach(action) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        (action)(__dartIndexGet(this, i));
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
  }
  get isEmpty() {
    return __dartEquals(this.length, 0);
  }
  get isNotEmpty() {
    return !(this.length === 0);
  }
  get single() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    if ((this.length > 1)) {
      (() => { throw __dartCoreError("StateError", "Too many elements"); })();
    }
    return __dartIndexGet(this, 0);
  }
  contains(element) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          return true;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return false;
  }
  every(test) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (!((test)(__dartIndexGet(this, i)))) {
          return false;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return true;
  }
  any(test) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if ((test)(__dartIndexGet(this, i))) {
          return true;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return false;
  }
  firstWhere(test, { orElse = null } = {}) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = __dartIndexGet(this, i);
        if ((test)(element)) {
          return element;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  lastWhere(test, { orElse = null } = {}) {
    let length = this.length;
    for (let i = (length - 1); (i >= 0); i = (i - 1)) {
      {
        let element = __dartIndexGet(this, i);
        if ((test)(element)) {
          return element;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  singleWhere(test, { orElse = null } = {}) {
    let length = this.length;
    const match = __dartLazyField("match", null, true, null);
    let matchFound = false;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = __dartIndexGet(this, i);
        if ((test)(element)) {
          {
            if (matchFound) {
              {
                (() => { throw __dartCoreError("StateError", "Too many elements"); })();
              }
            }
            matchFound = true;
            match.set(element);
          }
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (matchFound) {
      return match.get();
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  join(separator_1 = "") {
    if (__dartEquals(this.length, 0)) {
      return "";
    }
    let buffer = (() => { let v = __dartStringBuffer(""); return (() => {
      v.writeAll(this, separator_1);
      return v;
    })(); })();
    return __dartStr(buffer);
  }
  where(test) {
    return Array.from(this).filter((value) => test(value));
  }
  whereType() {
    return Array.from(this).filter((value) => true);
  }
  map(f) {
    return Array.from(this, (value) => f(value));
  }
  expand(f) {
    return Array.from(this).flatMap((value) => Array.from(f(value)));
  }
  reduce(combine) {
    let length = this.length;
    if (__dartEquals(length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    let value = __dartIndexGet(this, 0);
    for (let i = 1; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, __dartIndexGet(this, i));
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return value;
  }
  fold(initialValue, combine) {
    let value = initialValue;
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, __dartIndexGet(this, i));
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return value;
  }
  skip(count) {
    return Array.from(this).slice(count, null ?? undefined);
  }
  skipWhile(test) {
    return __dartIterableSkipWhile(this, test);
  }
  take(count) {
    return Array.from(this).slice(0, __dartNullCheck(count) ?? undefined);
  }
  takeWhile(test) {
    return __dartIterableTakeWhile(this, test);
  }
  toList({ growable = true } = {}) {
    if (this.length === 0) {
      return (growable ? [] : __dartFixedList([]));
    }
    let first = __dartIndexGet(this, 0);
    let result = (growable ? new Array(this.length).fill(first) : __dartFixedList(new Array(this.length).fill(first)));
    for (let i = 1; (i < this.length); i = (i + 1)) {
      {
        __dartIndexSet(result, i, __dartIndexGet(this, i));
      }
    }
    return result;
  }
  toSet() {
    let result = new Set();
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        __dartSetAdd(result, __dartIndexGet(this, i));
      }
    }
    return result;
  }
  remove(element) {
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          {
            this._closeGap(i, (i + 1));
            return true;
          }
        }
      }
    }
    return false;
  }
  _closeGap(start, end) {
    let length = this.length;
    let size = (end - start);
    for (let i = end; (i < length); i = (i + 1)) {
      {
        __dartIndexSet(this, (i - size), __dartIndexGet(this, i));
      }
    }
    this.length = (length - size);
  }
  removeWhere(test) {
    this._filter(test, false);
  }
  retainWhere(test) {
    this._filter(test, true);
  }
  _filter(test, retainMatching) {
    let retained = new Array(0).fill(null);
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = __dartIndexGet(this, i);
        if (__dartEquals((test)(element), retainMatching)) {
          {
            (retained.push(element), null);
          }
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!(__dartEquals(retained.length, this.length))) {
      {
        __dartListSetRange(this, 0, retained.length, retained, 0);
        this.length = retained.length;
      }
    }
  }
  clear() {
    this.length = 0;
  }
  sort(compare = null) {
    __dartListSort(this, (compare ?? ((left, right) => __dartCompare(left, right))));
  }
  shuffle(random = null) {
    ((random === null) ? random = __dartRandom(null, false) : null);
    let length = this.length;
    while ((length > 1)) {
      {
        let pos = random.nextInt(length);
        length = (length - 1);
        let tmp = __dartIndexGet(this, length);
        __dartIndexSet(this, length, __dartIndexGet(this, pos));
        __dartIndexSet(this, pos, tmp);
      }
    }
  }
  asMap() {
    return new Map(Array.from(this, (value, index) => [index, value]));
  }
  "+"(other) {
    return (() => {
      const v = Array.from(this);
      (v.push(...Array.from(other)), null);
      return v;
    })();
  }
  sublist(start, end = null) {
    let listLength = this.length;
    ((end === null) ? end = listLength : null);
    __dartCheckValidRange(start, end, listLength, null, null, null);
    return Array.from(this.slice(start, end));
  }
  getRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    return Array.from(this).slice(start, end ?? undefined);
  }
  removeRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if ((end > start)) {
      {
        this._closeGap(start, end);
      }
    }
  }
  fillRange(start, end, fill = null) {
    let value = (fill ?? (v ?? __dartAs(v_1, value => true, "E")));
    __dartCheckValidRange(start, end, this.length, null, null, null);
    for (let i = start; (i < end); i = (i + 1)) {
      {
        __dartIndexSet(this, i, value);
      }
    }
  }
  setRange(start, end, iterable, skipCount = 0) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    let length = (end - start);
    if (__dartEquals(length, 0)) {
      return;
    }
    __dartCheckNotNegative(skipCount, "skipCount", null);
    let otherList = null;
    let otherStart = null;
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        otherList = iterable;
        otherStart = skipCount;
      }
    } else {
      {
        otherList = __dartFixedList(Array.from(Array.from(iterable).slice(skipCount)));
        otherStart = 0;
      }
    }
    if (((otherStart + length) > otherList.length)) {
      {
        (() => { throw __dartCoreError("StateError", "Too few elements"); })();
      }
    }
    if ((otherStart < start)) {
      {
        for (let i = (length - 1); (i >= 0); i = (i - 1)) {
          {
            __dartIndexSet(this, (start + i), __dartIndexGet(otherList, (otherStart + i)));
          }
        }
      }
    } else {
      {
        for (let i_1 = 0; (i_1 < length); i_1 = (i_1 + 1)) {
          {
            __dartIndexSet(this, (start + i_1), __dartIndexGet(otherList, (otherStart + i_1)));
          }
        }
      }
    }
  }
  replaceRange(start, end, newContents) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if (__dartEquals(start, this.length)) {
      {
        this.addAll(newContents);
        return;
      }
    }
    if (!(newContents != null && typeof newContents !== "string" && typeof newContents.length === "number" && typeof newContents[Symbol.iterator] === "function")) {
      {
        newContents = Array.from(newContents);
      }
    }
    let removeLength = (end - start);
    let insertLength = __dartIterableLength(newContents);
    if ((removeLength >= insertLength)) {
      {
        let insertEnd = (start + insertLength);
        __dartListSetRange(this, start, insertEnd, newContents, 0);
        if ((removeLength > insertLength)) {
          {
            this._closeGap(insertEnd, end);
          }
        }
      }
    } else {
      if (__dartEquals(end, this.length)) {
        {
          let i = start;
          {
            let _sync_for_iterator = __dartIterator(newContents);
            for (; _sync_for_iterator.moveNext(); ) {
              {
                let element = _sync_for_iterator.current;
                {
                  if ((i < end)) {
                    {
                      __dartIndexSet(this, i, element);
                    }
                  } else {
                    {
                      this.add(element);
                    }
                  }
                  i = (i + 1);
                }
              }
            }
          }
        }
      } else {
        {
          let delta = (insertLength - removeLength);
          let oldLength = this.length;
          let insertEnd_1 = (start + insertLength);
          for (let i_1 = (oldLength - delta); (i_1 < oldLength); i_1 = (i_1 + 1)) {
            {
              this.add(__dartIndexGet(this, ((i_1 > 0) ? i_1 : 0)));
            }
          }
          if ((insertEnd_1 < oldLength)) {
            {
              __dartListSetRange(this, insertEnd_1, oldLength, this, end);
            }
          }
          __dartListSetRange(this, start, insertEnd_1, newContents, 0);
        }
      }
    }
  }
  indexOf(element, start = 0) {
    if ((start < 0)) {
      start = 0;
    }
    for (let i = start; (i < this.length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          return i;
        }
      }
    }
    return (-1);
  }
  indexWhere(test, start = 0) {
    if ((start < 0)) {
      start = 0;
    }
    for (let i = start; (i < this.length); i = (i + 1)) {
      {
        if ((test)(__dartIndexGet(this, i))) {
          return i;
        }
      }
    }
    return (-1);
  }
  lastIndexOf(element, start = null) {
    if (((start === null) || (start >= this.length))) {
      start = (this.length - 1);
    }
    for (let i = start; (i >= 0); i = (i - 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          return i;
        }
      }
    }
    return (-1);
  }
  lastIndexWhere(test, start = null) {
    if (((start === null) || (start >= this.length))) {
      start = (this.length - 1);
    }
    for (let i = start; (i >= 0); i = (i - 1)) {
      {
        if ((test)(__dartIndexGet(this, i))) {
          return i;
        }
      }
    }
    return (-1);
  }
  insert(index, element) {
    __dartNullCheck(index);
    let length = this.length;
    __dartCheckValueInInterval(index, 0, length, "index", null);
    this.add(element);
    if (!(__dartEquals(index, length))) {
      {
        __dartListSetRange(this, (index + 1), (length + 1), this, index);
        __dartIndexSet(this, index, element);
      }
    }
  }
  removeAt(index) {
    let result = __dartIndexGet(this, index);
    this._closeGap(index, (index + 1));
    return result;
  }
  insertAll(index, iterable) {
    __dartCheckValueInInterval(index, 0, this.length, "index", null);
    if (__dartEquals(index, this.length)) {
      {
        this.addAll(iterable);
        return;
      }
    }
    if ((!(iterable != null && typeof iterable !== "string" && typeof iterable.length === "number" && typeof iterable[Symbol.iterator] === "function") || Object.is(iterable, this))) {
      {
        iterable = Array.from(iterable);
      }
    }
    let insertionLength = __dartIterableLength(iterable);
    if (__dartEquals(insertionLength, 0)) {
      {
        return;
      }
    }
    let oldLength = this.length;
    for (let i = (oldLength - insertionLength); (i < oldLength); i = (i + 1)) {
      {
        this.add(__dartIndexGet(this, ((i > 0) ? i : 0)));
      }
    }
    if (!(__dartEquals(__dartIterableLength(iterable), insertionLength))) {
      {
        this.length = (this.length - insertionLength);
        (() => { throw __dartCoreError("ConcurrentModificationError", iterable); })();
      }
    }
    let oldCopyStart = (index + insertionLength);
    if ((oldCopyStart < oldLength)) {
      {
        __dartListSetRange(this, oldCopyStart, oldLength, this, index);
      }
    }
    __dartListSetAll(this, index, iterable);
  }
  setAll(index, iterable) {
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        __dartListSetRange(this, index, (index + __dartIterableLength(iterable)), iterable, 0);
      }
    } else {
      {
        {
          let _sync_for_iterator = __dartIterator(iterable);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let element = _sync_for_iterator.current;
              {
                __dartIndexSet(this, (() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element);
              }
            }
          }
        }
      }
    }
  }
  get reversed() {
    return Array.from(this).reverse();
  }
}

class QueueList extends _QueueList_Object_ListMixin {
  constructor(initialCapacity = null) {
    return $QueueList__init(new.target, QueueList._computeInitialCapacity(initialCapacity));
  }
  static _init(initialCapacity) {
    return $QueueList__init(QueueList, initialCapacity);
  }
  static _(_head, _tail, _table) {
    return $QueueList__(QueueList, _head, _tail, _table);
  }
  static _castFrom(source) {
    return new _CastQueueList(source);
  }
  static from(source) {
    if ((Array.isArray(source) || (ArrayBuffer.isView(source) && !(source instanceof DataView)))) {
      {
        let length = __dartIterableLength(source);
        let queue = new QueueList((length + 1));
        let sourceList = source;
        __dartListSetRange(queue._table, 0, length, sourceList, 0);
        queue._tail = length;
        return queue;
      }
    } else {
      {
        return (() => { let v = new QueueList(); return (() => {
          v.addAll(source);
          return v;
        })(); })();
      }
    }
  }
  static _computeInitialCapacity(initialCapacity) {
    if (((initialCapacity === null) || (initialCapacity < 8))) {
      {
        return 8;
      }
    }
    initialCapacity = (initialCapacity + 1);
    if (QueueList._isPowerOf2(initialCapacity)) {
      {
        return initialCapacity;
      }
    }
    return QueueList._nextPowerOf2(initialCapacity);
  }
  add(element) {
    this._add(element);
  }
  addAll(iterable) {
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        let list = iterable;
        let addCount = __dartIterableLength(list);
        let length = this.length;
        if (((length + addCount) >= this._table.length)) {
          {
            this._preGrow((length + addCount));
            __dartListSetRange(this._table, length, (length + addCount), list, 0);
            this._tail = (this._tail + addCount);
          }
        } else {
          {
            let endSpace = (this._table.length - this._tail);
            if ((addCount < endSpace)) {
              {
                __dartListSetRange(this._table, this._tail, (this._tail + addCount), list, 0);
                this._tail = (this._tail + addCount);
              }
            } else {
              {
                let preSpace = (addCount - endSpace);
                __dartListSetRange(this._table, this._tail, (this._tail + endSpace), list, 0);
                __dartListSetRange(this._table, 0, preSpace, list, endSpace);
                this._tail = preSpace;
              }
            }
          }
        }
      }
    } else {
      {
        {
          let _sync_for_iterator = __dartIterator(iterable);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let element = _sync_for_iterator.current;
              {
                this._add(element);
              }
            }
          }
        }
      }
    }
  }
  cast() {
    return QueueList._castFrom(this);
  }
  retype() {
    return this.cast();
  }
  toString() {
    return ("{" + Array.from(this, (value) => __dartStr(value)).join(", ") + "}");
  }
  addLast(element) {
    this._add(element);
  }
  addFirst(element) {
    this._head = ((this._head - 1) & (this._table.length - 1));
    __dartIndexSet(this._table, this._head, element);
    if (__dartEquals(this._head, this._tail)) {
      this._grow();
    }
  }
  removeFirst() {
    if (__dartEquals(this._head, this._tail)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    let result = (__dartIndexGet(this._table, this._head) ?? __dartAs(v, value => true, "E"));
    __dartIndexSet(this._table, this._head, null);
    this._head = ((this._head + 1) & (this._table.length - 1));
    return result;
  }
  removeLast() {
    if (__dartEquals(this._head, this._tail)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    this._tail = ((this._tail - 1) & (this._table.length - 1));
    let result = (__dartIndexGet(this._table, this._tail) ?? __dartAs(v, value => true, "E"));
    __dartIndexSet(this._table, this._tail, null);
    return result;
  }
  get length() {
    return ((this._tail - this._head) & (this._table.length - 1));
  }
  set length(value) {
    if ((value < 0)) {
      (() => { throw __dartCoreError("RangeError", "Length " + __dartStr(value) + " may not be negative."); })();
    }
    if (((value > this.length) && !(true))) {
      {
        (() => { throw __dartCoreError("UnsupportedError", "The length can only be increased when the element type is " + "nullable, but the current element type is `" + __dartStr(__dartType("E")) + "`."); })();
      }
    }
    let delta = (value - this.length);
    if ((delta >= 0)) {
      {
        if ((this._table.length <= value)) {
          {
            this._preGrow(value);
          }
        }
        this._tail = ((this._tail + delta) & (this._table.length - 1));
        return;
      }
    }
    let newTail = (this._tail + delta);
    if ((newTail >= 0)) {
      {
        (this._table.fill(null, newTail, this._tail), null);
      }
    } else {
      {
        newTail = (newTail + this._table.length);
        (this._table.fill(null, 0, this._tail), null);
        (this._table.fill(null, newTail, this._table.length), null);
      }
    }
    this._tail = newTail;
  }
  "[]"(index) {
    if (((index < 0) || (index >= this.length))) {
      {
        (() => { throw __dartCoreError("RangeError", "Index " + __dartStr(index) + " must be in the range [0.." + __dartStr(this.length) + ")."); })();
      }
    }
    return (__dartIndexGet(this._table, ((this._head + index) & (this._table.length - 1))) ?? __dartAs(v, value => true, "E"));
  }
  "[]="(index, value) {
    if (((index < 0) || (index >= this.length))) {
      {
        (() => { throw __dartCoreError("RangeError", "Index " + __dartStr(index) + " must be in the range [0.." + __dartStr(this.length) + ")."); })();
      }
    }
    __dartIndexSet(this._table, ((this._head + index) & (this._table.length - 1)), value);
  }
  static _isPowerOf2(number) {
    return __dartEquals((number & (number - 1)), 0);
  }
  static _nextPowerOf2(number) {
    number = ((number << 1) - 1);
    for (; ; ) {
      {
        let nextNumber = (number & (number - 1));
        if (__dartEquals(nextNumber, 0)) {
          return number;
        }
        number = nextNumber;
      }
    }
  }
  _add(element) {
    __dartIndexSet(this._table, this._tail, element);
    this._tail = ((this._tail + 1) & (this._table.length - 1));
    if (__dartEquals(this._head, this._tail)) {
      this._grow();
    }
  }
  _grow() {
    let newTable = __dartFixedList(new Array((this._table.length * 2)).fill(null));
    let split_1 = (this._table.length - this._head);
    __dartListSetRange(newTable, 0, split_1, this._table, this._head);
    __dartListSetRange(newTable, split_1, (split_1 + this._head), this._table, 0);
    this._head = 0;
    this._tail = this._table.length;
    this._table = newTable;
  }
  _writeToList(target) {
    if ((this._head <= this._tail)) {
      {
        let length = (this._tail - this._head);
        __dartListSetRange(target, 0, length, this._table, this._head);
        return length;
      }
    } else {
      {
        let firstPartSize = (this._table.length - this._head);
        __dartListSetRange(target, 0, firstPartSize, this._table, this._head);
        __dartListSetRange(target, firstPartSize, (firstPartSize + this._tail), this._table, 0);
        return (this._tail + firstPartSize);
      }
    }
  }
  _preGrow(newElementCount) {
    newElementCount = (newElementCount + __dartShr(newElementCount, 1));
    let newCapacity = QueueList._nextPowerOf2(newElementCount);
    let newTable = __dartFixedList(new Array(newCapacity).fill(null));
    this._tail = this._writeToList(newTable);
    this._table = newTable;
    this._head = 0;
  }
}

function $QueueList__init($newTarget, initialCapacity) {
  const $self = Reflect.construct(_QueueList_Object_ListMixin, [], $newTarget);
  $self._table = __dartFixedList(new Array(initialCapacity).fill(null));
  $self._head = 0;
  $self._tail = 0;
  return $self;
}

function $QueueList__($newTarget, _head, _tail, _table) {
  const $self = Reflect.construct(_QueueList_Object_ListMixin, [], $newTarget);
  $self._head = _head;
  $self._tail = _tail;
  $self._table = _table;
  return $self;
}

class _CastQueueList extends QueueList {
  constructor(_delegate) {
    const $self = $QueueList__(new.target, (-1), (-1), Array.from(_delegate._table, (value) => __dartAs(value, (value) => true, "TypeParameterType(_CastQueueList.T%)")));
    $self._delegate = _delegate;
    return $self;
  }
  get _head() {
    return this._delegate._head;
  }
  set _head(value) {
    return this._delegate._head = value;
  }
  get _tail() {
    return this._delegate._tail;
  }
  set _tail(value) {
    return this._delegate._tail = value;
  }
}

class _UnionSet_SetBase_UnmodifiableSetMixin {
  constructor() {
    Object.defineProperty(this, $UnmodifiableSetMixin_interface, { value: true });
  }
  add(value) {
    return UnmodifiableSetMixin._throw();
  }
  addAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  remove(value) {
    return UnmodifiableSetMixin._throw();
  }
  removeAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  retainAll(elements) {
    return UnmodifiableSetMixin._throw();
  }
  removeWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  retainWhere(test) {
    return UnmodifiableSetMixin._throw();
  }
  clear() {
    return UnmodifiableSetMixin._throw();
  }
}

class UnionSet extends _UnionSet_SetBase_UnmodifiableSetMixin {
  constructor(sets, { disjoint = false } = {}) {
    super();
    this._sets = sets;
    this._disjoint = disjoint;
  }
  static from(sets, { disjoint = false } = {}) {
    return $UnionSet_from(UnionSet, sets, { disjoint: disjoint });
  }
  get length() {
    return (this._disjoint ? Array.from(this._sets).reduce((previous, value) => (function(length, set) { return (length + set.size); })(previous, value), 0) : __dartIterableLength(this._iterable));
  }
  get iterator() {
    return __dartIterator(this._iterable);
  }
  get _iterable() {
    let allElements = Array.from(this._sets).flatMap((value) => Array.from((function(set) { return set; })(value)));
    return (this._disjoint ? allElements : Array.from(allElements).filter(__dartAs(__dartBind((() => {
      const v = new Set();
      return v;
    })(), "add"), value => typeof value === "function", "bool Function(UnionSet.E%)")));
  }
  contains(element) {
    return Array.from(this._sets).some(function(set) { return __dartIterableContains(set, element); });
  }
  lookup(element) {
    {
      let _sync_for_iterator = __dartIterator(this._sets);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let set = _sync_for_iterator.current;
          {
            let result = __dartSetLookup(set, element);
            if ((!((result === null)) || __dartIterableContains(set, null))) {
              return result;
            }
          }
        }
      }
    }
    return null;
  }
  toSet() {
    return (() => {
      const v = new Set();
      {
        let _sync_for_iterator = __dartIterator(this._sets);
        for (; _sync_for_iterator.moveNext(); ) {
          {
            let set = _sync_for_iterator.current;
            __dartSetAddAll(v, set);
          }
        }
      }
      return v;
    })();
  }
}

function $UnionSet_from($newTarget, sets, { disjoint = false } = {}) {
  return Reflect.construct(UnionSet, [__dartSetFrom(sets), { disjoint: disjoint }], $newTarget);
}

class UnionSetController {
  constructor({ disjoint = false } = {}) {
    return $UnionSetController__(new.target, (() => {
      const v = new Set();
      return v;
    })(), disjoint);
  }
  static _(_sets, disjoint) {
    return $UnionSetController__(UnionSetController, _sets, disjoint);
  }
  add(component) {
    __dartSetAdd(this._sets, component);
  }
  remove(component) {
    return __dartSetRemove(this._sets, component);
  }
}

function $UnionSetController__($newTarget, _sets, disjoint) {
  const $self = Object.create($newTarget.prototype);
  $self._sets = _sets;
  $self.set = new UnionSet(_sets, { disjoint: disjoint });
  return $self;
}

class ParsedPath {
  constructor() {
    throw new TypeError("Class ParsedPath has no unnamed constructor");
  }
  static _(style_1, root, isRootRelative_1, parts, separators) {
    return $ParsedPath__(ParsedPath, style_1, root, isRootRelative_1, parts, separators);
  }
  extension(level = 1) {
    return __dartIndexGet(this._splitExtension(level), 1);
  }
  get isAbsolute() {
    return !((this.root === null));
  }
  static parse(path, style_1) {
    const root = style_1.getRoot(path);
    const isRootRelative_1 = style_1.isRootRelative(path);
    if (!((root === null))) {
      path = path.substring(root.length);
    }
    const parts = new Array(0).fill(null);
    const separators = new Array(0).fill(null);
    let start = 0;
    if ((path.length !== 0 && style_1.isSeparator(path.charCodeAt(0)))) {
      {
        (separators.push(path[0]), null);
        start = 1;
      }
    } else {
      {
        (separators.push(""), null);
      }
    }
    for (let i = start; (i < path.length); i = (i + 1)) {
      {
        if (style_1.isSeparator(path.charCodeAt(i))) {
          {
            (parts.push(path.substring(start, i)), null);
            (separators.push(path[i]), null);
            start = (i + 1);
          }
        }
      }
    }
    if ((start < path.length)) {
      {
        (parts.push(path.substring(start)), null);
        (separators.push(""), null);
      }
    }
    return ParsedPath._(style_1, root, isRootRelative_1, parts, separators);
  }
  get basename() {
    const copy = this.clone();
    copy.removeTrailingSeparators();
    if (__dartIterableIsEmpty(copy.parts)) {
      return (this.root ?? "");
    }
    return __dartIterableLast(copy.parts);
  }
  get basenameWithoutExtension() {
    return __dartIndexGet(this._splitExtension(), 0);
  }
  get hasTrailingSeparator() {
    return (!__dartIterableIsEmpty(this.parts) && (__dartEquals(__dartIterableLast(this.parts), "") || !(__dartEquals(__dartIterableLast(this.separators), ""))));
  }
  removeTrailingSeparators() {
    while ((!__dartIterableIsEmpty(this.parts) && __dartEquals(__dartIterableLast(this.parts), ""))) {
      {
        this.parts.pop();
        this.separators.pop();
      }
    }
    if (!__dartIterableIsEmpty(this.separators)) {
      __dartIndexSet(this.separators, (this.separators.length - 1), "");
    }
  }
  normalize({ canonicalize: canonicalize_1 = false } = {}) {
    let leadingDoubles = 0;
    const newParts = new Array(0).fill(null);
    {
      let _sync_for_iterator = __dartIterator(this.parts);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let part = _sync_for_iterator.current;
          {
            if ((__dartEquals(part, ".") || __dartEquals(part, ""))) {
              {
              }
            } else {
              if (__dartEquals(part, "..")) {
                {
                  if (newParts.length !== 0) {
                    {
                      newParts.pop();
                    }
                  } else {
                    {
                      leadingDoubles = (leadingDoubles + 1);
                    }
                  }
                }
              } else {
                {
                  (newParts.push((canonicalize_1 ? this.style.canonicalizePart(part) : part)), null);
                }
              }
            }
          }
        }
      }
    }
    if (!(this.isAbsolute)) {
      {
        (newParts.splice(0, 0, ...Array.from(__dartFixedList(new Array(leadingDoubles).fill("..")))), null);
      }
    }
    if ((newParts.length === 0 && !(this.isAbsolute))) {
      {
        (newParts.push("."), null);
      }
    }
    this.parts = newParts;
    this.separators = new Array((newParts.length + 1)).fill(this.style.separator);
    if (((!(this.isAbsolute) || newParts.length === 0) || !(this.style.needsSeparator(__dartNullCheck(this.root))))) {
      {
        __dartIndexSet(this.separators, 0, "");
      }
    }
    if ((!((this.root === null)) && __dartEquals(this.style, Style.windows))) {
      {
        if (canonicalize_1) {
          this.root = __dartNullCheck(this.root).toLowerCase();
        }
        this.root = __dartNullCheck(this.root).replaceAll("/", "\\");
      }
    }
    this.removeTrailingSeparators();
  }
  toString() {
    const builder = __dartStringBuffer("");
    if (!((this.root === null))) {
      builder.write(this.root);
    }
    for (let i = 0; (i < this.parts.length); i = (i + 1)) {
      {
        builder.write(__dartIndexGet(this.separators, i));
        builder.write(__dartIndexGet(this.parts, i));
      }
    }
    builder.write(__dartIterableLast(this.separators));
    return __dartStr(builder);
  }
  _kthLastIndexOf(path, character, k) {
    let count = 0;
    let leftMostIndexedCharacter = 0;
    for (let index = (path.length - 1); (index >= 0); index = (index - 1)) {
      {
        if (__dartEquals(path[index], character)) {
          {
            leftMostIndexedCharacter = index;
            count = (count + 1);
            if (__dartEquals(count, k)) {
              {
                return index;
              }
            }
          }
        }
      }
    }
    return leftMostIndexedCharacter;
  }
  _splitExtension(level = 1) {
    if ((level <= 0)) {
      {
        (() => { throw __dartCoreError("RangeError", level); })();
      }
    }
    const file = __dartIterableLastWhere(Array.from(this.parts, (value) => __dartAs(value, (value) => (value === null || typeof value === "string"), "InterfaceType(String?)")), function(p) { return !(__dartEquals(p, "")); }, function() { return null; });
    if ((file === null)) {
      return ["", ""];
    }
    if (__dartEquals(file, "..")) {
      return ["..", ""];
    }
    const lastDot = this._kthLastIndexOf(file, ".", level);
    if ((lastDot <= 0)) {
      return [file, ""];
    }
    return [file.substring(0, lastDot), file.substring(lastDot)];
  }
  clone() {
    return ParsedPath._(this.style, this.root, this.isRootRelative, Array.from(this.parts), Array.from(this.separators));
  }
}

function $ParsedPath__($newTarget, style_1, root, isRootRelative_1, parts, separators) {
  const $self = Object.create($newTarget.prototype);
  $self.style = style_1;
  $self.root = root;
  $self.isRootRelative = isRootRelative_1;
  $self.parts = parts;
  $self.separators = separators;
  return $self;
}

class Style {
  constructor() {
  }
  static _getPlatformStyle() {
    if (!(__dartEquals(__dartUriParse((globalThis.location?.href ?? import.meta.url), false).scheme, "file"))) {
      return Style.url;
    }
    if (!(__dartUriParse((globalThis.location?.href ?? import.meta.url), false).path.endsWith("/"))) {
      return Style.url;
    }
    if (__dartEquals(__dartUri({ path: "a/b" }).toFilePath(), "a\\b")) {
      return Style.windows;
    }
    return Style.posix;
  }
  get name() {
    throw new TypeError("Abstract member Style.name");
  }
  set name(value) {
    Object.defineProperty(this, "name", { value, writable: true, configurable: true, enumerable: true });
  }
  get context() {
    return new Context({ style: this });
  }
  get separator() {
    throw new TypeError("Abstract member Style.separator");
  }
  set separator(value) {
    Object.defineProperty(this, "separator", { value, writable: true, configurable: true, enumerable: true });
  }
  get separatorPattern() {
    throw new TypeError("Abstract member Style.separatorPattern");
  }
  set separatorPattern(value) {
    Object.defineProperty(this, "separatorPattern", { value, writable: true, configurable: true, enumerable: true });
  }
  get needsSeparatorPattern() {
    throw new TypeError("Abstract member Style.needsSeparatorPattern");
  }
  set needsSeparatorPattern(value) {
    Object.defineProperty(this, "needsSeparatorPattern", { value, writable: true, configurable: true, enumerable: true });
  }
  get rootPattern() {
    throw new TypeError("Abstract member Style.rootPattern");
  }
  set rootPattern(value) {
    Object.defineProperty(this, "rootPattern", { value, writable: true, configurable: true, enumerable: true });
  }
  get relativeRootPattern() {
    throw new TypeError("Abstract member Style.relativeRootPattern");
  }
  set relativeRootPattern(value) {
    Object.defineProperty(this, "relativeRootPattern", { value, writable: true, configurable: true, enumerable: true });
  }
  getRoot(path) {
    throw new TypeError("Abstract member Style.getRoot");
  }
  getRelativeRoot(path) {
    throw new TypeError("Abstract member Style.getRelativeRoot");
  }
  pathFromUri(uri) {
    throw new TypeError("Abstract member Style.pathFromUri");
  }
  relativePathToUri(path) {
    throw new TypeError("Abstract member Style.relativePathToUri");
  }
  absolutePathToUri(path) {
    throw new TypeError("Abstract member Style.absolutePathToUri");
  }
  toString() {
    return this.name;
  }
}

class InternalStyle extends Style {
  constructor() {
    super();
  }
  get separator() {
    throw new TypeError("Abstract member InternalStyle.separator");
  }
  set separator(value) {
    Object.defineProperty(this, "separator", { value, writable: true, configurable: true, enumerable: true });
  }
  containsSeparator(path) {
    throw new TypeError("Abstract member InternalStyle.containsSeparator");
  }
  isSeparator(codeUnit) {
    throw new TypeError("Abstract member InternalStyle.isSeparator");
  }
  needsSeparator(path) {
    throw new TypeError("Abstract member InternalStyle.needsSeparator");
  }
  rootLength(path, { withDrive = false } = {}) {
    throw new TypeError("Abstract member InternalStyle.rootLength");
  }
  getRoot(path) {
    const length = this.rootLength(path);
    if ((length > 0)) {
      return path.substring(0, length);
    }
    return (this.isRootRelative(path) ? path[0] : null);
  }
  isRootRelative(path) {
    throw new TypeError("Abstract member InternalStyle.isRootRelative");
  }
  pathFromUri(uri) {
    throw new TypeError("Abstract member InternalStyle.pathFromUri");
  }
  relativePathToUri(path) {
    if (path.length === 0) {
      return __dartUri({});
    }
    const segments = this.context.split(path);
    if (this.isSeparator(path.charCodeAt((path.length - 1)))) {
      (segments.push(""), null);
    }
    return __dartUri({ pathSegments: segments });
  }
  absolutePathToUri(path) {
    throw new TypeError("Abstract member InternalStyle.absolutePathToUri");
  }
  codeUnitsEqual(codeUnit1, codeUnit2) {
    return __dartEquals(codeUnit1, codeUnit2);
  }
  pathsEqual(path1, path2) {
    return __dartEquals(path1, path2);
  }
  canonicalizeCodeUnit(codeUnit) {
    return codeUnit;
  }
  canonicalizePart(part) {
    return part;
  }
}

class PosixStyle extends InternalStyle {
  constructor() {
    super();
    this.name = "posix";
    this.separator = "/";
    this.separators = __dartConst("[\"list\",\"InterfaceType(String)\",[\"string\",\"/\"]]", () => Object.freeze(["/"]));
    this.separatorPattern = __dartRegExp("/", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });
    this.needsSeparatorPattern = __dartRegExp("[^/]$", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });
    this.rootPattern = __dartRegExp("^/", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });
  }
  get relativeRootPattern() {
    return null;
  }
  containsSeparator(path) {
    return path.includes("/");
  }
  isSeparator(codeUnit) {
    return __dartEquals(codeUnit, 47);
  }
  needsSeparator(path) {
    return (path.length !== 0 && !(this.isSeparator(path.charCodeAt((path.length - 1)))));
  }
  rootLength(path, { withDrive = false } = {}) {
    if ((path.length !== 0 && this.isSeparator(path.charCodeAt(0)))) {
      return 1;
    }
    return 0;
  }
  isRootRelative(path) {
    return false;
  }
  getRelativeRoot(path) {
    return null;
  }
  pathFromUri(uri) {
    if ((__dartEquals(uri.scheme, "") || __dartEquals(uri.scheme, "file"))) {
      {
        return decodeURIComponent(uri.path);
      }
    }
    (() => { throw __dartCoreError("ArgumentError", "Uri " + __dartStr(uri) + " must have scheme 'file:'."); })();
  }
  absolutePathToUri(path) {
    const parsed = ParsedPath.parse(path, this);
    if (__dartIterableIsEmpty(parsed.parts)) {
      {
        (parsed.parts.push(...Array.from(["", ""])), null);
      }
    } else {
      if (parsed.hasTrailingSeparator) {
        {
          (parsed.parts.push(""), null);
        }
      }
    }
    return __dartUri({ scheme: "file", pathSegments: parsed.parts });
  }
}

class UrlStyle extends InternalStyle {
  constructor() {
    super();
    this.name = "url";
    this.separator = "/";
    this.separators = __dartConst("[\"list\",\"InterfaceType(String)\",[\"string\",\"/\"]]", () => Object.freeze(["/"]));
    this.separatorPattern = __dartRegExp("/", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });
    this.needsSeparatorPattern = __dartRegExp("(^[a-zA-Z][-+.a-zA-Z\\d]*://|[^/])$", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });
    this.rootPattern = __dartRegExp("[a-zA-Z][-+.a-zA-Z\\d]*://[^/]*", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });
    this.relativeRootPattern = __dartRegExp("^/", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });
  }
  containsSeparator(path) {
    return path.includes("/");
  }
  isSeparator(codeUnit) {
    return __dartEquals(codeUnit, 47);
  }
  needsSeparator(path) {
    if (path.length === 0) {
      return false;
    }
    if (!(this.isSeparator(path.charCodeAt((path.length - 1))))) {
      return true;
    }
    return (path.endsWith("://") && __dartEquals(this.rootLength(path), path.length));
  }
  rootLength(path, { withDrive = false } = {}) {
    if (path.length === 0) {
      return 0;
    }
    if (this.isSeparator(path.charCodeAt(0))) {
      return 1;
    }
    for (let i = 0; (i < path.length); i = (i + 1)) {
      {
        const codeUnit = path.charCodeAt(i);
        if (this.isSeparator(codeUnit)) {
          return 0;
        }
        if (__dartEquals(codeUnit, 58)) {
          {
            if (__dartEquals(i, 0)) {
              return 0;
            }
            if (path.startsWith("//", (i + 1))) {
              i = (i + 3);
            }
            const index = path.indexOf("/", i);
            if ((index <= 0)) {
              return path.length;
            }
            if ((!(withDrive) || (path.length < (index + 3)))) {
              return index;
            }
            if (!(path.startsWith("file://"))) {
              return index;
            }
            return (driveLetterEnd(path, (index + 1)) ?? index);
          }
        }
      }
    }
    return 0;
  }
  isRootRelative(path) {
    return (path.length !== 0 && this.isSeparator(path.charCodeAt(0)));
  }
  getRelativeRoot(path) {
    return (this.isRootRelative(path) ? "/" : null);
  }
  pathFromUri(uri) {
    return __dartStr(uri);
  }
  relativePathToUri(path) {
    return __dartUriParse(path, false);
  }
  absolutePathToUri(path) {
    return __dartUriParse(path, false);
  }
}

class WindowsStyle extends InternalStyle {
  constructor() {
    super();
    this.name = "windows";
    this.separator = "\\";
    this.separators = __dartConst("[\"list\",\"InterfaceType(String)\",[\"string\",\"/\"],[\"string\",\"\\\\\"]]", () => Object.freeze(["/", "\\"]));
    this.separatorPattern = __dartRegExp("[/\\\\]", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });
    this.needsSeparatorPattern = __dartRegExp("[^/\\\\]$", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });
    this.rootPattern = __dartRegExp("^(\\\\\\\\[^\\\\]+\\\\[^\\\\/]+|[a-zA-Z]:[/\\\\])", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });
    this.relativeRootPattern = __dartRegExp("^[/\\\\](?![/\\\\])", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });
  }
  containsSeparator(path) {
    return path.includes("/");
  }
  isSeparator(codeUnit) {
    return (__dartEquals(codeUnit, 47) || __dartEquals(codeUnit, 92));
  }
  needsSeparator(path) {
    if (path.length === 0) {
      return false;
    }
    return !(this.isSeparator(path.charCodeAt((path.length - 1))));
  }
  rootLength(path, { withDrive = false } = {}) {
    if (path.length === 0) {
      return 0;
    }
    if (__dartEquals(path.charCodeAt(0), 47)) {
      return 1;
    }
    if (__dartEquals(path.charCodeAt(0), 92)) {
      {
        if (((path.length < 2) || !(__dartEquals(path.charCodeAt(1), 92)))) {
          return 1;
        }
        let index = path.indexOf("\\", 2);
        if ((index > 0)) {
          {
            index = path.indexOf("\\", (index + 1));
            if ((index > 0)) {
              return index;
            }
          }
        }
        return path.length;
      }
    }
    if ((path.length < 3)) {
      return 0;
    }
    if (!(isAlphabetic(path.charCodeAt(0)))) {
      return 0;
    }
    if (!(__dartEquals(path.charCodeAt(1), 58))) {
      return 0;
    }
    if (!(this.isSeparator(path.charCodeAt(2)))) {
      return 0;
    }
    return 3;
  }
  isRootRelative(path) {
    return __dartEquals(this.rootLength(path), 1);
  }
  getRelativeRoot(path) {
    const length = this.rootLength(path);
    if (__dartEquals(length, 1)) {
      return path[0];
    }
    return null;
  }
  pathFromUri(uri) {
    if ((!(__dartEquals(uri.scheme, "")) && !(__dartEquals(uri.scheme, "file")))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Uri " + __dartStr(uri) + " must have scheme 'file:'."); })();
      }
    }
    let path = uri.path;
    if (__dartEquals(uri.host, "")) {
      {
        if ((((path.length >= 3) && path.startsWith("/")) && isDriveLetter(path, 1))) {
          {
            path = __dartStringReplaceFirst(path, "/", "", 0);
          }
        }
      }
    } else {
      {
        path = "\\\\" + __dartStr(uri.host) + __dartStr(path);
      }
    }
    return decodeURIComponent(path.replaceAll("/", "\\"));
  }
  absolutePathToUri(path) {
    const parsed = ParsedPath.parse(path, this);
    if (__dartNullCheck(parsed.root).startsWith("\\\\")) {
      {
        const rootParts = Array.from(__dartNullCheck(parsed.root).split("\\")).filter(function(part) { return !(__dartEquals(part, "")); });
        (parsed.parts.splice(0, 0, __dartIterableLast(rootParts)), null);
        if (parsed.hasTrailingSeparator) {
          {
            (parsed.parts.push(""), null);
          }
        }
        return __dartUri({ scheme: "file", host: __dartIterableFirst(rootParts), pathSegments: parsed.parts });
      }
    } else {
      {
        if ((__dartIterableIsEmpty(parsed.parts) || parsed.hasTrailingSeparator)) {
          {
            (parsed.parts.push(""), null);
          }
        }
        (parsed.parts.splice(0, 0, __dartNullCheck(parsed.root).replaceAll("/", "").replaceAll("\\", "")), null);
        return __dartUri({ scheme: "file", pathSegments: parsed.parts });
      }
    }
  }
  codeUnitsEqual(codeUnit1, codeUnit2) {
    if (__dartEquals(codeUnit1, codeUnit2)) {
      return true;
    }
    if (__dartEquals(codeUnit1, 47)) {
      return __dartEquals(codeUnit2, 92);
    }
    if (__dartEquals(codeUnit1, 92)) {
      return __dartEquals(codeUnit2, 47);
    }
    if (!(__dartEquals((codeUnit1 ^ codeUnit2), 32))) {
      return false;
    }
    const upperCase1 = (codeUnit1 | 32);
    return ((upperCase1 >= 97) && (upperCase1 <= 122));
  }
  pathsEqual(path1, path2) {
    if (Object.is(path1, path2)) {
      return true;
    }
    if (!(__dartEquals(path1.length, path2.length))) {
      return false;
    }
    for (let i = 0; (i < path1.length); i = (i + 1)) {
      {
        if (!(this.codeUnitsEqual(path1.charCodeAt(i), path2.charCodeAt(i)))) {
          {
            return false;
          }
        }
      }
    }
    return true;
  }
  canonicalizeCodeUnit(codeUnit) {
    if (__dartEquals(codeUnit, 47)) {
      return 92;
    }
    if ((codeUnit < 65)) {
      return codeUnit;
    }
    if ((codeUnit > 90)) {
      return codeUnit;
    }
    return (codeUnit | 32);
  }
  canonicalizePart(part) {
    return part.toLowerCase();
  }
}

class PathException {
  constructor(message) {
    Object.defineProperty(this, "__dartCoreErrorType", { value: "Exception", writable: true, configurable: true });
    this.message = message;
  }
  toString() {
    return "PathException: " + __dartStr(this.message);
  }
}

class Context {
  static _internal() {
    return $Context__internal(Context);
  }
  static _(style_1, _current_1) {
    return $Context__(Context, style_1, _current_1);
  }
  constructor({ style: style_1 = null, current: current_1 = null } = {}) {
    if ((current_1 === null)) {
      {
        if ((style_1 === null)) {
          {
            current_1 = current();
          }
        } else {
          {
            current_1 = ".";
          }
        }
      }
    }
    if ((style_1 === null)) {
      {
        style_1 = Style.platform;
      }
    } else {
      if (!(style_1 instanceof InternalStyle)) {
        {
          (() => { throw __dartCoreError("ArgumentError", "Only styles defined by the path package are allowed."); })();
        }
      }
    }
    return Context._(__dartAs(style_1, value => value instanceof InternalStyle, "InternalStyle"), current_1);
  }
  get current() {
    return (this._current ?? current());
  }
  get separator() {
    return this.style.separator;
  }
  absolute(part1, part2 = null, part3 = null, part4 = null, part5 = null, part6 = null, part7 = null, part8 = null, part9 = null, part10 = null, part11 = null, part12 = null, part13 = null, part14 = null, part15 = null) {
    _validateArgList("absolute", [part1, part2, part3, part4, part5, part6, part7, part8, part9, part10, part11, part12, part13, part14, part15]);
    if ((((part2 === null) && this.isAbsolute(part1)) && !(this.isRootRelative(part1)))) {
      {
        return part1;
      }
    }
    return this.join(this.current, part1, part2, part3, part4, part5, part6, part7, part8, part9, part10, part11, part12, part13, part14, part15);
  }
  basename(path) {
    return this._parse(path).basename;
  }
  basenameWithoutExtension(path) {
    return this._parse(path).basenameWithoutExtension;
  }
  dirname(path) {
    const parsed = this._parse(path);
    parsed.removeTrailingSeparators();
    if (__dartIterableIsEmpty(parsed.parts)) {
      return (parsed.root ?? ".");
    }
    if (__dartEquals(parsed.parts.length, 1)) {
      return (parsed.root ?? ".");
    }
    parsed.parts.pop();
    parsed.separators.pop();
    parsed.removeTrailingSeparators();
    return __dartStr(parsed);
  }
  extension(path, level = 1) {
    return this._parse(path).extension(level);
  }
  rootPrefix(path) {
    return path.substring(0, this.style.rootLength(path));
  }
  isAbsolute(path) {
    return (this.style.rootLength(path) > 0);
  }
  isRelative(path) {
    return !(this.isAbsolute(path));
  }
  isRootRelative(path) {
    return this.style.isRootRelative(path);
  }
  join(part1, part2 = null, part3 = null, part4 = null, part5 = null, part6 = null, part7 = null, part8 = null, part9 = null, part10 = null, part11 = null, part12 = null, part13 = null, part14 = null, part15 = null, part16 = null) {
    const parts = [part1, part2, part3, part4, part5, part6, part7, part8, part9, part10, part11, part12, part13, part14, part15, part16];
    _validateArgList("join", parts);
    return this.joinAll(Array.from(parts).filter((value) => typeof value === "string"));
  }
  joinAll(parts) {
    const buffer = __dartStringBuffer("");
    let needsSeparator = false;
    let isAbsoluteAndNotRootRelative = false;
    {
      let _sync_for_iterator = __dartIterator(Array.from(parts).filter(function(part) { return !(__dartEquals(part, "")); }));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let part = _sync_for_iterator.current;
          {
            if ((this.isRootRelative(part) && isAbsoluteAndNotRootRelative)) {
              {
                const parsed = this._parse(part);
                const path = __dartStr(buffer);
                parsed.root = path.substring(0, this.style.rootLength(path, { withDrive: true }));
                if (this.style.needsSeparator(__dartNullCheck(parsed.root))) {
                  {
                    __dartIndexSet(parsed.separators, 0, this.style.separator);
                  }
                }
                buffer.clear();
                buffer.write(__dartStr(parsed));
              }
            } else {
              if (this.isAbsolute(part)) {
                {
                  isAbsoluteAndNotRootRelative = !(this.isRootRelative(part));
                  buffer.clear();
                  buffer.write(part);
                }
              } else {
                {
                  if ((part.length !== 0 && this.style.containsSeparator(part[0]))) {
                    {
                    }
                  } else {
                    if (needsSeparator) {
                      {
                        buffer.write(this.separator);
                      }
                    }
                  }
                  buffer.write(part);
                }
              }
            }
            needsSeparator = this.style.needsSeparator(part);
          }
        }
      }
    }
    return __dartStr(buffer);
  }
  split(path) {
    const parsed = this._parse(path);
    parsed.parts = Array.from(Array.from(parsed.parts).filter(function(part) { return part.length !== 0; }));
    if (!((parsed.root === null))) {
      (parsed.parts.splice(0, 0, __dartNullCheck(parsed.root)), null);
    }
    return parsed.parts;
  }
  canonicalize(path) {
    path = this.absolute(path);
    if ((!(__dartEquals(this.style, Style.windows)) && !(this._needsNormalization(path)))) {
      return path;
    }
    const parsed = this._parse(path);
    parsed.normalize({ canonicalize: true });
    return __dartStr(parsed);
  }
  normalize(path) {
    if (!(this._needsNormalization(path))) {
      return path;
    }
    const parsed = this._parse(path);
    parsed.normalize();
    return __dartStr(parsed);
  }
  _needsNormalization(path) {
    let start = 0;
    const codeUnits = Array.from({ length: path.length }, (_, index) => path.charCodeAt(index));
    let previousPrevious = null;
    let previous = null;
    const root = this.style.rootLength(path);
    if (!(__dartEquals(root, 0))) {
      {
        start = root;
        previous = 47;
        if (__dartEquals(this.style, Style.windows)) {
          {
            for (let i = 0; (i < root); i = (i + 1)) {
              {
                if (__dartEquals(__dartIndexGet(codeUnits, i), 47)) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
    for (let i_1 = start; (i_1 < codeUnits.length); i_1 = (i_1 + 1)) {
      {
        const codeUnit = __dartIndexGet(codeUnits, i_1);
        if (this.style.isSeparator(codeUnit)) {
          {
            if ((__dartEquals(this.style, Style.windows) && __dartEquals(codeUnit, 47))) {
              return true;
            }
            if ((!((previous === null)) && this.style.isSeparator(previous))) {
              return true;
            }
            if ((__dartEquals(previous, 46) && (((previousPrevious === null) || __dartEquals(previousPrevious, 46)) || this.style.isSeparator(previousPrevious)))) {
              {
                return true;
              }
            }
          }
        }
        previousPrevious = previous;
        previous = codeUnit;
      }
    }
    if ((previous === null)) {
      return true;
    }
    if (this.style.isSeparator(previous)) {
      return true;
    }
    if ((__dartEquals(previous, 46) && (((previousPrevious === null) || this.style.isSeparator(previousPrevious)) || __dartEquals(previousPrevious, 46)))) {
      {
        return true;
      }
    }
    return false;
  }
  relative(path, { from = null } = {}) {
    if (((from === null) && this.isRelative(path))) {
      return this.normalize(path);
    }
    from = ((from === null) ? this.current : this.absolute(from));
    if ((this.isRelative(from) && this.isAbsolute(path))) {
      {
        return this.normalize(path);
      }
    }
    if ((this.isRelative(path) || this.isRootRelative(path))) {
      {
        path = this.absolute(path);
      }
    }
    if ((this.isRelative(path) && this.isAbsolute(from))) {
      {
        (() => { throw new PathException("Unable to find a path to \"" + __dartStr(path) + "\" from \"" + __dartStr(from) + "\"."); })();
      }
    }
    const fromParsed = (() => { let v = this._parse(from); return (() => {
      v.normalize();
      return v;
    })(); })();
    const pathParsed = (() => { let v_1 = this._parse(path); return (() => {
      v_1.normalize();
      return v_1;
    })(); })();
    if ((!__dartIterableIsEmpty(fromParsed.parts) && __dartEquals(__dartIndexGet(fromParsed.parts, 0), "."))) {
      {
        return __dartStr(pathParsed);
      }
    }
    if ((!(__dartEquals(fromParsed.root, pathParsed.root)) && (((fromParsed.root === null) || (pathParsed.root === null)) || !(this.style.pathsEqual(__dartNullCheck(fromParsed.root), __dartNullCheck(pathParsed.root)))))) {
      {
        return __dartStr(pathParsed);
      }
    }
    while (((!__dartIterableIsEmpty(fromParsed.parts) && !__dartIterableIsEmpty(pathParsed.parts)) && this.style.pathsEqual(__dartIndexGet(fromParsed.parts, 0), __dartIndexGet(pathParsed.parts, 0)))) {
      {
        fromParsed.parts.splice(0, 1)[0];
        fromParsed.separators.splice(1, 1)[0];
        pathParsed.parts.splice(0, 1)[0];
        pathParsed.separators.splice(1, 1)[0];
      }
    }
    if ((!__dartIterableIsEmpty(fromParsed.parts) && __dartEquals(__dartIndexGet(fromParsed.parts, 0), ".."))) {
      {
        (() => { throw new PathException("Unable to find a path to \"" + __dartStr(path) + "\" from \"" + __dartStr(from) + "\"."); })();
      }
    }
    (pathParsed.parts.splice(0, 0, ...Array.from(__dartFixedList(new Array(fromParsed.parts.length).fill("..")))), null);
    __dartIndexSet(pathParsed.separators, 0, "");
    (pathParsed.separators.splice(1, 0, ...Array.from(__dartFixedList(new Array(fromParsed.parts.length).fill(this.style.separator)))), null);
    if (__dartIterableIsEmpty(pathParsed.parts)) {
      return ".";
    }
    if (((pathParsed.parts.length > 1) && __dartEquals(__dartIterableLast(pathParsed.parts), "."))) {
      {
        pathParsed.parts.pop();
        (() => { let v_2 = pathParsed.separators; return (() => {
          v_2.pop();
          v_2.pop();
          (v_2.push(""), null);
          return v_2;
        })(); })();
      }
    }
    pathParsed.root = "";
    pathParsed.removeTrailingSeparators();
    return __dartStr(pathParsed);
  }
  isWithin(parent, child) {
    return __dartEquals(this._isWithinOrEquals(parent, child), __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"within\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "within" }))));
  }
  equals(path1, path2) {
    return __dartEquals(this._isWithinOrEquals(path1, path2), __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"equal\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "equal" }))));
  }
  _isWithinOrEquals(parent, child) {
    const parentIsAbsolute = this.isAbsolute(parent);
    const childIsAbsolute = this.isAbsolute(child);
    if ((parentIsAbsolute && !(childIsAbsolute))) {
      {
        child = this.absolute(child);
        if (this.style.isRootRelative(parent)) {
          parent = this.absolute(parent);
        }
      }
    } else {
      if ((childIsAbsolute && !(parentIsAbsolute))) {
        {
          parent = this.absolute(parent);
          if (this.style.isRootRelative(child)) {
            child = this.absolute(child);
          }
        }
      } else {
        if ((childIsAbsolute && parentIsAbsolute)) {
          {
            const childIsRootRelative = this.style.isRootRelative(child);
            const parentIsRootRelative = this.style.isRootRelative(parent);
            if ((childIsRootRelative && !(parentIsRootRelative))) {
              {
                child = this.absolute(child);
              }
            } else {
              if ((parentIsRootRelative && !(childIsRootRelative))) {
                {
                  parent = this.absolute(parent);
                }
              }
            }
          }
        }
      }
    }
    const result = this._isWithinOrEqualsFast(parent, child);
    if (!(__dartEquals(result, __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"inconclusive\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "inconclusive" })))))) {
      return result;
    }
    let relative_1 = null;
    try {
      {
        relative_1 = this.relative(child, { from: parent });
      }
    } catch ($error) {
      if ($error instanceof PathException) {
        const _ = $error;
        {
          return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"different\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "different" })));
        }
      } else {
        throw $error;
      }
    }
    if (!(this.isRelative(relative_1))) {
      return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"different\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "different" })));
    }
    if (__dartEquals(relative_1, ".")) {
      return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"equal\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "equal" })));
    }
    if (__dartEquals(relative_1, "..")) {
      return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"different\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "different" })));
    }
    return ((((relative_1.length >= 3) && relative_1.startsWith("..")) && this.style.isSeparator(relative_1.charCodeAt(2))) ? __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"different\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "different" }))) : __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"within\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "within" }))));
  }
  _isWithinOrEqualsFast(parent, child) {
    if (__dartEquals(parent, ".")) {
      parent = "";
    }
    const parentRootLength = this.style.rootLength(parent);
    const childRootLength = this.style.rootLength(child);
    if (!(__dartEquals(parentRootLength, childRootLength))) {
      return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"different\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "different" })));
    }
    for (let i = 0; (i < parentRootLength); i = (i + 1)) {
      {
        const parentCodeUnit = parent.charCodeAt(i);
        const childCodeUnit = child.charCodeAt(i);
        if (!(this.style.codeUnitsEqual(parentCodeUnit, childCodeUnit))) {
          {
            return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"different\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "different" })));
          }
        }
      }
    }
    let lastCodeUnit = 47;
    let lastParentSeparator = null;
    let parentIndex = parentRootLength;
    let childIndex = childRootLength;
    L:
    while (((parentIndex < parent.length) && (childIndex < child.length))) {
      L_1:
      {
        let parentCodeUnit_1 = parent.charCodeAt(parentIndex);
        let childCodeUnit_1 = child.charCodeAt(childIndex);
        if (this.style.codeUnitsEqual(parentCodeUnit_1, childCodeUnit_1)) {
          {
            if (this.style.isSeparator(parentCodeUnit_1)) {
              {
                lastParentSeparator = parentIndex;
              }
            }
            lastCodeUnit = parentCodeUnit_1;
            parentIndex = (parentIndex + 1);
            childIndex = (childIndex + 1);
            break L_1;
          }
        }
        if ((this.style.isSeparator(parentCodeUnit_1) && this.style.isSeparator(lastCodeUnit))) {
          {
            lastParentSeparator = parentIndex;
            parentIndex = (parentIndex + 1);
            break L_1;
          }
        } else {
          if ((this.style.isSeparator(childCodeUnit_1) && this.style.isSeparator(lastCodeUnit))) {
            {
              childIndex = (childIndex + 1);
              break L_1;
            }
          }
        }
        if ((__dartEquals(parentCodeUnit_1, 46) && this.style.isSeparator(lastCodeUnit))) {
          {
            parentIndex = (parentIndex + 1);
            if (__dartEquals(parentIndex, parent.length)) {
              break L;
            }
            parentCodeUnit_1 = parent.charCodeAt(parentIndex);
            if (this.style.isSeparator(parentCodeUnit_1)) {
              {
                lastParentSeparator = parentIndex;
                parentIndex = (parentIndex + 1);
                break L_1;
              }
            }
            if (__dartEquals(parentCodeUnit_1, 46)) {
              {
                parentIndex = (parentIndex + 1);
                if ((__dartEquals(parentIndex, parent.length) || this.style.isSeparator(parent.charCodeAt(parentIndex)))) {
                  {
                    return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"inconclusive\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "inconclusive" })));
                  }
                }
              }
            }
          }
        }
        if ((__dartEquals(childCodeUnit_1, 46) && this.style.isSeparator(lastCodeUnit))) {
          {
            childIndex = (childIndex + 1);
            if (__dartEquals(childIndex, child.length)) {
              break L;
            }
            childCodeUnit_1 = child.charCodeAt(childIndex);
            if (this.style.isSeparator(childCodeUnit_1)) {
              {
                childIndex = (childIndex + 1);
                break L_1;
              }
            }
            if (__dartEquals(childCodeUnit_1, 46)) {
              {
                childIndex = (childIndex + 1);
                if ((__dartEquals(childIndex, child.length) || this.style.isSeparator(child.charCodeAt(childIndex)))) {
                  {
                    return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"inconclusive\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "inconclusive" })));
                  }
                }
              }
            }
          }
        }
        const childDirection = this._pathDirection(child, childIndex);
        if (!(__dartEquals(childDirection, __dartConst("[\"instance\",\"class:_PathDirection\",[\"field\",\"field:_PathDirection.name\",[\"string\",\"below root\"]]]", () => Object.freeze(Object.assign(Object.create(_PathDirection.prototype), { name: "below root" })))))) {
          {
            return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"inconclusive\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "inconclusive" })));
          }
        }
        const parentDirection = this._pathDirection(parent, parentIndex);
        if (!(__dartEquals(parentDirection, __dartConst("[\"instance\",\"class:_PathDirection\",[\"field\",\"field:_PathDirection.name\",[\"string\",\"below root\"]]]", () => Object.freeze(Object.assign(Object.create(_PathDirection.prototype), { name: "below root" })))))) {
          {
            return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"inconclusive\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "inconclusive" })));
          }
        }
        return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"different\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "different" })));
      }
    }
    if (__dartEquals(childIndex, child.length)) {
      {
        if ((__dartEquals(parentIndex, parent.length) || this.style.isSeparator(parent.charCodeAt(parentIndex)))) {
          {
            lastParentSeparator = parentIndex;
          }
        } else {
          {
            ((lastParentSeparator === null) ? lastParentSeparator = Math.max(0, (parentRootLength - 1)) : null);
          }
        }
        const direction = this._pathDirection(parent, lastParentSeparator);
        if (__dartEquals(direction, __dartConst("[\"instance\",\"class:_PathDirection\",[\"field\",\"field:_PathDirection.name\",[\"string\",\"at root\"]]]", () => Object.freeze(Object.assign(Object.create(_PathDirection.prototype), { name: "at root" }))))) {
          return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"equal\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "equal" })));
        }
        return (__dartEquals(direction, __dartConst("[\"instance\",\"class:_PathDirection\",[\"field\",\"field:_PathDirection.name\",[\"string\",\"above root\"]]]", () => Object.freeze(Object.assign(Object.create(_PathDirection.prototype), { name: "above root" })))) ? __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"inconclusive\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "inconclusive" }))) : __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"different\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "different" }))));
      }
    }
    const direction_1 = this._pathDirection(child, childIndex);
    if (__dartEquals(direction_1, __dartConst("[\"instance\",\"class:_PathDirection\",[\"field\",\"field:_PathDirection.name\",[\"string\",\"at root\"]]]", () => Object.freeze(Object.assign(Object.create(_PathDirection.prototype), { name: "at root" }))))) {
      return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"equal\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "equal" })));
    }
    if (__dartEquals(direction_1, __dartConst("[\"instance\",\"class:_PathDirection\",[\"field\",\"field:_PathDirection.name\",[\"string\",\"above root\"]]]", () => Object.freeze(Object.assign(Object.create(_PathDirection.prototype), { name: "above root" }))))) {
      {
        return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"inconclusive\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "inconclusive" })));
      }
    }
    return ((this.style.isSeparator(child.charCodeAt(childIndex)) || this.style.isSeparator(lastCodeUnit)) ? __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"within\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "within" }))) : __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"different\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "different" }))));
  }
  _pathDirection(path, index) {
    let depth = 0;
    let reachedRoot = false;
    let i = index;
    L:
    while ((i < path.length)) {
      {
        while (((i < path.length) && this.style.isSeparator(path.charCodeAt(i)))) {
          {
            i = (i + 1);
          }
        }
        if (__dartEquals(i, path.length)) {
          break L;
        }
        const start = i;
        while (((i < path.length) && !(this.style.isSeparator(path.charCodeAt(i))))) {
          {
            i = (i + 1);
          }
        }
        if ((__dartEquals((i - start), 1) && __dartEquals(path.charCodeAt(start), 46))) {
          {
          }
        } else {
          if (((__dartEquals((i - start), 2) && __dartEquals(path.charCodeAt(start), 46)) && __dartEquals(path.charCodeAt((start + 1)), 46))) {
            {
              depth = (depth - 1);
              if ((depth < 0)) {
                break L;
              }
              if (__dartEquals(depth, 0)) {
                reachedRoot = true;
              }
            }
          } else {
            {
              depth = (depth + 1);
            }
          }
        }
        if (__dartEquals(i, path.length)) {
          break L;
        }
        i = (i + 1);
      }
    }
    if ((depth < 0)) {
      return __dartConst("[\"instance\",\"class:_PathDirection\",[\"field\",\"field:_PathDirection.name\",[\"string\",\"above root\"]]]", () => Object.freeze(Object.assign(Object.create(_PathDirection.prototype), { name: "above root" })));
    }
    if (__dartEquals(depth, 0)) {
      return __dartConst("[\"instance\",\"class:_PathDirection\",[\"field\",\"field:_PathDirection.name\",[\"string\",\"at root\"]]]", () => Object.freeze(Object.assign(Object.create(_PathDirection.prototype), { name: "at root" })));
    }
    if (reachedRoot) {
      return __dartConst("[\"instance\",\"class:_PathDirection\",[\"field\",\"field:_PathDirection.name\",[\"string\",\"reaches root\"]]]", () => Object.freeze(Object.assign(Object.create(_PathDirection.prototype), { name: "reaches root" })));
    }
    return __dartConst("[\"instance\",\"class:_PathDirection\",[\"field\",\"field:_PathDirection.name\",[\"string\",\"below root\"]]]", () => Object.freeze(Object.assign(Object.create(_PathDirection.prototype), { name: "below root" })));
  }
  hash(path) {
    path = this.absolute(path);
    const result = this._hashFast(path);
    if (!((result === null))) {
      return result;
    }
    const parsed = this._parse(path);
    parsed.normalize();
    return __dartNullCheck(this._hashFast(__dartStr(parsed)));
  }
  _hashFast(path) {
    let hash_1 = 4603;
    let beginning = true;
    let wasSeparator = true;
    L:
    for (let i = 0; (i < path.length); i = (i + 1)) {
      L_1:
      {
        const codeUnit = this.style.canonicalizeCodeUnit(path.charCodeAt(i));
        if (this.style.isSeparator(codeUnit)) {
          {
            wasSeparator = true;
            break L_1;
          }
        }
        if ((__dartEquals(codeUnit, 46) && wasSeparator)) {
          {
            if (__dartEquals((i + 1), path.length)) {
              break L;
            }
            const next = path.charCodeAt((i + 1));
            if (this.style.isSeparator(next)) {
              break L_1;
            }
            if (((!(beginning) && __dartEquals(next, 46)) && (__dartEquals((i + 2), path.length) || this.style.isSeparator(path.charCodeAt((i + 2)))))) {
              {
                return null;
              }
            }
          }
        }
        hash_1 = (hash_1 & 67108863);
        hash_1 = (hash_1 * 33);
        hash_1 = (hash_1 ^ codeUnit);
        wasSeparator = false;
        beginning = false;
      }
    }
    return hash_1;
  }
  withoutExtension(path) {
    const parsed = this._parse(path);
    L:
    for (let i = (parsed.parts.length - 1); (i >= 0); i = (i - 1)) {
      {
        if (__dartIndexGet(parsed.parts, i).length !== 0) {
          {
            __dartIndexSet(parsed.parts, i, parsed.basenameWithoutExtension);
            break L;
          }
        }
      }
    }
    return __dartStr(parsed);
  }
  setExtension(path, extension_1) {
    return (this.withoutExtension(path) + extension_1);
  }
  fromUri(uri) {
    return this.style.pathFromUri(_parseUri(__dartNullCheck(uri)));
  }
  toUri(path) {
    if (this.isRelative(path)) {
      {
        return this.style.relativePathToUri(path);
      }
    } else {
      {
        return this.style.absolutePathToUri(this.join(this.current, path));
      }
    }
  }
  prettyUri(uri) {
    const typedUri = _parseUri(__dartNullCheck(uri));
    if ((__dartEquals(typedUri.scheme, "file") && __dartEquals(this.style, Style.url))) {
      {
        return __dartStr(typedUri);
      }
    } else {
      if (((!(__dartEquals(typedUri.scheme, "file")) && !(__dartEquals(typedUri.scheme, ""))) && !(__dartEquals(this.style, Style.url)))) {
        {
          return __dartStr(typedUri);
        }
      }
    }
    const path = this.normalize(this.fromUri(typedUri));
    const rel = this.relative(path);
    return ((this.split(rel).length > this.split(path).length) ? path : rel);
  }
  _parse(path) {
    return ParsedPath.parse(path, this.style);
  }
}

function $Context__internal($newTarget) {
  const $self = Object.create($newTarget.prototype);
  $self.style = __dartAs(Style.platform, value => value instanceof InternalStyle, "InternalStyle");
  $self._current = null;
  return $self;
}

function $Context__($newTarget, style_1, _current_1) {
  const $self = Object.create($newTarget.prototype);
  $self.style = style_1;
  $self._current = _current_1;
  return $self;
}

class _PathDirection {
  constructor(name) {
    this.name = name;
  }
  toString() {
    return this.name;
  }
}

class _PathRelation {
  constructor(name) {
    this.name = name;
  }
  toString() {
    return this.name;
  }
}

class PathMap {
  constructor({ context: context_1 = null } = {}) {
  }
  static of(other, { context: context_1 = null } = {}) {
    return $PathMap_of(PathMap, other, { context: context_1 });
  }
  static _create(context_1) {
    ((context_1 === null) ? context_1 = context : null);
    return __dartCustomHashMap(function(path1, path2) {
      if ((path1 === null)) {
        return (path2 === null);
      }
      if ((path2 === null)) {
        return false;
      }
      return __dartNullCheck(context_1).equals(path1, path2);
}, function(path) { return ((path === null) ? 0 : __dartNullCheck(context_1).hash(path)); }, function(path) { return (typeof path === "string" || (path === null)); });
  }
}

function $PathMap_of($newTarget, other, { context: context_1 = null } = {}) {
  const $self = Object.create($newTarget.prototype);
  return $self;
}

class PathSet {
  constructor({ context: context_1 = null } = {}) {
    this._inner = PathSet._create(context_1);
  }
  static of(other, { context: context_1 = null } = {}) {
    return $PathSet_of(PathSet, other, { context: context_1 });
  }
  static _create(context_1) {
    ((context_1 === null) ? context_1 = context : null);
    return new Set();
  }
  get iterator() {
    return __dartIterator(this._inner);
  }
  get length() {
    return __dartIterableLength(this._inner);
  }
  add(value) {
    return __dartSetAdd(this._inner, value);
  }
  addAll(elements) {
    return __dartSetAddAll(this._inner, elements);
  }
  cast() {
    return new Set(Array.from(this._inner, (value) => __dartAs(value, (value) => true, "TypeParameterType(PathSet.cast.T%)")));
  }
  clear() {
    return this._inner.clear();
  }
  contains(element) {
    return __dartIterableContains(this._inner, element);
  }
  containsAll(other) {
    return __dartSetContainsAll(this._inner, other);
  }
  difference(other) {
    return __dartSetDifference(this._inner, other);
  }
  intersection(other) {
    return __dartSetIntersection(this._inner, other);
  }
  lookup(element) {
    return __dartSetLookup(this._inner, element);
  }
  remove(value) {
    return __dartSetRemove(this._inner, value);
  }
  removeAll(elements) {
    return __dartSetRemoveAll(this._inner, elements);
  }
  removeWhere(test) {
    return __dartSetRemoveWhere(this._inner, test);
  }
  retainAll(elements) {
    return __dartSetRetainAll(this._inner, elements);
  }
  retainWhere(test) {
    return __dartSetRetainWhere(this._inner, test);
  }
  union(other) {
    return __dartSetUnion(this._inner, other);
  }
  toSet() {
    return __dartSetFrom(this._inner);
  }
}

function $PathSet_of($newTarget, other, { context: context_1 = null } = {}) {
  const $self = Object.create($newTarget.prototype);
  $self._inner = (() => { let v = PathSet._create(context_1); return (() => {
    __dartSetAddAll(v, other);
    return v;
  })(); })();
  return $self;
}

class SourceSpan {
  get start() {
    throw new TypeError("Abstract member SourceSpan.start");
  }
  set start(value) {
    Object.defineProperty(this, "start", { value, writable: true, configurable: true, enumerable: true });
  }
  get end() {
    throw new TypeError("Abstract member SourceSpan.end");
  }
  set end(value) {
    Object.defineProperty(this, "end", { value, writable: true, configurable: true, enumerable: true });
  }
  get text() {
    throw new TypeError("Abstract member SourceSpan.text");
  }
  set text(value) {
    Object.defineProperty(this, "text", { value, writable: true, configurable: true, enumerable: true });
  }
  get sourceUrl() {
    throw new TypeError("Abstract member SourceSpan.sourceUrl");
  }
  set sourceUrl(value) {
    Object.defineProperty(this, "sourceUrl", { value, writable: true, configurable: true, enumerable: true });
  }
  get length() {
    throw new TypeError("Abstract member SourceSpan.length");
  }
  set length(value) {
    Object.defineProperty(this, "length", { value, writable: true, configurable: true, enumerable: true });
  }
  constructor(start, end, text) {
    if (new.target === SourceSpan) {
      return new SourceSpanBase(start, end, text);
    }
  }
  union(other) {
    throw new TypeError("Abstract member SourceSpan.union");
  }
  compareTo(other) {
    throw new TypeError("Abstract member SourceSpan.compareTo");
  }
  message(message, { color = null } = {}) {
    throw new TypeError("Abstract member SourceSpan.message");
  }
  highlight({ color = null } = {}) {
    throw new TypeError("Abstract member SourceSpan.highlight");
  }
}
Object.defineProperty(SourceSpan, Symbol.hasInstance, { value(value) { return value != null && value[$SourceSpan_interface] === true; } });

class SourceSpanMixin {
  constructor() {
    Object.defineProperty(this, $SourceSpan_interface, { value: true });
  }
  get sourceUrl() {
    return this.start.sourceUrl;
  }
  get length() {
    return (this.end.offset - this.start.offset);
  }
  compareTo(other) {
    const result = this.start.compareTo(other.start);
    return (__dartEquals(result, 0) ? this.end.compareTo(other.end) : result);
  }
  union(other) {
    if (!(__dartEquals(this.sourceUrl, other.sourceUrl))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Source URLs \"" + __dartStr(this.sourceUrl) + "\" and " + " \"" + __dartStr(other.sourceUrl) + "\" don't match."); })();
      }
    }
    const start = min(this.start, other.start);
    const end = max(this.end, other.end);
    const beginSpan = ((() => { const $left = start; const $right = this.start; return $left === null ? $right === null : $left["=="]($right); })() ? this : other);
    const endSpan = ((() => { const $left_1 = end; const $right_1 = this.end; return $left_1 === null ? $right_1 === null : $left_1["=="]($right_1); })() ? this : other);
    if ((beginSpan.end.compareTo(endSpan.start) < 0)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Spans " + __dartStr(this) + " and " + __dartStr(other) + " are disjoint."); })();
      }
    }
    const text = (beginSpan.text + endSpan.text.substring(beginSpan.end.distance(endSpan.start)));
    return new SourceSpan(start, end, text);
  }
  message(message, { color = null } = {}) {
    const buffer = (() => { let v = __dartStringBuffer(""); return (() => {
      v.write("line " + __dartStr((this.start.line + 1)) + ", column " + __dartStr((this.start.column + 1)));
      return v;
    })(); })();
    if (!((this.sourceUrl === null))) {
      buffer.write(" of " + __dartStr(prettyUri(this.sourceUrl)));
    }
    buffer.write(": " + __dartStr(message));
    const highlight = this.highlight({ color: color });
    if (highlight.length !== 0) {
      {
        (() => { let v_1 = buffer; return (() => {
          v_1.writeln();
          v_1.write(highlight);
          return v_1;
        })(); })();
      }
    }
    return __dartStr(buffer);
  }
  highlight({ color = null } = {}) {
    if ((!(this instanceof SourceSpanWithContext) && __dartEquals(this.length, 0))) {
      return "";
    }
    return new Highlighter(this, { color: color }).highlight();
  }
  "=="(other) {
    return ((other instanceof SourceSpan && (() => { const $left = this.start; const $right = other.start; return $left === null ? $right === null : $left["=="]($right); })()) && (() => { const $left_1 = this.end; const $right_1 = other.end; return $left_1 === null ? $right_1 === null : $left_1["=="]($right_1); })());
  }
  get hashCode() {
    return __dartObjectHash([this.start, this.end]);
  }
  toString() {
    return "<" + __dartStr(__dartRuntimeType(this)) + ": from " + __dartStr(this.start) + " to " + __dartStr(this.end) + " \"" + __dartStr(this.text) + "\">";
  }
}

class SourceSpanBase extends SourceSpanMixin {
  constructor(start, end, text) {
    super();
    this.start = start;
    this.end = end;
    this.text = text;
    if (!(__dartEquals(this.end.sourceUrl, this.start.sourceUrl))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Source URLs \"" + __dartStr(this.start.sourceUrl) + "\" and " + " \"" + __dartStr(this.end.sourceUrl) + "\" don't match."); })();
      }
    } else {
      if ((this.end.offset < this.start.offset)) {
        {
          (() => { throw __dartCoreError("ArgumentError", "End " + __dartStr(this.end) + " must come after start " + __dartStr(this.start) + "."); })();
        }
      } else {
        if (!(__dartEquals(this.text.length, this.start.distance(this.end)))) {
          {
            (() => { throw __dartCoreError("ArgumentError", "Text \"" + __dartStr(this.text) + "\" must be " + __dartStr(this.start.distance(this.end)) + " " + "characters long."); })();
          }
        }
      }
    }
  }
}

class SourceSpanWithContext extends SourceSpanBase {
  constructor(start, end, text, _context) {
    super(start, end, text);
    this._context = _context;
    Object.defineProperty(this, $SourceSpanWithContext_interface, { value: true });
    if (!(__dartStringContains(this.context, text, 0))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "The context line \"" + __dartStr(this.context) + "\" must contain \"" + __dartStr(text) + "\"."); })();
      }
    }
    if ((findLineStart(this.context, text, start.column) === null)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "The span text \"" + __dartStr(text) + "\" must start at " + "column " + __dartStr((start.column + 1)) + " in a line within \"" + __dartStr(this.context) + "\"."); })();
      }
    }
  }
  get context() {
    return this._context;
  }
}
Object.defineProperty(SourceSpanWithContext, Symbol.hasInstance, { value(value) { return value != null && value[$SourceSpanWithContext_interface] === true; } });

class GlyphSet {
  constructor() {
    Object.defineProperty(this, $GlyphSet_interface, { value: true });
  }
  glyphOrAscii(glyph, alternative) {
    throw new TypeError("Abstract member GlyphSet.glyphOrAscii");
  }
  get bullet() {
    throw new TypeError("Abstract member GlyphSet.bullet");
  }
  set bullet(value) {
    Object.defineProperty(this, "bullet", { value, writable: true, configurable: true, enumerable: true });
  }
  get leftArrow() {
    throw new TypeError("Abstract member GlyphSet.leftArrow");
  }
  set leftArrow(value) {
    Object.defineProperty(this, "leftArrow", { value, writable: true, configurable: true, enumerable: true });
  }
  get rightArrow() {
    throw new TypeError("Abstract member GlyphSet.rightArrow");
  }
  set rightArrow(value) {
    Object.defineProperty(this, "rightArrow", { value, writable: true, configurable: true, enumerable: true });
  }
  get upArrow() {
    throw new TypeError("Abstract member GlyphSet.upArrow");
  }
  set upArrow(value) {
    Object.defineProperty(this, "upArrow", { value, writable: true, configurable: true, enumerable: true });
  }
  get downArrow() {
    throw new TypeError("Abstract member GlyphSet.downArrow");
  }
  set downArrow(value) {
    Object.defineProperty(this, "downArrow", { value, writable: true, configurable: true, enumerable: true });
  }
  get longLeftArrow() {
    throw new TypeError("Abstract member GlyphSet.longLeftArrow");
  }
  set longLeftArrow(value) {
    Object.defineProperty(this, "longLeftArrow", { value, writable: true, configurable: true, enumerable: true });
  }
  get longRightArrow() {
    throw new TypeError("Abstract member GlyphSet.longRightArrow");
  }
  set longRightArrow(value) {
    Object.defineProperty(this, "longRightArrow", { value, writable: true, configurable: true, enumerable: true });
  }
  get horizontalLine() {
    throw new TypeError("Abstract member GlyphSet.horizontalLine");
  }
  set horizontalLine(value) {
    Object.defineProperty(this, "horizontalLine", { value, writable: true, configurable: true, enumerable: true });
  }
  get verticalLine() {
    throw new TypeError("Abstract member GlyphSet.verticalLine");
  }
  set verticalLine(value) {
    Object.defineProperty(this, "verticalLine", { value, writable: true, configurable: true, enumerable: true });
  }
  get topLeftCorner() {
    throw new TypeError("Abstract member GlyphSet.topLeftCorner");
  }
  set topLeftCorner(value) {
    Object.defineProperty(this, "topLeftCorner", { value, writable: true, configurable: true, enumerable: true });
  }
  get topRightCorner() {
    throw new TypeError("Abstract member GlyphSet.topRightCorner");
  }
  set topRightCorner(value) {
    Object.defineProperty(this, "topRightCorner", { value, writable: true, configurable: true, enumerable: true });
  }
  get bottomLeftCorner() {
    throw new TypeError("Abstract member GlyphSet.bottomLeftCorner");
  }
  set bottomLeftCorner(value) {
    Object.defineProperty(this, "bottomLeftCorner", { value, writable: true, configurable: true, enumerable: true });
  }
  get bottomRightCorner() {
    throw new TypeError("Abstract member GlyphSet.bottomRightCorner");
  }
  set bottomRightCorner(value) {
    Object.defineProperty(this, "bottomRightCorner", { value, writable: true, configurable: true, enumerable: true });
  }
  get cross() {
    throw new TypeError("Abstract member GlyphSet.cross");
  }
  set cross(value) {
    Object.defineProperty(this, "cross", { value, writable: true, configurable: true, enumerable: true });
  }
  get teeUp() {
    throw new TypeError("Abstract member GlyphSet.teeUp");
  }
  set teeUp(value) {
    Object.defineProperty(this, "teeUp", { value, writable: true, configurable: true, enumerable: true });
  }
  get teeDown() {
    throw new TypeError("Abstract member GlyphSet.teeDown");
  }
  set teeDown(value) {
    Object.defineProperty(this, "teeDown", { value, writable: true, configurable: true, enumerable: true });
  }
  get teeLeft() {
    throw new TypeError("Abstract member GlyphSet.teeLeft");
  }
  set teeLeft(value) {
    Object.defineProperty(this, "teeLeft", { value, writable: true, configurable: true, enumerable: true });
  }
  get teeRight() {
    throw new TypeError("Abstract member GlyphSet.teeRight");
  }
  set teeRight(value) {
    Object.defineProperty(this, "teeRight", { value, writable: true, configurable: true, enumerable: true });
  }
  get upEnd() {
    throw new TypeError("Abstract member GlyphSet.upEnd");
  }
  set upEnd(value) {
    Object.defineProperty(this, "upEnd", { value, writable: true, configurable: true, enumerable: true });
  }
  get downEnd() {
    throw new TypeError("Abstract member GlyphSet.downEnd");
  }
  set downEnd(value) {
    Object.defineProperty(this, "downEnd", { value, writable: true, configurable: true, enumerable: true });
  }
  get leftEnd() {
    throw new TypeError("Abstract member GlyphSet.leftEnd");
  }
  set leftEnd(value) {
    Object.defineProperty(this, "leftEnd", { value, writable: true, configurable: true, enumerable: true });
  }
  get rightEnd() {
    throw new TypeError("Abstract member GlyphSet.rightEnd");
  }
  set rightEnd(value) {
    Object.defineProperty(this, "rightEnd", { value, writable: true, configurable: true, enumerable: true });
  }
  get horizontalLineBold() {
    throw new TypeError("Abstract member GlyphSet.horizontalLineBold");
  }
  set horizontalLineBold(value) {
    Object.defineProperty(this, "horizontalLineBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get verticalLineBold() {
    throw new TypeError("Abstract member GlyphSet.verticalLineBold");
  }
  set verticalLineBold(value) {
    Object.defineProperty(this, "verticalLineBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get topLeftCornerBold() {
    throw new TypeError("Abstract member GlyphSet.topLeftCornerBold");
  }
  set topLeftCornerBold(value) {
    Object.defineProperty(this, "topLeftCornerBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get topRightCornerBold() {
    throw new TypeError("Abstract member GlyphSet.topRightCornerBold");
  }
  set topRightCornerBold(value) {
    Object.defineProperty(this, "topRightCornerBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get bottomLeftCornerBold() {
    throw new TypeError("Abstract member GlyphSet.bottomLeftCornerBold");
  }
  set bottomLeftCornerBold(value) {
    Object.defineProperty(this, "bottomLeftCornerBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get bottomRightCornerBold() {
    throw new TypeError("Abstract member GlyphSet.bottomRightCornerBold");
  }
  set bottomRightCornerBold(value) {
    Object.defineProperty(this, "bottomRightCornerBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get crossBold() {
    throw new TypeError("Abstract member GlyphSet.crossBold");
  }
  set crossBold(value) {
    Object.defineProperty(this, "crossBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get teeUpBold() {
    throw new TypeError("Abstract member GlyphSet.teeUpBold");
  }
  set teeUpBold(value) {
    Object.defineProperty(this, "teeUpBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get teeDownBold() {
    throw new TypeError("Abstract member GlyphSet.teeDownBold");
  }
  set teeDownBold(value) {
    Object.defineProperty(this, "teeDownBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get teeLeftBold() {
    throw new TypeError("Abstract member GlyphSet.teeLeftBold");
  }
  set teeLeftBold(value) {
    Object.defineProperty(this, "teeLeftBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get teeRightBold() {
    throw new TypeError("Abstract member GlyphSet.teeRightBold");
  }
  set teeRightBold(value) {
    Object.defineProperty(this, "teeRightBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get upEndBold() {
    throw new TypeError("Abstract member GlyphSet.upEndBold");
  }
  set upEndBold(value) {
    Object.defineProperty(this, "upEndBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get downEndBold() {
    throw new TypeError("Abstract member GlyphSet.downEndBold");
  }
  set downEndBold(value) {
    Object.defineProperty(this, "downEndBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get leftEndBold() {
    throw new TypeError("Abstract member GlyphSet.leftEndBold");
  }
  set leftEndBold(value) {
    Object.defineProperty(this, "leftEndBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get rightEndBold() {
    throw new TypeError("Abstract member GlyphSet.rightEndBold");
  }
  set rightEndBold(value) {
    Object.defineProperty(this, "rightEndBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get horizontalLineDouble() {
    throw new TypeError("Abstract member GlyphSet.horizontalLineDouble");
  }
  set horizontalLineDouble(value) {
    Object.defineProperty(this, "horizontalLineDouble", { value, writable: true, configurable: true, enumerable: true });
  }
  get verticalLineDouble() {
    throw new TypeError("Abstract member GlyphSet.verticalLineDouble");
  }
  set verticalLineDouble(value) {
    Object.defineProperty(this, "verticalLineDouble", { value, writable: true, configurable: true, enumerable: true });
  }
  get topLeftCornerDouble() {
    throw new TypeError("Abstract member GlyphSet.topLeftCornerDouble");
  }
  set topLeftCornerDouble(value) {
    Object.defineProperty(this, "topLeftCornerDouble", { value, writable: true, configurable: true, enumerable: true });
  }
  get topRightCornerDouble() {
    throw new TypeError("Abstract member GlyphSet.topRightCornerDouble");
  }
  set topRightCornerDouble(value) {
    Object.defineProperty(this, "topRightCornerDouble", { value, writable: true, configurable: true, enumerable: true });
  }
  get bottomLeftCornerDouble() {
    throw new TypeError("Abstract member GlyphSet.bottomLeftCornerDouble");
  }
  set bottomLeftCornerDouble(value) {
    Object.defineProperty(this, "bottomLeftCornerDouble", { value, writable: true, configurable: true, enumerable: true });
  }
  get bottomRightCornerDouble() {
    throw new TypeError("Abstract member GlyphSet.bottomRightCornerDouble");
  }
  set bottomRightCornerDouble(value) {
    Object.defineProperty(this, "bottomRightCornerDouble", { value, writable: true, configurable: true, enumerable: true });
  }
  get crossDouble() {
    throw new TypeError("Abstract member GlyphSet.crossDouble");
  }
  set crossDouble(value) {
    Object.defineProperty(this, "crossDouble", { value, writable: true, configurable: true, enumerable: true });
  }
  get teeUpDouble() {
    throw new TypeError("Abstract member GlyphSet.teeUpDouble");
  }
  set teeUpDouble(value) {
    Object.defineProperty(this, "teeUpDouble", { value, writable: true, configurable: true, enumerable: true });
  }
  get teeDownDouble() {
    throw new TypeError("Abstract member GlyphSet.teeDownDouble");
  }
  set teeDownDouble(value) {
    Object.defineProperty(this, "teeDownDouble", { value, writable: true, configurable: true, enumerable: true });
  }
  get teeLeftDouble() {
    throw new TypeError("Abstract member GlyphSet.teeLeftDouble");
  }
  set teeLeftDouble(value) {
    Object.defineProperty(this, "teeLeftDouble", { value, writable: true, configurable: true, enumerable: true });
  }
  get teeRightDouble() {
    throw new TypeError("Abstract member GlyphSet.teeRightDouble");
  }
  set teeRightDouble(value) {
    Object.defineProperty(this, "teeRightDouble", { value, writable: true, configurable: true, enumerable: true });
  }
  get horizontalLineDoubleDash() {
    throw new TypeError("Abstract member GlyphSet.horizontalLineDoubleDash");
  }
  set horizontalLineDoubleDash(value) {
    Object.defineProperty(this, "horizontalLineDoubleDash", { value, writable: true, configurable: true, enumerable: true });
  }
  get horizontalLineDoubleDashBold() {
    throw new TypeError("Abstract member GlyphSet.horizontalLineDoubleDashBold");
  }
  set horizontalLineDoubleDashBold(value) {
    Object.defineProperty(this, "horizontalLineDoubleDashBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get verticalLineDoubleDash() {
    throw new TypeError("Abstract member GlyphSet.verticalLineDoubleDash");
  }
  set verticalLineDoubleDash(value) {
    Object.defineProperty(this, "verticalLineDoubleDash", { value, writable: true, configurable: true, enumerable: true });
  }
  get verticalLineDoubleDashBold() {
    throw new TypeError("Abstract member GlyphSet.verticalLineDoubleDashBold");
  }
  set verticalLineDoubleDashBold(value) {
    Object.defineProperty(this, "verticalLineDoubleDashBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get horizontalLineTripleDash() {
    throw new TypeError("Abstract member GlyphSet.horizontalLineTripleDash");
  }
  set horizontalLineTripleDash(value) {
    Object.defineProperty(this, "horizontalLineTripleDash", { value, writable: true, configurable: true, enumerable: true });
  }
  get horizontalLineTripleDashBold() {
    throw new TypeError("Abstract member GlyphSet.horizontalLineTripleDashBold");
  }
  set horizontalLineTripleDashBold(value) {
    Object.defineProperty(this, "horizontalLineTripleDashBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get verticalLineTripleDash() {
    throw new TypeError("Abstract member GlyphSet.verticalLineTripleDash");
  }
  set verticalLineTripleDash(value) {
    Object.defineProperty(this, "verticalLineTripleDash", { value, writable: true, configurable: true, enumerable: true });
  }
  get verticalLineTripleDashBold() {
    throw new TypeError("Abstract member GlyphSet.verticalLineTripleDashBold");
  }
  set verticalLineTripleDashBold(value) {
    Object.defineProperty(this, "verticalLineTripleDashBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get horizontalLineQuadrupleDash() {
    throw new TypeError("Abstract member GlyphSet.horizontalLineQuadrupleDash");
  }
  set horizontalLineQuadrupleDash(value) {
    Object.defineProperty(this, "horizontalLineQuadrupleDash", { value, writable: true, configurable: true, enumerable: true });
  }
  get horizontalLineQuadrupleDashBold() {
    throw new TypeError("Abstract member GlyphSet.horizontalLineQuadrupleDashBold");
  }
  set horizontalLineQuadrupleDashBold(value) {
    Object.defineProperty(this, "horizontalLineQuadrupleDashBold", { value, writable: true, configurable: true, enumerable: true });
  }
  get verticalLineQuadrupleDash() {
    throw new TypeError("Abstract member GlyphSet.verticalLineQuadrupleDash");
  }
  set verticalLineQuadrupleDash(value) {
    Object.defineProperty(this, "verticalLineQuadrupleDash", { value, writable: true, configurable: true, enumerable: true });
  }
  get verticalLineQuadrupleDashBold() {
    throw new TypeError("Abstract member GlyphSet.verticalLineQuadrupleDashBold");
  }
  set verticalLineQuadrupleDashBold(value) {
    Object.defineProperty(this, "verticalLineQuadrupleDashBold", { value, writable: true, configurable: true, enumerable: true });
  }
}
Object.defineProperty(GlyphSet, Symbol.hasInstance, { value(value) { return value != null && value[$GlyphSet_interface] === true; } });

class AsciiGlyphSet {
  constructor() {
    Object.defineProperty(this, $GlyphSet_interface, { value: true });
  }
  glyphOrAscii(glyph, alternative) {
    return alternative;
  }
  get bullet() {
    return "*";
  }
  get leftArrow() {
    return "<";
  }
  get rightArrow() {
    return ">";
  }
  get upArrow() {
    return "^";
  }
  get downArrow() {
    return "v";
  }
  get longLeftArrow() {
    return "<=";
  }
  get longRightArrow() {
    return "=>";
  }
  get horizontalLine() {
    return "-";
  }
  get verticalLine() {
    return "|";
  }
  get topLeftCorner() {
    return ",";
  }
  get topRightCorner() {
    return ",";
  }
  get bottomLeftCorner() {
    return "'";
  }
  get bottomRightCorner() {
    return "'";
  }
  get cross() {
    return "+";
  }
  get teeUp() {
    return "+";
  }
  get teeDown() {
    return "+";
  }
  get teeLeft() {
    return "+";
  }
  get teeRight() {
    return "+";
  }
  get upEnd() {
    return "'";
  }
  get downEnd() {
    return ",";
  }
  get leftEnd() {
    return "-";
  }
  get rightEnd() {
    return "-";
  }
  get horizontalLineBold() {
    return "=";
  }
  get verticalLineBold() {
    return "|";
  }
  get topLeftCornerBold() {
    return ",";
  }
  get topRightCornerBold() {
    return ",";
  }
  get bottomLeftCornerBold() {
    return "'";
  }
  get bottomRightCornerBold() {
    return "'";
  }
  get crossBold() {
    return "+";
  }
  get teeUpBold() {
    return "+";
  }
  get teeDownBold() {
    return "+";
  }
  get teeLeftBold() {
    return "+";
  }
  get teeRightBold() {
    return "+";
  }
  get upEndBold() {
    return "'";
  }
  get downEndBold() {
    return ",";
  }
  get leftEndBold() {
    return "-";
  }
  get rightEndBold() {
    return "-";
  }
  get horizontalLineDouble() {
    return "=";
  }
  get verticalLineDouble() {
    return "|";
  }
  get topLeftCornerDouble() {
    return ",";
  }
  get topRightCornerDouble() {
    return ",";
  }
  get bottomLeftCornerDouble() {
    return "\"";
  }
  get bottomRightCornerDouble() {
    return "\"";
  }
  get crossDouble() {
    return "+";
  }
  get teeUpDouble() {
    return "+";
  }
  get teeDownDouble() {
    return "+";
  }
  get teeLeftDouble() {
    return "+";
  }
  get teeRightDouble() {
    return "+";
  }
  get horizontalLineDoubleDash() {
    return "-";
  }
  get horizontalLineDoubleDashBold() {
    return "-";
  }
  get verticalLineDoubleDash() {
    return "|";
  }
  get verticalLineDoubleDashBold() {
    return "|";
  }
  get horizontalLineTripleDash() {
    return "-";
  }
  get horizontalLineTripleDashBold() {
    return "-";
  }
  get verticalLineTripleDash() {
    return "|";
  }
  get verticalLineTripleDashBold() {
    return "|";
  }
  get horizontalLineQuadrupleDash() {
    return "-";
  }
  get horizontalLineQuadrupleDashBold() {
    return "-";
  }
  get verticalLineQuadrupleDash() {
    return "|";
  }
  get verticalLineQuadrupleDashBold() {
    return "|";
  }
}

class UnicodeGlyphSet {
  constructor() {
    Object.defineProperty(this, $GlyphSet_interface, { value: true });
  }
  glyphOrAscii(glyph, alternative) {
    return glyph;
  }
  get bullet() {
    return "•";
  }
  get leftArrow() {
    return "←";
  }
  get rightArrow() {
    return "→";
  }
  get upArrow() {
    return "↑";
  }
  get downArrow() {
    return "↓";
  }
  get longLeftArrow() {
    return "◀━";
  }
  get longRightArrow() {
    return "━▶";
  }
  get horizontalLine() {
    return "─";
  }
  get verticalLine() {
    return "│";
  }
  get topLeftCorner() {
    return "┌";
  }
  get topRightCorner() {
    return "┐";
  }
  get bottomLeftCorner() {
    return "└";
  }
  get bottomRightCorner() {
    return "┘";
  }
  get cross() {
    return "┼";
  }
  get teeUp() {
    return "┴";
  }
  get teeDown() {
    return "┬";
  }
  get teeLeft() {
    return "┤";
  }
  get teeRight() {
    return "├";
  }
  get upEnd() {
    return "╵";
  }
  get downEnd() {
    return "╷";
  }
  get leftEnd() {
    return "╴";
  }
  get rightEnd() {
    return "╶";
  }
  get horizontalLineBold() {
    return "━";
  }
  get verticalLineBold() {
    return "┃";
  }
  get topLeftCornerBold() {
    return "┏";
  }
  get topRightCornerBold() {
    return "┓";
  }
  get bottomLeftCornerBold() {
    return "┗";
  }
  get bottomRightCornerBold() {
    return "┛";
  }
  get crossBold() {
    return "╋";
  }
  get teeUpBold() {
    return "┻";
  }
  get teeDownBold() {
    return "┳";
  }
  get teeLeftBold() {
    return "┫";
  }
  get teeRightBold() {
    return "┣";
  }
  get upEndBold() {
    return "╹";
  }
  get downEndBold() {
    return "╻";
  }
  get leftEndBold() {
    return "╸";
  }
  get rightEndBold() {
    return "╺";
  }
  get horizontalLineDouble() {
    return "═";
  }
  get verticalLineDouble() {
    return "║";
  }
  get topLeftCornerDouble() {
    return "╔";
  }
  get topRightCornerDouble() {
    return "╗";
  }
  get bottomLeftCornerDouble() {
    return "╚";
  }
  get bottomRightCornerDouble() {
    return "╝";
  }
  get crossDouble() {
    return "╬";
  }
  get teeUpDouble() {
    return "╩";
  }
  get teeDownDouble() {
    return "╦";
  }
  get teeLeftDouble() {
    return "╣";
  }
  get teeRightDouble() {
    return "╠";
  }
  get horizontalLineDoubleDash() {
    return "╌";
  }
  get horizontalLineDoubleDashBold() {
    return "╍";
  }
  get verticalLineDoubleDash() {
    return "╎";
  }
  get verticalLineDoubleDashBold() {
    return "╏";
  }
  get horizontalLineTripleDash() {
    return "┄";
  }
  get horizontalLineTripleDashBold() {
    return "┅";
  }
  get verticalLineTripleDash() {
    return "┆";
  }
  get verticalLineTripleDashBold() {
    return "┇";
  }
  get horizontalLineQuadrupleDash() {
    return "┈";
  }
  get horizontalLineQuadrupleDashBold() {
    return "┉";
  }
  get verticalLineQuadrupleDash() {
    return "┊";
  }
  get verticalLineQuadrupleDashBold() {
    return "┋";
  }
}

class Highlighter {
  constructor(span, { color = null } = {}) {
    return $Highlighter__(new.target, Highlighter._collateLines([new _Highlight(span, { primary: true })]), (function() {
      if (__dartEquals(color, true)) {
        return "\u001b[31m";
      }
      if (__dartEquals(color, false)) {
        return null;
      }
      return __dartAs(color, value => (value === null || typeof value === "string"), "String?");
})(), null);
  }
  static multiple(primarySpan, primaryLabel, secondarySpans, { color = false, primaryColor = null, secondaryColor = null } = {}) {
    return $Highlighter_multiple(Highlighter, primarySpan, primaryLabel, secondarySpans, { color: color, primaryColor: primaryColor, secondaryColor: secondaryColor });
  }
  static _(_lines, _primaryColor, _secondaryColor) {
    return $Highlighter__(Highlighter, _lines, _primaryColor, _secondaryColor);
  }
  static _contiguous(lines) {
    for (let i = 0; (i < (lines.length - 1)); i = (i + 1)) {
      {
        const thisLine = __dartIndexGet(lines, i);
        const nextLine = __dartIndexGet(lines, (i + 1));
        if ((!(__dartEquals((thisLine.number + 1), nextLine.number)) && __dartEquals(thisLine.url, nextLine.url))) {
          {
            return false;
          }
        }
      }
    }
    return true;
  }
  static _collateLines(highlights) {
    const highlightsByUrl = groupBy(highlights, function(highlight) { return (highlight.span.sourceUrl ?? ({})); });
    {
      let _sync_for_iterator = __dartIterator(Array.from(highlightsByUrl.values()));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let list = _sync_for_iterator.current;
          {
            __dartListSort(list, function(highlight1, highlight2) { return highlight1.span.compareTo(highlight2.span); });
          }
        }
      }
    }
    return Array.from(Array.from(Array.from(highlightsByUrl, ([key, value]) => ({ key, value }))).flatMap((value) => Array.from((function(entry) {
      const url_1 = entry.key;
      const highlightsForFile = entry.value;
      const lines = new Array(0).fill(null);
      {
        let _sync_for_iterator = __dartIterator(highlightsForFile);
        for (; _sync_for_iterator.moveNext(); ) {
          {
            let highlight = _sync_for_iterator.current;
            {
              const context_1 = highlight.span.context;
              const lineStart = __dartNullCheck(findLineStart(context_1, highlight.span.text, highlight.span.start.column));
              const linesBeforeSpan = __dartIterableLength(__dartPatternAllMatches("\n", context_1.substring(0, lineStart), 0));
              let lineNumber = (highlight.span.start.line - linesBeforeSpan);
              {
                let _sync_for_iterator_1 = __dartIterator(context_1.split("\n"));
                for (; _sync_for_iterator_1.moveNext(); ) {
                  {
                    let line = _sync_for_iterator_1.current;
                    {
                      if ((lines.length === 0 || (lineNumber > __dartIndexGet(lines, lines.length - 1).number))) {
                        {
                          (lines.push(new _Line(line, lineNumber, url_1)), null);
                        }
                      }
                      lineNumber = (lineNumber + 1);
                    }
                  }
                }
              }
            }
          }
        }
      }
      const activeHighlights = new Array(0).fill(null);
      let highlightIndex = 0;
      {
        let _sync_for_iterator_2 = __dartIterator(lines);
        for (; _sync_for_iterator_2.moveNext(); ) {
          {
            let line_1 = _sync_for_iterator_2.current;
            {
              __dartListRemoveWhere(activeHighlights, function(highlight) { return (highlight.span.end.line < line_1.number); });
              const oldHighlightLength = activeHighlights.length;
              L:
              {
                let _sync_for_iterator_3 = __dartIterator(Array.from(highlightsForFile).slice(highlightIndex));
                for (; _sync_for_iterator_3.moveNext(); ) {
                  {
                    let highlight_1 = _sync_for_iterator_3.current;
                    {
                      if ((highlight_1.span.start.line > line_1.number)) {
                        break L;
                      }
                      (activeHighlights.push(highlight_1), null);
                    }
                  }
                }
              }
              highlightIndex = (highlightIndex + (activeHighlights.length - oldHighlightLength));
              (line_1.highlights.push(...Array.from(activeHighlights)), null);
            }
          }
        }
      }
      return lines;
})(value))));
  }
  highlight() {
    this._writeFileStart(__dartIterableFirst(this._lines).url);
    const highlightsByColumn = __dartFixedList(new Array(this._maxMultilineSpans).fill(null));
    for (let i = 0; (i < this._lines.length); i = (i + 1)) {
      {
        const line = __dartIndexGet(this._lines, i);
        if ((i > 0)) {
          {
            const lastLine = __dartIndexGet(this._lines, (i - 1));
            if (!(__dartEquals(lastLine.url, line.url))) {
              {
                this._writeSidebar({ end: upEnd() });
                this._buffer.writeln();
                this._writeFileStart(line.url);
              }
            } else {
              if (!(__dartEquals((lastLine.number + 1), line.number))) {
                {
                  this._writeSidebar({ text: "..." });
                  this._buffer.writeln();
                }
              }
            }
          }
        }
        {
          let _sync_for_iterator = __dartIterator(Array.from(line.highlights).reverse());
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let highlight = _sync_for_iterator.current;
              {
                if (((isMultiline(highlight.span) && __dartEquals(highlight.span.start.line, line.number)) && this._isOnlyWhitespace(line.text.substring(0, highlight.span.start.column)))) {
                  {
                    replaceFirstNull(highlightsByColumn, highlight);
                  }
                }
              }
            }
          }
        }
        this._writeSidebar({ line: line.number });
        this._buffer.write(" ");
        this._writeMultilineHighlights(line, highlightsByColumn);
        if (highlightsByColumn.length !== 0) {
          this._buffer.write(" ");
        }
        const primaryIdx = line.highlights.findIndex((value, index) => index >= 0 && (function(highlight) { return highlight.isPrimary; })(value));
        const primary = (__dartEquals(primaryIdx, (-1)) ? null : __dartIndexGet(line.highlights, primaryIdx));
        if (!((primary === null))) {
          {
            this._writeHighlightedText(line.text, (__dartEquals(primary.span.start.line, line.number) ? primary.span.start.column : 0), (__dartEquals(primary.span.end.line, line.number) ? primary.span.end.column : line.text.length), { color: this._primaryColor });
          }
        } else {
          {
            this._writeText(line.text);
          }
        }
        this._buffer.writeln();
        if (!((primary === null))) {
          this._writeIndicator(line, primary, highlightsByColumn);
        }
        {
          let _sync_for_iterator_1 = __dartIterator(line.highlights);
          for (; _sync_for_iterator_1.moveNext(); ) {
            {
              let highlight_1 = _sync_for_iterator_1.current;
              L:
              {
                if (highlight_1.isPrimary) {
                  break L;
                }
                this._writeIndicator(line, highlight_1, highlightsByColumn);
              }
            }
          }
        }
      }
    }
    this._writeSidebar({ end: upEnd() });
    return __dartStr(this._buffer);
  }
  _writeFileStart(url_1) {
    if ((!(this._multipleFiles) || !(url_1 != null && typeof url_1 === "object" && url_1.__dartType === "Uri"))) {
      {
        this._writeSidebar({ end: downEnd() });
      }
    } else {
      {
        this._writeSidebar({ end: topLeftCorner() });
        this._colorize(() => { return this._buffer.write(__dartStr((horizontalLine() * 2)) + ">"); }, { color: "\u001b[34m" });
        this._buffer.write(" " + __dartStr(prettyUri(url_1)));
      }
    }
    this._buffer.writeln();
  }
  _writeMultilineHighlights(line, highlightsByColumn, { current: current_1 = null } = {}) {
    let openedOnThisLine = false;
    let openedOnThisLineColor = null;
    const currentColor = ((current_1 === null) ? null : (current_1.isPrimary ? this._primaryColor : this._secondaryColor));
    let foundCurrent = false;
    {
      let _sync_for_iterator = __dartIterator(highlightsByColumn);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let highlight = _sync_for_iterator.current;
          {
            const startLine = (() => { let v = highlight; return ((v === null) ? null : v.span.start.line); })();
            const endLine = (() => { let v_1 = highlight; return ((v_1 === null) ? null : v_1.span.end.line); })();
            if ((!((current_1 === null)) && __dartEquals(highlight, current_1))) {
              {
                foundCurrent = true;
                this._colorize(() => {
                  this._buffer.write((__dartEquals(startLine, line.number) ? topLeftCorner() : bottomLeftCorner()));
}, { color: currentColor });
              }
            } else {
              if (foundCurrent) {
                {
                  this._colorize(() => {
                    this._buffer.write(((highlight === null) ? horizontalLine() : cross()));
}, { color: currentColor });
                }
              } else {
                if ((highlight === null)) {
                  {
                    if (openedOnThisLine) {
                      {
                        this._colorize(() => { return this._buffer.write(horizontalLine()); }, { color: openedOnThisLineColor });
                      }
                    } else {
                      {
                        this._buffer.write(" ");
                      }
                    }
                  }
                } else {
                  {
                    this._colorize(() => {
                      const vertical = (openedOnThisLine ? cross() : verticalLine());
                      if (!((current_1 === null))) {
                        {
                          this._buffer.write(vertical);
                        }
                      } else {
                        if (__dartEquals(startLine, line.number)) {
                          {
                            this._colorize(() => {
                              this._buffer.write(glyphOrAscii((openedOnThisLine ? "┬" : "┌"), "/"));
}, { color: openedOnThisLineColor });
                            openedOnThisLine = true;
                            ((openedOnThisLineColor === null) ? openedOnThisLineColor = (highlight.isPrimary ? this._primaryColor : this._secondaryColor) : null);
                          }
                        } else {
                          if ((__dartEquals(endLine, line.number) && __dartEquals(highlight.span.end.column, line.text.length))) {
                            {
                              this._buffer.write(((highlight.label === null) ? glyphOrAscii("└", "\\") : vertical));
                            }
                          } else {
                            {
                              this._colorize(() => {
                                this._buffer.write(vertical);
}, { color: openedOnThisLineColor });
                            }
                          }
                        }
                      }
}, { color: (highlight.isPrimary ? this._primaryColor : this._secondaryColor) });
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  _writeHighlightedText(text, startColumn, endColumn, { color } = {}) {
    this._writeText(text.substring(0, startColumn));
    this._colorize(() => { return this._writeText(text.substring(startColumn, endColumn)); }, { color: color });
    this._writeText(text.substring(endColumn, text.length));
  }
  _writeIndicator(line, highlight, highlightsByColumn) {
    const color = (highlight.isPrimary ? this._primaryColor : this._secondaryColor);
    if (!(isMultiline(highlight.span))) {
      {
        this._writeSidebar();
        this._buffer.write(" ");
        this._writeMultilineHighlights(line, highlightsByColumn, { current: highlight });
        if (highlightsByColumn.length !== 0) {
          this._buffer.write(" ");
        }
        const underlineLength = this._colorize(() => {
          const start = this._buffer.length;
          this._writeUnderline(line, highlight.span, (highlight.isPrimary ? "^" : horizontalLineBold()));
          return (this._buffer.length - start);
}, { color: color });
        this._writeLabel(highlight, highlightsByColumn, underlineLength);
      }
    } else {
      if (__dartEquals(highlight.span.start.line, line.number)) {
        {
          if (__dartIterableContains(highlightsByColumn, highlight)) {
            return;
          }
          replaceFirstNull(highlightsByColumn, highlight);
          this._writeSidebar();
          this._buffer.write(" ");
          this._writeMultilineHighlights(line, highlightsByColumn, { current: highlight });
          this._colorize(() => { return this._writeArrow(line, highlight.span.start.column); }, { color: color });
          this._buffer.writeln();
        }
      } else {
        if (__dartEquals(highlight.span.end.line, line.number)) {
          {
            const coversWholeLine = __dartEquals(highlight.span.end.column, line.text.length);
            if ((coversWholeLine && (highlight.label === null))) {
              {
                replaceWithNull(highlightsByColumn, highlight);
                return;
              }
            }
            this._writeSidebar();
            this._buffer.write(" ");
            this._writeMultilineHighlights(line, highlightsByColumn, { current: highlight });
            const underlineLength_1 = this._colorize(() => {
              const start = this._buffer.length;
              if (coversWholeLine) {
                {
                  this._buffer.write((horizontalLine() * 3));
                }
              } else {
                {
                  this._writeArrow(line, Math.max((highlight.span.end.column - 1), 0), { beginning: false });
                }
              }
              return (this._buffer.length - start);
}, { color: color });
            this._writeLabel(highlight, highlightsByColumn, underlineLength_1);
            replaceWithNull(highlightsByColumn, highlight);
          }
        }
      }
    }
  }
  _writeUnderline(line, span, character) {
    let startColumn = span.start.column;
    let endColumn = span.end.column;
    const tabsBefore = this._countTabs(line.text.substring(0, startColumn));
    const tabsInside = this._countTabs(line.text.substring(startColumn, endColumn));
    startColumn = (startColumn + (tabsBefore * (4 - 1)));
    endColumn = (endColumn + ((tabsBefore + tabsInside) * (4 - 1)));
    (() => { let v = this._buffer; return (() => {
      v.write((" " * startColumn));
      v.write((character * Math.max((endColumn - startColumn), 1)));
      return v;
    })(); })();
  }
  _writeArrow(line, column, { beginning = true } = {}) {
    const tabs = this._countTabs(line.text.substring(0, (column + (beginning ? 0 : 1))));
    (() => { let v = this._buffer; return (() => {
      v.write((horizontalLine() * ((1 + column) + (tabs * (4 - 1)))));
      v.write("^");
      return v;
    })(); })();
  }
  _writeLabel(highlight, highlightsByColumn, underlineLength) {
    const label = highlight.label;
    if ((label === null)) {
      {
        this._buffer.writeln();
        return;
      }
    }
    const lines = label.split("\n");
    const color = (highlight.isPrimary ? this._primaryColor : this._secondaryColor);
    this._colorize(() => { return this._buffer.write(" " + __dartStr(__dartIndexGet(lines, 0))); }, { color: color });
    this._buffer.writeln();
    {
      let _sync_for_iterator = __dartIterator(Array.from(lines).slice(1));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let text = _sync_for_iterator.current;
          {
            this._writeSidebar();
            this._buffer.write(" ");
            {
              let _sync_for_iterator_1 = __dartIterator(highlightsByColumn);
              for (; _sync_for_iterator_1.moveNext(); ) {
                {
                  let columnHighlight = _sync_for_iterator_1.current;
                  {
                    if (((columnHighlight === null) || __dartEquals(columnHighlight, highlight))) {
                      {
                        this._buffer.write(" ");
                      }
                    } else {
                      {
                        this._buffer.write(verticalLine());
                      }
                    }
                  }
                }
              }
            }
            this._buffer.write((" " * underlineLength));
            this._colorize(() => { return this._buffer.write(" " + __dartStr(text)); }, { color: color });
            this._buffer.writeln();
          }
        }
      }
    }
  }
  _writeText(text) {
    {
      let _sync_for_iterator = __dartIterator(Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let char = _sync_for_iterator.current;
          {
            if (__dartEquals(char, 9)) {
              {
                this._buffer.write((" " * 4));
              }
            } else {
              {
                this._buffer.writeCharCode(char);
              }
            }
          }
        }
      }
    }
  }
  _writeSidebar({ line = null, text = null, end = null } = {}) {
    if (!((line === null))) {
      text = __dartStr((line + 1));
    }
    this._colorize(() => {
      (() => { let v = this._buffer; return (() => {
        v.write((text ?? "").padEnd(this._paddingBeforeSidebar, " "));
        v.write((end ?? verticalLine()));
        return v;
      })(); })();
}, { color: "\u001b[34m" });
  }
  _countTabs(text) {
    let count = 0;
    {
      let _sync_for_iterator = __dartIterator(Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let char = _sync_for_iterator.current;
          {
            if (__dartEquals(char, 9)) {
              count = (count + 1);
            }
          }
        }
      }
    }
    return count;
  }
  _isOnlyWhitespace(text) {
    {
      let _sync_for_iterator = __dartIterator(Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let char = _sync_for_iterator.current;
          {
            if ((!(__dartEquals(char, 32)) && !(__dartEquals(char, 9)))) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }
  _colorize(callback, { color } = {}) {
    if ((!((this._primaryColor === null)) && !((color === null)))) {
      this._buffer.write(color);
    }
    const result = (callback)();
    if ((!((this._primaryColor === null)) && !((color === null)))) {
      this._buffer.write("\u001b[0m");
    }
    return result;
  }
}

function $Highlighter_multiple($newTarget, primarySpan, primaryLabel, secondarySpans, { color = false, primaryColor = null, secondaryColor = null } = {}) {
  return $Highlighter__($newTarget, Highlighter._collateLines((() => {
    const v = [new _Highlight(primarySpan, { label: primaryLabel, primary: true })];
    {
      let _sync_for_iterator = __dartIterator(Array.from(secondarySpans, ([key, value]) => ({ key, value })));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let entry = _sync_for_iterator.current;
          (v.push(new _Highlight(entry.key, { label: entry.value })), null);
        }
      }
    }
    return v;
  })()), (color ? (primaryColor ?? "\u001b[31m") : null), (color ? (secondaryColor ?? "\u001b[34m") : null));
}

function $Highlighter__($newTarget, _lines, _primaryColor, _secondaryColor) {
  const $self = Object.create($newTarget.prototype);
  $self._buffer = __dartStringBuffer("");
  $self._lines = _lines;
  $self._primaryColor = _primaryColor;
  $self._secondaryColor = _secondaryColor;
  $self._paddingBeforeSidebar = (1 + Math.max(__dartStr((__dartIndexGet(_lines, _lines.length - 1).number + 1)).length, (Highlighter._contiguous(_lines) ? 0 : 3)));
  $self._maxMultilineSpans = Array.from(Array.from(_lines, function(line) { return __dartIterableLength(Array.from(line.highlights).filter(function(highlight) { return isMultiline(highlight.span); })); })).reduce((previous, value) => (((left, right) => Math.max(left, right)))(previous, value));
  $self._multipleFiles = !(isAllTheSame(Array.from(_lines, function(line) { return line.url; })));
  return $self;
}

class _Highlight {
  constructor(span, { label = null, primary = false } = {}) {
    this.span = (function() {
      let newSpan = _Highlight._normalizeContext(span);
      newSpan = _Highlight._normalizeNewlines(newSpan);
      newSpan = _Highlight._normalizeTrailingNewline(newSpan);
      return _Highlight._normalizeEndOfLine(newSpan);
})();
    this.isPrimary = primary;
    this.label = ((label)?.replaceAll("\r\n", "\n") ?? null);
  }
  static _normalizeContext(span) {
    return ((span instanceof SourceSpanWithContext && !((findLineStart(span.context, span.text, span.start.column) === null))) ? span : new SourceSpanWithContext(new SourceLocation(span.start.offset, { sourceUrl: span.sourceUrl, line: 0, column: 0 }), new SourceLocation(span.end.offset, { sourceUrl: span.sourceUrl, line: countCodeUnits(span.text, 10), column: _Highlight._lastLineLength(span.text) }), span.text, span.text));
  }
  static _normalizeNewlines(span) {
    const text = span.text;
    if (!(text.includes("\r\n"))) {
      return span;
    }
    let endOffset = span.end.offset;
    for (let i = 0; (i < (text.length - 1)); i = (i + 1)) {
      {
        if ((__dartEquals(text.charCodeAt(i), 13) && __dartEquals(text.charCodeAt((i + 1)), 10))) {
          {
            endOffset = (endOffset - 1);
          }
        }
      }
    }
    return new SourceSpanWithContext(span.start, new SourceLocation(endOffset, { sourceUrl: span.sourceUrl, line: span.end.line, column: span.end.column }), text.replaceAll("\r\n", "\n"), span.context.replaceAll("\r\n", "\n"));
  }
  static _normalizeTrailingNewline(span) {
    if (!(span.context.endsWith("\n"))) {
      return span;
    }
    if (span.text.endsWith("\n\n")) {
      return span;
    }
    const context_1 = span.context.substring(0, (span.context.length - 1));
    let text = span.text;
    let start = span.start;
    let end = span.end;
    if ((span.text.endsWith("\n") && _Highlight._isTextAtEndOfContext(span))) {
      {
        text = span.text.substring(0, (span.text.length - 1));
        if (text.length === 0) {
          {
            end = start;
          }
        } else {
          {
            end = new SourceLocation((span.end.offset - 1), { sourceUrl: span.sourceUrl, line: (span.end.line - 1), column: _Highlight._lastLineLength(context_1) });
            start = (__dartEquals(span.start.offset, span.end.offset) ? end : span.start);
          }
        }
      }
    }
    return new SourceSpanWithContext(start, end, text, context_1);
  }
  static _normalizeEndOfLine(span) {
    if (!(__dartEquals(span.end.column, 0))) {
      return span;
    }
    if (__dartEquals(span.end.line, span.start.line)) {
      return span;
    }
    const text = span.text.substring(0, (span.text.length - 1));
    return new SourceSpanWithContext(span.start, new SourceLocation((span.end.offset - 1), { sourceUrl: span.sourceUrl, line: (span.end.line - 1), column: ((text.length - text.lastIndexOf("\n")) - 1) }), text, (span.context.endsWith("\n") ? span.context.substring(0, (span.context.length - 1)) : span.context));
  }
  static _lastLineLength(text) {
    if (text.length === 0) {
      {
        return 0;
      }
    } else {
      if (__dartEquals(text.charCodeAt((text.length - 1)), 10)) {
        {
          return (__dartEquals(text.length, 1) ? 0 : ((text.length - text.lastIndexOf("\n", (text.length - 2))) - 1));
        }
      } else {
        {
          return ((text.length - text.lastIndexOf("\n")) - 1);
        }
      }
    }
  }
  static _isTextAtEndOfContext(span) {
    return __dartEquals(((__dartNullCheck(findLineStart(span.context, span.text, span.start.column)) + span.start.column) + span.length), span.context.length);
  }
  toString() {
    const buffer = __dartStringBuffer("");
    if (this.isPrimary) {
      buffer.write("primary ");
    }
    buffer.write(__dartStr(this.span.start.line) + ":" + __dartStr(this.span.start.column) + "-" + __dartStr(this.span.end.line) + ":" + __dartStr(this.span.end.column));
    if (!((this.label === null))) {
      buffer.write(" (" + __dartStr(this.label) + ")");
    }
    return __dartStr(buffer);
  }
}

class _Line {
  constructor(text, number, url_1) {
    this.highlights = new Array(0).fill(null);
    this.text = text;
    this.number = number;
    this.url = url_1;
  }
  toString() {
    return __dartStr(this.number) + ": \"" + __dartStr(this.text) + "\" (" + __dartStr(__dartIterableJoin(this.highlights, ", ")) + ")";
  }
}

class SourceLocation {
  constructor(offset, { sourceUrl = null, line = null, column = null } = {}) {
    this.offset = offset;
    this.sourceUrl = (typeof sourceUrl === "string" ? __dartUriParse(sourceUrl, false) : __dartAs(sourceUrl, value => (value === null || value != null && typeof value === "object" && value.__dartType === "Uri"), "Uri?"));
    this.line = (line ?? 0);
    this.column = (column ?? offset);
    Object.defineProperty(this, $SourceLocation_interface, { value: true });
    if ((this.offset < 0)) {
      {
        (() => { throw __dartCoreError("RangeError", "Offset may not be negative, was " + __dartStr(this.offset) + "."); })();
      }
    } else {
      if ((!((line === null)) && (line < 0))) {
        {
          (() => { throw __dartCoreError("RangeError", "Line may not be negative, was " + __dartStr(line) + "."); })();
        }
      } else {
        if ((!((column === null)) && (column < 0))) {
          {
            (() => { throw __dartCoreError("RangeError", "Column may not be negative, was " + __dartStr(column) + "."); })();
          }
        }
      }
    }
  }
  get toolString() {
    const source = (this.sourceUrl ?? "unknown source");
    return __dartStr(source) + ":" + __dartStr((this.line + 1)) + ":" + __dartStr((this.column + 1));
  }
  distance(other) {
    if (!(__dartEquals(this.sourceUrl, other.sourceUrl))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Source URLs \"" + __dartStr(this.sourceUrl) + "\" and " + "\"" + __dartStr(other.sourceUrl) + "\" don't match."); })();
      }
    }
    return Math.abs((this.offset - other.offset));
  }
  pointSpan() {
    return new SourceSpan(this, this, "");
  }
  compareTo(other) {
    if (!(__dartEquals(this.sourceUrl, other.sourceUrl))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Source URLs \"" + __dartStr(this.sourceUrl) + "\" and " + "\"" + __dartStr(other.sourceUrl) + "\" don't match."); })();
      }
    }
    return (this.offset - other.offset);
  }
  "=="(other) {
    return ((other instanceof SourceLocation && __dartEquals(this.sourceUrl, other.sourceUrl)) && __dartEquals(this.offset, other.offset));
  }
  get hashCode() {
    return (((this.sourceUrl)?.hashCode ?? 0) + this.offset);
  }
  toString() {
    return "<" + __dartStr(__dartRuntimeType(this)) + ": " + __dartStr(this.offset) + " " + __dartStr(this.toolString) + ">";
  }
}
Object.defineProperty(SourceLocation, Symbol.hasInstance, { value(value) { return value != null && value[$SourceLocation_interface] === true; } });

class SourceLocationBase extends SourceLocation {
  constructor(offset, { sourceUrl = null, line = null, column = null } = {}) {
    super(offset, { sourceUrl: sourceUrl, line: line, column: column });
  }
}

class SourceLocationMixin {
  constructor() {
    Object.defineProperty(this, $SourceLocation_interface, { value: true });
  }
  get toolString() {
    const source = (this.sourceUrl ?? "unknown source");
    return __dartStr(source) + ":" + __dartStr((this.line + 1)) + ":" + __dartStr((this.column + 1));
  }
  distance(other) {
    if (!(__dartEquals(this.sourceUrl, other.sourceUrl))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Source URLs \"" + __dartStr(this.sourceUrl) + "\" and " + "\"" + __dartStr(other.sourceUrl) + "\" don't match."); })();
      }
    }
    return Math.abs((this.offset - other.offset));
  }
  pointSpan() {
    return new SourceSpan(this, this, "");
  }
  compareTo(other) {
    if (!(__dartEquals(this.sourceUrl, other.sourceUrl))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Source URLs \"" + __dartStr(this.sourceUrl) + "\" and " + "\"" + __dartStr(other.sourceUrl) + "\" don't match."); })();
      }
    }
    return (this.offset - other.offset);
  }
  "=="(other) {
    return ((other instanceof SourceLocation && __dartEquals(this.sourceUrl, other.sourceUrl)) && __dartEquals(this.offset, other.offset));
  }
  get hashCode() {
    return (((this.sourceUrl)?.hashCode ?? 0) + this.offset);
  }
  toString() {
    return "<" + __dartStr(__dartRuntimeType(this)) + ": " + __dartStr(this.offset) + " " + __dartStr(this.toolString) + ">";
  }
}

class SourceFile {
  constructor(text, { url: url_1 = null } = {}) {
    return $SourceFile_decoded(new.target, Array.from(text, (char) => char.codePointAt(0)), { url: url_1 });
  }
  static fromString(text, { url: url_1 = null } = {}) {
    return $SourceFile_fromString(SourceFile, text, { url: url_1 });
  }
  static decoded(decodedChars, { url: url_1 = null } = {}) {
    return $SourceFile_decoded(SourceFile, decodedChars, { url: url_1 });
  }
  static _fromList(decodedChars, { url: url_1 = null } = {}) {
    return $SourceFile__fromList(SourceFile, decodedChars, { url: url_1 });
  }
  get codeUnits() {
    return this._decodedChars;
  }
  get length() {
    return this._decodedChars.length;
  }
  get lines() {
    return this._lineStarts.length;
  }
  span(start, end = null) {
    ((end === null) ? end = this.length : null);
    return new _FileSpan(this, start, end);
  }
  location(offset) {
    return FileLocation._(this, offset);
  }
  getLine(offset) {
    if ((offset < 0)) {
      {
        (() => { throw __dartCoreError("RangeError", "Offset may not be negative, was " + __dartStr(offset) + "."); })();
      }
    } else {
      if ((offset > this.length)) {
        {
          (() => { throw __dartCoreError("RangeError", "Offset " + __dartStr(offset) + " must not be greater than the number " + "of characters in the file, " + __dartStr(this.length) + "."); })();
        }
      }
    }
    if ((offset < __dartIterableFirst(this._lineStarts))) {
      return (-1);
    }
    if ((offset >= __dartIterableLast(this._lineStarts))) {
      return (this._lineStarts.length - 1);
    }
    if (this._isNearCachedLine(offset)) {
      return __dartNullCheck(this._cachedLine);
    }
    this._cachedLine = (this._binarySearch(offset) - 1);
    return __dartNullCheck(this._cachedLine);
  }
  _isNearCachedLine(offset) {
    if ((this._cachedLine === null)) {
      return false;
    }
    const cachedLine = __dartNullCheck(this._cachedLine);
    if ((offset < __dartIndexGet(this._lineStarts, cachedLine))) {
      return false;
    }
    if (((cachedLine >= (this._lineStarts.length - 1)) || (offset < __dartIndexGet(this._lineStarts, (cachedLine + 1))))) {
      {
        return true;
      }
    }
    if (((cachedLine >= (this._lineStarts.length - 2)) || (offset < __dartIndexGet(this._lineStarts, (cachedLine + 2))))) {
      {
        this._cachedLine = (cachedLine + 1);
        return true;
      }
    }
    return false;
  }
  _binarySearch(offset) {
    let min_1 = 0;
    let max_1 = (this._lineStarts.length - 1);
    while ((min_1 < max_1)) {
      {
        const half = (min_1 + __dartTruncDiv((max_1 - min_1), 2));
        if ((__dartIndexGet(this._lineStarts, half) > offset)) {
          {
            max_1 = half;
          }
        } else {
          {
            min_1 = (half + 1);
          }
        }
      }
    }
    return max_1;
  }
  getColumn(offset, { line = null } = {}) {
    if ((offset < 0)) {
      {
        (() => { throw __dartCoreError("RangeError", "Offset may not be negative, was " + __dartStr(offset) + "."); })();
      }
    } else {
      if ((offset > this.length)) {
        {
          (() => { throw __dartCoreError("RangeError", "Offset " + __dartStr(offset) + " must be not be greater than the " + "number of characters in the file, " + __dartStr(this.length) + "."); })();
        }
      }
    }
    if ((line === null)) {
      {
        line = this.getLine(offset);
      }
    } else {
      if ((line < 0)) {
        {
          (() => { throw __dartCoreError("RangeError", "Line may not be negative, was " + __dartStr(line) + "."); })();
        }
      } else {
        if ((line >= this.lines)) {
          {
            (() => { throw __dartCoreError("RangeError", "Line " + __dartStr(line) + " must be less than the number of " + "lines in the file, " + __dartStr(this.lines) + "."); })();
          }
        }
      }
    }
    const lineStart = __dartIndexGet(this._lineStarts, line);
    if ((lineStart > offset)) {
      {
        (() => { throw __dartCoreError("RangeError", "Line " + __dartStr(line) + " comes after offset " + __dartStr(offset) + "."); })();
      }
    }
    return (offset - lineStart);
  }
  getOffset(line, column = null) {
    ((column === null) ? column = 0 : null);
    if ((line < 0)) {
      {
        (() => { throw __dartCoreError("RangeError", "Line may not be negative, was " + __dartStr(line) + "."); })();
      }
    } else {
      if ((line >= this.lines)) {
        {
          (() => { throw __dartCoreError("RangeError", "Line " + __dartStr(line) + " must be less than the number of " + "lines in the file, " + __dartStr(this.lines) + "."); })();
        }
      } else {
        if ((column < 0)) {
          {
            (() => { throw __dartCoreError("RangeError", "Column may not be negative, was " + __dartStr(column) + "."); })();
          }
        }
      }
    }
    const result = (__dartIndexGet(this._lineStarts, line) + column);
    if (((result > this.length) || (((line + 1) < this.lines) && (result >= __dartIndexGet(this._lineStarts, (line + 1)))))) {
      {
        (() => { throw __dartCoreError("RangeError", "Line " + __dartStr(line) + " doesn't have " + __dartStr(column) + " columns."); })();
      }
    }
    return result;
  }
  getText(start, end = null) {
    return String.fromCodePoint(...Array.from(this._decodedChars.slice(start, end)));
  }
}

function $SourceFile_fromString($newTarget, text, { url: url_1 = null } = {}) {
  return $SourceFile__fromList($newTarget, Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)), { url: url_1 });
}

function $SourceFile_decoded($newTarget, decodedChars, { url: url_1 = null } = {}) {
  return $SourceFile__fromList($newTarget, Array.from(decodedChars), { url: url_1 });
}

function $SourceFile__fromList($newTarget, decodedChars, { url: url_1 = null } = {}) {
  const $self = Object.create($newTarget.prototype);
  $self._lineStarts = [0];
  $self._cachedLine = null;
  $self.url = (typeof url_1 === "string" ? __dartUriParse(url_1, false) : __dartAs(url_1, value => (value === null || value != null && typeof value === "object" && value.__dartType === "Uri"), "Uri?"));
  $self._decodedChars = new Uint32Array(decodedChars.length);
  for (let i = 0; (i < $self._decodedChars.length); i = (i + 1)) {
    {
      let c = (() => { let v = $self._decodedChars; return (() => { let v_1 = i; return (() => { let v_2 = __dartIndexGet(decodedChars, i); return (() => { let v_3 = __dartIndexSet(v, v_1, v_2); return v_2; })(); })(); })(); })();
      if (__dartEquals(c, 13)) {
        {
          const j = (i + 1);
          if (((j >= decodedChars.length) || !(__dartEquals(__dartIndexGet(decodedChars, j), 10)))) {
            c = 10;
          }
        }
      }
      if (__dartEquals(c, 10)) {
        ($self._lineStarts.push((i + 1)), null);
      }
    }
  }
  return $self;
}

class FileLocation extends SourceLocationMixin {
  constructor() {
    throw new TypeError("Class FileLocation has no unnamed constructor");
  }
  static _(file, offset) {
    return $FileLocation__(FileLocation, file, offset);
  }
  get sourceUrl() {
    return this.file.url;
  }
  get line() {
    return this.file.getLine(this.offset);
  }
  get column() {
    return this.file.getColumn(this.offset);
  }
  pointSpan() {
    return new _FileSpan(this.file, this.offset, this.offset);
  }
}

function $FileLocation__($newTarget, file, offset) {
  const $self = Reflect.construct(SourceLocationMixin, [], $newTarget);
  Object.defineProperty($self, $SourceLocation_interface, { value: true });
  $self.file = file;
  $self.offset = offset;
  if (($self.offset < 0)) {
    {
      (() => { throw __dartCoreError("RangeError", "Offset may not be negative, was " + __dartStr($self.offset) + "."); })();
    }
  } else {
    if (($self.offset > $self.file.length)) {
      {
        (() => { throw __dartCoreError("RangeError", "Offset " + __dartStr($self.offset) + " must not be greater than the number " + "of characters in the file, " + __dartStr($self.file.length) + "."); })();
      }
    }
  }
  return $self;
}

class FileSpan {
  constructor() {
    Object.defineProperty(this, $FileSpan_interface, { value: true });
    Object.defineProperty(this, $SourceSpanWithContext_interface, { value: true });
  }
  get file() {
    throw new TypeError("Abstract member FileSpan.file");
  }
  set file(value) {
    Object.defineProperty(this, "file", { value, writable: true, configurable: true, enumerable: true });
  }
  get start() {
    throw new TypeError("Abstract member FileSpan.start");
  }
  set start(value) {
    Object.defineProperty(this, "start", { value, writable: true, configurable: true, enumerable: true });
  }
  get end() {
    throw new TypeError("Abstract member FileSpan.end");
  }
  set end(value) {
    Object.defineProperty(this, "end", { value, writable: true, configurable: true, enumerable: true });
  }
  expand(other) {
    throw new TypeError("Abstract member FileSpan.expand");
  }
}
Object.defineProperty(FileSpan, Symbol.hasInstance, { value(value) { return value != null && value[$FileSpan_interface] === true; } });

class _FileSpan extends SourceSpanMixin {
  constructor(file, _start, _end) {
    super();
    this.file = file;
    this._start = _start;
    this._end = _end;
    Object.defineProperty(this, $FileSpan_interface, { value: true });
    Object.defineProperty(this, $SourceSpanWithContext_interface, { value: true });
    if ((this._end < this._start)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "End " + __dartStr(this._end) + " must come after start " + __dartStr(this._start) + "."); })();
      }
    } else {
      if ((this._end > this.file.length)) {
        {
          (() => { throw __dartCoreError("RangeError", "End " + __dartStr(this._end) + " must not be greater than the number " + "of characters in the file, " + __dartStr(this.file.length) + "."); })();
        }
      } else {
        if ((this._start < 0)) {
          {
            (() => { throw __dartCoreError("RangeError", "Start may not be negative, was " + __dartStr(this._start) + "."); })();
          }
        }
      }
    }
  }
  get sourceUrl() {
    return this.file.url;
  }
  get length() {
    return (this._end - this._start);
  }
  get start() {
    return FileLocation._(this.file, this._start);
  }
  get end() {
    return FileLocation._(this.file, this._end);
  }
  get text() {
    return this.file.getText(this._start, this._end);
  }
  get context() {
    const endLine = this.file.getLine(this._end);
    const endColumn = this.file.getColumn(this._end);
    let endOffset = null;
    if ((__dartEquals(endColumn, 0) && !(__dartEquals(endLine, 0)))) {
      {
        if (__dartEquals(this.length, 0)) {
          {
            return (__dartEquals(endLine, (this.file.lines - 1)) ? "" : this.file.getText(this.file.getOffset(endLine), this.file.getOffset((endLine + 1))));
          }
        }
        endOffset = this._end;
      }
    } else {
      if (__dartEquals(endLine, (this.file.lines - 1))) {
        {
          endOffset = this.file.length;
        }
      } else {
        {
          endOffset = this.file.getOffset((endLine + 1));
        }
      }
    }
    return this.file.getText(this.file.getOffset(this.file.getLine(this._start)), endOffset);
  }
  compareTo(other) {
    if (!(other instanceof _FileSpan)) {
      return super.compareTo(other);
    }
    const result = (this._start < other._start ? -1 : (this._start > other._start ? 1 : 0));
    return (__dartEquals(result, 0) ? (this._end < other._end ? -1 : (this._end > other._end ? 1 : 0)) : result);
  }
  union(other) {
    if (!(other instanceof FileSpan)) {
      return super.union(other);
    }
    const span = this.expand(other);
    if (other instanceof _FileSpan) {
      {
        if (((this._start > other._end) || (other._start > this._end))) {
          {
            (() => { throw __dartCoreError("ArgumentError", "Spans " + __dartStr(this) + " and " + __dartStr(other) + " are disjoint."); })();
          }
        }
      }
    } else {
      {
        if (((this._start > other.end.offset) || (other.start.offset > this._end))) {
          {
            (() => { throw __dartCoreError("ArgumentError", "Spans " + __dartStr(this) + " and " + __dartStr(other) + " are disjoint."); })();
          }
        }
      }
    }
    return span;
  }
  "=="(other) {
    if (!(other instanceof FileSpan)) {
      return super.__(other);
    }
    if (!(other instanceof _FileSpan)) {
      {
        return (super.__(other) && __dartEquals(this.sourceUrl, other.sourceUrl));
      }
    }
    return ((__dartEquals(this._start, other._start) && __dartEquals(this._end, other._end)) && __dartEquals(this.sourceUrl, other.sourceUrl));
  }
  get hashCode() {
    return __dartObjectHash([this._start, this._end, this.sourceUrl]);
  }
  expand(other) {
    if (!(__dartEquals(this.sourceUrl, other.sourceUrl))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Source URLs \"" + __dartStr(this.sourceUrl) + "\" and " + " \"" + __dartStr(other.sourceUrl) + "\" don't match."); })();
      }
    }
    if (other instanceof _FileSpan) {
      {
        const start = Math.min(this._start, other._start);
        const end = Math.max(this._end, other._end);
        return new _FileSpan(this.file, start, end);
      }
    } else {
      {
        const start_1 = Math.min(this._start, other.start.offset);
        const end_1 = Math.max(this._end, other.end.offset);
        return new _FileSpan(this.file, start_1, end_1);
      }
    }
  }
  subspan(start, end = null) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if ((__dartEquals(start, 0) && ((end === null) || __dartEquals(end, this.length)))) {
      return this;
    }
    return this.file.span((this._start + start), ((end === null) ? this._end : (this._start + end)));
  }
}

class SourceSpanException {
  constructor(_message, _span) {
    Object.defineProperty(this, "__dartCoreErrorType", { value: "Exception", writable: true, configurable: true });
    this._message = _message;
    this._span = _span;
  }
  get message() {
    return this._message;
  }
  get span() {
    return this._span;
  }
  toString({ color = null } = {}) {
    if ((this.span === null)) {
      return this.message;
    }
    return "Error on " + __dartStr(__dartNullCheck(this.span).message(this.message, { color: color }));
  }
}

class SourceSpanFormatException extends SourceSpanException {
  constructor(message, span, source = null) {
    super(message, span);
    Object.defineProperty(this, "__dartCoreErrorType", { value: "FormatException", writable: true, configurable: true });
    this.source = source;
  }
  get offset() {
    return (() => { let v = this.span; return ((v === null) ? null : v.start.offset); })();
  }
}

class MultiSourceSpanException extends SourceSpanException {
  constructor(message, span, primaryLabel, secondarySpans) {
    super(message, span);
    this.primaryLabel = primaryLabel;
    this.secondarySpans = __dartConstMap(secondarySpans);
  }
  toString({ color = null, secondaryColor = null } = {}) {
    if ((this.span === null)) {
      return this.message;
    }
    let useColor = false;
    let primaryColor = null;
    if (typeof color === "string") {
      {
        useColor = true;
        primaryColor = color;
      }
    } else {
      if (__dartEquals(color, true)) {
        {
          useColor = true;
        }
      }
    }
    const formatted = SourceSpanExtension_messageMultiple(__dartNullCheck(this.span), this.message, this.primaryLabel, this.secondarySpans, { color: useColor, primaryColor: primaryColor, secondaryColor: secondaryColor });
    return "Error on " + __dartStr(formatted);
  }
}

class MultiSourceSpanFormatException extends MultiSourceSpanException {
  constructor(message, span, primaryLabel, secondarySpans, source = null) {
    super(message, span, primaryLabel, secondarySpans);
    Object.defineProperty(this, "__dartCoreErrorType", { value: "FormatException", writable: true, configurable: true });
    this.source = source;
  }
  get offset() {
    return (() => { let v = this.span; return ((v === null) ? null : v.start.offset); })();
  }
}

class StringScannerException extends SourceSpanFormatException {
  constructor(message, span, source) {
    super(message, span, source);
  }
  get source() {
    return __dartAs(super.source, value => typeof value === "string", "String");
  }
  get sourceUrl() {
    return ((this.span)?.sourceUrl ?? null);
  }
}

class StringScanner {
  constructor(string, { sourceUrl = null, position = null } = {}) {
    this._position = 0;
    this._lastMatch = null;
    this._lastMatchPosition = null;
    this.string = string;
    this.sourceUrl = ((sourceUrl === null) ? null : (typeof sourceUrl === "string" ? __dartUriParse(sourceUrl, false) : __dartAs(sourceUrl, value => value != null && typeof value === "object" && value.__dartType === "Uri", "Uri")));
    if (!((position === null))) {
      this.position = position;
    }
  }
  get position() {
    return this._position;
  }
  set position(position) {
    if (((Number(position) < 0 || Object.is(Number(position), -0)) || (position > this.string.length))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Invalid position " + __dartStr(position)); })();
      }
    }
    this._position = position;
    this._lastMatch = null;
  }
  get lastMatch() {
    if (!(__dartEquals(this._position, this._lastMatchPosition))) {
      this._lastMatch = null;
    }
    return this._lastMatch;
  }
  get rest() {
    return this.string.substring(this.position);
  }
  get isDone() {
    return __dartEquals(this.position, this.string.length);
  }
  readChar() {
    if (this.isDone) {
      this._fail("more input");
    }
    return this.string.charCodeAt((() => { let v = this._position; return (() => { let v_1 = this._position = (v + 1); return v; })(); })());
  }
  peekChar(offset = null) {
    ((offset === null) ? offset = 0 : null);
    const index = (this.position + offset);
    if (((index < 0) || (index >= this.string.length))) {
      return null;
    }
    return this.string.charCodeAt(index);
  }
  scanChar(character) {
    if (inSupplementaryPlane(character)) {
      {
        if (((((this._position + 1) >= this.string.length) || !(__dartEquals(this.string.charCodeAt(this._position), highSurrogate(character)))) || !(__dartEquals(this.string.charCodeAt((this._position + 1)), lowSurrogate(character))))) {
          {
            return false;
          }
        } else {
          {
            this._position = (this._position + 2);
            return true;
          }
        }
      }
    } else {
      {
        if (this.isDone) {
          return false;
        }
        if (!(__dartEquals(this.string.charCodeAt(this._position), character))) {
          return false;
        }
        this._position = (this._position + 1);
        return true;
      }
    }
  }
  expectChar(character, { name = null } = {}) {
    if (this.scanChar(character)) {
      return;
    }
    if ((name === null)) {
      {
        if (__dartEquals(character, 92)) {
          {
            name = "\"\\\"";
          }
        } else {
          if (__dartEquals(character, 34)) {
            {
              name = "\"\\\"\"";
            }
          } else {
            {
              name = "\"" + __dartStr(String.fromCodePoint(character)) + "\"";
            }
          }
        }
      }
    }
    this._fail(name);
  }
  readCodePoint() {
    const first = this.readChar();
    if (!(isHighSurrogate(first))) {
      return first;
    }
    const next = this.peekChar();
    if (((next === null) || !(isLowSurrogate(next)))) {
      return first;
    }
    this.readChar();
    return decodeSurrogatePair(first, next);
  }
  peekCodePoint() {
    const first = this.peekChar();
    if (((first === null) || !(isHighSurrogate(first)))) {
      return first;
    }
    const next = this.peekChar(1);
    if (((next === null) || !(isLowSurrogate(next)))) {
      return first;
    }
    return decodeSurrogatePair(first, next);
  }
  scan(pattern) {
    const success = this.matches(pattern);
    if (success) {
      {
        this._position = __dartNullCheck(this._lastMatch).end;
        this._lastMatchPosition = this._position;
      }
    }
    return success;
  }
  expect(pattern, { name = null } = {}) {
    if (this.scan(pattern)) {
      return;
    }
    if ((name === null)) {
      {
        if ((pattern instanceof RegExp || (pattern != null && typeof pattern === "object" && typeof pattern.__dartRegExpMake === "function"))) {
          {
            const source = pattern.pattern;
            name = "/" + __dartStr(source) + "/";
          }
        } else {
          {
            name = __dartObjectToString(pattern).replaceAll("\\", "\\\\").replaceAll("\"", "\\\"");
            name = "\"" + __dartStr(name) + "\"";
          }
        }
      }
    }
    this._fail(name);
  }
  expectDone() {
    if (this.isDone) {
      return;
    }
    this._fail("no more input");
  }
  matches(pattern) {
    this._lastMatch = __dartPatternMatchAsPrefix(pattern, this.string, this.position);
    this._lastMatchPosition = this._position;
    return !((this._lastMatch === null));
  }
  substring(start, end = null) {
    ((end === null) ? end = this.position : null);
    return this.string.substring(start, end);
  }
  error(message, { match = null, position = null, length = null } = {}) {
    validateErrorArgs(this.string, match, position, length);
    if ((((match === null) && (position === null)) && (length === null))) {
      match = this.lastMatch;
    }
    ((position === null) ? position = ((match === null) ? this.position : match.start) : null);
    ((length === null) ? length = ((match === null) ? 0 : (match.end - match.start)) : null);
    const sourceFile = SourceFile.fromString(this.string, { url: this.sourceUrl });
    const span = sourceFile.span(position, (position + length));
    (() => { throw new StringScannerException(message, span, this.string); })();
  }
  _fail(name) {
    this.error("expected " + __dartStr(name) + ".", { position: this.position, length: 0 });
  }
}

class LineScanner extends StringScanner {
  constructor(string, { sourceUrl = null, position = null } = {}) {
    super(string, { sourceUrl: sourceUrl, position: position });
    this._line = 0;
    this._column = 0;
    Object.defineProperty(this, $LineScanner_interface, { value: true });
  }
  get line() {
    return this._line;
  }
  get column() {
    return this._column;
  }
  get state() {
    return LineScannerState._(this, this.position, this.line, this.column);
  }
  get _betweenCRLF() {
    return (__dartEquals(this.peekChar((-1)), 13) && __dartEquals(this.peekChar(), 10));
  }
  set state(state) {
    if (!(Object.is(state._scanner, this))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "The given LineScannerState was not returned by this LineScanner."); })();
      }
    }
    super.position = state.position;
    this._line = state.line;
    this._column = state.column;
  }
  set position(newPosition) {
    if (__dartEquals(newPosition, this.position)) {
      {
        return;
      }
    }
    const oldPosition = this.position;
    super.position = newPosition;
    if (__dartEquals(newPosition, 0)) {
      {
        this._line = 0;
        this._column = 0;
      }
    } else {
      if ((newPosition > oldPosition)) {
        {
          const newlines = this._newlinesIn(this.string.substring(oldPosition, newPosition), { endPosition: newPosition });
          this._line = (this._line + newlines.length);
          if (newlines.length === 0) {
            {
              this._column = (this._column + (newPosition - oldPosition));
            }
          } else {
            {
              const offsetOfLastNewline = (oldPosition + __dartIndexGet(newlines, newlines.length - 1).end);
              this._column = (newPosition - offsetOfLastNewline);
            }
          }
        }
      } else {
        if ((newPosition < oldPosition)) {
          {
            const newlines_1 = this._newlinesIn(this.string.substring(newPosition, oldPosition), { endPosition: oldPosition });
            this._line = (this._line - newlines_1.length);
            if (newlines_1.length === 0) {
              {
                this._column = (this._column - (oldPosition - newPosition));
              }
            } else {
              {
                const crOffset = (this._betweenCRLF ? (-1) : 0);
                const currentCharOffset = -1;
                const lastNewline = __dartStringLastIndexOf(this.string, _newlineRegExp, ((newPosition + -1) + crOffset));
                const offsetAfterLastNewline = (__dartEquals(lastNewline, (-1)) ? 0 : ((__dartEquals(this.string[lastNewline], "\r") && __dartEquals(this.string[(lastNewline + 1)], "\n")) ? (lastNewline + 2) : (lastNewline + 1)));
                this._column = (newPosition - offsetAfterLastNewline);
              }
            }
          }
        }
      }
    }
  }
  scanChar(character) {
    if (!(super.scanChar(character))) {
      return false;
    }
    this._adjustLineAndColumn(character);
    return true;
  }
  readChar() {
    const character = super.readChar();
    this._adjustLineAndColumn(character);
    return character;
  }
  _adjustLineAndColumn(character) {
    if ((__dartEquals(character, 10) || (__dartEquals(character, 13) && !(__dartEquals(this.peekChar(), 10))))) {
      {
        this._line = (this._line + 1);
        this._column = 0;
      }
    } else {
      {
        this._column = (this._column + (inSupplementaryPlane(character) ? 2 : 1));
      }
    }
  }
  scan(pattern) {
    if (!(super.scan(pattern))) {
      return false;
    }
    const newlines = this._newlinesIn(__dartNullCheck(__dartNullCheck(this.lastMatch)[0]), { endPosition: this.position });
    this._line = (this._line + newlines.length);
    if (newlines.length === 0) {
      {
        this._column = (this._column + __dartNullCheck(__dartNullCheck(this.lastMatch)[0]).length);
      }
    } else {
      {
        this._column = (__dartNullCheck(__dartNullCheck(this.lastMatch)[0]).length - __dartIndexGet(newlines, newlines.length - 1).end);
      }
    }
    return true;
  }
  _newlinesIn(text, { endPosition } = {}) {
    const newlines = Array.from(_newlineRegExp.allMatches(text));
    if ((((endPosition < this.string.length) && text.endsWith("\r")) && __dartEquals(this.string[endPosition], "\n"))) {
      {
        newlines.pop();
      }
    }
    return newlines;
  }
  get position() { return super.position; }
}
Object.defineProperty(LineScanner, Symbol.hasInstance, { value(value) { return value != null && value[$LineScanner_interface] === true; } });

class LineScannerState {
  constructor() {
    throw new TypeError("Class LineScannerState has no unnamed constructor");
  }
  static _(_scanner, position, line, column) {
    return $LineScannerState__(LineScannerState, _scanner, position, line, column);
  }
}
Object.defineProperty(LineScannerState, Symbol.hasInstance, { value(value) { return value != null && value[$LineScannerState_interface] === true; } });

function $LineScannerState__($newTarget, _scanner, position, line, column) {
  const $self = Object.create($newTarget.prototype);
  Object.defineProperty($self, $LineScannerState_interface, { value: true });
  $self._scanner = _scanner;
  $self.position = position;
  $self.line = line;
  $self.column = column;
  return $self;
}

class SpanScanner extends StringScanner {
  constructor(string, { sourceUrl = null, position = null } = {}) {
    super(string, { sourceUrl: sourceUrl, position: position });
    this._lastSpan = null;
    this._sourceFile = SourceFile.fromString(string, { url: sourceUrl });
    Object.defineProperty(this, $LineScanner_interface, { value: true });
    Object.defineProperty(this, $SpanScanner_interface, { value: true });
  }
  get line() {
    return this._sourceFile.getLine(this.position);
  }
  get column() {
    return this._sourceFile.getColumn(this.position);
  }
  get state() {
    return new _SpanScannerState_1(this, this.position);
  }
  set state(state) {
    if ((!(state instanceof _SpanScannerState_1) || !(Object.is(state._scanner, this)))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "The given LineScannerState was not returned by this LineScanner."); })();
      }
    }
    this.position = state.position;
  }
  get lastSpan() {
    if ((this.lastMatch === null)) {
      this._lastSpan = null;
    }
    return this._lastSpan;
  }
  get location() {
    return this._sourceFile.location(this.position);
  }
  get emptySpan() {
    return this.location.pointSpan();
  }
  static eager(string, { sourceUrl = null, position = null } = {}) {
    return new EagerSpanScanner(string, { sourceUrl: sourceUrl, position: position });
  }
  static within(span) {
    return new RelativeSpanScanner(span);
  }
  spanFrom(startState, endState = null) {
    const endPosition = ((endState === null) ? this.position : endState.position);
    return this._sourceFile.span(startState.position, endPosition);
  }
  spanFromPosition(startPosition, endPosition = null) {
    return this._sourceFile.span(startPosition, (endPosition ?? this.position));
  }
  matches(pattern) {
    if (!(super.matches(pattern))) {
      {
        this._lastSpan = null;
        return false;
      }
    }
    this._lastSpan = this._sourceFile.span(this.position, __dartNullCheck(this.lastMatch).end);
    return true;
  }
  error(message, { match = null, position = null, length = null } = {}) {
    validateErrorArgs(this.string, match, position, length);
    if ((((match === null) && (position === null)) && (length === null))) {
      match = this.lastMatch;
    }
    ((position === null) ? position = ((match === null) ? this.position : match.start) : null);
    ((length === null) ? length = ((match === null) ? 0 : (match.end - match.start)) : null);
    const span = this._sourceFile.span(position, (position + length));
    (() => { throw new StringScannerException(message, span, this.string); })();
  }
}
Object.defineProperty(SpanScanner, Symbol.hasInstance, { value(value) { return value != null && value[$SpanScanner_interface] === true; } });

class RelativeSpanScanner extends StringScanner {
  constructor(span) {
    super(span.text, { sourceUrl: span.sourceUrl });
    this._lastSpan = null;
    this._sourceFile = span.file;
    this._startLocation = span.start;
    Object.defineProperty(this, $LineScanner_interface, { value: true });
    Object.defineProperty(this, $SpanScanner_interface, { value: true });
  }
  get line() {
    return (this._sourceFile.getLine((this._startLocation.offset + this.position)) - this._startLocation.line);
  }
  get column() {
    const line = this._sourceFile.getLine((this._startLocation.offset + this.position));
    const column = this._sourceFile.getColumn((this._startLocation.offset + this.position), { line: line });
    return (__dartEquals(line, this._startLocation.line) ? (column - this._startLocation.column) : column);
  }
  get state() {
    return new _SpanScannerState(this, this.position);
  }
  set state(state) {
    if ((!(state instanceof _SpanScannerState) || !(Object.is(state._scanner, this)))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "The given LineScannerState was not returned by this LineScanner."); })();
      }
    }
    this.position = state.position;
  }
  get lastSpan() {
    return this._lastSpan;
  }
  get location() {
    return this._sourceFile.location((this._startLocation.offset + this.position));
  }
  get emptySpan() {
    return this.location.pointSpan();
  }
  spanFrom(startState, endState = null) {
    const endPosition = ((endState === null) ? this.position : endState.position);
    return this._sourceFile.span((this._startLocation.offset + startState.position), (this._startLocation.offset + endPosition));
  }
  spanFromPosition(startPosition, endPosition = null) {
    __dartCheckValidRange(startPosition, endPosition, (this._sourceFile.length - this._startLocation.offset), "startPosition", "endPosition", null);
    return this._sourceFile.span((this._startLocation.offset + startPosition), (this._startLocation.offset + (endPosition ?? this.position)));
  }
  matches(pattern) {
    if (!(super.matches(pattern))) {
      {
        this._lastSpan = null;
        return false;
      }
    }
    this._lastSpan = this._sourceFile.span((this._startLocation.offset + this.position), (this._startLocation.offset + __dartNullCheck(this.lastMatch).end));
    return true;
  }
  error(message, { match = null, position = null, length = null } = {}) {
    validateErrorArgs(this.string, match, position, length);
    if ((((match === null) && (position === null)) && (length === null))) {
      match = this.lastMatch;
    }
    ((position === null) ? position = ((match === null) ? this.position : match.start) : null);
    ((length === null) ? length = ((match === null) ? 1 : (match.end - match.start)) : null);
    const span = this._sourceFile.span((this._startLocation.offset + position), ((this._startLocation.offset + position) + length));
    (() => { throw new StringScannerException(message, span, this.string); })();
  }
}

class _SpanScannerState {
  constructor(_scanner, position) {
    this._scanner = _scanner;
    this.position = position;
    Object.defineProperty(this, $LineScannerState_interface, { value: true });
  }
  get line() {
    return this._scanner._sourceFile.getLine(this.position);
  }
  get column() {
    return this._scanner._sourceFile.getColumn(this.position);
  }
}

class _SpanScannerState_1 {
  constructor(_scanner, position) {
    this._scanner = _scanner;
    this.position = position;
    Object.defineProperty(this, $LineScannerState_interface, { value: true });
  }
  get line() {
    return this._scanner._sourceFile.getLine(this.position);
  }
  get column() {
    return this._scanner._sourceFile.getColumn(this.position);
  }
}

class EagerSpanScanner extends SpanScanner {
  constructor(string, { sourceUrl = null, position = null } = {}) {
    super(string, { sourceUrl: sourceUrl, position: position });
    this._line = 0;
    this._column = 0;
  }
  get line() {
    return this._line;
  }
  get column() {
    return this._column;
  }
  get state() {
    return new _EagerSpanScannerState(this, this.position, this.line, this.column);
  }
  get _betweenCRLF() {
    return (__dartEquals(this.peekChar((-1)), 13) && __dartEquals(this.peekChar(), 10));
  }
  set state(state) {
    if ((!(state instanceof _EagerSpanScannerState) || !(Object.is(state._scanner, this)))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "The given LineScannerState was not returned by this LineScanner."); })();
      }
    }
    super.position = state.position;
    this._line = state.line;
    this._column = state.column;
  }
  set position(newPosition) {
    const oldPosition = this.position;
    super.position = newPosition;
    if ((newPosition > oldPosition)) {
      {
        const newlines = this._newlinesIn(this.string.substring(oldPosition, newPosition));
        this._line = (this._line + newlines.length);
        if (newlines.length === 0) {
          {
            this._column = (this._column + (newPosition - oldPosition));
          }
        } else {
          {
            this._column = (newPosition - __dartIndexGet(newlines, newlines.length - 1).end);
          }
        }
      }
    } else {
      {
        const newlines_1 = this._newlinesIn(this.string.substring(newPosition, oldPosition));
        if (this._betweenCRLF) {
          newlines_1.pop();
        }
        this._line = (this._line - newlines_1.length);
        if (newlines_1.length === 0) {
          {
            this._column = (this._column - (oldPosition - newPosition));
          }
        } else {
          {
            this._column = ((newPosition - __dartStringLastIndexOf(this.string, _newlineRegExp_1, newPosition)) - 1);
          }
        }
      }
    }
  }
  scanChar(character) {
    if (!(super.scanChar(character))) {
      return false;
    }
    this._adjustLineAndColumn(character);
    return true;
  }
  readChar() {
    const character = super.readChar();
    this._adjustLineAndColumn(character);
    return character;
  }
  _adjustLineAndColumn(character) {
    if ((__dartEquals(character, 10) || (__dartEquals(character, 13) && !(__dartEquals(this.peekChar(), 10))))) {
      {
        this._line = (this._line + 1);
        this._column = 0;
      }
    } else {
      {
        this._column = (this._column + (inSupplementaryPlane(character) ? 2 : 1));
      }
    }
  }
  scan(pattern) {
    if (!(super.scan(pattern))) {
      return false;
    }
    const firstMatch = __dartNullCheck(__dartNullCheck(this.lastMatch)[0]);
    const newlines = this._newlinesIn(firstMatch);
    this._line = (this._line + newlines.length);
    if (newlines.length === 0) {
      {
        this._column = (this._column + firstMatch.length);
      }
    } else {
      {
        this._column = (firstMatch.length - __dartIndexGet(newlines, newlines.length - 1).end);
      }
    }
    return true;
  }
  _newlinesIn(text) {
    const newlines = Array.from(_newlineRegExp_1.allMatches(text));
    if (this._betweenCRLF) {
      newlines.pop();
    }
    return newlines;
  }
  get position() { return super.position; }
}

class _EagerSpanScannerState {
  constructor(_scanner, position, line, column) {
    this._scanner = _scanner;
    this.position = position;
    this.line = line;
    this.column = column;
    Object.defineProperty(this, $LineScannerState_interface, { value: true });
  }
}

class YamlException extends SourceSpanFormatException {
  constructor(message, span) {
    super(message, span);
  }
}

class ErrorListener {
  constructor() {
  }
  onError(error) {
    throw new TypeError("Abstract member ErrorListener.onError");
  }
}

class ErrorCollector extends ErrorListener {
  constructor() {
    super();
    this.errors = new Array(0).fill(null);
  }
  onError(error) {
    return (this.errors.push(error), null);
  }
}

class ScalarStyle {
  constructor() {
    throw new TypeError("Class ScalarStyle has no unnamed constructor");
  }
  static _(name) {
    return $ScalarStyle__(ScalarStyle, name);
  }
  get isQuoted() {
    return (__dartEquals(this, __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"SINGLE_QUOTED\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "SINGLE_QUOTED" })))) || __dartEquals(this, __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"DOUBLE_QUOTED\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "DOUBLE_QUOTED" })))));
  }
  toString() {
    return this.name;
  }
}

function $ScalarStyle__($newTarget, name) {
  const $self = Object.create($newTarget.prototype);
  $self.name = name;
  return $self;
}

class CollectionStyle {
  constructor() {
    throw new TypeError("Class CollectionStyle has no unnamed constructor");
  }
  static _(name) {
    return $CollectionStyle__(CollectionStyle, name);
  }
  toString() {
    return this.name;
  }
}

function $CollectionStyle__($newTarget, name) {
  const $self = Object.create($newTarget.prototype);
  $self.name = name;
  return $self;
}

class Token {
  constructor(type, span) {
    this.type = type;
    this.span = span;
    Object.defineProperty(this, $Token_interface, { value: true });
  }
  toString() {
    return __dartStr(this.type);
  }
}
Object.defineProperty(Token, Symbol.hasInstance, { value(value) { return value != null && value[$Token_interface] === true; } });

class VersionDirectiveToken {
  constructor(span, major, minor) {
    this.span = span;
    this.major = major;
    this.minor = minor;
    Object.defineProperty(this, $Token_interface, { value: true });
  }
  get type() {
    return TokenType.versionDirective;
  }
  toString() {
    return "VERSION_DIRECTIVE " + __dartStr(this.major) + "." + __dartStr(this.minor);
  }
}

class TagDirectiveToken {
  constructor(span, handle, prefix) {
    this.span = span;
    this.handle = handle;
    this.prefix = prefix;
    Object.defineProperty(this, $Token_interface, { value: true });
  }
  get type() {
    return TokenType.tagDirective;
  }
  toString() {
    return "TAG_DIRECTIVE " + __dartStr(this.handle) + " " + __dartStr(this.prefix);
  }
}

class AnchorToken {
  constructor(span, name) {
    this.span = span;
    this.name = name;
    Object.defineProperty(this, $Token_interface, { value: true });
  }
  get type() {
    return TokenType.anchor;
  }
  toString() {
    return "ANCHOR " + __dartStr(this.name);
  }
}

class AliasToken {
  constructor(span, name) {
    this.span = span;
    this.name = name;
    Object.defineProperty(this, $Token_interface, { value: true });
  }
  get type() {
    return TokenType.alias;
  }
  toString() {
    return "ALIAS " + __dartStr(this.name);
  }
}

class TagToken {
  constructor(span, handle, suffix) {
    this.span = span;
    this.handle = handle;
    this.suffix = suffix;
    Object.defineProperty(this, $Token_interface, { value: true });
  }
  get type() {
    return TokenType.tag;
  }
  toString() {
    return "TAG " + __dartStr(this.handle) + " " + __dartStr(this.suffix);
  }
}

class ScalarToken {
  constructor(span, value, style_1) {
    this.span = span;
    this.value = value;
    this.style = style_1;
    Object.defineProperty(this, $Token_interface, { value: true });
  }
  get type() {
    return TokenType.scalar;
  }
  toString() {
    return "SCALAR " + __dartStr(this.style) + " \"" + __dartStr(this.value) + "\"";
  }
}

class TokenType {
  constructor(index, name) {
    Object.defineProperty(this, "index", { value: index, enumerable: true });
    Object.defineProperty(this, "name", { value: name, enumerable: true });
    Object.freeze(this);
  }
  toString() {
    return "TokenType." + this.name;
  }
}
Object.defineProperties(TokenType, {
  streamStart: { value: new TokenType(0, "streamStart"), enumerable: true },
  streamEnd: { value: new TokenType(1, "streamEnd"), enumerable: true },
  versionDirective: { value: new TokenType(2, "versionDirective"), enumerable: true },
  tagDirective: { value: new TokenType(3, "tagDirective"), enumerable: true },
  documentStart: { value: new TokenType(4, "documentStart"), enumerable: true },
  documentEnd: { value: new TokenType(5, "documentEnd"), enumerable: true },
  blockSequenceStart: { value: new TokenType(6, "blockSequenceStart"), enumerable: true },
  blockMappingStart: { value: new TokenType(7, "blockMappingStart"), enumerable: true },
  blockEnd: { value: new TokenType(8, "blockEnd"), enumerable: true },
  flowSequenceStart: { value: new TokenType(9, "flowSequenceStart"), enumerable: true },
  flowSequenceEnd: { value: new TokenType(10, "flowSequenceEnd"), enumerable: true },
  flowMappingStart: { value: new TokenType(11, "flowMappingStart"), enumerable: true },
  flowMappingEnd: { value: new TokenType(12, "flowMappingEnd"), enumerable: true },
  blockEntry: { value: new TokenType(13, "blockEntry"), enumerable: true },
  flowEntry: { value: new TokenType(14, "flowEntry"), enumerable: true },
  key: { value: new TokenType(15, "key"), enumerable: true },
  value: { value: new TokenType(16, "value"), enumerable: true },
  alias: { value: new TokenType(17, "alias"), enumerable: true },
  anchor: { value: new TokenType(18, "anchor"), enumerable: true },
  tag: { value: new TokenType(19, "tag"), enumerable: true },
  scalar: { value: new TokenType(20, "scalar"), enumerable: true }
});
Object.defineProperty(TokenType, "values", { value: Object.freeze([TokenType.streamStart, TokenType.streamEnd, TokenType.versionDirective, TokenType.tagDirective, TokenType.documentStart, TokenType.documentEnd, TokenType.blockSequenceStart, TokenType.blockMappingStart, TokenType.blockEnd, TokenType.flowSequenceStart, TokenType.flowSequenceEnd, TokenType.flowMappingStart, TokenType.flowMappingEnd, TokenType.blockEntry, TokenType.flowEntry, TokenType.key, TokenType.value, TokenType.alias, TokenType.anchor, TokenType.tag, TokenType.scalar]), enumerable: true });

class Scanner {
  constructor(source, { sourceUrl = null, recover = false, errorListener = null } = {}) {
    this._streamStartProduced = false;
    this._streamEndProduced = false;
    this._tokens = new QueueList();
    this._tokensParsed = 0;
    this._tokenAvailable = false;
    this._indents = [(-1)];
    this._simpleKeyAllowed = true;
    this._simpleKeys = [null];
    this._recover = recover;
    this._errorListener = errorListener;
    this._scanner = new EagerSpanScanner(source, { sourceUrl: sourceUrl });
  }
  get _indent() {
    return __dartIterableLast(this._indents);
  }
  get _inBlockContext() {
    return __dartEquals(this._simpleKeys.length, 1);
  }
  get _isBreakOrEnd() {
    return (this._scanner.isDone || this._isBreak);
  }
  get _isBreak() {
    return this._isBreakAt(0);
  }
  get _isBlankOrEnd() {
    return this._isBlankOrEndAt(0);
  }
  get _isBlank() {
    return this._isBlankAt(0);
  }
  get _isTagChar() {
    let char = this._scanner.peekChar();
    if ((char === null)) {
      return false;
    }
    L:
    switch (char) {
      case 45:
      case 59:
      case 47:
      case 58:
      case 64:
      case 38:
      case 61:
      case 43:
      case 36:
      case 46:
      case 126:
      case 63:
      case 42:
      case 39:
      case 40:
      case 41:
      case 37:
        {
          return true;
        }
      default:
        {
          return ((((char >= 48) && (char <= 57)) || ((char >= 97) && (char <= 122))) || ((char >= 65) && (char <= 90)));
        }
    }
  }
  get _isAnchorChar() {
    if (!(this._isNonSpace)) {
      return false;
    }
    L:
    switch (this._scanner.peekChar()) {
      case 44:
      case 91:
      case 93:
      case 123:
      case 125:
        {
          return false;
        }
      default:
        {
          return true;
        }
    }
  }
  get _isDigit() {
    let char = this._scanner.peekChar();
    return (!((char === null)) && ((char >= 48) && (char <= 57)));
  }
  get _isHex() {
    let char = this._scanner.peekChar();
    if ((char === null)) {
      return false;
    }
    return ((((char >= 48) && (char <= 57)) || ((char >= 97) && (char <= 102))) || ((char >= 65) && (char <= 70)));
  }
  get _isPlainChar() {
    return this._isPlainCharAt(0);
  }
  get _isNonBreak() {
    let char = this._scanner.peekChar();
    return (() => {
      let v = null;
      const _0_0 = char;
      const _0_1 = null;
      const _0_3 = 10;
      const _0_5 = 13;
      const _0_7 = 65279;
      const _0_9 = 9;
      const _0_11 = 133;
      L:
      {
        {
          if ((_0_0 === null)) {
            {
              v = false;
              break L;
            }
          }
        }
        {
          if (((__dartEquals(10, _0_0) || __dartEquals(13, _0_0)) || __dartEquals(65279, _0_0))) {
            {
              v = false;
              break L;
            }
          }
        }
        {
          if ((__dartEquals(9, _0_0) || __dartEquals(133, _0_0))) {
            {
              v = true;
              break L;
            }
          }
        }
        {
          if (true) {
            {
              v = this._isStandardCharacterAt(0);
              break L;
            }
          }
        }
      }
      return v;
    })();
  }
  get _isNonSpace() {
    let char = this._scanner.peekChar();
    return (() => {
      let v = null;
      const _0_0 = char;
      const _0_1 = null;
      const _0_3 = 10;
      const _0_5 = 13;
      const _0_7 = 65279;
      const _0_9 = 32;
      const _0_11 = 133;
      L:
      {
        {
          if ((_0_0 === null)) {
            {
              v = false;
              break L;
            }
          }
        }
        {
          if ((((__dartEquals(10, _0_0) || __dartEquals(13, _0_0)) || __dartEquals(65279, _0_0)) || __dartEquals(32, _0_0))) {
            {
              v = false;
              break L;
            }
          }
        }
        {
          if (__dartEquals(133, _0_0)) {
            {
              v = true;
              break L;
            }
          }
        }
        {
          if (true) {
            {
              v = this._isStandardCharacterAt(0);
              break L;
            }
          }
        }
      }
      return v;
    })();
  }
  get _isDocumentIndicator() {
    return ((__dartEquals(this._scanner.column, 0) && this._isBlankOrEndAt(3)) && (this._scanner.matches("---") || this._scanner.matches("...")));
  }
  scan() {
    if (this._streamEndProduced) {
      (() => { throw __dartCoreError("StateError", "Out of tokens."); })();
    }
    if (!(this._tokenAvailable)) {
      this._fetchMoreTokens();
    }
    let token = this._tokens.removeFirst();
    this._tokenAvailable = false;
    this._tokensParsed = (this._tokensParsed + 1);
    this._streamEndProduced = __dartEquals(token.type, TokenType.streamEnd);
    return token;
  }
  advance() {
    this.scan();
    return this.peek();
  }
  peek() {
    if (this._streamEndProduced) {
      return null;
    }
    if (!(this._tokenAvailable)) {
      this._fetchMoreTokens();
    }
    return this._tokens.first;
  }
  _fetchMoreTokens() {
    L:
    while (true) {
      {
        if (this._tokens.isNotEmpty) {
          {
            this._staleSimpleKeys();
            if (__dartEquals(this._tokens.last.type, TokenType.streamEnd)) {
              break L;
            }
            if (!(Array.from(this._simpleKeys).some((key) => { return (!((key === null)) && __dartEquals(key.tokenNumber, this._tokensParsed)); }))) {
              {
                break L;
              }
            }
          }
        }
        this._fetchNextToken();
      }
    }
    this._tokenAvailable = true;
  }
  _fetchNextToken() {
    if (!(this._streamStartProduced)) {
      {
        this._fetchStreamStart();
        return;
      }
    }
    this._scanToNextToken();
    this._staleSimpleKeys();
    this._unrollIndent(this._scanner.column);
    if (this._scanner.isDone) {
      {
        this._fetchStreamEnd();
        return;
      }
    }
    if (__dartEquals(this._scanner.column, 0)) {
      {
        if (__dartEquals(this._scanner.peekChar(), 37)) {
          {
            this._fetchDirective();
            return;
          }
        }
        if (this._isBlankOrEndAt(3)) {
          {
            if (this._scanner.matches("---")) {
              {
                this._fetchDocumentIndicator(TokenType.documentStart);
                return;
              }
            }
            if (this._scanner.matches("...")) {
              {
                this._fetchDocumentIndicator(TokenType.documentEnd);
                return;
              }
            }
          }
        }
      }
    }
    L:
    switch (this._scanner.peekChar()) {
      case 91:
        {
          this._fetchFlowCollectionStart(TokenType.flowSequenceStart);
          return;
        }
      case 123:
        {
          this._fetchFlowCollectionStart(TokenType.flowMappingStart);
          return;
        }
      case 93:
        {
          this._fetchFlowCollectionEnd(TokenType.flowSequenceEnd);
          return;
        }
      case 125:
        {
          this._fetchFlowCollectionEnd(TokenType.flowMappingEnd);
          return;
        }
      case 44:
        {
          this._fetchFlowEntry();
          return;
        }
      case 42:
        {
          this._fetchAnchor({ anchor: false });
          return;
        }
      case 38:
        {
          this._fetchAnchor();
          return;
        }
      case 33:
        {
          this._fetchTag();
          return;
        }
      case 39:
        {
          this._fetchFlowScalar({ singleQuote: true });
          return;
        }
      case 34:
        {
          this._fetchFlowScalar();
          return;
        }
      case 124:
        {
          if (!(this._inBlockContext)) {
            this._invalidScalarCharacter();
          }
          this._fetchBlockScalar({ literal: true });
          return;
        }
      case 62:
        {
          if (!(this._inBlockContext)) {
            this._invalidScalarCharacter();
          }
          this._fetchBlockScalar();
          return;
        }
      case 37:
      case 64:
      case 96:
        {
          this._invalidScalarCharacter();
          return;
        }
      case 45:
        {
          if (this._isPlainCharAt(1)) {
            {
              this._fetchPlainScalar();
            }
          } else {
            {
              this._fetchBlockEntry();
            }
          }
          return;
        }
      case 63:
        {
          if (this._isPlainCharAt(1)) {
            {
              this._fetchPlainScalar();
            }
          } else {
            {
              this._fetchKey();
            }
          }
          return;
        }
      case 58:
        {
          if ((!(this._inBlockContext) && this._tokens.isNotEmpty)) {
            {
              let token = this._tokens.last;
              if (((__dartEquals(token.type, TokenType.flowSequenceEnd) || __dartEquals(token.type, TokenType.flowMappingEnd)) || (__dartEquals(token.type, TokenType.scalar) && __dartAs(token, value => value instanceof ScalarToken, "ScalarToken").style.isQuoted))) {
                {
                  this._fetchValue();
                  return;
                }
              }
            }
          }
          if (this._isPlainCharAt(1)) {
            {
              this._fetchPlainScalar();
            }
          } else {
            {
              this._fetchValue();
            }
          }
          return;
        }
      default:
        {
          if (!(this._isNonBreak)) {
            this._invalidScalarCharacter();
          }
          this._fetchPlainScalar();
          return;
        }
    }
  }
  _invalidScalarCharacter() {
    return this._scanner.error("Unexpected character.", { length: 1 });
  }
  _staleSimpleKeys() {
    for (let i = 0; (i < this._simpleKeys.length); i = (i + 1)) {
      L:
      {
        let key = __dartIndexGet(this._simpleKeys, i);
        if ((key === null)) {
          break L;
        }
        if (!(this._inBlockContext)) {
          break L;
        }
        if (__dartEquals(key.line, this._scanner.line)) {
          break L;
        }
        if (key.required) {
          {
            this._reportError(new YamlException("Expected ':'.", this._scanner.emptySpan));
            this._tokens.insert((key.tokenNumber - this._tokensParsed), new Token(TokenType.key, __dartAs(key.location.pointSpan(), value => value instanceof FileSpan, "FileSpan")));
          }
        }
        __dartIndexSet(this._simpleKeys, i, null);
      }
    }
  }
  _saveSimpleKey() {
    let required = (this._inBlockContext && __dartEquals(this._indent, this._scanner.column));
    if (!(this._simpleKeyAllowed)) {
      return;
    }
    this._removeSimpleKey();
    __dartIndexSet(this._simpleKeys, (this._simpleKeys.length - 1), new _SimpleKey((this._tokensParsed + this._tokens.length), this._scanner.line, this._scanner.column, this._scanner.location, { required: required }));
  }
  _removeSimpleKey() {
    let key = __dartIterableLast(this._simpleKeys);
    if ((!((key === null)) && key.required)) {
      {
        (() => { throw new YamlException("Could not find expected ':' for simple key.", key.location.pointSpan()); })();
      }
    }
    __dartIndexSet(this._simpleKeys, (this._simpleKeys.length - 1), null);
  }
  _increaseFlowLevel() {
    (this._simpleKeys.push(null), null);
  }
  _decreaseFlowLevel() {
    if (this._inBlockContext) {
      return;
    }
    this._simpleKeys.pop();
  }
  _rollIndent(column, type, location, { tokenNumber = null } = {}) {
    if (!(this._inBlockContext)) {
      return;
    }
    if ((!(__dartEquals(this._indent, (-1))) && (this._indent >= column))) {
      return;
    }
    (this._indents.push(column), null);
    let token = new Token(type, __dartAs(location.pointSpan(), value => value instanceof FileSpan, "FileSpan"));
    if ((tokenNumber === null)) {
      {
        this._tokens.add(token);
      }
    } else {
      {
        this._tokens.insert((tokenNumber - this._tokensParsed), token);
      }
    }
  }
  _unrollIndent(column) {
    if (!(this._inBlockContext)) {
      return;
    }
    while ((this._indent > column)) {
      {
        this._tokens.add(new Token(TokenType.blockEnd, this._scanner.emptySpan));
        this._indents.pop();
      }
    }
  }
  _resetIndent() {
    return this._unrollIndent((-1));
  }
  _fetchStreamStart() {
    this._streamStartProduced = true;
    this._tokens.add(new Token(TokenType.streamStart, this._scanner.emptySpan));
  }
  _fetchStreamEnd() {
    this._resetIndent();
    this._removeSimpleKey();
    this._simpleKeyAllowed = false;
    this._tokens.add(new Token(TokenType.streamEnd, this._scanner.emptySpan));
  }
  _fetchDirective() {
    this._resetIndent();
    this._removeSimpleKey();
    this._simpleKeyAllowed = false;
    let directive = this._scanDirective();
    if (!((directive === null))) {
      this._tokens.add(directive);
    }
  }
  _fetchDocumentIndicator(type) {
    this._resetIndent();
    this._removeSimpleKey();
    this._simpleKeyAllowed = false;
    let start = this._scanner.state;
    this._scanner.readCodePoint();
    this._scanner.readCodePoint();
    this._scanner.readCodePoint();
    this._tokens.add(new Token(type, this._scanner.spanFrom(start)));
  }
  _fetchFlowCollectionStart(type) {
    this._saveSimpleKey();
    this._increaseFlowLevel();
    this._simpleKeyAllowed = true;
    this._addCharToken(type);
  }
  _fetchFlowCollectionEnd(type) {
    this._removeSimpleKey();
    this._decreaseFlowLevel();
    this._simpleKeyAllowed = false;
    this._addCharToken(type);
  }
  _fetchFlowEntry() {
    this._removeSimpleKey();
    this._simpleKeyAllowed = true;
    this._addCharToken(TokenType.flowEntry);
  }
  _fetchBlockEntry() {
    if (this._inBlockContext) {
      {
        if (!(this._simpleKeyAllowed)) {
          {
            (() => { throw new YamlException("Block sequence entries are not allowed here.", this._scanner.emptySpan); })();
          }
        }
        this._rollIndent(this._scanner.column, TokenType.blockSequenceStart, this._scanner.location);
      }
    } else {
      {
      }
    }
    this._removeSimpleKey();
    this._simpleKeyAllowed = true;
    this._addCharToken(TokenType.blockEntry);
  }
  _fetchKey() {
    if (this._inBlockContext) {
      {
        if (!(this._simpleKeyAllowed)) {
          {
            (() => { throw new YamlException("Mapping keys are not allowed here.", this._scanner.emptySpan); })();
          }
        }
        this._rollIndent(this._scanner.column, TokenType.blockMappingStart, this._scanner.location);
      }
    }
    this._simpleKeyAllowed = this._inBlockContext;
    this._addCharToken(TokenType.key);
  }
  _fetchValue() {
    let simpleKey = __dartIterableLast(this._simpleKeys);
    if (!((simpleKey === null))) {
      {
        this._tokens.insert((simpleKey.tokenNumber - this._tokensParsed), new Token(TokenType.key, __dartAs(simpleKey.location.pointSpan(), value => value instanceof FileSpan, "FileSpan")));
        this._rollIndent(simpleKey.column, TokenType.blockMappingStart, simpleKey.location, { tokenNumber: simpleKey.tokenNumber });
        __dartIndexSet(this._simpleKeys, (this._simpleKeys.length - 1), null);
        this._simpleKeyAllowed = false;
      }
    } else {
      if (this._inBlockContext) {
        {
          if (!(this._simpleKeyAllowed)) {
            {
              (() => { throw new YamlException("Mapping values are not allowed here. Did you miss a colon earlier?", this._scanner.emptySpan); })();
            }
          }
          this._rollIndent(this._scanner.column, TokenType.blockMappingStart, this._scanner.location);
          this._simpleKeyAllowed = true;
        }
      } else {
        if (this._simpleKeyAllowed) {
          {
            this._simpleKeyAllowed = false;
            this._addCharToken(TokenType.key);
          }
        }
      }
    }
    this._addCharToken(TokenType.value);
  }
  _addCharToken(type) {
    let start = this._scanner.state;
    this._scanner.readCodePoint();
    this._tokens.add(new Token(type, this._scanner.spanFrom(start)));
  }
  _fetchAnchor({ anchor = true } = {}) {
    this._saveSimpleKey();
    this._simpleKeyAllowed = false;
    this._tokens.add(this._scanAnchor({ anchor: anchor }));
  }
  _fetchTag() {
    this._saveSimpleKey();
    this._simpleKeyAllowed = false;
    this._tokens.add(this._scanTag());
  }
  _fetchBlockScalar({ literal = false } = {}) {
    this._removeSimpleKey();
    this._simpleKeyAllowed = true;
    this._tokens.add(this._scanBlockScalar({ literal: literal }));
  }
  _fetchFlowScalar({ singleQuote = false } = {}) {
    this._saveSimpleKey();
    this._simpleKeyAllowed = false;
    this._tokens.add(this._scanFlowScalar({ singleQuote: singleQuote }));
  }
  _fetchPlainScalar() {
    this._saveSimpleKey();
    this._simpleKeyAllowed = false;
    this._tokens.add(this._scanPlainScalar());
  }
  _scanToNextToken() {
    let afterLineBreak = false;
    L:
    while (true) {
      {
        if (__dartEquals(this._scanner.column, 0)) {
          this._scanner.scan("﻿");
        }
        while ((__dartEquals(this._scanner.peekChar(), 32) || ((!(this._inBlockContext) || !(afterLineBreak)) && __dartEquals(this._scanner.peekChar(), 9)))) {
          {
            this._scanner.readChar();
          }
        }
        if (__dartEquals(this._scanner.peekChar(), 9)) {
          {
            this._scanner.error("Tab characters are not allowed as indentation.", { length: 1 });
          }
        }
        this._skipComment();
        if (this._isBreak) {
          {
            this._skipLine();
            if (this._inBlockContext) {
              this._simpleKeyAllowed = true;
            }
            afterLineBreak = true;
          }
        } else {
          {
            break L;
          }
        }
      }
    }
  }
  _scanDirective() {
    let start = this._scanner.state;
    this._scanner.readChar();
    let token = null;
    let name = this._scanDirectiveName();
    if (__dartEquals(name, "YAML")) {
      {
        token = this._scanVersionDirectiveValue(start);
      }
    } else {
      if (__dartEquals(name, "TAG")) {
        {
          token = this._scanTagDirectiveValue(start);
        }
      } else {
        {
          warn("Warning: unknown directive.", this._scanner.spanFrom(start));
          while (!(this._isBreakOrEnd)) {
            {
              this._scanner.readCodePoint();
            }
          }
          return null;
        }
      }
    }
    this._skipBlanks();
    this._skipComment();
    if (!(this._isBreakOrEnd)) {
      {
        (() => { throw new YamlException("Expected comment or line break after directive.", this._scanner.spanFrom(start)); })();
      }
    }
    this._skipLine();
    return token;
  }
  _scanDirectiveName() {
    let start = this._scanner.position;
    while (this._isNonSpace) {
      {
        this._scanner.readCodePoint();
      }
    }
    let name = this._scanner.substring(start);
    if (name.length === 0) {
      {
        (() => { throw new YamlException("Expected directive name.", this._scanner.emptySpan); })();
      }
    } else {
      if (!(this._isBlankOrEnd)) {
        {
          (() => { throw new YamlException("Unexpected character in directive name.", this._scanner.emptySpan); })();
        }
      }
    }
    return name;
  }
  _scanVersionDirectiveValue(start) {
    this._skipBlanks();
    let major = this._scanVersionDirectiveNumber();
    this._scanner.expect(".");
    let minor = this._scanVersionDirectiveNumber();
    return new VersionDirectiveToken(this._scanner.spanFrom(start), major, minor);
  }
  _scanVersionDirectiveNumber() {
    let start = this._scanner.position;
    while (this._isDigit) {
      {
        this._scanner.readChar();
      }
    }
    let number = this._scanner.substring(start);
    if (number.length === 0) {
      {
        (() => { throw new YamlException("Expected version number.", this._scanner.emptySpan); })();
      }
    }
    return __dartIntParse(number, null);
  }
  _scanTagDirectiveValue(start) {
    this._skipBlanks();
    let handle = this._scanTagHandle({ directive: true });
    if (!(this._isBlank)) {
      {
        (() => { throw new YamlException("Expected whitespace.", this._scanner.emptySpan); })();
      }
    }
    this._skipBlanks();
    let prefix = this._scanTagUri();
    if (!(this._isBlankOrEnd)) {
      {
        (() => { throw new YamlException("Expected whitespace.", this._scanner.emptySpan); })();
      }
    }
    return new TagDirectiveToken(this._scanner.spanFrom(start), handle, prefix);
  }
  _scanAnchor({ anchor = true } = {}) {
    let start = this._scanner.state;
    this._scanner.readCodePoint();
    let startPosition = this._scanner.position;
    while (this._isAnchorChar) {
      {
        this._scanner.readCodePoint();
      }
    }
    let name = this._scanner.substring(startPosition);
    let next = this._scanner.peekChar();
    if ((name.length === 0 || ((((((((!(this._isBlankOrEnd) && !(__dartEquals(next, 63))) && !(__dartEquals(next, 58))) && !(__dartEquals(next, 44))) && !(__dartEquals(next, 93))) && !(__dartEquals(next, 125))) && !(__dartEquals(next, 37))) && !(__dartEquals(next, 64))) && !(__dartEquals(next, 96))))) {
      {
        (() => { throw new YamlException("Expected alphanumeric character.", this._scanner.emptySpan); })();
      }
    }
    if (anchor) {
      {
        return new AnchorToken(this._scanner.spanFrom(start), name);
      }
    } else {
      {
        return new AliasToken(this._scanner.spanFrom(start), name);
      }
    }
  }
  _scanTag() {
    let handle = null;
    let suffix = null;
    let start = this._scanner.state;
    if (__dartEquals(this._scanner.peekChar(1), 60)) {
      {
        this._scanner.readChar();
        this._scanner.readChar();
        handle = "";
        suffix = this._scanTagUri();
        this._scanner.expect(">");
      }
    } else {
      {
        handle = this._scanTagHandle();
        if ((((handle.length > 1) && handle.startsWith("!")) && handle.endsWith("!"))) {
          {
            suffix = this._scanTagUri({ flowSeparators: false });
          }
        } else {
          {
            suffix = this._scanTagUri({ head: handle, flowSeparators: false });
            if (suffix.length === 0) {
              {
                handle = null;
                suffix = "!";
              }
            } else {
              {
                handle = "!";
              }
            }
          }
        }
      }
    }
    return new TagToken(this._scanner.spanFrom(start), handle, suffix);
  }
  _scanTagHandle({ directive = false } = {}) {
    this._scanner.expect("!");
    let buffer = __dartStringBuffer("!");
    let start = this._scanner.position;
    while (this._isTagChar) {
      {
        this._scanner.readChar();
      }
    }
    buffer.write(this._scanner.substring(start));
    if (__dartEquals(this._scanner.peekChar(), 33)) {
      {
        buffer.writeCharCode(this._scanner.readCodePoint());
      }
    } else {
      {
        if ((directive && !(__dartEquals(__dartStr(buffer), "!")))) {
          this._scanner.expect("!");
        }
      }
    }
    return __dartStr(buffer);
  }
  _scanTagUri({ head = null, flowSeparators = true } = {}) {
    let length = ((head === null) ? 0 : head.length);
    let buffer = __dartStringBuffer("");
    if ((length > 1)) {
      buffer.write(__dartNullCheck(head).substring(1));
    }
    let start = this._scanner.position;
    let char = this._scanner.peekChar();
    while ((this._isTagChar || (flowSeparators && ((__dartEquals(char, 44) || __dartEquals(char, 91)) || __dartEquals(char, 93))))) {
      {
        this._scanner.readChar();
        char = this._scanner.peekChar();
      }
    }
    return decodeURI(this._scanner.substring(start));
  }
  _scanBlockScalar({ literal = false } = {}) {
    let start = this._scanner.state;
    this._scanner.readCodePoint();
    let chomping = _Chomping.clip;
    let increment = 0;
    let char = this._scanner.peekChar();
    if ((__dartEquals(char, 43) || __dartEquals(char, 45))) {
      {
        chomping = (__dartEquals(char, 43) ? _Chomping.keep : _Chomping.strip);
        this._scanner.readCodePoint();
        if (this._isDigit) {
          {
            if (__dartEquals(this._scanner.peekChar(), 48)) {
              {
                (() => { throw new YamlException("0 may not be used as an indentation indicator.", this._scanner.spanFrom(start)); })();
              }
            }
            increment = (this._scanner.readCodePoint() - 48);
          }
        }
      }
    } else {
      if (this._isDigit) {
        {
          if (__dartEquals(this._scanner.peekChar(), 48)) {
            {
              (() => { throw new YamlException("0 may not be used as an indentation indicator.", this._scanner.spanFrom(start)); })();
            }
          }
          increment = (this._scanner.readCodePoint() - 48);
          char = this._scanner.peekChar();
          if ((__dartEquals(char, 43) || __dartEquals(char, 45))) {
            {
              chomping = (__dartEquals(char, 43) ? _Chomping.keep : _Chomping.strip);
              this._scanner.readCodePoint();
            }
          }
        }
      }
    }
    this._skipBlanks();
    this._skipComment();
    if (!(this._isBreakOrEnd)) {
      {
        (() => { throw new YamlException("Expected comment or line break.", this._scanner.emptySpan); })();
      }
    }
    this._skipLine();
    let indent = 0;
    if (!(__dartEquals(increment, 0))) {
      {
        indent = ((this._indent >= 0) ? (this._indent + increment) : increment);
      }
    }
    let pair = this._scanBlockScalarBreaks(indent);
    indent = pair.indent;
    let trailingBreaks = pair.trailingBreaks;
    let buffer = __dartStringBuffer("");
    let leadingBreak = "";
    let leadingBlank = false;
    let trailingBlank = false;
    let end = this._scanner.state;
    L:
    while ((__dartEquals(this._scanner.column, indent) && !(this._scanner.isDone))) {
      {
        if (this._isDocumentIndicator) {
          break L;
        }
        trailingBlank = this._isBlank;
        if ((((!(literal) && leadingBreak.length !== 0) && !(leadingBlank)) && !(trailingBlank))) {
          {
            if (trailingBreaks.length === 0) {
              buffer.writeCharCode(32);
            }
          }
        } else {
          {
            buffer.write(leadingBreak);
          }
        }
        leadingBreak = "";
        buffer.write(trailingBreaks);
        leadingBlank = this._isBlank;
        let startPosition = this._scanner.position;
        while (!(this._isBreakOrEnd)) {
          {
            this._scanner.readCodePoint();
          }
        }
        buffer.write(this._scanner.substring(startPosition));
        end = this._scanner.state;
        if (!(this._scanner.isDone)) {
          leadingBreak = this._readLine();
        }
        let pair_1 = this._scanBlockScalarBreaks(indent);
        indent = pair_1.indent;
        trailingBreaks = pair_1.trailingBreaks;
      }
    }
    if (!(__dartEquals(chomping, _Chomping.strip))) {
      buffer.write(leadingBreak);
    }
    if (__dartEquals(chomping, _Chomping.keep)) {
      buffer.write(trailingBreaks);
    }
    return new ScalarToken(this._scanner.spanFrom(start, end), __dartStr(buffer), (literal ? __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"LITERAL\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "LITERAL" }))) : __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"FOLDED\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "FOLDED" })))));
  }
  _scanBlockScalarBreaks(indent) {
    let maxIndent = 0;
    let breaks = __dartStringBuffer("");
    L:
    while (true) {
      {
        while (((__dartEquals(indent, 0) || (this._scanner.column < indent)) && __dartEquals(this._scanner.peekChar(), 32))) {
          {
            this._scanner.readChar();
          }
        }
        if ((this._scanner.column > maxIndent)) {
          maxIndent = this._scanner.column;
        }
        if (!(this._isBreak)) {
          break L;
        }
        breaks.write(this._readLine());
      }
    }
    if (__dartEquals(indent, 0)) {
      {
        indent = maxIndent;
        if ((indent < (this._indent + 1))) {
          indent = (this._indent + 1);
        }
      }
    }
    return __dartRecord([], { indent: indent, trailingBreaks: __dartStr(breaks) });
  }
  _scanFlowScalar({ singleQuote = false } = {}) {
    let start = this._scanner.state;
    let buffer = __dartStringBuffer("");
    this._scanner.readChar();
    L:
    while (true) {
      {
        if (this._isDocumentIndicator) {
          {
            this._scanner.error("Unexpected document indicator.");
          }
        }
        if (this._scanner.isDone) {
          {
            (() => { throw new YamlException("Unexpected end of file.", this._scanner.emptySpan); })();
          }
        }
        let leadingBlanks = false;
        L_1:
        while (!(this._isBlankOrEnd)) {
          {
            let char = this._scanner.peekChar();
            if (((singleQuote && __dartEquals(char, 39)) && __dartEquals(this._scanner.peekChar(1), 39))) {
              {
                this._scanner.readChar();
                this._scanner.readChar();
                buffer.writeCharCode(39);
              }
            } else {
              if (__dartEquals(char, (singleQuote ? 39 : 34))) {
                {
                  break L_1;
                }
              } else {
                if (((!(singleQuote) && __dartEquals(char, 92)) && this._isBreakAt(1))) {
                  {
                    this._scanner.readChar();
                    this._skipLine();
                    leadingBlanks = true;
                    break L_1;
                  }
                } else {
                  if ((!(singleQuote) && __dartEquals(char, 92))) {
                    {
                      let escapeStart = this._scanner.state;
                      let codeLength = null;
                      L_2:
                      switch (this._scanner.peekChar(1)) {
                        case 48:
                          {
                            buffer.writeCharCode(0);
                            break L_2;
                          }
                        case 97:
                          {
                            buffer.writeCharCode(7);
                            break L_2;
                          }
                        case 98:
                          {
                            buffer.writeCharCode(8);
                            break L_2;
                          }
                        case 116:
                        case 9:
                          {
                            buffer.writeCharCode(9);
                            break L_2;
                          }
                        case 110:
                          {
                            buffer.writeCharCode(10);
                            break L_2;
                          }
                        case 118:
                          {
                            buffer.writeCharCode(11);
                            break L_2;
                          }
                        case 102:
                          {
                            buffer.writeCharCode(12);
                            break L_2;
                          }
                        case 114:
                          {
                            buffer.writeCharCode(13);
                            break L_2;
                          }
                        case 101:
                          {
                            buffer.writeCharCode(27);
                            break L_2;
                          }
                        case 32:
                        case 34:
                        case 47:
                        case 92:
                          {
                            buffer.writeCharCode(__dartNullCheck(this._scanner.peekChar(1)));
                            break L_2;
                          }
                        case 78:
                          {
                            buffer.writeCharCode(133);
                            break L_2;
                          }
                        case 95:
                          {
                            buffer.writeCharCode(160);
                            break L_2;
                          }
                        case 76:
                          {
                            buffer.writeCharCode(8232);
                            break L_2;
                          }
                        case 80:
                          {
                            buffer.writeCharCode(8233);
                            break L_2;
                          }
                        case 120:
                          {
                            codeLength = 2;
                            break L_2;
                          }
                        case 117:
                          {
                            codeLength = 4;
                            break L_2;
                          }
                        case 85:
                          {
                            codeLength = 8;
                            break L_2;
                          }
                        default:
                          {
                            (() => { throw new YamlException("Unknown escape character.", this._scanner.spanFrom(escapeStart)); })();
                          }
                      }
                      this._scanner.readChar();
                      this._scanner.readChar();
                      if (!((codeLength === null))) {
                        {
                          let value = 0;
                          for (let i = 0; (i < codeLength); i = (i + 1)) {
                            {
                              if (!(this._isHex)) {
                                {
                                  this._scanner.readChar();
                                  (() => { throw new YamlException("Expected " + __dartStr(codeLength) + "-digit hexidecimal number.", this._scanner.spanFrom(escapeStart)); })();
                                }
                              }
                              value = ((value << 4) + this._asHex(this._scanner.readChar()));
                            }
                          }
                          if ((((value >= 55296) && (value <= 57343)) || (value > 1114111))) {
                            {
                              (() => { throw new YamlException("Invalid Unicode character escape code.", this._scanner.spanFrom(escapeStart)); })();
                            }
                          }
                          buffer.writeCharCode(value);
                        }
                      }
                    }
                  } else {
                    {
                      buffer.writeCharCode(this._scanner.readCodePoint());
                    }
                  }
                }
              }
            }
          }
        }
        if (__dartEquals(this._scanner.peekChar(), (singleQuote ? 39 : 34))) {
          {
            break L;
          }
        }
        let whitespace = __dartStringBuffer("");
        let leadingBreak = "";
        let trailingBreaks = __dartStringBuffer("");
        while ((this._isBlank || this._isBreak)) {
          {
            if (this._isBlank) {
              {
                if (!(leadingBlanks)) {
                  {
                    whitespace.writeCharCode(this._scanner.readChar());
                  }
                } else {
                  {
                    this._scanner.readChar();
                  }
                }
              }
            } else {
              {
                if (!(leadingBlanks)) {
                  {
                    whitespace.clear();
                    leadingBreak = this._readLine();
                    leadingBlanks = true;
                  }
                } else {
                  {
                    trailingBreaks.write(this._readLine());
                  }
                }
              }
            }
          }
        }
        if (leadingBlanks) {
          {
            if ((leadingBreak.length !== 0 && trailingBreaks.isEmpty)) {
              {
                buffer.writeCharCode(32);
              }
            } else {
              {
                buffer.write(trailingBreaks);
              }
            }
          }
        } else {
          {
            buffer.write(whitespace);
            whitespace.clear();
          }
        }
      }
    }
    this._scanner.readChar();
    return new ScalarToken(this._scanner.spanFrom(start), __dartStr(buffer), (singleQuote ? __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"SINGLE_QUOTED\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "SINGLE_QUOTED" }))) : __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"DOUBLE_QUOTED\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "DOUBLE_QUOTED" })))));
  }
  _scanPlainScalar() {
    let start = this._scanner.state;
    let end = this._scanner.state;
    let buffer = __dartStringBuffer("");
    let leadingBreak = "";
    let trailingBreaks = "";
    let whitespace = __dartStringBuffer("");
    let indent = (this._indent + 1);
    L:
    while (true) {
      {
        if (this._isDocumentIndicator) {
          break L;
        }
        if (__dartEquals(this._scanner.peekChar(), 35)) {
          break L;
        }
        if (this._isPlainChar) {
          {
            if (leadingBreak.length !== 0) {
              {
                if (trailingBreaks.length === 0) {
                  {
                    buffer.writeCharCode(32);
                  }
                } else {
                  {
                    buffer.write(trailingBreaks);
                  }
                }
                leadingBreak = "";
                trailingBreaks = "";
              }
            } else {
              {
                buffer.write(whitespace);
                whitespace.clear();
              }
            }
          }
        }
        let startPosition = this._scanner.position;
        while (this._isPlainChar) {
          {
            this._scanner.readCodePoint();
          }
        }
        buffer.write(this._scanner.substring(startPosition));
        end = this._scanner.state;
        if ((!(this._isBlank) && !(this._isBreak))) {
          break L;
        }
        while ((this._isBlank || this._isBreak)) {
          {
            if (this._isBlank) {
              {
                if (((leadingBreak.length !== 0 && (this._scanner.column < indent)) && __dartEquals(this._scanner.peekChar(), 9))) {
                  {
                    this._scanner.error("Expected a space but found a tab.", { length: 1 });
                  }
                }
                if (leadingBreak.length === 0) {
                  {
                    whitespace.writeCharCode(this._scanner.readChar());
                  }
                } else {
                  {
                    this._scanner.readChar();
                  }
                }
              }
            } else {
              {
                if (leadingBreak.length === 0) {
                  {
                    leadingBreak = this._readLine();
                    whitespace.clear();
                  }
                } else {
                  {
                    trailingBreaks = this._readLine();
                  }
                }
              }
            }
          }
        }
        if ((this._inBlockContext && (this._scanner.column < indent))) {
          break L;
        }
      }
    }
    if (leadingBreak.length !== 0) {
      this._simpleKeyAllowed = true;
    }
    return new ScalarToken(this._scanner.spanFrom(start, end), __dartStr(buffer), __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"PLAIN\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "PLAIN" }))));
  }
  _skipLine() {
    let char = this._scanner.peekChar();
    if ((!(__dartEquals(char, 13)) && !(__dartEquals(char, 10)))) {
      return;
    }
    this._scanner.readChar();
    if ((__dartEquals(char, 13) && __dartEquals(this._scanner.peekChar(), 10))) {
      this._scanner.readChar();
    }
  }
  _readLine() {
    let char = this._scanner.peekChar();
    if ((!(__dartEquals(char, 13)) && !(__dartEquals(char, 10)))) {
      {
        (() => { throw new YamlException("Expected newline.", this._scanner.emptySpan); })();
      }
    }
    this._scanner.readChar();
    if ((__dartEquals(char, 13) && __dartEquals(this._scanner.peekChar(), 10))) {
      this._scanner.readChar();
    }
    return "\n";
  }
  _isBlankAt(offset) {
    let char = this._scanner.peekChar(offset);
    return (__dartEquals(char, 32) || __dartEquals(char, 9));
  }
  _isBreakAt(offset) {
    let char = this._scanner.peekChar(offset);
    return (__dartEquals(char, 13) || __dartEquals(char, 10));
  }
  _isBlankOrEndAt(offset) {
    let char = this._scanner.peekChar(offset);
    return (((((char === null) || __dartEquals(char, 32)) || __dartEquals(char, 9)) || __dartEquals(char, 13)) || __dartEquals(char, 10));
  }
  _isPlainCharAt(offset) {
    L:
    switch (this._scanner.peekChar(offset)) {
      case 58:
        {
          return this._isPlainSafeAt((offset + 1));
        }
      case 35:
        {
          let previous = this._scanner.peekChar((offset - 1));
          return (!(__dartEquals(previous, 32)) && !(__dartEquals(previous, 9)));
        }
      default:
        {
          return this._isPlainSafeAt(offset);
        }
    }
  }
  _isPlainSafeAt(offset) {
    let char = this._scanner.peekChar(offset);
    return (() => {
      let v = null;
      const _0_0 = char;
      const _0_1 = null;
      const _0_3 = 44;
      const _0_5 = 91;
      const _0_7 = 93;
      const _0_9 = 123;
      const _0_11 = 125;
      const _0_13 = 32;
      const _0_15 = 9;
      const _0_17 = 10;
      const _0_19 = 13;
      const _0_21 = 65279;
      const _0_23 = 133;
      L:
      {
        {
          if ((_0_0 === null)) {
            {
              v = false;
              break L;
            }
          }
        }
        {
          if (((((__dartEquals(44, _0_0) || __dartEquals(91, _0_0)) || __dartEquals(93, _0_0)) || __dartEquals(123, _0_0)) || __dartEquals(125, _0_0))) {
            {
              v = this._inBlockContext;
              break L;
            }
          }
        }
        {
          if (((((__dartEquals(32, _0_0) || __dartEquals(9, _0_0)) || __dartEquals(10, _0_0)) || __dartEquals(13, _0_0)) || __dartEquals(65279, _0_0))) {
            {
              v = false;
              break L;
            }
          }
        }
        {
          if (__dartEquals(133, _0_0)) {
            {
              v = true;
              break L;
            }
          }
        }
        {
          if (true) {
            {
              v = this._isStandardCharacterAt(offset);
              break L;
            }
          }
        }
      }
      return v;
    })();
  }
  _isStandardCharacterAt(offset) {
    let first = this._scanner.peekChar(offset);
    if ((first === null)) {
      return false;
    }
    if (isHighSurrogate_1(first)) {
      {
        let next = this._scanner.peekChar((offset + 1));
        return (!((next === null)) && isLowSurrogate_1(next));
      }
    }
    return this._isStandardCharacter(first);
  }
  _isStandardCharacter(char) {
    return ((((char >= 32) && (char <= 126)) || ((char >= 160) && (char <= 55295))) || ((char >= 57344) && (char <= 65533)));
  }
  _asHex(char) {
    if ((char <= 57)) {
      return (char - 48);
    }
    if ((char <= 70)) {
      return ((10 + char) - 65);
    }
    return ((10 + char) - 97);
  }
  _skipBlanks() {
    while (this._isBlank) {
      {
        this._scanner.readChar();
      }
    }
  }
  _skipComment() {
    if (!(__dartEquals(this._scanner.peekChar(), 35))) {
      return;
    }
    while (!(this._isBreakOrEnd)) {
      {
        this._scanner.readChar();
      }
    }
  }
  _reportError(exception) {
    if (!(this._recover)) {
      {
        (() => { throw exception; })();
      }
    }
    ((this._errorListener)?.onError(exception) ?? null);
  }
}

class _SimpleKey {
  constructor(tokenNumber, line, column, location, { required } = {}) {
    this.tokenNumber = tokenNumber;
    this.line = line;
    this.column = column;
    this.location = location;
    this.required = required;
  }
}

class _Chomping {
  constructor(index, name) {
    Object.defineProperty(this, "index", { value: index, enumerable: true });
    Object.defineProperty(this, "name", { value: name, enumerable: true });
    Object.freeze(this);
  }
  toString() {
    return "_Chomping." + this.name;
  }
}
Object.defineProperties(_Chomping, {
  strip: { value: new _Chomping(0, "strip"), enumerable: true },
  clip: { value: new _Chomping(1, "clip"), enumerable: true },
  keep: { value: new _Chomping(2, "keep"), enumerable: true }
});
Object.defineProperty(_Chomping, "values", { value: Object.freeze([_Chomping.strip, _Chomping.clip, _Chomping.keep]), enumerable: true });

class YamlDocument {
  constructor() {
    throw new TypeError("Class YamlDocument has no unnamed constructor");
  }
  static internal(contents, span, versionDirective, tagDirectives, { startImplicit = false, endImplicit = false } = {}) {
    return $YamlDocument_internal(YamlDocument, contents, span, versionDirective, tagDirectives, { startImplicit: startImplicit, endImplicit: endImplicit });
  }
  toString() {
    return __dartObjectToString(this.contents);
  }
}

function $YamlDocument_internal($newTarget, contents, span, versionDirective, tagDirectives, { startImplicit = false, endImplicit = false } = {}) {
  const $self = Object.create($newTarget.prototype);
  $self.contents = contents;
  $self.span = span;
  $self.versionDirective = versionDirective;
  $self.startImplicit = startImplicit;
  $self.endImplicit = endImplicit;
  $self.tagDirectives = __dartUnmodifiableListView(tagDirectives);
  return $self;
}

class VersionDirective {
  constructor(major, minor) {
    this.major = major;
    this.minor = minor;
  }
  toString() {
    return "%YAML " + __dartStr(this.major) + "." + __dartStr(this.minor);
  }
}

class TagDirective {
  constructor(handle, prefix) {
    this.handle = handle;
    this.prefix = prefix;
  }
  toString() {
    return "%TAG " + __dartStr(this.handle) + " " + __dartStr(this.prefix);
  }
}

class Parser {
  constructor(source, { sourceUrl = null, recover = false, errorListener = null } = {}) {
    this._states = new Array(0).fill(null);
    this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"STREAM_START\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "STREAM_START" })));
    this._tagDirectives = new Map([]);
    this._scanner = new Scanner(source, { sourceUrl: sourceUrl, recover: recover, errorListener: errorListener });
  }
  get isDone() {
    return __dartEquals(this._state, __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"END\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "END" }))));
  }
  parse() {
    try {
      {
        if (this.isDone) {
          (() => { throw __dartCoreError("StateError", "No more events."); })();
        }
        let event = this._stateMachine();
        return event;
      }
    } catch ($error) {
      if ($error instanceof StringScannerException) {
        const error = $error;
        {
          (() => { throw new YamlException(error.message, error.span); })();
        }
      } else {
        throw $error;
      }
    }
  }
  _stateMachine() {
    L:
    switch (this._state) {
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"STREAM_START\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "STREAM_START" }))):
        {
          return this._parseStreamStart();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"DOCUMENT_START\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "DOCUMENT_START" }))):
        {
          return this._parseDocumentStart();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"DOCUMENT_CONTENT\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "DOCUMENT_CONTENT" }))):
        {
          return this._parseDocumentContent();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"DOCUMENT_END\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "DOCUMENT_END" }))):
        {
          return this._parseDocumentEnd();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_NODE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_NODE" }))):
        {
          return this._parseNode({ block: true });
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_NODE_OR_INDENTLESS_SEQUENCE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_NODE_OR_INDENTLESS_SEQUENCE" }))):
        {
          return this._parseNode({ block: true, indentlessSequence: true });
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_NODE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_NODE" }))):
        {
          return this._parseNode();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_SEQUENCE_FIRST_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_SEQUENCE_FIRST_ENTRY" }))):
        {
          this._scanner.scan();
          return this._parseBlockSequenceEntry();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_SEQUENCE_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_SEQUENCE_ENTRY" }))):
        {
          return this._parseBlockSequenceEntry();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"INDENTLESS_SEQUENCE_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "INDENTLESS_SEQUENCE_ENTRY" }))):
        {
          return this._parseIndentlessSequenceEntry();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_MAPPING_FIRST_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_MAPPING_FIRST_KEY" }))):
        {
          this._scanner.scan();
          return this._parseBlockMappingKey();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_MAPPING_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_MAPPING_KEY" }))):
        {
          return this._parseBlockMappingKey();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_MAPPING_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_MAPPING_VALUE" }))):
        {
          return this._parseBlockMappingValue();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_FIRST_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_FIRST_ENTRY" }))):
        {
          return this._parseFlowSequenceEntry({ first: true });
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY" }))):
        {
          return this._parseFlowSequenceEntry();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY_MAPPING_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY_MAPPING_KEY" }))):
        {
          return this._parseFlowSequenceEntryMappingKey();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY_MAPPING_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY_MAPPING_VALUE" }))):
        {
          return this._parseFlowSequenceEntryMappingValue();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY_MAPPING_END\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY_MAPPING_END" }))):
        {
          return this._parseFlowSequenceEntryMappingEnd();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_FIRST_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_FIRST_KEY" }))):
        {
          return this._parseFlowMappingKey({ first: true });
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_KEY" }))):
        {
          return this._parseFlowMappingKey();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_VALUE" }))):
        {
          return this._parseFlowMappingValue();
        }
      case __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_EMPTY_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_EMPTY_VALUE" }))):
        {
          return this._parseFlowMappingValue({ empty: true });
        }
      default:
        {
          (() => { throw __dartCoreError("StateError", "Unreachable"); })();
        }
    }
  }
  _parseStreamStart() {
    let token = this._scanner.scan();
    this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"DOCUMENT_START\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "DOCUMENT_START" })));
    return new Event(EventType.streamStart, token.span);
  }
  _parseDocumentStart() {
    let token = __dartNullCheck(this._scanner.peek());
    while (__dartEquals(token.type, TokenType.documentEnd)) {
      {
        token = __dartNullCheck(this._scanner.advance());
      }
    }
    if ((((!(__dartEquals(token.type, TokenType.versionDirective)) && !(__dartEquals(token.type, TokenType.tagDirective))) && !(__dartEquals(token.type, TokenType.documentStart))) && !(__dartEquals(token.type, TokenType.streamEnd)))) {
      {
        this._processDirectives();
        (this._states.push(__dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"DOCUMENT_END\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "DOCUMENT_END" })))), null);
        this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_NODE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_NODE" })));
        return new DocumentStartEvent(token.span.start.pointSpan());
      }
    }
    if (__dartEquals(token.type, TokenType.streamEnd)) {
      {
        this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"END\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "END" })));
        this._scanner.scan();
        return new Event(EventType.streamEnd, token.span);
      }
    }
    let start = token.span;
    let versionDirective = null;
    let tagDirectives = null;
    {
      const _0_0 = this._processDirectives();
      versionDirective = _0_0.$1;
      tagDirectives = _0_0.$2;
    }
    token = __dartNullCheck(this._scanner.peek());
    if (!(__dartEquals(token.type, TokenType.documentStart))) {
      {
        (() => { throw new YamlException("Expected document start.", token.span); })();
      }
    }
    (this._states.push(__dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"DOCUMENT_END\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "DOCUMENT_END" })))), null);
    this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"DOCUMENT_CONTENT\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "DOCUMENT_CONTENT" })));
    this._scanner.scan();
    return new DocumentStartEvent(start.expand(token.span), { versionDirective: versionDirective, tagDirectives: tagDirectives, isImplicit: false });
  }
  _parseDocumentContent() {
    let token = __dartNullCheck(this._scanner.peek());
    L:
    switch (token.type) {
      case TokenType.versionDirective:
      case TokenType.tagDirective:
      case TokenType.documentStart:
      case TokenType.documentEnd:
      case TokenType.streamEnd:
        {
          this._state = this._states.pop();
          return this._processEmptyScalar(token.span.start);
        }
      default:
        {
          return this._parseNode({ block: true });
        }
    }
  }
  _parseDocumentEnd() {
    (this._tagDirectives.clear(), null);
    this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"DOCUMENT_START\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "DOCUMENT_START" })));
    let token = __dartNullCheck(this._scanner.peek());
    if (__dartEquals(token.type, TokenType.documentEnd)) {
      {
        this._scanner.scan();
        return new DocumentEndEvent(token.span, { isImplicit: false });
      }
    } else {
      {
        return new DocumentEndEvent(token.span.start.pointSpan());
      }
    }
  }
  _parseNode({ block = false, indentlessSequence = false } = {}) {
    let token = __dartNullCheck(this._scanner.peek());
    if (token instanceof AliasToken) {
      {
        this._scanner.scan();
        this._state = this._states.pop();
        return new AliasEvent(token.span, token.name);
      }
    }
    let anchor = null;
    let tagToken = null;
    let span = token.span.start.pointSpan();
    const parseAnchor = (token) => {
      anchor = token.name;
      span = span.expand(token.span);
      return __dartNullCheck(this._scanner.advance());
    };
    const parseTag = (token) => {
      tagToken = token;
      span = span.expand(token.span);
      return __dartNullCheck(this._scanner.advance());
    };
    if (token instanceof AnchorToken) {
      {
        token = parseAnchor(token);
        if (token instanceof TagToken) {
          token = parseTag(token);
        }
      }
    } else {
      if (token instanceof TagToken) {
        {
          token = parseTag(token);
          if (token instanceof AnchorToken) {
            token = parseAnchor(token);
          }
        }
      }
    }
    let tag = null;
    if (!((tagToken === null))) {
      {
        if ((__dartNullCheck(tagToken).handle === null)) {
          {
            tag = __dartNullCheck(tagToken).suffix;
          }
        } else {
          {
            let tagDirective = __dartMapGet(this._tagDirectives, __dartNullCheck(tagToken).handle);
            if ((tagDirective === null)) {
              {
                (() => { throw new YamlException("Undefined tag handle.", __dartNullCheck(tagToken).span); })();
              }
            }
            tag = (tagDirective.prefix + ((tagToken)?.suffix ?? ""));
          }
        }
      }
    }
    if ((indentlessSequence && __dartEquals(token.type, TokenType.blockEntry))) {
      {
        this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"INDENTLESS_SEQUENCE_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "INDENTLESS_SEQUENCE_ENTRY" })));
        return new SequenceStartEvent(span.expand(token.span), __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"BLOCK\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "BLOCK" }))), { anchor: anchor, tag: tag });
      }
    }
    if (token instanceof ScalarToken) {
      {
        if (((tag === null) && !(__dartEquals(token.style, __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"PLAIN\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "PLAIN" }))))))) {
          tag = "!";
        }
        this._state = this._states.pop();
        this._scanner.scan();
        return new ScalarEvent(span.expand(token.span), token.value, token.style, { anchor: anchor, tag: tag });
      }
    }
    if (__dartEquals(token.type, TokenType.flowSequenceStart)) {
      {
        this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_FIRST_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_FIRST_ENTRY" })));
        return new SequenceStartEvent(span.expand(token.span), __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"FLOW\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "FLOW" }))), { anchor: anchor, tag: tag });
      }
    }
    if (__dartEquals(token.type, TokenType.flowMappingStart)) {
      {
        this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_FIRST_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_FIRST_KEY" })));
        return new MappingStartEvent(span.expand(token.span), __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"FLOW\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "FLOW" }))), { anchor: anchor, tag: tag });
      }
    }
    if ((block && __dartEquals(token.type, TokenType.blockSequenceStart))) {
      {
        this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_SEQUENCE_FIRST_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_SEQUENCE_FIRST_ENTRY" })));
        return new SequenceStartEvent(span.expand(token.span), __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"BLOCK\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "BLOCK" }))), { anchor: anchor, tag: tag });
      }
    }
    if ((block && __dartEquals(token.type, TokenType.blockMappingStart))) {
      {
        this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_MAPPING_FIRST_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_MAPPING_FIRST_KEY" })));
        return new MappingStartEvent(span.expand(token.span), __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"BLOCK\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "BLOCK" }))), { anchor: anchor, tag: tag });
      }
    }
    if ((!((anchor === null)) || !((tag === null)))) {
      {
        this._state = this._states.pop();
        return new ScalarEvent(span, "", __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"PLAIN\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "PLAIN" }))), { anchor: anchor, tag: tag });
      }
    }
    (() => { throw new YamlException("Expected node content.", span); })();
  }
  _parseBlockSequenceEntry() {
    let token = __dartNullCheck(this._scanner.peek());
    if (__dartEquals(token.type, TokenType.blockEntry)) {
      {
        let start = token.span.start;
        token = __dartNullCheck(this._scanner.advance());
        if ((__dartEquals(token.type, TokenType.blockEntry) || __dartEquals(token.type, TokenType.blockEnd))) {
          {
            this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_SEQUENCE_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_SEQUENCE_ENTRY" })));
            return this._processEmptyScalar(start);
          }
        } else {
          {
            (this._states.push(__dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_SEQUENCE_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_SEQUENCE_ENTRY" })))), null);
            return this._parseNode({ block: true });
          }
        }
      }
    }
    if (__dartEquals(token.type, TokenType.blockEnd)) {
      {
        this._scanner.scan();
        this._state = this._states.pop();
        return new Event(EventType.sequenceEnd, token.span);
      }
    }
    (() => { throw new YamlException("While parsing a block collection, expected '-'.", token.span.start.pointSpan()); })();
  }
  _parseIndentlessSequenceEntry() {
    let token = __dartNullCheck(this._scanner.peek());
    if (!(__dartEquals(token.type, TokenType.blockEntry))) {
      {
        this._state = this._states.pop();
        return new Event(EventType.sequenceEnd, token.span.start.pointSpan());
      }
    }
    let start = token.span.start;
    token = __dartNullCheck(this._scanner.advance());
    if ((((__dartEquals(token.type, TokenType.blockEntry) || __dartEquals(token.type, TokenType.key)) || __dartEquals(token.type, TokenType.value)) || __dartEquals(token.type, TokenType.blockEnd))) {
      {
        this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"INDENTLESS_SEQUENCE_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "INDENTLESS_SEQUENCE_ENTRY" })));
        return this._processEmptyScalar(start);
      }
    } else {
      {
        (this._states.push(__dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"INDENTLESS_SEQUENCE_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "INDENTLESS_SEQUENCE_ENTRY" })))), null);
        return this._parseNode({ block: true });
      }
    }
  }
  _parseBlockMappingKey() {
    let token = __dartNullCheck(this._scanner.peek());
    if (__dartEquals(token.type, TokenType.key)) {
      {
        let start = token.span.start;
        token = __dartNullCheck(this._scanner.advance());
        if (((__dartEquals(token.type, TokenType.key) || __dartEquals(token.type, TokenType.value)) || __dartEquals(token.type, TokenType.blockEnd))) {
          {
            this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_MAPPING_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_MAPPING_VALUE" })));
            return this._processEmptyScalar(start);
          }
        } else {
          {
            (this._states.push(__dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_MAPPING_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_MAPPING_VALUE" })))), null);
            return this._parseNode({ block: true, indentlessSequence: true });
          }
        }
      }
    }
    if (__dartEquals(token.type, TokenType.value)) {
      {
        this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_MAPPING_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_MAPPING_VALUE" })));
        return this._processEmptyScalar(token.span.start);
      }
    }
    if (__dartEquals(token.type, TokenType.blockEnd)) {
      {
        this._scanner.scan();
        this._state = this._states.pop();
        return new Event(EventType.mappingEnd, token.span);
      }
    }
    (() => { throw new YamlException("Expected a key while parsing a block mapping.", token.span.start.pointSpan()); })();
  }
  _parseBlockMappingValue() {
    let token = __dartNullCheck(this._scanner.peek());
    if (!(__dartEquals(token.type, TokenType.value))) {
      {
        this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_MAPPING_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_MAPPING_KEY" })));
        return this._processEmptyScalar(token.span.start);
      }
    }
    let start = token.span.start;
    token = __dartNullCheck(this._scanner.advance());
    if (((__dartEquals(token.type, TokenType.key) || __dartEquals(token.type, TokenType.value)) || __dartEquals(token.type, TokenType.blockEnd))) {
      {
        this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_MAPPING_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_MAPPING_KEY" })));
        return this._processEmptyScalar(start);
      }
    } else {
      {
        (this._states.push(__dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_MAPPING_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_MAPPING_KEY" })))), null);
        return this._parseNode({ block: true, indentlessSequence: true });
      }
    }
  }
  _parseFlowSequenceEntry({ first = false } = {}) {
    if (first) {
      this._scanner.scan();
    }
    let token = __dartNullCheck(this._scanner.peek());
    if (!(__dartEquals(token.type, TokenType.flowSequenceEnd))) {
      {
        if (!(first)) {
          {
            if (!(__dartEquals(token.type, TokenType.flowEntry))) {
              {
                (() => { throw new YamlException("While parsing a flow sequence, expected ',' or ']'.", token.span.start.pointSpan()); })();
              }
            }
            token = __dartNullCheck(this._scanner.advance());
          }
        }
        if (__dartEquals(token.type, TokenType.key)) {
          {
            this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY_MAPPING_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY_MAPPING_KEY" })));
            this._scanner.scan();
            return new MappingStartEvent(token.span, __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"FLOW\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "FLOW" }))));
          }
        } else {
          if (!(__dartEquals(token.type, TokenType.flowSequenceEnd))) {
            {
              (this._states.push(__dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY" })))), null);
              return this._parseNode();
            }
          }
        }
      }
    }
    this._scanner.scan();
    this._state = this._states.pop();
    return new Event(EventType.sequenceEnd, token.span);
  }
  _parseFlowSequenceEntryMappingKey() {
    let token = __dartNullCheck(this._scanner.peek());
    if (((__dartEquals(token.type, TokenType.value) || __dartEquals(token.type, TokenType.flowEntry)) || __dartEquals(token.type, TokenType.flowSequenceEnd))) {
      {
        let start = token.span.start;
        this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY_MAPPING_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY_MAPPING_VALUE" })));
        return this._processEmptyScalar(start);
      }
    } else {
      {
        (this._states.push(__dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY_MAPPING_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY_MAPPING_VALUE" })))), null);
        return this._parseNode();
      }
    }
  }
  _parseFlowSequenceEntryMappingValue() {
    let token = __dartNullCheck(this._scanner.peek());
    if (__dartEquals(token.type, TokenType.value)) {
      {
        token = __dartNullCheck(this._scanner.advance());
        if ((!(__dartEquals(token.type, TokenType.flowEntry)) && !(__dartEquals(token.type, TokenType.flowSequenceEnd)))) {
          {
            (this._states.push(__dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY_MAPPING_END\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY_MAPPING_END" })))), null);
            return this._parseNode();
          }
        }
      }
    }
    this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY_MAPPING_END\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY_MAPPING_END" })));
    return this._processEmptyScalar(token.span.start);
  }
  _parseFlowSequenceEntryMappingEnd() {
    this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY" })));
    return new Event(EventType.mappingEnd, __dartNullCheck(this._scanner.peek()).span.start.pointSpan());
  }
  _parseFlowMappingKey({ first = false } = {}) {
    if (first) {
      this._scanner.scan();
    }
    let token = __dartNullCheck(this._scanner.peek());
    if (!(__dartEquals(token.type, TokenType.flowMappingEnd))) {
      {
        if (!(first)) {
          {
            if (!(__dartEquals(token.type, TokenType.flowEntry))) {
              {
                (() => { throw new YamlException("While parsing a flow mapping, expected ',' or '}'.", token.span.start.pointSpan()); })();
              }
            }
            token = __dartNullCheck(this._scanner.advance());
          }
        }
        if (__dartEquals(token.type, TokenType.key)) {
          {
            token = __dartNullCheck(this._scanner.advance());
            if (((!(__dartEquals(token.type, TokenType.value)) && !(__dartEquals(token.type, TokenType.flowEntry))) && !(__dartEquals(token.type, TokenType.flowMappingEnd)))) {
              {
                (this._states.push(__dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_VALUE" })))), null);
                return this._parseNode();
              }
            } else {
              {
                this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_VALUE" })));
                return this._processEmptyScalar(token.span.start);
              }
            }
          }
        } else {
          if (!(__dartEquals(token.type, TokenType.flowMappingEnd))) {
            {
              (this._states.push(__dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_EMPTY_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_EMPTY_VALUE" })))), null);
              return this._parseNode();
            }
          }
        }
      }
    }
    this._scanner.scan();
    this._state = this._states.pop();
    return new Event(EventType.mappingEnd, token.span);
  }
  _parseFlowMappingValue({ empty = false } = {}) {
    let token = __dartNullCheck(this._scanner.peek());
    if (empty) {
      {
        this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_KEY" })));
        return this._processEmptyScalar(token.span.start);
      }
    }
    if (__dartEquals(token.type, TokenType.value)) {
      {
        token = __dartNullCheck(this._scanner.advance());
        if ((!(__dartEquals(token.type, TokenType.flowEntry)) && !(__dartEquals(token.type, TokenType.flowMappingEnd)))) {
          {
            (this._states.push(__dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_KEY" })))), null);
            return this._parseNode();
          }
        }
      }
    }
    this._state = __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_KEY" })));
    return this._processEmptyScalar(token.span.start);
  }
  _processEmptyScalar(location) {
    return new ScalarEvent(__dartAs(location.pointSpan(), value => value instanceof FileSpan, "FileSpan"), "", __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"PLAIN\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "PLAIN" }))));
  }
  _processDirectives() {
    let token = __dartNullCheck(this._scanner.peek());
    let versionDirective = null;
    let tagDirectives = new Array(0).fill(null);
    while ((__dartEquals(token.type, TokenType.versionDirective) || __dartEquals(token.type, TokenType.tagDirective))) {
      {
        if (token instanceof VersionDirectiveToken) {
          {
            if (!((versionDirective === null))) {
              {
                (() => { throw new YamlException("Duplicate %YAML directive.", token.span); })();
              }
            }
            if ((!(__dartEquals(token.major, 1)) || __dartEquals(token.minor, 0))) {
              {
                (() => { throw new YamlException("Incompatible YAML document. This parser only supports YAML 1.1 and 1.2.", token.span); })();
              }
            } else {
              if ((token.minor > 2)) {
                {
                  warn("Warning: this parser only supports YAML 1.1 and 1.2.", token.span);
                }
              }
            }
            versionDirective = new VersionDirective(token.major, token.minor);
          }
        } else {
          if (token instanceof TagDirectiveToken) {
            {
              let tagDirective = new TagDirective(token.handle, token.prefix);
              this._appendTagDirective(tagDirective, token.span);
              (tagDirectives.push(tagDirective), null);
            }
          }
        }
        token = __dartNullCheck(this._scanner.advance());
      }
    }
    this._appendTagDirective(new TagDirective("!", "!"), token.span.start.pointSpan(), { allowDuplicates: true });
    this._appendTagDirective(new TagDirective("!!", "tag:yaml.org,2002:"), token.span.start.pointSpan(), { allowDuplicates: true });
    return __dartRecord([versionDirective, tagDirectives], {});
  }
  _appendTagDirective(newDirective, span, { allowDuplicates = false } = {}) {
    if (__dartMapContainsKey(this._tagDirectives, newDirective.handle)) {
      {
        if (allowDuplicates) {
          return;
        }
        (() => { throw new YamlException("Duplicate %TAG directive.", span); })();
      }
    }
    __dartMapSet(this._tagDirectives, newDirective.handle, newDirective);
  }
}

class _State {
  constructor(name) {
    this.name = name;
  }
  toString() {
    return this.name;
  }
}

class Event {
  constructor(type, span) {
    this.type = type;
    this.span = span;
    Object.defineProperty(this, $Event_interface, { value: true });
  }
  toString() {
    return __dartStr(this.type);
  }
}
Object.defineProperty(Event, Symbol.hasInstance, { value(value) { return value != null && value[$Event_interface] === true; } });

class DocumentStartEvent {
  constructor(span, { versionDirective = null, tagDirectives = null, isImplicit = true } = {}) {
    this.span = span;
    this.versionDirective = versionDirective;
    this.isImplicit = isImplicit;
    this.tagDirectives = (tagDirectives ?? new Array(0).fill(null));
    Object.defineProperty(this, $Event_interface, { value: true });
  }
  get type() {
    return EventType.documentStart;
  }
  toString() {
    return "DOCUMENT_START";
  }
}

class DocumentEndEvent {
  constructor(span, { isImplicit = true } = {}) {
    this.span = span;
    this.isImplicit = isImplicit;
    Object.defineProperty(this, $Event_interface, { value: true });
  }
  get type() {
    return EventType.documentEnd;
  }
  toString() {
    return "DOCUMENT_END";
  }
}

class AliasEvent {
  constructor(span, name) {
    this.span = span;
    this.name = name;
    Object.defineProperty(this, $Event_interface, { value: true });
  }
  get type() {
    return EventType.alias;
  }
  toString() {
    return "ALIAS " + __dartStr(this.name);
  }
}

class _ValueEvent {
  constructor() {
    Object.defineProperty(this, $Event_interface, { value: true });
  }
  get anchor() {
    throw new TypeError("Abstract member _ValueEvent.anchor");
  }
  set anchor(value) {
    Object.defineProperty(this, "anchor", { value, writable: true, configurable: true, enumerable: true });
  }
  get tag() {
    throw new TypeError("Abstract member _ValueEvent.tag");
  }
  set tag(value) {
    Object.defineProperty(this, "tag", { value, writable: true, configurable: true, enumerable: true });
  }
  toString() {
    let buffer = __dartStringBuffer(__dartStr(this.type));
    if (!((this.anchor === null))) {
      buffer.write(" &" + __dartStr(this.anchor));
    }
    if (!((this.tag === null))) {
      buffer.write(" " + __dartStr(this.tag));
    }
    return __dartStr(buffer);
  }
}

class ScalarEvent extends _ValueEvent {
  constructor(span, value, style_1, { anchor = null, tag = null } = {}) {
    super();
    this.span = span;
    this.value = value;
    this.style = style_1;
    this.anchor = anchor;
    this.tag = tag;
  }
  get type() {
    return EventType.scalar;
  }
  toString() {
    return __dartStr(super.toString()) + " \"" + __dartStr(this.value) + "\"";
  }
}

class SequenceStartEvent extends _ValueEvent {
  constructor(span, style_1, { anchor = null, tag = null } = {}) {
    super();
    this.span = span;
    this.style = style_1;
    this.anchor = anchor;
    this.tag = tag;
  }
  get type() {
    return EventType.sequenceStart;
  }
}

class MappingStartEvent extends _ValueEvent {
  constructor(span, style_1, { anchor = null, tag = null } = {}) {
    super();
    this.span = span;
    this.style = style_1;
    this.anchor = anchor;
    this.tag = tag;
  }
  get type() {
    return EventType.mappingStart;
  }
}

class EventType {
  constructor(index, name) {
    Object.defineProperty(this, "index", { value: index, enumerable: true });
    Object.defineProperty(this, "name", { value: name, enumerable: true });
    Object.freeze(this);
  }
  toString() {
    return "EventType." + this.name;
  }
}
Object.defineProperties(EventType, {
  streamStart: { value: new EventType(0, "streamStart"), enumerable: true },
  streamEnd: { value: new EventType(1, "streamEnd"), enumerable: true },
  documentStart: { value: new EventType(2, "documentStart"), enumerable: true },
  documentEnd: { value: new EventType(3, "documentEnd"), enumerable: true },
  alias: { value: new EventType(4, "alias"), enumerable: true },
  scalar: { value: new EventType(5, "scalar"), enumerable: true },
  sequenceStart: { value: new EventType(6, "sequenceStart"), enumerable: true },
  sequenceEnd: { value: new EventType(7, "sequenceEnd"), enumerable: true },
  mappingStart: { value: new EventType(8, "mappingStart"), enumerable: true },
  mappingEnd: { value: new EventType(9, "mappingEnd"), enumerable: true }
});
Object.defineProperty(EventType, "values", { value: Object.freeze([EventType.streamStart, EventType.streamEnd, EventType.documentStart, EventType.documentEnd, EventType.alias, EventType.scalar, EventType.sequenceStart, EventType.sequenceEnd, EventType.mappingStart, EventType.mappingEnd]), enumerable: true });

class NullSpan extends SourceSpanMixin {
  constructor(sourceUrl) {
    super();
    this.text = "";
    this.start = new SourceLocation(0, { sourceUrl: sourceUrl });
  }
  get end() {
    return this.start;
  }
}

class _YamlMapWrapper_MapBase_UnmodifiableMapMixin {
  constructor() {
    Object.defineProperty(this, $UnmodifiableMapMixin_interface, { value: true });
  }
  "[]="(key, value) {
    return UnmodifiableMapMixin._throw();
  }
  putIfAbsent(key, ifAbsent) {
    return UnmodifiableMapMixin._throw();
  }
  addAll(other) {
    return UnmodifiableMapMixin._throw();
  }
  remove(key) {
    return UnmodifiableMapMixin._throw();
  }
  clear() {
    return UnmodifiableMapMixin._throw();
  }
  set first(_) {
    return UnmodifiableMapMixin._throw();
  }
  set last(_) {
    return UnmodifiableMapMixin._throw();
  }
}

class YamlNode {
  constructor() {
    if (new.target === YamlNode) {
      throw new TypeError("Class YamlNode has no unnamed constructor");
    }
  }
  static _(_span) {
    return $YamlNode__(YamlNode, _span);
  }
  get span() {
    return this._span;
  }
  get value() {
    throw new TypeError("Abstract member YamlNode.value");
  }
  set value(value) {
    Object.defineProperty(this, "value", { value, writable: true, configurable: true, enumerable: true });
  }
}

function $YamlNode__($newTarget, _span) {
  const $self = Object.create($newTarget.prototype);
  $self._span = _span;
  return $self;
}

class _YamlMap_YamlNode_MapMixin extends YamlNode {
  constructor() {
    if (new.target === _YamlMap_YamlNode_MapMixin) {
      throw new TypeError("Class _YamlMap&YamlNode&MapMixin has no unnamed constructor");
    }
  }
  static _(_span) {
    return $_YamlMap_YamlNode_MapMixin__(_YamlMap_YamlNode_MapMixin, _span);
  }
  get keys() {
    throw new TypeError("Abstract member _YamlMap&YamlNode&MapMixin.keys");
  }
  set keys(value) {
    Object.defineProperty(this, "keys", { value, writable: true, configurable: true, enumerable: true });
  }
  "[]"(key) {
    throw new TypeError("Abstract member _YamlMap&YamlNode&MapMixin.[]");
  }
  "[]="(key, value) {
    throw new TypeError("Abstract member _YamlMap&YamlNode&MapMixin.[]=");
  }
  remove(key) {
    throw new TypeError("Abstract member _YamlMap&YamlNode&MapMixin.remove");
  }
  clear() {
    throw new TypeError("Abstract member _YamlMap&YamlNode&MapMixin.clear");
  }
  cast() {
    return __dartMapFromEntries(Array.from(this, ([key, value]) => [__dartAs(key, (key) => true, "TypeParameterType(_YamlMap&YamlNode&MapMixin.cast.RK%)"), __dartAs(value, (value) => true, "TypeParameterType(_YamlMap&YamlNode&MapMixin.cast.RV%)")]));
  }
  forEach(action) {
    {
      let _sync_for_iterator = __dartIterator(this.keys);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let key = _sync_for_iterator.current;
          {
            (action)(key, (this["[]"](key) ?? v));
          }
        }
      }
    }
  }
  addAll(other) {
    (other.forEach((value, key) => ((key, value) => {
      this["[]="](key, value);
})(key, value)), null);
  }
  containsValue(value) {
    {
      let _sync_for_iterator = __dartIterator(this.keys);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let key = _sync_for_iterator.current;
          {
            if (__dartEquals(this["[]"](key), value)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }
  putIfAbsent(key, ifAbsent) {
    if (this.containsKey(key)) {
      {
        return (this["[]"](key) ?? v);
      }
    }
    return (() => { let v_1 = key; return (() => { let v_2 = (ifAbsent)(); return (() => { let v_3 = this["[]="](v_1, v_2); return v_2; })(); })(); })();
  }
  update(key, update, { ifAbsent = null } = {}) {
    if (this.containsKey(key)) {
      {
        return (() => { let v = key; return (() => { let v_1 = (update)((this["[]"](key) ?? v_2)); return (() => { let v_3 = this["[]="](v, v_1); return v_1; })(); })(); })();
      }
    }
    if (!((ifAbsent === null))) {
      {
        return (() => { let v_4 = key; return (() => { let v_5 = (ifAbsent)(); return (() => { let v_6 = this["[]="](v_4, v_5); return v_5; })(); })(); })();
      }
    }
    (() => { throw __dartCoreError("ArgumentError", key); })();
  }
  updateAll(update) {
    {
      let _sync_for_iterator = __dartIterator(this.keys);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let key = _sync_for_iterator.current;
          {
            this["[]="](key, (update)(key, (this["[]"](key) ?? v)));
          }
        }
      }
    }
  }
  get entries() {
    return Array.from(this.keys, (key) => { return Object.freeze({ key: key, value: (this["[]"](key) ?? v) }); });
  }
  map(transform) {
    let result = new Map([]);
    {
      let _sync_for_iterator = __dartIterator(this.keys);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let key = _sync_for_iterator.current;
          {
            let entry = (transform)(key, (this["[]"](key) ?? v));
            __dartMapSet(result, entry.key, entry.value);
          }
        }
      }
    }
    return result;
  }
  addEntries(newEntries) {
    {
      let _sync_for_iterator = __dartIterator(newEntries);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let entry = _sync_for_iterator.current;
          {
            this["[]="](entry.key, entry.value);
          }
        }
      }
    }
  }
  removeWhere(test) {
    let keysToRemove = new Array(0).fill(null);
    {
      let _sync_for_iterator = __dartIterator(this.keys);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let key = _sync_for_iterator.current;
          {
            if ((test)(key, (this["[]"](key) ?? v))) {
              (keysToRemove.push(key), null);
            }
          }
        }
      }
    }
    {
      let _sync_for_iterator_1 = __dartIterator(keysToRemove);
      for (; _sync_for_iterator_1.moveNext(); ) {
        {
          let key_1 = _sync_for_iterator_1.current;
          {
            this.remove(key_1);
          }
        }
      }
    }
  }
  containsKey(key) {
    return __dartIterableContains(this.keys, key);
  }
  get length() {
    return __dartIterableLength(this.keys);
  }
  get isEmpty() {
    return __dartIterableIsEmpty(this.keys);
  }
  get isNotEmpty() {
    return !__dartIterableIsEmpty(this.keys);
  }
  get values() {
    return __dartMapBaseValues(this);
  }
  toString() {
    return ("{" + Array.from(this, ([key, value]) => __dartStr(key) + ": " + __dartStr(value)).join(", ") + "}");
  }
}

function $_YamlMap_YamlNode_MapMixin__($newTarget, _span) {
  const $self = $YamlNode__($newTarget, _span);
  return $self;
}

class _YamlMap_YamlNode_MapMixin_UnmodifiableMapMixin extends _YamlMap_YamlNode_MapMixin {
  constructor() {
    if (new.target === _YamlMap_YamlNode_MapMixin_UnmodifiableMapMixin) {
      throw new TypeError("Class _YamlMap&YamlNode&MapMixin&UnmodifiableMapMixin has no unnamed constructor");
    }
  }
  static _(_span) {
    return $_YamlMap_YamlNode_MapMixin_UnmodifiableMapMixin__(_YamlMap_YamlNode_MapMixin_UnmodifiableMapMixin, _span);
  }
  "[]="(key, value) {
    return UnmodifiableMapMixin._throw();
  }
  putIfAbsent(key, ifAbsent) {
    return UnmodifiableMapMixin._throw();
  }
  addAll(other) {
    return UnmodifiableMapMixin._throw();
  }
  remove(key) {
    return UnmodifiableMapMixin._throw();
  }
  clear() {
    return UnmodifiableMapMixin._throw();
  }
  set first(_) {
    return UnmodifiableMapMixin._throw();
  }
  set last(_) {
    return UnmodifiableMapMixin._throw();
  }
}

function $_YamlMap_YamlNode_MapMixin_UnmodifiableMapMixin__($newTarget, _span) {
  const $self = $_YamlMap_YamlNode_MapMixin__($newTarget, _span);
  Object.defineProperty($self, $UnmodifiableMapMixin_interface, { value: true });
  return $self;
}

class YamlMap extends _YamlMap_YamlNode_MapMixin_UnmodifiableMapMixin {
  static internal(nodes, span, style_1) {
    return $YamlMap_internal(YamlMap, nodes, span, style_1);
  }
  get value() {
    return this;
  }
  get keys() {
    return Array.from(Array.from(this.nodes.keys()), function(node) { return __dartAs(node, value => value instanceof YamlNode, "YamlNode").value; });
  }
  constructor({ sourceUrl = null } = {}) {
    return new YamlMapWrapper(__dartConst("[\"map\",\"DynamicType(dynamic)\",\"DynamicType(dynamic)\"]", () => __dartConstMap([])), sourceUrl);
  }
  static wrap(dartMap, { sourceUrl = null, style: style_1 = __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"ANY\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "ANY" }))) } = {}) {
    return new YamlMapWrapper(dartMap, sourceUrl, { style: style_1 });
  }
  "[]"(key) {
    return ((__dartMapGet(this.nodes, key))?.value ?? null);
  }
}
Object.defineProperty(YamlMap, Symbol.hasInstance, { value(value) { return value != null && value[$YamlMap_interface] === true; } });

function $YamlMap_internal($newTarget, nodes, span, style_1) {
  const $self = $_YamlMap_YamlNode_MapMixin_UnmodifiableMapMixin__($newTarget, span);
  Object.defineProperty($self, $YamlMap_interface, { value: true });
  $self.style = style_1;
  $self.nodes = __dartUnmodifiableMapView(nodes);
  return $self;
}

class YamlMapWrapper extends _YamlMapWrapper_MapBase_UnmodifiableMapMixin {
  constructor(dartMap, sourceUrl, { style: style_1 = __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"ANY\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "ANY" }))) } = {}) {
    return $YamlMapWrapper__(new.target, dartMap, new NullSpan(sourceUrl), { style: style_1 });
  }
  static _(dartMap, span, { style: style_1 = __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"ANY\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "ANY" }))) } = {}) {
    return $YamlMapWrapper__(YamlMapWrapper, dartMap, span, { style: style_1 });
  }
  get value() {
    return this;
  }
  get keys() {
    return Array.from(this._dartMap.keys());
  }
  "[]"(key) {
    let value = __dartMapGet(this._dartMap, key);
    if (value instanceof Map) {
      return YamlMapWrapper._(value, this.span);
    }
    if ((Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView)))) {
      return YamlListWrapper._(value, this.span);
    }
    return value;
  }
  get hashCode() {
    return __dartHashValue(this._dartMap);
  }
  "=="(other) {
    return (other instanceof YamlMapWrapper && __dartEquals(other._dartMap, this._dartMap));
  }
}

function $YamlMapWrapper__($newTarget, dartMap, span, { style: style_1 = __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"ANY\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "ANY" }))) } = {}) {
  const $self = Reflect.construct(_YamlMapWrapper_MapBase_UnmodifiableMapMixin, [], $newTarget);
  Object.defineProperty($self, $YamlMap_interface, { value: true });
  $self.span = span;
  $self.style = style_1;
  $self._dartMap = dartMap;
  $self.nodes = new _YamlMapNodes(dartMap, span);
  (() => { const value = $self.style; if (value == null) throw __dartCoreError("ArgumentError", "style" == null ? "Must not be null" : String("style") + " must not be null"); return value; })();
  return $self;
}

class __YamlMapNodes_MapBase_UnmodifiableMapMixin {
  constructor() {
    Object.defineProperty(this, $UnmodifiableMapMixin_interface, { value: true });
  }
  "[]="(key, value) {
    return UnmodifiableMapMixin._throw();
  }
  putIfAbsent(key, ifAbsent) {
    return UnmodifiableMapMixin._throw();
  }
  addAll(other) {
    return UnmodifiableMapMixin._throw();
  }
  remove(key) {
    return UnmodifiableMapMixin._throw();
  }
  clear() {
    return UnmodifiableMapMixin._throw();
  }
  set first(_) {
    return UnmodifiableMapMixin._throw();
  }
  set last(_) {
    return UnmodifiableMapMixin._throw();
  }
}

class _YamlMapNodes extends __YamlMapNodes_MapBase_UnmodifiableMapMixin {
  constructor(_dartMap, _span) {
    super();
    this._dartMap = _dartMap;
    this._span = _span;
  }
  get keys() {
    return Array.from(Array.from(this._dartMap.keys()), (key) => { return YamlScalar.internalWithSpan(key, this._span); });
  }
  "[]"(key) {
    if (key instanceof YamlScalar) {
      key = key.value;
    }
    if (!(__dartMapContainsKey(this._dartMap, key))) {
      return null;
    }
    return _nodeForValue(__dartMapGet(this._dartMap, key), this._span);
  }
  get hashCode() {
    return __dartHashValue(this._dartMap);
  }
  "=="(other) {
    return (other instanceof _YamlMapNodes && __dartEquals(other._dartMap, this._dartMap));
  }
}

class _YamlList_YamlNode_ListMixin extends YamlNode {
  constructor() {
    if (new.target === _YamlList_YamlNode_ListMixin) {
      throw new TypeError("Class _YamlList&YamlNode&ListMixin has no unnamed constructor");
    }
  }
  static _(_span) {
    return $_YamlList_YamlNode_ListMixin__(_YamlList_YamlNode_ListMixin, _span);
  }
  get first() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return __dartIndexGet(this, 0);
  }
  set first(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    __dartIndexSet(this, 0, value);
  }
  get last() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    return __dartIndexGet(this, (this.length - 1));
  }
  set last(value) {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    __dartIndexSet(this, (this.length - 1), value);
  }
  get iterator() {
    return __dartIterator(this);
  }
  elementAt(index) {
    return __dartIndexGet(this, index);
  }
  followedBy(other) {
    return Array.from(this).concat(Array.from(other));
  }
  forEach(action) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        (action)(__dartIndexGet(this, i));
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
  }
  get isEmpty() {
    return __dartEquals(this.length, 0);
  }
  get isNotEmpty() {
    return !(this.length === 0);
  }
  get single() {
    if (__dartEquals(this.length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    if ((this.length > 1)) {
      (() => { throw __dartCoreError("StateError", "Too many elements"); })();
    }
    return __dartIndexGet(this, 0);
  }
  contains(element) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          return true;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return false;
  }
  every(test) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if (!((test)(__dartIndexGet(this, i)))) {
          return false;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return true;
  }
  any(test) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        if ((test)(__dartIndexGet(this, i))) {
          return true;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return false;
  }
  firstWhere(test, { orElse = null } = {}) {
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = __dartIndexGet(this, i);
        if ((test)(element)) {
          return element;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  lastWhere(test, { orElse = null } = {}) {
    let length = this.length;
    for (let i = (length - 1); (i >= 0); i = (i - 1)) {
      {
        let element = __dartIndexGet(this, i);
        if ((test)(element)) {
          return element;
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  singleWhere(test, { orElse = null } = {}) {
    let length = this.length;
    const match = __dartLazyField("match", null, true, null);
    let matchFound = false;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = __dartIndexGet(this, i);
        if ((test)(element)) {
          {
            if (matchFound) {
              {
                (() => { throw __dartCoreError("StateError", "Too many elements"); })();
              }
            }
            matchFound = true;
            match.set(element);
          }
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (matchFound) {
      return match.get();
    }
    if (!((orElse === null))) {
      return (orElse)();
    }
    (() => { throw __dartCoreError("StateError", "No element"); })();
  }
  join(separator_1 = "") {
    if (__dartEquals(this.length, 0)) {
      return "";
    }
    let buffer = (() => { let v = __dartStringBuffer(""); return (() => {
      v.writeAll(this, separator_1);
      return v;
    })(); })();
    return __dartStr(buffer);
  }
  where(test) {
    return Array.from(this).filter((value) => test(value));
  }
  whereType() {
    return Array.from(this).filter((value) => true);
  }
  map(f) {
    return Array.from(this, (value) => f(value));
  }
  expand(f) {
    return Array.from(this).flatMap((value) => Array.from(f(value)));
  }
  reduce(combine) {
    let length = this.length;
    if (__dartEquals(length, 0)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    let value = __dartIndexGet(this, 0);
    for (let i = 1; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, __dartIndexGet(this, i));
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return value;
  }
  fold(initialValue, combine) {
    let value = initialValue;
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        value = (combine)(value, __dartIndexGet(this, i));
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    return value;
  }
  skip(count) {
    return Array.from(this).slice(count, null ?? undefined);
  }
  skipWhile(test) {
    return __dartIterableSkipWhile(this, test);
  }
  take(count) {
    return Array.from(this).slice(0, __dartNullCheck(count) ?? undefined);
  }
  takeWhile(test) {
    return __dartIterableTakeWhile(this, test);
  }
  toList({ growable = true } = {}) {
    if (this.length === 0) {
      return (growable ? [] : __dartFixedList([]));
    }
    let first = __dartIndexGet(this, 0);
    let result = (growable ? new Array(this.length).fill(first) : __dartFixedList(new Array(this.length).fill(first)));
    for (let i = 1; (i < this.length); i = (i + 1)) {
      {
        __dartIndexSet(result, i, __dartIndexGet(this, i));
      }
    }
    return result;
  }
  toSet() {
    let result = new Set();
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        __dartSetAdd(result, __dartIndexGet(this, i));
      }
    }
    return result;
  }
  add(element) {
    __dartIndexSet(this, (() => { let v = this.length; return (() => { let v_1 = this.length = (v + 1); return v; })(); })(), element);
  }
  addAll(iterable) {
    let i = this.length;
    {
      let _sync_for_iterator = __dartIterator(iterable);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            this.add(element);
            i = (i + 1);
          }
        }
      }
    }
  }
  remove(element) {
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          {
            this._closeGap(i, (i + 1));
            return true;
          }
        }
      }
    }
    return false;
  }
  _closeGap(start, end) {
    let length = this.length;
    let size = (end - start);
    for (let i = end; (i < length); i = (i + 1)) {
      {
        __dartIndexSet(this, (i - size), __dartIndexGet(this, i));
      }
    }
    this.length = (length - size);
  }
  removeWhere(test) {
    this._filter(test, false);
  }
  retainWhere(test) {
    this._filter(test, true);
  }
  _filter(test, retainMatching) {
    let retained = new Array(0).fill(null);
    let length = this.length;
    for (let i = 0; (i < length); i = (i + 1)) {
      {
        let element = __dartIndexGet(this, i);
        if (__dartEquals((test)(element), retainMatching)) {
          {
            (retained.push(element), null);
          }
        }
        if (!(__dartEquals(length, this.length))) {
          {
            (() => { throw __dartCoreError("ConcurrentModificationError", this); })();
          }
        }
      }
    }
    if (!(__dartEquals(retained.length, this.length))) {
      {
        __dartListSetRange(this, 0, retained.length, retained, 0);
        this.length = retained.length;
      }
    }
  }
  clear() {
    this.length = 0;
  }
  cast() {
    return Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(_YamlList&YamlNode&ListMixin.cast.R%)"));
  }
  removeLast() {
    if (__dartEquals(this.length, 0)) {
      {
        (() => { throw __dartCoreError("StateError", "No element"); })();
      }
    }
    let result = __dartIndexGet(this, (this.length - 1));
    this.length = (this.length - 1);
    return result;
  }
  sort(compare = null) {
    __dartListSort(this, (compare ?? ((left, right) => __dartCompare(left, right))));
  }
  shuffle(random = null) {
    ((random === null) ? random = __dartRandom(null, false) : null);
    let length = this.length;
    while ((length > 1)) {
      {
        let pos = random.nextInt(length);
        length = (length - 1);
        let tmp = __dartIndexGet(this, length);
        __dartIndexSet(this, length, __dartIndexGet(this, pos));
        __dartIndexSet(this, pos, tmp);
      }
    }
  }
  asMap() {
    return new Map(Array.from(this, (value, index) => [index, value]));
  }
  "+"(other) {
    return (() => {
      const v = Array.from(this);
      (v.push(...Array.from(other)), null);
      return v;
    })();
  }
  sublist(start, end = null) {
    let listLength = this.length;
    ((end === null) ? end = listLength : null);
    __dartCheckValidRange(start, end, listLength, null, null, null);
    return Array.from(this.slice(start, end));
  }
  getRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    return Array.from(this).slice(start, end ?? undefined);
  }
  removeRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if ((end > start)) {
      {
        this._closeGap(start, end);
      }
    }
  }
  fillRange(start, end, fill = null) {
    let value = (fill ?? v);
    __dartCheckValidRange(start, end, this.length, null, null, null);
    for (let i = start; (i < end); i = (i + 1)) {
      {
        __dartIndexSet(this, i, value);
      }
    }
  }
  setRange(start, end, iterable, skipCount = 0) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    let length = (end - start);
    if (__dartEquals(length, 0)) {
      return;
    }
    __dartCheckNotNegative(skipCount, "skipCount", null);
    let otherList = null;
    let otherStart = null;
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        otherList = iterable;
        otherStart = skipCount;
      }
    } else {
      {
        otherList = __dartFixedList(Array.from(Array.from(iterable).slice(skipCount)));
        otherStart = 0;
      }
    }
    if (((otherStart + length) > otherList.length)) {
      {
        (() => { throw __dartCoreError("StateError", "Too few elements"); })();
      }
    }
    if ((otherStart < start)) {
      {
        for (let i = (length - 1); (i >= 0); i = (i - 1)) {
          {
            __dartIndexSet(this, (start + i), __dartIndexGet(otherList, (otherStart + i)));
          }
        }
      }
    } else {
      {
        for (let i_1 = 0; (i_1 < length); i_1 = (i_1 + 1)) {
          {
            __dartIndexSet(this, (start + i_1), __dartIndexGet(otherList, (otherStart + i_1)));
          }
        }
      }
    }
  }
  replaceRange(start, end, newContents) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if (__dartEquals(start, this.length)) {
      {
        this.addAll(newContents);
        return;
      }
    }
    if (!(newContents != null && typeof newContents !== "string" && typeof newContents.length === "number" && typeof newContents[Symbol.iterator] === "function")) {
      {
        newContents = Array.from(newContents);
      }
    }
    let removeLength = (end - start);
    let insertLength = __dartIterableLength(newContents);
    if ((removeLength >= insertLength)) {
      {
        let insertEnd = (start + insertLength);
        __dartListSetRange(this, start, insertEnd, newContents, 0);
        if ((removeLength > insertLength)) {
          {
            this._closeGap(insertEnd, end);
          }
        }
      }
    } else {
      if (__dartEquals(end, this.length)) {
        {
          let i = start;
          {
            let _sync_for_iterator = __dartIterator(newContents);
            for (; _sync_for_iterator.moveNext(); ) {
              {
                let element = _sync_for_iterator.current;
                {
                  if ((i < end)) {
                    {
                      __dartIndexSet(this, i, element);
                    }
                  } else {
                    {
                      this.add(element);
                    }
                  }
                  i = (i + 1);
                }
              }
            }
          }
        }
      } else {
        {
          let delta = (insertLength - removeLength);
          let oldLength = this.length;
          let insertEnd_1 = (start + insertLength);
          for (let i_1 = (oldLength - delta); (i_1 < oldLength); i_1 = (i_1 + 1)) {
            {
              this.add(__dartIndexGet(this, ((i_1 > 0) ? i_1 : 0)));
            }
          }
          if ((insertEnd_1 < oldLength)) {
            {
              __dartListSetRange(this, insertEnd_1, oldLength, this, end);
            }
          }
          __dartListSetRange(this, start, insertEnd_1, newContents, 0);
        }
      }
    }
  }
  indexOf(element, start = 0) {
    if ((start < 0)) {
      start = 0;
    }
    for (let i = start; (i < this.length); i = (i + 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          return i;
        }
      }
    }
    return (-1);
  }
  indexWhere(test, start = 0) {
    if ((start < 0)) {
      start = 0;
    }
    for (let i = start; (i < this.length); i = (i + 1)) {
      {
        if ((test)(__dartIndexGet(this, i))) {
          return i;
        }
      }
    }
    return (-1);
  }
  lastIndexOf(element, start = null) {
    if (((start === null) || (start >= this.length))) {
      start = (this.length - 1);
    }
    for (let i = start; (i >= 0); i = (i - 1)) {
      {
        if (__dartEquals(__dartIndexGet(this, i), element)) {
          return i;
        }
      }
    }
    return (-1);
  }
  lastIndexWhere(test, start = null) {
    if (((start === null) || (start >= this.length))) {
      start = (this.length - 1);
    }
    for (let i = start; (i >= 0); i = (i - 1)) {
      {
        if ((test)(__dartIndexGet(this, i))) {
          return i;
        }
      }
    }
    return (-1);
  }
  insert(index, element) {
    __dartNullCheck(index);
    let length = this.length;
    __dartCheckValueInInterval(index, 0, length, "index", null);
    this.add(element);
    if (!(__dartEquals(index, length))) {
      {
        __dartListSetRange(this, (index + 1), (length + 1), this, index);
        __dartIndexSet(this, index, element);
      }
    }
  }
  removeAt(index) {
    let result = __dartIndexGet(this, index);
    this._closeGap(index, (index + 1));
    return result;
  }
  insertAll(index, iterable) {
    __dartCheckValueInInterval(index, 0, this.length, "index", null);
    if (__dartEquals(index, this.length)) {
      {
        this.addAll(iterable);
        return;
      }
    }
    if ((!(iterable != null && typeof iterable !== "string" && typeof iterable.length === "number" && typeof iterable[Symbol.iterator] === "function") || Object.is(iterable, this))) {
      {
        iterable = Array.from(iterable);
      }
    }
    let insertionLength = __dartIterableLength(iterable);
    if (__dartEquals(insertionLength, 0)) {
      {
        return;
      }
    }
    let oldLength = this.length;
    for (let i = (oldLength - insertionLength); (i < oldLength); i = (i + 1)) {
      {
        this.add(__dartIndexGet(this, ((i > 0) ? i : 0)));
      }
    }
    if (!(__dartEquals(__dartIterableLength(iterable), insertionLength))) {
      {
        this.length = (this.length - insertionLength);
        (() => { throw __dartCoreError("ConcurrentModificationError", iterable); })();
      }
    }
    let oldCopyStart = (index + insertionLength);
    if ((oldCopyStart < oldLength)) {
      {
        __dartListSetRange(this, oldCopyStart, oldLength, this, index);
      }
    }
    __dartListSetAll(this, index, iterable);
  }
  setAll(index, iterable) {
    if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
      {
        __dartListSetRange(this, index, (index + __dartIterableLength(iterable)), iterable, 0);
      }
    } else {
      {
        {
          let _sync_for_iterator = __dartIterator(iterable);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let element = _sync_for_iterator.current;
              {
                __dartIndexSet(this, (() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element);
              }
            }
          }
        }
      }
    }
  }
  get reversed() {
    return Array.from(this).reverse();
  }
  toString() {
    return ("[" + Array.from(this, (value) => __dartStr(value)).join(", ") + "]");
  }
}

function $_YamlList_YamlNode_ListMixin__($newTarget, _span) {
  const $self = $YamlNode__($newTarget, _span);
  return $self;
}

class YamlList extends _YamlList_YamlNode_ListMixin {
  static internal(nodes, span, style_1) {
    return $YamlList_internal(YamlList, nodes, span, style_1);
  }
  get value() {
    return this;
  }
  get length() {
    return this.nodes.length;
  }
  set length(index) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot modify an unmodifiable List"); })();
  }
  constructor({ sourceUrl = null } = {}) {
    return new YamlListWrapper(__dartConst("[\"list\",\"DynamicType(dynamic)\"]", () => Object.freeze([])), sourceUrl);
  }
  static wrap(dartList, { sourceUrl = null, style: style_1 = __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"ANY\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "ANY" }))) } = {}) {
    return new YamlListWrapper(dartList, sourceUrl, { style: style_1 });
  }
  "[]"(index) {
    return __dartIndexGet(this.nodes, index).value;
  }
  "[]="(index, value) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot modify an unmodifiable List"); })();
  }
}
Object.defineProperty(YamlList, Symbol.hasInstance, { value(value) { return value != null && value[$YamlList_interface] === true; } });

function $YamlList_internal($newTarget, nodes, span, style_1) {
  const $self = $_YamlList_YamlNode_ListMixin__($newTarget, span);
  Object.defineProperty($self, $YamlList_interface, { value: true });
  $self.style = style_1;
  $self.nodes = __dartUnmodifiableListView(nodes);
  return $self;
}

class YamlListWrapper {
  constructor(dartList, sourceUrl, { style: style_1 = __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"ANY\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "ANY" }))) } = {}) {
    return $YamlListWrapper__(new.target, dartList, new NullSpan(sourceUrl), { style: style_1 });
  }
  static _(dartList, span, { style: style_1 = __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"ANY\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "ANY" }))) } = {}) {
    return $YamlListWrapper__(YamlListWrapper, dartList, span, { style: style_1 });
  }
  get value() {
    return this;
  }
  get length() {
    return this._dartList.length;
  }
  set length(index) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot modify an unmodifiable List."); })();
  }
  "[]"(index) {
    let value = __dartIndexGet(this._dartList, index);
    if (value instanceof Map) {
      return YamlMapWrapper._(value, this.span);
    }
    if ((Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView)))) {
      return YamlListWrapper._(value, this.span);
    }
    return value;
  }
  "[]="(index, value) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot modify an unmodifiable List."); })();
  }
  get hashCode() {
    return __dartHashValue(this._dartList);
  }
  "=="(other) {
    return (other instanceof YamlListWrapper && __dartEquals(other._dartList, this._dartList));
  }
}

function $YamlListWrapper__($newTarget, dartList, span, { style: style_1 = __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"ANY\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "ANY" }))) } = {}) {
  const $self = Object.create($newTarget.prototype);
  Object.defineProperty($self, $YamlList_interface, { value: true });
  $self.span = span;
  $self.style = style_1;
  $self._dartList = dartList;
  $self.nodes = new _YamlListNodes(dartList, span);
  (() => { const value = $self.style; if (value == null) throw __dartCoreError("ArgumentError", "style" == null ? "Must not be null" : String("style") + " must not be null"); return value; })();
  return $self;
}

class _YamlListNodes {
  constructor(_dartList, _span) {
    this._dartList = _dartList;
    this._span = _span;
  }
  get length() {
    return this._dartList.length;
  }
  set length(index) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot modify an unmodifiable List."); })();
  }
  "[]"(index) {
    return _nodeForValue(__dartIndexGet(this._dartList, index), this._span);
  }
  "[]="(index, value) {
    (() => { throw __dartCoreError("UnsupportedError", "Cannot modify an unmodifiable List."); })();
  }
  get hashCode() {
    return __dartHashValue(this._dartList);
  }
  "=="(other) {
    return (other instanceof _YamlListNodes && __dartEquals(other._dartList, this._dartList));
  }
}

class YamlScalar extends YamlNode {
  constructor() {
    throw new TypeError("Class YamlScalar has no unnamed constructor");
  }
  static wrap(value, { sourceUrl = null, style: style_1 = __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"ANY\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "ANY" }))) } = {}) {
    return $YamlScalar_wrap(YamlScalar, value, { sourceUrl: sourceUrl, style: style_1 });
  }
  static internal(value, scalar) {
    return $YamlScalar_internal(YamlScalar, value, scalar);
  }
  static internalWithSpan(value, span) {
    return $YamlScalar_internalWithSpan(YamlScalar, value, span);
  }
  toString() {
    return __dartObjectToString(this.value);
  }
}

function $YamlScalar_wrap($newTarget, value, { sourceUrl = null, style: style_1 = __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"ANY\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "ANY" }))) } = {}) {
  const $self = $YamlNode__($newTarget, new NullSpan(sourceUrl));
  $self.value = value;
  $self.style = style_1;
  (() => { const value = $self.style; if (value == null) throw __dartCoreError("ArgumentError", "style" == null ? "Must not be null" : String("style") + " must not be null"); return value; })();
  return $self;
}

function $YamlScalar_internal($newTarget, value, scalar) {
  const $self = $YamlNode__($newTarget, scalar.span);
  $self.value = value;
  $self.style = scalar.style;
  return $self;
}

function $YamlScalar_internalWithSpan($newTarget, value, span) {
  const $self = $YamlNode__($newTarget, span);
  $self.value = value;
  $self.style = __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"ANY\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "ANY" })));
  return $self;
}

class _DeepEquals {
  constructor() {
    this._parents1 = new Array(0).fill(null);
    this._parents2 = new Array(0).fill(null);
  }
  equals(obj1, obj2) {
    if (obj1 instanceof YamlScalar) {
      obj1 = obj1.value;
    }
    if (obj2 instanceof YamlScalar) {
      obj2 = obj2.value;
    }
    for (let i = 0; (i < this._parents1.length); i = (i + 1)) {
      {
        let loop1 = Object.is(obj1, __dartIndexGet(this._parents1, i));
        let loop2 = Object.is(obj2, __dartIndexGet(this._parents2, i));
        if ((loop1 && loop2)) {
          return true;
        }
        if ((loop1 || loop2)) {
          return false;
        }
      }
    }
    (this._parents1.push(obj1), null);
    (this._parents2.push(obj2), null);
    try {
      {
        if (((Array.isArray(obj1) || (ArrayBuffer.isView(obj1) && !(obj1 instanceof DataView))) && (Array.isArray(obj2) || (ArrayBuffer.isView(obj2) && !(obj2 instanceof DataView))))) {
          {
            return this._listEquals(obj1, obj2);
          }
        } else {
          if ((obj1 instanceof Map && obj2 instanceof Map)) {
            {
              return this._mapEquals(obj1, obj2);
            }
          } else {
            if ((typeof obj1 === "number" && typeof obj2 === "number")) {
              {
                return this._numEquals(obj1, obj2);
              }
            } else {
              {
                return __dartEquals(obj1, obj2);
              }
            }
          }
        }
      }
    } finally {
      {
        this._parents1.pop();
        this._parents2.pop();
      }
    }
  }
  _listEquals(list1, list2) {
    if (!(__dartEquals(list1.length, list2.length))) {
      return false;
    }
    for (let i = 0; (i < list1.length); i = (i + 1)) {
      {
        if (!(this.equals(__dartIndexGet(list1, i), __dartIndexGet(list2, i)))) {
          return false;
        }
      }
    }
    return true;
  }
  _mapEquals(map1, map2) {
    if (!(__dartEquals(map1.size, map2.size))) {
      return false;
    }
    {
      let _sync_for_iterator = __dartIterator(Array.from(map1.keys()));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let key = _sync_for_iterator.current;
          {
            if (!(__dartMapContainsKey(map2, key))) {
              return false;
            }
            if (!(this.equals(__dartMapGet(map1, key), __dartMapGet(map2, key)))) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }
  _numEquals(n1, n2) {
    if ((Number.isNaN(Number(n1)) && Number.isNaN(Number(n2)))) {
      return true;
    }
    return __dartEquals(n1, n2);
  }
}

class Loader {
  static _(_parser, _span) {
    return $Loader__(Loader, _parser, _span);
  }
  get span() {
    return this._span;
  }
  constructor(source, { sourceUrl = null, recover = false, errorListener = null } = {}) {
    let parser = new Parser(source, { sourceUrl: sourceUrl, recover: recover, errorListener: errorListener });
    let event = parser.parse();
    return Loader._(parser, event.span);
  }
  load() {
    if (this._parser.isDone) {
      return null;
    }
    let event = this._parser.parse();
    if (__dartEquals(event.type, EventType.streamEnd)) {
      {
        this._span = this._span.expand(event.span);
        return null;
      }
    }
    let document = this._loadDocument(__dartAs(event, value => value instanceof DocumentStartEvent, "DocumentStartEvent"));
    this._span = this._span.expand(__dartAs(document.span, value => value instanceof FileSpan, "FileSpan"));
    (this._aliases.clear(), null);
    return document;
  }
  _loadDocument(firstEvent) {
    let contents = this._loadNode(this._parser.parse());
    let lastEvent = __dartAs(this._parser.parse(), value => value instanceof DocumentEndEvent, "DocumentEndEvent");
    return YamlDocument.internal(contents, firstEvent.span.expand(lastEvent.span), firstEvent.versionDirective, firstEvent.tagDirectives, { startImplicit: firstEvent.isImplicit, endImplicit: lastEvent.isImplicit });
  }
  _loadNode(firstEvent) {
    return (() => {
      let v = null;
      const _0_0 = firstEvent.type;
      const _0_1 = EventType.alias;
      const _0_3 = EventType.scalar;
      const _0_5 = EventType.sequenceStart;
      const _0_7 = EventType.mappingStart;
      L:
      {
        {
          if (__dartEquals(EventType.alias, _0_0)) {
            {
              v = this._loadAlias(__dartAs(firstEvent, value => value instanceof AliasEvent, "AliasEvent"));
              break L;
            }
          }
        }
        {
          if (__dartEquals(EventType.scalar, _0_0)) {
            {
              v = this._loadScalar(__dartAs(firstEvent, value => value instanceof ScalarEvent, "ScalarEvent"));
              break L;
            }
          }
        }
        {
          if (__dartEquals(EventType.sequenceStart, _0_0)) {
            {
              v = this._loadSequence(__dartAs(firstEvent, value => value instanceof SequenceStartEvent, "SequenceStartEvent"));
              break L;
            }
          }
        }
        {
          if (__dartEquals(EventType.mappingStart, _0_0)) {
            {
              v = this._loadMapping(__dartAs(firstEvent, value => value instanceof MappingStartEvent, "MappingStartEvent"));
              break L;
            }
          }
        }
        {
          if (true) {
            {
              v = (() => { throw __dartCoreError("StateError", "Unreachable"); })();
              break L;
            }
          }
        }
      }
      return v;
    })();
  }
  _registerAnchor(anchor, node) {
    if ((anchor === null)) {
      return;
    }
    __dartMapSet(this._aliases, anchor, node);
  }
  _loadAlias(event) {
    let alias = __dartMapGet(this._aliases, event.name);
    if (!((alias === null))) {
      return alias;
    }
    (() => { throw new YamlException("Undefined alias.", event.span); })();
  }
  _loadScalar(scalar) {
    let node = null;
    if (__dartEquals(scalar.tag, "!")) {
      {
        node = YamlScalar.internal(scalar.value, scalar);
      }
    } else {
      if (!((scalar.tag === null))) {
        {
          node = this._parseByTag(scalar);
        }
      } else {
        {
          node = this._parseScalar(scalar);
        }
      }
    }
    this._registerAnchor(scalar.anchor, node);
    return node;
  }
  _loadSequence(firstEvent) {
    if (((!(__dartEquals(firstEvent.tag, "!")) && !((firstEvent.tag === null))) && !(__dartEquals(firstEvent.tag, "tag:yaml.org,2002:seq")))) {
      {
        (() => { throw new YamlException("Invalid tag for sequence.", firstEvent.span); })();
      }
    }
    let children = new Array(0).fill(null);
    let node = YamlList.internal(children, firstEvent.span, firstEvent.style);
    this._registerAnchor(firstEvent.anchor, node);
    let event = this._parser.parse();
    while (!(__dartEquals(event.type, EventType.sequenceEnd))) {
      {
        (children.push(this._loadNode(event)), null);
        event = this._parser.parse();
      }
    }
    setSpan(node, firstEvent.span.expand(event.span));
    return node;
  }
  _loadMapping(firstEvent) {
    if (((!(__dartEquals(firstEvent.tag, "!")) && !((firstEvent.tag === null))) && !(__dartEquals(firstEvent.tag, "tag:yaml.org,2002:map")))) {
      {
        (() => { throw new YamlException("Invalid tag for mapping.", firstEvent.span); })();
      }
    }
    let children = deepEqualsMap();
    let node = YamlMap.internal(children, firstEvent.span, firstEvent.style);
    this._registerAnchor(firstEvent.anchor, node);
    let event = this._parser.parse();
    while (!(__dartEquals(event.type, EventType.mappingEnd))) {
      {
        let key = this._loadNode(event);
        let value = this._loadNode(this._parser.parse());
        if (__dartMapContainsKey(children, key)) {
          {
            (() => { throw new YamlException("Duplicate mapping key.", key.span); })();
          }
        }
        __dartMapSet(children, key, value);
        event = this._parser.parse();
      }
    }
    setSpan(node, firstEvent.span.expand(event.span));
    return node;
  }
  _parseByTag(scalar) {
    L:
    switch (scalar.tag) {
      case "tag:yaml.org,2002:null":
        {
          let result = this._parseNull(scalar);
          if (!((result === null))) {
            return result;
          }
          (() => { throw new YamlException("Invalid null scalar.", scalar.span); })();
        }
      case "tag:yaml.org,2002:bool":
        {
          let result_1 = this._parseBool(scalar);
          if (!((result_1 === null))) {
            return result_1;
          }
          (() => { throw new YamlException("Invalid bool scalar.", scalar.span); })();
        }
      case "tag:yaml.org,2002:int":
        {
          let result_2 = this._parseNumber(scalar, { allowFloat: false });
          if (!((result_2 === null))) {
            return result_2;
          }
          (() => { throw new YamlException("Invalid int scalar.", scalar.span); })();
        }
      case "tag:yaml.org,2002:float":
        {
          let result_3 = this._parseNumber(scalar, { allowInt: false });
          if (!((result_3 === null))) {
            return result_3;
          }
          (() => { throw new YamlException("Invalid float scalar.", scalar.span); })();
        }
      case "tag:yaml.org,2002:str":
        {
          return YamlScalar.internal(scalar.value, scalar);
        }
      default:
        {
          (() => { throw new YamlException("Undefined tag: " + __dartStr(scalar.tag) + ".", scalar.span); })();
        }
    }
  }
  _parseScalar(scalar) {
    return (this._tryParseScalar(scalar) ?? YamlScalar.internal(scalar.value, scalar));
  }
  _tryParseScalar(scalar) {
    let length = scalar.value.length;
    if (__dartEquals(length, 0)) {
      return YamlScalar.internal(null, scalar);
    }
    let firstChar = scalar.value.charCodeAt(0);
    return (() => {
      let v = null;
      const _0_0 = firstChar;
      const _0_1 = 46;
      const _0_3 = 43;
      const _0_5 = 45;
      const _0_7 = 110;
      const _0_9 = 78;
      const _0_11 = 116;
      const _0_13 = 84;
      const _0_15 = 102;
      const _0_17 = 70;
      const _0_19 = 126;
      L:
      {
        {
          if (((__dartEquals(46, _0_0) || __dartEquals(43, _0_0)) || __dartEquals(45, _0_0))) {
            {
              v = this._parseNumber(scalar);
              break L;
            }
          }
        }
        {
          if ((__dartEquals(110, _0_0) || __dartEquals(78, _0_0))) {
            {
              v = (__dartEquals(length, 4) ? this._parseNull(scalar) : null);
              break L;
            }
          }
        }
        {
          if ((__dartEquals(116, _0_0) || __dartEquals(84, _0_0))) {
            {
              v = (__dartEquals(length, 4) ? this._parseBool(scalar) : null);
              break L;
            }
          }
        }
        {
          if ((__dartEquals(102, _0_0) || __dartEquals(70, _0_0))) {
            {
              v = (__dartEquals(length, 5) ? this._parseBool(scalar) : null);
              break L;
            }
          }
        }
        {
          if (__dartEquals(126, _0_0)) {
            {
              v = (__dartEquals(length, 1) ? YamlScalar.internal(null, scalar) : null);
              break L;
            }
          }
        }
        {
          if (true) {
            {
              v = (((firstChar >= 48) && (firstChar <= 57)) ? this._parseNumber(scalar) : null);
              break L;
            }
          }
        }
      }
      return v;
    })();
  }
  _parseNull(scalar) {
    return (() => {
      let v = null;
      const _0_0 = scalar.value;
      const _0_1 = "";
      const _0_3 = "null";
      const _0_5 = "Null";
      const _0_7 = "NULL";
      const _0_9 = "~";
      L:
      {
        {
          if (((((__dartEquals("", _0_0) || __dartEquals("null", _0_0)) || __dartEquals("Null", _0_0)) || __dartEquals("NULL", _0_0)) || __dartEquals("~", _0_0))) {
            {
              v = YamlScalar.internal(null, scalar);
              break L;
            }
          }
        }
        {
          if (true) {
            {
              v = null;
              break L;
            }
          }
        }
      }
      return v;
    })();
  }
  _parseBool(scalar) {
    return (() => {
      let v = null;
      const _0_0 = scalar.value;
      const _0_1 = "true";
      const _0_3 = "True";
      const _0_5 = "TRUE";
      const _0_7 = "false";
      const _0_9 = "False";
      const _0_11 = "FALSE";
      L:
      {
        {
          if (((__dartEquals("true", _0_0) || __dartEquals("True", _0_0)) || __dartEquals("TRUE", _0_0))) {
            {
              v = YamlScalar.internal(true, scalar);
              break L;
            }
          }
        }
        {
          if (((__dartEquals("false", _0_0) || __dartEquals("False", _0_0)) || __dartEquals("FALSE", _0_0))) {
            {
              v = YamlScalar.internal(false, scalar);
              break L;
            }
          }
        }
        {
          if (true) {
            {
              v = null;
              break L;
            }
          }
        }
      }
      return v;
    })();
  }
  _parseNumber(scalar, { allowInt = true, allowFloat = true } = {}) {
    let value = this._parseNumberValue(scalar.value, { allowInt: allowInt, allowFloat: allowFloat });
    return ((value === null) ? null : YamlScalar.internal(value, scalar));
  }
  _parseNumberValue(contents, { allowInt = true, allowFloat = true } = {}) {
    let firstChar = contents.charCodeAt(0);
    let length = contents.length;
    if ((allowInt && __dartEquals(length, 1))) {
      {
        let value = (firstChar - 48);
        return (((value >= 0) && (value <= 9)) ? value : null);
      }
    }
    let secondChar = contents.charCodeAt(1);
    if ((allowInt && __dartEquals(firstChar, 48))) {
      {
        if (__dartEquals(secondChar, 120)) {
          return __dartIntTryParse(contents, null);
        }
        if (__dartEquals(secondChar, 111)) {
          {
            let afterRadix = contents.substring(2);
            return __dartIntTryParse(afterRadix, 8);
          }
        }
      }
    }
    if ((((firstChar >= 48) && (firstChar <= 57)) || (((__dartEquals(firstChar, 43) || __dartEquals(firstChar, 45)) && (secondChar >= 48)) && (secondChar <= 57)))) {
      {
        let result = null;
        if (allowInt) {
          {
            result = __dartIntTryParse(contents, 10);
          }
        }
        if (allowFloat) {
          ((result === null) ? result = __dartDoubleTryParse(contents) : null);
        }
        return result;
      }
    }
    if (!(allowFloat)) {
      return null;
    }
    if ((((__dartEquals(firstChar, 46) && (secondChar >= 48)) && (secondChar <= 57)) || ((__dartEquals(firstChar, 45) || __dartEquals(firstChar, 43)) && __dartEquals(secondChar, 46)))) {
      {
        if (__dartEquals(length, 5)) {
          {
            L:
            switch (contents) {
              case "+.inf":
              case "+.Inf":
              case "+.INF":
                {
                  return Infinity;
                }
              case "-.inf":
              case "-.Inf":
              case "-.INF":
                {
                  return (-Infinity);
                }
            }
          }
        }
        return __dartDoubleTryParse(contents);
      }
    }
    if ((__dartEquals(length, 4) && __dartEquals(firstChar, 46))) {
      {
        L_1:
        switch (contents) {
          case ".inf":
          case ".Inf":
          case ".INF":
            {
              return Infinity;
            }
          case ".nan":
          case ".NaN":
          case ".NAN":
            {
              return Number.NaN;
            }
        }
      }
    }
    return null;
  }
}

function $Loader__($newTarget, _parser, _span) {
  const $self = Object.create($newTarget.prototype);
  $self._aliases = new Map([]);
  $self._parser = _parser;
  $self._span = _span;
  return $self;
}


Object.defineProperty(BoolList, "_entryShift", { value: 5, enumerable: true });

Object.defineProperty(BoolList, "_bitsPerEntry", { value: 32, enumerable: true });

Object.defineProperty(BoolList, "_entrySignBitIndex", { value: 31, enumerable: true });

Object.defineProperty(_GrowableBoolList, "_growthFactor", { value: 2, enumerable: true });

Object.defineProperty(HeapPriorityQueue, "_initialCapacity", { value: 7, enumerable: true });

Object.defineProperty(QueueList, "_initialCapacity", { value: 8, enumerable: true });

const $Style_posix = __dartLazyField("Style.posix", () => new PosixStyle(), false);
Object.defineProperty(Style, "posix", {
  get() { return $Style_posix.get(); },
  set(value) { $Style_posix.set(value); },
  enumerable: true,
});

const $Style_windows = __dartLazyField("Style.windows", () => new WindowsStyle(), false);
Object.defineProperty(Style, "windows", {
  get() { return $Style_windows.get(); },
  set(value) { $Style_windows.set(value); },
  enumerable: true,
});

const $Style_url = __dartLazyField("Style.url", () => new UrlStyle(), false);
Object.defineProperty(Style, "url", {
  get() { return $Style_url.get(); },
  set(value) { $Style_url.set(value); },
  enumerable: true,
});

const $Style_platform = __dartLazyField("Style.platform", () => Style._getPlatformStyle(), false);
Object.defineProperty(Style, "platform", {
  get() { return $Style_platform.get(); },
  set(value) { $Style_platform.set(value); },
  enumerable: true,
});

Object.defineProperty(_PathDirection, "aboveRoot", { value: __dartConst("[\"instance\",\"class:_PathDirection\",[\"field\",\"field:_PathDirection.name\",[\"string\",\"above root\"]]]", () => Object.freeze(Object.assign(Object.create(_PathDirection.prototype), { name: "above root" }))), enumerable: true });

Object.defineProperty(_PathDirection, "atRoot", { value: __dartConst("[\"instance\",\"class:_PathDirection\",[\"field\",\"field:_PathDirection.name\",[\"string\",\"at root\"]]]", () => Object.freeze(Object.assign(Object.create(_PathDirection.prototype), { name: "at root" }))), enumerable: true });

Object.defineProperty(_PathDirection, "reachesRoot", { value: __dartConst("[\"instance\",\"class:_PathDirection\",[\"field\",\"field:_PathDirection.name\",[\"string\",\"reaches root\"]]]", () => Object.freeze(Object.assign(Object.create(_PathDirection.prototype), { name: "reaches root" }))), enumerable: true });

Object.defineProperty(_PathDirection, "belowRoot", { value: __dartConst("[\"instance\",\"class:_PathDirection\",[\"field\",\"field:_PathDirection.name\",[\"string\",\"below root\"]]]", () => Object.freeze(Object.assign(Object.create(_PathDirection.prototype), { name: "below root" }))), enumerable: true });

Object.defineProperty(_PathRelation, "within", { value: __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"within\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "within" }))), enumerable: true });

Object.defineProperty(_PathRelation, "equal", { value: __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"equal\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "equal" }))), enumerable: true });

Object.defineProperty(_PathRelation, "different", { value: __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"different\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "different" }))), enumerable: true });

Object.defineProperty(_PathRelation, "inconclusive", { value: __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"inconclusive\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "inconclusive" }))), enumerable: true });

Object.defineProperty(Highlighter, "_spacesPerTab", { value: 4, enumerable: true });

Object.defineProperty(ScalarStyle, "ANY", { value: __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"ANY\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "ANY" }))), enumerable: true });

Object.defineProperty(ScalarStyle, "PLAIN", { value: __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"PLAIN\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "PLAIN" }))), enumerable: true });

Object.defineProperty(ScalarStyle, "LITERAL", { value: __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"LITERAL\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "LITERAL" }))), enumerable: true });

Object.defineProperty(ScalarStyle, "FOLDED", { value: __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"FOLDED\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "FOLDED" }))), enumerable: true });

Object.defineProperty(ScalarStyle, "SINGLE_QUOTED", { value: __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"SINGLE_QUOTED\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "SINGLE_QUOTED" }))), enumerable: true });

Object.defineProperty(ScalarStyle, "DOUBLE_QUOTED", { value: __dartConst("[\"instance\",\"class:ScalarStyle\",[\"field\",\"field:ScalarStyle.name\",[\"string\",\"DOUBLE_QUOTED\"]]]", () => Object.freeze(Object.assign(Object.create(ScalarStyle.prototype), { name: "DOUBLE_QUOTED" }))), enumerable: true });

Object.defineProperty(CollectionStyle, "ANY", { value: __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"ANY\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "ANY" }))), enumerable: true });

Object.defineProperty(CollectionStyle, "BLOCK", { value: __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"BLOCK\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "BLOCK" }))), enumerable: true });

Object.defineProperty(CollectionStyle, "FLOW", { value: __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"FLOW\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "FLOW" }))), enumerable: true });

Object.defineProperty(Scanner, "TAB", { value: 9, enumerable: true });

Object.defineProperty(Scanner, "LF", { value: 10, enumerable: true });

Object.defineProperty(Scanner, "CR", { value: 13, enumerable: true });

Object.defineProperty(Scanner, "SP", { value: 32, enumerable: true });

Object.defineProperty(Scanner, "DOLLAR", { value: 36, enumerable: true });

Object.defineProperty(Scanner, "LEFT_PAREN", { value: 40, enumerable: true });

Object.defineProperty(Scanner, "RIGHT_PAREN", { value: 41, enumerable: true });

Object.defineProperty(Scanner, "PLUS", { value: 43, enumerable: true });

Object.defineProperty(Scanner, "COMMA", { value: 44, enumerable: true });

Object.defineProperty(Scanner, "HYPHEN", { value: 45, enumerable: true });

Object.defineProperty(Scanner, "PERIOD", { value: 46, enumerable: true });

Object.defineProperty(Scanner, "QUESTION", { value: 63, enumerable: true });

Object.defineProperty(Scanner, "COLON", { value: 58, enumerable: true });

Object.defineProperty(Scanner, "SEMICOLON", { value: 59, enumerable: true });

Object.defineProperty(Scanner, "EQUALS", { value: 61, enumerable: true });

Object.defineProperty(Scanner, "LEFT_SQUARE", { value: 91, enumerable: true });

Object.defineProperty(Scanner, "RIGHT_SQUARE", { value: 93, enumerable: true });

Object.defineProperty(Scanner, "LEFT_CURLY", { value: 123, enumerable: true });

Object.defineProperty(Scanner, "RIGHT_CURLY", { value: 125, enumerable: true });

Object.defineProperty(Scanner, "HASH", { value: 35, enumerable: true });

Object.defineProperty(Scanner, "AMPERSAND", { value: 38, enumerable: true });

Object.defineProperty(Scanner, "ASTERISK", { value: 42, enumerable: true });

Object.defineProperty(Scanner, "EXCLAMATION", { value: 33, enumerable: true });

Object.defineProperty(Scanner, "VERTICAL_BAR", { value: 124, enumerable: true });

Object.defineProperty(Scanner, "LEFT_ANGLE", { value: 60, enumerable: true });

Object.defineProperty(Scanner, "RIGHT_ANGLE", { value: 62, enumerable: true });

Object.defineProperty(Scanner, "SINGLE_QUOTE", { value: 39, enumerable: true });

Object.defineProperty(Scanner, "DOUBLE_QUOTE", { value: 34, enumerable: true });

Object.defineProperty(Scanner, "PERCENT", { value: 37, enumerable: true });

Object.defineProperty(Scanner, "AT", { value: 64, enumerable: true });

Object.defineProperty(Scanner, "GRAVE_ACCENT", { value: 96, enumerable: true });

Object.defineProperty(Scanner, "TILDE", { value: 126, enumerable: true });

Object.defineProperty(Scanner, "NULL", { value: 0, enumerable: true });

Object.defineProperty(Scanner, "BELL", { value: 7, enumerable: true });

Object.defineProperty(Scanner, "BACKSPACE", { value: 8, enumerable: true });

Object.defineProperty(Scanner, "VERTICAL_TAB", { value: 11, enumerable: true });

Object.defineProperty(Scanner, "FORM_FEED", { value: 12, enumerable: true });

Object.defineProperty(Scanner, "ESCAPE", { value: 27, enumerable: true });

Object.defineProperty(Scanner, "SLASH", { value: 47, enumerable: true });

Object.defineProperty(Scanner, "BACKSLASH", { value: 92, enumerable: true });

Object.defineProperty(Scanner, "UNDERSCORE", { value: 95, enumerable: true });

Object.defineProperty(Scanner, "NEL", { value: 133, enumerable: true });

Object.defineProperty(Scanner, "NBSP", { value: 160, enumerable: true });

Object.defineProperty(Scanner, "LINE_SEPARATOR", { value: 8232, enumerable: true });

Object.defineProperty(Scanner, "PARAGRAPH_SEPARATOR", { value: 8233, enumerable: true });

Object.defineProperty(Scanner, "BOM", { value: 65279, enumerable: true });

Object.defineProperty(Scanner, "NUMBER_0", { value: 48, enumerable: true });

Object.defineProperty(Scanner, "NUMBER_9", { value: 57, enumerable: true });

Object.defineProperty(Scanner, "LETTER_A", { value: 97, enumerable: true });

Object.defineProperty(Scanner, "LETTER_B", { value: 98, enumerable: true });

Object.defineProperty(Scanner, "LETTER_E", { value: 101, enumerable: true });

Object.defineProperty(Scanner, "LETTER_F", { value: 102, enumerable: true });

Object.defineProperty(Scanner, "LETTER_N", { value: 110, enumerable: true });

Object.defineProperty(Scanner, "LETTER_R", { value: 114, enumerable: true });

Object.defineProperty(Scanner, "LETTER_T", { value: 116, enumerable: true });

Object.defineProperty(Scanner, "LETTER_U", { value: 117, enumerable: true });

Object.defineProperty(Scanner, "LETTER_V", { value: 118, enumerable: true });

Object.defineProperty(Scanner, "LETTER_X", { value: 120, enumerable: true });

Object.defineProperty(Scanner, "LETTER_Z", { value: 122, enumerable: true });

Object.defineProperty(Scanner, "LETTER_CAP_A", { value: 65, enumerable: true });

Object.defineProperty(Scanner, "LETTER_CAP_F", { value: 70, enumerable: true });

Object.defineProperty(Scanner, "LETTER_CAP_L", { value: 76, enumerable: true });

Object.defineProperty(Scanner, "LETTER_CAP_N", { value: 78, enumerable: true });

Object.defineProperty(Scanner, "LETTER_CAP_P", { value: 80, enumerable: true });

Object.defineProperty(Scanner, "LETTER_CAP_U", { value: 85, enumerable: true });

Object.defineProperty(Scanner, "LETTER_CAP_X", { value: 88, enumerable: true });

Object.defineProperty(Scanner, "LETTER_CAP_Z", { value: 90, enumerable: true });

Object.defineProperty(_State, "STREAM_START", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"STREAM_START\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "STREAM_START" }))), enumerable: true });

Object.defineProperty(_State, "DOCUMENT_START", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"DOCUMENT_START\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "DOCUMENT_START" }))), enumerable: true });

Object.defineProperty(_State, "DOCUMENT_CONTENT", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"DOCUMENT_CONTENT\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "DOCUMENT_CONTENT" }))), enumerable: true });

Object.defineProperty(_State, "DOCUMENT_END", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"DOCUMENT_END\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "DOCUMENT_END" }))), enumerable: true });

Object.defineProperty(_State, "BLOCK_NODE", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_NODE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_NODE" }))), enumerable: true });

Object.defineProperty(_State, "BLOCK_NODE_OR_INDENTLESS_SEQUENCE", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_NODE_OR_INDENTLESS_SEQUENCE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_NODE_OR_INDENTLESS_SEQUENCE" }))), enumerable: true });

Object.defineProperty(_State, "FLOW_NODE", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_NODE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_NODE" }))), enumerable: true });

Object.defineProperty(_State, "BLOCK_SEQUENCE_FIRST_ENTRY", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_SEQUENCE_FIRST_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_SEQUENCE_FIRST_ENTRY" }))), enumerable: true });

Object.defineProperty(_State, "BLOCK_SEQUENCE_ENTRY", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_SEQUENCE_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_SEQUENCE_ENTRY" }))), enumerable: true });

Object.defineProperty(_State, "INDENTLESS_SEQUENCE_ENTRY", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"INDENTLESS_SEQUENCE_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "INDENTLESS_SEQUENCE_ENTRY" }))), enumerable: true });

Object.defineProperty(_State, "BLOCK_MAPPING_FIRST_KEY", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_MAPPING_FIRST_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_MAPPING_FIRST_KEY" }))), enumerable: true });

Object.defineProperty(_State, "BLOCK_MAPPING_KEY", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_MAPPING_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_MAPPING_KEY" }))), enumerable: true });

Object.defineProperty(_State, "BLOCK_MAPPING_VALUE", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"BLOCK_MAPPING_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "BLOCK_MAPPING_VALUE" }))), enumerable: true });

Object.defineProperty(_State, "FLOW_SEQUENCE_FIRST_ENTRY", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_FIRST_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_FIRST_ENTRY" }))), enumerable: true });

Object.defineProperty(_State, "FLOW_SEQUENCE_ENTRY", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY" }))), enumerable: true });

Object.defineProperty(_State, "FLOW_SEQUENCE_ENTRY_MAPPING_KEY", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY_MAPPING_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY_MAPPING_KEY" }))), enumerable: true });

Object.defineProperty(_State, "FLOW_SEQUENCE_ENTRY_MAPPING_VALUE", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY_MAPPING_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY_MAPPING_VALUE" }))), enumerable: true });

Object.defineProperty(_State, "FLOW_SEQUENCE_ENTRY_MAPPING_END", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_SEQUENCE_ENTRY_MAPPING_END\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_SEQUENCE_ENTRY_MAPPING_END" }))), enumerable: true });

Object.defineProperty(_State, "FLOW_MAPPING_FIRST_KEY", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_FIRST_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_FIRST_KEY" }))), enumerable: true });

Object.defineProperty(_State, "FLOW_MAPPING_KEY", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_KEY\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_KEY" }))), enumerable: true });

Object.defineProperty(_State, "FLOW_MAPPING_VALUE", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_VALUE" }))), enumerable: true });

Object.defineProperty(_State, "FLOW_MAPPING_EMPTY_VALUE", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"FLOW_MAPPING_EMPTY_VALUE\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "FLOW_MAPPING_EMPTY_VALUE" }))), enumerable: true });

Object.defineProperty(_State, "END", { value: __dartConst("[\"instance\",\"class:_State\",[\"field\",\"field:_State.name\",[\"string\",\"END\"]]]", () => Object.freeze(Object.assign(Object.create(_State.prototype), { name: "END" }))), enumerable: true });
function defaultCompare(value1, value2) {
  return __dartCompare(__dartAs(value1, value => value != null && (typeof value === "number" || typeof value === "string" || typeof value === "bigint" || typeof value.compareTo === "function"), "Comparable<Object?>"), value2);
}

function identity(value) {
  return value;
}

function compareComparable(a, b) {
  return __dartCompare(a, b);
}

const _mergeSortLimit = 32;

function binarySearch(sortedList, value, { compare = null } = {}) {
  ((compare === null) ? compare = defaultCompare : null);
  return binarySearchBy(sortedList, identity, compare, value);
}

function binarySearchBy(sortedList, keyOf, compare, value, start = 0, end = null) {
  end = __dartCheckValidRange(start, end, sortedList.length, null, null, null);
  let min_1 = start;
  let max_1 = end;
  let key = (keyOf)(value);
  while ((min_1 < max_1)) {
    {
      let mid = (min_1 + __dartShr((max_1 - min_1), 1));
      let element = __dartIndexGet(sortedList, mid);
      let comp = (compare)((keyOf)(element), key);
      if (__dartEquals(comp, 0)) {
        return mid;
      }
      if ((comp < 0)) {
        {
          min_1 = (mid + 1);
        }
      } else {
        {
          max_1 = mid;
        }
      }
    }
  }
  return (-1);
}

function lowerBound(sortedList, value, { compare = null } = {}) {
  ((compare === null) ? compare = defaultCompare : null);
  return lowerBoundBy(sortedList, identity, compare, value);
}

function lowerBoundBy(sortedList, keyOf, compare, value, start = 0, end = null) {
  end = __dartCheckValidRange(start, end, sortedList.length, null, null, null);
  let min_1 = start;
  let max_1 = end;
  let key = (keyOf)(value);
  while ((min_1 < max_1)) {
    {
      let mid = (min_1 + __dartShr((max_1 - min_1), 1));
      let element = __dartIndexGet(sortedList, mid);
      let comp = (compare)((keyOf)(element), key);
      if ((comp < 0)) {
        {
          min_1 = (mid + 1);
        }
      } else {
        {
          max_1 = mid;
        }
      }
    }
  }
  return min_1;
}

function shuffle(elements, start = 0, end = null, random = null) {
  ((random === null) ? random = __dartRandom(null, false) : null);
  ((end === null) ? end = elements.length : null);
  let length = (end - start);
  while ((length > 1)) {
    {
      let pos = random.nextInt(length);
      length = (length - 1);
      let tmp1 = __dartIndexGet(elements, (start + pos));
      __dartIndexSet(elements, (start + pos), __dartIndexGet(elements, (start + length)));
      __dartIndexSet(elements, (start + length), tmp1);
    }
  }
}

function reverse(elements, start = 0, end = null) {
  end = __dartCheckValidRange(start, end, elements.length, null, null, null);
  _reverse(elements, start, end);
}

function _reverse(elements, start, end) {
  for (let i = start, j = (end - 1); (i < j); i = (i + 1), j = (j - 1)) {
    {
      let tmp = __dartIndexGet(elements, i);
      __dartIndexSet(elements, i, __dartIndexGet(elements, j));
      __dartIndexSet(elements, j, tmp);
    }
  }
}

function insertionSort(elements, { compare = null, start = 0, end = null } = {}) {
  ((compare === null) ? compare = defaultCompare : null);
  ((end === null) ? end = elements.length : null);
  for (let pos = (start + 1); (pos < end); pos = (pos + 1)) {
    {
      let min_1 = start;
      let max_1 = pos;
      let element = __dartIndexGet(elements, pos);
      while ((min_1 < max_1)) {
        {
          let mid = (min_1 + __dartShr((max_1 - min_1), 1));
          let comparison = (compare)(element, __dartIndexGet(elements, mid));
          if ((comparison < 0)) {
            {
              max_1 = mid;
            }
          } else {
            {
              min_1 = (mid + 1);
            }
          }
        }
      }
      __dartListSetRange(elements, (min_1 + 1), (pos + 1), elements, min_1);
      __dartIndexSet(elements, min_1, element);
    }
  }
}

function insertionSortBy(elements, keyOf, compare, start = 0, end = null) {
  end = __dartCheckValidRange(start, end, elements.length, null, null, null);
  _movingInsertionSort(elements, keyOf, compare, start, end, elements, start);
}

function mergeSort(elements, { start = 0, end = null, compare = null } = {}) {
  end = __dartCheckValidRange(start, end, elements.length, null, null, null);
  ((compare === null) ? compare = defaultCompare : null);
  let length = (end - start);
  if ((length < 2)) {
    return;
  }
  if ((length < 32)) {
    {
      insertionSort(elements, { compare: compare, start: start, end: end });
      return;
    }
  }
  let firstLength = __dartShr((end - start), 1);
  let middle = (start + firstLength);
  let secondLength = (end - middle);
  let scratchSpace = elements.slice(0, secondLength);
  _mergeSort(elements, identity, compare, middle, end, scratchSpace, 0);
  let firstTarget = (end - firstLength);
  _mergeSort(elements, identity, compare, start, middle, elements, firstTarget);
  _merge(identity, compare, elements, firstTarget, end, scratchSpace, 0, secondLength, elements, start);
}

function mergeSortBy(elements, keyOf, compare, start = 0, end = null) {
  end = __dartCheckValidRange(start, end, elements.length, null, null, null);
  let length = (end - start);
  if ((length < 2)) {
    return;
  }
  if ((length < 32)) {
    {
      _movingInsertionSort(elements, keyOf, compare, start, end, elements, start);
      return;
    }
  }
  let middle = (start + __dartShr(length, 1));
  let firstLength = (middle - start);
  let secondLength = (end - middle);
  let scratchSpace = elements.slice(0, secondLength);
  _mergeSort(elements, keyOf, compare, middle, end, scratchSpace, 0);
  let firstTarget = (end - firstLength);
  _mergeSort(elements, keyOf, compare, start, middle, elements, firstTarget);
  _merge(keyOf, compare, elements, firstTarget, end, scratchSpace, 0, secondLength, elements, start);
}

function _movingInsertionSort(list, keyOf, compare, start, end, target, targetOffset) {
  let length = (end - start);
  if (__dartEquals(length, 0)) {
    return;
  }
  __dartIndexSet(target, targetOffset, __dartIndexGet(list, start));
  for (let i = 1; (i < length); i = (i + 1)) {
    {
      let element = __dartIndexGet(list, (start + i));
      let elementKey = (keyOf)(element);
      let min_1 = targetOffset;
      let max_1 = (targetOffset + i);
      while ((min_1 < max_1)) {
        {
          let mid = (min_1 + __dartShr((max_1 - min_1), 1));
          if (((compare)(elementKey, (keyOf)(__dartIndexGet(target, mid))) < 0)) {
            {
              max_1 = mid;
            }
          } else {
            {
              min_1 = (mid + 1);
            }
          }
        }
      }
      __dartListSetRange(target, (min_1 + 1), ((targetOffset + i) + 1), target, min_1);
      __dartIndexSet(target, min_1, element);
    }
  }
}

function _mergeSort(elements, keyOf, compare, start, end, target, targetOffset) {
  let length = (end - start);
  if ((length < 32)) {
    {
      _movingInsertionSort(elements, keyOf, compare, start, end, target, targetOffset);
      return;
    }
  }
  let middle = (start + __dartShr(length, 1));
  let firstLength = (middle - start);
  let secondLength = (end - middle);
  let targetMiddle = (targetOffset + firstLength);
  _mergeSort(elements, keyOf, compare, middle, end, target, targetMiddle);
  _mergeSort(elements, keyOf, compare, start, middle, elements, middle);
  _merge(keyOf, compare, elements, middle, (middle + firstLength), target, targetMiddle, (targetMiddle + secondLength), target, targetOffset);
}

function _merge(keyOf, compare, firstList, firstStart, firstEnd, secondList, secondStart, secondEnd, target, targetOffset) {
  let cursor1 = firstStart;
  let cursor2 = secondStart;
  let firstElement = __dartIndexGet(firstList, (() => { let v = cursor1; return (() => { let v_1 = cursor1 = (v + 1); return v; })(); })());
  let firstKey = (keyOf)(firstElement);
  let secondElement = __dartIndexGet(secondList, (() => { let v_2 = cursor2; return (() => { let v_3 = cursor2 = (v_2 + 1); return v_2; })(); })());
  let secondKey = (keyOf)(secondElement);
  L:
  while (true) {
    L_1:
    {
      if (((compare)(firstKey, secondKey) <= 0)) {
        {
          __dartIndexSet(target, (() => { let v_4 = targetOffset; return (() => { let v_5 = targetOffset = (v_4 + 1); return v_4; })(); })(), firstElement);
          if (__dartEquals(cursor1, firstEnd)) {
            break L;
          }
          firstElement = __dartIndexGet(firstList, (() => { let v_6 = cursor1; return (() => { let v_7 = cursor1 = (v_6 + 1); return v_6; })(); })());
          firstKey = (keyOf)(firstElement);
        }
      } else {
        {
          __dartIndexSet(target, (() => { let v_8 = targetOffset; return (() => { let v_9 = targetOffset = (v_8 + 1); return v_8; })(); })(), secondElement);
          if (!(__dartEquals(cursor2, secondEnd))) {
            {
              secondElement = __dartIndexGet(secondList, (() => { let v_10 = cursor2; return (() => { let v_11 = cursor2 = (v_10 + 1); return v_10; })(); })());
              secondKey = (keyOf)(secondElement);
              break L_1;
            }
          }
          __dartIndexSet(target, (() => { let v_12 = targetOffset; return (() => { let v_13 = targetOffset = (v_12 + 1); return v_12; })(); })(), firstElement);
          __dartListSetRange(target, targetOffset, (targetOffset + (firstEnd - cursor1)), firstList, cursor1);
          return;
        }
      }
    }
  }
  __dartIndexSet(target, (() => { let v_14 = targetOffset; return (() => { let v_15 = targetOffset = (v_14 + 1); return v_14; })(); })(), secondElement);
  __dartListSetRange(target, targetOffset, (targetOffset + (secondEnd - cursor2)), secondList, cursor2);
}

function quickSort(elements, compare, start = 0, end = null) {
  end = __dartCheckValidRange(start, end, elements.length, null, null, null);
  _quickSort(elements, identity, compare, __dartRandom(null, false), start, end);
}

function quickSortBy(list, keyOf, compare, start = 0, end = null) {
  end = __dartCheckValidRange(start, end, list.length, null, null, null);
  _quickSort(list, keyOf, compare, __dartRandom(null, false), start, end);
}

function _quickSort(list, keyOf, compare, random, start, end) {
  const minQuickSortLength = 24;
  let length = (end - start);
  while ((length >= 24)) {
    {
      let pivotIndex = (random.nextInt(length) + start);
      let pivot = __dartIndexGet(list, pivotIndex);
      let pivotKey = (keyOf)(pivot);
      let endSmaller = start;
      let startGreater = end;
      let startPivots = (end - 1);
      __dartIndexSet(list, pivotIndex, __dartIndexGet(list, startPivots));
      __dartIndexSet(list, startPivots, pivot);
      while ((endSmaller < startPivots)) {
        {
          let current_1 = __dartIndexGet(list, endSmaller);
          let relation = (compare)((keyOf)(current_1), pivotKey);
          if ((relation < 0)) {
            {
              endSmaller = (endSmaller + 1);
            }
          } else {
            {
              startPivots = (startPivots - 1);
              let currentTarget = startPivots;
              __dartIndexSet(list, endSmaller, __dartIndexGet(list, startPivots));
              if ((relation > 0)) {
                {
                  startGreater = (startGreater - 1);
                  currentTarget = startGreater;
                  __dartIndexSet(list, startPivots, __dartIndexGet(list, startGreater));
                }
              }
              __dartIndexSet(list, currentTarget, current_1);
            }
          }
        }
      }
      if (((endSmaller - start) < (end - startGreater))) {
        {
          _quickSort(list, keyOf, compare, random, start, endSmaller);
          start = startGreater;
        }
      } else {
        {
          _quickSort(list, keyOf, compare, random, startGreater, end);
          end = endSmaller;
        }
      }
      length = (end - start);
    }
  }
  _movingInsertionSort(list, keyOf, compare, start, end, list, start);
}

const _zero = 48;

const _upperCaseA = 65;

const _upperCaseZ = 90;

const _lowerCaseA = 97;

const _lowerCaseZ = 122;

const _asciiCaseBit = 32;

function equalsIgnoreAsciiCase(a, b) {
  if (!(__dartEquals(a.length, b.length))) {
    return false;
  }
  for (let i = 0; (i < a.length); i = (i + 1)) {
    L:
    {
      let aChar = a.charCodeAt(i);
      let bChar = b.charCodeAt(i);
      if (__dartEquals(aChar, bChar)) {
        break L;
      }
      if (!(__dartEquals((aChar ^ bChar), 32))) {
        return false;
      }
      let aCharLowerCase = (aChar | 32);
      if (((97 <= aCharLowerCase) && (aCharLowerCase <= 122))) {
        {
          break L;
        }
      }
      return false;
    }
  }
  return true;
}

function hashIgnoreAsciiCase(string) {
  let hash_1 = 0;
  for (let i = 0; (i < string.length); i = (i + 1)) {
    {
      let char = string.charCodeAt(i);
      if (((97 <= char) && (char <= 122))) {
        char = (char - 32);
      }
      hash_1 = (536870911 & (hash_1 + char));
      hash_1 = (536870911 & (hash_1 + ((524287 & hash_1) << 10)));
      hash_1 = __dartShr(hash_1, 6);
    }
  }
  hash_1 = (536870911 & (hash_1 + ((67108863 & hash_1) << 3)));
  hash_1 = __dartShr(hash_1, 11);
  return (536870911 & (hash_1 + ((16383 & hash_1) << 15)));
}

function compareAsciiUpperCase(a, b) {
  let defaultResult = 0;
  for (let i = 0; (i < a.length); i = (i + 1)) {
    L:
    {
      if ((i >= b.length)) {
        return 1;
      }
      let aChar = a.charCodeAt(i);
      let bChar = b.charCodeAt(i);
      if (__dartEquals(aChar, bChar)) {
        break L;
      }
      let aUpperCase = aChar;
      let bUpperCase = bChar;
      if (((97 <= aChar) && (aChar <= 122))) {
        {
          aUpperCase = (aUpperCase - 32);
        }
      }
      if (((97 <= bChar) && (bChar <= 122))) {
        {
          bUpperCase = (bUpperCase - 32);
        }
      }
      if (!(__dartEquals(aUpperCase, bUpperCase))) {
        return (Number.isNaN(Number((aUpperCase - bUpperCase))) ? Number.NaN : (Number((aUpperCase - bUpperCase)) < 0 ? -1 : (Number((aUpperCase - bUpperCase)) > 0 ? 1 : Number((aUpperCase - bUpperCase)))));
      }
      if (__dartEquals(defaultResult, 0)) {
        defaultResult = (aChar - bChar);
      }
    }
  }
  if ((b.length > a.length)) {
    return (-1);
  }
  return (Number.isNaN(Number(defaultResult)) ? Number.NaN : (Number(defaultResult) < 0 ? -1 : (Number(defaultResult) > 0 ? 1 : Number(defaultResult))));
}

function compareAsciiLowerCase(a, b) {
  let defaultResult = 0;
  for (let i = 0; (i < a.length); i = (i + 1)) {
    L:
    {
      if ((i >= b.length)) {
        return 1;
      }
      let aChar = a.charCodeAt(i);
      let bChar = b.charCodeAt(i);
      if (__dartEquals(aChar, bChar)) {
        break L;
      }
      let aLowerCase = aChar;
      let bLowerCase = bChar;
      if (((65 <= bChar) && (bChar <= 90))) {
        {
          bLowerCase = (bLowerCase + 32);
        }
      }
      if (((65 <= aChar) && (aChar <= 90))) {
        {
          aLowerCase = (aLowerCase + 32);
        }
      }
      if (!(__dartEquals(aLowerCase, bLowerCase))) {
        return (Number.isNaN(Number((aLowerCase - bLowerCase))) ? Number.NaN : (Number((aLowerCase - bLowerCase)) < 0 ? -1 : (Number((aLowerCase - bLowerCase)) > 0 ? 1 : Number((aLowerCase - bLowerCase)))));
      }
      if (__dartEquals(defaultResult, 0)) {
        defaultResult = (aChar - bChar);
      }
    }
  }
  if ((b.length > a.length)) {
    return (-1);
  }
  return (Number.isNaN(Number(defaultResult)) ? Number.NaN : (Number(defaultResult) < 0 ? -1 : (Number(defaultResult) > 0 ? 1 : Number(defaultResult))));
}

function compareNatural(a, b) {
  for (let i = 0; (i < a.length); i = (i + 1)) {
    {
      if ((i >= b.length)) {
        return 1;
      }
      let aChar = a.charCodeAt(i);
      let bChar = b.charCodeAt(i);
      if (!(__dartEquals(aChar, bChar))) {
        {
          return _compareNaturally(a, b, i, aChar, bChar);
        }
      }
    }
  }
  if ((b.length > a.length)) {
    return (-1);
  }
  return 0;
}

function compareAsciiLowerCaseNatural(a, b) {
  let defaultResult = 0;
  for (let i = 0; (i < a.length); i = (i + 1)) {
    L:
    {
      if ((i >= b.length)) {
        return 1;
      }
      let aChar = a.charCodeAt(i);
      let bChar = b.charCodeAt(i);
      if (__dartEquals(aChar, bChar)) {
        break L;
      }
      let aLowerCase = aChar;
      let bLowerCase = bChar;
      if (((65 <= aChar) && (aChar <= 90))) {
        {
          aLowerCase = (aLowerCase + 32);
        }
      }
      if (((65 <= bChar) && (bChar <= 90))) {
        {
          bLowerCase = (bLowerCase + 32);
        }
      }
      if (!(__dartEquals(aLowerCase, bLowerCase))) {
        {
          return _compareNaturally(a, b, i, aLowerCase, bLowerCase);
        }
      }
      if (__dartEquals(defaultResult, 0)) {
        defaultResult = (aChar - bChar);
      }
    }
  }
  if ((b.length > a.length)) {
    return (-1);
  }
  return (Number.isNaN(Number(defaultResult)) ? Number.NaN : (Number(defaultResult) < 0 ? -1 : (Number(defaultResult) > 0 ? 1 : Number(defaultResult))));
}

function compareAsciiUpperCaseNatural(a, b) {
  let defaultResult = 0;
  for (let i = 0; (i < a.length); i = (i + 1)) {
    L:
    {
      if ((i >= b.length)) {
        return 1;
      }
      let aChar = a.charCodeAt(i);
      let bChar = b.charCodeAt(i);
      if (__dartEquals(aChar, bChar)) {
        break L;
      }
      let aUpperCase = aChar;
      let bUpperCase = bChar;
      if (((97 <= aChar) && (aChar <= 122))) {
        {
          aUpperCase = (aUpperCase - 32);
        }
      }
      if (((97 <= bChar) && (bChar <= 122))) {
        {
          bUpperCase = (bUpperCase - 32);
        }
      }
      if (!(__dartEquals(aUpperCase, bUpperCase))) {
        {
          return _compareNaturally(a, b, i, aUpperCase, bUpperCase);
        }
      }
      if (__dartEquals(defaultResult, 0)) {
        defaultResult = (aChar - bChar);
      }
    }
  }
  if ((b.length > a.length)) {
    return (-1);
  }
  return (Number.isNaN(Number(defaultResult)) ? Number.NaN : (Number(defaultResult) < 0 ? -1 : (Number(defaultResult) > 0 ? 1 : Number(defaultResult))));
}

function _compareNaturally(a, b, index, aChar, bChar) {
  let aIsDigit = _isDigit(aChar);
  let bIsDigit = _isDigit(bChar);
  if (aIsDigit) {
    {
      if (bIsDigit) {
        {
          return _compareNumerically(a, b, aChar, bChar, index);
        }
      } else {
        if (((index > 0) && _isDigit(a.charCodeAt((index - 1))))) {
          {
            return 1;
          }
        }
      }
    }
  } else {
    if (((bIsDigit && (index > 0)) && _isDigit(b.charCodeAt((index - 1))))) {
      {
        return (-1);
      }
    }
  }
  return (Number.isNaN(Number((aChar - bChar))) ? Number.NaN : (Number((aChar - bChar)) < 0 ? -1 : (Number((aChar - bChar)) > 0 ? 1 : Number((aChar - bChar)))));
}

function _compareNumerically(a, b, aChar, bChar, index) {
  if (_isNonZeroNumberSuffix(a, index)) {
    {
      let result = _compareDigitCount(a, b, index, index);
      if (!(__dartEquals(result, 0))) {
        return result;
      }
      return (Number.isNaN(Number((aChar - bChar))) ? Number.NaN : (Number((aChar - bChar)) < 0 ? -1 : (Number((aChar - bChar)) > 0 ? 1 : Number((aChar - bChar)))));
    }
  }
  let aIndex = index;
  let bIndex = index;
  if (__dartEquals(aChar, 48)) {
    {
      do {
        {
          aIndex = (aIndex + 1);
          if (__dartEquals(aIndex, a.length)) {
            return (-1);
          }
          aChar = a.charCodeAt(aIndex);
        }
      } while (__dartEquals(aChar, 48));
      if (!(_isDigit(aChar))) {
        return (-1);
      }
    }
  } else {
    if (__dartEquals(bChar, 48)) {
      {
        do {
          {
            bIndex = (bIndex + 1);
            if (__dartEquals(bIndex, b.length)) {
              return 1;
            }
            bChar = b.charCodeAt(bIndex);
          }
        } while (__dartEquals(bChar, 48));
        if (!(_isDigit(bChar))) {
          return 1;
        }
      }
    }
  }
  if (!(__dartEquals(aChar, bChar))) {
    {
      let result_1 = _compareDigitCount(a, b, aIndex, bIndex);
      if (!(__dartEquals(result_1, 0))) {
        return result_1;
      }
      return (Number.isNaN(Number((aChar - bChar))) ? Number.NaN : (Number((aChar - bChar)) < 0 ? -1 : (Number((aChar - bChar)) > 0 ? 1 : Number((aChar - bChar)))));
    }
  }
  L:
  while (true) {
    L_1:
    {
      let aIsDigit = false;
      let bIsDigit = false;
      aChar = 0;
      bChar = 0;
      if (((aIndex = (aIndex + 1)) < a.length)) {
        {
          aChar = a.charCodeAt(aIndex);
          aIsDigit = _isDigit(aChar);
        }
      }
      if (((bIndex = (bIndex + 1)) < b.length)) {
        {
          bChar = b.charCodeAt(bIndex);
          bIsDigit = _isDigit(bChar);
        }
      }
      if (aIsDigit) {
        {
          if (bIsDigit) {
            {
              if (__dartEquals(aChar, bChar)) {
                break L_1;
              }
              break L;
            }
          }
          return 1;
        }
      } else {
        if (bIsDigit) {
          {
            return (-1);
          }
        } else {
          {
            return (Number.isNaN(Number((aIndex - bIndex))) ? Number.NaN : (Number((aIndex - bIndex)) < 0 ? -1 : (Number((aIndex - bIndex)) > 0 ? 1 : Number((aIndex - bIndex)))));
          }
        }
      }
    }
  }
  let result_2 = _compareDigitCount(a, b, aIndex, bIndex);
  if (!(__dartEquals(result_2, 0))) {
    return result_2;
  }
  return (Number.isNaN(Number((aChar - bChar))) ? Number.NaN : (Number((aChar - bChar)) < 0 ? -1 : (Number((aChar - bChar)) > 0 ? 1 : Number((aChar - bChar)))));
}

function _compareDigitCount(a, b, i, j) {
  while (((i = (i + 1)) < a.length)) {
    L:
    {
      let aIsDigit = _isDigit(a.charCodeAt(i));
      if (__dartEquals(j = (j + 1), b.length)) {
        return (aIsDigit ? 1 : 0);
      }
      let bIsDigit = _isDigit(b.charCodeAt(j));
      if (aIsDigit) {
        {
          if (bIsDigit) {
            break L;
          }
          return 1;
        }
      } else {
        if (bIsDigit) {
          {
            return (-1);
          }
        } else {
          {
            return 0;
          }
        }
      }
    }
  }
  if ((((j = (j + 1)) < b.length) && _isDigit(b.charCodeAt(j)))) {
    {
      return (-1);
    }
  }
  return 0;
}

function _isDigit(charCode) {
  return ((charCode ^ 48) <= 9);
}

function _isNonZeroNumberSuffix(string, index) {
  while (((index = (index - 1)) >= 0)) {
    {
      let char = string.charCodeAt(index);
      if (!(__dartEquals(char, 48))) {
        return _isDigit(char);
      }
    }
  }
  return false;
}

const _hashMask = 2147483647;

function mapMap(map, { key = null, value = null } = {}) {
  let keyFn = (key ?? function(mapKey, _) { return __dartAs(mapKey, value => true, "K2"); });
  let valueFn = (value ?? function(_, mapValue) { return __dartAs(mapValue, value => true, "V2"); });
  let result = new Map([]);
  (map.forEach((value, key) => (function(mapKey, mapValue) {
    __dartMapSet(result, (keyFn)(mapKey, mapValue), (valueFn)(mapKey, mapValue));
})(key, value)), null);
  return result;
}

function mergeMaps(map1, map2, { value = null } = {}) {
  let result = __dartMapFromEntries(map1);
  if ((value === null)) {
    return (() => { let v = result; return (() => {
      __dartMapAddAll(v, map2);
      return v;
    })(); })();
  }
  (map2.forEach((value, key) => (function(key, mapValue) {
    __dartMapSet(result, key, (__dartMapContainsKey(result, key) ? (value)((__dartMapGet(result, key) ?? __dartAs(v, value => true, "V")), mapValue) : mapValue));
})(key, value)), null);
  return result;
}

function lastBy(values, key) {
  return (() => {
    const v = new Map([]);
    {
      let _sync_for_iterator = __dartIterator(values);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          __dartMapSet(v, (key)(element), element);
        }
      }
    }
    return v;
  })();
}

function groupBy(values, key) {
  let map = new Map([]);
  {
    let _sync_for_iterator = __dartIterator(values);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          ((() => { let v = map; return (() => { let v_1 = (key)(element); return (__dartMapGet(v, v_1) ?? (() => { let v_2 = new Array(0).fill(null); return (() => { let v_3 = __dartMapSet(v, v_1, v_2); return v_2; })(); })()); })(); })().push(element), null);
        }
      }
    }
  }
  return map;
}

function minBy(values, orderBy, { compare = null } = {}) {
  ((compare === null) ? compare = defaultCompare : null);
  let minValue = null;
  let minOrderBy = null;
  {
    let _sync_for_iterator = __dartIterator(values);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          let elementOrderBy = (orderBy)(element);
          if (((minOrderBy === null) || ((compare)(elementOrderBy, minOrderBy) < 0))) {
            {
              minValue = element;
              minOrderBy = elementOrderBy;
            }
          }
        }
      }
    }
  }
  return minValue;
}

function maxBy(values, orderBy, { compare = null } = {}) {
  ((compare === null) ? compare = defaultCompare : null);
  let maxValue = null;
  let maxOrderBy = null;
  {
    let _sync_for_iterator = __dartIterator(values);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          let elementOrderBy = (orderBy)(element);
          if (((maxOrderBy === null) || ((compare)(elementOrderBy, maxOrderBy) > 0))) {
            {
              maxValue = element;
              maxOrderBy = elementOrderBy;
            }
          }
        }
      }
    }
  }
  return maxValue;
}

function transitiveClosure(graph) {
  let result = new Map([]);
  (graph.forEach((value, key) => (function(vertex, edges) {
    __dartMapSet(result, vertex, __dartSetFrom(edges));
})(key, value)), null);
  let keys = Array.from(Array.from(graph.keys()));
  {
    let _sync_for_iterator = __dartIterator(keys);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let vertex1 = _sync_for_iterator.current;
        {
          {
            let _sync_for_iterator_1 = __dartIterator(keys);
            for (; _sync_for_iterator_1.moveNext(); ) {
              {
                let vertex2 = _sync_for_iterator_1.current;
                {
                  {
                    let _sync_for_iterator_2 = __dartIterator(keys);
                    for (; _sync_for_iterator_2.moveNext(); ) {
                      {
                        let vertex3 = _sync_for_iterator_2.current;
                        {
                          if ((__dartIterableContains(__dartNullCheck(__dartMapGet(result, vertex2)), vertex1) && __dartIterableContains(__dartNullCheck(__dartMapGet(result, vertex1)), vertex3))) {
                            {
                              __dartSetAdd(__dartNullCheck(__dartMapGet(result, vertex2)), vertex3);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return result;
}

function stronglyConnectedComponents(graph) {
  let index = 0;
  let stack = new Array(0).fill(null);
  let result = new Array(0).fill(null);
  let indices = new Map();
  let lowLinks = new Map();
  let onStack = new Set();
  function strongConnect(vertex) {
    __dartMapSet(indices, vertex, index);
    __dartMapSet(lowLinks, vertex, index);
    index = (index + 1);
    (stack.push(vertex), null);
    __dartSetAdd(onStack, vertex);
    {
      let _sync_for_iterator = __dartIterator(__dartNullCheck(__dartMapGet(graph, vertex)));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let successor = _sync_for_iterator.current;
          {
            if (!(__dartMapContainsKey(indices, successor))) {
              {
                strongConnect(successor);
                __dartMapSet(lowLinks, vertex, Math.min(__dartNullCheck(__dartMapGet(lowLinks, vertex)), __dartNullCheck(__dartMapGet(lowLinks, successor))));
              }
            } else {
              if (__dartIterableContains(onStack, successor)) {
                {
                  __dartMapSet(lowLinks, vertex, Math.min(__dartNullCheck(__dartMapGet(lowLinks, vertex)), __dartNullCheck(__dartMapGet(lowLinks, successor))));
                }
              }
            }
          }
        }
      }
    }
    if (__dartEquals(__dartMapGet(lowLinks, vertex), __dartMapGet(indices, vertex))) {
      {
        let component = (() => {
          const v = new Set();
          return v;
        })();
        let neighbor = null;
        do {
          {
            neighbor = stack.pop();
            __dartSetRemove(onStack, neighbor);
            __dartSetAdd(component, (neighbor ?? __dartAs(v, value => true, "T")));
          }
        } while (!(__dartEquals(neighbor, vertex)));
        (result.push(component), null);
      }
    }
  }
  {
    let _sync_for_iterator = __dartIterator(Array.from(graph.keys()));
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let vertex = _sync_for_iterator.current;
        {
          if (!(__dartMapContainsKey(indices, vertex))) {
            strongConnect(vertex);
          }
        }
      }
    }
  }
  return Array.from(Array.from(result).reverse());
}

function IterableExtension_sample(_this, count, random = null) {
  __dartCheckNotNegative(count, "count", null);
  let iterator = __dartIterator(_this);
  let chosen = new Array(0).fill(null);
  ((random === null) ? random = __dartRandom(null, false) : null);
  while ((chosen.length < count)) {
    {
      if (iterator.moveNext()) {
        {
          let nextElement = iterator.current;
          let position = random.nextInt((chosen.length + 1));
          if (__dartEquals(position, chosen.length)) {
            {
              (chosen.push(nextElement), null);
            }
          } else {
            {
              (chosen.push(__dartIndexGet(chosen, position)), null);
              __dartIndexSet(chosen, position, nextElement);
            }
          }
        }
      } else {
        {
          return chosen;
        }
      }
    }
  }
  let index = count;
  while (iterator.moveNext()) {
    {
      index = (index + 1);
      let position_1 = random.nextInt(index);
      if ((position_1 < count)) {
        __dartIndexSet(chosen, position_1, iterator.current);
      }
    }
  }
  return chosen;
}

function IterableExtension_get_sample(_this) {
  return function(count, random = null) { return IterableExtension_sample(_this, count, random); };
}

function IterableExtension_whereNot(_this, test) {
  return Array.from(_this).filter(function(element) { return !((test)(element)); });
}

function IterableExtension_get_whereNot(_this) {
  return function(test) { return IterableExtension_whereNot(_this, test); };
}

function IterableExtension_sorted(_this, compare) {
  return (() => { let v = (() => {
    const v = Array.from(_this);
    return v;
  })(); return (() => {
    __dartListSort(v, compare);
    return v;
  })(); })();
}

function IterableExtension_get_sorted(_this) {
  return function(compare) { return IterableExtension_sorted(_this, compare); };
}

function IterableExtension_shuffled(_this, random = null) {
  return (() => { let v = (() => {
    const v = Array.from(_this);
    return v;
  })(); return (() => {
    __dartListShuffle(v, random);
    return v;
  })(); })();
}

function IterableExtension_get_shuffled(_this) {
  return function(random = null) { return IterableExtension_shuffled(_this, random); };
}

function IterableExtension_sortedBy(_this, keyOf) {
  let elements = (() => {
    const v = Array.from(_this);
    return v;
  })();
  mergeSortBy(elements, keyOf, compareComparable);
  return elements;
}

function IterableExtension_get_sortedBy(_this) {
  return function(keyOf) { return IterableExtension_sortedBy(_this, keyOf); };
}

function IterableExtension_get_sortedByCompare(_this) {
  return function(keyOf, compare) { return IterableExtension_sortedByCompare(_this, keyOf, compare); };
}

function IterableExtension_sortedByCompare(_this, keyOf, compare) {
  let elements = (() => {
    const v = Array.from(_this);
    return v;
  })();
  mergeSortBy(elements, keyOf, compare);
  return elements;
}

function IterableExtension_isSorted(_this, compare) {
  let iterator = __dartIterator(_this);
  if (!(iterator.moveNext())) {
    return true;
  }
  let previousElement = iterator.current;
  while (iterator.moveNext()) {
    {
      let element = iterator.current;
      if (((compare)(previousElement, element) > 0)) {
        return false;
      }
      previousElement = element;
    }
  }
  return true;
}

function IterableExtension_get_isSorted(_this) {
  return function(compare) { return IterableExtension_isSorted(_this, compare); };
}

function IterableExtension_isSortedBy(_this, keyOf) {
  let iterator = __dartIterator(_this);
  if (!(iterator.moveNext())) {
    return true;
  }
  let previousKey = (keyOf)(iterator.current);
  while (iterator.moveNext()) {
    {
      let key = (keyOf)(iterator.current);
      if ((__dartCompare(previousKey, key) > 0)) {
        return false;
      }
      previousKey = key;
    }
  }
  return true;
}

function IterableExtension_get_isSortedBy(_this) {
  return function(keyOf) { return IterableExtension_isSortedBy(_this, keyOf); };
}

function IterableExtension_isSortedByCompare(_this, keyOf, compare) {
  let iterator = __dartIterator(_this);
  if (!(iterator.moveNext())) {
    return true;
  }
  let previousKey = (keyOf)(iterator.current);
  while (iterator.moveNext()) {
    {
      let key = (keyOf)(iterator.current);
      if (((compare)(previousKey, key) > 0)) {
        return false;
      }
      previousKey = key;
    }
  }
  return true;
}

function IterableExtension_get_isSortedByCompare(_this) {
  return function(keyOf, compare) { return IterableExtension_isSortedByCompare(_this, keyOf, compare); };
}

function IterableExtension_forEachIndexed(_this, action) {
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          (action)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element);
        }
      }
    }
  }
}

function IterableExtension_get_forEachIndexed(_this) {
  return function(action) { return IterableExtension_forEachIndexed(_this, action); };
}

function IterableExtension_forEachWhile(_this, action) {
  L:
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if (!((action)(element))) {
            break L;
          }
        }
      }
    }
  }
}

function IterableExtension_get_forEachWhile(_this) {
  return function(action) { return IterableExtension_forEachWhile(_this, action); };
}

function IterableExtension_forEachIndexedWhile(_this, action) {
  let index = 0;
  L:
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if (!((action)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element))) {
            break L;
          }
        }
      }
    }
  }
}

function IterableExtension_get_forEachIndexedWhile(_this) {
  return function(action) { return IterableExtension_forEachIndexedWhile(_this, action); };
}

function* IterableExtension_mapIndexed(_this, convert) {
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          yield (convert)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element);
        }
      }
    }
  }
}

function IterableExtension_get_mapIndexed(_this) {
  return function(convert) { return IterableExtension_mapIndexed(_this, convert); };
}

function* IterableExtension_whereIndexed(_this, test) {
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element)) {
            yield element;
          }
        }
      }
    }
  }
}

function IterableExtension_get_whereIndexed(_this) {
  return function(test) { return IterableExtension_whereIndexed(_this, test); };
}

function* IterableExtension_whereNotIndexed(_this, test) {
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if (!((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element))) {
            yield element;
          }
        }
      }
    }
  }
}

function IterableExtension_get_whereNotIndexed(_this) {
  return function(test) { return IterableExtension_whereNotIndexed(_this, test); };
}

function* IterableExtension_expandIndexed(_this, expand) {
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          yield* (expand)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element);
        }
      }
    }
  }
}

function IterableExtension_get_expandIndexed(_this) {
  return function(expand) { return IterableExtension_expandIndexed(_this, expand); };
}

function IterableExtension_reduceIndexed(_this, combine) {
  let iterator = __dartIterator(_this);
  if (!(iterator.moveNext())) {
    {
      (() => { throw __dartCoreError("StateError", "no elements"); })();
    }
  }
  let index = 1;
  let result = iterator.current;
  while (iterator.moveNext()) {
    {
      result = (combine)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), result, iterator.current);
    }
  }
  return result;
}

function IterableExtension_get_reduceIndexed(_this) {
  return function(combine) { return IterableExtension_reduceIndexed(_this, combine); };
}

function IterableExtension_foldIndexed(_this, initialValue, combine) {
  let result = initialValue;
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          result = (combine)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), result, element);
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_foldIndexed(_this) {
  return function(initialValue, combine) { return IterableExtension_foldIndexed(_this, initialValue, combine); };
}

function IterableExtension_get_firstWhereOrNull(_this) {
  return function(test) { return IterableExtension_firstWhereOrNull(_this, test); };
}

function IterableExtension_firstWhereOrNull(_this, test) {
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)(element)) {
            return element;
          }
        }
      }
    }
  }
  return null;
}

function IterableExtension_firstWhereIndexedOrNull(_this, test) {
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element)) {
            return element;
          }
        }
      }
    }
  }
  return null;
}

function IterableExtension_get_firstWhereIndexedOrNull(_this) {
  return function(test) { return IterableExtension_firstWhereIndexedOrNull(_this, test); };
}

function IterableExtension_get_firstOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    return iterator.current;
  }
  return null;
}

function IterableExtension_lastWhereOrNull(_this, test) {
  let result = null;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)(element)) {
            result = element;
          }
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_lastWhereOrNull(_this) {
  return function(test) { return IterableExtension_lastWhereOrNull(_this, test); };
}

function IterableExtension_lastWhereIndexedOrNull(_this, test) {
  let result = null;
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element)) {
            result = element;
          }
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_lastWhereIndexedOrNull(_this) {
  return function(test) { return IterableExtension_lastWhereIndexedOrNull(_this, test); };
}

function IterableExtension_get_lastOrNull(_this) {
  if (__dartIterableIsEmpty(_this)) {
    return null;
  }
  return __dartIterableLast(_this);
}

function IterableExtension_singleWhereOrNull(_this, test) {
  let result = null;
  let found = false;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)(element)) {
            {
              if (!(found)) {
                {
                  result = element;
                  found = true;
                }
              } else {
                {
                  return null;
                }
              }
            }
          }
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_singleWhereOrNull(_this) {
  return function(test) { return IterableExtension_singleWhereOrNull(_this, test); };
}

function IterableExtension_get_singleWhereIndexedOrNull(_this) {
  return function(test) { return IterableExtension_singleWhereIndexedOrNull(_this, test); };
}

function IterableExtension_singleWhereIndexedOrNull(_this, test) {
  let result = null;
  let found = false;
  let index = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element)) {
            {
              if (!(found)) {
                {
                  result = element;
                  found = true;
                }
              } else {
                {
                  return null;
                }
              }
            }
          }
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_singleOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let result = iterator.current;
      if (!(iterator.moveNext())) {
        {
          return result;
        }
      }
    }
  }
  return null;
}

function IterableExtension_elementAtOrNull(_this, index) {
  return IterableExtension_get_firstOrNull(Array.from(_this).slice(index));
}

function IterableExtension_get_elementAtOrNull(_this) {
  return function(index) { return IterableExtension_elementAtOrNull(_this, index); };
}

function IterableExtension_lastBy(_this, key) {
  return lastBy(_this, key);
}

function IterableExtension_get_lastBy(_this) {
  return function(key) { return IterableExtension_lastBy(_this, key); };
}

function IterableExtension_groupFoldBy(_this, keyOf, combine) {
  let result = new Map([]);
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          let key = (keyOf)(element);
          __dartMapSet(result, key, (combine)(__dartMapGet(result, key), element));
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_groupFoldBy(_this) {
  return function(keyOf, combine) { return IterableExtension_groupFoldBy(_this, keyOf, combine); };
}

function IterableExtension_groupSetsBy(_this, keyOf) {
  let result = new Map([]);
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          __dartSetAdd((() => { let v = result; return (() => { let v_1 = (keyOf)(element); return (__dartMapGet(v, v_1) ?? (() => { let v_2 = (() => {
            const v = new Set();
            return v;
          })(); return (() => { let v_3 = __dartMapSet(v, v_1, v_2); return v_2; })(); })()); })(); })(), element);
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_groupSetsBy(_this) {
  return function(keyOf) { return IterableExtension_groupSetsBy(_this, keyOf); };
}

function IterableExtension_groupListsBy(_this, keyOf) {
  let result = new Map([]);
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          ((() => { let v = result; return (() => { let v_1 = (keyOf)(element); return (__dartMapGet(v, v_1) ?? (() => { let v_2 = new Array(0).fill(null); return (() => { let v_3 = __dartMapSet(v, v_1, v_2); return v_2; })(); })()); })(); })().push(element), null);
        }
      }
    }
  }
  return result;
}

function IterableExtension_get_groupListsBy(_this) {
  return function(keyOf) { return IterableExtension_groupListsBy(_this, keyOf); };
}

function IterableExtension_get_splitBefore(_this) {
  return function(test) { return IterableExtension_splitBefore(_this, test); };
}

function IterableExtension_splitBefore(_this, test) {
  return IterableExtension_splitBeforeIndexed(_this, function(_, element) { return (test)(element); });
}

function IterableExtension_splitAfter(_this, test) {
  return IterableExtension_splitAfterIndexed(_this, function(_, element) { return (test)(element); });
}

function IterableExtension_get_splitAfter(_this) {
  return function(test) { return IterableExtension_splitAfter(_this, test); };
}

function IterableExtension_splitBetween(_this, test) {
  return IterableExtension_splitBetweenIndexed(_this, function(_, first, second) { return (test)(first, second); });
}

function IterableExtension_get_splitBetween(_this) {
  return function(test) { return IterableExtension_splitBetween(_this, test); };
}

function* IterableExtension_splitBeforeIndexed(_this, test) {
  let iterator = __dartIterator(_this);
  if (!(iterator.moveNext())) {
    {
      return;
    }
  }
  let index = 1;
  let chunk = [iterator.current];
  while (iterator.moveNext()) {
    {
      let element = iterator.current;
      if ((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element)) {
        {
          yield chunk;
          chunk = new Array(0).fill(null);
        }
      }
      (chunk.push(element), null);
    }
  }
  yield chunk;
}

function IterableExtension_get_splitBeforeIndexed(_this) {
  return function(test) { return IterableExtension_splitBeforeIndexed(_this, test); };
}

function* IterableExtension_splitAfterIndexed(_this, test) {
  let index = 0;
  let chunk = null;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          ((chunk ?? (chunk = new Array(0).fill(null))).push(element), null);
          if ((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), element)) {
            {
              yield chunk;
              chunk = null;
            }
          }
        }
      }
    }
  }
  if (!((chunk === null))) {
    yield chunk;
  }
}

function IterableExtension_get_splitAfterIndexed(_this) {
  return function(test) { return IterableExtension_splitAfterIndexed(_this, test); };
}

function* IterableExtension_splitBetweenIndexed(_this, test) {
  let iterator = __dartIterator(_this);
  if (!(iterator.moveNext())) {
    return;
  }
  let previous = iterator.current;
  let chunk = [previous];
  let index = 1;
  while (iterator.moveNext()) {
    {
      let element = iterator.current;
      if ((test)((() => { let v = index; return (() => { let v_1 = index = (v + 1); return v; })(); })(), previous, element)) {
        {
          yield chunk;
          chunk = new Array(0).fill(null);
        }
      }
      (chunk.push(element), null);
      previous = element;
    }
  }
  yield chunk;
}

function IterableExtension_get_splitBetweenIndexed(_this) {
  return function(test) { return IterableExtension_splitBetweenIndexed(_this, test); };
}

function IterableExtension_get_none(_this) {
  return function(test) { return IterableExtension_none(_this, test); };
}

function IterableExtension_none(_this, test) {
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if ((test)(element)) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

function* IterableExtension_slices(_this, length) {
  if ((length < 1)) {
    (() => { throw __dartCoreError("RangeError", length); })();
  }
  let iterator = __dartIterator(_this);
  while (iterator.moveNext()) {
    {
      let slice = [iterator.current];
      for (let i = 1; ((i < length) && iterator.moveNext()); i = (i + 1)) {
        {
          (slice.push(iterator.current), null);
        }
      }
      yield slice;
    }
  }
}

function IterableExtension_get_slices(_this) {
  return function(length) { return IterableExtension_slices(_this, length); };
}

function* IterableNullableExtension_whereNotNull(_this) {
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let element = _sync_for_iterator.current;
        {
          if (!((element === null))) {
            yield element;
          }
        }
      }
    }
  }
}

function IterableNullableExtension_get_whereNotNull(_this) {
  return function() { return IterableNullableExtension_whereNotNull(_this); };
}

function IterableNumberExtension_get_minOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      if (Number.isNaN(Number(value))) {
        {
          return value;
        }
      }
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if (Number.isNaN(Number(newValue))) {
            {
              return newValue;
            }
          }
          if ((newValue < value)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableNumberExtension_get_min(_this) {
  return (IterableNumberExtension_get_minOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableNumberExtension_get_maxOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      if (Number.isNaN(Number(value))) {
        {
          return value;
        }
      }
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if (Number.isNaN(Number(newValue))) {
            {
              return newValue;
            }
          }
          if ((newValue > value)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableNumberExtension_get_max(_this) {
  return (IterableNumberExtension_get_maxOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableNumberExtension_get_sum(_this) {
  let result = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let value = _sync_for_iterator.current;
        {
          result = (result + value);
        }
      }
    }
  }
  return result;
}

function IterableNumberExtension_get_average(_this) {
  let result = 0.0;
  let count = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let value = _sync_for_iterator.current;
        {
          count = (count + 1);
          result = (result + ((value - result) / count));
        }
      }
    }
  }
  if (__dartEquals(count, 0)) {
    (() => { throw __dartCoreError("StateError", "No elements"); })();
  }
  return result;
}

function IterableIntegerExtension_get_minOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if ((newValue < value)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableIntegerExtension_get_min(_this) {
  return (IterableIntegerExtension_get_minOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableIntegerExtension_get_maxOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if ((newValue > value)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableIntegerExtension_get_max(_this) {
  return (IterableIntegerExtension_get_maxOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableIntegerExtension_get_sum(_this) {
  let result = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let value = _sync_for_iterator.current;
        {
          result = (result + value);
        }
      }
    }
  }
  return result;
}

function IterableIntegerExtension_get_average(_this) {
  let average = 0;
  let remainder = 0;
  let count = 0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let value = _sync_for_iterator.current;
        {
          count = (count + 1);
          let delta = ((value - average) + remainder);
          average = (average + __dartTruncDiv(delta, count));
          remainder = (delta % count);
        }
      }
    }
  }
  if (__dartEquals(count, 0)) {
    (() => { throw __dartCoreError("StateError", "No elements"); })();
  }
  return (average + (remainder / count));
}

function IterableDoubleExtension_get_minOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      if (Number.isNaN(Number(value))) {
        {
          return value;
        }
      }
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if (Number.isNaN(Number(newValue))) {
            {
              return newValue;
            }
          }
          if ((newValue < value)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableDoubleExtension_get_min(_this) {
  return (IterableDoubleExtension_get_minOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableDoubleExtension_get_maxOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      if (Number.isNaN(Number(value))) {
        {
          return value;
        }
      }
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if (Number.isNaN(Number(newValue))) {
            {
              return newValue;
            }
          }
          if ((newValue > value)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableDoubleExtension_get_max(_this) {
  return (IterableDoubleExtension_get_maxOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableDoubleExtension_get_sum(_this) {
  let result = 0.0;
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let value = _sync_for_iterator.current;
        {
          result = (result + value);
        }
      }
    }
  }
  return result;
}

function* IterableIterableExtension_get_flattened(_this) {
  {
    let _sync_for_iterator = __dartIterator(_this);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let elements = _sync_for_iterator.current;
        {
          yield* elements;
        }
      }
    }
  }
}

function IterableIterableExtension_get_flattenedToList(_this) {
  return (() => {
    const v = new Array(0).fill(null);
    {
      let _sync_for_iterator = __dartIterator(_this);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          const elements = _sync_for_iterator.current;
          (v.push(...Array.from(elements)), null);
        }
      }
    }
    return v;
  })();
}

function IterableIterableExtension_get_flattenedToSet(_this) {
  return (() => {
    const v = new Set();
    {
      let _sync_for_iterator = __dartIterator(_this);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          const elements = _sync_for_iterator.current;
          {
            let _sync_for_iterator_1 = __dartIterator(elements);
            for (; _sync_for_iterator_1.moveNext(); ) {
              {
                const v_1 = _sync_for_iterator_1.current;
                {
                  const v_2 = __dartAs(v_1, value => true, "T");
                  __dartSetAdd(v, v_2);
                }
              }
            }
          }
        }
      }
    }
    return v;
  })();
}

function IterableComparableExtension_get_minOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if ((__dartCompare(value, newValue) > 0)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableComparableExtension_get_min(_this) {
  return (IterableComparableExtension_get_minOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableComparableExtension_get_maxOrNull(_this) {
  let iterator = __dartIterator(_this);
  if (iterator.moveNext()) {
    {
      let value = iterator.current;
      while (iterator.moveNext()) {
        {
          let newValue = iterator.current;
          if ((__dartCompare(value, newValue) < 0)) {
            {
              value = newValue;
            }
          }
        }
      }
      return value;
    }
  }
  return null;
}

function IterableComparableExtension_get_max(_this) {
  return (IterableComparableExtension_get_maxOrNull(_this) ?? (() => { throw __dartCoreError("StateError", "No element"); })());
}

function IterableComparableExtension_sorted(_this, compare = null) {
  return (() => { let v = (() => {
    const v = Array.from(_this);
    return v;
  })(); return (() => {
    __dartListSort(v, compare);
    return v;
  })(); })();
}

function IterableComparableExtension_get_sorted(_this) {
  return function(compare = null) { return IterableComparableExtension_sorted(_this, compare); };
}

function IterableComparableExtension_isSorted(_this, compare = null) {
  if (!((compare === null))) {
    {
      return IterableExtension_isSorted(_this, compare);
    }
  }
  let iterator = __dartIterator(_this);
  if (!(iterator.moveNext())) {
    return true;
  }
  let previousElement = iterator.current;
  while (iterator.moveNext()) {
    {
      let element = iterator.current;
      if ((__dartCompare(previousElement, element) > 0)) {
        return false;
      }
      previousElement = element;
    }
  }
  return true;
}

function IterableComparableExtension_get_isSorted(_this) {
  return function(compare = null) { return IterableComparableExtension_isSorted(_this, compare); };
}

function ComparatorExtension_get_inverse(_this) {
  return function(a, b) { return (_this)(b, a); };
}

function ComparatorExtension_compareBy(_this, keyOf) {
  return function(a, b) { return (_this)((keyOf)(a), (keyOf)(b)); };
}

function ComparatorExtension_get_compareBy(_this) {
  return function(keyOf) { return ComparatorExtension_compareBy(_this, keyOf); };
}

function ComparatorExtension_then(_this, tieBreaker) {
  return function(a, b) {
    let result = (_this)(a, b);
    if (__dartEquals(result, 0)) {
      result = (tieBreaker)(a, b);
    }
    return result;
};
}

function ComparatorExtension_get_then(_this) {
  return function(tieBreaker) { return ComparatorExtension_then(_this, tieBreaker); };
}

function ListExtensions_binarySearch(_this, element, compare) {
  return binarySearchBy(_this, identity, compare, element);
}

function ListExtensions_get_binarySearch(_this) {
  return function(element, compare) { return ListExtensions_binarySearch(_this, element, compare); };
}

function ListExtensions_binarySearchByCompare(_this, element, keyOf, compare, start = 0, end = null) {
  return binarySearchBy(_this, keyOf, compare, element, start, end);
}

function ListExtensions_get_binarySearchByCompare(_this) {
  return function(element, keyOf, compare, start = 0, end = null) { return ListExtensions_binarySearchByCompare(_this, element, keyOf, compare, start, end); };
}

function ListExtensions_binarySearchBy(_this, element, keyOf, start = 0, end = null) {
  return binarySearchBy(_this, keyOf, function(a, b) { return __dartCompare(a, b); }, element, start, end);
}

function ListExtensions_get_binarySearchBy(_this) {
  return function(element, keyOf, start = 0, end = null) { return ListExtensions_binarySearchBy(_this, element, keyOf, start, end); };
}

function ListExtensions_lowerBound(_this, element, compare) {
  return lowerBoundBy(_this, identity, compare, element);
}

function ListExtensions_get_lowerBound(_this) {
  return function(element, compare) { return ListExtensions_lowerBound(_this, element, compare); };
}

function ListExtensions_lowerBoundByCompare(_this, element, keyOf, compare, start = 0, end = null) {
  return lowerBoundBy(_this, keyOf, compare, element, start, end);
}

function ListExtensions_get_lowerBoundByCompare(_this) {
  return function(element, keyOf, compare, start = 0, end = null) { return ListExtensions_lowerBoundByCompare(_this, element, keyOf, compare, start, end); };
}

function ListExtensions_lowerBoundBy(_this, element, keyOf, start = 0, end = null) {
  return lowerBoundBy(_this, keyOf, compareComparable, element, start, end);
}

function ListExtensions_get_lowerBoundBy(_this) {
  return function(element, keyOf, start = 0, end = null) { return ListExtensions_lowerBoundBy(_this, element, keyOf, start, end); };
}

function ListExtensions_forEachIndexed(_this, action) {
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      (action)(index, __dartIndexGet(_this, index));
    }
  }
}

function ListExtensions_get_forEachIndexed(_this) {
  return function(action) { return ListExtensions_forEachIndexed(_this, action); };
}

function ListExtensions_forEachWhile(_this, action) {
  L:
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      if (!((action)(__dartIndexGet(_this, index)))) {
        break L;
      }
    }
  }
}

function ListExtensions_get_forEachWhile(_this) {
  return function(action) { return ListExtensions_forEachWhile(_this, action); };
}

function ListExtensions_get_forEachIndexedWhile(_this) {
  return function(action) { return ListExtensions_forEachIndexedWhile(_this, action); };
}

function ListExtensions_forEachIndexedWhile(_this, action) {
  L:
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      if (!((action)(index, __dartIndexGet(_this, index)))) {
        break L;
      }
    }
  }
}

function* ListExtensions_mapIndexed(_this, convert) {
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      yield (convert)(index, __dartIndexGet(_this, index));
    }
  }
}

function ListExtensions_get_mapIndexed(_this) {
  return function(convert) { return ListExtensions_mapIndexed(_this, convert); };
}

function* ListExtensions_whereIndexed(_this, test) {
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      let element = __dartIndexGet(_this, index);
      if ((test)(index, element)) {
        yield element;
      }
    }
  }
}

function ListExtensions_get_whereIndexed(_this) {
  return function(test) { return ListExtensions_whereIndexed(_this, test); };
}

function* ListExtensions_whereNotIndexed(_this, test) {
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      let element = __dartIndexGet(_this, index);
      if (!((test)(index, element))) {
        yield element;
      }
    }
  }
}

function ListExtensions_get_whereNotIndexed(_this) {
  return function(test) { return ListExtensions_whereNotIndexed(_this, test); };
}

function* ListExtensions_expandIndexed(_this, expand) {
  for (let index = 0; (index < _this.length); index = (index + 1)) {
    {
      yield* (expand)(index, __dartIndexGet(_this, index));
    }
  }
}

function ListExtensions_get_expandIndexed(_this) {
  return function(expand) { return ListExtensions_expandIndexed(_this, expand); };
}

function ListExtensions_sortRange(_this, start, end, compare) {
  quickSortBy(_this, identity, compare, start, end);
}

function ListExtensions_get_sortRange(_this) {
  return function(start, end, compare) { return ListExtensions_sortRange(_this, start, end, compare); };
}

function ListExtensions_sortByCompare(_this, keyOf, compare, start = 0, end = null) {
  quickSortBy(_this, keyOf, compare, start, end);
}

function ListExtensions_get_sortByCompare(_this) {
  return function(keyOf, compare, start = 0, end = null) { return ListExtensions_sortByCompare(_this, keyOf, compare, start, end); };
}

function ListExtensions_sortBy(_this, keyOf, start = 0, end = null) {
  quickSortBy(_this, keyOf, compareComparable, start, end);
}

function ListExtensions_get_sortBy(_this) {
  return function(keyOf, start = 0, end = null) { return ListExtensions_sortBy(_this, keyOf, start, end); };
}

function ListExtensions_shuffleRange(_this, start, end, random = null) {
  __dartCheckValidRange(start, end, _this.length, null, null, null);
  shuffle(_this, start, end, random);
}

function ListExtensions_get_shuffleRange(_this) {
  return function(start, end, random = null) { return ListExtensions_shuffleRange(_this, start, end, random); };
}

function ListExtensions_reverseRange(_this, start, end) {
  __dartCheckValidRange(start, end, _this.length, null, null, null);
  while ((start < (end = (end - 1)))) {
    {
      let tmp = __dartIndexGet(_this, start);
      __dartIndexSet(_this, start, __dartIndexGet(_this, end));
      __dartIndexSet(_this, end, tmp);
      start = (start + 1);
    }
  }
}

function ListExtensions_get_reverseRange(_this) {
  return function(start, end) { return ListExtensions_reverseRange(_this, start, end); };
}

function ListExtensions_swap(_this, index1, index2) {
  __dartCheckValidIndex(index1, _this, "index1", null, null);
  __dartCheckValidIndex(index2, _this, "index2", null, null);
  let tmp = __dartIndexGet(_this, index1);
  __dartIndexSet(_this, index1, __dartIndexGet(_this, index2));
  __dartIndexSet(_this, index2, tmp);
}

function ListExtensions_get_swap(_this) {
  return function(index1, index2) { return ListExtensions_swap(_this, index1, index2); };
}

function ListExtensions_slice(_this, start, end = null) {
  end = __dartCheckValidRange(start, end, _this.length, null, null, null);
  let self = _this;
  if (self instanceof ListSlice) {
    return self.slice(start, end);
  }
  return new ListSlice(_this, start, end);
}

function ListExtensions_get_slice(_this) {
  return function(start, end = null) { return ListExtensions_slice(_this, start, end); };
}

function ListExtensions_equals(_this, other, equality = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) {
  if (!(__dartEquals(_this.length, other.length))) {
    return false;
  }
  for (let i = 0; (i < _this.length); i = (i + 1)) {
    {
      if (!(equality.equals(__dartIndexGet(_this, i), __dartIndexGet(other, i)))) {
        return false;
      }
    }
  }
  return true;
}

function ListExtensions_get_equals(_this) {
  return function(other, equality = __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype)))) { return ListExtensions_equals(_this, other, equality); };
}

function ListExtensions_elementAtOrNull(_this, index) {
  return ((index < _this.length) ? __dartIndexGet(_this, index) : null);
}

function ListExtensions_get_elementAtOrNull(_this) {
  return function(index) { return ListExtensions_elementAtOrNull(_this, index); };
}

function* ListExtensions_slices(_this, length) {
  if ((length < 1)) {
    (() => { throw __dartCoreError("RangeError", length); })();
  }
  for (let i = 0; (i < _this.length); i = (i + length)) {
    {
      yield ListExtensions_slice(_this, i, Math.min((i + length), _this.length));
    }
  }
}

function ListExtensions_get_slices(_this) {
  return function(length) { return ListExtensions_slices(_this, length); };
}

function ListComparableExtensions_binarySearch(_this, element, compare = null) {
  return binarySearchBy(_this, identity, (compare ?? compareComparable), element);
}

function ListComparableExtensions_get_binarySearch(_this) {
  return function(element, compare = null) { return ListComparableExtensions_binarySearch(_this, element, compare); };
}

function ListComparableExtensions_lowerBound(_this, element, compare = null) {
  return lowerBoundBy(_this, identity, (compare ?? compareComparable), element);
}

function ListComparableExtensions_get_lowerBound(_this) {
  return function(element, compare = null) { return ListComparableExtensions_lowerBound(_this, element, compare); };
}

function ListComparableExtensions_sortRange(_this, start, end, compare = null) {
  __dartCheckValidRange(start, end, _this.length, null, null, null);
  quickSortBy(_this, identity, (compare ?? compareComparable), start, end);
}

function ListComparableExtensions_get_sortRange(_this) {
  return function(start, end, compare = null) { return ListComparableExtensions_sortRange(_this, start, end, compare); };
}

const plus = 43;

const minus = 45;

const period = 46;

const slash = 47;

const zero = 48;

const nine = 57;

const colon = 58;

const upperA = 65;

const upperZ = 90;

const lowerA = 97;

const lowerZ = 122;

const backslash = 92;

function isAlphabetic(char) {
  return (((char >= 65) && (char <= 90)) || ((char >= 97) && (char <= 122)));
}

function isNumeric(char) {
  return ((char >= 48) && (char <= 57));
}

function isDriveLetter(path, index) {
  return !((driveLetterEnd(path, index) === null));
}

function driveLetterEnd(path, index) {
  if ((path.length < (index + 2))) {
    return null;
  }
  if (!(isAlphabetic(path.charCodeAt(index)))) {
    return null;
  }
  if (!(__dartEquals(path.charCodeAt((index + 1)), 58))) {
    {
      if ((path.length < (index + 4))) {
        return null;
      }
      if (!(__dartEquals(path.substring((index + 1), (index + 4)).toLowerCase(), "%3a"))) {
        {
          return null;
        }
      }
      index = (index + 2);
    }
  }
  if (__dartEquals(path.length, (index + 2))) {
    return (index + 2);
  }
  if (!(__dartEquals(path.charCodeAt((index + 2)), 47))) {
    return null;
  }
  return (index + 3);
}

const _asciiCaseBit_1 = 32;

function createInternal() {
  return Context._internal();
}

function _parseUri(uri) {
  if (typeof uri === "string") {
    return __dartUriParse(uri, false);
  }
  if (uri != null && typeof uri === "object" && uri.__dartType === "Uri") {
    return uri;
  }
  (() => { throw __dartCoreError("ArgumentError", uri); })();
}

function _validateArgList(method, args) {
  for (let i = 1; (i < args.length); i = (i + 1)) {
    L:
    {
      if (((__dartIndexGet(args, i) === null) || !((__dartIndexGet(args, (i - 1)) === null)))) {
        break L;
      }
      let numArgs = null;
      L_1:
      for (let v = numArgs = args.length; (numArgs >= 1); numArgs = (numArgs - 1)) {
        {
          if (!((__dartIndexGet(args, (numArgs - 1)) === null))) {
            break L_1;
          }
        }
      }
      const message = __dartStringBuffer("");
      message.write(__dartStr(method) + "(");
      message.write(__dartIterableJoin(Array.from(Array.from(args).slice(0, numArgs), function(arg) { return ((arg === null) ? "null" : "\"" + __dartStr(arg) + "\""); }), ", "));
      message.write("): part " + __dartStr((i - 1)) + " was null, but part " + __dartStr(i) + " was not.");
      (() => { throw __dartCoreError("ArgumentError", __dartStr(message)); })();
    }
  }
}

const posix = new Context({ style: Style.posix });

const windows = new Context({ style: Style.windows });

const url = new Context({ style: Style.url });

const context = createInternal();

let _currentUriBase = null;

let _current = null;

function style() {
  return context.style;
}

function current() {
  let uri = null;
  try {
    {
      uri = __dartUriParse((globalThis.location?.href ?? import.meta.url), false);
    }
  } catch ($error) {
    if (__dartIsCoreError($error, "Exception")) {
      {
        if (!((_current === null))) {
          return __dartNullCheck(_current);
        }
        (() => { throw $error; })();
      }
    } else {
      throw $error;
    }
  }
  if (__dartEquals(uri, _currentUriBase)) {
    return __dartNullCheck(_current);
  }
  _currentUriBase = uri;
  if (__dartEquals(Style.platform, Style.url)) {
    {
      _current = __dartStr(__dartUriResolve(uri, "."));
    }
  } else {
    {
      const path = uri.toFilePath();
      const lastIndex = (path.length - 1);
      _current = (__dartEquals(lastIndex, 0) ? path : path.substring(0, lastIndex));
    }
  }
  return __dartNullCheck(_current);
}

function separator() {
  return context.separator;
}

function absolute(part1, part2 = null, part3 = null, part4 = null, part5 = null, part6 = null, part7 = null, part8 = null, part9 = null, part10 = null, part11 = null, part12 = null, part13 = null, part14 = null, part15 = null) {
  return context.absolute(part1, part2, part3, part4, part5, part6, part7, part8, part9, part10, part11, part12, part13, part14, part15);
}

function basename(path) {
  return context.basename(path);
}

function basenameWithoutExtension(path) {
  return context.basenameWithoutExtension(path);
}

function dirname(path) {
  return context.dirname(path);
}

function extension(path, level = 1) {
  return context.extension(path, level);
}

function rootPrefix(path) {
  return context.rootPrefix(path);
}

function isAbsolute(path) {
  return context.isAbsolute(path);
}

function isRelative(path) {
  return context.isRelative(path);
}

function isRootRelative(path) {
  return context.isRootRelative(path);
}

function join(part1, part2 = null, part3 = null, part4 = null, part5 = null, part6 = null, part7 = null, part8 = null, part9 = null, part10 = null, part11 = null, part12 = null, part13 = null, part14 = null, part15 = null, part16 = null) {
  return context.join(part1, part2, part3, part4, part5, part6, part7, part8, part9, part10, part11, part12, part13, part14, part15, part16);
}

function joinAll(parts) {
  return context.joinAll(parts);
}

function split(path) {
  return context.split(path);
}

function canonicalize(path) {
  return context.canonicalize(path);
}

function normalize(path) {
  return context.normalize(path);
}

function relative(path, { from = null } = {}) {
  return context.relative(path, { from: from });
}

function isWithin(parent, child) {
  return context.isWithin(parent, child);
}

function equals(path1, path2) {
  return context.equals(path1, path2);
}

function hash(path) {
  return context.hash(path);
}

function withoutExtension(path) {
  return context.withoutExtension(path);
}

function setExtension(path, extension_1) {
  return context.setExtension(path, extension_1);
}

function fromUri(uri) {
  return context.fromUri(__dartNullCheck(uri));
}

function toUri(path) {
  return context.toUri(path);
}

function prettyUri(uri) {
  return context.prettyUri(__dartNullCheck(uri));
}

const $cr = 13;

const $lf = 10;

const $space = 32;

const $tab = 9;

const red = "\u001b[31m";

const yellow = "\u001b[33m";

const blue = "\u001b[34m";

const none = "\u001b[0m";

function min(obj1, obj2) {
  return ((__dartCompare(obj1, obj2) > 0) ? obj2 : obj1);
}

function max(obj1, obj2) {
  return ((__dartCompare(obj1, obj2) > 0) ? obj1 : obj2);
}

function isAllTheSame(iter) {
  if (__dartIterableIsEmpty(iter)) {
    return true;
  }
  const firstValue = __dartIterableFirst(iter);
  {
    let _sync_for_iterator = __dartIterator(Array.from(iter).slice(1));
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let value = _sync_for_iterator.current;
        {
          if (!(__dartEquals(value, firstValue))) {
            {
              return false;
            }
          }
        }
      }
    }
  }
  return true;
}

function isMultiline(span) {
  return !(__dartEquals(span.start.line, span.end.line));
}

function replaceFirstNull(list, element) {
  const index = __dartListIndexOf(list, null, 0);
  if ((index < 0)) {
    (() => { throw __dartCoreError("ArgumentError", __dartStr(list) + " contains no null elements."); })();
  }
  __dartIndexSet(list, index, element);
}

function replaceWithNull(list, element) {
  const index = __dartListIndexOf(list, element, 0);
  if ((index < 0)) {
    {
      (() => { throw __dartCoreError("ArgumentError", __dartStr(list) + " contains no elements matching " + __dartStr(element) + "."); })();
    }
  }
  __dartIndexSet(list, index, null);
}

function countCodeUnits(string, codeUnit) {
  let count = 0;
  {
    let _sync_for_iterator = __dartIterator(Array.from({ length: string.length }, (_, index) => string.charCodeAt(index)));
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let codeUnitToCheck = _sync_for_iterator.current;
        {
          if (__dartEquals(codeUnitToCheck, codeUnit)) {
            count = (count + 1);
          }
        }
      }
    }
  }
  return count;
}

function findLineStart(context_1, text, column) {
  if (text.length === 0) {
    {
      let beginningOfLine = 0;
      while (true) {
        {
          const index = context_1.indexOf("\n", beginningOfLine);
          if (__dartEquals(index, (-1))) {
            {
              return (((context_1.length - beginningOfLine) >= column) ? beginningOfLine : null);
            }
          }
          if (((index - beginningOfLine) >= column)) {
            return beginningOfLine;
          }
          beginningOfLine = (index + 1);
        }
      }
    }
  }
  let index_1 = __dartStringIndexOf(context_1, text, 0);
  while (!(__dartEquals(index_1, (-1)))) {
    {
      const lineStart = (__dartEquals(index_1, 0) ? 0 : (context_1.lastIndexOf("\n", (index_1 - 1)) + 1));
      const textColumn = (index_1 - lineStart);
      if (__dartEquals(column, textColumn)) {
        return lineStart;
      }
      index_1 = __dartStringIndexOf(context_1, text, (index_1 + 1));
    }
  }
  return null;
}

function subspanLocations(span, start, end = null) {
  const text = span.text;
  const startLocation = span.start;
  let line = startLocation.line;
  let column = startLocation.column;
  function consumeCodePoint(i) {
    const codeUnit = text.charCodeAt(i);
    if ((__dartEquals(codeUnit, 10) || (__dartEquals(codeUnit, 13) && (__dartEquals((i + 1), text.length) || !(__dartEquals(text.charCodeAt((i + 1)), 10)))))) {
      {
        line = (line + 1);
        column = 0;
      }
    } else {
      {
        column = (column + 1);
      }
    }
  }
  for (let i = 0; (i < start); i = (i + 1)) {
    {
      consumeCodePoint(i);
    }
  }
  const newStartLocation = new SourceLocation((startLocation.offset + start), { sourceUrl: span.sourceUrl, line: line, column: column });
  let newEndLocation = null;
  if (((end === null) || __dartEquals(end, span.length))) {
    {
      newEndLocation = span.end;
    }
  } else {
    if (__dartEquals(end, start)) {
      {
        newEndLocation = newStartLocation;
      }
    } else {
      {
        for (let i_1 = start; (i_1 < end); i_1 = (i_1 + 1)) {
          {
            consumeCodePoint(i_1);
          }
        }
        newEndLocation = new SourceLocation((startLocation.offset + end), { sourceUrl: span.sourceUrl, line: line, column: column });
      }
    }
  }
  return [newStartLocation, newEndLocation];
}

function SourceSpanWithContextExtension_subspan(_this, start, end = null) {
  __dartCheckValidRange(start, end, _this.length, null, null, null);
  if ((__dartEquals(start, 0) && ((end === null) || __dartEquals(end, _this.length)))) {
    return _this;
  }
  const locations = subspanLocations(_this, start, end);
  return new SourceSpanWithContext(__dartIndexGet(locations, 0), __dartIndexGet(locations, 1), _this.text.substring(start, end), _this.context);
}

function SourceSpanWithContextExtension_get_subspan(_this) {
  return function(start, end = null) { return SourceSpanWithContextExtension_subspan(_this, start, end); };
}

function bullet() {
  return glyphs().bullet;
}

function leftArrow() {
  return glyphs().leftArrow;
}

function rightArrow() {
  return glyphs().rightArrow;
}

function upArrow() {
  return glyphs().upArrow;
}

function downArrow() {
  return glyphs().downArrow;
}

function longLeftArrow() {
  return glyphs().longLeftArrow;
}

function longRightArrow() {
  return glyphs().longRightArrow;
}

function horizontalLine() {
  return glyphs().horizontalLine;
}

function verticalLine() {
  return glyphs().verticalLine;
}

function topLeftCorner() {
  return glyphs().topLeftCorner;
}

function topRightCorner() {
  return glyphs().topRightCorner;
}

function bottomLeftCorner() {
  return glyphs().bottomLeftCorner;
}

function bottomRightCorner() {
  return glyphs().bottomRightCorner;
}

function cross() {
  return glyphs().cross;
}

function teeUp() {
  return glyphs().teeUp;
}

function teeDown() {
  return glyphs().teeDown;
}

function teeLeft() {
  return glyphs().teeLeft;
}

function teeRight() {
  return glyphs().teeRight;
}

function upEnd() {
  return glyphs().upEnd;
}

function downEnd() {
  return glyphs().downEnd;
}

function leftEnd() {
  return glyphs().leftEnd;
}

function rightEnd() {
  return glyphs().rightEnd;
}

function horizontalLineBold() {
  return glyphs().horizontalLineBold;
}

function verticalLineBold() {
  return glyphs().verticalLineBold;
}

function topLeftCornerBold() {
  return glyphs().topLeftCornerBold;
}

function topRightCornerBold() {
  return glyphs().topRightCornerBold;
}

function bottomLeftCornerBold() {
  return glyphs().bottomLeftCornerBold;
}

function bottomRightCornerBold() {
  return glyphs().bottomRightCornerBold;
}

function crossBold() {
  return glyphs().crossBold;
}

function teeUpBold() {
  return glyphs().teeUpBold;
}

function teeDownBold() {
  return glyphs().teeDownBold;
}

function teeLeftBold() {
  return glyphs().teeLeftBold;
}

function teeRightBold() {
  return glyphs().teeRightBold;
}

function upEndBold() {
  return glyphs().upEndBold;
}

function downEndBold() {
  return glyphs().downEndBold;
}

function leftEndBold() {
  return glyphs().leftEndBold;
}

function rightEndBold() {
  return glyphs().rightEndBold;
}

function horizontalLineDouble() {
  return glyphs().horizontalLineDouble;
}

function verticalLineDouble() {
  return glyphs().verticalLineDouble;
}

function topLeftCornerDouble() {
  return glyphs().topLeftCornerDouble;
}

function topRightCornerDouble() {
  return glyphs().topRightCornerDouble;
}

function bottomLeftCornerDouble() {
  return glyphs().bottomLeftCornerDouble;
}

function bottomRightCornerDouble() {
  return glyphs().bottomRightCornerDouble;
}

function crossDouble() {
  return glyphs().crossDouble;
}

function teeUpDouble() {
  return glyphs().teeUpDouble;
}

function teeDownDouble() {
  return glyphs().teeDownDouble;
}

function teeLeftDouble() {
  return glyphs().teeLeftDouble;
}

function teeRightDouble() {
  return glyphs().teeRightDouble;
}

function horizontalLineDoubleDash() {
  return glyphs().horizontalLineDoubleDash;
}

function horizontalLineDoubleDashBold() {
  return glyphs().horizontalLineDoubleDashBold;
}

function verticalLineDoubleDash() {
  return glyphs().verticalLineDoubleDash;
}

function verticalLineDoubleDashBold() {
  return glyphs().verticalLineDoubleDashBold;
}

function horizontalLineTripleDash() {
  return glyphs().horizontalLineTripleDash;
}

function horizontalLineTripleDashBold() {
  return glyphs().horizontalLineTripleDashBold;
}

function verticalLineTripleDash() {
  return glyphs().verticalLineTripleDash;
}

function verticalLineTripleDashBold() {
  return glyphs().verticalLineTripleDashBold;
}

function horizontalLineQuadrupleDash() {
  return glyphs().horizontalLineQuadrupleDash;
}

function horizontalLineQuadrupleDashBold() {
  return glyphs().horizontalLineQuadrupleDashBold;
}

function verticalLineQuadrupleDash() {
  return glyphs().verticalLineQuadrupleDash;
}

function verticalLineQuadrupleDashBold() {
  return glyphs().verticalLineQuadrupleDashBold;
}

const asciiGlyphs = __dartConst("[\"instance\",\"class:AsciiGlyphSet\"]", () => Object.freeze(Object.create(AsciiGlyphSet.prototype)));

const unicodeGlyphs = __dartConst("[\"instance\",\"class:UnicodeGlyphSet\"]", () => Object.freeze(Object.create(UnicodeGlyphSet.prototype)));

let _glyphs = __dartConst("[\"instance\",\"class:UnicodeGlyphSet\"]", () => Object.freeze(Object.create(UnicodeGlyphSet.prototype)));

function glyphs() {
  return _glyphs;
}

function ascii() {
  return __dartEquals(glyphs(), __dartConst("[\"instance\",\"class:AsciiGlyphSet\"]", () => Object.freeze(Object.create(AsciiGlyphSet.prototype))));
}

function ascii_1(value) {
  _glyphs = (value ? __dartConst("[\"instance\",\"class:AsciiGlyphSet\"]", () => Object.freeze(Object.create(AsciiGlyphSet.prototype))) : __dartConst("[\"instance\",\"class:UnicodeGlyphSet\"]", () => Object.freeze(Object.create(UnicodeGlyphSet.prototype))));
}

function glyphOrAscii(glyph, alternative) {
  return glyphs().glyphOrAscii(glyph, alternative);
}

function SourceSpanExtension_messageMultiple(_this, message, label, secondarySpans, { color = false, primaryColor = null, secondaryColor = null } = {}) {
  const buffer = (() => { let v = __dartStringBuffer(""); return (() => {
    v.write("line " + __dartStr((_this.start.line + 1)) + ", column " + __dartStr((_this.start.column + 1)));
    return v;
  })(); })();
  if (!((_this.sourceUrl === null))) {
    buffer.write(" of " + __dartStr(prettyUri(_this.sourceUrl)));
  }
  (() => { let v_1 = buffer; return (() => {
    v_1.writeln(": " + __dartStr(message));
    v_1.write(SourceSpanExtension_highlightMultiple(_this, label, secondarySpans, { color: color, primaryColor: primaryColor, secondaryColor: secondaryColor }));
    return v_1;
  })(); })();
  return __dartStr(buffer);
}

function SourceSpanExtension_get_messageMultiple(_this) {
  return function(message, label, secondarySpans, { color = false, primaryColor = null, secondaryColor = null } = {}) { return SourceSpanExtension_messageMultiple(_this, message, label, secondarySpans, { color: color, primaryColor: primaryColor, secondaryColor: secondaryColor }); };
}

function SourceSpanExtension_highlightMultiple(_this, label, secondarySpans, { color = false, primaryColor = null, secondaryColor = null } = {}) {
  return Highlighter.multiple(_this, label, secondarySpans, { color: color, primaryColor: primaryColor, secondaryColor: secondaryColor }).highlight();
}

function SourceSpanExtension_get_highlightMultiple(_this) {
  return function(label, secondarySpans, { color = false, primaryColor = null, secondaryColor = null } = {}) { return SourceSpanExtension_highlightMultiple(_this, label, secondarySpans, { color: color, primaryColor: primaryColor, secondaryColor: secondaryColor }); };
}

function SourceSpanExtension_subspan(_this, start, end = null) {
  __dartCheckValidRange(start, end, _this.length, null, null, null);
  if ((__dartEquals(start, 0) && ((end === null) || __dartEquals(end, _this.length)))) {
    return _this;
  }
  const locations = subspanLocations(_this, start, end);
  return new SourceSpan(__dartIndexGet(locations, 0), __dartIndexGet(locations, 1), _this.text.substring(start, end));
}

function SourceSpanExtension_get_subspan(_this) {
  return function(start, end = null) { return SourceSpanExtension_subspan(_this, start, end); };
}

const _lf = 10;

const _cr = 13;

function FileSpanExtension_subspan(_this, start, end = null) {
  __dartCheckValidRange(start, end, _this.length, null, null, null);
  if ((__dartEquals(start, 0) && ((end === null) || __dartEquals(end, _this.length)))) {
    return _this;
  }
  const startOffset = _this.start.offset;
  return _this.file.span((startOffset + start), ((end === null) ? _this.end.offset : (startOffset + end)));
}

function FileSpanExtension_get_subspan(_this) {
  return function(start, end = null) { return FileSpanExtension_subspan(_this, start, end); };
}

const $backslash = 92;

const $cr_1 = 13;

const $doubleQuote = 34;

const $f = 102;

const $lf_1 = 10;

const $space_1 = 32;

const $x = 120;

const _supplementaryPlaneLowerBound = 65536;

const _supplementaryPlaneUpperBound = 1114111;

const _highSurrogateLowerBound = 55296;

const _lowSurrogateLowerBound = 56320;

const _surrogateBits = 10;

const _surrogateValueMask = 1023;

function validateErrorArgs(string, match, position, length) {
  if ((!((match === null)) && (!((position === null)) || !((length === null))))) {
    {
      (() => { throw __dartCoreError("ArgumentError", "Can't pass both match and position/length."); })();
    }
  }
  if (!((position === null))) {
    {
      if ((position < 0)) {
        {
          (() => { throw __dartCoreError("RangeError", "position must be greater than or equal to 0."); })();
        }
      } else {
        if ((position > string.length)) {
          {
            (() => { throw __dartCoreError("RangeError", "position must be less than or equal to the string length."); })();
          }
        }
      }
    }
  }
  if ((!((length === null)) && (length < 0))) {
    {
      (() => { throw __dartCoreError("RangeError", "length must be greater than or equal to 0."); })();
    }
  }
  if (((!((position === null)) && !((length === null))) && ((position + length) > string.length))) {
    {
      (() => { throw __dartCoreError("RangeError", "position plus length must not go beyond the end of the string."); })();
    }
  }
}

function inSupplementaryPlane(codePoint) {
  return ((codePoint >= 65536) && (codePoint <= 1114111));
}

function isHighSurrogate(codeUnit) {
  return __dartEquals((codeUnit & (~1023)), 55296);
}

function isLowSurrogate(codeUnit) {
  return __dartEquals(__dartShr(codeUnit, 10), __dartShr(56320, 10));
}

function highSurrogate(codePoint) {
  return (__dartShr((codePoint - 65536), 10) + 55296);
}

function lowSurrogate(codePoint) {
  return (((codePoint - 65536) & 1023) + 56320);
}

function decodeSurrogatePair(highSurrogate_1, lowSurrogate_1) {
  return (65536 + (((highSurrogate_1 & 1023) << 10) | (lowSurrogate_1 & 1023)));
}

const _newlineRegExp = __dartRegExp("\\n|\\r\\n|\\r(?!\\n)", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });

const _newlineRegExp_1 = __dartRegExp("\\r\\n?|\\n", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });

const $plus = 43;

const $minus = 45;

const $dot = 46;

const $0 = 48;

const $9 = 57;

const $F = 70;

const $N = 78;

const $T = 84;

const $f_1 = 102;

const $n = 110;

const $o = 111;

const $t = 116;

const $x_1 = 120;

const $tilde = 126;

let yamlWarningCallback = function(message, span = null) {
  if (!((span === null))) {
    message = span.message(message);
  }
  __dartPrint(message);
};

function warn(message, span = null) {
  return (yamlWarningCallback)(message, span);
}

function isHighSurrogate_1(codeUnit) {
  return __dartEquals((codeUnit >>> 10), 54);
}

function isLowSurrogate_1(codeUnit) {
  return __dartEquals((codeUnit >>> 10), 55);
}

function _nodeForValue(value, span) {
  if (value instanceof Map) {
    return YamlMapWrapper._(value, span);
  }
  if ((Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView)))) {
    return YamlListWrapper._(value, span);
  }
  return YamlScalar.internalWithSpan(value, span);
}

function setSpan(node, span) {
  node._span = span;
}

function deepEqualsMap() {
  return __dartCustomHashMap(deepEquals, deepHashCode, null);
}

function deepEquals(obj1, obj2) {
  return new _DeepEquals().equals(obj1, obj2);
}

function deepHashCode(obj) {
  let parents = new Array(0).fill(null);
  function deepHashCodeInner(value) {
    if (Array.from(parents).some(function(parent) { return Object.is(parent, value); })) {
      return (-1);
    }
    (parents.push(value), null);
    try {
      {
        if (value instanceof Map) {
          {
            let equality = __dartConst("[\"instance\",\"class:UnorderedIterableEquality\",[\"typeArgument\",\"InterfaceType(Object?)\"],[\"field\",\"field:_UnorderedEquality._elementEquality\",[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]]]", () => Object.freeze(Object.assign(Object.create(UnorderedIterableEquality.prototype), { _elementEquality: __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) })));
            return (equality.hash(Array.from(Array.from(value.keys()), deepHashCodeInner)) ^ equality.hash(Array.from(Array.from(value.values()), deepHashCodeInner)));
          }
        } else {
          if (value != null && typeof value !== "string" && !(value instanceof Map) && typeof value[Symbol.iterator] === "function") {
            {
              return __dartConst("[\"instance\",\"class:IterableEquality\",[\"typeArgument\",\"InterfaceType(Object?)\"],[\"field\",\"field:IterableEquality._elementEquality\",[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]]]", () => Object.freeze(Object.assign(Object.create(IterableEquality.prototype), { _elementEquality: __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) }))).hash(Array.from(value, deepHashCode));
            }
          } else {
            if (value instanceof YamlScalar) {
              {
                return __dartHashValue(__dartAs(value.value, value => (value === null || value != null), "Object?"));
              }
            } else {
              {
                return __dartHashValue(value);
              }
            }
          }
        }
      }
    } finally {
      {
        parents.pop();
      }
    }
  }
  return deepHashCodeInner(obj);
}

function loadYaml(yaml, { sourceUrl = null, recover = false, errorListener = null } = {}) {
  return loadYamlNode(yaml, { sourceUrl: sourceUrl, recover: recover, errorListener: errorListener }).value;
}

function loadYamlNode(yaml, { sourceUrl = null, recover = false, errorListener = null } = {}) {
  return loadYamlDocument(yaml, { sourceUrl: sourceUrl, recover: recover, errorListener: errorListener }).contents;
}

function loadYamlDocument(yaml, { sourceUrl = null, recover = false, errorListener = null } = {}) {
  let loader = new Loader(yaml, { sourceUrl: sourceUrl, recover: recover, errorListener: errorListener });
  let document = loader.load();
  if ((document === null)) {
    {
      return YamlDocument.internal(YamlScalar.internalWithSpan(null, loader.span), loader.span, null, __dartConst("[\"list\",\"InterfaceType(TagDirective)\"]", () => Object.freeze([])));
    }
  }
  let nextDocument = loader.load();
  if (!((nextDocument === null))) {
    {
      (() => { throw new YamlException("Only expected one document.", nextDocument.span); })();
    }
  }
  return document;
}

function loadYamlStream(yaml, { sourceUrl = null } = {}) {
  let loader = new Loader(yaml, { sourceUrl: sourceUrl });
  let documents = new Array(0).fill(null);
  let document = loader.load();
  while (!((document === null))) {
    {
      (documents.push(document), null);
      document = loader.load();
    }
  }
  return YamlList.internal(Array.from(Array.from(documents, function(document) { return document.contents; })), loader.span, __dartConst("[\"instance\",\"class:CollectionStyle\",[\"field\",\"field:CollectionStyle.name\",[\"string\",\"ANY\"]]]", () => Object.freeze(Object.assign(Object.create(CollectionStyle.prototype), { name: "ANY" }))));
}

function loadYamlDocuments(yaml, { sourceUrl = null } = {}) {
  let loader = new Loader(yaml, { sourceUrl: sourceUrl });
  let documents = new Array(0).fill(null);
  let document = loader.load();
  while (!((document === null))) {
    {
      (documents.push(document), null);
      document = loader.load();
    }
  }
  return documents;
}

export function main() {
  const source = "name: dart2esm\nversion: 0.1.0\nflags:\n  - web\n  - esm\nnested:\n  count: 2\n  ok: true\nflow: {a: 1, b: [x, y]}\n";
  const loaded = __dartAs(loadYaml("name: dart2esm\nversion: 0.1.0\nflags:\n  - web\n  - esm\nnested:\n  count: 2\n  ok: true\nflow: {a: 1, b: [x, y]}\n"), value => value instanceof YamlMap, "YamlMap");
  const document = loadYamlDocument("name: dart2esm\nversion: 0.1.0\nflags:\n  - web\n  - esm\nnested:\n  count: 2\n  ok: true\nflow: {a: 1, b: [x, y]}\n", { sourceUrl: __dartUriParse("memory:pubspec.yaml", false) });
  const root = __dartAs(document.contents, value => value instanceof YamlMap, "YamlMap");
  const flags = __dartAs(root["[]"]("flags"), value => value instanceof YamlList, "YamlList");
  const nested = __dartAs(__dartNullCheck(__dartMapGet(root.nodes, "nested")), value => value instanceof YamlMap, "YamlMap");
  const flow = __dartAs(__dartNullCheck(__dartMapGet(root.nodes, "flow")), value => value instanceof YamlMap, "YamlMap");
  const stream = loadYamlStream("---\na: 1\n---\n- b\n");
  const wrapped = YamlMap.wrap(new Map([["outer", [1, new Map([["inner", "value"]])]]]), { sourceUrl: "memory:wrapped.yaml" });
  const wrappedList = __dartAs(wrapped["[]"]("outer"), value => value instanceof YamlList, "YamlList");
  const wrappedMap = __dartAs(__dartIndexGet(wrappedList.nodes, 1), value => value instanceof YamlMap, "YamlMap");
  __dartPrint("yaml " + __dartStr(loaded["[]"]("name")) + " " + __dartStr(root["[]"]("version")) + " " + __dartStr(flags.join("|")) + " " + __dartStr(__dartIterableFirst(flags.nodes).value) + " " + __dartStr(nested["[]"]("count")) + " " + __dartStr(nested["[]"]("ok")) + " " + __dartStr(flow.style) + " " + __dartStr(__dartCall(flow["[]"]("b"), "join", [","], null)) + " " + __dartStr(document.span.sourceUrl) + " " + __dartStr(root.span.start.line) + ":" + __dartStr(root.span.end.line) + " " + __dartStr(stream.length) + " " + __dartStr(__dartCall(stream["[]"](0), "[]", ["a"], null)) + " " + __dartStr(__dartAs(stream["[]"](1), value => value instanceof YamlList, "YamlList")["[]"](0)) + " " + __dartStr(wrappedList.length) + " " + __dartStr(wrappedMap["[]"]("inner")) + " " + __dartStr(wrapped.style));
}

main();
