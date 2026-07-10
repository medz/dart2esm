# Dart Kernel reader

This directory contains the minimal transitive source closure needed to read
and inspect Dart Kernel components.

- Upstream: `dart-lang/sdk`
- SDK tag: `3.12.2`
- Revision: `d684a576a6aa954ae107a03b2b4e1d61c3bebe93`
- Entrypoints: `ast.dart` and `binary/ast_from_binary.dart`

Kernel writers, testing utilities, targets, and unrelated SDK tools are omitted.
`kernel.dart` is the local read-only facade used by dart2esm.

The upstream sources are distributed under the BSD 3-Clause license in
`LICENSE`. Do not edit vendored files when changing dart2esm; update the pinned
SDK snapshot instead.
