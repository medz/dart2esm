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

const _asciiCaseBit = 32;

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

export function main() {
  const context_1 = new Context({ style: Style.posix });
  const normalized = context_1.normalize("/a/./b/../c");
  const joined = context_1.join("a", "b", "c.dart");
  const without = withoutExtension("lib/main.dart");
  const url_1 = url.join("https://example.test/a/", "../b");
  __dartPrint("path " + __dartStr(normalized) + " " + __dartStr(joined) + " " + __dartStr(without) + " " + __dartStr(url_1) + " " + __dartStr(equals("a/b", "a/b")));
}

main();
