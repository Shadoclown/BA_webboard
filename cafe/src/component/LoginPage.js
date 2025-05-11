// LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../style/LoginPage.css';
import supabase from './connect';

const LoginPage = () => {
  // State variables
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!username || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      
      const { data: users, error: queryError } = await supabase
        .from('user')
        .select('user_id, username, email, password')
        .eq('username', username)
        .limit(1);
      
      if (queryError) throw queryError;
      
      // Check if user exists
      if (!users || users.length === 0) {
        setError('No account found with this email');
        return;
      }
      
      const user = users[0];
      
      // Check if password matches
      if (user.password !== password) {
        setError('Incorrect password');
        return;
      }

      const userData = {
        userId: user.user_id,
        username: user.username,
        email: user.email
      };

      navigate('/profile', {state: userData});
      
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <div className="login-form">
          <h1 className="welcome-text">Welcome</h1>
          <p className="login-subtext">Login to continue</p>
          
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠</span> {error}
            </div>
          )}
          
          <div className="login-inputs">
            <div className="form-group">
              <label htmlFor="Username">Username</label>
              <input
                type="Username"
                id="Username"
                placeholder="Your Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <button 
              onClick={handleSubmit} 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
          
          <p className="signup-text">
            Don't have an account? <Link to="/signup" className="signup-link">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;