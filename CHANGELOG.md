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
- Add focused golden and runtime fixtures that compare Dart VM behavior with
  Node running generated ESM.

## 0.0.0

- Reserve the `dart2esm` package name.
- Add a placeholder command-line executable.
