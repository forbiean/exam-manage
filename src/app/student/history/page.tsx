"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getStudentHistory, type SubmissionRecord } from "@/lib/student-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Clock,
  FileText,
  Award,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Loader2,
} from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case "reviewed":
      return (
        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
          已出分
        </Badge>
      );
    case "submitted":
      return <Badge variant="secondary">待评阅</Badge>;
    case "in_progress":
      return <Badge variant="outline">进行中</Badge>;
    default:
      return <Badge variant="outline">未知</Badge>;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "reviewed":
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    case "submitted":
      return <HelpCircle className="w-5 h-5 text-amber-500" />;
    default:
      return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentHistoryPage() {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getStudentHistory();
        if (cancelled) return;
        setSubmissions(data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "加载历史成绩失败");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const reviewedCount = submissions.filter((s) => s.status === "reviewed").length;
    const submittedCount = submissions.filter((s) => s.status === "submitted").length;
    return {
      total: submissions.length,
      reviewedCount,
      submittedCount,
    };
  }, [submissions]);

  return (
    <div className="min-h-full flex flex-col bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">ExamHub</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link href="/student/exams">
              <Button variant="ghost" size="sm">
                <FileText className="w-4 h-4 mr-1.5" />
                考试列表
              </Button>
            </Link>
            <Link href="/student/history">
              <Button variant="ghost" size="sm" className="text-foreground">
                <Clock className="w-4 h-4 mr-1.5" />
                历史成绩
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">历史成绩</h1>
          <p className="text-muted-foreground mt-1">查看您的考试记录和成绩</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">总考试次数</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.reviewedCount}</p>
                <p className="text-xs text-muted-foreground">已出分</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.submittedCount}</p>
                <p className="text-xs text-muted-foreground">待评阅</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              加载中...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-1">暂无考试记录</h3>
                  <p className="text-muted-foreground text-sm mb-4">您还没有参加过任何考试</p>
                  <Link href="/student/exams">
                    <Button>去考试</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              submissions.map((sub) => (
                <Card key={sub.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 mt-0.5">{getStatusIcon(sub.status)}</div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{sub.examTitle}</h3>
                            {getStatusBadge(sub.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            提交时间：{formatDate(sub.submittedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 sm:gap-8">
                        {sub.status === "reviewed" && sub.totalScore !== null ? (
                          <div className="text-right">
                            <p className="text-3xl font-bold text-emerald-600">{sub.totalScore}</p>
                            <p className="text-xs text-muted-foreground">/ {sub.maxScore} 分</p>
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="text-3xl font-bold text-muted-foreground">—</p>
                            <p className="text-xs text-muted-foreground">/ {sub.maxScore} 分</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {sub.status === "reviewed" && sub.totalScore !== null && (
                      <>
                        <Separator className="my-4" />
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{
                                width: `${Math.min((sub.totalScore / sub.maxScore) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {Math.round((sub.totalScore / sub.maxScore) * 100)}%
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

