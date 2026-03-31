"use client";

import { useSearchParams, Navigate, Link } from "react-router-dom";
import { SignUp } from "@clerk/clerk-react";
import { Truck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import React, { useState, useEffect } from "react";

const Register = () => {
  const [searchParams] = useSearchParams();
  const { isSignedIn, userProfile } = useAuth();
  const [userType, setUserType] = useState<"trucker" | "shipper">("shipper");

  useEffect(() => {
    const type = searchParams.get("userType") as "trucker" | "shipper";
    if (type) setUserType(type);
  }, [searchParams]);

  if (isSignedIn && userProfile) {
    return <Navigate to={userProfile.user_type === "trucker" ? "/trucker/dashboard" : "/shipper/dashboard"} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-6 sm:py-8">
      <div className="w-full max-w-md space-y-5 sm:space-y-6 bg-white p-5 sm:p-6 md:p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <Truck className="h-8 w-8 text-orange-600 sm:h-10 sm:w-10 md:h-12 md:w-12" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">Create Account</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 mb-4 sm:mb-6">
            Join as a <span className="font-medium text-orange-600">{userType === "trucker" ? "Trucker" : "Shipper"}</span>
          </p>
        </div>

        <div className="flex gap-2 mb-4 sm:mb-6">
          <button
            type="button"
            onClick={() => setUserType("shipper")}
            className={`flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              userType === "shipper"
                ? "bg-orange-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Shipper
          </button>
          <button
            type="button"
            onClick={() => setUserType("trucker")}
            className={`flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              userType === "trucker"
                ? "bg-orange-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Trucker
          </button>
        </div>

        <SignUp
          routing="path"
          path="/register"
          signInUrl="/login"
          unsafeMetadata={{ user_type: userType }}
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-2.5 px-4 rounded-md transition-colors normal-case",
              card: "shadow-none border-0 p-0",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              footer: "hidden",
              formFieldLabel: "text-sm font-medium text-gray-700",
              formFieldInput: 
                "h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent",
              formField: "mb-4",
              formFieldInputContainer: "relative",
              formFieldInputTypePassword: "pr-10"
            }
          }}
        />

        <div className="text-center pt-2">
          <p className="text-xs sm:text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-orange-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;