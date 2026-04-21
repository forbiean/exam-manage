"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, ShieldCheck } from "lucide-react";
import { login } from "@/lib/api";
import { saveAuthStorage } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login({ email, password });

      if (data.user.role !== role) {
        setError("选择的身份与账号角色不一致，请重新选择。");
        setLoading(false);
        return;
      }

      saveAuthStorage({
        token: data.token,
        user: data.user,
      });

      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.push(redirect);
      } else if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/student/exams");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Nav */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">ExamHub</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border shadow-sm">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">欢迎回来</CardTitle>
              <CardDescription>选择身份并登录系统</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Role Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg mb-6">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                    role === "student"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  学生
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                    role === "admin"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  管理员
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱 / 账号</Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder={role === "student" ? "student@example.com" : "admin@example.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">密码</Label>
                    <button type="button" className="text-xs text-primary hover:underline">
                      忘记密码？
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "登录中..." : "登录"}
                </Button>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>
                  演示账号：
                  {role === "student" ? (
                    <span>student@example.com / 任意密码</span>
                  ) : (
                    <span>admin@example.com / 任意密码</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
