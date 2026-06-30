import 'package:kernel/kernel.dart' as k;

import '../kernel/kernel_references.dart';
import '../kernel/sdk_symbols.dart';
import 'runtime_helpers.dart';

final class DartSdkStaticGetEmitter {
  DartSdkStaticGetEmitter({required this.helpers});

  final EsmRuntimeHelperUseSet helpers;

  String? emit(k.StaticGet expression) {
    final reference = expression.targetReference;
    return _emitDeveloperStaticGet(reference) ??
        _emitAsyncStaticGet(reference) ??
        _emitJsInteropStaticGet(reference) ??
        _emitCoreStaticGet(reference) ??
        _emitConvertStaticGet(reference) ??
        _emitMathStaticGet(reference) ??
        _emitTypedDataStaticGet(reference) ??
        _emitFfiStaticGet(reference) ??
        _emitIsolateStaticGet(reference) ??
        _emitIoStaticGet(reference);
  }

  String? _emitDeveloperStaticGet(k.Reference reference) {
    final path = kernelReferencePath(reference);
    if (!path.startsWith('dart:developer::')) {
      return null;
    }
    if (path.endsWith('::Timeline::@getters::now')) {
      return 'Math.trunc(Date.now() * 1000)';
    }
    if (path.endsWith('::@getters::extensionStreamHasListener')) {
      return 'false';
    }
    if (path.endsWith('::@getters::reachabilityBarrier')) {
      return '0';
    }
    if (path.endsWith('::NativeRuntime::@getters::buildId')) {
      return 'null';
    }
    if (path.endsWith('::UserTag::@getters::defaultTag')) {
      helpers.add('__dartDeveloperUserTag');
      return '__dartDeveloperUserTag("Default")';
    }
    return null;
  }

  String? _emitAsyncStaticGet(k.Reference reference) {
    final path = kernelReferencePath(reference);
    if (path == 'dart:async::Zone::@getters::current') {
      helpers.add('__dartZone');
      return '__dartCurrentZone';
    }
    if (path == 'dart:async::Zone::@getters::root') {
      helpers.add('__dartZone');
      return '__dartRootZone';
    }
    return null;
  }

  String? _emitJsInteropStaticGet(k.Reference reference) {
    switch (jsInteropStaticGetSymbol(reference)) {
      case JsInteropStaticGetSymbol.globalThis:
        return 'globalThis';
      case JsInteropStaticGetSymbol.objectPrototype:
        return 'Object.prototype';
      case null:
        break;
    }
    final path = kernelReferencePath(reference);
    if (path == 'dart:html::@getters::window') {
      return 'globalThis.window';
    }
    if (path == 'dart:html::@getters::document') {
      return 'globalThis.document';
    }
    if (path == 'dart:web_gl::RenderingContext::@getters::supported') {
      return '(!!globalThis.window?.WebGLRenderingContext)';
    }
    if (path == 'dart:web_audio::AudioContext::@getters::supported') {
      return '(!!(globalThis.window?.AudioContext || globalThis.window?.webkitAudioContext || globalThis.AudioContext || globalThis.webkitAudioContext))';
    }
    if (path == 'dart:indexed_db::IdbFactory::@getters::supported') {
      return '(!!(globalThis.window?.indexedDB || globalThis.window?.webkitIndexedDB || globalThis.window?.mozIndexedDB || globalThis.indexedDB))';
    }
    final symbolName = jsSymbolStaticGetterName(reference);
    if (symbolName != null) {
      return switch (symbolName) {
        'asyncIterator' => 'Symbol.asyncIterator',
        'hasInstance' => 'Symbol.hasInstance',
        'isConcatSpreadable' => 'Symbol.isConcatSpreadable',
        'iterator' => 'Symbol.iterator',
        'match' => 'Symbol.match',
        'matchAll' => 'Symbol.matchAll',
        'replace' => 'Symbol.replace',
        'search' => 'Symbol.search',
        'species' => 'Symbol.species',
        'split' => 'Symbol.split',
        'toPrimitive' => 'Symbol.toPrimitive',
        'toStringTag' => 'Symbol.toStringTag',
        'unscopables' => 'Symbol.unscopables',
        _ => null,
      };
    }
    return null;
  }

  String? _emitCoreStaticGet(k.Reference reference) {
    final path = kernelReferencePath(reference);
    if (path.startsWith('dart:core::BigInt::@getters::')) {
      return switch (path.split('::').last) {
        'zero' => '0n',
        'one' => '1n',
        'two' => '2n',
        _ => null,
      };
    }
    if (path.startsWith('dart:core::double::@getters::')) {
      return switch (path.split('::').last) {
        'nan' => 'Number.NaN',
        'infinity' => 'Infinity',
        'negativeInfinity' => '-Infinity',
        'minPositive' => '5e-324',
        'maxFinite' => '1.7976931348623157e+308',
        _ => null,
      };
    }
    if (path == 'dart:core::StackTrace::@getters::current') {
      return '(new Error().stack ?? "<javascript stack unavailable>")';
    }
    if (path == 'dart:core::Uri::@getters::base') {
      helpers.add('__dartUriParse');
      return '__dartUriParse((globalThis.location?.href ?? import.meta.url), false)';
    }
    return null;
  }

  String? _emitConvertStaticGet(k.Reference reference) {
    final path = kernelReferencePath(reference);
    if (!path.startsWith('dart:convert::')) {
      return null;
    }
    final name = path.split('::').last;
    switch (name) {
      case 'json':
        helpers.add('__dartJsonCodec');
        return '__dartJsonCodec()';
      case 'utf8':
        helpers.add('__dartUtf8Codec');
        return '__dartUtf8Codec()';
      case 'ascii':
        helpers.add('__dartAsciiCodec');
        return '__dartAsciiCodec()';
      case 'latin1':
        helpers.add('__dartLatin1Codec');
        return '__dartLatin1Codec()';
      case 'base64':
        helpers.add('__dartBase64Codec');
        return '__dartBase64Codec(false)';
      case 'base64Url':
        helpers.add('__dartBase64Codec');
        return '__dartBase64Codec(true)';
      case 'htmlEscape':
        helpers.add('__dartHtmlEscape');
        return '__dartHtmlEscape()';
      case 'unknown':
        helpers.add('__dartHtmlEscapeMode');
        return '__dartHtmlEscapeMode("unknown", true, true, true, true)';
      case 'attribute':
        helpers.add('__dartHtmlEscapeMode');
        return '__dartHtmlEscapeMode("attribute", true, true, false, false)';
      case 'sqAttribute':
        helpers.add('__dartHtmlEscapeMode');
        return '__dartHtmlEscapeMode("attribute", true, false, true, false)';
      case 'element':
        helpers.add('__dartHtmlEscapeMode');
        return '__dartHtmlEscapeMode("element", true, false, false, false)';
      default:
        return null;
    }
  }

  String? _emitMathStaticGet(k.Reference reference) {
    final path = kernelReferencePath(reference);
    if (!path.startsWith('dart:math::')) {
      return null;
    }
    final name = path.split('::').last;
    return switch (name) {
      'pi' => 'Math.PI',
      'e' => 'Math.E',
      'ln2' => 'Math.LN2',
      'ln10' => 'Math.LN10',
      'log2e' => 'Math.LOG2E',
      'log10e' => 'Math.LOG10E',
      'sqrt1_2' => 'Math.SQRT1_2',
      'sqrt2' => 'Math.SQRT2',
      _ => null,
    };
  }

  String? _emitTypedDataStaticGet(k.Reference reference) {
    final path = kernelReferencePath(reference);
    if (!path.startsWith('dart:typed_data::Endian::')) {
      return null;
    }
    final name = path.split('::').last;
    return switch (name) {
      'big' => 'false',
      'little' => 'true',
      'host' => '(new Uint8Array(new Uint16Array([1]).buffer)[0] === 1)',
      _ => null,
    };
  }

  String? _emitFfiStaticGet(k.Reference reference) {
    final path = kernelReferencePath(reference);
    if (path == 'dart:ffi::@getters::nullptr') {
      helpers.add('__dartFfiPointer');
      return '__dartFfiPointer(0)';
    }
    return null;
  }

  String? _emitIsolateStaticGet(k.Reference reference) {
    final path = kernelReferencePath(reference);
    if (path == 'dart:isolate::Isolate::@getters::current') {
      helpers.add('__dartIsolate');
      return '__dartCurrentIsolate';
    }
    return null;
  }

  String? _emitIoStaticGet(k.Reference reference) {
    final path = kernelReferencePath(reference);
    if (!path.startsWith('dart:io::Platform::@getters::')) {
      return null;
    }
    final name = path.split('::').last;
    const operatingSystem =
        '((globalThis.process?.platform === "win32") ? "windows" : (globalThis.process?.platform === "darwin") ? "macos" : (globalThis.process?.platform === "linux") ? "linux" : "browser")';
    return switch (name) {
      'operatingSystem' => operatingSystem,
      'pathSeparator' => '($operatingSystem === "windows" ? "\\\\" : "/")',
      'isWindows' => '($operatingSystem === "windows")',
      'isLinux' => '($operatingSystem === "linux")',
      'isMacOS' => '($operatingSystem === "macos")',
      'isAndroid' => 'false',
      'isIOS' => 'false',
      'isFuchsia' => 'false',
      'environment' => 'Object.freeze({})',
      'localHostname' => '""',
      'numberOfProcessors' => '1',
      'script' =>
        'new URL("file:///", globalThis.location?.href ?? "file:///")',
      'resolvedExecutable' => 'globalThis.process?.execPath ?? ""',
      'executable' => 'globalThis.process?.execPath ?? ""',
      'executableArguments' => 'Object.freeze([])',
      'packageConfig' => 'null',
      'version' => '""',
      'localeName' => 'globalThis.navigator?.language ?? "en"',
      _ => null,
    };
  }
}
