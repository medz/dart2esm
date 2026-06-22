import 'dart:async';

Future<void> main() async {
  final first = await Future<int>.value(1);
  final second = await Future<int>.sync(() => 2);
  final delayed = await Future<int>.delayed(
    const Duration(milliseconds: 1),
    () => 3,
  );
  final values = await Future.wait<int>([
    Future.value(first),
    Future.value(second),
    Future.value(delayed),
  ]);
  print('future ${values.join(',')}');

  try {
    await Future.error('boom');
  } catch (error) {
    print('caught $error');
  }
}
