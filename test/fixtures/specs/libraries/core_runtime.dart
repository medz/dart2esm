class PlainObject {}

void main() {
  final buffer = StringBuffer('hello');
  buffer.write(' ');
  buffer.write(42);
  buffer.writeln();
  buffer.write('done');
  print(
    'buffer ${buffer.length} ${buffer.isNotEmpty} ${buffer.toString().contains('\n')}',
  );
  buffer.writeAll(['x', 'y'], '-');
  buffer.writeCharCode(33);
  print('writeAll ${buffer.toString().split('\n').last}');
  buffer.clear();
  print('cleared ${buffer.isEmpty} ${buffer.toString()}');

  final encoded = Uri.encodeComponent('a b/ç');
  print('uri $encoded ${Uri.decodeComponent(encoded)}');
  final full = Uri.encodeFull('https://example.test/a b?q=ç');
  print('full ${Uri.decodeFull(full)}');

  final plain = PlainObject();
  final other = PlainObject();
  final object = Object();
  final dynamic hash = plain.hashCode;
  final stableHash = hash == plain.hashCode;
  print(
    'object ${hash is int} $stableHash '
    '${identical(plain, plain)} ${identical(plain, other)}',
  );
  print('runtime ${plain.runtimeType} ${1.runtimeType} ${1.5.runtimeType}');
  print(
    'objectString ${plain.toString().contains('PlainObject')} '
    '${object.toString().contains('Object')}',
  );
}
