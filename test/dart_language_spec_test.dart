import 'dart:convert';
import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  final manifestFile = File(p.join('spec', 'conformance.json'));

  test('conformance manifest is versioned and reproducible', () {
    final manifest = _readManifest(manifestFile);
    final specification = manifest['specification']! as Map<String, Object?>;
    final semantics = manifest['semantics']! as Map<String, Object?>;

    expect(manifest['schemaVersion'], 1);
    expect(specification['dartSdk'], '3.12.2');
    expect(specification['kernelFormat'], 130);
    expect(specification['revision'], matches(RegExp(r'^[0-9a-f]{40}$')));
    expect(semantics['profile'], 'dart-web');
    expect(semantics['primaryOracle'], 'dart2js-o2');
    expect(semantics['portableOracle'], 'dart-vm');
  });

  test('every executable conformance fixture belongs to one feature group', () {
    final manifest = _readManifest(manifestFile);
    final groups = (manifest['featureGroups']! as List<Object?>)
        .cast<Map<String, Object?>>();
    final declaredDirectories = {
      for (final group in groups) group['fixtureDirectory']! as String,
    };
    final fixtureRoot = Directory(p.join('test', 'fixtures', 'specs'));
    final actualDirectories = <String>{};
    for (final entity in fixtureRoot.listSync(recursive: true)) {
      if (entity is! File || !entity.path.endsWith('.dart')) continue;
      final esm = File(p.setExtension(entity.path, '.mjs'));
      if (!esm.existsSync()) continue;
      final relative = p.relative(entity.path, from: fixtureRoot.path);
      actualDirectories.add(p.split(relative).first);
    }

    expect(declaredDirectories, actualDirectories);
    expect(
      groups.map((group) => group['id']),
      hasLength(groups.map((group) => group['id']).toSet().length),
    );
    for (final group in groups) {
      expect(group['status'], isNotEmpty);
      expect(group['oracle'], isNotEmpty);
    }
  });

  test('non-ESM VM capabilities remain explicit boundaries', () {
    final manifest = _readManifest(manifestFile);
    final boundaries = (manifest['compatibilityBoundaries']! as List<Object?>)
        .cast<Map<String, Object?>>();
    final byId = {for (final boundary in boundaries) boundary['id']: boundary};

    expect(byId['dart-ffi']!['status'], 'rejected');
    expect(byId['dart-mirrors']!['status'], 'rejected');
    expect(byId['vm-service']!['status'], 'rejected');
    expect(byId['native-extensions']!['status'], 'rejected');
    expect(byId['isolates']!['status'], 'worker-subset');
    expect(byId['dart-io']!['status'], 'host-dependent');
    for (final boundary in boundaries) {
      expect(boundary['reason'], isNotEmpty);
    }
  });
}

Map<String, Object?> _readManifest(File file) {
  return (jsonDecode(file.readAsStringSync()) as Map<String, Object?>);
}
