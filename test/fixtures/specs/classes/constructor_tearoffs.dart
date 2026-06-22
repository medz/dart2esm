typedef BoxMaker = Box Function(int value);
typedef AliasBox = Box;
typedef OptionMaker = Options Function(int value, {String label});

class Box {
  int value;
  String label;

  Box(this.value) : label = 'box';

  Box.named(this.value) : label = 'named';

  factory Box.alias(int value) = Box.named;

  String describe() => '$label:$value';
}

class Options {
  int value;
  String label;

  Options(this.value, {this.label = 'options'});

  String describe() => '$label:$value';
}

class Holder<T> {
  T value;

  Holder(this.value);

  String describe() => '$value';
}

void main() {
  final unnamed = Box.new;
  final unnamedAgain = Box.new;
  final named = Box.named;
  final alias = Box.alias;
  final aliasType = AliasBox.new;
  final options = Options.new;
  final intHolder = Holder<int>.new;
  const constMakers = <BoxMaker>[Box.new, Box.named, Box.alias];

  print(unnamed(1).describe());
  print(named(2).describe());
  print(alias(3).describe());
  print(aliasType(4).describe());
  print(options(5).describe());
  print(options(6, label: 'custom').describe());
  print(intHolder(7).describe());
  print(constMakers[0](8).describe());
  print(constMakers[1](9).describe());
  print(constMakers[2](10).describe());
  print(unnamed == unnamedAgain);
  print(unnamed == Box.new);
}
