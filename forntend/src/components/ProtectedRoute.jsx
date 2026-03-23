import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import sessionManager from '../utils/sessionManager';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check if user is authenticated
        const authenticated = sessionManager.isAuthenticated();
        const role = sessionManager.getUserRole();
        
        console.log('🔐 Route protection check:', {
          path: location.pathname,
          authenticated,
          role,
          allowedRoles
        });

        setIsAuthenticated(authenticated);
        setUserRole(role);

        // If not authenticated, destroy any stale session data
        if (!authenticated) {
          sessionManager.destroySession();
        }
        
      } catch (error) {
        console.error('Authentication check error:', error);
        setIsAuthenticated(false);
        sessionManager.destroySession();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();

    // Listen for session changes
    const handleSessionChange = (event, data) => {
      if (event === 'session_destroyed' || event === 'session_expired') {
        setIsAuthenticated(false);
        setUserRole(null);
      } else if (event === 'session_created') {
        setIsAuthenticated(true);
        setUserRole(data?.user?.role);
      }
    };

    sessionManager.addListener(handleSessionChange);

    return () => {
      sessionManager.removeListener(handleSessionChange);
    };
  }, [location.pathname, allowedRoles]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role-based access control is enabled, check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log('❌ Insufficient permissions:', { userRole, allowedRoles });
    
    // Redirect to appropriate dashboard based on user's role
    const dashboardRoutes = {
      'super-admin': '/admin-dashboard',
      'anganwadi-worker': '/aww-dashboard',
      'asha-volunteer': '/asha-dashboard',
      'parent': '/parent-dashboard',
      'adolescent-girl': '/adolescent-dashboard',
      'pregnant-woman': '/pregnant-woman-dashboard',
      'sanitation-worker': '/sanitation-dashboard'
    };

    const redirectPath = dashboardRoutes[userRole] || '/login';
    return <Navigate to={redirectPath} replace />;
  }

  // User is authenticated and has required permissions
  return children;
};

export default ProtectedRoute;