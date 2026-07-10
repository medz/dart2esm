part of 'esm_codegen.dart';

extension _BindingPrinter on _EsmPrinter {
  String _emitBinding(EsmBinding binding) {
    return switch (binding) {
      EsmIdentifierBinding() => binding.name,
      EsmObjectBindingPattern() =>
        compact
            ? '{${binding.bindings.map(_emitObjectPatternBinding).join(_comma)}}'
            : '{ ${binding.bindings.map(_emitObjectPatternBinding).join(_comma)} }',
      EsmArrayBindingPattern() =>
        '[${binding.elements.map(_emitBinding).join(_comma)}]',
    };
  }

  String _emitParameter(EsmParameter parameter) {
    return switch (parameter) {
      EsmIdentifierParameter() =>
        parameter.defaultValue == null
            ? parameter.name
            : '${_emitBindingPattern(parameter)}$_assignment${_emitExpression(parameter.defaultValue!)}',
      EsmObjectPatternParameter() =>
        '${_emitBindingPattern(parameter)}$_assignment{}',
      EsmArrayPatternParameter() => _emitBindingPattern(parameter),
    };
  }

  String _emitBindingPattern(EsmParameter parameter) {
    return switch (parameter) {
      EsmIdentifierParameter() => parameter.name,
      EsmObjectPatternParameter() =>
        compact
            ? '{${parameter.bindings.map(_emitObjectPatternBinding).join(_comma)}}'
            : '{ ${parameter.bindings.map(_emitObjectPatternBinding).join(_comma)} }',
      EsmArrayPatternParameter() =>
        '[${parameter.elements.map(_emitBindingPattern).join(_comma)}]',
    };
  }

  String _emitObjectPatternBinding(EsmObjectPatternBinding binding) {
    final property = _emitObjectPropertyName(binding.property);
    final name = binding.property == binding.name
        ? ''
        : '$_colon${binding.name}';
    final defaultValue = binding.defaultValue == null
        ? ''
        : '$_assignment${_emitExpression(binding.defaultValue!)}';
    return '$property$name$defaultValue';
  }
}
