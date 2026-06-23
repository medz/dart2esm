import 'package:glob/glob.dart';
import 'package:path/path.dart' as p;

void main() {
  final dartSources = Glob('lib/{*.dart,src/**.dart}');
  final recursiveAssets = Glob('assets/**', recursive: true);
  final caseInsensitive = Glob(
    'README.[mM][dD]',
    context: p.posix,
    caseSensitive: false,
  );
  final urlGlob = Glob(
    'https://example.com/{docs,api}/**.html',
    context: p.url,
  );
  final escaped = Glob(Glob.quote(r'build/{literal}/*.dart'), context: p.posix);
  final pattern = Glob('test/*_test.dart', context: p.posix);
  final match = pattern.matchAsPrefix('test/glob_test.dart');
  final quoted = Glob.quote(r'foo*[bar]?.dart');

  print(
    'glob '
    '${dartSources.matches('lib/main.dart')} '
    '${dartSources.matches('lib/src/deep/file.dart')} '
    '${dartSources.matches('lib/src/deep/file.txt')} '
    '${recursiveAssets.matches('assets/icons/logo.svg')} '
    '${recursiveAssets.matches('assets')} '
    '${caseInsensitive.matches('readme.md')} '
    '${urlGlob.matches('https://example.com/docs/index.html')} '
    '${urlGlob.matches('https://example.com/assets/index.html')} '
    '${escaped.matches(r'build/{literal}/*.dart')} '
    '${pattern.allMatches('test/glob_test.dart').length} '
    '${match?.group(0)} ${match?.start}:${match?.end}:${match?.groupCount} '
    '${match?.groups([0]).join('|')} '
    '$quoted',
  );
}
