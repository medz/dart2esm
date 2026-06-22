class Point {
  int x;
  int y;
  String label;

  Point(this.x, this.y) : label = 'point';

  Point.origin() : x = 0, y = 0, label = 'origin' {
    label = '$label!';
  }

  Point.square(int size) : x = size, y = size, label = 'square';

  String describe() => '$label:$x,$y';
}

class Token {
  String value;

  Token.named(this.value);

  String describe() {
    return 'token $value';
  }
}

void main() {
  final origin = Point.origin();
  final square = Point.square(4);
  final regular = Point(2, 3);
  final token = Token.named('alpha');

  print(origin.describe());
  print(square.describe());
  print(regular.describe());
  print(token.describe());
}
