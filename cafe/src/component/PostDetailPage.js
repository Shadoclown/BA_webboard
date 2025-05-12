// src/components/PostDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import supabase from './connect'; // Adjust the import based on your project structure
import '../style/PostDetail.css'; // Import CSS file - ensure this file exists at this path

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
                    parsedImages.forEach(url => { if (typeof url === 'string' && url.trim() !== '') urls.push(url.trim()); });
                    imagesProcessedFromPostImageArray = true;
                } else if (typeof post.post_image === 'string' && post.post_image.trim() !== '') { urls.push(post.post_image.trim()); }
            } catch (e) { if (typeof post.post_image === 'string' && post.post_image.trim() !== '') { urls.push(post.post_image.trim()); } }
        } else if (typeof post.post_image === 'string' && post.post_image.trim() !== '') { urls.push(post.post_image.trim()); }
    }
    if (!imagesProcessedFromPostImageArray) {
        if (post.post_image_2 && typeof post.post_image_2 === 'string' && post.post_image_2.trim() !== '') { urls.push(post.post_image_2.trim()); }
        if (post.post_image_3 && typeof post.post_image_3 === 'string' && post.post_image_3.trim() !== '') { urls.push(post.post_image_3.trim()); }
    }
    return urls;
};
// --- End Helper Functions ---


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
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError(err.message || 'Failed to load post.');
      } finally {
        setLoadingPost(false);
      }
    };
    fetchPostDetails();
  }, [postId]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoadingComments(true);
    try {
      // Simplified query to avoid join issues
      const { data, error: commentsError } = await supabase
        .from('comment')
        .select('*')
        .eq('post_id', postId)
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
      if (userVote.liked) { newLikes = currentLikes - 1; newUserVote.liked = false; }
      else { newLikes = currentLikes + 1; newUserVote.liked = true;
        if (userVote.disliked) { newDislikes = currentDislikes - 1; newUserVote.disliked = false;}
      }
    } else if (voteType === 'dislike') {
      if (userVote.disliked) { newDislikes = currentDislikes - 1; newUserVote.disliked = false; }
      else { newDislikes = currentDislikes + 1; newUserVote.disliked = true;
        if (userVote.liked) { newLikes = currentLikes - 1; newUserVote.liked = false; }
      }
    }
    setPost(p => ({...p, post_like: Math.max(0, newLikes), post_dislike: Math.max(0, newDislikes)}));
    setUserVote(newUserVote);
    localStorage.setItem(`post-${postId}-vote`, JSON.stringify(newUserVote));
    try {
      const { error: updateError } = await supabase.from('post').update({ post_like: Math.max(0, newLikes), post_dislike: Math.max(0, newDislikes) }).eq('post_id', postId);
      if (updateError) throw updateError;
    } catch (err) {
      console.error(`Error updating post vote:`, err);
      setPost(originalPostState); setUserVote(originalUserVoteState); localStorage.setItem(`post-${postId}-vote`, JSON.stringify(originalUserVoteState));
      alert(`Failed to update vote. Please try again.`);
    } finally { setIsUpdatingVotes(false); }
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

  if (loadingPost) return <p className="loadingError">Loading post details...</p>;
  if (error) return <p className="loadingError">Error: {error} </p>;
  if (!post) return <p className="loadingError">Post not found.</p>;

  const authorDisplayName = post.user?.username || `User ID: ${post.user_id ? post.user_id.substring(0, 8) : 'N/A'}...`;
  const allImageUrls = getAllImageUrls(post);

  // Helper to display commenter name
  const getCommenterName = (commentUser) => {
    if (!commentUser) return 'Anonymous';
    return commentUser.username || 'User';
  };


  return (
    <div className="container">
      {/* ... Post Title, Meta, Description, Images, Actions ... */}
      <h1 className="title">{post.post_title || 'Untitled Post'}</h1>
      <p className="meta">
        By {authorDisplayName} • Published on {formatDate(post.created_at)}
      </p>
      {post.post_region && <span className="regionTag">{post.post_region}</span>}
      <div className="description">{post.post_detail || 'No description available.'}</div>
      {allImageUrls.length > 0 ? ( <div className="imageGrid"> {allImageUrls.map((url, index) => ( <img key={index} src={url} alt={`${post.post_title || 'Post'} image ${index + 1}`} className="postImage" /> ))} </div> ) : ( <div className="imageGrid"><div className="imagePlaceholder">No Images Available</div></div> )}
      <div className="actions">
        <span className={`actionItem ${userVote.liked ? 'activeVote' : ''} ${isUpdatingVotes ? 'disabledButton' : ''}`} onClick={() => !isUpdatingVotes && handleVote('like')} role="button" tabIndex={0} onKeyPress={(e) => { if (!isUpdatingVotes && (e.key === 'Enter' || e.key === ' ')) handleVote('like'); }}>
          <button className="actionButton" disabled={isUpdatingVotes}>👍 {post.post_like || 0}</button>
        </span>
        <span className={`actionItem ${userVote.disliked ? 'activeDislike' : ''} ${isUpdatingVotes ? 'disabledButton' : ''}`} onClick={() => !isUpdatingVotes && handleVote('dislike')} role="button" tabIndex={0} onKeyPress={(e) => { if (!isUpdatingVotes && (e.key === 'Enter' || e.key === ' ')) handleVote('dislike'); }}>
          <button className="actionButton" disabled={isUpdatingVotes}>👎 {post.post_dislike || 0}</button>
        </span>
        {/* Use fetched comments length for a more reactive count */}
        <span className="actionItem">💬 {comments.length > 0 ? comments.length : (post.comment_count || 0)} Comments</span>
      </div>

      {/* --- Comments Section --- */}
      <div className="commentsSection">
        <h2 className="commentsTitle">Comments ({comments.length > 0 ? comments.length : (post.comment_count || 0)})</h2>
        
        {/* Comment Form */}
        {checklogin ? (
          <form onSubmit={handleSubmitComment} className="commentForm">
            <p className="loggedInAs">Posting as: <strong>{userData?.username || 'User'}</strong></p>
            <textarea
              className="commentTextarea"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows="3"
              disabled={isSubmittingComment}
            />
            <button
              type="submit"
              className={`commentSubmitButton ${isSubmittingComment ? 'commentSubmitButtonDisabled' : ''}`}
              disabled={isSubmittingComment}
            >
              {isSubmittingComment ? 'Submitting...' : 'Submit Comment'}
            </button>
          </form>
        ) : (
          <div className="loginPrompt">
            <p>Please <Link to="/login">log in</Link> to post a comment.</p>
            <p className="loginNote">(Already logged in? Try refreshing the page.)</p>
          </div>
        )}

        {loadingComments && <p>Loading comments...</p>}
        {!loadingComments && comments.length === 0 && (
          <p className="noComments">No comments yet. Be the first to comment!</p>
        )}
        {!loadingComments && comments.length > 0 && (
          <div>
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
      {/* --- End Comments Section --- */}

      <Link to="/" className="backLink">← Back to Home</Link>
    </div>
  );
};

export default PostDetailPage;