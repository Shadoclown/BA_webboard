import Navbar from './component/navbar';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import LoginPage from './component/LoginPage';
import SignUpPage from './component/SignUpPage';
import ProfilePage from './component/ProfilePage';

function App() {
  const [checklogin, setchecklogin] = useState(false);
  const [User, setUser] = useState({});

  const handleLogin = (userData) => {
    setchecklogin(true);
    setUser(userData);
  }

  const handleLogout = () => {
    setchecklogin(false);
    setUser({});
    // Navigation will be handled in the Navbar component
  };

  return (
    <div>
      <BrowserRouter>
        <Navbar checklogin={checklogin} userData={User} checklogout={handleLogout}/>
        <Routes>
          <Route path="/login" element={<LoginPage isLogin={handleLogin}/>} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/profile" element={<ProfilePage />} /> 
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
