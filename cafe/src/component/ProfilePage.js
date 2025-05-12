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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

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

  const handleDeletePost = async (postId) => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      // Delete comments first (to maintain foreign key constraints)
      const { error: commentsError } = await supabase
        .from('comment')
        .delete()
        .eq('post_id', postId);
      
      if (commentsError) throw commentsError;
      
      // Delete the post
      const { error: deleteError } = await supabase
        .from('post')
        .delete()
        .eq('post_id', postId);
      
      if (deleteError) throw deleteError;
      
      // Update local state to remove the deleted post
      setPosts(posts.filter(post => post.post_id !== postId));
      
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post: ' + err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(null);
    }
  };
  
  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };
  
  return (
    <div className="profile-container">
      {loading ? (
        <div className="profile-loading">Loading...</div>
      ) : (
        <>
          <div className="profile-header">
            <div className="profile-avatar">
              {username ? username.charAt(0).toUpperCase() : ''}
            </div>
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
                  >
                    <div className="post-header">
                      <div className="post-info">
                        <div className="post-title">
                          {post.post_title || 'Untitled Post'}
                        </div>
                        <div className="post-date">
                          {formatDate(post.created_at)}
                        </div>
                      </div>
                      <button 
                        className="delete-post-button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(post.post_id);
                        }}
                        aria-label="Delete post"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div 
                      className="post-content-wrapper"
                      onClick={() => handlePostClick(post.post_id)}
                    >
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
                    
                    {/* Delete confirmation dialog */}
                    {showDeleteConfirm === post.post_id && (
                      <div className="delete-confirm-overlay">
                        <div className="delete-confirm-dialog">
                          <p>Delete this post?</p>
                          <div className="delete-confirm-buttons">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(null);
                              }}
                              className="cancel-delete-button"
                              disabled={isDeleting}
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePost(post.post_id);
                              }}
                              className="confirm-delete-button"
                              disabled={isDeleting}
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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