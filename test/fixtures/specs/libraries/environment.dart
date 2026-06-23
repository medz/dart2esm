const hasFeature = bool.hasEnvironment('dart2esm.feature');
const featureEnabled = bool.fromEnvironment('dart2esm.feature');
const answer = int.fromEnvironment('dart2esm.answer', defaultValue: 7);
const label = String.fromEnvironment(
  'dart2esm.label',
  defaultValue: 'fallback',
);

void main() {
  print('env $hasFeature $featureEnabled $answer $label');
}
