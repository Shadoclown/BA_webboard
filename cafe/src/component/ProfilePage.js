// ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import supabase from './connect';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../style/ProfilePage.css';

const ProfilePage = () => {
  const userData = useLocation().state;
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('User');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for authenticated user
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Make sure we have userData and extract id
        const user_id = userData?.user_id;
        setUsername(userData?.username || 'User');
        const email = userData?.email || 'User';
        
        if (!user_id) {
          console.error('No user ID available');
          setLoading(false);
          return;
        }
        
        // Get user profile data
        const { data: data, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user_id)
          .single();
          
        if (userError && userError.code !== 'PGRST116') {
          throw userError;
        }
        
        // Get user's posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user_id)
          .order('post_id', { ascending: false });
          
        if (postsError) throw postsError;
        
        setUser(data || { username: email });
        setPosts(postsData || []);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  const handleCreatePost = () => {
    // Navigate to create post page
    window.location.href = '/create-post';
  };
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  
  return (
    <div className="profile-page">
      {/* Navigation */}
      
      {/* Main Content */}
      <main className="profile-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <div className="user-profile">
              <div className="avatar-container">
                <div className="avatar"></div>
              </div>
              <h2 className="profile-username">{username}</h2>
            </div>
            
            <div className="posts-section">
              <h3 className="section-title">Your Posts</h3>
              
              {posts.length === 0 ? (
                <p className="no-posts-message">You haven't posted yet!</p>
              ) : (
                <div className="posts-grid">
                  {posts.map(post => (
                    <div key={post.post_id} className="post-card">
                      <div className="post-image">
                        {post.post_image && (
                          <img src={post.post_image} alt={post.post_title} />
                        )}
                      </div>
                      <h4 className="post-title">{post.post_title}</h4>
                      <p className="post-region">{post.post_region}</p>
                      <div className="post-stats">
                        <span className="post-likes">👍 {post.post_like || 0}</span>
                        <span className="post-dislikes">👎 {post.post_dislike || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;