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
function __dartMapForEach(map, callback) {
  if (map instanceof Map) {
    map.forEach((value, key) => callback(key, value));
    return null;
  }
  if (map != null && typeof map.forEach === "function") {
    map.forEach(callback);
    return null;
  }
  for (const entry of map) {
    if (Array.isArray(entry)) {
      callback(entry[0], entry[1]);
    } else {
      callback(entry.key, entry.value);
    }
  }
  return null;
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
  if (!(map instanceof Map) && map != null && typeof map.containsKey === "function") return map.containsKey(key);
  return __dartMapKey(map, key) !== __dartMapMissingKey;
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
function __dartMapRemove(map, key) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey === __dartMapMissingKey) return null;
  const value = map.get(actualKey);
  map.delete(actualKey);
  return value;
}
function __dartMapPutIfAbsent(map, key, ifAbsent) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey !== __dartMapMissingKey) return map.get(actualKey);
  const value = ifAbsent();
  __dartMapSet(map, key, value);
  return value;
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
function __dartStreamError(error) {
  return (async function*() {
    throw error;
  })();
}
function __dartStreamWhere(stream, test) {
  return (async function*() {
    for await (const value of __dartStreamIterable(stream)) {
      if (test(value)) yield value;
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
async function __dartStreamToList(stream) {
  const values = [];
  for await (const value of __dartStreamIterable(stream)) values.push(value);
  return values;
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
const $GlyphSet_interface = Symbol("GlyphSet");
const $Link_interface = Symbol("Link");
const $MemoryFileSystem_interface = Symbol("MemoryFileSystem");
const $NodeBasedFileSystem_interface = Symbol("NodeBasedFileSystem");
const $SourceLocation_interface = Symbol("SourceLocation");
const $SourceSpan_interface = Symbol("SourceSpan");
const $SourceSpanWithContext_interface = Symbol("SourceSpanWithContext");
const $StyleableFileSystem_interface = Symbol("StyleableFileSystem");
const $_Codes_interface = Symbol("_Codes");

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
    __dartMapForEach(this._subscriptions, (stream, subscription) => {
      if (!((stream.isBroadcast === true))) {
        return;
      }
      __dartNullCheck(subscription).cancel();
      __dartMapSet(this._subscriptions, stream, null);
});
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
    let hash = 0;
    {
      let _sync_for_iterator = __dartIterator(elements);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            let c = this._elementEquality.hash(element);
            hash = ((hash + c) & 2147483647);
            hash = ((hash + (hash << 10)) & 2147483647);
            hash = (hash ^ __dartShr(hash, 6));
          }
        }
      }
    }
    hash = ((hash + (hash << 3)) & 2147483647);
    hash = (hash ^ __dartShr(hash, 11));
    hash = ((hash + (hash << 15)) & 2147483647);
    return hash;
  }
  isValidKey(o) {
    return o != null && typeof o !== "string" && !(o instanceof Map) && typeof o[Symbol.iterator] === "function";
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
    let hash = 0;
    {
      let _sync_for_iterator = __dartIterator(elements);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let element = _sync_for_iterator.current;
          {
            let c = this._elementEquality.hash(element);
            hash = ((hash + c) & 2147483647);
          }
        }
      }
    }
    hash = ((hash + (hash << 3)) & 2147483647);
    hash = (hash ^ __dartShr(hash, 11));
    hash = ((hash + (hash << 15)) & 2147483647);
    return hash;
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
  childDirectory(basename) {
    throw new TypeError("Abstract member Directory.childDirectory");
  }
  childFile(basename) {
    throw new TypeError("Abstract member Directory.childFile");
  }
  childLink(basename) {
    throw new TypeError("Abstract member Directory.childLink");
  }
}
Object.defineProperty(Directory, Symbol.hasInstance, { value(value) { return value != null && value[$Directory_interface] === true; } });

class DirectoryAddOnsMixin {
  constructor() {
    Object.defineProperty(this, $Directory_interface, { value: true });
    Object.defineProperty(this, $DirectoryAddOnsMixin_interface, { value: true });
    Object.defineProperty(this, $FileSystemEntity_interface, { value: true });
  }
  childDirectory(basename) {
    return this.fileSystem.directory(this.fileSystem.path.join(this.path, basename));
  }
  childFile(basename) {
    return this.fileSystem.file(this.fileSystem.path.join(this.path, basename));
  }
  childLink(basename) {
    return this.fileSystem.link(this.fileSystem.path.join(this.path, basename));
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

class ParsedPath {
  constructor() {
    throw new TypeError("Class ParsedPath has no unnamed constructor");
  }
  static _(style_1, root, isRootRelative, parts, separators) {
    return $ParsedPath__(ParsedPath, style_1, root, isRootRelative, parts, separators);
  }
  extension(level = 1) {
    return __dartIndexGet(this._splitExtension(level), 1);
  }
  get isAbsolute() {
    return !((this.root === null));
  }
  static parse(path, style_1) {
    const root = style_1.getRoot(path);
    const isRootRelative = style_1.isRootRelative(path);
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
    return ParsedPath._(style_1, root, isRootRelative, parts, separators);
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

function $ParsedPath__($newTarget, style_1, root, isRootRelative, parts, separators) {
  const $self = Object.create($newTarget.prototype);
  $self.style = style_1;
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
  writeAll(objects, separator = "") {
    let firstIter = true;
    {
      let _sync_for_iterator = __dartIterator(objects);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let obj = _sync_for_iterator.current;
          {
            if (!(firstIter)) {
              {
                this.write(separator);
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
  childDirectory(basename) {
    return this.fileSystem.directory(this.fileSystem.path.join(this.path, basename));
  }
  childFile(basename) {
    return this.fileSystem.file(this.fileSystem.path.join(this.path, basename));
  }
  childLink(basename) {
    return this.fileSystem.link(this.fileSystem.path.join(this.path, basename));
  }
}

class MemoryDirectory extends _MemoryDirectory_MemoryFileSystemEntity_DirectoryAddOnsMixin {
  constructor(fileSystem, path) {
    super(fileSystem, path);
    Object.defineProperty(this, $Directory_interface, { value: true });
    Object.defineProperty(this, $DirectoryAddOnsMixin_interface, { value: true });
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
    let dirname = this.fileSystem.path.dirname(fullPath);
    let basename = this.fileSystem.path.basename(fullPath);
    let node = __dartAs(this.fileSystem.findNode(dirname), value => (value === null || value instanceof DirectoryNode), "DirectoryNode?");
    checkExists(node, function() { return dirname; });
    checkIsDir(__dartNullCheck(node), function() { return dirname; });
    let tempCounter = (_systemTempCounter.get(this.fileSystem) ?? 0);
    function name() {
      return __dartStr(basename) + __dartStr(tempCounter);
    }
    while (__dartMapContainsKey(node.children, name())) {
      {
        tempCounter = (tempCounter + 1);
      }
    }
    _systemTempCounter.set(this.fileSystem, tempCounter);
    let tempDir = new DirectoryNode(node);
    __dartMapSet(node.children, name(), tempDir);
    return (() => { let v = new MemoryDirectory(this.fileSystem, this.fileSystem.path.join(dirname, name())); return (() => {
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
        __dartMapForEach(task.dir.children, (name, child) => {
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
});
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
        let basename = __dartIndexGet(parts, i);
        L:
        switch (basename) {
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
              child = (() => { let v_1 = directory; return ((v_1 === null) ? null : __dartMapGet(v_1.children, basename)); })();
            }
        }
        if (!((pathWithSymlinks === null))) {
          {
            (pathWithSymlinks.push(basename), null);
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
                    child = (segmentVisitor)(__dartNullCheck(directory), basename, child, i, finalSegment);
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
              child = (segmentVisitor)(__dartNullCheck(directory), basename, child, i, finalSegment);
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
        __dartMapForEach(__dartNullCheck(this.children), function(sequence, child) {
          resultGroup.add(child.list(join(dir, __dartAs(__dartIterableSingle(sequence.nodes), value => value instanceof LiteralNode, "LiteralNode").text), fileSystem, { followLinks: followLinks }));
});
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
              let basename = relative(entity.path, { from: dir });
              if (this._matches(basename)) {
                resultController.add(entity);
              }
              __dartMapForEach(__dartNullCheck(this.children), function(sequence, child) {
                if (!(entity instanceof Directory)) {
                  return;
                }
                if (!(sequence.matches(basename))) {
                  return;
                }
                let stream = child.list(join(dir, basename), fileSystem, { followLinks: followLinks });
                resultGroup.add(stream);
});
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
      let basename = relative(entity.path, { from: dir });
      if (this._matches(basename)) {
        (entities.push(entity), null);
      }
      if (!(entity instanceof Directory)) {
        return entities;
      }
      (entities.push(...Array.from(Array.from(Array.from(Array.from(__dartNullCheck(this.children).keys())).filter(function(sequence) { return sequence.matches(basename); })).flatMap((value) => Array.from(((sequence) => { return Array.from(__dartNullCheck(__dartMapGet(__dartNullCheck(this.children), sequence)).listSync(join(dir, basename), fileSystem, { followLinks: followLinks })); })(value))))), null);
      return entities;
})(value)));
  }
  _validateIntermediateChildrenSync(dir, entities, fileSystem) {
    if (this._caseSensitive) {
      return;
    }
    __dartMapForEach(__dartNullCheck(this.children), function(sequence, child) {
      if (!(child._isIntermediate)) {
        return;
      }
      if (Array.from(entities).some(function(entity) { return sequence.matches(relative(entity.path, { from: dir })); })) {
        {
          return;
        }
      }
      child.listSync(join(dir, __dartAs(__dartIterableSingle(sequence.nodes), value => value instanceof LiteralNode, "LiteralNode").text), fileSystem);
});
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


Object.defineProperty(_StreamGroupState, "dormant", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"dormant\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "dormant" }))), enumerable: true });

Object.defineProperty(_StreamGroupState, "listening", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"listening\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "listening" }))), enumerable: true });

Object.defineProperty(_StreamGroupState, "paused", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"paused\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "paused" }))), enumerable: true });

Object.defineProperty(_StreamGroupState, "canceled", { value: __dartConst("[\"instance\",\"class:_StreamGroupState\",[\"field\",\"field:_StreamGroupState.name\",[\"string\",\"canceled\"]]]", () => Object.freeze(Object.assign(Object.create(_StreamGroupState.prototype), { name: "canceled" }))), enumerable: true });

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

Object.defineProperty(FileSystemStyle, "posix", { value: __dartConst("[\"instance\",\"class:_Posix\"]", () => Object.freeze(Object.create(_Posix.prototype))), enumerable: true });

Object.defineProperty(FileSystemStyle, "windows", { value: __dartConst("[\"instance\",\"class:_Windows\"]", () => Object.freeze(Object.create(_Windows.prototype))), enumerable: true });

Object.defineProperty(Highlighter, "_spacesPerTab", { value: 4, enumerable: true });
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

function isAbsolute(path) {
  return context.isAbsolute(path);
}

function join(part1, part2 = null, part3 = null, part4 = null, part5 = null, part6 = null, part7 = null, part8 = null, part9 = null, part10 = null, part11 = null, part12 = null, part13 = null, part14 = null, part15 = null, part16 = null) {
  return context.join(part1, part2, part3, part4, part5, part6, part7, part8, part9, part10, part11, part12, part13, part14, part15, part16);
}

function relative(path, { from = null } = {}) {
  return context.relative(path, { from: from });
}

function prettyUri(uri) {
  return context.prettyUri(__dartNullCheck(uri));
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

function _defaultOpHandle(context_1, operation) {
}

const operatingSystem = ((globalThis.process?.platform === "win32") ? "windows" : (globalThis.process?.platform === "darwin") ? "macos" : (globalThis.process?.platform === "linux") ? "linux" : "browser");

const _quote = __dartRegExp("[+*?{}|[\\]\\\\().^$-]", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });

function regExpQuote(contents) {
  return __dartStringReplaceAllMapped(contents, _quote, function(char) { return "\\" + __dartStr(char[0]); });
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

function _extension_1_get_isMissing(_this) {
  const errorCode = ((_this.osError)?.errorCode ?? null);
  return (__dartEquals(errorCode, 2) || __dartEquals(errorCode, 3));
}

const _quoteRegExp = __dartRegExp("[*{[?\\\\}\\],\\-()]", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });

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

main();
