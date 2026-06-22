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

void main() {
  print(classify('format'));
  print(classify('plain'));
  print(classify('text'));
  print(classify('cast'));
}
