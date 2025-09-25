import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { BrowserRouter } from 'react-router-dom';
// explicitly add .jsx if needed
import Signin from "./pages/Signin";
import Signup from "./pages/Signup"; 
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/signin" />;
}

export default function App() {
  return (
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
  );
}
