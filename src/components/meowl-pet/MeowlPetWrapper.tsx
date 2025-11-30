import React, { useState, useEffect } from 'react';
import { useMeowlSkin } from '../../context/MeowlSkinContext';
import MeowlPet from './MeowlPet';

const MeowlPetWrapper: React.FC = () => {
  const { isPetActive } = useMeowlSkin();
  const [shouldRender, setShouldRender] = useState(isPetActive);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isPetActive) {
      setShouldRender(true);
      setIsExiting(false);
    } else if (shouldRender) {
      // Only trigger exit animation if currently rendering
      setIsExiting(true);
    }
  }, [isPetActive, shouldRender]);

  const handleExitComplete = () => {
    setShouldRender(false);
    setIsExiting(false);
  };

  if (!shouldRender) return null;

  return <MeowlPet isExiting={isExiting} onExitComplete={handleExitComplete} />;
};

export default MeowlPetWrapper;
