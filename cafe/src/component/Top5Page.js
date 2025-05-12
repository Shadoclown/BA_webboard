import React, { useEffect, useState } from 'react';
import supabase from './connect';
import { useNavigate } from 'react-router-dom';
import '../style/Top5Page.css';

const Top5Page = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Top 5');
  const [curatedLists, setCuratedLists] = useState([]);
  const [dislikedList, setDislikedList] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentDislikedSlide, setCurrentDislikedSlide] = useState(0);
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
          *,
          user:user_id (username)
        `)
        // .order('post_like', { ascending: false });

      if (error) throw error;

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

      // Create the disliked lists array
      const dislikedLists = [
        {
          id: 6,
          title: "Top 5 Most Disliked of North Region",
          subtitle: "Places that didn't impress our reviewers",
          posts: [...data]
            .filter(post => post.post_region === "North" && post.post_dislike > 0)
            .sort((a, b) => (b.post_dislike || 0) - (a.post_dislike || 0))
            .slice(0, 5),
        },
        {
          id: 7,
          title: "Top 5 Most Disliked of East Region",
          subtitle: "The most disliked places in each region",
          posts: [...data]
            .filter(post => post.post_region === "East" && post.post_dislike > 0)
            .sort((a, b) => (b.post_dislike || 0) - (a.post_dislike || 0))
            .slice(0, 5),
        },
        {
          id: 8,
          title: "Top 5 Most Disliked Places of Central Region",
          subtitle: "The most disliked places in each region", 
          posts: [...data]
            .filter(post => post.post_region === "Central" && post.post_dislike > 0)
            .sort((a, b) => (b.post_dislike || 0) - (a.post_dislike || 0))
            .slice(0, 5),
        },
        {
          id: 9,
          title: "Top 5 Most Disliked Places of South Region",
          subtitle: "The most disliked places in each region", 
          posts: [...data]
            .filter(post => post.post_region === "South" && post.post_dislike > 0)
            .sort((a, b) => (b.post_dislike || 0) - (a.post_dislike || 0))
            .slice(0, 5),
        }
      ];

      // Ensure each list has at least one post
      const finalLists = listCategories.map(list => ({
        ...list,
        posts: list.posts.length > 0 ? list.posts : data.slice(0, 5),
      }));

      // Also ensure each disliked list has posts
      const finalDislikedLists = dislikedLists.map(list => ({
        ...list,
        posts: list.posts.length > 0 ? list.posts : data.slice(0, 5),
      }));

      setCuratedLists(finalLists);
      setDislikedList(finalDislikedLists);
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

  const handlePrevDislikedSlide = () => {
    setCurrentDislikedSlide(prev => (prev === 0 ? dislikedList.length - 1 : prev - 1));
  };

  const handleNextDislikedSlide = () => {
    setCurrentDislikedSlide(prev => (prev + 1) % dislikedList.length);
  };

  return (
    <div className="top-5-container">
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

          {dislikedList && (
            <div className="disliked-section">
              <h2 className="section-title">Top 5 Most Disliked of each Region</h2>
              
              <div className="curated-lists-container">
                <button
                  className="carousel-button prev-button"
                  onClick={handlePrevDislikedSlide}
                >
                  ◀
                </button>

                <div className="curated-lists-carousel">
                  <div 
                    className="carousel-track"
                    style={{
                      transform: `translateX(-${currentDislikedSlide * 100}%)`,
                      width: `${dislikedList.length * 100}%`,
                      display: 'flex'
                    }}
                  >
                    {dislikedList.map((list, index) => (
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
                                <span className="like-icon">👎</span>
                                <span className="like-count">{post.post_dislike || 0}</span>
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
                  onClick={handleNextDislikedSlide}
                >
                  ▶
                </button>
              </div>

              <div className="carousel-indicator">
                <div className="indicator-bar">
                  <div
                    className="indicator-progress"
                    style={{
                      width: `${100 / dislikedList.length}%`,
                      left: `${(currentDislikedSlide * 100) / dislikedList.length}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Top5Page;