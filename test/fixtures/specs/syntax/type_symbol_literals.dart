const topLevelSymbol = #hello;
const topLevelType = String;

String describeTypes() {
  final stringType = String;
  final listType = List<int>;
  final mapType = Map<String, int>;
  final symbol = #hello;
  final constructedSymbol = Symbol('hello');
  final memberSymbol = #foo.bar;
  return '$stringType $listType $mapType $symbol $memberSymbol '
      '${symbol == topLevelSymbol} ${constructedSymbol == symbol} '
      '${stringType == topLevelType}';
}

void main() {
  print(describeTypes());
}
