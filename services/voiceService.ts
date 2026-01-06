
export const speak = (text: string, lang: 'en-IN' | 'hi-IN' = 'en-IN', onComplete?: () => void) => {
  if (!('speechSynthesis' in window)) {
    onComplete?.();
    return;
  }
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  
  utterance.onend = () => {
    onComplete?.();
  };

  utterance.onerror = () => {
    onComplete?.();
  };

  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find(v => v.lang === lang && (v.name.includes('Google') || v.name.includes('Premium')))
                     || voices.find(v => v.lang === lang)
                     || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
  
  if (selectedVoice) utterance.voice = selectedVoice;
  
  window.speechSynthesis.speak(utterance);
};

export class SpeechInput {
  private rec: any;
  private onResult: (t: string, f: boolean) => void;
  private onEnd: () => void;
  private onVol: (v: number) => void;
  private lang: string;
  private silenceTmr: number | null = null;
  private lastRaw = '';
  private retryCount = 0;
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  constructor(
    onResult: (t: string, f: boolean) => void,
    onEnd: () => void,
    onVol: (v: number) => void,
    lang: string
  ) {
    this.onResult = onResult;
    this.onEnd = onEnd;
    this.onVol = onVol;
    this.lang = lang;
  }

  async start() {
    this.retryCount = 0;
    this.lastRaw = '';
    
    try {
      // 1. Force hardware access immediately on user interaction
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.buildVolumeMeter();
    } catch (e) {
      console.error('QuantCasa: Hardware link denied', e);
      this.onResult('🎤 Mic access denied – Please check permissions', true);
      this.onEnd();
      return;
    }
    
    // 2. Initialize the neural decoding engine
    this.startRec();
  }

  stop() {
    this.clearSilence();
    if (this.rec) {
      this.rec.onend = null;
      this.rec.onerror = null;
      this.rec.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  private buildVolumeMeter() {
    this.audioCtx = new (window as any).AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const source = this.audioCtx.createMediaStreamSource(this.stream!);
    source.connect(this.analyser);
    this.loopVolume();
  }

  private loopVolume() {
    if (!this.analyser || !this.dataArray) return;
    this.analyser.getByteFrequencyData(this.dataArray);
    const avg = this.dataArray.reduce((a, b) => a + b, 0) / this.dataArray.length;
    // Boosted scaling for UI feedback (0-100 range)
    this.onVol(Math.min(100, Math.round(avg * 1.5)));
    if (this.stream) {
      requestAnimationFrame(() => this.loopVolume());
    }
  }

  private startRec() {
    const R = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!R) throw new Error('No speech API');
    this.rec = new R();
    this.rec.continuous = true;
    this.rec.interimResults = true;
    this.rec.lang = this.lang;
    this.rec.maxAlternatives = 1;

    // 🔥 CRITICAL: bypass muted audio element – feed raw track
    // @ts-ignore
    if (this.rec.setSinkId) this.rec.setSinkId('');       // Chrome ≥ 120
    // @ts-ignore
    if (this.rec.mediaStream) this.rec.mediaStream = this.stream; // force raw stream

    this.rec.onresult = (e: any) => {
      let final = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }

      // 1. Normal path: we got a final transcript
      if (final) {
        this.push(final, true);
        return;
      }

      // 2. Keep interim alive and update UI
      if (interim) {
        this.lastRaw = interim;
        this.push(interim, false);
        this.resetSilenceTimer();
        return;
      }

      /**
       * 3. Safety path: if we *only* get empty finals forever or results stop coming,
       * treat the best interim we had as final after a period of silence.
       */
      if (this.lastRaw.trim().length > 2 && !this.silenceTmr) {
         this.resetSilenceTimer();
      }
    };

    this.rec.onerror = (e: any) => {
      console.warn('QuantCasa Voice: Engine state:', e.error);
      
      // Auto-recover from transient 'no-speech' timeouts
      if (this.retryCount < 2 && (e.error === 'no-speech' || e.error === 'network')) {
        this.retryCount++;
        this.rec.stop();
        setTimeout(() => this.startRec(), 400);
        return;
      }
      
      // If fatal, commit whatever we heard so the user doesn't lose progress
      if (this.lastRaw.trim().length > 2) {
        this.push(this.lastRaw, true);
      }
      this.stop();
    };

    this.rec.onend = () => {
      this.clearSilence();
      // Only call onEnd if the user hasn't explicitly stopped it
      if (!this.stream) {
        this.onEnd();
      }
    };

    this.rec.start();
  }

  private push(text: string, isFinal: boolean) {
    this.onResult(text, isFinal);
    if (isFinal) {
      this.clearSilence();
      this.lastRaw = '';
    }
  }

  private resetSilenceTimer() {
    this.clearSilence();
    this.silenceTmr = window.setTimeout(() => {
      if (this.lastRaw.trim().length > 2) {
        this.push(this.lastRaw, true);
      }
      this.silenceTmr = null;
    }, 1400);
  }

  private clearSilence() {
    if (this.silenceTmr) {
      clearTimeout(this.silenceTmr);
      this.silenceTmr = null;
    }
  }
}
