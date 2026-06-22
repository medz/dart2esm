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
function __dartDuration(options = {}) {
  const micros = Math.trunc((options.days ?? 0) * 86400000000 + (options.hours ?? 0) * 3600000000 + (options.minutes ?? 0) * 60000000 + (options.seconds ?? 0) * 1000000 + (options.milliseconds ?? 0) * 1000 + (options.microseconds ?? 0));
  return {
    get inDays() { return Math.trunc(micros / 86400000000); },
    get inHours() { return Math.trunc(micros / 3600000000); },
    get inMinutes() { return Math.trunc(micros / 60000000); },
    get inSeconds() { return Math.trunc(micros / 1000000); },
    get inMilliseconds() { return Math.trunc(micros / 1000); },
    get inMicroseconds() { return micros; },
    toString() { return String(micros) + "us"; },
  };
}
function __dartDateTimeFromParts(isUtc, year, month = 1, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0, microsecond = 0) {
  const millis = isUtc ? Date.UTC(year, month - 1, day, hour, minute, second, millisecond) : new Date(year, month - 1, day, hour, minute, second, millisecond).getTime();
  return __dartDateTime(millis, isUtc, microsecond);
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
    get isUtc() { return isUtc; },
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
function __dartDateTimeParse(source) {
  const text = String(source);
  const millis = Date.parse(text);
  const isUtc = /(?:z|[+-]\d\d(?::?\d\d)?)$/i.test(text);
  const fraction = /\.(\d+)/.exec(text);
  const microsecond = fraction == null ? 0 : Number((fraction[1] + "000000").slice(0, 6).slice(3));
  return __dartDateTime(millis, isUtc, microsecond);
}
function __dartStopwatchNowMicros() {
  const now = globalThis.performance && typeof globalThis.performance.now === "function" ? globalThis.performance.now() : Date.now();
  return Math.trunc(now * 1000);
}
function __dartStopwatch() {
  let start = 0;
  let stop = 0;
  const watch = {
    get frequency() { return 1000000; },
    get elapsedTicks() { return (stop ?? __dartStopwatchNowMicros()) - start; },
    get elapsedMicroseconds() { return this.elapsedTicks; },
    get elapsedMilliseconds() { return Math.trunc(this.elapsedMicroseconds / 1000); },
    get elapsed() { return __dartDuration({ microseconds: this.elapsedMicroseconds }); },
    get isRunning() { return stop == null; },
    start() {
      if (stop != null) {
        start += __dartStopwatchNowMicros() - stop;
        stop = null;
      }
      return null;
    },
    stop() {
      if (stop == null) stop = __dartStopwatchNowMicros();
      return null;
    },
    reset() {
      start = stop ?? __dartStopwatchNowMicros();
      return null;
    },
  };
  return watch;
}
const __dartConstValues = new Map();
function __dartConst(key, create) {
  if (!__dartConstValues.has(key)) {
    __dartConstValues.set(key, create());
  }
  return __dartConstValues.get(key);
}

// Generated by dart2esm.

export async function main() {
  const duration = __dartDuration({ days: 1, hours: 2, minutes: 3, seconds: 4, milliseconds: 5, microseconds: 6 });
  __dartPrint("duration " + __dartStr(duration.inMilliseconds) + " " + __dartStr(duration.inSeconds));
  const utc = __dartDateTimeFromParts(true, 2026, 1, 2, 3, 4, 5, 6, 7);
  __dartPrint("utc " + __dartStr(utc.year) + "-" + __dartStr(utc.month) + "-" + __dartStr(utc.day) + " " + __dartStr(utc.hour) + ":" + __dartStr(utc.minute) + ":" + __dartStr(utc.second) + " " + __dartStr(utc.millisecond) + " " + __dartStr(utc.microsecond) + " " + __dartStr(utc.isUtc));
  const epoch = __dartDateTime(0, true);
  __dartPrint("epoch " + __dartStr(epoch.toIso8601String()) + " " + __dartStr(epoch.millisecondsSinceEpoch));
  const epochMicros = __dartDateTimeFromMicros(1007, true);
  __dartPrint("epochMicros " + __dartStr(epochMicros.toIso8601String()) + " " + __dartStr(epochMicros.millisecondsSinceEpoch) + " " + __dartStr(epochMicros.microsecondsSinceEpoch) + " " + __dartStr(epochMicros.microsecond));
  const epochMicrosNegative = __dartDateTimeFromMicros((-1), true);
  __dartPrint("epochMicrosNegative " + __dartStr(epochMicrosNegative.toIso8601String()) + " " + __dartStr(epochMicrosNegative.millisecondsSinceEpoch) + " " + __dartStr(epochMicrosNegative.microsecondsSinceEpoch) + " " + __dartStr(epochMicrosNegative.microsecond));
  const now = __dartDateTime(Date.now(), false);
  const timestamp = __dartDateTime(Date.now(), true);
  __dartPrint("now " + __dartStr((now.millisecondsSinceEpoch > 0)) + " " + __dartStr(now.isUtc));
  __dartPrint("timestamp " + __dartStr((timestamp.millisecondsSinceEpoch > 0)) + " " + __dartStr(timestamp.isUtc));
  const shifted = epoch.add(__dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"1002\"]]]", () => __dartDuration({ microseconds: 1002 })));
  const shiftedBack = shifted.subtract(__dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"2\"]]]", () => __dartDuration({ microseconds: 2 })));
  const delta = shifted.difference(epoch);
  __dartPrint("dateOps " + __dartStr(shifted.toIso8601String()) + " " + __dartStr(shiftedBack.microsecondsSinceEpoch) + " " + __dartStr(delta.inMicroseconds));
  __dartPrint("dateCompare " + __dartStr(epoch.isBefore(shifted)) + " " + __dartStr(shifted.isAfter(epoch)) + " " + __dartStr(epoch.isAtSameMomentAs(__dartDateTime(0, true))) + " " + __dartStr(shifted.compareTo(epoch)) + " " + __dartStr(epoch.compareTo(shifted)));
  __dartPrint("dateEquals " + __dartStr((() => { const $left_1 = epoch; const $right_1 = __dartDateTimeFromMicros(0, true); return $left_1 === null ? $right_1 === null : $left_1["=="]($right_1); })()));
  const parsed = __dartDateTimeParse("2026-01-02T03:04:05.006Z");
  __dartPrint("parsed " + __dartStr(parsed.toUtc().toIso8601String()));
  const parsedMicros = __dartDateTimeParse("2026-01-02T03:04:05.006007Z");
  __dartPrint("parsedMicros " + __dartStr(parsedMicros.toUtc().toIso8601String()) + " " + __dartStr(parsedMicros.microsecondsSinceEpoch) + " " + __dartStr(parsedMicros.microsecond));
  const watch = __dartStopwatch();
  __dartPrint("watch-start " + __dartStr(watch.isRunning) + " " + __dartStr(watch.elapsedMicroseconds));
  watch.start();
  await new Promise((resolve, reject) => setTimeout(() => { try { resolve(null); } catch (error) { reject(error); } }, Math.max(0, __dartConst("[\"instance\",\"dart:core::Duration\",[\"field\",\"dart:core::Duration::@fields::dart:core::_duration\",[\"int\",\"1000\"]]]", () => __dartDuration({ microseconds: 1000 })).inMilliseconds)));
  watch.stop();
  __dartPrint("watch-stop " + __dartStr(watch.isRunning) + " " + __dartStr((watch.elapsedMicroseconds > 0)));
  watch.reset();
  __dartPrint("watch-reset " + __dartStr(watch.elapsedMicroseconds));
}

await main();
