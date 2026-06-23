import 'dart:mirrors';

void main() {
  final name = MirrorSystem.getName(#answer);
  final symbol = MirrorSystem.getSymbol('answer');
  print('mirrors $name ${symbol == #answer}');
}
