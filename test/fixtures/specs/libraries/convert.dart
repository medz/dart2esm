import 'dart:async';
import 'dart:convert';

class _ListSink<T> implements Sink<T> {
  _ListSink(this.values);

  final List<T> values;
  bool closed = false;

  @override
  void add(T data) {
    values.add(data);
  }

  @override
  void close() {
    closed = true;
  }
}

Future<void> main() async {
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

  final asciiBytes = ascii.encode('AZ');
  final latinBytes = latin1.encode('Aÿ');
  final constAscii = const AsciiCodec().decode([79, 75]);
  final constLatin = const Latin1Codec().decode([65, 255]);
  print(
    'singleByte ${asciiBytes.join(',')} ${ascii.decode([65, 90])} '
    '${latinBytes.join(',')} ${latin1.decode([65, 255])} '
    '$constAscii $constLatin',
  );
  final malformedUtf8 = const Utf8Codec(allowMalformed: true).decode([255]);
  final malformedUtf8Override = utf8.decode([255], allowMalformed: true);
  final invalidAscii = const AsciiCodec(allowInvalid: true).decode([65, 200]);
  final invalidLatin = const Latin1Codec(allowInvalid: true).decode([65, 300]);
  print(
    'malformed ${malformedUtf8.runes.first} '
    '${malformedUtf8Override.runes.first} ${invalidAscii.runes.last} '
    '${invalidLatin.runes.last}',
  );

  final token = base64Encode(bytes);
  print('base64 $token ${utf8.decode(base64Decode(token))}');

  final urlToken = base64Url.encode(bytes);
  print('base64Url $urlToken ${utf8.decode(base64Url.decode(urlToken))}');

  final lines = const LineSplitter().convert('a\nb\r\nc');
  final staticLines = LineSplitter.split('x\ry').join('/');
  print('lines ${lines.join('|')} $staticLines');

  final boundUtf8 = await utf8.decoder
      .bind(Stream<List<int>>.fromIterable([
        [104],
        [105],
      ]))
      .join('|');
  final transformedUtf8 = await Stream<List<int>>.fromIterable([
    [33],
  ]).transform(utf8.decoder).join(',');
  final lineBound = await const LineSplitter()
      .bind(Stream<String>.fromIterable(['a\nb', '\nc']))
      .join('|');
  final lineSinkChunks = <String>[];
  final lineSink = const LineSplitter().startChunkedConversion(
    StringConversionSink.from(_ListSink<String>(lineSinkChunks)),
  );
  lineSink.add('x\ny');
  lineSink.add('\nz');
  lineSink.close();
  final escapedChunks = <String>[];
  final htmlSink = const HtmlEscape().startChunkedConversion(
    StringConversionSink.withCallback((value) {
      escapedChunks.add(value);
    }),
  );
  htmlSink.add('<');
  htmlSink.add('&');
  htmlSink.close();
  print(
    'converterStreams $boundUtf8 $transformedUtf8 $lineBound '
    '${lineSinkChunks.join('|')} ${escapedChunks.join('|')}',
  );

  final fusedCodec = utf8.fuse(base64);
  final fusedEncoded = fusedCodec.encode('fuse');
  final fusedDecoded = fusedCodec.decode(fusedEncoded);
  final fusedConverter = const Utf8Encoder()
      .fuse(const Base64Encoder())
      .convert('hi');
  final fusedJsonUtf8 = const JsonEncoder()
      .fuse(const Utf8Encoder())
      .convert({'x': 1})
      .join(',');
  print('fuse $fusedEncoded $fusedDecoded $fusedConverter $fusedJsonUtf8');

  final chunkedBytes = <int>[];
  final byteSink = ByteConversionSink.withCallback((bytes) {
    chunkedBytes.addAll(bytes);
  });
  final chunkedEncoder = const Utf8Encoder().startChunkedConversion(byteSink);
  chunkedEncoder.add('h');
  chunkedEncoder.add('é');
  chunkedEncoder.close();
  final chunkedText = <String>[];
  final stringSink = StringConversionSink.withCallback((value) {
    chunkedText.add(value);
  });
  final chunkedDecoder = const Utf8Decoder().startChunkedConversion(stringSink);
  chunkedDecoder.add([104]);
  chunkedDecoder.add([105]);
  chunkedDecoder.close();
  print('chunked ${chunkedBytes.join(',')} ${chunkedText.join('|')}');

  final adaptedByteChunks = <List<int>>[];
  final adaptedByteSink = _ListSink<List<int>>(adaptedByteChunks);
  final byteFrom = ByteConversionSink.from(adaptedByteSink);
  byteFrom.add([1]);
  byteFrom.addSlice([2, 3, 4], 1, 3, true);
  final adaptedStringChunks = <String>[];
  final adaptedStringSink = _ListSink<String>(adaptedStringChunks);
  final stringFrom = StringConversionSink.from(adaptedStringSink);
  stringFrom.add('a');
  stringFrom.addSlice('bcde', 1, 3, true);
  final stringBuffer = StringBuffer();
  final fromStringSink = StringConversionSink.fromStringSink(stringBuffer);
  fromStringSink.add('x');
  fromStringSink.addSlice('yz!', 0, 2, true);
  final utf8SinkText = <String>[];
  final utf8ViewTarget = StringConversionSink.withCallback((value) {
    utf8SinkText.add(value);
  });
  final utf8View = utf8ViewTarget.asUtf8Sink(false);
  utf8View.add([104]);
  utf8View.addSlice([195, 169, 33], 0, 2, false);
  utf8View.addSlice([33], 0, 1, true);
  final chunkedValues = <String>[];
  final genericSink = ChunkedConversionSink<Object?>.withCallback((values) {
    chunkedValues.add(values.join('/'));
  });
  genericSink.add('g');
  genericSink.add(7);
  genericSink.close();
  print(
    'sinkAdapters ${adaptedByteChunks.map((chunk) => chunk.join('-')).join('|')} '
    '${adaptedByteSink.closed} ${adaptedStringChunks.join('|')} '
    '${adaptedStringSink.closed} ${stringBuffer.toString()} '
    '${utf8SinkText.join('|')} ${chunkedValues.join('|')}',
  );

  final escaped = const HtmlEscape().convert('<a&b>"\'/');
  print('html $escaped');

  final indented = const JsonEncoder.withIndent('  ').convert({
    'a': [1, true],
  });
  final jsonUtf8Bytes = JsonUtf8Encoder(' ').convert({'b': 2});
  final decodedObject = const JsonDecoder().convert('{"c":3}') as Map;
  final revivedObject =
      JsonDecoder((key, value) => key == 'n' ? 7 : value).convert('{"n":1}')
          as Map;
  print(
    'jsonObjects ${indented.contains('\n  "a"')} '
    '${indented.contains('\n    1')} '
    '${utf8.decode(jsonUtf8Bytes).contains('\n "b"')} '
    '${decodedObject['c']} ${revivedObject['n']}',
  );

  final utf8Partial = const Utf8Encoder().convert('hé', 1).join(',');
  final utf8Decoded = const Utf8Decoder().convert([120, 195, 169, 121], 1, 3);
  final malformedDecoded = const Utf8Decoder(
    allowMalformed: true,
  ).convert([255]).runes.first;
  final asciiPartial = const AsciiEncoder().convert('AZ', 1).join(',');
  final asciiDecoded = const AsciiDecoder().convert([88, 89, 90], 1, 3);
  final asciiInvalid = const AsciiDecoder(
    allowInvalid: true,
  ).convert([65, 200]).runes.last;
  final latinPartial = const Latin1Encoder().convert('Aÿ', 1).join(',');
  final latinDecoded = const Latin1Decoder().convert([65, 255], 1);
  final latinInvalid = const Latin1Decoder(
    allowInvalid: true,
  ).convert([300]).runes.first;
  print(
    'converterObjects $utf8Partial $utf8Decoded $malformedDecoded '
    '$asciiPartial $asciiDecoded $asciiInvalid '
    '$latinPartial $latinDecoded $latinInvalid',
  );

  final urlObjectToken = const Base64Encoder.urlSafe().convert([251, 255]);
  final decodedUrlObject = const Base64Decoder().convert(urlObjectToken);
  final normalizedUrlToken = const Base64Codec.urlSafe().normalize('-_8');
  print(
    'base64Objects $urlObjectToken ${decodedUrlObject.join(',')} '
    '$normalizedUrlToken ${const Base64Encoder().convert([251, 255])}',
  );

  final attrEscaped = const HtmlEscape(
    HtmlEscapeMode.attribute,
  ).convert('<a&>"\'/');
  final elementEscaped = const HtmlEscape(
    HtmlEscapeMode.element,
  ).convert('<a&>"\'/');
  final customEscaped = const HtmlEscape(
    HtmlEscapeMode(escapeApos: true),
  ).convert('<a&>"\'/');
  final globalEscaped = htmlEscape.convert('&');
  print(
    'htmlModes ${attrEscaped.contains('&quot;')} '
    '${attrEscaped.contains('&#39;')} ${attrEscaped.contains('&#47;')} '
    '${elementEscaped.contains('&lt;')} '
    '${elementEscaped.contains('&quot;')} '
    '${customEscaped.contains('&#39;')} ${customEscaped.contains('&lt;')} '
    '$globalEscaped',
  );
}
