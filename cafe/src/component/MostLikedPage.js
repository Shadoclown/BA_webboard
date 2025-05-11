import React, { useEffect, useState } from 'react';
import supabase from './connect';
import { useNavigate } from 'react-router-dom';
import '../style/MostLikedPage.css';

const MostLikedPage = () => {
  const [topPosts, setTopPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Most Liked');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMostLikedPosts();
  }, []);

  const fetchMostLikedPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch posts ordered by likes (descending)
      const { data, error } = await supabase
        .from('post')
        .select(`
          *,
          user:user_id (username)
        `)
        .order('post_like', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      setTopPosts(data || []);
    } catch (error) {
      console.error('Error fetching most liked posts:', error);
      alert('Error fetching posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'For You') {
      navigate('/for-you');
    } else if (tabName === 'Most Liked') {
      // Stay on current page - already at most-like
    } else if (tabName === 'Top 5') {
      navigate('/top-5');
    }
  };

  const handleLike = async (postId) => {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please log in to like posts');
        return;
      }
      
      // Update post likes in the database
      const { error } = await supabase
        .from('post')
        .update({ post_like: topPosts.find(post => post.post_id === postId).post_like + 1 })
        .eq('post_id', postId);
        
      if (error) throw error;
      
      // Update local state
      setTopPosts(topPosts.map(post => 
        post.post_id === postId 
          ? { ...post, post_like: post.post_like + 1 } 
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Error liking post. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  return (
    <div className="most-liked-container">
      {/* <h1 className="explore-title">Explore Cafes and Restaurants</h1>
      
      <div className="tabs-container">
        <div 
          className={`tab ${activeTab === 'For You' ? 'active' : ''}`}
          onClick={() => handleTabClick('For You')}
        >
          For You
        </div>
        <div 
          className={`tab ${activeTab === 'Most Liked' ? 'active' : ''}`}
          onClick={() => handleTabClick('Most Liked')}
        >
          Most Liked
        </div>
        <div 
          className={`tab ${activeTab === 'Top 5' ? 'active' : ''}`}
          onClick={() => handleTabClick('Top 5')}
        >
          Top 5
        </div>
      </div> */}
      
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <h2 className="section-title">Top 10 Cafés & Restaurants (Most Liked)</h2>
          
          <div className="top-10-list">
            {topPosts.slice(0, 10).map((post, index) => (
              <div key={post.post_id} className="top-10-item">
                <div className="rank">{index + 1}</div>
                <div className="post-details">
                  <h3 className="post-title">{post.post_title || 'Untitled Post'}</h3>
                  <p className="post-meta">
                    by {post.user?.username || 'Anonymous'} • {post.post_region || 'Unknown Region'}
                  </p>
                </div>
                <div className="like-section">
                  <span className="like-count">{post.post_like || 0}k</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MostLikedPage;