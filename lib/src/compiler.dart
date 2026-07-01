import 'dart:io';

import 'package:dart2esm/src/diagnostics/metrics.dart';
import 'package:dart2esm/src/diagnostics/unsupported_kernel_node.dart';
import 'package:dart2esm/src/kernel/kernel_header.dart';
import 'package:dart2esm/src/compiler_core/compiler_pipeline.dart';
import 'package:dart2esm/src/compiler_core/new_compiler_unsupported.dart';
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

    final pipelineResult = Dart2EsmCompilerPipeline(
      options: Dart2EsmPipelineOptions(runMain: options.runMain),
    ).compile(component);
    output.parent.createSync(recursive: true);
    output.writeAsStringSync(pipelineResult.code);
    final collectMetrics =
        options.collectMetrics || options.compareDart2JsMetrics;
    final esmMetrics = collectMetrics
        ? CodeSizeMetrics.fromCode('dart2esm', pipelineResult.code)
        : null;
    final dart2jsMetrics = options.compareDart2JsMetrics
        ? await _compileDart2JsMetrics(input, options, tempDir)
        : null;
    return Dart2EsmResult(
      success: true,
      diagnostics: [
        'Kernel input accepted: format ${header.formatVersion}, SDK hash ${header.sdkHash}.',
        'Kernel libraries: ${component.libraries.length}; main: ${component.mainMethod?.name.text ?? 'none'}.',
        ...pipelineResult.diagnostics,
      ],
      esmMetrics: esmMetrics,
      dart2jsMetrics: dart2jsMetrics,
    );
  } on UnsupportedKernelNode catch (error) {
    return Dart2EsmResult(success: false, diagnostics: [error.toString()]);
  } on NewCompilerUnsupported catch (error) {
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
  final vmResult = await _buildVmKernel(input, output, options);
  if (vmResult.exitCode == 0) {
    return output;
  }
  if (!_shouldRetryWithDdc(vmResult)) {
    throw _kernelBuildException(input, vmResult);
  }

  final ddcResult = await _buildDdcKernel(input, output, options);
  if (ddcResult.exitCode != 0) {
    throw _kernelBuildException(input, ddcResult);
  }
  return output;
}

Future<ProcessResult> _buildVmKernel(
  File input,
  File output,
  Dart2EsmOptions options,
) {
  final args = [
    'compile',
    'kernel',
    '--no-link-platform',
    '--embed-sources',
    '-o',
    output.path,
    if (options.packagesPath case final packagesPath?)
      '--packages=${_resolveFile(options.workingDirectory, packagesPath).path}',
    for (final define in options.environmentDefines) '-D$define',
    input.path,
  ];
  return Process.run(
    Platform.resolvedExecutable,
    args,
    workingDirectory: options.workingDirectory.path,
  );
}

Future<ProcessResult> _buildDdcKernel(
  File input,
  File output,
  Dart2EsmOptions options,
) {
  final sdkRoot = _dartSdkRoot();
  final frontendServer = File(
    p.join(
      sdkRoot.path,
      'bin',
      'snapshots',
      'frontend_server_aot.dart.snapshot',
    ),
  );
  final dartaotruntime = File(p.join(sdkRoot.path, 'bin', 'dartaotruntime'));
  final platform = File(
    p.join(sdkRoot.path, 'lib', '_internal', 'ddc_platform.dill'),
  );
  if (!frontendServer.existsSync() ||
      !dartaotruntime.existsSync() ||
      !platform.existsSync()) {
    throw Dart2EsmException(
      'Dart SDK is missing frontend_server or DDC platform files under ${sdkRoot.path}.',
    );
  }
  final args = [
    frontendServer.path,
    '--sdk-root',
    '${sdkRoot.path}${p.separator}',
    '--platform',
    platform.path,
    '--target',
    'dartdevc',
    '--no-link-platform',
    '--embed-source-text',
    '--output-dill',
    output.path,
    if (options.packagesPath case final packagesPath?) ...[
      '--packages',
      _resolveFile(options.workingDirectory, packagesPath).path,
    ],
    for (final define in options.environmentDefines) '-D$define',
    input.path,
  ];
  return Process.run(
    dartaotruntime.path,
    args,
    workingDirectory: options.workingDirectory.path,
  );
}

Directory _dartSdkRoot() {
  final executable = File(
    Platform.resolvedExecutable,
  ).resolveSymbolicLinksSync();
  return Directory(p.dirname(p.dirname(executable)));
}

bool _shouldRetryWithDdc(ProcessResult result) {
  final output = '${result.stdout}\n${result.stderr}';
  return output.contains('not available on this platform');
}

Dart2EsmException _kernelBuildException(File input, ProcessResult result) {
  return Dart2EsmException(
    [
      'Dart CFE failed while compiling Kernel for ${input.path}.',
      if ((result.stdout as String).trim().isNotEmpty)
        (result.stdout as String).trim(),
      if ((result.stderr as String).trim().isNotEmpty)
        (result.stderr as String).trim(),
    ].join('\n'),
  );
}

Future<CodeSizeMetrics> _compileDart2JsMetrics(
  File input,
  Dart2EsmOptions options,
  Directory tempDir,
) async {
  if (!input.path.endsWith('.dart')) {
    throw Dart2EsmUsageException(
      'dart2js metrics comparison requires a Dart source input: ${input.path}',
    );
  }

  final output = File(p.join(tempDir.path, 'dart2js-baseline.js'));
  final args = [
    'compile',
    'js',
    '-O2',
    '-o',
    output.path,
    if (options.packagesPath case final packagesPath?)
      '--packages=${_resolveFile(options.workingDirectory, packagesPath).path}',
    for (final define in options.environmentDefines) '-D$define',
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
        'dart2js failed while compiling metrics baseline for ${input.path}.',
        if ((result.stdout as String).trim().isNotEmpty)
          (result.stdout as String).trim(),
        if ((result.stderr as String).trim().isNotEmpty)
          (result.stderr as String).trim(),
      ].join('\n'),
    );
  }
  return measureCodeSizeFile('dart2js -O2', output);
}

final class Dart2EsmOptions {
  const Dart2EsmOptions({
    required this.inputPath,
    required this.outputPath,
    required this.workingDirectory,
    this.packagesPath,
    this.environmentDefines = const [],
    this.runMain = true,
    this.collectMetrics = false,
    this.compareDart2JsMetrics = false,
  });

  final String inputPath;
  final String outputPath;
  final Directory workingDirectory;
  final String? packagesPath;
  final List<String> environmentDefines;
  final bool runMain;
  final bool collectMetrics;
  final bool compareDart2JsMetrics;
}

final class Dart2EsmResult {
  const Dart2EsmResult({
    required this.success,
    required this.diagnostics,
    this.esmMetrics,
    this.dart2jsMetrics,
  });

  final bool success;
  final List<String> diagnostics;
  final CodeSizeMetrics? esmMetrics;
  final CodeSizeMetrics? dart2jsMetrics;
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
