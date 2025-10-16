import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProfileRouter component
 * Automatically redirects users to their role-specific profile page
 * 
 * Usage: Replace <ProfilePage /> with <ProfileRouter /> in App.tsx
 */
const ProfileRouter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ CRITICAL FIX: Wait for AuthContext to finish loading
    // This prevents race condition where ProfileRouter checks user
    // before AuthContext has loaded from localStorage
    if (loading) {
      return; // Still loading, wait
    }
    
    if (!user) {
      navigate('/login');
      return;
    }

    // Route based on user role
    if (user.roles && user.roles.length > 0) {
      const primaryRole = user.roles[0]; // Use first role as primary

      switch (primaryRole) {
        case 'MENTOR':
          navigate('/profile/mentor', { replace: true });
          break;
        case 'RECRUITER':
          navigate('/profile/business', { replace: true });
          break;
        case 'ADMIN':
          navigate('/admin', { replace: true }); // Admin goes to admin dashboard
          break;
        case 'USER':
        default:
          navigate('/profile/user', { replace: true }); // Default user profile
          break;
      }
    } else {
      // No roles, default to user profile
      navigate('/profile/user', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading state while AuthContext is initializing
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="spinner"></div>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div className="spinner"></div>
      <p>Đang chuyển hướng đến trang profile...</p>
    </div>
  );
};

export default ProfileRouter;
