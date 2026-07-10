# dart2esm

[![pub package](https://img.shields.io/pub/v/dart2esm.svg)](https://pub.dev/packages/dart2esm)
[![Dart SDK](https://img.shields.io/badge/Dart-3.12-0175C2?logo=dart)](https://dart.dev/)
[![license](https://img.shields.io/github/license/medz/dart2esm.svg)](LICENSE)

A Dart-to-native-ESM compiler built on Dart's Common Front End and Kernel IR.

`dart2esm` emits modern ECMAScript modules directly. It uses JavaScript, Web
APIs, and Node primitives where their behavior matches Dart, then links only the
small runtime helpers required by the program.

## Highlights

- Native ESM output with real `import` and `export` bindings.
- ES2022, ES2023, and ESNext syntax targets.
- Neutral ECMAScript, browser, and Node host profiles.
- Readable debug output and optimized release output.
- Member reachability, runtime tree shaking, safe name mangling, and constant
  compaction in release builds.
- Node-backed `dart:io` and Worker-backed isolate support where host semantics
  exist.
- Structured diagnostics and raw/gzip output metrics.
- Dart VM versus Node behavior tests and a pinned conformance manifest.

> [!IMPORTANT]
> `dart2esm` is a 0.x compiler, not a byte-for-byte Dart VM replacement. FFI,
> VM service APIs, native extensions, and full reflection require runtime
> facilities that native ESM does not provide.

## Requirements

`dart2esm 0.2.x` requires Dart 3.12.x. The compiler reads the Dart 3.12 Kernel
binary format directly, so newer SDK versions are intentionally rejected until
their Kernel format is adopted and tested.

Generated modules require an ES2022-capable host. Host-specific APIs additionally
require the selected browser or Node capabilities.

## Installation

Install the command globally from pub.dev:

```sh
dart pub global activate dart2esm
```

Verify the installation:

```sh
dart2esm --version
```

## Quick start

Given `hello.dart`:

```dart
void main() {
  print('Hello from native ESM');
}
```

Compile and run it:

```sh
dart2esm hello.dart -o hello.mjs --mode=release
node hello.mjs
```

By default, the generated module invokes `main()` at module evaluation time.
Use `--no-run-main` when the output will be imported by another ESM module:

```sh
dart2esm lib/api.dart -o dist/api.mjs --mode=release --no-run-main
```

```js
import { calculate } from "./dist/api.mjs";

console.log(calculate());
```

Only declarations exported by the Dart entry library become public ESM exports.
Imported Dart libraries are bundled into the same output module.

## Compiler modes

### Debug

`--mode=debug` is the default. It keeps stable, readable names and formatted
output for inspection.

### Release

`--mode=release` applies behavior-preserving production transforms:

- unreachable control-flow removal;
- conservative member reachability;
- local, internal, private-member, and runtime binding shortening;
- canonical constant and frozen-object compaction;
- runtime dependency relinking;
- compact structured ESM and runtime printing.

Exports, runtime ABI contracts, dynamic selector names, raw JavaScript
properties, and user-visible strings remain protected.

## Command reference

```text
dart2esm <input.dart|input.dill> -o <output.mjs> [options]
```

| Option | Description |
| --- | --- |
| `-o, --output` | Required output `.mjs` path. |
| `--packages` | Explicit `package_config.json` path. |
| `-D, --define` | Compile-time environment declaration; repeatable. |
| `--platform` | `auto`, `neutral`, `browser`, or `node`. |
| `--target` | `es2022`, `es2023`, or `esnext`. |
| `--mode` | `debug` or `release`. |
| `--[no-]run-main` | Enable or disable the top-level `main()` invocation. |
| `--metrics` | Print raw/gzip size, line count, and runtime helper count. |
| `--compare-dart2js` | Compile a dart2js `-O2` baseline and print size ratios. |
| `--version` | Print the package version. |
| `-h, --help` | Print complete CLI help. |

Existing Kernel components can also be compiled, but they require an explicit
host profile:

```sh
dart2esm build/input.dill -o dist/input.mjs --platform=node
```

## Platform profiles

| Profile | Intended host | Behavior |
| --- | --- | --- |
| `auto` | CLI convenience | Uses VM Kernel when possible and selects the concrete host profile; retries the browser frontend for web-only libraries. |
| `neutral` | Portable ECMAScript | Rejects Node-only and Web-only runtime capabilities. |
| `browser` | Modern browsers | Uses MDN Web API semantics and browser module Workers. |
| `node` | Modern Node.js | Enables `node:` imports, filesystem/process APIs, Web APIs, and module Workers. |

### `dart:io`

`dart:io` lowering is capability-based:

- Value APIs such as `FileMode`, `HeaderValue`, `ContentType`, and `Cookie`
  emit ordinary ECMAScript.
- Client HTTP maps to Fetch and Headers.
- Client WebSockets map to the host WebSocket API.
- Files, directories, links, processes, and standard IO require the Node
  profile and emit static `node:` imports.

Unsupported raw sockets, HTTP servers, custom TLS contexts, and browser
handshake features fail explicitly instead of receiving approximate behavior.

### Isolates

Top-level `Isolate.spawn` and `Isolate.run` entries map to Node Workers or
browser module Workers. Ports use `MessageChannel`, and messages use structured
cloning. Closures, custom object prototypes, paused startup, and VM-specific
error/exit-port behavior remain outside the supported Worker subset.

## Compatibility boundary

The compiler covers Dart features that can be represented with ECMAScript,
Web APIs, Node APIs, and a finite runtime library.

| Area | Status |
| --- | --- |
| Classes, functions, records, enums, patterns, control flow | Supported |
| Imports and packages | Bundled into one ESM output module |
| SDK libraries | Host-dependent |
| JavaScript numbers and guarded safe integers | Supported |
| 64-bit operations requiring exact width | BigInt where required |
| `dart:io` | Portable subset plus Node capabilities |
| `dart:isolate` | Worker-compatible subset |
| `dart:ffi` | Rejected; requires a WebAssembly or Node native-addon ABI |
| `dart:mirrors` | Rejected; closed-world ESM has no VM reflection service |
| VM service and native extensions | Rejected |
| Source maps | Not emitted yet |

The authoritative machine-readable matrix is
[`spec/conformance.json`](spec/conformance.json).

## Dart API

The compiler is also available as a library:

```dart
import 'dart:io';

import 'package:dart2esm/dart2esm.dart';

Future<void> main() async {
  final result = await compileDartToEsm(
    Dart2EsmOptions(
      inputPath: 'bin/main.dart',
      outputPath: 'dist/main.mjs',
      workingDirectory: Directory.current,
      platform: Dart2EsmPlatform.node,
      optimization: Dart2EsmOptimizationLevel.release,
    ),
  );

  if (!result.success) {
    for (final diagnostic in result.diagnosticEntries) {
      stderr.writeln(diagnostic.render());
    }
    exitCode = 1;
  }
}
```

The public API exposes compiler profiles, structured diagnostics, code-size
metrics, results, and the `CompilerDriver` entrypoint.

## Output size

Use the repository benchmark instead of assuming that one compiler is always
smaller:

```sh
dart run tool/benchmark.dart --compare-dart2js
```

On the checked-in YAML fixture with Dart 3.12.2:

| Compiler | Raw | Gzip |
| --- | ---: | ---: |
| dart2esm release | 175,963 B | 38,532 B |
| dart2js `-O2` | 196,930 B | 61,256 B |
| Ratio | **0.894x** | **0.629x** |

This fixture is a regression benchmark, not a universal size guarantee.

## Architecture

The production pipeline is:

```text
Dart source / Kernel
  -> frontend and profile resolution
  -> Kernel validation
  -> semantic analysis and reachability
  -> structured ESM lowering
  -> release transforms
  -> runtime contract linking
  -> ESM code generation
```

See [`doc/compiler-architecture.md`](doc/compiler-architecture.md) for stage
contracts and invariants.

## Development

```sh
dart analyze
dart test
npm run test:esm
dart run tool/benchmark.dart --compare-dart2js
dart pub publish --dry-run
```

## License

[MIT](LICENSE)
