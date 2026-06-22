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
function __dartPatternRegExp(pattern, global = false) {
  if (pattern != null && typeof pattern.__dartRegExpMake === "function") return pattern.__dartRegExpMake(global);
  if (pattern instanceof RegExp) {
    let flags = pattern.flags;
    flags = global ? (flags.includes("g") ? flags : flags + "g") : flags.replace(/g/g, "");
    return new RegExp(pattern.source, flags);
  }
  return null;
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
function __dartEquals(left, right) {
  if (left === right) return true;
  if (left == null || right == null) return false;
  if ((typeof left === "number" || left.__dartType === "double") && (typeof right === "number" || right.__dartType === "double")) return Number(left) === Number(right);
  const equals = left["=="];
  return typeof equals === "function" ? equals.call(left, right) : false;
}

// Generated by dart2esm.

export function classify(kind) {
  try {
    {
      if (__dartEquals(kind, "format")) {
        {
          (() => { throw __dartCoreError("FormatException", "bad"); })();
        }
      }
      if (__dartEquals(kind, "plain")) {
        {
          (() => { throw __dartCoreError("Exception", "plain"); })();
        }
      }
      if (__dartEquals(kind, "text")) {
        {
          (() => { throw "text"; })();
        }
      }
      let value = 1;
      __dartAs(value, value => typeof value === "string", "String");
      return "no error";
    }
  } catch ($error) {
    if (__dartIsCoreError($error, "FormatException")) {
      const error = $error;
      {
        return "format:" + __dartStr(__dartStr(error));
      }
    } else if (__dartIsCoreError($error, "Exception")) {
      const error_1 = $error;
      {
        return "exception:" + __dartStr(__dartObjectToString(error_1));
      }
    } else if (__dartIsCoreError($error, "Error")) {
      const __wc0_formal = $error;
      {
        return "error";
      }
    } else if ($error != null) {
      const error_2 = $error;
      {
        return "fallback:" + __dartStr(error_2);
      }
    } else {
      throw $error;
    }
  }
}

export function classifyConstructed(kind) {
  try {
    {
      if (__dartEquals(kind, "range")) {
        {
          (() => { throw __dartCoreError("IndexError", 5); })();
        }
      }
      if (__dartEquals(kind, "argument")) {
        {
          (() => { throw __dartCoreError("ArgumentError", "name"); })();
        }
      }
      if (__dartEquals(kind, "state")) {
        {
          (() => { throw __dartCoreError("StateError", "bad"); })();
        }
      }
      if (__dartEquals(kind, "unsupported")) {
        {
          (() => { throw __dartCoreError("UnsupportedError", "nope"); })();
        }
      }
      (() => { throw __dartCoreError("UnimplementedError", "later"); })();
    }
  } catch ($error) {
    if (__dartIsCoreError($error, "RangeError")) {
      const error = $error;
      {
        return "range:" + __dartStr(__dartStr(error).includes("5"));
      }
    } else if (__dartIsCoreError($error, "ArgumentError")) {
      const error_1 = $error;
      {
        return "argument:" + __dartStr(__dartStr(error_1).includes("name"));
      }
    } else if (__dartIsCoreError($error, "StateError")) {
      const error_2 = $error;
      {
        return "state:" + __dartStr(__dartStr(error_2).includes("bad"));
      }
    } else if (__dartIsCoreError($error, "Error")) {
      const error_3 = $error;
      {
        return "error:" + __dartStr(__dartStringContains(__dartObjectToString(error_3), (__dartEquals(kind, "unsupported") ? "nope" : "later"), 0));
      }
    } else {
      throw $error;
    }
  }
}

export function main() {
  __dartPrint(classify("format"));
  __dartPrint(classify("plain"));
  __dartPrint(classify("text"));
  __dartPrint(classify("cast"));
  __dartPrint(classifyConstructed("range"));
  __dartPrint(classifyConstructed("argument"));
  __dartPrint(classifyConstructed("state"));
  __dartPrint(classifyConstructed("unsupported"));
  __dartPrint(classifyConstructed("unimplemented"));
}

main();
