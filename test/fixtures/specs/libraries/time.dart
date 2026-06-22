void main() {
  final duration = Duration(
    days: 1,
    hours: 2,
    minutes: 3,
    seconds: 4,
    milliseconds: 5,
    microseconds: 6,
  );
  print('duration ${duration.inMilliseconds} ${duration.inSeconds}');

  final utc = DateTime.utc(2026, 1, 2, 3, 4, 5, 6, 7);
  print(
    'utc ${utc.year}-${utc.month}-${utc.day} ${utc.hour}:${utc.minute}:${utc.second} ${utc.millisecond} ${utc.microsecond} ${utc.isUtc}',
  );

  final epoch = DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
  print('epoch ${epoch.toIso8601String()} ${epoch.millisecondsSinceEpoch}');

  final parsed = DateTime.parse('2026-01-02T03:04:05.006Z');
  print('parsed ${parsed.toUtc().toIso8601String()}');
}
