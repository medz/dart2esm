import 'dart:convert' show utf8;

import 'package:convert/convert.dart';

void main() {
  final decodedHex = hex.decode('48656c6c6f21');
  final encodedHex = hex.encode([0, 15, 16, 255]);
  final hexChunks = <String>[];
  final hexSink = hex.encoder.startChunkedConversion(_ListSink(hexChunks));
  hexSink.add([1, 2]);
  hexSink.addSlice([3, 4, 5], 1, 3, true);

  final encodedPercent = percent.encode(utf8.encode('a b/~?'));
  final decodedPercent = utf8.decode(percent.decode(encodedPercent));
  final percentChunks = <List<int>>[];
  final percentSink = percent.decoder.startChunkedConversion(
    _ListSink(percentChunks),
  );
  percentSink.add('a%20');
  percentSink.add('b%2F');
  percentSink.close();

  final byteSink = ByteAccumulatorSink()
    ..add([65, 66])
    ..addSlice([67, 68, 69], 1, 3, true);
  final stringSink = StringAccumulatorSink()
    ..add('dart')
    ..addSlice('2esm!', 0, 4, true);
  final values = AccumulatorSink<String>()
    ..add('one')
    ..add('two');
  final beforeClear = values.events.join('|');
  values
    ..clear()
    ..add('three')
    ..close();

  final identityCodec = const IdentityCodec<Object?>();
  final identity =
      identityCodec.encode('id') == 'id' && identityCodec.decode(42) == 42;

  final formatter = FixedDateTimeFormatter('YYYY-MM-DD hh:mm:ss.SSSSSS');
  final formatted = formatter.encode(DateTime.utc(2026, 6, 23, 4, 5, 6, 7, 8));
  final parsed = FixedDateTimeFormatter(
    'YYYYMMDDhhmmssSSS',
  ).decode('20260623040506007');
  final failedParse = FixedDateTimeFormatter('YYYY').tryDecode('no') == null;

  final greekText = String.fromCharCodes([0x391, 0x3b2]);
  final greekBytes = latinGreek.encode(greekText);
  final greekRunes = latinGreek
      .decode(greekBytes)
      .runes
      .map((rune) => rune.toRadixString(16))
      .join(',');
  final invalidRune = latinGreek.decode([999], allowInvalid: true).runes.first;

  print(
    'convert ${utf8.decode(decodedHex)} $encodedHex '
    '${hexChunks.join('|')} $encodedPercent $decodedPercent '
    '${percentChunks.map((chunk) => chunk.join('-')).join('|')} '
    '${utf8.decode(byteSink.bytes)} ${byteSink.isClosed} '
    '${stringSink.string} ${stringSink.isClosed} '
    '$beforeClear ${values.events.join('|')} ${values.isClosed} '
    '$identity $formatted ${parsed.toIso8601String()} $failedParse '
    '${greekBytes.join(',')} $greekRunes $invalidRune',
  );
}

class _ListSink<T> implements Sink<T> {
  _ListSink(this.values);

  final List<T> values;
  var closed = false;

  @override
  void add(T data) {
    values.add(data);
  }

  @override
  void close() {
    closed = true;
  }
}
