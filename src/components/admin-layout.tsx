"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clearAuthStorage, getAuthStorage } from "@/lib/auth";
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  Database,
  ClipboardList,
  BarChart3,
  Menu,
  ChevronRight,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "概览", icon: LayoutDashboard },
  { href: "/admin/exams", label: "考试管理", icon: FileText },
  { href: "/admin/questions", label: "题库管理", icon: Database },
  { href: "/admin/submissions", label: "提交记录", icon: ClipboardList },
  { href: "/admin/scores", label: "成绩统计", icon: BarChart3 },
];

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = getAuthStorage();

  const handleLogout = () => {
    clearAuthStorage();
    router.push("/login");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 flex items-center px-4 border-b">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">ExamHub 管理后台</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-2 ${
                    isActive ? "font-medium" : ""
                  }`}
                  size="sm"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t p-3">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              AD
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">管理员</p>
            <p className="text-xs text-muted-foreground truncate">{auth?.user.email ?? "admin@example.com"}</p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-sidebar fixed inset-y-0 left-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-50"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-full">
        {/* Top Bar */}
        <header className="h-14 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="lg:hidden w-8" /> {/* spacer for menu button */}
          <h1 className="text-sm font-semibold text-muted-foreground lg:ml-0 ml-2">
            管理后台
          </h1>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                返回官网
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
