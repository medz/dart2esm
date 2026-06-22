import 'dart:io';

import 'package:dart2esm/dart2esm.dart';

void main(List<String> args) {
  if (args.contains('--version')) {
    stdout.writeln('dart2esm $packageVersion');
    return;
  }

  if (args.isEmpty || args.contains('-h') || args.contains('--help')) {
    stdout.writeln(_usage);
    return;
  }

  stderr.writeln('dart2esm $packageVersion is a placeholder release.');
  stderr.writeln('The compiler backend is not implemented yet.');
  exitCode = 64;
}

const _usage =
    '''
dart2esm $packageVersion

Usage:
  dart2esm <input.dart> -o <output.mjs>

Options:
  -h, --help       Show this help message.
      --version    Print the package version.

This placeholder release reserves the package name. The compiler is not
implemented yet.
''';
