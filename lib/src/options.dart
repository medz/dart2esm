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

extension Dart2EsmPlatformCapabilities on Dart2EsmPlatform {
  bool get allowsNodeIo =>
      this == Dart2EsmPlatform.auto || this == Dart2EsmPlatform.node;

  bool get allowsWebIo => this != Dart2EsmPlatform.neutral;
}
