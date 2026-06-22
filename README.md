# dart2esm

`dart2esm` is a planned Dart-to-native-ESM compiler.

The project goal is to use Dart's Common Front End and Kernel IR as the
frontend, then emit clean ECMAScript modules. JavaScript and Node primitives
should be used directly where they are semantically equivalent, with small Dart
semantic helpers imported only when required.

This `0.0.0` release is a package-name reservation placeholder. The compiler is
not implemented yet.

## Planned command

```sh
dart2esm bin/main.dart -o dist/main.mjs
```

## Planned direction

- Input: Dart source compiled through CFE/Kernel.
- Output: native ESM.
- Runtime: pay-as-you-go semantic helpers.
- Node target: map supported `dart:io` APIs to Node APIs where practical.
- TypeScript support: optional `.d.ts` declaration emission, not a TypeScript
  frontend.
