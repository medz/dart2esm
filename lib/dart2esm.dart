/// Public package metadata for dart2esm.
library;

export 'src/driver/compiler_driver.dart'
    show
        CompilerDriver,
        Dart2EsmException,
        Dart2EsmOptions,
        Dart2EsmResult,
        Dart2EsmUsageException,
        compileDartToEsm;
export 'src/foundation/diagnostics/compiler_diagnostic.dart'
    show CompilerDiagnostic, DiagnosticPhase, DiagnosticSeverity, SourceSpan;
export 'src/foundation/diagnostics/metrics.dart' show CodeSizeMetrics;
export 'src/options.dart'
    show
        Dart2EsmCompilerProfile,
        Dart2EsmEcmaTarget,
        Dart2EsmOptimizationLevel,
        Dart2EsmPlatform;

/// The current package version.
const packageVersion = '0.1.1';
