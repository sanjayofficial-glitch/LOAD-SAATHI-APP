"use client";

import { SignUp } from "@clerk/clerk-react";

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <SignUp
        routing="path"
        path="/register"
        signInFallbackRedirectUrl="/login"
        afterSignUpUrl="/choose-role"
      />
    </div>
  );
};

export default Register;