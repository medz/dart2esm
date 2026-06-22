abstract class Shape {
  factory Shape(int size) = Square;

  factory Shape.named(int size) = Square.named;

  factory Shape.alias(int size) = Shape.named;

  factory Shape.newAlias(int size) = Square.new;

  factory Shape.withDefault([int size]) = Square.withDefault;

  factory Shape.options({int size, String label}) = Square.options;
}

class Square implements Shape {
  int size;
  String label;

  Square(this.size) : label = 'square';

  Square.named(this.size) : label = 'named';

  Square.withDefault([this.size = 8]) : label = 'default';

  Square.options({this.size = 9, this.label = 'options'});

  String describe() => '$label:$size';
}

abstract class Widget {
  factory Widget.d() = Button;

  factory Widget.named(String label) = Button.named;
}

class Button implements Widget {
  String label;

  Button() : label = 'button';

  Button.named(this.label);

  String describe() => 'button:$label';
}

void main() {
  final unnamed = Shape(2) as Square;
  final named = Shape.named(3) as Square;
  final alias = Shape.alias(4) as Square;
  final newAlias = Shape.newAlias(5) as Square;
  final withDefault = Shape.withDefault() as Square;
  final optionsDefault = Shape.options() as Square;
  final optionsCustom = Shape.options(size: 6, label: 'custom') as Square;
  final widget = Widget.d() as Button;
  final namedWidget = Widget.named('primary') as Button;

  print(unnamed.describe());
  print(named.describe());
  print(alias.describe());
  print(newAlias.describe());
  print(withDefault.describe());
  print(optionsDefault.describe());
  print(optionsCustom.describe());
  print(widget.describe());
  print(namedWidget.describe());
}
