# dart2esm

`dart2esm` is a Dart-to-native-ESM compiler.

The compiler uses Dart's Common Front End and Kernel IR as the frontend, then
emits clean ECMAScript modules. JavaScript and Node primitives are used directly
where they are semantically equivalent, with small Dart semantic helpers emitted
only when required.

The 0.1 release targets broad Dart syntax and SDK lowering to native ESM. The
compiler targets ES2022 or newer and separates host semantics from optimization
mode.

## Installation

dart2esm 0.1.x requires Dart 3.12 because it reads that SDK's Kernel binary
format directly.

```sh
dart pub global activate dart2esm
```

## Usage

```sh
dart2esm bin/main.dart -o dist/main.mjs
```

For a complete first run:

```sh
dart2esm example/hello.dart -o /tmp/hello.mjs
node /tmp/hello.mjs
```

By default the generated module invokes `main()` at top level. Use
`--no-run-main` when the output should be imported as a module without executing
the Dart entrypoint:

```sh
dart2esm lib/example.dart -o dist/example.mjs --no-run-main
```

Pass compile-time environment declarations with `-Dkey=value` or
`--define=key=value`; multiple values can be repeated or comma-separated.

Use `--platform=node`, `--platform=browser`, or `--platform=neutral` to select
host-specific SDK behavior. The default `auto` mode uses VM Kernel when
possible and falls back to the browser frontend for web-only libraries.

Use `--mode=debug` for readable stable output or `--mode=release` for safe
control-flow pruning, runtime relinking, and compact output. The minimum syntax
contract is selected with `--target=es2022`, `--target=es2023`, or
`--target=esnext`.

Use `--metrics` to print raw/gzip size, line count, and emitted helper count for
the generated ESM module. Add `--compare-dart2js` to also compile the same Dart
source with `dart compile js -O2` and print dart2esm/dart2js size ratios:

```sh
dart2esm lib/example.dart -o dist/example.mjs --metrics --compare-dart2js
```

You can also compile an existing Kernel component:

```sh
dart2esm build/input.dill -o dist/input.mjs
```

The same stable entrypoint is available as a Dart API:

```dart
import 'dart:io';
import 'package:dart2esm/dart2esm.dart';

final result = await compileDartToEsm(
  Dart2EsmOptions(
    inputPath: 'bin/main.dart',
    outputPath: 'dist/main.mjs',
    workingDirectory: Directory.current,
    optimization: Dart2EsmOptimizationLevel.release,
  ),
);
```

## Architecture

1. The driver resolves an immutable compiler profile, and the frontend lowers
   Dart source to Kernel with `dart compile kernel
   --no-link-platform`, falling back to the SDK `frontend_server` with the DDC
   platform for JS/web-only SDK libraries.
2. Kernel bytes are validated and adapted into a compiler `KernelProgram`.
3. Reachability and semantic passes build the declarations and runtime symbols
   needed by the entry module.
4. Kernel nodes are lowered to a structured ESM AST and normalized. Release
   transforms run before runtime linking.
5. Runtime helper contracts declare entry names, dependencies, host
   requirements, and effects. Unreferenced helper functions are not emitted.
6. Code generation prints native `.mjs`. Public entry-library declarations are
   exported as ESM bindings. Imported
   local Dart libraries are bundled into the same output module and only
   re-exported when the Dart entry library exports them.

The complete pipeline and invariants are documented in
[`doc/compiler-architecture.md`](doc/compiler-architecture.md). The pinned,
machine-readable support matrix is
[`spec/conformance.json`](spec/conformance.json).

## Platform Limits

`dart:io` lowering is split by host capability:

- Pure value APIs such as `FileMode`, `HeaderValue`, `ContentType`, and `Cookie`
  emit ordinary ECMAScript and remain available in neutral output.
- Client HTTP uses the Fetch and Headers Web APIs. Client WebSockets use the
  WebSocket Web API. These mappings work in browser builds and modern Node
  runtimes without importing Node modules.
- Files, directories, links, processes, and standard IO require
  `--platform=node` or the default `auto` mode. They emit static `node:`
  imports and are rejected by browser and neutral builds.

Fetch behavior intentionally follows the host Web API, including CORS,
credential, forbidden-header, and redirect rules. WebSocket custom handshake
headers, custom `HttpClient` instances, and Dart ping intervals have no Web API
equivalent and fail explicitly. Raw sockets, HTTP servers, custom TLS contexts,
and synchronous compression are not rewritten to superficially similar browser
APIs.

## VM Compatibility Boundary

Native ESM can cover Dart language semantics and SDK APIs that have an
equivalent JavaScript, Web API, or Node primitive. It cannot be a byte-for-byte
replacement for the Dart VM runtime:

- `Isolate.spawn` and `Isolate.run` use real Node Workers or browser module
  Workers for top-level entry functions. Ports use `MessageChannel`, and
  supported messages cross the worker boundary using structured cloning.
  Closures, custom object prototypes, paused startup, and VM-specific error/exit
  port behavior are rejected until the compiler can emit dedicated worker entry
  modules and reconstruction metadata.
- `dart:ffi` is rejected. A Dart `Pointer` refers to native C memory and
  `DynamicLibrary` resolves C symbols; wrapping an integer address in a JavaScript
  object does not implement either behavior. Future FFI support requires an
  explicit Node Native Addon ABI or WebAssembly ABI backend.
- VM service APIs, native extensions, and full runtime reflection have no
  general ESM equivalent and remain explicit compatibility boundaries.
