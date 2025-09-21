import React from "react";

export default function PostCard({ post }) {
  // `post.userid` might be populated object or a string id
  const username = post.userid?.name || post.userid || "Unknown";

  return (
    <div className="post-card">
      <div className="post-header"><strong>{username}</strong> <small>{new Date(post.createdAt).toLocaleString()}</small></div>
      {post.imageUrl && <img src={post.imageUrl} alt="post" className="post-image" />}
      <p>{post.caption}</p>
    </div>
  );
}
