import 'dart:async';

Future<void> main() async {
  final doubled = Stream<int>.fromIterable([
    1,
    2,
    3,
  ]).map((value) => value * 2).where((value) => value > 2);
  final values = <int>[];
  await for (final value in doubled) {
    values.add(value);
  }
  print('stream ${values.join(',')}');

  final single = await Stream<String>.value('ok').first;
  final listed = await Stream<String>.fromIterable(['a', 'b']).toList();
  print('future $single ${listed.join('|')}');
  print(
    'query ${await Stream<int>.fromIterable([1, 2, 3]).length} '
    '${await Stream<int>.empty().isEmpty} '
    '${await Stream<int>.fromIterable([1, 2, 3]).last} '
    '${await Stream<int>.value(9).single}',
  );
  print(
    'checks ${await Stream<int>.fromIterable([1, 2, 3]).any((value) => value > 2)} '
    '${await Stream<int>.fromIterable([1, 2, 3]).every((value) => value > 0)} '
    '${await Stream<int>.fromIterable([1, 2, 3]).contains(2)} '
    '${await Stream<String>.fromIterable(['a', 'b']).join('-')} '
    '${await Stream<int>.fromIterable([1, 2]).drain<String>('done')}',
  );
  print(
    'slice ${await Stream<int>.fromIterable([1, 2, 3, 4, 5]).skip(1).take(3).join(',')} '
    '${await Stream<int>.fromIterable([1, 2, 3, 4]).takeWhile((value) => value < 3).join(',')} '
    '${await Stream<int>.fromIterable([1, 2, 3, 4]).skipWhile((value) => value < 3).join(',')}',
  );
  print(
    'whereQuery ${await Stream<int>.fromIterable([1, 2, 3, 4]).firstWhere((value) => value > 2)} '
    '${await Stream<int>.fromIterable([1, 2, 3, 4]).lastWhere((value) => value.isOdd)} '
    '${await Stream<int>.fromIterable([1, 2, 3, 4]).singleWhere((value) => value == 3)} '
    '${await Stream<int>.fromIterable([1, 2]).firstWhere((value) => value > 9, orElse: () => -1)}',
  );
  final asyncMapped = await Stream<int>.fromIterable([
    1,
    2,
  ]).asyncMap((value) async => value * 3).join(',');
  final asyncExpanded = await Stream<int>.fromIterable([1, 2])
      .asyncExpand((value) => Stream<int>.fromIterable([value, value + 10]))
      .join(',');
  final distinctValues = await Stream<int>.fromIterable([
    1,
    1,
    2,
    1,
  ]).distinct().join(',');
  final parityDistinct = await Stream<int>.fromIterable([
    1,
    3,
    4,
    6,
  ]).distinct((previous, next) => previous.isOdd == next.isOdd).join(',');
  final handledErrors = <String>[];
  final handledController = StreamController<int>();
  final handled = handledController.stream
      .handleError((error) {
        handledErrors.add('$error');
      })
      .join(',');
  handledController.add(1);
  handledController.addError('handled');
  handledController.add(2);
  await handledController.close();
  var skippedError = '';
  try {
    await Stream<int>.error('skipped').handleError((error) {
      handledErrors.add('wrong');
    }, test: (error) => false).drain();
  } catch (error) {
    skippedError = '$error';
  }
  print(
    'streamMore $asyncMapped $asyncExpanded $distinctValues $parityDistinct '
    '${await handled} ${handledErrors.join(',')} $skippedError',
  );
  final aggregateSet = await Stream<int>.fromIterable([1, 2, 2]).toSet();
  final folded = await Stream<int>.fromIterable([
    1,
    2,
    3,
  ]).fold<int>(10, (previous, value) => previous + value);
  final reduced = await Stream<int>.fromIterable([
    2,
    3,
    4,
  ]).reduce((previous, value) => previous * value);
  var forEachTotal = 0;
  await Stream<int>.fromIterable([1, 2, 3]).forEach((value) async {
    forEachTotal += value;
  });
  final casted = await Stream<Object>.fromIterable([
    1,
    2,
  ]).cast<int>().join(',');
  print(
    'aggregate ${aggregateSet.join(',')} $folded $reduced $forEachTotal '
    '$casted',
  );
  var broadcastListenCount = 0;
  final broadcastedFromSingle = Stream<int>.fromIterable([1, 2, 3])
      .asBroadcastStream(
        onListen: (_) {
          broadcastListenCount++;
        },
      );
  final broadcastOdds = broadcastedFromSingle
      .where((value) => value.isOdd)
      .toList();
  final broadcastDoubled = broadcastedFromSingle
      .map((value) => value * 2)
      .toList();
  print(
    'asBroadcast ${(await broadcastOdds).join(',')} '
    '${(await broadcastDoubled).join(',')} $broadcastListenCount '
    '${broadcastedFromSingle.isBroadcast}',
  );
  final timeoutController = StreamController<int>();
  final timeoutValues = timeoutController.stream
      .timeout(
        const Duration(milliseconds: 1),
        onTimeout: (sink) {
          sink.add(9);
          sink.close();
        },
      )
      .toList();
  await Future<void>.delayed(const Duration(milliseconds: 5));
  print('streamTimeout ${(await timeoutValues).join(',')}');
  final listened = <int>[];
  final listenDone = Completer<String>();
  final subscription = Stream<int>.fromIterable([6, 7]).listen(
    (value) {
      listened.add(value);
    },
    onDone: () {
      listenDone.complete('done');
    },
  );
  subscription.pause();
  final paused = subscription.isPaused;
  subscription.resume();
  final listenState = await listenDone.future;
  final listenFuture = Stream<int>.fromIterable([8])
      .listen((value) {
        listened.add(value);
      })
      .asFuture<String>('future');
  print(
    'listen $listenState ${listened.join(',')} $paused '
    '${await listenFuture} ${listened.join(',')}',
  );

  final updateController = StreamController<int>();
  final updated = <int>[];
  final updateErrors = <String>[];
  final updateDone = Completer<String>();
  final updateSubscription = updateController.stream.listen((value) {
    updated.add(value);
  });
  updateSubscription.onData((value) {
    updated.add(value * 2);
  });
  updateSubscription.onError((error) {
    updateErrors.add('$error');
  });
  updateSubscription.onDone(() {
    updateDone.complete('done');
  });
  updateController.add(3);
  updateController.addError('changed-error');
  updateController.add(4);
  await updateController.close();
  print(
    'listenUpdate ${updated.join(',')} ${updateErrors.join(',')} '
    '${await updateDone.future}',
  );

  final controller = StreamController<int>();
  final controlledFuture = controller.stream.toList();
  print('state ${controller.isClosed} ${controller.hasListener}');
  controller.add(4);
  controller.add(5);
  await controller.close();
  final controlled = await controlledFuture;
  print('controller ${controlled.join(',')} ${controller.isClosed}');
  print('done ${await controller.done}');

  final errorController = StreamController<int>();
  final errorFuture = () async {
    try {
      await errorController.stream.toList();
    } catch (error) {
      print('streamError $error');
    }
  }();
  errorController.addError('stream-error');
  await errorController.close();
  await errorFuture;
}
