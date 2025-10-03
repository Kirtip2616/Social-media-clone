import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import NewPost from "../components/NewPost";
import PostCard from "../components/PostCard";
import Stories from "../components/Stories";
import "./feed.css";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Get current user ID from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Simple decode without verification for demo purposes
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id);
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }

    // Listen for the custom event from navbar
    const handleShowNewPost = () => {
      setShowNewPostForm(true);
    };

    window.addEventListener('showNewPost', handleShowNewPost);
    
    return () => {
      window.removeEventListener('showNewPost', handleShowNewPost);
    };
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get("http://localhost:3000/posts");
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch posts");
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`http://localhost:3000/posts/${postId}`, {
        headers: { token: localStorage.getItem("token") }
      });
      fetchPosts(); // Refresh the posts list
    } catch (err) {
      console.error(err);
      alert("Failed to delete post");
    }
  };

  useEffect(() => { 
    fetchPosts(); 
  }, []);

  const handlePostCreated = () => {
    fetchPosts();
    setShowNewPostForm(false);
  };

  const closeNewPostForm = () => {
    setShowNewPostForm(false);
  };

  const handleEditPostFromFeed = (postId, newCaption) => {
  setPosts(prevPosts =>
    prevPosts.map(p =>
      p._id === postId ? { ...p, caption: newCaption } : p
    )
  );
};


  return (
    <div className="feed-layout">
      <Navbar />
      
      <div className="feed-content">
        {/* Stories Section */}
        <Stories />
        
       
        
        {/* Posts Feed */}
        <div className="posts-container">
          <h2>Feed</h2>
          
          {posts.length === 0 ? (
            <div className="no-posts">
              <p>No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map(p => (
              <PostCard 
                key={p._id} 
                post={p} 
                onDelete={handleDeletePost}
                onEdit={handleEditPostFromFeed}
                currentUserId={currentUserId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}