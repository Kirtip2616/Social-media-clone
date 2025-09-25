import React, { useState, useRef } from "react";
import axios from "axios";
import "./new-post.css";

export default function NewPost({ onPosted }) {
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedRatio, setSelectedRatio] = useState("square"); // square or portrait
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!caption.trim() && !imageFile) {
      alert("Please add a caption or an image to post something!");
      return;
    }
    
    try {
      setIsUploading(true);
      let imageUrl = "";
      
      // Upload image if exists
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("ratio", selectedRatio); // Send ratio to backend
        
        const uploadRes = await axios.post("http://localhost:3000/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        imageUrl = uploadRes.data.imageUrl;
      }
      
      // Create post
      await axios.post("http://localhost:3000/post", { caption, imageUrl });
      
      // Reset form
      setCaption("");
      setImageFile(null);
      setImagePreview(null);
      setSelectedRatio("square");
      
      if (onPosted) onPosted();
    } catch (err) {
      console.error(err);
      alert("Failed to create post");
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setSelectedRatio("square");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handlePost} className="new-post-form">
      <h2>Create New Post</h2>
      
      <textarea 
        placeholder="What's on your mind?" 
        value={caption} 
        onChange={e => setCaption(e.target.value)}
        rows="3"
        className="post-caption-input"
      />
      
      <div className="file-upload-section">
        <button 
          type="button" 
          onClick={triggerFileInput}
          className="file-upload-btn"
          disabled={isUploading}
        >
          Choose File
        </button>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          onChange={handleFileUpload} 
          disabled={isUploading}
          className="file-input"
        />
        {isUploading && <p className="uploading-text">Uploading...</p>}
      </div>
      
      {imagePreview && (
        <div className="image-preview-section">
          <div className="ratio-selector">
            <label>Select Image Ratio:</label>
            <div className="ratio-options">
              <button 
                type="button"
                className={`ratio-btn ${selectedRatio === "square" ? "active" : ""}`}
                onClick={() => setSelectedRatio("square")}
              >
                Square (1:1)
              </button>
              <button 
                type="button"
                className={`ratio-btn ${selectedRatio === "portrait" ? "active" : ""}`}
                onClick={() => setSelectedRatio("portrait")}
              >
                Portrait (4:5)
              </button>
            </div>
          </div>
          
          <div className="image-preview-container">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className={`image-preview ${selectedRatio}`}
            />
            <button type="button" onClick={clearImage} className="remove-image-btn">
              ×
            </button>
          </div>
          
          <div className="ratio-preview-note">
            {selectedRatio === "square" 
              ? "Your image will be cropped to a square" 
              : "Your image will be cropped to portrait ratio"
            }
          </div>
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={isUploading}
        className="submit-post-btn"
      >
        {isUploading ? "Posting..." : "Share Post"}
      </button>
    </form>
  );
}