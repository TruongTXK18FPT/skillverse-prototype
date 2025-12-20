import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { skinService, MeowlSkinResponse } from '../services/skinService';

// Import meowl skins
import meowlDefault from '../assets/meowl-skin/meowl_default.png';

export type MeowlSkinType = string;

interface MeowlSkin {
  id: string;
  name: string;
  nameVi: string;
  image: string;
  isPremium?: boolean;
}

export const MEOWL_SKINS: MeowlSkin[] = [
  {
    id: 'default',
    name: 'Default Meowl',
    nameVi: 'Meowl Mặc định',
    image: meowlDefault
  }
];

interface MeowlSkinContextType {
  currentSkin: MeowlSkinType;
  currentSkinImage: string;
  setSkin: (skin: MeowlSkinType) => void;
  skins: MeowlSkin[];
  isPetActive: boolean;
  togglePet: () => void;
  refreshSkins: () => Promise<void>;
}

const MeowlSkinContext = createContext<MeowlSkinContextType | undefined>(undefined);

const STORAGE_KEY = 'meowl-skin';
const PET_ACTIVE_KEY = 'meowl-pet-active';

export const MeowlSkinProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSkin, setCurrentSkin] = useState<MeowlSkinType>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as MeowlSkinType) || 'default';
  });

  const [isPetActive, setIsPetActive] = useState<boolean>(() => {
    const saved = localStorage.getItem(PET_ACTIVE_KEY);
    return saved === 'true';
  });

  const [mySkins, setMySkins] = useState<MeowlSkin[]>(MEOWL_SKINS);

  const fetchMySkins = async () => {
    try {
      const skins = await skinService.getMySkins();
      const mappedSkins: MeowlSkin[] = skins.map(s => ({
        id: s.skinCode,
        name: s.name,
        nameVi: s.nameVi,
        image: s.imageUrl,
        isPremium: s.isPremium
      }));
      
      // Ensure default is always present if not returned by API (it should be, but just in case)
      // If API returns default, we use API version (might have updated image)
      // For now, let's merge or just use API if it returns list.
      // Assuming API returns all owned skins including default if it's treated as a skin.
      // If default is special and not in DB, we keep it.
      
      const hasDefault = mappedSkins.some(s => s.id === 'default');
      let finalSkins = [...mappedSkins];
      if (!hasDefault) {
        finalSkins = [MEOWL_SKINS[0], ...mappedSkins];
      }
      setMySkins(finalSkins);
    } catch (error) {
      console.error('Failed to fetch skins', error);
      // Fallback to default
      setMySkins(MEOWL_SKINS);
    }
  };

  useEffect(() => {
    fetchMySkins();
  }, []);

  const currentSkinImage = mySkins.find(s => s.id === currentSkin)?.image || meowlDefault;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentSkin);
  }, [currentSkin]);

  useEffect(() => {
    localStorage.setItem(PET_ACTIVE_KEY, String(isPetActive));
  }, [isPetActive]);

  const setSkin = (skin: MeowlSkinType) => {
    setCurrentSkin(skin);
  };

  const togglePet = () => {
    setIsPetActive(prev => !prev);
  };

  return (
    <MeowlSkinContext.Provider value={{ 
      currentSkin, 
      currentSkinImage, 
      setSkin, 
      skins: mySkins,
      isPetActive,
      togglePet,
      refreshSkins: fetchMySkins
    }}>
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