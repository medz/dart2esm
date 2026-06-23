// ignore_for_file: deprecated_member_use

import 'dart:svg' as svg;

void main() {
  final element = svg.SvgElement.tag('svg');
  element.id = 'root';
  print('svg ${element.id}');
}
