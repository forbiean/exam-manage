"use client";

import Link from "next/link";
import { mockExams } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Calendar, ArrowRight, FileText } from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case "published":
      return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">进行中</Badge>;
    case "draft":
      return <Badge variant="secondary">未开始</Badge>;
    case "closed":
      return <Badge variant="outline">已结束</Badge>;
    default:
      return <Badge variant="outline">未知</Badge>;
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentExamsPage() {
  const published = mockExams.filter((e) => e.status === "published");
  const others = mockExams.filter((e) => e.status !== "published");

  return (
    <div className="min-h-full flex flex-col bg-background">
      {/* Student Nav */}
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
              <Button variant="ghost" size="sm" className="text-foreground">
                <FileText className="w-4 h-4 mr-1.5" />
                考试列表
              </Button>
            </Link>
            <Link href="/student/history">
              <Button variant="ghost" size="sm">
                <Clock className="w-4 h-4 mr-1.5" />
                历史成绩
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">我的考试</h1>
          <p className="text-muted-foreground mt-1">查看可参加的考试和考试安排</p>
        </div>

        {/* Active Exams */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            进行中
          </h2>
          {published.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                暂无进行中的考试
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {published.map((exam) => (
                <Card key={exam.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(exam.status)}
                          <span className="text-xs text-muted-foreground">
                            {exam.questionCount} 题 / {exam.totalScore} 分
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{exam.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {exam.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {exam.durationMinutes} 分钟
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            截止 {formatDate(exam.endTime)}
                          </span>
                        </div>
                      </div>
                      <Link href={`/student/exams/${exam.id}`}>
                        <Button className="shrink-0">
                          进入考试
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Other Exams */}
        {others.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              其他
            </h2>
            <div className="grid gap-4">
              {others.map((exam) => (
                <Card key={exam.id} className="opacity-70">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(exam.status)}
                          <span className="text-xs text-muted-foreground">
                            {exam.questionCount} 题 / {exam.totalScore} 分
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{exam.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {exam.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {exam.durationMinutes} 分钟
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(exam.startTime)} - {formatDate(exam.endTime)}
                          </span>
                        </div>
                      </div>
                      <Button disabled variant="outline" className="shrink-0">
                        {exam.status === "draft" ? "未开始" : "已结束"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
