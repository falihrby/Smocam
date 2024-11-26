import React, { useState } from "react";
import "../styles/LoginPage.css";
import InputField from "../components/InputField";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = () => {
        if (email === "test@example.com" && password === "password") {
            alert("Login successful!");
            window.location.href = "/dashboard";
        } else {
            setError("Email atau password tidak valid.");
        }
    };

    const handleForgotPassword = () => {
        if (email) {
            alert(`Password reset email sent to ${email}!`);
        } else {
            setError("Silakan masukkan email Anda untuk mereset password.");
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
                    Selamat Datang di <span className="smocam-highlight">Smocam</span>
                </h1>
                <p className="welcome-subtext">Masukkan username dan password Anda.</p>
                {error && <p className="error">{error}</p>}
                <InputField
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    label="Email"
                    icon="/icon/user-icon.svg" /* Path to email icon */
                />
                <InputField
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    label="Password"
                    icon="/icon/eye-icon.svg" /* Icon for hidden password */
                    toggleIcon="/icon/closeeye-icon.svg" /* Icon for visible password */
                    iconColor="#000"
                />
                <button onClick={handleLogin} className="login-button">
                    Masuk
                </button>
                <p onClick={handleForgotPassword} className="forgot-password-link">
                    Lupa password?
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
