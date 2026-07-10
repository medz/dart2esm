import 'dart:io';

import 'package:dart2esm/src/compiler.dart';
import 'package:dart2esm/src/foundation/diagnostics/compiler_diagnostic.dart';
import 'package:dart2esm/src/foundation/diagnostics/compiler_exception.dart';
import 'package:dart2esm/src/foundation/diagnostics/metrics.dart';
import 'package:dart2esm/src/foundation/diagnostics/unsupported_compiler_feature.dart';
import 'package:dart2esm/src/foundation/diagnostics/unsupported_kernel_node.dart';
import 'package:dart2esm/src/foundation/kernel/kernel_header.dart';
import 'package:dart2esm/src/frontend/dart_frontend.dart';
import 'package:dart2esm/src/options.dart';
import 'package:dart2esm/src/third_party/kernel/kernel.dart' as kernel;
import 'package:path/path.dart' as p;

export '../foundation/diagnostics/compiler_exception.dart';

Future<Dart2EsmResult> compileDartToEsm(Dart2EsmOptions options) {
  return const CompilerDriver().compile(options);
}

final class CompilerDriver {
  const CompilerDriver({this.frontend = const DartFrontend()});

  final DartFrontend frontend;

  Future<Dart2EsmResult> compile(Dart2EsmOptions options) async {
    final input = _resolveFile(options.workingDirectory, options.inputPath);
    if (!input.existsSync()) {
      throw Dart2EsmUsageException('Input file does not exist: ${input.path}');
    }

    final output = _resolveFile(options.workingDirectory, options.outputPath);
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-');
    Dart2EsmCompilerProfile? profile;
    try {
      final frontendResult = await frontend.compile(
        DartFrontendRequest(
          input: input,
          workingDirectory: options.workingDirectory,
          requestedPlatform: options.platform,
          packagesPath: options.packagesPath,
          environmentDefines: options.environmentDefines,
        ),
        tempDir,
      );
      profile = Dart2EsmCompilerProfile(
        platform: frontendResult.platform,
        ecmaTarget: options.ecmaTarget,
        optimization: options.optimization,
      );

      final kernelBytes = frontendResult.kernelFile.readAsBytesSync();
      final header = readKernelHeader(kernelBytes);
      if (header.problemsAsJson.isNotEmpty) {
        return Dart2EsmResult(
          success: false,
          profile: profile,
          diagnosticEntries: [
            for (final problem in header.problemsAsJson)
              CompilerDiagnostic(
                code: 'D2E1001',
                severity: DiagnosticSeverity.error,
                phase: DiagnosticPhase.frontend,
                message: 'CFE problem from Kernel component: $problem',
              ),
          ],
        );
      }
      final component = kernel.loadComponentFromBytes(kernelBytes);
      final compilerResult = Compiler(
        options: CompilerOptions(runMain: options.runMain, profile: profile),
      ).compile(component);
      output.parent.createSync(recursive: true);
      output.writeAsStringSync(compilerResult.code);

      final collectMetrics =
          options.collectMetrics || options.compareDart2JsMetrics;
      final esmMetrics = collectMetrics
          ? CodeSizeMetrics.fromCode('dart2esm', compilerResult.code)
          : null;
      final dart2jsMetrics = options.compareDart2JsMetrics
          ? await _compileDart2JsMetrics(input, options, tempDir)
          : null;
      return Dart2EsmResult(
        success: true,
        profile: profile,
        diagnosticEntries: [
          CompilerDiagnostic(
            code: 'D2E0001',
            severity: DiagnosticSeverity.info,
            phase: DiagnosticPhase.kernel,
            message:
                'Kernel input accepted: format ${header.formatVersion}, SDK hash ${header.sdkHash}.',
          ),
          CompilerDiagnostic(
            code: 'D2E0002',
            severity: DiagnosticSeverity.info,
            phase: DiagnosticPhase.analysis,
            message:
                'Kernel libraries: ${component.libraries.length}; main: ${component.mainMethod?.name.text ?? 'none'}.',
          ),
        ],
        esmMetrics: esmMetrics,
        dart2jsMetrics: dart2jsMetrics,
      );
    } on UnsupportedKernelNode catch (error) {
      return Dart2EsmResult(
        success: false,
        profile: profile,
        diagnosticEntries: [error.toDiagnostic()],
      );
    } on UnsupportedCompilerFeature catch (error) {
      return Dart2EsmResult(
        success: false,
        profile: profile,
        diagnosticEntries: [error.toDiagnostic()],
      );
    } finally {
      await tempDir.delete(recursive: true);
    }
  }
}

File _resolveFile(Directory workingDirectory, String path) {
  if (p.isAbsolute(path)) return File(path);
  return File(p.normalize(p.join(workingDirectory.path, path)));
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
    this.platform = Dart2EsmPlatform.auto,
    this.ecmaTarget = Dart2EsmEcmaTarget.es2022,
    this.optimization = Dart2EsmOptimizationLevel.debug,
    this.collectMetrics = false,
    this.compareDart2JsMetrics = false,
  });

  final String inputPath;
  final String outputPath;
  final Directory workingDirectory;
  final String? packagesPath;
  final List<String> environmentDefines;
  final bool runMain;
  final Dart2EsmPlatform platform;
  final Dart2EsmEcmaTarget ecmaTarget;
  final Dart2EsmOptimizationLevel optimization;
  final bool collectMetrics;
  final bool compareDart2JsMetrics;
}

final class Dart2EsmResult {
  const Dart2EsmResult({
    required this.success,
    required this.diagnosticEntries,
    this.profile,
    this.esmMetrics,
    this.dart2jsMetrics,
  });

  final bool success;
  final Dart2EsmCompilerProfile? profile;
  final List<CompilerDiagnostic> diagnosticEntries;
  List<String> get diagnostics => [
    for (final diagnostic in diagnosticEntries) diagnostic.message,
  ];
  final CodeSizeMetrics? esmMetrics;
  final CodeSizeMetrics? dart2jsMetrics;
}
