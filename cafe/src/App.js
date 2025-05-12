import Navbar from './component/navbar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import supabase from './component/connect';
import LoginPage from './component/LoginPage';
import SignUpPage from './component/SignUpPage';
import ProfilePage from './component/ProfilePage';
import ForYouPage from './component/ForYouPage';
import MostLikedPage from './component/MostLikedPage';
import Top5Page from './component/Top5Page';
import Regions from './component/Regions';
import ExplorePage from './component/ExplorePage';
import HomePage from './component/Home';
import PostDetailPage from './component/PostDetailPage'; // Import PostDetailPage
import CreateReview from './component/CreateReview';

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
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<HomePage />} />
          <Route path="/post/:postId" element={<PostDetailPage checklogin={checklogin} userData={User}/>} /> {/* Add route for post details */}
          <Route path="/login" element={<LoginPage isLogin={handleLogin}/>} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/profile" element={<ProfilePage userData={User} />} /> 
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/category/:id" element={<Regions />} />
          <Route path="/create-post" element={<CreateReview checklogin={checklogin} userData={User}/>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
