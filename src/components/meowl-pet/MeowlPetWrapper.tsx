import React from 'react';
import { useMeowlSkin } from '../../context/MeowlSkinContext';
import MeowlPet from './MeowlPet';

const MeowlPetWrapper: React.FC = () => {
  const { isPetActive } = useMeowlSkin();

  if (!isPetActive) return null;

  return <MeowlPet />;
};

export default MeowlPetWrapper;
