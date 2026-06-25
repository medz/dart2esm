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
function __dartExpando(name = null) {
  const values = new WeakMap();
  const expando = {
    get(object) { return values.has(object) ? values.get(object) : null; },
    set(object, value) { values.set(object, value); return null; },
    toString() { return name == null ? "Expando" : "Expando:" + String(name); },
  };
  Object.defineProperty(expando, "__dartType", { value: "Expando" });
  return Object.freeze(expando);
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
function __dartDurationToString(micros) {
  const sign = micros < 0 ? "-" : "";
  let rest = Math.abs(micros);
  const microseconds = rest % 1000000;
  const totalSeconds = Math.trunc(rest / 1000000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.trunc(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.trunc(totalMinutes / 60);
  return sign + hours + ":" + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0") + "." + String(microseconds).padStart(6, "0");
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
    toString() { return __dartDurationToString(micros); },
  };
}
function __dartDateTimeFromParts(isUtc, year, month = 1, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0, microsecond = 0) {
  const millis = isUtc ? Date.UTC(year, month - 1, day, hour, minute, second, millisecond) : new Date(year, month - 1, day, hour, minute, second, millisecond).getTime();
  return __dartDateTimeFromMicros(millis * 1000 + microsecond, isUtc);
}
function __dartDateTimeFromMicros(micros, isUtc) {
  const millis = Math.floor(micros / 1000);
  const microsecond = ((micros % 1000) + 1000) % 1000;
  return __dartDateTime(millis, isUtc, microsecond);
}
function __dartDateTime(millis, isUtc = false, microsecond = 0) {
  const date = new Date(millis);
  const read = (utcName, localName) => isUtc ? date[utcName]() : date[localName]();
  return {
    get millisecondsSinceEpoch() { return millis; },
    get microsecondsSinceEpoch() { return millis * 1000 + microsecond; },
    get microsecond() { return microsecond; },
    get millisecond() { return read("getUTCMilliseconds", "getMilliseconds"); },
    get second() { return read("getUTCSeconds", "getSeconds"); },
    get minute() { return read("getUTCMinutes", "getMinutes"); },
    get hour() { return read("getUTCHours", "getHours"); },
    get day() { return read("getUTCDate", "getDate"); },
    get month() { return read("getUTCMonth", "getMonth") + 1; },
    get year() { return read("getUTCFullYear", "getFullYear"); },
    get weekday() { const day = read("getUTCDay", "getDay"); return day === 0 ? 7 : day; },
    get isUtc() { return isUtc; },
    get timeZoneName() { return isUtc ? "UTC" : ""; },
    get timeZoneOffset() { return __dartDuration({ minutes: isUtc ? 0 : -date.getTimezoneOffset() }); },
    get hashCode() { return this.microsecondsSinceEpoch & 0x1fffffff; },
    "=="(other) { return other != null && typeof other.microsecondsSinceEpoch === "number" && this.microsecondsSinceEpoch === other.microsecondsSinceEpoch; },
    compareTo(other) { const diff = this.microsecondsSinceEpoch - other.microsecondsSinceEpoch; return diff < 0 ? -1 : diff > 0 ? 1 : 0; },
    isBefore(other) { return this.microsecondsSinceEpoch < other.microsecondsSinceEpoch; },
    isAfter(other) { return this.microsecondsSinceEpoch > other.microsecondsSinceEpoch; },
    isAtSameMomentAs(other) { return this.microsecondsSinceEpoch === other.microsecondsSinceEpoch; },
    add(duration) { return __dartDateTimeFromMicros(this.microsecondsSinceEpoch + duration.inMicroseconds, isUtc); },
    subtract(duration) { return __dartDateTimeFromMicros(this.microsecondsSinceEpoch - duration.inMicroseconds, isUtc); },
    difference(other) { return __dartDuration({ microseconds: this.microsecondsSinceEpoch - other.microsecondsSinceEpoch }); },
    toUtc() { return __dartDateTime(millis, true, microsecond); },
    toLocal() { return __dartDateTime(millis, false, microsecond); },
    toIso8601String() { const text = date.toISOString(); return microsecond === 0 ? text : text.replace(/(\.\d{3})Z$/, "$1" + String(microsecond).padStart(3, "0") + "Z"); },
    toString() { return this.toIso8601String(); },
  };
}
function __dartDateTimeParse(source, tryParse = false) {
  const text = String(source);
  const millis = Date.parse(text);
  if (Number.isNaN(millis)) {
    if (tryParse) return null;
    throw __dartCoreError("FormatException", "Invalid date format");
  }
  const isUtc = /(?:z|[+-]\d\d(?::?\d\d)?)$/i.test(text);
  const fraction = /\.(\d+)/.exec(text);
  const microsecond = fraction == null ? 0 : Number((fraction[1] + "000000").slice(0, 6).slice(3));
  return __dartDateTime(millis, isUtc, microsecond);
}
function __dartDateTimeCopyWith(value, options = {}) {
  const isUtc = options.isUtc ?? value.isUtc;
  return __dartDateTimeFromParts(isUtc, options.year ?? value.year, options.month ?? value.month, options.day ?? value.day, options.hour ?? value.hour, options.minute ?? value.minute, options.second ?? value.second, options.millisecond ?? value.millisecond, options.microsecond ?? value.microsecond);
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
function __dartUtf8Encode(source, start = 0, end = null) {
  const text = String(source);
  return Array.from(new TextEncoder().encode(text.slice(start, end ?? undefined)));
}
function __dartUtf8Decode(bytes, allowMalformed = false, start = 0, end = null) {
  const slice = Array.from(bytes).slice(start, end ?? undefined);
  return new TextDecoder("utf-8", { fatal: !allowMalformed }).decode(Uint8Array.from(slice));
}
function __dartUtf8Encoder() {
  return {
    convert(source, start = 0, end = null) { return __dartUtf8Encode(source, start, end); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartUtf8Decoder(allowMalformed = false) {
  return {
    convert(bytes, start = 0, end = null) { return __dartUtf8Decode(bytes, allowMalformed, start, end); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
}
function __dartUtf8Codec(allowMalformed = false) {
  return {
    encode(source) { return __dartUtf8Encode(source); },
    convert(source) { return __dartUtf8Encode(source); },
    decode(bytes, options = {}) { return __dartUtf8Decode(bytes, options.allowMalformed ?? allowMalformed); },
    get encoder() { return __dartUtf8Encoder(); },
    get decoder() { return __dartUtf8Decoder(allowMalformed); },
    fuse(next) { return __dartConverterFuse(this, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(this, sink); },
  };
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
function __dartSinkAdd(sink, value) {
  if (sink != null && typeof sink.add === "function") return sink.add(value);
  if (sink != null && typeof sink.write === "function") return sink.write(value);
  if (Array.isArray(sink)) { sink.push(value); return null; }
  throw new TypeError("Sink.add is not available");
}
function __dartSinkClose(sink) {
  if (sink != null && typeof sink.close === "function") return sink.close();
  return null;
}
function __dartConverterConvert(converter, value) {
  if (converter != null && typeof converter.convert === "function") return converter.convert(value);
  if (converter != null && typeof converter.encode === "function") return converter.encode(value);
  throw new TypeError("Converter.convert is not available");
}
function __dartConverterBind(converter, stream) {
  return (async function*() {
    for await (const value of stream) {
      yield __dartConverterConvert(converter, value);
    }
  })();
}
function __dartConverterFuse(first, second) {
  const fused = {
    convert(value) { return __dartConverterConvert(second, __dartConverterConvert(first, value)); },
    fuse(next) { return __dartConverterFuse(fused, next); },
    startChunkedConversion(sink) { return __dartConverterStartChunked(fused, sink); },
    bind(stream) { return __dartConverterBind(fused, stream); },
  };
  if (typeof first?.encode === "function" && typeof first?.decode === "function" && typeof second?.encode === "function" && typeof second?.decode === "function") {
    fused.encode = (value) => second.encode(first.encode(value));
    fused.decode = (value) => first.decode(second.decode(value));
    Object.defineProperty(fused, "encoder", { get() { return __dartConverterFuse(first.encoder, second.encoder); } });
    Object.defineProperty(fused, "decoder", { get() { return __dartConverterFuse(second.decoder, first.decoder); } });
  }
  return fused;
}
function __dartConverterStartChunked(converter, sink) {
  const chunks = [];
  const input = {
    add(value) { chunks.push(value); return null; },
    addSlice(value, start, end, isLast = false) {
      const slice = typeof value === "string" ? value.slice(start, end) : Array.from(value).slice(start, end);
      chunks.push(slice);
      if (isLast) this.close();
      return null;
    },
    close() {
      let value;
      if (chunks.length === 0) value = "";
      else if (chunks.every((chunk) => typeof chunk === "string")) value = chunks.join("");
      else if (chunks.every((chunk) => Array.isArray(chunk) || ArrayBuffer.isView(chunk))) value = chunks.flatMap((chunk) => Array.from(chunk));
      else value = chunks.length === 1 ? chunks[0] : chunks;
      sink.add(__dartConverterConvert(converter, value));
      if (typeof sink.close === "function") sink.close();
      return null;
    },
  };
  return input;
}
function __dartChunkedConversionSink(callback) {
  const chunks = [];
  let closed = false;
  return {
    add(chunk) { if (closed) return null; chunks.push(chunk); return null; },
    close() { if (closed) return null; closed = true; callback(chunks); return null; },
  };
}
function __dartByteConversionSink(callback) {
  const bytes = [];
  let closed = false;
  return {
    add(chunk) { if (closed) return null; bytes.push(...Array.from(chunk)); return null; },
    addSlice(chunk, start, end, isLast = false) { if (closed) return null; bytes.push(...Array.from(chunk).slice(start, end)); if (isLast) this.close(); return null; },
    close() { if (closed) return null; closed = true; callback(bytes); return null; },
  };
}
function __dartByteConversionSinkFrom(sink) {
  let closed = false;
  return {
    add(chunk) { if (closed) return null; return __dartSinkAdd(sink, chunk); },
    addSlice(chunk, start, end, isLast = false) {
      if (closed) return null;
      __dartSinkAdd(sink, Array.from(chunk).slice(start, end));
      if (isLast) this.close();
      return null;
    },
    close() { if (closed) return null; closed = true; return __dartSinkClose(sink); },
  };
}
function __dartStringConversionSinkAsUtf8Sink(sink, allowMalformed = false) {
  let closed = false;
  return {
    add(chunk) { if (closed) return null; sink.add(__dartUtf8Decode(chunk, allowMalformed)); return null; },
    addSlice(chunk, start, end, isLast = false) { if (closed) return null; sink.add(__dartUtf8Decode(chunk, allowMalformed, start, end)); if (isLast) this.close(); return null; },
    close() { if (closed) return null; closed = true; return typeof sink.close === "function" ? sink.close() : null; },
  };
}
function __dartStringConversionSink(callback) {
  let text = "";
  let closed = false;
  return {
    add(chunk) { if (closed) return null; text += String(chunk); return null; },
    addSlice(chunk, start, end, isLast = false) { if (closed) return null; text += String(chunk).slice(start, end); if (isLast) this.close(); return null; },
    close() { if (closed) return null; closed = true; callback(text); return null; },
    asUtf8Sink(allowMalformed = false) { return __dartStringConversionSinkAsUtf8Sink(this, allowMalformed); },
  };
}
function __dartStringConversionSinkFrom(sink) {
  let closed = false;
  return {
    add(chunk) { if (closed) return null; return __dartSinkAdd(sink, String(chunk)); },
    addSlice(chunk, start, end, isLast = false) {
      if (closed) return null;
      __dartSinkAdd(sink, String(chunk).slice(start, end));
      if (isLast) this.close();
      return null;
    },
    close() { if (closed) return null; closed = true; return __dartSinkClose(sink); },
    asUtf8Sink(allowMalformed = false) { return __dartStringConversionSinkAsUtf8Sink(this, allowMalformed); },
  };
}
function __dartStringConversionSinkFromStringSink(sink) {
  let closed = false;
  return {
    add(chunk) { if (closed) return null; return __dartSinkAdd(sink, String(chunk)); },
    addSlice(chunk, start, end, isLast = false) {
      if (closed) return null;
      __dartSinkAdd(sink, String(chunk).slice(start, end));
      if (isLast) this.close();
      return null;
    },
    close() { closed = true; return null; },
    asUtf8Sink(allowMalformed = false) { return __dartStringConversionSinkAsUtf8Sink(this, allowMalformed); },
  };
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
function __dartIoOSError(message = "", errorCode = 0) {
  return Object.freeze({
    __dartType: "OSError",
    message,
    errorCode,
    toString() { return "OS Error: " + String(message) + ", errno = " + String(errorCode); },
  });
}
function __dartIoFileSystemException(message = "", path = null, osError = null) {
  const text = String(message ?? "");
  const error = new Error(text);
  error.name = "FileSystemException";
  Object.defineProperty(error, "__dartIoFileSystemException", { value: true });
  Object.defineProperty(error, "__dartCoreErrorType", { value: "FileSystemException" });
  Object.defineProperty(error, "message", { value: text });
  Object.defineProperty(error, "path", { value: path });
  Object.defineProperty(error, "osError", { value: osError });
  Object.defineProperty(error, "toString", { value() {
    const pathText = path == null ? "" : ", path = " + JSON.stringify(String(path));
    const osText = osError == null ? "" : " (" + String(osError) + ")";
    return "FileSystemException: " + text + pathText + osText;
  } });
  return error;
}
function __dartIoEnum(typeName, name, index) {
  return Object.freeze({
    __dartType: typeName,
    name,
    index,
    toString() { return String(typeName) + "." + String(name); },
  });
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
function __dartTypedDataSublistView(data, start, end, viewConstructor, bytesPerElement) {
  const elementSize = data instanceof DataView ? 1 : data.BYTES_PER_ELEMENT;
  const elementCount = Math.trunc(data.byteLength / elementSize);
  const effectiveEnd = end == null ? elementCount : end;
  const byteOffset = data.byteOffset + start * elementSize;
  const byteLength = (effectiveEnd - start) * elementSize;
  if (viewConstructor === DataView) return new DataView(data.buffer, byteOffset, byteLength);
  return new viewConstructor(data.buffer, byteOffset, Math.trunc(byteLength / bytesPerElement));
}
function __dartBytesBuilder(copy = true) {
  let chunks = [];
  let length = 0;
  function asBytes(bytes) {
    if (bytes instanceof Uint8Array) return copy ? Uint8Array.from(bytes) : bytes;
    return Uint8Array.from(Array.from(bytes, (byte) => Number(byte) & 255));
  }
  function collect(clear) {
    const result = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    if (clear) { chunks = []; length = 0; }
    return result;
  }
  return {
    __dartType: "BytesBuilder",
    add(bytes) { const chunk = asBytes(bytes); if (chunk.length !== 0) { chunks.push(chunk); length += chunk.length; } return null; },
    addByte(byte) { chunks.push(Uint8Array.of(Number(byte) & 255)); length++; return null; },
    takeBytes() { return collect(true); },
    toBytes() { return collect(false); },
    clear() { chunks = []; length = 0; return null; },
    get length() { return length; },
    get isEmpty() { return length === 0; },
    get isNotEmpty() { return length !== 0; },
  };
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
function __dartCreateZone(parent = null, values = null) {
  const zoneValues = values instanceof Map ? values : new Map();
  const zone = {
    __dartType: "Zone",
    parent,
    get errorZone() { return zone; },
    get(key) {
      if (zoneValues.has(key)) return zoneValues.get(key);
      return parent == null ? null : parent.get(key);
    },
    "[]"(key) { return this.get(key); },
    run(body) { return __dartRunInZone(zone, body); },
    runUnary(body, argument) { return __dartRunInZone(zone, () => body(argument)); },
    runBinary(body, first, second) { return __dartRunInZone(zone, () => body(first, second)); },
    runGuarded(body) { try { return __dartRunInZone(zone, body); } catch (error) { return zone.handleUncaughtError(error, error?.stack ?? "<javascript stack unavailable>"); } },
    runUnaryGuarded(body, argument) { try { return __dartRunInZone(zone, () => body(argument)); } catch (error) { return zone.handleUncaughtError(error, error?.stack ?? "<javascript stack unavailable>"); } },
    runBinaryGuarded(body, first, second) { try { return __dartRunInZone(zone, () => body(first, second)); } catch (error) { return zone.handleUncaughtError(error, error?.stack ?? "<javascript stack unavailable>"); } },
    bindCallback(callback) { return () => zone.run(callback); },
    bindUnaryCallback(callback) { return argument => zone.runUnary(callback, argument); },
    bindBinaryCallback(callback) { return (first, second) => zone.runBinary(callback, first, second); },
    bindCallbackGuarded(callback) { return () => zone.runGuarded(callback); },
    bindUnaryCallbackGuarded(callback) { return argument => zone.runUnaryGuarded(callback, argument); },
    bindBinaryCallbackGuarded(callback) { return (first, second) => zone.runBinaryGuarded(callback, first, second); },
    registerCallback(callback) { return zone.bindCallback(callback); },
    registerUnaryCallback(callback) { return zone.bindUnaryCallback(callback); },
    registerBinaryCallback(callback) { return zone.bindBinaryCallback(callback); },
    fork(options = {}) { return __dartCreateZone(zone, options.zoneValues); },
    scheduleMicrotask(callback) { return __dartScheduleMicrotask(callback, zone); },
    handleUncaughtError(error, stackTrace = null) { throw error; },
    inSameErrorZone(other) { return true; },
    print(line) { console.log(String(line)); return null; },
    toString() { return "Zone"; },
  };
  return Object.freeze(zone);
}
const __dartRootZone = __dartCreateZone(null, new Map());
let __dartCurrentZone = __dartRootZone;
function __dartZoneValuesMap(zoneValues) {
  if (zoneValues == null) return new Map();
  if (zoneValues instanceof Map) return zoneValues;
  return new Map(Array.from(zoneValues));
}
function __dartScheduleMicrotask(callback, zone = __dartCurrentZone) {
  const run = () => __dartRunInZone(zone, callback);
  if (typeof queueMicrotask === "function") queueMicrotask(run);
  else Promise.resolve().then(run);
  return null;
}
function __dartRunInZone(zone, body) {
  const previous = __dartCurrentZone;
  __dartCurrentZone = zone;
  try {
    const result = body();
    if (result != null && typeof result.then === "function") {
      return result.finally(() => { __dartCurrentZone = previous; });
    }
    __dartCurrentZone = previous;
    return result;
  } catch (error) {
    __dartCurrentZone = previous;
    throw error;
  }
}
function __dartRunZoned(body, options = {}) {
  const parent = options.parentZone ?? __dartCurrentZone;
  const zone = __dartCreateZone(parent, __dartZoneValuesMap(options.zoneValues));
  try {
    return __dartRunInZone(zone, body);
  } catch (error) {
    if (typeof options.onError === "function") return options.onError(error, error?.stack ?? "<javascript stack unavailable>");
    throw error;
  }
}
function __dartRunZonedGuarded(body, onError, options = {}) {
  try {
    const result = __dartRunZoned(body, { zoneValues: options.zoneValues, parentZone: options.parentZone ?? __dartCurrentZone });
    if (result != null && typeof result.then === "function") {
      return result.catch((error) => { onError(error, error?.stack ?? "<javascript stack unavailable>"); return null; });
    }
    return result;
  } catch (error) {
    onError(error, error?.stack ?? "<javascript stack unavailable>");
    return null;
  }
}
function __dartFutureAsStream(future) {
  return (async function*() {
    yield await future;
  })();
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
function __dartStreamController(broadcast = false, options = {}) {
  let onListen = options.onListen ?? null;
  let onPause = options.onPause ?? null;
  let onResume = options.onResume ?? null;
  let onCancel = options.onCancel ?? null;
  const listeners = new Set();
  let closed = false;
  let singleListened = false;
  let activeSubscriptions = 0;
  let resolveDone;
  const done = new Promise((resolve) => { resolveDone = resolve; });
  function makeState(bufferBeforeListen = false) {
    return { queue: [], waiters: [], active: false, bufferBeforeListen, ended: false };
  }
  const singleState = makeState(true);
  function subscriptionStarted() {
    activeSubscriptions++;
    if (activeSubscriptions === 1 && typeof onListen === "function") onListen();
  }
  function subscriptionEnded(canceled) {
    if (activeSubscriptions > 0) activeSubscriptions--;
    if (canceled && activeSubscriptions === 0 && typeof onCancel === "function") return onCancel();
    return null;
  }
  function endState(state, canceled, remove) {
    if (state.ended) return null;
    state.ended = true;
    if (remove) remove();
    return subscriptionEnded(canceled);
  }
  function stateHasPending(state) {
    return state.queue.length > 0 || state.waiters.length > 0;
  }
  function hasActiveListener() {
    if (broadcast) return listeners.size > 0;
    return singleState.active;
  }
  function maybeResolveDone() {
    if (!closed) return;
    if (broadcast) {
      if (listeners.size > 0) return;
      resolveDone(null);
      return;
    }
    if (!singleState.active && !stateHasPending(singleState)) resolveDone(null);
  }
  function settle(waiter, item) {
    if (item.done === true) waiter.resolve({ done: true });
    else if ("error" in item) waiter.reject(item.error);
    else waiter.resolve({ value: item.value, done: false });
  }
  function nextResult(item) {
    if (item.done === true) return Promise.resolve({ done: true });
    if ("error" in item) return Promise.reject(item.error);
    return Promise.resolve({ value: item.value, done: false });
  }
  function enqueue(state, item) {
    if (!state.active && !state.bufferBeforeListen) return;
    const waiter = state.waiters.shift();
    if (waiter) settle(waiter, item);
    else state.queue.push(item);
  }
  function clearWaiters(state) {
    while (state.waiters.length > 0) settle(state.waiters.shift(), { done: true });
  }
  function cancelState(state) {
    state.active = false;
    state.bufferBeforeListen = false;
    state.queue.length = 0;
    clearWaiters(state);
    maybeResolveDone();
  }
  function deliver(item) {
    if (closed) throw new Error("Cannot add event after closing");
    if (broadcast) {
      for (const listener of listeners) enqueue(listener, item);
      return;
    }
    enqueue(singleState, item);
  }
  function closeQueue() {
    if (closed) return;
    closed = true;
    if (broadcast) {
      for (const listener of listeners) {
        const remove = () => listeners.delete(listener);
        if (listener.queue.length === 0) { listener.active = false; clearWaiters(listener); endState(listener, false, remove); }
      }
    } else if (singleState.queue.length === 0) {
      singleState.active = false;
      clearWaiters(singleState);
      endState(singleState, false, null);
    }
    maybeResolveDone();
  }
  function iteratorForState(state, remove) {
    return {
      next() {
        const item = state.queue.shift();
        if (item) {
          const result = nextResult(item);
          maybeResolveDone();
          return result;
        }
        if (closed || !state.active) {
          state.active = false;
          state.bufferBeforeListen = false;
          const endResult = endState(state, false, remove);
          maybeResolveDone();
          return Promise.resolve(endResult).then(() => ({ done: true }));
        }
        return new Promise((resolve, reject) => state.waiters.push({ resolve, reject }));
      },
      return() {
        cancelState(state);
        const endResult = endState(state, true, remove);
        return Promise.resolve(endResult).then(() => ({ done: true }));
      },
    };
  }
  const controller = {
    get stream() { return stream; },
    get sink() { return controller; },
    get done() { return done; },
    get isClosed() { return closed; },
    get isPaused() { return !hasActiveListener() && !closed; },
    get hasListener() { return hasActiveListener(); },
    get onListen() { return onListen; },
    set onListen(value) { onListen = value; },
    get onPause() { return onPause; },
    set onPause(value) { onPause = value; },
    get onResume() { return onResume; },
    set onResume(value) { onResume = value; },
    get onCancel() { return onCancel; },
    set onCancel(value) { onCancel = value; },
    add(value) { deliver({ value }); return null; },
    addError(error, stackTrace = null) { deliver({ error }); return null; },
    close() { closeQueue(); return done; },
    async addStream(source, options = {}) {
      const iterator = source?.[Symbol.asyncIterator]?.();
      if (iterator == null) {
        for (const value of Array.from(source ?? [])) deliver({ value });
        return null;
      }
      while (true) {
        let step;
        try {
          step = await iterator.next();
        } catch (error) {
          deliver({ error });
          if (options.cancelOnError === true) {
            if (typeof iterator.return === "function") await iterator.return();
            return null;
          }
          continue;
        }
        if (step.done === true) return null;
        deliver({ value: step.value });
      }
    },
  };
  const stream = {
    isBroadcast: broadcast,
    _onPause() { return typeof onPause === "function" ? onPause() : null; },
    _onResume() { return typeof onResume === "function" ? onResume() : null; },
    [Symbol.asyncIterator]() {
      if (broadcast) {
        const state = makeState();
        state.active = true;
        listeners.add(state);
        subscriptionStarted();
        return iteratorForState(state, () => { listeners.delete(state); maybeResolveDone(); });
      }
      if (singleListened) {
        throw new Error("Bad state: Stream has already been listened to.");
      }
      singleListened = true;
      singleState.active = true;
      singleState.bufferBeforeListen = false;
      subscriptionStarted();
      return iteratorForState(singleState, null);
    },
  };
  return controller;
}
function __dartBoundSubscriptionStream(source, onListen) {
  const stream = {
    get isBroadcast() { return source?.isBroadcast === true; },
    listen(onData, options = {}) {
      const subscription = onListen(source, options.cancelOnError ?? false);
      if (typeof subscription.onData === "function") subscription.onData(onData);
      if (typeof subscription.onError === "function") subscription.onError(options.onError ?? null);
      if (typeof subscription.onDone === "function") subscription.onDone(options.onDone ?? null);
      return subscription;
    },
    [Symbol.asyncIterator]() {
      const controller = __dartStreamController(false);
      const subscription = stream.listen((value) => controller.add(value), { onError: (error) => controller.addError(error), onDone: () => controller.close(), cancelOnError: false });
      const iterator = controller.stream[Symbol.asyncIterator]();
      return {
        next() { return iterator.next(); },
        return() {
          return Promise.resolve(subscription.cancel()).then(() => {
            if (typeof iterator.return === "function") return iterator.return();
            return { done: true };
          });
        },
      };
    },
  };
  return stream;
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
function __dartStreamFromIterable(values, isBroadcast = false) {
  let listened = false;
  return {
    isBroadcast,
    [Symbol.asyncIterator]() {
      if (!isBroadcast) {
        if (listened) throw new Error("Bad state: Stream has already been listened to.");
        listened = true;
      }
      return (async function*() {
        for (const value of values) yield value;
      })();
    },
  };
}
function __dartStreamFromFuture(future) {
  return (async function*() {
    yield await future;
  })();
}
function __dartStreamIterable(stream) {
  if (stream != null && typeof stream[Symbol.asyncIterator] === "function") return stream;
  if (stream == null || typeof stream.listen !== "function") return stream;
  return {
    [Symbol.asyncIterator]() {
      const queue = [];
      const waiters = [];
      let done = false;
      let error = null;
      let subscription = null;
      function push(record) {
        if (waiters.length > 0) waiters.shift()(record);
        else queue.push(record);
      }
      function finish(doneError = null) {
        if (done) return;
        done = true;
        error = doneError;
        push({ done: true });
      }
      subscription = stream.listen(
        (value) => push({ value, done: false }),
        { onError: (listenError) => finish(listenError), onDone: () => finish(), cancelOnError: true },
      );
      return {
        async next() {
          if (queue.length === 0 && done) {
            if (error != null) throw error;
            return { done: true };
          }
          const record = queue.length > 0 ? queue.shift() : await new Promise((resolve) => waiters.push(resolve));
          if (record.done) {
            if (error != null) throw error;
            return { done: true };
          }
          return { value: record.value, done: false };
        },
        async return() {
          done = true;
          queue.length = 0;
          while (waiters.length > 0) waiters.shift()({ done: true });
          if (subscription != null && typeof subscription.cancel === "function") await subscription.cancel();
          return { done: true };
        },
      };
    },
  };
}
function __dartStreamFromFutures(futures) {
  const controller = __dartStreamController(false);
  const pending = Array.from(futures);
  if (pending.length === 0) {
    controller.close();
    return controller.stream;
  }
  let remaining = pending.length;
  for (const future of pending) {
    Promise.resolve(future).then(
      (value) => controller.add(value),
      (error) => controller.addError(error),
    ).finally(() => {
      remaining--;
      if (remaining === 0) controller.close();
    });
  }
  return controller.stream;
}
function __dartStreamMulti(onListen, isBroadcast = false) {
  let listened = false;
  return {
    isBroadcast,
    [Symbol.asyncIterator]() {
      if (!isBroadcast) {
        if (listened) throw new Error("Bad state: Stream has already been listened to.");
        listened = true;
      }
      const controller = __dartStreamController(false);
      onListen(controller);
      return controller.stream[Symbol.asyncIterator]();
    },
  };
}
function __dartStreamError(error) {
  return (async function*() {
    throw error;
  })();
}
function __dartStreamPeriodic(period, computation = null) {
  return (async function*() {
    let tick = 0;
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, period.inMilliseconds)));
      yield typeof computation === "function" ? computation(tick) : null;
      tick++;
    }
  })();
}
function __dartStreamAsBroadcastStream(stream, onListen = null, onCancel = null) {
  const controller = __dartStreamController(true);
  let started = false;
  let canceled = false;
  function makeSubscription() {
    return {
      pause() { return null; },
      resume() { return null; },
      cancel() { canceled = true; return controller.close(); },
      get isPaused() { return false; },
    };
  }
  async function pump() {
    try {
      for await (const value of __dartStreamIterable(stream)) {
        if (canceled) break;
        controller.add(value);
      }
    } catch (error) {
      if (!canceled) controller.addError(error);
    } finally {
      await controller.close();
    }
  }
  return {
    isBroadcast: true,
    [Symbol.asyncIterator]() {
      if (!started) {
        started = true;
        if (typeof onListen === "function") onListen(makeSubscription());
        Promise.resolve().then(pump);
      }
      const iterator = controller.stream[Symbol.asyncIterator]();
      return {
        next() { return iterator.next(); },
        return() {
          if (typeof onCancel === "function") onCancel(makeSubscription());
          if (typeof iterator.return === "function") return iterator.return();
          return Promise.resolve({ done: true });
        },
      };
    },
  };
}
function __dartStreamMap(stream, convert) {
  return (async function*() {
    for await (const value of __dartStreamIterable(stream)) {
      yield convert(value);
    }
  })();
}
function __dartStreamWhere(stream, test) {
  return (async function*() {
    for await (const value of __dartStreamIterable(stream)) {
      if (test(value)) yield value;
    }
  })();
}
function __dartStreamAsyncMap(stream, convert) {
  return (async function*() {
    for await (const value of __dartStreamIterable(stream)) {
      yield await convert(value);
    }
  })();
}
function __dartStreamAsyncExpand(stream, convert) {
  return (async function*() {
    for await (const value of __dartStreamIterable(stream)) {
      const inner = convert(value);
      if (inner == null) continue;
      for await (const expanded of __dartStreamIterable(inner)) yield expanded;
    }
  })();
}
function __dartStreamExpand(stream, convert) {
  return (async function*() {
    for await (const value of __dartStreamIterable(stream)) {
      const inner = convert(value);
      if (inner == null) continue;
      for (const expanded of Array.from(inner)) {
        yield expanded;
      }
    }
  })();
}
function __dartStreamTransformerFromBind(bind) {
  return { bind };
}
function __dartStreamTransformerFromHandlers({ handleData = null, handleError = null, handleDone = null } = {}) {
  return {
    bind(stream) {
      const controller = __dartStreamController(false);
      const sink = controller.sink;
      (async () => {
        let shouldClose = false;
        try {
          const iterator = __dartStreamIterable(stream)[Symbol.asyncIterator]();
          while (!controller.isClosed) {
            let next;
            try {
              next = await iterator.next();
            } catch (error) {
              if (typeof handleError === "function") {
                await handleError(error, error?.stack ?? "<javascript stack unavailable>", sink);
                continue;
              }
              sink.addError(error);
              continue;
            }
            if (next.done) {
              if (typeof handleDone === "function") {
                await handleDone(sink);
              } else {
                shouldClose = true;
              }
              break;
            }
            if (typeof handleData === "function") {
              await handleData(next.value, sink);
            } else {
              sink.add(next.value);
            }
          }
        } catch (error) {
          if (!controller.isClosed) sink.addError(error);
          shouldClose = true;
        } finally {
          if (shouldClose && !controller.isClosed) await controller.close();
        }
      })();
      return controller.stream;
    },
  };
}
function __dartStreamTransformerBind(transformer, stream) {
  if (transformer != null && typeof transformer.bind === "function") return transformer.bind(stream);
  if (transformer != null && typeof transformer.convert === "function") return __dartConverterBind(transformer, stream);
  if (typeof transformer === "function") return transformer(stream);
  throw new TypeError("StreamTransformer.bind is not available");
}
function __dartStreamTransform(stream, transformer) {
  return __dartStreamTransformerBind(transformer, stream);
}
function __dartStreamEventTransformed(stream, mapSink) {
  const controller = __dartStreamController(stream?.isBroadcast === true);
  const sink = mapSink(controller.sink);
  (async () => {
    try {
      const iterator = __dartStreamIterable(stream)[Symbol.asyncIterator]();
      while (!controller.isClosed) {
        let next;
        try {
          next = await iterator.next();
        } catch (error) {
          if (typeof sink.addError === "function") {
            sink.addError(error, error?.stack ?? "<javascript stack unavailable>");
          } else {
            controller.addError(error);
          }
          continue;
        }
        if (next.done) break;
        sink.add(next.value);
      }
      if (typeof sink.close === "function") {
        await sink.close();
      } else if (!controller.isClosed) {
        await controller.close();
      }
    } catch (error) {
      if (!controller.isClosed) controller.addError(error);
      if (!controller.isClosed) await controller.close();
    }
  })();
  return controller.stream;
}
function __dartStreamDistinct(stream, equals = null) {
  return (async function*() {
    let hasPrevious = false;
    let previous;
    for await (const value of __dartStreamIterable(stream)) {
      const same = hasPrevious && (typeof equals === "function" ? equals(previous, value) : __dartEquals(previous, value));
      if (same) continue;
      previous = value;
      hasPrevious = true;
      yield value;
    }
  })();
}
function __dartStreamHandleError(stream, onError, test = null) {
  return (async function*() {
    const iterator = __dartStreamIterable(stream)[Symbol.asyncIterator]();
    while (true) {
      let next;
      try {
        next = await iterator.next();
        if (next.done) break;
        yield next.value;
      } catch (error) {
        if (typeof test === "function" && !test(error)) throw error;
        if (typeof onError !== "function") continue;
        const result = onError.length >= 2 ? onError(error, error?.stack ?? "<javascript stack unavailable>") : onError(error);
        await result;
      }
    }
  })();
}
function __dartStreamTake(stream, count) {
  return (async function*() {
    let remaining = Math.max(0, Math.trunc(count));
    if (remaining === 0) return;
    for await (const value of __dartStreamIterable(stream)) {
      yield value;
      remaining--;
      if (remaining === 0) break;
    }
  })();
}
function __dartStreamSkip(stream, count) {
  return (async function*() {
    let remaining = Math.max(0, Math.trunc(count));
    for await (const value of __dartStreamIterable(stream)) {
      if (remaining > 0) {
        remaining--;
        continue;
      }
      yield value;
    }
  })();
}
function __dartStreamTimeout(stream, duration, onTimeout = null) {
  const controller = __dartStreamController(false);
  const delay = Math.max(0, typeof duration === "number" ? duration : duration.inMilliseconds);
  const iterator = __dartStreamIterable(stream)[Symbol.asyncIterator]();
  let pendingNext = null;
  function nextEvent() {
    pendingNext ??= Promise.resolve(iterator.next()).then((next) => ({ next }), (error) => ({ error }));
    return pendingNext;
  }
  function timeoutEvent() {
    return new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), delay));
  }
  (async () => {
    try {
      while (!controller.isClosed) {
        const result = await Promise.race([nextEvent(), timeoutEvent()]);
        if (result.timeout) {
          if (typeof onTimeout === "function") {
            onTimeout(controller.sink);
          } else {
            controller.addError(new Error("TimeoutException: Stream timeout"));
          }
          continue;
        }
        pendingNext = null;
        if ("error" in result) {
          controller.addError(result.error);
          continue;
        }
        if (result.next.done) break;
        controller.add(result.next.value);
      }
    } finally {
      if (typeof iterator.return === "function") {
        try { await iterator.return(); } catch (_) {}
      }
      await controller.close();
    }
  })();
  return controller.stream;
}
function __dartStreamTakeWhile(stream, test) {
  return (async function*() {
    for await (const value of __dartStreamIterable(stream)) {
      if (!test(value)) break;
      yield value;
    }
  })();
}
function __dartStreamSkipWhile(stream, test) {
  return (async function*() {
    let skipping = true;
    for await (const value of __dartStreamIterable(stream)) {
      if (skipping && test(value)) continue;
      skipping = false;
      yield value;
    }
  })();
}
async function __dartStreamToList(stream) {
  const values = [];
  for await (const value of __dartStreamIterable(stream)) values.push(value);
  return values;
}
async function __dartStreamToSet(stream) {
  const values = new Set();
  for await (const value of __dartStreamIterable(stream)) {
    __dartSetAdd(values, value);
  }
  return values;
}
async function __dartStreamFold(stream, initialValue, combine) {
  let result = initialValue;
  for await (const value of __dartStreamIterable(stream)) {
    result = await combine(result, value);
  }
  return result;
}
async function __dartStreamReduce(stream, combine) {
  let found = false;
  let result;
  for await (const value of __dartStreamIterable(stream)) {
    if (!found) {
      found = true;
      result = value;
    } else {
      result = await combine(result, value);
    }
  }
  if (!found) throw new RangeError("No element");
  return result;
}
async function __dartStreamForEach(stream, action) {
  for await (const value of __dartStreamIterable(stream)) await action(value);
  return null;
}
function __dartStreamCast(stream, test, typeName) {
  return (async function*() {
    for await (const value of __dartStreamIterable(stream)) {
      yield __dartAs(value, test, typeName);
    }
  })();
}
async function __dartStreamFirst(stream) {
  for await (const value of __dartStreamIterable(stream)) return value;
  throw new RangeError("No element");
}
async function __dartStreamLast(stream) {
  let found = false;
  let last;
  for await (const value of __dartStreamIterable(stream)) {
    found = true;
    last = value;
  }
  if (!found) throw new RangeError("No element");
  return last;
}
async function __dartStreamSingle(stream) {
  let found = false;
  let single;
  for await (const value of __dartStreamIterable(stream)) {
    if (found) throw new Error("Bad state: Too many elements");
    found = true;
    single = value;
  }
  if (!found) throw new RangeError("No element");
  return single;
}
async function __dartStreamLength(stream) {
  let count = 0;
  for await (const _ of __dartStreamIterable(stream)) count++;
  return count;
}
async function __dartStreamIsEmpty(stream) {
  for await (const _ of __dartStreamIterable(stream)) return false;
  return true;
}
async function __dartStreamAny(stream, test) {
  for await (const value of __dartStreamIterable(stream)) {
    if (test(value)) return true;
  }
  return false;
}
async function __dartStreamEvery(stream, test) {
  for await (const value of __dartStreamIterable(stream)) {
    if (!test(value)) return false;
  }
  return true;
}
async function __dartStreamFirstWhere(stream, test, orElse = null) {
  for await (const value of __dartStreamIterable(stream)) {
    if (test(value)) return value;
  }
  if (typeof orElse === "function") return orElse();
  throw new RangeError("No element");
}
async function __dartStreamLastWhere(stream, test, orElse = null) {
  let found = false;
  let last;
  for await (const value of __dartStreamIterable(stream)) {
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
  for await (const value of __dartStreamIterable(stream)) {
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
  for await (const value of __dartStreamIterable(stream)) {
    if (__dartEquals(value, needle)) return true;
  }
  return false;
}
async function __dartStreamJoin(stream, separator = "") {
  const values = [];
  for await (const value of __dartStreamIterable(stream)) values.push(__dartStr(value));
  return values.join(String(separator));
}
async function __dartStreamDrain(stream, futureValue = null) {
  for await (const _ of __dartStreamIterable(stream)) {}
  return futureValue;
}
async function __dartStreamPipe(stream, consumer) {
  if (typeof consumer.addStream === "function") {
    await consumer.addStream(stream);
  } else {
    for await (const value of __dartStreamIterable(stream)) consumer.add(value);
  }
  return typeof consumer.close === "function" ? await consumer.close() : null;
}
function __dartStreamListen(stream, onData, onError = null, onDone = null, cancelOnError = false) {
  if (stream != null && typeof stream.listen === "function" && typeof stream[Symbol.asyncIterator] !== "function") {
    return stream.listen(onData, { onError, onDone, cancelOnError });
  }
  const iteratorFactory = stream?.[Symbol.asyncIterator];
  if (typeof iteratorFactory !== "function") throw new TypeError("Object is not a Stream");
  const iterator = iteratorFactory.call(stream);
  let canceled = false;
  let paused = false;
  let resumeWaiter = null;
  function waitWhilePaused() {
    if (!paused) return Promise.resolve();
    return new Promise((resolve) => { resumeWaiter = resolve; });
  }
  const done = (async () => {
      while (!canceled) {
        await waitWhilePaused();
        if (canceled) break;
        let next;
        try {
          next = await iterator.next();
        } catch (error) {
          if (typeof onError === "function") onError(error);
          else throw error;
          if (cancelOnError) break;
          continue;
        }
        if (next.done) break;
        if (typeof onData === "function") onData(next.value);
      }
      if (!canceled && typeof onDone === "function") onDone();
    return null;
  })();
  return {
    get isPaused() { return paused; },
    pause(resumeSignal = null) {
      if (!paused) {
        paused = true;
        if (typeof stream._onPause === "function") stream._onPause();
      }
      if (resumeSignal != null) Promise.resolve(resumeSignal).then(() => this.resume());
      return null;
    },
    resume() {
      if (!paused) return null;
      paused = false;
      if (typeof stream._onResume === "function") stream._onResume();
      if (resumeWaiter != null) {
        const resolve = resumeWaiter;
        resumeWaiter = null;
        resolve();
      }
      return null;
    },
    onData(handleData) { onData = handleData; return null; },
    onError(handleError) { onError = handleError; return null; },
    onDone(handleDone) { onDone = handleDone; return null; },
    cancel() { canceled = true; this.resume(); if (typeof iterator.return === "function") return Promise.resolve(iterator.return()).then(() => done, () => done); return done; },
    asFuture(value = null) { return done.then(() => value); },
  };
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

const $Directory_interface = Symbol("Directory");
const $DirectoryAddOnsMixin_interface = Symbol("DirectoryAddOnsMixin");
const $Equality_interface = Symbol("Equality");
const $File_interface = Symbol("File");
const $FileSpan_interface = Symbol("FileSpan");
const $FileSystem_interface = Symbol("FileSystem");
const $FileSystemEntity_interface = Symbol("FileSystemEntity");
const $ForwardingFileSystemEntity_interface = Symbol("ForwardingFileSystemEntity");
const $GlyphSet_interface = Symbol("GlyphSet");
const $LineScanner_interface = Symbol("LineScanner");
const $LineScannerState_interface = Symbol("LineScannerState");
const $Link_interface = Symbol("Link");
const $MemoryFileSystem_interface = Symbol("MemoryFileSystem");
const $NodeBasedFileSystem_interface = Symbol("NodeBasedFileSystem");
const $NonGrowableListMixin_interface = Symbol("NonGrowableListMixin");
const $PriorityQueue_interface = Symbol("PriorityQueue");
const $Result_interface = Symbol("Result");
const $SourceLocation_interface = Symbol("SourceLocation");
const $SourceSpan_interface = Symbol("SourceSpan");
const $SourceSpanWithContext_interface = Symbol("SourceSpanWithContext");
const $SpanScanner_interface = Symbol("SpanScanner");
const $StreamSinkTransformer_interface = Symbol("StreamSinkTransformer");
const $StyleableFileSystem_interface = Symbol("StyleableFileSystem");
const $UnmodifiableSetMixin_interface = Symbol("UnmodifiableSetMixin");
const $UnmodifiableSetView_interface = Symbol("UnmodifiableSetView");
const $_Codes_interface = Symbol("_Codes");
const $_EventRequest_interface = Symbol("_EventRequest");

class AsyncCache {
  constructor(duration) {
    this._cachedStreamSplitter = null;
    this._cachedValueFuture = null;
    this._stale = null;
    this._duration = duration;
  }
  static ephemeral() {
    return $AsyncCache_ephemeral(AsyncCache);
  }
  async fetch(callback) {
    if (!((this._cachedStreamSplitter === null))) {
      {
        (() => { throw __dartCoreError("StateError", "Previously used to cache via `fetchStream`"); })();
      }
    }
    return (this._cachedValueFuture ?? (this._cachedValueFuture = (() => { let v = (callback)(); return (() => {
      (v.finally(__dartBind(this, "_startStaleTimer")).catch(() => null), null);
      return v;
    })(); })()));
  }
  fetchStream(callback) {
    if (!((this._cachedValueFuture === null))) {
      {
        (() => { throw __dartCoreError("StateError", "Previously used to cache via `fetch`"); })();
      }
    }
    let splitter = (this._cachedStreamSplitter ?? (this._cachedStreamSplitter = new StreamSplitter(__dartStreamTransform((callback)(), __dartStreamTransformerFromHandlers({ handleData: null, handleError: null, handleDone: (sink) => {
      this._startStaleTimer();
      sink.close();
} })))));
    return splitter.split();
  }
  invalidate() {
    this._cachedValueFuture = null;
    ((this._cachedStreamSplitter)?.close() ?? null);
    this._cachedStreamSplitter = null;
    ((this._stale)?.cancel() ?? null);
    this._stale = null;
  }
  _startStaleTimer() {
    let duration = this._duration;
    if (!((duration === null))) {
      {
        this._stale = __dartTimer(duration, __dartBind(this, "invalidate"), false);
      }
    } else {
      {
        this.invalidate();
      }
    }
  }
}

function $AsyncCache_ephemeral($newTarget) {
  const $self = Object.create($newTarget.prototype);
  $self._cachedStreamSplitter = null;
  $self._cachedValueFuture = null;
  $self._stale = null;
  $self._duration = null;
  return $self;
}

class AsyncMemoizer {
  constructor() {
    this._completer = __dartCompleter();
  }
  get future() {
    return this._completer.future;
  }
  get hasRun() {
    return this._completer.isCompleted;
  }
  runOnce(computation) {
    if (!(this.hasRun)) {
      this._completer.complete(Promise.resolve().then(() => (computation)()));
    }
    return this.future;
  }
}

class CancelableOperation {
  constructor() {
    throw new TypeError("Class CancelableOperation has no unnamed constructor");
  }
  static _(_completer) {
    return $CancelableOperation__(CancelableOperation, _completer);
  }
  static fromFuture(result, { onCancel = null } = {}) {
    return (() => { let v = new CancelableCompleter({ onCancel: onCancel }); return (() => {
      v.complete(result);
      return v;
    })(); })().operation;
  }
  static fromValue(value) {
    return (() => { let v = new CancelableCompleter(); return (() => {
      v.complete(value);
      return v;
    })(); })().operation;
  }
  static fromSubscription(subscription) {
    let completer = new CancelableCompleter({ onCancel: __dartBind(subscription, "cancel") });
    subscription.onDone(__dartAs(__dartBind(completer, "complete"), value => typeof value === "function", "void Function([FutureOr<void>?])"));
    subscription.onError(function(error, stackTrace) {
      subscription.cancel().finally(function() {
        completer.completeError(error, stackTrace);
});
});
    return completer.operation;
  }
  static race(operations) {
    operations = Array.from(operations);
    if (__dartIterableIsEmpty(operations)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "May not be empty"); })();
      }
    }
    let done = false;
    function cancelAll() {
      done = true;
      return __dartFutureWait((() => {
        const v = new Array(0).fill(null);
        {
          let _sync_for_iterator = __dartIterator(operations);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let operation = _sync_for_iterator.current;
              if (!(operation.isCanceled)) {
                (v.push(operation.cancel()), null);
              }
            }
          }
        }
        return v;
      })(), false, null);
    }
    let completer = new CancelableCompleter({ onCancel: cancelAll });
    {
      let _sync_for_iterator = __dartIterator(operations);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let operation = _sync_for_iterator.current;
          {
            operation.then(function(value) {
              if (!(done)) {
                cancelAll().finally(function() { return completer.complete(value); });
              }
}, { onError: function(error, stackTrace) {
              if (!(done)) {
                {
                  cancelAll().finally(function() { return completer.completeError(error, stackTrace); });
                }
              }
}, propagateCancel: false });
          }
        }
      }
    }
    return completer.operation;
  }
  get value() {
    return ((this._completer._inner)?.future ?? __dartCompleter().future);
  }
  asStream() {
    let controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: __dartBind(this._completer, "_cancel") });
    (() => { let v = this._completer._inner; return ((v === null) ? null : v.future.then(function(value) {
      controller.add(value);
      controller.close();
}, function(error, stackTrace) {
      controller.addError(error, stackTrace);
      controller.close();
})); })();
    return controller.stream;
  }
  valueOrCancellation(cancellationValue = null) {
    let completer = __dartCompleter();
    this.value.then(__dartAs(__dartBind(completer, "complete"), value => typeof value === "function", "void Function([FutureOr<CancelableOperation.T?>?])"), __dartBind(completer, "completeError"));
    (() => { let v = this._completer._cancelCompleter; return ((v === null) ? null : v.future.then(function(_) {
      completer.complete(cancellationValue);
}, __dartBind(completer, "completeError"))); })();
    return completer.future;
  }
  then(onValue, { onError = null, onCancel = null, propagateCancel = true } = {}) {
    return this.thenOperation(function(value, completer) {
      completer.complete((onValue)(value));
}, { onError: ((onError === null) ? null : function(error, stackTrace, completer) {
      completer.complete((onError)(error, stackTrace));
}), onCancel: ((onCancel === null) ? null : function(completer) {
      completer.complete((onCancel)());
}), propagateCancel: propagateCancel });
  }
  thenOperation(onValue, { onError = null, onCancel = null, propagateCancel = true } = {}) {
    const completer = new CancelableCompleter({ onCancel: (propagateCancel ? __dartBind(this, "_cancelIfNotCanceled") : null) });
    (() => { let v = this._completer._inner; return ((v === null) ? null : v.future.then(async function(value) {
      if (completer.isCanceled) {
        return;
      }
      try {
        {
          await (onValue)(value, completer);
        }
      } catch ($error) {
        if ($error != null) {
          const error = $error;
          const stack = $error?.stack ?? "<javascript stack unavailable>";
          {
            completer.completeError(error, stack);
          }
        } else {
          throw $error;
        }
      }
}, ((onError === null) ? __dartBind(completer, "completeError") : async function(error, stack) {
      if (completer.isCanceled) {
        return;
      }
      try {
        {
          await (onError)(error, stack, completer);
        }
      } catch ($error) {
        if ($error != null) {
          const error2 = $error;
          const stack2 = $error?.stack ?? "<javascript stack unavailable>";
          {
            _extension_0_completeErrorIfPending(completer, error2, (Object.is(error, error2) ? stack : stack2));
          }
        } else {
          throw $error;
        }
      }
}))); })();
    const cancelForwarder = new _CancelForwarder(completer, onCancel);
    if (this._completer.isCanceled) {
      {
        cancelForwarder._forward();
      }
    } else {
      {
        ((() => { let v_1 = this._completer; return (v_1._cancelForwarders ?? (v_1._cancelForwarders = new Array(0).fill(null))); })().push(cancelForwarder), null);
      }
    }
    return completer.operation;
  }
  cancel() {
    return this._completer._cancel();
  }
  _cancelIfNotCanceled() {
    return (this.isCanceled ? null : this.cancel());
  }
  get isCanceled() {
    return this._completer._isCanceled;
  }
  get isCompleted() {
    return this._completer._isCompleted;
  }
}

function $CancelableOperation__($newTarget, _completer) {
  const $self = Object.create($newTarget.prototype);
  $self._completer = _completer;
  return $self;
}

class CancelableCompleter {
  constructor({ onCancel = null } = {}) {
    this._inner = __dartCompleter();
    this._cancelCompleter = __dartCompleter();
    this._cancelForwarders = null;
    this._mayComplete = true;
    const $operation = __dartLazyField("CancelableCompleter.operation", () => CancelableOperation._(this), false);
    Object.defineProperty(this, "operation", {
      get() { return $operation.get(); },
      set(value) { $operation.set(value); },
      enumerable: true,
    });
    this._onCancel = onCancel;
  }
  get _isCompleted() {
    return (this._cancelCompleter === null);
  }
  get _isCanceled() {
    return (this._inner === null);
  }
  get isCompleted() {
    return !(this._mayComplete);
  }
  get isCanceled() {
    return this._isCanceled;
  }
  complete(value = null) {
    if (!(this._mayComplete)) {
      (() => { throw __dartCoreError("StateError", "Operation already completed"); })();
    }
    this._mayComplete = false;
    if (!(value != null && typeof value.then === "function")) {
      {
        ((this._completeNow())?.complete(value) ?? null);
        return;
      }
    }
    if ((this._inner === null)) {
      {
        (value.catch(() => null), null);
        return;
      }
    }
    value.then((result) => {
      ((this._completeNow())?.complete(result) ?? null);
}, (error, stackTrace) => {
      ((this._completeNow())?.completeError(error, stackTrace) ?? null);
});
  }
  completeOperation(result, { propagateCancel = true } = {}) {
    if (!(this._mayComplete)) {
      (() => { throw __dartCoreError("StateError", "Already completed"); })();
    }
    this._mayComplete = false;
    if (this.isCanceled) {
      {
        if (propagateCancel) {
          result.cancel();
        }
        (result.value.catch(() => null), null);
        return;
      }
    }
    result.then((value) => {
      ((this._inner)?.complete(value) ?? null);
}, { onError: (error, stack) => {
      ((this._inner)?.completeError(error, stack) ?? null);
}, onCancel: () => {
      this.operation.cancel();
} });
    if (propagateCancel) {
      {
        (() => { let v = this._cancelCompleter; return ((v === null) ? null : v.future.finally(__dartBind(result, "cancel"))); })();
      }
    }
  }
  _completeNow() {
    let inner = this._inner;
    if ((inner === null)) {
      return null;
    }
    this._cancelCompleter = null;
    return inner;
  }
  completeError(error, stackTrace = null) {
    if (!(this._mayComplete)) {
      (() => { throw __dartCoreError("StateError", "Operation already completed"); })();
    }
    this._mayComplete = false;
    ((this._completeNow())?.completeError(error, stackTrace) ?? null);
  }
  _cancel() {
    let cancelCompleter = this._cancelCompleter;
    if ((cancelCompleter === null)) {
      return Promise.resolve(null);
    }
    if (!((this._inner === null))) {
      {
        this._inner = null;
        cancelCompleter.complete(this._invokeCancelCallbacks());
      }
    }
    return cancelCompleter.future;
  }
  async _invokeCancelCallbacks() {
    const toReturn = (() => { let v = this._onCancel; return ((v === null) ? null : (v)()); })();
    const isFuture = toReturn != null && typeof toReturn.then === "function";
    const cancelFutures = (() => {
      const v = new Array(0).fill(null);
      if (isFuture) {
        (v.push(toReturn), null);
      }
      const v_1 = (() => { let v_2 = this._cancelForwarders; return ((v_2 === null) ? null : Array.from(Array.from(v_2, _forward)).filter((value) => value != null)); })();
      if (!((v_1 === null))) {
        (v.push(...Array.from(v_1)), null);
      }
      return v;
    })();
    const results = ((isFuture && __dartEquals(cancelFutures.length, 1)) ? [await toReturn] : (cancelFutures.length !== 0 ? await __dartFutureWait(cancelFutures, false, null) : __dartConst("[\"list\",\"DynamicType(dynamic)\"]", () => Object.freeze([]))));
    return (isFuture ? __dartIndexGet(results, 0) : toReturn);
  }
}

class _CancelForwarder {
  constructor(completer, onCancel) {
    this.completer = completer;
    this.onCancel = onCancel;
  }
  _forward() {
    if (this.completer.isCanceled) {
      return null;
    }
    const onCancel = this.onCancel;
    if ((onCancel === null)) {
      return this.completer._cancel();
    }
    try {
      {
        const result = (onCancel)(this.completer);
        if (result != null && typeof result.then === "function") {
          {
            return result.catch(_extension_0_get_completeErrorIfPending(this.completer));
          }
        }
      }
    } catch ($error) {
      if ($error != null) {
        const error = $error;
        const stack = $error?.stack ?? "<javascript stack unavailable>";
        {
          _extension_0_completeErrorIfPending(this.completer, error, stack);
        }
      } else {
        throw $error;
      }
    }
    return null;
  }
}

class ChunkedStreamReader {
  static _(_input) {
    return $ChunkedStreamReader__(ChunkedStreamReader, _input);
  }
  constructor(stream) {
    return ChunkedStreamReader._(__dartStreamIterator(stream));
  }
  async readChunk(size) {
    const result = new Array(0).fill(null);
    {
      let _stream = this.readStream(size);
      let _for_iterator = __dartStreamIterator(_stream);
      try {
        while (await _for_iterator.moveNext()) {
          {
            const chunk = _for_iterator.current;
            {
              (result.push(...Array.from(chunk)), null);
            }
          }
        }
      } finally {
        if (!((_for_iterator._subscription === null))) {
          await _for_iterator.cancel();
        }
      }
    }
    return result;
  }
  readStream(size) {
    __dartCheckNotNegative(size, "size", null);
    if (this._reading) {
      {
        (() => { throw __dartCoreError("StateError", "Concurrent read operations are not allowed!"); })();
      }
    }
    this._reading = true;
    async function* substream() {
      L:
      while ((size > 0)) {
        {
          if (__dartEquals(this._offset, this._buffer.length)) {
            {
              if (!(await this._input.moveNext())) {
                {
                  size = 0;
                  this._reading = false;
                  break L;
                }
              }
              this._buffer = this._input.current;
              this._offset = 0;
            }
          }
          const remainingBuffer = (this._buffer.length - this._offset);
          if ((remainingBuffer > 0)) {
            {
              if ((remainingBuffer >= size)) {
                {
                  let output = null;
                  if (this._buffer instanceof Uint8Array) {
                    {
                      output = __dartAs(__dartTypedDataSublistView(__dartAs(this._buffer, value => value instanceof Uint8Array, "Uint8List"), this._offset, (this._offset + size), Uint8Array, 1), value => (Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView))), "List<ChunkedStreamReader.T%>");
                    }
                  } else {
                    {
                      output = this._buffer.slice(this._offset, (this._offset + size));
                    }
                  }
                  this._offset = (this._offset + size);
                  size = 0;
                  yield output;
                  this._reading = false;
                  break L;
                }
              }
              const output_1 = (__dartEquals(this._offset, 0) ? this._buffer : this._buffer.slice(this._offset));
              size = (size - remainingBuffer);
              this._buffer = this._emptyList;
              this._offset = 0;
              yield output_1;
            }
          }
        }
      }
    }
    const c = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null });
    c.onListen = function() { return c.addStream(substream(), { cancelOnError: false }).finally(__dartBind(c, "close")); };
    c.onCancel = async () => {
      L:
      while ((size > 0)) {
        {
          if (__dartEquals(this._buffer.length, this._offset)) {
            {
              if (!(await this._input.moveNext())) {
                {
                  size = 0;
                  break L;
                }
              }
              this._buffer = this._input.current;
              this._offset = 0;
            }
          }
          const remainingBuffer = (this._buffer.length - this._offset);
          if ((remainingBuffer >= size)) {
            {
              this._offset = (this._offset + size);
              size = 0;
              break L;
            }
          }
          size = (size - remainingBuffer);
          this._buffer = this._emptyList;
          this._offset = 0;
        }
      }
      this._reading = false;
};
    return c.stream;
  }
  async cancel() {
    return await this._input.cancel();
  }
}

function $ChunkedStreamReader__($newTarget, _input) {
  const $self = Object.create($newTarget.prototype);
  $self._emptyList = __dartConst("[\"list\",\"NeverType(Never)\"]", () => Object.freeze([]));
  $self._buffer = new Array(0).fill(null);
  $self._offset = 0;
  $self._reading = false;
  $self._input = _input;
  return $self;
}

class DelegatingEventSink {
  constructor(sink) {
    this._sink = sink;
  }
  static _(_sink) {
    return $DelegatingEventSink__(DelegatingEventSink, _sink);
  }
  static typed(sink) {
    return (sink != null && typeof sink === "object" && typeof sink.add === "function" && typeof sink.addError === "function" && typeof sink.close === "function" ? sink : DelegatingEventSink._(sink));
  }
  add(data) {
    this._sink.add(data);
  }
  addError(error, stackTrace = null) {
    this._sink.addError(error, stackTrace);
  }
  close() {
    this._sink.close();
  }
}

function $DelegatingEventSink__($newTarget, _sink) {
  const $self = Object.create($newTarget.prototype);
  $self._sink = _sink;
  return $self;
}

class DelegatingFuture {
  constructor(_future) {
    this._future = _future;
  }
  static typed(future) {
    return (future != null && typeof future.then === "function" ? future : future.then(function(v) { return __dartAs(v, value => true, "T"); }));
  }
  asStream() {
    return __dartFutureAsStream(this._future);
  }
  catchError(onError, { test = null } = {}) {
    return this._future.catch((error) => (test)(error) ? (onError)(error) : Promise.reject(error));
  }
  then(onValue, { onError = null } = {}) {
    return this._future.then(onValue, onError);
  }
  whenComplete(action) {
    return this._future.finally(action);
  }
  timeout(timeLimit, { onTimeout = null } = {}) {
    return __dartFutureTimeout(this._future, timeLimit, onTimeout);
  }
}

class DelegatingSink {
  constructor(sink) {
    this._sink = sink;
  }
  static _(_sink) {
    return $DelegatingSink__(DelegatingSink, _sink);
  }
  static typed(sink) {
    return (sink != null && typeof sink === "object" && typeof sink.add === "function" && typeof sink.close === "function" ? sink : DelegatingSink._(sink));
  }
  add(data) {
    this._sink.add(data);
  }
  close() {
    this._sink.close();
  }
}

function $DelegatingSink__($newTarget, _sink) {
  const $self = Object.create($newTarget.prototype);
  $self._sink = _sink;
  return $self;
}

class DelegatingStream {
  constructor(stream) {
  }
  static typed(stream) {
    return __dartStreamCast(stream, (value) => true, "TypeParameterType(DelegatingStream.typed.T%)");
  }
}

class DelegatingStreamConsumer {
  constructor(consumer) {
    this._consumer = consumer;
  }
  static _(_consumer) {
    return $DelegatingStreamConsumer__(DelegatingStreamConsumer, _consumer);
  }
  static typed(consumer) {
    return (consumer != null && typeof consumer === "object" && typeof consumer.addStream === "function" && typeof consumer.close === "function" ? consumer : DelegatingStreamConsumer._(consumer));
  }
  addStream(stream) {
    return this._consumer.addStream(stream, { cancelOnError: false });
  }
  close() {
    return this._consumer.close();
  }
}

function $DelegatingStreamConsumer__($newTarget, _consumer) {
  const $self = Object.create($newTarget.prototype);
  $self._consumer = _consumer;
  return $self;
}

class DelegatingStreamSink {
  constructor(sink) {
    this._sink = sink;
  }
  static _(_sink) {
    return $DelegatingStreamSink__(DelegatingStreamSink, _sink);
  }
  get done() {
    return this._sink.done;
  }
  static typed(sink) {
    return (sink != null && typeof sink === "object" && typeof sink.add === "function" && typeof sink.addError === "function" && typeof sink.close === "function" ? sink : DelegatingStreamSink._(sink));
  }
  add(data) {
    this._sink.add(data);
  }
  addError(error, stackTrace = null) {
    this._sink.addError(error, stackTrace);
  }
  addStream(stream) {
    return this._sink.addStream(stream, { cancelOnError: false });
  }
  close() {
    return this._sink.close();
  }
}

function $DelegatingStreamSink__($newTarget, _sink) {
  const $self = Object.create($newTarget.prototype);
  $self._sink = _sink;
  return $self;
}

class TypeSafeStreamSubscription {
  constructor(_subscription) {
    this._subscription = _subscription;
  }
  get isPaused() {
    return this._subscription.isPaused;
  }
  onData(handleData) {
    if ((handleData === null)) {
      return this._subscription.onData(null);
    }
    this._subscription.onData(function(data) { return (handleData)(__dartAs(data, value => true, "T")); });
  }
  onError(handleError) {
    this._subscription.onError(handleError);
  }
  onDone(handleDone) {
    this._subscription.onDone(handleDone);
  }
  pause(resumeFuture = null) {
    this._subscription.pause(resumeFuture);
  }
  resume() {
    this._subscription.resume();
  }
  cancel() {
    return this._subscription.cancel();
  }
  asFuture(futureValue = null) {
    return this._subscription.asFuture(futureValue);
  }
}

class DelegatingStreamSubscription {
  constructor(sourceSubscription) {
    this._source = sourceSubscription;
  }
  static typed(subscription) {
    return (subscription != null && typeof subscription === "object" && typeof subscription.pause === "function" && typeof subscription.resume === "function" && typeof subscription.cancel === "function" ? subscription : new TypeSafeStreamSubscription(subscription));
  }
  onData(handleData) {
    this._source.onData(handleData);
  }
  onError(handleError) {
    this._source.onError(handleError);
  }
  onDone(handleDone) {
    this._source.onDone(handleDone);
  }
  pause(resumeFuture = null) {
    this._source.pause(resumeFuture);
  }
  resume() {
    this._source.resume();
  }
  cancel() {
    return this._source.cancel();
  }
  asFuture(futureValue = null) {
    return this._source.asFuture(futureValue);
  }
  get isPaused() {
    return this._source.isPaused;
  }
}

class FutureGroup {
  constructor() {
    this._pending = 0;
    this._closed = false;
    this._completer = __dartCompleter();
    this._onIdleController = null;
    this._values = new Array(0).fill(null);
  }
  get isClosed() {
    return this._closed;
  }
  get future() {
    return this._completer.future;
  }
  get isIdle() {
    return __dartEquals(this._pending, 0);
  }
  get onIdle() {
    return (this._onIdleController ?? (this._onIdleController = __dartStreamController(true, { onListen: null, onPause: null, onResume: null, onCancel: null }))).stream;
  }
  add(task) {
    if (this._closed) {
      (() => { throw __dartCoreError("StateError", "The FutureGroup is closed."); })();
    }
    let index = this._values.length;
    (this._values.push(null), null);
    this._pending = (this._pending + 1);
    task.then((value) => {
      if (this._completer.isCompleted) {
        return null;
      }
      this._pending = (this._pending - 1);
      __dartIndexSet(this._values, index, value);
      if (!(__dartEquals(this._pending, 0))) {
        return null;
      }
      let onIdleController = this._onIdleController;
      if (!((onIdleController === null))) {
        onIdleController.add(null);
      }
      if (!(this._closed)) {
        return null;
      }
      if (!((onIdleController === null))) {
        onIdleController.close();
      }
      this._completer.complete(Array.from(Array.from(this._values).filter((value) => true)));
}).catch((error, stackTrace) => {
      if (this._completer.isCompleted) {
        return null;
      }
      this._completer.completeError(error, stackTrace);
});
  }
  close() {
    this._closed = true;
    if (!(__dartEquals(this._pending, 0))) {
      return;
    }
    if (this._completer.isCompleted) {
      return;
    }
    this._completer.complete(Array.from(Array.from(this._values).filter((value) => true)));
  }
}

class StreamCompleter {
  constructor() {
    this._stream = new _CompleterStream();
  }
  static fromFuture(streamFuture) {
    let completer = new StreamCompleter();
    streamFuture.then(__dartAs(__dartBind(completer, "setSourceStream"), value => typeof value === "function", "void Function(Stream<StreamCompleter.fromFuture.T%>)"), __dartBind(completer, "setError"));
    return completer.stream;
  }
  get stream() {
    return this._stream;
  }
  setSourceStream(sourceStream) {
    if (this._stream._isSourceStreamSet) {
      {
        (() => { throw __dartCoreError("StateError", "Source stream already set"); })();
      }
    }
    this._stream._setSourceStream(sourceStream);
  }
  setEmpty() {
    if (this._stream._isSourceStreamSet) {
      {
        (() => { throw __dartCoreError("StateError", "Source stream already set"); })();
      }
    }
    this._stream._setEmpty();
  }
  setError(error, stackTrace = null) {
    this.setSourceStream(__dartStreamFromFuture(Promise.reject(error)));
  }
}

class _CompleterStream {
  constructor() {
    this._controller = null;
    this._sourceStream = null;
  }
  listen(onData, { onError = null, onDone = null, cancelOnError = null } = {}) {
    if ((this._controller === null)) {
      {
        let sourceStream = this._sourceStream;
        if ((!((sourceStream === null)) && !((sourceStream.isBroadcast === true)))) {
          {
            return __dartStreamListen(sourceStream, onData, onError, onDone, cancelOnError);
          }
        }
        this._ensureController();
        if (!((this._sourceStream === null))) {
          {
            this._linkStreamToController();
          }
        }
      }
    }
    return __dartStreamListen(__dartNullCheck(this._controller).stream, onData, onError, onDone, cancelOnError);
  }
  get _isSourceStreamSet() {
    return !((this._sourceStream === null));
  }
  _setSourceStream(sourceStream) {
    this._sourceStream = sourceStream;
    if (!((this._controller === null))) {
      {
        this._linkStreamToController();
      }
    }
  }
  _linkStreamToController() {
    let controller = __dartNullCheck(this._controller);
    controller.addStream(__dartNullCheck(this._sourceStream), { cancelOnError: false }).finally(__dartBind(controller, "close"));
  }
  _setEmpty() {
    let controller = this._ensureController();
    this._sourceStream = controller.stream;
    controller.close();
  }
  _ensureController() {
    return (this._controller ?? (this._controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null })));
  }
}

class LazyStream {
  constructor(callback) {
    this._callback = callback;
    if ((this._callback === null)) {
      (() => { throw __dartCoreError("ArgumentError", "callback"); })();
    }
  }
  listen(onData, { onError = null, onDone = null, cancelOnError = null } = {}) {
    let callback = this._callback;
    if ((callback === null)) {
      {
        (() => { throw __dartCoreError("StateError", "Stream has already been listened to."); })();
      }
    }
    this._callback = null;
    let result = (callback)();
    let stream = null;
    if (result != null && typeof result.then === "function") {
      {
        stream = StreamCompleter.fromFuture(result);
      }
    } else {
      {
        stream = result;
      }
    }
    return __dartStreamListen(stream, onData, onError, onDone, cancelOnError);
  }
}

class NullStreamSink {
  constructor({ done = null } = {}) {
    this._closed = false;
    this._addingStream = false;
    this.done = (done ?? Promise.resolve(null));
  }
  static error(error, stackTrace = null) {
    return $NullStreamSink_error(NullStreamSink, error, stackTrace);
  }
  add(data) {
    this._checkEventAllowed();
  }
  addError(error, stackTrace = null) {
    this._checkEventAllowed();
  }
  addStream(stream) {
    this._checkEventAllowed();
    this._addingStream = true;
    let future = __dartStreamListen(stream, null, null, null, false).cancel();
    return future.finally(() => {
      this._addingStream = false;
});
  }
  _checkEventAllowed() {
    if (this._closed) {
      (() => { throw __dartCoreError("StateError", "Cannot add to a closed sink."); })();
    }
    if (this._addingStream) {
      {
        (() => { throw __dartCoreError("StateError", "Cannot add to a sink while adding a stream."); })();
      }
    }
  }
  close() {
    this._closed = true;
    return this.done;
  }
}

function $NullStreamSink_error($newTarget, error, stackTrace = null) {
  const $self = Object.create($newTarget.prototype);
  $self._closed = false;
  $self._addingStream = false;
  $self.done = (() => { let v = Promise.reject(error); return (() => {
    v.catch(function(_) {
});
    return v;
  })(); })();
  return $self;
}

class RestartableTimer {
  constructor(_duration, _callback) {
    this._duration = _duration;
    this._callback = _callback;
    this._timer = __dartTimer(_duration, _callback, false);
  }
  get isActive() {
    return this._timer.isActive;
  }
  reset() {
    this._timer.cancel();
    this._timer = __dartTimer(this._duration, this._callback, false);
  }
  cancel() {
    this._timer.cancel();
  }
  get tick() {
    return this._timer.tick;
  }
}

class CaptureSink {
  constructor(sink) {
    this._sink = sink;
  }
  add(value) {
    this._sink.add(new ValueResult(value));
  }
  addError(error, stackTrace = null) {
    this._sink.add(Result.error(error, stackTrace));
  }
  close() {
    this._sink.close();
  }
}

class CaptureStreamTransformer {
  bind(source) {
    return __dartStreamEventTransformed(source, $CaptureSink_new_tearoff);
  }
}

class ReleaseSink {
  constructor(_sink) {
    this._sink = _sink;
  }
  add(result) {
    result.addTo(this._sink);
  }
  addError(error, stackTrace = null) {
    this._sink.addError(error, stackTrace);
  }
  close() {
    this._sink.close();
  }
}

class ReleaseStreamTransformer {
  bind(source) {
    return __dartStreamEventTransformed(source, ReleaseStreamTransformer._createSink);
  }
  static _createSink(sink) {
    return new ReleaseSink(sink);
  }
}

class Result {
  constructor(computation) {
    if (new.target === Result) {
      try {
        {
          return new ValueResult((computation)());
        }
      } catch ($error) {
        if ($error != null) {
          const e = $error;
          const s = $error?.stack ?? "<javascript stack unavailable>";
          {
            return new ErrorResult(e, s);
          }
        } else {
          throw $error;
        }
      }
    }
  }
  static value(value) {
    return new ValueResult(value);
  }
  static error(error, stackTrace = null) {
    return new ErrorResult(error, stackTrace);
  }
  static capture(future) {
    return future.then($ValueResult_new_tearoff, $ErrorResult_new_tearoff);
  }
  static captureAll(elements) {
    let results = new Array(0).fill(null);
    let pending = 0;
    const completer = __dartLazyField("completer", null, true, null);
    {
      let _sync_for_iterator = __dartIterator(elements);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            if (element != null && typeof element.then === "function") {
              {
                let i = results.length;
                (results.push(null), null);
                pending = (pending + 1);
                Result.capture(element).then(function(result) {
                  __dartIndexSet(results, i, result);
                  if (__dartEquals(pending = (pending - 1), 0)) {
                    {
                      completer.get().complete(Array.from(results));
                    }
                  }
});
              }
            } else {
              {
                (results.push(new ValueResult(element)), null);
              }
            }
          }
        }
      }
    }
    if (__dartEquals(pending, 0)) {
      {
        return Promise.resolve(Array.from(results));
      }
    }
    completer.set(__dartCompleter());
    return completer.get().future;
  }
  static release(future) {
    return future.then(function(result) { return result.asFuture; });
  }
  static captureStream(source) {
    return __dartStreamTransform(source, new CaptureStreamTransformer());
  }
  static releaseStream(source) {
    return __dartStreamTransform(source, new ReleaseStreamTransformer());
  }
  static releaseSink(sink) {
    return new ReleaseSink(sink);
  }
  static captureSink(sink) {
    return new CaptureSink(sink);
  }
  static flatten(result) {
    if (result.isValue) {
      return __dartNullCheck(result.asValue).value;
    }
    return __dartNullCheck(result.asError);
  }
  static flattenAll(results) {
    let values = new Array(0).fill(null);
    {
      let _sync_for_iterator = __dartIterator(results);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let result = _sync_for_iterator.current;
          {
            if (result.isValue) {
              {
                (values.push(__dartNullCheck(result.asValue).value), null);
              }
            } else {
              {
                return __dartNullCheck(result.asError);
              }
            }
          }
        }
      }
    }
    return new ValueResult(values);
  }
  get isValue() {
    throw new TypeError("Abstract member Result.isValue");
  }
  set isValue(value) {
    Object.defineProperty(this, "isValue", { value, writable: true, configurable: true, enumerable: true });
  }
  get isError() {
    throw new TypeError("Abstract member Result.isError");
  }
  set isError(value) {
    Object.defineProperty(this, "isError", { value, writable: true, configurable: true, enumerable: true });
  }
  get asValue() {
    throw new TypeError("Abstract member Result.asValue");
  }
  set asValue(value) {
    Object.defineProperty(this, "asValue", { value, writable: true, configurable: true, enumerable: true });
  }
  get asError() {
    throw new TypeError("Abstract member Result.asError");
  }
  set asError(value) {
    Object.defineProperty(this, "asError", { value, writable: true, configurable: true, enumerable: true });
  }
  complete(completer) {
    throw new TypeError("Abstract member Result.complete");
  }
  addTo(sink) {
    throw new TypeError("Abstract member Result.addTo");
  }
  get asFuture() {
    throw new TypeError("Abstract member Result.asFuture");
  }
  set asFuture(value) {
    Object.defineProperty(this, "asFuture", { value, writable: true, configurable: true, enumerable: true });
  }
}
Object.defineProperty(Result, Symbol.hasInstance, { value(value) { return value != null && value[$Result_interface] === true; } });

class ValueResult {
  constructor(value) {
    this.value = value;
    Object.defineProperty(this, $Result_interface, { value: true });
  }
  get isValue() {
    return true;
  }
  get isError() {
    return false;
  }
  get asValue() {
    return this;
  }
  get asError() {
    return null;
  }
  complete(completer) {
    completer.complete(this.value);
  }
  addTo(sink) {
    sink.add(this.value);
  }
  get asFuture() {
    return Promise.resolve(this.value);
  }
  get hashCode() {
    return (__dartHashValue(this.value) ^ 842997089);
  }
  "=="(other) {
    return (other instanceof ValueResult && __dartEquals(this.value, other.value));
  }
}

class StreamSinkTransformer {
  constructor() {
    if (new.target === StreamSinkTransformer) {
      throw new TypeError("Class StreamSinkTransformer has no unnamed constructor");
    }
  }
  static fromStreamTransformer(transformer) {
    return new StreamTransformerWrapper(transformer);
  }
  static fromHandlers({ handleData = null, handleError = null, handleDone = null } = {}) {
    return new HandlerTransformer(handleData, handleError, handleDone);
  }
  bind(sink) {
    throw new TypeError("Abstract member StreamSinkTransformer.bind");
  }
  static typed(transformer) {
    return (transformer instanceof StreamSinkTransformer ? transformer : new TypeSafeStreamSinkTransformer(transformer));
  }
}
Object.defineProperty(StreamSinkTransformer, Symbol.hasInstance, { value(value) { return value != null && value[$StreamSinkTransformer_interface] === true; } });

class HandlerTransformer {
  constructor(_handleData, _handleError, _handleDone) {
    this._handleData = _handleData;
    this._handleError = _handleError;
    this._handleDone = _handleDone;
    Object.defineProperty(this, $StreamSinkTransformer_interface, { value: true });
  }
  bind(sink) {
    return new _HandlerSink(this, sink);
  }
}

class _HandlerSink {
  constructor(_transformer, inner) {
    this._transformer = _transformer;
    this._inner = inner;
    this._safeCloseInner = new _SafeCloseSink(inner);
  }
  get done() {
    return this._inner.done;
  }
  add(event) {
    let handleData = __dartAs(this._transformer._handleData, value => (value === null || typeof value === "function"), "void Function(_HandlerSink.S%, EventSink<_HandlerSink.T%>)?");
    if ((handleData === null)) {
      {
        this._inner.add(__dartAs(event, value => true, "T"));
      }
    } else {
      {
        (handleData)(event, this._safeCloseInner);
      }
    }
  }
  addError(error, stackTrace = null) {
    let handleError = __dartAs(this._transformer._handleError, value => (value === null || typeof value === "function"), "void Function(Object, StackTrace, EventSink<_HandlerSink.T%>)?");
    if ((handleError === null)) {
      {
        this._inner.addError(error, stackTrace);
      }
    } else {
      {
        (handleError)(error, (stackTrace ?? (error?.stack ?? new Error().stack ?? "<javascript stack unavailable>")), this._safeCloseInner);
      }
    }
  }
  addStream(stream) {
    return this._inner.addStream(__dartStreamTransform(stream, __dartStreamTransformerFromHandlers({ handleData: __dartAs(this._transformer._handleData, value => (value === null || typeof value === "function"), "void Function(_HandlerSink.S%, EventSink<_HandlerSink.T%>)?"), handleError: __dartAs(this._transformer._handleError, value => (value === null || typeof value === "function"), "void Function(Object, StackTrace, EventSink<_HandlerSink.T%>)?"), handleDone: _closeSink })), { cancelOnError: false });
  }
  close() {
    let handleDone = __dartAs(this._transformer._handleDone, value => (value === null || typeof value === "function"), "void Function(EventSink<_HandlerSink.T%>)?");
    if ((handleDone === null)) {
      return this._inner.close();
    }
    (handleDone)(this._safeCloseInner);
    return this._inner.done;
  }
}

class _SafeCloseSink extends DelegatingStreamSink {
  constructor(inner) {
    super(inner);
  }
  close() {
    return super.close().catch(function(_) {
});
  }
}

class StreamTransformerWrapper {
  constructor(_transformer) {
    this._transformer = _transformer;
    Object.defineProperty(this, $StreamSinkTransformer_interface, { value: true });
  }
  bind(sink) {
    return new _StreamTransformerWrapperSink(this._transformer, sink);
  }
}

class _StreamTransformerWrapperSink {
  constructor(transformer, _inner) {
    this._controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null });
    this._inner = _inner;
    __dartStreamListen(__dartStreamTransform(this._controller.stream, transformer), __dartAs(__dartBind(this._inner, "add"), value => typeof value === "function", "void Function(_StreamTransformerWrapperSink.T%)"), __dartBind(this._inner, "addError"), () => {
      this._inner.close().catch(function(_) {
});
}, false);
  }
  get done() {
    return this._inner.done;
  }
  add(event) {
    this._controller.add(event);
  }
  addError(error, stackTrace = null) {
    this._controller.addError(error, stackTrace);
  }
  addStream(stream) {
    return this._controller.addStream(stream, { cancelOnError: false });
  }
  close() {
    this._controller.close();
    return this._inner.done;
  }
}

class TypeSafeStreamSinkTransformer {
  constructor(_inner) {
    this._inner = _inner;
    Object.defineProperty(this, $StreamSinkTransformer_interface, { value: true });
  }
  bind(sink) {
    return (() => { let v = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null }); return (() => {
      __dartStreamPipe(__dartStreamCast(v.stream, (value) => true, "DynamicType(dynamic)"), this._inner.bind(sink));
      return v;
    })(); })();
  }
}

class ErrorResult {
  constructor(error, stackTrace = null) {
    this.error = error;
    this.stackTrace = (stackTrace ?? (error?.stack ?? new Error().stack ?? "<javascript stack unavailable>"));
    Object.defineProperty(this, $Result_interface, { value: true });
  }
  get isValue() {
    return false;
  }
  get isError() {
    return true;
  }
  get asValue() {
    return null;
  }
  get asError() {
    return this;
  }
  complete(completer) {
    completer.completeError(this.error, this.stackTrace);
  }
  addTo(sink) {
    sink.addError(this.error, this.stackTrace);
  }
  get asFuture() {
    return Promise.reject(this.error);
  }
  handle(errorHandler) {
    if (typeof errorHandler === "function") {
      {
        (errorHandler)(this.error, this.stackTrace);
      }
    } else {
      if (typeof errorHandler === "function") {
        {
          (errorHandler)(this.error);
        }
      } else {
        {
          (() => { throw __dartCoreError("ArgumentError", "is neither Function(Object, StackTrace) nor Function(Object)"); })();
        }
      }
    }
  }
  get hashCode() {
    return ((__dartHashValue(this.error) ^ __dartHashValue(this.stackTrace)) ^ 492929599);
  }
  "=="(other) {
    return ((other instanceof ErrorResult && __dartEquals(this.error, other.error)) && __dartEquals(this.stackTrace, other.stackTrace));
  }
}

class ResultFuture extends DelegatingFuture {
  constructor(future) {
    super(future);
    this._result = null;
    Result.capture(future).then((result) => {
      this._result = result;
});
  }
  get isComplete() {
    return !((this.result === null));
  }
  get result() {
    return this._result;
  }
}

class SingleSubscriptionTransformer {
  bind(stream) {
    const subscription = __dartLazyField("subscription", null, true, null);
    let controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: function() { return subscription.get().cancel(); } });
    subscription.set(__dartStreamListen(stream, function(value) {
      try {
        {
          controller.add(__dartAs(value, value => true, "T"));
        }
      } catch ($error) {
        if (__dartIsCoreError($error, "TypeError")) {
          const error = $error;
          const stackTrace = $error?.stack ?? "<javascript stack unavailable>";
          {
            controller.addError(error, stackTrace);
          }
        } else {
          throw $error;
        }
      }
}, __dartBind(controller, "addError"), __dartBind(controller, "close"), false));
    return controller.stream;
  }
}

class Target {
  constructor(kinds) {
    this.kinds = kinds;
  }
}

class TargetKind {
  constructor() {
    throw new TypeError("Class TargetKind has no unnamed constructor");
  }
  static _(displayString, name) {
    return $TargetKind__(TargetKind, displayString, name);
  }
  get index() {
    return __dartListIndexOf(__dartConst("[\"list\",\"InterfaceType(TargetKind)\",[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"classes\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"classType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"constructors\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"constructor\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"directive\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enums\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enum values\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumValue\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"export directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"exportDirective\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extensions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extension\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extension types\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extensionType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"fields\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"field\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level functions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"function\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"libraries\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"library\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"getters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"getter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"import directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"importDirective\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"methods\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"method\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"mixins\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"mixinType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"optional parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"optionalParameter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"overridable members\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"overridableMember\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"parameter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"\\\"part of\\\" directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"partOfDirective\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"setters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"setter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level variables\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"topLevelVariable\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"types (classes, enums, mixins, or typedefs)\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"type\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"typedefs\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typedefType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"type parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typeParameter\"]]]]", () => Object.freeze([__dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"classes\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"classType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "classes", name: "classType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"constructors\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"constructor\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "constructors", name: "constructor" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"directive\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "directives", name: "directive" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enums\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "enums", name: "enumType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enum values\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumValue\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "enum values", name: "enumValue" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"export directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"exportDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "export directives", name: "exportDirective" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extensions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extension\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "extensions", name: "extension" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extension types\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extensionType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "extension types", name: "extensionType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"fields\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"field\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "fields", name: "field" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level functions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"function\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "top-level functions", name: "function" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"libraries\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"library\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "libraries", name: "library" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"getters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"getter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "getters", name: "getter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"import directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"importDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "import directives", name: "importDirective" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"methods\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"method\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "methods", name: "method" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"mixins\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"mixinType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "mixins", name: "mixinType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"optional parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"optionalParameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "optional parameters", name: "optionalParameter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"overridable members\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"overridableMember\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "overridable members", name: "overridableMember" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"parameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "parameters", name: "parameter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"\\\"part of\\\" directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"partOfDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "\"part of\" directives", name: "partOfDirective" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"setters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"setter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "setters", name: "setter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level variables\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"topLevelVariable\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "top-level variables", name: "topLevelVariable" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"types (classes, enums, mixins, or typedefs)\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"type\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "types (classes, enums, mixins, or typedefs)", name: "type" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"typedefs\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typedefType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "typedefs", name: "typedefType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"type parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typeParameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "type parameters", name: "typeParameter" })))])), this, 0);
  }
  toString() {
    return "TargetKind." + __dartStr(this.name);
  }
}

function $TargetKind__($newTarget, displayString, name) {
  const $self = Object.create($newTarget.prototype);
  $self.displayString = displayString;
  $self.name = name;
  return $self;
}

class Immutable {
  constructor(reason = "") {
    this.reason = reason;
  }
}

class RecordUse {
}

class Required {
  constructor(reason = "") {
    this.reason = reason;
  }
}

class UseResult {
  constructor(reason = "") {
    this.reason = reason;
    this.parameterDefined = null;
  }
  static unless({ parameterDefined, reason = "" } = {}) {
    return $UseResult_unless(UseResult, { parameterDefined: parameterDefined, reason: reason });
  }
}

function $UseResult_unless($newTarget, { parameterDefined, reason = "" } = {}) {
  const $self = Object.create($newTarget.prototype);
  $self.parameterDefined = parameterDefined;
  $self.reason = reason;
  return $self;
}

class _AlwaysThrows {
}

class _AwaitNotRequired {
}

class _Checked {
}

class _DoNotStore {
}

class _DoNotSubmit {
}

class _Experimental {
}

class _Factory {
}

class _Internal {
}

class _IsTest {
}

class _IsTestGroup {
}

class _Literal {
}

class _MustBeConst {
}

class _MustBeOverridden {
}

class _MustCallSuper {
}

class _NonVirtual {
}

class _OptionalTypeArgs {
}

class _Protected {
}

class _Redeclare {
}

class _Reopen {
}

class _Sealed {
}

class _Virtual {
}

class _VisibleForOverriding {
}

class _VisibleForTesting {
}

class EventSinkBase {
  constructor() {
    this._closeMemo = new AsyncMemoizer();
  }
  get _closed() {
    return this._closeMemo.hasRun;
  }
  add(data) {
    this._checkCanAddEvent();
    this.onAdd(data);
  }
  onAdd(data) {
    throw new TypeError("Abstract member EventSinkBase.onAdd");
  }
  addError(error, stackTrace = null) {
    this._checkCanAddEvent();
    this.onError(error, stackTrace);
  }
  onError(error, stackTrace = null) {
    throw new TypeError("Abstract member EventSinkBase.onError");
  }
  close() {
    return this._closeMemo.runOnce(__dartBind(this, "onClose"));
  }
  onClose() {
    throw new TypeError("Abstract member EventSinkBase.onClose");
  }
  _checkCanAddEvent() {
    if (this._closed) {
      (() => { throw __dartCoreError("StateError", "Cannot add event after closing"); })();
    }
  }
}

class StreamSinkBase extends EventSinkBase {
  constructor() {
    super();
    this._addingStream = false;
  }
  get done() {
    return this._closeMemo.future;
  }
  addStream(stream) {
    this._checkCanAddEvent();
    this._addingStream = true;
    let completer = __dartCompleter();
    __dartStreamListen(stream, __dartBind(this, "onAdd"), __dartBind(this, "onError"), () => {
      this._addingStream = false;
      completer.complete();
}, false);
    return completer.future;
  }
  close() {
    if (this._addingStream) {
      (() => { throw __dartCoreError("StateError", "StreamSink is bound to a stream"); })();
    }
    return super.close();
  }
  _checkCanAddEvent() {
    super._checkCanAddEvent();
    if (this._addingStream) {
      (() => { throw __dartCoreError("StateError", "StreamSink is bound to a stream"); })();
    }
  }
}

class IOSinkBase extends StreamSinkBase {
  constructor(encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false))) {
    super();
    this.encoding = encoding;
  }
  flush() {
    if (this._addingStream) {
      (() => { throw __dartCoreError("StateError", "StreamSink is bound to a stream"); })();
    }
    if (this._closed) {
      return Promise.resolve(null);
    }
    this._addingStream = true;
    return this.onFlush().finally(() => {
      this._addingStream = false;
});
  }
  onFlush() {
    throw new TypeError("Abstract member IOSinkBase.onFlush");
  }
  write(object) {
    let string = __dartObjectToString(object);
    if (string.length === 0) {
      return;
    }
    this.add(this.encoding.encode(string));
  }
  writeAll(objects, separator_1 = "") {
    let first = true;
    {
      let _sync_for_iterator = __dartIterator(objects);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let object = _sync_for_iterator.current;
          {
            if (first) {
              {
                first = false;
              }
            } else {
              {
                this.write(separator_1);
              }
            }
            this.write(object);
          }
        }
      }
    }
  }
  writeln(object = "") {
    this.write(object);
    this.write("\n");
  }
  writeCharCode(charCode) {
    this.write(String.fromCodePoint(charCode));
  }
}

class StreamCloser {
  constructor() {
    this._subscriptions = (() => {
      const v = new Set();
      return v;
    })();
    this._controllers = (() => {
      const v = new Set();
      return v;
    })();
    this._closeFuture = null;
  }
  close() {
    return (this._closeFuture ?? (this._closeFuture = (() => {
      let futures = (() => {
        const v = new Array(0).fill(null);
        {
          let _sync_for_iterator = __dartIterator(this._subscriptions);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let subscription = _sync_for_iterator.current;
              (v.push(subscription.cancel()), null);
            }
          }
        }
        return v;
      })();
      this._subscriptions.clear();
      let controllers = Array.from(this._controllers);
      this._controllers.clear();
      __dartScheduleMicrotask(function() {
        {
          let _sync_for_iterator = __dartIterator(controllers);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let controller = _sync_for_iterator.current;
              {
                __dartScheduleMicrotask(__dartBind(controller, "close"));
              }
            }
          }
        }
});
      return __dartFutureWait(futures, true, null);
})()));
  }
  get isClosed() {
    return !((this._closeFuture === null));
  }
  bind(stream) {
    let controller = ((stream.isBroadcast === true) ? __dartStreamController(true, { onListen: null, onPause: null, onResume: null, onCancel: null }) : __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null }));
    controller.onListen = () => {
      if (this.isClosed) {
        {
          __dartStreamListen(stream, null, null, null, false).cancel().catch(function(_) {
});
          return;
        }
      }
      let subscription = __dartStreamListen(stream, __dartAs(__dartBind(controller, "add"), value => typeof value === "function", "void Function(StreamCloser.T%)"), __dartBind(controller, "addError"), null, false);
      subscription.onDone(() => {
        __dartSetRemove(this._subscriptions, subscription);
        __dartSetRemove(this._controllers, controller);
        controller.close();
});
      __dartSetAdd(this._subscriptions, subscription);
      if (!((stream.isBroadcast === true))) {
        {
          controller.onPause = __dartBind(subscription, "pause");
          controller.onResume = __dartBind(subscription, "resume");
        }
      }
      controller.onCancel = () => {
        __dartSetRemove(this._controllers, controller);
        if (__dartSetRemove(this._subscriptions, subscription)) {
          return subscription.cancel();
        }
        return null;
};
};
    if (this.isClosed) {
      {
        controller.close();
      }
    } else {
      {
        __dartSetAdd(this._controllers, controller);
      }
    }
    return controller.stream;
  }
}

class StreamGroup {
  constructor() {
    const $_controller = __dartLazyField("StreamGroup._controller", null, true);
    Object.defineProperty(this, "_controller", {
      get() { return $_controller.get(); },
      set(value) { $_controller.set(value); },
      enumerable: true,
    });
    this._closed = false;
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" })));
    this._onIdleController = null;
    this._subscriptions = new Map([]);
    this._controller = __dartStreamController(false, { onListen: __dartBind(this, "_onListen"), onPause: __dartBind(this, "_onPause"), onResume: __dartBind(this, "_onResume"), onCancel: __dartBind(this, "_onCancel") });
  }
  static broadcast() {
    return $StreamGroup_broadcast(StreamGroup);
  }
  get stream() {
    return this._controller.stream;
  }
  get isClosed() {
    return this._closed;
  }
  get isIdle() {
    return this._subscriptions.size === 0;
  }
  get onIdle() {
    return (this._onIdleController ?? (this._onIdleController = __dartStreamController(true, { onListen: null, onPause: null, onResume: null, onCancel: null }))).stream;
  }
  static merge(streams) {
    let group = new StreamGroup();
    (Array.from(streams).forEach(__dartAs(__dartBind(group, "add"), value => typeof value === "function", "Future<void>? Function(Stream<StreamGroup.merge.T%>)")), null);
    group.close();
    return group.stream;
  }
  static mergeBroadcast(streams) {
    let group = StreamGroup.broadcast();
    (Array.from(streams).forEach(__dartAs(__dartBind(group, "add"), value => typeof value === "function", "Future<void>? Function(Stream<StreamGroup.mergeBroadcast.T%>)")), null);
    group.close();
    return group.stream;
  }
  add(stream) {
    if (this._closed) {
      {
        (() => { throw __dartCoreError("StateError", "Can't add a Stream to a closed StreamGroup."); })();
      }
    }
    if (__dartEquals(this._state, __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" }))))) {
      {
        __dartMapPutIfAbsent(this._subscriptions, stream, function() { return null; });
      }
    } else {
      if (__dartEquals(this._state, __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"canceled\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "canceled" }))))) {
        {
          return __dartStreamListen(stream, null, null, null, false).cancel();
        }
      } else {
        {
          __dartMapPutIfAbsent(this._subscriptions, stream, () => { return this._listenToStream(stream); });
        }
      }
    }
    return null;
  }
  remove(stream) {
    let subscription = __dartMapRemove(this._subscriptions, stream);
    let future = ((subscription)?.cancel() ?? null);
    if (this._subscriptions.size === 0) {
      {
        ((this._onIdleController)?.add(null) ?? null);
        if (this._closed) {
          {
            ((this._onIdleController)?.close() ?? null);
            __dartScheduleMicrotask(__dartBind(this._controller, "close"));
          }
        }
      }
    }
    return future;
  }
  _onListen() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"listening\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "listening" })));
    {
      let _sync_for_iterator = __dartIterator((() => {
        const v = Array.from(Array.from(this._subscriptions, ([key, value]) => ({ key, value })));
        return v;
      })());
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let entry = _sync_for_iterator.current;
          L:
          {
            if (!((entry.value === null))) {
              break L;
            }
            let stream = entry.key;
            try {
              {
                __dartMapSet(this._subscriptions, stream, this._listenToStream(stream));
              }
            } catch ($error) {
              if ($error != null) {
                const error = $error;
                {
                  ((this._onCancel())?.catchError(function(_) {
}) ?? null);
                  (() => { throw $error; })();
                }
              } else {
                throw $error;
              }
            }
          }
        }
      }
    }
  }
  _onPause() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"paused\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "paused" })));
    {
      let _sync_for_iterator = __dartIterator(Array.from(this._subscriptions.values()));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let subscription = _sync_for_iterator.current;
          {
            __dartNullCheck(subscription).pause();
          }
        }
      }
    }
  }
  _onResume() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"listening\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "listening" })));
    {
      let _sync_for_iterator = __dartIterator(Array.from(this._subscriptions.values()));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let subscription = _sync_for_iterator.current;
          {
            __dartNullCheck(subscription).resume();
          }
        }
      }
    }
  }
  _onCancel() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"canceled\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "canceled" })));
    let futures = Array.from(Array.from(Array.from(Array.from(this._subscriptions, ([key, value]) => ({ key, value })), function(entry) {
      let subscription = entry.value;
      try {
        {
          if (!((subscription === null))) {
            return subscription.cancel();
          }
          return __dartStreamListen(entry.key, null, null, null, false).cancel();
        }
      } catch ($error) {
        if ($error != null) {
          const _ = $error;
          {
            return null;
          }
        } else {
          throw $error;
        }
      }
})).filter((value) => value != null));
    (this._subscriptions.clear(), null);
    let onIdleController = this._onIdleController;
    if ((!((onIdleController === null)) && !(onIdleController.isClosed))) {
      {
        onIdleController.add(null);
        onIdleController.close();
      }
    }
    return (futures.length === 0 ? null : __dartFutureWait(futures, false, null));
  }
  _onCancelBroadcast() {
    this._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" })));
    (this._subscriptions.forEach((value, key) => ((stream, subscription) => {
      if (!((stream.isBroadcast === true))) {
        return;
      }
      __dartNullCheck(subscription).cancel();
      __dartMapSet(this._subscriptions, stream, null);
})(key, value)), null);
  }
  _listenToStream(stream) {
    let subscription = __dartStreamListen(stream, __dartAs(__dartBind(this._controller, "add"), value => typeof value === "function", "void Function(StreamGroup.T%)"), __dartBind(this._controller, "addError"), () => { return this.remove(stream); }, false);
    if (__dartEquals(this._state, __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"paused\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "paused" }))))) {
      subscription.pause();
    }
    return subscription;
  }
  close() {
    if (this._closed) {
      return this._controller.done;
    }
    this._closed = true;
    if (this._subscriptions.size === 0) {
      {
        ((this._onIdleController)?.close() ?? null);
        this._controller.close();
        return this._controller.done;
      }
    }
    if ((this._controller.stream.isBroadcast === true)) {
      {
        let streamsToRemove = null;
        __dartMapUpdateAll(this._subscriptions, (stream, subscription) => {
          if (!((subscription === null))) {
            return subscription;
          }
          try {
            {
              return this._listenToStream(stream);
            }
          } catch ($error) {
            if ($error != null) {
              {
                ((streamsToRemove ?? (streamsToRemove = new Array(0).fill(null))).push(stream), null);
                return null;
              }
            } else {
              throw $error;
            }
          }
});
        ((streamsToRemove)?.forEach(__dartBind(this._subscriptions, "remove")) ?? null);
      }
    }
    return this._controller.done;
  }
}

function $StreamGroup_broadcast($newTarget) {
  const $self = Object.create($newTarget.prototype);
  const $_controller = __dartLazyField("StreamGroup._controller", null, true);
  Object.defineProperty($self, "_controller", {
    get() { return $_controller.get(); },
    set(value) { $_controller.set(value); },
    enumerable: true,
  });
  $self._closed = false;
  $self._state = __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" })));
  $self._onIdleController = null;
  $self._subscriptions = new Map([]);
  $self._controller = __dartStreamController(true, { onListen: __dartBind($self, "_onListen"), onPause: null, onResume: null, onCancel: __dartBind($self, "_onCancelBroadcast") });
  return $self;
}

class _StreamGroupState {
  constructor(name) {
    this.name = name;
  }
  toString() {
    return this.name;
  }
}

class StreamSplitter {
  constructor(_stream) {
    this._subscription = null;
    this._buffer = new Array(0).fill(null);
    this._controllers = (() => {
      const v = new Set();
      return v;
    })();
    this._closeGroup = new FutureGroup();
    this._isDone = false;
    this._isClosed = false;
    this._stream = _stream;
  }
  static splitFrom(stream, count = null) {
    ((count === null) ? count = 2 : null);
    let splitter = new StreamSplitter(stream);
    let streams = Array.from({ length: count }, (_, index) => (function(_) { return splitter.split(); })(index));
    splitter.close();
    return streams;
  }
  split() {
    if (this._isClosed) {
      {
        (() => { throw __dartCoreError("StateError", "Can't call split() on a closed StreamSplitter."); })();
      }
    }
    let controller = __dartStreamController(false, { onListen: __dartBind(this, "_onListen"), onPause: __dartBind(this, "_onPause"), onResume: __dartBind(this, "_onResume"), onCancel: null });
    controller.onCancel = () => { return this._onCancel(controller); };
    {
      let _sync_for_iterator = __dartIterator(this._buffer);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let result = _sync_for_iterator.current;
          {
            result.addTo(controller);
          }
        }
      }
    }
    if (this._isDone) {
      {
        this._closeGroup.add(controller.close());
      }
    } else {
      {
        __dartSetAdd(this._controllers, controller);
      }
    }
    return controller.stream;
  }
  close() {
    if (this._isClosed) {
      return this._closeGroup.future;
    }
    this._isClosed = true;
    (this._buffer.length = 0, null);
    if (__dartIterableIsEmpty(this._controllers)) {
      this._cancelSubscription();
    }
    return this._closeGroup.future;
  }
  _cancelSubscription() {
    let future = null;
    if (!((this._subscription === null))) {
      future = __dartNullCheck(this._subscription).cancel();
    }
    if (!((future === null))) {
      this._closeGroup.add(future);
    }
    this._closeGroup.close();
  }
  _onListen() {
    if (this._isDone) {
      return;
    }
    if (!((this._subscription === null))) {
      {
        __dartNullCheck(this._subscription).resume();
      }
    } else {
      {
        this._subscription = __dartStreamListen(this._stream, __dartBind(this, "_onData"), __dartBind(this, "_onError"), __dartBind(this, "_onDone"), false);
      }
    }
  }
  _onPause() {
    if (!(Array.from(this._controllers).every(function(controller) { return controller.isPaused; }))) {
      return;
    }
    __dartNullCheck(this._subscription).pause();
  }
  _onResume() {
    __dartNullCheck(this._subscription).resume();
  }
  _onCancel(controller) {
    __dartSetRemove(this._controllers, controller);
    if (!__dartIterableIsEmpty(this._controllers)) {
      return;
    }
    if (this._isClosed) {
      {
        this._cancelSubscription();
      }
    } else {
      {
        __dartNullCheck(this._subscription).pause();
      }
    }
  }
  _onData(data) {
    if (!(this._isClosed)) {
      (this._buffer.push(new ValueResult(data)), null);
    }
    {
      let _sync_for_iterator = __dartIterator(this._controllers);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let controller = _sync_for_iterator.current;
          {
            controller.add(data);
          }
        }
      }
    }
  }
  _onError(error, stackTrace) {
    if (!(this._isClosed)) {
      (this._buffer.push(Result.error(error, stackTrace)), null);
    }
    {
      let _sync_for_iterator = __dartIterator(this._controllers);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let controller = _sync_for_iterator.current;
          {
            controller.addError(error, stackTrace);
          }
        }
      }
    }
  }
  _onDone() {
    this._isDone = true;
    {
      let _sync_for_iterator = __dartIterator(this._controllers);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let controller = _sync_for_iterator.current;
          {
            this._closeGroup.add(controller.close());
          }
        }
      }
    }
  }
}

class SubscriptionStream {
  constructor(subscription) {
    this._source = subscription;
    let source = __dartNullCheck(this._source);
    source.pause();
    source.onData(null);
    source.onError(null);
    source.onDone(null);
  }
  listen(onData, { onError = null, onDone = null, cancelOnError = null } = {}) {
    let subscription = this._source;
    if ((subscription === null)) {
      {
        (() => { throw __dartCoreError("StateError", "Stream has already been listened to."); })();
      }
    }
    cancelOnError = __dartEquals(true, cancelOnError);
    this._source = null;
    let result = (cancelOnError ? new _CancelOnErrorSubscriptionWrapper(subscription) : subscription);
    result.onData(onData);
    result.onError(onError);
    result.onDone(onDone);
    subscription.resume();
    return result;
  }
}

class _CancelOnErrorSubscriptionWrapper extends DelegatingStreamSubscription {
  constructor(subscription) {
    super(subscription);
  }
  onError(handleError) {
    super.onError((error, stackTrace) => {
      super.cancel().finally(function() {
        if (typeof handleError === "function") {
          {
            (handleError)(error, stackTrace);
          }
        } else {
          if (typeof handleError === "function") {
            {
              (handleError)(error);
            }
          }
        }
});
});
  }
}

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

class StreamQueue {
  static _(_source) {
    return $StreamQueue__(StreamQueue, _source);
  }
  get eventsDispatched() {
    return (this._eventsReceived - this._eventQueue.length);
  }
  constructor(source) {
    return StreamQueue._(source);
  }
  get hasNext() {
    this._checkNotClosed();
    let hasNextRequest = new _HasNextRequest();
    this._addRequest(hasNextRequest);
    return hasNextRequest.future;
  }
  lookAhead(count) {
    __dartCheckNotNegative(count, "count", null);
    this._checkNotClosed();
    let request = new _LookAheadRequest(count);
    this._addRequest(request);
    return request.future;
  }
  get next() {
    this._checkNotClosed();
    let nextRequest = new _NextRequest();
    this._addRequest(nextRequest);
    return nextRequest.future;
  }
  get peek() {
    this._checkNotClosed();
    let nextRequest = new _PeekRequest();
    this._addRequest(nextRequest);
    return nextRequest.future;
  }
  get rest() {
    this._checkNotClosed();
    let request = new _RestRequest(this);
    this._isClosed = true;
    this._addRequest(request);
    return request.stream;
  }
  skip(count) {
    __dartCheckNotNegative(count, "count", null);
    this._checkNotClosed();
    let request = new _SkipRequest(count);
    this._addRequest(request);
    return request.future;
  }
  take(count) {
    __dartCheckNotNegative(count, "count", null);
    this._checkNotClosed();
    let request = new _TakeRequest(count);
    this._addRequest(request);
    return request.future;
  }
  startTransaction() {
    this._checkNotClosed();
    let request = new _TransactionRequest(this);
    this._addRequest(request);
    return request.transaction;
  }
  async withTransaction(callback) {
    let transaction = this.startTransaction();
    let queue = transaction.newQueue();
    let result = null;
    try {
      {
        result = await (callback)(queue);
      }
    } catch ($error) {
      if ($error != null) {
        const _ = $error;
        {
          transaction.commit(queue);
          (() => { throw $error; })();
        }
      } else {
        throw $error;
      }
    }
    if (result) {
      {
        transaction.commit(queue);
      }
    } else {
      {
        transaction.reject();
      }
    }
    return result;
  }
  cancelable(callback) {
    let transaction = this.startTransaction();
    let completer = new CancelableCompleter({ onCancel: function() {
      transaction.reject();
} });
    let queue = transaction.newQueue();
    completer.complete((callback)(queue).finally(function() {
      if (!(completer.isCanceled)) {
        transaction.commit(queue);
      }
}));
    return completer.operation;
  }
  cancel({ immediate = false } = {}) {
    this._checkNotClosed();
    this._isClosed = true;
    if (!(immediate)) {
      {
        let request = new _CancelRequest(this);
        this._addRequest(request);
        return request.future;
      }
    }
    if ((this._isDone && this._eventQueue.isEmpty)) {
      return Promise.resolve(null);
    }
    return this._cancel();
  }
  _updateRequests() {
    while (!__dartIterableIsEmpty(this._requestQueue)) {
      {
        if (__dartIterableFirst(this._requestQueue).update(this._eventQueue, this._isDone)) {
          {
            this._requestQueue.shift();
          }
        } else {
          {
            return;
          }
        }
      }
    }
    if (!(this._isDone)) {
      {
        this._pause();
      }
    }
  }
  _extractStream() {
    if (this._isDone) {
      {
        return __dartStreamFromIterable([], true);
      }
    }
    this._isDone = true;
    let subscription = this._subscription;
    if ((subscription === null)) {
      {
        return this._source;
      }
    }
    this._subscription = null;
    let wasPaused = subscription.isPaused;
    let result = new SubscriptionStream(subscription);
    if (wasPaused) {
      subscription.resume();
    }
    return result;
  }
  _pause() {
    __dartNullCheck(this._subscription).pause();
  }
  _ensureListening() {
    if (this._isDone) {
      return;
    }
    if ((this._subscription === null)) {
      {
        this._subscription = __dartStreamListen(this._source, (data) => {
          this._addResult(new ValueResult(data));
}, (error, stackTrace) => {
          this._addResult(Result.error(error, stackTrace));
}, () => {
          this._subscription = null;
          this._close();
}, false);
      }
    } else {
      {
        __dartNullCheck(this._subscription).resume();
      }
    }
  }
  _cancel() {
    if (this._isDone) {
      return null;
    }
    ((this._subscription === null) ? this._subscription = __dartStreamListen(this._source, null, null, null, false) : null);
    let future = __dartNullCheck(this._subscription).cancel();
    this._close();
    return future;
  }
  _addResult(result) {
    this._eventsReceived = (this._eventsReceived + 1);
    this._eventQueue.add(result);
    this._updateRequests();
  }
  _close() {
    this._isDone = true;
    this._updateRequests();
  }
  _checkNotClosed() {
    if (this._isClosed) {
      (() => { throw __dartCoreError("StateError", "Already cancelled"); })();
    }
  }
  _addRequest(request) {
    if (__dartIterableIsEmpty(this._requestQueue)) {
      {
        if (request.update(this._eventQueue, this._isDone)) {
          return;
        }
        this._ensureListening();
      }
    }
    (this._requestQueue.push(request), null);
  }
}

function $StreamQueue__($newTarget, _source) {
  const $self = Object.create($newTarget.prototype);
  $self._subscription = null;
  $self._isDone = false;
  $self._isClosed = false;
  $self._eventsReceived = 0;
  $self._eventQueue = new QueueList();
  $self._requestQueue = [];
  $self._source = _source;
  if (($self._source.isBroadcast === true)) {
    {
      $self._ensureListening();
      $self._pause();
    }
  }
  return $self;
}

class StreamQueueTransaction {
  constructor() {
    throw new TypeError("Class StreamQueueTransaction has no unnamed constructor");
  }
  static _(_parent, source) {
    return $StreamQueueTransaction__(StreamQueueTransaction, _parent, source);
  }
  newQueue() {
    let queue = new StreamQueue(this._splitter.split());
    __dartSetAdd(this._queues, queue);
    return queue;
  }
  commit(queue) {
    this._assertActive();
    if (!(__dartIterableContains(this._queues, queue))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Queue doesn't belong to this transaction."); })();
      }
    } else {
      if (!__dartIterableIsEmpty(queue._requestQueue)) {
        {
          (() => { throw __dartCoreError("StateError", "A queue with pending requests can't be committed."); })();
        }
      }
    }
    this._committed = true;
    for (let j = 0; (j < queue.eventsDispatched); j = (j + 1)) {
      {
        this._parent._eventQueue.removeFirst();
      }
    }
    this._done();
  }
  reject() {
    this._assertActive();
    this._rejected = true;
    this._done();
  }
  _done() {
    this._splitter.close();
    {
      let _sync_for_iterator = __dartIterator(this._queues);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let queue = _sync_for_iterator.current;
          {
            queue._cancel();
          }
        }
      }
    }
    let currentRequest = __dartIterableFirst(this._parent._requestQueue);
    if ((currentRequest instanceof _TransactionRequest && __dartEquals(currentRequest.transaction, this))) {
      {
        this._parent._requestQueue.shift();
        this._parent._updateRequests();
      }
    }
  }
  _assertActive() {
    if (this._committed) {
      {
        (() => { throw __dartCoreError("StateError", "This transaction has already been accepted."); })();
      }
    } else {
      if (this._rejected) {
        {
          (() => { throw __dartCoreError("StateError", "This transaction has already been rejected."); })();
        }
      }
    }
  }
}

function $StreamQueueTransaction__($newTarget, _parent, source) {
  const $self = Object.create($newTarget.prototype);
  $self._queues = (() => {
    const v = new Set();
    return v;
  })();
  $self._committed = false;
  $self._rejected = false;
  $self._parent = _parent;
  $self._splitter = new StreamSplitter(source);
  return $self;
}

class _EventRequest {
  constructor() {
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  update(events, isDone) {
    throw new TypeError("Abstract member _EventRequest.update");
  }
}
Object.defineProperty(_EventRequest, Symbol.hasInstance, { value(value) { return value != null && value[$_EventRequest_interface] === true; } });

class _NextRequest {
  constructor() {
    this._completer = __dartCompleter();
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    if (events.length !== 0) {
      {
        events.removeFirst().complete(this._completer);
        return true;
      }
    }
    if (isDone) {
      {
        this._completer.completeError(__dartCoreError("StateError", "No elements"), (new Error().stack ?? "<javascript stack unavailable>"));
        return true;
      }
    }
    return false;
  }
}

class _PeekRequest {
  constructor() {
    this._completer = __dartCompleter();
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    if (events.length !== 0) {
      {
        __dartIndexGet(events, 0).complete(this._completer);
        return true;
      }
    }
    if (isDone) {
      {
        this._completer.completeError(__dartCoreError("StateError", "No elements"), (new Error().stack ?? "<javascript stack unavailable>"));
        return true;
      }
    }
    return false;
  }
}

class _SkipRequest {
  constructor(_eventsToSkip) {
    this._completer = __dartCompleter();
    this._eventsToSkip = _eventsToSkip;
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    L:
    while ((this._eventsToSkip > 0)) {
      {
        if (events.length === 0) {
          {
            if (isDone) {
              break L;
            }
            return false;
          }
        }
        this._eventsToSkip = (this._eventsToSkip - 1);
        let event = events.removeFirst();
        if (event.isError) {
          {
            this._completer.completeError(__dartNullCheck(event.asError).error, __dartNullCheck(event.asError).stackTrace);
            return true;
          }
        }
      }
    }
    this._completer.complete(this._eventsToSkip);
    return true;
  }
}

class _ListRequest {
  constructor(_eventsToTake) {
    this._completer = __dartCompleter();
    this._list = new Array(0).fill(null);
    this._eventsToTake = _eventsToTake;
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  get future() {
    return this._completer.future;
  }
}

class _TakeRequest extends _ListRequest {
  constructor(eventsToTake) {
    super(eventsToTake);
  }
  update(events, isDone) {
    L:
    while ((this._list.length < this._eventsToTake)) {
      {
        if (events.length === 0) {
          {
            if (isDone) {
              break L;
            }
            return false;
          }
        }
        let event = events.removeFirst();
        if (event.isError) {
          {
            __dartNullCheck(event.asError).complete(this._completer);
            return true;
          }
        }
        (this._list.push(__dartNullCheck(event.asValue).value), null);
      }
    }
    this._completer.complete(this._list);
    return true;
  }
}

class _LookAheadRequest extends _ListRequest {
  constructor(eventsToTake) {
    super(eventsToTake);
  }
  update(events, isDone) {
    L:
    while ((this._list.length < this._eventsToTake)) {
      {
        if (__dartEquals(events.length, this._list.length)) {
          {
            if (isDone) {
              break L;
            }
            return false;
          }
        }
        let event = Array.from(events)[this._list.length];
        if (event.isError) {
          {
            __dartNullCheck(event.asError).complete(this._completer);
            return true;
          }
        }
        (this._list.push(__dartNullCheck(event.asValue).value), null);
      }
    }
    this._completer.complete(this._list);
    return true;
  }
}

class _CancelRequest {
  constructor(_streamQueue) {
    this._completer = __dartCompleter();
    this._streamQueue = _streamQueue;
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    if (this._streamQueue._isDone) {
      {
        this._completer.complete();
      }
    } else {
      {
        this._streamQueue._ensureListening();
        this._completer.complete(__dartStreamListen(this._streamQueue._extractStream(), null, null, null, false).cancel());
      }
    }
    return true;
  }
}

class _RestRequest {
  constructor(_streamQueue) {
    this._completer = new StreamCompleter();
    this._streamQueue = _streamQueue;
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  get stream() {
    return this._completer.stream;
  }
  update(events, isDone) {
    if (events.length === 0) {
      {
        if (this._streamQueue._isDone) {
          {
            this._completer.setEmpty();
          }
        } else {
          {
            this._completer.setSourceStream(this._streamQueue._extractStream());
          }
        }
      }
    } else {
      {
        let controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null });
        {
          let _sync_for_iterator = __dartIterator(events);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let event = _sync_for_iterator.current;
              {
                event.addTo(controller);
              }
            }
          }
        }
        controller.addStream(this._streamQueue._extractStream(), { cancelOnError: false }).finally(__dartBind(controller, "close"));
        this._completer.setSourceStream(controller.stream);
      }
    }
    return true;
  }
}

class _HasNextRequest {
  constructor() {
    this._completer = __dartCompleter();
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
  }
  get future() {
    return this._completer.future;
  }
  update(events, isDone) {
    if (events.length !== 0) {
      {
        this._completer.complete(true);
        return true;
      }
    }
    if (isDone) {
      {
        this._completer.complete(false);
        return true;
      }
    }
    return false;
  }
}

class _TransactionRequest {
  constructor(parent) {
    const $transaction = __dartLazyField("_TransactionRequest.transaction", null, "once");
    Object.defineProperty(this, "transaction", {
      get() { return $transaction.get(); },
      set(value) { $transaction.set(value); },
      enumerable: true,
    });
    this._controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null });
    this._eventsSent = 0;
    Object.defineProperty(this, $_EventRequest_interface, { value: true });
    this.transaction = StreamQueueTransaction._(parent, this._controller.stream);
  }
  update(events, isDone) {
    while ((this._eventsSent < events.length)) {
      {
        __dartIndexGet(events, (() => { let v = this._eventsSent; return (() => { let v_1 = this._eventsSent = (v + 1); return v; })(); })()).addTo(this._controller);
      }
    }
    if ((isDone && !(this._controller.isClosed))) {
      this._controller.close();
    }
    return (this.transaction._committed || this.transaction._rejected);
  }
}

class StreamSinkCompleter {
  constructor() {
    this.sink = new _CompleterSink();
  }
  get _sink() {
    return __dartAs(this.sink, value => value instanceof _CompleterSink, "_CompleterSink<StreamSinkCompleter.T%>");
  }
  static fromFuture(sinkFuture) {
    let completer = new StreamSinkCompleter();
    sinkFuture.then(__dartAs(__dartBind(completer, "setDestinationSink"), value => typeof value === "function", "void Function(StreamSink<StreamSinkCompleter.fromFuture.T%>)"), __dartBind(completer, "setError"));
    return completer.sink;
  }
  setDestinationSink(destinationSink) {
    if (!((this._sink._destinationSink === null))) {
      {
        (() => { throw __dartCoreError("StateError", "Destination sink already set"); })();
      }
    }
    this._sink._setDestinationSink(destinationSink);
  }
  setError(error, stackTrace = null) {
    this.setDestinationSink(NullStreamSink.error(error, stackTrace));
  }
}

class _CompleterSink {
  constructor() {
    this._controller = null;
    this._doneCompleter = null;
    this._destinationSink = null;
  }
  get _canSendDirectly() {
    return ((this._controller === null) && !((this._destinationSink === null)));
  }
  get done() {
    if (!((this._doneCompleter === null))) {
      return __dartNullCheck(this._doneCompleter).future;
    }
    if ((this._destinationSink === null)) {
      {
        this._doneCompleter = __dartCompleter();
        return __dartNullCheck(this._doneCompleter).future;
      }
    }
    return __dartNullCheck(this._destinationSink).done;
  }
  add(event) {
    if (this._canSendDirectly) {
      {
        __dartNullCheck(this._destinationSink).add(event);
      }
    } else {
      {
        this._ensureController().add(event);
      }
    }
  }
  addError(error, stackTrace = null) {
    if (this._canSendDirectly) {
      {
        __dartNullCheck(this._destinationSink).addError(error, stackTrace);
      }
    } else {
      {
        this._ensureController().addError(error, stackTrace);
      }
    }
  }
  addStream(stream) {
    if (this._canSendDirectly) {
      return __dartNullCheck(this._destinationSink).addStream(stream, { cancelOnError: false });
    }
    return this._ensureController().addStream(stream, { cancelOnError: false });
  }
  close() {
    if (this._canSendDirectly) {
      {
        __dartNullCheck(this._destinationSink).close();
      }
    } else {
      {
        this._ensureController().close();
      }
    }
    return this.done;
  }
  _ensureController() {
    return (this._controller ?? (this._controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null })));
  }
  _setDestinationSink(sink) {
    this._destinationSink = sink;
    if (!((this._controller === null))) {
      {
        sink.addStream(__dartNullCheck(this._controller).stream, { cancelOnError: false }).finally(__dartBind(sink, "close")).catch(function(_) {
});
      }
    }
    if (!((this._doneCompleter === null))) {
      {
        __dartNullCheck(this._doneCompleter).complete(sink.done);
      }
    }
  }
}

class RejectErrorsSink {
  constructor(_inner) {
    this._doneCompleter = __dartCompleter();
    this._closed = false;
    this._addStreamSubscription = null;
    this._addStreamCompleter = null;
    this._inner = _inner;
    this._inner.done.then((value) => {
      this._cancelAddStream();
      if (!(this._canceled)) {
        this._doneCompleter.complete(value);
      }
}).catch((error) => ((error, stackTrace) => {
      this._cancelAddStream();
      if (!(this._canceled)) {
        this._doneCompleter.completeError(error, stackTrace);
      }
})(error, error?.stack ?? "<javascript stack unavailable>"));
  }
  get done() {
    return this._doneCompleter.future;
  }
  get _inAddStream() {
    return !((this._addStreamSubscription === null));
  }
  get _canceled() {
    return this._doneCompleter.isCompleted;
  }
  add(data) {
    if (this._closed) {
      (() => { throw __dartCoreError("StateError", "Cannot add event after closing."); })();
    }
    if (this._inAddStream) {
      {
        (() => { throw __dartCoreError("StateError", "Cannot add event while adding stream."); })();
      }
    }
    if (this._canceled) {
      return;
    }
    this._inner.add(data);
  }
  addError(error, stackTrace = null) {
    if (this._closed) {
      (() => { throw __dartCoreError("StateError", "Cannot add event after closing."); })();
    }
    if (this._inAddStream) {
      {
        (() => { throw __dartCoreError("StateError", "Cannot add event while adding stream."); })();
      }
    }
    if (this._canceled) {
      return;
    }
    this._addError(error, stackTrace);
  }
  _addError(error, stackTrace = null) {
    this._cancelAddStream();
    this._doneCompleter.completeError(error, stackTrace);
    this._inner.close().catch(function(_) {
});
  }
  addStream(stream) {
    if (this._closed) {
      (() => { throw __dartCoreError("StateError", "Cannot add stream after closing."); })();
    }
    if (this._inAddStream) {
      {
        (() => { throw __dartCoreError("StateError", "Cannot add stream while adding stream."); })();
      }
    }
    if (this._canceled) {
      return Promise.resolve(null);
    }
    let addStreamCompleter = this._addStreamCompleter = __dartCompleter();
    this._addStreamSubscription = __dartStreamListen(stream, __dartAs(__dartBind(this._inner, "add"), value => typeof value === "function", "void Function(RejectErrorsSink.T%)"), __dartBind(this, "_addError"), __dartAs(__dartBind(addStreamCompleter, "complete"), value => typeof value === "function", "void Function([FutureOr<void>?])"), false);
    return addStreamCompleter.future.then((_) => {
      this._addStreamCompleter = null;
      this._addStreamSubscription = null;
});
  }
  close() {
    if (this._inAddStream) {
      {
        (() => { throw __dartCoreError("StateError", "Cannot close sink while adding stream."); })();
      }
    }
    if (this._closed) {
      return this.done;
    }
    this._closed = true;
    if (!(this._canceled)) {
      {
        this._doneCompleter.complete(this._inner.close());
      }
    }
    return this.done;
  }
  _cancelAddStream() {
    if (!(this._inAddStream)) {
      return;
    }
    __dartNullCheck(this._addStreamCompleter).complete(__dartNullCheck(this._addStreamSubscription).cancel());
    this._addStreamCompleter = null;
    this._addStreamSubscription = null;
  }
}

class _TransformedSubscription {
  constructor(_inner, _handleCancel, _handlePause, _handleResume) {
    this._cancelMemoizer = new AsyncMemoizer();
    this._inner = _inner;
    this._handleCancel = _handleCancel;
    this._handlePause = _handlePause;
    this._handleResume = _handleResume;
  }
  get isPaused() {
    return ((this._inner)?.isPaused ?? false);
  }
  onData(handleData) {
    ((this._inner)?.onData(handleData) ?? null);
  }
  onError(handleError) {
    ((this._inner)?.onError(handleError) ?? null);
  }
  onDone(handleDone) {
    ((this._inner)?.onDone(handleDone) ?? null);
  }
  cancel() {
    return this._cancelMemoizer.runOnce(() => {
      let inner = __dartNullCheck(this._inner);
      inner.onData(null);
      inner.onDone(null);
      inner.onError(function(_, __) {
});
      this._inner = null;
      return (() => { let v = inner; return (this._handleCancel)(v); })();
});
  }
  pause(resumeFuture = null) {
    if (this._cancelMemoizer.hasRun) {
      return;
    }
    if (!((resumeFuture === null))) {
      resumeFuture.finally(__dartBind(this, "resume"));
    }
    (() => { let v = __dartNullCheck(this._inner); return (this._handlePause)(v); })();
  }
  resume() {
    if (this._cancelMemoizer.hasRun) {
      return;
    }
    (() => { let v = __dartNullCheck(this._inner); return (this._handleResume)(v); })();
  }
  asFuture(futureValue = null) {
    return ((this._inner)?.asFuture(futureValue) ?? __dartCompleter().future);
  }
}

class StreamZip {
  constructor(streams) {
    this._streams = streams;
  }
  listen(onData, { onError = null, onDone = null, cancelOnError = null } = {}) {
    cancelOnError = Object.is(true, cancelOnError);
    let subscriptions = new Array(0).fill(null);
    const controller = __dartLazyField("controller", null, true, null);
    const current_1 = __dartLazyField("current", null, true, null);
    let dataCount = 0;
    function handleData(index, data) {
      __dartIndexSet(current_1.get(), index, data);
      dataCount = (dataCount + 1);
      if (__dartEquals(dataCount, subscriptions.length)) {
        {
          let data_1 = Array.from(current_1.get());
          current_1.set(__dartFixedList(new Array(subscriptions.length).fill(null)));
          dataCount = 0;
          for (let i = 0; (i < subscriptions.length); i = (i + 1)) {
            {
              if (!(__dartEquals(i, index))) {
                __dartIndexGet(subscriptions, i).resume();
              }
            }
          }
          controller.get().add(data_1);
        }
      } else {
        {
          __dartIndexGet(subscriptions, index).pause();
        }
      }
    }
    function handleError(error, stackTrace) {
      controller.get().addError(error, stackTrace);
    }
    function handleErrorCancel(error, stackTrace) {
      for (let i = 0; (i < subscriptions.length); i = (i + 1)) {
        {
          __dartIndexGet(subscriptions, i).cancel();
        }
      }
      controller.get().addError(error, stackTrace);
    }
    function handleDone() {
      for (let i = 0; (i < subscriptions.length); i = (i + 1)) {
        {
          __dartIndexGet(subscriptions, i).cancel();
        }
      }
      controller.get().close();
    }
    try {
      {
        {
          let _sync_for_iterator = __dartIterator(this._streams);
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let stream = _sync_for_iterator.current;
              {
                let index = subscriptions.length;
                (subscriptions.push(__dartStreamListen(stream, function(data) {
                  handleData(index, data);
}, (cancelOnError ? handleError : handleErrorCancel), handleDone, cancelOnError)), null);
              }
            }
          }
        }
      }
    } catch ($error) {
      if ($error != null) {
        const e = $error;
        {
          for (let i = (subscriptions.length - 1); (i >= 0); i = (i - 1)) {
            {
              __dartIndexGet(subscriptions, i).cancel();
            }
          }
          (() => { throw $error; })();
        }
      } else {
        throw $error;
      }
    }
    current_1.set(__dartFixedList(new Array(subscriptions.length).fill(null)));
    controller.set(__dartStreamController(false, { onListen: null, onPause: function() {
      for (let i = 0; (i < subscriptions.length); i = (i + 1)) {
        {
          __dartIndexGet(subscriptions, i).pause();
        }
      }
}, onResume: function() {
      for (let i = 0; (i < subscriptions.length); i = (i + 1)) {
        {
          __dartIndexGet(subscriptions, i).resume();
        }
      }
}, onCancel: function() {
      for (let i = 0; (i < subscriptions.length); i = (i + 1)) {
        {
          __dartIndexGet(subscriptions, i).cancel();
        }
      }
} }));
    if (subscriptions.length === 0) {
      {
        controller.get().close();
      }
    }
    return __dartStreamListen(controller.get().stream, onData, onError, onDone, cancelOnError);
  }
}

class _TypeSafeStreamTransformer {
  constructor(_inner) {
    this._inner = _inner;
  }
  bind(stream) {
    return __dartStreamCast(__dartStreamTransformerBind(this._inner, stream), (value) => true, "TypeParameterType(_TypeSafeStreamTransformer.T%)");
  }
}

class FileSystemEntity {
  constructor() {
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
  }
  get fileSystem() {
    throw new TypeError("Abstract member FileSystemEntity.fileSystem");
  }
  set fileSystem(value) {
    Object.defineProperty(this, "fileSystem", { value, writable: true, configurable: true, enumerable: true });
  }
  get basename() {
    throw new TypeError("Abstract member FileSystemEntity.basename");
  }
  set basename(value) {
    Object.defineProperty(this, "basename", { value, writable: true, configurable: true, enumerable: true });
  }
  get dirname() {
    throw new TypeError("Abstract member FileSystemEntity.dirname");
  }
  set dirname(value) {
    Object.defineProperty(this, "dirname", { value, writable: true, configurable: true, enumerable: true });
  }
  delete({ recursive = false } = {}) {
    throw new TypeError("Abstract member FileSystemEntity.delete");
  }
  get parent() {
    throw new TypeError("Abstract member FileSystemEntity.parent");
  }
  set parent(value) {
    Object.defineProperty(this, "parent", { value, writable: true, configurable: true, enumerable: true });
  }
}
Object.defineProperty(FileSystemEntity, Symbol.hasInstance, { value(value) { return value != null && value[$FileSystemEntity_interface] === true; } });

class ForwardingFileSystemEntity {
  constructor() {
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
    Object.defineProperty(this, $ForwardingFileSystemEntity_interface, { value: true });
  }
  get delegate() {
    throw new TypeError("Abstract member ForwardingFileSystemEntity.delegate");
  }
  set delegate(value) {
    Object.defineProperty(this, "delegate", { value, writable: true, configurable: true, enumerable: true });
  }
  wrap(delegate) {
    throw new TypeError("Abstract member ForwardingFileSystemEntity.wrap");
  }
  wrapDirectory(delegate) {
    throw new TypeError("Abstract member ForwardingFileSystemEntity.wrapDirectory");
  }
  wrapFile(delegate) {
    throw new TypeError("Abstract member ForwardingFileSystemEntity.wrapFile");
  }
  wrapLink(delegate) {
    throw new TypeError("Abstract member ForwardingFileSystemEntity.wrapLink");
  }
  get uri() {
    return this.delegate.uri;
  }
  exists() {
    return this.delegate.exists();
  }
  existsSync() {
    return this.delegate.existsSync();
  }
  async rename(newPath) {
    return this.wrap(__dartAs(await this.delegate.rename(newPath), value => value != null && typeof value === "object" && typeof value.path === "string", "D"));
  }
  renameSync(newPath) {
    return this.wrap(__dartAs(this.delegate.renameSync(newPath), value => value != null && typeof value === "object" && typeof value.path === "string", "D"));
  }
  resolveSymbolicLinks() {
    return this.delegate.resolveSymbolicLinks();
  }
  resolveSymbolicLinksSync() {
    return this.delegate.resolveSymbolicLinksSync();
  }
  stat() {
    return this.delegate.stat();
  }
  statSync() {
    return this.delegate.statSync();
  }
  async delete({ recursive = false } = {}) {
    return this.wrap(__dartAs(await this.delegate.delete({ recursive: recursive }), value => value != null && typeof value === "object" && typeof value.path === "string", "D"));
  }
  deleteSync({ recursive = false } = {}) {
    return this.delegate.deleteSync({ recursive: recursive });
  }
  watch({ events = 15, recursive = false } = {}) {
    return this.delegate.watch({ events: events, recursive: recursive });
  }
  get isAbsolute() {
    return this.delegate.isAbsolute;
  }
  get absolute() {
    return this.wrap(__dartAs(this.delegate.absolute, value => value != null && typeof value === "object" && typeof value.path === "string", "D"));
  }
  get parent() {
    return this.wrapDirectory(this.delegate.parent);
  }
  get path() {
    return this.delegate.path;
  }
  get basename() {
    return this.fileSystem.path.basename(this.path);
  }
  get dirname() {
    return this.fileSystem.path.dirname(this.path);
  }
}
Object.defineProperty(ForwardingFileSystemEntity, Symbol.hasInstance, { value(value) { return value != null && value[$ForwardingFileSystemEntity_interface] === true; } });

class Directory {
  constructor() {
    Object.defineProperty(this, $Directory_interface, { value: true });
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
  }
  create({ recursive = false } = {}) {
    throw new TypeError("Abstract member Directory.create");
  }
  createTemp(prefix = null) {
    throw new TypeError("Abstract member Directory.createTemp");
  }
  createTempSync(prefix = null) {
    throw new TypeError("Abstract member Directory.createTempSync");
  }
  rename(newPath) {
    throw new TypeError("Abstract member Directory.rename");
  }
  renameSync(newPath) {
    throw new TypeError("Abstract member Directory.renameSync");
  }
  get absolute() {
    throw new TypeError("Abstract member Directory.absolute");
  }
  set absolute(value) {
    Object.defineProperty(this, "absolute", { value, writable: true, configurable: true, enumerable: true });
  }
  list({ recursive = false, followLinks = true } = {}) {
    throw new TypeError("Abstract member Directory.list");
  }
  listSync({ recursive = false, followLinks = true } = {}) {
    throw new TypeError("Abstract member Directory.listSync");
  }
  childDirectory(basename_1) {
    throw new TypeError("Abstract member Directory.childDirectory");
  }
  childFile(basename_1) {
    throw new TypeError("Abstract member Directory.childFile");
  }
  childLink(basename_1) {
    throw new TypeError("Abstract member Directory.childLink");
  }
}
Object.defineProperty(Directory, Symbol.hasInstance, { value(value) { return value != null && value[$Directory_interface] === true; } });

class ForwardingDirectory {
  constructor() {
    Object.defineProperty(this, $Directory_interface, { value: true });
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
    Object.defineProperty(this, $ForwardingFileSystemEntity_interface, { value: true });
  }
  wrap(delegate) {
    return __dartAs(this.wrapDirectory(delegate), value => value instanceof Directory, "T");
  }
  async create({ recursive = false } = {}) {
    return this.wrap(await this.delegate.create({ recursive: recursive }));
  }
  createSync({ recursive = false } = {}) {
    return this.delegate.createSync({ recursive: recursive });
  }
  async createTemp(prefix = null) {
    return this.wrap(await this.delegate.createTemp(prefix));
  }
  createTempSync(prefix = null) {
    return this.wrap(this.delegate.createTempSync(prefix));
  }
  list({ recursive = false, followLinks = true } = {}) {
    return __dartStreamMap(this.delegate.list({ recursive: recursive, followLinks: followLinks }), __dartBind(this, "_wrap"));
  }
  listSync({ recursive = false, followLinks = true } = {}) {
    return Array.from(Array.from(this.delegate.listSync({ recursive: recursive, followLinks: followLinks }), __dartBind(this, "_wrap")));
  }
  _wrap(entity) {
    if (entity != null && typeof entity === "object" && typeof entity.path === "string") {
      {
        return this.wrapFile(entity);
      }
    } else {
      if (entity != null && typeof entity === "object" && typeof entity.path === "string") {
        {
          return this.wrapDirectory(entity);
        }
      } else {
        if (entity != null && typeof entity === "object" && typeof entity.path === "string") {
          {
            return this.wrapLink(entity);
          }
        }
      }
    }
    (() => { throw __dartIoFileSystemException("Unsupported type: " + __dartStr(entity), entity.path, null); })();
  }
}

class File {
  constructor() {
    Object.defineProperty(this, $File_interface, { value: true });
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
  }
  create({ recursive = false, exclusive = false } = {}) {
    throw new TypeError("Abstract member File.create");
  }
  rename(newPath) {
    throw new TypeError("Abstract member File.rename");
  }
  renameSync(newPath) {
    throw new TypeError("Abstract member File.renameSync");
  }
  copy(newPath) {
    throw new TypeError("Abstract member File.copy");
  }
  copySync(newPath) {
    throw new TypeError("Abstract member File.copySync");
  }
  get absolute() {
    throw new TypeError("Abstract member File.absolute");
  }
  set absolute(value) {
    Object.defineProperty(this, "absolute", { value, writable: true, configurable: true, enumerable: true });
  }
  writeAsBytes(bytes, { mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)), flush = false } = {}) {
    throw new TypeError("Abstract member File.writeAsBytes");
  }
  writeAsString(contents, { mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)), encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)), flush = false } = {}) {
    throw new TypeError("Abstract member File.writeAsString");
  }
}
Object.defineProperty(File, Symbol.hasInstance, { value(value) { return value != null && value[$File_interface] === true; } });

class ForwardingFile {
  constructor() {
    Object.defineProperty(this, $File_interface, { value: true });
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
    Object.defineProperty(this, $ForwardingFileSystemEntity_interface, { value: true });
  }
  wrap(delegate) {
    return __dartAs(this.wrapFile(delegate), value => value instanceof ForwardingFile, "ForwardingFile");
  }
  async create({ recursive = false, exclusive = false } = {}) {
    return this.wrap(await this.delegate.create({ recursive: recursive }));
  }
  createSync({ recursive = false, exclusive = false } = {}) {
    return this.delegate.createSync({ recursive: recursive });
  }
  async copy(newPath) {
    return this.wrap(await this.delegate.copy(newPath));
  }
  copySync(newPath) {
    return this.wrap(this.delegate.copySync(newPath));
  }
  length() {
    return this.delegate.length();
  }
  lengthSync() {
    return this.delegate.lengthSync();
  }
  lastAccessed() {
    return this.delegate.lastAccessed();
  }
  lastAccessedSync() {
    return this.delegate.lastAccessedSync();
  }
  setLastAccessed(time) {
    return this.delegate.setLastAccessed(time);
  }
  setLastAccessedSync(time) {
    return this.delegate.setLastAccessedSync(time);
  }
  lastModified() {
    return this.delegate.lastModified();
  }
  lastModifiedSync() {
    return this.delegate.lastModifiedSync();
  }
  setLastModified(time) {
    return this.delegate.setLastModified(time);
  }
  setLastModifiedSync(time) {
    return this.delegate.setLastModifiedSync(time);
  }
  open({ mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"0\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)) } = {}) {
    return this.delegate.open({ mode: mode });
  }
  openSync({ mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"0\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)) } = {}) {
    return this.delegate.openSync({ mode: mode });
  }
  openRead(start = null, end = null) {
    return this.delegate.openRead(start, end);
  }
  openWrite({ mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)), encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)) } = {}) {
    return this.delegate.openWrite({ mode: mode, encoding: encoding });
  }
  readAsBytes() {
    return this.delegate.readAsBytes();
  }
  readAsBytesSync() {
    return this.delegate.readAsBytesSync();
  }
  readAsString({ encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)) } = {}) {
    return this.delegate.readAsString({ encoding: encoding });
  }
  readAsStringSync({ encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)) } = {}) {
    return this.delegate.readAsStringSync({ encoding: encoding });
  }
  readAsLines({ encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)) } = {}) {
    return this.delegate.readAsLines({ encoding: encoding });
  }
  readAsLinesSync({ encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)) } = {}) {
    return this.delegate.readAsLinesSync({ encoding: encoding });
  }
  async writeAsBytes(bytes, { mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)), flush = false } = {}) {
    return this.wrap(await this.delegate.writeAsBytes(bytes, { mode: mode, flush: flush }));
  }
  writeAsBytesSync(bytes, { mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)), flush = false } = {}) {
    return this.delegate.writeAsBytesSync(bytes, { mode: mode, flush: flush });
  }
  async writeAsString(contents, { mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)), encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)), flush = false } = {}) {
    return this.wrap(await this.delegate.writeAsString(contents, { mode: mode, encoding: encoding, flush: flush }));
  }
  writeAsStringSync(contents, { mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)), encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)), flush = false } = {}) {
    return this.delegate.writeAsStringSync(contents, { mode: mode, encoding: encoding, flush: flush });
  }
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

class FileSystem {
  constructor() {
    Object.defineProperty(this, $FileSystem_interface, { value: true });
  }
  directory(path) {
    throw new TypeError("Abstract member FileSystem.directory");
  }
  file(path) {
    throw new TypeError("Abstract member FileSystem.file");
  }
  link(path) {
    throw new TypeError("Abstract member FileSystem.link");
  }
  get path() {
    throw new TypeError("Abstract member FileSystem.path");
  }
  set path(value) {
    Object.defineProperty(this, "path", { value, writable: true, configurable: true, enumerable: true });
  }
  get systemTempDirectory() {
    throw new TypeError("Abstract member FileSystem.systemTempDirectory");
  }
  set systemTempDirectory(value) {
    Object.defineProperty(this, "systemTempDirectory", { value, writable: true, configurable: true, enumerable: true });
  }
  get currentDirectory() {
    throw new TypeError("Abstract member FileSystem.currentDirectory");
  }
  set currentDirectory(value) {
    Object.defineProperty(this, "currentDirectory", { value, writable: true, configurable: true, enumerable: true });
  }
  stat(path) {
    throw new TypeError("Abstract member FileSystem.stat");
  }
  statSync(path) {
    throw new TypeError("Abstract member FileSystem.statSync");
  }
  identical(path1, path2) {
    throw new TypeError("Abstract member FileSystem.identical");
  }
  identicalSync(path1, path2) {
    throw new TypeError("Abstract member FileSystem.identicalSync");
  }
  get isWatchSupported() {
    throw new TypeError("Abstract member FileSystem.isWatchSupported");
  }
  set isWatchSupported(value) {
    Object.defineProperty(this, "isWatchSupported", { value, writable: true, configurable: true, enumerable: true });
  }
  type(path, { followLinks = true } = {}) {
    throw new TypeError("Abstract member FileSystem.type");
  }
  typeSync(path, { followLinks = true } = {}) {
    throw new TypeError("Abstract member FileSystem.typeSync");
  }
  async isFile(path) {
    return __dartEquals(await this.type(path), __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"0\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0)));
  }
  isFileSync(path) {
    return __dartEquals(this.typeSync(path), __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"0\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0)));
  }
  async isDirectory(path) {
    return __dartEquals(await this.type(path), __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0)));
  }
  isDirectorySync(path) {
    return __dartEquals(this.typeSync(path), __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0)));
  }
  async isLink(path) {
    return __dartEquals(await this.type(path, { followLinks: false }), __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"2\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0)));
  }
  isLinkSync(path) {
    return __dartEquals(this.typeSync(path, { followLinks: false }), __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"2\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0)));
  }
  getPath(path) {
    if (path != null && typeof path === "object" && typeof path.path === "string") {
      {
        return path.path;
      }
    } else {
      if (typeof path === "string") {
        {
          return path;
        }
      } else {
        if (path != null && typeof path === "object" && path.__dartType === "Uri") {
          {
            return this.path.fromUri(path);
          }
        } else {
          {
            (() => { throw __dartCoreError("ArgumentError", "Invalid type for \"path\": " + __dartStr(((path)?.runtimeType ?? null))); })();
          }
        }
      }
    }
  }
}
Object.defineProperty(FileSystem, Symbol.hasInstance, { value(value) { return value != null && value[$FileSystem_interface] === true; } });

class ForwardingFileSystem extends FileSystem {
  constructor(delegate) {
    super();
    this.delegate = delegate;
  }
  directory(path) {
    return this.delegate.directory(path);
  }
  file(path) {
    return this.delegate.file(path);
  }
  link(path) {
    return this.delegate.link(path);
  }
  get path() {
    return this.delegate.path;
  }
  get systemTempDirectory() {
    return this.delegate.systemTempDirectory;
  }
  get currentDirectory() {
    return this.delegate.currentDirectory;
  }
  set currentDirectory(path) {
    return this.delegate.currentDirectory = path;
  }
  stat(path) {
    return this.delegate.stat(path);
  }
  statSync(path) {
    return this.delegate.statSync(path);
  }
  identical(path1, path2) {
    return this.delegate.identical(path1, path2);
  }
  identicalSync(path1, path2) {
    return this.delegate.identicalSync(path1, path2);
  }
  get isWatchSupported() {
    return this.delegate.isWatchSupported;
  }
  type(path, { followLinks = true } = {}) {
    return this.delegate.type(path, { followLinks: followLinks });
  }
  typeSync(path, { followLinks = true } = {}) {
    return this.delegate.typeSync(path, { followLinks: followLinks });
  }
}

class Link {
  constructor() {
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
    Object.defineProperty(this, $Link_interface, { value: true });
  }
  create(target, { recursive = false } = {}) {
    throw new TypeError("Abstract member Link.create");
  }
  update(target) {
    throw new TypeError("Abstract member Link.update");
  }
  rename(newPath) {
    throw new TypeError("Abstract member Link.rename");
  }
  renameSync(newPath) {
    throw new TypeError("Abstract member Link.renameSync");
  }
  get absolute() {
    throw new TypeError("Abstract member Link.absolute");
  }
  set absolute(value) {
    Object.defineProperty(this, "absolute", { value, writable: true, configurable: true, enumerable: true });
  }
}
Object.defineProperty(Link, Symbol.hasInstance, { value(value) { return value != null && value[$Link_interface] === true; } });

class ForwardingLink {
  constructor() {
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
    Object.defineProperty(this, $ForwardingFileSystemEntity_interface, { value: true });
    Object.defineProperty(this, $Link_interface, { value: true });
  }
  wrap(delegate) {
    return __dartAs(this.wrapLink(delegate), value => value instanceof ForwardingLink, "ForwardingLink");
  }
  async create(target, { recursive = false } = {}) {
    return this.wrap(await this.delegate.create(target, { recursive: recursive }));
  }
  createSync(target, { recursive = false } = {}) {
    return this.delegate.createSync(target, { recursive: recursive });
  }
  async update(target) {
    return this.wrap(await this.delegate.update(target));
  }
  updateSync(target) {
    return this.delegate.updateSync(target);
  }
  target() {
    return this.delegate.target();
  }
  targetSync() {
    return this.delegate.targetSync();
  }
}

class ForwardingRandomAccessFile {
  constructor() {
  }
  get delegate() {
    throw new TypeError("Abstract member ForwardingRandomAccessFile.delegate");
  }
  set delegate(value) {
    Object.defineProperty(this, "delegate", { value, writable: true, configurable: true, enumerable: true });
  }
  get path() {
    return this.delegate.path;
  }
  close() {
    return this.delegate.close();
  }
  closeSync() {
    return this.delegate.closeSync();
  }
  async flush() {
    await this.delegate.flush();
    return this;
  }
  flushSync() {
    return this.delegate.flushSync();
  }
  length() {
    return this.delegate.length();
  }
  lengthSync() {
    return this.delegate.lengthSync();
  }
  async lock(mode = __dartConst("[\"instance\",\"dart:io::FileLock\",[\"field\",\"dart:io::FileLock::@fields::dart:io::_type\",[\"int\",\"2\"]]]", () => __dartIoEnum("FileLock", "FileLock", 0)), start = 0, end = -1) {
    await this.delegate.lock(mode, start, end);
    return this;
  }
  lockSync(mode = __dartConst("[\"instance\",\"dart:io::FileLock\",[\"field\",\"dart:io::FileLock::@fields::dart:io::_type\",[\"int\",\"2\"]]]", () => __dartIoEnum("FileLock", "FileLock", 0)), start = 0, end = -1) {
    return this.delegate.lockSync(mode, start, end);
  }
  position() {
    return this.delegate.position();
  }
  positionSync() {
    return this.delegate.positionSync();
  }
  read(bytes) {
    return this.delegate.read(bytes);
  }
  readSync(bytes) {
    return this.delegate.readSync(bytes);
  }
  readByte() {
    return this.delegate.readByte();
  }
  readByteSync() {
    return this.delegate.readByteSync();
  }
  readInto(buffer, start = 0, end = null) {
    return this.delegate.readInto(buffer, start, end);
  }
  readIntoSync(buffer, start = 0, end = null) {
    return this.delegate.readIntoSync(buffer, start, end);
  }
  async setPosition(position) {
    await this.delegate.setPosition(position);
    return this;
  }
  setPositionSync(position) {
    return this.delegate.setPositionSync(position);
  }
  async truncate(length) {
    await this.delegate.truncate(length);
    return this;
  }
  truncateSync(length) {
    return this.delegate.truncateSync(length);
  }
  async unlock(start = 0, end = -1) {
    await this.delegate.unlock(start, end);
    return this;
  }
  unlockSync(start = 0, end = -1) {
    return this.delegate.unlockSync(start, end);
  }
  async writeByte(value) {
    await this.delegate.writeByte(value);
    return this;
  }
  writeByteSync(value) {
    return this.delegate.writeByteSync(value);
  }
  async writeFrom(buffer, start = 0, end = null) {
    await this.delegate.writeFrom(buffer, start, end);
    return this;
  }
  writeFromSync(buffer, start = 0, end = null) {
    return this.delegate.writeFromSync(buffer, start, end);
  }
  async writeString(string, { encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)) } = {}) {
    await this.delegate.writeString(string, { encoding: encoding });
    return this;
  }
  writeStringSync(string, { encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)) } = {}) {
    return this.delegate.writeStringSync(string, { encoding: encoding });
  }
}

class ErrorCodes {
  constructor() {
    throw new TypeError("Class ErrorCodes has no unnamed constructor");
  }
  static _() {
    return $ErrorCodes__(ErrorCodes);
  }
  static get E2BIG() {
    return ErrorCodes._platform(function(codes) { return codes.e2big; });
  }
  static get EACCES() {
    return ErrorCodes._platform(function(codes) { return codes.eacces; });
  }
  static get EAGAIN() {
    return ErrorCodes._platform(function(codes) { return codes.eagain; });
  }
  static get EBADF() {
    return ErrorCodes._platform(function(codes) { return codes.ebadf; });
  }
  static get EBUSY() {
    return ErrorCodes._platform(function(codes) { return codes.ebusy; });
  }
  static get ECHILD() {
    return ErrorCodes._platform(function(codes) { return codes.echild; });
  }
  static get EDEADLK() {
    return ErrorCodes._platform(function(codes) { return codes.edeadlk; });
  }
  static get EDOM() {
    return ErrorCodes._platform(function(codes) { return codes.edom; });
  }
  static get EEXIST() {
    return ErrorCodes._platform(function(codes) { return codes.eexist; });
  }
  static get EFAULT() {
    return ErrorCodes._platform(function(codes) { return codes.efault; });
  }
  static get EFBIG() {
    return ErrorCodes._platform(function(codes) { return codes.efbig; });
  }
  static get EILSEQ() {
    return ErrorCodes._platform(function(codes) { return codes.eilseq; });
  }
  static get EINTR() {
    return ErrorCodes._platform(function(codes) { return codes.eintr; });
  }
  static get EINVAL() {
    return ErrorCodes._platform(function(codes) { return codes.einval; });
  }
  static get EIO() {
    return ErrorCodes._platform(function(codes) { return codes.eio; });
  }
  static get EISDIR() {
    return ErrorCodes._platform(function(codes) { return codes.eisdir; });
  }
  static get ELOOP() {
    return ErrorCodes._platform(function(codes) { return codes.eloop; });
  }
  static get EMFILE() {
    return ErrorCodes._platform(function(codes) { return codes.emfile; });
  }
  static get EMLINK() {
    return ErrorCodes._platform(function(codes) { return codes.emlink; });
  }
  static get ENAMETOOLONG() {
    return ErrorCodes._platform(function(codes) { return codes.enametoolong; });
  }
  static get ENFILE() {
    return ErrorCodes._platform(function(codes) { return codes.enfile; });
  }
  static get ENODEV() {
    return ErrorCodes._platform(function(codes) { return codes.enodev; });
  }
  static get ENOENT() {
    return ErrorCodes._platform(function(codes) { return codes.enoent; });
  }
  static get ENOEXEC() {
    return ErrorCodes._platform(function(codes) { return codes.enoexec; });
  }
  static get ENOLCK() {
    return ErrorCodes._platform(function(codes) { return codes.enolck; });
  }
  static get ENOMEM() {
    return ErrorCodes._platform(function(codes) { return codes.enomem; });
  }
  static get ENOSPC() {
    return ErrorCodes._platform(function(codes) { return codes.enospc; });
  }
  static get ENOSYS() {
    return ErrorCodes._platform(function(codes) { return codes.enosys; });
  }
  static get ENOTDIR() {
    return ErrorCodes._platform(function(codes) { return codes.enotdir; });
  }
  static get ENOTEMPTY() {
    return ErrorCodes._platform(function(codes) { return codes.enotempty; });
  }
  static get ENOTTY() {
    return ErrorCodes._platform(function(codes) { return codes.enotty; });
  }
  static get ENXIO() {
    return ErrorCodes._platform(function(codes) { return codes.enxio; });
  }
  static get EPERM() {
    return ErrorCodes._platform(function(codes) { return codes.eperm; });
  }
  static get EPIPE() {
    return ErrorCodes._platform(function(codes) { return codes.epipe; });
  }
  static get ERANGE() {
    return ErrorCodes._platform(function(codes) { return codes.erange; });
  }
  static get EROFS() {
    return ErrorCodes._platform(function(codes) { return codes.erofs; });
  }
  static get ESPIPE() {
    return ErrorCodes._platform(function(codes) { return codes.espipe; });
  }
  static get ESRCH() {
    return ErrorCodes._platform(function(codes) { return codes.esrch; });
  }
  static get EXDEV() {
    return ErrorCodes._platform(function(codes) { return codes.exdev; });
  }
  static _platform(getCode) {
    let codes = __dartNullCheck((__dartMapGet(__dartConst("[\"map\",\"InterfaceType(String)\",\"InterfaceType(_Codes)\",[[\"string\",\"linux\"],[\"instance\",\"class:_LinuxCodes\"]],[[\"string\",\"macos\"],[\"instance\",\"class:_MacOSCodes\"]],[[\"string\",\"windows\"],[\"instance\",\"class:_WindowsCodes\"]]]", () => __dartConstMap([["linux", __dartConst("[\"instance\",\"class:_LinuxCodes\"]", () => Object.freeze(Object.create(_LinuxCodes.prototype)))], ["macos", __dartConst("[\"instance\",\"class:_MacOSCodes\"]", () => Object.freeze(Object.create(_MacOSCodes.prototype)))], ["windows", __dartConst("[\"instance\",\"class:_WindowsCodes\"]", () => Object.freeze(Object.create(_WindowsCodes.prototype)))]])), operatingSystem) ?? __dartMapGet(__dartConst("[\"map\",\"InterfaceType(String)\",\"InterfaceType(_Codes)\",[[\"string\",\"linux\"],[\"instance\",\"class:_LinuxCodes\"]],[[\"string\",\"macos\"],[\"instance\",\"class:_MacOSCodes\"]],[[\"string\",\"windows\"],[\"instance\",\"class:_WindowsCodes\"]]]", () => __dartConstMap([["linux", __dartConst("[\"instance\",\"class:_LinuxCodes\"]", () => Object.freeze(Object.create(_LinuxCodes.prototype)))], ["macos", __dartConst("[\"instance\",\"class:_MacOSCodes\"]", () => Object.freeze(Object.create(_MacOSCodes.prototype)))], ["windows", __dartConst("[\"instance\",\"class:_WindowsCodes\"]", () => Object.freeze(Object.create(_WindowsCodes.prototype)))]])), "linux")));
    return (getCode)(codes);
  }
}

function $ErrorCodes__($newTarget) {
  const $self = Object.create($newTarget.prototype);
  return $self;
}

class _Codes {
  constructor() {
    Object.defineProperty(this, $_Codes_interface, { value: true });
  }
  get e2big() {
    throw new TypeError("Abstract member _Codes.e2big");
  }
  set e2big(value) {
    Object.defineProperty(this, "e2big", { value, writable: true, configurable: true, enumerable: true });
  }
  get eacces() {
    throw new TypeError("Abstract member _Codes.eacces");
  }
  set eacces(value) {
    Object.defineProperty(this, "eacces", { value, writable: true, configurable: true, enumerable: true });
  }
  get eagain() {
    throw new TypeError("Abstract member _Codes.eagain");
  }
  set eagain(value) {
    Object.defineProperty(this, "eagain", { value, writable: true, configurable: true, enumerable: true });
  }
  get ebadf() {
    throw new TypeError("Abstract member _Codes.ebadf");
  }
  set ebadf(value) {
    Object.defineProperty(this, "ebadf", { value, writable: true, configurable: true, enumerable: true });
  }
  get ebusy() {
    throw new TypeError("Abstract member _Codes.ebusy");
  }
  set ebusy(value) {
    Object.defineProperty(this, "ebusy", { value, writable: true, configurable: true, enumerable: true });
  }
  get echild() {
    throw new TypeError("Abstract member _Codes.echild");
  }
  set echild(value) {
    Object.defineProperty(this, "echild", { value, writable: true, configurable: true, enumerable: true });
  }
  get edeadlk() {
    throw new TypeError("Abstract member _Codes.edeadlk");
  }
  set edeadlk(value) {
    Object.defineProperty(this, "edeadlk", { value, writable: true, configurable: true, enumerable: true });
  }
  get edom() {
    throw new TypeError("Abstract member _Codes.edom");
  }
  set edom(value) {
    Object.defineProperty(this, "edom", { value, writable: true, configurable: true, enumerable: true });
  }
  get eexist() {
    throw new TypeError("Abstract member _Codes.eexist");
  }
  set eexist(value) {
    Object.defineProperty(this, "eexist", { value, writable: true, configurable: true, enumerable: true });
  }
  get efault() {
    throw new TypeError("Abstract member _Codes.efault");
  }
  set efault(value) {
    Object.defineProperty(this, "efault", { value, writable: true, configurable: true, enumerable: true });
  }
  get efbig() {
    throw new TypeError("Abstract member _Codes.efbig");
  }
  set efbig(value) {
    Object.defineProperty(this, "efbig", { value, writable: true, configurable: true, enumerable: true });
  }
  get eilseq() {
    throw new TypeError("Abstract member _Codes.eilseq");
  }
  set eilseq(value) {
    Object.defineProperty(this, "eilseq", { value, writable: true, configurable: true, enumerable: true });
  }
  get eintr() {
    throw new TypeError("Abstract member _Codes.eintr");
  }
  set eintr(value) {
    Object.defineProperty(this, "eintr", { value, writable: true, configurable: true, enumerable: true });
  }
  get einval() {
    throw new TypeError("Abstract member _Codes.einval");
  }
  set einval(value) {
    Object.defineProperty(this, "einval", { value, writable: true, configurable: true, enumerable: true });
  }
  get eio() {
    throw new TypeError("Abstract member _Codes.eio");
  }
  set eio(value) {
    Object.defineProperty(this, "eio", { value, writable: true, configurable: true, enumerable: true });
  }
  get eisdir() {
    throw new TypeError("Abstract member _Codes.eisdir");
  }
  set eisdir(value) {
    Object.defineProperty(this, "eisdir", { value, writable: true, configurable: true, enumerable: true });
  }
  get eloop() {
    throw new TypeError("Abstract member _Codes.eloop");
  }
  set eloop(value) {
    Object.defineProperty(this, "eloop", { value, writable: true, configurable: true, enumerable: true });
  }
  get emfile() {
    throw new TypeError("Abstract member _Codes.emfile");
  }
  set emfile(value) {
    Object.defineProperty(this, "emfile", { value, writable: true, configurable: true, enumerable: true });
  }
  get emlink() {
    throw new TypeError("Abstract member _Codes.emlink");
  }
  set emlink(value) {
    Object.defineProperty(this, "emlink", { value, writable: true, configurable: true, enumerable: true });
  }
  get enametoolong() {
    throw new TypeError("Abstract member _Codes.enametoolong");
  }
  set enametoolong(value) {
    Object.defineProperty(this, "enametoolong", { value, writable: true, configurable: true, enumerable: true });
  }
  get enfile() {
    throw new TypeError("Abstract member _Codes.enfile");
  }
  set enfile(value) {
    Object.defineProperty(this, "enfile", { value, writable: true, configurable: true, enumerable: true });
  }
  get enodev() {
    throw new TypeError("Abstract member _Codes.enodev");
  }
  set enodev(value) {
    Object.defineProperty(this, "enodev", { value, writable: true, configurable: true, enumerable: true });
  }
  get enoent() {
    throw new TypeError("Abstract member _Codes.enoent");
  }
  set enoent(value) {
    Object.defineProperty(this, "enoent", { value, writable: true, configurable: true, enumerable: true });
  }
  get enoexec() {
    throw new TypeError("Abstract member _Codes.enoexec");
  }
  set enoexec(value) {
    Object.defineProperty(this, "enoexec", { value, writable: true, configurable: true, enumerable: true });
  }
  get enolck() {
    throw new TypeError("Abstract member _Codes.enolck");
  }
  set enolck(value) {
    Object.defineProperty(this, "enolck", { value, writable: true, configurable: true, enumerable: true });
  }
  get enomem() {
    throw new TypeError("Abstract member _Codes.enomem");
  }
  set enomem(value) {
    Object.defineProperty(this, "enomem", { value, writable: true, configurable: true, enumerable: true });
  }
  get enospc() {
    throw new TypeError("Abstract member _Codes.enospc");
  }
  set enospc(value) {
    Object.defineProperty(this, "enospc", { value, writable: true, configurable: true, enumerable: true });
  }
  get enosys() {
    throw new TypeError("Abstract member _Codes.enosys");
  }
  set enosys(value) {
    Object.defineProperty(this, "enosys", { value, writable: true, configurable: true, enumerable: true });
  }
  get enotdir() {
    throw new TypeError("Abstract member _Codes.enotdir");
  }
  set enotdir(value) {
    Object.defineProperty(this, "enotdir", { value, writable: true, configurable: true, enumerable: true });
  }
  get enotempty() {
    throw new TypeError("Abstract member _Codes.enotempty");
  }
  set enotempty(value) {
    Object.defineProperty(this, "enotempty", { value, writable: true, configurable: true, enumerable: true });
  }
  get enotty() {
    throw new TypeError("Abstract member _Codes.enotty");
  }
  set enotty(value) {
    Object.defineProperty(this, "enotty", { value, writable: true, configurable: true, enumerable: true });
  }
  get enxio() {
    throw new TypeError("Abstract member _Codes.enxio");
  }
  set enxio(value) {
    Object.defineProperty(this, "enxio", { value, writable: true, configurable: true, enumerable: true });
  }
  get eperm() {
    throw new TypeError("Abstract member _Codes.eperm");
  }
  set eperm(value) {
    Object.defineProperty(this, "eperm", { value, writable: true, configurable: true, enumerable: true });
  }
  get epipe() {
    throw new TypeError("Abstract member _Codes.epipe");
  }
  set epipe(value) {
    Object.defineProperty(this, "epipe", { value, writable: true, configurable: true, enumerable: true });
  }
  get erange() {
    throw new TypeError("Abstract member _Codes.erange");
  }
  set erange(value) {
    Object.defineProperty(this, "erange", { value, writable: true, configurable: true, enumerable: true });
  }
  get erofs() {
    throw new TypeError("Abstract member _Codes.erofs");
  }
  set erofs(value) {
    Object.defineProperty(this, "erofs", { value, writable: true, configurable: true, enumerable: true });
  }
  get espipe() {
    throw new TypeError("Abstract member _Codes.espipe");
  }
  set espipe(value) {
    Object.defineProperty(this, "espipe", { value, writable: true, configurable: true, enumerable: true });
  }
  get esrch() {
    throw new TypeError("Abstract member _Codes.esrch");
  }
  set esrch(value) {
    Object.defineProperty(this, "esrch", { value, writable: true, configurable: true, enumerable: true });
  }
  get exdev() {
    throw new TypeError("Abstract member _Codes.exdev");
  }
  set exdev(value) {
    Object.defineProperty(this, "exdev", { value, writable: true, configurable: true, enumerable: true });
  }
}
Object.defineProperty(_Codes, Symbol.hasInstance, { value(value) { return value != null && value[$_Codes_interface] === true; } });

class _LinuxCodes {
  constructor() {
    Object.defineProperty(this, $_Codes_interface, { value: true });
  }
  get e2big() {
    return 7;
  }
  get eacces() {
    return 13;
  }
  get eagain() {
    return 11;
  }
  get ebadf() {
    return 9;
  }
  get ebusy() {
    return 16;
  }
  get echild() {
    return 10;
  }
  get edeadlk() {
    return 35;
  }
  get edom() {
    return 33;
  }
  get eexist() {
    return 17;
  }
  get efault() {
    return 14;
  }
  get efbig() {
    return 27;
  }
  get eilseq() {
    return 84;
  }
  get eintr() {
    return 4;
  }
  get einval() {
    return 22;
  }
  get eio() {
    return 5;
  }
  get eisdir() {
    return 21;
  }
  get eloop() {
    return 40;
  }
  get emfile() {
    return 24;
  }
  get emlink() {
    return 31;
  }
  get enametoolong() {
    return 36;
  }
  get enfile() {
    return 23;
  }
  get enodev() {
    return 19;
  }
  get enoent() {
    return 2;
  }
  get enoexec() {
    return 8;
  }
  get enolck() {
    return 37;
  }
  get enomem() {
    return 12;
  }
  get enospc() {
    return 28;
  }
  get enosys() {
    return 38;
  }
  get enotdir() {
    return 20;
  }
  get enotempty() {
    return 39;
  }
  get enotty() {
    return 25;
  }
  get enxio() {
    return 6;
  }
  get eperm() {
    return 1;
  }
  get epipe() {
    return 32;
  }
  get erange() {
    return 34;
  }
  get erofs() {
    return 30;
  }
  get espipe() {
    return 29;
  }
  get esrch() {
    return 3;
  }
  get exdev() {
    return 18;
  }
}

class _MacOSCodes {
  constructor() {
    Object.defineProperty(this, $_Codes_interface, { value: true });
  }
  get e2big() {
    return 7;
  }
  get eacces() {
    return 13;
  }
  get eagain() {
    return 35;
  }
  get ebadf() {
    return 9;
  }
  get ebusy() {
    return 16;
  }
  get echild() {
    return 10;
  }
  get edeadlk() {
    return 11;
  }
  get edom() {
    return 33;
  }
  get eexist() {
    return 17;
  }
  get efault() {
    return 14;
  }
  get efbig() {
    return 27;
  }
  get eilseq() {
    return 92;
  }
  get eintr() {
    return 4;
  }
  get einval() {
    return 22;
  }
  get eio() {
    return 5;
  }
  get eisdir() {
    return 21;
  }
  get eloop() {
    return 62;
  }
  get emfile() {
    return 24;
  }
  get emlink() {
    return 31;
  }
  get enametoolong() {
    return 63;
  }
  get enfile() {
    return 23;
  }
  get enodev() {
    return 19;
  }
  get enoent() {
    return 2;
  }
  get enoexec() {
    return 8;
  }
  get enolck() {
    return 77;
  }
  get enomem() {
    return 12;
  }
  get enospc() {
    return 28;
  }
  get enosys() {
    return 78;
  }
  get enotdir() {
    return 20;
  }
  get enotempty() {
    return 66;
  }
  get enotty() {
    return 25;
  }
  get enxio() {
    return 6;
  }
  get eperm() {
    return 1;
  }
  get epipe() {
    return 32;
  }
  get erange() {
    return 34;
  }
  get erofs() {
    return 30;
  }
  get espipe() {
    return 29;
  }
  get esrch() {
    return 3;
  }
  get exdev() {
    return 18;
  }
}

class _WindowsCodes {
  constructor() {
    Object.defineProperty(this, $_Codes_interface, { value: true });
  }
  get e2big() {
    return 7;
  }
  get eacces() {
    return 13;
  }
  get eagain() {
    return 11;
  }
  get ebadf() {
    return 9;
  }
  get ebusy() {
    return 16;
  }
  get echild() {
    return 10;
  }
  get edeadlk() {
    return 36;
  }
  get edom() {
    return 33;
  }
  get eexist() {
    return 17;
  }
  get efault() {
    return 14;
  }
  get efbig() {
    return 27;
  }
  get eilseq() {
    return 42;
  }
  get eintr() {
    return 4;
  }
  get einval() {
    return 22;
  }
  get eio() {
    return 5;
  }
  get eisdir() {
    return 21;
  }
  get eloop() {
    return (-1);
  }
  get emfile() {
    return 24;
  }
  get emlink() {
    return 31;
  }
  get enametoolong() {
    return 38;
  }
  get enfile() {
    return 23;
  }
  get enodev() {
    return 19;
  }
  get enoent() {
    return 2;
  }
  get enoexec() {
    return 8;
  }
  get enolck() {
    return 39;
  }
  get enomem() {
    return 12;
  }
  get enospc() {
    return 28;
  }
  get enosys() {
    return 40;
  }
  get enotdir() {
    return 20;
  }
  get enotempty() {
    return 41;
  }
  get enotty() {
    return 25;
  }
  get enxio() {
    return 6;
  }
  get eperm() {
    return 1;
  }
  get epipe() {
    return 32;
  }
  get erange() {
    return 34;
  }
  get erofs() {
    return 30;
  }
  get espipe() {
    return 29;
  }
  get esrch() {
    return 3;
  }
  get exdev() {
    return 18;
  }
}

class Clock {
  constructor() {
  }
  static realTime() {
    return new _RealtimeClock();
  }
  static monotonicTest() {
    return new _MonotonicTestClock();
  }
  get now() {
    throw new TypeError("Abstract member Clock.now");
  }
  set now(value) {
    Object.defineProperty(this, "now", { value, writable: true, configurable: true, enumerable: true });
  }
}

class _RealtimeClock extends Clock {
  constructor() {
    super();
  }
  get now() {
    return __dartDateTime(Date.now(), false);
  }
}

class _MonotonicTestClock extends Clock {
  constructor({ start = null } = {}) {
    super();
    this._current = (start ?? __dartDateTimeFromParts(false, 2000, 1, 1, 0, 0, 0, 0, 0));
  }
  get now() {
    this._current = this._current.add(__dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"60000000\"]]]", () => __dartDuration({ microseconds: 60000000 })));
    return this._current;
  }
}

class DirectoryAddOnsMixin {
  constructor() {
    Object.defineProperty(this, $Directory_interface, { value: true });
    Object.defineProperty(this, $DirectoryAddOnsMixin_interface, { value: true });
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
  }
  childDirectory(basename_1) {
    return this.fileSystem.directory(this.fileSystem.path.join(this.path, basename_1));
  }
  childFile(basename_1) {
    return this.fileSystem.file(this.fileSystem.path.join(this.path, basename_1));
  }
  childLink(basename_1) {
    return this.fileSystem.link(this.fileSystem.path.join(this.path, basename_1));
  }
}
Object.defineProperty(DirectoryAddOnsMixin, Symbol.hasInstance, { value(value) { return value != null && value[$DirectoryAddOnsMixin_interface] === true; } });

class MemoryFileStat {
  constructor(changed, modified, accessed, type, mode, size) {
    this.changed = changed;
    this.modified = modified;
    this.accessed = accessed;
    this.type = type;
    this.mode = mode;
    this.size = size;
  }
  static _internalNotFound() {
    return $MemoryFileStat__internalNotFound(MemoryFileStat);
  }
  modeString() {
    let permissions = (this.mode & 4095);
    let codes = __dartConst("[\"list\",\"InterfaceType(String)\",[\"string\",\"---\"],[\"string\",\"--x\"],[\"string\",\"-w-\"],[\"string\",\"-wx\"],[\"string\",\"r--\"],[\"string\",\"r-x\"],[\"string\",\"rw-\"],[\"string\",\"rwx\"]]", () => Object.freeze(["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"]));
    let result = new Array(0).fill(null);
    (() => { let v = result; return (() => {
      (v.push(__dartIndexGet(codes, (__dartShr(permissions, 6) & 7))), null);
      (v.push(__dartIndexGet(codes, (__dartShr(permissions, 3) & 7))), null);
      (v.push(__dartIndexGet(codes, (permissions & 7))), null);
      return v;
    })(); })();
    return __dartIterableJoin(result, "");
  }
}

function $MemoryFileStat__internalNotFound($newTarget) {
  const $self = Object.create($newTarget.prototype);
  $self.changed = __dartDateTimeFromParts(false, 0, 1, 1, 0, 0, 0, 0, 0);
  $self.modified = __dartDateTimeFromParts(false, 0, 1, 1, 0, 0, 0, 0, 0);
  $self.accessed = __dartDateTimeFromParts(false, 0, 1, 1, 0, 0, 0, 0, 0);
  $self.type = __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"5\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0));
  $self.mode = 0;
  $self.size = (-1);
  return $self;
}

class FileSystemOp {
  constructor() {
    throw new TypeError("Class FileSystemOp has no unnamed constructor");
  }
  static _(_value) {
    return $FileSystemOp__(FileSystemOp, _value);
  }
  toString() {
    L:
    switch (this._value) {
      case 0:
        {
          return "FileSystemOp.read";
        }
      case 1:
        {
          return "FileSystemOp.write";
        }
      case 2:
        {
          return "FileSystemOp.delete";
        }
      case 3:
        {
          return "FileSystemOp.create";
        }
      case 4:
        {
          return "FileSystemOp.open";
        }
      case 5:
        {
          return "FileSystemOp.copy";
        }
      case 6:
        {
          return "FileSystemOp.exists";
        }
      default:
        {
          (() => { throw __dartCoreError("StateError", "Invalid FileSytemOp type: " + __dartStr(this)); })();
        }
    }
  }
}

function $FileSystemOp__($newTarget, _value) {
  const $self = Object.create($newTarget.prototype);
  $self._value = _value;
  return $self;
}

class FileSystemStyle {
  constructor() {
    if (new.target === FileSystemStyle) {
      throw new TypeError("Class FileSystemStyle has no unnamed constructor");
    }
  }
  static _() {
    return $FileSystemStyle__(FileSystemStyle);
  }
  get drive() {
    throw new TypeError("Abstract member FileSystemStyle.drive");
  }
  set drive(value) {
    Object.defineProperty(this, "drive", { value, writable: true, configurable: true, enumerable: true });
  }
  get separator() {
    throw new TypeError("Abstract member FileSystemStyle.separator");
  }
  set separator(value) {
    Object.defineProperty(this, "separator", { value, writable: true, configurable: true, enumerable: true });
  }
  get root() {
    return __dartStr(this.drive) + __dartStr(this.separator);
  }
  contextFor(path) {
    throw new TypeError("Abstract member FileSystemStyle.contextFor");
  }
}

function $FileSystemStyle__($newTarget) {
  const $self = Object.create($newTarget.prototype);
  return $self;
}

class _Posix extends FileSystemStyle {
  constructor() {
    const $self = $FileSystemStyle__(new.target);
    return $self;
  }
  get drive() {
    return "";
  }
  get separator() {
    return Style.posix.separator;
  }
  contextFor(path) {
    return new Context({ style: Style.posix, current: path });
  }
}

class _Windows extends FileSystemStyle {
  constructor() {
    const $self = $FileSystemStyle__(new.target);
    return $self;
  }
  get drive() {
    return "C:";
  }
  get separator() {
    return Style.windows.separator;
  }
  contextFor(path) {
    return new Context({ style: Style.windows, current: path });
  }
}

class StyleableFileSystem {
  constructor() {
    Object.defineProperty(this, $FileSystem_interface, { value: true });
    Object.defineProperty(this, $StyleableFileSystem_interface, { value: true });
  }
  get style() {
    throw new TypeError("Abstract member StyleableFileSystem.style");
  }
  set style(value) {
    Object.defineProperty(this, "style", { value, writable: true, configurable: true, enumerable: true });
  }
}
Object.defineProperty(StyleableFileSystem, Symbol.hasInstance, { value(value) { return value != null && value[$StyleableFileSystem_interface] === true; } });

class NodeBasedFileSystem {
  constructor() {
    Object.defineProperty(this, $FileSystem_interface, { value: true });
    Object.defineProperty(this, $NodeBasedFileSystem_interface, { value: true });
    Object.defineProperty(this, $StyleableFileSystem_interface, { value: true });
  }
  get opHandle() {
    throw new TypeError("Abstract member NodeBasedFileSystem.opHandle");
  }
  set opHandle(value) {
    Object.defineProperty(this, "opHandle", { value, writable: true, configurable: true, enumerable: true });
  }
  get root() {
    throw new TypeError("Abstract member NodeBasedFileSystem.root");
  }
  set root(value) {
    Object.defineProperty(this, "root", { value, writable: true, configurable: true, enumerable: true });
  }
  get cwd() {
    throw new TypeError("Abstract member NodeBasedFileSystem.cwd");
  }
  set cwd(value) {
    Object.defineProperty(this, "cwd", { value, writable: true, configurable: true, enumerable: true });
  }
  get clock() {
    throw new TypeError("Abstract member NodeBasedFileSystem.clock");
  }
  set clock(value) {
    Object.defineProperty(this, "clock", { value, writable: true, configurable: true, enumerable: true });
  }
  findNode(path, { reference = null, segmentVisitor = null, visitLinks = false, pathWithSymlinks = null, followTailLink = false } = {}) {
    throw new TypeError("Abstract member NodeBasedFileSystem.findNode");
  }
}
Object.defineProperty(NodeBasedFileSystem, Symbol.hasInstance, { value(value) { return value != null && value[$NodeBasedFileSystem_interface] === true; } });

class Node {
  constructor(_parent) {
    this._parent = _parent;
    if (((this._parent === null) && !(this.isRoot))) {
      {
        (() => { throw __dartConst("[\"instance\",\"dart:io::FileSystemException\",[\"field\",\"dart:io::FileSystemException::@fields::message\",[\"string\",\"All nodes must have a parent.\"]],[\"field\",\"dart:io::FileSystemException::@fields::osError\",[\"null\"]],[\"field\",\"dart:io::FileSystemException::@fields::path\",[\"string\",\"\"]]]", () => __dartIoFileSystemException("All nodes must have a parent.", "", null)); })();
      }
    }
  }
  get parent() {
    return __dartNullCheck(this._parent);
  }
  set parent(parent) {
    let ancestor = parent;
    while (!(ancestor.isRoot)) {
      {
        if (__dartEquals(ancestor, this)) {
          {
            (() => { throw __dartConst("[\"instance\",\"dart:io::FileSystemException\",[\"field\",\"dart:io::FileSystemException::@fields::message\",[\"string\",\"A directory cannot be its own ancestor.\"]],[\"field\",\"dart:io::FileSystemException::@fields::osError\",[\"null\"]],[\"field\",\"dart:io::FileSystemException::@fields::path\",[\"string\",\"\"]]]", () => __dartIoFileSystemException("A directory cannot be its own ancestor.", "", null)); })();
          }
        }
        ancestor = ancestor.parent;
      }
    }
    this._parent = parent;
  }
  get type() {
    throw new TypeError("Abstract member Node.type");
  }
  set type(value) {
    Object.defineProperty(this, "type", { value, writable: true, configurable: true, enumerable: true });
  }
  get stat() {
    throw new TypeError("Abstract member Node.stat");
  }
  set stat(value) {
    Object.defineProperty(this, "stat", { value, writable: true, configurable: true, enumerable: true });
  }
  get directory() {
    return __dartNullCheck(this._parent);
  }
  get isRoot() {
    return false;
  }
  get fs() {
    return __dartNullCheck(this._parent).fs;
  }
}

class RealNode extends Node {
  constructor(parent) {
    super(parent);
    const $changed = __dartLazyField("RealNode.changed", null, true);
    Object.defineProperty(this, "changed", {
      get() { return $changed.get(); },
      set(value) { $changed.set(value); },
      enumerable: true,
    });
    const $modified = __dartLazyField("RealNode.modified", null, true);
    Object.defineProperty(this, "modified", {
      get() { return $modified.get(); },
      set(value) { $modified.set(value); },
      enumerable: true,
    });
    const $accessed = __dartLazyField("RealNode.accessed", null, true);
    Object.defineProperty(this, "accessed", {
      get() { return $accessed.get(); },
      set(value) { $accessed.set(value); },
      enumerable: true,
    });
    this.mode = 1911;
    let now = this.clock.now.millisecondsSinceEpoch;
    this.changed = now;
    this.modified = now;
    this.accessed = now;
  }
  get clock() {
    return this.parent.clock;
  }
  get stat() {
    return new MemoryFileStat(__dartDateTime(this.changed, false), __dartDateTime(this.modified, false), __dartDateTime(this.accessed, false), this.type, this.mode, this.size);
  }
  get size() {
    throw new TypeError("Abstract member RealNode.size");
  }
  set size(value) {
    Object.defineProperty(this, "size", { value, writable: true, configurable: true, enumerable: true });
  }
  touch() {
    this.modified = this.clock.now.millisecondsSinceEpoch;
  }
}

class DirectoryNode extends RealNode {
  constructor(parent) {
    super(parent);
    this.children = new Map([]);
  }
  get type() {
    return __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0));
  }
  get directory() {
    return this;
  }
  get size() {
    return 0;
  }
}

class RootNode extends DirectoryNode {
  constructor(fs) {
    super(null);
    this.fs = fs;
  }
  get clock() {
    return this.fs.clock;
  }
  get parent() {
    return this;
  }
  get isRoot() {
    return true;
  }
  set parent(parent) {
    return (() => { throw __dartCoreError("UnsupportedError", "Cannot set the parent of the root directory."); })();
  }
}

class FileNode extends RealNode {
  constructor(parent) {
    super(parent);
    this._content = new Uint8Array(0);
  }
  get content() {
    return this._content;
  }
  get type() {
    return __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"0\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0));
  }
  get size() {
    return this._content.length;
  }
  write(bytes) {
    let existing = this._content;
    this._content = new Uint8Array((existing.length + bytes.length));
    __dartListSetRange(this._content, 0, existing.length, existing, 0);
    __dartListSetRange(this._content, existing.length, this._content.length, bytes, 0);
  }
  truncate(length) {
    this._content = this._content.slice(0, length);
  }
  clear() {
    this._content = new Uint8Array(0);
  }
  copyFrom(source) {
    this.modified = this.changed = this.clock.now.millisecondsSinceEpoch;
    this.accessed = source.accessed;
    this.mode = source.mode;
    this._content = Uint8Array.from(source.content);
  }
}

class LinkNode extends Node {
  constructor(parent, target) {
    super(parent);
    this._reentrant = false;
    this.target = target;
  }
  getReferent({ tailVisitor = null } = {}) {
    let referent = this.fs.findNode(this.target, { reference: this, segmentVisitor: function(parent, childName, child, currentSegment, finalSegment) {
      if ((!((tailVisitor === null)) && __dartEquals(currentSegment, finalSegment))) {
        {
          child = (tailVisitor)(parent, childName, child);
        }
      }
      return child;
} });
    checkExists(referent, () => { return this.target; });
    return __dartNullCheck(referent);
  }
  get referentOrNull() {
    try {
      {
        return this.getReferent();
      }
    } catch ($error) {
      if ($error instanceof Error || ($error != null && typeof $error === "object" && "message" in $error)) {
        {
          return null;
        }
      } else {
        throw $error;
      }
    }
  }
  get type() {
    return __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"2\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0));
  }
  get stat() {
    if (this._reentrant) {
      {
        return MemoryFileStat.notFound;
      }
    }
    this._reentrant = true;
    try {
      {
        let node = this.referentOrNull;
        return ((node === null) ? MemoryFileStat.notFound : node.stat);
      }
    } finally {
      {
        this._reentrant = false;
      }
    }
  }
}

class MemoryFileSystemEntity {
  constructor(fileSystem, path) {
    this.fileSystem = fileSystem;
    this.path = path;
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
  }
  get dirname() {
    return this.fileSystem.path.dirname(this.path);
  }
  get basename() {
    return this.fileSystem.path.basename(this.path);
  }
  get expectedType() {
    throw new TypeError("Abstract member MemoryFileSystemEntity.expectedType");
  }
  set expectedType(value) {
    Object.defineProperty(this, "expectedType", { value, writable: true, configurable: true, enumerable: true });
  }
  get backingOrNull() {
    try {
      {
        return this.fileSystem.findNode(this.path);
      }
    } catch ($error) {
      if ($error instanceof Error || ($error != null && typeof $error === "object" && "message" in $error)) {
        {
          return null;
        }
      } else {
        throw $error;
      }
    }
  }
  get backing() {
    let node = this.fileSystem.findNode(this.path);
    checkExists(node, () => { return this.path; });
    return __dartNullCheck(node);
  }
  get resolvedBacking() {
    let node = this.backing;
    node = (isLink(node) ? resolveLinks(__dartAs(node, value => value instanceof LinkNode, "LinkNode"), () => { return this.path; }) : node);
    checkType(this.expectedType, node.type, () => { return this.path; });
    return node;
  }
  defaultCheckType(node) {
    checkType(this.expectedType, node.stat.type, () => { return this.path; });
  }
  get uri() {
    return __dartUriFile(this.path, __dartEquals(this.fileSystem.style, __dartConst("[\"instance\",\"class:_Windows\"]", () => Object.freeze(Object.create(_Windows.prototype)))), false);
  }
  async exists() {
    return this.existsSync();
  }
  async resolveSymbolicLinks() {
    return this.resolveSymbolicLinksSync();
  }
  resolveSymbolicLinksSync() {
    if (this.path.length === 0) {
      {
        (() => { throw noSuchFileOrDirectory(this.path); })();
      }
    }
    let ledger = new Array(0).fill(null);
    if (this.isAbsolute) {
      {
        (ledger.push(this.fileSystem.style.drive), null);
      }
    }
    let node = this.fileSystem.findNode(this.path, { pathWithSymlinks: ledger, followTailLink: true });
    checkExists(node, () => { return this.path; });
    let resolved = __dartIterableJoin(ledger, this.fileSystem.path.separator);
    if (__dartEquals(resolved, this.fileSystem.style.drive)) {
      {
        resolved = this.fileSystem.style.root;
      }
    } else {
      if (!(this.fileSystem.path.isAbsolute(resolved))) {
        {
          resolved = ((this.fileSystem.cwd + this.fileSystem.path.separator) + resolved);
        }
      }
    }
    return this.fileSystem.path.normalize(resolved);
  }
  stat() {
    return this.fileSystem.stat(this.path);
  }
  statSync() {
    return this.fileSystem.statSync(this.path);
  }
  async delete({ recursive = false } = {}) {
    this.deleteSync({ recursive: recursive });
    return this;
  }
  deleteSync({ recursive = false } = {}) {
    return this.internalDeleteSync({ recursive: recursive });
  }
  watch({ events = 15, recursive = false } = {}) {
    return (() => { throw __dartCoreError("UnsupportedError", "Watching not supported in MemoryFileSystem"); })();
  }
  get isAbsolute() {
    return this.fileSystem.path.isAbsolute(this.path);
  }
  get absolute() {
    let absolutePath = this.path;
    if (!(this.fileSystem.path.isAbsolute(absolutePath))) {
      {
        absolutePath = this.fileSystem.path.join(this.fileSystem.cwd, absolutePath);
      }
    }
    return this.clone(absolutePath);
  }
  get parent() {
    return new MemoryDirectory(this.fileSystem, this.dirname);
  }
  internalCreateSync({ createChild, followTailLink = false, visitLinks = false } = {}) {
    return this.fileSystem.findNode(this.path, { followTailLink: followTailLink, visitLinks: visitLinks, segmentVisitor: function(parent, childName, child, currentSegment, finalSegment) {
      if ((child === null)) {
        {
          child = (createChild)(parent, __dartEquals(currentSegment, finalSegment));
          if (!((child === null))) {
            {
              __dartMapSet(parent.children, childName, child);
            }
          }
        }
      }
      return child;
} });
  }
  internalRenameSync(newPath, { validateOverwriteExistingEntity = null, followTailLink = false, checkType: checkType_1 = null } = {}) {
    let node = this.backing;
    ((checkType_1 ?? __dartBind(this, "defaultCheckType")))(node);
    this.fileSystem.findNode(newPath, { segmentVisitor: (parent, childName, child, currentSegment, finalSegment) => {
      if (__dartEquals(currentSegment, finalSegment)) {
        {
          if (!((child === null))) {
            {
              if (followTailLink) {
                {
                  let childType = child.stat.type;
                  if (!(__dartEquals(childType, __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"5\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0))))) {
                    {
                      checkType(this.expectedType, child.stat.type, function() { return newPath; });
                    }
                  }
                }
              } else {
                {
                  checkType(this.expectedType, child.type, function() { return newPath; });
                }
              }
              if (!((validateOverwriteExistingEntity === null))) {
                {
                  (validateOverwriteExistingEntity)(__dartAs(child, value => value instanceof Node, "T"));
                }
              }
              __dartMapRemove(parent.children, childName);
            }
          }
          __dartMapRemove(node.parent.children, this.basename);
          __dartMapSet(parent.children, childName, node);
          node.parent = parent;
        }
      }
      return child;
} });
    return this.clone(newPath);
  }
  internalDeleteSync({ recursive = false, checkType: checkType_1 = null } = {}) {
    (() => { let v = this.fileSystem; return (() => { let v_1 = this.path; return (() => { let v_2 = __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"2\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 2 }))); return (v.opHandle)(v_1, v_2); })(); })(); })();
    let node = this.backing;
    if (!(recursive)) {
      {
        if ((node instanceof DirectoryNode && node.children.size !== 0)) {
          {
            (() => { throw directoryNotEmpty(this.path); })();
          }
        }
        ((checkType_1 ?? __dartBind(this, "defaultCheckType")))(node);
      }
    }
    __dartMapRemove(node.parent.children, this.basename);
  }
  clone(path) {
    throw new TypeError("Abstract member MemoryFileSystemEntity.clone");
  }
}

class MemoryRandomAccessFile {
  constructor(path, _node, _mode) {
    this._isOpen = true;
    this._position = 0;
    this.__asyncOperationPending = false;
    this.path = path;
    this._node = _node;
    this._mode = _mode;
    L:
    switch (this._mode) {
      case __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"0\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)):
        {
          break L;
        }
      case __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)):
      case __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"3\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)):
        {
          this.truncateSync(0);
          break L;
        }
      case __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"2\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)):
      case __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"4\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)):
        {
          this._position = this.lengthSync();
          break L;
        }
      default:
        {
          (() => { throw __dartCoreError("UnimplementedError", "Unsupported FileMode"); })();
        }
    }
  }
  get _asyncOperationPending() {
    return this.__asyncOperationPending;
  }
  set _asyncOperationPending(value) {
    this.__asyncOperationPending = value;
  }
  _checkOpen() {
    if (!(this._isOpen)) {
      {
        (() => { throw __dartIoFileSystemException("File closed", this.path, null); })();
      }
    }
  }
  _checkReadable(operation) {
    L:
    switch (this._mode) {
      case __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"0\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)):
      case __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)):
      case __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"2\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)):
        {
          return;
        }
      case __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"3\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)):
      case __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"4\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)):
      default:
        {
          (() => { throw __dartIoFileSystemException(__dartStr(operation) + " failed", this.path, badFileDescriptor(this.path).osError); })();
        }
    }
  }
  _checkWritable(operation) {
    if (isWriteMode(this._mode)) {
      {
        return;
      }
    }
    (() => { throw __dartIoFileSystemException(__dartStr(operation) + " failed", this.path, badFileDescriptor(this.path).osError); })();
  }
  _checkAsync() {
    if (this._asyncOperationPending) {
      {
        (() => { throw __dartIoFileSystemException("An async operation is currently pending", this.path, null); })();
      }
    }
  }
  async _asyncWrapper(f) {
    this._checkAsync();
    this._asyncOperationPending = true;
    try {
      {
        return await new Promise((resolve, reject) => setTimeout(() => { try { resolve((() => {
          this._asyncOperationPending = false;
          try {
            {
              return (f)();
            }
          } finally {
            {
              this._asyncOperationPending = true;
            }
          }
})()); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"0\"]]]", () => __dartDuration({ microseconds: 0 })).inMilliseconds)));
      }
    } finally {
      {
        this._asyncOperationPending = false;
      }
    }
  }
  async close() {
    return this._asyncWrapper(__dartBind(this, "closeSync"));
  }
  closeSync() {
    this._checkOpen();
    this._isOpen = false;
  }
  async flush() {
    await this._asyncWrapper(__dartBind(this, "flushSync"));
    return this;
  }
  flushSync() {
    this._checkOpen();
    this._checkAsync();
  }
  length() {
    return this._asyncWrapper(__dartBind(this, "lengthSync"));
  }
  lengthSync() {
    this._checkOpen();
    this._checkAsync();
    return this._node.size;
  }
  async lock(mode = __dartConst("[\"instance\",\"dart:io::FileLock\",[\"field\",\"dart:io::FileLock::@fields::dart:io::_type\",[\"int\",\"2\"]]]", () => __dartIoEnum("FileLock", "FileLock", 0)), start = 0, end = -1) {
    await this._asyncWrapper(() => { return this.lockSync(mode, start, end); });
    return this;
  }
  lockSync(mode = __dartConst("[\"instance\",\"dart:io::FileLock\",[\"field\",\"dart:io::FileLock::@fields::dart:io::_type\",[\"int\",\"2\"]]]", () => __dartIoEnum("FileLock", "FileLock", 0)), start = 0, end = -1) {
    this._checkOpen();
    this._checkAsync();
    (() => { throw __dartCoreError("UnimplementedError", "TODO"); })();
  }
  position() {
    return this._asyncWrapper(__dartBind(this, "positionSync"));
  }
  positionSync() {
    this._checkOpen();
    this._checkAsync();
    return this._position;
  }
  read(bytes) {
    return this._asyncWrapper(() => { return this.readSync(bytes); });
  }
  readSync(bytes) {
    this._checkOpen();
    this._checkAsync();
    this._checkReadable("read");
    const end = Math.min((this._position + bytes), this.lengthSync());
    const copy = this._node.content.slice(this._position, end);
    this._position = end;
    return copy;
  }
  readByte() {
    return this._asyncWrapper(__dartBind(this, "readByteSync"));
  }
  readByteSync() {
    this._checkOpen();
    this._checkAsync();
    this._checkReadable("readByte");
    if ((this._position >= this.lengthSync())) {
      {
        return (-1);
      }
    }
    return __dartIndexGet(this._node.content, (() => { let v = this._position; return (() => { let v_1 = this._position = (v + 1); return v; })(); })());
  }
  readInto(buffer, start = 0, end = null) {
    return this._asyncWrapper(() => { return this.readIntoSync(buffer, start, end); });
  }
  readIntoSync(buffer, start = 0, end = null) {
    this._checkOpen();
    this._checkAsync();
    this._checkReadable("readInto");
    end = __dartCheckValidRange(start, end, buffer.length, null, null, null);
    const length = this.lengthSync();
    let i = null;
    for (let v = i = start; ((i < end) && (this._position < length)); i = (i + 1), this._position = (this._position + 1)) {
      {
        __dartIndexSet(buffer, i, __dartIndexGet(this._node.content, this._position));
      }
    }
    return (i - start);
  }
  async setPosition(position) {
    await this._asyncWrapper(() => { return this.setPositionSync(position); });
    return this;
  }
  setPositionSync(position) {
    this._checkOpen();
    this._checkAsync();
    if ((position < 0)) {
      {
        (() => { throw __dartIoFileSystemException("setPosition failed", this.path, invalidArgument(this.path).osError); })();
      }
    }
    this._position = position;
  }
  async truncate(length) {
    await this._asyncWrapper(() => { return this.truncateSync(length); });
    return this;
  }
  truncateSync(length) {
    this._checkOpen();
    this._checkAsync();
    if (((length < 0) || !(isWriteMode(this._mode)))) {
      {
        (() => { throw __dartIoFileSystemException("truncate failed", this.path, invalidArgument(this.path).osError); })();
      }
    }
    const oldLength = this.lengthSync();
    if ((length < oldLength)) {
      {
        this._node.truncate(length);
      }
    } else {
      if ((length > oldLength)) {
        {
          this._node.write(new Uint8Array((length - oldLength)));
        }
      }
    }
  }
  async unlock(start = 0, end = -1) {
    await this._asyncWrapper(() => { return this.unlockSync(start, end); });
    return this;
  }
  unlockSync(start = 0, end = -1) {
    this._checkOpen();
    this._checkAsync();
    (() => { throw __dartCoreError("UnimplementedError", "TODO"); })();
  }
  async writeByte(value) {
    await this._asyncWrapper(() => { return this.writeByteSync(value); });
    return this;
  }
  writeByteSync(value) {
    this._checkOpen();
    this._checkAsync();
    this._checkWritable("writeByte");
    let length = this.lengthSync();
    if ((this._position >= length)) {
      {
        this.truncateSync((this._position + 1));
        length = this.lengthSync();
      }
    }
    __dartIndexSet(this._node.content, (() => { let v = this._position; return (() => { let v_1 = this._position = (v + 1); return v; })(); })(), value);
    return 1;
  }
  async writeFrom(buffer, start = 0, end = null) {
    await this._asyncWrapper(() => { return this.writeFromSync(buffer, start, end); });
    return this;
  }
  writeFromSync(buffer, start = 0, end = null) {
    this._checkOpen();
    this._checkAsync();
    this._checkWritable("writeFrom");
    end = __dartCheckValidRange(start, end, buffer.length, null, null, null);
    const writeByteCount = (end - start);
    const endPosition = (this._position + writeByteCount);
    if ((endPosition > this.lengthSync())) {
      {
        this.truncateSync(endPosition);
      }
    }
    __dartListSetRange(this._node.content, this._position, endPosition, buffer, start);
    this._position = endPosition;
  }
  async writeString(string, { encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)) } = {}) {
    await this._asyncWrapper(() => { return this.writeStringSync(string, { encoding: encoding }); });
    return this;
  }
  writeStringSync(string, { encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)) } = {}) {
    this.writeFromSync(encoding.encode(string));
  }
}

class MemoryFile extends MemoryFileSystemEntity {
  constructor(fileSystem, path) {
    super(fileSystem, path);
    Object.defineProperty(this, $File_interface, { value: true });
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
  }
  get _resolvedBackingOrCreate() {
    let node = this.backingOrNull;
    if ((node === null)) {
      {
        node = this._doCreate();
      }
    } else {
      {
        node = (isLink(node) ? resolveLinks(__dartAs(node, value => value instanceof LinkNode, "LinkNode"), () => { return this.path; }) : node);
        checkType(this.expectedType, node.type, () => { return this.path; });
      }
    }
    return __dartAs(node, value => value instanceof FileNode, "FileNode");
  }
  get expectedType() {
    return __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"0\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0));
  }
  existsSync() {
    (this.fileSystem.opHandle)(this.path, __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"6\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 6 }))));
    return __dartEquals((() => { let v = this.backingOrNull; return ((v === null) ? null : v.stat.type); })(), this.expectedType);
  }
  async create({ recursive = false, exclusive = false } = {}) {
    this.createSync({ recursive: recursive, exclusive: exclusive });
    return this;
  }
  createSync({ recursive = false, exclusive = false } = {}) {
    (() => { let v = this.fileSystem; return (() => { let v_1 = this.path; return (() => { let v_2 = __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"3\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 3 }))); return (v.opHandle)(v_1, v_2); })(); })(); })();
    this._doCreate({ recursive: recursive });
  }
  _doCreate({ recursive = false } = {}) {
    let node = this.internalCreateSync({ followTailLink: true, createChild: function(parent, isFinalSegment) {
      if (isFinalSegment) {
        {
          return new FileNode(parent);
        }
      } else {
        if (recursive) {
          {
            return new DirectoryNode(parent);
          }
        }
      }
      return null;
} });
    if (!(__dartEquals(((node)?.type ?? null), this.expectedType))) {
      {
        (() => { throw isADirectory(this.path); })();
      }
    }
    return node;
  }
  async rename(newPath) {
    return this.renameSync(newPath);
  }
  renameSync(newPath) {
    return __dartAs(this.internalRenameSync(newPath, { followTailLink: true, checkType: (node) => {
      let actualType = node.stat.type;
      if (!(__dartEquals(actualType, this.expectedType))) {
        {
          (() => { throw (__dartEquals(actualType, __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"5\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0))) ? noSuchFileOrDirectory(this.path) : isADirectory(this.path)); })();
        }
      }
} }), value => value instanceof File, "File");
  }
  async copy(newPath) {
    return this.copySync(newPath);
  }
  copySync(newPath) {
    (() => { let v = this.fileSystem; return (() => { let v_1 = this.path; return (() => { let v_2 = __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"5\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 5 }))); return (v.opHandle)(v_1, v_2); })(); })(); })();
    let sourceNode = __dartAs(this.resolvedBacking, value => value instanceof FileNode, "FileNode");
    this.fileSystem.findNode(newPath, { segmentVisitor: (parent, childName, child, currentSegment, finalSegment) => {
      if (__dartEquals(currentSegment, finalSegment)) {
        {
          if (!((child === null))) {
            {
              if (isLink(child)) {
                {
                  let ledger = new Array(0).fill(null);
                  child = resolveLinks(__dartAs(child, value => value instanceof LinkNode, "LinkNode"), function() { return newPath; }, { ledger: ledger });
                  checkExists(child, function() { return newPath; });
                  parent = child.parent;
                  childName = __dartIndexGet(ledger, ledger.length - 1);
                }
              }
              checkType(this.expectedType, child.type, function() { return newPath; });
              __dartMapRemove(parent.children, childName);
            }
          }
          let newNode = new FileNode(parent);
          newNode.copyFrom(sourceNode);
          __dartMapSet(parent.children, childName, newNode);
        }
      }
      return child;
} });
    return this.clone(newPath);
  }
  async length() {
    return this.lengthSync();
  }
  lengthSync() {
    return __dartAs(this.resolvedBacking, value => value instanceof FileNode, "FileNode").size;
  }
  get absolute() {
    return __dartAs(super.absolute, value => value instanceof File, "File");
  }
  async lastAccessed() {
    return this.lastAccessedSync();
  }
  lastAccessedSync() {
    return __dartAs(this.resolvedBacking, value => value instanceof FileNode, "FileNode").stat.accessed;
  }
  async setLastAccessed(time) {
    return this.setLastAccessedSync(time);
  }
  setLastAccessedSync(time) {
    let node = __dartAs(this.resolvedBacking, value => value instanceof FileNode, "FileNode");
    node.accessed = time.millisecondsSinceEpoch;
  }
  async lastModified() {
    return this.lastModifiedSync();
  }
  lastModifiedSync() {
    return __dartAs(this.resolvedBacking, value => value instanceof FileNode, "FileNode").stat.modified;
  }
  async setLastModified(time) {
    return this.setLastModifiedSync(time);
  }
  setLastModifiedSync(time) {
    let node = __dartAs(this.resolvedBacking, value => value instanceof FileNode, "FileNode");
    node.modified = time.millisecondsSinceEpoch;
  }
  async open({ mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"0\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)) } = {}) {
    return this.openSync({ mode: mode });
  }
  openSync({ mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"0\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)) } = {}) {
    (() => { let v = this.fileSystem; return (() => { let v_1 = this.path; return (() => { let v_2 = __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"4\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 4 }))); return (v.opHandle)(v_1, v_2); })(); })(); })();
    if ((isWriteMode(mode) && !(this.existsSync()))) {
      {
        this.createSync();
      }
    }
    return new MemoryRandomAccessFile(this.path, __dartAs(this.resolvedBacking, value => value instanceof FileNode, "FileNode"), mode);
  }
  openRead(start = null, end = null) {
    (() => { let v = this.fileSystem; return (() => { let v_1 = this.path; return (() => { let v_2 = __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"4\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 4 }))); return (v.opHandle)(v_1, v_2); })(); })(); })();
    try {
      {
        let node = __dartAs(this.resolvedBacking, value => value instanceof FileNode, "FileNode");
        let content = node.content;
        if (!((start === null))) {
          {
            content = ((end === null) ? content.slice(start) : content.slice(start, Math.min(end, content.length)));
          }
        }
        return __dartStreamFromIterable([content]);
      }
    } catch ($error) {
      if ($error != null) {
        const e = $error;
        {
          return __dartStreamError(e);
        }
      } else {
        throw $error;
      }
    }
  }
  openWrite({ mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)), encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)) } = {}) {
    (() => { let v = this.fileSystem; return (() => { let v_1 = this.path; return (() => { let v_2 = __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"4\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 4 }))); return (v.opHandle)(v_1, v_2); })(); })(); })();
    if (!(isWriteMode(mode))) {
      {
        (() => { throw __dartCoreError("ArgumentError", mode); })();
      }
    }
    return _FileSink.fromFile(this, mode, encoding);
  }
  async readAsBytes() {
    return this.readAsBytesSync();
  }
  readAsBytesSync() {
    (() => { let v = this.fileSystem; return (() => { let v_1 = this.path; return (() => { let v_2 = __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"0\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 0 }))); return (v.opHandle)(v_1, v_2); })(); })(); })();
    return Uint8Array.from(__dartAs(this.resolvedBacking, value => value instanceof FileNode, "FileNode").content);
  }
  async readAsString({ encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)) } = {}) {
    return this.readAsStringSync({ encoding: encoding });
  }
  readAsStringSync({ encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)) } = {}) {
    try {
      {
        return encoding.decode(this.readAsBytesSync());
      }
    } catch ($error) {
      if (__dartIsCoreError($error, "FormatException")) {
        const err = $error;
        {
          (() => { throw __dartIoFileSystemException(err.message, this.path, null); })();
        }
      } else {
        throw $error;
      }
    }
  }
  async readAsLines({ encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)) } = {}) {
    return this.readAsLinesSync({ encoding: encoding });
  }
  readAsLinesSync({ encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)) } = {}) {
    let str = this.readAsStringSync({ encoding: encoding });
    if (str.length === 0) {
      {
        return new Array(0).fill(null);
      }
    }
    const lines = str.split("\n");
    if (str.endsWith("\n")) {
      {
        lines.pop();
      }
    }
    return lines;
  }
  async writeAsBytes(bytes, { mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)), flush = false } = {}) {
    this.writeAsBytesSync(bytes, { mode: mode, flush: flush });
    return this;
  }
  writeAsBytesSync(bytes, { mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)), flush = false } = {}) {
    if (!(isWriteMode(mode))) {
      {
        (() => { throw badFileDescriptor(this.path); })();
      }
    }
    let node = this._resolvedBackingOrCreate;
    this._truncateIfNecessary(node, mode);
    (() => { let v = this.fileSystem; return (() => { let v_1 = this.path; return (() => { let v_2 = __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"1\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 1 }))); return (v.opHandle)(v_1, v_2); })(); })(); })();
    node.write(bytes);
    node.touch();
  }
  async writeAsString(contents, { mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)), encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)), flush = false } = {}) {
    this.writeAsStringSync(contents, { mode: mode, encoding: encoding, flush: flush });
    return this;
  }
  writeAsStringSync(contents, { mode = __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)), encoding = __dartConst("[\"instance\",\"dart:convert::Utf8Codec\",[\"field\",\"dart:convert::Utf8Codec::@fields::dart:convert::_allowMalformed\",[\"bool\",false]]]", () => __dartUtf8Codec(false)), flush = false } = {}) {
    return this.writeAsBytesSync(encoding.encode(contents), { mode: mode, flush: flush });
  }
  clone(path) {
    return new MemoryFile(this.fileSystem, path);
  }
  _truncateIfNecessary(node, mode) {
    if ((__dartEquals(mode, __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0))) || __dartEquals(mode, __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"3\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0))))) {
      {
        node.clear();
      }
    }
  }
  toString() {
    return "MemoryFile: '" + __dartStr(this.path) + "'";
  }
}

class _FileSink {
  constructor() {
    throw new TypeError("Class _FileSink has no unnamed constructor");
  }
  static _(node, encoding) {
    return $_FileSink__(_FileSink, node, encoding);
  }
  static fromFile(file, mode, encoding) {
    const node = __dartLazyField("node", null, true, null);
    let deferredException = null;
    try {
      {
        node.set(file._resolvedBackingOrCreate);
      }
    } catch ($error) {
      if (__dartIsCoreError($error, "Exception")) {
        const e = $error;
        {
          deferredException = e;
        }
      } else {
        throw $error;
      }
    }
    let future = Promise.resolve().then(() => (function() {
      if (!((deferredException === null))) {
        {
          (() => { throw deferredException; })();
        }
      }
      file._truncateIfNecessary(node.get(), mode);
      return node.get();
})());
    return _FileSink._(future, encoding);
  }
  get isStreaming() {
    return !(((this._streamCompleter)?.isCompleted ?? true));
  }
  add(data) {
    this._checkNotStreaming();
    if (this._isClosed) {
      {
        (() => { throw __dartCoreError("StateError", "StreamSink is closed"); })();
      }
    }
    this._addData(data);
  }
  write(obj) {
    return this.add(this.encoding.encode(((obj)?.toString() ?? "null")));
  }
  writeAll(objects, separator_1 = "") {
    let firstIter = true;
    {
      let _sync_for_iterator = __dartIterator(objects);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let obj = _sync_for_iterator.current;
          {
            if (!(firstIter)) {
              {
                this.write(separator_1);
              }
            }
            firstIter = false;
            this.write(obj);
          }
        }
      }
    }
  }
  writeln(obj = "") {
    this.write(obj);
    this.write("\n");
  }
  writeCharCode(charCode) {
    return this.write(String.fromCodePoint(charCode));
  }
  addError(error, stackTrace = null) {
    this._checkNotStreaming();
    this._completer.completeError(error, stackTrace);
  }
  addStream(stream) {
    this._checkNotStreaming();
    this._streamCompleter = __dartCompleter();
    __dartStreamListen(stream, (data) => { return this._addData(data); }, (error, stackTrace) => {
      __dartNullCheck(this._streamCompleter).completeError(error, stackTrace);
      this._streamCompleter = null;
}, () => {
      __dartNullCheck(this._streamCompleter).complete();
      this._streamCompleter = null;
}, true);
    return __dartNullCheck(this._streamCompleter).future;
  }
  flush() {
    this._checkNotStreaming();
    return this._pendingWrites;
  }
  close() {
    this._checkNotStreaming();
    if (!(this._isClosed)) {
      {
        this._isClosed = true;
        this._pendingWrites.then((_) => { return this._completer.complete(); }, (error, stackTrace) => { return this._completer.completeError(error, stackTrace); });
      }
    }
    return this._completer.future;
  }
  get done() {
    return this._completer.future;
  }
  _addData(data) {
    this._pendingWrites = this._pendingWrites.then(function(node) {
      node.write(data);
      return node;
});
  }
  _checkNotStreaming() {
    if (this.isStreaming) {
      {
        (() => { throw __dartCoreError("StateError", "StreamSink is bound to a stream"); })();
      }
    }
  }
}

function $_FileSink__($newTarget, node, encoding) {
  const $self = Object.create($newTarget.prototype);
  $self._completer = __dartCompleter();
  $self._streamCompleter = null;
  $self._isClosed = false;
  $self.encoding = encoding;
  $self._pendingWrites = node;
  return $self;
}

class MemoryLink extends MemoryFileSystemEntity {
  constructor(fileSystem, path) {
    super(fileSystem, path);
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
    Object.defineProperty(this, $Link_interface, { value: true });
  }
  get expectedType() {
    return __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"2\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0));
  }
  existsSync() {
    (this.fileSystem.opHandle)(this.path, __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"6\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 6 }))));
    return __dartEquals(((this.backingOrNull)?.type ?? null), this.expectedType);
  }
  async rename(newPath) {
    return this.renameSync(newPath);
  }
  renameSync(newPath) {
    return __dartAs(this.internalRenameSync(newPath, { checkType: (node) => {
      if (!(__dartEquals(node.type, this.expectedType))) {
        {
          (() => { throw (__dartEquals(node.type, __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0))) ? isADirectory(newPath) : invalidArgument(newPath)); })();
        }
      }
} }), value => value instanceof Link, "Link");
  }
  async create(target, { recursive = false } = {}) {
    this.createSync(target, { recursive: recursive });
    return this;
  }
  createSync(target, { recursive = false } = {}) {
    let preexisting = true;
    (() => { let v = this.fileSystem; return (() => { let v_1 = this.path; return (() => { let v_2 = __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"3\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 3 }))); return (v.opHandle)(v_1, v_2); })(); })(); })();
    this.internalCreateSync({ createChild: function(parent, isFinalSegment) {
      if (isFinalSegment) {
        {
          preexisting = false;
          return new LinkNode(parent, target);
        }
      } else {
        if (recursive) {
          {
            return new DirectoryNode(parent);
          }
        }
      }
      return null;
} });
    if (preexisting) {
      {
        (() => { throw fileExists(this.path); })();
      }
    }
  }
  async update(target) {
    this.updateSync(target);
    return this;
  }
  updateSync(target) {
    let node = this.backing;
    checkType(this.expectedType, node.type, () => { return this.path; });
    __dartAs(node, value => value instanceof LinkNode, "LinkNode").target = target;
  }
  deleteSync({ recursive = false } = {}) {
    return this.internalDeleteSync({ recursive: recursive, checkType: (node) => { return checkType(this.expectedType, node.type, () => { return this.path; }); } });
  }
  async target() {
    return this.targetSync();
  }
  targetSync() {
    let node = this.backing;
    if (!(__dartEquals(node.type, this.expectedType))) {
      {
        (() => { throw noSuchFileOrDirectory(this.path); })();
      }
    }
    return __dartAs(node, value => value instanceof LinkNode, "LinkNode").target;
  }
  get absolute() {
    return __dartAs(super.absolute, value => value instanceof Link, "Link");
  }
  clone(path) {
    return new MemoryLink(this.fileSystem, path);
  }
  toString() {
    return "MemoryLink: '" + __dartStr(this.path) + "'";
  }
}

class _MemoryDirectory_MemoryFileSystemEntity_DirectoryAddOnsMixin extends MemoryFileSystemEntity {
  constructor(fileSystem, path) {
    super(fileSystem, path);
    Object.defineProperty(this, $Directory_interface, { value: true });
    Object.defineProperty(this, $DirectoryAddOnsMixin_interface, { value: true });
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
  }
  rename(newPath) {
    throw new TypeError("Abstract member _MemoryDirectory&MemoryFileSystemEntity&DirectoryAddOnsMixin.rename");
  }
  renameSync(newPath) {
    throw new TypeError("Abstract member _MemoryDirectory&MemoryFileSystemEntity&DirectoryAddOnsMixin.renameSync");
  }
  get absolute() {
    throw new TypeError("Abstract member _MemoryDirectory&MemoryFileSystemEntity&DirectoryAddOnsMixin.absolute");
  }
  set absolute(value) {
    Object.defineProperty(this, "absolute", { value, writable: true, configurable: true, enumerable: true });
  }
  childDirectory(basename_1) {
    return this.fileSystem.directory(this.fileSystem.path.join(this.path, basename_1));
  }
  childFile(basename_1) {
    return this.fileSystem.file(this.fileSystem.path.join(this.path, basename_1));
  }
  childLink(basename_1) {
    return this.fileSystem.link(this.fileSystem.path.join(this.path, basename_1));
  }
}

class MemoryDirectory extends _MemoryDirectory_MemoryFileSystemEntity_DirectoryAddOnsMixin {
  constructor(fileSystem, path) {
    super(fileSystem, path);
    Object.defineProperty(this, $Directory_interface, { value: true });
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
  }
  get expectedType() {
    return __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0));
  }
  get uri() {
    return __dartUriFile(this.path, __dartEquals(this.fileSystem.style, __dartConst("[\"instance\",\"class:_Windows\"]", () => Object.freeze(Object.create(_Windows.prototype)))), true);
  }
  existsSync() {
    (this.fileSystem.opHandle)(this.path, __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"6\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 6 }))));
    return __dartEquals((() => { let v = this.backingOrNull; return ((v === null) ? null : v.stat.type); })(), this.expectedType);
  }
  async create({ recursive = false } = {}) {
    this.createSync({ recursive: recursive });
    return this;
  }
  createSync({ recursive = false } = {}) {
    (() => { let v = this.fileSystem; return (() => { let v_1 = this.path; return (() => { let v_2 = __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"3\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 3 }))); return (v.opHandle)(v_1, v_2); })(); })(); })();
    let node = this.internalCreateSync({ followTailLink: true, visitLinks: true, createChild: function(parent, isFinalSegment) {
      if ((recursive || isFinalSegment)) {
        {
          return new DirectoryNode(parent);
        }
      }
      return null;
} });
    if (!(__dartEquals(((node)?.type ?? null), this.expectedType))) {
      {
        (() => { throw notADirectory(this.path); })();
      }
    }
  }
  async createTemp(prefix = null) {
    return this.createTempSync(prefix);
  }
  createTempSync(prefix = null) {
    prefix = __dartStr((prefix ?? "")) + "rand";
    let fullPath = this.fileSystem.path.join(this.path, prefix);
    let dirname_1 = this.fileSystem.path.dirname(fullPath);
    let basename_1 = this.fileSystem.path.basename(fullPath);
    let node = __dartAs(this.fileSystem.findNode(dirname_1), value => (value === null || value instanceof DirectoryNode), "DirectoryNode?");
    checkExists(node, function() { return dirname_1; });
    checkIsDir(__dartNullCheck(node), function() { return dirname_1; });
    let tempCounter = (_systemTempCounter.get(this.fileSystem) ?? 0);
    function name() {
      return __dartStr(basename_1) + __dartStr(tempCounter);
    }
    while (__dartMapContainsKey(node.children, name())) {
      {
        tempCounter = (tempCounter + 1);
      }
    }
    _systemTempCounter.set(this.fileSystem, tempCounter);
    let tempDir = new DirectoryNode(node);
    __dartMapSet(node.children, name(), tempDir);
    return (() => { let v = new MemoryDirectory(this.fileSystem, this.fileSystem.path.join(dirname_1, name())); return (() => {
      v.createSync();
      return v;
    })(); })();
  }
  async rename(newPath) {
    return this.renameSync(newPath);
  }
  renameSync(newPath) {
    return __dartAs(this.internalRenameSync(newPath, { validateOverwriteExistingEntity: function(existingNode) {
      if (existingNode.children.size !== 0) {
        {
          (() => { throw directoryNotEmpty(newPath); })();
        }
      }
} }), value => value instanceof Directory, "Directory");
  }
  get parent() {
    return (((this.backingOrNull)?.isRoot ?? false) ? this : super.parent);
  }
  get absolute() {
    return __dartAs(super.absolute, value => value instanceof Directory, "Directory");
  }
  list({ recursive = false, followLinks = true } = {}) {
    return __dartStreamFromIterable(this.listSync({ recursive: recursive, followLinks: followLinks }));
  }
  listSync({ recursive = false, followLinks = true } = {}) {
    let node = __dartAs(this.backing, value => value instanceof DirectoryNode, "DirectoryNode");
    let listing = new Array(0).fill(null);
    let tasks = [new _PendingListTask(node, (this.path.endsWith(this.fileSystem.path.separator) ? this.path.substring(0, (this.path.length - 1)) : this.path), (() => {
      const v = new Set();
      return v;
    })())];
    while (tasks.length !== 0) {
      {
        let task = tasks.pop();
        (task.dir.children.forEach((value, key) => ((name, child) => {
          let breadcrumbs = __dartSetFrom(task.breadcrumbs);
          let childPath = this.fileSystem.path.join(task.path, name);
          while (((followLinks && isLink(child)) && __dartSetAdd(breadcrumbs, __dartAs(child, value => value instanceof LinkNode, "LinkNode")))) {
            {
              let referent = child.referentOrNull;
              if (!((referent === null))) {
                {
                  child = referent;
                }
              }
            }
          }
          if (isDirectory(child)) {
            {
              (listing.push(new MemoryDirectory(this.fileSystem, childPath)), null);
              if (recursive) {
                {
                  (tasks.push(new _PendingListTask(__dartAs(child, value => value instanceof DirectoryNode, "DirectoryNode"), childPath, breadcrumbs)), null);
                }
              }
            }
          } else {
            if (isLink(child)) {
              {
                (listing.push(new MemoryLink(this.fileSystem, childPath)), null);
              }
            } else {
              if (isFile(child)) {
                {
                  (listing.push(new MemoryFile(this.fileSystem, childPath)), null);
                }
              }
            }
          }
})(key, value)), null);
      }
    }
    return listing;
  }
  clone(path) {
    return new MemoryDirectory(this.fileSystem, path);
  }
  toString() {
    return "MemoryDirectory: '" + __dartStr(this.path) + "'";
  }
}

class _PendingListTask {
  constructor(dir, path, breadcrumbs) {
    this.dir = dir;
    this.path = path;
    this.breadcrumbs = breadcrumbs;
  }
}

class MemoryFileSystem {
  constructor({ style: style_1 = __dartConst("[\"instance\",\"class:_Posix\"]", () => Object.freeze(Object.create(_Posix.prototype))), opHandle = _defaultOpHandle } = {}) {
    if (new.target === MemoryFileSystem) {
      return new _MemoryFileSystem({ style: style_1, clock: __dartConst("[\"instance\",\"class:_RealtimeClock\"]", () => Object.freeze(Object.create(_RealtimeClock.prototype))), opHandle: opHandle });
    }
  }
  static test({ style: style_1 = __dartConst("[\"instance\",\"class:_Posix\"]", () => Object.freeze(Object.create(_Posix.prototype))), opHandle = _defaultOpHandle } = {}) {
    return new _MemoryFileSystem({ style: style_1, clock: new _MonotonicTestClock(), opHandle: opHandle });
  }
}
Object.defineProperty(MemoryFileSystem, Symbol.hasInstance, { value(value) { return value != null && value[$MemoryFileSystem_interface] === true; } });

class _MemoryFileSystem extends FileSystem {
  constructor({ style: style_1 = __dartConst("[\"instance\",\"class:_Posix\"]", () => Object.freeze(Object.create(_Posix.prototype))), clock, opHandle = _defaultOpHandle } = {}) {
    super();
    this._root = null;
    this._systemTemp = null;
    this.style = style_1;
    this.clock = clock;
    this.opHandle = opHandle;
    this._context = style_1.contextFor(style_1.root);
    Object.defineProperty(this, $FileSystem_interface, { value: true });
    Object.defineProperty(this, $MemoryFileSystem_interface, { value: true });
    Object.defineProperty(this, $NodeBasedFileSystem_interface, { value: true });
    Object.defineProperty(this, $StyleableFileSystem_interface, { value: true });
    this._root = new RootNode(this);
  }
  get root() {
    return this._root;
  }
  get cwd() {
    return this._context.current;
  }
  directory(path) {
    return new MemoryDirectory(this, this.getPath(path));
  }
  file(path) {
    return new MemoryFile(this, this.getPath(path));
  }
  link(path) {
    return new MemoryLink(this, this.getPath(path));
  }
  get path() {
    return this._context;
  }
  get systemTempDirectory() {
    ((this._systemTemp === null) ? this._systemTemp = this.directory(this.style.root).createTempSync(".tmp_").path : null);
    return (() => { let v = this.directory(this._systemTemp); return (() => {
      v.createSync();
      return v;
    })(); })();
  }
  get currentDirectory() {
    return this.directory(this.cwd);
  }
  set currentDirectory(path) {
    let value = null;
    if (path != null && typeof path === "object" && typeof path.path === "string") {
      {
        value = path.path;
      }
    } else {
      if (typeof path === "string") {
        {
          value = path;
        }
      } else {
        {
          (() => { throw __dartCoreError("ArgumentError", "Invalid type for \"path\": " + __dartStr(((path)?.runtimeType ?? null))); })();
        }
      }
    }
    value = this.directory(value).resolveSymbolicLinksSync();
    let node = this.findNode(value);
    checkExists(node, function() { return value; });
    checkIsDir(__dartNullCheck(node), function() { return value; });
    this._context = this.style.contextFor(value);
  }
  async stat(path) {
    return this.statSync(path);
  }
  statSync(path) {
    try {
      {
        return ((this.findNode(path))?.stat ?? MemoryFileStat.notFound);
      }
    } catch ($error) {
      if ($error instanceof Error || ($error != null && typeof $error === "object" && "message" in $error)) {
        {
          return MemoryFileStat.notFound;
        }
      } else {
        throw $error;
      }
    }
  }
  async identical(path1, path2) {
    return this.identicalSync(path1, path2);
  }
  identicalSync(path1, path2) {
    let node1 = this.findNode(path1);
    checkExists(node1, function() { return path1; });
    let node2 = this.findNode(path2);
    checkExists(node2, function() { return path2; });
    return (!((node1 === null)) && __dartEquals(node1, node2));
  }
  get isWatchSupported() {
    return false;
  }
  async type(path, { followLinks = true } = {}) {
    return this.typeSync(path, { followLinks: followLinks });
  }
  typeSync(path, { followLinks = true } = {}) {
    let node = null;
    try {
      {
        node = this.findNode(path, { followTailLink: followLinks });
      }
    } catch ($error) {
      if ($error instanceof Error || ($error != null && typeof $error === "object" && "message" in $error)) {
        {
          node = null;
        }
      } else {
        throw $error;
      }
    }
    if ((node === null)) {
      {
        return __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"5\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0));
      }
    }
    return node.type;
  }
  get _current() {
    return __dartAs(this.findNode(this.cwd), value => (value === null || value instanceof DirectoryNode), "DirectoryNode?");
  }
  findNode(path, { reference = null, segmentVisitor = null, visitLinks = false, pathWithSymlinks = null, followTailLink = false } = {}) {
    if (path.length === 0) {
      {
        return null;
      }
    } else {
      if (this._context.isAbsolute(path)) {
        {
          reference = this._root;
          path = path.substring(this.style.drive.length);
        }
      } else {
        {
          ((reference === null) ? reference = this._current : null);
        }
      }
    }
    let parts = (() => { let v = __dartStringSplit(path, this.style.separator); return (() => {
      __dartListRemoveWhere(v, isEmpty);
      return v;
    })(); })();
    let directory = ((reference)?.directory ?? null);
    let child = directory;
    let finalSegment = (parts.length - 1);
    for (let i = 0; (i <= finalSegment); i = (i + 1)) {
      {
        let basename_1 = __dartIndexGet(parts, i);
        L:
        switch (basename_1) {
          case ".":
            {
              child = directory;
              break L;
            }
          case "..":
            {
              child = ((directory)?.parent ?? null);
              directory = ((directory)?.parent ?? null);
              break L;
            }
          default:
            {
              child = (() => { let v_1 = directory; return ((v_1 === null) ? null : __dartMapGet(v_1.children, basename_1)); })();
            }
        }
        if (!((pathWithSymlinks === null))) {
          {
            (pathWithSymlinks.push(basename_1), null);
          }
        }
        const subpath = () => {
          return __dartIterableJoin(parts.slice(0, (i + 1)), this._context.separator);
        };
        if ((isLink(child) && ((i < finalSegment) || followTailLink))) {
          {
            if ((visitLinks || (segmentVisitor === null))) {
              {
                if (!((segmentVisitor === null))) {
                  {
                    child = (segmentVisitor)(__dartNullCheck(directory), basename_1, child, i, finalSegment);
                  }
                }
                child = resolveLinks(__dartAs(child, value => value instanceof LinkNode, "LinkNode"), subpath, { ledger: pathWithSymlinks });
              }
            } else {
              {
                child = resolveLinks(__dartAs(child, value => value instanceof LinkNode, "LinkNode"), subpath, { ledger: pathWithSymlinks, tailVisitor: function(parent, childName, child) { return (segmentVisitor)(parent, childName, child, i, finalSegment); } });
              }
            }
          }
        } else {
          if (!((segmentVisitor === null))) {
            {
              child = (segmentVisitor)(__dartNullCheck(directory), basename_1, child, i, finalSegment);
            }
          }
        }
        if ((i < finalSegment)) {
          {
            checkExists(child, subpath);
            checkIsDir(__dartNullCheck(child), subpath);
            directory = __dartAs(child, value => value instanceof DirectoryNode, "DirectoryNode");
          }
        }
      }
    }
    return child;
  }
}

class Range {
  constructor(min_1, max_1) {
    this.min = min_1;
    this.max = max_1;
  }
  static singleton(value) {
    return $Range_singleton(Range, value);
  }
  get isSingleton() {
    return __dartEquals(this.min, this.max);
  }
  contains(value) {
    return ((value >= this.min) && (value <= this.max));
  }
  "=="(other) {
    return ((other instanceof Range && __dartEquals(other.min, this.min)) && __dartEquals(other.max, this.max));
  }
  get hashCode() {
    return ((3 * this.min) + (7 * this.max));
  }
}

function $Range_singleton($newTarget, value) {
  return Reflect.construct(Range, [value, value], $newTarget);
}

class GlobMatch {
  constructor(input, pattern) {
    this.start = 0;
    this.input = input;
    this.pattern = pattern;
  }
  get end() {
    return this.input.length;
  }
  get groupCount() {
    return 0;
  }
  "[]"(group) {
    return this.group(group);
  }
  group(group) {
    if (!(__dartEquals(group, 0))) {
      (() => { throw __dartCoreError("RangeError", group); })();
    }
    return this.input;
  }
  groups(groupIndices) {
    return Array.from(Array.from(groupIndices, __dartBind(this, "group")));
  }
}

class AstNode {
  constructor() {
    if (new.target === AstNode) {
      throw new TypeError("Class AstNode has no unnamed constructor");
    }
  }
  static _(caseSensitive) {
    return $AstNode__(AstNode, caseSensitive);
  }
  get canMatchAbsolute() {
    return false;
  }
  get canMatchRelative() {
    return true;
  }
  flattenOptions() {
    return new OptionsNode([new SequenceNode([this], { caseSensitive: this.caseSensitive })], { caseSensitive: this.caseSensitive });
  }
  matches(string) {
    return (this._regExp ?? (this._regExp = __dartRegExp("^" + __dartStr(this._toRegExp()) + "$", { caseSensitive: this.caseSensitive, multiLine: false, unicode: false, dotAll: false }))).hasMatch(string);
  }
  _toRegExp() {
    throw new TypeError("Abstract member AstNode._toRegExp");
  }
}

function $AstNode__($newTarget, caseSensitive) {
  const $self = Object.create($newTarget.prototype);
  $self._regExp = null;
  $self.caseSensitive = caseSensitive;
  return $self;
}

class SequenceNode extends AstNode {
  constructor(nodes, { caseSensitive = true } = {}) {
    const $self = $AstNode__(new.target, caseSensitive);
    $self.nodes = Array.from(nodes);
    return $self;
  }
  get canMatchAbsolute() {
    return __dartIterableFirst(this.nodes).canMatchAbsolute;
  }
  get canMatchRelative() {
    return __dartIterableFirst(this.nodes).canMatchRelative;
  }
  flattenOptions() {
    if (__dartIterableIsEmpty(this.nodes)) {
      {
        return new OptionsNode([this], { caseSensitive: this.caseSensitive });
      }
    }
    let sequences = Array.from(__dartIterableFirst(this.nodes).flattenOptions().options, function(sequence) { return sequence.nodes; });
    {
      let _sync_for_iterator = __dartIterator(Array.from(this.nodes).slice(1));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let node = _sync_for_iterator.current;
          {
            let nextSequences = node.flattenOptions().options;
            sequences = Array.from(sequences).flatMap((value) => Array.from((function(sequence) { return Array.from(nextSequences, function(nextSequence) { return (() => { let v = Array.from(sequence); return (() => {
              (v.push(...Array.from(nextSequence.nodes)), null);
              return v;
            })(); })(); }); })(value)));
          }
        }
      }
    }
    return new OptionsNode(Array.from(sequences, (sequence) => { return new SequenceNode(Array.from(sequence).reduce((previous, value) => ((combined, node) => {
      if (((combined.length === 0 || !(__dartIndexGet(combined, combined.length - 1) instanceof LiteralNode)) || !(node instanceof LiteralNode))) {
        {
          return (() => { let v = combined; return (() => {
            (v.push(node), null);
            return v;
          })(); })();
        }
      }
      __dartIndexSet(combined, (combined.length - 1), new LiteralNode((__dartAs(__dartIndexGet(combined, combined.length - 1), value => value instanceof LiteralNode, "LiteralNode").text + node.text), { caseSensitive: this.caseSensitive }));
      return combined;
})(previous, value), new Array(0).fill(null)), { caseSensitive: this.caseSensitive }); }), { caseSensitive: this.caseSensitive });
  }
  split(context_1) {
    let componentsToReturn = new Array(0).fill(null);
    let currentComponent = null;
    function addNode(node) {
      ((currentComponent ?? (currentComponent = new Array(0).fill(null))).push(node), null);
    }
    const finishComponent = () => {
      if ((currentComponent === null)) {
        return;
      }
      (componentsToReturn.push(new SequenceNode(__dartNullCheck(currentComponent), { caseSensitive: this.caseSensitive })), null);
      currentComponent = null;
    };
    {
      let _sync_for_iterator = __dartIterator(this.nodes);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let node = _sync_for_iterator.current;
          L:
          {
            if (!(node instanceof LiteralNode)) {
              {
                addNode(node);
                break L;
              }
            }
            if (!(node.text.includes("/"))) {
              {
                addNode(node);
                break L;
              }
            }
            let text = node.text;
            if (__dartEquals(context_1.style, Style.windows)) {
              text = text.replaceAll("/", "\\");
            }
            let components = context_1.split(text);
            if (context_1.isAbsolute(__dartIterableFirst(components))) {
              {
                if ((componentsToReturn.length === 0 && (currentComponent === null))) {
                  {
                    let root = __dartIterableFirst(components);
                    if (__dartEquals(context_1.style, Style.windows)) {
                      {
                        root = root.replaceAll("\\", "/");
                      }
                    }
                    addNode(new LiteralNode(root, { caseSensitive: this.caseSensitive }));
                  }
                }
                finishComponent();
                components = Array.from(components).slice(1);
                if (__dartIterableIsEmpty(components)) {
                  break L;
                }
              }
            }
            {
              let _sync_for_iterator_1 = __dartIterator(Array.from(components).slice(0, (__dartIterableLength(components) - 1)));
              for (; _sync_for_iterator_1.moveNext(); ) {
                {
                  let component = _sync_for_iterator_1.current;
                  {
                    addNode(new LiteralNode(component, { caseSensitive: this.caseSensitive }));
                    finishComponent();
                  }
                }
              }
            }
            addNode(new LiteralNode(__dartIterableLast(components), { caseSensitive: this.caseSensitive }));
            if (node.text.endsWith("/")) {
              finishComponent();
            }
          }
        }
      }
    }
    finishComponent();
    return componentsToReturn;
  }
  _toRegExp() {
    return __dartIterableJoin(Array.from(this.nodes, function(node) { return node._toRegExp(); }), "");
  }
  "=="(other) {
    return (other instanceof SequenceNode && __dartConst("[\"instance\",\"class:IterableEquality\",[\"typeArgument\",\"InterfaceType(AstNode)\"],[\"field\",\"field:IterableEquality._elementEquality\",[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]]]", () => Object.freeze(Object.assign(Object.create(IterableEquality.prototype), { _elementEquality: __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) }))).equals(this.nodes, other.nodes));
  }
  get hashCode() {
    return __dartConst("[\"instance\",\"class:IterableEquality\",[\"typeArgument\",\"InterfaceType(AstNode)\"],[\"field\",\"field:IterableEquality._elementEquality\",[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]]]", () => Object.freeze(Object.assign(Object.create(IterableEquality.prototype), { _elementEquality: __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) }))).hash(this.nodes);
  }
  toString() {
    return __dartIterableJoin(this.nodes, "");
  }
}

class StarNode extends AstNode {
  constructor({ caseSensitive = true } = {}) {
    const $self = $AstNode__(new.target, caseSensitive);
    return $self;
  }
  _toRegExp() {
    return "[^/]*";
  }
  "=="(other) {
    return other instanceof StarNode;
  }
  get hashCode() {
    return 0;
  }
  toString() {
    return "*";
  }
}

class DoubleStarNode extends AstNode {
  constructor(_context, { caseSensitive = true } = {}) {
    const $self = $AstNode__(new.target, caseSensitive);
    $self._context = _context;
    return $self;
  }
  _toRegExp() {
    let buffer = (() => { let v = __dartStringBuffer(""); return (() => {
      v.write("(?!^(?:\\.\\./|");
      return v;
    })(); })();
    if (__dartEquals(this._context.style, Style.posix)) {
      {
        buffer.write("/");
      }
    } else {
      if (__dartEquals(this._context.style, Style.windows)) {
        {
          buffer.write("//|[A-Za-z]:/");
        }
      } else {
        {
          buffer.write("[a-zA-Z][-+.a-zA-Z\\d]*://|/");
        }
      }
    }
    buffer.write("))[^]*");
    return __dartStr(buffer);
  }
  "=="(other) {
    return other instanceof DoubleStarNode;
  }
  get hashCode() {
    return 1;
  }
  toString() {
    return "**";
  }
}

class AnyCharNode extends AstNode {
  constructor({ caseSensitive = true } = {}) {
    const $self = $AstNode__(new.target, caseSensitive);
    return $self;
  }
  _toRegExp() {
    return "[^/]";
  }
  "=="(other) {
    return other instanceof AnyCharNode;
  }
  get hashCode() {
    return 2;
  }
  toString() {
    return "?";
  }
}

class RangeNode extends AstNode {
  constructor(ranges, { negated, caseSensitive = true } = {}) {
    const $self = $AstNode__(new.target, caseSensitive);
    $self.negated = negated;
    $self.ranges = __dartSetFrom(ranges);
    return $self;
  }
  flattenOptions() {
    if ((this.negated || Array.from(this.ranges).some(function(range) { return !(range.isSingleton); }))) {
      {
        return super.flattenOptions();
      }
    }
    return new OptionsNode(Array.from(this.ranges, (range) => { return new SequenceNode([new LiteralNode(String.fromCodePoint(...Array.from([range.min])), { caseSensitive: this.caseSensitive })], { caseSensitive: this.caseSensitive }); }), { caseSensitive: this.caseSensitive });
  }
  _toRegExp() {
    let buffer = __dartStringBuffer("");
    let containsSeparator = Array.from(this.ranges).some(function(range) { return range.contains(47); });
    if ((!(this.negated) && containsSeparator)) {
      {
        buffer.write("(?!/)");
      }
    }
    buffer.write("[");
    if (this.negated) {
      {
        buffer.write("^");
        if (!(containsSeparator)) {
          buffer.write("/");
        }
      }
    }
    {
      let _sync_for_iterator = __dartIterator(this.ranges);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let range = _sync_for_iterator.current;
          L:
          {
            let start = String.fromCodePoint(...Array.from([range.min]));
            buffer.write(regExpQuote(start));
            if (range.isSingleton) {
              break L;
            }
            buffer.write("-");
            buffer.write(regExpQuote(String.fromCodePoint(...Array.from([range.max]))));
          }
        }
      }
    }
    buffer.write("]");
    return __dartStr(buffer);
  }
  "=="(other) {
    return ((other instanceof RangeNode && __dartEquals(other.negated, this.negated)) && __dartConst("[\"instance\",\"class:SetEquality\",[\"typeArgument\",\"InterfaceType(Range)\"],[\"field\",\"field:_UnorderedEquality._elementEquality\",[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]]]", () => Object.freeze(Object.assign(Object.create(SetEquality.prototype), { _elementEquality: __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) }))).equals(this.ranges, other.ranges));
  }
  get hashCode() {
    return ((this.negated ? 1 : 3) * __dartConst("[\"instance\",\"class:SetEquality\",[\"typeArgument\",\"InterfaceType(Range)\"],[\"field\",\"field:_UnorderedEquality._elementEquality\",[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]]]", () => Object.freeze(Object.assign(Object.create(SetEquality.prototype), { _elementEquality: __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) }))).hash(this.ranges));
  }
  toString() {
    let buffer = (() => { let v = __dartStringBuffer(""); return (() => {
      v.write("[");
      return v;
    })(); })();
    {
      let _sync_for_iterator = __dartIterator(this.ranges);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let range = _sync_for_iterator.current;
          L:
          {
            buffer.writeCharCode(range.min);
            if (range.isSingleton) {
              break L;
            }
            buffer.write("-");
            buffer.writeCharCode(range.max);
          }
        }
      }
    }
    buffer.write("]");
    return __dartStr(buffer);
  }
}

class OptionsNode extends AstNode {
  constructor(options, { caseSensitive = true } = {}) {
    const $self = $AstNode__(new.target, caseSensitive);
    $self.options = Array.from(options);
    return $self;
  }
  get canMatchAbsolute() {
    return Array.from(this.options).some(function(node) { return node.canMatchAbsolute; });
  }
  get canMatchRelative() {
    return Array.from(this.options).some(function(node) { return node.canMatchRelative; });
  }
  flattenOptions() {
    return new OptionsNode(Array.from(this.options).flatMap((value) => Array.from((function(option) { return option.flattenOptions().options; })(value))), { caseSensitive: this.caseSensitive });
  }
  _toRegExp() {
    return "(?:" + __dartStr(__dartIterableJoin(Array.from(this.options, function(option) { return option._toRegExp(); }), "|")) + ")";
  }
  "=="(other) {
    return (other instanceof OptionsNode && __dartConst("[\"instance\",\"class:UnorderedIterableEquality\",[\"typeArgument\",\"InterfaceType(SequenceNode)\"],[\"field\",\"field:_UnorderedEquality._elementEquality\",[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]]]", () => Object.freeze(Object.assign(Object.create(UnorderedIterableEquality.prototype), { _elementEquality: __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) }))).equals(this.options, other.options));
  }
  get hashCode() {
    return __dartConst("[\"instance\",\"class:UnorderedIterableEquality\",[\"typeArgument\",\"InterfaceType(SequenceNode)\"],[\"field\",\"field:_UnorderedEquality._elementEquality\",[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]]]", () => Object.freeze(Object.assign(Object.create(UnorderedIterableEquality.prototype), { _elementEquality: __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) }))).hash(this.options);
  }
  toString() {
    return "{" + __dartStr(__dartIterableJoin(this.options, ",")) + "}";
  }
}

class LiteralNode extends AstNode {
  constructor(text, { context: context_1 = null, caseSensitive = true } = {}) {
    const $self = $AstNode__(new.target, caseSensitive);
    $self.text = text;
    $self._context = context_1;
    return $self;
  }
  get canMatchAbsolute() {
    let nativeText = (__dartEquals(__dartNullCheck(this._context).style, Style.windows) ? this.text.replaceAll("/", "\\") : this.text);
    return (this._context ?? __dartAs(v, value => value instanceof Context, "Context")).isAbsolute(nativeText);
  }
  get canMatchRelative() {
    return !(this.canMatchAbsolute);
  }
  _toRegExp() {
    return regExpQuote(this.text);
  }
  "=="(other) {
    return (other instanceof LiteralNode && __dartEquals(other.text, this.text));
  }
  get hashCode() {
    return this.text.hashCode;
  }
  toString() {
    return this.text;
  }
}

class ListTree {
  static _(_trees, _fileSystem) {
    return $ListTree__(ListTree, _trees, _fileSystem);
  }
  constructor(glob, fileSystem) {
    let options = glob.flattenOptions();
    let trees = new Map([]);
    {
      let _sync_for_iterator = __dartIterator(options.options);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let option = _sync_for_iterator.current;
          {
            let components = option.split(context);
            let firstNode = __dartIterableFirst(__dartIndexGet(components, 0).nodes);
            let root = ".";
            if (firstNode instanceof LiteralNode) {
              {
                let text = firstNode.text;
                if (__dartEquals(context, windows)) {
                  text.replaceAll("/", "\\");
                }
                if (isAbsolute(text)) {
                  {
                    root = firstNode.text;
                    components.splice(0, 1)[0];
                  }
                }
              }
            }
            ListTree._addGlob(root, components, trees);
          }
        }
      }
    }
    return ListTree._(trees, fileSystem);
  }
  static _addGlob(root, components, trees) {
    let parent = __dartMapGet(trees, root);
    for (let i = 0; (i < components.length); i = (i + 1)) {
      {
        let component = __dartIndexGet(components, i);
        let recursive = Array.from(component.nodes).some(function(node) { return node instanceof DoubleStarNode; });
        let complete = __dartEquals(i, (components.length - 1));
        if (!((parent === null))) {
          {
            if ((parent.isRecursive || recursive)) {
              {
                parent.makeRecursive();
                parent.addOption(_join(components.slice(i)));
                return;
              }
            } else {
              if (complete) {
                {
                  parent.addOption(component);
                }
              } else {
                {
                  let children = __dartNullCheck(parent.children);
                  if (!(__dartMapContainsKey(children, component))) {
                    {
                      __dartMapSet(children, component, new _ListTreeNode());
                    }
                  }
                  parent = __dartMapGet(children, component);
                }
              }
            }
          }
        } else {
          if (recursive) {
            {
              __dartMapSet(trees, root, _ListTreeNode.recursive(_join(components.slice(i))));
              return;
            }
          } else {
            if (complete) {
              {
                __dartMapSet(trees, root, (() => { let v = new _ListTreeNode(); return (() => {
                  v.addOption(component);
                  return v;
                })(); })());
              }
            } else {
              {
                let rootNode = new _ListTreeNode();
                __dartMapSet(trees, root, rootNode);
                let rootChildren = __dartNullCheck(rootNode.children);
                __dartMapSet(rootChildren, component, new _ListTreeNode());
                parent = __dartMapGet(rootChildren, component);
              }
            }
          }
        }
      }
    }
  }
  static _computeCanOverlap(trees) {
    if (((trees.size > 1) && __dartMapContainsKey(trees, "."))) {
      return true;
    }
    return Array.from(Array.from(trees.values())).some(function(node) { return node.canOverlap; });
  }
  list({ root = null, followLinks = true } = {}) {
    ((root === null) ? root = "." : null);
    let group = new StreamGroup();
    {
      let _sync_for_iterator = __dartIterator(Array.from(this._trees.keys()));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let rootDir = _sync_for_iterator.current;
          {
            let dir = (__dartEquals(rootDir, ".") ? root : rootDir);
            group.add(__dartNullCheck(__dartMapGet(this._trees, rootDir)).list(dir, this._fileSystem, { followLinks: followLinks }));
          }
        }
      }
    }
    group.close();
    if (!(this._canOverlap)) {
      return group.stream;
    }
    let seen = (() => {
      const v = new Set();
      return v;
    })();
    return __dartStreamWhere(group.stream, function(entity) { return __dartSetAdd(seen, entity.path); });
  }
  listSync({ root = null, followLinks = true } = {}) {
    ((root === null) ? root = "." : null);
    let result = Array.from(Array.from(this._trees.keys())).flatMap((value) => Array.from(((rootDir) => {
      let dir = (__dartEquals(rootDir, ".") ? __dartNullCheck(root) : rootDir);
      return __dartNullCheck(__dartMapGet(this._trees, rootDir)).listSync(dir, this._fileSystem, { followLinks: followLinks });
})(value)));
    if (!(this._canOverlap)) {
      return Array.from(result);
    }
    let seen = (() => {
      const v = new Set();
      return v;
    })();
    return Array.from(Array.from(result).filter(function(entity) { return __dartSetAdd(seen, entity.path); }));
  }
}

function $ListTree__($newTarget, _trees, _fileSystem) {
  const $self = Object.create($newTarget.prototype);
  $self._trees = _trees;
  $self._fileSystem = _fileSystem;
  $self._canOverlap = ListTree._computeCanOverlap(_trees);
  return $self;
}

class _ListTreeNode {
  constructor() {
    this.children = new Map([]);
    this._validator = null;
  }
  static recursive(validator) {
    return $_ListTreeNode_recursive(_ListTreeNode, validator);
  }
  get isRecursive() {
    return (this.children === null);
  }
  get _caseSensitive() {
    if (!((this._validator === null))) {
      return __dartNullCheck(this._validator).caseSensitive;
    }
    if (!(__dartEquals(((this.children)?.isEmpty ?? null), false))) {
      return true;
    }
    return __dartIterableFirst(Array.from(__dartNullCheck(this.children).keys())).caseSensitive;
  }
  get _isIntermediate() {
    if (!((this._validator === null))) {
      return false;
    }
    return Array.from(Array.from(__dartNullCheck(this.children).keys())).every(function(sequence) { return (__dartEquals(sequence.nodes.length, 1) && __dartIterableFirst(sequence.nodes) instanceof LiteralNode); });
  }
  get canOverlap() {
    if (this.isRecursive) {
      return false;
    }
    if ((__dartNullCheck(this.children).size > 1)) {
      {
        if (!(this._caseSensitive)) {
          return true;
        }
        if (Array.from(Array.from(__dartNullCheck(this.children).keys())).some(function(sequence) { return ((sequence.nodes.length > 1) || !(__dartIterableSingle(sequence.nodes) instanceof LiteralNode)); })) {
          {
            return true;
          }
        }
      }
    }
    return Array.from(Array.from(__dartNullCheck(this.children).values())).some(function(node) { return node.canOverlap; });
  }
  makeRecursive() {
    if (this.isRecursive) {
      return;
    }
    let children = __dartNullCheck(this.children);
    this._validator = new OptionsNode(Array.from(Array.from(children, ([key, value]) => ({ key, value })), function(entry) {
      entry.value.makeRecursive();
      return _join([entry.key, __dartNullCheck(entry.value._validator)]);
}), { caseSensitive: this._caseSensitive });
    this.children = null;
  }
  addOption(validator) {
    if ((this._validator === null)) {
      {
        this._validator = new OptionsNode([validator], { caseSensitive: validator.caseSensitive });
      }
    } else {
      {
        (__dartNullCheck(this._validator).options.push(validator), null);
      }
    }
  }
  list(dir, fileSystem, { followLinks = true } = {}) {
    if (this.isRecursive) {
      {
        return __dartStreamWhere(_extension_0_ignoreMissing(fileSystem.directory(dir).list({ recursive: true, followLinks: followLinks })), (entity) => { return this._matches(relative(entity.path, { from: dir })); });
      }
    }
    if ((this._isIntermediate && this._caseSensitive)) {
      {
        let resultGroup = new StreamGroup();
        (__dartNullCheck(this.children).forEach((value, key) => (function(sequence, child) {
          resultGroup.add(child.list(join(dir, __dartAs(__dartIterableSingle(sequence.nodes), value => value instanceof LiteralNode, "LiteralNode").text), fileSystem, { followLinks: followLinks }));
})(key, value)), null);
        resultGroup.close();
        return resultGroup.stream;
      }
    }
    return StreamCompleter.fromFuture((async () => {
      let entities = await __dartStreamToList(_extension_0_ignoreMissing(fileSystem.directory(dir).list({ followLinks: followLinks })));
      await this._validateIntermediateChildrenAsync(dir, entities, fileSystem);
      let resultGroup = new StreamGroup();
      let resultController = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null });
      (resultGroup.add(resultController.stream), null);
      {
        let _sync_for_iterator = __dartIterator(entities);
        for (; _sync_for_iterator.moveNext(); ) {
          {
            let entity = _sync_for_iterator.current;
            {
              let basename_1 = relative(entity.path, { from: dir });
              if (this._matches(basename_1)) {
                resultController.add(entity);
              }
              (__dartNullCheck(this.children).forEach((value, key) => (function(sequence, child) {
                if (!(entity instanceof Directory)) {
                  return;
                }
                if (!(sequence.matches(basename_1))) {
                  return;
                }
                let stream = child.list(join(dir, basename_1), fileSystem, { followLinks: followLinks });
                resultGroup.add(stream);
})(key, value)), null);
            }
          }
        }
      }
      (resultController.close(), null);
      (resultGroup.close(), null);
      return resultGroup.stream;
})());
  }
  async _validateIntermediateChildrenAsync(dir, entities, fileSystem) {
    if (this._caseSensitive) {
      return;
    }
    {
      let _sync_for_iterator = __dartIterator(Array.from(__dartNullCheck(this.children), ([key, value]) => ({ key, value })));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let entry = _sync_for_iterator.current;
          L:
          {
            let child = entry.value;
            let sequence = entry.key;
            if (!(child._isIntermediate)) {
              break L;
            }
            if (Array.from(entities).some(function(entity) { return sequence.matches(relative(entity.path, { from: dir })); })) {
              {
                break L;
              }
            }
            await __dartStreamToList(child.list(join(dir, __dartAs(__dartIterableSingle(sequence.nodes), value => value instanceof LiteralNode, "LiteralNode").text), fileSystem));
          }
        }
      }
    }
  }
  listSync(dir, fileSystem, { followLinks = true } = {}) {
    if (this.isRecursive) {
      {
        try {
          {
            return Array.from(fileSystem.directory(dir).listSync({ recursive: true, followLinks: followLinks })).filter((entity) => { return this._matches(relative(entity.path, { from: dir })); });
          }
        } catch ($error) {
          if ($error instanceof Error || ($error != null && typeof $error === "object" && "message" in $error)) {
            const error = $error;
            {
              if (_extension_1_get_isMissing(error)) {
                return __dartConst("[\"list\",\"InterfaceType(FileSystemEntity)\"]", () => Object.freeze([]));
              }
              (() => { throw $error; })();
            }
          } else {
            throw $error;
          }
        }
      }
    }
    if ((this._isIntermediate && this._caseSensitive)) {
      {
        return Array.from(Array.from(__dartNullCheck(this.children), ([key, value]) => ({ key, value }))).flatMap((value) => Array.from((function(entry) {
          let sequence = entry.key;
          let child = entry.value;
          return child.listSync(join(dir, __dartAs(__dartIterableSingle(sequence.nodes), value => value instanceof LiteralNode, "LiteralNode").text), fileSystem, { followLinks: followLinks });
})(value)));
      }
    }
    let entities = null;
    try {
      {
        entities = fileSystem.directory(dir).listSync({ followLinks: followLinks });
      }
    } catch ($error_1) {
      if ($error_1 instanceof Error || ($error_1 != null && typeof $error_1 === "object" && "message" in $error_1)) {
        const error_1 = $error_1;
        {
          if (_extension_1_get_isMissing(error_1)) {
            return __dartConst("[\"list\",\"InterfaceType(FileSystemEntity)\"]", () => Object.freeze([]));
          }
          (() => { throw $error_1; })();
        }
      } else {
        throw $error_1;
      }
    }
    this._validateIntermediateChildrenSync(dir, entities, fileSystem);
    return Array.from(entities).flatMap((value) => Array.from(((entity) => {
      let entities = new Array(0).fill(null);
      let basename_1 = relative(entity.path, { from: dir });
      if (this._matches(basename_1)) {
        (entities.push(entity), null);
      }
      if (!(entity instanceof Directory)) {
        return entities;
      }
      (entities.push(...Array.from(Array.from(Array.from(Array.from(__dartNullCheck(this.children).keys())).filter(function(sequence) { return sequence.matches(basename_1); })).flatMap((value) => Array.from(((sequence) => { return Array.from(__dartNullCheck(__dartMapGet(__dartNullCheck(this.children), sequence)).listSync(join(dir, basename_1), fileSystem, { followLinks: followLinks })); })(value))))), null);
      return entities;
})(value)));
  }
  _validateIntermediateChildrenSync(dir, entities, fileSystem) {
    if (this._caseSensitive) {
      return;
    }
    (__dartNullCheck(this.children).forEach((value, key) => (function(sequence, child) {
      if (!(child._isIntermediate)) {
        return;
      }
      if (Array.from(entities).some(function(entity) { return sequence.matches(relative(entity.path, { from: dir })); })) {
        {
          return;
        }
      }
      child.listSync(join(dir, __dartAs(__dartIterableSingle(sequence.nodes), value => value instanceof LiteralNode, "LiteralNode").text), fileSystem);
})(key, value)), null);
  }
  _matches(path) {
    return ((this._validator)?.matches(toPosixPath(context, path)) ?? false);
  }
  toString() {
    return "(" + __dartStr(this._validator) + ") " + __dartStr(this.children);
  }
}

function $_ListTreeNode_recursive($newTarget, validator) {
  const $self = Object.create($newTarget.prototype);
  $self.children = null;
  $self._validator = new OptionsNode([validator], { caseSensitive: validator.caseSensitive });
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
    this.source = source;
  }
  get offset() {
    return (() => { let v = this.span; return ((v === null) ? null : v.start.offset); })();
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

class Parser {
  constructor(component, _context, { caseSensitive = true } = {}) {
    this._context = _context;
    this._scanner = new StringScanner(component);
    this._caseSensitive = caseSensitive;
  }
  parse() {
    return this._parseSequence();
  }
  _parseSequence({ inOptions = false } = {}) {
    let nodes = new Array(0).fill(null);
    if (this._scanner.isDone) {
      {
        this._scanner.error("expected a glob.", { position: 0, length: 0 });
      }
    }
    L:
    while (!(this._scanner.isDone)) {
      {
        if ((inOptions && (this._scanner.matches(",") || this._scanner.matches("}")))) {
          break L;
        }
        (nodes.push(this._parseNode({ inOptions: inOptions })), null);
      }
    }
    return new SequenceNode(nodes, { caseSensitive: this._caseSensitive });
  }
  _parseNode({ inOptions = false } = {}) {
    let star = this._parseStar();
    if (!((star === null))) {
      return star;
    }
    let anyChar = this._parseAnyChar();
    if (!((anyChar === null))) {
      return anyChar;
    }
    let range = this._parseRange();
    if (!((range === null))) {
      return range;
    }
    let options = this._parseOptions();
    if (!((options === null))) {
      return options;
    }
    return this._parseLiteral({ inOptions: inOptions });
  }
  _parseStar() {
    if (!(this._scanner.scan("*"))) {
      return null;
    }
    return (this._scanner.scan("*") ? new DoubleStarNode(this._context, { caseSensitive: this._caseSensitive }) : new StarNode({ caseSensitive: this._caseSensitive }));
  }
  _parseAnyChar() {
    if (!(this._scanner.scan("?"))) {
      return null;
    }
    return new AnyCharNode({ caseSensitive: this._caseSensitive });
  }
  _parseRange() {
    if (!(this._scanner.scan("["))) {
      return null;
    }
    if (this._scanner.matches("]")) {
      this._scanner.error("unexpected \"]\".");
    }
    let negated = (this._scanner.scan("!") || this._scanner.scan("^"));
    const readRangeChar = () => {
      let char = this._scanner.readChar();
      if ((negated || !(__dartEquals(char, 47)))) {
        return char;
      }
      this._scanner.error("\"/\" may not be used in a range.", { position: (this._scanner.position - 1) });
    };
    let ranges = new Array(0).fill(null);
    while (!(this._scanner.scan("]"))) {
      L:
      {
        let start = this._scanner.position;
        this._scanner.scan("\\");
        let char = readRangeChar();
        if (this._scanner.scan("-")) {
          {
            if (this._scanner.matches("]")) {
              {
                (ranges.push(Range.singleton(char)), null);
                (ranges.push(Range.singleton(45)), null);
                break L;
              }
            }
            this._scanner.scan("\\");
            let end = readRangeChar();
            if ((end < char)) {
              {
                this._scanner.error("Range out of order.", { position: start, length: (this._scanner.position - start) });
              }
            }
            (ranges.push(new Range(char, end)), null);
          }
        } else {
          {
            (ranges.push(Range.singleton(char)), null);
          }
        }
      }
    }
    return new RangeNode(ranges, { negated: negated, caseSensitive: this._caseSensitive });
  }
  _parseOptions() {
    if (!(this._scanner.scan("{"))) {
      return null;
    }
    if (this._scanner.matches("}")) {
      this._scanner.error("unexpected \"}\".");
    }
    let options = new Array(0).fill(null);
    do {
      {
        (options.push(this._parseSequence({ inOptions: true })), null);
      }
    } while (this._scanner.scan(","));
    if (__dartEquals(options.length, 1)) {
      this._scanner.expect(",");
    }
    this._scanner.expect("}");
    return new OptionsNode(options, { caseSensitive: this._caseSensitive });
  }
  _parseLiteral({ inOptions = false } = {}) {
    let regExp = __dartRegExp((inOptions ? "[^*{[?\\\\}\\],()]*" : "[^*{[?\\\\}\\]()]*"), { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });
    this._scanner.scan(regExp);
    let buffer = (() => { let v = __dartStringBuffer(""); return (() => {
      v.write(__dartNullCheck(this._scanner.lastMatch)[0]);
      return v;
    })(); })();
    while (this._scanner.scan("\\")) {
      {
        buffer.writeCharCode(this._scanner.readChar());
        this._scanner.scan(regExp);
        buffer.write(__dartNullCheck(this._scanner.lastMatch)[0]);
      }
    }
    {
      let _sync_for_iterator = __dartIterator(__dartConst("[\"list\",\"InterfaceType(String)\",[\"string\",\"]\"],[\"string\",\"(\"],[\"string\",\")\"]]", () => Object.freeze(["]", "(", ")"])));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let char = _sync_for_iterator.current;
          {
            if (this._scanner.matches(char)) {
              this._scanner.error("unexpected \"" + __dartStr(char) + "\"");
            }
          }
        }
      }
    }
    if ((!(inOptions) && this._scanner.matches("}"))) {
      this._scanner.error("unexpected \"}\"");
    }
    return new LiteralNode(__dartStr(buffer), { context: this._context, caseSensitive: this._caseSensitive });
  }
}

class Glob {
  static _(pattern, context_1, _ast, recursive) {
    return $Glob__(Glob, pattern, context_1, _ast, recursive);
  }
  get caseSensitive() {
    return this._ast.caseSensitive;
  }
  get _contextIsAbsolute() {
    return (this._contextIsAbsoluteCache ?? (this._contextIsAbsoluteCache = this.context.isAbsolute(this.context.current)));
  }
  get _patternCanMatchAbsolute() {
    return (this._patternCanMatchAbsoluteCache ?? (this._patternCanMatchAbsoluteCache = this._ast.canMatchAbsolute));
  }
  get _patternCanMatchRelative() {
    return (this._patternCanMatchRelativeCache ?? (this._patternCanMatchRelativeCache = this._ast.canMatchRelative));
  }
  static quote(contents) {
    return __dartStringReplaceAllMapped(contents, _quoteRegExp, function(match) { return "\\" + __dartStr(match[0]); });
  }
  constructor(pattern, { context: context_1 = null, recursive = false, caseSensitive = null } = {}) {
    ((context_1 === null) ? context_1 = context : null);
    ((caseSensitive === null) ? caseSensitive = (__dartEquals(context_1.style, Style.windows) ? false : true) : null);
    if (recursive) {
      pattern = (pattern + "{,/**}");
    }
    let parser = new Parser(pattern, context_1, { caseSensitive: caseSensitive });
    return Glob._(pattern, context_1, parser.parse(), recursive);
  }
  listFileSystem(fileSystem, { root = null, followLinks = true } = {}) {
    if (!(__dartEquals(this.context.style, style()))) {
      {
        (() => { throw __dartCoreError("StateError", "Can't list glob \"" + __dartStr(this) + "\"; it matches " + __dartStr(this.context.style) + " paths, but this platform uses " + __dartStr(style()) + " paths."); })();
      }
    }
    return this._listTreeForFileSystem(fileSystem).list({ root: root, followLinks: followLinks });
  }
  listFileSystemSync(fileSystem, { root = null, followLinks = true } = {}) {
    if (!(__dartEquals(this.context.style, style()))) {
      {
        (() => { throw __dartCoreError("StateError", "Can't list glob \"" + __dartStr(this) + "\"; it matches " + __dartStr(this.context.style) + " paths, but this platform uses " + __dartStr(style()) + " paths."); })();
      }
    }
    return this._listTreeForFileSystem(fileSystem).listSync({ root: root, followLinks: followLinks });
  }
  matches(path) {
    return !((this.matchAsPrefix(path) === null));
  }
  matchAsPrefix(path, start = 0) {
    if (!(__dartEquals(start, 0))) {
      return null;
    }
    if ((this._patternCanMatchAbsolute && (this._contextIsAbsolute || this.context.isAbsolute(path)))) {
      {
        let absolutePath = this.context.normalize(this.context.absolute(path));
        if (this._ast.matches(toPosixPath(this.context, absolutePath))) {
          {
            return new GlobMatch(path, this);
          }
        }
      }
    }
    if (this._patternCanMatchRelative) {
      {
        let relativePath = this.context.relative(path);
        if (this._ast.matches(toPosixPath(this.context, relativePath))) {
          {
            return new GlobMatch(path, this);
          }
        }
      }
    }
    return null;
  }
  allMatches(path, start = 0) {
    let match = this.matchAsPrefix(path, start);
    return ((match === null) ? new Array(0).fill(null) : [match]);
  }
  toString() {
    return this.pattern;
  }
  _listTreeForFileSystem(fileSystem) {
    if (fileSystem instanceof MemoryFileSystem) {
      return new ListTree(this._ast, fileSystem);
    }
    if (!(__dartEquals(fileSystem, this._previousFileSystem))) {
      {
        this._listTree = null;
        this._previousFileSystem = fileSystem;
      }
    }
    return (this._listTree ?? (this._listTree = new ListTree(this._ast, fileSystem)));
  }
}

function $Glob__($newTarget, pattern, context_1, _ast, recursive) {
  const $self = Object.create($newTarget.prototype);
  $self._listTree = null;
  $self._previousFileSystem = null;
  $self._contextIsAbsoluteCache = null;
  $self._patternCanMatchAbsoluteCache = null;
  $self._patternCanMatchRelativeCache = null;
  $self.pattern = pattern;
  $self.context = context_1;
  $self._ast = _ast;
  $self.recursive = recursive;
  return $self;
}


Object.defineProperty(Result, "captureStreamTransformer", { value: __dartConst("[\"instance\",\"class:CaptureStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]", () => Object.freeze(Object.create(CaptureStreamTransformer.prototype))), enumerable: true });

Object.defineProperty(Result, "releaseStreamTransformer", { value: __dartConst("[\"instance\",\"class:ReleaseStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]", () => Object.freeze(Object.create(ReleaseStreamTransformer.prototype))), enumerable: true });

Object.defineProperty(Result, "captureSinkTransformer", { value: __dartConst("[\"instance\",\"class:StreamTransformerWrapper\",[\"typeArgument\",\"InterfaceType(Object)\"],[\"typeArgument\",\"InterfaceType(Result<Object>)\"],[\"field\",\"field:StreamTransformerWrapper._transformer\",[\"instance\",\"class:CaptureStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]]]", () => Object.freeze(Object.assign(Object.create(StreamTransformerWrapper.prototype), { _transformer: __dartConst("[\"instance\",\"class:CaptureStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]", () => Object.freeze(Object.create(CaptureStreamTransformer.prototype))) }))), enumerable: true });

Object.defineProperty(Result, "releaseSinkTransformer", { value: __dartConst("[\"instance\",\"class:StreamTransformerWrapper\",[\"typeArgument\",\"InterfaceType(Result<Object>)\"],[\"typeArgument\",\"InterfaceType(Object)\"],[\"field\",\"field:StreamTransformerWrapper._transformer\",[\"instance\",\"class:ReleaseStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]]]", () => Object.freeze(Object.assign(Object.create(StreamTransformerWrapper.prototype), { _transformer: __dartConst("[\"instance\",\"class:ReleaseStreamTransformer\",[\"typeArgument\",\"InterfaceType(Object)\"]]", () => Object.freeze(Object.create(ReleaseStreamTransformer.prototype))) }))), enumerable: true });

Object.defineProperty(TargetKind, "classType", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"classes\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"classType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "classes", name: "classType" }))), enumerable: true });

Object.defineProperty(TargetKind, "constructor", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"constructors\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"constructor\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "constructors", name: "constructor" }))), enumerable: true });

Object.defineProperty(TargetKind, "directive", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"directive\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "directives", name: "directive" }))), enumerable: true });

Object.defineProperty(TargetKind, "enumType", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enums\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "enums", name: "enumType" }))), enumerable: true });

Object.defineProperty(TargetKind, "enumValue", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enum values\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumValue\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "enum values", name: "enumValue" }))), enumerable: true });

Object.defineProperty(TargetKind, "exportDirective", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"export directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"exportDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "export directives", name: "exportDirective" }))), enumerable: true });

Object.defineProperty(TargetKind, "extension", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extensions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extension\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "extensions", name: "extension" }))), enumerable: true });

Object.defineProperty(TargetKind, "extensionType", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extension types\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extensionType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "extension types", name: "extensionType" }))), enumerable: true });

Object.defineProperty(TargetKind, "field", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"fields\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"field\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "fields", name: "field" }))), enumerable: true });

Object.defineProperty(TargetKind, "function", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level functions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"function\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "top-level functions", name: "function" }))), enumerable: true });

Object.defineProperty(TargetKind, "library", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"libraries\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"library\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "libraries", name: "library" }))), enumerable: true });

Object.defineProperty(TargetKind, "getter", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"getters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"getter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "getters", name: "getter" }))), enumerable: true });

Object.defineProperty(TargetKind, "importDirective", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"import directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"importDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "import directives", name: "importDirective" }))), enumerable: true });

Object.defineProperty(TargetKind, "method", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"methods\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"method\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "methods", name: "method" }))), enumerable: true });

Object.defineProperty(TargetKind, "mixinType", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"mixins\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"mixinType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "mixins", name: "mixinType" }))), enumerable: true });

Object.defineProperty(TargetKind, "optionalParameter", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"optional parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"optionalParameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "optional parameters", name: "optionalParameter" }))), enumerable: true });

Object.defineProperty(TargetKind, "overridableMember", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"overridable members\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"overridableMember\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "overridable members", name: "overridableMember" }))), enumerable: true });

Object.defineProperty(TargetKind, "parameter", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"parameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "parameters", name: "parameter" }))), enumerable: true });

Object.defineProperty(TargetKind, "partOfDirective", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"\\\"part of\\\" directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"partOfDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "\"part of\" directives", name: "partOfDirective" }))), enumerable: true });

Object.defineProperty(TargetKind, "setter", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"setters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"setter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "setters", name: "setter" }))), enumerable: true });

Object.defineProperty(TargetKind, "topLevelVariable", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level variables\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"topLevelVariable\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "top-level variables", name: "topLevelVariable" }))), enumerable: true });

Object.defineProperty(TargetKind, "type", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"types (classes, enums, mixins, or typedefs)\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"type\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "types (classes, enums, mixins, or typedefs)", name: "type" }))), enumerable: true });

Object.defineProperty(TargetKind, "typedefType", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"typedefs\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typedefType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "typedefs", name: "typedefType" }))), enumerable: true });

Object.defineProperty(TargetKind, "typeParameter", { value: __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"type parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typeParameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "type parameters", name: "typeParameter" }))), enumerable: true });

Object.defineProperty(TargetKind, "values", { value: __dartConst("[\"list\",\"InterfaceType(TargetKind)\",[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"classes\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"classType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"constructors\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"constructor\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"directive\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enums\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enum values\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumValue\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"export directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"exportDirective\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extensions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extension\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extension types\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extensionType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"fields\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"field\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level functions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"function\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"libraries\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"library\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"getters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"getter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"import directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"importDirective\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"methods\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"method\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"mixins\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"mixinType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"optional parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"optionalParameter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"overridable members\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"overridableMember\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"parameter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"\\\"part of\\\" directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"partOfDirective\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"setters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"setter\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level variables\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"topLevelVariable\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"types (classes, enums, mixins, or typedefs)\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"type\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"typedefs\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typedefType\"]]],[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"type parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typeParameter\"]]]]", () => Object.freeze([__dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"classes\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"classType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "classes", name: "classType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"constructors\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"constructor\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "constructors", name: "constructor" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"directive\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "directives", name: "directive" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enums\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "enums", name: "enumType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"enum values\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"enumValue\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "enum values", name: "enumValue" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"export directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"exportDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "export directives", name: "exportDirective" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extensions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extension\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "extensions", name: "extension" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"extension types\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"extensionType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "extension types", name: "extensionType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"fields\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"field\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "fields", name: "field" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level functions\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"function\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "top-level functions", name: "function" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"libraries\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"library\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "libraries", name: "library" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"getters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"getter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "getters", name: "getter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"import directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"importDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "import directives", name: "importDirective" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"methods\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"method\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "methods", name: "method" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"mixins\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"mixinType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "mixins", name: "mixinType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"optional parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"optionalParameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "optional parameters", name: "optionalParameter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"overridable members\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"overridableMember\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "overridable members", name: "overridableMember" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"parameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "parameters", name: "parameter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"\\\"part of\\\" directives\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"partOfDirective\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "\"part of\" directives", name: "partOfDirective" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"setters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"setter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "setters", name: "setter" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"top-level variables\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"topLevelVariable\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "top-level variables", name: "topLevelVariable" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"types (classes, enums, mixins, or typedefs)\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"type\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "types (classes, enums, mixins, or typedefs)", name: "type" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"typedefs\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typedefType\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "typedefs", name: "typedefType" }))), __dartConst("[\"instance\",\"class:TargetKind\",[\"field\",\"field:TargetKind.displayString\",[\"string\",\"type parameters\"]],[\"field\",\"field:TargetKind.name\",[\"string\",\"typeParameter\"]]]", () => Object.freeze(Object.assign(Object.create(TargetKind.prototype), { displayString: "type parameters", name: "typeParameter" })))])), enumerable: true });

Object.defineProperty(_StreamGroupState, "dormant", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" }))), enumerable: true });

Object.defineProperty(_StreamGroupState, "listening", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"listening\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "listening" }))), enumerable: true });

Object.defineProperty(_StreamGroupState, "paused", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"paused\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "paused" }))), enumerable: true });

Object.defineProperty(_StreamGroupState, "canceled", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"canceled\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "canceled" }))), enumerable: true });

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

const $MemoryFileStat_notFound = __dartLazyField("MemoryFileStat.notFound", () => MemoryFileStat._internalNotFound(), false);
Object.defineProperty(MemoryFileStat, "notFound", {
  get() { return $MemoryFileStat_notFound.get(); },
  set(value) { $MemoryFileStat_notFound.set(value); },
  enumerable: true,
});

Object.defineProperty(FileSystemOp, "read", { value: __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"0\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 0 }))), enumerable: true });

Object.defineProperty(FileSystemOp, "write", { value: __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"1\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 1 }))), enumerable: true });

Object.defineProperty(FileSystemOp, "delete", { value: __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"2\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 2 }))), enumerable: true });

Object.defineProperty(FileSystemOp, "create", { value: __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"3\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 3 }))), enumerable: true });

Object.defineProperty(FileSystemOp, "open", { value: __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"4\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 4 }))), enumerable: true });

Object.defineProperty(FileSystemOp, "copy", { value: __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"5\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 5 }))), enumerable: true });

Object.defineProperty(FileSystemOp, "exists", { value: __dartConst("[\"instance\",\"class:FileSystemOp\",[\"field\",\"field:FileSystemOp._value\",[\"int\",\"6\"]]]", () => Object.freeze(Object.assign(Object.create(FileSystemOp.prototype), { _value: 6 }))), enumerable: true });

Object.defineProperty(FileSystemStyle, "posix", { value: __dartConst("[\"instance\",\"class:_Posix\"]", () => Object.freeze(Object.create(_Posix.prototype))), enumerable: true });

Object.defineProperty(FileSystemStyle, "windows", { value: __dartConst("[\"instance\",\"class:_Windows\"]", () => Object.freeze(Object.create(_Windows.prototype))), enumerable: true });

Object.defineProperty(Highlighter, "_spacesPerTab", { value: 4, enumerable: true });
function _forward(forwarder) {
  return forwarder._forward();
}

function _extension_0_completeErrorIfPending(_this, error, stackTrace) {
  if (_this.isCompleted) {
    return;
  }
  _this.completeError(error, stackTrace);
}

function _extension_0_get_completeErrorIfPending(_this) {
  return function(error, stackTrace) { return _extension_0_completeErrorIfPending(_this, error, stackTrace); };
}

function collectBytes(source) {
  return _collectBytes(source, function(_, result) { return result; });
}

function collectBytesCancelable(source) {
  return _collectBytes(source, function(subscription, result) { return CancelableOperation.fromFuture(result, { onCancel: __dartBind(subscription, "cancel") }); });
}

function _collectBytes(source, result) {
  let bytes = __dartBytesBuilder(false);
  let completer = __dartCompleter();
  let subscription = __dartStreamListen(source, __dartBind(bytes, "add"), __dartBind(completer, "completeError"), function() {
    completer.complete(bytes.takeBytes());
}, true);
  return (result)(subscription, completer.future);
}

async function ChunkedStreamReaderByteStreamExt_readBytes(_this, size) {
  return await collectBytes(_this.readStream(size));
}

function ChunkedStreamReaderByteStreamExt_get_readBytes(_this) {
  return function(size) { return ChunkedStreamReaderByteStreamExt_readBytes(_this, size); };
}

function _closeSink(sink) {
  sink.close();
}

const alwaysThrows = __dartConst("[\"instance\",\"class:_AlwaysThrows\"]", () => Object.freeze(Object.create(_AlwaysThrows.prototype)));

const awaitNotRequired = __dartConst("[\"instance\",\"class:_AwaitNotRequired\"]", () => Object.freeze(Object.create(_AwaitNotRequired.prototype)));

const checked = __dartConst("[\"instance\",\"class:_Checked\"]", () => Object.freeze(Object.create(_Checked.prototype)));

const doNotStore = __dartConst("[\"instance\",\"class:_DoNotStore\"]", () => Object.freeze(Object.create(_DoNotStore.prototype)));

const doNotSubmit = __dartConst("[\"instance\",\"class:_DoNotSubmit\"]", () => Object.freeze(Object.create(_DoNotSubmit.prototype)));

const experimental = __dartConst("[\"instance\",\"class:_Experimental\"]", () => Object.freeze(Object.create(_Experimental.prototype)));

const factory = __dartConst("[\"instance\",\"class:_Factory\"]", () => Object.freeze(Object.create(_Factory.prototype)));

const immutable = __dartConst("[\"instance\",\"class:Immutable\",[\"field\",\"field:Immutable.reason\",[\"string\",\"\"]]]", () => Object.freeze(Object.assign(Object.create(Immutable.prototype), { reason: "" })));

const internal = __dartConst("[\"instance\",\"class:_Internal\"]", () => Object.freeze(Object.create(_Internal.prototype)));

const isTest = __dartConst("[\"instance\",\"class:_IsTest\"]", () => Object.freeze(Object.create(_IsTest.prototype)));

const isTestGroup = __dartConst("[\"instance\",\"class:_IsTestGroup\"]", () => Object.freeze(Object.create(_IsTestGroup.prototype)));

const literal = __dartConst("[\"instance\",\"class:_Literal\"]", () => Object.freeze(Object.create(_Literal.prototype)));

const mustBeConst = __dartConst("[\"instance\",\"class:_MustBeConst\"]", () => Object.freeze(Object.create(_MustBeConst.prototype)));

const mustBeOverridden = __dartConst("[\"instance\",\"class:_MustBeOverridden\"]", () => Object.freeze(Object.create(_MustBeOverridden.prototype)));

const mustCallSuper = __dartConst("[\"instance\",\"class:_MustCallSuper\"]", () => Object.freeze(Object.create(_MustCallSuper.prototype)));

const nonVirtual = __dartConst("[\"instance\",\"class:_NonVirtual\"]", () => Object.freeze(Object.create(_NonVirtual.prototype)));

const optionalTypeArgs = __dartConst("[\"instance\",\"class:_OptionalTypeArgs\"]", () => Object.freeze(Object.create(_OptionalTypeArgs.prototype)));

const protected_1 = __dartConst("[\"instance\",\"class:_Protected\"]", () => Object.freeze(Object.create(_Protected.prototype)));

const redeclare = __dartConst("[\"instance\",\"class:_Redeclare\"]", () => Object.freeze(Object.create(_Redeclare.prototype)));

const reopen = __dartConst("[\"instance\",\"class:_Reopen\"]", () => Object.freeze(Object.create(_Reopen.prototype)));

const required = __dartConst("[\"instance\",\"class:Required\",[\"field\",\"field:Required.reason\",[\"string\",\"\"]]]", () => Object.freeze(Object.assign(Object.create(Required.prototype), { reason: "" })));

const sealed = __dartConst("[\"instance\",\"class:_Sealed\"]", () => Object.freeze(Object.create(_Sealed.prototype)));

const useResult = __dartConst("[\"instance\",\"class:UseResult\",[\"field\",\"field:UseResult.parameterDefined\",[\"null\"]],[\"field\",\"field:UseResult.reason\",[\"string\",\"\"]]]", () => Object.freeze(Object.assign(Object.create(UseResult.prototype), { reason: "", parameterDefined: null })));

const virtual = __dartConst("[\"instance\",\"class:_Virtual\"]", () => Object.freeze(Object.create(_Virtual.prototype)));

const visibleForOverriding = __dartConst("[\"instance\",\"class:_VisibleForOverriding\"]", () => Object.freeze(Object.create(_VisibleForOverriding.prototype)));

const visibleForTesting = __dartConst("[\"instance\",\"class:_VisibleForTesting\"]", () => Object.freeze(Object.create(_VisibleForTesting.prototype)));

function StreamExtensions_slices(_this, length) {
  if ((length < 1)) {
    (() => { throw __dartCoreError("RangeError", length); })();
  }
  let slice = new Array(0).fill(null);
  return __dartStreamTransform(_this, __dartStreamTransformerFromHandlers({ handleData: function(data, sink) {
    (slice.push(data), null);
    if (__dartEquals(slice.length, length)) {
      {
        sink.add(slice);
        slice = new Array(0).fill(null);
      }
    }
}, handleError: null, handleDone: function(sink) {
    if (slice.length !== 0) {
      sink.add(slice);
    }
    sink.close();
} }));
}

function StreamExtensions_get_slices(_this) {
  return function(length) { return StreamExtensions_slices(_this, length); };
}

function StreamExtensions_get_firstOrNull(_this) {
  let completer = __dartCompleter();
  const subscription = __dartStreamListen(_this, null, __dartBind(completer, "completeError"), __dartAs(__dartBind(completer, "complete"), value => typeof value === "function", "void Function([FutureOr<StreamExtensions|get#firstOrNull.T?>?])"), true);
  subscription.onData(function(event) {
    subscription.cancel().finally(function() {
      completer.complete(event);
});
});
  return completer.future;
}

function StreamExtensions_listenAndBuffer(_this) {
  let controller = __dartStreamController(false, { onListen: null, onPause: null, onResume: null, onCancel: null });
  let subscription = __dartStreamListen(_this, __dartAs(__dartBind(controller, "add"), value => typeof value === "function", "void Function(StreamExtensions|listenAndBuffer.T%)"), __dartBind(controller, "addError"), __dartBind(controller, "close"), false);
  (() => { let v = controller; return (() => {
    v.onPause = __dartBind(subscription, "pause");
    v.onResume = __dartBind(subscription, "resume");
    v.onCancel = __dartBind(subscription, "cancel");
    return v;
  })(); })();
  return controller.stream;
}

function StreamExtensions_get_listenAndBuffer(_this) {
  return function() { return StreamExtensions_listenAndBuffer(_this); };
}

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

function StreamSinkExtensions_transform(_this, transformer) {
  return transformer.bind(_this);
}

function StreamSinkExtensions_get_transform(_this) {
  return function(transformer) { return StreamSinkExtensions_transform(_this, transformer); };
}

function StreamSinkExtensions_rejectErrors(_this) {
  return new RejectErrorsSink(_this);
}

function StreamSinkExtensions_get_rejectErrors(_this) {
  return function() { return StreamSinkExtensions_rejectErrors(_this); };
}

function subscriptionTransformer({ handleCancel = null, handlePause = null, handleResume = null } = {}) {
  return Object.freeze({ bind(stream) { return __dartBoundSubscriptionStream(stream, function(stream, cancelOnError) { return new _TransformedSubscription(__dartStreamListen(stream, null, null, null, cancelOnError), (handleCancel ?? function(inner) { return inner.cancel(); }), (handlePause ?? function(inner) {
    inner.pause();
}), (handleResume ?? function(inner) {
    inner.resume();
})); }); } });
}

function typedStreamTransformer(transformer) {
  return (transformer != null && typeof transformer === "object" && typeof transformer.bind === "function" ? transformer : new _TypeSafeStreamTransformer(transformer));
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

const operatingSystem = ((globalThis.process?.platform === "win32") ? "windows" : (globalThis.process?.platform === "darwin") ? "macos" : (globalThis.process?.platform === "linux") ? "linux" : "browser");

const _platforms = __dartConst("[\"map\",\"InterfaceType(String)\",\"InterfaceType(_Codes)\",[[\"string\",\"linux\"],[\"instance\",\"class:_LinuxCodes\"]],[[\"string\",\"macos\"],[\"instance\",\"class:_MacOSCodes\"]],[[\"string\",\"windows\"],[\"instance\",\"class:_WindowsCodes\"]]]", () => __dartConstMap([["linux", __dartConst("[\"instance\",\"class:_LinuxCodes\"]", () => Object.freeze(Object.create(_LinuxCodes.prototype)))], ["macos", __dartConst("[\"instance\",\"class:_MacOSCodes\"]", () => Object.freeze(Object.create(_MacOSCodes.prototype)))], ["windows", __dartConst("[\"instance\",\"class:_WindowsCodes\"]", () => Object.freeze(Object.create(_WindowsCodes.prototype)))]]));

function noSuchFileOrDirectory(path) {
  return _fsException(path, "No such file or directory", ErrorCodes.ENOENT);
}

function notADirectory(path) {
  return _fsException(path, "Not a directory", ErrorCodes.ENOTDIR);
}

function isADirectory(path) {
  return _fsException(path, "Is a directory", ErrorCodes.EISDIR);
}

function directoryNotEmpty(path) {
  return _fsException(path, "Directory not empty", ErrorCodes.ENOTEMPTY);
}

function fileExists(path) {
  return _fsException(path, "File exists", ErrorCodes.EEXIST);
}

function invalidArgument(path) {
  return _fsException(path, "Invalid argument", ErrorCodes.EINVAL);
}

function tooManyLevelsOfSymbolicLinks(path) {
  return _fsException(path, "Too many levels of symbolic links", ErrorCodes.ELOOP);
}

function badFileDescriptor(path) {
  return _fsException(path, "Bad file descriptor", ErrorCodes.EBADF);
}

function _fsException(path, msg, errorCode) {
  return __dartIoFileSystemException(msg, path, __dartIoOSError(msg, errorCode));
}

function checkExists(object, path) {
  if ((object === null)) {
    {
      (() => { throw noSuchFileOrDirectory(__dartAs((path)(), value => typeof value === "string", "String")); })();
    }
  }
}

function isFile(node) {
  return __dartEquals(((node)?.type ?? null), __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"0\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0)));
}

function isDirectory(node) {
  return __dartEquals(((node)?.type ?? null), __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0)));
}

function isLink(node) {
  return __dartEquals(((node)?.type ?? null), __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"2\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0)));
}

function checkIsDir(node, path) {
  if (!(isDirectory(node))) {
    {
      (() => { throw notADirectory(__dartAs((path)(), value => typeof value === "string", "String")); })();
    }
  }
}

function checkType(expectedType, actualType, path) {
  if (!(__dartEquals(expectedType, actualType))) {
    {
      L:
      switch (expectedType) {
        case __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0)):
          {
            (() => { throw notADirectory(__dartAs((path)(), value => typeof value === "string", "String")); })();
          }
        case __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"0\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0)):
          {
            (() => { throw isADirectory(__dartAs((path)(), value => typeof value === "string", "String")); })();
          }
        case __dartConst("[\"instance\",\"dart:io::FileSystemEntityType\",[\"field\",\"dart:io::FileSystemEntityType::@fields::dart:io::_type\",[\"int\",\"2\"]]]", () => __dartIoEnum("FileSystemEntityType", "FileSystemEntityType", 0)):
          {
            (() => { throw invalidArgument(__dartAs((path)(), value => typeof value === "string", "String")); })();
          }
        default:
          {
            (() => { throw __dartCoreError("AssertionError", null); })();
          }
      }
    }
  }
}

function isWriteMode(mode) {
  return (((__dartEquals(mode, __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"1\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0))) || __dartEquals(mode, __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"2\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)))) || __dartEquals(mode, __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"3\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0)))) || __dartEquals(mode, __dartConst("[\"instance\",\"dart:io::FileMode\",[\"field\",\"dart:io::FileMode::@fields::dart:io::_mode\",[\"int\",\"4\"]]]", () => __dartIoEnum("FileMode", "FileMode", 0))));
}

function isEmpty(str) {
  return str.length === 0;
}

function resolveLinks(link, path, { ledger = null, tailVisitor = null } = {}) {
  let breadcrumbs = (() => {
    const v = new Set();
    return v;
  })();
  let node = link;
  while (isLink(node)) {
    {
      link = __dartAs(node, value => value instanceof LinkNode, "LinkNode");
      if (!(__dartSetAdd(breadcrumbs, link))) {
        {
          (() => { throw tooManyLevelsOfSymbolicLinks(__dartAs((path)(), value => typeof value === "string", "String")); })();
        }
      }
      if (!((ledger === null))) {
        {
          if (link.fs.path.isAbsolute(link.target)) {
            {
              (ledger.length = 0, null);
            }
          } else {
            if (ledger.length !== 0) {
              {
                ledger.pop();
              }
            }
          }
          (ledger.push(...Array.from(__dartStringSplit(link.target, link.fs.path.separator))), null);
        }
      }
      node = link.getReferent({ tailVisitor: function(parent, childName, child) {
        if ((!((tailVisitor === null)) && !(isLink(child)))) {
          {
            child = (tailVisitor)(parent, childName, child);
          }
        }
        return child;
} });
    }
  }
  return node;
}

const _systemTempCounter = __dartExpando(null);

const _thisDir = ".";

const _parentDir = "..";

function _defaultOpHandle(context_1, operation) {
}

const _quote = __dartRegExp("[+*?{}|[\\]\\\\().^$-]", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });

function regExpQuote(contents) {
  return __dartStringReplaceAllMapped(contents, _quote, function(char) { return "\\" + __dartStr(char[0]); });
}

function separatorToForwardSlash(path) {
  if (!(__dartEquals(style(), Style.windows))) {
    return path;
  }
  return path.replaceAll("\\", "/");
}

function toPosixPath(context_1, path) {
  if (__dartEquals(context_1.style, Style.windows)) {
    return path.replaceAll("\\", "/");
  }
  if (__dartEquals(context_1.style, Style.url)) {
    return decodeURI(path);
  }
  return path;
}

const _separator = 47;

const _enoent = 2;

const _enoentWin = 3;

function _join(components) {
  let componentsList = Array.from(components);
  let first = componentsList.splice(0, 1)[0];
  let nodes = [first];
  {
    let _sync_for_iterator = __dartIterator(componentsList);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let component = _sync_for_iterator.current;
        {
          (nodes.push(new LiteralNode("/", { caseSensitive: first.caseSensitive })), null);
          (nodes.push(component), null);
        }
      }
    }
  }
  return new SequenceNode(nodes, { caseSensitive: first.caseSensitive });
}

function _extension_0_ignoreMissing(_this) {
  return __dartStreamHandleError(_this, function(_) {
}, function(error) { return (error instanceof Error || (error != null && typeof error === "object" && "message" in error) && _extension_1_get_isMissing(error)); });
}

function _extension_0_get_ignoreMissing(_this) {
  return function() { return _extension_0_ignoreMissing(_this); };
}

function _extension_1_get_isMissing(_this) {
  const errorCode = ((_this.osError)?.errorCode ?? null);
  return (__dartEquals(errorCode, 2) || __dartEquals(errorCode, 3));
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

const _hyphen = 45;

const _slash = 47;

const _quoteRegExp = __dartRegExp("[*{[?\\\\}\\],\\-()]", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });

export function main() {
  const dartSources = new Glob("lib/{*.dart,src/**.dart}");
  const recursiveAssets = new Glob("assets/**", { recursive: true });
  const caseInsensitive = new Glob("README.[mM][dD]", { context: posix, caseSensitive: false });
  const urlGlob = new Glob("https://example.com/{docs,api}/**.html", { context: url });
  const escaped = new Glob(Glob.quote("build/{literal}/*.dart"), { context: posix });
  const pattern = new Glob("test/*_test.dart", { context: posix });
  const match = pattern.matchAsPrefix("test/glob_test.dart");
  const quoted = Glob.quote("foo*[bar]?.dart");
  __dartPrint("glob " + __dartStr(dartSources.matches("lib/main.dart")) + " " + __dartStr(dartSources.matches("lib/src/deep/file.dart")) + " " + __dartStr(dartSources.matches("lib/src/deep/file.txt")) + " " + __dartStr(recursiveAssets.matches("assets/icons/logo.svg")) + " " + __dartStr(recursiveAssets.matches("assets")) + " " + __dartStr(caseInsensitive.matches("readme.md")) + " " + __dartStr(urlGlob.matches("https://example.com/docs/index.html")) + " " + __dartStr(urlGlob.matches("https://example.com/assets/index.html")) + " " + __dartStr(escaped.matches("build/{literal}/*.dart")) + " " + __dartStr(__dartIterableLength(pattern.allMatches("test/glob_test.dart"))) + " " + __dartStr(((match)?.group(0) ?? null)) + " " + __dartStr(((match)?.start ?? null)) + ":" + __dartStr(((match)?.end ?? null)) + ":" + __dartStr(((match)?.groupCount ?? null)) + " " + __dartStr((() => { let v = match; return ((v === null) ? null : __dartIterableJoin(v.groups([0]), "|")); })()) + " " + __dartStr(quoted));
}


function $CaptureSink_new_tearoff(sink) {
  return new CaptureSink(sink);
}

function $ValueResult_new_tearoff(value) {
  return new ValueResult(value);
}

function $ErrorResult_new_tearoff(error, stackTrace = null) {
  return new ErrorResult(error, stackTrace);
}
main();
