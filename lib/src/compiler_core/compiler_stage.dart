enum Dart2EsmCompilerStageId {
  kernelFrontend,
  semanticWorld,
  dartLowering,
  moduleNormalizer,
  runtimeLinker,
  esmCodegen,
}

enum Dart2EsmStageCapability {
  kernelAccess,
  runtimeHelperReference,
  runtimeHelperDeclaration,
  codePrinting,
}

final class Dart2EsmStageContract {
  const Dart2EsmStageContract({
    required this.stageId,
    required this.ownerDirectory,
    required this.input,
    required this.output,
    this.capabilities = const {},
  });

  final Dart2EsmCompilerStageId stageId;
  final String ownerDirectory;
  final String input;
  final String output;
  final Set<Dart2EsmStageCapability> capabilities;

  bool get allowsKernelAccess =>
      capabilities.contains(Dart2EsmStageCapability.kernelAccess);

  bool get allowsRuntimeHelperReference =>
      capabilities.contains(Dart2EsmStageCapability.runtimeHelperReference);

  bool get allowsRuntimeHelperDeclaration =>
      capabilities.contains(Dart2EsmStageCapability.runtimeHelperDeclaration);

  bool get isCodePrinter =>
      capabilities.contains(Dart2EsmStageCapability.codePrinting);
}

const dart2EsmCompilerStageContracts = [
  Dart2EsmStageContract(
    stageId: Dart2EsmCompilerStageId.kernelFrontend,
    ownerDirectory: 'frontend',
    input: 'k.Component',
    output: 'KernelFrontendResult',
    capabilities: {Dart2EsmStageCapability.kernelAccess},
  ),
  Dart2EsmStageContract(
    stageId: Dart2EsmCompilerStageId.semanticWorld,
    ownerDirectory: 'semantic',
    input: 'KernelFrontendResult',
    output: 'SemanticWorldResult',
    capabilities: {Dart2EsmStageCapability.kernelAccess},
  ),
  Dart2EsmStageContract(
    stageId: Dart2EsmCompilerStageId.dartLowering,
    ownerDirectory: 'lowering',
    input: 'SemanticWorldResult',
    output: 'LoweringResult',
    capabilities: {
      Dart2EsmStageCapability.kernelAccess,
      Dart2EsmStageCapability.runtimeHelperReference,
    },
  ),
  Dart2EsmStageContract(
    stageId: Dart2EsmCompilerStageId.moduleNormalizer,
    ownerDirectory: 'transform',
    input: 'LoweringResult',
    output: 'NormalizationResult',
  ),
  Dart2EsmStageContract(
    stageId: Dart2EsmCompilerStageId.runtimeLinker,
    ownerDirectory: 'runtime',
    input: 'NormalizationResult',
    output: 'RuntimeLinkResult',
    capabilities: {
      Dart2EsmStageCapability.runtimeHelperReference,
      Dart2EsmStageCapability.runtimeHelperDeclaration,
    },
  ),
  Dart2EsmStageContract(
    stageId: Dart2EsmCompilerStageId.esmCodegen,
    ownerDirectory: 'codegen',
    input: 'EsmModuleIr',
    output: 'CodegenStageResult',
    capabilities: {Dart2EsmStageCapability.codePrinting},
  ),
];

final dart2EsmCompilerStageOrder = List<Dart2EsmCompilerStageId>.unmodifiable([
  for (final contract in dart2EsmCompilerStageContracts) contract.stageId,
]);

Dart2EsmStageContract dart2EsmStageContractFor(
  Dart2EsmCompilerStageId stageId,
) {
  for (final contract in dart2EsmCompilerStageContracts) {
    if (contract.stageId == stageId) {
      return contract;
    }
  }
  throw StateError('Unknown dart2esm compiler stage: $stageId');
}

final class Dart2EsmStageContext {
  const Dart2EsmStageContext({required this.runMain});

  final bool runMain;
}

abstract interface class Dart2EsmCompilerStage<Input, Output> {
  Dart2EsmCompilerStageId get stageId;

  Output run(Input input, Dart2EsmStageContext context);
}
