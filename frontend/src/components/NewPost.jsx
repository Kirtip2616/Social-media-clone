import React, { useState } from "react";
import axios from "axios";

export default function NewPost({ onPosted }) {
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/post", { caption, imageUrl });
      setCaption(""); setImageUrl("");
      if (onPosted) onPosted();
    } catch (err) {
      console.error(err);
      alert("Failed to create post");
    }
  };

  return (
    <form onSubmit={handlePost} className="card">
      <input placeholder="Caption" value={caption} onChange={e => setCaption(e.target.value)} />
      <input placeholder="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
      <button type="submit">Post</button>
    </form>
  );
}
