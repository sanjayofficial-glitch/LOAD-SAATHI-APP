"use client";

import { SignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Register = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already signed in
    if (window.Clerk?.user) {
      navigate("/trucker/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <SignUp
        routing="path"
        path="/register"
        signInFallbackRedirectUrl="/login"
        afterSignUpUrl="/register"
        afterSignInUrl="/trucker/dashboard"
      />
    </div>
  );
};

export default Register;