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
function __dartListSort(list, compare = null) {
  if (typeof compare === "function") {
    list.sort((left, right) => compare(left, right));
  } else {
    list.sort((left, right) => left < right ? -1 : (left > right ? 1 : 0));
  }
  return null;
}
function __dartListSetAll(list, index, values) {
  let offset = 0;
  for (const value of values) {
    __dartIndexSet(list, index + offset, value);
    offset++;
  }
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
function __dartIterableJoin(iterable, separator = "") {
  if (iterable != null && typeof iterable["[]"] === "function" && typeof iterable.length === "number") {
    const values = [];
    for (let index = 0; index < iterable.length; index++) values.push(__dartStr(iterable["[]"](index)));
    return values.join(String(separator));
  }
  return Array.from(iterable, (value) => __dartStr(value)).join(String(separator));
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
  const equals = left["=="];
  return typeof equals === "function" ? equals.call(left, right) : false;
}
function __dartShr(left, right) {
  return Math.floor(left / (2 ** right));
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

const $QueueList_interface = Symbol("QueueList");

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
  join(separator = "") {
    if (__dartEquals(this.length, 0)) {
      return "";
    }
    let buffer = (() => { let v = __dartStringBuffer(""); return (() => {
      v.writeAll(this, separator);
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
    let split = (this._table.length - this._head);
    __dartListSetRange(newTable, 0, split, this._table, this._head);
    __dartListSetRange(newTable, split, (split + this._head), this._table, 0);
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
Object.defineProperty(QueueList, Symbol.hasInstance, { value(value) { return value != null && value[$QueueList_interface] === true; } });

function $QueueList__init($newTarget, initialCapacity) {
  const $self = Reflect.construct(_QueueList_Object_ListMixin, [], $newTarget);
  Object.defineProperty($self, $QueueList_interface, { value: true });
  $self._table = __dartFixedList(new Array(initialCapacity).fill(null));
  Object.defineProperty($self, "_head", {
    value: 0,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  Object.defineProperty($self, "_tail", {
    value: 0,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  return $self;
}

function $QueueList__($newTarget, _head, _tail, _table) {
  const $self = Reflect.construct(_QueueList_Object_ListMixin, [], $newTarget);
  Object.defineProperty($self, $QueueList_interface, { value: true });
  Object.defineProperty($self, "_head", {
    value: _head,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  Object.defineProperty($self, "_tail", {
    value: _tail,
    writable: true,
    configurable: true,
    enumerable: true,
  });
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

class TypedDataBuffer {
  constructor(buffer) {
    this._buffer = buffer;
    this._length = buffer.length;
  }
  get length() {
    return this._length;
  }
  "[]"(index) {
    if ((index >= this.length)) {
      (() => { throw __dartCoreError("IndexError", index); })();
    }
    return __dartIndexGet(this._buffer, index);
  }
  "[]="(index, value) {
    if ((index >= this.length)) {
      (() => { throw __dartCoreError("IndexError", index); })();
    }
    __dartIndexSet(this._buffer, index, value);
  }
  set length(newLength) {
    if ((newLength < this._length)) {
      {
        let defaultValue = this._defaultValue;
        for (let i = newLength; (i < this._length); i = (i + 1)) {
          {
            __dartIndexSet(this._buffer, i, defaultValue);
          }
        }
      }
    } else {
      if ((newLength > this._buffer.length)) {
        {
          let newBuffer = null;
          if (__dartIterableIsEmpty(this._buffer)) {
            {
              newBuffer = this._createBuffer(newLength);
            }
          } else {
            {
              newBuffer = this._createBiggerBuffer(newLength);
            }
          }
          __dartListSetRange(newBuffer, 0, this._length, this._buffer, 0);
          this._buffer = newBuffer;
        }
      }
    }
    this._length = newLength;
  }
  _add(value) {
    if (__dartEquals(this._length, this._buffer.length)) {
      this._grow(this._length);
    }
    __dartIndexSet(this._buffer, (() => { let v = this._length; return (() => { let v_1 = this._length = (v + 1); return v; })(); })(), value);
  }
  add(element) {
    this._add(element);
  }
  addAll(values, start = 0, end = null) {
    __dartCheckNotNegative(start, "start", null);
    if ((!((end === null)) && (start > end))) {
      {
        (() => { throw __dartCoreError("RangeError", end); })();
      }
    }
    this._addAll(values, start, end);
  }
  insertAll(index, values, start = 0, end = null) {
    __dartCheckValidIndex(index, this, "index", (this._length + 1), null);
    __dartCheckNotNegative(start, "start", null);
    if (!((end === null))) {
      {
        if ((start > end)) {
          {
            (() => { throw __dartCoreError("RangeError", end); })();
          }
        }
        if (__dartEquals(start, end)) {
          return;
        }
      }
    }
    if (__dartEquals(index, this._length)) {
      {
        this._addAll(values, start, end);
        return;
      }
    }
    if (((end === null) && (Array.isArray(values) || (ArrayBuffer.isView(values) && !(values instanceof DataView))))) {
      {
        end = __dartIterableLength(values);
      }
    }
    if (!((end === null))) {
      {
        this._insertKnownLength(index, values, start, end);
        return;
      }
    }
    let writeIndex = this._length;
    let skipCount = start;
    {
      let _sync_for_iterator = __dartIterator(values);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let value = _sync_for_iterator.current;
          L:
          {
            if ((skipCount > 0)) {
              {
                skipCount = (skipCount - 1);
                break L;
              }
            }
            if (__dartEquals(writeIndex, this._buffer.length)) {
              {
                this._grow(writeIndex);
              }
            }
            __dartIndexSet(this._buffer, (() => { let v = writeIndex; return (() => { let v_1 = writeIndex = (v + 1); return v; })(); })(), value);
          }
        }
      }
    }
    if ((skipCount > 0)) {
      {
        (() => { throw __dartCoreError("StateError", "Too few elements"); })();
      }
    }
    if ((!((end === null)) && (writeIndex < end))) {
      {
        (() => { throw __dartCoreError("RangeError", end); })();
      }
    }
    TypedDataBuffer._reverse(this._buffer, index, this._length);
    TypedDataBuffer._reverse(this._buffer, this._length, writeIndex);
    TypedDataBuffer._reverse(this._buffer, index, writeIndex);
    this._length = writeIndex;
    return;
  }
  static _reverse(buffer, start, end) {
    end = (end - 1);
    while ((start < end)) {
      {
        let first = __dartIndexGet(buffer, start);
        let last = __dartIndexGet(buffer, end);
        __dartIndexSet(buffer, end, first);
        __dartIndexSet(buffer, start, last);
        start = (start + 1);
        end = (end - 1);
      }
    }
  }
  _addAll(values, start = 0, end = null) {
    if ((Array.isArray(values) || (ArrayBuffer.isView(values) && !(values instanceof DataView)))) {
      ((end === null) ? end = __dartIterableLength(values) : null);
    }
    if (!((end === null))) {
      {
        this._insertKnownLength(this._length, values, start, end);
        return;
      }
    }
    let i = 0;
    {
      let _sync_for_iterator = __dartIterator(values);
      for (; _sync_for_iterator.moveNext(); ) {
        {
          let value = _sync_for_iterator.current;
          {
            if ((i >= start)) {
              this.add(value);
            }
            i = (i + 1);
          }
        }
      }
    }
    if ((i < start)) {
      (() => { throw __dartCoreError("StateError", "Too few elements"); })();
    }
  }
  _insertKnownLength(index, values, start, end) {
    if ((Array.isArray(values) || (ArrayBuffer.isView(values) && !(values instanceof DataView)))) {
      {
        if (((start > __dartIterableLength(values)) || (end > __dartIterableLength(values)))) {
          {
            (() => { throw __dartCoreError("StateError", "Too few elements"); })();
          }
        }
      }
    }
    let valuesLength = (end - start);
    let newLength = (this._length + valuesLength);
    this._ensureCapacity(newLength);
    __dartListSetRange(this._buffer, (index + valuesLength), (this._length + valuesLength), this._buffer, index);
    __dartListSetRange(this._buffer, index, (index + valuesLength), values, start);
    this._length = newLength;
  }
  insert(index, element) {
    if (((index < 0) || (index > this._length))) {
      {
        (() => { throw __dartCoreError("RangeError", index); })();
      }
    }
    if ((this._length < this._buffer.length)) {
      {
        __dartListSetRange(this._buffer, (index + 1), (this._length + 1), this._buffer, index);
        __dartIndexSet(this._buffer, index, element);
        this._length = (this._length + 1);
        return;
      }
    }
    let newBuffer = this._createBiggerBuffer(null);
    __dartListSetRange(newBuffer, 0, index, this._buffer, 0);
    __dartListSetRange(newBuffer, (index + 1), (this._length + 1), this._buffer, index);
    __dartIndexSet(newBuffer, index, element);
    this._length = (this._length + 1);
    this._buffer = newBuffer;
  }
  _ensureCapacity(requiredCapacity) {
    if ((requiredCapacity <= this._buffer.length)) {
      return;
    }
    let newBuffer = this._createBiggerBuffer(requiredCapacity);
    __dartListSetRange(newBuffer, 0, this._length, this._buffer, 0);
    this._buffer = newBuffer;
  }
  _createBiggerBuffer(requiredCapacity) {
    let newLength = (this._buffer.length * 2);
    if ((!((requiredCapacity === null)) && (newLength < requiredCapacity))) {
      {
        newLength = requiredCapacity;
      }
    } else {
      if ((newLength < 8)) {
        {
          newLength = 8;
        }
      }
    }
    return this._createBuffer(newLength);
  }
  _grow(length) {
    this._buffer = (() => { let v = this._createBiggerBuffer(null); return (() => {
      __dartListSetRange(v, 0, length, this._buffer, 0);
      return v;
    })(); })();
  }
  setRange(start, end, iterable, skipCount = 0) {
    if ((end > this._length)) {
      (() => { throw __dartCoreError("RangeError", end); })();
    }
    this._setRange(start, end, iterable, skipCount);
  }
  _setRange(start, end, source, skipCount) {
    if (source instanceof TypedDataBuffer) {
      {
        __dartListSetRange(this._buffer, start, end, source._buffer, skipCount);
      }
    } else {
      {
        __dartListSetRange(this._buffer, start, end, source, skipCount);
      }
    }
  }
  get elementSizeInBytes() {
    return (this._buffer instanceof DataView ? 1 : this._buffer.BYTES_PER_ELEMENT);
  }
  get lengthInBytes() {
    return (this._length * (this._buffer instanceof DataView ? 1 : this._buffer.BYTES_PER_ELEMENT));
  }
  get offsetInBytes() {
    return this._buffer.byteOffset;
  }
  get buffer() {
    return this._buffer.buffer;
  }
  get _defaultValue() {
    throw new TypeError("Abstract member TypedDataBuffer._defaultValue");
  }
  set _defaultValue(value) {
    Object.defineProperty(this, "_defaultValue", { value, writable: true, configurable: true, enumerable: true });
  }
  _createBuffer(size) {
    throw new TypeError("Abstract member TypedDataBuffer._createBuffer");
  }
}

class _IntBuffer extends TypedDataBuffer {
  constructor(buffer) {
    super(buffer);
  }
  get _defaultValue() {
    return 0;
  }
}

class _FloatBuffer extends TypedDataBuffer {
  constructor(buffer) {
    super(buffer);
  }
  get _defaultValue() {
    return 0.0;
  }
}

class Uint8Buffer extends _IntBuffer {
  constructor(initialLength = 0) {
    super(new Uint8Array(initialLength));
  }
  _createBuffer(size) {
    return new Uint8Array(size);
  }
}

class Float64Buffer extends _FloatBuffer {
  constructor(initialLength = 0) {
    super(new Float64Array(initialLength));
  }
  _createBuffer(size) {
    return new Float64Array(size);
  }
}

class __TypedQueue_Object_ListMixin {
  constructor() {
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
  cast() {
    return Array.from(this, (value) => __dartAs(value, (value) => true, "TypeParameterType(__TypedQueue&Object&ListMixin.cast.R%)"));
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
  add(element) {
    __dartIndexSet(this, (() => { let v = this.length; return (() => { let v_1 = this.length = (v + 1); return v; })(); })(), element);
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
  fillRange(start, end, fill = null) {
    let value = (fill ?? (v ?? __dartAs(v_1, value => true, "E")));
    __dartCheckValidRange(start, end, this.length, null, null, null);
    for (let i = start; (i < end); i = (i + 1)) {
      {
        __dartIndexSet(this, i, value);
      }
    }
  }
  sublist(start, end = null) {
    let listLength = this.length;
    ((end === null) ? end = listLength : null);
    __dartCheckValidRange(start, end, listLength, null, null, null);
    return Array.from(this.slice(start, end));
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
  join(separator = "") {
    if (__dartEquals(this.length, 0)) {
      return "";
    }
    let buffer = (() => { let v = __dartStringBuffer(""); return (() => {
      v.writeAll(this, separator);
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
  toSet() {
    let result = new Set();
    for (let i = 0; (i < this.length); i = (i + 1)) {
      {
        __dartSetAdd(result, __dartIndexGet(this, i));
      }
    }
    return result;
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
  getRange(start, end) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    return Array.from(this).slice(start, end ?? undefined);
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

class _TypedQueue extends __TypedQueue_Object_ListMixin {
  constructor(_table) {
    super();
    Object.defineProperty(this, "_table", {
      value: _table,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    Object.defineProperty(this, "_head", {
      value: 0,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    Object.defineProperty(this, "_tail", {
      value: 0,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
  get length() {
    return ((this._tail - this._head) & (this._table.length - 1));
  }
  toList({ growable = true } = {}) {
    let list = (growable ? this._createBuffer(this.length) : this._createList(this.length));
    this._writeToList(list);
    return list;
  }
  cast() {
    if (this instanceof QueueList) {
      return __dartAs(this, value => value instanceof QueueList, "QueueList<_TypedQueue.cast.T%>");
    }
    (() => { throw __dartCoreError("UnsupportedError", __dartStr(this) + " cannot be cast to the desired type."); })();
  }
  retype() {
    return this.cast();
  }
  addLast(value) {
    __dartIndexSet(this._table, this._tail, value);
    this._tail = ((this._tail + 1) & (this._table.length - 1));
    if (__dartEquals(this._head, this._tail)) {
      this._growAtCapacity();
    }
  }
  addFirst(value) {
    this._head = ((this._head - 1) & (this._table.length - 1));
    __dartIndexSet(this._table, this._head, value);
    if (__dartEquals(this._head, this._tail)) {
      this._growAtCapacity();
    }
  }
  removeFirst() {
    if (__dartEquals(this._head, this._tail)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    let result = __dartIndexGet(this._table, this._head);
    this._head = ((this._head + 1) & (this._table.length - 1));
    return result;
  }
  removeLast() {
    if (__dartEquals(this._head, this._tail)) {
      (() => { throw __dartCoreError("StateError", "No element"); })();
    }
    this._tail = ((this._tail - 1) & (this._table.length - 1));
    return __dartIndexGet(this._table, this._tail);
  }
  add(value) {
    return this.addLast(value);
  }
  set length(value) {
    __dartCheckNotNegative(value, "length", null);
    let delta = (value - this.length);
    if ((delta >= 0)) {
      {
        let needsToGrow = (this._table.length <= value);
        if (needsToGrow) {
          this._growTo(value);
        }
        this._tail = ((this._tail + delta) & (this._table.length - 1));
        if (!(needsToGrow)) {
          this.fillRange((value - delta), value, this._defaultValue);
        }
      }
    } else {
      {
        this.removeRange(value, this.length);
      }
    }
  }
  "[]"(index) {
    __dartCheckValidIndex(index, this, null, this.length, null);
    return __dartIndexGet(this._table, ((this._head + index) & (this._table.length - 1)));
  }
  "[]="(index, value) {
    __dartCheckValidIndex(index, this, null, null, null);
    __dartIndexSet(this._table, ((this._head + index) & (this._table.length - 1)), value);
  }
  removeRange(start, end) {
    let length = this.length;
    __dartCheckValidRange(start, end, length, null, null, null);
    if (__dartEquals(start, 0)) {
      {
        this._head = ((this._head + end) & (this._table.length - 1));
        return;
      }
    }
    let elementsAfter = (length - end);
    if (__dartEquals(elementsAfter, 0)) {
      {
        this._tail = ((this._head + start) & (this._table.length - 1));
        return;
      }
    }
    let removedElements = (end - start);
    if ((start < elementsAfter)) {
      {
        this.setRange(removedElements, end, this);
        this._head = ((this._head + removedElements) & (this._table.length - 1));
      }
    } else {
      {
        this.setRange(start, (length - removedElements), this, end);
        this._tail = ((this._tail - removedElements) & (this._table.length - 1));
      }
    }
  }
  setRange(start, end, iterable, skipCount = 0) {
    __dartCheckValidRange(start, end, this.length, null, null, null);
    if (__dartEquals(start, end)) {
      return;
    }
    let targetStart = ((this._head + start) & (this._table.length - 1));
    let targetEnd = ((this._head + end) & (this._table.length - 1));
    let targetIsContiguous = (targetStart < targetEnd);
    if (Object.is(iterable, this)) {
      {
        let sourceStart = ((this._head + skipCount) & (this._table.length - 1));
        let sourceEnd = ((sourceStart + (end - start)) & (this._table.length - 1));
        if (__dartEquals(sourceStart, targetStart)) {
          return;
        }
        let sourceIsContiguous = (sourceStart < sourceEnd);
        if ((targetIsContiguous && sourceIsContiguous)) {
          {
            __dartListSetRange(this._table, targetStart, targetEnd, this._table, sourceStart);
          }
        } else {
          if ((!(targetIsContiguous) && !(sourceIsContiguous))) {
            {
              if ((sourceStart > targetStart)) {
                {
                  let startGap = (sourceStart - targetStart);
                  let firstEnd = (this._table.length - startGap);
                  __dartListSetRange(this._table, targetStart, firstEnd, this._table, sourceStart);
                  __dartListSetRange(this._table, firstEnd, this._table.length, this._table, 0);
                  __dartListSetRange(this._table, 0, targetEnd, this._table, startGap);
                }
              } else {
                if ((sourceEnd < targetEnd)) {
                  {
                    let firstStart = (targetEnd - sourceEnd);
                    __dartListSetRange(this._table, firstStart, targetEnd, this._table, 0);
                    __dartListSetRange(this._table, 0, firstStart, this._table, (this._table.length - firstStart));
                    __dartListSetRange(this._table, targetStart, this._table.length, this._table, sourceStart);
                  }
                }
              }
            }
          } else {
            if ((sourceStart < targetEnd)) {
              {
                if (sourceIsContiguous) {
                  {
                    __dartListSetRange(this._table, targetStart, this._table.length, this._table, sourceStart);
                    __dartListSetRange(this._table, 0, targetEnd, this._table, (sourceStart + (this._table.length - targetStart)));
                  }
                } else {
                  {
                    let firstEnd_1 = (this._table.length - sourceStart);
                    __dartListSetRange(this._table, targetStart, firstEnd_1, this._table, sourceStart);
                    __dartListSetRange(this._table, firstEnd_1, targetEnd, this._table, 0);
                  }
                }
              }
            } else {
              {
                if (sourceIsContiguous) {
                  {
                    __dartListSetRange(this._table, 0, targetEnd, this._table, (sourceStart + (this._table.length - targetStart)));
                    __dartListSetRange(this._table, targetStart, this._table.length, this._table, sourceStart);
                  }
                } else {
                  {
                    let firstStart_1 = (targetEnd - sourceEnd);
                    __dartListSetRange(this._table, firstStart_1, targetEnd, this._table, 0);
                    __dartListSetRange(this._table, targetStart, firstStart_1, this._table, sourceStart);
                  }
                }
              }
            }
          }
        }
      }
    } else {
      if (targetIsContiguous) {
        {
          __dartListSetRange(this._table, targetStart, targetEnd, iterable, skipCount);
        }
      } else {
        if ((Array.isArray(iterable) || (ArrayBuffer.isView(iterable) && !(iterable instanceof DataView)))) {
          {
            __dartListSetRange(this._table, targetStart, this._table.length, iterable, skipCount);
            __dartListSetRange(this._table, 0, targetEnd, iterable, (skipCount + (this._table.length - targetStart)));
          }
        } else {
          {
            super.setRange(start, end, iterable, skipCount);
          }
        }
      }
    }
  }
  fillRange(start, end, value = null) {
    let startInTable = ((this._head + start) & (this._table.length - 1));
    let endInTable = ((this._head + end) & (this._table.length - 1));
    if ((startInTable <= endInTable)) {
      {
        (this._table.fill(value, startInTable, endInTable), null);
      }
    } else {
      {
        (this._table.fill(value, startInTable, this._table.length), null);
        (this._table.fill(value, 0, endInTable), null);
      }
    }
  }
  sublist(start, end = null) {
    let length = this.length;
    let nonNullEnd = __dartCheckValidRange(start, end, length, null, null, null);
    let list = this._createList((nonNullEnd - start));
    this._writeToList(list, start, nonNullEnd);
    return list;
  }
  _writeToList(target, start = null, end = null) {
    ((start === null) ? start = 0 : null);
    ((end === null) ? end = this.length : null);
    let elementsToWrite = (end - start);
    let startInTable = ((this._head + start) & (this._table.length - 1));
    let endInTable = ((this._head + end) & (this._table.length - 1));
    if ((startInTable <= endInTable)) {
      {
        __dartListSetRange(target, 0, elementsToWrite, this._table, startInTable);
      }
    } else {
      {
        let firstPartSize = (this._table.length - startInTable);
        __dartListSetRange(target, 0, firstPartSize, this._table, startInTable);
        __dartListSetRange(target, firstPartSize, (firstPartSize + endInTable), this._table, 0);
      }
    }
    return elementsToWrite;
  }
  _growAtCapacity() {
    let newTable = this._createList((this._table.length * 2));
    let partitionPoint = (this._table.length - this._head);
    __dartListSetRange(newTable, 0, partitionPoint, this._table, this._head);
    if (!(__dartEquals(partitionPoint, this._table.length))) {
      {
        __dartListSetRange(newTable, partitionPoint, this._table.length, this._table, 0);
      }
    }
    this._head = 0;
    this._tail = this._table.length;
    this._table = newTable;
  }
  _growTo(newElementCount) {
    newElementCount = (newElementCount + __dartShr(newElementCount, 1));
    let newTable = this._createList(_nextPowerOf2(newElementCount));
    this._tail = this._writeToList(newTable);
    this._table = newTable;
    this._head = 0;
  }
  _createList(size) {
    throw new TypeError("Abstract member _TypedQueue._createList");
  }
  _createBuffer(size) {
    throw new TypeError("Abstract member _TypedQueue._createBuffer");
  }
  get _defaultValue() {
    throw new TypeError("Abstract member _TypedQueue._defaultValue");
  }
  set _defaultValue(value) {
    Object.defineProperty(this, "_defaultValue", { value, writable: true, configurable: true, enumerable: true });
  }
}

class _IntQueue extends _TypedQueue {
  constructor(queue) {
    super(queue);
  }
  get _defaultValue() {
    return 0;
  }
}

class Uint8Queue extends _IntQueue {
  constructor(initialCapacity = null) {
    super(new Uint8Array(_chooseRealInitialCapacity(initialCapacity)));
    Object.defineProperty(this, $QueueList_interface, { value: true });
  }
  static fromList(elements) {
    return (() => { let v = new Uint8Queue(elements.length); return (() => {
      v.addAll(elements);
      return v;
    })(); })();
  }
  _createList(size) {
    return new Uint8Array(size);
  }
  _createBuffer(size) {
    return new Uint8Buffer(size);
  }
}


Object.defineProperty(QueueList, "_initialCapacity", { value: 8, enumerable: true });

Object.defineProperty(TypedDataBuffer, "_initialLength", { value: 8, enumerable: true });
function _chooseRealInitialCapacity(initialCapacity) {
  if (((initialCapacity === null) || (initialCapacity < 16))) {
    {
      return 16;
    }
  } else {
    if (!(_isPowerOf2(initialCapacity))) {
      {
        return _nextPowerOf2(initialCapacity);
      }
    } else {
      {
        return initialCapacity;
      }
    }
  }
}

function _isPowerOf2(number) {
  return __dartEquals((number & (number - 1)), 0);
}

function _nextPowerOf2(number) {
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

export function main() {
  const buffer = (() => { let v = new Uint8Buffer(); return (() => {
    v.add(1);
    v.addAll([2, 3, 4]);
    return v;
  })(); })();
  __dartIndexSet(buffer, 1, 9);
  const bytes = Uint8Array.from(buffer);
  const queue = Uint8Queue.fromList([10, 11]);
  queue.add(12);
  const first = queue.removeFirst();
  queue.addFirst(8);
  const last = queue.removeLast();
  const floats = (() => { let v_1 = new Float64Buffer(); return (() => {
    v_1.add(1.5);
    v_1.add(2.25);
    return v_1;
  })(); })();
  __dartPrint("typed_data " + __dartStr(__dartIterableJoin(buffer, ",")) + " " + __dartStr(first) + " " + __dartStr(last) + " " + __dartStr(__dartIterableJoin(queue, "|")) + " " + __dartStr((__dartIndexGet(floats, 0) + __dartIndexGet(floats, 1))) + " " + __dartStr(bytes.length));
}

main();
