import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Import meowl skins
import meowlDefault from '../assets/meowl-skin/meowl_default.png';
import meowlSanta from '../assets/meowl-skin/meowl-santa.png';
import meowlSatan from '../assets/meowl-skin/meowl-acwy.png';
import meowlGold from '../assets/meowl-skin/meowl-thantai.png';
export type MeowlSkinType = 'default' | 'santa' | 'satan' | 'gold';

interface MeowlSkin {
  id: MeowlSkinType;
  name: string;
  nameVi: string;
  image: string;
}

export const MEOWL_SKINS: MeowlSkin[] = [
  {
    id: 'default',
    name: 'Default Meowl',
    nameVi: 'Meowl Mặc định',
    image: meowlDefault
  },
  {
    id: 'santa',
    name: 'Santa Meowl',
    nameVi: 'Meowl Santa',
    image: meowlSanta
  },
  {
    id: 'satan',
    name: 'Satan Meowl',
    nameVi: 'Meowl Satan',
    image: meowlSatan
  },
  {
    id: 'gold',
    name: 'Gold Meowl',
    nameVi: 'Meowl Gold',
    image: meowlGold
  }

];

interface MeowlSkinContextType {
  currentSkin: MeowlSkinType;
  currentSkinImage: string;
  setSkin: (skin: MeowlSkinType) => void;
  skins: MeowlSkin[];
}

const MeowlSkinContext = createContext<MeowlSkinContextType | undefined>(undefined);

const STORAGE_KEY = 'meowl-skin';

export const MeowlSkinProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSkin, setCurrentSkin] = useState<MeowlSkinType>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as MeowlSkinType) || 'default';
  });

  const currentSkinImage = MEOWL_SKINS.find(s => s.id === currentSkin)?.image || meowlDefault;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentSkin);
  }, [currentSkin]);

  const setSkin = (skin: MeowlSkinType) => {
    setCurrentSkin(skin);
  };

  return (
    <MeowlSkinContext.Provider value={{ currentSkin, currentSkinImage, setSkin, skins: MEOWL_SKINS }}>
      {children}
    </MeowlSkinContext.Provider>
  );
};

export const useMeowlSkin = (): MeowlSkinContextType => {
  const context = useContext(MeowlSkinContext);
  if (!context) {
    throw new Error('useMeowlSkin must be used within a MeowlSkinProvider');
  }
  return context;
};