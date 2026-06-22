import 'dart:convert';

void main() {
  final payload = {
    'name': 'dart2esm',
    'values': [1, 2, 3],
    'ok': true,
  };
  final encoded = jsonEncode(payload);
  final decoded = jsonDecode(encoded) as Map;
  print('json ${decoded['name']} ${(decoded['values'] as List).length}');

  final codecEncoded = json.encode({'answer': 42});
  final codecDecoded = json.decode(codecEncoded) as Map;
  print('codec ${codecDecoded['answer']}');

  final bytes = utf8.encode('hello');
  print('utf8 ${bytes.length} ${utf8.decode(bytes)}');

  final token = base64Encode(bytes);
  print('base64 $token ${utf8.decode(base64Decode(token))}');

  final urlToken = base64Url.encode(bytes);
  print('base64Url $urlToken ${utf8.decode(base64Url.decode(urlToken))}');

  final lines = const LineSplitter().convert('a\nb\r\nc');
  final staticLines = LineSplitter.split('x\ry').join('/');
  print('lines ${lines.join('|')} $staticLines');

  final escaped = const HtmlEscape().convert('<a&b>"\'/');
  print('html $escaped');
}
