import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './LanguageSwitcher.css';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  return (
    <button 
      className="language-toggle"
      onClick={toggleLanguage}
      title={language === 'en' ? 'Switch to Vietnamese' : 'Switch to English'}
    >
      <Globe className="language-icon" />
      <span className="language-code">{language === 'en' ? 'EN' : 'VI'}</span>
    </button>
  );
};

export default LanguageSwitcher; 