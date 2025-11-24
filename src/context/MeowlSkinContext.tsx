import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Import meowl skins
import meowlDefault from '../assets/meowl-skin/meowl_default.png';
import meowlSanta from '../assets/meowl-skin/meowl-santa.png';
import meowlSatan from '../assets/meowl-skin/meowl-acwy.png';
import meowlGold from '../assets/meowl-skin/meowl-thantai.png';
import meowlBusiness from '../assets/space-role/meowl-business.png';
import meowlUser from '../assets/space-role/meowl-user.png';
import meowlMentor from '../assets/space-role/meowl-mentor.png';
import meowlT1 from '../assets/meowl-skin/meowl-t1.png';
export type MeowlSkinType = 'default' | 'santa' | 'satan' | 'gold'|'business'|'user'|'mentor'|'t1';

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
  },
  {
    id: 'business',
    name: 'Business Meowl',
    nameVi: 'Meowl Business',
    image: meowlBusiness
  },
  {
    id: 'user',
    name: 'Student Meowl',
    nameVi: 'Meowl Student',
    image: meowlUser
  },
  {
    id: 'mentor',
    name: 'Mentor Meowl',
    nameVi: 'Meowl Mentor',
    image: meowlMentor
  },
  {
    id: 't1',
    name: 'T1 Meowl',
    nameVi: 'Meowl T1',
    image: meowlT1
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