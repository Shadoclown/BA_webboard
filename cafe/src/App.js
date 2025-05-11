import Navbar from './component/navbar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React, { useState } from 'react';
import LoginPage from './component/LoginPage';
import SignUpPage from './component/SignUpPage';
import ProfilePage from './component/ProfilePage';
import Browse from './component/Browse';
import ForYouPage from './component/ForYouPage';
import MostLikedPage from './component/MostLikedPage';
import Top5Page from './component/Top5Page';
import Regions from './component/Regions';
import ExplorePage from './component/ExplorePage';

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
  };

  return (
    <div>
      <BrowserRouter>
        <Navbar checklogin={checklogin} userData={User} checklogout={handleLogout}/>
        <Routes>
          <Route path="/browse" element={<Browse />} />
          <Route path="/login" element={<LoginPage isLogin={handleLogin}/>} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/profile" element={<ProfilePage userData={User} />} /> 
          {/* <Route path="/for-you" element={<ForYouPage />} />
          <Route path="/most-like" element={<MostLikedPage />} />
          <Route path="/top-5" element={<Top5Page />} /> */}
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/category/:id" element={<Regions />} />
          <Route path="/" element={<ForYouPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
