int pairWalk(int start, int end) {
  var total = 0;
  for (
    var left = start, right = end;
    left < right;
    left = left + 1, right = right - 1
  ) {
    total = total + left + right;
  }
  return total;
}

void main() {
  print('walk ${pairWalk(0, 4)}');
  print('walk ${pairWalk(1, 6)}');
}
