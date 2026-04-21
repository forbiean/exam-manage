"use client";

import { RouteGuard } from "@/components/route-guard";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRole="student">{children}</RouteGuard>;
}

