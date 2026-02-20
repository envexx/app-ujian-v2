"use client";

import { useEffect, useState, Suspense } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

function AdminLayoutClientInner({ children }: AdminLayoutClientProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetchApi('/api/auth/session');
        const data = await response.json();

        if (data.success && data.isLoggedIn) {
          // Check if user is ADMIN
          if (data.data.role !== 'ADMIN' && data.data.role !== 'SUPERADMIN') {
            window.location.href = `/${data.data.role.toLowerCase()}`;
            return;
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

    if (isChecking) {
      checkAuth();
    }
  }, [isChecking]);

  if (isChecking || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
      <AdminLayoutClientInner>{children}</AdminLayoutClientInner>
    </Suspense>
  );
}
