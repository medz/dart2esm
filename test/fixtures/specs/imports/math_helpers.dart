const helperOffset = 5;
int helperCounter = 0;

int add(int left, int right) {
  helperCounter = helperCounter + 1;
  return left + right + helperOffset;
}

class Greeter {
  String prefix;

  Greeter(this.prefix);

  String say(String name) {
    return '$prefix $name ${add(1, 1)}';
  }
}
