class Token {
  Token._(this.value);

  final int value;

  factory Token.parse(String text) {
    return Token._(int.parse(text));
  }

  factory Token.zero() {
    return Token._(0);
  }

  factory Token(int value) {
    if (value < 0) {
      return Token._(-value);
    }
    return Token._(value);
  }
}

void main() {
  final a = Token.parse('7');
  final b = Token.zero();
  final c = Token(-3);
  print('${a.value} ${b.value} ${c.value}');
}
