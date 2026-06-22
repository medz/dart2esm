int initCount = 0;

int init(String name, int value) {
  print('init $name');
  initCount = initCount + 1;
  return value;
}

late int lazyTop = init('top', 10);
late int assignTop;
late final int finalTop;

class Holder {
  static late int lazyStatic = init('static', 20);

  late int lazyInstance = init('instance', 30);
  late int assigned;
  late final int once;

  Holder(int value) {
    assigned = value;
    once = value + 1;
  }

  int read() => lazyInstance + assigned + once;
}

void main() {
  assignTop = 5;
  finalTop = 6;
  print('before $initCount');
  print('top $lazyTop');
  print('top again $lazyTop');
  print('assign $assignTop');
  print('final $finalTop');
  try {
    finalTop = 7;
  } catch (_) {
    print('final blocked');
  }
  print('static ${Holder.lazyStatic}');
  final holder = Holder(7);
  print('instance ${holder.read()}');
  holder.assigned = 8;
  print('assigned ${holder.assigned}');
  try {
    holder.once = 9;
  } catch (_) {
    print('once blocked');
  }
  print('count $initCount');
}
