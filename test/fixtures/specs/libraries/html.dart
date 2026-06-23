// ignore_for_file: deprecated_member_use

import 'dart:html';

void main() {
  final title = document.title;
  window.localStorage['dart2esm'] = 'ok';
  final stored = window.localStorage['dart2esm'];
  print('html ${title.isEmpty} $stored');
}
