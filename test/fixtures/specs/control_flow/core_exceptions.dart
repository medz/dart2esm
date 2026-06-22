String classify(String kind) {
  try {
    if (kind == 'format') {
      throw FormatException('bad');
    }
    if (kind == 'plain') {
      throw Exception('plain');
    }
    if (kind == 'text') {
      throw 'text';
    }
    Object value = 1;
    value as String;
    return 'no error';
  } on FormatException catch (error) {
    return 'format:${error.toString()}';
  } on Exception catch (error) {
    return 'exception:${error.toString()}';
  } on Error catch (_) {
    return 'error';
  } catch (error) {
    return 'fallback:$error';
  }
}

String classifyConstructed(String kind) {
  try {
    if (kind == 'range') {
      throw RangeError.index(5, [1, 2]);
    }
    if (kind == 'argument') {
      throw ArgumentError.notNull('name');
    }
    if (kind == 'state') {
      throw StateError('bad');
    }
    if (kind == 'unsupported') {
      throw UnsupportedError('nope');
    }
    throw UnimplementedError('later');
  } on RangeError catch (error) {
    return 'range:${error.toString().contains('5')}';
  } on ArgumentError catch (error) {
    return 'argument:${error.toString().contains('name')}';
  } on StateError catch (error) {
    return 'state:${error.toString().contains('bad')}';
  } on Error catch (error) {
    return 'error:${error.toString().contains(kind == 'unsupported' ? 'nope' : 'later')}';
  }
}

void main() {
  print(classify('format'));
  print(classify('plain'));
  print(classify('text'));
  print(classify('cast'));
  print(classifyConstructed('range'));
  print(classifyConstructed('argument'));
  print(classifyConstructed('state'));
  print(classifyConstructed('unsupported'));
  print(classifyConstructed('unimplemented'));
}
