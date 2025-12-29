import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';

interface ParentRouteProps {
  children: React.ReactNode;
}

const ParentRoute: React.FC<ParentRouteProps> = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      {children}
    </ProtectedRoute>
  );
};

export default ParentRoute;
