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
function __dartListSort(list, compare = null) {
  if (typeof compare === "function") {
    list.sort((left, right) => compare(left, right));
  } else {
    list.sort((left, right) => left < right ? -1 : (left > right ? 1 : 0));
  }
  return null;
}
function __dartIterableIsEmpty(iterable) {
  if (typeof iterable.length === "number") return iterable.length === 0;
  if (typeof iterable.size === "number") return iterable.size === 0;
  for (const _ of iterable) return false;
  return true;
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

const $Equality_interface = Symbol("Equality");
const $VersionConstraint_interface = Symbol("VersionConstraint");
const $VersionRange_interface = Symbol("VersionRange");

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
    let hash = 0;
    for (let i = 0; (i < list.length); i = (i + 1)) {
      {
        let c = this._elementEquality.hash(__dartIndexGet(list, i));
        hash = ((hash + c) & 2147483647);
        hash = ((hash + (hash << 10)) & 2147483647);
        hash = (hash ^ __dartShr(hash, 6));
      }
    }
    hash = ((hash + (hash << 3)) & 2147483647);
    hash = (hash ^ __dartShr(hash, 11));
    hash = ((hash + (hash << 15)) & 2147483647);
    return hash;
  }
  isValidKey(o) {
    return (Array.isArray(o) || (ArrayBuffer.isView(o) && !(o instanceof DataView)));
  }
}

class VersionConstraint {
  constructor() {
    if (new.target === VersionConstraint) {
      throw new TypeError("Class VersionConstraint has no unnamed constructor");
    }
  }
  static parse(text) {
    let originalText = text;
    function skipWhitespace() {
      text = text.trim();
    }
    skipWhitespace();
    if (__dartEquals(text, "any")) {
      return VersionConstraint.any;
    }
    function matchVersion() {
      let version = startVersion.firstMatch(text);
      if ((version === null)) {
        return null;
      }
      text = text.substring(version.end);
      return Version.parse(__dartNullCheck(version[0]));
    }
    function matchComparison() {
      let comparison = startComparison.firstMatch(text);
      if ((comparison === null)) {
        return null;
      }
      let op = __dartNullCheck(comparison[0]);
      text = text.substring(comparison.end);
      skipWhitespace();
      let version = matchVersion();
      if ((version === null)) {
        {
          (() => { throw __dartCoreError("FormatException", "Expected version number after \"" + __dartStr(op) + "\" in " + "\"" + __dartStr(originalText) + "\", got \"" + __dartStr(text) + "\"."); })();
        }
      }
      return (() => {
        let v = null;
        const _0_0 = op;
        const _0_1 = "<=";
        const _0_3 = "<";
        const _0_5 = ">=";
        const _0_7 = ">";
        L:
        {
          {
            if (__dartEquals("<=", _0_0)) {
              {
                v = new VersionRange({ max: version, includeMax: true });
                break L;
              }
            }
          }
          {
            if (__dartEquals("<", _0_0)) {
              {
                v = new VersionRange({ max: version, alwaysIncludeMaxPreRelease: true });
                break L;
              }
            }
          }
          {
            if (__dartEquals(">=", _0_0)) {
              {
                v = new VersionRange({ min: version, includeMin: true });
                break L;
              }
            }
          }
          {
            if (__dartEquals(">", _0_0)) {
              {
                v = new VersionRange({ min: version });
                break L;
              }
            }
          }
          {
            if (true) {
              {
                v = (() => { throw __dartCoreError("UnsupportedError", op); })();
                break L;
              }
            }
          }
        }
        return v;
      })();
    }
    function matchCompatibleWith() {
      if (!(__dartStringStartsWith(text, "^", 0))) {
        return null;
      }
      text = text.substring("^".length);
      skipWhitespace();
      let version = matchVersion();
      if ((version === null)) {
        {
          (() => { throw __dartCoreError("FormatException", "Expected version number after " + "\"" + __dartStr("^") + "\" in \"" + __dartStr(originalText) + "\", got \"" + __dartStr(text) + "\"."); })();
        }
      }
      if (text.length !== 0) {
        {
          (() => { throw __dartCoreError("FormatException", "Cannot include other constraints with " + "\"" + __dartStr("^") + "\" constraint in \"" + __dartStr(originalText) + "\"."); })();
        }
      }
      return VersionConstraint.compatibleWith(version);
    }
    let compatibleWith = matchCompatibleWith();
    if (!((compatibleWith === null))) {
      return compatibleWith;
    }
    let min = null;
    let includeMin = false;
    let max = null;
    let includeMax = false;
    L:
    for (; ; ) {
      {
        skipWhitespace();
        if (text.length === 0) {
          break L;
        }
        let newRange = (matchVersion() ?? matchComparison());
        if ((newRange === null)) {
          {
            (() => { throw __dartCoreError("FormatException", "Could not parse version \"" + __dartStr(originalText) + "\". " + "Unknown text at \"" + __dartStr(text) + "\"."); })();
          }
        }
        if (!((newRange.min === null))) {
          {
            if (((min === null) || __dartNullCheck(newRange.min)[">"](min))) {
              {
                min = newRange.min;
                includeMin = newRange.includeMin;
              }
            } else {
              if (((() => { const $left = newRange.min; const $right = min; return $left === null ? $right === null : $left["=="]($right); })() && !(newRange.includeMin))) {
                {
                  includeMin = false;
                }
              }
            }
          }
        }
        if (!((newRange.max === null))) {
          {
            if (((max === null) || __dartNullCheck(newRange.max)["<"](max))) {
              {
                max = newRange.max;
                includeMax = newRange.includeMax;
              }
            } else {
              if (((() => { const $left_1 = newRange.max; const $right_1 = max; return $left_1 === null ? $right_1 === null : $left_1["=="]($right_1); })() && !(newRange.includeMax))) {
                {
                  includeMax = false;
                }
              }
            }
          }
        }
      }
    }
    if (((min === null) && (max === null))) {
      {
        (() => { throw __dartConst("[\"instance\",\"dart:core::FormatException\",[\"field\",\"dart:core::FormatException::@fields::message\",[\"string\",\"Cannot parse an empty string.\"]],[\"field\",\"dart:core::FormatException::@fields::offset\",[\"null\"]],[\"field\",\"dart:core::FormatException::@fields::source\",[\"null\"]]]", () => __dartCoreError("FormatException", "Cannot parse an empty string.")); })();
      }
    }
    if ((!((min === null)) && !((max === null)))) {
      {
        if (min[">"](max)) {
          return VersionConstraint.empty;
        }
        if ((() => { const $left_2 = min; const $right_2 = max; return $left_2 === null ? $right_2 === null : $left_2["=="]($right_2); })()) {
          {
            if ((includeMin && includeMax)) {
              return min;
            }
            return VersionConstraint.empty;
          }
        }
      }
    }
    return new VersionRange({ min: min, includeMin: includeMin, max: max, includeMax: includeMax });
  }
  static compatibleWith(version) {
    return new CompatibleWithVersionRange(version);
  }
  static intersection(constraints) {
    let constraint = new VersionRange();
    {
      let _sync_for_iterator = __dartIterator(constraints);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let other = _sync_for_iterator.current;
          {
            constraint = __dartAs(constraint.intersect(other), value => value instanceof VersionRange, "VersionRange");
          }
        }
      }
    }
    return constraint;
  }
  static unionOf(constraints) {
    let flattened = Array.from(Array.from(constraints).flatMap((value) => Array.from((function(constraint) {
      if (constraint.isEmpty) {
        return new Array(0).fill(null);
      }
      if (constraint instanceof VersionUnion) {
        return constraint.ranges;
      }
      if (constraint instanceof VersionRange) {
        return [constraint];
      }
      (() => { throw __dartCoreError("ArgumentError", "Unknown VersionConstraint type " + __dartStr(constraint) + "."); })();
})(value))));
    if (flattened.length === 0) {
      return VersionConstraint.empty;
    }
    if (Array.from(flattened).some(function(constraint) { return constraint.isAny; })) {
      {
        return VersionConstraint.any;
      }
    }
    __dartListSort(flattened, null);
    let merged = new Array(0).fill(null);
    {
      let _sync_for_iterator = __dartIterator(flattened);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let constraint = _sync_for_iterator.current;
          {
            if ((merged.length === 0 || (!(__dartIndexGet(merged, merged.length - 1).allowsAny(constraint)) && !(areAdjacent(__dartIndexGet(merged, merged.length - 1), constraint))))) {
              {
                (merged.push(constraint), null);
              }
            } else {
              {
                __dartIndexSet(merged, (merged.length - 1), __dartAs(__dartIndexGet(merged, merged.length - 1).union(constraint), value => value instanceof VersionRange, "VersionRange"));
              }
            }
          }
        }
      }
    }
    if (__dartEquals(merged.length, 1)) {
      return __dartIterableSingle(merged);
    }
    return VersionUnion.fromRanges(merged);
  }
  get isEmpty() {
    throw new TypeError("Abstract member VersionConstraint.isEmpty");
  }
  set isEmpty(value) {
    Object.defineProperty(this, "isEmpty", { value, writable: true, configurable: true, enumerable: true });
  }
  get isAny() {
    throw new TypeError("Abstract member VersionConstraint.isAny");
  }
  set isAny(value) {
    Object.defineProperty(this, "isAny", { value, writable: true, configurable: true, enumerable: true });
  }
  allows(version) {
    throw new TypeError("Abstract member VersionConstraint.allows");
  }
  allowsAll(other) {
    throw new TypeError("Abstract member VersionConstraint.allowsAll");
  }
  allowsAny(other) {
    throw new TypeError("Abstract member VersionConstraint.allowsAny");
  }
  intersect(other) {
    throw new TypeError("Abstract member VersionConstraint.intersect");
  }
  union(other) {
    throw new TypeError("Abstract member VersionConstraint.union");
  }
  difference(other) {
    throw new TypeError("Abstract member VersionConstraint.difference");
  }
}
Object.defineProperty(VersionConstraint, Symbol.hasInstance, { value(value) { return value != null && value[$VersionConstraint_interface] === true; } });

class VersionUnion {
  constructor() {
    throw new TypeError("Class VersionUnion has no unnamed constructor");
  }
  static fromRanges(ranges) {
    return $VersionUnion_fromRanges(VersionUnion, ranges);
  }
  get isEmpty() {
    return false;
  }
  get isAny() {
    return false;
  }
  allows(version) {
    return Array.from(this.ranges).some(function(constraint) { return constraint.allows(version); });
  }
  allowsAll(other) {
    let ourRanges = __dartIterator(this.ranges);
    let theirRanges = __dartIterator(this._rangesFor(other));
    let ourRangesMoved = ourRanges.moveNext();
    let theirRangesMoved = theirRanges.moveNext();
    while ((ourRangesMoved && theirRangesMoved)) {
      {
        if (ourRanges.current.allowsAll(theirRanges.current)) {
          {
            theirRangesMoved = theirRanges.moveNext();
          }
        } else {
          {
            ourRangesMoved = ourRanges.moveNext();
          }
        }
      }
    }
    return !(theirRangesMoved);
  }
  allowsAny(other) {
    let ourRanges = __dartIterator(this.ranges);
    let theirRanges = __dartIterator(this._rangesFor(other));
    let ourRangesMoved = ourRanges.moveNext();
    let theirRangesMoved = theirRanges.moveNext();
    while ((ourRangesMoved && theirRangesMoved)) {
      {
        if (ourRanges.current.allowsAny(theirRanges.current)) {
          {
            return true;
          }
        }
        if (allowsHigher(theirRanges.current, ourRanges.current)) {
          {
            ourRangesMoved = ourRanges.moveNext();
          }
        } else {
          {
            theirRangesMoved = theirRanges.moveNext();
          }
        }
      }
    }
    return false;
  }
  intersect(other) {
    let ourRanges = __dartIterator(this.ranges);
    let theirRanges = __dartIterator(this._rangesFor(other));
    let newRanges = new Array(0).fill(null);
    let ourRangesMoved = ourRanges.moveNext();
    let theirRangesMoved = theirRanges.moveNext();
    while ((ourRangesMoved && theirRangesMoved)) {
      {
        let intersection = ourRanges.current.intersect(theirRanges.current);
        if (!(intersection.isEmpty)) {
          (newRanges.push(__dartAs(intersection, value => value instanceof VersionRange, "VersionRange")), null);
        }
        if (allowsHigher(theirRanges.current, ourRanges.current)) {
          {
            ourRangesMoved = ourRanges.moveNext();
          }
        } else {
          {
            theirRangesMoved = theirRanges.moveNext();
          }
        }
      }
    }
    if (newRanges.length === 0) {
      return VersionConstraint.empty;
    }
    if (__dartEquals(newRanges.length, 1)) {
      return __dartIterableSingle(newRanges);
    }
    return VersionUnion.fromRanges(newRanges);
  }
  difference(other) {
    let ourRanges = __dartIterator(this.ranges);
    let theirRanges = __dartIterator(this._rangesFor(other));
    let newRanges = new Array(0).fill(null);
    ourRanges.moveNext();
    theirRanges.moveNext();
    let current = ourRanges.current;
    function theirNextRange() {
      if (theirRanges.moveNext()) {
        return true;
      }
      (newRanges.push(current), null);
      while (ourRanges.moveNext()) {
        {
          (newRanges.push(ourRanges.current), null);
        }
      }
      return false;
    }
    function ourNextRange({ includeCurrent = true } = {}) {
      if (includeCurrent) {
        (newRanges.push(current), null);
      }
      if (!(ourRanges.moveNext())) {
        return false;
      }
      current = ourRanges.current;
      return true;
    }
    L:
    for (; ; ) {
      L_1:
      {
        if (strictlyLower(theirRanges.current, current)) {
          {
            if (!(theirNextRange())) {
              break L;
            }
            break L_1;
          }
        }
        if (strictlyHigher(theirRanges.current, current)) {
          {
            if (!(ourNextRange())) {
              break L;
            }
            break L_1;
          }
        }
        let difference = current.difference(theirRanges.current);
        if (difference instanceof VersionUnion) {
          {
            (newRanges.push(__dartIterableFirst(difference.ranges)), null);
            current = __dartIterableLast(difference.ranges);
            if (!(theirNextRange())) {
              break L;
            }
          }
        } else {
          if (difference.isEmpty) {
            {
              if (!(ourNextRange({ includeCurrent: false }))) {
                break L;
              }
            }
          } else {
            {
              current = __dartAs(difference, value => value instanceof VersionRange, "VersionRange");
              if (allowsHigher(current, theirRanges.current)) {
                {
                  if (!(theirNextRange())) {
                    break L;
                  }
                }
              } else {
                {
                  if (!(ourNextRange())) {
                    break L;
                  }
                }
              }
            }
          }
        }
      }
    }
    if (newRanges.length === 0) {
      return VersionConstraint.empty;
    }
    if (__dartEquals(newRanges.length, 1)) {
      return __dartIterableSingle(newRanges);
    }
    return VersionUnion.fromRanges(newRanges);
  }
  _rangesFor(constraint) {
    if (constraint.isEmpty) {
      return new Array(0).fill(null);
    }
    if (constraint instanceof VersionUnion) {
      return constraint.ranges;
    }
    if (constraint instanceof VersionRange) {
      return [constraint];
    }
    (() => { throw __dartCoreError("ArgumentError", "Unknown VersionConstraint type " + __dartStr(constraint) + "."); })();
  }
  union(other) {
    return VersionConstraint.unionOf([this, other]);
  }
  "=="(other) {
    return (other instanceof VersionUnion && __dartConst("[\"instance\",\"class:ListEquality\",[\"typeArgument\",\"InterfaceType(VersionRange)\"],[\"field\",\"field:ListEquality._elementEquality\",[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]]]", () => Object.freeze(Object.assign(Object.create(ListEquality.prototype), { _elementEquality: __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) }))).equals(this.ranges, other.ranges));
  }
  get hashCode() {
    return __dartConst("[\"instance\",\"class:ListEquality\",[\"typeArgument\",\"InterfaceType(VersionRange)\"],[\"field\",\"field:ListEquality._elementEquality\",[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]]]", () => Object.freeze(Object.assign(Object.create(ListEquality.prototype), { _elementEquality: __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) }))).hash(this.ranges);
  }
  toString() {
    return __dartIterableJoin(this.ranges, " or ");
  }
}

function $VersionUnion_fromRanges($newTarget, ranges) {
  const $self = Object.create($newTarget.prototype);
  Object.defineProperty($self, $VersionConstraint_interface, { value: true });
  $self.ranges = ranges;
  return $self;
}

class VersionRange {
  static _(min, max, includeMin, includeMax) {
    return $VersionRange__(VersionRange, min, max, includeMin, includeMax);
  }
  constructor({ min = null, max = null, includeMin = false, includeMax = false, alwaysIncludeMaxPreRelease = false } = {}) {
    if (((!((min === null)) && !((max === null))) && min[">"](max))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Minimum version (\"" + __dartStr(min) + "\") must be less than maximum (\"" + __dartStr(max) + "\")."); })();
      }
    }
    if ((((((!(alwaysIncludeMaxPreRelease) && !(includeMax)) && !((max === null))) && !(max.isPreRelease)) && __dartIterableIsEmpty(max.build)) && (((min === null) || !(min.isPreRelease)) || !(equalsWithoutPreRelease(min, max))))) {
      {
        max = max.firstPreRelease;
      }
    }
    return VersionRange._(min, max, includeMin, includeMax);
  }
  "=="(other) {
    if (!(other instanceof VersionRange)) {
      return false;
    }
    return ((((() => { const $left = this.min; const $right = other.min; return $left === null ? $right === null : $left["=="]($right); })() && (() => { const $left_1 = this.max; const $right_1 = other.max; return $left_1 === null ? $right_1 === null : $left_1["=="]($right_1); })()) && __dartEquals(this.includeMin, other.includeMin)) && __dartEquals(this.includeMax, other.includeMax));
  }
  get hashCode() {
    return (((__dartHashValue(this.min) ^ (__dartHashValue(this.max) * 3)) ^ (this.includeMin.hashCode * 5)) ^ (this.includeMax.hashCode * 7));
  }
  get isEmpty() {
    return false;
  }
  get isAny() {
    return ((this.min === null) && (this.max === null));
  }
  allows(other) {
    if (!((this.min === null))) {
      {
        if (other["<"](__dartNullCheck(this.min))) {
          return false;
        }
        if ((!(this.includeMin) && (() => { const $left = other; const $right = this.min; return $left === null ? $right === null : $left["=="]($right); })())) {
          return false;
        }
      }
    }
    if (!((this.max === null))) {
      {
        if (other[">"](__dartNullCheck(this.max))) {
          return false;
        }
        if ((!(this.includeMax) && (() => { const $left_1 = other; const $right_1 = this.max; return $left_1 === null ? $right_1 === null : $left_1["=="]($right_1); })())) {
          return false;
        }
      }
    }
    return true;
  }
  allowsAll(other) {
    if (other.isEmpty) {
      return true;
    }
    if (other instanceof Version) {
      return this.allows(other);
    }
    if (other instanceof VersionUnion) {
      {
        return Array.from(other.ranges).every(__dartBind(this, "allowsAll"));
      }
    }
    if (other instanceof VersionRange) {
      {
        return (!(allowsLower(other, this)) && !(allowsHigher(other, this)));
      }
    }
    (() => { throw __dartCoreError("ArgumentError", "Unknown VersionConstraint type " + __dartStr(other) + "."); })();
  }
  allowsAny(other) {
    if (other.isEmpty) {
      return false;
    }
    if (other instanceof Version) {
      return this.allows(other);
    }
    if (other instanceof VersionUnion) {
      {
        return Array.from(other.ranges).some(__dartBind(this, "allowsAny"));
      }
    }
    if (other instanceof VersionRange) {
      {
        return (!(strictlyLower(other, this)) && !(strictlyHigher(other, this)));
      }
    }
    (() => { throw __dartCoreError("ArgumentError", "Unknown VersionConstraint type " + __dartStr(other) + "."); })();
  }
  intersect(other) {
    if (other.isEmpty) {
      return other;
    }
    if (other instanceof VersionUnion) {
      return other.intersect(this);
    }
    if (other instanceof Version) {
      {
        return (this.allows(other) ? other : VersionConstraint.empty);
      }
    }
    if (other instanceof VersionRange) {
      {
        let intersectMin = null;
        let intersectIncludeMin = null;
        if (allowsLower(this, other)) {
          {
            if (strictlyLower(this, other)) {
              return VersionConstraint.empty;
            }
            intersectMin = other.min;
            intersectIncludeMin = other.includeMin;
          }
        } else {
          {
            if (strictlyLower(other, this)) {
              return VersionConstraint.empty;
            }
            intersectMin = this.min;
            intersectIncludeMin = this.includeMin;
          }
        }
        let intersectMax = null;
        let intersectIncludeMax = null;
        if (allowsHigher(this, other)) {
          {
            intersectMax = other.max;
            intersectIncludeMax = other.includeMax;
          }
        } else {
          {
            intersectMax = this.max;
            intersectIncludeMax = this.includeMax;
          }
        }
        if (((intersectMin === null) && (intersectMax === null))) {
          {
            return new VersionRange();
          }
        }
        if ((() => { const $left = intersectMin; const $right = intersectMax; return $left === null ? $right === null : $left["=="]($right); })()) {
          {
            return __dartNullCheck(intersectMin);
          }
        }
        return new VersionRange({ min: intersectMin, max: intersectMax, includeMin: intersectIncludeMin, includeMax: intersectIncludeMax, alwaysIncludeMaxPreRelease: true });
      }
    }
    (() => { throw __dartCoreError("ArgumentError", "Unknown VersionConstraint type " + __dartStr(other) + "."); })();
  }
  union(other) {
    if (other instanceof Version) {
      {
        if (this.allows(other)) {
          return this;
        }
        if ((() => { const $left = other; const $right = this.min; return $left === null ? $right === null : $left["=="]($right); })()) {
          {
            return new VersionRange({ min: this.min, max: this.max, includeMin: true, includeMax: this.includeMax, alwaysIncludeMaxPreRelease: true });
          }
        }
        if ((() => { const $left_1 = other; const $right_1 = this.max; return $left_1 === null ? $right_1 === null : $left_1["=="]($right_1); })()) {
          {
            return new VersionRange({ min: this.min, max: this.max, includeMin: this.includeMin, includeMax: true, alwaysIncludeMaxPreRelease: true });
          }
        }
        return VersionConstraint.unionOf([this, other]);
      }
    }
    if (other instanceof VersionRange) {
      {
        let edgesTouch = (((!((this.max === null)) && (() => { const $left_2 = this.max; const $right_2 = other.min; return $left_2 === null ? $right_2 === null : $left_2["=="]($right_2); })()) && (this.includeMax || other.includeMin)) || ((!((this.min === null)) && (() => { const $left_3 = this.min; const $right_3 = other.max; return $left_3 === null ? $right_3 === null : $left_3["=="]($right_3); })()) && (this.includeMin || other.includeMax)));
        if ((!(edgesTouch) && !(this.allowsAny(other)))) {
          {
            return VersionConstraint.unionOf([this, other]);
          }
        }
        let unionMin = null;
        let unionIncludeMin = null;
        if (allowsLower(this, other)) {
          {
            unionMin = this.min;
            unionIncludeMin = this.includeMin;
          }
        } else {
          {
            unionMin = other.min;
            unionIncludeMin = other.includeMin;
          }
        }
        let unionMax = null;
        let unionIncludeMax = null;
        if (allowsHigher(this, other)) {
          {
            unionMax = this.max;
            unionIncludeMax = this.includeMax;
          }
        } else {
          {
            unionMax = other.max;
            unionIncludeMax = other.includeMax;
          }
        }
        return new VersionRange({ min: unionMin, max: unionMax, includeMin: unionIncludeMin, includeMax: unionIncludeMax, alwaysIncludeMaxPreRelease: true });
      }
    }
    return VersionConstraint.unionOf([this, other]);
  }
  difference(other) {
    if (other.isEmpty) {
      return this;
    }
    if (other instanceof Version) {
      {
        if (!(this.allows(other))) {
          return this;
        }
        if ((() => { const $left = other; const $right = this.min; return $left === null ? $right === null : $left["=="]($right); })()) {
          {
            if (!(this.includeMin)) {
              return this;
            }
            return new VersionRange({ min: this.min, max: this.max, includeMax: this.includeMax, alwaysIncludeMaxPreRelease: true });
          }
        }
        if ((() => { const $left_1 = other; const $right_1 = this.max; return $left_1 === null ? $right_1 === null : $left_1["=="]($right_1); })()) {
          {
            if (!(this.includeMax)) {
              return this;
            }
            return new VersionRange({ min: this.min, max: this.max, includeMin: this.includeMin, alwaysIncludeMaxPreRelease: true });
          }
        }
        return VersionUnion.fromRanges([new VersionRange({ min: this.min, max: other, includeMin: this.includeMin, alwaysIncludeMaxPreRelease: true }), new VersionRange({ min: other, max: this.max, includeMax: this.includeMax, alwaysIncludeMaxPreRelease: true })]);
      }
    } else {
      if (other instanceof VersionRange) {
        {
          if (!(this.allowsAny(other))) {
            return this;
          }
          let before = null;
          if (!(allowsLower(this, other))) {
            {
              before = null;
            }
          } else {
            if ((() => { const $left_2 = this.min; const $right_2 = other.min; return $left_2 === null ? $right_2 === null : $left_2["=="]($right_2); })()) {
              {
                before = this.min;
              }
            } else {
              {
                before = new VersionRange({ min: this.min, max: other.min, includeMin: this.includeMin, includeMax: !(other.includeMin), alwaysIncludeMaxPreRelease: true });
              }
            }
          }
          let after = null;
          if (!(allowsHigher(this, other))) {
            {
              after = null;
            }
          } else {
            if ((() => { const $left_3 = this.max; const $right_3 = other.max; return $left_3 === null ? $right_3 === null : $left_3["=="]($right_3); })()) {
              {
                after = this.max;
              }
            } else {
              {
                after = new VersionRange({ min: other.max, max: this.max, includeMin: !(other.includeMax), includeMax: this.includeMax, alwaysIncludeMaxPreRelease: true });
              }
            }
          }
          if (((before === null) && (after === null))) {
            return VersionConstraint.empty;
          }
          if ((before === null)) {
            return __dartNullCheck(after);
          }
          if ((after === null)) {
            return before;
          }
          return VersionUnion.fromRanges([before, after]);
        }
      } else {
        if (other instanceof VersionUnion) {
          {
            let ranges = new Array(0).fill(null);
            let current = this;
            L:
            {
              let _sync_for_iterator = __dartIterator(other.ranges);
              for (; _sync_for_iterator.moveNext(); ) {
                {
                  let range = _sync_for_iterator.current;
                  L_1:
                  {
                    if (strictlyLower(range, current)) {
                      break L_1;
                    }
                    if (strictlyHigher(range, current)) {
                      break L;
                    }
                    let difference = current.difference(range);
                    if (difference.isEmpty) {
                      {
                        return VersionConstraint.empty;
                      }
                    } else {
                      if (difference instanceof VersionUnion) {
                        {
                          (ranges.push(__dartIterableFirst(difference.ranges)), null);
                          current = __dartIterableLast(difference.ranges);
                        }
                      } else {
                        {
                          current = __dartAs(difference, value => value instanceof VersionRange, "VersionRange");
                        }
                      }
                    }
                  }
                }
              }
            }
            if (ranges.length === 0) {
              return current;
            }
            return VersionUnion.fromRanges((() => { let v = ranges; return (() => {
              (v.push(current), null);
              return v;
            })(); })());
          }
        }
      }
    }
    (() => { throw __dartCoreError("ArgumentError", "Unknown VersionConstraint type " + __dartStr(other) + "."); })();
  }
  compareTo(other) {
    if ((this.min === null)) {
      {
        if ((other.min === null)) {
          return this._compareMax(other);
        }
        return (-1);
      }
    } else {
      if ((other.min === null)) {
        {
          return 1;
        }
      }
    }
    let result = __dartNullCheck(this.min).compareTo(__dartNullCheck(other.min));
    if (!(__dartEquals(result, 0))) {
      return result;
    }
    if (!(__dartEquals(this.includeMin, other.includeMin))) {
      return (this.includeMin ? (-1) : 1);
    }
    return this._compareMax(other);
  }
  _compareMax(other) {
    if ((this.max === null)) {
      {
        if ((other.max === null)) {
          return 0;
        }
        return 1;
      }
    } else {
      if ((other.max === null)) {
        {
          return (-1);
        }
      }
    }
    let result = __dartNullCheck(this.max).compareTo(__dartNullCheck(other.max));
    if (!(__dartEquals(result, 0))) {
      return result;
    }
    if (!(__dartEquals(this.includeMax, other.includeMax))) {
      return (this.includeMax ? 1 : (-1));
    }
    return 0;
  }
  toString() {
    let buffer = __dartStringBuffer("");
    const min = this.min;
    if (!((min === null))) {
      {
        (() => { let v = buffer; return (() => {
          v.write((this.includeMin ? ">=" : ">"));
          v.write(min);
          return v;
        })(); })();
      }
    }
    const max = this.max;
    if (!((max === null))) {
      {
        if (!((min === null))) {
          buffer.write(" ");
        }
        if (this.includeMax) {
          {
            (() => { let v_1 = buffer; return (() => {
              v_1.write("<=");
              v_1.write(max);
              return v_1;
            })(); })();
          }
        } else {
          {
            buffer.write("<");
            if (max.isFirstPreRelease) {
              {
                buffer.write(__dartStr(max.major) + "." + __dartStr(max.minor) + "." + __dartStr(max.patch));
              }
            } else {
              {
                buffer.write(max);
                let minIsPreReleaseOfMax = ((!((min === null)) && min.isPreRelease) && equalsWithoutPreRelease(min, max));
                if (((!(max.isPreRelease) && __dartIterableIsEmpty(max.build)) && !(minIsPreReleaseOfMax))) {
                  {
                    buffer.write("-∞");
                  }
                }
              }
            }
          }
        }
      }
    }
    if (((min === null) && (max === null))) {
      buffer.write("any");
    }
    return __dartStr(buffer);
  }
}
Object.defineProperty(VersionRange, Symbol.hasInstance, { value(value) { return value != null && value[$VersionRange_interface] === true; } });

function $VersionRange__($newTarget, min, max, includeMin, includeMax) {
  const $self = Object.create($newTarget.prototype);
  Object.defineProperty($self, $VersionConstraint_interface, { value: true });
  Object.defineProperty($self, $VersionRange_interface, { value: true });
  $self.min = min;
  $self.max = max;
  $self.includeMin = includeMin;
  $self.includeMax = includeMax;
  return $self;
}

class CompatibleWithVersionRange extends VersionRange {
  constructor(version) {
    const $self = $VersionRange__(new.target, version, version.nextBreaking.firstPreRelease, true, false);
    return $self;
  }
  toString() {
    return "^" + __dartStr(this.min);
  }
}

class _EmptyVersion {
  constructor() {
    Object.defineProperty(this, $VersionConstraint_interface, { value: true });
  }
  get isEmpty() {
    return true;
  }
  get isAny() {
    return false;
  }
  allows(other) {
    return false;
  }
  allowsAll(other) {
    return other.isEmpty;
  }
  allowsAny(other) {
    return false;
  }
  intersect(other) {
    return this;
  }
  union(other) {
    return other;
  }
  difference(other) {
    return this;
  }
  toString() {
    return "<empty>";
  }
}

class Version {
  static _(major, minor, patch, preRelease, build, _text) {
    return $Version__(Version, major, minor, patch, preRelease, build, _text);
  }
  static get none() {
    return new Version(0, 0, 0);
  }
  static prioritize(a, b) {
    if ((a.isPreRelease && !(b.isPreRelease))) {
      return (-1);
    }
    if ((!(a.isPreRelease) && b.isPreRelease)) {
      return 1;
    }
    return a.compareTo(b);
  }
  static antiprioritize(a, b) {
    if ((a.isPreRelease && !(b.isPreRelease))) {
      return (-1);
    }
    if ((!(a.isPreRelease) && b.isPreRelease)) {
      return 1;
    }
    return b.compareTo(a);
  }
  get min() {
    return this;
  }
  get max() {
    return this;
  }
  get includeMin() {
    return true;
  }
  get includeMax() {
    return true;
  }
  constructor(major, minor, patch, { pre = null, build = null } = {}) {
    let text = __dartStr(major) + "." + __dartStr(minor) + "." + __dartStr(patch);
    if (!((pre === null))) {
      text = (text + "-" + __dartStr(pre));
    }
    if (!((build === null))) {
      text = (text + "+" + __dartStr(build));
    }
    return Version._(major, minor, patch, pre, build, text);
  }
  static parse(text) {
    const match = completeVersion.firstMatch(text);
    if ((match === null)) {
      {
        (() => { throw __dartCoreError("FormatException", "Could not parse \"" + __dartStr(text) + "\"."); })();
      }
    }
    try {
      {
        let major = __dartIntParse(__dartNullCheck(match[1]), null);
        let minor = __dartIntParse(__dartNullCheck(match[2]), null);
        let patch = __dartIntParse(__dartNullCheck(match[3]), null);
        let preRelease = match[5];
        let build = match[8];
        return Version._(major, minor, patch, preRelease, build, text);
      }
    } catch ($error) {
      if (__dartIsCoreError($error, "FormatException")) {
        {
          (() => { throw __dartCoreError("FormatException", "Could not parse \"" + __dartStr(text) + "\"."); })();
        }
      } else {
        throw $error;
      }
    }
  }
  static primary(versions) {
    let primary = __dartIndexGet(versions, 0);
    {
      let _sync_for_iterator = __dartIterator(Array.from(versions).slice(1));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let version = _sync_for_iterator.current;
          {
            if (((!(version.isPreRelease) && primary.isPreRelease) || (__dartEquals(version.isPreRelease, primary.isPreRelease) && version[">"](primary)))) {
              {
                primary = version;
              }
            }
          }
        }
      }
    }
    return primary;
  }
  static _splitParts(text) {
    return Array.from(Array.from(text.split("."), function(part) { return (__dartIntTryParse(part, null) ?? part); }));
  }
  "=="(other) {
    return (((((other instanceof Version && __dartEquals(this.major, other.major)) && __dartEquals(this.minor, other.minor)) && __dartEquals(this.patch, other.patch)) && __dartConst("[\"instance\",\"class:IterableEquality\",[\"typeArgument\",\"InterfaceType(Object)\"],[\"field\",\"field:IterableEquality._elementEquality\",[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]]]", () => Object.freeze(Object.assign(Object.create(IterableEquality.prototype), { _elementEquality: __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) }))).equals(this.preRelease, other.preRelease)) && __dartConst("[\"instance\",\"class:IterableEquality\",[\"typeArgument\",\"InterfaceType(Object)\"],[\"field\",\"field:IterableEquality._elementEquality\",[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]]]", () => Object.freeze(Object.assign(Object.create(IterableEquality.prototype), { _elementEquality: __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) }))).equals(this.build, other.build));
  }
  get hashCode() {
    return ((((this.major ^ this.minor) ^ this.patch) ^ __dartConst("[\"instance\",\"class:IterableEquality\",[\"typeArgument\",\"InterfaceType(Object)\"],[\"field\",\"field:IterableEquality._elementEquality\",[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]]]", () => Object.freeze(Object.assign(Object.create(IterableEquality.prototype), { _elementEquality: __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) }))).hash(this.preRelease)) ^ __dartConst("[\"instance\",\"class:IterableEquality\",[\"typeArgument\",\"InterfaceType(Object)\"],[\"field\",\"field:IterableEquality._elementEquality\",[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]]]", () => Object.freeze(Object.assign(Object.create(IterableEquality.prototype), { _elementEquality: __dartConst("[\"instance\",\"class:DefaultEquality\",[\"typeArgument\",\"NeverType(Never)\"]]", () => Object.freeze(Object.create(DefaultEquality.prototype))) }))).hash(this.build));
  }
  "<"(other) {
    return (this.compareTo(other) < 0);
  }
  ">"(other) {
    return (this.compareTo(other) > 0);
  }
  "<="(other) {
    return (this.compareTo(other) <= 0);
  }
  ">="(other) {
    return (this.compareTo(other) >= 0);
  }
  get isAny() {
    return false;
  }
  get isEmpty() {
    return false;
  }
  get isPreRelease() {
    return !__dartIterableIsEmpty(this.preRelease);
  }
  get nextMajor() {
    if (((this.isPreRelease && __dartEquals(this.minor, 0)) && __dartEquals(this.patch, 0))) {
      {
        return new Version(this.major, this.minor, this.patch);
      }
    }
    return this._incrementMajor();
  }
  get nextMinor() {
    if ((this.isPreRelease && __dartEquals(this.patch, 0))) {
      {
        return new Version(this.major, this.minor, this.patch);
      }
    }
    return this._incrementMinor();
  }
  get nextPatch() {
    if (this.isPreRelease) {
      {
        return new Version(this.major, this.minor, this.patch);
      }
    }
    return this._incrementPatch();
  }
  get nextBreaking() {
    if (__dartEquals(this.major, 0)) {
      {
        return this._incrementMinor();
      }
    }
    return this._incrementMajor();
  }
  get firstPreRelease() {
    return new Version(this.major, this.minor, this.patch, { pre: "0" });
  }
  get isFirstPreRelease() {
    return (__dartEquals(this.preRelease.length, 1) && __dartEquals(__dartIterableFirst(this.preRelease), 0));
  }
  _incrementMajor() {
    return new Version((this.major + 1), 0, 0);
  }
  _incrementMinor() {
    return new Version(this.major, (this.minor + 1), 0);
  }
  _incrementPatch() {
    return new Version(this.major, this.minor, (this.patch + 1));
  }
  allows(other) {
    return (() => { const $left = this; const $right = other; return $left === null ? $right === null : $left["=="]($right); })();
  }
  allowsAll(other) {
    return (other.isEmpty || __dartEquals(other, this));
  }
  allowsAny(other) {
    return other.allows(this);
  }
  intersect(other) {
    return (other.allows(this) ? this : VersionConstraint.empty);
  }
  union(other) {
    if (other.allows(this)) {
      return other;
    }
    if (other instanceof VersionRange) {
      {
        if ((() => { const $left = other.min; const $right = this; return $left === null ? $right === null : $left["=="]($right); })()) {
          {
            return new VersionRange({ min: other.min, max: other.max, includeMin: true, includeMax: other.includeMax, alwaysIncludeMaxPreRelease: true });
          }
        }
        if ((() => { const $left_1 = other.max; const $right_1 = this; return $left_1 === null ? $right_1 === null : $left_1["=="]($right_1); })()) {
          {
            return new VersionRange({ min: other.min, max: other.max, includeMin: other.includeMin, includeMax: true, alwaysIncludeMaxPreRelease: true });
          }
        }
      }
    }
    return VersionConstraint.unionOf([this, other]);
  }
  difference(other) {
    return (other.allows(this) ? VersionConstraint.empty : this);
  }
  compareTo(other) {
    if (other instanceof Version) {
      {
        if (!(__dartEquals(this.major, other.major))) {
          return (this.major < other.major ? -1 : (this.major > other.major ? 1 : 0));
        }
        if (!(__dartEquals(this.minor, other.minor))) {
          return (this.minor < other.minor ? -1 : (this.minor > other.minor ? 1 : 0));
        }
        if (!(__dartEquals(this.patch, other.patch))) {
          return (this.patch < other.patch ? -1 : (this.patch > other.patch ? 1 : 0));
        }
        if ((!(this.isPreRelease) && other.isPreRelease)) {
          return 1;
        }
        if ((!(other.isPreRelease) && this.isPreRelease)) {
          return (-1);
        }
        let comparison = this._compareLists(this.preRelease, other.preRelease);
        if (!(__dartEquals(comparison, 0))) {
          return comparison;
        }
        if ((__dartIterableIsEmpty(this.build) && !__dartIterableIsEmpty(other.build))) {
          return (-1);
        }
        if ((__dartIterableIsEmpty(other.build) && !__dartIterableIsEmpty(this.build))) {
          return 1;
        }
        return this._compareLists(this.build, other.build);
      }
    } else {
      {
        return (-other.compareTo(this));
      }
    }
  }
  toString() {
    return this._text;
  }
  get canonicalizedVersion() {
    return __dartStr(new Version(this.major, this.minor, this.patch, { pre: (!__dartIterableIsEmpty(this.preRelease) ? __dartIterableJoin(this.preRelease, ".") : null), build: (!__dartIterableIsEmpty(this.build) ? __dartIterableJoin(this.build, ".") : null) }));
  }
  _compareLists(a, b) {
    for (let i = 0; (i < Math.max(a.length, b.length)); i = (i + 1)) {
      L:
      {
        let aPart = ((i < a.length) ? __dartIndexGet(a, i) : null);
        let bPart = ((i < b.length) ? __dartIndexGet(b, i) : null);
        if (__dartEquals(aPart, bPart)) {
          break L;
        }
        if ((aPart === null)) {
          return (-1);
        }
        if ((bPart === null)) {
          return 1;
        }
        if (typeof aPart === "number") {
          {
            if (typeof bPart === "number") {
              {
                return (aPart < bPart ? -1 : (aPart > bPart ? 1 : 0));
              }
            } else {
              {
                return (-1);
              }
            }
          }
        } else {
          {
            if (typeof bPart === "number") {
              {
                return 1;
              }
            } else {
              {
                return (__dartAs(aPart, value => typeof value === "string", "String") < __dartAs(bPart, value => typeof value === "string", "String") ? -1 : (__dartAs(aPart, value => typeof value === "string", "String") > __dartAs(bPart, value => typeof value === "string", "String") ? 1 : 0));
              }
            }
          }
        }
      }
    }
    return 0;
  }
}

function $Version__($newTarget, major, minor, patch, preRelease, build, _text) {
  const $self = Object.create($newTarget.prototype);
  Object.defineProperty($self, $VersionConstraint_interface, { value: true });
  Object.defineProperty($self, $VersionRange_interface, { value: true });
  $self.major = major;
  $self.minor = minor;
  $self.patch = patch;
  $self._text = _text;
  $self.preRelease = (((preRelease === null) || preRelease.length === 0) ? new Array(0).fill(null) : Version._splitParts(preRelease));
  $self.build = (((build === null) || build.length === 0) ? new Array(0).fill(null) : Version._splitParts(build));
  if (($self.major < 0)) {
    (() => { throw __dartCoreError("ArgumentError", "Major version must be non-negative."); })();
  }
  if (($self.minor < 0)) {
    (() => { throw __dartCoreError("ArgumentError", "Minor version must be non-negative."); })();
  }
  if (($self.patch < 0)) {
    (() => { throw __dartCoreError("ArgumentError", "Patch version must be non-negative."); })();
  }
  return $self;
}


const $VersionConstraint_any = __dartLazyField("VersionConstraint.any", () => new VersionRange(), true);
Object.defineProperty(VersionConstraint, "any", {
  get() { return $VersionConstraint_any.get(); },
  set(value) { $VersionConstraint_any.set(value); },
  enumerable: true,
});

const $VersionConstraint_empty = __dartLazyField("VersionConstraint.empty", () => __dartConst("[\"instance\",\"class:_EmptyVersion\"]", () => Object.freeze(Object.create(_EmptyVersion.prototype))), true);
Object.defineProperty(VersionConstraint, "empty", {
  get() { return $VersionConstraint_empty.get(); },
  set(value) { $VersionConstraint_empty.set(value); },
  enumerable: true,
});
const startVersion = __dartRegExp("^(\\d+)\\.(\\d+)\\.(\\d+)(-([0-9A-Za-z-]+(\\.[0-9A-Za-z-]+)*))?(\\+([0-9A-Za-z-]+(\\.[0-9A-Za-z-]+)*))?", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });

const completeVersion = __dartRegExp(__dartStr(startVersion.pattern) + "$", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });

const startComparison = __dartRegExp("^[<>]=?", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false });

function areAdjacent(range1, range2) {
  if (!((() => { const $left = range1.max; const $right = range2.min; return $left === null ? $right === null : $left["=="]($right); })())) {
    return false;
  }
  return ((range1.includeMax && !(range2.includeMin)) || (!(range1.includeMax) && range2.includeMin));
}

function allowsLower(range1, range2) {
  if ((range1.min === null)) {
    return !((range2.min === null));
  }
  if ((range2.min === null)) {
    return false;
  }
  let comparison = __dartNullCheck(range1.min).compareTo(__dartNullCheck(range2.min));
  if (__dartEquals(comparison, (-1))) {
    return true;
  }
  if (__dartEquals(comparison, 1)) {
    return false;
  }
  return (range1.includeMin && !(range2.includeMin));
}

function allowsHigher(range1, range2) {
  if ((range1.max === null)) {
    return !((range2.max === null));
  }
  if ((range2.max === null)) {
    return false;
  }
  let comparison = __dartNullCheck(range1.max).compareTo(__dartNullCheck(range2.max));
  if (__dartEquals(comparison, 1)) {
    return true;
  }
  if (__dartEquals(comparison, (-1))) {
    return false;
  }
  return (range1.includeMax && !(range2.includeMax));
}

function strictlyLower(range1, range2) {
  if (((range1.max === null) || (range2.min === null))) {
    return false;
  }
  let comparison = __dartNullCheck(range1.max).compareTo(__dartNullCheck(range2.min));
  if (__dartEquals(comparison, (-1))) {
    return true;
  }
  if (__dartEquals(comparison, 1)) {
    return false;
  }
  return (!(range1.includeMax) || !(range2.includeMin));
}

function strictlyHigher(range1, range2) {
  return strictlyLower(range2, range1);
}

function equalsWithoutPreRelease(version1, version2) {
  return ((__dartEquals(version1.major, version2.major) && __dartEquals(version1.minor, version2.minor)) && __dartEquals(version1.patch, version2.patch));
}

export function main() {
  const parsed = Version.parse("01.02.03-01.dev+pre.02");
  const stable = new Version(1, 2, 3);
  const preRelease = new Version(1, 2, 4, { pre: "alpha.1", build: "b.5" });
  const ordered = (() => { let v = [preRelease, Version.parse("1.2.4"), stable]; return (() => {
    __dartListSort(v, Version.prioritize);
    return v;
  })(); })();
  const primary = Version.primary([preRelease, stable, Version.parse("2.0.0-dev")]);
  const range = VersionConstraint.parse(">=1.2.0 <2.0.0");
  const compatible = VersionConstraint.compatibleWith(Version.parse("1.2.3"));
  const union = VersionConstraint.unionOf([VersionConstraint.parse("<1.0.0"), VersionConstraint.parse(">=2.0.0 <3.0.0")]);
  const intersection = range.intersect(VersionConstraint.parse(">=1.5.0 <1.6.0"));
  const difference = range.difference(VersionConstraint.parse(">=1.4.0 <1.8.0"));
  const exact = Version.parse("1.5.0");
  __dartPrint("semver " + __dartStr(parsed.canonicalizedVersion) + " " + __dartStr(parsed) + " " + __dartStr(preRelease.isPreRelease) + " " + __dartStr(stable.nextMajor) + " " + __dartStr(stable.nextMinor) + " " + __dartStr(stable.nextPatch) + " " + __dartStr(Version.none) + " " + __dartStr(__dartIndexGet(ordered, ordered.length - 1)) + " " + __dartStr(primary) + " " + __dartStr(range.allows(exact)) + " " + __dartStr(range.allows(Version.parse("2.0.0"))) + " " + __dartStr(compatible.allows(Version.parse("1.9.9"))) + " " + __dartStr(compatible.allows(Version.parse("2.0.0"))) + " " + __dartStr(union.allows(Version.parse("0.5.0"))) + " " + __dartStr(union.allows(Version.parse("1.5.0"))) + " " + __dartStr(union) + " " + __dartStr(intersection) + " " + __dartStr(difference) + " " + __dartStr(VersionConstraint.empty.isEmpty) + " " + __dartStr(VersionConstraint.any.isAny));
}

main();
