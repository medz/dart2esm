# dart2esm

`dart2esm` is a Dart-to-native-ESM compiler.

The compiler uses Dart's Common Front End and Kernel IR as the frontend, then
emits clean ECMAScript modules. JavaScript and Node primitives are used directly
where they are semantically equivalent, with small Dart semantic helpers emitted
only when required.

The 0.1.0 goal is complete Dart syntax and Dart SDK lowering to native ESM,
except for `dart:io`. ESM version targeting is intentionally not split into
compatibility profiles yet.

## Usage

```sh
dart2esm bin/main.dart -o dist/main.mjs
```

By default the generated module invokes `main()` at top level. Use
`--no-run-main` when the output should be imported as a module without executing
the Dart entrypoint:

```sh
dart2esm lib/example.dart -o dist/example.mjs --no-run-main
```

Pass compile-time environment declarations with `-Dkey=value` or
`--define=key=value`; multiple values can be repeated or comma-separated.

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

## Architecture

1. Dart source is lowered to Kernel with `dart compile kernel
   --no-link-platform`, falling back to the SDK `frontend_server` with the DDC
   platform for JS/web-only SDK libraries.
2. Kernel bytes are read with `package:kernel`.
3. The backend walks the entry component and emits native `.mjs`.
4. Public entry-library declarations are exported as ESM bindings. Imported
   local Dart libraries are bundled into the same output module and only
   re-exported when the Dart entry library exports them.

## Unsupported Libraries

`dart:io` APIs are not supported in 0.1.0.
