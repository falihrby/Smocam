// File: src/components/AuthGuard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) {
      navigate("/login"); 
    } else {
      setIsAuthenticated(true); 
    }
  }, [navigate]);

  if (!isAuthenticated) return null; 
  return <>{children}</>;
};

export default AuthGuard;
