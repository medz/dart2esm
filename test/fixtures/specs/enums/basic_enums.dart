enum Color { red, green, blue }

void main() {
  print('name ${Color.red.name}');
  print('index ${Color.green.index}');
  print('count ${Color.values.length}');
  print('third ${Color.values[2].name}');
  print('string ${Color.red}');
  print('same ${Color.red == Color.red}');
  print('different ${Color.red == Color.green}');
}
