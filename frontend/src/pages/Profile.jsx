import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard"; // Import PostCard component
import "./profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: ""
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchUserPosts();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/profile", {
        headers: { token }
      });
      setUser(res.data.user);
      setFormData({
        name: res.data.user.name || "",
        bio: res.data.user.bio || ""
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      alert("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/profile/posts", {
        headers: { token }
      });
      setUserPosts(res.data.posts || []);
    } catch (err) {
      console.error("Error fetching user posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setUser(prev => ({ ...prev, profilePicture: reader.result }));
        // Hide the fallback when image is loaded
        const fallback = document.getElementById('profile-fallback');
        if (fallback) fallback.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("Please enter your name");
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const data = new FormData();
      
      data.append("name", formData.name);
      data.append("bio", formData.bio);
      if (profilePicture) {
        data.append("profilePicture", profilePicture);
      }

      const res = await axios.put("http://localhost:3000/profile", data, {
        headers: { 
          token,
          "Content-Type": "multipart/form-data"
        }
      });

      setUser(res.data.user);
      setIsEditing(false);
      setProfilePicture(null);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!window.confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete("http://localhost:3000/profile/picture", {
        headers: { token }
      });

      setUser(res.data.user);
      // Show the fallback after removing picture
      const fallback = document.getElementById('profile-fallback');
      if (fallback) fallback.style.display = 'flex';
      alert("Profile picture removed successfully!");
    } catch (err) {
      console.error("Error removing profile picture:", err);
      alert("Failed to remove profile picture");
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: user.name || "",
      bio: user.bio || ""
    });
    setProfilePicture(null);
    setIsEditing(false);
  };

  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/posts/${postId}`, {
        headers: { token }
      });
      // Refresh the posts list after deletion
      fetchUserPosts();
      alert("Post deleted successfully!");
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post");
    }
  };

  // Get current user ID for PostCard component
  const getCurrentUserId = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }
    return null;
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <div className="loading">Loading profile...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
          <h1>Profile</h1>
          {!isEditing ? (
            <button 
              className="edit-profile-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="cancel-btn"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        <div className="profile-content">
          <div className="profile-picture-section">
            <div className="profile-picture-container">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  className="profile-picture"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = document.getElementById('profile-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              
              <div 
                id="profile-fallback"
                className={`profile-picture-fallback ${user.profilePicture ? 'hidden' : ''}`}
                style={{ display: user.profilePicture ? 'none' : 'flex' }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              
              {isEditing && (
                <div className="profile-picture-actions">
                  <label className="change-picture-btn">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="file-input"
                    />
                    Change Photo
                  </label>
                  {user.profilePicture && (
                    <button 
                      className="remove-picture-btn"
                      onClick={handleRemoveProfilePicture}
                      type="button"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="profile-info">
            {isEditing ? (
              <form className="profile-form">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    maxLength="50"
                  />
                  <span className="char-count">{formData.name.length}/50</span>
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows="4"
                    maxLength="150"
                    placeholder="Tell everyone about yourself..."
                  />
                  <span className="char-count">{formData.bio.length}/150</span>
                </div>
              </form>
            ) : (
              <div className="profile-display">
                <h2 className="profile-name">{user.name}</h2>
                {user.bio && <p className="profile-bio">{user.bio}</p>}
                {!user.bio && (
                  <p className="no-bio">No bio yet. Click Edit Profile to add one!</p>
                )}
                <div className="profile-stats">
                  <div className="stat">
                    <span className="stat-number">{userPosts.length}</span>
                    <span className="stat-label">Posts</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Followers</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Following</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* My Posts Section */}
        <div className="my-posts-section">
          <h3 className="my-posts-title">My Posts</h3>
          
          {postsLoading ? (
            <div className="loading-posts">Loading posts...</div>
          ) : userPosts.length === 0 ? (
            <div className="no-posts">
              <p>You haven't created any posts yet.</p>
              <p>Share your first post to see it here!</p>
            </div>
          ) : (
            <div className="posts-grid">
              {userPosts.map(post => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  onDelete={handleDeletePost}
                  currentUserId={getCurrentUserId()}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}