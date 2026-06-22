class PlainObject {}

dynamic hide(Object? value) => value;

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
  buffer.writeCharCode(0x1f600);
  print('writeAll ${buffer.toString().split('\n').last}');
  buffer.clear();
  print('cleared ${buffer.isEmpty} ${buffer.toString()}');

  final textRunes = 'A😀B'.runes.toList();
  final constructedRunes = Runes('Hi 😀');
  print(
    'runes ${textRunes.length} ${textRunes[1].toRadixString(16)} '
    '${String.fromCharCodes(constructedRunes)} ${String.fromCharCode(0x1f600)}',
  );

  final expando = Expando<int>('count');
  final expandoKey = PlainObject();
  expando[expandoKey] = 7;
  print(
    'expando ${expando[expandoKey]} ${expando[PlainObject()]} '
    '${hide(expando) is Expando} ${expando.toString().contains('count')}',
  );

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

  const constObject = Object();
  print(
    'constObject ${identical(constObject, const Object())} '
    '${constObject.runtimeType} ${constObject.toString().contains('Object')}',
  );
}
