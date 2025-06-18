import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../translations/en';
import { vi } from '../translations/vi';

type Language = 'en' | 'vi';

// Use the actual structure from the translation files
type Translations = typeof en | typeof vi;

interface LanguageContextType {
  language: Language;
  translations: Translations;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get initial language from localStorage or default to 'vi'
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage || 'vi';
  });

  const [translations, setTranslations] = useState<Translations>(language === 'en' ? en : vi);

  useEffect(() => {
    // Update translations when language changes
    setTranslations(language === 'en' ? en : vi);
    // Save language preference to localStorage
    localStorage.setItem('language', language);
    // Update document language for accessibility
    document.documentElement.lang = language;
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        translations,
        setLanguage: handleSetLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 