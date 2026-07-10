part of 'runtime_helpers.dart';

final class EsmRuntimeHelperRegistry {
  const EsmRuntimeHelperRegistry();

  static final generatedGlobalNames = Set<String>.unmodifiable(
    const RuntimeHelperLinker().declarationNames([
      for (final helper in EsmRuntimeHelper.values)
        const EsmRuntimeHelperRegistry().declaration(helper),
    ]),
  );
}
