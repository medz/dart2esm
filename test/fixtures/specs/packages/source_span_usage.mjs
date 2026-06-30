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
function __dartCompare(left, right, compare = null) {
  if (typeof compare === "function") return Number(compare(left, right));
  const compareTo = left?.compareTo;
  if (typeof compareTo === "function") return Number(compareTo.call(left, right));
  return left < right ? -1 : (left > right ? 1 : 0);
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
function __dartSetFrom(values) {
  const set = new Set();
  for (const value of values) __dartSetAdd(set, value);
  return set;
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
function __dartMapGet(map, key) {
  if (!(map instanceof Map) && map != null && typeof map["[]"] === "function") return map["[]"](key);
  const actualKey = __dartMapKey(map, key);
  return actualKey === __dartMapMissingKey ? null : map.get(actualKey);
}
function __dartMapSet(map, key, value) {
  const actualKey = __dartMapKey(map, key);
  map.set(actualKey === __dartMapMissingKey ? key : actualKey, value);
  if (map.__dartSplayCompare !== undefined) __dartSplaySortMap(map);
  return value;
}
function __dartListSort(list, compare = null) {
  if (typeof compare === "function") {
    list.sort((left, right) => compare(left, right));
  } else {
    list.sort((left, right) => left < right ? -1 : (left > right ? 1 : 0));
  }
  return null;
}
function __dartListIndexOf(list, needle, start = 0) {
  const begin = Math.max(0, Math.trunc(start));
  for (let index = begin; index < list.length; index++) {
    if (__dartEquals(__dartIndexGet(list, index), needle)) return index;
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
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
  if ((typeof left === "number" || left.__dartType === "double") && (typeof right === "number" || right.__dartType === "double")) return Number(left) === Number(right);
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

const $BooleanSelector_interface = Symbol("BooleanSelector");
const $FileSpan_interface = Symbol("FileSpan");
const $GlyphSet_interface = Symbol("GlyphSet");
const $LineScanner_interface = Symbol("LineScanner");
const $LineScannerState_interface = Symbol("LineScannerState");
const $Node_interface = Symbol("Node");
const $SourceLocation_interface = Symbol("SourceLocation");
const $SourceSpan_interface = Symbol("SourceSpan");
const $SourceSpanWithContext_interface = Symbol("SourceSpanWithContext");
const $SpanScanner_interface = Symbol("SpanScanner");
const $Token_interface = Symbol("Token");
const $Visitor_interface = Symbol("Visitor");

class BooleanSelector {
  constructor() {
    if (new.target === BooleanSelector) {
      throw new TypeError("Class BooleanSelector has no unnamed constructor");
    }
  }
  get variables() {
    throw new TypeError("Abstract member BooleanSelector.variables");
  }
  set variables(value) {
    Object.defineProperty(this, "variables", { value, writable: true, configurable: true, enumerable: true });
  }
  static parse(selector) {
    return BooleanSelectorImpl.parse(selector);
  }
  evaluate(semantics) {
    throw new TypeError("Abstract member BooleanSelector.evaluate");
  }
  intersection(other) {
    throw new TypeError("Abstract member BooleanSelector.intersection");
  }
  union(other) {
    throw new TypeError("Abstract member BooleanSelector.union");
  }
  validate(isDefined) {
    throw new TypeError("Abstract member BooleanSelector.validate");
  }
}
Object.defineProperty(BooleanSelector, Symbol.hasInstance, { value(value) { return value != null && value[$BooleanSelector_interface] === true; } });

class All {
  constructor() {
    this.variables = __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([]));
    Object.defineProperty(this, $BooleanSelector_interface, { value: true });
  }
  evaluate(semantics) {
    return true;
  }
  intersection(other) {
    return other;
  }
  union(other) {
    return this;
  }
  validate(isDefined) {
  }
  toString() {
    return "<all>";
  }
}

class Visitor {
  constructor() {
    Object.defineProperty(this, $Visitor_interface, { value: true });
  }
  visitVariable(node) {
    throw new TypeError("Abstract member Visitor.visitVariable");
  }
  visitNot(node) {
    throw new TypeError("Abstract member Visitor.visitNot");
  }
  visitOr(node) {
    throw new TypeError("Abstract member Visitor.visitOr");
  }
  visitAnd(node) {
    throw new TypeError("Abstract member Visitor.visitAnd");
  }
  visitConditional(node) {
    throw new TypeError("Abstract member Visitor.visitConditional");
  }
}
Object.defineProperty(Visitor, Symbol.hasInstance, { value(value) { return value != null && value[$Visitor_interface] === true; } });

class RecursiveVisitor {
  constructor() {
    Object.defineProperty(this, $Visitor_interface, { value: true });
  }
  visitVariable(node) {
  }
  visitNot(node) {
    node.child.accept(this);
  }
  visitOr(node) {
    node.left.accept(this);
    node.right.accept(this);
  }
  visitAnd(node) {
    node.left.accept(this);
    node.right.accept(this);
  }
  visitConditional(node) {
    node.condition.accept(this);
    node.whenTrue.accept(this);
    node.whenFalse.accept(this);
  }
}

class Node {
  constructor() {
    Object.defineProperty(this, $Node_interface, { value: true });
  }
  get span() {
    throw new TypeError("Abstract member Node.span");
  }
  set span(value) {
    Object.defineProperty(this, "span", { value, writable: true, configurable: true, enumerable: true });
  }
  get variables() {
    throw new TypeError("Abstract member Node.variables");
  }
  set variables(value) {
    Object.defineProperty(this, "variables", { value, writable: true, configurable: true, enumerable: true });
  }
  accept(visitor) {
    throw new TypeError("Abstract member Node.accept");
  }
}
Object.defineProperty(Node, Symbol.hasInstance, { value(value) { return value != null && value[$Node_interface] === true; } });

class VariableNode {
  constructor(name, span = null) {
    this.name = name;
    this.span = span;
    Object.defineProperty(this, $Node_interface, { value: true });
  }
  get variables() {
    return [this.name];
  }
  accept(visitor) {
    return visitor.visitVariable(this);
  }
  toString() {
    return this.name;
  }
  "=="(other) {
    return (other instanceof VariableNode && __dartEquals(this.name, other.name));
  }
  get hashCode() {
    return this.name.hashCode;
  }
}

class NotNode {
  constructor(child, span = null) {
    this.child = child;
    this.span = span;
    Object.defineProperty(this, $Node_interface, { value: true });
  }
  get variables() {
    return this.child.variables;
  }
  accept(visitor) {
    return visitor.visitNot(this);
  }
  toString() {
    return ((this.child instanceof VariableNode || this.child instanceof NotNode) ? "!" + __dartStr(this.child) : "!(" + __dartStr(this.child) + ")");
  }
  "=="(other) {
    return (other instanceof NotNode && __dartEquals(this.child, other.child));
  }
  get hashCode() {
    return (~__dartHashValue(this.child));
  }
}

class OrNode {
  constructor(left, right) {
    this.left = left;
    this.right = right;
    Object.defineProperty(this, $Node_interface, { value: true });
  }
  get span() {
    return _expandSafe(this.left.span, this.right.span);
  }
  get variables() {
    return (function*() {
      yield* this.left.variables;
      yield* this.right.variables;
    }).call(this);
  }
  accept(visitor) {
    return visitor.visitOr(this);
  }
  toString() {
    let string1 = ((this.left instanceof AndNode || this.left instanceof ConditionalNode) ? "(" + __dartStr(this.left) + ")" : this.left);
    let string2 = ((this.right instanceof AndNode || this.right instanceof ConditionalNode) ? "(" + __dartStr(this.right) + ")" : this.right);
    return __dartStr(string1) + " || " + __dartStr(string2);
  }
  "=="(other) {
    return ((other instanceof OrNode && __dartEquals(this.left, other.left)) && __dartEquals(this.right, other.right));
  }
  get hashCode() {
    return (__dartHashValue(this.left) ^ __dartHashValue(this.right));
  }
}

class AndNode {
  constructor(left, right) {
    this.left = left;
    this.right = right;
    Object.defineProperty(this, $Node_interface, { value: true });
  }
  get span() {
    return _expandSafe(this.left.span, this.right.span);
  }
  get variables() {
    return (function*() {
      yield* this.left.variables;
      yield* this.right.variables;
    }).call(this);
  }
  accept(visitor) {
    return visitor.visitAnd(this);
  }
  toString() {
    let string1 = ((this.left instanceof OrNode || this.left instanceof ConditionalNode) ? "(" + __dartStr(this.left) + ")" : this.left);
    let string2 = ((this.right instanceof OrNode || this.right instanceof ConditionalNode) ? "(" + __dartStr(this.right) + ")" : this.right);
    return __dartStr(string1) + " && " + __dartStr(string2);
  }
  "=="(other) {
    return ((other instanceof AndNode && __dartEquals(this.left, other.left)) && __dartEquals(this.right, other.right));
  }
  get hashCode() {
    return (__dartHashValue(this.left) ^ __dartHashValue(this.right));
  }
}

class ConditionalNode {
  constructor(condition, whenTrue, whenFalse) {
    this.condition = condition;
    this.whenTrue = whenTrue;
    this.whenFalse = whenFalse;
    Object.defineProperty(this, $Node_interface, { value: true });
  }
  get span() {
    return _expandSafe(this.condition.span, this.whenFalse.span);
  }
  get variables() {
    return (function*() {
      yield* this.condition.variables;
      yield* this.whenTrue.variables;
      yield* this.whenFalse.variables;
    }).call(this);
  }
  accept(visitor) {
    return visitor.visitConditional(this);
  }
  toString() {
    let conditionString = (this.condition instanceof ConditionalNode ? "(" + __dartStr(this.condition) + ")" : this.condition);
    let trueString = (this.whenTrue instanceof ConditionalNode ? "(" + __dartStr(this.whenTrue) + ")" : this.whenTrue);
    return __dartStr(conditionString) + " ? " + __dartStr(trueString) + " : " + __dartStr(this.whenFalse);
  }
  "=="(other) {
    return (((other instanceof ConditionalNode && __dartEquals(this.condition, other.condition)) && __dartEquals(this.whenTrue, other.whenTrue)) && __dartEquals(this.whenFalse, other.whenFalse));
  }
  get hashCode() {
    return ((__dartHashValue(this.condition) ^ __dartHashValue(this.whenTrue)) ^ __dartHashValue(this.whenFalse));
  }
}

class Evaluator {
  constructor(_semantics_1) {
    this._semantics = _semantics_1;
    Object.defineProperty(this, $Visitor_interface, { value: true });
  }
  visitVariable(node) {
    return (() => { let v = node.name; return (this._semantics)(v); })();
  }
  visitNot(node) {
    return !(node.child.accept(this));
  }
  visitOr(node) {
    return (node.left.accept(this) || node.right.accept(this));
  }
  visitAnd(node) {
    return (node.left.accept(this) && node.right.accept(this));
  }
  visitConditional(node) {
    return (node.condition.accept(this) ? node.whenTrue.accept(this) : node.whenFalse.accept(this));
  }
}

class UnionSelector {
  constructor(_selector1, _selector2) {
    this._selector1 = _selector1;
    this._selector2 = _selector2;
    Object.defineProperty(this, $BooleanSelector_interface, { value: true });
  }
  get variables() {
    return (() => { let v = Array.from(this._selector1.variables); return (() => {
      (v.push(...Array.from(this._selector2.variables)), null);
      return v;
    })(); })();
  }
  evaluate(semantics) {
    return (this._selector1.evaluate(semantics) || this._selector2.evaluate(semantics));
  }
  intersection(other) {
    return new IntersectionSelector(this, other);
  }
  union(other) {
    return new UnionSelector(this, other);
  }
  validate(isDefined) {
    this._selector1.validate(isDefined);
    this._selector2.validate(isDefined);
  }
  toString() {
    return "(" + __dartStr(this._selector1) + ") && (" + __dartStr(this._selector2) + ")";
  }
  "=="(other) {
    return ((other instanceof UnionSelector && __dartEquals(this._selector1, other._selector1)) && __dartEquals(this._selector2, other._selector2));
  }
  get hashCode() {
    return (__dartHashValue(this._selector1) ^ __dartHashValue(this._selector2));
  }
}

class IntersectionSelector {
  constructor(_selector1, _selector2) {
    this._selector1 = _selector1;
    this._selector2 = _selector2;
    Object.defineProperty(this, $BooleanSelector_interface, { value: true });
  }
  get variables() {
    return (function*() {
      yield* this._selector1.variables;
      yield* this._selector2.variables;
    }).call(this);
  }
  evaluate(semantics) {
    return (this._selector1.evaluate(semantics) && this._selector2.evaluate(semantics));
  }
  intersection(other) {
    return new IntersectionSelector(this, other);
  }
  union(other) {
    return new UnionSelector(this, other);
  }
  validate(isDefined) {
    this._selector1.validate(isDefined);
    this._selector2.validate(isDefined);
  }
  toString() {
    return "(" + __dartStr(this._selector1) + ") && (" + __dartStr(this._selector2) + ")";
  }
  "=="(other) {
    return ((other instanceof IntersectionSelector && __dartEquals(this._selector1, other._selector1)) && __dartEquals(this._selector2, other._selector2));
  }
  get hashCode() {
    return (__dartHashValue(this._selector1) ^ __dartHashValue(this._selector2));
  }
}

class Token {
  constructor(type, span) {
    this.type = type;
    this.span = span;
    Object.defineProperty(this, $Token_interface, { value: true });
  }
}
Object.defineProperty(Token, Symbol.hasInstance, { value(value) { return value != null && value[$Token_interface] === true; } });

class IdentifierToken {
  constructor(name, span) {
    this.type = __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"identifier\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "identifier" })));
    this.name = name;
    this.span = span;
    Object.defineProperty(this, $Token_interface, { value: true });
  }
  toString() {
    return "identifier \"" + __dartStr(this.name) + "\"";
  }
}

class TokenType {
  constructor() {
    throw new TypeError("Class TokenType has no unnamed constructor");
  }
  static _(name) {
    return $TokenType__(TokenType, name);
  }
  toString() {
    return this.name;
  }
}

function $TokenType__($newTarget, name) {
  const $self = Object.create($newTarget.prototype);
  $self.name = name;
  return $self;
}

class Scanner {
  constructor(selector) {
    this._next = null;
    this._endOfFileEmitted = false;
    this._scanner = new SpanScanner(selector);
  }
  peek() {
    return (this._next ?? (this._next = this._readNext()));
  }
  next() {
    let token = (this._next ?? this._readNext());
    this._endOfFileEmitted = __dartEquals(token.type, __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"end of file\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "end of file" }))));
    this._next = null;
    return token;
  }
  scan(type) {
    if (!(__dartEquals(this.peek().type, type))) {
      return false;
    }
    this.next();
    return true;
  }
  _readNext() {
    if (this._endOfFileEmitted) {
      (() => { throw __dartCoreError("StateError", "No more tokens."); })();
    }
    this._consumeWhitespace();
    if (this._scanner.isDone) {
      {
        return new Token(__dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"end of file\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "end of file" }))), this._scanner.spanFrom(this._scanner.state));
      }
    }
    return (() => {
      let v = null;
      const _0_0 = this._scanner.peekChar();
      const _0_1 = 40;
      const _0_3 = 41;
      const _0_5 = 63;
      const _0_7 = 58;
      const _0_9 = 33;
      const _0_11 = 124;
      const _0_13 = 38;
      L:
      {
        {
          if (__dartEquals(40, _0_0)) {
            {
              v = this._scanOperator(__dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"left paren\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "left paren" }))));
              break L;
            }
          }
        }
        {
          if (__dartEquals(41, _0_0)) {
            {
              v = this._scanOperator(__dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"right paren\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "right paren" }))));
              break L;
            }
          }
        }
        {
          if (__dartEquals(63, _0_0)) {
            {
              v = this._scanOperator(__dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"question mark\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "question mark" }))));
              break L;
            }
          }
        }
        {
          if (__dartEquals(58, _0_0)) {
            {
              v = this._scanOperator(__dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"colon\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "colon" }))));
              break L;
            }
          }
        }
        {
          if (__dartEquals(33, _0_0)) {
            {
              v = this._scanOperator(__dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"not\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "not" }))));
              break L;
            }
          }
        }
        {
          if (__dartEquals(124, _0_0)) {
            {
              v = this._scanOr();
              break L;
            }
          }
        }
        {
          if (__dartEquals(38, _0_0)) {
            {
              v = this._scanAnd();
              break L;
            }
          }
        }
        {
          if (true) {
            {
              v = this._scanIdentifier();
              break L;
            }
          }
        }
        (() => { throw __dartCoreError("ReachabilityError", "None of the patterns in the switch expression the matched input value. See https://github.com/dart-lang/language/issues/3488 for details."); })();
      }
      return v;
    })();
  }
  _scanOperator(type) {
    let start = this._scanner.state;
    this._scanner.readChar();
    return new Token(type, this._scanner.spanFrom(start));
  }
  _scanOr() {
    let start = this._scanner.state;
    this._scanner.expect("||");
    return new Token(__dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"or\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "or" }))), this._scanner.spanFrom(start));
  }
  _scanAnd() {
    let start = this._scanner.state;
    this._scanner.expect("&&");
    return new Token(__dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"and\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "and" }))), this._scanner.spanFrom(start));
  }
  _scanIdentifier() {
    this._scanner.expect(_hyphenatedIdentifier, { name: "expression" });
    return new IdentifierToken(__dartNullCheck(__dartNullCheck(this._scanner.lastMatch)[0]), __dartNullCheck(this._scanner.lastSpan));
  }
  _consumeWhitespace() {
    while ((this._scanner.scan(_whitespaceAndSingleLineComments) || this._multiLineComment())) {
      {
      }
    }
  }
  _multiLineComment() {
    if (!(this._scanner.scan("/*"))) {
      return false;
    }
    while ((this._scanner.scan(_multiLineCommentBody) || this._multiLineComment())) {
      {
      }
    }
    this._scanner.expect("*/");
    return true;
  }
}

class Parser {
  constructor(selector) {
    this._scanner = new Scanner(selector);
  }
  parse() {
    let selector = this._conditional();
    if (!(__dartEquals(this._scanner.peek().type, __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"end of file\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "end of file" })))))) {
      {
        (() => { throw new SourceSpanFormatException("Expected end of input.", this._scanner.peek().span); })();
      }
    }
    return selector;
  }
  _conditional() {
    let condition = this._or();
    if (!(this._scanner.scan(__dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"question mark\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "question mark" })))))) {
      return condition;
    }
    let whenTrue = this._conditional();
    if (!(this._scanner.scan(__dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"colon\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "colon" })))))) {
      {
        (() => { throw new SourceSpanFormatException("Expected \":\".", this._scanner.peek().span); })();
      }
    }
    let whenFalse = this._conditional();
    return new ConditionalNode(condition, whenTrue, whenFalse);
  }
  _or() {
    let left = this._and();
    if (!(this._scanner.scan(__dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"or\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "or" })))))) {
      return left;
    }
    return new OrNode(left, this._or());
  }
  _and() {
    let left = this._simpleExpression();
    if (!(this._scanner.scan(__dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"and\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "and" })))))) {
      return left;
    }
    return new AndNode(left, this._and());
  }
  _simpleExpression() {
    let token = this._scanner.next();
    L:
    switch (token.type) {
      case __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"not\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "not" }))):
        {
          let child = this._simpleExpression();
          return new NotNode(child, token.span.expand(__dartNullCheck(child.span)));
        }
      case __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"left paren\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "left paren" }))):
        {
          let child_1 = this._conditional();
          if (!(this._scanner.scan(__dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"right paren\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "right paren" })))))) {
            {
              (() => { throw new SourceSpanFormatException("Expected \")\".", this._scanner.peek().span); })();
            }
          }
          return child_1;
        }
      case __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"identifier\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "identifier" }))):
        {
          return new VariableNode(__dartAs(token, value => value instanceof IdentifierToken, "IdentifierToken").name, token.span);
        }
      default:
        {
          (() => { throw new SourceSpanFormatException("Expected expression.", token.span); })();
        }
    }
  }
}

class Validator extends RecursiveVisitor {
  constructor(_isDefined) {
    super();
    this._isDefined = _isDefined;
  }
  visitVariable(node) {
    if ((() => { let v = node.name; return (this._isDefined)(v); })()) {
      return;
    }
    (() => { throw new SourceSpanFormatException("Undefined variable.", node.span); })();
  }
}

class BooleanSelectorImpl {
  constructor() {
    throw new TypeError("Class BooleanSelectorImpl has no unnamed constructor");
  }
  static parse(selector) {
    return $BooleanSelectorImpl_parse(BooleanSelectorImpl, selector);
  }
  static _(_selector) {
    return $BooleanSelectorImpl__(BooleanSelectorImpl, _selector);
  }
  get variables() {
    return this._selector.variables;
  }
  evaluate(semantics) {
    return this._selector.accept(new Evaluator(semantics));
  }
  intersection(other) {
    if (__dartEquals(other, __dartConst("[\"instance\",\"class:All\",[\"field\",\"field:All.variables\",[\"list\",\"InterfaceType(String)\"]]]", () => Object.freeze(Object.assign(Object.create(All.prototype), { variables: __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) }))))) {
      return this;
    }
    if (__dartEquals(other, __dartConst("[\"instance\",\"class:None\",[\"field\",\"field:None.variables\",[\"list\",\"InterfaceType(String)\"]]]", () => Object.freeze(Object.assign(Object.create(None.prototype), { variables: __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) }))))) {
      return other;
    }
    return (other instanceof BooleanSelectorImpl ? BooleanSelectorImpl._(new AndNode(this._selector, other._selector)) : new IntersectionSelector(this, other));
  }
  union(other) {
    if (__dartEquals(other, __dartConst("[\"instance\",\"class:All\",[\"field\",\"field:All.variables\",[\"list\",\"InterfaceType(String)\"]]]", () => Object.freeze(Object.assign(Object.create(All.prototype), { variables: __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) }))))) {
      return other;
    }
    if (__dartEquals(other, __dartConst("[\"instance\",\"class:None\",[\"field\",\"field:None.variables\",[\"list\",\"InterfaceType(String)\"]]]", () => Object.freeze(Object.assign(Object.create(None.prototype), { variables: __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) }))))) {
      return this;
    }
    return (other instanceof BooleanSelectorImpl ? BooleanSelectorImpl._(new OrNode(this._selector, other._selector)) : new UnionSelector(this, other));
  }
  validate(isDefined) {
    this._selector.accept(new Validator(isDefined));
  }
  toString() {
    return __dartObjectToString(this._selector);
  }
  "=="(other) {
    return (other instanceof BooleanSelectorImpl && __dartEquals(this._selector, other._selector));
  }
  get hashCode() {
    return __dartHashValue(this._selector);
  }
}

function $BooleanSelectorImpl_parse($newTarget, selector) {
  const $self = Object.create($newTarget.prototype);
  Object.defineProperty($self, $BooleanSelector_interface, { value: true });
  $self._selector = new Parser(selector).parse();
  return $self;
}

function $BooleanSelectorImpl__($newTarget, _selector) {
  const $self = Object.create($newTarget.prototype);
  Object.defineProperty($self, $BooleanSelector_interface, { value: true });
  $self._selector = _selector;
  return $self;
}

class None {
  constructor() {
    this.variables = __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([]));
    Object.defineProperty(this, $BooleanSelector_interface, { value: true });
  }
  evaluate(semantics) {
    return false;
  }
  intersection(other) {
    return this;
  }
  union(other) {
    return other;
  }
  validate(isDefined) {
  }
  toString() {
    return "<none>";
  }
}

class ParsedPath {
  constructor() {
    throw new TypeError("Class ParsedPath has no unnamed constructor");
  }
  static _(style, root, isRootRelative, parts, separators) {
    return $ParsedPath__(ParsedPath, style, root, isRootRelative, parts, separators);
  }
  extension(level = 1) {
    return __dartIndexGet(this._splitExtension(level), 1);
  }
  get isAbsolute() {
    return !((this.root === null));
  }
  static parse(path, style) {
    const root = style.getRoot(path);
    const isRootRelative = style.isRootRelative(path);
    if (!((root === null))) {
      path = path.substring(root.length);
    }
    const parts = new Array(0).fill(null);
    const separators = new Array(0).fill(null);
    let start = 0;
    if ((path.length !== 0 && style.isSeparator(path.charCodeAt(0)))) {
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
        if (style.isSeparator(path.charCodeAt(i))) {
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
    return ParsedPath._(style, root, isRootRelative, parts, separators);
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
  normalize({ canonicalize = false } = {}) {
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
                  (newParts.push((canonicalize ? this.style.canonicalizePart(part) : part)), null);
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
        if (canonicalize) {
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

function $ParsedPath__($newTarget, style, root, isRootRelative, parts, separators) {
  const $self = Object.create($newTarget.prototype);
  $self.style = style;
  $self.root = root;
  $self.isRootRelative = isRootRelative;
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
  static _(style, _current_1) {
    return $Context__(Context, style, _current_1);
  }
  constructor({ style = null, current: current_1 = null } = {}) {
    if ((current_1 === null)) {
      {
        if ((style === null)) {
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
    if ((style === null)) {
      {
        style = Style.platform;
      }
    } else {
      if (!(style instanceof InternalStyle)) {
        {
          (() => { throw __dartCoreError("ArgumentError", "Only styles defined by the path package are allowed."); })();
        }
      }
    }
    return Context._(__dartAs(style, value => value instanceof InternalStyle, "InternalStyle"), current_1);
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
    let relative = null;
    try {
      {
        relative = this.relative(child, { from: parent });
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
    if (!(this.isRelative(relative))) {
      return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"different\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "different" })));
    }
    if (__dartEquals(relative, ".")) {
      return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"equal\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "equal" })));
    }
    if (__dartEquals(relative, "..")) {
      return __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"different\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "different" })));
    }
    return ((((relative.length >= 3) && relative.startsWith("..")) && this.style.isSeparator(relative.charCodeAt(2))) ? __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"different\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "different" }))) : __dartConst("[\"instance\",\"class:_PathRelation\",[\"field\",\"field:_PathRelation.name\",[\"string\",\"within\"]]]", () => Object.freeze(Object.assign(Object.create(_PathRelation.prototype), { name: "within" }))));
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
    let hash = 4603;
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
        hash = (hash & 67108863);
        hash = (hash * 33);
        hash = (hash ^ codeUnit);
        wasSeparator = false;
        beginning = false;
      }
    }
    return hash;
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
  setExtension(path, extension) {
    return (this.withoutExtension(path) + extension);
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

function $Context__($newTarget, style, _current_1) {
  const $self = Object.create($newTarget.prototype);
  $self.style = style;
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
      const url = entry.key;
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
                          (lines.push(new _Line(line, lineNumber, url)), null);
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
  _writeFileStart(url) {
    if ((!(this._multipleFiles) || !(url != null && typeof url === "object" && url.__dartType === "Uri"))) {
      {
        this._writeSidebar({ end: downEnd() });
      }
    } else {
      {
        this._writeSidebar({ end: topLeftCorner() });
        this._colorize(() => { return this._buffer.write(__dartStr((horizontalLine() * 2)) + ">"); }, { color: "\u001b[34m" });
        this._buffer.write(" " + __dartStr(prettyUri(url)));
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
  constructor(text, number, url) {
    this.highlights = new Array(0).fill(null);
    this.text = text;
    this.number = number;
    this.url = url;
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
  constructor(text, { url = null } = {}) {
    return $SourceFile_decoded(new.target, Array.from(text, (char) => char.codePointAt(0)), { url: url });
  }
  static fromString(text, { url = null } = {}) {
    return $SourceFile_fromString(SourceFile, text, { url: url });
  }
  static decoded(decodedChars, { url = null } = {}) {
    return $SourceFile_decoded(SourceFile, decodedChars, { url: url });
  }
  static _fromList(decodedChars, { url = null } = {}) {
    return $SourceFile__fromList(SourceFile, decodedChars, { url: url });
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

function $SourceFile_fromString($newTarget, text, { url = null } = {}) {
  return $SourceFile__fromList($newTarget, Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)), { url: url });
}

function $SourceFile_decoded($newTarget, decodedChars, { url = null } = {}) {
  return $SourceFile__fromList($newTarget, Array.from(decodedChars), { url: url });
}

function $SourceFile__fromList($newTarget, decodedChars, { url = null } = {}) {
  const $self = Object.create($newTarget.prototype);
  $self._lineStarts = [0];
  $self._cachedLine = null;
  $self.url = (typeof url === "string" ? __dartUriParse(url, false) : __dartAs(url, value => (value === null || value != null && typeof value === "object" && value.__dartType === "Uri"), "Uri?"));
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
    Object.defineProperty(this, "source", {
      value: source,
      writable: true,
      configurable: true,
      enumerable: true,
    });
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


Object.defineProperty(BooleanSelector, "all", { value: __dartConst("[\"instance\",\"class:All\",[\"field\",\"field:All.variables\",[\"list\",\"InterfaceType(String)\"]]]", () => Object.freeze(Object.assign(Object.create(All.prototype), { variables: __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) }))), enumerable: true });

Object.defineProperty(BooleanSelector, "none", { value: __dartConst("[\"instance\",\"class:None\",[\"field\",\"field:None.variables\",[\"list\",\"InterfaceType(String)\"]]]", () => Object.freeze(Object.assign(Object.create(None.prototype), { variables: __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) }))), enumerable: true });

Object.defineProperty(TokenType, "leftParen", { value: __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"left paren\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "left paren" }))), enumerable: true });

Object.defineProperty(TokenType, "rightParen", { value: __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"right paren\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "right paren" }))), enumerable: true });

Object.defineProperty(TokenType, "or", { value: __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"or\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "or" }))), enumerable: true });

Object.defineProperty(TokenType, "and", { value: __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"and\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "and" }))), enumerable: true });

Object.defineProperty(TokenType, "not", { value: __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"not\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "not" }))), enumerable: true });

Object.defineProperty(TokenType, "questionMark", { value: __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"question mark\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "question mark" }))), enumerable: true });

Object.defineProperty(TokenType, "colon", { value: __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"colon\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "colon" }))), enumerable: true });

Object.defineProperty(TokenType, "identifier", { value: __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"identifier\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "identifier" }))), enumerable: true });

Object.defineProperty(TokenType, "endOfFile", { value: __dartConst("[\"instance\",\"class:TokenType\",[\"field\",\"field:TokenType.name\",[\"string\",\"end of file\"]]]", () => Object.freeze(Object.assign(Object.create(TokenType.prototype), { name: "end of file" }))), enumerable: true });

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
function _expandSafe(start, end) {
  if (((start === null) || (end === null))) {
    return null;
  }
  if (!(__dartEquals(start.file, end.file))) {
    return null;
  }
  return start.expand(end);
}

const _whitespaceAndSingleLineComments = __dartRegExp("([ \\t\\n]+|//[^\\n]*(\\n|$))+", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });

const _multiLineCommentBody = __dartRegExp("([^/*]|/[^*]|\\*[^/])+", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });

const _hyphenatedIdentifier = __dartRegExp("[a-zA-Z_-][a-zA-Z0-9_-]*", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });

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

function isAlphabetic(char) {
  return (((char >= 65) && (char <= 90)) || ((char >= 97) && (char <= 122)));
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

const context = createInternal();

let _currentUriBase = null;

let _current = null;

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

function prettyUri(uri) {
  return context.prettyUri(__dartNullCheck(uri));
}

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

function horizontalLine() {
  return glyphs().horizontalLine;
}

function verticalLine() {
  return glyphs().verticalLine;
}

function topLeftCorner() {
  return glyphs().topLeftCorner;
}

function bottomLeftCorner() {
  return glyphs().bottomLeftCorner;
}

function cross() {
  return glyphs().cross;
}

function upEnd() {
  return glyphs().upEnd;
}

function downEnd() {
  return glyphs().downEnd;
}

function horizontalLineBold() {
  return glyphs().horizontalLineBold;
}

let _glyphs = __dartConst("[\"instance\",\"class:UnicodeGlyphSet\"]", () => Object.freeze(Object.create(UnicodeGlyphSet.prototype)));

function glyphs() {
  return _glyphs;
}

function glyphOrAscii(glyph, alternative) {
  return glyphs().glyphOrAscii(glyph, alternative);
}

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

export function main() {
  const source = SourceFile.fromString("alpha beta\nsecond line\nthird", { url: "memory:fixture.txt" });
  const betaStart = source.getOffset(0, 6);
  const beta = source.span(betaStart, (betaStart + 4));
  const second = source.span(source.getOffset(1), source.getOffset(1, 6));
  const expanded = beta.expand(second);
  __dartPrint("span " + __dartStr(source.lines) + " " + __dartStr(source.location(betaStart).line) + ":" + __dartStr(source.location(betaStart).column) + " " + __dartStr(beta.text) + " " + __dartStr(second.text) + " " + __dartStr(expanded.text.replaceAll("\n", "|")));
  const scanner = new SpanScanner("one, two\nthree", { sourceUrl: "scan.txt" });
  const start = scanner.state;
  scanner.expect(__dartRegExp("\\w+", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false }), { name: "word" });
  const first = __dartNullCheck(scanner.lastSpan);
  scanner.expect(",");
  scanner.expect(__dartRegExp("\\s+", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false }));
  const afterComma = scanner.state;
  scanner.expect(__dartRegExp("\\w+", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false }), { name: "word" });
  const secondWord = __dartNullCheck(scanner.lastSpan);
  scanner.state = afterComma;
  scanner.expect(__dartRegExp("\\w+", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false }));
  scanner.expect(__dartRegExp("\\n", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false }));
  scanner.expect(__dartRegExp("\\w+", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false }));
  const tail = __dartNullCheck(scanner.lastSpan);
  __dartPrint("scan " + __dartStr(first.text) + "-" + __dartStr(secondWord.text) + "-" + __dartStr(tail.text) + " " + __dartStr(scanner.line) + ":" + __dartStr(scanner.column) + " " + __dartStr(scanner.spanFrom(start).text.replaceAll("\n", "/")));
  const selector = BooleanSelectorImpl.parse("fast && (web || !slow)");
  const variables = (() => { let v = Array.from(__dartSetFrom(selector.variables)); return (() => {
    __dartListSort(v, null);
    return v;
  })(); })();
  const result = selector.evaluate(_semantics);
  const union = selector.union(BooleanSelectorImpl.parse("cli"));
  const intersection = selector.intersection(BooleanSelectorImpl.parse("fast"));
  __dartPrint("selector " + __dartStr(__dartIterableJoin(variables, ",")) + " " + __dartStr(result) + " " + __dartStr(union.evaluate(_semantics)) + " " + __dartStr(intersection.evaluate(_semantics)) + " " + __dartStr(selector));
  try {
    {
      BooleanSelectorImpl.parse("known && missing").validate(function(name) { return __dartEquals(name, "known"); });
    }
  } catch ($error) {
    if ($error instanceof SourceSpanFormatException) {
      const error = $error;
      {
        __dartPrint("validate-error " + __dartStr(error.offset) + " " + __dartStr(error.message));
      }
    } else {
      throw $error;
    }
  }
  try {
    {
      BooleanSelectorImpl.parse("known &&");
    }
  } catch ($error_1) {
    if ($error_1 instanceof SourceSpanFormatException) {
      const error_1 = $error_1;
      {
        __dartPrint("parse-error " + __dartStr(error_1.offset) + " " + __dartStr(error_1.message));
      }
    } else {
      throw $error_1;
    }
  }
}

function _semantics(variable) {
  return (() => {
    let v = null;
    const _0_0 = variable;
    const _0_1 = "fast";
    const _0_3 = "web";
    const _0_5 = "slow";
    const _0_7 = "cli";
    L:
    {
      {
        if (__dartEquals("fast", _0_0)) {
          {
            v = true;
            break L;
          }
        }
      }
      {
        if (__dartEquals("web", _0_0)) {
          {
            v = false;
            break L;
          }
        }
      }
      {
        if (__dartEquals("slow", _0_0)) {
          {
            v = false;
            break L;
          }
        }
      }
      {
        if (__dartEquals("cli", _0_0)) {
          {
            v = true;
            break L;
          }
        }
      }
      {
        if (true) {
          {
            v = false;
            break L;
          }
        }
      }
    }
    return v;
  })();
}

main();
