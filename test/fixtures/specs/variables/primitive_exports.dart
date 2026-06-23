final a = 1;
const b = 2;
int c = 1;
const constList = [1, 2];
const constSet = {1, 2};
const constMap = {'one': 1, 'two': 2};
const _privateConst = 9;

String _privateLabel() => 'private:$_privateConst';

void main() {
  print('a $a');
  print('b $b');
  print('c $c');
  print(_privateLabel());
}
