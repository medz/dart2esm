import 'dart:typed_data';

void main() {
  final bytes = Uint8List.fromList([1, 2, 255]);
  Object hidden = bytes;
  print('from ${bytes.length} ${bytes[2]} ${hidden is Uint8List}');
  print('types ${hidden is List} ${hidden is Iterable}');

  final zeros = Uint8List(3);
  zeros[0] = 7;
  zeros[2] = 9;
  print('new ${zeros.length} ${zeros[0]} ${zeros[1]} ${zeros[2]}');
}
