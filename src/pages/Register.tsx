"use client";

import { useSearchParams, Navigate } from "react-router-dom";
import { SignUp } from "@clerk/clerk-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <SignUp
        routing="path"
        path="/register"
        signInUrl="/login"
        unsafeMetadata={{ user_type: userType }}
      />
    </div>
  );
};

export default Register;