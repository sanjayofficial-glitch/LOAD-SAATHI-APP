"use client";

import { SignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.Clerk?.user) {
      navigate("/trucker/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <SignIn
        routing="path"
        path="/login"
        signUpFallbackRedirectUrl="/register"
        signInFallbackRedirectUrl="/trucker/dashboard"
        afterSignInUrl="/trucker/dashboard"
        afterSignUpUrl="/register"
      />
    </div>
  );
};

export default Login;