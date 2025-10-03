import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
// explicitly add .jsx if needed
import Signin from "./pages/Signin";
import Signup from "./pages/Signup"; 
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import NewPost from "./components/NewPost";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/signin" />;
}

export default function App() {
  const [showNewPost, setShowNewPost] = useState(false);

  useEffect(() => {
    const handleShowNewPost = () => {
      setShowNewPost(true);
    };

    // Listen for the event from ANY component
    window.addEventListener('showNewPost', handleShowNewPost);
    
    return () => {
      window.removeEventListener('showNewPost', handleShowNewPost);
    };
  }, []);

   const handleCloseModal = () => {
    setShowNewPost(false);
  };

  const handlePostCreated = () => {
    setShowNewPost(false);
    window.location.reload(); // or your preferred refresh method
  };
  
  return (
    <>
      <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/feed" element={
            <PrivateRoute>
              <Feed />
            </PrivateRoute>
          } />
          <Route path="/profile" element={<Profile />} />
          <Route path="/friends" element={<Friends />} />
      </Routes>
      {showNewPost && (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <button 
          className="close-modal" 
          onClick={() => setShowNewPost(false)}
        >
          ×
        </button>
      </div>
      <NewPost 
        onPosted={() => {
          setShowNewPost(false);
          window.location.reload();
        }}
      />
    </div>
  </div>
)}
    </>  
    
  );
}
