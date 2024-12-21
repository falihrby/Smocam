import React, { useState } from "react";
import "../styles/InputField.css";

function InputField({ 
    type, 
    placeholder, 
    value, 
    onChange, 
    label, 
    icon, 
    toggleIcon, 
    iconColor 
}) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleToggleVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    // Determine the correct input type (text/password) and which icon to display
    const inputType = type === "password" && isPasswordVisible ? "text" : type;
    const iconToShow = type === "password" ? (isPasswordVisible ? toggleIcon : icon) : icon;

    return (
        <div className="input-field">
            {label && <label className="input-label">{label}</label>}
            <div className="input-wrapper">
                <input
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="input"
                />
                {icon && (
                    <img
                        src={iconToShow}
                        alt="toggle visibility"
                        className="input-icon"
                        style={{ fill: iconColor }}
                        onClick={type === "password" ? handleToggleVisibility : undefined}
                        role="button"
                        aria-hidden="true"
                    />
                )}
            </div>
        </div>
    );
}

export default InputField;
