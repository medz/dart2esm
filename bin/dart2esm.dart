import 'dart:io';

import 'package:dart2esm/src/app/cli.dart';

Future<void> main(List<String> args) async {
  exitCode = await runDart2Esm(args);
}
