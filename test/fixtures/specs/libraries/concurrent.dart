import 'dart:concurrent';

void main() {
  final mutex = Mutex();
  final value = mutex.runLocked(() => 42);
  print('concurrent $value');
}
