// ignore_for_file: deprecated_member_use

import 'dart:web_audio' as audio;

void main() {
  final supported = audio.AudioContext.supported;
  final context = audio.AudioContext();
  final gain = context.createGain();
  final oscillator = context.createOscillator();
  oscillator.connectNode(gain);
  gain.connectNode(context.destination!);
  oscillator.start2();
  oscillator.stop(0.25);
  print(
    'webAudio $supported ${context.currentTime} '
    '${gain.gain?.value} ${oscillator.type} ${context.destination != null}',
  );
}
