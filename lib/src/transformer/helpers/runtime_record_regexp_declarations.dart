part of 'runtime_helpers.dart';

extension _Recordregexphelperdeclaration on EsmRuntimeHelperRegistry {
  EsmModuleItem _recordRegExpHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.recordShape => const EsmRawModuleItem(
        'const __dartRecordShape = Symbol("dart.recordShape");',
      ),
      EsmRuntimeHelper.isRecord => EsmRawModuleItem('''
function __dartIsRecord(value) {
  return value != null && typeof value === "object" && Array.isArray(value[__dartRecordShape]);
}
'''),
      EsmRuntimeHelper.record => EsmRawModuleItem(r'''
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
'''),
      EsmRuntimeHelper.pattern => EsmRawModuleItem(r'''
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
      if (match != null && match.index === 0) return index;
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
  if (regexp != null) return text.replace(regexp, (...args) => String(replace(__dartJsRegExpReplacementMatch(args))));
  return __dartStringReplaceStringMapped(text, String(pattern), replace, true, 0);
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
  return __dartStringReplaceStringMapped(text, String(pattern), replace, false, startIndex);
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
function __dartStringReplaceFirstPattern(source, pattern, replacement, startIndex = 0) {
  const text = String(source);
  const replacementText = String(replacement);
  const regexp = __dartPatternRegExp(pattern, false);
  if (regexp != null) {
    const tail = text.slice(startIndex);
    const match = regexp.exec(tail);
    if (match == null) return text;
    const index = startIndex + match.index;
    return text.slice(0, index) + replacementText + text.slice(index + match[0].length);
  }
  return __dartStringReplaceFirst(source, pattern, replacement, startIndex);
}
'''),
      EsmRuntimeHelper.regExp => EsmRawModuleItem(r'''
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
'''),
      EsmRuntimeHelper.regExpEscape => EsmRawModuleItem(r'''
function __dartRegExpEscape(source) {
  return String(source).replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");
}
'''),
      _ => throw StateError('Unexpected runtime helper declaration: $helper'),
    };
  }
}
