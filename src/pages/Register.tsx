"use client";

import { SignUp } from "@clerk/clerk-react";

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full bg-white p-6 rounded-xl shadow-lg">
        <SignUp          routing="path"
          path="/register"
          signInFallbackRedirectUrl="/login"
          afterSignUpUrl="/choose-role"
        />
      </div>
    </div>
  );
};

export default Register;