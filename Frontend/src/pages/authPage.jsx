import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI, setAuthToken } from '../api';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    login: '', // For email or username on login
    password: '',
    confirmPassword: ''
  });

  // Update isLogin state when route changes
  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getTitle = () => {
    const role = isAdmin ? 'Admin' : 'User';
    const action = isLogin ? 'Login' : 'Signup';
    return `${role} ${action}`;
  };

  const validateForm = () => {
    const newErrors = {};

    if (isLogin) {
      if (!formData.login.trim()) newErrors.login = 'Email or Username is required';
    } else {
      if (!formData.username.trim()) newErrors.username = 'Username is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    setSuccess('');

    try {
      let response;
      const role = isAdmin ? 'admin' : 'user';

      if (isLogin) {
        // Login
        response = await authAPI.login({ login: formData.login, password: formData.password, role });
        const { token, user } = response.data.data;
        setAuthToken(token);
        
        setSuccess('Login successful! Redirecting...');
        
        // Redirect based on user role
        setTimeout(() => {
          if (user.role === 'admin') navigate('/admin-dashboard');
          else navigate('/dashboard');
        }, 1500);

      } else {
        // Register/Signup
        const userData = { username: formData.username, email: formData.email, password: formData.password, role };
        response = await authAPI.register(userData);
        setSuccess('Registration successful!');
        
        // Redirect based on role after successful registration
        setTimeout(() => {
          if (!isAdmin) {
            // User signup - go to user details page
            navigate('/user-details');
          } else {
            // Admin signup - go directly to login
            navigate('/login');
            setFormData({ username: '', email: formData.email, login: formData.email, password: '', confirmPassword: '' });
          }
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setFormData({ username: '', email: '', login: '', password: '', confirmPassword: '' });
    setErrors({});
    setSuccess('');
    // Keep isAdmin state consistent when switching between login/signup
    navigate(isLogin ? '/signup' : '/login');
  };

  const Feature = ({ icon, title, children }) => (
    <div className="flex items-start gap-4">
      <div className="text-cyan-400 text-2xl mt-1 flex-shrink-0 w-8 h-8">{icon}</div>
      <div>
        <h4 className="font-semibold text-white">{title}</h4>
        <p className="text-sm text-gray-400">{children}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans antialiased relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-700/[0.2] z-0"></div>
      <div className="absolute inset-0 pointer-events-none bg-gray-900 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full filter blur-3xl animate-blob"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
      
      <header className="w-full p-6 flex justify-between items-center absolute top-0 left-0 z-10">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="ml-3 text-2xl font-bold tracking-wider">FinVat</span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center w-full px-4 sm:px-6 lg:px-8 z-10 py-12">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6 items-center">
          
          <div className="w-full max-w-md mx-auto bg-gray-800/50 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-700/50">
            {/* Role Toggle */}
            <div className="bg-gray-700/50 p-1 rounded-xl flex justify-around mb-5">
              <button
                type="button"
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all ${!isAdmin ? 'bg-cyan-500 text-white shadow-md' : 'text-gray-300 hover:bg-gray-600/50'}`}
                onClick={() => setIsAdmin(false)}
              >
                User
              </button>
              <button
                type="button"
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all ${isAdmin ? 'bg-cyan-500 text-white shadow-md' : 'text-gray-300 hover:bg-gray-600/50'}`}
                onClick={() => setIsAdmin(true)}
              >
                Admin
              </button>
            </div>

            <div className="text-center mb-5">
              <h1 className="text-2xl font-bold text-cyan-300">{getTitle()}</h1>
              <p className="text-gray-300 mt-2 text-sm">{isLogin ? 'Sign in to your secure financial platform' : 'Join the future of secure banking'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isLogin ? (
                // LOGIN FORM
                <>
                  {/* Email or Username Field */}
                  <div className="mb-4">
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                      </span>
                      <input
                        type="text"
                        name="login"
                        value={formData.login}
                        onChange={handleInputChange}
                        className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${errors.login ? 'border-red-500' : ''}`}
                        placeholder="Email or Username"
                      />
                    </div>
                    {errors.login && <div className="text-red-500 text-xs mt-2">{errors.login}</div>}
                  </div>
                </>
              ) : (
                // SIGNUP FORM
                <>
                  {/* Username Field */}
                  <div className="mb-4">
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </span>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${errors.username ? 'border-red-500' : ''}`}
                        placeholder="Username"
                      />
                    </div>
                    {errors.username && <div className="text-red-500 text-xs mt-2">{errors.username}</div>}
                  </div>

                  {/* Email Field */}
                  <div className="mb-4">
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${errors.email ? 'border-red-500' : ''}`}
                        placeholder="Email"
                      />
                    </div>
                    {errors.email && <div className="text-red-500 text-xs mt-2">{errors.email}</div>}
                  </div>
                </>
              )}

              {/* Password Field */}
              <div className="mb-4">
                <div className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Password"
                  />
                </div>
                {errors.password && <div className="text-red-500 text-xs mt-2">{errors.password}</div>}
              </div>

              {/* Confirm Password Field (Registration Only) */}
              {!isLogin && (
                <div className="mb-4">
                  <div className="relative">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </span>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      placeholder="Confirm Password"
                    />
                  </div>
                  {errors.confirmPassword && <div className="text-red-500 text-xs mt-2">{errors.confirmPassword}</div>}
                </div>
              )}

              {/* Error Messages */}
              {errors.general && (
                <div className="bg-red-500/20 text-red-300 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <span className="text-lg">⚠️</span>
                  {errors.general}
                </div>
              )}

              {/* Success Messages */}
              {success && (
                <div className="bg-green-500/20 text-green-300 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <span className="text-lg">✅</span>
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </>
                )}
              </button>

              {/* Forgot Password (Login Only) */}
              {isLogin && (
                <button type="button" className="text-sm text-gray-400 hover:text-cyan-400 text-center block w-full mt-2">
                  Forgot password?
                </button>
              )}
            </form>

            {/* Switch Mode */}
            <div className="text-center mt-6 text-sm">
              <p>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button onClick={toggleMode} className="font-semibold text-cyan-400 hover:underline ml-1">
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

          {/* Features Section */}
          <div className="hidden lg:flex flex-col justify-center text-left">
            <h2 className="text-4xl font-bold text-white leading-tight">
              The Future of <span className="text-cyan-400">Secure Banking</span> is Here.
            </h2>
            <p className="text-gray-400 mt-4 max-w-lg">
              FinVat provides a robust, scalable, and user-friendly platform, ensuring your financial data is protected with cutting-edge security innovations.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Feature icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              } title="Bank-Grade Security">Military-grade encryption and multi-layer authentication.</Feature>
              <Feature icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              } title="Lightning Fast">Real-time processing with instant transaction notifications.</Feature>
              <Feature icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              } title="Smart Analytics">AI-powered insights for intelligent financial decisions.</Feature>
              <Feature icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12s5.373 12 12 12 12-5.373 12-12z" fill="#16a34a" fillOpacity="0.3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              } title="24/7 Availability">99.9% uptime guarantee for anytime, anywhere access.</Feature>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full p-6 text-center text-xs text-gray-500 relative z-10">
        <p>&copy; 2025 FinVat. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="#privacy" className="hover:text-cyan-400">Privacy Policy</a>
          <a href="#terms" className="hover:text-cyan-400">Terms of Service</a>
          <a href="#support" className="hover:text-cyan-400">Support</a>
        </div>
      </footer>
    </div>
  );
};

export default AuthPage;