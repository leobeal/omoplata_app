import de from './de';
import en from './en';
import ptBR from './pt-BR';
import tr from './tr';

export const translations = {
  en,
  de,
  'pt-BR': ptBR,
  tr,
};

export type TranslationKeys = typeof en;
export type SupportedLanguages = keyof typeof translations;

// Language metadata for UI display
export const LANGUAGE_OPTIONS: {
  code: SupportedLanguages;
  name: string;
  nativeName: string;
  flag: string;
}[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
];
