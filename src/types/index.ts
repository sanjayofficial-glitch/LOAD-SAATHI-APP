import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/types";

const useUser = (userId?: string) => {
  const { user } = useAuth();
  return user?.id === userId ? user : null;
};

export { useUser };