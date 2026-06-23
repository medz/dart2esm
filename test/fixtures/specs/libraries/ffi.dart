import 'dart:ffi';

void main() {
  final pointer = Pointer<Int32>.fromAddress(16);
  final casted = pointer.cast<Uint8>();
  print(
    'ffi ${nullptr.address} ${pointer.address} ${casted.address} '
    '${sizeOf<Int32>()}',
  );
}
