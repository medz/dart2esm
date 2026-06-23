import 'dart:async';

String __dartTimer(String value) => 'user:$value';

Future<void> main() async {
  print(__dartTimer('timer'));

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

  final waitCleaned = <int>[];
  try {
    await Future.wait<int>(
      [
        Future<int>.delayed(const Duration(milliseconds: 2), () => 12),
        Future<int>.error('wait-error'),
      ],
      cleanUp: (value) {
        waitCleaned.add(value);
      },
    );
  } catch (error) {
    print('waitError $error ${waitCleaned.join(',')}');
  }

  final eagerCleaned = <int>[];
  try {
    await Future.wait<int>(
      [
        Future<int>.error('eager-error'),
        Future<int>.delayed(const Duration(milliseconds: 2), () => 13),
      ],
      eagerError: true,
      cleanUp: (value) {
        eagerCleaned.add(value);
      },
    );
  } catch (error) {
    await Future<void>.delayed(const Duration(milliseconds: 5));
    print('waitEager $error ${eagerCleaned.join(',')}');
  }

  final iterableWait = await [Future.value(21), Future.value(22)].wait;
  final recordWait = await (Future.value('r'), Future.value(23)).wait;
  print(
    'extensionWait ${iterableWait.join(',')} ${recordWait.$1}${recordWait.$2}',
  );
  try {
    await [Future.value(24), Future<int>.error('parallel-list')].wait;
  } on ParallelWaitError<List<int?>, List<AsyncError?>> catch (error) {
    print(
      'extensionWaitError ${error.values.join(',')} '
      '${error.errors[1]!.error} ${error.toString().contains('parallel-list')}',
    );
  }
  try {
    await (Future.value('ok'), Future<int>.error('parallel-record')).wait;
  } on ParallelWaitError<(String?, int?), (AsyncError?, AsyncError?)> catch (
    error
  ) {
    print(
      'recordWaitError ${error.values.$1} ${error.values.$2 == null} '
      '${error.errors.$2!.error} ${error.toString().contains('parallel-record')}',
    );
  }

  final microtask = await Future<int>.microtask(() => 4);
  final any = await Future.any<int>([
    Future<int>.delayed(const Duration(milliseconds: 5), () => 99),
    Future<int>.value(5),
  ]);
  print('more $microtask $any');

  final constructed = await Future<int>(() => 12);
  // ignore: sdk_version_since
  final syncValue = await Future<int>.syncValue(13);
  print('futureConstruct $constructed $syncValue');

  var forEachTotal = 0;
  await Future.forEach<int>([1, 2, 3], (value) async {
    forEachTotal += value;
  });
  var doWhileCount = 0;
  await Future.doWhile(() async {
    doWhileCount += 1;
    return doWhileCount < 3;
  });
  print('futureLoop $forEachTotal $doWhileCount');

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
  Future<void>.error('ignored').ignore();
  final onErrored = await Future<int>.error(
    'on-error',
  ).onError((error, stackTrace) => 14);
  print(
    'chain $chained $recovered $completed $finalized $handledThen $filtered '
    '$onErrored',
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

  final streamFromFuture = await Stream<int>.fromFuture(
    Future.value(14),
  ).single;
  final streamFromFutures = await Stream<int>.fromFutures([
    Future<int>.delayed(const Duration(milliseconds: 2), () => 1),
    Future<int>.value(2),
  ]).toList();
  streamFromFutures.sort();
  print('streamFuture $streamFromFuture ${streamFromFutures.join(',')}');

  final streamMultiValues = await Stream<int>.multi((controller) {
    controller.add(3);
    controller.add(4);
    controller.close();
  }).join(',');
  final streamMultiBroadcast = Stream<int>.multi((controller) {
    controller.add(5);
    controller.close();
  }, isBroadcast: true);
  print(
    'streamMulti $streamMultiValues ${await streamMultiBroadcast.single} '
    '${streamMultiBroadcast.isBroadcast}',
  );

  final streamValue = await Stream<int>.value(7).single;
  try {
    await Stream<int>.error('stream-boom').first;
  } catch (error) {
    final periodicValues = await Stream<int>.periodic(
      const Duration(milliseconds: 1),
      (tick) => tick + 1,
    ).take(3).toList();
    print('streamFactories $streamValue $error ${periodicValues.join(',')}');
  }

  final controller = StreamController<int>.broadcast();
  final seenA = <int>[];
  final seenB = <int>[];
  final subA = controller.stream.listen(seenA.add);
  final subB = controller.stream.listen(seenB.add);
  controller.add(1);
  controller.add(2);
  await Future<void>.delayed(const Duration(milliseconds: 1));
  await subA.cancel();
  await subB.cancel();
  await controller.close();
  print(
    'broadcast ${seenA.join(',')} ${seenB.join(',')} ${controller.isClosed}',
  );

  try {
    await Future.error('boom');
  } catch (error) {
    print('caught $error');
  }
}
