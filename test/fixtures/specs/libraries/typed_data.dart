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

  final numbers = ByteData(36);
  numbers.setInt32(0, -123456, Endian.little);
  numbers.setUint32(4, 0x89abcdef);
  numbers.setFloat32(8, 3.5, Endian.little);
  numbers.setFloat64(12, -6.25);
  numbers.setInt64(20, -9007199254740991, Endian.little);
  numbers.setUint64(28, 9007199254740991);
  print(
    'byteNumbers ${numbers.getInt32(0, Endian.little)} '
    '${numbers.getUint32(4)} '
    '${numbers.getFloat32(8, Endian.little).toStringAsFixed(1)} '
    '${numbers.getFloat64(12).toStringAsFixed(2)} '
    '${numbers.getInt64(20, Endian.little)} ${numbers.getUint64(28)}',
  );

  final ops = Uint8List.fromList([1, 2, 3, 4]);
  final opsCopy = ops.sublist(1, 3);
  ops.setAll(1, [9, 8]);
  ops.setRange(0, 2, [5, 6, 7], 1);
  print(
    'typedOps ${opsCopy.join(',')} ${ops.join(',')} ${ops.buffer.lengthInBytes}',
  );

  final queries = Uint8List.fromList([4, 5, 4, 6]);
  final queryRange = queries.getRange(1, 3).join(',');
  final queryMap = queries.asMap();
  queries.fillRange(1, 3, 9);
  print(
    'typedQueries $queryRange ${queryMap.length}:${queryMap[2]} '
    '${queries.indexOf(4)} ${queries.indexOf(4, 1)} '
    '${queries.lastIndexOf(4)} ${queries.lastIndexOf(4, 2)} '
    '${queries.join(',')}',
  );
}
