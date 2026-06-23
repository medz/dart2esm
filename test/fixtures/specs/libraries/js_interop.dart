// ignore_for_file: deprecated_member_use

import 'dart:js_interop';
import 'dart:js_util' as js_util;

@JS('globalThis')
external JSObject get jsGlobalThis;

void main() {
  Object? hiddenGlobal = jsGlobalThis;
  final math = js_util.getProperty<Object?>(jsGlobalThis, 'Math');
  Object? hiddenMath = math;
  final max = js_util.callMethod<num>(math!, 'max', [3, 7, 5]);
  js_util.setProperty(jsGlobalThis, '__dart2esmProbe', 'ok');
  final probe = js_util.getProperty<Object?>(jsGlobalThis, '__dart2esmProbe');
  final hasConsole = js_util.hasProperty(jsGlobalThis, 'console');
  print(
    'jsInterop ${hiddenGlobal is JSObject} ${hiddenMath is JSObject} '
    '$max $probe $hasConsole',
  );
}
