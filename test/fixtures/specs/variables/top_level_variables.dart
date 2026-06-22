int initCount = 0;

int init(String name, int value) {
  print('init $name');
  initCount = initCount + 1;
  return value;
}

int readFirst = init('readFirst', 10);
int assignFirst = init('assignFirst', 20);
final finalValue = init('finalValue', 30);
const constValue = 40;

void main() {
  final firstRead = readFirst;
  final firstAssign = assignFirst;
  final firstFinal = finalValue;
  assignFirst = 99;
  print('initial $firstAssign');
  print('assigned $assignFirst');
  print('read $firstRead');
  print('read again $readFirst');
  print('final $firstFinal');
  print('const $constValue');
  print('count $initCount');
}
