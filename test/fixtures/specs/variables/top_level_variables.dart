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
int _computedBacking = 5;

int get _computedValue {
  print('get computed');
  return _computedBacking + 1;
}

set _computedValue(int value) {
  print('set computed $value');
  _computedBacking = value;
}

void main() {
  final firstRead = readFirst;
  final firstAssign = assignFirst;
  final firstFinal = finalValue;
  final firstComputed = _computedValue;
  assignFirst = 99;
  _computedValue = 40;
  print('initial $firstAssign');
  print('assigned $assignFirst');
  print('read $firstRead');
  print('read again $readFirst');
  print('final $firstFinal');
  print('const $constValue');
  print('computed $firstComputed ${_computedValue} backing $_computedBacking');
  print('count $initCount');
}
