// ignore_for_file: deprecated_member_use, sdk_version_since, unnecessary_type_check

import 'dart:async';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';
import 'dart:js_util' as js_util;

@JS('globalThis')
external JSObject get jsGlobalThis;

@JS('Math.max')
external JSNumber jsMathMax(JSNumber left, JSNumber right);

@JS('Math.PI')
external JSNumber get jsMathPi;

@JS('Date')
extension type JsDate._(JSObject _) implements JSObject {
  external factory JsDate(JSNumber value);
  external JSNumber getUTCFullYear();
}

@JSExport()
class JsExportedCounter {
  JsExportedCounter(this.value);

  int value;

  @JSExport('incBy')
  int increment(JSNumber amount) {
    value += amount.toDartInt;
    return value;
  }

  JSString get label => 'counter:$value'.toJS;

  set label(JSString nextValue) {
    value = int.parse(nextValue.toDart);
  }
}

Future<void> main() async {
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

  final utilObject = js_util.newObject<Object>();
  js_util.setProperty(utilObject, 'x', 3);
  final utilAdd = js_util.add<Object?>('a', 2);
  final utilMath = [
    js_util.subtract<num>(9, 4),
    js_util.multiply<num>(3, 4),
    js_util.divide<num>(9, 2),
    js_util.exponentiate<num>(2, 3),
    js_util.modulo<num>(9, 4),
  ].join(',');
  final utilCompare = [
    js_util.equal(1, '1'),
    js_util.strictEqual(1, '1'),
    js_util.notEqual(1, 2),
    js_util.strictNotEqual(1, '1'),
    js_util.greaterThan(3, 2),
    js_util.greaterThanOrEqual(3, 3),
    js_util.lessThan(2, 3),
    js_util.lessThanOrEqual(3, 3),
  ].join(',');
  final utilTypeof = js_util.typeofEquals('x', 'string');
  final utilTruthy =
      js_util.isTruthy(1) && !js_util.isTruthy(0) && js_util.not<bool>(0);
  final utilOr = js_util.or<Object?>(0, 'fallback');
  final utilAnd = js_util.and<Object?>(1, 'ok');
  final utilShift = js_util.unsignedRightShift(-1, 1);
  final utilProtoSame = js_util.strictEqual(
    js_util.objectGetPrototypeOf(utilObject),
    js_util.objectPrototype,
  );
  final utilKeys = js_util.objectKeys(utilObject).join(',');
  final utilArrayObject = js_util.jsify([1, 2]);
  final utilArray = js_util.isJavaScriptArray(utilArrayObject);
  final utilSimple = js_util.isJavaScriptSimpleObject(utilObject);
  final utilDartified =
      js_util.dartify(
            js_util.jsify({
              'k': [1],
            }),
          )
          as Map<Object?, Object?>;
  final utilDeleted = js_util.delete(utilObject, 'x');
  final utilHasAfterDelete = js_util.hasProperty(utilObject, 'x');
  final utilArrayConstructor = js_util.getProperty<Object>(
    js_util.globalThis,
    'Array',
  );
  final utilInstance = js_util.instanceof(
    utilArrayObject,
    utilArrayConstructor,
  );
  final utilInstanceString = js_util.instanceOfString(utilArrayObject, 'Array');
  print(
    'jsUtil $utilAdd $utilMath $utilCompare $utilTypeof $utilTruthy '
    '$utilOr,$utilAnd,$utilShift $utilProtoSame,$utilArray,$utilSimple,'
    '$utilKeys,${utilDartified['k'] is List},$utilDeleted,'
    '$utilHasAfterDelete,$utilInstance,$utilInstanceString',
  );

  final externalMax = jsMathMax(3.toJS, 8.toJS).toDartInt;
  final externalPi = jsMathPi.toDartDouble.floor();
  final externalDate = JsDate(0.toJS);
  print(
    'jsExternal $externalMax $externalPi '
    '${externalDate.getUTCFullYear().toDartInt}',
  );

  final promiseConstructor = globalContext.getProperty<JSObject>(
    'Promise'.toJS,
  );
  final resolvedPromise = promiseConstructor.callMethod<JSPromise<JSNumber>>(
    'resolve'.toJS,
    11.toJS,
  );
  final viaJsUtil = await js_util.promiseToFuture<JSNumber>(resolvedPromise);
  final viaToDart = await resolvedPromise.toDart;
  final viaFutureToJs = await Future<JSNumber>.value(13.toJS).toJS.toDart;
  final constructedPromise = JSPromise<JSNumber>(
    ((JSFunction resolve, JSFunction _reject) {
      resolve.callAsFunction(resolve, 19.toJS);
    }).toJS,
  ).toDart;
  final module = await importModule(
    'data:text/javascript,export const answer=17'.toJS,
  ).toDart;
  final moduleAnswer = module.getProperty<JSNumber>('answer'.toJS);
  print(
    'jsPromise ${viaJsUtil.toDartInt} ${viaToDart.toDartInt} '
    '${viaFutureToJs.toDartInt} ${moduleAnswer.toDartInt} '
    '${(await constructedPromise).toDartInt}',
  );

  final uniqueSymbol = JSSymbol('unique');
  final sharedSymbol = JSSymbol.forKey('dart2esm.shared');
  final jsIterable = <JSNumber>[1.toJS, 2.toJS].toJSIterable;
  final jsIterator = jsIterable.iterator;
  final firstResult = jsIterator.next();
  final secondResult = jsIterator.next();
  final doneResult = jsIterator.next();
  final dartValues = jsIterable.toDartIterable
      .map((value) => value.toDartInt)
      .join(',');
  final dartIterator = <JSNumber>[3.toJS, 4.toJS].iterator.toJSIterator;
  final dartIteratorFirst = dartIterator.next().value!.toDartInt;
  final jsToDartIterator = <JSNumber>[5.toJS].toJS.iterator.toDartIterator;
  final moved = jsToDartIterator.moveNext();
  final manualValue = JSIteratorResult<JSNumber>.value(21.toJS);
  final manualDone = JSIteratorResult<JSNumber>.done();
  print(
    'jsIterator ${uniqueSymbol.description} ${sharedSymbol.key} '
    '${JSSymbol.iterator is JSSymbol} ${firstResult.value!.toDartInt} '
    '${secondResult.value!.toDartInt} ${doneResult.isDone} $dartValues '
    '$dartIteratorFirst $moved ${jsToDartIterator.current.toDartInt} '
    '${manualValue.value!.toDartInt} ${manualDone.isDone}',
  );

  final jsBuffer = JSArrayBuffer(4);
  final dartBuffer = jsBuffer.toDart;
  final jsView = JSDataView(dartBuffer.toJS);
  final dartView = jsView.toDart;
  dartView.setUint8(0, 23);
  final jsBytes = JSUint8Array.withLength(3);
  final dartBytes = jsBytes.toDart;
  dartBytes[0] = 7;
  dartBytes[1] = 8;
  dartBytes[2] = 9;
  final roundTripBytes = dartBytes.toJS.toDart;
  final bufferBytes = JSUint8Array(dartBuffer.toJS).toDart;
  print(
    'jsTyped ${dartBuffer.lengthInBytes} ${dartView.toJS.toDart.getUint8(0)} '
    '${roundTripBytes.join(',')} ${bufferBytes[0]}',
  );

  final boxed = {'answer': 31}.toJSBox;
  final unboxed = boxed.toDart as Map<String, int>;
  final reference = ['dart-ref'].toExternalReference;
  final unreferenced = reference.toDartObject;
  print(
    'jsBox ${unboxed['answer']} ${unreferenced.single} '
    '${boxed.isA<JSBoxedDartObject>()}',
  );

  final exportedCounter = createJSInteropWrapper(JsExportedCounter(5));
  final exportInc = exportedCounter
      .callMethod<JSNumber>('incBy'.toJS, 4.toJS)
      .toDartInt;
  final exportLabel = exportedCounter
      .getProperty<JSString>('label'.toJS)
      .toDart;
  exportedCounter.setProperty('label'.toJS, '13'.toJS);
  final exportUpdated = exportedCounter
      .callMethod<JSNumber>('incBy'.toJS, 2.toJS)
      .toDartInt;
  print('jsExport $exportInc $exportLabel $exportUpdated');

  final exportedFunction = ((JSNumber value) => value.toDartInt + 1).toJS;
  final exportedCall =
      (exportedFunction.callAsFunction(null, 6.toJS) as JSNumber).toDartInt;
  final exportedDartCall = (exportedFunction.toDart as int Function(JSNumber))(
    7.toJS,
  );
  final thisObject = JSObject();
  thisObject.setProperty('prefix'.toJS, 'this'.toJS);
  final captureThis = ((JSObject self, JSString value) {
    final prefix = self.getProperty<JSString>('prefix'.toJS).toDart;
    return '$prefix:${value.toDart}'.toJS;
  }).toJSCaptureThis;
  final captured =
      (captureThis.callAsFunction(thisObject, 'ok'.toJS) as JSString).toDart;
  print(
    'jsFunction $exportedCall $exportedDartCall '
    '${exportedFunction.isA<JSExportedDartFunction>()} $captured',
  );
}
