// File: components/AuthGuard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = localStorage.getItem("userSession");
      if (!session) {
        navigate("/login");
        return;
      }

      const { email, password } = JSON.parse(session);

      try {
        const q = query(
          collection(db, "users"),
          where("email", "==", email),
          where("password", "==", password) // Use hashed password in production
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          if (userData.role === "admin") {
            setAuthenticated(true);
          } else {
            navigate("/unauthorized");
          }
        } else {
          localStorage.removeItem("userSession");
          navigate("/login");
        }
      } catch (error) {
        console.error("Error during authentication:", error);
        navigate("/login");
      }
    };

    checkSession();
  }, [navigate]);

  if (!authenticated) return null; // Prevent rendering until authentication is verified
  return <>{children}</>;
};

export default AuthGuard;
