import React from 'react';
import { useAuth } from '../../context/AuthContext';
import MissingCccdModal from './MissingCccdModal';
import { useLocation } from 'react-router-dom';

const MentorIdentityGuard: React.FC = () => {
  const { user, isAuthenticated, logout, checkAuth } = useAuth();
  const location = useLocation();

  // Don't show modal on these routes to avoid blocking registration/login flows
  const publicRoutes = ['/login', '/register', '/verify-otp'];
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

  if (!isAuthenticated || !user || isPublicRoute) {
    return null;
  }

  // Check if user is a mentor and has NOT verified identity
  const isMentor = Array.isArray(user.roles) ? user.roles.includes('MENTOR') : user.roles === 'MENTOR';
  const needsIdentityVerification = isMentor && user.identityVerified === false;

  const handleSuccess = async () => {
    // Refresh auth state to get updated identityVerified flag
    await checkAuth();
    // In a real app, the token would be updated by the backend, or we force relogin
    // For now, checkAuth will re-fetch /api/users/me and update the state
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <MissingCccdModal 
      isOpen={needsIdentityVerification} 
      onSuccess={handleSuccess} 
      onLogout={handleLogout} 
    />
  );
};

export default MentorIdentityGuard;
