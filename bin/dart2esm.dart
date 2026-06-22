import 'dart:io';

import 'package:dart2esm/src/cli.dart';

Future<void> main(List<String> args) async {
  exitCode = await runDart2Esm(args);
}
