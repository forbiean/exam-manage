"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { clearAuthStorage, getCurrentRole, getToken, type UserRole } from "@/lib/auth";

type RouteGuardProps = {
  allowedRole: UserRole;
  children: React.ReactNode;
};

export function RouteGuard({ allowedRole, children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const token = getToken();
    const role = getCurrentRole();

    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (role !== allowedRole) {
      router.replace("/login");
      return;
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      clearAuthStorage();
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    async function validateSession() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          clearAuthStorage();
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        if (!isCancelled) {
          setIsReady(true);
        }
      } catch {
        clearAuthStorage();
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }

    validateSession();
    return () => {
      isCancelled = true;
    };
  }, [allowedRole, pathname, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在验证登录状态...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
