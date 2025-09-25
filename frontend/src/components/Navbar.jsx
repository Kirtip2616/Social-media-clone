import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./navbar.css";

// Importing icons
import { FaHome } from "react-icons/fa";
import { MdChatBubbleOutline } from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import { FaSignOutAlt } from "react-icons/fa";

import logo from "../assets/logo.png";

export default function Navbar() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("feed");
  
  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["token"];
    navigate("/signin");
  };
  
  const showNewPostForm = () => {
    const event = new CustomEvent('showNewPost');
    window.dispatchEvent(event);
  };
  
  const handleNavItemClick = (itemName, path) => {
    setActiveItem(itemName);
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className="navbar-left">
      <div className="navbar-brand">
        <img src={logo} alt="Globally Logo" className="logo-image" />
        <div className="logo-text">Globally</div>
      </div>
      
      <div className="nav-links">
        {/* Feed Item - ADD NAVIGATION HERE */}
        <div 
          className={`nav-item ${activeItem === "feed" ? "active" : ""}`}
          onClick={() => handleNavItemClick("feed", "/feed")}
        >
          <FaHome className="nav-icon"/>
          <span className="nav-text">Feed</span>
        </div>
        
        {/* Messages Item */}
        <div 
          className={`nav-item ${activeItem === "messages" ? "active" : ""}`}
          onClick={() => handleNavItemClick("messages")}
        >
          <MdChatBubbleOutline className="nav-icon" />
          <span className="nav-text">Messages</span>
        </div>

        {/* Friends Item */}
        <div 
          className={`nav-item ${activeItem === "friends" ? "active" : ""}`}
          onClick={() => handleNavItemClick("friends", "/friends")}
        >
          <FiUsers className="nav-icon" />
          <span className="nav-text">Friends</span>
        </div>
        {/* Profile Item */}
        <div 
          className={`nav-item ${activeItem === "profile" ? "active" : ""}`}
          onClick={() => handleNavItemClick("profile", "/profile")}
        >
          <FaUserCircle className="nav-icon" />
          <span className="nav-text">Profile</span>
        </div>
        
        <button className="new-post-btn" onClick={showNewPostForm}>
          <FaPlus /> Create New Post
        </button>
      </div>
      
      <div className="nav-footer">
        <button className="logout-btn" onClick={logout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </div>
  );
}