import { useState } from "react";
import { SignUp } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";

export default function RoleSignUp() {
  const [role, setRole] = useState<"trucker" | "shipper">("trucker");
  const { setUser } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Create the user with Clerk
    const { user } = await SignUp.handleSubmit(
      async (inputs) => {
        // Add the role to publicMetadata before creating the user
        const publicMetadata = { role };
        // You can pass it via the `publicMetadata` option in Clerk's API
        // (see step 3 for the exact call)
      },
      { publicMetadata: { role } }
    );

    // Optional: redirect based on role
    if (role === "trucker") {
      window.location.href = "/trucker-dashboard";
    } else {
      window.location.href = "/shipper-dashboard";
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Email & password are automatically rendered by Clerk's SignUp */}
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

      {/* Clerk's built-in UI for email, password, etc. */}
      <SignUp />
    </form>
  );
}