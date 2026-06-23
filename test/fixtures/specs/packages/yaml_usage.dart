import 'package:yaml/yaml.dart';

void main() {
  const source = '''
name: dart2esm
version: 0.1.0
flags:
  - web
  - esm
nested:
  count: 2
  ok: true
flow: {a: 1, b: [x, y]}
''';

  final loaded = loadYaml(source) as YamlMap;
  final document = loadYamlDocument(
    source,
    sourceUrl: Uri.parse('memory:pubspec.yaml'),
  );
  final root = document.contents as YamlMap;
  final flags = root['flags'] as YamlList;
  final nested = root.nodes['nested']! as YamlMap;
  final flow = root.nodes['flow']! as YamlMap;
  final stream = loadYamlStream('---\na: 1\n---\n- b\n');
  final wrapped = YamlMap.wrap({
    'outer': [
      1,
      {'inner': 'value'},
    ],
  }, sourceUrl: 'memory:wrapped.yaml');
  final wrappedList = wrapped['outer'] as YamlList;
  final wrappedMap = wrappedList.nodes[1] as YamlMap;

  print(
    'yaml ${loaded['name']} ${root['version']} ${flags.join('|')} '
    '${flags.nodes.first.value} ${nested['count']} ${nested['ok']} '
    '${flow.style} ${flow['b'].join(',')} '
    '${document.span.sourceUrl} '
    '${root.span.start.line}:${root.span.end.line} '
    '${stream.length} ${stream[0]['a']} ${(stream[1] as YamlList)[0]} '
    '${wrappedList.length} ${wrappedMap['inner']} ${wrapped.style}',
  );
}
