import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import NewPost from "../components/NewPost";
import PostCard from "../components/PostCard";

export default function Feed() {
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    try {
      const res = await axios.get("http://localhost:3000/posts");
      // backend returns { posts: [...] }
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch posts");
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Feed</h2>
        <NewPost onPosted={fetchPosts} />
        <div style={{ marginTop: 20 }}>
          {posts.length === 0 ? <p>No posts yet</p> :
            posts.map(p => <PostCard key={p._id} post={p} />)
          }
        </div>
      </div>
    </>
  );
}
