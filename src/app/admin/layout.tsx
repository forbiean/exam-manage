"use client";

import { RouteGuard } from "@/components/route-guard";

export default function AdminLayoutRoute({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRole="admin">{children}</RouteGuard>;
}

