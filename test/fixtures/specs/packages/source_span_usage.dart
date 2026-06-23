import 'package:boolean_selector/boolean_selector.dart';
import 'package:source_span/source_span.dart';
import 'package:string_scanner/string_scanner.dart';

void main() {
  final source = SourceFile.fromString(
    'alpha beta\nsecond line\nthird',
    url: 'memory:fixture.txt',
  );
  final betaStart = source.getOffset(0, 6);
  final beta = source.span(betaStart, betaStart + 4);
  final second = source.span(source.getOffset(1), source.getOffset(1, 6));
  final expanded = beta.expand(second);
  print(
    'span ${source.lines} '
    '${source.location(betaStart).line}:${source.location(betaStart).column} '
    '${beta.text} ${second.text} ${expanded.text.replaceAll('\n', '|')}',
  );

  final scanner = SpanScanner('one, two\nthree', sourceUrl: 'scan.txt');
  final start = scanner.state;
  scanner.expect(RegExp(r'\w+'), name: 'word');
  final first = scanner.lastSpan!;
  scanner.expect(',');
  scanner.expect(RegExp(r'\s+'));
  final afterComma = scanner.state;
  scanner.expect(RegExp(r'\w+'), name: 'word');
  final secondWord = scanner.lastSpan!;
  scanner.state = afterComma;
  scanner.expect(RegExp(r'\w+'));
  scanner.expect(RegExp(r'\n'));
  scanner.expect(RegExp(r'\w+'));
  final tail = scanner.lastSpan!;
  print(
    'scan ${first.text}-${secondWord.text}-${tail.text} '
    '${scanner.line}:${scanner.column} '
    '${scanner.spanFrom(start).text.replaceAll('\n', '/')}',
  );

  final selector = BooleanSelector.parse('fast && (web || !slow)');
  final variables = selector.variables.toSet().toList()..sort();
  final result = selector.evaluate(_semantics);
  final union = selector.union(BooleanSelector.parse('cli'));
  final intersection = selector.intersection(BooleanSelector.parse('fast'));
  print(
    'selector ${variables.join(',')} $result '
    '${union.evaluate(_semantics)} ${intersection.evaluate(_semantics)} '
    '$selector',
  );

  try {
    BooleanSelector.parse(
      'known && missing',
    ).validate((name) => name == 'known');
  } on SourceSpanFormatException catch (error) {
    print('validate-error ${error.offset} ${error.message}');
  }

  try {
    BooleanSelector.parse('known &&');
  } on SourceSpanFormatException catch (error) {
    print('parse-error ${error.offset} ${error.message}');
  }
}

bool _semantics(String variable) {
  return switch (variable) {
    'fast' => true,
    'web' => false,
    'slow' => false,
    'cli' => true,
    _ => false,
  };
}
