import React, { createContext, useContext, useState, useEffect } from 'react';

interface ChatSettings {
  notifyNewMessage: boolean;
  soundNotification: boolean;
  showAvatar: boolean;
  showOnlineStatus: boolean;
}

interface ChatSettingsContextType {
  settings: ChatSettings;
  updateSetting: <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => void;
}

const defaultSettings: ChatSettings = {
  notifyNewMessage: true,
  soundNotification: true,
  showAvatar: true,
  showOnlineStatus: true,
};

const ChatSettingsContext = createContext<ChatSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'skillverse_chat_settings';

export const ChatSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<ChatSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ChatSettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </ChatSettingsContext.Provider>
  );
};

export const useChatSettings = () => {
  const context = useContext(ChatSettingsContext);
  if (!context) {
    throw new Error('useChatSettings must be used within ChatSettingsProvider');
  }
  return context;
};
