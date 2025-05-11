import React, { useEffect, useState } from 'react';
import supabase from './connect';
import { useNavigate } from 'react-router-dom';
import '../style/ForYouPage.css';

const ForYouPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('For You');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      // Fetch all posts from Supabase instead of just 6
      const { data, error } = await supabase
        .from('post')
        .select(`
          post_id,
          post_title,
          post_detail,
          post_region,
          post_like,
          user:user_id (username)
        `);
        // Removed the .order() and .limit() calls

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch posts. Supabase error: ${error.message}`);
      }

      // Randomize posts on the client side
      const shuffledPosts = data ? [...data].sort(() => 0.5 - Math.random()).slice(0, 6) : [];
      setPosts(shuffledPosts);
    } catch (error) {
      console.error('Error fetching posts:', error.message);
      alert(`Error fetching posts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'For You') {
      // Stay on current page
    } else if (tabName === 'Most Liked') {
      navigate('/most-like'); // Changed from '/most-liked' to match App.js route
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
        .update({ post_like: posts.find(post => post.post_id === postId).post_like + 1 })
        .eq('post_id', postId);

      if (error) throw error;

      // Update local state
      setPosts(posts.map(post =>
        post.post_id === postId
          ? { ...post, post_like: post.post_like + 1 }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Error liking post. Please try again.');
    }
  };

  // Function to get a consistent random date based on post ID
  const getRandomDateForPost = (postId) => {
    // Use the post ID as a seed for pseudo-randomness
    const seed = postId % 90; // Use modulo to keep within 90 days
    
    const now = new Date();
    const randomDate = new Date(now);
    randomDate.setDate(now.getDate() - (seed + 1)); // +1 to avoid 0 days
    
    return randomDate;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  return (
    <div className="for-you-container">
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
        <div className="posts-grid">
          {posts.map(post => (
            <div key={post.post_id} className="post-card">
              <div className="post-header">
                <div className="user-avatar"></div>
                <div className="post-meta">
                  <div className="username">{post.user?.username || 'Anonymous'}</div>
                  <div className="post-date">
                    {formatDate(post.created_at || getRandomDateForPost(post.post_id))}
                  </div>
                </div>
              </div>

              <h3 className="post-title">{post.post_title}</h3>
              <p className="post-content">{post.post_detail}</p>

              <div className="post-footer">
                <div className="region-tag">{post.post_region}</div>
                <div className="like-container" onClick={() => handleLike(post.post_id)}>
                  <span className="like-icon">👍</span>
                  <span className="like-count">{post.post_like}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForYouPage;