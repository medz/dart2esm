# JS AST

This module owns the JavaScript/ESM output model and code generator. It mirrors
the Oxc-style split where AST data structures and codegen are reusable
infrastructure instead of being embedded inside semantic lowering.

The current AST intentionally starts small. Backend migrations should add typed
nodes here as they move away from local string concatenation. Dart semantic
normalization still belongs in `lib/src/lowering/`; this module should only
represent JavaScript syntax that the emitter is ready to print.
