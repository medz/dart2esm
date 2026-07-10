import 'dart:async';
import 'dart:isolate';

bool workerTouchedGlobal = false;

void worker(SendPort port) {
  workerTouchedGlobal = true;
  port.send('worker:$workerTouchedGlobal');
}

String compute() {
  workerTouchedGlobal = true;
  return 'run:$workerTouchedGlobal';
}

Future<void> main() async {
  final receivePort = ReceivePort('dart2esm');
  final messages = <Object?>[];
  final done = Completer<void>();
  late StreamSubscription<Object?> subscription;
  subscription = receivePort.listen((message) {
    messages.add(message);
    if (messages.length == 2 && !done.isCompleted) {
      receivePort.close();
      done.complete();
    }
  });

  receivePort.sendPort.send('direct');
  final spawned = await Isolate.spawn(worker, receivePort.sendPort);
  await done.future;
  await subscription.cancel();
  final dynamic receiveSendPort = receivePort.sendPort;
  final dynamic spawnedIsolate = spawned;
  print(
    'receive ${messages.join('|')} ${receiveSendPort is SendPort} '
    '$workerTouchedGlobal ${spawnedIsolate is Isolate} '
    '${spawned.debugName == null}',
  );
  print('${await Isolate.run(compute)} $workerTouchedGlobal');

  final rawMessages = <Object?>[];
  final rawPort = RawReceivePort((message) {
    rawMessages.add(message);
  }, 'raw');
  rawPort.sendPort.send('raw');
  await Future<void>.delayed(Duration.zero);
  rawPort.close();
  final dynamic rawSendPort = rawPort.sendPort;
  print('raw ${rawMessages.join('|')} ${rawSendPort is SendPort}');
}
