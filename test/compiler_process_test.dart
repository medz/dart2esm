import 'dart:io';

import 'package:dart2esm/src/foundation/compiler_process.dart';
import 'package:dart2esm/src/foundation/diagnostics/compiler_exception.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  test('compiler processes are terminated after their deadline', () async {
    final directory = await Directory.systemTemp.createTemp(
      'dart2esm-process-',
    );
    addTearDown(() => directory.deleteSync(recursive: true));
    final script = File(p.join(directory.path, 'wait.dart'))
      ..writeAsStringSync('''
Future<void> main() async {
  await Future<void>.delayed(const Duration(minutes: 1));
}
''');

    await expectLater(
      runCompilerProcess(
        Platform.resolvedExecutable,
        [script.path],
        workingDirectory: directory.path,
        timeout: const Duration(milliseconds: 100),
        description: 'test compiler process',
      ),
      throwsA(
        isA<Dart2EsmException>().having(
          (error) => error.message,
          'message',
          contains('test compiler process timed out'),
        ),
      ),
    );
  });
}
