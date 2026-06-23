class PlainToken {
  PlainToken(this.name);

  final String name;

  @override
  String toString() => name;
}

dynamic hide(Object? value) => value;

WeakReference<PlainToken> makeWeak(PlainToken token) {
  return WeakReference<PlainToken>(token);
}

String describeWeak(PlainToken token) {
  final weak = WeakReference<PlainToken>(token);
  return '${weak.target == token} ${hide(weak) is WeakReference<PlainToken>}';
}

String describeFinalizer(PlainToken token) {
  final observed = <String>[];
  final detachKey = Object();
  final finalizer = Finalizer<String>((value) {
    observed.add(value);
  });

  finalizer.attach(token, 'collected', detach: detachKey);
  finalizer.detach(detachKey);

  return '${hide(finalizer) is Finalizer<String>} ${observed.length}';
}

void main() {
  final token = PlainToken('dart');
  final weak = makeWeak(token);
  print('weak ${weak.target == token} ${weak.target?.name}');
  print('weakType ${describeWeak(token)}');
  print('finalizer ${describeFinalizer(token)}');
}
