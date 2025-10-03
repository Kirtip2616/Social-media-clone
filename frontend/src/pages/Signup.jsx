import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import signup from "../assets/signup.jpg";
import "./auth.css";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/signup", form);
      alert("Signup successful — please signin");
      navigate("/signin");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="auth-page">
       <div className="auth-container">
          <div className="auth-form-section">
        <h2>Create Your Account</h2>
        <h2>Signup</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input placeholder="Name" onChange={e => setForm({...form, name:e.target.value})} />
          <input placeholder="Email" onChange={e => setForm({...form, email:e.target.value})} />
          <input type="password" placeholder="Password" onChange={e => setForm({...form, password:e.target.value})} />
          <button type="submit">Signup</button>
        </form>
      <p>Already have account? <Link to="/signin">Signin</Link></p>
      </div>
      <div className="auth-image-section">
        <img src={signup} alt="Signup visual" />
        <h3>Join our community </h3>
        <p>Connect with friends and share your journey.</p>
      </div>
    </div>
    </div>
  );
}
