import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./Friends.css";

export default function Friends() {
  const [activeTab, setActiveTab] = useState("discover"); // discover, followers, following
  const [suggestions, setSuggestions] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);

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
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/users/suggestions", {
        headers: { token }
      });
      setSuggestions(res.data.users || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/users/followers", {
        headers: { token }
      });
      setFollowers(res.data.followers || []);
    } catch (err) {
      console.error("Error fetching followers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/users/following", {
        headers: { token }
      });
      setFollowing(res.data.following || []);
    } catch (err) {
      console.error("Error fetching following:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:3000/follow/${userId}`, {}, {
        headers: { token }
      });
      
      // Refresh the lists
      if (activeTab === "discover") {
        fetchSuggestions();
      } else if (activeTab === "following") {
        fetchFollowing();
      }
    } catch (err) {
      console.error("Error following user:", err);
      alert("Failed to follow user");
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
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              {activeTab === "discover" && (
                <div className="suggestions-list">
                  <h3>People you may know</h3>
                  {suggestions.length === 0 ? (
                    <p className="no-users">No suggestions available</p>
                  ) : (
                    suggestions.map(user => (
                      <UserCard 
                        key={user._id} 
                        user={user} 
                        onFollow={handleFollow}
                        showFollowButton={true}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === "followers" && (
                <div className="followers-list">
                  <h3>Your Followers</h3>
                  {followers.length === 0 ? (
                    <p className="no-users">You don't have any followers yet</p>
                  ) : (
                    followers.map(user => (
                      <UserCard 
                        key={user._id} 
                        user={user} 
                        onFollow={handleFollow}
                        showFollowButton={false}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === "following" && (
                <div className="following-list">
                  <h3>People you follow</h3>
                  {following.length === 0 ? (
                    <p className="no-users">You're not following anyone yet</p>
                  ) : (
                    following.map(user => (
                      <UserCard 
                        key={user._id} 
                        user={user} 
                        onFollow={handleFollow}
                        showFollowButton={true}
                        isFollowing={true}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// UserCard component
function UserCard({ user, onFollow, showFollowButton, isFollowing = false }) {
  return (
    <div className="user-card">
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
          <p className="user-followers">{user.followers?.length || 0} followers</p>
        </div>
      </div>
      
      {showFollowButton && (
        <button 
          className={`follow-btn ${isFollowing ? "following" : ""}`}
          onClick={() => onFollow(user._id)}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}