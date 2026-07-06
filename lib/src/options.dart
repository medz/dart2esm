enum Dart2EsmPlatform {
  auto('auto'),
  neutral('neutral'),
  browser('browser'),
  node('node');

  const Dart2EsmPlatform(this.cliName);

  final String cliName;

  static Dart2EsmPlatform? tryParse(String value) {
    for (final platform in values) {
      if (platform.cliName == value) return platform;
    }
    return null;
  }
}

enum Dart2EsmTarget {
  esnext('esnext');

  const Dart2EsmTarget(this.cliName);

  final String cliName;

  static Dart2EsmTarget? tryParse(String value) {
    for (final target in values) {
      if (target.cliName == value) return target;
    }
    return null;
  }
}

final class Dart2EsmTargetCapabilities {
  const Dart2EsmTargetCapabilities({
    required this.optionalChaining,
    required this.nullishCoalescing,
    required this.classFields,
    required this.staticBlocks,
    required this.topLevelAwait,
    required this.importMeta,
    required this.bigInt,
  });

  factory Dart2EsmTargetCapabilities.forTarget(Dart2EsmTarget target) {
    return switch (target) {
      Dart2EsmTarget.esnext => const Dart2EsmTargetCapabilities(
        optionalChaining: true,
        nullishCoalescing: true,
        classFields: true,
        staticBlocks: true,
        topLevelAwait: true,
        importMeta: true,
        bigInt: true,
      ),
    };
  }

  final bool optionalChaining;
  final bool nullishCoalescing;
  final bool classFields;
  final bool staticBlocks;
  final bool topLevelAwait;
  final bool importMeta;
  final bool bigInt;
}
