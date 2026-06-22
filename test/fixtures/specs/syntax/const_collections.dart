const numbers = [1, 2];
const sameNumbers = [1, 2];
const names = {'a', 'b'};
const sameNames = {'a', 'b'};
const mapping = {'a': 1, 'b': 2};
const sameMapping = {'a': 1, 'b': 2};
const shape = (1, name: 'dart');
const sameShape = (1, name: 'dart');

void main() {
  print(
    '${identical(numbers, sameNumbers)} ${identical(numbers, const [1, 2])}',
  );
  print('${identical(names, sameNames)} ${identical(names, const {'a', 'b'})}');
  print(
    '${identical(mapping, sameMapping)} ${identical(mapping, const {'a': 1, 'b': 2})}',
  );
  print(
    '${identical(shape, sameShape)} ${identical(shape, const (1, name: 'dart'))}',
  );
  print(numbers);
  print(names);
  print(mapping);
  print(shape);
}
