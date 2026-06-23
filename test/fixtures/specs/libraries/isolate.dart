import 'dart:async';
import 'dart:isolate';

void worker(SendPort port) {
  port.send('worker');
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
  await Isolate.spawn(worker, receivePort.sendPort);
  await done.future;
  await subscription.cancel();
  final dynamic receiveSendPort = receivePort.sendPort;
  print('receive ${messages.join('|')} ${receiveSendPort is SendPort}');

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
