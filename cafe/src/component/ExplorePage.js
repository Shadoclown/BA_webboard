import ForYouPage from './ForYouPage';
import MostLikedPage from './MostLikedPage';
import Top5Page from './Top5Page';
import React, { useState, useEffect, useRef } from 'react';
import '../style/ExplorePage.css';

const ExplorePage = () => {
    const [activeTab, setActiveTab] = useState('For You');

    // Render content based on active tab
    const renderContent = () => {
        switch(activeTab) {
            case 'For You':
                return <ForYouPage />;
            case 'Most Liked':
                return <MostLikedPage />;
            case 'Top 5':
                return <Top5Page />;
            default:
                return <ForYouPage />;
        }
    };

    return (
        <div className="explore-page">
            <h1 className="explore-title">Explore Cafes and Restaurants</h1>

            <div className="tab-navigation">
                <div className="tabs-container">
                    <div 
                        className={`${activeTab === 'For You' ? 'active-tab' : 'not-active-tab'}`}
                        onClick={() => setActiveTab('For You')}
                    >
                        For You
                    </div>

                    <div
                        className={`${activeTab === 'Most Liked' ? 'active-tab' : 'not-active-tab'}`}
                        onClick={() => setActiveTab('Most Liked')}
                    >
                        Most Liked
                    </div>

                    <div 
                        className={`${activeTab === 'Top 5' ? 'active-tab' : 'not-active-tab'}`}
                        onClick={() => setActiveTab('Top 5')}
                    >
                        Top 5
                    </div>
                    
                </div>
            </div>

            <div className="tab-content">
                {renderContent()}
            </div>
        </div>
    );
}

export default ExplorePage;