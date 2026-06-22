class Vec {
  Vec(this.x, this.y);

  int x;
  int y;

  Vec operator +(Vec other) => Vec(x + other.x, y + other.y);

  Vec operator -() => Vec(-x, -y);

  bool operator <(Vec other) => x + y < other.x + other.y;

  int operator [](int index) => index == 0 ? x : y;

  void operator []=(int index, int value) {
    if (index == 0) {
      x = value;
    } else {
      y = value;
    }
  }

  String describe() => '$x,$y';
}

void main() {
  final a = Vec(1, 2);
  final b = Vec(3, 4);
  final c = a + b;
  final d = -a;
  a[1] = 9;
  print('${c.describe()} ${d.describe()}');
  print('${a[0]} ${a[1]} ${a < b}');
}
