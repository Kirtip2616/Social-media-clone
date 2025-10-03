import React, { useState, useEffect } from "react";
import axios from "axios";
import StoryCreation from "./StoryCreation";
import "./stories.css";
import { FaPlus, FaTrash } from "react-icons/fa6";

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [showStoryCreation, setShowStoryCreation] = useState(false);
  const [selectedStories, setSelectedStories] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  useEffect(() => {
    fetchStories();
    fetchCurrentUser();
    fetchCurrentUserProfile();
  }, []);

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/stories", {
        headers: { token }
      });
      console.log("Stories API response:", JSON.stringify(res.data, null, 2));
      const stories = res.data.stories || [];

      const enrichedStories = stories.map(story => ({
        ...story,
        userid: story.userid || { _id: story.userid, name: 'Unknown', profilePicture: null }
      }));
      setStories(enrichedStories);

      const myRes = await axios.get("http://localhost:3000/stories/me", {
        headers: { token }
      });
      console.log("My Stories API response:", JSON.stringify(myRes.data, null, 2));
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

  const fetchCurrentUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/profile", {
        headers: { token }
      });
      console.log("Profile API response:", JSON.stringify(res.data, null, 2));
      setCurrentUserProfile(res.data.user);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const handleStoryClick = (userStories) => {
    setSelectedStories(userStories);
    setCurrentStoryIndex(0);
  };

  const handleNextStory = () => {
    if (selectedStories && currentStoryIndex < selectedStories.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      setSelectedStories(null);
      setCurrentStoryIndex(0);
    }
  };

  const handlePreviousStory = () => {
    if (selectedStories && currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    }
  };

  const handleCreateStory = () => {
    setShowStoryCreation(true);
  };

  const handleStoryCreated = () => {
    fetchStories();
    setShowStoryCreation(false);
  };

const handleDeleteStory = async (storyId) => {
  if (!window.confirm("Are you sure you want to delete this story?")) return;
  
  try {
    console.log("Deleting story with ID:", storyId);
    const token = localStorage.getItem("token");
    
    // Make the API call
    await axios.delete(`http://localhost:3000/stories/${storyId}`, {
      headers: { token }
    });
    
    console.log("Story deleted from backend successfully");
    
    // Update ALL states immediately
    setStories(prev => {
      const updated = prev.filter(story => story._id !== storyId);
      console.log("Updated stories:", updated);
      return updated;
    });
    
    setMyStories(prev => {
      const updated = prev.filter(story => story._id !== storyId);
      console.log("Updated myStories:", updated);
      return updated;
    });
    
    // Update selectedStories if it exists
    if (selectedStories) {
      const updatedSelectedStories = selectedStories.stories.filter(story => story._id !== storyId);
      
      if (updatedSelectedStories.length === 0) {
        // No stories left, close viewer
        setSelectedStories(null);
        setCurrentStoryIndex(0);
      } else {
        // Update selected stories and adjust index
        setSelectedStories({
          ...selectedStories,
          stories: updatedSelectedStories
        });
        
        // Adjust current index if needed
        if (currentStoryIndex >= updatedSelectedStories.length) {
          setCurrentStoryIndex(updatedSelectedStories.length - 1);
        }
      }
    }
    
    alert("Story deleted successfully!");
    
  } catch (err) {
    console.error("Error deleting story:", err);
    alert("Failed to delete story. Please try again.");
  }
};

  const closeStoryViewer = () => {
    setSelectedStories(null);
    setCurrentStoryIndex(0);
  };

  const handleImageError = (e, userName) => {
    console.error(`Failed to load profile picture for ${userName || 'user'}:`, e.target.src);
    e.target.style.display = 'none';
  };

  const allStories = [
    ...myStories.map(story => ({ ...story, isMyStory: true })),
    ...stories.filter(story => 
      !myStories.some(myStory => myStory._id === story._id)
    ).map(story => ({ ...story, isMyStory: false }))
  ];

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

      {selectedStories && (
        <div className="story-viewer">
          <div className="story-content" style={{ 
            backgroundColor: selectedStories.stories[currentStoryIndex].backgroundColor || '#000',
            color: selectedStories.stories[currentStoryIndex].textColor || '#fff'
          }}>
            <div className="story-bars">
              {selectedStories.stories.map((_, index) => (
                <div 
                  key={index} 
                  className={`story-bar ${index === currentStoryIndex ? 'active' : ''}`}
                />
              ))}
            </div>
            <div className="story-click-area left" onClick={handlePreviousStory} />
            <div className="story-click-area right" onClick={handleNextStory} />
            {selectedStories.stories[currentStoryIndex].imageUrl && (
              <img 
                src={selectedStories.stories[currentStoryIndex].imageUrl} 
                alt="Story" 
                className="story-full-image" 
              />
            )}
            {selectedStories.stories[currentStoryIndex].caption && (
              <div className="story-caption">{selectedStories.stories[currentStoryIndex].caption}</div>
            )}
            <button 
              className="close-story-btn" 
              onClick={closeStoryViewer}
              aria-label="Close story viewer"
            >
              ×
            </button>
            {(() => {
              const currentStory = selectedStories.stories[currentStoryIndex];
              const storyUserId = currentStory.userid?._id || currentStory.userid;
              
              return storyUserId === currentUser && (
                <button
                  className="delete-story-btn"
                  onClick={(e) => {
                    e.stopPropagation(); 
                    e.preventDefault();
                    handleDeleteStory(currentStory._id);
                  }}
                  
                >
                  <FaTrash />
                </button>
              );
            })()}
          </div>
        </div>
      )}

      <div className="stories-list">
        <div 
          className="story-item my-story" 
          onClick={handleCreateStory}
          aria-label="Add a new story"
        >
          <div className="story-avatar create-new">
            <div className="add-icon"><FaPlus /></div>
          </div>
          <div className="story-username">Add Story</div>
        </div>

        {Object.values(storiesByUser)
          .filter(userStories => userStories.isCurrentUser && userStories.stories.length > 0)
          .map((userStories, index) => (
            <div 
              key={index}
              className="story-item"
              onClick={() => handleStoryClick(userStories)}
              aria-label="View your story"
            >
              <div className={`story-avatar ${userStories.stories.length > 1 ? 'multi-stories' : ''}`}>
                {currentUserProfile?.profilePicture ? (
                  <img 
                    src={currentUserProfile.profilePicture} 
                    alt="Your profile" 
                    className="profile-picture-avatar"
                    onError={(e) => handleImageError(e, 'you')}
                  />
                ) : (
                  <div className="avatar-initial">
                    {userStories.user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="story-username">
                {userStories.user?.name || 'Me'}
              </div>
            </div>
          ))}

        {Object.values(storiesByUser)
          .filter(userStories => !userStories.isCurrentUser)
          .map((userStories, index) => (
            <div 
              key={index}
              className="story-item"
              onClick={() => handleStoryClick(userStories)}
              aria-label={`View ${userStories.user?.name || 'user'}'s story`}
            >
              <div className={`story-avatar ${userStories.stories.length > 1 ? 'multi-stories' : ''}`}>
                {userStories.user?.profilePicture ? (
                  <img 
                    src={userStories.user.profilePicture} 
                    alt={`${userStories.user.name || 'User'}'s profile`} 
                    className="profile-picture-avatar"
                    onError={(e) => handleImageError(e, userStories.user?.name || 'user')}
                  />
                ) : (
                  <div className="avatar-initial">
                    {userStories.user?.name?.charAt(0) || 'U'}
                  </div>
                )}
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