import 'package:http_parser/http_parser.dart';

void main() {
  final media = MediaType.parse('Text/HTML; Charset=UTF-8; boundary=abc');
  final changed = media.change(
    mimeType: 'application/json',
    parameters: {'charset': 'utf-8'},
    clearParameters: true,
  );
  print(
    'media ${media.mimeType} ${media.parameters['charset']} '
    '${media.parameters['BOUNDARY']} $changed',
  );

  final date = parseHttpDate('Sun, 06 Nov 1994 08:49:37 GMT');
  print('date ${date.toIso8601String()} ${formatHttpDate(date)}');

  final challenges = AuthenticationChallenge.parseHeader(
    'Digest realm="api", nonce="abc", Basic realm="simple"',
  );
  print(
    'auth ${challenges.length} ${challenges.first.scheme} '
    '${challenges.first.parameters['realm']} '
    '${challenges.last.scheme} ${challenges.last.parameters['REALM']}',
  );

  final headers = CaseInsensitiveMap<String>.from({
    'Content-Type': media.mimeType,
    'X-Trace': '1',
  });
  headers['content-type'] = changed.mimeType;
  print(
    'headers ${headers['CONTENT-TYPE']} ${headers.containsKey('x-trace')} '
    '${headers.keys.join('|')}',
  );

  final encoded = chunkedCoding.encoder.convert([65, 66, 67, 68]);
  final decoded = chunkedCoding.decoder.convert(encoded);
  print('chunked ${encoded.join(',')} ${String.fromCharCodes(decoded)}');

  try {
    MediaType.parse('not valid');
  } on FormatException catch (error) {
    print('media-error ${error.offset} ${error.source}');
  }
}
