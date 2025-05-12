// ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import supabase from './connect';
import { Link, useNavigate } from 'react-router-dom';
import '../style/ProfilePage.css';

const ProfilePage = ({ userData }) => {
  const navigate = useNavigate();

  const userId = userData?.user_id || userData?.userId;
  const username = userData?.username;
  const email = userData?.email;

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        if (!userId) {
          console.error('No user ID available');
          setLoading(false);
          return;
        }
        
        // Get user's posts
        const { data: postsData, error: postsError } = await supabase
          .from('post')
          .select(`
            *,
            user:user_id (username)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (postsError) throw postsError;
        
        setPosts(postsData || []);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
  };
  
  return (
    <div className="profile-container">
      {loading ? (
        <div className="profile-loading">Loading...</div>
      ) : (
        <>
          <div className="profile-header">
            <div className="profile-avatar"></div>
            <h1 className="profile-username">{username}</h1>
          </div>
          
          <div className="profile-content">
            <h2 className="posts-heading">Your Posts</h2>
            
            {posts.length === 0 ? (
              <p className="no-posts">You haven't posted yet!</p>
            ) : (
              <div className="posts-grid">
                {posts.map(post => (
                  <div 
                    key={post.post_id} 
                    className="post-card"
                    onClick={() => navigate(`/post/${post.post_id}`)}
                  >
                    <div className="post-header">
                      <div className="post-avatar"></div>
                      <div className="post-info">
                        <div className="post-title">
                          {post.post_title || 'Untitled Post'}
                        </div>
                        
                      </div>
                    </div>
                    
                    <div className="post-body">
                      <p className="post-content">
                        {post.post_detail?.substring(0, 80) || 'No description'}
                        {post.post_detail?.length > 80 ? '...' : ''}
                      </p>
                    </div>
                    
                    <div className="post-footer">
                      <div className="post-region">{post.post_region || 'Unknown'}</div>
                      <div className="post-likes">
                        <span className="like-icon">👍</span>
                        <span className="like-count">{post.post_like || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePage;