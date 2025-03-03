import { Navigate } from "react-router-dom";
import { pb } from "../../lib/pocketbase";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = pb.authStore.isValid;

  // if (!isAuthenticated) {
  //   // Redirect to home if not authenticated
  //   return <Navigate to="/" replace />;
  // }

  return <>{children}</>;
}
