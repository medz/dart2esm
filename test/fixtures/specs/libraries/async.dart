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

  final microtask = await Future<int>.microtask(() => 4);
  final any = await Future.any<int>([
    Future<int>.delayed(const Duration(milliseconds: 5), () => 99),
    Future<int>.value(5),
  ]);
  print('more $microtask $any');

  final completer = Completer<int>();
  Future.microtask(() => completer.complete(6));
  print('complete ${await completer.future} ${completer.isCompleted}');

  final syncCompleter = Completer<String>.sync();
  syncCompleter.complete('ok');
  print('sync ${await syncCompleter.future}');

  final failed = Completer<void>();
  failed.completeError('broken');
  try {
    await failed.future;
  } catch (error) {
    print('completeError $error');
  }

  try {
    await Future.error('boom');
  } catch (error) {
    print('caught $error');
  }
}
