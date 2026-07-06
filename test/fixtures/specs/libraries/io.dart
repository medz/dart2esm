import 'dart:io';

void main() async {
  final root = Directory.systemTemp.createTempSync('dart2esm-io-fixture-');
  try {
    final file = File('${root.path}/note.txt');
    file.writeAsStringSync('hello', mode: FileMode.write);
    file.writeAsStringSync('!', mode: FileMode.append);
    final bytes = await file.readAsBytes();
    final copy = file.copySync('${root.path}/copy.txt');
    final type = FileSystemEntity.typeSync(file.path);
    final result = Process.runSync('node', ['--version']);
    final random = file.openSync(mode: FileMode.append);
    random.writeStringSync('?');
    random.setPositionSync(0);
    final firstByte = random.readByteSync();
    final randomLength = random.lengthSync();
    random.closeSync();
    final Object entity = file;
    final Object directory = root;

    stdout.writeln('io stdout ${entity is File} ${directory is Directory}');
    print(
      'io '
      '${file.existsSync()} '
      '${file.readAsStringSync()} '
      '${bytes.length} '
      '$firstByte '
      '$randomLength '
      '${copy.existsSync()} '
      '${type == FileSystemEntityType.file} '
      '${Platform.operatingSystem.isNotEmpty} '
      '${Platform.pathSeparator.isNotEmpty} '
      '${Directory.current.path.isNotEmpty} '
      '${result.exitCode == 0} '
      '${result.stdout is String}',
    );
  } finally {
    root.deleteSync(recursive: true);
  }
}
