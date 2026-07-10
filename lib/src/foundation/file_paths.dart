import 'dart:io';

import 'package:path/path.dart' as p;

File resolveFile(Directory workingDirectory, String path) {
  if (p.isAbsolute(path)) return File(path);
  return File(p.normalize(p.join(workingDirectory.path, path)));
}
