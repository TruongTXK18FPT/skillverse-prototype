import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
  requireAdminGate?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [],
  redirectTo = '/unauthorized',
  requireAdminGate = false
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
        <MeowlKuruLoader size="small" text="Loading..." />
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

  if (requireAdminGate) {
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
  const ADMIN_ROLES = [
    'ADMIN', 
    'USER_ADMIN', 
    'CONTENT_ADMIN', 
    'COMMUNITY_ADMIN', 
    'FINANCE_ADMIN', 
    'PREMIUM_ADMIN', 
    'AI_ADMIN', 
    'SUPPORT_ADMIN', 
    'SYSTEM_ADMIN'
  ];
  return (
    <ProtectedRoute allowedRoles={ADMIN_ROLES} requireAdminGate={true}>
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

// Convenience wrapper for PARENT-only routes
export const ParentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      {children}
    </ProtectedRoute>
  );
};

// Convenience wrapper for STUDENT-only routes
// Allows learner-style roles but excludes elevated and specialized roles.
export const StudentOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <MeowlKuruLoader size="small" text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roles = (user.roles || []).map((role) => role.toUpperCase());
  const hasStudentRole =
    roles.includes('USER') ||
    roles.includes('LEARNER') ||
    roles.includes('STUDENT') ||
    roles.includes('CANDIDATE');
  const hasBlockedRole =
    roles.includes('MENTOR') ||
    roles.includes('RECRUITER') ||
    roles.includes('PARENT') ||
    roles.includes('ADMIN') ||
    roles.some((role) => role.endsWith('_ADMIN'));

  if (!hasStudentRole || hasBlockedRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
