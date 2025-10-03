import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import login from "../assets/login.jpg";
import "./auth.css";
export default function Signin() {
  const [form, setForm] = useState({ email: "", password: "" });
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/signin", form);
      const token = res.data.token;
      localStorage.setItem("token", token);
      axios.defaults.headers.common["token"] = token; // set default header
      navigate("/feed");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Signin failed");
    }
  };

  return (
   
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-form-section">
        <h2>Sign In</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input placeholder="Email" onChange={e => setForm({...form, email:e.target.value})} />
          <input type="password" placeholder="Password" onChange={e => setForm({...form, password:e.target.value})} />
          <button type="submit">Sign In</button>
        </form>
        <p>No account? <Link to="/">Signup</Link></p>
      </div>
      <div className="auth-image-section">
        <img src={login} alt="Signin visual" />
        <h3>Welcome Back!</h3>
        <p>Continue your journey with our community.</p>
      </div>
    </div>
    </div>
  );
}
