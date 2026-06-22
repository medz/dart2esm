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
}
