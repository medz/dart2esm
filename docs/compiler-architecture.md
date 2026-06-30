# dart2esm Compiler Architecture

dart2esm is a Dart Kernel to native ESM compiler. The architectural goal is not
to mimic dart2js output, but to preserve Dart semantics while producing modules
that JavaScript callers can import through normal ESM bindings.

This document is the working architecture for the 0.1.0 MVP. It is intentionally
more important than local output-shape optimizations until the compiler has a
stable pipeline.

## References

dart2esm should stay close to proven compiler boundaries instead of growing one
large emitter that performs every task.

- dart2js: useful for closed-world analysis, world building, helper/runtime
  management, and backend lowering.
- dart2wasm: useful for Kernel-driven lowering, runtime feature selection, and
  backend-specific type/runtime decisions.
- dart2native / VM AOT: useful as a reminder that frontend, global analysis,
  optimization, and backend code generation are separate concerns.
- Oxc: useful for toolchain shape. Its codebase separates parser, AST,
  semantic analysis, transform, minifier, codegen, diagnostics, and traversal
  infrastructure. dart2esm does not copy those phases directly because our
  input is Kernel IR, but it should copy the engineering discipline: stable
  models, explicit passes, centralized traversal helpers, and codegen that does
  not also own semantic discovery.

## Pipeline

The intended compiler pipeline is:

```text
Dart source / dill
  -> Frontend
  -> Program model
  -> World / reachability
  -> Semantic lowering IR
  -> Optimization passes
  -> Runtime/helper selection
  -> ESM emitter
  -> Diagnostics and metrics
```

Each phase consumes the previous phase's model. Later phases may report
diagnostics, but they should not rediscover broad compiler facts ad hoc.

## Frontend

The frontend owns Dart source or `.dill` input and produces a Kernel
`Component`.

Current implementation:

- `lib/src/compiler.dart` shells out to `dart compile kernel --no-link-platform`.
- It falls back to the SDK frontend server with the DDC platform when JS/web SDK
  libraries require that path.
- `package:kernel` reads the resulting component.

Target boundary:

- Keep Dart CFE / Kernel loading here.
- Do not leak file-system or process concerns into backend phases.
- Unsupported platform diagnostics, such as `dart:io`, should be reported
  before lowering when the dependency graph proves they are reachable.

## Program Model

The program model describes the source-level module surface that dart2esm must
preserve.

Responsibilities:

- Library graph.
- Import/export graph.
- `part` composition.
- Re-export visibility and combinators.
- Deferred import metadata.
- Public ESM API roots.
- Unsupported SDK/library boundary.

The most important distinction from dart2js is that public ESM API roots are
first-class. dart2js can optimize around a `main()` execution shape; dart2esm
must keep exported declarations importable from external JavaScript.

Current implementation:

- `lib/src/program/program_roots.dart` computes public ESM API roots,
  re-export visibility, export combinators, and dependency-based library order.

Target boundary:

- Make the backend consume an explicit root/API model.
- Move remaining deferred-import and unsupported-library facts into this layer.

## World / Reachability

World analysis computes what must be emitted.

Responsibilities:

- Live libraries.
- Live classes.
- Live extension types.
- Live top-level fields and procedures.
- Live constants.
- Live runtime/helper features.

Current implementation:

- `lib/src/world/reachability.dart` computes the first conservative
  reachability plan.
- Roots include `main()` and public ESM exports/re-exports.

Target boundary:

- Keep graph marking and Kernel reference traversal out of the emitter.
- Add selector/type-driven member pruning after the semantic model is stable.
- Treat helper/runtime reachability as part of the same world plan instead of
  appending helpers opportunistically from scattered emission code.

## Semantic Lowering IR

Lowering converts Kernel into a dart2esm semantic IR. This is the missing center
of the current compiler.

Responsibilities:

- Preserve Dart semantics in a form that later JS/ESM shaping can consume.
- Normalize Dart-specific behavior: null safety, late, async, sync*/async*,
  records, patterns, extension types, enums, mixins, factories, constructors,
  `super`, closures, and tear-offs.
- Represent Dart SDK semantic operations without immediately choosing final JS
  text.

Target boundary:

- Add `lib/src/lowering/` for Kernel-to-IR lowering.
- The emitter should not traverse arbitrary Kernel nodes once a lowered model is
  available.
- Output-shape decisions such as optional chaining, nullish coalescing,
  `class extends`, and `instanceof` belong after semantic lowering, not inside
  every Kernel visitor branch.

## Runtime / Helper Registry

Helpers are part of the compiler contract, not local string snippets.

Current implementation:

- `lib/src/backend/runtime_helpers.dart` already contains helper metadata and a
  dependency resolver.
- `EsmRuntimeHelperUseSet` owns requested helper tracking, dependency closure,
  registered helper source lookup, and legacy stream-runtime classification.
- Small core/collection helpers such as `__dartConst`, `__dartConstSet`,
  `__dartConstMap`, `__dartLazyField`, `__dartIterator`, and simple numeric
  helpers are emitted from declarative helper specs.
- Record runtime helpers are also registered declaratively with explicit shape
  and type-test dependencies.
- Some helper source is still emitted inline from `esm_backend.dart`.

Target boundary:

- Every helper has a unique name, source definition, category, and explicit
  dependencies.
- Lowering records helper/runtime feature usage.
- Final helper selection is deterministic, dependency-closed, and tree-shaken.
- SDK lowering, runtime helpers, and ESM export shaping stay separate.
- Move the remaining inline helper source blocks out of `esm_backend.dart` and
  into declarative helper specs.

## Optimization Passes

Optimization is a pass pipeline, not a collection of local emitter shortcuts.

Initial passes:

- Dead declaration pruning.
- Dead helper removal.
- Constant simplification.
- Expression shaping.
- Direct `class extends` shaping.
- Direct `instanceof` shaping where Dart type semantics allow it.
- Optional chaining and nullish coalescing shaping.

Later passes:

- Member pruning.
- Helper specialization.
- Name mangling.
- Minification.

These passes should run on semantic IR or JS AST-like structures, not by
rewriting already-rendered strings.

## ESM Emitter

The emitter owns final module text.

Responsibilities:

- Stable ESM imports and exports.
- Deterministic declaration order.
- JS syntax emission from lowered IR or JS AST-like nodes.
- No world analysis.
- No broad Dart semantic repair.

ESM rules:

- Public Dart entry-library declarations must export stable bindings.
- External JavaScript should be able to import classes, functions, constants,
  and top-level bindings directly.
- Do not wrap the whole program in a single runtime closure.
- Prefer native ES semantics when they match Dart semantics.

## Diagnostics / Metrics

Diagnostics and metrics must be first-class because package coverage and size
are primary product signals.

Required metrics:

- Reachable libraries/classes/members/helpers.
- Unsupported nodes and unsupported libraries.
- Raw output size.
- gzip output size.
- dart2esm versus `dart compile js -O2`.
- Helper/runtime size share.
- Package fixture coverage.

Target boundary:

- Add `lib/src/diagnostics/` for structured compiler diagnostics and metrics.
- Keep human CLI text as a presentation layer over structured data.

## Module Layout

The intended source layout is:

```text
lib/src/compiler.dart          Frontend orchestration and CLI-facing result
lib/src/kernel/                Kernel file/header utilities
lib/src/program/               Library graph, export graph, ESM API roots
lib/src/world/                 Reachability and world planning
lib/src/lowering/              Kernel -> dart2esm semantic IR
lib/src/optimizer/             Optimization pass pipeline
lib/src/backend/               ESM emitter and runtime/helper registry
lib/src/diagnostics/           Structured diagnostics and metrics
```

## Migration Order

1. Keep behavior stable while moving reachability into `lib/src/world/`.
2. Introduce a semantic IR for the narrowest existing subset.
3. Move helper usage declarations out of emission branches and into lowering.
4. Add metrics for reachability and helper/runtime size.
5. Only then resume output-shape optimization as explicit passes.
