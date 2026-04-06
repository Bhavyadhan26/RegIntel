import { useAuth } from "@/context/AuthContext";
import { LogoutSkeleton } from "@/components/ui/LogoutSkeleton";

export const LogoutOverlay = () => {
  const { isLoggingOut } = useAuth();

  if (!isLoggingOut) return null;

  return <LogoutSkeleton />;
};
