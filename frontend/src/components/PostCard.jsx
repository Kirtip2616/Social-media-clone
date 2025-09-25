import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaHeart, FaRegHeart, FaTrash, FaEllipsisH } from "react-icons/fa";
import { BsChatDots } from "react-icons/bs";
import { IoShareSocialOutline } from "react-icons/io5";
import "./post-card.css";

export default function PostCard({ post, onDelete, currentUserId }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCheckingFollow, setIsCheckingFollow] = useState(true);
  
  const username = post.userid?.name || "Unknown User";
  const postUserId = post.userid?._id || post.userid;
  const isCurrentUserPost = postUserId === currentUserId;

  const handleLike = () => {
    if (liked) {
      setLikesCount(likesCount - 1);
    } else {
      setLikesCount(likesCount + 1);
    }
    setLiked(!liked);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      setComments([...comments, { text: comment, user: "You" }]);
      setComment("");
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      onDelete(post._id);
    }
    setShowOptions(false);
  };

  // Check follow status when component mounts
  useEffect(() => {
    if (!isCurrentUserPost && postUserId) {
      checkFollowStatus();
    } else {
      setIsCheckingFollow(false);
    }
  }, [postUserId, isCurrentUserPost]);

  const checkFollowStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsCheckingFollow(false);
        return;
      }
      
      const res = await axios.get(`http://localhost:3000/follow/status/${postUserId}`, {
        headers: { token }
      });
      setIsFollowing(res.data.isFollowing);
    } catch (err) {
      console.error("Error checking follow status:", err);
      setIsFollowing(false);
    } finally {
      setIsCheckingFollow(false);
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
      alert("Error following user");
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-user">
          <div className="user-avatar"></div>
          <strong>{username}</strong>
          
          {/* Fixed follow button logic */}
          {!isCurrentUserPost && !isCheckingFollow && (
            <button 
              className={`follow-btn-small ${isFollowing ? "following" : ""}`}
              onClick={handleFollow}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
          
          <small>{new Date(post.createdAt).toLocaleString()}</small>
        </div>
        
        <div className="post-options">
          <button 
            className="options-btn"
            onClick={() => setShowOptions(!showOptions)}
          >
            <FaEllipsisH />
          </button>
          
          {showOptions && isCurrentUserPost && (
            <div className="options-menu">
              <button onClick={handleDelete} className="delete-btn">
                <FaTrash /> Delete
              </button>
            </div>
          )}
        </div>
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
        >
          {liked ? <FaHeart className="action-icon" /> : <FaRegHeart className="action-icon" />}
          <span>Like</span>
        </button>
        
        <button 
          className="action-btn" 
          onClick={() => setShowComments(!showComments)}
        >
          <BsChatDots className="action-icon" />
          <span>Comment</span>
        </button>
        
        <button className="action-btn">
          <IoShareSocialOutline className="action-icon" />
          <span>Share</span>
        </button>
      </div>
      
      <div className="post-stats">
        {likesCount > 0 && (
          <div className="likes-count">
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </div>
        )}
        
        {comments.length > 0 && !showComments && (
          <div 
            className="comments-preview"
            onClick={() => setShowComments(true)}
          >
            View {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </div>
        )}
      </div>
      
      {post.caption && (
        <p className="post-caption">
          <strong>{username}</strong> {post.caption}
        </p>
      )}
      
      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {comments.map((c, index) => (
              <div key={index} className="comment">
                <strong>{c.user}</strong> {c.text}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <input 
              type="text" 
              placeholder="Add a comment..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="comment-input"
            />
            <button type="submit" disabled={!comment.trim()} className="comment-submit">
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}