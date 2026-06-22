void main() {
  final parsedInt = int.parse('42');
  final parsedHex = int.parse('ff', radix: 16);
  final maybeInt = int.tryParse('nope') ?? -1;
  print('ints $parsedInt $parsedHex $maybeInt');

  final parsedDouble = double.parse('3.5');
  final maybeDouble = double.tryParse('bad') ?? 1.25;
  final parsedNum = num.parse('7.25');
  print('nums $parsedDouble $maybeDouble $parsedNum');

  final char = String.fromCharCode(65);
  final chars = String.fromCharCodes([68, 97, 114, 116]);
  final text = '  hello,dart  ';
  final trimmed = text.trim();
  print(
    'strings $char $chars ${trimmed.codeUnitAt(0)} ${trimmed.substring(1, 4)}',
  );
  print(
    'checks ${trimmed.startsWith('he')} ${trimmed.endsWith('rt')} '
    '${trimmed.indexOf('dart')} ${trimmed.split(',').join('|')}',
  );
  print('replace ${trimmed.replaceAll('l', 'L').toUpperCase()}');
  print(
    'stringMeta ${trimmed.length} ${trimmed.isNotEmpty} ${''.isEmpty} '
    '${trimmed.contains('l', 3)} ${'7'.padLeft(3, '0')} '
    '${'x'.padRight(3, '.')} ${'  left'.trimLeft()} '
    '${'right  '.trimRight()} ${'abc'.compareTo('abd')}',
  );
  print(
    'stringOps ${trimmed.replaceFirst('l', 'L')} '
    '${trimmed.replaceFirst('l', 'L', 3)} '
    '${trimmed.replaceRange(1, 4, 'EL')} '
    '${trimmed.codeUnits.take(3).join('-')}',
  );

  final uri = Uri.parse('https://example.test/a/b?x=1#frag');
  print(
    'uri ${uri.scheme} ${uri.host} ${uri.path} ${uri.query} ${uri.fragment}',
  );
  print('uri string ${uri.toString()}');

  final https = Uri.https('example.test', '/a/b', {
    'q': 'dart esm',
    'page': '1',
  });
  final http = Uri.http('example.test:8080', 'plain path', {'x': 'a/b'});
  print('uri build ${https.scheme} ${https.host} ${https.path} ${https.query}');
  print('uri built ${https.toString()} ${http.toString()}');
}
