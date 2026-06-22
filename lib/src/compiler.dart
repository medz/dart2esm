import 'dart:io';

import 'package:dart2esm/src/backend/esm_backend.dart';
import 'package:dart2esm/src/kernel/kernel_header.dart';
import 'package:kernel/kernel.dart' as kernel;
import 'package:path/path.dart' as p;

Future<Dart2EsmResult> compileDartToEsm(Dart2EsmOptions options) async {
  final input = _resolveFile(options.workingDirectory, options.inputPath);
  if (!input.existsSync()) {
    throw Dart2EsmUsageException('Input file does not exist: ${input.path}');
  }

  final output = _resolveFile(options.workingDirectory, options.outputPath);
  final tempDir = await Directory.systemTemp.createTemp('dart2esm-');
  try {
    final kernelFile = await _loadOrBuildKernel(input, options, tempDir);
    final kernelBytes = kernelFile.readAsBytesSync();
    final header = readKernelHeader(kernelBytes);
    if (header.problemsAsJson.isNotEmpty) {
      return Dart2EsmResult(
        success: false,
        diagnostics: [
          for (final problem in header.problemsAsJson)
            'CFE problem from Kernel component: $problem',
        ],
      );
    }
    final component = kernel.loadComponentFromBytes(kernelBytes);

    final backendResult = emitEsm(component, runMain: options.runMain);
    output.parent.createSync(recursive: true);
    output.writeAsStringSync(backendResult.code);
    return Dart2EsmResult(
      success: true,
      diagnostics: [
        'Kernel input accepted: format ${header.formatVersion}, SDK hash ${header.sdkHash}.',
        'Kernel libraries: ${component.libraries.length}; main: ${component.mainMethod?.name.text ?? 'none'}.',
        ...backendResult.diagnostics,
      ],
    );
  } on UnsupportedKernelNode catch (error) {
    return Dart2EsmResult(success: false, diagnostics: [error.toString()]);
  } finally {
    await tempDir.delete(recursive: true);
  }
}

File _resolveFile(Directory workingDirectory, String path) {
  if (p.isAbsolute(path)) {
    return File(path);
  }
  return File(p.normalize(p.join(workingDirectory.path, path)));
}

Future<File> _loadOrBuildKernel(
  File input,
  Dart2EsmOptions options,
  Directory tempDir,
) async {
  if (input.path.endsWith('.dill')) {
    return input;
  }
  if (!input.path.endsWith('.dart')) {
    throw Dart2EsmUsageException(
      'Input must be a Dart source file or Kernel .dill file: ${input.path}',
    );
  }

  final output = File(p.join(tempDir.path, 'input.dill'));
  final args = [
    'compile',
    'kernel',
    '--no-link-platform',
    '--embed-sources',
    '-o',
    output.path,
    if (options.packagesPath case final packagesPath?)
      '--packages=${_resolveFile(options.workingDirectory, packagesPath).path}',
    input.path,
  ];
  final result = await Process.run(
    Platform.resolvedExecutable,
    args,
    workingDirectory: options.workingDirectory.path,
  );
  if (result.exitCode != 0) {
    throw Dart2EsmException(
      [
        'Dart CFE failed while compiling Kernel for ${input.path}.',
        if ((result.stdout as String).trim().isNotEmpty)
          (result.stdout as String).trim(),
        if ((result.stderr as String).trim().isNotEmpty)
          (result.stderr as String).trim(),
      ].join('\n'),
    );
  }
  return output;
}

final class Dart2EsmOptions {
  const Dart2EsmOptions({
    required this.inputPath,
    required this.outputPath,
    required this.workingDirectory,
    this.packagesPath,
    this.runMain = true,
  });

  final String inputPath;
  final String outputPath;
  final Directory workingDirectory;
  final String? packagesPath;
  final bool runMain;
}

final class Dart2EsmResult {
  const Dart2EsmResult({required this.success, required this.diagnostics});

  final bool success;
  final List<String> diagnostics;
}

class Dart2EsmException implements Exception {
  Dart2EsmException(this.message);

  final String message;

  @override
  String toString() => message;
}

final class Dart2EsmUsageException extends Dart2EsmException {
  Dart2EsmUsageException(super.message);
}
