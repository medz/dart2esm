# Syntax Spec Fixtures

This directory holds Dart syntax fixtures and exact ESM goldens.

Each fixture is a pair:

- `<section>/<case>.dart`
- `<section>/<case>.mjs`

The test harness compiles every `.dart` file under this tree, compares the
generated ESM to the paired `.mjs` file, then compares Dart VM stdout/stderr and
exit code with Node running the generated ESM.

Grow this tree by Dart language surface area, using the Dart SDK language tests
and language specification as references. Keep each fixture focused on one
syntax or lowering concern so unsupported runtime semantics can be diagnosed
explicitly instead of hidden inside broad examples.
