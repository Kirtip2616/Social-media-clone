import React, { useState, useRef } from "react";
import axios from "axios";
import "./story-creation.css";

export default function StoryCreation({ onStoryCreated, onClose }) {
  const [caption, setCaption] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#0095f6");
  const [textColor, setTextColor] = useState("#ffffff");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [storyType, setStoryType] = useState("text"); // 'text' or 'image'
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImageFile(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateStory = async (e) => {
    e.preventDefault();
    
    if (storyType === "text" && !caption.trim()) {
      alert("Please add a caption for your story!");
      return;
    }
    
    if (storyType === "image" && !imageFile) {
      alert("Please select an image for your story!");
      return;
    }

    try {
      setIsUploading(true);
      
      const formData = new FormData();
      if (imageFile) {
        formData.append("image", imageFile);
      }
      formData.append("caption", caption);
      formData.append("backgroundColor", backgroundColor);
      formData.append("textColor", textColor);

      await axios.post("http://localhost:3000/story", formData, {
         headers: { 
         token: localStorage.getItem("token"),   // 🔑 add token here
        "Content-Type": "multipart/form-data"
  }
      });

      // Reset form
      setCaption("");
      setBackgroundColor("#0095f6");
      setTextColor("#ffffff");
      setImageFile(null);
      setImagePreview(null);
      
      if (onStoryCreated) onStoryCreated();
      if (onClose) onClose();
      
      alert("Story created successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to create story");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="story-creation-modal">
      <div className="story-creation-content">
        <div className="story-creation-header">
          <h2>Create Story</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="story-type-selector">
          <button 
            type="button"
            className={`type-btn ${storyType === "text" ? "active" : ""}`}
            onClick={() => setStoryType("text")}
          >
            Text Story
          </button>
          <button 
            type="button"
            className={`type-btn ${storyType === "image" ? "active" : ""}`}
            onClick={() => setStoryType("image")}
          >
            Image Story
          </button>
        </div>

        <form onSubmit={handleCreateStory} className="story-form">
          {storyType === "text" && (
            <div className="text-story-options">
              <textarea 
                placeholder="What's happening?" 
                value={caption} 
                onChange={e => setCaption(e.target.value)}
                rows="3"
                className="story-caption-input"
                maxLength="100"
              />
              <div className="color-pickers">
                <div className="color-picker">
                  <label>Background Color:</label>
                  <input 
                    type="color" 
                    value={backgroundColor}
                    onChange={e => setBackgroundColor(e.target.value)}
                  />
                </div>
                <div className="color-picker">
                  <label>Text Color:</label>
                  <input 
                    type="color" 
                    value={textColor}
                    onChange={e => setTextColor(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="story-preview" style={{ backgroundColor, color: textColor }}>
                {caption || "Your story preview..."}
              </div>
            </div>
          )}

          {storyType === "image" && (
            <div className="image-story-options">
              <button 
                type="button" 
                onClick={triggerFileInput}
                className="upload-image-btn"
              >
                📷 Choose Image
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                className="file-input"
              />
              
              {imagePreview && (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Story preview" className="story-image-preview" />
                  <button type="button" onClick={clearImage} className="remove-image-btn">
                    ×
                  </button>
                </div>
              )}
              
              <textarea 
                placeholder="Add a caption (optional)" 
                value={caption} 
                onChange={e => setCaption(e.target.value)}
                rows="2"
                className="story-caption-input"
                maxLength="100"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={isUploading}
            className="create-story-btn"
          >
            {isUploading ? "Creating..." : "Add to Story"}
          </button>
        </form>
      </div>
    </div>
  );
}