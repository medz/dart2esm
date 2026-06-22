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
