import en from './en';
import de from './de';
import ptBR from './pt-BR';

export const translations = {
  en,
  de,
  'pt-BR': ptBR,
};

export type TranslationKeys = typeof en;
export type SupportedLanguages = keyof typeof translations;
