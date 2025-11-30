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
import meowlAngel from '../assets/meowl-skin/meowl-angel.png';
import meowlMu from '../assets/meowl-skin/meowl-mu.png';
import meowlVietNam from '../assets/meowl-skin/meowl-vietnam.png';
import meowlRain from '../assets/meowl-skin/meowl-rain.png';
import meowlNonLa from '../assets/meowl-skin/meowl-nonla.png';
import meowlYasuo from '../assets/meowl-skin/meowl-yasuo.png';
import meowlRobot from '../assets/meowl-skin/meowl-robotic.png';
import meowlLeesin from '../assets/meowl-skin/meowl-leesin.png';
import meowlIronMan from '../assets/meowl-skin/meowl-ironman.png';
import meowlShark from '../assets/meowl-skin/meowl-shark.png';
import meowlDino from '../assets/meowl-skin/meowl-dino.png';
import meowlGoku from '../assets/meowl-skin/meowl-goku.png';
import meowlLuffy from '../assets/meowl-skin/meowl-luffy.png';
import meowlChainSawMan from '../assets/meowl-skin/meowl-chainsawman.png';
import meowlNoel from '../assets/meowl-skin/meowl-noel.png';
import meowlDriver from '../assets/meowl-skin/meowl-driver.png';
import meowl500IQ from '../assets/meowl-skin/meowl-500iq.png';
import meowl6Pek from '../assets/meowl-skin/meowl-6pek.png';
import meowlXanhSM from '../assets/meowl-skin/meowl-xanhsm.png';
import meowlBe from '../assets/meowl-skin/meowl-be.png';
import meowlGrab from '../assets/meowl-skin/meowl-grab.png';
export type MeowlSkinType = 'default' | 'santa' | 'satan' | 'gold'|'business'|'user'|'mentor'|'t1'|'angel'|'mu'|'vietnam'|'rain'|'nonla'|'yasuo'|'robotic'
|'leesin'|'ironman'|'shark'|'dino'|'goku'|'luffy'|'chainsawman'|'noel'|'driver'|'500iq'|'6pek'|'xanhsm'|'be'|'grab';

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
  },
  {
    id: 'angel',
    name: 'Angel Meowl',
    nameVi: 'Meowl Angel',
    image: meowlAngel
  },
  {
    id: 'mu',
    name: 'Mu Meowl',
    nameVi: 'Meowl Mu',
    image: meowlMu
  },
  {
    id: 'vietnam',
    name: 'Vietnam Meowl',
    nameVi: 'Meowl Vietnam',
    image: meowlVietNam
  },
  {
    id: 'rain',
    name: 'Rain Meowl',
    nameVi: 'Meowl Rain',
    image: meowlRain
  },
  {
    id: 'nonla',
    name: 'Nonla Meowl',
    nameVi: 'Meowl Nonla',
    image: meowlNonLa
  },
  {
    id: 'yasuo',
    name: 'Yasuo Meowl',
    nameVi: 'Meowl Yasuo',
    image: meowlYasuo
  },
  {
    id: 'robotic',
    name: 'Robot Meowl',
    nameVi: 'Meowl Robot',
    image: meowlRobot
  },
  {
    id: 'leesin',
    name: 'Leesin Meowl',
    nameVi: 'Meowl Leesin',
    image: meowlLeesin
  },
  {
    id: 'ironman',
    name: 'Ironman Meowl',
    nameVi: 'Meowl Ironman',
    image: meowlIronMan
  },
  {
    id: 'shark',
    name: 'Shark Meowl',
    nameVi: 'Meowl Shark',
    image: meowlShark
  },
  {
    id: 'dino',
    name: 'Dino Meowl',
    nameVi: 'Meowl Dino',
    image: meowlDino
  },
  {
    id: 'goku',
    name: 'Goku Meowl',
    nameVi: 'Meowl Goku',
    image: meowlGoku
  },
  {
    id: 'luffy',
    name: 'Luffy Meowl',
    nameVi: 'Meowl Luffy',
    image: meowlLuffy
  },
  {
    id: 'chainsawman',
    name: 'Chainsawman Meowl',
    nameVi: 'Meowl Chainsawman',
    image: meowlChainSawMan
  },
  {
    id: 'noel',
    name: 'Noel Meowl',
    nameVi: 'Meowl Noel',
    image: meowlNoel
  },
  {
    id: 'driver',
    name: 'Driver Meowl',
    nameVi: 'Meowl Driver',
    image: meowlDriver
  },
  {
    id: '500iq',
    name: '500iq Meowl',
    nameVi: 'Meowl 500iq',
    image: meowl500IQ
  },
  {
    id: '6pek',
    name: '6pek Meowl',
    nameVi: 'Meowl 6pek',
    image: meowl6Pek
  },
  {
    id: 'xanhsm',
    name: 'Xanhsm Meowl',
    nameVi: 'Meowl Xanhsm',
    image: meowlXanhSM
  },
  {
    id: 'be',
    name: 'Be Meowl',
    nameVi: 'Meowl Be',
    image: meowlBe
  },
  {
    id: 'grab',
    name: 'Grab Meowl',
    nameVi: 'Meowl Grab',
    image: meowlGrab
  }
];

interface MeowlSkinContextType {
  currentSkin: MeowlSkinType;
  currentSkinImage: string;
  setSkin: (skin: MeowlSkinType) => void;
  skins: MeowlSkin[];
  isPetActive: boolean;
  togglePet: () => void;
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

  const currentSkinImage = MEOWL_SKINS.find(s => s.id === currentSkin)?.image || meowlDefault;

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
      skins: MEOWL_SKINS,
      isPetActive,
      togglePet
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