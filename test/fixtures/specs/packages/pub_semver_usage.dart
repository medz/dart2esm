import 'package:pub_semver/pub_semver.dart';

void main() {
  final parsed = Version.parse('01.02.03-01.dev+pre.02');
  final stable = Version(1, 2, 3);
  final preRelease = Version(1, 2, 4, pre: 'alpha.1', build: 'b.5');
  final ordered = [preRelease, Version.parse('1.2.4'), stable]
    ..sort(Version.prioritize);
  final primary = Version.primary([
    preRelease,
    stable,
    Version.parse('2.0.0-dev'),
  ]);

  final range = VersionConstraint.parse('>=1.2.0 <2.0.0');
  final compatible = VersionConstraint.compatibleWith(Version.parse('1.2.3'));
  final union = VersionConstraint.unionOf([
    VersionConstraint.parse('<1.0.0'),
    VersionConstraint.parse('>=2.0.0 <3.0.0'),
  ]);
  final intersection = range.intersect(
    VersionConstraint.parse('>=1.5.0 <1.6.0'),
  );
  final difference = range.difference(
    VersionConstraint.parse('>=1.4.0 <1.8.0'),
  );
  final exact = Version.parse('1.5.0');

  print(
    'semver ${parsed.canonicalizedVersion} $parsed '
    '${preRelease.isPreRelease} ${stable.nextMajor} ${stable.nextMinor} '
    '${stable.nextPatch} ${Version.none} ${ordered.last} $primary '
    '${range.allows(exact)} ${range.allows(Version.parse('2.0.0'))} '
    '${compatible.allows(Version.parse('1.9.9'))} '
    '${compatible.allows(Version.parse('2.0.0'))} '
    '${union.allows(Version.parse('0.5.0'))} '
    '${union.allows(Version.parse('1.5.0'))} '
    '$union $intersection $difference '
    '${VersionConstraint.empty.isEmpty} ${VersionConstraint.any.isAny}',
  );
}
