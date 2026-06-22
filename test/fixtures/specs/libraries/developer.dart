import 'dart:developer' as developer;

String trace(Object? value) {
  developer.log('not printed', name: 'dart2esm');
  final inspected = developer.inspect(value);
  final timed = developer.Timeline.timeSync(
    'compute',
    () => 'timed:$inspected',
  );
  developer.Timeline.startSync('ignored');
  developer.Timeline.finishSync();
  developer.postEvent('dart2esm.event', {'value': inspected});
  final stopped = developer.debugger(when: false, message: 'skip');
  Object timestamp = developer.Timeline.now;
  return '$timed $stopped ${timestamp is int}';
}

void main() {
  print(trace('value'));
}
