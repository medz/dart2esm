part of 'esm_codegen.dart';

extension _LiteralPrinter on _EsmPrinter {
  String _escapeTemplateText(String value) {
    return value
        .replaceAll(r'\', r'\\')
        .replaceAll('`', r'\`')
        .replaceAll(r'${', r'\${');
  }

  String _emitNumber(num value) {
    if (value.isNaN) {
      return 'NaN';
    }
    if (value == double.infinity) {
      return 'Infinity';
    }
    if (value == double.negativeInfinity) {
      return '-Infinity';
    }
    return value.toString();
  }
}
