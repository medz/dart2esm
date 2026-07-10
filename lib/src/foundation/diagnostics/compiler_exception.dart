class Dart2EsmException implements Exception {
  Dart2EsmException(this.message);

  final String message;

  @override
  String toString() => message;
}

final class Dart2EsmUsageException extends Dart2EsmException {
  Dart2EsmUsageException(super.message);
}
