"use client";

import { SignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useClerk } from "@/contexts/ClerkContext";
import { useEffect } from "react";

const Login = () => {
  const { isSignedIn, isLoaded } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/trucker/dashboard");
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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