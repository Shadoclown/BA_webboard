// src/components/PostDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import supabase from './connect'; // Make sure this path matches your project structure
import '../style/PostDetailPage.css';

// --- Helper Functions ---
const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '';
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const getAllImageUrls = (post) => {
  const urls = [];
  if (!post) return urls;
  let imagesProcessedFromPostImageArray = false;
  
  if (post.post_image) {
    if (typeof post.post_image === 'string' && post.post_image.startsWith('[') && post.post_image.endsWith(']')) {
      try {
        const parsedImages = JSON.parse(post.post_image);
        if (Array.isArray(parsedImages)) {
          parsedImages.forEach(url => { 
            if (typeof url === 'string' && url.trim() !== '') 
              urls.push(url.trim()); 
          });
          imagesProcessedFromPostImageArray = true;
        } else if (typeof post.post_image === 'string' && post.post_image.trim() !== '') { 
          urls.push(post.post_image.trim()); 
        }
      } catch (e) { 
        if (typeof post.post_image === 'string' && post.post_image.trim() !== '') { 
          urls.push(post.post_image.trim()); 
        } 
      }
    } else if (typeof post.post_image === 'string' && post.post_image.trim() !== '') { 
      urls.push(post.post_image.trim()); 
    }
  }
  
  if (!imagesProcessedFromPostImageArray) {
    if (post.post_image_2 && typeof post.post_image_2 === 'string' && post.post_image_2.trim() !== '') { 
      urls.push(post.post_image_2.trim()); 
    }
    if (post.post_image_3 && typeof post.post_image_3 === 'string' && post.post_image_3.trim() !== '') { 
      urls.push(post.post_image_3.trim()); 
    }
  }
  return urls;
};

// Function to get related posts by region
const getRegionDescription = (region) => {
  const descriptions = {
    'South': 'Southern establishments are famous for their hospitality and traditional recipes.',
    'Central': 'Central area offers a variety of dining experiences in the heart of the city.',
    'North': 'Northern region is known for its cozy cafes and hearty meals.',
    'East': 'Eastern establishments feature unique fusion cuisine and scenic views.',
    'West': 'Western area is famous for trendy spots and innovative dining concepts.'
  };
  
  return descriptions[region] || 'This region offers unique dining experiences and local specialties.';
};

const PostDetailPage = ({ checklogin, userData }) => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdatingVotes, setIsUpdatingVotes] = useState(false);
  const [userVote, setUserVote] = useState({ liked: false, disliked: false });

  // --- Comments State ---
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // --- Related Posts State ---
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  // Fetch post details
  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!postId) return;
      setLoadingPost(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('post')
          .select(`
            *,
            user ( username )
          `)
          .eq('post_id', postId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Post not found');
        console.log('Post data:', data); // Debug: log the retrieved post
        setPost(data);
        const storedVote = localStorage.getItem(`post-${postId}-vote`);
        if (storedVote) setUserVote(JSON.parse(storedVote));
        
        // Fetch related posts if we have a region
        if (data.post_region) {
          fetchRelatedPosts(data.post_region, data.post_id);
        }
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError(err.message || 'Failed to load post.');
      } finally {
        setLoadingPost(false);
      }
    };
    fetchPostDetails();
  }, [postId]);

  // Fetch related posts
  const fetchRelatedPosts = async (region, currentPostId) => {
    setLoadingRelated(true);
    try {
      const { data, error } = await supabase
        .from('post')
        .select(`
          post_id,
          post_title,
          user_id,
          user:user_id (username)
        `)
        .eq('post_region', region)
        .neq('post_id', currentPostId)
        .limit(3);
        
      if (error) throw error;
      setRelatedPosts(data || []);
    } catch (err) {
      console.error('Error fetching related posts:', err);
      // Don't set error state to avoid disrupting the main content
    } finally {
      setLoadingRelated(false);
    }
  };

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoadingComments(true);
    try {
      // Simplified query to avoid join issues
      const { data, error: commentsError } = await supabase
        .from('comment')
        .select('*')
        .eq('post_id', postId);
        // .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;
      console.log('Comments data:', data); // Debug: log the retrieved comments
      
      // Now fetch user details separately for each comment
      const commentsWithUsers = await Promise.all(
        (data || []).map(async (comment) => {
          if (!comment.user_id) return { ...comment, user: null };
          
          const { data: userData, error: userError } = await supabase
            .from('user')
            .select('username')
            .eq('user_id', comment.user_id)
            .single();
            
          if (userError) {
            console.error('Error fetching user for comment:', userError);
            return { ...comment, user: null };
          }
          
          return { ...comment, user: userData };
        })
      );
      
      setComments(commentsWithUsers || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleVote = async (voteType) => {
    if (!post || isUpdatingVotes) return;
    setIsUpdatingVotes(true);
    const currentLikes = post.post_like || 0;
    const currentDislikes = post.post_dislike || 0;
    let newLikes = currentLikes;
    let newDislikes = currentDislikes;
    let newUserVote = { ...userVote };
    const originalPostState = { ...post };
    const originalUserVoteState = { ...userVote };

    if (voteType === 'like') {
      if (userVote.liked) { 
        newLikes = currentLikes - 1; 
        newUserVote.liked = false; 
      } else { 
        newLikes = currentLikes + 1; 
        newUserVote.liked = true;
        if (userVote.disliked) { 
          newDislikes = currentDislikes - 1; 
          newUserVote.disliked = false;
        }
      }
    } else if (voteType === 'dislike') {
      if (userVote.disliked) { 
        newDislikes = currentDislikes - 1; 
        newUserVote.disliked = false; 
      } else { 
        newDislikes = currentDislikes + 1; 
        newUserVote.disliked = true;
        if (userVote.liked) { 
          newLikes = currentLikes - 1; 
          newUserVote.liked = false; 
        }
      }
    }
    
    setPost(p => ({...p, post_like: Math.max(0, newLikes), post_dislike: Math.max(0, newDislikes)}));
    setUserVote(newUserVote);
    localStorage.setItem(`post-${postId}-vote`, JSON.stringify(newUserVote));
    
    try {
      const { error: updateError } = await supabase
        .from('post')
        .update({ 
          post_like: Math.max(0, newLikes), 
          post_dislike: Math.max(0, newDislikes) 
        })
        .eq('post_id', postId);
        
      if (updateError) throw updateError;
    } catch (err) {
      console.error(`Error updating post vote:`, err);
      setPost(originalPostState); 
      setUserVote(originalUserVoteState); 
      localStorage.setItem(`post-${postId}-vote`, JSON.stringify(originalUserVoteState));
      alert(`Failed to update vote. Please try again.`);
    } finally { 
      setIsUpdatingVotes(false); 
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newCommentText.trim()) {
      alert("Comment cannot be empty");
      return;
    }
    
    if (!checklogin || !userData) {
      alert("You must be logged in to comment");
      return;
    }
    
    if (!postId) {
      alert("Post ID is missing");
      return;
    }
    
    setIsSubmittingComment(true);
    console.log("Submitting comment with user:", userData);

    try {
      // First, insert the comment
      const { data: newComment, error: insertError } = await supabase
        .from('comment')
        .insert({
          post_id: postId,
          user_id: userData.user_id,
          comment_detail: newCommentText.trim(),
          comment_like: 0,
          comment_dislike: 0
        })
        .select();

      if (insertError) throw insertError;
      console.log("Comment inserted:", newComment);

      if (!Array.isArray(newComment) || newComment.length === 0) {
        throw new Error("Comment was inserted but no data was returned");
      }

      // Add the new comment to the current state
      const commentWithUser = {
        ...newComment[0],
        user: { username: userData.username || userData.email?.split('@')[0] || 'User' }
      };

      // Add to comments state
      setComments(prevComments => [...prevComments, commentWithUser]);
      setNewCommentText('');

      // Update post's comment_count
      if (post) {
        const { error: countError } = await supabase
          .from('post')
          .update({ comment_count: (post.comment_count || 0) + 1 })
          .eq('post_id', postId);
          
        if (countError) {
          console.error("Error updating post comment count:", countError);
        } else {
          setPost(prevPost => ({ 
            ...prevPost, 
            comment_count: (prevPost.comment_count || 0) + 1 
          }));
        }
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Failed to submit comment: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Helper to display commenter name
  const getCommenterName = (commentUser) => {
    if (!commentUser) return 'Anonymous';
    return commentUser.username || 'User';
  };

  if (loadingPost) return <p className="loadingError">Loading post details...</p>;
  if (error) return <p className="loadingError">Error: {error} </p>;
  if (!post) return <p className="loadingError">Post not found.</p>;

  const authorDisplayName = post.user?.username || `User ID: ${post.user_id ? post.user_id.substring(0, 8) : 'N/A'}...`;
  const allImageUrls = getAllImageUrls(post);

  return (
    <div className="pageContainer">
      <Link to="/" className="backLink">
        Back to Post
      </Link>
      
      <div className="contentLayout">
        {/* Main Content Column */}
        <div className="mainContent">
          {/* Post Card */}
          <div className="postCard">
            <h1 className="title">{post.post_title || 'Untitled Post'}</h1>
            
            <div className="meta">
              <span className="postAuthor">By {authorDisplayName}</span>
              <span className="postDate"> • {formatDate(post.created_at)}</span>
              {post.post_region && <span className="regionTag">{post.post_region}</span>}
            </div>
            
            <div className="description">{post.post_detail || 'No description available.'}</div>
            
            {allImageUrls.length > 0 ? (
              <div className="imageGrid">
                {allImageUrls.map((url, index) => (
                  <img 
                    key={index} 
                    src={url} 
                    alt={`${post.post_title || 'Post'} image ${index + 1}`} 
                    className="postImage" 
                  />
                ))}
              </div>
            ) : (
              <div className="imageGrid">
                <div className="imagePlaceholder">No Images Available</div>
              </div>
            )}
            
            <div className="actions">
              <button 
                className={`voteButton ${userVote.liked ? 'activeVote' : ''}`}
                onClick={() => !isUpdatingVotes && handleVote('like')}
                disabled={isUpdatingVotes}
              >
                👍 {post.post_like || 0}
              </button>
              
              <button 
                className={`voteButton ${userVote.disliked ? 'activeDislike' : ''}`}
                onClick={() => !isUpdatingVotes && handleVote('dislike')}
                disabled={isUpdatingVotes}
              >
                👎 {post.post_dislike || 0}
              </button>
              
              <span className="commentCount">
                💬 {comments.length > 0 ? comments.length : (post.comment_count || 0)} comments
              </span>
            </div>
          </div>
          
          {/* Comments Section */}
          <div className="commentsCard">
            <h2 className="commentsTitle">Comments ({comments.length > 0 ? comments.length : (post.comment_count || 0)})</h2>
            
            {checklogin ? (
              <form onSubmit={handleSubmitComment} className="commentForm">
                <textarea
                  className="commentTextarea"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  disabled={isSubmittingComment}
                />
                <button
                  type="submit"
                  className="commentButton"
                  disabled={isSubmittingComment}
                >
                  {isSubmittingComment ? 'Submitting...' : 'Submit Comment'}
                </button>
              </form>
            ) : (
              <div className="loginPrompt">
                <textarea
                  className="commentTextarea"
                  placeholder="Login to comment"
                  disabled={true}
                />
                <Link to="/login" className="commentButton">
                  Login to Comment
                </Link>
              </div>
            )}
            
            {loadingComments && <p>Loading comments...</p>}
            
            {!loadingComments && comments.length === 0 && (
              <p className="noComments">No comments yet. Be the first to comment!</p>
            )}
            
            {!loadingComments && comments.length > 0 && (
              <div className="commentsList">
                {comments.map((comment) => (
                  <div key={comment.comment_id} className="comment">
                    <p className="commentAuthor">
                      {getCommenterName(comment.user)}
                    </p>
                    <p className="commentDate">
                      {formatDate(comment.created_at, true)}
                    </p>
                    <p className="commentText">{comment.comment_detail}</p>
                    <div className="commentActions">
                      <span className="commentActionItem">👍 {comment.comment_like || 0}</span>
                      <span className="commentActionItem">👎 {comment.comment_dislike || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar Column */}
        <div className="regionSidebar">
          <h2 className="sidebarTitle">About This Region</h2>
          
          <div className="regionInfoBox">
            <h3 className="regionName">{post.post_region || 'Region'} Region</h3>
            <p className="regionDescription">
              {getRegionDescription(post.post_region)}
            </p>
          </div>
          
          <div className="moreFromRegion">
            <h3 className="sidebarTitle">More from this region</h3>
            
            {loadingRelated ? (
              <p>Loading related posts...</p>
            ) : relatedPosts.length > 0 ? (
              <>
                {relatedPosts.map(relatedPost => (
                  <div key={relatedPost.post_id} className="relatedPost">
                    <h4 className="relatedPostTitle">
                      <Link to={`/post/${relatedPost.post_id}`}>
                        {relatedPost.post_title || 'Untitled Post'}
                      </Link>
                    </h4>
                    <p className="relatedPostAuthor">
                      By {relatedPost.user?.username || 'Anonymous'}
                    </p>
                  </div>
                ))}
                
                <Link 
                  to={`/region/${post.post_region}`} 
                  className="viewAllLink"
                >
                  View All {post.post_region} Reviews
                </Link>
              </>
            ) : (
              <p>No related posts found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;