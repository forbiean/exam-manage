"use client";

import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockExams, mockSubmissions, mockScoreStats } from "@/lib/mock-data";
import {
  FileText,
  Users,
  ClipboardCheck,
  TrendingUp,
  Award,
  AlertCircle,
} from "lucide-react";

export default function AdminDashboardPage() {
  const publishedExams = mockExams.filter((e) => e.status === "published").length;
  const totalSubmissions = mockSubmissions.length;
  const pendingReview = mockSubmissions.filter((s) => s.status === "submitted").length;

  const avgPassRate =
    mockScoreStats.reduce((sum, s) => sum + s.passRate, 0) / (mockScoreStats.length || 1);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">后台概览</h1>
          <p className="text-muted-foreground mt-1">查看系统关键指标和统计数据</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">已发布考试</p>
                  <p className="text-3xl font-bold mt-1">{publishedExams}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总提交数</p>
                  <p className="text-3xl font-bold mt-1">{totalSubmissions}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">待复核</p>
                  <p className="text-3xl font-bold mt-1">{pendingReview}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">平均通过率</p>
                  <p className="text-3xl font-bold mt-1">{avgPassRate.toFixed(0)}%</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                考试成绩概览
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockScoreStats.map((stat) => (
                <div key={stat.examId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stat.examTitle}</span>
                    <span className="text-muted-foreground">
                      {stat.totalSubmissions} 人参加
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${stat.passRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      通过率 {stat.passRate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>平均分 {stat.avgScore}</span>
                    <span>满分 {stat.maxScore}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                最近提交
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockSubmissions.slice(0, 4).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{sub.studentName}</p>
                    <p className="text-xs text-muted-foreground">{sub.examTitle}</p>
                  </div>
                  <div className="text-right">
                    {sub.status === "reviewed" && sub.totalScore !== undefined ? (
                      <p className="text-sm font-semibold text-emerald-600">
                        {sub.totalScore} 分
                      </p>
                    ) : (
                      <p className="text-xs text-amber-500">待评阅</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {sub.submittedAt
                        ? new Date(sub.submittedAt).toLocaleDateString("zh-CN")
                        : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
