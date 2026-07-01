import '../compiler_stage.dart';
import '../ir_builder/esm_ir_builder.dart';
import '../ir/esm_ir.dart';

final class NormalizationResult {
  const NormalizationResult({
    required this.irBuild,
    required this.module,
    required this.changed,
    required this.invalidatesSemanticWorld,
  });

  final EsmIrBuildResult irBuild;
  final EsmModuleIr module;
  final bool changed;
  final bool invalidatesSemanticWorld;

  get runtimeHelpers => irBuild.runtimeHelpers;
}

final class ModuleNormalizerStage
    implements Dart2EsmCompilerStage<EsmIrBuildResult, NormalizationResult> {
  const ModuleNormalizerStage();

  @override
  Dart2EsmCompilerStageId get stageId =>
      Dart2EsmCompilerStageId.moduleNormalizer;

  @override
  NormalizationResult run(
    EsmIrBuildResult input,
    Dart2EsmStageContext context,
  ) {
    return normalize(input);
  }

  NormalizationResult normalize(EsmIrBuildResult irBuild) {
    final normalized = _normalizeModuleItems(irBuild.module.items);
    return NormalizationResult(
      irBuild: irBuild,
      module: normalized.changed
          ? EsmModuleIr(items: normalized.items)
          : irBuild.module,
      changed: normalized.changed,
      invalidatesSemanticWorld: false,
    );
  }

  ({List<EsmModuleItemIr> items, bool changed}) _normalizeModuleItems(
    Iterable<EsmModuleItemIr> items,
  ) {
    var changed = false;
    final normalized = <EsmModuleItemIr>[];
    for (final item in items) {
      switch (item) {
        case EsmRawModuleItemIr():
          if (item.source.trim().isEmpty) {
            changed = true;
            continue;
          }
          normalized.add(item);
        case EsmFunctionIr():
          final body = _normalizeStatementList(item.body);
          if (body.changed) {
            changed = true;
            normalized.add(
              EsmFunctionIr(
                name: item.name,
                export: item.export,
                parameters: item.parameters,
                body: body.statements,
              ),
            );
          } else {
            normalized.add(item);
          }
        case EsmClassIr():
          final klass = _normalizeClass(item);
          changed = changed || klass.changed;
          normalized.add(klass.item);
        case EsmStatementIr():
          final statement = _normalizeStatement(item);
          if (statement.changed) {
            changed = true;
          }
          final normalizedStatement = statement.statement;
          if (normalizedStatement == null) {
            changed = true;
            continue;
          }
          normalized.add(normalizedStatement);
      }
    }
    return (items: normalized, changed: changed);
  }

  ({EsmClassIr item, bool changed}) _normalizeClass(EsmClassIr item) {
    var changed = false;
    final constructor = item.constructor;
    EsmClassConstructorIr? normalizedConstructor;
    if (constructor != null) {
      final body = _normalizeStatementList(constructor.body);
      if (body.changed) {
        changed = true;
        normalizedConstructor = EsmClassConstructorIr(
          parameters: constructor.parameters,
          body: body.statements,
        );
      } else {
        normalizedConstructor = constructor;
      }
    }

    final methods = <EsmClassMethodIr>[];
    for (final method in item.methods) {
      final body = _normalizeStatementList(method.body);
      if (body.changed) {
        changed = true;
        methods.add(
          EsmClassMethodIr(
            key: method.key,
            kind: method.kind,
            isStatic: method.isStatic,
            parameters: method.parameters,
            body: body.statements,
          ),
        );
      } else {
        methods.add(method);
      }
    }

    if (!changed) {
      return (item: item, changed: false);
    }
    return (
      item: EsmClassIr(
        name: item.name,
        export: item.export,
        superclass: item.superclass,
        constructor: normalizedConstructor,
        methods: methods,
      ),
      changed: true,
    );
  }

  ({List<EsmStatementIr> statements, bool changed}) _normalizeStatementList(
    Iterable<EsmStatementIr> statements,
  ) {
    var changed = false;
    final normalized = <EsmStatementIr>[];
    for (final statement in statements) {
      final result = _normalizeStatement(statement);
      changed = changed || result.changed;
      final normalizedStatement = result.statement;
      if (normalizedStatement == null) {
        changed = true;
        continue;
      }
      normalized.add(normalizedStatement);
    }
    return (statements: normalized, changed: changed);
  }

  ({EsmStatementIr? statement, bool changed}) _normalizeStatement(
    EsmStatementIr statement,
  ) {
    switch (statement) {
      case EsmBlockStatementIr():
        final body = _normalizeStatementList(statement.body);
        if (body.statements.isEmpty) {
          return (statement: null, changed: true);
        }
        if (body.changed) {
          return (
            statement: EsmBlockStatementIr(body.statements),
            changed: true,
          );
        }
        return (statement: statement, changed: false);
      case EsmLabeledStatementIr():
        final body = _normalizeStatement(statement.statement);
        if (!body.changed) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmLabeledStatementIr(
            label: statement.label,
            statement: body.statement ?? const EsmBlockStatementIr([]),
          ),
          changed: true,
        );
      case EsmIfStatementIr():
        final thenBody = _normalizeStatementList(statement.thenBody);
        final otherwiseBody = statement.otherwiseBody == null
            ? null
            : _normalizeStatementList(statement.otherwiseBody!);
        if (!thenBody.changed &&
            (otherwiseBody == null || !otherwiseBody.changed)) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmIfStatementIr(
            condition: statement.condition,
            thenBody: thenBody.statements,
            otherwiseBody: otherwiseBody?.statements,
          ),
          changed: true,
        );
      case EsmWhileStatementIr():
        final body = _normalizeStatementList(statement.body);
        if (!body.changed) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmWhileStatementIr(
            condition: statement.condition,
            body: body.statements,
          ),
          changed: true,
        );
      case EsmDoStatementIr():
        final body = _normalizeStatementList(statement.body);
        if (!body.changed) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmDoStatementIr(
            body: body.statements,
            condition: statement.condition,
          ),
          changed: true,
        );
      case EsmSwitchStatementIr():
        var changed = false;
        final cases = [
          for (final switchCase in statement.cases)
            () {
              final body = _normalizeStatementList(switchCase.body);
              if (!body.changed) {
                return switchCase;
              }
              changed = true;
              return EsmSwitchCaseIr(
                expressions: switchCase.expressions,
                isDefault: switchCase.isDefault,
                body: body.statements,
              );
            }(),
        ];
        if (!changed) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmSwitchStatementIr(
            expression: statement.expression,
            cases: cases,
          ),
          changed: true,
        );
      case EsmForStatementIr():
        final body = _normalizeStatementList(statement.body);
        if (!body.changed) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmForStatementIr(
            initializers: statement.initializers,
            condition: statement.condition,
            updates: statement.updates,
            body: body.statements,
          ),
          changed: true,
        );
      case EsmTryStatementIr():
        final body = _normalizeStatementList(statement.body);
        final catchBody = statement.catchBody == null
            ? null
            : _normalizeStatementList(statement.catchBody!);
        final finallyBody = statement.finallyBody == null
            ? null
            : _normalizeStatementList(statement.finallyBody!);
        if (!body.changed &&
            (catchBody == null || !catchBody.changed) &&
            (finallyBody == null || !finallyBody.changed)) {
          return (statement: statement, changed: false);
        }
        return (
          statement: EsmTryStatementIr(
            body: body.statements,
            catchParameter: statement.catchParameter,
            catchBody: catchBody?.statements,
            finallyBody: finallyBody?.statements,
          ),
          changed: true,
        );
      case EsmExpressionStatementIr() ||
          EsmBreakStatementIr() ||
          EsmContinueStatementIr() ||
          EsmVariableDeclarationIr() ||
          EsmReturnStatementIr() ||
          EsmThrowStatementIr():
        return (statement: statement, changed: false);
    }
  }
}
