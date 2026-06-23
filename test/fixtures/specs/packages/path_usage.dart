import 'package:path/path.dart' as p;

void main() {
  final context = p.Context(style: p.Style.posix);
  final normalized = context.normalize('/a/./b/../c');
  final joined = context.join('a', 'b', 'c.dart');
  final without = p.withoutExtension('lib/main.dart');
  final url = p.url.join('https://example.test/a/', '../b');
  print('path $normalized $joined $without $url ${p.equals('a/b', 'a/b')}');
}
