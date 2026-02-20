"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetchApi('/api/auth/session');
        const data = await response.json();

        if (data.success && data.isLoggedIn) {
          if (allowedRoles && allowedRoles.length > 0) {
            if (!allowedRoles.includes(data.data.role)) {
              window.location.href = `/${data.data.role.toLowerCase()}`;
              return;
            }
          }
          setIsAuthorized(true);
        } else {
          window.location.href = '/admin-guru';
        }
      } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/admin-guru';
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [allowedRoles]);

  if (isChecking || !isAuthorized) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
