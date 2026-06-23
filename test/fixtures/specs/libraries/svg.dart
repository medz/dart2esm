// ignore_for_file: deprecated_member_use

import 'dart:svg' as svg;

Object? hide(Object? value) => value;

void main() {
  final element = svg.SvgElement.tag('svg');
  element.id = 'root';
  element.setAttribute('viewBox', '0 0 10 10');

  final title = svg.SvgElement.tag('title');
  title.text = 'Dart';
  element.append(title);
  final maybeTitle = hide(title);
  final castTitle = maybeTitle as svg.SvgElement?;

  print(
    'svg ${element.id} ${element.getAttribute('viewBox')} '
    '${element.children.length} ${castTitle?.text} '
    '${maybeTitle is svg.SvgElement}',
  );
}
