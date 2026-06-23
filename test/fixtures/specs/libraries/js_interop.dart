// ignore_for_file: deprecated_member_use

import 'dart:js_interop';
import 'dart:js_interop_unsafe';
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

  final jsString = 'hello'.toJS;
  final jsNumber = 42.toJS;
  final jsBool = true.toJS;
  final jsArray = <JSAny?>['x'.toJS, 3.toJS].toJS;
  final obj = JSObject();
  obj.setProperty('answer'.toJS, jsNumber);
  final got = obj.getProperty<JSNumber>('answer'.toJS).toDartInt;
  final hasAnswer = obj.hasProperty('answer'.toJS).toDart;
  final deletedAnswer = obj.delete('answer'.toJS).toDart;
  final modernMath = globalContext.getProperty<JSObject>('Math'.toJS);
  final modernMax = modernMath
      .callMethod<JSNumber>('max'.toJS, 1.toJS, 9.toJS, 4.toJS)
      .toDartInt;
  final missingIsUndefined = globalContext
      .getProperty<JSAny?>('__dart2esmMissing'.toJS)
      .isUndefined;
  obj.setProperty('nothing'.toJS, null);
  final nothingIsNull = obj.getProperty<JSAny?>('nothing'.toJS).isNull;
  obj['shortcut'] = 'yes'.toJS;
  final shortcut = (obj['shortcut'] as JSString).toDart;
  final hasShortcut = obj.has('shortcut');
  final dateConstructor = globalContext.getProperty<JSFunction>('Date'.toJS);
  final date = dateConstructor.callAsConstructor<JSObject>(0.toJS);
  final dateYear = date.callMethod<JSNumber>('getUTCFullYear'.toJS).toDartInt;
  final stringTypeof = jsString.typeofEquals('string');
  final arrayInstanceOf = jsArray.instanceof(
    globalContext.getProperty<JSFunction>('Array'.toJS),
  );
  final isArray = jsArray.isA<JSArray<JSAny?>>();
  final jsified =
      {
            'a': 1,
            'nested': [2],
          }.jsify()
          as JSObject;
  final dartified = jsified.dartify() as Map<Object?, Object?>;
  print(
    'jsInteropModern ${jsString.toDart} ${jsBool.toDart} '
    '${jsArray.toDart.length} $got $hasAnswer $deletedAnswer $modernMax '
    '$missingIsUndefined $nothingIsNull $stringTypeof '
    '$arrayInstanceOf $isArray ${dartified['a']} '
    '$shortcut $hasShortcut $dateYear',
  );
}
