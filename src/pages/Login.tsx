import { SignIn } from "@clerk/clerk-react";

const Login = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <SignIn
          routing="path"
          path="/login"
          fallbackRedirectUrl="/auth-sync"
          afterSignInUrl="/auth-sync"
          signUpFallbackRedirectUrl="/register"
        />
      </div>
    </div>
  );
};

export default Login;