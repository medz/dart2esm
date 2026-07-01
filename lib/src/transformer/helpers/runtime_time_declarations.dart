part of 'runtime_helpers.dart';

extension _Timehelperdeclaration on EsmRuntimeHelperRegistry {
  EsmModuleItem _timeHelperDeclaration(EsmRuntimeHelper helper) {
    return switch (helper) {
      EsmRuntimeHelper.dateTime => EsmRawModuleItem(r'''
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
'''),
      EsmRuntimeHelper.duration => EsmRawModuleItem('''
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
'''),
      _ => throw StateError('Unexpected runtime helper declaration: $helper'),
    };
  }
}
