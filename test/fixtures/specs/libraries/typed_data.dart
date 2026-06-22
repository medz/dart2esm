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

  final ints = Int32List.fromList([1, -2, 3]);
  final floats = Float64List(2);
  floats[0] = 1.5;
  floats[1] = -2.25;
  print('typed ${ints.length} ${ints[1]} ${floats[0]} ${floats[1]}');

  final data = ByteData(4);
  data.setInt16(0, 0x1234);
  data.setUint8(2, 255);
  print('bytes ${data.lengthInBytes} ${data.getInt16(0)} ${data.getUint8(2)}');
}
