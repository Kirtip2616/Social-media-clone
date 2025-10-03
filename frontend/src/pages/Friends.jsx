import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./Friends.css";

export default function Friends() {
  const [activeTab, setActiveTab] = useState("discover");
  const [suggestions, setSuggestions] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingTabs, setLoadingTabs] = useState({
    discover: false,
    followers: false,
    following: false,
  });
  const [hasLoaded, setHasLoaded] = useState({
    discover: false,
    followers: false,
    following: false,
  });
  const [updatingUsers, setUpdatingUsers] = useState(new Set());

  useEffect(() => {
    if (activeTab === "discover") {
      fetchSuggestions();
    } else if (activeTab === "followers") {
      fetchFollowers();
    } else if (activeTab === "following") {
      fetchFollowing();
    }
  }, [activeTab]);

  const fetchSuggestions = async () => {
    // Only show loading if it's the first time loading this tab
    const showLoader = !hasLoaded.discover;
    if (showLoader) {
      setLoadingTabs(prev => ({ ...prev, discover: true }));
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/users/suggestions", {
        headers: { token }
      });

      const suggestionsWithStatus = await Promise.all(
        res.data.users.map(async (user) => {
          try {
            const statusRes = await axios.get(`http://localhost:3000/follow/status/${user._id}`, {
              headers: { token }
            });
            return { ...user, isFollowing: statusRes.data.isFollowing };
          } catch (error) {
            return { ...user, isFollowing: false };
          }
        })
      );

      setSuggestions(suggestionsWithStatus);
      setHasLoaded(prev => ({ ...prev, discover: true }));
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    } finally {
      setLoadingTabs(prev => ({ ...prev, discover: false }));
    }
  };

  const fetchFollowers = async () => {
    const showLoader = !hasLoaded.followers;
    if (showLoader) {
      setLoadingTabs(prev => ({ ...prev, followers: true }));
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/users/followers", {
        headers: { token }
      });
      
      const followersWithStatus = await Promise.all(
        res.data.followers.map(async (user) => {
          try {
            const statusRes = await axios.get(`http://localhost:3000/follow/status/${user._id}`, {
              headers: { token }
            });
            return { ...user, isFollowing: statusRes.data.isFollowing };
          } catch (error) {
            return { ...user, isFollowing: false };
          }
        })
      );
      
      setFollowers(followersWithStatus);
      setHasLoaded(prev => ({ ...prev, followers: true }));
    } catch (err) {
      console.error("Error fetching followers:", err);
    } finally {
      setLoadingTabs(prev => ({ ...prev, followers: false }));
    }
  };

  const fetchFollowing = async () => {
    const showLoader = !hasLoaded.following;
    if (showLoader) {
      setLoadingTabs(prev => ({ ...prev, following: true }));
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/users/following", {
        headers: { token }
      });
      
      const followingWithStatus = res.data.following.map(user => ({
        ...user,
        isFollowing: true,
        followersCount: user.followers ? user.followers.length : 0
      }));
      
      setFollowing(followingWithStatus);
      setHasLoaded(prev => ({ ...prev, following: true }));
    } catch (err) {
      console.error("Error fetching following:", err);
    } finally {
      setLoadingTabs(prev => ({ ...prev, following: false }));
    }
  };

  const handleFollow = async (userId) => {
    try {
      setUpdatingUsers(prev => new Set(prev).add(userId));
      
      const token = localStorage.getItem("token");
      const res = await axios.post(`http://localhost:3000/follow/${userId}`, {}, {
        headers: { token }
      });
      
      const action = res.data.action;
      const updatedTargetUser = res.data.targetUser;
      
      updateUserInAllLists(userId, updatedTargetUser, action === 'follow');
      
    } catch (err) {
      console.error("Error following user:", err);
      alert("Failed to follow user");
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const updateUserInAllLists = (userId, updatedUser, isNowFollowing) => {
    const updatedFollowersCount = updatedUser.followers ? updatedUser.followers.length : 0;
    
    setSuggestions(prev => prev.map(user => 
      user._id === userId 
        ? { 
            ...user, 
            isFollowing: isNowFollowing, 
            followers: updatedUser.followers,
            followersCount: updatedFollowersCount
          }
        : user
    ));
    
    setFollowers(prev => prev.map(user => 
      user._id === userId 
        ? { 
            ...user, 
            isFollowing: isNowFollowing, 
            followers: updatedUser.followers,
            followersCount: updatedFollowersCount
          }
        : user
    ));
    
    if (isNowFollowing) {
      setFollowing(prev => {
        const userExists = prev.some(user => user._id === userId);
        if (!userExists) {
          return [...prev, { 
            ...updatedUser, 
            isFollowing: true, 
            followersCount: updatedFollowersCount 
          }];
        }
        return prev.map(user => 
          user._id === userId 
            ? { 
                ...user, 
                isFollowing: true, 
                followers: updatedUser.followers,
                followersCount: updatedFollowersCount
              }
            : user
        );
      });
    } else {
      setFollowing(prev => prev.filter(user => user._id !== userId));
    }
  };

  return (
    <>
      <Navbar />
      <div className="friends-container">
        <h1>Friends</h1>
        
        <div className="friends-tabs">
          <button 
            className={`tab-btn ${activeTab === "discover" ? "active" : ""}`}
            onClick={() => setActiveTab("discover")}
          >
            Discover People
          </button>
          <button 
            className={`tab-btn ${activeTab === "followers" ? "active" : ""}`}
            onClick={() => setActiveTab("followers")}
          >
            Followers
          </button>
          <button 
            className={`tab-btn ${activeTab === "following" ? "active" : ""}`}
            onClick={() => setActiveTab("following")}
          >
            Following
          </button>
        </div>

        <div className="friends-content">
          {/* Discover Tab */}
          {activeTab === "discover" && (
            <div className="suggestions-list">
              <h3>People you may know</h3>
              
              {/* Show loading only on initial load when no data exists */}
              {loadingTabs.discover && suggestions.length === 0 && (
                <div className="full-page-loading">
                  <p>Loading suggestions...</p>
                </div>
              )}
              
              {/* Show content when not loading or when we have data */}
              {(!loadingTabs.discover || suggestions.length > 0) && (
                <>
                  {suggestions.map(user => (
                    <UserCard 
                      key={user._id} 
                      user={user} 
                      onFollow={handleFollow}
                      isUpdating={updatingUsers.has(user._id)}
                    />
                  ))}
                  
                  {suggestions.length === 0 && !loadingTabs.discover && (
                    <p className="no-users">No suggestions available</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Followers Tab */}
          {activeTab === "followers" && (
            <div className="followers-list">
              <h3>Your Followers ({followers.length})</h3>
              
              {loadingTabs.followers && followers.length === 0 && (
                <div className="full-page-loading">
                  <p>Loading followers...</p>
                </div>
              )}
              
              {(!loadingTabs.followers || followers.length > 0) && (
                <>
                  {followers.map(user => (
                    <UserCard 
                      key={user._id} 
                      user={user} 
                      onFollow={handleFollow}
                      isUpdating={updatingUsers.has(user._id)}
                      showFollowBack={!user.isFollowing}
                      isFollowing={user.isFollowing}
                    />
                  ))}
                  
                  {followers.length === 0 && !loadingTabs.followers && (
                    <p className="no-users">You don't have any followers yet</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Following Tab */}
          {activeTab === "following" && (
            <div className="following-list">
              <h3>People you follow ({following.length})</h3>
              
              {loadingTabs.following && following.length === 0 && (
                <div className="full-page-loading">
                  <p>Loading following...</p>
                </div>
              )}
              
              {(!loadingTabs.following || following.length > 0) && (
                <>
                  {following.map(user => (
                    <UserCard 
                      key={user._id} 
                      user={user} 
                      onFollow={handleFollow}
                      isUpdating={updatingUsers.has(user._id)}
                      isFollowing={true}
                    />
                  ))}
                  
                  {following.length === 0 && !loadingTabs.following && (
                    <p className="no-users">You're not following anyone yet</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// UserCard component remains the same as your original
function UserCard({ user, onFollow, isUpdating = false, showFollowBack = true, isFollowing = false }) {
  const [isCurrentlyFollowing, setIsCurrentlyFollowing] = useState(isFollowing);
  
  useEffect(() => {
    setIsCurrentlyFollowing(isFollowing);
  }, [isFollowing]);

  const getFollowersCount = () => {
    if (typeof user.followers === 'number') {
      return user.followers;
    } else if (Array.isArray(user.followers)) {
      return user.followers.length;
    } else if (user.followersCount) {
      return user.followersCount;
    }
    return 0;
  };

  const followersCount = getFollowersCount();

  const handleFollowClick = () => {
    setIsCurrentlyFollowing(!isCurrentlyFollowing);
    onFollow(user._id);
  };

  return (
    <div className={`user-card ${isUpdating ? 'updating' : ''}`}>
      <div className="user-info">
        <div className="user-avatar">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.name} />
          ) : (
            <span>{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
          )}
        </div>
        <div className="user-details">
          <h4>{user.name}</h4>
          {user.bio && <p className="user-bio">{user.bio}</p>}
          <p className="user-followers">{followersCount} followers</p>
        </div>
      </div>
      
      {(showFollowBack || !isCurrentlyFollowing) && (
        <button 
          className={`follow-btn ${isCurrentlyFollowing ? "following" : ""} ${isUpdating ? "updating" : ""}`}
          onClick={handleFollowClick}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <span className="loading-dots">...</span>
          ) : isCurrentlyFollowing ? (
            "Following"
          ) : (
            "Follow"
          )}
        </button>
      )}
      
      {isCurrentlyFollowing && !showFollowBack && (
        <span className="follows-you-badge">Follows you</span>
      )}
    </div>
  );
}