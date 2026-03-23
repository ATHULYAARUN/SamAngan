import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import sessionManager from '../utils/sessionManager';

const NavigationGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handlePopState = (event) => {
      console.log('🔄 Browser navigation detected:', {
        pathname: location.pathname,
        isAuthenticated: sessionManager.isAuthenticated()
      });

      // Check if trying to navigate to a protected route without authentication
      const protectedRoutes = [
        '/admin-dashboard',
        '/aww-dashboard', 
        '/asha-dashboard',
        '/parent-dashboard',
        '/adolescent-dashboard',
        '/pregnant-woman-dashboard',
        '/sanitation-dashboard'
      ];

      const isProtectedRoute = protectedRoutes.some(route => 
        window.location.pathname.includes(route.replace('/', ''))
      );

      if (isProtectedRoute && !sessionManager.isAuthenticated()) {
        console.log('🚫 Unauthorized access attempt via browser navigation');
        
        // Prevent the navigation
        event.preventDefault();
        
        // Replace the current history entry to prevent back/forward access
        window.history.replaceState(null, '', '/login');
        
        // Navigate to login
        navigate('/login', { replace: true });
        
        return false;
      }

      return true;
    };

    // Listen for popstate events (back/forward button)
    window.addEventListener('popstate', handlePopState);

    // Handle page refresh/direct URL access
    const handlePageLoad = () => {
      const protectedRoutes = [
        '/admin-dashboard',
        '/aww-dashboard',
        '/asha-dashboard', 
        '/parent-dashboard',
        '/adolescent-dashboard',
        '/pregnant-woman-dashboard',
        '/sanitation-dashboard'
      ];

      const isProtectedRoute = protectedRoutes.some(route => 
        window.location.pathname.includes(route.replace('/', ''))
      );

      if (isProtectedRoute && !sessionManager.isAuthenticated()) {
        console.log('🚫 Unauthorized direct access attempt');
        window.history.replaceState(null, '', '/login');
        navigate('/login', { replace: true });
      }
    };

    // Check on component mount
    handlePageLoad();

    // Override browser back/forward buttons for dashboard pages
    const overrideNavigation = () => {
      const currentPath = window.location.pathname;
      const isDashboardPage = currentPath.includes('dashboard');
      
      if (isDashboardPage && !sessionManager.isAuthenticated()) {
        // Clear history to prevent navigation back to dashboard
        window.history.replaceState(null, '', '/login');
        navigate('/login', { replace: true });
      }
    };

    // Check every time location changes
    overrideNavigation();

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location, navigate]);

  // This component doesn't render anything
  return null;
};

export default NavigationGuard;