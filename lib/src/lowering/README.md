# Lowering

This module lowers Kernel facts into dart2esm semantic IR before any ESM
output-shape optimization chooses concrete JavaScript syntax.

Current implementation:

- `semantic_ir.dart` defines the first semantic statements.
- `entrypoint_lowering.dart` lowers the Kernel `main` procedure into an
  `EsmEntrypointInvocation`.
- `js_lowering.dart` lowers semantic IR into the JS AST module.

Next migrations should move expression, statement, and helper-use decisions here
instead of adding new Kernel-to-JS decisions in the backend.
