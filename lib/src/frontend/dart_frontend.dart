import 'dart:io';

import 'package:dart2esm/src/foundation/diagnostics/compiler_exception.dart';
import 'package:dart2esm/src/foundation/compiler_process.dart';
import 'package:dart2esm/src/foundation/file_paths.dart';
import 'package:dart2esm/src/options.dart';
import 'package:path/path.dart' as p;

final class DartFrontendRequest {
  const DartFrontendRequest({
    required this.input,
    required this.workingDirectory,
    required this.requestedPlatform,
    this.packagesPath,
    this.environmentDefines = const [],
    this.processTimeout = defaultCompilerProcessTimeout,
  });

  final File input;
  final Directory workingDirectory;
  final Dart2EsmPlatform requestedPlatform;
  final String? packagesPath;
  final List<String> environmentDefines;
  final Duration processTimeout;
}

final class DartFrontendResult {
  const DartFrontendResult({required this.kernelFile, required this.platform});

  final File kernelFile;
  final Dart2EsmPlatform platform;
}

final class DartFrontend {
  const DartFrontend();

  Future<DartFrontendResult> compile(
    DartFrontendRequest request,
    Directory temporaryDirectory,
  ) async {
    final input = request.input;
    if (input.path.endsWith('.dill')) {
      if (request.requestedPlatform == Dart2EsmPlatform.auto) {
        throw Dart2EsmUsageException(
          'Kernel .dill input requires an explicit --platform.',
        );
      }
      return DartFrontendResult(
        kernelFile: input,
        platform: request.requestedPlatform,
      );
    }
    if (!input.path.endsWith('.dart')) {
      throw Dart2EsmUsageException(
        'Input must be a Dart source file or Kernel .dill file: ${input.path}',
      );
    }

    final output = File(p.join(temporaryDirectory.path, 'input.dill'));
    final vmResult = await _buildVmKernel(request, output);
    if (vmResult.exitCode == 0) {
      return DartFrontendResult(
        kernelFile: output,
        platform: request.requestedPlatform == Dart2EsmPlatform.auto
            ? Dart2EsmPlatform.node
            : request.requestedPlatform,
      );
    }
    if ((request.requestedPlatform != Dart2EsmPlatform.auto &&
            request.requestedPlatform != Dart2EsmPlatform.browser) ||
        !_shouldRetryWithDdc(vmResult)) {
      throw _kernelBuildException(input, vmResult);
    }

    final ddcResult = await _buildDdcKernel(request, output);
    if (ddcResult.exitCode != 0) {
      throw _kernelBuildException(input, ddcResult);
    }
    return DartFrontendResult(
      kernelFile: output,
      platform: Dart2EsmPlatform.browser,
    );
  }
}

Future<ProcessResult> _buildVmKernel(DartFrontendRequest request, File output) {
  final args = [
    'compile',
    'kernel',
    '--no-link-platform',
    '--embed-sources',
    '-o',
    output.path,
    if (request.packagesPath case final packagesPath?)
      '--packages=${resolveFile(request.workingDirectory, packagesPath).path}',
    for (final define in request.environmentDefines) '-D$define',
    request.input.path,
  ];
  return runCompilerProcess(
    Platform.resolvedExecutable,
    args,
    workingDirectory: request.workingDirectory.path,
    timeout: request.processTimeout,
    description: 'Dart VM Kernel compilation',
  );
}

Future<ProcessResult> _buildDdcKernel(
  DartFrontendRequest request,
  File output,
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
    if (request.packagesPath case final packagesPath?) ...[
      '--packages',
      resolveFile(request.workingDirectory, packagesPath).path,
    ],
    for (final define in request.environmentDefines) '-D$define',
    request.input.path,
  ];
  return runCompilerProcess(
    dartaotruntime.path,
    args,
    workingDirectory: request.workingDirectory.path,
    timeout: request.processTimeout,
    description: 'DDC Kernel compilation',
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
