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
  Object hiddenData = data;
  data.setInt16(0, 0x1234);
  data.setUint8(2, 255);
  print('bytes ${data.lengthInBytes} ${data.getInt16(0)} ${data.getUint8(2)}');
  print('datatypes ${hiddenData is ByteData} ${hiddenData is TypedData}');

  final words = Uint16List.view(bytes.buffer, 0, 1);
  Object hiddenBuffer = bytes.buffer;
  words[0] = 0x0201;
  print(
    'view ${bytes[0]} ${bytes[1]} ${words.lengthInBytes} '
    '${words.offsetInBytes} ${words.elementSizeInBytes}',
  );
  print('buffertype ${hiddenBuffer is ByteBuffer}');

  final sublist = Uint8List.sublistView(bytes, 1, 3);
  sublist[0] = 8;
  print('sublist ${sublist.length} ${sublist[0]} ${bytes[1]}');

  final fromBuffer = bytes.buffer.asUint8List(1, 2);
  print(
    'buffer ${fromBuffer.length} ${fromBuffer[0]} ${bytes.buffer.lengthInBytes}',
  );

  final dataView = ByteData.view(bytes.buffer, 0, bytes.lengthInBytes);
  dataView.setUint16(0, 0x0a0b, Endian.little);
  print(
    'viewdata ${bytes[0]} ${bytes[1]} ${dataView.offsetInBytes} '
    '${dataView.elementSizeInBytes}',
  );

  final byteSlice = ByteData.sublistView(bytes, 0, 2);
  print('byteslice ${byteSlice.lengthInBytes} ${byteSlice.getUint8(1)}');
}
