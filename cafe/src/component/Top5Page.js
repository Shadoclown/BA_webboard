import React, { useEffect, useState } from 'react';
import supabase from './connect';
import { useNavigate } from 'react-router-dom';
import '../style/Top5Page.css';

const Top5Page = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Top 5');
  const [curatedLists, setCuratedLists] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopPosts();
  }, []);

  const fetchTopPosts = async () => {
    try {
      setLoading(true);

      // Fetch posts ordered by likes
      const { data, error } = await supabase
        .from('post')
        .select(`
          post_id,
          post_title,
          post_detail,
          post_region,
          post_like,
          user:user_id (username)
        `)
        .order('post_like', { ascending: false });

      if (error) throw error;

      // Create curated lists dynamically
      const listCategories = [
        {
          id: 1,
          title: "Top 5 Latest Reviews",
          subtitle: "Fresh perspectives on local cafés and restaurants",
          posts: data.filter(post =>
            post.post_id === Math.max(...data.map(p => p.post_id))
          ).slice(0, 5),
        },
        {
          id: 2,
          title: "Top 5 Coffee Spots",
          subtitle: "The best places to get your caffeine fix",
          posts: data.filter(post =>
            post.post_title?.toLowerCase().includes('coffee') ||
            post.post_detail?.toLowerCase().includes('coffee')
          ).slice(0, 5),
        },
        {
          id: 3,
          title: "Top 5 Dessert Places",
          subtitle: "Satisfy your sweet tooth at these top spots",
          posts: data.filter(post =>
            post.post_title?.toLowerCase().includes('dessert') ||
            post.post_detail?.toLowerCase().includes('dessert') ||
            post.post_title?.toLowerCase().includes('cake') ||
            post.post_detail?.toLowerCase().includes('cake')
          ).slice(0, 5),
        },
        {
          id: 4,
          title: "Top 5 Romantic Spots",
          subtitle: "Perfect places for a date night",
          posts: data.filter(post =>
            post.post_title?.toLowerCase().includes('romantic') ||
            post.post_detail?.toLowerCase().includes('romantic') ||
            post.post_title?.toLowerCase().includes('couples') ||
            post.post_detail?.toLowerCase().includes('couples') ||
            post.post_title?.toLowerCase().includes('date') ||
            post.post_detail?.toLowerCase().includes('date')
          ).slice(0, 5),
        },
        {
          id: 5,
          title: "Top 5 Family-Friendly Places",
          subtitle: "Great options for dining with kids",
          posts: data.filter(post =>
            post.post_title?.toLowerCase().includes('family') ||
            post.post_detail?.toLowerCase().includes('family') ||
            post.post_title?.toLowerCase().includes('kid') ||
            post.post_detail?.toLowerCase().includes('kid')
          ).slice(0, 5),
        },
      ];

      // Ensure each list has at least one post
      const finalLists = listCategories.map(list => ({
        ...list,
        posts: list.posts.length > 0 ? list.posts : data.slice(0, 5),
      }));

      setCuratedLists(finalLists);
    } catch (error) {
      console.error('Error fetching top posts:', error);
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
      navigate('/most-like');
    } else if (tabName === 'Top 5') {
      // Stay on current page
    }
  };

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? curatedLists.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % curatedLists.length);
  };

  return (
    <div className="top-5-container">
      <h1 className="explore-title">Explore Cafes and Restaurants</h1>
      
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
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <h2 className="section-title">Top 5 Curated Lists</h2>

          <div className="curated-lists-container">
            <button
              className="carousel-button prev-button"
              onClick={handlePrevSlide}
            >
              ◀
            </button>

            <div className="curated-lists-carousel">
              <div 
                className="carousel-track"
                style={{
                  transform: `translateX(-${currentSlide * 100}%)`,
                  width: `${curatedLists.length * 100}%`,
                  display: 'flex'
                }}
              >
                {curatedLists.map((list, index) => (
                  <div
                    key={list.id}
                    className="curated-list-card"
                  >
                    <div className="curator-info">
                      <div className="curator-avatar"></div>
                      <div>
                        <h3 className="curator-title">{list.title}</h3>
                        <p className="curator-subtitle">{list.subtitle}</p>
                      </div>
                    </div>

                    {list.posts.slice(0, 1).map(post => (
                      <div key={post.post_id} className="featured-post">
                        <h3 className="featured-post-title">{post.post_title || 'Untitled Post'}</h3>
                        <p className="featured-post-description">
                          {post.post_detail || 'No description available.'}
                        </p>

                        <div className="post-footer">
                          <div className="region-tag">{post.post_region || 'Unknown Region'}</div>
                          <div className="like-container">
                            <span className="like-icon">👍</span>
                            <span className="like-count">{post.post_like || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <button
              className="carousel-button next-button"
              onClick={handleNextSlide}
            >
              ▶
            </button>
          </div>

          <div className="carousel-indicator">
            <div className="indicator-bar">
              <div
                className="indicator-progress"
                style={{
                  width: `${100 / curatedLists.length}%`,
                  left: `${(currentSlide * 100) / curatedLists.length}%`,
                }}
              ></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Top5Page;