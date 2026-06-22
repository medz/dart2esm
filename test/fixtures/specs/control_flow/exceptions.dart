class ParseIssue {
  String message;

  ParseIssue(this.message);
}

class NotFound {
  String path;

  NotFound(this.path);
}

class UnknownIssue {
  String code;

  UnknownIssue(this.code);
}

String classify(String kind) {
  try {
    if (kind == 'parse') {
      throw ParseIssue('line');
    }
    if (kind == 'missing') {
      throw NotFound('index');
    }
    if (kind == 'string') {
      throw 'text';
    }
    throw UnknownIssue('other');
  } on ParseIssue catch (error) {
    return 'parse:${error.message}';
  } on NotFound catch (error, stack) {
    return 'missing:${error.path}:${stack.toString() == '' ? 'missing' : 'trace'}';
  } on String catch (error) {
    return 'string:$error';
  } catch (error) {
    return 'fallback';
  }
}

void runFinally() {
  var state = 'start';
  try {
    throw 'boom';
  } catch (error) {
    print('caught:$state');
    state = 'caught';
  } finally {
    print('finally:$state');
  }
}

String rethrowFlow() {
  try {
    try {
      throw NotFound('inner');
    } on ParseIssue {
      return 'wrong';
    } catch (error) {
      rethrow;
    }
  } on NotFound catch (error) {
    return 'rethrow:${error.path}';
  }
}

void main() {
  print(classify('parse'));
  print(classify('missing'));
  print(classify('string'));
  print(classify('unknown'));
  runFinally();
  print(rethrowFlow());
}
