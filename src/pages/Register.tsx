"use client";

import { useSearchParams, Navigate, Link } from "react-router-dom";
import { SignUp } from "@clerk/clerk-react";
import { Truck, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-5">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-600 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-gray-500 hover:text-orange-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>

        <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-orange-50 p-3 rounded-2xl">
                <Truck className="h-10 w-10 text-orange-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl tracking-tight">Create Account</h2>
            <p className="text-sm text-gray-500 mt-2">
              Join the LoadSaathi community as a <span className="font-bold text-orange-600 uppercase tracking-wider text-xs">{userType}</span>
            </p>
          </div>

          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setUserType("shipper")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                userType === "shipper"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Shipper
            </button>
            <button
              type="button"
              onClick={() => setUserType("trucker")}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                userType === "trucker"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
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
                  "bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] normal-case",
                card: "shadow-none border-0 p-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                footer: "hidden",
                formFieldLabel: "text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5",
                formFieldInput: 
                  "h-12 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all",
                formField: "mb-5",
                identityPreviewText: "text-gray-600 font-medium",
                identityPreviewEditButton: "text-orange-600 font-bold hover:text-orange-700",
                formResendCodeLink: "text-orange-600 font-bold hover:text-orange-700"
              }
            }}
          />

          <div className="text-center pt-4 border-t border-gray-50">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-orange-600 font-bold hover:underline decoration-2 underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;