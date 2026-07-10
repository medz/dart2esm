import 'dart:async';
import 'dart:io';

import 'diagnostics/compiler_exception.dart';

Future<ProcessResult> runCompilerProcess(
  String executable,
  List<String> arguments, {
  required String workingDirectory,
  required Duration timeout,
  required String description,
}) async {
  final process = await Process.start(
    executable,
    arguments,
    workingDirectory: workingDirectory,
  );
  final stdoutText = process.stdout.transform(systemEncoding.decoder).join();
  final stderrText = process.stderr.transform(systemEncoding.decoder).join();

  int exitCode;
  try {
    exitCode = await process.exitCode.timeout(timeout);
  } on TimeoutException {
    process.kill();
    await process.exitCode.timeout(
      const Duration(seconds: 5),
      onTimeout: () {
        process.kill(ProcessSignal.sigkill);
        return process.exitCode;
      },
    );
    await Future.wait([stdoutText, stderrText]);
    throw Dart2EsmException(
      '$description timed out after ${timeout.inSeconds} seconds.',
    );
  }

  return ProcessResult(
    process.pid,
    exitCode,
    await stdoutText,
    await stderrText,
  );
}
