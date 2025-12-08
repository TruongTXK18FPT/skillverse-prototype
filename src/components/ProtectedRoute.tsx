import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [],
  redirectTo = '/unauthorized'
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If no specific roles required, just check if user is authenticated
  if (allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has any of the allowed roles
  const hasRequiredRole = user.roles.some(role => 
    allowedRoles.includes(role.toUpperCase())
  );

  if (!hasRequiredRole) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles.includes('ADMIN')) {
    const verified = sessionStorage.getItem('adminKeyVerified') === 'true';
    const expiryStr = sessionStorage.getItem('adminKeyVerifiedExpiry');
    const notExpired = expiryStr ? parseInt(expiryStr, 10) > Date.now() : false;
    if (!verified || !notExpired) {
      return <Navigate to="/admin-security" replace />;
    }
  }

  return <>{children}</>;
};

// Convenience wrapper for MENTOR-only routes
export const MentorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
      {children}
    </ProtectedRoute>
  );
};

// Convenience wrapper for ADMIN-only routes
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      {children}
    </ProtectedRoute>
  );
};

// Convenience wrapper for RECRUITER-only routes (Business page)
export const RecruiterRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['RECRUITER']}>
      {children}
    </ProtectedRoute>
  );
};

// Convenience wrapper for authenticated routes (no specific role required)
export const AuthenticatedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
};
