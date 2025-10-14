import { useState, useEffect, useCallback } from 'react';
import { Language } from '../types';

// Cache to avoid re-fetching the same language files
const translationsCache: { [key in Language]?: any } = {};

const getNestedTranslation = (translations: any, key: string): string | undefined => {
  if (!translations) return undefined;
  return key.split('.').reduce((obj, k) => (obj && typeof obj === 'object' ? (obj as any)[k] : undefined), translations);
};

export const useTranslation = (language: Language) => {
  const [translations, setTranslations] = useState<any>(translationsCache[language]);

  useEffect(() => {
    const loadTranslations = async () => {
      if (translationsCache[language]) {
        setTranslations(translationsCache[language]);
        return;
      }
      
      try {
        // Using a relative path that should work from index.html
        const response = await fetch(`./locales/${language}.json`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        translationsCache[language] = data;
        setTranslations(data);
      } catch (error) {
        console.error(`Failed to load translations for "${language}":`, error);
        // Fallback to English
        if (language !== 'en' && !translationsCache['en']) {
             try {
                const enResponse = await fetch(`./locales/en.json`);
                if (!enResponse.ok) throw new Error(`HTTP error! status: ${enResponse.status}`);
                const enData = await enResponse.json();
                translationsCache['en'] = enData;
                setTranslations(enData);
             } catch(e) {
                 console.error("Failed to load fallback English translations", e);
             }
        }
      }
    };

    loadTranslations();
  }, [language]);

  // FIX: Updated `t` function to support placeholder substitution for i18n.
  // This resolves the error in App.tsx where `t` was called with two arguments.
  const t = useCallback((key: string, options?: { [key: string]: string | number }): string => {
    let translation = getNestedTranslation(translations, key);
    if (translation && options) {
      for (const optionKey in options) {
        if (Object.prototype.hasOwnProperty.call(options, optionKey)) {
          const value = options[optionKey];
          translation = translation.replace(new RegExp(`\\{${optionKey}\\}`, 'g'), String(value));
        }
      }
    }
    return translation || key;
  }, [translations]);

  return { t };
};
