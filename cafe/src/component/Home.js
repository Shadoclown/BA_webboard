import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './connect';
import '../style/Home.css'; // Import the new CSS file

// Helper to format date (optional)
const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Helper to format brief description
const formatBriefDescription = (text, maxLength = 120, maxLines = 2) => {
  if (!text) return 'No description available.';

  const lines = text.split('\n');
  let briefContent = lines.slice(0, maxLines).join('\n');
  let wasTruncatedByCharLimit = false;

  if (briefContent.length > maxLength) {
    briefContent = briefContent.substring(0, maxLength - 3) + "...";
    wasTruncatedByCharLimit = true;
  }

  if (!wasTruncatedByCharLimit && lines.length > maxLines) {
    briefContent += "...";
  }

  return briefContent;
};

const PostCard = ({ post, commentCount }) => {
  const navigate = useNavigate();

  const authorDisplayName = post.user?.username || `User ID: ${post.user_id ? post.user_id.substring(0, 8) : 'N/A'}...`;
  const displayDescription = formatBriefDescription(post.post_detail);

  // --- MODIFIED Image URL Extraction and Display Logic ---
  const allImageUrls = [];
  let imagesProcessedFromPostImageArray = false;

  if (post.post_image) {
    if (typeof post.post_image === 'string' && post.post_image.startsWith('[') && post.post_image.endsWith(']')) {
      try {
        const parsedImages = JSON.parse(post.post_image);
        if (Array.isArray(parsedImages)) {
          parsedImages.forEach(url => {
            if (typeof url === 'string' && url.trim() !== '') {
              allImageUrls.push(url.trim());
            }
          });
          imagesProcessedFromPostImageArray = true;
        } else if (typeof post.post_image === 'string' && post.post_image.trim() !== '') {
          allImageUrls.push(post.post_image.trim());
        }
      } catch (e) {
        console.warn('Failed to parse post_image JSON. Treating as a single URL if it\'s a string:', post.post_image, e);
        if (typeof post.post_image === 'string' && post.post_image.trim() !== '') {
          allImageUrls.push(post.post_image.trim());
        }
      }
    } else if (typeof post.post_image === 'string' && post.post_image.trim() !== '') {
      allImageUrls.push(post.post_image.trim());
    }
  }

  if (!imagesProcessedFromPostImageArray) {
    if (post.post_image_2 && typeof post.post_image_2 === 'string' && post.post_image_2.trim() !== '') {
      allImageUrls.push(post.post_image_2.trim());
    }
    if (post.post_image_3 && typeof post.post_image_3 === 'string' && post.post_image_3.trim() !== '') {
      allImageUrls.push(post.post_image_3.trim());
    }
  }

  const imageSlots = [];
  const MAX_UI_IMAGE_SLOTS = 3;

  if (allImageUrls.length === 0) {
    imageSlots.push({ type: 'placeholder', text: 'No Image' });
  } else if (allImageUrls.length === 1) {
    imageSlots.push({ type: 'real', src: allImageUrls[0], alt: `${post.post_title || 'Post'} image 1` });
  } else {
    imageSlots.push({ type: 'real', src: allImageUrls[0], alt: `${post.post_title || 'Post'} image 1` });
    if (MAX_UI_IMAGE_SLOTS >= 2) {
      imageSlots.push({ type: 'real', src: allImageUrls[1], alt: `${post.post_title || 'Post'} image 2` });
    }
    if (MAX_UI_IMAGE_SLOTS >= 3) {
      if (allImageUrls.length === 3) {
        imageSlots.push({ type: 'real', src: allImageUrls[2], alt: `${post.post_title || 'Post'} image 3` });
      } else if (allImageUrls.length > 3) {
        const remainingCount = allImageUrls.length - 2;
        imageSlots.push({ type: 'plusMore', text: `+${remainingCount}` });
      }
    }
  }
  // --- END OF MODIFIED Image URL Extraction and Display Logic ---

  const handleCardClick = () => {
    if (post && post.post_id) {
      console.log('Navigating to post ID:', post.post_id);
      navigate(`/post/${post.post_id}`);
    } else {
      console.error("PostCard: post_id is missing, cannot navigate.");
    }
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`card ${isHovered ? 'card-hovered' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="link"
      tabIndex={0}
      onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
    >
      <div className="cardHeader">
        <div>
          <h3 className="cardTitle">{post.post_title || 'Untitled Post'}</h3>
          <p className="cardMeta">
            By {authorDisplayName} • {formatDate(post.created_at)}
          </p>
        </div>
        {post.post_region && <span className="regionTag">{post.post_region}</span>}
      </div>

      <p className="cardDescription">{displayDescription}</p>

      <div className="imageContainer">
        {allImageUrls.length === 0 ? (
          // If there are no images at all, show one placeholder
          <img 
            src="https://placehold.co/40x40/EEE/31343C" 
            alt="No Image Available" 
            className="postImage" 
          />
        ) : (
          // Otherwise show the actual images
          imageSlots.slice(0, MAX_UI_IMAGE_SLOTS).map((img, index) => {
            if (img.type === 'real') {
              return <img key={index} src={img.src} alt={img.alt} className="postImage" />;
            } else if (img.type === 'plusMore') {
              return <div key={index} className="plusMoreImages">{img.text}</div>;
            } else {
              // Use the placeholder image URL for any other case
              return <img 
                key={index} 
                src="https://placehold.co/40x40/EEE/31343C" 
                alt="No Image" 
                className="postImage" 
              />;
            }
          })
        )}
      </div>

      <div className="cardActions">
        <span className="actionItem">👍 {post.post_like || 0}</span>
        <span className="actionItem">👎 {post.post_dislike || 0}</span>
        <span className="actionItem">💬 {commentCount || post.comment_count || 0}</span>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Region');

  const regions = ['All Region', 'North', 'East', 'South', 'West', 'Central'];

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('post')
        .select(`
          *,
          user ( username )
        `)
        .order('created_at', { ascending: false });

      if (selectedRegion !== 'All Region') {
        query = query.eq('post_region', selectedRegion);
      }

      if (searchTerm.trim() !== '') {
        query = query.or(`post_title.ilike.%${searchTerm.trim()}%,post_detail.ilike.%${searchTerm.trim()}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message || 'Failed to fetch posts.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedRegion]);

  const fetchCommentCounts = useCallback(async (postIds) => {
    if (!postIds || postIds.length === 0) return;
    
    try {
      const counts = {};
      for (const postId of postIds) {
        const { count, error: countError } = await supabase
          .from('comment')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
        
        if (!countError) {
          counts[postId] = count;
        }
      }
      
      setCommentCounts(counts);
    } catch (err) {
      console.error('Error in fetchCommentCounts:', err);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (posts.length > 0) {
      const postIds = posts.map(post => post.post_id);
      fetchCommentCounts(postIds);
    }
  }, [posts, fetchCommentCounts]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  return (
    <div className="pageContainer">
      <aside className="sidebar">
        <section className="searchSection">
          <h2 className="sectionTitle">Search Posts</h2>
          <form onSubmit={handleSearch} className="searchInputContainer">
            <input
              type="text"
              placeholder="Search title or detail"
              className="searchInput"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="searchButton">Search</button>
          </form>
        </section>

        <section className="filterSection">
          <h2 className="sectionTitle">Filter By Region</h2>
          {regions.map((region) => (
            <button
              key={region}
              className={`regionButton ${selectedRegion === region ? 'selectedRegionButton' : ''}`}
              onClick={() => setSelectedRegion(region)}
            >
              {region}
            </button>
          ))}
        </section>
      </aside>

      <main className="mainContent">
        <h1 className="pageTitle">For you page</h1>
        {loading && <p className="loadingText">Loading posts...</p>}
        {error && <p className="errorText">Error: {error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p className="noPostsText">No posts found. Try adjusting your search or filters.</p>
        )}
        {!loading && !error && posts.length > 0 && (
          <div>
            {posts.map((post) => (
              <PostCard 
                key={post.post_id} 
                post={post} 
                commentCount={commentCounts[post.post_id]}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;