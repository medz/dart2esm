import 'dart:io';

import 'package:dart2esm/src/cli.dart';
import 'package:dart2esm/src/compiler.dart';
import 'package:kernel/kernel.dart' as kernel;
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  final fixtureDir = Directory('test/fixtures/specs');

  test('CLI version matches package metadata', () async {
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-version-');
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final stdoutLog = File(p.join(tempDir.path, 'stdout.log')).openWrite();
    final stderrLog = File(p.join(tempDir.path, 'stderr.log')).openWrite();

    final exitCode = await runDart2Esm(
      ['--version'],
      stdoutSink: stdoutLog,
      stderrSink: stderrLog,
    );
    await stdoutLog.close();
    await stderrLog.close();

    final pubspec = File('pubspec.yaml').readAsStringSync();
    final version = RegExp(
      r'^version: (.+)$',
      multiLine: true,
    ).firstMatch(pubspec)!.group(1);
    expect(exitCode, ExitCode.success);
    expect(
      File(p.join(tempDir.path, 'stdout.log')).readAsStringSync(),
      'dart2esm $version\n',
    );
    expect(
      File(p.join(tempDir.path, 'stderr.log')).readAsStringSync(),
      isEmpty,
    );
  });

  test('compiles Dart input through Kernel to runnable ESM', () async {
    final fixture = File(
      p.join(fixtureDir.path, 'functions', 'basic_functions.dart'),
    );
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
      File(
        p.join(fixtureDir.path, 'functions', 'basic_functions.mjs'),
      ).readAsStringSync(),
    );
    await _expectSameDartAndNodeOutput(fixture, output);
  });

  test('reads CFE Kernel component libraries and main procedure', () async {
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-reader-');
    addTearDown(() => tempDir.deleteSync(recursive: true));

    final input = File(p.join(tempDir.path, 'main.dart'))
      ..writeAsStringSync(
        File(
          p.join(fixtureDir.path, 'functions', 'basic_functions.dart'),
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

  test('can emit an ESM module without running main', () async {
    final fixture = _GoldenFixture(
      root: fixtureDir,
      source: File(
        p.join(fixtureDir.path, 'functions', 'basic_functions.dart'),
      ),
      expectedEsm: File(
        p.join(fixtureDir.path, 'functions', 'basic_functions.mjs'),
      ),
    );
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-no-main-');
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final output = File(p.join(tempDir.path, 'basic_functions.mjs'));

    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: fixture.source.path,
        outputPath: output.path,
        workingDirectory: Directory.current,
        runMain: false,
      ),
    );

    expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
    expect(output.readAsStringSync(), _withoutMainCall(fixture.expectedCode));
  });

  test('CLI --no-run-main omits the main invocation', () async {
    final fixture = _GoldenFixture(
      root: fixtureDir,
      source: File(
        p.join(fixtureDir.path, 'functions', 'basic_functions.dart'),
      ),
      expectedEsm: File(
        p.join(fixtureDir.path, 'functions', 'basic_functions.mjs'),
      ),
    );
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-cli-');
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final output = File(p.join(tempDir.path, 'basic_functions.mjs'));
    final stdoutLog = File(p.join(tempDir.path, 'stdout.log')).openWrite();
    final stderrLog = File(p.join(tempDir.path, 'stderr.log')).openWrite();

    final exitCode = await runDart2Esm(
      [fixture.source.path, '-o', output.path, '--no-run-main'],
      stdoutSink: stdoutLog,
      stderrSink: stderrLog,
    );
    await stdoutLog.close();
    await stderrLog.close();

    expect(exitCode, ExitCode.success);
    expect(output.readAsStringSync(), _withoutMainCall(fixture.expectedCode));
  });

  test(
    'no-run-main import exposes initialized top-level ESM bindings',
    () async {
      final fixture = _GoldenFixture(
        root: fixtureDir,
        source: File(
          p.join(fixtureDir.path, 'variables', 'top_level_variables.dart'),
        ),
        expectedEsm: File(
          p.join(fixtureDir.path, 'variables', 'top_level_variables.mjs'),
        ),
      );
      final tempDir = await Directory.systemTemp.createTemp('dart2esm-var-');
      addTearDown(() => tempDir.deleteSync(recursive: true));
      final output = File(p.join(tempDir.path, 'vars.mjs'));
      final consumer = File(p.join(tempDir.path, 'consumer.mjs'))
        ..writeAsStringSync(
          "import { assignFirst, finalValue } from './vars.mjs';\n"
          "console.log('values ' + assignFirst + ' ' + finalValue);\n",
        );

      final result = await compileDartToEsm(
        Dart2EsmOptions(
          inputPath: fixture.source.path,
          outputPath: output.path,
          workingDirectory: Directory.current,
          runMain: false,
        ),
      );

      expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
      expect(output.readAsStringSync(), _withoutMainCall(fixture.expectedCode));

      final nodeRun = await Process.run('node', [
        consumer.path,
      ], workingDirectory: tempDir.path);
      expect(
        nodeRun.exitCode,
        0,
        reason: '${nodeRun.stdout}\n${nodeRun.stderr}',
      );
      expect(
        nodeRun.stdout,
        'init readFirst\n'
        'init assignFirst\n'
        'init finalValue\n'
        'values 20 30\n',
      );
      expect(nodeRun.stderr, isEmpty);
    },
  );

  test('direct named ESM import reads primitive top-level variables', () async {
    final fixture = _GoldenFixture(
      root: fixtureDir,
      source: File(
        p.join(fixtureDir.path, 'variables', 'primitive_exports.dart'),
      ),
      expectedEsm: File(
        p.join(fixtureDir.path, 'variables', 'primitive_exports.mjs'),
      ),
    );
    final tempDir = await Directory.systemTemp.createTemp(
      'dart2esm-import-var-',
    );
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final output = File(p.join(tempDir.path, 'a.mjs'));
    final consumer = File(p.join(tempDir.path, 'b.mjs'))
      ..writeAsStringSync("import { c } from './a.mjs';\nconsole.log(c);\n");

    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: fixture.source.path,
        outputPath: output.path,
        workingDirectory: Directory.current,
        runMain: false,
      ),
    );

    expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
    expect(output.readAsStringSync(), _withoutMainCall(fixture.expectedCode));

    final nodeRun = await Process.run('node', [
      consumer.path,
    ], workingDirectory: tempDir.path);
    expect(nodeRun.exitCode, 0, reason: '${nodeRun.stdout}\n${nodeRun.stderr}');
    expect(nodeRun.stdout, '1\n');
    expect(nodeRun.stderr, isEmpty);
  });

  test('direct class imports preserve interface instanceof checks', () async {
    final fixture = _GoldenFixture(
      root: fixtureDir,
      source: File(p.join(fixtureDir.path, 'classes', 'interfaces.dart')),
      expectedEsm: File(p.join(fixtureDir.path, 'classes', 'interfaces.mjs')),
    );
    final tempDir = await Directory.systemTemp.createTemp(
      'dart2esm-import-interface-',
    );
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final output = File(p.join(tempDir.path, 'interfaces.mjs'));
    final consumer = File(p.join(tempDir.path, 'consumer.mjs'))
      ..writeAsStringSync(
        "import { NamedThing, Person } from './interfaces.mjs';\n"
        "const person = new Person('ada');\n"
        "console.log(person.name);\n"
        "console.log(person.describe());\n"
        "console.log(person instanceof NamedThing);\n",
      );

    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: fixture.source.path,
        outputPath: output.path,
        workingDirectory: Directory.current,
        runMain: false,
      ),
    );

    expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
    expect(output.readAsStringSync(), _withoutMainCall(fixture.expectedCode));

    final nodeRun = await Process.run('node', [
      consumer.path,
    ], workingDirectory: tempDir.path);
    expect(nodeRun.exitCode, 0, reason: '${nodeRun.stdout}\n${nodeRun.stderr}');
    expect(
      nodeRun.stdout,
      'ada\n'
      'person:ada\n'
      'true\n',
    );
    expect(nodeRun.stderr, isEmpty);
  });

  test('direct extension type imports expose an ESM class facade', () async {
    final fixture = _GoldenFixture(
      root: fixtureDir,
      source: File(p.join(fixtureDir.path, 'classes', 'extension_types.dart')),
      expectedEsm: File(
        p.join(fixtureDir.path, 'classes', 'extension_types.mjs'),
      ),
    );
    final tempDir = await Directory.systemTemp.createTemp(
      'dart2esm-import-extension-type-',
    );
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final output = File(p.join(tempDir.path, 'extension_types.mjs'));
    final consumer = File(p.join(tempDir.path, 'consumer.mjs'))
      ..writeAsStringSync(
        "import { UserId } from './extension_types.mjs';\n"
        "const id = new UserId(5);\n"
        "console.log(id.value);\n"
        "console.log(id.plus(2));\n"
        "console.log(id.doubled);\n"
        "id.observed = 1;\n"
        "console.log(id.value);\n"
        "console.log(id instanceof UserId);\n"
        "const parsed = UserId.parse('9');\n"
        "console.log(parsed.value);\n"
        "console.log(UserId.zeroValue);\n"
        "console.log(UserId.defaultValue);\n"
        "console.log(UserId.current.value);\n"
        "UserId.current = UserId.parse('6');\n"
        "console.log(UserId.current.value);\n"
        "console.log(UserId.zero().value);\n"
        "console.log(id['+'](3).value);\n",
      );

    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: fixture.source.path,
        outputPath: output.path,
        workingDirectory: Directory.current,
        runMain: false,
      ),
    );

    expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
    expect(output.readAsStringSync(), _withoutMainCall(fixture.expectedCode));

    final nodeRun = await Process.run('node', [
      consumer.path,
    ], workingDirectory: tempDir.path);
    expect(nodeRun.exitCode, 0, reason: '${nodeRun.stdout}\n${nodeRun.stderr}');
    expect(
      nodeRun.stdout,
      '5\n'
      '7\n'
      '10\n'
      '5\n'
      'true\n'
      '9\n'
      '0\n'
      '12\n'
      '1\n'
      '6\n'
      '0\n'
      '8\n',
    );
    expect(nodeRun.stderr, isEmpty);
  });

  for (final fixture in _goldenFixtures(fixtureDir)) {
    test('matches ${fixture.id} ESM golden and runtime behavior', () async {
      await _expectGoldenFixture(fixture);
    });
  }
}

String _withoutMainCall(String code) {
  const mainCall = '\nmain();\n';
  expect(code.endsWith(mainCall), isTrue);
  return '${code.substring(0, code.length - mainCall.length)}\n';
}

List<_GoldenFixture> _goldenFixtures(Directory fixtureDir) {
  final sources =
      fixtureDir
          .listSync(recursive: true)
          .whereType<File>()
          .where((file) => file.path.endsWith('.dart'))
          .where((file) => File(p.setExtension(file.path, '.mjs')).existsSync())
          .toList()
        ..sort((left, right) => left.path.compareTo(right.path));
  return [
    for (final source in sources)
      _GoldenFixture(
        root: fixtureDir,
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
  const _GoldenFixture({
    required this.root,
    required this.source,
    required this.expectedEsm,
  });

  final Directory root;
  final File source;
  final File expectedEsm;

  String get expectedCode => expectedEsm.readAsStringSync();

  String get id => p.withoutExtension(p.relative(source.path, from: root.path));

  String get name => p.basenameWithoutExtension(source.path);
}
