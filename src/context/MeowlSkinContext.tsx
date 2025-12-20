import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { skinService, MeowlSkinResponse } from '../services/skinService';
import { premiumService } from '../services/premiumService';

// Import meowl skins
import meowlDefault from '../assets/meowl-skin/meowl_default.png';

export type MeowlSkinType = string;

export interface MeowlSkin {
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
  isPremium: boolean;
  togglePet: () => void;
  refreshSkins: () => Promise<void>;
  checkPremiumStatus: () => Promise<void>;
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

  const [isPremium, setIsPremium] = useState<boolean>(false);

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
      
      const hasDefault = mappedSkins.some(s => s.id === 'default');
      let finalSkins = [...mappedSkins];
      if (!hasDefault) {
        finalSkins = [MEOWL_SKINS[0], ...mappedSkins];
      }
      setMySkins(finalSkins);

      // Check for selected skin from backend
      const selectedSkin = skins.find(s => s.isSelected);
      if (selectedSkin) {
        setCurrentSkin(selectedSkin.skinCode);
      } else {
        // If no skin is marked as selected in backend, revert to default
        setCurrentSkin('default');
      }
    } catch (error) {
      console.error('Failed to fetch skins', error);
      setMySkins(MEOWL_SKINS);
    }
  };

  const checkPremiumStatus = async () => {
    try {
      // Check using the specific status endpoint first as it might be more reliable
      const isPremiumStatus = await premiumService.checkPremiumStatus();
      console.log('MeowlSkinContext: API status check:', isPremiumStatus);

      // Also get subscription details for double verification
      const subscription = await premiumService.getCurrentSubscription();
      console.log('MeowlSkinContext: Subscription details:', subscription);
      
      const isPremSubscription = Boolean(
        subscription && 
        subscription.isActive && 
        subscription.plan && 
        subscription.plan.planType !== 'FREE_TIER'
      );
      
      // Use either positive result (prefer API status if available, fallback to subscription check)
      const isPrem = isPremiumStatus || isPremSubscription;
      
      console.log('MeowlSkinContext: Final isPremium:', isPrem);
      setIsPremium(isPrem);
      
      if (!isPrem) {
        setIsPetActive(false); // Force disable if not premium
      }
    } catch (error) {
      console.error('Failed to check premium status', error);
      // Don't auto-disable on error, keep previous state or retry? 
      // Safe to disable to prevent unauthorized access, but annoying if network fails.
      // For now, let's trust the auth check elsewhere or default to false.
      setIsPremium(false);
      setIsPetActive(false);
    }
  };

  useEffect(() => {
    fetchMySkins();
    checkPremiumStatus();
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
    // Sync with backend
    skinService.selectSkin(skin).catch(err => {
      console.error('Failed to update skin selection', err);
    });
  };

  const togglePet = () => {
    if (!isPremium) return;
    setIsPetActive(prev => !prev);
  };

  return (
    <MeowlSkinContext.Provider value={{ 
      currentSkin, 
      currentSkinImage, 
      setSkin, 
      skins: mySkins,
      isPetActive,
      isPremium,
      togglePet,
      refreshSkins: fetchMySkins,
      checkPremiumStatus
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
