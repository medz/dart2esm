import 'dart:convert';
import 'dart:io';

import 'package:dart2esm/src/app/compiler.dart';
import 'package:dart2esm/src/foundation/diagnostics/metrics.dart';
import 'package:dart2esm/src/options.dart';
import 'package:path/path.dart' as p;

Future<void> main(List<String> arguments) async {
  final args = [...arguments];
  final compareDart2Js = args.remove('--compare-dart2js');
  if (args.any((argument) => argument.startsWith('-'))) {
    stderr.writeln(
      'Usage: dart run tool/benchmark.dart [--compare-dart2js] [input.dart ...]',
    );
    exitCode = 64;
    return;
  }

  final sources = args.isEmpty
      ? [
          p.join('example', 'hello.dart'),
          p.join(
            'test',
            'fixtures',
            'specs',
            'functions',
            'basic_functions.dart',
          ),
          p.join('test', 'fixtures', 'specs', 'packages', 'yaml_usage.dart'),
        ]
      : args;
  final temporaryDirectory = await Directory.systemTemp.createTemp(
    'dart2esm-benchmark-',
  );
  try {
    final results = <Map<String, Object?>>[];
    for (final sourcePath in sources) {
      final source = File(sourcePath).absolute;
      if (!source.existsSync()) {
        throw ArgumentError('Benchmark input does not exist: ${source.path}');
      }
      for (final mode in Dart2EsmOptimizationLevel.values) {
        final output = File(
          p.join(
            temporaryDirectory.path,
            '${p.basenameWithoutExtension(source.path)}-${mode.cliName}.mjs',
          ),
        );
        final stopwatch = Stopwatch()..start();
        final result = await compileDartToEsm(
          Dart2EsmOptions(
            inputPath: source.path,
            outputPath: output.path,
            workingDirectory: Directory.current,
            optimization: mode,
            collectMetrics: true,
          ),
        );
        stopwatch.stop();
        if (!result.success) {
          throw StateError(result.diagnostics.join('\n'));
        }
        final metrics = result.esmMetrics!;
        CodeSizeMetrics? baseline;
        int? dart2jsCompileMs;
        if (compareDart2Js && mode == Dart2EsmOptimizationLevel.release) {
          final baselineOutput = File(
            p.join(
              temporaryDirectory.path,
              '${p.basenameWithoutExtension(source.path)}-dart2js.js',
            ),
          );
          final baselineStopwatch = Stopwatch()..start();
          final baselineResult = await Process.run(
            Platform.resolvedExecutable,
            ['compile', 'js', '-O2', '-o', baselineOutput.path, source.path],
            workingDirectory: Directory.current.path,
          );
          baselineStopwatch.stop();
          if (baselineResult.exitCode != 0) {
            throw StateError(
              '${baselineResult.stdout}\n${baselineResult.stderr}',
            );
          }
          dart2jsCompileMs = baselineStopwatch.elapsedMilliseconds;
          baseline = await measureCodeSizeFile('dart2js -O2', baselineOutput);
        }
        results.add({
          'fixture': p.relative(source.path),
          'mode': mode.cliName,
          'compileMs': stopwatch.elapsedMilliseconds,
          'rawBytes': metrics.rawBytes,
          'gzipBytes': metrics.gzipBytes,
          'lines': metrics.lineCount,
          'runtimeHelpers': metrics.runtimeHelperCount,
          if (baseline != null) ...{
            'dart2jsCompileMs': dart2jsCompileMs,
            'dart2jsRawBytes': baseline.rawBytes,
            'dart2jsGzipBytes': baseline.gzipBytes,
            'rawRatio': metrics.rawBytes / baseline.rawBytes,
            'gzipRatio': metrics.gzipBytes / baseline.gzipBytes,
          },
        });
      }
    }
    stdout.writeln(const JsonEncoder.withIndent('  ').convert(results));
  } finally {
    await temporaryDirectory.delete(recursive: true);
  }
}
