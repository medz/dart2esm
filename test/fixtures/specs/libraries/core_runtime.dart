void main() {
  final buffer = StringBuffer('hello');
  buffer.write(' ');
  buffer.write(42);
  buffer.writeln();
  buffer.write('done');
  print(
    'buffer ${buffer.length} ${buffer.isNotEmpty} ${buffer.toString().contains('\n')}',
  );
  buffer.clear();
  print('cleared ${buffer.isEmpty} ${buffer.toString()}');

  final encoded = Uri.encodeComponent('a b/ç');
  print('uri $encoded ${Uri.decodeComponent(encoded)}');
  final full = Uri.encodeFull('https://example.test/a b?q=ç');
  print('full ${Uri.decodeFull(full)}');
}
