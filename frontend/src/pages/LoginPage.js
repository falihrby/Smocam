import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import InputField from "../components/InputField";
import "../styles/LoginPage.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Redirect logged-in users to the dashboard
  useEffect(() => {
    const userSession = localStorage.getItem("userSession");
    if (userSession) {
      navigate("/dashboard");
    }
  }, [navigate]);

  // Login function using Firestore
  const handleLogin = async () => {
    try {
      setError(""); // Reset error message

      // Query Firestore for matching email and password
      const q = query(
        collection(db, "users"),
        where("email", "==", email),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // Check if account is active
        if (userData.status !== "Active") {
          setError("Your account is inactive. Please contact the administrator.");
          return;
        }

        // Store session in localStorage
        const { id } = userDoc;
        const { username, role, status } = userData;

        localStorage.setItem(
          "userSession",
          JSON.stringify({ id, email, username, role, status })
        );

        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (err) {
      console.error("Error during login:", err.message);
      setError("An error occurred during login. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img
          src="/assets/image-login.png"
          alt="Login Illustration"
          className="login-image"
        />
      </div>
      <div className="login-right">
        <img
          src="/assets/logo_fst.png"
          alt="SmoCam Logo"
          className="login-logo"
        />
        <h1 className="welcome-heading">
          Welcome to <span className="smocam-highlight">SmoCam</span>
        </h1>
        <p className="welcome-subtext">Enter your email and password to continue.</p>
        {error && <p className="error">{error}</p>}
        <InputField
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          label="Email"
          icon="/icon/user-icon.svg"
        />
        <InputField
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          label="Password"
          icon="/icon/eye-icon.svg"
          toggleIcon="/icon/closeeye-icon.svg"
          iconColor="gray"
        />
        <button onClick={handleLogin} className="login-button">
          Login
        </button>
        <p
          onClick={() => alert("Password reset functionality is not implemented yet.")}
          className="forgot-password-link"
        >
          Forgot password?
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
