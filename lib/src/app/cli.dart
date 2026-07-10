import 'dart:io';

import 'package:args/args.dart';
import 'package:dart2esm/dart2esm.dart';
import 'package:dart2esm/src/foundation/diagnostics/metrics.dart';

Future<int> runDart2Esm(
  List<String> args, {
  IOSink? stdoutSink,
  IOSink? stderrSink,
}) async {
  final out = stdoutSink ?? stdout;
  final err = stderrSink ?? stderr;
  final parser = _buildParser();

  ArgResults results;
  try {
    results = parser.parse(args);
  } on FormatException catch (error) {
    err.writeln(error.message);
    err.writeln();
    err.writeln(_usage(parser));
    return ExitCode.usage;
  }

  if (results['help'] as bool) {
    out.writeln(_usage(parser));
    return ExitCode.success;
  }

  if (results['version'] as bool) {
    out.writeln('dart2esm $packageVersion');
    return ExitCode.success;
  }

  final rest = results.rest;
  if (rest.length != 1) {
    err.writeln('Expected exactly one input file.');
    err.writeln();
    err.writeln(_usage(parser));
    return ExitCode.usage;
  }

  final output = results['output'] as String?;
  if (output == null || output.isEmpty) {
    err.writeln('Missing required output path: -o <output.mjs>.');
    err.writeln();
    err.writeln(_usage(parser));
    return ExitCode.usage;
  }

  try {
    final printMetrics =
        results['metrics'] as bool || results['compare-dart2js'] as bool;
    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: rest.single,
        outputPath: output,
        workingDirectory: Directory.current,
        packagesPath: results['packages'] as String?,
        environmentDefines: results['define'] as List<String>,
        runMain: results['run-main'] as bool,
        platform: _parsePlatform(results['platform'] as String),
        ecmaTarget: _parseEcmaTarget(results['target'] as String),
        optimization: _parseOptimization(results['mode'] as String),
        collectMetrics: printMetrics,
        compareDart2JsMetrics: results['compare-dart2js'] as bool,
      ),
    );
    for (final diagnostic in result.diagnosticEntries) {
      err.writeln(diagnostic.render());
    }
    final esmMetrics = result.esmMetrics;
    if (result.success && esmMetrics != null) {
      for (final line in formatCodeSizeMetricsReport(
        dart2esm: esmMetrics,
        dart2js: result.dart2jsMetrics,
      )) {
        out.writeln(line);
      }
    }
    return result.success ? ExitCode.success : ExitCode.software;
  } on Dart2EsmUsageException catch (error) {
    err.writeln(error.message);
    return ExitCode.usage;
  } on Dart2EsmException catch (error) {
    err.writeln(error.message);
    return ExitCode.software;
  }
}

ArgParser _buildParser() {
  return ArgParser()
    ..addOption(
      'output',
      abbr: 'o',
      valueHelp: 'output.mjs',
      help: 'Write the generated ESM module to this path.',
    )
    ..addOption(
      'packages',
      valueHelp: 'package_config.json',
      help: 'Use an explicit package configuration when compiling Dart input.',
    )
    ..addMultiOption(
      'define',
      abbr: 'D',
      valueHelp: 'key=value',
      help: 'Define a compile-time environment declaration.',
      splitCommas: true,
    )
    ..addOption(
      'platform',
      allowed: [
        for (final platform in Dart2EsmPlatform.values) platform.cliName,
      ],
      defaultsTo: Dart2EsmPlatform.auto.cliName,
      help: 'Select host platform semantics for dart:* and Web APIs.',
    )
    ..addOption(
      'target',
      allowed: [for (final target in Dart2EsmEcmaTarget.values) target.cliName],
      defaultsTo: Dart2EsmEcmaTarget.es2022.cliName,
      help: 'Set the minimum ECMAScript target.',
    )
    ..addOption(
      'mode',
      allowed: [
        for (final level in Dart2EsmOptimizationLevel.values) level.cliName,
      ],
      defaultsTo: Dart2EsmOptimizationLevel.debug.cliName,
      help: 'Select readable debug or optimized release output.',
    )
    ..addFlag(
      'run-main',
      defaultsTo: true,
      help: 'Emit a top-level main() invocation after module declarations.',
    )
    ..addFlag(
      'metrics',
      defaultsTo: false,
      negatable: false,
      help: 'Print raw/gzip/line/helper metrics for the generated ESM.',
    )
    ..addFlag(
      'compare-dart2js',
      defaultsTo: false,
      negatable: false,
      help: 'Also compile with dart compile js -O2 and print size ratios.',
    )
    ..addFlag('version', negatable: false, help: 'Print the dart2esm version.')
    ..addFlag(
      'help',
      abbr: 'h',
      negatable: false,
      help: 'Show this help message.',
    );
}

Dart2EsmPlatform _parsePlatform(String value) {
  final platform = Dart2EsmPlatform.tryParse(value);
  if (platform == null) {
    throw Dart2EsmUsageException('Unsupported platform: $value');
  }
  return platform;
}

Dart2EsmEcmaTarget _parseEcmaTarget(String value) {
  final target = Dart2EsmEcmaTarget.tryParse(value);
  if (target == null) {
    throw Dart2EsmUsageException('Unsupported ECMAScript target: $value');
  }
  return target;
}

Dart2EsmOptimizationLevel _parseOptimization(String value) {
  final level = Dart2EsmOptimizationLevel.tryParse(value);
  if (level == null) {
    throw Dart2EsmUsageException('Unsupported compiler mode: $value');
  }
  return level;
}

String _usage(ArgParser parser) {
  return '''
dart2esm $packageVersion

Usage:
  dart2esm <input.dart|input.dill> -o <output.mjs>

Options:
${parser.usage}
''';
}

abstract final class ExitCode {
  static const success = 0;
  static const usage = 64;
  static const software = 70;
}
