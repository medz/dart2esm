class Point {
  const Point(this.x, this.y);

  const Point.origin() : x = 0, y = 0;

  final int x;
  final int y;

  int get sum => x + y;

  String describe() => '$x,$y';
}

class Adder {
  const Adder(this.base);

  final int base;

  int call(int value) => base + value;
}

const sharedPoint = Point(2, 3);
const origin = Point.origin();
const sharedAdder = Adder(10);

dynamic hide(dynamic value) => value;

void main() {
  final maybePoint = hide(sharedPoint);
  final maybeAdder = hide(sharedAdder);
  print('${sharedPoint.describe()} ${sharedPoint.sum} ${maybePoint is Point}');
  print('${origin.describe()} ${sharedAdder(5)} ${maybeAdder is Adder}');
  print(identical(sharedPoint, sharedPoint));
}
