// ignore_for_file: deprecated_member_use

import 'dart:js';

void main() {
  final max = context['Math'].callMethod('max', [2, 5, 4]);
  context['__dart2esmLegacy'] = 'ok';

  final object = JsObject(context['Object']);
  object['value'] = 12;

  final array = JsArray.from([1, 2, 3]);
  array.add(4);

  print(
    'jsLegacy $max ${context['__dart2esmLegacy']} '
    '${context.hasProperty('console')} ${object['value']} '
    '${array.length} ${array[2]}',
  );
}
