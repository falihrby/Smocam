import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";

function AuthGuard({ children }) {
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate("/login"); // Redirect to login if not authenticated
            }
        });

        return () => unsubscribe(); // Cleanup subscription on component unmount
    }, [navigate]);

    return <>{children}</>;
}

export default AuthGuard;
