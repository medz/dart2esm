enum Status {
  ready(200, 'Ready'),
  failed(500, 'Failed');

  const Status(this.code, this.label);

  final int code;
  final String label;

  static const fallback = failed;

  static bool isErrorCode(int code) => code >= 400;

  bool get ok => code < 400;

  String describe() => '$name:$code:$label';
}

void main() {
  print('entry ${Status.ready.name} ${Status.ready.index}');
  print('fields ${Status.failed.code} ${Status.failed.label}');
  print('getter ${Status.ready.ok} ${Status.failed.ok}');
  print('method ${Status.ready.describe()}');
  print('values ${Status.values.length} ${Status.values[1].name}');
  final byName = Status.values.byName('ready');
  final nameMap = Status.values.asNameMap();
  print('byName ${byName.code} ${nameMap['failed']!.label}');
  print('static ${Status.fallback.name} ${Status.isErrorCode(500)}');
  print('string ${Status.failed}');
}
