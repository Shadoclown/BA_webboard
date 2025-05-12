// SignUpPage.jsx - Simplified with basic signup method
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../style/SignUpPage.css';
import supabase from './connect';
import bcrypt from 'bcryptjs';

const SignUpPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error if user is typing
    if (error) {
      setError('');
    }
  };
  
  const handleSubmit = async () => {
    // Basic validation
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Check if username already exists
      const { data: existingUsers, error: checkUserError } = await supabase
        .from('user')
        .select('username')
        .eq('username', formData.username)
        .limit(1);
      
      if (checkUserError) throw checkUserError;
      
      if (existingUsers && existingUsers.length > 0) {
        setError('Username is already taken. Please choose a different username.');
        setLoading(false);
        return;
      }
      
      // Check if email already exists
      const { data: existingEmails, error: checkEmailError } = await supabase
        .from('user')
        .select('email')
        .eq('email', formData.email)
        .limit(1);
      
      if (checkEmailError) throw checkEmailError;
      
      if (existingEmails && existingEmails.length > 0) {
        setError('This email is already registered. Please use a different email address or try logging in.');
        setLoading(false);
        return;
      }
      
      // Hash password before storing
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(formData.password, salt);
      
      // Insert user data into your users table
      const { error: dbError } = await supabase
        .from('user')
        .insert([
          {
            username: formData.username,
            email: formData.email,
            password: hashedPassword
          }
        ]);
      
      if (dbError) throw dbError;
      
      // Success!
      setSuccess('Account created successfully!');
      
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Signup error:', error);
      
      // Provide more specific error messages based on error codes
      if (error.code === '23505') {
        if (error.details?.includes('email')) {
          setError('This email is already registered. Please use a different email address.');
        } else if (error.details?.includes('username')) {
          setError('This username is already taken. Please choose a different username.');
        } else {
          setError('This account already exists. Please try logging in instead.');
        }
      } else {
        setError(error.message || 'An error occurred during signup');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h1 className="signup-title">Create an account</h1>
      
      {error && (
        <div className="server-error">
          <span className="error-icon">⚠</span>
          {error}
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
          className="form-input"
          disabled={loading}
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Your email address"
          className="form-input"
          disabled={loading}
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Create a password"
          className="form-input"
          disabled={loading}
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="Confirm your password"
          className="form-input"
          disabled={loading}
        />
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