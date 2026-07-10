const defaultCompilerProcessTimeout = Duration(minutes: 5);

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

enum Dart2EsmEcmaTarget {
  es2022('es2022'),
  es2023('es2023'),
  esNext('esnext');

  const Dart2EsmEcmaTarget(this.cliName);

  final String cliName;

  static Dart2EsmEcmaTarget? tryParse(String value) {
    for (final target in values) {
      if (target.cliName == value) return target;
    }
    return null;
  }
}

enum Dart2EsmOptimizationLevel {
  debug('debug'),
  release('release');

  const Dart2EsmOptimizationLevel(this.cliName);

  final String cliName;

  static Dart2EsmOptimizationLevel? tryParse(String value) {
    for (final level in values) {
      if (level.cliName == value) return level;
    }
    return null;
  }
}

final class Dart2EsmCompilerProfile {
  const Dart2EsmCompilerProfile({
    required this.platform,
    this.ecmaTarget = Dart2EsmEcmaTarget.es2022,
    this.optimization = Dart2EsmOptimizationLevel.debug,
  }) : assert(platform != Dart2EsmPlatform.auto);

  static const nodeDebug = Dart2EsmCompilerProfile(
    platform: Dart2EsmPlatform.node,
  );

  final Dart2EsmPlatform platform;
  final Dart2EsmEcmaTarget ecmaTarget;
  final Dart2EsmOptimizationLevel optimization;

  bool get isRelease => optimization == Dart2EsmOptimizationLevel.release;
}

extension Dart2EsmPlatformCapabilities on Dart2EsmPlatform {
  bool get allowsNodeIo =>
      this == Dart2EsmPlatform.auto || this == Dart2EsmPlatform.node;

  bool get allowsWebIo => this != Dart2EsmPlatform.neutral;
}
