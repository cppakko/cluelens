import type { TtsProvider } from '@/utils/storage';

let currentAudio: HTMLAudioElement | null = null;

function stopCurrent(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.removeAttribute('src');
    currentAudio.load();
    currentAudio = null;
  }
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel();
  }
}

function playWebSpeech(text: string, lang: string): void {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  speechSynthesis.speak(utterance);
}

async function playLingvaTts(text: string, lang: string): Promise<void> {
  const encoded = encodeURIComponent(text.slice(0, 200));
  const url = `https://lingva.ml/api/v1/audio/${lang}/${encoded}`;

  const res = await fetch(url);
  if (!res.ok) return;

  const json = await res.json() as { audio: number[] };
  if (!json.audio || !Array.isArray(json.audio)) return;

  const blob = new Blob([new Uint8Array(json.audio)], { type: 'audio/mpeg' });
  const blobUrl = URL.createObjectURL(blob);
  const audio = new Audio(blobUrl);
  currentAudio = audio;

  audio.addEventListener('ended', () => URL.revokeObjectURL(blobUrl), { once: true });
  audio.addEventListener('error', () => URL.revokeObjectURL(blobUrl), { once: true });
  audio.play().catch(() => URL.revokeObjectURL(blobUrl));
}

function normalizeLangForTts(lang: string): string {
  const map: Record<string, string> = {
    zh: 'zh-CN',
    en: 'en-US',
    ja: 'ja-JP',
    ko: 'ko-KR',
    fr: 'fr-FR',
    es: 'es-ES',
    de: 'de-DE',
  };
  return map[lang] ?? 'en-US';
}

export async function playTts(text: string, lang: string, provider: TtsProvider): Promise<void> {
  stopCurrent();

  if (provider === 'lingva') {
    await playLingvaTts(text, lang);
  } else {
    const ttsLang = normalizeLangForTts(lang);
    playWebSpeech(text, ttsLang);
  }
}
