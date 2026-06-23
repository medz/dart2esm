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
  final parsed = Uri.parse('https://example.test/a/b?x=1&x=2&y=z#frag');
  print(
    'uriParse ${parsed.scheme} ${parsed.host} '
    '${parsed.pathSegments.join('|')} ${parsed.queryParameters['x']} '
    '${parsed.queryParametersAll['x']!.join(',')} ${parsed.fragment}',
  );
  final built = Uri.https('example.test', '/search', {
    'q': 'dart esm',
    'page': '1',
  });
  final replaced = parsed.replace(
    pathSegments: ['c', 'd'],
    queryParameters: {'n': '1'},
    fragment: null,
  );
  final resolved = Uri.parse('https://example.test/a/b/').resolve('../c?d=1');
  final fileUri = Uri.file('/tmp/a b.txt');
  final dataUri = Uri.dataFromString('hi', mimeType: 'text/plain');
  print(
    'uriBuild ${built.toString()} ${replaced.toString()} '
    '${resolved.toString()} ${fileUri.toString()} '
    '${dataUri.toString().startsWith('data:text/plain,hi')}',
  );

  final plain = PlainObject();
  final other = PlainObject();
  final object = Object();
  final dynamic hash = plain.hashCode;
  final stableHash = hash == plain.hashCode;
  print(
    'object ${hash is int} $stableHash '
    '${identical(plain, plain)} ${identical(plain, other)}',
  );
  final dynamic identityHash = identityHashCode(plain);
  print(
    'identityHash ${identityHash is int} '
    '${identityHash == identityHashCode(plain)} '
    '${identityHashCode('x') == identityHashCode('x')} '
    '${identityHashCode(null) == identityHashCode(null)}',
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
