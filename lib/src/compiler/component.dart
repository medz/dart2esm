enum CompilerComponentId {
  parser,
  semantic,
  lowerer,
  moduleBuilder,
  transformer,
  runtime,
  codegen,
}

enum CompilerComponentCapability {
  kernelAccess,
  runtimeHelperReference,
  runtimeHelperDeclaration,
  codePrinting,
}

final class CompilerComponentContract {
  const CompilerComponentContract({
    required this.id,
    required this.ownerDirectory,
    required this.input,
    required this.output,
    this.capabilities = const {},
  });

  final CompilerComponentId id;
  final String ownerDirectory;
  final String input;
  final String output;
  final Set<CompilerComponentCapability> capabilities;

  bool get allowsKernelAccess =>
      capabilities.contains(CompilerComponentCapability.kernelAccess);

  bool get allowsRuntimeHelperReference =>
      capabilities.contains(CompilerComponentCapability.runtimeHelperReference);

  bool get allowsRuntimeHelperDeclaration => capabilities.contains(
    CompilerComponentCapability.runtimeHelperDeclaration,
  );

  bool get isCodePrinter =>
      capabilities.contains(CompilerComponentCapability.codePrinting);
}

const compilerComponentContracts = [
  CompilerComponentContract(
    id: CompilerComponentId.parser,
    ownerDirectory: 'parser',
    input: 'k.Component',
    output: 'KernelParseResult',
    capabilities: {CompilerComponentCapability.kernelAccess},
  ),
  CompilerComponentContract(
    id: CompilerComponentId.semantic,
    ownerDirectory: 'semantic',
    input: 'KernelParseResult',
    output: 'SemanticResult',
    capabilities: {CompilerComponentCapability.kernelAccess},
  ),
  CompilerComponentContract(
    id: CompilerComponentId.lowerer,
    ownerDirectory: 'lowering',
    input: 'SemanticResult',
    output: 'LoweringResult',
    capabilities: {
      CompilerComponentCapability.kernelAccess,
      CompilerComponentCapability.runtimeHelperReference,
    },
  ),
  CompilerComponentContract(
    id: CompilerComponentId.moduleBuilder,
    ownerDirectory: 'module_builder',
    input: 'LoweringResult',
    output: 'ModuleBuildResult',
  ),
  CompilerComponentContract(
    id: CompilerComponentId.transformer,
    ownerDirectory: 'transformer',
    input: 'ModuleBuildResult',
    output: 'TransformResult',
  ),
  CompilerComponentContract(
    id: CompilerComponentId.runtime,
    ownerDirectory: 'runtime',
    input: 'TransformResult',
    output: 'RuntimeLinkResult',
    capabilities: {
      CompilerComponentCapability.runtimeHelperReference,
      CompilerComponentCapability.runtimeHelperDeclaration,
    },
  ),
  CompilerComponentContract(
    id: CompilerComponentId.codegen,
    ownerDirectory: 'codegen',
    input: 'EsmModuleIr',
    output: 'CodegenResult',
    capabilities: {CompilerComponentCapability.codePrinting},
  ),
];

final compilerComponentOrder = List<CompilerComponentId>.unmodifiable([
  for (final contract in compilerComponentContracts) contract.id,
]);

CompilerComponentContract compilerComponentContractFor(CompilerComponentId id) {
  for (final contract in compilerComponentContracts) {
    if (contract.id == id) {
      return contract;
    }
  }
  throw StateError('Unknown dart2esm compiler component: $id');
}
