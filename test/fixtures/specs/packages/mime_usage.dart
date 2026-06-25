import 'dart:convert';

import 'package:mime/mime.dart';

Future<void> main() async {
  final resolver = MimeTypeResolver.empty()
    ..addExtension('dart', 'text/x-dart')
    ..addMagicNumber(
      [0x01, 0x02, 0x03],
      'application/x-custom',
      mask: [0xff, 0xff, 0x0f],
    );

  final png = lookupMimeType(
    'wrong.txt',
    headerBytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  );
  final plainExtension = extensionFromMime('TEXT/PLAIN');
  final customExtension = resolver.lookup('bin/source.dart');
  final customMagic = resolver.lookup('data.bin', headerBytes: [1, 2, 0x13]);

  const multipart =
      '--frontier\r\n'
      'Content-Type: text/plain\r\n'
      'X-Name: One\r\n'
      '\r\n'
      'hello\r\n'
      '--frontier\r\n'
      'Content-Type: application/json\r\n'
      '\r\n'
      '{"ok":true}\r\n'
      '--frontier--\r\n';
  final chunks = [
    ascii.encode(multipart.substring(0, 41)),
    ascii.encode(multipart.substring(41, 79)),
    ascii.encode(multipart.substring(79)),
  ];
  final parts = <String>[];
  await for (final part in Stream<List<int>>.fromIterable(
    chunks,
  ).transform(MimeMultipartTransformer('frontier'))) {
    final body = await part.expand((chunk) => chunk).toList();
    parts.add('${part.headers['content-type']}:${ascii.decode(body)}');
  }

  print(
    'mime $png $plainExtension $customExtension $customMagic '
    '${defaultMagicNumbersMaxLength >= 12} ${parts.join('|')}',
  );
}
