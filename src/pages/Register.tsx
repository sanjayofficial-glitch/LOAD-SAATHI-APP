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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6 bg-white p-6 rounded-xl shadow-lg sm:p-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Truck className="h-10 w-10 text-orange-600 sm:h-12 sm:w-12" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Create Account</h2>
          <p className="text-sm text-gray-600 mt-2 mb-6 sm:mt-3 sm:mb-8 sm:text-base">
            Join as a <span className="font-medium text-orange-600">{userType === "trucker" ? "Trucker" : "Shipper"}</span>
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setUserType("shipper")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
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
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
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
              formField: "mb-4"
            }
          }}
        />

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-orange-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;