int initCount = 0;

int init(String name, int value) {
  print('init $name');
  initCount = initCount + 1;
  return value;
}

int readFirst = init('readFirst', 10);
int assignFirst = init('assignFirst', 20);
final finalValue = init('finalValue', 30);

void main() {
  assignFirst = 99;
  print('assigned $assignFirst');
  print('read $readFirst');
  print('read again $readFirst');
  print('final $finalValue');
  print('count $initCount');
}
