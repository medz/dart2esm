import 'dart:convert';
import 'dart:io';

import 'package:dart2esm/src/cli.dart';
import 'package:dart2esm/src/compiler.dart';
import 'package:kernel/kernel.dart' as kernel;
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  final fixtureDir = Directory('test/fixtures/specs');

  test('CLI version matches package metadata', () async {
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-version-');
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final stdoutLog = File(p.join(tempDir.path, 'stdout.log')).openWrite();
    final stderrLog = File(p.join(tempDir.path, 'stderr.log')).openWrite();

    final exitCode = await runDart2Esm(
      ['--version'],
      stdoutSink: stdoutLog,
      stderrSink: stderrLog,
    );
    await stdoutLog.close();
    await stderrLog.close();

    final pubspec = File('pubspec.yaml').readAsStringSync();
    final version = RegExp(
      r'^version: (.+)$',
      multiLine: true,
    ).firstMatch(pubspec)!.group(1);
    expect(exitCode, ExitCode.success);
    expect(
      File(p.join(tempDir.path, 'stdout.log')).readAsStringSync(),
      'dart2esm $version\n',
    );
    expect(
      File(p.join(tempDir.path, 'stderr.log')).readAsStringSync(),
      isEmpty,
    );
  });

  test('compiles Dart input through Kernel to runnable ESM', () async {
    final fixture = File(
      p.join(fixtureDir.path, 'functions', 'basic_functions.dart'),
    );
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-test-');
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final output = File(p.join(tempDir.path, 'main.mjs'));

    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: fixture.path,
        outputPath: output.path,
        workingDirectory: Directory.current,
      ),
    );

    expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
    expect(result.diagnostics, hasLength(2));
    expect(
      result.diagnostics.first,
      matches(
        RegExp(r'^Kernel input accepted: format 130, SDK hash [0-9a-f]+\.$'),
      ),
    );
    expect(
      output.readAsStringSync(),
      File(
        p.join(fixtureDir.path, 'functions', 'basic_functions.mjs'),
      ).readAsStringSync(),
    );
    await _expectSameDartAndNodeOutput(fixture, output);
  });

  test('reads CFE Kernel component libraries and main procedure', () async {
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-reader-');
    addTearDown(() => tempDir.deleteSync(recursive: true));

    final input = File(p.join(tempDir.path, 'main.dart'))
      ..writeAsStringSync(
        File(
          p.join(fixtureDir.path, 'functions', 'basic_functions.dart'),
        ).readAsStringSync(),
      );
    final dill = File(p.join(tempDir.path, 'main.dill'));
    final result = await Process.run(Platform.resolvedExecutable, [
      'compile',
      'kernel',
      '--no-link-platform',
      '--embed-sources',
      '-o',
      dill.path,
      input.path,
    ], workingDirectory: tempDir.path);

    expect(result.exitCode, 0, reason: '${result.stdout}\n${result.stderr}');

    final component = kernel.loadComponentFromBytes(dill.readAsBytesSync());
    expect(component.libraries.map((library) => library.fileUri).toList(), [
      input.uri,
    ]);
    expect(component.mainMethod?.name.text, 'main');
    expect(component.mainMethod?.function.body, isNotNull);
  });

  test('can emit an ESM module without running main', () async {
    final fixture = _GoldenFixture(
      root: fixtureDir,
      source: File(
        p.join(fixtureDir.path, 'functions', 'basic_functions.dart'),
      ),
      expectedEsm: File(
        p.join(fixtureDir.path, 'functions', 'basic_functions.mjs'),
      ),
    );
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-no-main-');
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final output = File(p.join(tempDir.path, 'basic_functions.mjs'));

    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: fixture.source.path,
        outputPath: output.path,
        workingDirectory: Directory.current,
        runMain: false,
      ),
    );

    expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
    expect(output.readAsStringSync(), _withoutMainCall(fixture.expectedCode));
  });

  test('CLI --no-run-main omits the main invocation', () async {
    final fixture = _GoldenFixture(
      root: fixtureDir,
      source: File(
        p.join(fixtureDir.path, 'functions', 'basic_functions.dart'),
      ),
      expectedEsm: File(
        p.join(fixtureDir.path, 'functions', 'basic_functions.mjs'),
      ),
    );
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-cli-');
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final output = File(p.join(tempDir.path, 'basic_functions.mjs'));
    final stdoutLog = File(p.join(tempDir.path, 'stdout.log')).openWrite();
    final stderrLog = File(p.join(tempDir.path, 'stderr.log')).openWrite();

    final exitCode = await runDart2Esm(
      [fixture.source.path, '-o', output.path, '--no-run-main'],
      stdoutSink: stdoutLog,
      stderrSink: stderrLog,
    );
    await stdoutLog.close();
    await stderrLog.close();

    expect(exitCode, ExitCode.success);
    expect(output.readAsStringSync(), _withoutMainCall(fixture.expectedCode));
  });

  test('compile options pass environment defines to CFE', () async {
    final fixture = File(
      p.join(fixtureDir.path, 'libraries', 'environment.dart'),
    );
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-env-');
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final output = File(p.join(tempDir.path, 'environment.mjs'));

    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: fixture.path,
        outputPath: output.path,
        workingDirectory: Directory.current,
        environmentDefines: const [
          'dart2esm.feature=true',
          'dart2esm.answer=42',
          'dart2esm.label=defined',
        ],
      ),
    );

    expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
    final nodeRun = await Process.run('node', [
      output.path,
    ], workingDirectory: tempDir.path);
    expect(nodeRun.exitCode, 0, reason: '${nodeRun.stdout}\n${nodeRun.stderr}');
    expect(nodeRun.stdout, 'env true true 42 defined\n');
    expect(nodeRun.stderr, isEmpty);
  });

  test('CLI -D passes environment defines to CFE', () async {
    final fixture = File(
      p.join(fixtureDir.path, 'libraries', 'environment.dart'),
    );
    final tempDir = await Directory.systemTemp.createTemp('dart2esm-cli-env-');
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final output = File(p.join(tempDir.path, 'environment.mjs'));
    final stdoutLog = File(p.join(tempDir.path, 'stdout.log')).openWrite();
    final stderrLog = File(p.join(tempDir.path, 'stderr.log')).openWrite();

    final exitCode = await runDart2Esm(
      [
        fixture.path,
        '-o',
        output.path,
        '-Ddart2esm.feature=true,dart2esm.answer=43',
        '--define=dart2esm.label=cli',
      ],
      stdoutSink: stdoutLog,
      stderrSink: stderrLog,
    );
    await stdoutLog.close();
    await stderrLog.close();

    expect(exitCode, ExitCode.success);
    expect(
      File(p.join(tempDir.path, 'stdout.log')).readAsStringSync(),
      isEmpty,
    );
    final nodeRun = await Process.run('node', [
      output.path,
    ], workingDirectory: tempDir.path);
    expect(nodeRun.exitCode, 0, reason: '${nodeRun.stdout}\n${nodeRun.stderr}');
    expect(nodeRun.stdout, 'env true true 43 cli\n');
    expect(nodeRun.stderr, isEmpty);
  });

  test(
    'no-run-main import exposes initialized top-level ESM bindings',
    () async {
      final fixture = _GoldenFixture(
        root: fixtureDir,
        source: File(
          p.join(fixtureDir.path, 'variables', 'top_level_variables.dart'),
        ),
        expectedEsm: File(
          p.join(fixtureDir.path, 'variables', 'top_level_variables.mjs'),
        ),
      );
      final tempDir = await Directory.systemTemp.createTemp('dart2esm-var-');
      addTearDown(() => tempDir.deleteSync(recursive: true));
      final output = File(p.join(tempDir.path, 'vars.mjs'));
      final consumer = File(p.join(tempDir.path, 'consumer.mjs'))
        ..writeAsStringSync(
          "import { assignFirst, finalValue } from './vars.mjs';\n"
          "console.log('values ' + assignFirst + ' ' + finalValue);\n",
        );

      final result = await compileDartToEsm(
        Dart2EsmOptions(
          inputPath: fixture.source.path,
          outputPath: output.path,
          workingDirectory: Directory.current,
          runMain: false,
        ),
      );

      expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
      expect(output.readAsStringSync(), _withoutMainCall(fixture.expectedCode));

      final nodeRun = await Process.run('node', [
        consumer.path,
      ], workingDirectory: tempDir.path);
      expect(
        nodeRun.exitCode,
        0,
        reason: '${nodeRun.stdout}\n${nodeRun.stderr}',
      );
      expect(
        nodeRun.stdout,
        'init readFirst\n'
        'init assignFirst\n'
        'init finalValue\n'
        'values 20 30\n',
      );
      expect(nodeRun.stderr, isEmpty);
    },
  );

  test('direct named ESM import reads primitive top-level variables', () async {
    final fixture = _GoldenFixture(
      root: fixtureDir,
      source: File(
        p.join(fixtureDir.path, 'variables', 'primitive_exports.dart'),
      ),
      expectedEsm: File(
        p.join(fixtureDir.path, 'variables', 'primitive_exports.mjs'),
      ),
    );
    final tempDir = await Directory.systemTemp.createTemp(
      'dart2esm-import-var-',
    );
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final output = File(p.join(tempDir.path, 'a.mjs'));
    final consumer = File(p.join(tempDir.path, 'b.mjs'))
      ..writeAsStringSync("import { c } from './a.mjs';\nconsole.log(c);\n");

    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: fixture.source.path,
        outputPath: output.path,
        workingDirectory: Directory.current,
        runMain: false,
      ),
    );

    expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
    expect(output.readAsStringSync(), _withoutMainCall(fixture.expectedCode));

    final nodeRun = await Process.run('node', [
      consumer.path,
    ], workingDirectory: tempDir.path);
    expect(nodeRun.exitCode, 0, reason: '${nodeRun.stdout}\n${nodeRun.stderr}');
    expect(nodeRun.stdout, '1\n');
    expect(nodeRun.stderr, isEmpty);
  });

  test('direct class imports preserve interface instanceof checks', () async {
    final fixture = _GoldenFixture(
      root: fixtureDir,
      source: File(p.join(fixtureDir.path, 'classes', 'interfaces.dart')),
      expectedEsm: File(p.join(fixtureDir.path, 'classes', 'interfaces.mjs')),
    );
    final tempDir = await Directory.systemTemp.createTemp(
      'dart2esm-import-interface-',
    );
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final output = File(p.join(tempDir.path, 'interfaces.mjs'));
    final consumer = File(p.join(tempDir.path, 'consumer.mjs'))
      ..writeAsStringSync(
        "import { NamedThing, Person } from './interfaces.mjs';\n"
        "const person = new Person('ada');\n"
        "console.log(person.name);\n"
        "console.log(person.describe());\n"
        "console.log(person instanceof NamedThing);\n",
      );

    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: fixture.source.path,
        outputPath: output.path,
        workingDirectory: Directory.current,
        runMain: false,
      ),
    );

    expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
    expect(output.readAsStringSync(), _withoutMainCall(fixture.expectedCode));

    final nodeRun = await Process.run('node', [
      consumer.path,
    ], workingDirectory: tempDir.path);
    expect(nodeRun.exitCode, 0, reason: '${nodeRun.stdout}\n${nodeRun.stderr}');
    expect(
      nodeRun.stdout,
      'ada\n'
      'person:ada\n'
      'true\n',
    );
    expect(nodeRun.stderr, isEmpty);
  });

  test('direct extension type imports expose an ESM class facade', () async {
    final fixture = _GoldenFixture(
      root: fixtureDir,
      source: File(p.join(fixtureDir.path, 'classes', 'extension_types.dart')),
      expectedEsm: File(
        p.join(fixtureDir.path, 'classes', 'extension_types.mjs'),
      ),
    );
    final tempDir = await Directory.systemTemp.createTemp(
      'dart2esm-import-extension-type-',
    );
    addTearDown(() => tempDir.deleteSync(recursive: true));
    final output = File(p.join(tempDir.path, 'extension_types.mjs'));
    final consumer = File(p.join(tempDir.path, 'consumer.mjs'))
      ..writeAsStringSync(
        "import { UserId } from './extension_types.mjs';\n"
        "const id = new UserId(5);\n"
        "console.log(id.value);\n"
        "console.log(id.plus(2));\n"
        "console.log(id.doubled);\n"
        "id.observed = 1;\n"
        "console.log(id.value);\n"
        "console.log(id instanceof UserId);\n"
        "const parsed = UserId.parse('9');\n"
        "console.log(parsed.value);\n"
        "console.log(UserId.zeroValue);\n"
        "console.log(UserId.defaultValue);\n"
        "console.log(UserId.current.value);\n"
        "UserId.current = UserId.parse('6');\n"
        "console.log(UserId.current.value);\n"
        "console.log(UserId.zero().value);\n"
        "console.log(id['+'](3).value);\n",
      );

    final result = await compileDartToEsm(
      Dart2EsmOptions(
        inputPath: fixture.source.path,
        outputPath: output.path,
        workingDirectory: Directory.current,
        runMain: false,
      ),
    );

    expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
    expect(output.readAsStringSync(), _withoutMainCall(fixture.expectedCode));

    final nodeRun = await Process.run('node', [
      consumer.path,
    ], workingDirectory: tempDir.path);
    expect(nodeRun.exitCode, 0, reason: '${nodeRun.stdout}\n${nodeRun.stderr}');
    expect(
      nodeRun.stdout,
      '5\n'
      '7\n'
      '10\n'
      '5\n'
      'true\n'
      '9\n'
      '0\n'
      '12\n'
      '1\n'
      '6\n'
      '0\n'
      '8\n',
    );
    expect(nodeRun.stderr, isEmpty);
  });

  for (final fixture in _goldenFixtures(fixtureDir)) {
    test('matches ${fixture.id} ESM golden and runtime behavior', () async {
      await _expectGoldenFixture(fixture);
    });
  }
}

String _withoutMainCall(String code) {
  const mainCall = '\nmain();\n';
  expect(code.endsWith(mainCall), isTrue);
  return '${code.substring(0, code.length - mainCall.length)}\n';
}

List<_GoldenFixture> _goldenFixtures(Directory fixtureDir) {
  final sources =
      fixtureDir
          .listSync(recursive: true)
          .whereType<File>()
          .where((file) => file.path.endsWith('.dart'))
          .where((file) => File(p.setExtension(file.path, '.mjs')).existsSync())
          .toList()
        ..sort((left, right) => left.path.compareTo(right.path));
  return [
    for (final source in sources)
      _GoldenFixture(
        root: fixtureDir,
        source: source,
        expectedEsm: File(p.setExtension(source.path, '.mjs')),
      ),
  ];
}

Future<void> _expectGoldenFixture(_GoldenFixture fixture) async {
  final tempDir = await Directory.systemTemp.createTemp('dart2esm-golden-');
  addTearDown(() => tempDir.deleteSync(recursive: true));

  final output = File(p.join(tempDir.path, '${fixture.name}.mjs'));
  final result = await compileDartToEsm(
    Dart2EsmOptions(
      inputPath: fixture.source.path,
      outputPath: output.path,
      workingDirectory: Directory.current,
    ),
  );
  expect(result.success, isTrue, reason: result.diagnostics.join('\n'));
  expect(output.readAsStringSync(), fixture.expectedEsm.readAsStringSync());
  if (fixture.id == 'libraries/concurrent') {
    await _expectNodeOutput(output, 'concurrent 42\n');
    return;
  }
  if (fixture.id == 'libraries/html') {
    await _expectNodeOutputWithPrelude(output, '''
const store = new Map();
globalThis.document = { title: "" };
globalThis.window = {
  localStorage: {
    getItem: key => store.has(String(key)) ? store.get(String(key)) : null,
    setItem: (key, value) => { store.set(String(key), String(value)); },
  },
};
''', 'html true ok\n');
    return;
  }
  if (fixture.id == 'libraries/indexed_db') {
    await _expectNodeOutputWithPrelude(output, '''
function makeRequest(result) {
  const listeners = new Map();
  return {
    result,
    error: null,
    addEventListener(type, callback) { listeners.set(type, callback); },
    dispatch(type) {
      const event = { target: this };
      listeners.get(type)?.(event);
      this["on" + type]?.(event);
    },
  };
}
class MemoryObjectStore {
  constructor() { this.data = new Map(); }
  put(value, key) {
    const request = makeRequest(key);
    queueMicrotask(() => { this.data.set(key, value); request.dispatch("success"); });
    return request;
  }
  get(key) {
    const request = makeRequest(this.data.get(key));
    queueMicrotask(() => request.dispatch("success"));
    return request;
  }
}
class MemoryDatabase {
  constructor(name) {
    this.name = name;
    this.stores = new Map();
  }
  createObjectStore(name) {
    const store = new MemoryObjectStore();
    this.stores.set(name, store);
    return store;
  }
  transaction() {
    return { objectStore: name => this.stores.get(name) };
  }
  close() {}
}
const indexedDB = {
  open(name) {
    const db = new MemoryDatabase(name);
    const request = makeRequest(db);
    queueMicrotask(() => {
      request.dispatch("upgradeneeded");
      request.dispatch("success");
    });
    return request;
  },
  deleteDatabase() {
    const request = makeRequest(null);
    queueMicrotask(() => request.dispatch("success"));
    return request;
  },
};
globalThis.indexedDB = indexedDB;
globalThis.window = { indexedDB };
''', 'indexedDB true ok dart2esm\n');
    return;
  }
  if (fixture.id == 'libraries/js') {
    await _expectNodeOutput(output, 'jsLegacy 5 ok true 12 4 3\n');
    return;
  }
  if (fixture.id == 'libraries/js_interop') {
    await _expectNodeOutput(
      output,
      'jsInterop true true 7 ok true\n'
      'jsInteropModern hello true 2 42 true true 9 true true true true true 1 yes true 1970\n'
      'jsUtil a2 5,12,4.5,8,1 true,false,true,true,true,true,true,true true true fallback,ok,2147483647 true,true,true,x,true,true,false,true,true\n'
      'jsExternal 8 3 1970\n'
      'jsPromise 11 11 13 17 19\n'
      'jsIterator unique dart2esm.shared true 1 2 true 1,2 3 true 5 21 true\n'
      'jsTyped 4 23 7,8,9 23\n'
      'jsBox 31 dart-ref true\n'
      'jsExport 9 counter:9 15\n'
      'jsFunction 7 8 true this:ok\n',
    );
    return;
  }
  if (fixture.id == 'libraries/svg') {
    await _expectNodeOutputWithPrelude(output, '''
globalThis.document = {
  createElementNS: (namespaceURI, tagName) => ({ namespaceURI, tagName, id: "" }),
};
''', 'svg root\n');
    return;
  }
  if (fixture.id == 'libraries/web_gl') {
    await _expectNodeOutputWithPrelude(output, '''
class WebGLRenderingContext {
  clearColor() {}
  clear() {}
}
globalThis.WebGLRenderingContext = WebGLRenderingContext;
globalThis.window = { WebGLRenderingContext };
globalThis.document = {
  createElement: tagName => ({
    tagName,
    width: 0,
    height: 0,
    getContext: contextId => contextId === "webgl" ? new WebGLRenderingContext() : null,
  }),
};
''', 'webgl true 16388 16 8 true true\n');
    return;
  }
  if (fixture.id == 'libraries/web_audio') {
    await _expectNodeOutputWithPrelude(output, '''
class AudioContext {
  constructor() {
    this.currentTime = 1.5;
    this.destination = { connect() {} };
  }
  createGain() {
    return { gain: { value: 0.75 }, connect() {} };
  }
  createOscillator() {
    return { type: "sine", connect() {}, start() {}, stop() {} };
  }
}
globalThis.AudioContext = AudioContext;
globalThis.window = { AudioContext };
''', 'webAudio true 1.5 0.75 sine true\n');
    return;
  }
  await _expectSameDartAndNodeOutput(fixture.source, output);
}

Future<void> _expectNodeOutput(File output, String stdout) async {
  final nodeRun = await Process.run('node', [
    output.path,
  ], workingDirectory: output.parent.path);
  expect(nodeRun.exitCode, 0, reason: '${nodeRun.stdout}\n${nodeRun.stderr}');
  expect(nodeRun.stdout, stdout);
  expect(nodeRun.stderr, isEmpty);
}

Future<void> _expectNodeOutputWithPrelude(
  File output,
  String prelude,
  String stdout,
) async {
  final nodeRun = await Process.run('node', [
    '--input-type=module',
    '-e',
    '$prelude\nawait import(${jsonEncode(output.uri.toString())});',
  ], workingDirectory: output.parent.path);
  expect(nodeRun.exitCode, 0, reason: '${nodeRun.stdout}\n${nodeRun.stderr}');
  expect(nodeRun.stdout, stdout);
  expect(nodeRun.stderr, isEmpty);
}

Future<void> _expectSameDartAndNodeOutput(File input, File output) async {
  final dartRun = await Process.run(Platform.resolvedExecutable, [
    input.path,
  ], workingDirectory: Directory.current.path);
  final nodeRun = await Process.run('node', [
    output.path,
  ], workingDirectory: output.parent.path);
  expect(nodeRun.exitCode, dartRun.exitCode);
  expect(nodeRun.stdout, dartRun.stdout);
  expect(nodeRun.stderr, dartRun.stderr);
}

final class _GoldenFixture {
  const _GoldenFixture({
    required this.root,
    required this.source,
    required this.expectedEsm,
  });

  final Directory root;
  final File source;
  final File expectedEsm;

  String get expectedCode => expectedEsm.readAsStringSync();

  String get id => p.withoutExtension(p.relative(source.path, from: root.path));

  String get name => p.basenameWithoutExtension(source.path);
}
