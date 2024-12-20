import React, { useState } from "react";
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

  // Login function using Firestore
  const handleLogin = async () => {
    try {
      // Step 1: Query Firestore for the user with matching email and password
      const q = query(
        collection(db, "users"),
        where("email", "==", email),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);

      // Step 2: Validate query results
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        if (userData.status !== "Active") {
          setError("Your account is inactive. Please contact the administrator.");
          return;
        }

        // Step 3: Store user session in localStorage
        const { username, role, status } = userData;
        localStorage.setItem(
          "userSession",
          JSON.stringify({ email, username, role, status })
        );

        // Step 4: Navigate to dashboard
        navigate("/dashboard");
      } else {
        // No matching user found
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
          alt="Smocam Logo"
          className="login-logo"
        />
        <h1 className="welcome-heading">
          Welcome to <span className="smocam-highlight">Smocam</span>
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
