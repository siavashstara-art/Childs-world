export type VoiceProfile = 'UNCLE_STORY' | 'AI_COMPANION';

export class UncleStoryAudioEngine {
  private synth: SpeechSynthesis;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  playStoryWithVoice(text: string, voiceProfile: VoiceProfile) {
    this.synth.cancel(); // Stop current speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fa-IR';

    switch (voiceProfile) {
      case 'UNCLE_STORY':
        // Web Speech API doesn't support fine-grained pitch/rate adjustments
        // the same way Android does, but we can set basic properties.
        utterance.pitch = 0.85;
        utterance.rate = 0.88;
        break;
      case 'AI_COMPANION':
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
        break;
    }

    this.synth.speak(utterance);
  }

  stop() {
    this.synth.cancel();
  }
}
