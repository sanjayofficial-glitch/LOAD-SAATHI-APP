"use client";

import { SignIn } from "@clerk/clerk-react";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <SignIn
        routing="path"
        path="/login"
        fallbackRedirectUrl="/trucker/dashboard"
        afterSignInUrl="/trucker/dashboard"
        signUpFallbackRedirectUrl="/register"
      />
    </div>
  );
};

export default Login;