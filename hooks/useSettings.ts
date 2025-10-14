import { useState, useEffect, useCallback } from 'react';
import { Settings, Theme, Language, Font } from '../types';

const getInitialSettings = (): Settings => {
  try {
    const storedSettings = localStorage.getItem('cogniflow-settings');
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error("Failed to parse settings from localStorage", error);
  }
  
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const browserLang = navigator.language.split('-')[0];

  return {
    theme: prefersDark ? 'dark' : 'light',
    language: browserLang === 'es' ? 'es' : 'en',
    font: 'sans',
  };
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(getInitialSettings);

  useEffect(() => {
    // Determine if the theme is dark
    const isDarkTheme = ['dark', 'slate', 'rosepine'].includes(settings.theme);

    // Apply .dark class for Tailwind compatibility
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply data-theme for CSS variables
    document.documentElement.dataset.theme = settings.theme;

    // Apply font
    document.documentElement.dataset.font = settings.font;

    // Persist settings
    try {
        localStorage.setItem('cogniflow-settings', JSON.stringify(settings));
    } catch(error) {
        console.error("Failed to save settings to localStorage", error);
    }
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return { settings, updateSettings };
};