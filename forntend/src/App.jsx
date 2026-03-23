import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Import pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import FeaturesPage from './pages/FeaturesPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ContactPage from './pages/ContactPage';
import ProcessPage from './pages/ProcessPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import AWWDashboard from './pages/AWWDashboard';
import ASHADashboard from './pages/ASHADashboard';
import ParentDashboard from './pages/ParentDashboard';
import AdolescentDashboard from './pages/AdolescentDashboard';
import PregnantWomanDashboard from './pages/PregnantWomanDashboard';
import SanitationDashboard from './pages/SanitationDashboard';

// Import components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import NavigationGuard from './components/NavigationGuard';
import ConnectionStatus from './components/ConnectionStatus';
import ErrorBoundary from './components/ErrorBoundary';

// Import session management
import sessionManager from './utils/sessionManager';

function AppContent() {
  const location = useLocation();
  
  // Initialize session monitoring
  React.useEffect(() => {
    sessionManager.setupSessionMonitoring();
    
    // Listen for session events
    const handleSessionEvent = (event) => {
      if (event === 'session_expired' || event === 'session_destroyed') {
        console.log('🔒 Session ended, checking if redirect is needed');
        // If on a protected route, redirect to login
        if (location.pathname.includes('dashboard')) {
          window.location.href = '/login';
        }
      }
    };

    sessionManager.addListener(handleSessionEvent);

    return () => {
      sessionManager.removeListener(handleSessionEvent);
    };
  }, [location.pathname]);
  
  // Define routes that should not show the homepage navbar
  const dashboardRoutes = [
    '/admin-dashboard',
    '/aww-dashboard',
    '/asha-dashboard',
    '/parent-dashboard',
    '/adolescent-dashboard',
    '/pregnant-woman-dashboard',
    '/sanitation-dashboard'
  ];
  
  const isDashboardRoute = dashboardRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ConnectionStatus />
      {/* Navigation Guard for session protection */}
      <NavigationGuard />
      
      {/* Only show Navbar for non-dashboard routes */}
      {!isDashboardRoute && <Navbar />}
      
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <HomePage />
            </motion.div>
          } />
          <Route path="/about" element={
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <AboutPage />
            </motion.div>
          } />
          <Route path="/features" element={
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <FeaturesPage />
            </motion.div>
          } />
          <Route path="/how-it-works" element={
            <motion.div
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <HowItWorksPage />
            </motion.div>
          } />
          <Route path="/contact" element={
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <ContactPage />
            </motion.div>
          } />
          <Route path="/process" element={
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <ProcessPage />
            </motion.div>
          } />
          <Route path="/login" element={
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <LoginPage />
            </motion.div>
          } />
          <Route path="/register" element={
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <RegisterPage />
            </motion.div>
          } />
          <Route path="/reset-password" element={
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <ResetPasswordPage />
            </motion.div>
          } />
          <Route path="/reset-password/:token" element={
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <ResetPasswordPage />
            </motion.div>
          } />
          
          {/* Protected Dashboard routes without navbar */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['super-admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/aww-dashboard" element={
            <ProtectedRoute allowedRoles={['anganwadi-worker']}>
              <AWWDashboard />
            </ProtectedRoute>
          } />
          <Route path="/asha-dashboard" element={
            <ErrorBoundary>
              <ProtectedRoute allowedRoles={['asha-volunteer']}>
                <ASHADashboard />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/parent-dashboard" element={
            <ProtectedRoute allowedRoles={['parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/adolescent-dashboard" element={
            <ProtectedRoute allowedRoles={['adolescent-girl']}>
              <AdolescentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/pregnant-woman-dashboard" element={
            <ProtectedRoute allowedRoles={['pregnant-woman']}>
              <PregnantWomanDashboard />
            </ProtectedRoute>
          } />
          <Route path="/sanitation-dashboard" element={
            <ProtectedRoute allowedRoles={['sanitation-worker']}>
              <SanitationDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </AnimatePresence>
      
      {/* Only show Footer for non-dashboard routes */}
      {!isDashboardRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;




