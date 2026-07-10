import 'dart:io';

import 'package:dart2esm/dart2esm.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  test('release retains only reachable imported class members', () async {
    final tempDir = await Directory.systemTemp.createTemp(
      'dart2esm-member-reachability-',
    );
    addTearDown(() => tempDir.deleteSync(recursive: true));
    File(p.join(tempDir.path, 'helper.dart')).writeAsStringSync('''
abstract class Base {
  String speak();
  String unusedBase() => 'dead-member-base';
}

class Worker extends Base {
  Worker() : prefix = 'ok';

  final String prefix;

  @override
  String speak() => '\$prefix:speak';

  String dynamicUsed() => '\$prefix:dynamic';
  String unused() => 'dead-member-instance';

  static String staticUsed() => 'static';
  static String staticUnused() => 'dead-member-static';
}

Base makeWorker() => Worker();
dynamic makeDynamicWorker() => Worker();
String callStatic() => Worker.staticUsed();
''');
    final source = File(p.join(tempDir.path, 'main.dart'))
      ..writeAsStringSync('''
import 'helper.dart';

void main() {
  print(makeWorker().speak());
  print(makeDynamicWorker().dynamicUsed());
  print(callStatic());
}
''');
    final output = File(p.join(tempDir.path, 'main.mjs'));

    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: source.path,
        outputPath: output.path,
        workingDirectory: tempDir,
        optimization: Dart2EsmOptimizationLevel.release,
      ),
    );

    expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
    final code = output.readAsStringSync();
    expect(code, isNot(contains('dead-member-base')));
    expect(code, isNot(contains('dead-member-instance')));
    expect(code, isNot(contains('dead-member-static')));
    final node = await Process.run('node', [output.path]);
    expect(node.exitCode, 0, reason: '${node.stdout}\n${node.stderr}');
    expect(node.stdout, 'ok:speak\nok:dynamic\nstatic\n');
  });

  test('dynamic dispatch retains imported noSuchMethod overrides', () async {
    final tempDir = await Directory.systemTemp.createTemp(
      'dart2esm-member-nosuchmethod-',
    );
    addTearDown(() => tempDir.deleteSync(recursive: true));
    File(p.join(tempDir.path, 'helper.dart')).writeAsStringSync('''
class Proxy {
  @override
  dynamic noSuchMethod(Invocation invocation) => 'missing';

  String unused() => 'dead-proxy-member';
}

dynamic makeProxy() => Proxy();
''');
    final source = File(p.join(tempDir.path, 'main.dart'))
      ..writeAsStringSync('''
import 'helper.dart';

void main() {
  print(makeProxy().unknown());
}
''');
    final output = File(p.join(tempDir.path, 'main.mjs'));

    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: source.path,
        outputPath: output.path,
        workingDirectory: tempDir,
        optimization: Dart2EsmOptimizationLevel.release,
      ),
    );

    expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
    expect(output.readAsStringSync(), isNot(contains('dead-proxy-member')));
    final node = await Process.run('node', [output.path]);
    expect(node.exitCode, 0, reason: '${node.stdout}\n${node.stderr}');
    expect(node.stdout, 'missing\n');
  });

  test(
    'release preserves the complete public API of exported classes',
    () async {
      final tempDir = await Directory.systemTemp.createTemp(
        'dart2esm-member-public-api-',
      );
      addTearDown(() => tempDir.deleteSync(recursive: true));
      final source = File(p.join(tempDir.path, 'main.dart'))
        ..writeAsStringSync('''
class PublicApi {
  String calledOnlyFromJavaScript() => 'public-api';
}

void main() {}
''');
      final output = File(p.join(tempDir.path, 'main.mjs'));
      final consumer = File(p.join(tempDir.path, 'consumer.mjs'))
        ..writeAsStringSync('''
import { PublicApi } from './main.mjs';
console.log(new PublicApi().calledOnlyFromJavaScript());
''');

      final result = await compileDartToEsm(
        Dart2EsmOptions(
          inputPath: source.path,
          outputPath: output.path,
          workingDirectory: tempDir,
          runMain: false,
          optimization: Dart2EsmOptimizationLevel.release,
        ),
      );

      expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
      final node = await Process.run('node', [consumer.path]);
      expect(node.exitCode, 0, reason: '${node.stdout}\n${node.stderr}');
      expect(node.stdout, 'public-api\n');
    },
  );
}
