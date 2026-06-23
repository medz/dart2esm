int checked(int value) {
  var touched = false;
  assert(() {
    touched = true;
    return value > 0;
  }(), 'positive');
  return touched ? value : -1;
}

String failed() {
  var messageEvaluated = false;
  try {
    assert(false, () {
      messageEvaluated = true;
      return 'boom';
    }());
    return 'not reached';
  } catch (error) {
    return 'caught:${error.toString().contains('boom')}:$messageEvaluated';
  }
}

void main() {
  print('${checked(3)} ${failed()}');
}
