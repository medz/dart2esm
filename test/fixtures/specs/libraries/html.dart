// ignore_for_file: deprecated_member_use

import 'dart:html';

Object? hide(Object? value) => value;

void main() {
  final title = document.title;
  window.localStorage['dart2esm'] = 'ok';
  final stored = window.localStorage['dart2esm'];

  final root = Element.tag('section');
  root.id = 'root';
  root.text = 'hello';
  final child = document.createElement('span');
  child.text = ' child';
  root.append(child);
  document.body!.append(root);
  final found = document.querySelector('#root');
  final hiddenRoot = hide(root);
  final castRoot = hiddenRoot as Element?;

  print(
    'html ${title.isEmpty} $stored ${found?.id} ${found?.text} '
    '${hiddenRoot is Element} ${castRoot?.id}',
  );
}
