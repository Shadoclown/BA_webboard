import React, { useEffect, useState } from 'react';
import supabase from './connect';
import { useParams, useNavigate } from 'react-router-dom';
import '../style/Regions.css';

const Regions = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionName, setRegionName] = useState('');
  const { id } = useParams(); // Get region ID from URL
  const navigate = useNavigate();

  // Map region IDs to region names
  const regionMap = {
    '1': 'North',
    '2': 'East',
    '3': 'South',
    '4': 'West',
    '5': 'Central',
    '6': 'Isaan'
  };

  useEffect(() => {
    fetchRegionPosts();
  }, [id]);

  const fetchRegionPosts = async () => {
    try {
      setLoading(true);
      
      // Set region name based on ID
      setRegionName(regionMap[id] || 'Unknown Region');

      // Fetch posts filtered by region
      const { data, error } = await supabase
        .from('post')
        .select(`
          *,
          user:user_id (username)
        `)
        .eq('post_region', regionMap[id]);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch posts. Supabase error: ${error.message}`);
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error.message);
      alert(`Error fetching posts: ${error.message}`);
    } finally {
      setLoading(false);
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

  const getRandomDateForPost = (postId) => {
    const seed = postId % 90;
    const now = new Date();
    const randomDate = new Date(now);
    randomDate.setDate(now.getDate() - (seed + 1));
    return randomDate;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  return (
    <div className="region-container">
      <h1 className={`region-title region-${regionName}`}>{regionName} Region Cafes and Restaurants</h1>
      
      {loading ? (
        <div className="loading">Loading...</div>
      ) : posts.length > 0 ? (
        <div className="region-posts-grid">
          {posts.map(post => (
            <div key={post.post_id} className={`region-post-card region-${regionName}`} onClick={() => handlePostClick(post.post_id)}>
              <div className="region-post-header">
                <div className="region-user-avatar">
                  {post.user?.username?.[0].toUpperCase() || 'A'}
                </div>
                <div className="region-post-meta">
                  <div className="region-username">{post.user?.username || 'Anonymous'}</div>
                  <div className="region-post-date">
                    {formatDate(post.created_at || getRandomDateForPost(post.post_id))}
                  </div>
                </div>
              </div>

              <h3 className="region-post-title">{post.post_title}</h3>
              <p className="region-post-content">{post.post_detail}</p>

              <div className="region-post-footer">
                <div className="region-tag">{post.post_region}</div>
                <div className="region-like-container" onClick={() => handleLike(post.post_id)}>
                  <span className="region-like-icon">👍</span>
                  <span className="region-like-count">{post.post_like || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="region-no-posts">
          <p>No posts found for {regionName} region.</p>
          <button onClick={() => navigate('/browse')} className="region-browse-button">
            Browse All Posts
          </button>
        </div>
      )}
    </div>
  );
};

export default Regions;
