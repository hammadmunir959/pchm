import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isTokenValid } from "@/utils/tokenValidation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  allowedRoles?: Array<"super-admin" | "admin">;
  redirectTo?: string;
}

const ProtectedRoute = ({ allowedRoles, redirectTo }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const location = useLocation();
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  // Validate token expiration on mount and periodically
  useEffect(() => {
    if (!isLoading) {
      const tokenIsValid = isTokenValid();
      setIsValidatingToken(false);
      
      if (!tokenIsValid && isAuthenticated) {
        // Token is expired, logout and redirect
        logout();
        return;
      }
    }

    // Set up periodic token validation check (every 30 seconds)
    const intervalId = setInterval(() => {
      if (!isTokenValid() && isAuthenticated) {
        logout();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [isLoading, isAuthenticated, logout]);

  if (isLoading || isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-admin-area>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Double-check token validity before allowing access
  if (!isTokenValid()) {
    logout();
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.adminType)) {
    const fallbackPath = redirectTo ?? (user.adminType === "super-admin" ? "/super-admin/dashboard" : "/admin/dashboard");
    return <Navigate to={fallbackPath} replace />;
  }

  // Wrap admin routes with data attribute to prevent theme colors
  return (
    <div data-admin-area>
      <Outlet />
    </div>
  );
};

export default ProtectedRoute;


