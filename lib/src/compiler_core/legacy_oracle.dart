import 'package:kernel/kernel.dart' as k;

import '../backend/esm_backend.dart';

final class LegacyOracleResult {
  const LegacyOracleResult({
    required this.code,
    required this.diagnostics,
    required this.reason,
  });

  final String code;
  final List<String> diagnostics;
  final String reason;
}

final class LegacyBackendOracle {
  const LegacyBackendOracle();

  LegacyOracleResult compile(
    k.Component component, {
    required bool runMain,
    required String reason,
  }) {
    final result = emitEsm(component, runMain: runMain);
    return LegacyOracleResult(
      code: result.code,
      diagnostics: result.diagnostics,
      reason: reason,
    );
  }
}
