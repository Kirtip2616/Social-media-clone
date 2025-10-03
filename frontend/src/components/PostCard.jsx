import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaHeart, FaRegHeart, FaTrash, FaEllipsisH, FaPaperPlane, FaEdit } from "react-icons/fa";
import { BsChatDots } from "react-icons/bs";
import { IoShareSocialOutline } from "react-icons/io5";
import "./post-card.css";

export default function PostCard({ post, onDelete, currentUserId, onEdit }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likesList, setLikesList] = useState([]);
  const [userCache, setUserCache] = useState({}); // Cache for user data
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || "");
  
  const username = post.userid?.name || "User";
  const profilePicture = post.userid?.profilePicture;
  const postUserId = post.userid?._id || post.userid;
  const isCurrentUserPost = postUserId === currentUserId;

  // Function to fetch user data by ID
  const fetchUserData = async (userId) => {
    if (userCache[userId]) {
      return userCache[userId];
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:3000/users/${userId}`, {
        headers: { token }
      });
      
      const userData = response.data.user;
      setUserCache(prev => ({ ...prev, [userId]: userData }));
      return userData;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return { name: "Unknown User" };
    }
  };

  // Function to process comments and ensure they have user data
  const processComments = async (commentsArray) => {
    const processedComments = await Promise.all(
      commentsArray.map(async (comment) => {
        // If comment already has populated user data, use it
        if (comment.userid && typeof comment.userid === 'object' && comment.userid.name) {
          return comment;
        }
        
        // If comment has user ID string, fetch user data
        if (typeof comment.userid === 'string') {
          const userData = await fetchUserData(comment.userid);
          return {
            ...comment,
            userid: userData
          };
        }
        
        // Fallback
        return {
          ...comment,
          userid: { name: "Unknown User" }
        };
      })
    );
    
    return processedComments;
  };

  useEffect(() => {
    if (post.likes && currentUserId) {
      const userLiked = post.likes.some(like => 
        like._id === currentUserId || like === currentUserId
      );
      setLiked(userLiked);
      setLikesCount(post.likes.length || 0);
    }

    // Process comments when post data changes
    if (post.comments && Array.isArray(post.comments)) {
      processComments(post.comments).then(setComments);
    }
  }, [post, currentUserId]);

  const handleLike = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(`http://localhost:3000/posts/${post._id}/like`, {}, {
        headers: { token }
      });
      setLiked(!liked);
      setLikesCount(res.data.likesCount);
    } catch (err) {
      console.error("Error liking post:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:3000/posts/${post._id}/comment`,
        { text: comment },
        { headers: { token } }
      );

      console.log("New comment response:", res.data);
      
      // Process the new comment to ensure it has user data
      const newComment = await processComments([res.data.comment]);
      setComments(prev => [...prev, ...newComment]);
      setComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      onDelete(post._id);
    }
    setShowOptions(false);
  };

  const fetchLikesList = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:3000/posts/${post._id}/likes`, {
        headers: { token }
      });
      setLikesList(res.data.likes);
      setShowLikesModal(true);
    } catch (err) {
      console.error("Error fetching likes:", err);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const checkFollowStatus = async () => {
    if (isCurrentUserPost || !postUserId) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const res = await axios.get(`http://localhost:3000/follow/status/${postUserId}`, {
        headers: { token }
      });
      setIsFollowing(res.data.isFollowing);
    } catch (err) {
      console.error("Error checking follow status:", err);
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to follow users");
        return;
      }
      
      await axios.post(`http://localhost:3000/follow/${postUserId}`, {}, {
        headers: { token }
      });
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("Error following user:", err);
    }
  };

  useEffect(() => {
    checkFollowStatus();
  }, [postUserId, isCurrentUserPost]);

  // Function to get comment display name
  const getCommentDisplayName = (comment) => {
    const commentUserId = comment.userid?._id || comment.userid;
    
    // If it's the current user's comment
    if (commentUserId === currentUserId) {
      return "You";
    }
    
    // If we have user data with name
    if (comment.userid && comment.userid.name) {
      return comment.userid.name;
    }
    
    return "Unknown User";
  };

  const handleEditPost = async () => {
  if (!editCaption.trim()) {
    alert("Caption cannot be empty");
    return;
  }

  try {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const res = await axios.put(
      `http://localhost:3000/posts/${post._id}`,
      { caption: editCaption.trim() },
      { headers: { token } }
    );
    
    // Update the post in parent component if needed
    if (onEdit) {
      onEdit(post._id, editCaption.trim());
    }
    
    setIsEditing(false);
    alert("Post updated successfully!");
  } catch (err) {
    console.error("Error editing post:", err);
    alert("Failed to update post");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="post-card">
      {/* Likes Modal */}
      {showLikesModal && (
        <div className="modal-overlay" onClick={() => setShowLikesModal(false)}>
          <div className="modal-content likes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Likes</h3>
              <button className="close-modal" onClick={() => setShowLikesModal(false)}>×</button>
            </div>
            <div className="likes-list">
              {likesList.length === 0 ? (
                <p className="no-likes">No likes yet</p>
              ) : (
                likesList.map(user => (
                  <div key={user._id} className="like-user">
                    <div className="user-avatar-small">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.name} />
                      ) : (
                        <span>{user.name?.charAt(0) || "U"}</span>
                      )}
                    </div>
                    <span className="username">{user.name || "Unknown User"}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="post-header">
        <div className="post-user">
          <div className="user-avatar">
            {profilePicture ? (
              <img src={profilePicture} alt={username} />
            ) : (
              <span>{username.charAt(0)}</span>
            )}
          </div>
          <div className="user-info">
            <strong>{username}</strong>
            {!isCurrentUserPost && postUserId && (
              <button 
                className={`follow-btn-small ${isFollowing ? 'following' : ''}`}
                onClick={handleFollow}
                disabled={isLoading}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>
        
        {isCurrentUserPost && (
          <div className="post-options">
            <button 
              className="options-btn"
              onClick={() => setShowOptions(!showOptions)}
            >
              <FaEllipsisH />
            </button>
            
            {showOptions && isCurrentUserPost &&(
              <div className="options-menu">
                <button onClick={() => { setIsEditing(true); setShowOptions(false); }} className="edit-btn">
                  <FaEdit /> Edit
                </button>
                <button onClick={handleDelete} className="delete-btn">
                  <FaTrash /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {post.imageUrl && (
        <div className="post-image-container">
          <img src={post.imageUrl} alt="post" className="post-image" />
        </div>
      )}
      
      <div className="post-actions">
        <button 
          className={`action-btn ${liked ? 'liked' : ''}`} 
          onClick={handleLike}
          disabled={isLoading}
        >
          {liked ? <FaHeart className="action-icon" /> : <FaRegHeart className="action-icon" />}
        </button>
        
        <button 
          className="action-btn" 
          onClick={() => setShowComments(!showComments)}
        >
          <BsChatDots className="action-icon" />
        </button>
        
        <button className="action-btn">
          <IoShareSocialOutline className="action-icon" />
        </button>
      </div>
      
      <div className="post-stats">
        {likesCount > 0 && (
          <div className="likes-count" onClick={fetchLikesList}>
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </div>
        )}
    
      {isEditing ? (
        <div className="edit-caption-section">
          <textarea
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            className="edit-caption-input"
            placeholder="Edit your caption..."
            rows="3"
            maxLength="2200"
          />
          <div className="edit-actions">
            <button 
              onClick={() => { setIsEditing(false); setEditCaption(post.caption || ""); }}
              className="cancel-edit-btn"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              onClick={handleEditPost}
              className="save-edit-btn"
              disabled={isLoading || !editCaption.trim()}
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        post.caption && (
          <p className="post-caption">
            <strong>{username}</strong> {post.caption}
          </p>
        )
      )}
      
        {comments.length > 0 && !showComments && (
          <div 
            className="comments-preview"
            onClick={() => setShowComments(true)}
          >
            View all {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </div>
        )}
        
        <div className="post-time">
          {formatTime(post.createdAt)}
        </div>
      </div>
      
    
      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {comments.map((comment, index) => (
              <div key={index} className="comment">
                <div className="comment-avatar">
                  {comment.userid?.profilePicture ? (
                    <img src={comment.userid.profilePicture} alt={getCommentDisplayName(comment)} />
                  ) : (
                    <span>{getCommentDisplayName(comment).charAt(0)}</span>
                  )}
                </div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-username">
                      {getCommentDisplayName(comment)}
                    </span>
                  </div>
                  <div className="comment-text">{comment.text}</div>
                  <div className="comment-time">
                    {formatTime(comment.createdAt)}
                  </div>
                </div>
              </div>
            ))}
            
            {comments.length === 0 && (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            )}
          </div>
          
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <input 
              type="text" 
              placeholder="Add a comment..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="comment-input"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={!comment.trim() || isLoading}
              className="comment-submit"
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}