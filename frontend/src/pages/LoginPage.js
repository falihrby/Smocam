import React, { useState } from "react";
import "../styles/LoginPage.css";
import InputField from "../components/InputField";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "/dashboard";
        } catch (error) {
            setError("Invalid email or password.");
        }
    };

    const handleForgotPassword = async () => {
        if (email) {
            try {
                await sendPasswordResetEmail(auth, email);
                alert(`Password reset email sent to ${email}!`);
            } catch (error) {
                setError("Failed to send password reset email. Please try again.");
            }
        } else {
            setError("Please enter your email to reset the password.");
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
                <p className="welcome-subtext">Enter your username and password.</p>
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
                    iconColor="#000"
                />
                <button onClick={handleLogin} className="login-button">
                    Login
                </button>
                <p onClick={handleForgotPassword} className="forgot-password-link">
                    Forgot password?
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
