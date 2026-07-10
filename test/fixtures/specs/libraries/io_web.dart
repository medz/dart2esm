import 'dart:convert';
import 'dart:io';

Future<void> main() async {
  final contentType = ContentType('application', 'json', charset: 'utf-8');
  final parsedType = ContentType.parse('text/plain; charset=us-ascii');
  final cookie = Cookie('session', 'abc');
  cookie
    ..path = '/'
    ..httpOnly = false
    ..sameSite = SameSite.lax;

  final client = HttpClient();
  final request = await client.postUrl(Uri.parse('https://example.test/data'));
  request.headers
    ..set(HttpHeaders.contentTypeHeader, contentType)
    ..set('x-dart2esm', 'web');
  request.write('payload');
  final response = await request.close();
  final body = await response.transform(utf8.decoder).join();
  final responseHeader = response.headers['x-response']?.single;
  client.close();

  final socket = await WebSocket.connect(
    'wss://example.test/socket',
    protocols: const ['dart2esm'],
  );
  socket.add('ping');
  final message = await socket.first;
  await socket.close(WebSocketStatus.normalClosure, 'done');

  print(
    'ioWeb '
    '${response.statusCode} '
    '$responseHeader '
    '$body '
    '${contentType.mimeType} '
    '${parsedType.charset} '
    '${cookie.toString()} '
    '${socket.protocol} '
    '$message',
  );
}
