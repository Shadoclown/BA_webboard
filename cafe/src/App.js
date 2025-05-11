import Navbar from './component/navbar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './component/LoginPage';
import SignUpPage from './component/SignUpPage';
import ProfilePage from './component/ProfilePage';


function App() {
  return (
    <div>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/profile" element={<ProfilePage />} /> 
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
