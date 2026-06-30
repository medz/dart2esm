enum Dart2EsmCompilerStageId {
  kernelFrontend,
  semanticWorld,
  dartLowering,
  moduleNormalizer,
  runtimeLinker,
  esmCodegen,
}

const dart2EsmCompilerStageOrder = [
  Dart2EsmCompilerStageId.kernelFrontend,
  Dart2EsmCompilerStageId.semanticWorld,
  Dart2EsmCompilerStageId.dartLowering,
  Dart2EsmCompilerStageId.moduleNormalizer,
  Dart2EsmCompilerStageId.runtimeLinker,
  Dart2EsmCompilerStageId.esmCodegen,
];

final class Dart2EsmStageContext {
  const Dart2EsmStageContext({required this.runMain});

  final bool runMain;
}

abstract interface class Dart2EsmCompilerStage<Input, Output> {
  Dart2EsmCompilerStageId get stageId;

  Output run(Input input, Dart2EsmStageContext context);
}
