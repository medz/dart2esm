import 'dart:async';

Future<void> main() async {
  final duration = Duration(
    days: 1,
    hours: 2,
    minutes: 3,
    seconds: 4,
    milliseconds: 5,
    microseconds: 6,
  );
  print('duration ${duration.inMilliseconds} ${duration.inSeconds}');

  final short = Duration(milliseconds: 1);
  final longer = Duration(milliseconds: 2, microseconds: 3);
  final sum = short + longer;
  final difference = longer - short;
  final scaled = short * 2.5;
  final divided = longer ~/ 2;
  final negated = -short;
  print(
    'durationOps ${sum.inMicroseconds} ${difference.inMicroseconds} '
    '${scaled.inMicroseconds} ${divided.inMicroseconds} '
    '${negated.abs().inMicroseconds} ${negated.isNegative}',
  );
  print(
    'durationCompare ${short < longer} ${short <= longer} '
    '${longer > short} ${longer >= short} ${short.compareTo(longer)}',
  );
  print('durationEquals ${short == Duration(milliseconds: 1)}');

  final utc = DateTime.utc(2026, 1, 2, 3, 4, 5, 6, 7);
  print(
    'utc ${utc.year}-${utc.month}-${utc.day} ${utc.hour}:${utc.minute}:${utc.second} ${utc.millisecond} ${utc.microsecond} ${utc.isUtc}',
  );
  print(
    'utcMeta ${utc.weekday} ${utc.timeZoneName} '
    '${utc.timeZoneOffset.inMinutes}',
  );

  final epoch = DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
  print('epoch ${epoch.toIso8601String()} ${epoch.millisecondsSinceEpoch}');

  final epochMicros = DateTime.fromMicrosecondsSinceEpoch(1007, isUtc: true);
  print(
    'epochMicros ${epochMicros.toIso8601String()} '
    '${epochMicros.millisecondsSinceEpoch} '
    '${epochMicros.microsecondsSinceEpoch} ${epochMicros.microsecond}',
  );

  final epochMicrosNegative = DateTime.fromMicrosecondsSinceEpoch(
    -1,
    isUtc: true,
  );
  print(
    'epochMicrosNegative ${epochMicrosNegative.toIso8601String()} '
    '${epochMicrosNegative.millisecondsSinceEpoch} '
    '${epochMicrosNegative.microsecondsSinceEpoch} '
    '${epochMicrosNegative.microsecond}',
  );

  final now = DateTime.now();
  final timestamp = DateTime.timestamp();
  print('now ${now.millisecondsSinceEpoch > 0} ${now.isUtc}');
  print('timestamp ${timestamp.millisecondsSinceEpoch > 0} ${timestamp.isUtc}');

  final shifted = epoch.add(const Duration(milliseconds: 1, microseconds: 2));
  final shiftedBack = shifted.subtract(const Duration(microseconds: 2));
  final delta = shifted.difference(epoch);
  print(
    'dateOps ${shifted.toIso8601String()} '
    '${shiftedBack.microsecondsSinceEpoch} ${delta.inMicroseconds}',
  );
  print(
    'dateCompare ${epoch.isBefore(shifted)} ${shifted.isAfter(epoch)} '
    '${epoch.isAtSameMomentAs(DateTime.fromMillisecondsSinceEpoch(0, isUtc: true))} '
    '${shifted.compareTo(epoch)} ${epoch.compareTo(shifted)}',
  );
  print(
    'dateEquals ${epoch == DateTime.fromMicrosecondsSinceEpoch(0, isUtc: true)}',
  );

  final copied = utc.copyWith(year: 2027, minute: 9);
  print('dateCopy ${copied.toUtc().toIso8601String()} ${copied.isUtc}');

  final parsed = DateTime.parse('2026-01-02T03:04:05.006Z');
  print('parsed ${parsed.toUtc().toIso8601String()}');

  final parsedMicros = DateTime.parse('2026-01-02T03:04:05.006007Z');
  print(
    'parsedMicros ${parsedMicros.toUtc().toIso8601String()} '
    '${parsedMicros.microsecondsSinceEpoch} ${parsedMicros.microsecond}',
  );

  final tryParsed = DateTime.tryParse('2026-01-02T03:04:05.006Z');
  final tryInvalid = DateTime.tryParse('not a date');
  print(
    'tryParsed ${tryParsed!.toUtc().toIso8601String()} ${tryInvalid == null}',
  );
  try {
    DateTime.parse('not a date');
  } on FormatException {
    print('parseError true');
  }

  final watch = Stopwatch();
  print('watch-start ${watch.isRunning} ${watch.elapsedMicroseconds}');
  watch.start();
  await Future<void>.delayed(const Duration(milliseconds: 1));
  watch.stop();
  print('watch-stop ${watch.isRunning} ${watch.elapsedMicroseconds > 0}');
  watch.reset();
  print('watch-reset ${watch.elapsedMicroseconds}');
}
