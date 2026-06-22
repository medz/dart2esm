// ignore_for_file: unused_label

String route(int value) {
  var log = '';
  switch (value) {
    first:
    case 0:
      log = '${log}zero>';
      continue second;
    second:
    case 1:
      log = '${log}one>';
      break;
    grouped:
    case 2:
    case 3:
      log = '${log}group>';
      break;
    default:
      log = '${log}default>';
  }
  return log;
}

String loopAndSwitch(int value) {
  var log = '';
  for (var i = 0; i < 3; i = i + 1) {
    switch (value + i) {
      skip:
      case 1:
        log = '${log}skip>';
        continue;
      jump:
      case 2:
        log = '${log}jump>';
        continue done;
      done:
      case 3:
        log = '${log}done>';
        break;
      default:
        log = '${log}other>';
    }
    log = '${log}after>';
  }
  return log;
}

void main() {
  print(route(0));
  print(route(1));
  print(route(2));
  print(route(3));
  print(route(4));
  print(loopAndSwitch(0));
  print(loopAndSwitch(1));
}
