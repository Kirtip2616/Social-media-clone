import React, { useState, useEffect } from "react";
import axios from "axios";
import StoryCreation from "./StoryCreation";
import "./stories.css";

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [showStoryCreation, setShowStoryCreation] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchStories();
    fetchCurrentUser();
  }, []);

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/stories", {
        headers: { token }
      });
      setStories(res.data.stories || []);
      
      // Fetch my stories separately
      const myRes = await axios.get("http://localhost:3000/stories/me", {
        headers: { token }
      });
      setMyStories(myRes.data.stories || []);
    } catch (err) {
      console.error("Error fetching stories:", err);
    }
  };

  const fetchCurrentUser = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload.id);
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }
  };

  const handleStoryClick = (story) => {
    setSelectedStory(story);
  };

  const handleCreateStory = () => {
    setShowStoryCreation(true);
  };

  const handleStoryCreated = () => {
    fetchStories();
    setShowStoryCreation(false);
  };

  const closeStoryViewer = () => {
    setSelectedStory(null);
  };

  const allStories = [
    ...myStories.map(story => ({ ...story, isMyStory: true })),
    ...stories.filter(story => 
      !myStories.some(myStory => myStory._id === story._id)
    ).map(story => ({ ...story, isMyStory: false }))
  ];

  // Group stories by user
  const storiesByUser = allStories.reduce((acc, story) => {
    const userId = story.userid?._id || story.userid;
    if (!acc[userId]) {
      acc[userId] = {
        user: story.userid,
        stories: [],
        isCurrentUser: userId === currentUser
      };
    }
    acc[userId].stories.push(story);
    return acc;
  }, {});

  return (
    <div className="stories-container">
      {showStoryCreation && (
        <StoryCreation 
          onStoryCreated={handleStoryCreated}
          onClose={() => setShowStoryCreation(false)}
        />
      )}

      {selectedStory && (
        <div className="story-viewer">
          <div className="story-content" style={{ 
            backgroundColor: selectedStory.backgroundColor || '#000',
            color: selectedStory.textColor || '#fff'
          }}>
            {selectedStory.imageUrl && (
              <img src={selectedStory.imageUrl} alt="Story" className="story-full-image" />
            )}
            {selectedStory.caption && (
              <div className="story-caption">{selectedStory.caption}</div>
            )}
            <button className="close-story-btn" onClick={closeStoryViewer}>×</button>
          </div>
        </div>
      )}

      <div className="stories-list">
      {/* My Story (Create new) */}
      <div className="story-item my-story" onClick={handleCreateStory}>
        <div className="story-avatar create-new">
          <div className="add-icon">+</div>
        </div>
        <div className="story-username">Your Story</div>
      </div>

      {/* Show my created stories */}
      {Object.values(storiesByUser)
        .filter(userStories => userStories.isCurrentUser)
        .map((userStories, index) => (
          <div 
            key={index}
            className="story-item"
            onClick={() => handleStoryClick(userStories.stories[0])}
          >
            <div className="story-avatar has-new">
              <div className="avatar-initial">
                {userStories.user?.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="story-username">
              {userStories.user?.name || 'Me'}
            </div>
          </div>
        ))}

     {/* Other users' stories */}
      {Object.values(storiesByUser)
        .filter(userStories => !userStories.isCurrentUser)
        .map((userStories, index) => (
          <div 
            key={index}
            className="story-item"
            onClick={() => handleStoryClick(userStories.stories[0])}
          >
            <div className={`story-avatar ${userStories.stories.some(s => s.isMyStory) ? 'has-new' : ''}`}>
              <div className="avatar-initial">
                {userStories.user?.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="story-username">
              {userStories.user?.name || 'Unknown User'}
            </div>
          </div>
        ))}
    </div>
    </div>
  );
}