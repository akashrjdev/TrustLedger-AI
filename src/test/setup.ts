import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Speech API SpeechSynthesis
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
    },
    writable: true,
  });

  // Mock SpeechSynthesisUtterance
  (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = vi.fn().mockImplementation((text: string) => ({
    text,
    lang: '',
    rate: 1,
    pitch: 1,
    volume: 1,
  }));
}
