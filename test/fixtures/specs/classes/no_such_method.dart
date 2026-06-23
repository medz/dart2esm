class Proxy {
  final log = <String>[];

  @override
  dynamic noSuchMethod(Invocation invocation) {
    final name = symbolName(invocation.memberName);
    if (invocation.isGetter) {
      return 'get:$name';
    }
    if (invocation.isSetter) {
      log.add('set:$name:${invocation.positionalArguments.single}');
      return null;
    }
    final named = invocation.namedArguments.entries
        .map((entry) => '${symbolName(entry.key)}=${entry.value}')
        .join(',');
    return 'call:$name:${invocation.positionalArguments.join('|')}:$named';
  }
}

String symbolName(Symbol symbol) {
  final text = symbol.toString();
  return text.substring(8, text.length - 2);
}

void main() {
  final proxy = Proxy();
  final dynamic dynamicProxy = proxy;

  print(dynamicProxy.missing(1, 'two', named: 3));
  print(dynamicProxy.value);
  dynamicProxy.value = 4;
  print(proxy.log.join('|'));
}
