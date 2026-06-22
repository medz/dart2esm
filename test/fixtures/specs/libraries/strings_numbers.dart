import 'dart:convert';

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

  final numeric = -3.6;
  print(
    'numOps ${numeric.abs()} ${numeric.sign < 0} ${numeric.round()} '
    '${numeric.floor()} ${numeric.ceil()} ${numeric.truncate()}',
  );
  print(
    'numFormat ${numeric.clamp(-3, 2)} ${numeric.remainder(2)} '
    '${3.14159.toStringAsFixed(2)} ${3.14159.toStringAsPrecision(3)}',
  );
  print(
    'numMeta ${double.nan.isNaN} ${double.infinity.isInfinite} '
    '${3.0.isFinite} ${(-0.0).isNegative}',
  );

  final uri = Uri.parse(
    'https://user:pass@example.test:8443/a/b?x=1&x=2&empty=#frag',
  );
  print(
    'uri ${uri.scheme} ${uri.host} ${uri.path} ${uri.query} ${uri.fragment}',
  );
  print(
    'uri meta ${uri.authority} ${uri.userInfo} ${uri.port} '
    '${uri.pathSegments.join('|')} ${uri.hasScheme} ${uri.hasAuthority} '
    '${uri.hasPort} ${uri.hasQuery} ${uri.hasFragment} ${uri.isAbsolute}',
  );
  print(
    'uri query ${uri.queryParameters['x']} ${uri.queryParameters['empty']} '
    '${uri.queryParametersAll['x']!.join('|')}',
  );
  print('uri string ${uri.toString()}');

  final https = Uri.https('example.test', '/a/b', {
    'q': 'dart esm',
    'page': '1',
  });
  final http = Uri.http('example.test:8080', 'plain path', {'x': 'a/b'});
  print('uri build ${https.scheme} ${https.host} ${https.path} ${https.query}');
  print('uri built ${https.toString()} ${http.toString()}');
  final replaced = uri.replace(
    path: '/c/d',
    queryParameters: {
      'z': '9',
      'many': ['a', 'b'],
    },
    fragment: null,
  );
  final resolved = uri.resolve('../c?q=1');
  final resolvedUri = uri.resolveUri(Uri.parse('/root?q=2'));
  final normalized = Uri.parse(
    'https://example.test/a/../b/./c',
  ).normalizePath();
  print(
    'uri ops ${replaced.toString()} ${uri.removeFragment().hasFragment} '
    '${resolved.path} ${resolved.query} ${resolvedUri.path} '
    '${normalized.path}',
  );
  final relative = Uri.parse('relative/path.txt');
  final file = Uri.file('/tmp/a b.txt');
  final directory = Uri.directory('/tmp/a b');
  final relativeFile = Uri.file('relative/path.txt');
  print(
    'uri factories ${relative.path} ${relative.isAbsolute} '
    '${file.scheme} ${file.path} ${directory.path.endsWith('/')} '
    '${relativeFile.scheme} ${relativeFile.path}',
  );
  final dataText = Uri.dataFromString('hello world');
  final dataJson = Uri.dataFromString(
    'hello world',
    mimeType: 'application/json',
  );
  final dataUtf8 = Uri.dataFromString('å', encoding: utf8);
  final dataBase64 = Uri.dataFromString('hello', base64: true);
  final dataBytes = Uri.dataFromBytes([65, 66, 67]);
  final dataBytesText = Uri.dataFromBytes([65, 66, 67], mimeType: 'text/plain');
  final dataBytesPercent = Uri.dataFromBytes([
    65,
    66,
    67,
  ], percentEncoded: true);
  print(
    'uri data ${dataText.toString()} ${dataJson.toString()} '
    '${dataUtf8.toString()} ${dataBase64.toString()} '
    '${dataBytes.toString()} ${dataBytesText.toString()} '
    '${dataBytesPercent.toString()}',
  );
  final tryUri = Uri.tryParse('https://example.test/try');
  final invalidUri = Uri.tryParse('http://[::1');
  print('uri try ${tryUri!.host} ${invalidUri == null}');
  try {
    Uri.parse('http://[::1');
  } on FormatException {
    print('uri parseError true');
  }
}
