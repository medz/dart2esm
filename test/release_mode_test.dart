import 'dart:io';

import 'package:dart2esm/src/app/compiler.dart';
import 'package:dart2esm/src/options.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  final fixtures = [
    p.join('classes', 'basic_classes.dart'),
    p.join('control_flow', 'exceptions.dart'),
    p.join('enums', 'basic_enums.dart'),
    p.join('functions', 'basic_functions.dart'),
    p.join('imports', 'relative_imports.dart'),
    p.join('libraries', 'collections.dart'),
    p.join('packages', 'path_usage.dart'),
    p.join('records', 'basic_records.dart'),
    p.join('syntax', 'patterns.dart'),
    p.join('variables', 'top_level_variables.dart'),
  ];

  for (final fixture in fixtures) {
    test(
      'release preserves $fixture behavior with smaller output',
      () async {
        final source = File(
          p.join('test', 'fixtures', 'specs', fixture),
        ).absolute;
        final debugGolden = File(p.setExtension(source.path, '.mjs'));
        final tempDir = await Directory.systemTemp.createTemp(
          'dart2esm-release-conformance-',
        );
        addTearDown(() => tempDir.deleteSync(recursive: true));
        final output = File(p.join(tempDir.path, 'main.mjs'));

        final result = await compileDartToEsm(
          Dart2EsmOptions(
            inputPath: source.path,
            outputPath: output.path,
            workingDirectory: Directory.current,
            optimization: Dart2EsmOptimizationLevel.release,
          ),
        );
        expect(result.success, isTrue, reason: result.diagnostics.join('\n'));

        final dart = await Process.run(Platform.resolvedExecutable, [
          source.path,
        ], workingDirectory: Directory.current.path);
        final node = await Process.run('node', [output.path]);
        expect(dart.exitCode, 0, reason: '${dart.stdout}\n${dart.stderr}');
        expect(node.exitCode, 0, reason: '${node.stdout}\n${node.stderr}');
        expect(node.stdout, dart.stdout);
        expect(node.stderr, dart.stderr);
        expect(output.lengthSync(), lessThan(debugGolden.lengthSync()));
      },
      timeout: const Timeout(Duration(minutes: 1)),
    );
  }
}
