import 'dart:io';

import 'package:dart2esm/src/app/cli.dart';
import 'package:dart2esm/dart2esm.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  test(
    'source auto platform resolves to a concrete compiler profile',
    () async {
      final tempDir = await Directory.systemTemp.createTemp(
        'dart2esm-profile-',
      );
      addTearDown(() => tempDir.deleteSync(recursive: true));
      final source = File(p.join(tempDir.path, 'main.dart'))
        ..writeAsStringSync("void main() => print('ok');\n");
      final output = File(p.join(tempDir.path, 'main.mjs'));

      final result = await compileDartToEsm(
        Dart2EsmOptions(
          inputPath: source.path,
          outputPath: output.path,
          workingDirectory: tempDir,
        ),
      );

      expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
      expect(result.profile?.platform, Dart2EsmPlatform.node);
      expect(result.profile?.ecmaTarget, Dart2EsmEcmaTarget.es2022);
      expect(result.profile?.optimization, Dart2EsmOptimizationLevel.debug);
      expect(result.diagnosticEntries.map((entry) => entry.code), [
        'D2E0001',
        'D2E0002',
      ]);
    },
  );

  test('Kernel input requires an explicit host profile', () async {
    final tempDir = await Directory.systemTemp.createTemp(
      'dart2esm-dill-profile-',
    );
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final input = File(p.join(tempDir.path, 'input.dill'))
      ..writeAsBytesSync(const []);

    await expectLater(
      compileDartToEsm(
        Dart2EsmOptions(
          inputPath: input.path,
          outputPath: p.join(tempDir.path, 'output.mjs'),
          workingDirectory: tempDir,
        ),
      ),
      throwsA(
        isA<Dart2EsmUsageException>().having(
          (error) => error.message,
          'message',
          contains('explicit --platform'),
        ),
      ),
    );
  });

  test(
    'unsupported lowering reports a stable diagnostic with source',
    () async {
      final tempDir = await Directory.systemTemp.createTemp(
        'dart2esm-diagnostic-',
      );
      addTearDown(() => tempDir.deleteSync(recursive: true));
      final source = File(p.join(tempDir.path, 'main.dart'))
        ..writeAsStringSync('''
import 'dart:isolate';

Future<void> main() async {
  final port = ReceivePort();
  await Isolate.spawn((SendPort port) => port.send('done'), port.sendPort);
}
''');

      final result = await compileDartToEsm(
        Dart2EsmOptions(
          inputPath: source.path,
          outputPath: p.join(tempDir.path, 'output.mjs'),
          workingDirectory: tempDir,
          platform: Dart2EsmPlatform.node,
        ),
      );

      expect(result.success, isFalse);
      expect(result.diagnosticEntries, hasLength(1));
      final diagnostic = result.diagnosticEntries.single;
      expect(diagnostic.code, 'D2E2002');
      expect(diagnostic.span?.uri, source.uri);
      expect(diagnostic.span?.line, greaterThan(0));
    },
  );

  test('release output is smaller and behavior-equivalent to debug', () async {
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-release-');
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final source = File(
      p.join('test', 'fixtures', 'specs', 'functions', 'basic_functions.dart'),
    ).absolute;
    final debugOutput = File(p.join(tempDir.path, 'debug.mjs'));
    final releaseOutput = File(p.join(tempDir.path, 'release.mjs'));

    for (final entry in [
      (output: debugOutput, mode: Dart2EsmOptimizationLevel.debug),
      (output: releaseOutput, mode: Dart2EsmOptimizationLevel.release),
    ]) {
      final result = await compileDartToEsm(
        Dart2EsmOptions(
          inputPath: source.path,
          outputPath: entry.output.path,
          workingDirectory: Directory.current,
          optimization: entry.mode,
        ),
      );
      expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
      expect(result.profile?.optimization, entry.mode);
    }

    final debugRun = await Process.run('node', [debugOutput.path]);
    final releaseRun = await Process.run('node', [releaseOutput.path]);
    expect(debugRun.exitCode, 0);
    expect(releaseRun.exitCode, 0);
    expect(releaseRun.stdout, debugRun.stdout);
    expect(releaseOutput.lengthSync(), lessThan(debugOutput.lengthSync()));
    expect(releaseOutput.readAsStringSync(), isNot(startsWith('//')));
  });

  test('CLI accepts explicit ECMAScript target and release mode', () async {
    final tempDir = await Directory.systemTemp.createTemp(
      'dart2esm-cli-profile-',
    );
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final source = File(p.join(tempDir.path, 'main.dart'))
      ..writeAsStringSync('void main() {}\n');
    final output = File(p.join(tempDir.path, 'main.mjs'));
    final stdoutSink = File(p.join(tempDir.path, 'stdout.log')).openWrite();
    final stderrSink = File(p.join(tempDir.path, 'stderr.log')).openWrite();

    final code = await runDart2Esm(
      [source.path, '-o', output.path, '--target=es2023', '--mode=release'],
      stdoutSink: stdoutSink,
      stderrSink: stderrSink,
    );
    await stdoutSink.close();
    await stderrSink.close();

    expect(code, ExitCode.success);
    expect(output.readAsStringSync(), isNot(startsWith('//')));
  });
}
