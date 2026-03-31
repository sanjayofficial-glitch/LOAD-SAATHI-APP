import { useState } from "react";
import { SignUp } from "@clerk/clerk-react";

export default function RoleSignUp() {
  const [role, setRole] = useState<"trucker" | "shipper">("trucker");

  return (
    <form>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select your role:
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="role"
              value="trucker"
              checked={role === "trucker"}
              onChange={() => setRole("trucker")}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-900">Trucker</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="role"
              value="shipper"
              checked={role === "shipper"}
              onChange={() => setRole("shipper")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-900">Shipper</span>
          </label>
        </div>
      </div>

      {/* Clerk's SignUp component now receives the selected role via unsafeMetadata */}
      <SignUp
        unsafeMetadata={{ role }}
        routing="path"
        path="/register"
        signInUrl="/login"
        afterSignUpUrl="/"
        redirectUrl="/"
      />
    </form>
  );
}