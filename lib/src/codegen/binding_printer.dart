part of 'esm_codegen.dart';

extension _BindingPrinter on _EsmPrinter {
  String _emitBinding(EsmBinding binding) {
    return switch (binding) {
      EsmIdentifierBinding() => binding.name,
      EsmObjectBindingPattern() =>
        '{ ${binding.bindings.map(_emitObjectPatternBinding).join(', ')} }',
      EsmArrayBindingPattern() =>
        '[${binding.elements.map(_emitBinding).join(', ')}]',
    };
  }

  String _emitParameter(EsmParameter parameter) {
    return switch (parameter) {
      EsmIdentifierParameter() =>
        parameter.defaultValue == null
            ? parameter.name
            : '${_emitBindingPattern(parameter)} = ${_emitExpression(parameter.defaultValue!)}',
      EsmObjectPatternParameter() => '${_emitBindingPattern(parameter)} = {}',
      EsmArrayPatternParameter() => _emitBindingPattern(parameter),
    };
  }

  String _emitBindingPattern(EsmParameter parameter) {
    return switch (parameter) {
      EsmIdentifierParameter() => parameter.name,
      EsmObjectPatternParameter() =>
        '{ ${parameter.bindings.map(_emitObjectPatternBinding).join(', ')} }',
      EsmArrayPatternParameter() =>
        '[${parameter.elements.map(_emitBindingPattern).join(', ')}]',
    };
  }

  String _emitObjectPatternBinding(EsmObjectPatternBinding binding) {
    final property = _emitObjectPropertyName(binding.property);
    final name = binding.property == binding.name ? '' : ': ${binding.name}';
    final defaultValue = binding.defaultValue == null
        ? ''
        : ' = ${_emitExpression(binding.defaultValue!)}';
    return '$property$name$defaultValue';
  }
}
