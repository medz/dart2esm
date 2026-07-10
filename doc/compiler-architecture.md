# Compiler Architecture

`dart2esm` compiles Dart source or Kernel input into one native ECMAScript
module. The compiler keeps frontend, semantic analysis, lowering, optimization,
runtime linking, and printing as separate stages so host behavior and release
tradeoffs remain explicit.

## Pipeline

1. `CompilerDriver` resolves paths and an immutable compiler profile.
2. `DartFrontend` accepts an existing Kernel component or invokes the Dart CFE.
   VM Kernel is preferred; browser-only libraries retry through the DDC
   platform when the CFE reports a platform mismatch.
3. Kernel headers and frontend problems are validated before deserialization.
4. Semantic analysis computes declarations, runtime symbols, member
   reachability, and the public entry-library surface.
5. Lowering converts reachable Kernel nodes into the structured ESM AST.
6. Release transforms normalize control flow, compact constants, shorten safe
   compiler-owned names, and factor repeated field definitions.
7. Runtime linking validates helper contracts against the active host platform,
   resolves transitive dependencies, and emits only referenced declarations.
8. Code generation prints readable debug ESM or compact release ESM.

## Compiler Profile

Every compilation resolves one `Dart2EsmCompilerProfile` before Kernel lowering:

- `platform` is concrete (`node`, `browser`, or `neutral`), never `auto`.
- `ecmaTarget` defines the minimum syntax contract.
- `optimization` selects stable debug output or behavior-preserving release
  transforms.

Kernel `.dill` inputs require an explicit platform because the compiler cannot
reconstruct the frontend platform choice from the component alone.

## Semantic and Export Invariants

- Only declarations exported by the Dart entry library become ESM exports.
- Imported Dart libraries are bundled into the output module.
- Public exported classes retain their complete externally callable surface.
- Release reachability remains conservative for virtual calls, dynamic calls,
  `noSuchMethod`, type tests, and constructor tear-offs.
- Library-private Dart members may be shortened only when every compiler-owned
  access can be rewritten consistently.
- User-visible strings, dynamic selector names, raw JavaScript properties, and
  runtime ABI names are not treated as ordinary private bindings.

## Runtime Contracts

Each runtime helper declares its entry names, dependencies, host requirements,
and conservative effects. Helper loading always receives the resolved compiler
platform, rejects incompatible Node or Web capabilities, and links the
dependency closure before runtime identifiers are shortened.

`dart:io` is divided by capability: pure ECMAScript values, Web API mappings,
and Node-backed operations. `dart:isolate` uses module Workers. `dart:ffi` is
rejected until an explicit native-addon or WebAssembly ABI backend exists.

## Release Safety

Release transforms operate on the structured ESM AST whenever possible.
Compiler-owned raw runtime declarations use a token-aware compact printer.
Exports and runtime contracts are protected before identifier mangling. Frozen
constant instances preserve their final prototypes and property descriptors,
while canonicalization keys are replaced with module-local numeric ids.

All compiler subprocesses have a finite deadline and are terminated on timeout.
Temporary-directory cleanup never replaces the original compilation result or
error.

## Validation

The release gate is:

```sh
dart analyze
dart test
npm run test:esm
dart run tool/benchmark.dart --compare-dart2js
dart pub publish --dry-run
```

The test suite compares Dart VM behavior with Node executing generated ESM,
including release mode, Node IO, browser-capability boundaries, and Worker-backed
isolates. `spec/conformance.json` is the pinned machine-readable support matrix.
