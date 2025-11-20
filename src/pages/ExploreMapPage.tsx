import React from 'react';
import ExploreMap from '../components/ExploreMap';
import { useNavigate } from 'react-router-dom';

const ExploreMapPage: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    // Use replace to go back to the previous page instead of home
    navigate(-1);
  };

  return <ExploreMap onClose={handleClose} />;
};

export default ExploreMapPage;