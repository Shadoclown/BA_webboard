// SignUpPage.jsx - Enhanced with Supabase integration
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../style/SignUpPage.css';
import supabase from './connect';

const SignUpPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear errors when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
    // Clear server error if user is typing
    if (serverError) {
      setServerError('');
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setServerError('');
    setSuccess('');
    
    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username // Store username in auth metadata
          }
        }
      });
      
      if (authError) throw authError;
      
      // 2. Insert user data into your users table
      if (authData.user) {
        const { error: dbError } = await supabase
          .from('users')
          .insert([
            {
              username: formData.username,
              email: formData.email,

              password: 'MANAGED_BY_SUPABASE_AUTH'
            }
          ]);
        
        if (dbError) throw dbError;
        
        // Success!
        setSuccess('Account created successfully! Please check your email to confirm your account.');
        
        // Reset form
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setServerError(error.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

 return (
  <div className="signup-container">
    <h1 className="signup-title">Create an account</h1>
    <p className="signup-subtitle">Login to continue</p>
    
    {serverError && (
      <div className="server-error">
        <span className="error-icon">⚠</span>
        {serverError}
      </div>
    )}
    
    {success && (
      <div className="success-message">
        <span className="success-icon">✓</span>
        {success}
      </div>
    )}
    
    <div className="form-group">
      <label className="form-label">Username</label>
      <input
        type="text"
        name="username"
        value={formData.username}
        onChange={handleInputChange}
        placeholder="Choose a username"
        className={`form-input ${errors.username ? 'error' : ''}`}
        disabled={loading}
      />
      {errors.username && (
        <div className="error-message">
          <span className="error-icon">⚠</span>
          {errors.username}
        </div>
      )}
    </div>
    
    <div className="form-group">
      <label className="form-label">Email</label>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        placeholder="Your email address"
        className={`form-input ${errors.email ? 'error' : ''}`}
        disabled={loading}
      />
      {errors.email && (
        <div className="error-message">
          <span className="error-icon">⚠</span>
          {errors.email}
        </div>
      )}
    </div>
    
    <div className="form-group">
      <label className="form-label">Password</label>
      <div className="password-container">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Create a password"
          className={`form-input ${errors.password ? 'error' : ''}`}
          disabled={loading}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
          disabled={loading}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      {errors.password && (
        <div className="error-message">
          <span className="error-icon">⚠</span>
          {errors.password}
        </div>
      )}
    </div>
    
    <div className="form-group">
      <label className="form-label">Confirm Password</label>
      <div className="password-container">
        <input
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="Confirm your password"
          className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
          disabled={loading}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          disabled={loading}
        >
          {showConfirmPassword ? "Hide" : "Show"}
        </button>
      </div>
      {errors.confirmPassword && (
        <div className="error-message">
          <span className="error-icon">⚠</span>
          {errors.confirmPassword}
        </div>
      )}
    </div>
    
    <button
      onClick={handleSubmit}
      className="submit-button"
      disabled={loading}
    >
      {loading ? 'Creating Account...' : 'Create Account'}
    </button>
    
    <div className="login-text">
      Already have an account? <Link to="/login" className="login-link">Login</Link>
    </div>
  </div>
);
}

export default SignUpPage;