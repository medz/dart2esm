## Unreleased

- Split CLI, compiler driver, Dart/CFE frontend, Kernel adapter, semantic core,
  transforms, runtime linking, and code generation into explicit boundaries.
- Add immutable compiler profiles for host, ECMAScript target, and debug or
  release optimization; Kernel input now requires an explicit host profile.
- Add stable structured diagnostics with codes, phases, and Kernel source
  locations.
- Add safe release optimization, runtime relinking, and compact ESM printing.
- Define runtime helper ABI contracts for entry names, dependencies, host
  requirements, and conservative effects.
- Replace the network-dependent language-spec test with a pinned, machine-
  readable conformance manifest and offline coverage checks.
- Add a reproducible debug/release benchmark command with optional dart2js
  comparison.

## 0.1.1

- Bundle the minimal Dart 3.12.2 Kernel reader required by the compiler instead
  of cloning the complete Dart SDK as a Git dependency.
- Pin the matching hosted `_fe_analyzer_shared` release and limit activation to
  Dart 3.12, whose Kernel binary format this release supports.
- Add a minimal pub.dev package manifest that excludes development fixtures and
  JavaScript test tooling from the distributed archive.

## 0.1.0

- Compile Dart source or Kernel `.dill` input into native ECMAScript modules.
- Use Dart CFE/Kernel as the frontend through `dart compile kernel` and
  `package:kernel`.
- Emit ESM exports for the entry library, including top-level functions,
  variables, classes, enums, records, constructors, and supported static
  members.
- Lower modern Dart syntax produced by CFE, including collection control-flow,
  null-aware operators, cascades, pattern destructuring, switch expressions,
  sync generators, async generators, and `await for`.
- Select neutral, browser, or Node platform lowering without a redundant
  JavaScript target abstraction.
- Emit canonical module-level constructor tear-offs instead of duplicating
  function bodies at every reference.
- Link runtime helpers by referenced symbol instead of emitting whole helper
  families, and validate the transitive dependency closure during compilation.
- Discover reserved runtime names from actual declarations rather than a
  manually synchronized global-name list.
- Emit Node-backed `dart:io` through hoisted static `node:` imports, add usable
  link and stdin operations, and reject unimplemented IO methods at compile
  time instead of generating broken calls.
- Split `dart:io` lowering into pure ECMAScript, Web API, and Node capability
  groups with compile-time platform enforcement.
- Lower client `HttpClient` requests to Fetch/Headers streams and
  `WebSocket.connect` to the WebSocket Web API in browser and modern Node
  runtimes.
- Compile browser-targeted `dart:io` through VM Kernel while retaining the DDC
  fallback for web-only SDK libraries.
- Replace same-thread isolate simulation with real Node Workers and browser
  module Workers for top-level `Isolate.spawn` and `Isolate.run` entries, using
  MessageChannel-backed SendPort delivery and structured-clone validation.
- Reject worker-incompatible isolate closures and unsupported message shapes
  instead of silently sharing the main module heap.
- Remove the numeric `dart:ffi` pointer simulation. FFI now fails at compile
  time until an explicit native-addon or WebAssembly ABI backend exists.
- Add focused golden and runtime fixtures that compare Dart VM behavior with
  Node running generated ESM.

## 0.0.0

- Reserve the `dart2esm` package name.
- Add a placeholder command-line executable.
