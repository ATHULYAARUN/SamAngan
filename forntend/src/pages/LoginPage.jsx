import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Baby, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import authService from '../services/authService';
import FirstTimePasswordChange from '../components/auth/FirstTimePasswordChange';
import ForgotPassword from '../components/auth/ForgotPassword';
import GoogleSignIn from '../components/auth/GoogleSignIn';
import sessionManager from '../utils/sessionManager';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Clear any existing session on login page load
  useEffect(() => {
    console.log('🔐 Login page loaded, checking for existing session...');
    
    // If user came from logout or session expired, ensure clean slate
    const urlParams = new URLSearchParams(window.location.search);
    const fromLogout = urlParams.get('logout') === 'true';
    
    if (fromLogout || !sessionManager.isAuthenticated()) {
      console.log('🧹 Clearing any residual session data');
      sessionManager.destroySession();
    }
    
    // If user is already authenticated and on login page, redirect to their dashboard
    if (sessionManager.isAuthenticated()) {
      const userRole = sessionManager.getUserRole();
      const dashboardRoutes = {
        'super-admin': '/admin-dashboard',
        'anganwadi-worker': '/aww-dashboard', 
        'asha-volunteer': '/asha-dashboard',
        'parent': '/parent-dashboard',
        'adolescent-girl': '/adolescent-dashboard',
        'sanitation-worker': '/sanitation-dashboard'
      };
      
      const dashboardPath = dashboardRoutes[userRole] || '/';
      console.log('🔄 User already authenticated, redirecting to:', dashboardPath);
      navigate(dashboardPath, { replace: true });
    }
  }, [navigate]);

  // Admin default credentials
  const ADMIN_CREDENTIALS = {
    email: 'admin@sampoornaangan.gov.in',
    username: 'admin',
    password: 'admin123'
  };

  // User roles for login
  const userRoles = [
    { id: 'super-admin', title: 'Super Admin (Panchayat Official)', dashboard: '/admin-dashboard' },
    { id: 'anganwadi-worker', title: 'Anganwadi Worker', dashboard: '/aww-dashboard' },
    { id: 'asha-volunteer', title: 'ASHA Worker/Volunteer', dashboard: '/asha-dashboard' },
    { id: 'parent', title: 'Parent/Guardian', dashboard: '/parent-dashboard' },
    { id: 'adolescent-girl', title: 'Adolescent Girl', dashboard: '/adolescent-dashboard' },
    { id: 'pregnant-woman', title: 'Pregnant Woman', dashboard: '/pregnant-woman-dashboard' },
    { id: 'sanitation-worker', title: 'Sanitation Worker', dashboard: '/sanitation-dashboard' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check if admin credentials (no role selection needed for admin)
      if ((formData.email === ADMIN_CREDENTIALS.email || formData.email === ADMIN_CREDENTIALS.username) && 
          formData.password === ADMIN_CREDENTIALS.password) {
        
        // Admin login
        const result = await authService.loginAdmin(formData.email, formData.password);
        if (result.success) {
          navigate('/admin-dashboard');
        }
        
      } else if (formData.role && formData.email && formData.password) {
        
        // Regular user login
        const result = await authService.loginUser(formData.email, formData.password, formData.role);
        if (result.success) {
          // Check if user needs to change password (first-time login)
          if (result.data.needsPasswordChange || result.data.user.tempPassword) {
            setCurrentUser(result.data.user);
            setShowPasswordChange(true);
          } else {
            navigate(result.dashboard);
          }
        }
        
      } else {
        setError('Please fill in all fields including role selection.');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        formData: { email: formData.email, role: formData.role, hasPassword: !!formData.password }
      });
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = (result) => {
    if (result.isNewUser) {
      // Show welcome message for new users
      alert(`Welcome ${result.data.user.name}! Your account has been created successfully.`);
    }
    navigate(result.dashboard);
  };

  const handleGoogleError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChanged = (result) => {
    setShowPasswordChange(false);
    setCurrentUser(null);
    // Navigate to appropriate dashboard
    const roleInfo = userRoles.find(role => role.id === currentUser.role);
    if (roleInfo) {
      navigate(roleInfo.dashboard);
    }
  };

  const handlePasswordChangeCancel = () => {
    setShowPasswordChange(false);
    setCurrentUser(null);
    // Clear form
    setFormData({ email: '', password: '', role: '' });
  };

  const handleForgotPasswordBack = () => {
    setShowForgotPassword(false);
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <Baby className="w-10 h-10 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-black">
            Welcome Back
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in to your SampoornaAngan account
          </p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Workers:</strong> If you are an Anganwadi Worker, ASHA Volunteer, or Sanitation Worker, 
              your account is managed by the admin. Please use the credentials provided to you via email.
            </p>
          </div>
          
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <strong>New User?</strong> Parents and Adolescent Girls can register for free. 
              <Link to="/register" className="font-semibold text-green-700 hover:text-green-600 ml-1">
                Create your account here →
              </Link>
            </p>
          </div>
        </div>



        {/* Login Form or Forgot Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg"
        >
          {showForgotPassword ? (
            <ForgotPassword onBack={handleForgotPasswordBack} />
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Role Selection - Only show if not admin credentials */}
                {!(formData.email === ADMIN_CREDENTIALS.email || formData.email === ADMIN_CREDENTIALS.username) && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Select Your Role
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                        required={!(formData.email === ADMIN_CREDENTIALS.email || formData.email === ADMIN_CREDENTIALS.username)}
                      >
                        <option value="">Choose your role...</option>
                        {userRoles.filter(role => role.id !== 'super-admin').map(role => (
                          <option key={role.id} value={role.id}>{role.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Email Address or Username
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                      placeholder="Enter your email or username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-black">
                      Remember me
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                  >
                    Forgot your password?
                  </button>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>
              </div>

              {/* Google Sign-in */}
              <div className="mt-6">
                <GoogleSignIn
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  selectedRole={formData.role}
                  disabled={isLoading}
                />
                {!formData.role && (
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Please select a role above to enable Google Sign-in
                  </p>
                )}
              </div>

              <p className="mt-6 text-center text-sm text-black">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign up for free
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* First-Time Password Change Modal */}
      {showPasswordChange && currentUser && (
        <FirstTimePasswordChange
          user={currentUser}
          onPasswordChanged={handlePasswordChanged}
          onCancel={handlePasswordChangeCancel}
        />
      )}
    </div>
  );
};

export default LoginPage;
