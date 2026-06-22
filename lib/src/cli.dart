import 'dart:io';

import 'package:args/args.dart';
import 'package:dart2esm/dart2esm.dart';
import 'package:dart2esm/src/compiler.dart';

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
    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: rest.single,
        outputPath: output,
        workingDirectory: Directory.current,
        packagesPath: results['packages'] as String?,
        runMain: results['run-main'] as bool,
      ),
    );
    for (final diagnostic in result.diagnostics) {
      err.writeln(diagnostic);
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
    ..addFlag(
      'run-main',
      defaultsTo: true,
      help: 'Emit a top-level main() invocation after module declarations.',
    )
    ..addFlag('version', negatable: false, help: 'Print the dart2esm version.')
    ..addFlag(
      'help',
      abbr: 'h',
      negatable: false,
      help: 'Show this help message.',
    );
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
