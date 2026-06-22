void main() {
  var total = 0;
  var i = 0;

  do {
    total = total + i;
    i = i + 1;
  } while (i < 3);

  for (final value in [1, 2, 3, 4]) {
    if (value == 3) {
      continue;
    }
    total = total + value;
    if (total > 6) {
      break;
    }
  }

  switch (total) {
    case 6:
      print('six');
      break;
    case 7:
    case 8:
      print('seven/eight');
      break;
    default:
      print('other $total');
  }

  print('total $total');
}
