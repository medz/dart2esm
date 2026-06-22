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

  final timerDone = Completer<String>();
  final timer = Timer(const Duration(milliseconds: 1), () {
    timerDone.complete('fired');
  });
  print('timer-start ${timer.isActive} ${timer.tick}');
  print('timer ${await timerDone.future} ${timer.isActive}');

  var canceledFired = false;
  final canceled = Timer(const Duration(milliseconds: 5), () {
    canceledFired = true;
  });
  canceled.cancel();
  await Future<void>.delayed(const Duration(milliseconds: 10));
  print('cancel ${canceled.isActive} $canceledFired');

  final runDone = Completer<String>();
  Timer.run(() {
    runDone.complete('run');
  });
  print('run ${await runDone.future}');

  final periodicDone = Completer<int>();
  Timer.periodic(const Duration(milliseconds: 1), (timer) {
    if (timer.tick >= 2) {
      periodicDone.complete(timer.tick);
      timer.cancel();
    }
  });
  print('periodic ${await periodicDone.future}');

  var finalized = false;
  final chained = await Future<int>.value(7).then((value) => value + 1);
  final recovered = await Future<int>.error('recover').catchError((error) => 8);
  final completed = await Future<int>.value(9).whenComplete(() {
    finalized = true;
  });
  final handledThen = await Future<int>.error(
    'then-error',
  ).then((_) => 0, onError: (error) => 10);
  final filtered = await Future<int>.error(
    'filtered',
  ).catchError((error) => 11, test: (error) => error == 'filtered');
  print(
    'chain $chained $recovered $completed $finalized $handledThen $filtered',
  );

  final streamed = await Future<String>.value('streamed').asStream().first;
  final fast = await Future<String>.value(
    'fast',
  ).timeout(const Duration(milliseconds: 10));
  final fallback = await Future<String>.delayed(
    const Duration(milliseconds: 10),
    () => 'slow',
  ).timeout(const Duration(milliseconds: 1), onTimeout: () => 'fallback');
  print('futureStream $streamed $fast $fallback');

  try {
    await Future.error('boom');
  } catch (error) {
    print('caught $error');
  }
}
