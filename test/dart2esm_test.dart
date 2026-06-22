import 'dart:io';

import 'package:dart2esm/dart2esm.dart';
import 'package:dart2esm/src/compiler.dart';
import 'package:kernel/kernel.dart' as kernel;
import 'package:test/test.dart';

void main() {
  test('exposes package version', () {
    expect(packageVersion, '0.0.0');
  });

  test('compiles Dart input through Kernel to runnable ESM', () async {
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-test-');
    addTearDown(() => tempDir.deleteSync(recursive: true));

    final input = File('${tempDir.path}/main.dart')
      ..writeAsStringSync('''
void helper(String value) {
  print('helper: \$value');
}

void main() {
  final value = 40 + 2;
  helper('answer \$value');
}
''');
    final output = File('${tempDir.path}/main.mjs');

    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: input.path,
        outputPath: output.path,
        workingDirectory: tempDir,
      ),
    );

    expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
    expect(
      result.diagnostics,
      contains(startsWith('Kernel input accepted: format 130')),
    );
    expect(output.readAsStringSync(), contains('function main()'));

    final dartRun = await Process.run(Platform.resolvedExecutable, [
      input.path,
    ], workingDirectory: tempDir.path);
    final nodeRun = await Process.run('node', [
      output.path,
    ], workingDirectory: tempDir.path);
    expect(nodeRun.exitCode, dartRun.exitCode);
    expect(nodeRun.stdout, dartRun.stdout);
    expect(nodeRun.stderr, dartRun.stderr);
  });

  test('reads CFE Kernel component libraries and main procedure', () async {
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-reader-');
    addTearDown(() => tempDir.deleteSync(recursive: true));

    final input = File('${tempDir.path}/main.dart')
      ..writeAsStringSync('''
void helper(String value) {
  print('helper: \$value');
}

void main() {
  final value = 40 + 2;
  helper('answer \$value');
}
''');
    final dill = File('${tempDir.path}/main.dill');
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
    expect(
      component.libraries.map((library) => library.fileUri),
      contains(input.uri),
    );
    expect(component.mainMethod?.name.text, 'main');
    expect(component.mainMethod?.function.body, isNotNull);
  });

  test('compiles classes, constructors, fields, and methods', () async {
    await _expectSameDartAndNodeOutput('''
class Counter {
  int value;

  Counter(this.value);

  void add(int amount) {
    value = value + amount;
  }

  int get doubled => value * 2;
}

void main() {
  final counter = Counter(3);
  counter.add(4);
  print('value \${counter.value}');
  print('double \${counter.doubled}');
}
''');
  });

  test('compiles optional positional and named parameters', () async {
    await _expectSameDartAndNodeOutput('''
String describe(String name, [String punctuation = '!', int repeat = 1]) {
  var out = '';
  for (var i = 0; i < repeat; i = i + 1) {
    out = '\$out\$name\$punctuation';
  }
  return out;
}

String tag(String value, {String prefix = 'item', required int index}) {
  return '\$prefix:\$index:\$value';
}

class Formatter {
  String wrap(String value, {String left = '[', String right = ']'}) {
    return '\$left\$value\$right';
  }
}

void main() {
  print(describe('a'));
  print(describe('b', '?', 2));
  print(tag('x', index: 3));
  print(tag('y', prefix: 'custom', index: 4));
  final formatter = Formatter();
  print(formatter.wrap('z'));
  print(formatter.wrap('z', right: ')', left: '('));
}
''');
  });
}

Future<void> _expectSameDartAndNodeOutput(String source) async {
  final tempDir = await Directory.systemTemp.createTemp('dart2esm-golden-');
  addTearDown(() => tempDir.deleteSync(recursive: true));

  final input = File('${tempDir.path}/main.dart')..writeAsStringSync(source);
  final output = File('${tempDir.path}/main.mjs');
  final result = await compileDartToEsm(
    Dart2EsmOptions(
      inputPath: input.path,
      outputPath: output.path,
      workingDirectory: tempDir,
    ),
  );
  expect(result.success, isTrue, reason: result.diagnostics.join('\n'));

  final dartRun = await Process.run(Platform.resolvedExecutable, [
    input.path,
  ], workingDirectory: tempDir.path);
  final nodeRun = await Process.run('node', [
    output.path,
  ], workingDirectory: tempDir.path);
  expect(nodeRun.exitCode, dartRun.exitCode);
  expect(nodeRun.stdout, dartRun.stdout);
  expect(nodeRun.stderr, dartRun.stderr);
}
