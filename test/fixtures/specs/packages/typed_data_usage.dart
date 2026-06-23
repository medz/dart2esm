import 'dart:typed_data';

import 'package:typed_data/typed_data.dart';

void main() {
  final buffer = Uint8Buffer()
    ..add(1)
    ..addAll([2, 3, 4]);
  buffer[1] = 9;
  final bytes = Uint8List.fromList(buffer);

  final queue = Uint8Queue.fromList([10, 11]);
  queue.add(12);
  final first = queue.removeFirst();
  queue.addFirst(8);
  final last = queue.removeLast();

  final floats = Float64Buffer()
    ..add(1.5)
    ..add(2.25);

  print(
    'typed_data ${buffer.join(',')} $first $last '
    '${queue.join('|')} ${floats[0] + floats[1]} ${bytes.length}',
  );
}
