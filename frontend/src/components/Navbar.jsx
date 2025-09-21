import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["token"];
    navigate("/signin");
  };

  return (
    <div className="navbar">
      <div className="logo">MiniInsta</div>
      <div>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
