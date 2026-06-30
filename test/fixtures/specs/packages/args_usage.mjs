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
function __dartMapPutIfAbsent(map, key, ifAbsent) {
  const actualKey = __dartMapKey(map, key);
  if (actualKey !== __dartMapMissingKey) return map.get(actualKey);
  const value = ifAbsent();
  __dartMapSet(map, key, value);
  return value;
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

const $ArgParser_interface = Symbol("ArgParser");

class ArgResults {
  constructor() {
    throw new TypeError("Class ArgResults has no unnamed constructor");
  }
  static _(_parser, _parsed, name, command, rest, arguments_1) {
    return $ArgResults__(ArgResults, _parser, _parsed, name, command, rest, arguments_1);
  }
  "[]"(name) {
    if (!(__dartMapContainsKey(this._parser.options, name))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Could not find an option named \"--" + __dartStr(name) + "\"."); })();
      }
    }
    const option = __dartNullCheck(__dartMapGet(this._parser.options, name));
    if ((option.mandatory && !(__dartMapContainsKey(this._parsed, name)))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Option " + __dartStr(name) + " is mandatory."); })();
      }
    }
    return option.valueOrDefault(__dartMapGet(this._parsed, name));
  }
  flag(name) {
    const option = __dartMapGet(this._parser.options, name);
    if ((option === null)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Could not find a flag named \"--" + __dartStr(name) + "\"."); })();
      }
    }
    if (!(option.isFlag)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "\"" + __dartStr(name) + "\" is not a flag."); })();
      }
    }
    return __dartAs(option.valueOrDefault(__dartMapGet(this._parsed, name)), value => typeof value === "boolean", "bool");
  }
  option(name) {
    const option = __dartMapGet(this._parser.options, name);
    if ((option === null)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Could not find an option named \"--" + __dartStr(name) + "\"."); })();
      }
    }
    if (!(option.isSingle)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "\"" + __dartStr(name) + "\" is a multi-option."); })();
      }
    }
    if ((option.mandatory && !(__dartMapContainsKey(this._parsed, name)))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Option " + __dartStr(name) + " is mandatory."); })();
      }
    }
    return __dartAs(option.valueOrDefault(__dartMapGet(this._parsed, name)), value => (value === null || typeof value === "string"), "String?");
  }
  multiOption(name) {
    let option = __dartMapGet(this._parser.options, name);
    if ((option === null)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Could not find an option named \"--" + __dartStr(name) + "\"."); })();
      }
    }
    if (!(option.isMultiple)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "\"" + __dartStr(name) + "\" is not a multi-option."); })();
      }
    }
    return __dartAs(option.valueOrDefault(__dartMapGet(this._parsed, name)), value => (Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView))), "List<String>");
  }
  get options() {
    let result = __dartSetFrom(Array.from(this._parsed.keys()));
    (this._parser.options.forEach((value, key) => (function(name, option) {
      if (!((option.defaultsTo === null))) {
        __dartSetAdd(result, name);
      }
})(key, value)), null);
    return result;
  }
  wasParsed(name) {
    if (!(__dartMapContainsKey(this._parser.options, name))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Could not find an option named \"--" + __dartStr(name) + "\"."); })();
      }
    }
    return __dartMapContainsKey(this._parsed, name);
  }
}

function $ArgResults__($newTarget, _parser, _parsed, name, command, rest, arguments_1) {
  const $self = Object.create($newTarget.prototype);
  $self._parser = _parser;
  $self._parsed = _parsed;
  $self.name = name;
  $self.command = command;
  $self.rest = __dartUnmodifiableListView(rest);
  $self.arguments = __dartUnmodifiableListView(arguments_1);
  return $self;
}

class Option {
  constructor() {
    throw new TypeError("Class Option has no unnamed constructor");
  }
  static _(name, abbr, help, valueHelp, allowed, allowedHelp, defaultsTo, callback, type, { negatable = null, splitCommas = null, mandatory = false, hide = false, hideNegatedUsage = null, aliases = __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) } = {}) {
    return $Option__(Option, name, abbr, help, valueHelp, allowed, allowedHelp, defaultsTo, callback, type, { negatable: negatable, splitCommas: splitCommas, mandatory: mandatory, hide: hide, hideNegatedUsage: hideNegatedUsage, aliases: aliases });
  }
  get isFlag() {
    return __dartEquals(this.type, __dartConst("[\"instance\",\"class:OptionType\",[\"field\",\"field:OptionType.name\",[\"string\",\"OptionType.flag\"]]]", () => Object.freeze(Object.assign(Object.create(OptionType.prototype), { name: "OptionType.flag" }))));
  }
  get isSingle() {
    return __dartEquals(this.type, __dartConst("[\"instance\",\"class:OptionType\",[\"field\",\"field:OptionType.name\",[\"string\",\"OptionType.single\"]]]", () => Object.freeze(Object.assign(Object.create(OptionType.prototype), { name: "OptionType.single" }))));
  }
  get isMultiple() {
    return __dartEquals(this.type, __dartConst("[\"instance\",\"class:OptionType\",[\"field\",\"field:OptionType.name\",[\"string\",\"OptionType.multiple\"]]]", () => Object.freeze(Object.assign(Object.create(OptionType.prototype), { name: "OptionType.multiple" }))));
  }
  valueOrDefault(value) {
    if (!((value === null))) {
      return value;
    }
    if (this.isMultiple) {
      return (this.defaultsTo ?? new Array(0).fill(null));
    }
    return this.defaultsTo;
  }
  getOrDefault(value) {
    return this.valueOrDefault(value);
  }
}

function $Option__($newTarget, name, abbr, help, valueHelp, allowed, allowedHelp, defaultsTo, callback, type, { negatable = null, splitCommas = null, mandatory = false, hide = false, hideNegatedUsage = null, aliases = __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) } = {}) {
  const $self = Object.create($newTarget.prototype);
  $self.name = name;
  $self.abbr = abbr;
  $self.help = help;
  $self.valueHelp = valueHelp;
  $self.defaultsTo = defaultsTo;
  $self.callback = callback;
  $self.type = type;
  $self.negatable = negatable;
  $self.mandatory = mandatory;
  $self.hide = hide;
  $self.hideNegatedUsage = hideNegatedUsage;
  $self.aliases = aliases;
  $self.allowed = ((allowed === null) ? null : Object.freeze(Array.from(allowed)));
  $self.allowedHelp = ((allowedHelp === null) ? null : __dartConstMap(allowedHelp));
  $self.splitCommas = (splitCommas ?? __dartEquals(type, __dartConst("[\"instance\",\"class:OptionType\",[\"field\",\"field:OptionType.name\",[\"string\",\"OptionType.multiple\"]]]", () => Object.freeze(Object.assign(Object.create(OptionType.prototype), { name: "OptionType.multiple" })))));
  if ($self.name.length === 0) {
    {
      (() => { throw __dartCoreError("ArgumentError", "Name cannot be empty."); })();
    }
  } else {
    if ($self.name.startsWith("-")) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Name " + __dartStr($self.name) + " cannot start with \"-\"."); })();
      }
    }
  }
  if (Option._invalidChars.hasMatch($self.name)) {
    {
      (() => { throw __dartCoreError("ArgumentError", "Name \"" + __dartStr($self.name) + "\" contains invalid characters."); })();
    }
  }
  let abbr_1 = $self.abbr;
  if (!((abbr_1 === null))) {
    {
      if (!(__dartEquals(abbr_1.length, 1))) {
        {
          (() => { throw __dartCoreError("ArgumentError", "Abbreviation must be null or have length 1."); })();
        }
      } else {
        if (__dartEquals(abbr_1, "-")) {
          {
            (() => { throw __dartCoreError("ArgumentError", "Abbreviation cannot be \"-\"."); })();
          }
        }
      }
      if (Option._invalidChars.hasMatch(abbr_1)) {
        {
          (() => { throw __dartCoreError("ArgumentError", "Abbreviation is an invalid character."); })();
        }
      }
    }
  }
  return $self;
}

class OptionType {
  constructor() {
    throw new TypeError("Class OptionType has no unnamed constructor");
  }
  static _(name) {
    return $OptionType__(OptionType, name);
  }
}

function $OptionType__($newTarget, name) {
  const $self = Object.create($newTarget.prototype);
  $self.name = name;
  return $self;
}

class ArgParserException {
  constructor(message, commands = null, argumentName = null, source = null, offset = null) {
    Object.defineProperty(this, "__dartCoreErrorType", { value: "FormatException", writable: true, configurable: true });
    this.message = "";
    this.source = null;
    this.offset = null;
    this.argumentName = argumentName;
    this.commands = ((commands === null) ? __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) : Object.freeze(Array.from(commands)));
    this.message = message;
    this.source = source;
    this.offset = offset;
  }
}

class Parser {
  constructor(_commandName, _grammar, _args, _parent = null, rest = null) {
    this._results = new Map([]);
    this._commandName = _commandName;
    this._grammar = _grammar;
    this._args = _args;
    this._parent = _parent;
    this._rest = (() => {
      const v = new Array(0).fill(null);
      const v_1 = rest;
      if (!((v_1 === null))) {
        (v.push(...Array.from(v_1)), null);
      }
      return v;
    })();
  }
  get _current() {
    return __dartIterableFirst(this._args);
  }
  parse() {
    let arguments_1 = Array.from(this._args);
    if (this._grammar.allowsAnything) {
      {
        return newArgResults(this._grammar, __dartConst("[\"map\",\"InterfaceType(String)\",\"DynamicType(dynamic)\"]", () => __dartConstMap([])), this._commandName, null, arguments_1, arguments_1);
      }
    }
    let commandResults = null;
    L:
    while (!__dartIterableIsEmpty(this._args)) {
      L_1:
      {
        if (__dartEquals(this._current, "--")) {
          {
            this._args.shift();
            break L;
          }
        }
        let command = __dartMapGet(this._grammar.commands, this._current);
        if (!((command === null))) {
          {
            this._validate(__dartIterableIsEmpty(this._rest), "Cannot specify arguments before a command.", this._current);
            let commandName = this._args.shift();
            let commandParser = new Parser(commandName, command, this._args, this, this._rest);
            try {
              {
                commandResults = commandParser.parse();
              }
            } catch ($error) {
              if ($error instanceof ArgParserException) {
                const error = $error;
                {
                  (() => { throw new ArgParserException(error.message, (() => {
                    const v = [commandName];
                    (v.push(...Array.from(error.commands)), null);
                    return v;
                  })(), error.argumentName, error.source, error.offset); })();
                }
              } else {
                throw $error;
              }
            }
            (this._rest.length = 0, null);
            break L;
          }
        }
        if (this._parseSoloOption()) {
          break L_1;
        }
        if (this._parseAbbreviation(this)) {
          break L_1;
        }
        if (this._parseLongOption()) {
          break L_1;
        }
        if (!(this._grammar.allowTrailingOptions)) {
          break L;
        }
        (this._rest.push(this._args.shift()), null);
      }
    }
    (this._grammar.options.forEach((value, key) => ((name, option) => {
      let parsedOption = __dartMapGet(this._results, name);
      let callback = option.callback;
      if ((callback === null)) {
        return;
      }
      if ((option.mandatory && (parsedOption === null))) {
        {
          (() => { throw new ArgParserException("Option " + __dartStr(name) + " is mandatory.", null, name); })();
        }
      }
      (callback)(option.valueOrDefault(parsedOption));
})(key, value)), null);
    (this._rest.push(...Array.from(this._args)), null);
    (this._args.length = 0, null);
    return newArgResults(this._grammar, this._results, this._commandName, commandResults, this._rest, arguments_1);
  }
  _readNextArgAsValue(option, arg) {
    this._validate(!__dartIterableIsEmpty(this._args), "Missing argument for \"" + __dartStr(arg) + "\".", arg);
    this._setOption(this._results, option, this._current, arg);
    this._args.shift();
  }
  _parseSoloOption() {
    if (!(__dartEquals(this._current.length, 2))) {
      return false;
    }
    if (!(this._current.startsWith("-"))) {
      return false;
    }
    let opt = this._current[1];
    if (!(_isLetterOrDigit(opt.charCodeAt(0)))) {
      return false;
    }
    return this._handleSoloOption(opt);
  }
  _handleSoloOption(opt) {
    let option = this._grammar.findByAbbreviation(opt);
    if ((option === null)) {
      {
        this._validate(!((this._parent === null)), "Could not find an option or flag \"-" + __dartStr(opt) + "\".", "-" + __dartStr(opt));
        return __dartNullCheck(this._parent)._handleSoloOption(opt);
      }
    }
    this._args.shift();
    if (option.isFlag) {
      {
        this._setFlag(this._results, option, true);
      }
    } else {
      {
        this._readNextArgAsValue(option, "-" + __dartStr(opt));
      }
    }
    return true;
  }
  _parseAbbreviation(innermostCommand) {
    if ((this._current.length < 2)) {
      return false;
    }
    if (!(this._current.startsWith("-"))) {
      return false;
    }
    let index = 1;
    while (((index < this._current.length) && _isLetterOrDigit(this._current.charCodeAt(index)))) {
      {
        index = (index + 1);
      }
    }
    if (__dartEquals(index, 1)) {
      return false;
    }
    let lettersAndDigits = this._current.substring(1, index);
    let rest = this._current.substring(index);
    if ((rest.includes("\n") || rest.includes("\r"))) {
      return false;
    }
    return this._handleAbbreviation(lettersAndDigits, rest, innermostCommand);
  }
  _handleAbbreviation(lettersAndDigits, rest, innermostCommand) {
    let c = lettersAndDigits.substring(0, 1);
    let first = this._grammar.findByAbbreviation(c);
    if ((first === null)) {
      {
        this._validate(!((this._parent === null)), "Could not find an option with short name \"-" + __dartStr(c) + "\".", "-" + __dartStr(c));
        return __dartNullCheck(this._parent)._handleAbbreviation(lettersAndDigits, rest, innermostCommand);
      }
    } else {
      if (!(first.isFlag)) {
        {
          let value = __dartStr(lettersAndDigits.substring(1)) + __dartStr(rest);
          this._setOption(this._results, first, value, "-" + __dartStr(c));
        }
      } else {
        {
          this._validate(__dartEquals(rest, ""), "Option \"-" + __dartStr(c) + "\" is a flag and cannot handle value " + "\"" + __dartStr(lettersAndDigits.substring(1)) + __dartStr(rest) + "\".", "-" + __dartStr(c));
          for (let i = 0; (i < lettersAndDigits.length); i = (i + 1)) {
            {
              let c_1 = lettersAndDigits.substring(i, (i + 1));
              innermostCommand._parseShortFlag(c_1);
            }
          }
        }
      }
    }
    this._args.shift();
    return true;
  }
  _parseShortFlag(c) {
    let option = this._grammar.findByAbbreviation(c);
    if ((option === null)) {
      {
        this._validate(!((this._parent === null)), "Could not find an option with short name \"-" + __dartStr(c) + "\".", "-" + __dartStr(c));
        __dartNullCheck(this._parent)._parseShortFlag(c);
        return;
      }
    }
    this._validate(option.isFlag, "Option \"-" + __dartStr(c) + "\" must be a flag to be in a collapsed \"-\".", "-" + __dartStr(c));
    this._setFlag(this._results, option, true);
  }
  _parseLongOption() {
    if (!(this._current.startsWith("--"))) {
      return false;
    }
    let index = this._current.indexOf("=");
    let name = (__dartEquals(index, (-1)) ? this._current.substring(2) : this._current.substring(2, index));
    for (let i = 0; !(__dartEquals(i, name.length)); i = (i + 1)) {
      {
        if (!(_isLetterDigitHyphenOrUnderscore(name.charCodeAt(i)))) {
          return false;
        }
      }
    }
    let value = (__dartEquals(index, (-1)) ? null : this._current.substring((index + 1)));
    if ((!((value === null)) && (value.includes("\n") || value.includes("\r")))) {
      {
        return false;
      }
    }
    return this._handleLongOption(name, value);
  }
  _handleLongOption(name, value) {
    let option = this._grammar.findByNameOrAlias(name);
    if (!((option === null))) {
      {
        this._args.shift();
        if (option.isFlag) {
          {
            this._validate((value === null), "Flag option \"--" + __dartStr(name) + "\" should not be given a value.", "--" + __dartStr(name));
            this._setFlag(this._results, option, true);
          }
        } else {
          if (!((value === null))) {
            {
              this._setOption(this._results, option, value, "--" + __dartStr(name));
            }
          } else {
            {
              this._readNextArgAsValue(option, "--" + __dartStr(name));
            }
          }
        }
      }
    } else {
      if (name.startsWith("no-")) {
        {
          let positiveName = name.substring("no-".length);
          option = this._grammar.findByNameOrAlias(positiveName);
          if ((option === null)) {
            {
              this._validate(!((this._parent === null)), "Could not find an option named \"--" + __dartStr(name) + "\".", "--" + __dartStr(name));
              return __dartNullCheck(this._parent)._handleLongOption(name, value);
            }
          }
          this._args.shift();
          this._validate(option.isFlag, "Cannot negate non-flag option \"--" + __dartStr(name) + "\".", "--" + __dartStr(name));
          this._validate(__dartNullCheck(option.negatable), "Cannot negate option \"--" + __dartStr(name) + "\".", "--" + __dartStr(name));
          this._setFlag(this._results, option, false);
        }
      } else {
        {
          this._validate(!((this._parent === null)), "Could not find an option named \"--" + __dartStr(name) + "\".", "--" + __dartStr(name));
          return __dartNullCheck(this._parent)._handleLongOption(name, value);
        }
      }
    }
    return true;
  }
  _validate(condition, message, args = null, source = null, offset = null) {
    if (!(condition)) {
      {
        (() => { throw new ArgParserException(message, null, args, source, offset); })();
      }
    }
  }
  _setOption(results, option, value, arg) {
    if (!(option.isMultiple)) {
      {
        this._validateAllowed(option, value, arg);
        __dartMapSet(results, option.name, value);
        return;
      }
    }
    let list = __dartAs(__dartMapPutIfAbsent(results, option.name, function() { return new Array(0).fill(null); }), value => (Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView))), "List<dynamic>");
    if (option.splitCommas) {
      {
        {
          let _sync_for_iterator = __dartIterator(value.split(","));
          for (; _sync_for_iterator.moveNext(); ) {
            {
              let element = _sync_for_iterator.current;
              {
                this._validateAllowed(option, element, arg);
                (list.push(element), null);
              }
            }
          }
        }
      }
    } else {
      {
        this._validateAllowed(option, value, arg);
        (list.push(value), null);
      }
    }
  }
  _setFlag(results, option, value) {
    __dartMapSet(results, option.name, value);
  }
  _validateAllowed(option, value, arg) {
    if ((option.allowed === null)) {
      return;
    }
    this._validate(__dartIterableContains(__dartNullCheck(option.allowed), value), "\"" + __dartStr(value) + "\" is not an allowed value for option \"" + __dartStr(arg) + "\".", arg);
  }
}

class ArgParser {
  static _(options, commands, _aliases, { allowTrailingOptions = true, usageLineLength = null } = {}) {
    return $ArgParser__(ArgParser, options, commands, _aliases, { allowTrailingOptions: allowTrailingOptions, usageLineLength: usageLineLength });
  }
  get allowsAnything() {
    return false;
  }
  constructor({ allowTrailingOptions = true, usageLineLength = null } = {}) {
    return ArgParser._(new Map([]), new Map([]), new Map([]), { allowTrailingOptions: allowTrailingOptions, usageLineLength: usageLineLength });
  }
  static allowAnything() {
    return new AllowAnythingParser();
  }
  addCommand(name, parser = null) {
    if (__dartMapContainsKey(this._commands, name)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Duplicate command \"" + __dartStr(name) + "\"."); })();
      }
    }
    ((parser === null) ? parser = new ArgParser() : null);
    __dartMapSet(this._commands, name, parser);
    return parser;
  }
  addFlag(name, { abbr = null, help = null, defaultsTo = false, negatable = true, callback = null, hide = false, hideNegatedUsage = false, aliases = __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) } = {}) {
    this._addOption(name, abbr, help, null, null, null, defaultsTo, ((callback === null) ? null : function(value) { return (callback)(value); }), __dartConst("[\"instance\",\"class:OptionType\",[\"field\",\"field:OptionType.name\",[\"string\",\"OptionType.flag\"]]]", () => Object.freeze(Object.assign(Object.create(OptionType.prototype), { name: "OptionType.flag" }))), { negatable: negatable, hide: hide, hideNegatedUsage: hideNegatedUsage, aliases: aliases });
  }
  addOption(name, { abbr = null, help = null, valueHelp = null, allowed = null, allowedHelp = null, defaultsTo = null, callback = null, mandatory = false, hide = false, aliases = __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) } = {}) {
    this._addOption(name, abbr, help, valueHelp, allowed, allowedHelp, defaultsTo, callback, __dartConst("[\"instance\",\"class:OptionType\",[\"field\",\"field:OptionType.name\",[\"string\",\"OptionType.single\"]]]", () => Object.freeze(Object.assign(Object.create(OptionType.prototype), { name: "OptionType.single" }))), { mandatory: mandatory, hide: hide, aliases: aliases });
  }
  addMultiOption(name, { abbr = null, help = null, valueHelp = null, allowed = null, allowedHelp = null, defaultsTo = null, callback = null, splitCommas = true, hide = false, aliases = __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) } = {}) {
    this._addOption(name, abbr, help, valueHelp, allowed, allowedHelp, ((defaultsTo)?.toList() ?? new Array(0).fill(null)), ((callback === null) ? null : function(value) { return (callback)(value); }), __dartConst("[\"instance\",\"class:OptionType\",[\"field\",\"field:OptionType.name\",[\"string\",\"OptionType.multiple\"]]]", () => Object.freeze(Object.assign(Object.create(OptionType.prototype), { name: "OptionType.multiple" }))), { splitCommas: splitCommas, hide: hide, aliases: aliases });
  }
  _addOption(name, abbr, help, valueHelp, allowed, allowedHelp, defaultsTo, callback, type, { negatable = false, splitCommas = null, mandatory = false, hide = false, hideNegatedUsage = false, aliases = __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) } = {}) {
    let allNames = (() => {
      const v = [name];
      (v.push(...Array.from(aliases)), null);
      return v;
    })();
    if (Array.from(allNames).some((name) => { return !((this.findByNameOrAlias(name) === null)); })) {
      {
        (() => { throw __dartCoreError("ArgumentError", "Duplicate option or alias \"" + __dartStr(name) + "\"."); })();
      }
    }
    if (!((abbr === null))) {
      {
        let existing = this.findByAbbreviation(abbr);
        if (!((existing === null))) {
          {
            (() => { throw __dartCoreError("ArgumentError", "Abbreviation \"" + __dartStr(abbr) + "\" is already used by \"" + __dartStr(existing.name) + "\"."); })();
          }
        }
      }
    }
    if ((mandatory && !((defaultsTo === null)))) {
      {
        (() => { throw __dartCoreError("ArgumentError", "The option " + __dartStr(name) + " cannot be mandatory and have a default value."); })();
      }
    }
    if ((!(negatable) && hideNegatedUsage)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "The option " + __dartStr(name) + " cannot have `hideNegatedUsage` " + "without being negatable."); })();
      }
    }
    let option = newOption(name, abbr, help, valueHelp, allowed, allowedHelp, defaultsTo, callback, type, { negatable: negatable, splitCommas: splitCommas, mandatory: mandatory, hide: hide, hideNegatedUsage: hideNegatedUsage, aliases: aliases });
    __dartMapSet(this._options, name, option);
    (this._optionsAndSeparators.push(option), null);
    {
      let _sync_for_iterator = __dartIterator(aliases);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let alias = _sync_for_iterator.current;
          {
            __dartMapSet(this._aliases, alias, name);
          }
        }
      }
    }
  }
  addSeparator(text) {
    (this._optionsAndSeparators.push(text), null);
  }
  parse(args) {
    return new Parser(null, this, Array.from(args)).parse();
  }
  get usage() {
    return generateUsage(this._optionsAndSeparators, { lineLength: this.usageLineLength });
  }
  defaultFor(option) {
    let value = this.findByNameOrAlias(option);
    if ((value === null)) {
      {
        (() => { throw __dartCoreError("ArgumentError", "No option named " + __dartStr(option)); })();
      }
    }
    return value.defaultsTo;
  }
  getDefault(option) {
    return this.defaultFor(option);
  }
  findByAbbreviation(abbr) {
    {
      let _sync_for_iterator = __dartIterator(Array.from(this.options.values()));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let option = _sync_for_iterator.current;
          {
            if (__dartEquals(option.abbr, abbr)) {
              return option;
            }
          }
        }
      }
    }
    return null;
  }
  findByNameOrAlias(name) {
    return __dartMapGet(this.options, (__dartMapGet(this._aliases, name) ?? name));
  }
}
Object.defineProperty(ArgParser, Symbol.hasInstance, { value(value) { return value != null && value[$ArgParser_interface] === true; } });

function $ArgParser__($newTarget, options, commands, _aliases, { allowTrailingOptions = true, usageLineLength = null } = {}) {
  const $self = Object.create($newTarget.prototype);
  $self._optionsAndSeparators = new Array(0).fill(null);
  Object.defineProperty($self, $ArgParser_interface, { value: true });
  $self._aliases = _aliases;
  $self.allowTrailingOptions = allowTrailingOptions;
  $self.usageLineLength = usageLineLength;
  $self._options = options;
  $self.options = __dartUnmodifiableMapView(options);
  $self._commands = commands;
  $self.commands = __dartUnmodifiableMapView(commands);
  return $self;
}

class AllowAnythingParser {
  constructor() {
    Object.defineProperty(this, $ArgParser_interface, { value: true });
  }
  get options() {
    return __dartConst("[\"map\",\"InterfaceType(String)\",\"InterfaceType(Option)\"]", () => __dartConstMap([]));
  }
  get commands() {
    return __dartConst("[\"map\",\"InterfaceType(String)\",\"InterfaceType(ArgParser)\"]", () => __dartConstMap([]));
  }
  get allowTrailingOptions() {
    return false;
  }
  get allowsAnything() {
    return true;
  }
  get usageLineLength() {
    return null;
  }
  addCommand(name, parser = null) {
    (() => { throw __dartCoreError("UnsupportedError", "ArgParser.allowAnything().addCommands() isn't supported."); })();
  }
  addFlag(name, { abbr = null, help = null, defaultsTo = false, negatable = true, callback = null, hide = false, hideNegatedUsage = false, aliases = __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) } = {}) {
    (() => { throw __dartCoreError("UnsupportedError", "ArgParser.allowAnything().addFlag() isn't supported."); })();
  }
  addOption(name, { abbr = null, help = null, valueHelp = null, allowed = null, allowedHelp = null, defaultsTo = null, callback = null, allowMultiple = false, splitCommas = null, mandatory = false, hide = false, aliases = __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) } = {}) {
    (() => { throw __dartCoreError("UnsupportedError", "ArgParser.allowAnything().addOption() isn't supported."); })();
  }
  addMultiOption(name, { abbr = null, help = null, valueHelp = null, allowed = null, allowedHelp = null, defaultsTo = null, callback = null, splitCommas = true, hide = false, aliases = __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) } = {}) {
    (() => { throw __dartCoreError("UnsupportedError", "ArgParser.allowAnything().addMultiOption() isn't supported."); })();
  }
  addSeparator(text) {
    (() => { throw __dartCoreError("UnsupportedError", "ArgParser.allowAnything().addSeparator() isn't supported."); })();
  }
  parse(args) {
    return new Parser(null, this, Array.from(args)).parse();
  }
  get usage() {
    return "";
  }
  defaultFor(option) {
    (() => { throw __dartCoreError("ArgumentError", "No option named " + __dartStr(option)); })();
  }
  getDefault(option) {
    (() => { throw __dartCoreError("ArgumentError", "No option named " + __dartStr(option)); })();
  }
  findByAbbreviation(abbr) {
    return null;
  }
  findByNameOrAlias(name) {
    return null;
  }
}

class _Usage {
  constructor(_optionsAndSeparators, lineLength) {
    this._buffer = __dartStringBuffer("");
    this._currentColumn = 0;
    const $_columnWidths = __dartLazyField("_Usage._columnWidths", () => this._calculateColumnWidths(), false);
    Object.defineProperty(this, "_columnWidths", {
      get() { return $_columnWidths.get(); },
      set(value) { $_columnWidths.set(value); },
      enumerable: true,
    });
    this._newlinesNeeded = 0;
    this._optionsAndSeparators = _optionsAndSeparators;
    this.lineLength = lineLength;
  }
  generate() {
    {
      let _sync_for_iterator = __dartIterator(this._optionsAndSeparators);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let optionOrSeparator = _sync_for_iterator.current;
          L:
          {
            if (typeof optionOrSeparator === "string") {
              {
                this._writeSeparator(optionOrSeparator);
                break L;
              }
            }
            let option = __dartAs(optionOrSeparator, value => value instanceof Option, "Option");
            if (option.hide) {
              break L;
            }
            this._writeOption(option);
          }
        }
      }
    }
    return __dartStr(this._buffer);
  }
  _writeSeparator(separator) {
    if (this._buffer.isNotEmpty) {
      this._buffer.write("\n\n");
    }
    this._buffer.write(separator);
    this._newlinesNeeded = 1;
  }
  _writeOption(option) {
    this._write(0, this._abbreviation(option));
    this._write(1, __dartStr(this._longOption(option)) + __dartStr(this._mandatoryOption(option)));
    {
      const _0_0 = option.help;
      {
        let help = null;
        if (!((_0_0 === null))) {
          {
            help = _0_0;
            this._write(2, help);
          }
        }
      }
    }
    {
      const _1_0 = option.allowedHelp;
      {
        let allowedHelp = null;
        if (!((_1_0 === null))) {
          {
            allowedHelp = _1_0;
            {
              this._newline();
              {
                let _sync_for_iterator = __dartIterator(Array.from(allowedHelp, ([key, value]) => ({ key, value })));
                for (; _sync_for_iterator.moveNext(); ) {
                  {
                    const v = _sync_for_iterator.current;
                    {
                      let name = null;
                      let content = null;
                      {
                        const _2_0 = v;
                        name = _2_0.key;
                        content = _2_0.value;
                      }
                      this._write(1, this._allowedTitle(option, name));
                      this._write(2, content);
                    }
                  }
                }
              }
              this._newline();
            }
          }
        } else {
          if (!((option.allowed === null))) {
            {
              this._write(2, this._buildAllowedList(option));
            }
          } else {
            if (option.isFlag) {
              {
                if (__dartEquals(option.defaultsTo, true)) {
                  {
                    this._write(2, "(defaults to on)");
                  }
                }
              }
            } else {
              if (option.isMultiple) {
                {
                  if ((!((option.defaultsTo === null)) && !__dartIterableIsEmpty(__dartAs(option.defaultsTo, value => value != null && typeof value !== "string" && !(value instanceof Map) && typeof value[Symbol.iterator] === "function", "Iterable<dynamic>")))) {
                    {
                      let defaults = __dartIterableJoin(Array.from(__dartAs(option.defaultsTo, value => (Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView))), "List<dynamic>"), function(value) { return "\"" + __dartStr(value) + "\""; }), ", ");
                      this._write(2, "(defaults to " + __dartStr(defaults) + ")");
                    }
                  }
                }
              } else {
                if (!((option.defaultsTo === null))) {
                  {
                    this._write(2, "(defaults to \"" + __dartStr(option.defaultsTo) + "\")");
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  _abbreviation(option) {
    return ((option.abbr === null) ? "" : "-" + __dartStr(option.abbr) + ", ");
  }
  _longOption(option) {
    let result = null;
    if ((__dartNullCheck(option.negatable) && !(__dartNullCheck(option.hideNegatedUsage)))) {
      {
        result = "--[no-]" + __dartStr(option.name);
      }
    } else {
      {
        result = "--" + __dartStr(option.name);
      }
    }
    if (!((option.valueHelp === null))) {
      result = (result + "=<" + __dartStr(option.valueHelp) + ">");
    }
    return result;
  }
  _mandatoryOption(option) {
    return (option.mandatory ? " (mandatory)" : "");
  }
  _allowedTitle(option, allowed) {
    let isDefault = ((Array.isArray(option.defaultsTo) || (ArrayBuffer.isView(option.defaultsTo) && !(option.defaultsTo instanceof DataView))) ? __dartIterableContains(__dartAs(option.defaultsTo, value => (Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView))), "List<dynamic>"), allowed) : __dartEquals(option.defaultsTo, allowed));
    return "      [" + __dartStr(allowed) + "]" + __dartStr((isDefault ? " (default)" : ""));
  }
  _calculateColumnWidths() {
    let abbr = 0;
    let title = 0;
    {
      let _sync_for_iterator = __dartIterator(this._optionsAndSeparators);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let option = _sync_for_iterator.current;
          L:
          {
            if (!(option instanceof Option)) {
              break L;
            }
            if (option.hide) {
              break L;
            }
            abbr = Math.max(abbr, this._abbreviation(option).length);
            title = Math.max(title, (this._longOption(option).length + this._mandatoryOption(option).length));
            if (!((option.allowedHelp === null))) {
              {
                {
                  let _sync_for_iterator_1 = __dartIterator(Array.from(__dartNullCheck(option.allowedHelp).keys()));
                  for (; _sync_for_iterator_1.moveNext(); ) {
                    {
                      let allowed = _sync_for_iterator_1.current;
                      {
                        title = Math.max(title, this._allowedTitle(option, allowed).length);
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
    title = (title + 4);
    return [abbr, title];
  }
  _newline() {
    this._newlinesNeeded = (this._newlinesNeeded + 1);
    this._currentColumn = 0;
  }
  _write(column, text) {
    let lines = text.split("\n");
    if ((__dartEquals(column, this._columnWidths.length) && !((this.lineLength === null)))) {
      {
        let start = Array.from(Array.from(this._columnWidths).slice(0, column)).reduce((previous, value) => (function(start, width) { return (start + width); })(previous, value));
        lines = (() => {
          const v = new Array(0).fill(null);
          {
            let _sync_for_iterator = __dartIterator(lines);
            for (; _sync_for_iterator.moveNext(); ) {
              {
                let line = _sync_for_iterator.current;
                (v.push(...Array.from(wrapTextAsLines(line, { start: start, length: this.lineLength }))), null);
              }
            }
          }
          return v;
        })();
      }
    }
    while ((lines.length !== 0 && __dartEquals(__dartIndexGet(lines, 0).trim(), ""))) {
      {
        lines.splice(0, 1)[0];
      }
    }
    while ((lines.length !== 0 && __dartEquals(__dartIndexGet(lines, lines.length - 1).trim(), ""))) {
      {
        lines.pop();
      }
    }
    {
      let _sync_for_iterator = __dartIterator(lines);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let line = _sync_for_iterator.current;
          {
            this._writeLine(column, line);
          }
        }
      }
    }
  }
  _writeLine(column, text) {
    while ((this._newlinesNeeded > 0)) {
      {
        this._buffer.write("\n");
        this._newlinesNeeded = (this._newlinesNeeded - 1);
      }
    }
    while (!(__dartEquals(this._currentColumn, column))) {
      {
        if ((this._currentColumn < (3 - 1))) {
          {
            this._buffer.write((" " * __dartIndexGet(this._columnWidths, this._currentColumn)));
          }
        } else {
          {
            this._buffer.write("\n");
          }
        }
        this._currentColumn = ((this._currentColumn + 1) % 3);
      }
    }
    if ((column < this._columnWidths.length)) {
      {
        this._buffer.write(text.padEnd(__dartIndexGet(this._columnWidths, column), " "));
      }
    } else {
      {
        this._buffer.write(text);
      }
    }
    this._currentColumn = ((this._currentColumn + 1) % 3);
    if (__dartEquals(column, (3 - 1))) {
      this._newlinesNeeded = (this._newlinesNeeded + 1);
    }
  }
  _buildAllowedList(option) {
    let isDefault = ((Array.isArray(option.defaultsTo) || (ArrayBuffer.isView(option.defaultsTo) && !(option.defaultsTo instanceof DataView))) ? __dartBind(__dartAs(option.defaultsTo, value => (Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView))), "List<dynamic>"), "contains") : function(value) { return __dartEquals(value, option.defaultsTo); });
    let allowedBuffer = __dartStringBuffer("");
    allowedBuffer.write("[");
    let first = true;
    {
      let _sync_for_iterator = __dartIterator(__dartNullCheck(option.allowed));
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let allowed = _sync_for_iterator.current;
          {
            if (!(first)) {
              allowedBuffer.write(", ");
            }
            allowedBuffer.write(allowed);
            if ((isDefault)(allowed)) {
              {
                allowedBuffer.write(" (default)");
              }
            }
            first = false;
          }
        }
      }
    }
    allowedBuffer.write("]");
    return __dartStr(allowedBuffer);
  }
}


const $Option__invalidChars = __dartLazyField("Option._invalidChars", () => __dartRegExp("[ \\t\\r\\n\"'\\\\/]", { caseSensitive: true, multiLine: false, unicode: false, dotAll: false }), false);
Object.defineProperty(Option, "_invalidChars", {
  get() { return $Option__invalidChars.get(); },
  set(value) { $Option__invalidChars.set(value); },
  enumerable: true,
});

Object.defineProperty(OptionType, "flag", { value: __dartConst("[\"instance\",\"class:OptionType\",[\"field\",\"field:OptionType.name\",[\"string\",\"OptionType.flag\"]]]", () => Object.freeze(Object.assign(Object.create(OptionType.prototype), { name: "OptionType.flag" }))), enumerable: true });

Object.defineProperty(OptionType, "single", { value: __dartConst("[\"instance\",\"class:OptionType\",[\"field\",\"field:OptionType.name\",[\"string\",\"OptionType.single\"]]]", () => Object.freeze(Object.assign(Object.create(OptionType.prototype), { name: "OptionType.single" }))), enumerable: true });

Object.defineProperty(OptionType, "multiple", { value: __dartConst("[\"instance\",\"class:OptionType\",[\"field\",\"field:OptionType.name\",[\"string\",\"OptionType.multiple\"]]]", () => Object.freeze(Object.assign(Object.create(OptionType.prototype), { name: "OptionType.multiple" }))), enumerable: true });

Object.defineProperty(_Usage, "_columnCount", { value: 3, enumerable: true });
function newArgResults(parser, parsed, name, command, rest, arguments_1) {
  return ArgResults._(parser, parsed, name, command, rest, arguments_1);
}

function newOption(name, abbr, help, valueHelp, allowed, allowedHelp, defaultsTo, callback, type, { negatable = null, splitCommas = null, mandatory = false, hide = false, hideNegatedUsage = false, aliases = __dartConst("[\"list\",\"InterfaceType(String)\"]", () => Object.freeze([])) } = {}) {
  return Option._(name, abbr, help, valueHelp, allowed, allowedHelp, defaultsTo, callback, type, { negatable: negatable, splitCommas: splitCommas, mandatory: mandatory, hide: hide, hideNegatedUsage: hideNegatedUsage, aliases: aliases });
}

function _isLetterOrDigit(codeUnit) {
  return ((((codeUnit >= 65) && (codeUnit <= 90)) || ((codeUnit >= 97) && (codeUnit <= 122))) || ((codeUnit >= 48) && (codeUnit <= 57)));
}

function _isLetterDigitHyphenOrUnderscore(codeUnit) {
  return ((_isLetterOrDigit(codeUnit) || __dartEquals(codeUnit, 45)) || __dartEquals(codeUnit, 95));
}

function padRight(source, length) {
  return (source + (" " * (length - source.length)));
}

function wrapText(text, { length = null, hangingIndent = null } = {}) {
  if ((length === null)) {
    return text;
  }
  ((hangingIndent === null) ? hangingIndent = 0 : null);
  let splitText = text.split("\n");
  let result = new Array(0).fill(null);
  {
    let _sync_for_iterator = __dartIterator(splitText);
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let line = _sync_for_iterator.current;
        {
          let trimmedText = line.trimStart();
          const leadingWhitespace = line.substring(0, (line.length - trimmedText.length));
          let notIndented = null;
          if (!(__dartEquals(hangingIndent, 0))) {
            {
              let firstLineWrap = wrapTextAsLines(trimmedText, { length: (length - leadingWhitespace.length) });
              notIndented = [firstLineWrap.splice(0, 1)[0]];
              trimmedText = trimmedText.substring(__dartIndexGet(notIndented, 0).length).trimStart();
              if (firstLineWrap.length !== 0) {
                {
                  (notIndented.push(...Array.from(wrapTextAsLines(trimmedText, { length: ((length - leadingWhitespace.length) - hangingIndent) }))), null);
                }
              }
            }
          } else {
            {
              notIndented = wrapTextAsLines(trimmedText, { length: (length - leadingWhitespace.length) });
            }
          }
          let hangingIndentString = null;
          (result.push(...Array.from(Array.from(notIndented, function(line) {
            if (line.length === 0) {
              return "";
            }
            let result = __dartStr((hangingIndentString ?? "")) + __dartStr(leadingWhitespace) + __dartStr(line);
            ((hangingIndentString === null) ? hangingIndentString = (" " * __dartNullCheck(hangingIndent)) : null);
            return result;
}))), null);
        }
      }
    }
  }
  return __dartIterableJoin(result, "\n");
}

function wrapTextAsLines(text, { start = 0, length = null } = {}) {
  function isWhitespace(text, index) {
    let rune = text.charCodeAt(index);
    return (((((((((((((rune >= 9) && (rune <= 13)) || __dartEquals(rune, 32)) || __dartEquals(rune, 133)) || __dartEquals(rune, 5760)) || __dartEquals(rune, 6158)) || ((rune >= 8192) && (rune <= 8202))) || __dartEquals(rune, 8232)) || __dartEquals(rune, 8233)) || __dartEquals(rune, 8239)) || __dartEquals(rune, 8287)) || __dartEquals(rune, 12288)) || __dartEquals(rune, 65279));
  }
  if ((length === null)) {
    return text.split("\n");
  }
  let result = new Array(0).fill(null);
  let effectiveLength = Math.max((length - start), 10);
  {
    let _sync_for_iterator = __dartIterator(text.split("\n"));
    for (; _sync_for_iterator.moveNext(); ) {
      {
        let line = _sync_for_iterator.current;
        L:
        {
          line = line.trim();
          if ((line.length <= effectiveLength)) {
            {
              (result.push(line), null);
              break L;
            }
          }
          let currentLineStart = 0;
          let lastWhitespace = null;
          for (let i = 0; (i < line.length); i = (i + 1)) {
            {
              if (isWhitespace(line, i)) {
                lastWhitespace = i;
              }
              if (((i - currentLineStart) >= effectiveLength)) {
                {
                  if (!((lastWhitespace === null))) {
                    i = lastWhitespace;
                  }
                  (result.push(line.substring(currentLineStart, i).trim()), null);
                  while ((isWhitespace(line, i) && (i < line.length))) {
                    {
                      i = (i + 1);
                    }
                  }
                  currentLineStart = i;
                  lastWhitespace = null;
                }
              }
            }
          }
          (result.push(line.substring(currentLineStart).trim()), null);
        }
      }
    }
  }
  return result;
}

function generateUsage(optionsAndSeparators, { lineLength = null } = {}) {
  return new _Usage(optionsAndSeparators, lineLength).generate();
}

export function main() {
  const command = (() => { let v = new ArgParser(); return (() => {
    v.addFlag("watch", { defaultsTo: true });
    v.addOption("host", { defaultsTo: "localhost" });
    return v;
  })(); })();
  const parser = (() => { let v_1 = new ArgParser({ allowTrailingOptions: false }); return (() => {
    v_1.addFlag("verbose", { abbr: "v", negatable: false });
    v_1.addOption("mode", { allowed: ["debug", "release"], defaultsTo: "debug" });
    v_1.addMultiOption("define", { abbr: "D" });
    v_1.addCommand("serve", command);
    return v_1;
  })(); })();
  const results = parser.parse(["--mode", "release", "-v", "-Dfoo=bar", "-D", "answer=42", "serve", "--no-watch", "--host", "0.0.0.0", "web"]);
  const subcommand = __dartNullCheck(results.command);
  __dartPrint("args " + __dartStr(results["[]"]("mode")) + " " + __dartStr(results["[]"]("verbose")) + " " + __dartStr(__dartIterableJoin(__dartAs(results["[]"]("define"), value => (Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView))), "List<String>"), "|")) + " " + __dartStr(subcommand.name) + " " + __dartStr(subcommand["[]"]("watch")) + " " + __dartStr(subcommand["[]"]("host")) + " " + __dartStr(__dartIterableJoin(subcommand.rest, ",")) + " " + __dartStr(results.wasParsed("mode")));
  try {
    {
      parser.parse(["--mode", "profile"]);
    }
  } catch ($error) {
    if (__dartIsCoreError($error, "FormatException")) {
      const error = $error;
      {
        __dartPrint("args-error " + __dartStr(__dartIterableFirst(error.message.split("\n"))));
      }
    } else {
      throw $error;
    }
  }
  __dartPrint("usage " + __dartStr(parser.usage.includes("--mode")) + " " + __dartStr(__dartIterableJoin(Array.from(parser.commands.keys()), ",")));
}

main();
