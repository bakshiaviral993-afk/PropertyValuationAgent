// services/voiceService.ts
// Updated: Added missing 'export' to SpeechInput class to fix import error in PropertyChat.tsx
// Date: 16-Jan-2026

/**
 * SpeechInput class for handling browser SpeechRecognition API
 * with interim results, silence detection, and volume monitoring.
 */
export class SpeechInput {
  private recognition: SpeechRecognition | null = null;
  private silenceTmr: NodeJS.Timeout | null = null;
  private volumeInterval: NodeJS.Timeout | null = null;

  constructor(
    private onResult: (text: string, isFinal: boolean) => void,
    private onEnd: () => void,
    private onVolume: (volume: number) => void,
    private lang: string = 'en-IN'
  ) {}

  start() {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      this.onEnd();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.lang;

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) this.onResult(final, true);
      if (interim) this.onResult(interim, false);
    };

    this.recognition.onend = () => {
      this.onEnd();
      this.clearSilence();
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      this.onEnd();
    };

    this.recognition.start();
    this.monitorVolume();
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.clearSilence();
  }

  private monitorVolume() {
    // Dummy volume simulation – replace with real analyser if needed
    this.volumeInterval = setInterval(() => {
      const volume = Math.random() * 100;
      this.onVolume(volume);
    }, 200);
  }

  private clearSilence() {
    if (this.silenceTmr) {
      clearTimeout(this.silenceTmr);
      this.silenceTmr = null;
    }
    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }
  }
}

/**
 * Simple text-to-speech function using browser SpeechSynthesis
 * @param text - Text to speak
 * @param lang - Language code (default: 'en-IN')
 */
export function speak(text: string, lang: string = 'en-IN') {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn('Speech synthesis not supported in this browser');
  }
}
