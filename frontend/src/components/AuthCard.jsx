import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import './AuthCard.css';

const AuthCard = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, getRedirectPath } = useAuth();
  const navigate = useNavigate();

  const toggleView = () => {
    setIsSignUp(!isSignUp);
    setError('');
  };

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(loginData.email, loginData.password);

      if (result.success) {
        const redirectPath = getRedirectPath();
        navigate(redirectPath || '/dashboard');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const validateRegisterForm = () => {
    if (!registerData.name.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!registerData.email.trim()) {
      setError('El correo electrónico es requerido');
      return false;
    }
    if (registerData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!validateRegisterForm()) return;

    setLoading(true);
    setError('');

    try {
      const result = await register({
        name: registerData.name.trim(),
        email: registerData.email.toLowerCase().trim(),
        password: registerData.password
      });

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <div className={`card-bg ${isSignUp ? 'signin' : ''}`}></div>

        {/* Hero Section - Sign Up */}
        <div className={`hero signup ${!isSignUp ? 'active' : ''}`}>
          <h2>Welcome Back!</h2>
          <p>Sign in to review your latest profit from investments.</p>
          <button type="button" onClick={toggleView}>SIGN IN</button>
        </div>

        {/* Form Section - Sign Up */}
        <div className={`form signup ${!isSignUp ? 'active' : ''}`}>
          <h2>Create Account</h2>
          <div className="sso">
            <a className="fa-brands fa-facebook"></a>
            <a className="fa-brands fa-twitter"></a>
            <a className="fa-brands fa-linkedin"></a>
          </div>
          <p>Or use your email address</p>
          <form onSubmit={handleRegisterSubmit}>
            <div className="input-group">
              <User className="input-icon" />
              <input
                type="text"
                name="name"
                placeholder="Full name"
                value={registerData.name}
                onChange={handleRegisterChange}
                required
              />
            </div>
            <div className="input-group">
              <Mail className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={registerData.email}
                onChange={handleRegisterChange}
                required
              />
            </div>
            <div className="input-group">
              <Lock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={registerData.password}
                onChange={handleRegisterChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <div className="input-group">
              <Lock className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                'SIGN UP'
              )}
            </button>
          </form>
        </div>

        {/* Hero Section - Sign In */}
        <div className={`hero signin ${isSignUp ? 'active' : ''}`}>
          <h2>Hey There!</h2>
          <p>Begin your journey using this software, and start earning now.</p>
          <button type="button" onClick={toggleView}>SIGN UP</button>
        </div>

        {/* Form Section - Sign In */}
        <div className={`form signin ${isSignUp ? 'active' : ''}`}>
          <h2>Sign In</h2>
          <div className="sso">
            <a className="fa-brands fa-facebook"></a>
            <a className="fa-brands fa-twitter"></a>
            <a className="fa-brands fa-linkedin"></a>
          </div>
          <p>Or use your email address</p>
          <form onSubmit={handleLoginSubmit}>
            <div className="input-group">
              <Mail className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={loginData.email}
                onChange={handleLoginChange}
                required
              />
            </div>
            <div className="input-group">
              <Lock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <a href="#" className="forgot-password">Forgot password?</a>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                'SIGN IN'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthCard;