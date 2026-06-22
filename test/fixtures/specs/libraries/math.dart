import 'dart:math' as math;

dynamic hide(Object? value) => value;

void main() {
  print('min ${math.min(2, 3)}');
  print('max ${math.max(2, 3)}');
  print('pow ${math.pow(2, 3)}');
  print('atan2 ${math.atan2(0, 1) == 0}');
  print('pi ${math.pi > 3}');
  print('sqrt2 ${math.sqrt2 > 1}');

  final seededA = math.Random(1);
  final seededB = math.Random(1);
  final firstA = seededA.nextInt(1000);
  final firstB = seededB.nextInt(1000);
  final doubleValue = seededA.nextDouble();
  final boolValue = seededA.nextBool();
  print(
    'random ${firstA == firstB} ${firstA >= 0 && firstA < 1000} '
    '${doubleValue >= 0 && doubleValue < 1} ${hide(boolValue) is bool}',
  );

  final secure = math.Random.secure().nextInt(10);
  print('secure ${secure >= 0 && secure < 10}');

  final point = math.Point<num>(3, 4);
  final otherPoint = math.Point<num>(1, 2);
  final moved = point + otherPoint;
  final delta = point - otherPoint;
  final scaled = otherPoint * 3;
  const constPoint = math.Point<int>(2, 5);
  print(
    'point ${point.x}:${point.y} ${point.magnitude.toStringAsFixed(1)} '
    '${point.distanceTo(otherPoint).toStringAsFixed(2)} '
    '${point.squaredDistanceTo(otherPoint)} ${moved.x}:${moved.y} '
    '${delta.x}:${delta.y} ${scaled.x}:${scaled.y} '
    '${point == math.Point<num>(3, 4)} ${hide(point) is math.Point} '
    '${constPoint.x + constPoint.y}',
  );

  final rectangle = math.Rectangle<num>(1, 2, 3, 4);
  final otherRectangle = math.Rectangle<num>(2, 3, 5, 1);
  final intersection = rectangle.intersection(otherRectangle)!;
  final bounds = rectangle.boundingBox(otherRectangle);
  final fromPoints = math.Rectangle<num>.fromPoints(
    math.Point<num>(5, 6),
    math.Point<num>(2, 1),
  );
  const constRectangle = math.Rectangle<int>(0, 1, 2, 3);
  print(
    'rect ${rectangle.left}:${rectangle.top}:${rectangle.right}:${rectangle.bottom} '
    '${rectangle.topLeft.x}:${rectangle.bottomRight.y} '
    '${rectangle.containsPoint(math.Point<num>(2, 3))} '
    '${rectangle.containsRectangle(math.Rectangle<num>(1, 2, 1, 1))} '
    '${rectangle.intersects(otherRectangle)} '
    '${intersection.left}:${intersection.top}:${intersection.width}:${intersection.height} '
    '${bounds.left}:${bounds.top}:${bounds.width}:${bounds.height} '
    '${fromPoints.left}:${fromPoints.top}:${fromPoints.width}:${fromPoints.height} '
    '${rectangle == math.Rectangle<num>(1, 2, 3, 4)} '
    '${hide(rectangle) is math.Rectangle} ${constRectangle.bottom}',
  );
}
