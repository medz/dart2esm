import 'dart:io';

import 'package:dart2esm/src/compiler.dart';
import 'package:kernel/kernel.dart' as kernel;
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  final fixtureDir = Directory('test/fixtures/goldens');

  test('compiles Dart input through Kernel to runnable ESM', () async {
    final fixture = File(p.join(fixtureDir.path, 'basic_functions.dart'));
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-test-');
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final output = File(p.join(tempDir.path, 'main.mjs'));

    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: fixture.path,
        outputPath: output.path,
        workingDirectory: Directory.current,
      ),
    );

    expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
    expect(result.diagnostics, hasLength(2));
    expect(
      result.diagnostics.first,
      matches(
        RegExp(r'^Kernel input accepted: format 130, SDK hash [0-9a-f]+\.$'),
      ),
    );
    expect(
      output.readAsStringSync(),
      File(p.join(fixtureDir.path, 'basic_functions.mjs')).readAsStringSync(),
    );
    await _expectSameDartAndNodeOutput(fixture, output);
  });

  test('reads CFE Kernel component libraries and main procedure', () async {
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-reader-');
    addTearDown(() => tempDir.deleteSync(recursive: true));

    final input = File(p.join(tempDir.path, 'main.dart'))
      ..writeAsStringSync(
        File(
          p.join(fixtureDir.path, 'basic_functions.dart'),
        ).readAsStringSync(),
      );
    final dill = File(p.join(tempDir.path, 'main.dill'));
    final result = await Process.run(Platform.resolvedExecutable, [
      'compile',
      'kernel',
      '--no-link-platform',
      '--embed-sources',
      '-o',
      dill.path,
      input.path,
    ], workingDirectory: tempDir.path);

    expect(result.exitCode, 0, reason: '${result.stdout}\n${result.stderr}');

    final component = kernel.loadComponentFromBytes(dill.readAsBytesSync());
    expect(component.libraries.map((library) => library.fileUri).toList(), [
      input.uri,
    ]);
    expect(component.mainMethod?.name.text, 'main');
    expect(component.mainMethod?.function.body, isNotNull);
  });

  for (final fixture in _goldenFixtures(fixtureDir)) {
    test('matches ${fixture.name} ESM golden and runtime behavior', () async {
      await _expectGoldenFixture(fixture);
    });
  }
}

List<_GoldenFixture> _goldenFixtures(Directory fixtureDir) {
  final sources =
      fixtureDir
          .listSync()
          .whereType<File>()
          .where((file) => file.path.endsWith('.dart'))
          .toList()
        ..sort((left, right) => left.path.compareTo(right.path));
  return [
    for (final source in sources)
      _GoldenFixture(
        source: source,
        expectedEsm: File(p.setExtension(source.path, '.mjs')),
      ),
  ];
}

Future<void> _expectGoldenFixture(_GoldenFixture fixture) async {
  final tempDir = await Directory.systemTemp.createTemp('dart2esm-golden-');
  addTearDown(() => tempDir.deleteSync(recursive: true));

  final output = File(p.join(tempDir.path, '${fixture.name}.mjs'));
  final result = await compileDartToEsm(
    Dart2EsmOptions(
      inputPath: fixture.source.path,
      outputPath: output.path,
      workingDirectory: Directory.current,
    ),
  );
  expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
  expect(output.readAsStringSync(), fixture.expectedEsm.readAsStringSync());
  await _expectSameDartAndNodeOutput(fixture.source, output);
}

Future<void> _expectSameDartAndNodeOutput(File input, File output) async {
  final dartRun = await Process.run(Platform.resolvedExecutable, [
    input.path,
  ], workingDirectory: Directory.current.path);
  final nodeRun = await Process.run('node', [
    output.path,
  ], workingDirectory: output.parent.path);
  expect(nodeRun.exitCode, dartRun.exitCode);
  expect(nodeRun.stdout, dartRun.stdout);
  expect(nodeRun.stderr, dartRun.stderr);
}

final class _GoldenFixture {
  const _GoldenFixture({required this.source, required this.expectedEsm});

  final File source;
  final File expectedEsm;

  String get name => p.basenameWithoutExtension(source.path);
}
