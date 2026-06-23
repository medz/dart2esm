import 'dart:convert';

import 'package:crypto/crypto.dart';

void main() {
  final data = utf8.encode('dart2esm');
  final sha1Digest = sha1.convert(data);
  final sha256Digest = sha256.convert(data);
  final hmacDigest = Hmac(sha256, utf8.encode('key')).convert(data);

  final sink = _DigestSink();
  final input = sha256.startChunkedConversion(sink);
  input.add(utf8.encode('dart'));
  input.add(utf8.encode('2esm'));
  input.close();

  print(
    'crypto ${sha1Digest.toString().substring(0, 8)} '
    '${sha256Digest.bytes.length} '
    '${sha256Digest.toString().substring(0, 12)} '
    '${hmacDigest.toString().substring(0, 12)} '
    '${sink.value == sha256Digest}',
  );
}

class _DigestSink implements Sink<Digest> {
  Digest? value;

  @override
  void add(Digest data) {
    value = data;
  }

  @override
  void close() {}
}
