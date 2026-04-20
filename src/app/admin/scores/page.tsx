"use client";

import { AdminLayout } from "@/components/admin-layout";
import { mockScoreStats, mockExams, mockSubmissions } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
} from "lucide-react";

export default function AdminScoresPage() {
  const totalExams = mockExams.filter((e) => e.status !== "draft").length;
  const totalSubmissions = mockSubmissions.length;
  const avgScore =
    mockScoreStats.reduce((sum, s) => sum + s.avgScore, 0) / (mockScoreStats.length || 1);
  const avgPassRate =
    mockScoreStats.reduce((sum, s) => sum + s.passRate, 0) / (mockScoreStats.length || 1);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">成绩统计</h1>
          <p className="text-muted-foreground mt-1">查看考试平均分、通过率和题目错误率分析</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">考试场次</p>
                  <p className="text-3xl font-bold mt-1">{totalExams}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
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
                  <p className="text-sm text-muted-foreground">总平均分</p>
                  <p className="text-3xl font-bold mt-1">{avgScore.toFixed(1)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-emerald-600" />
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
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam Stats Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockScoreStats.map((stat) => (
            <Card key={stat.examId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{stat.examTitle}</CardTitle>
                  <Badge variant="secondary">{stat.totalSubmissions} 人参加</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Score Distribution */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">平均分</span>
                    <span className="font-semibold">
                      {stat.avgScore} / {stat.maxScore}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${Math.min((stat.avgScore / stat.maxScore) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Pass Rate */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">通过率</span>
                    <span className="font-semibold">{stat.passRate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${stat.passRate}%` }}
                    />
                  </div>
                </div>

                <Separator />

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-emerald-600">
                      {Math.round(stat.totalSubmissions * (stat.passRate / 100))}
                    </p>
                    <p className="text-xs text-muted-foreground">通过人数</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-500">
                      {Math.round(stat.totalSubmissions * ((100 - stat.passRate) / 100))}
                    </p>
                    <p className="text-xs text-muted-foreground">未通过</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{stat.avgScore.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">平均分</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Score Distribution Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">成绩分布概览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { range: "90-100 分", count: 12, color: "bg-emerald-500" },
                { range: "80-89 分", count: 28, color: "bg-blue-500" },
                { range: "70-79 分", count: 35, color: "bg-amber-500" },
                { range: "60-69 分", count: 18, color: "bg-orange-500" },
                { range: "0-59 分", count: 8, color: "bg-red-500" },
              ].map((item) => (
                <div key={item.range} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20 text-right">
                    {item.range}
                  </span>
                  <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden relative">
                    <div
                      className={`h-full ${item.color} rounded-md transition-all`}
                      style={{ width: `${Math.min((item.count / 50) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-10">{item.count}人</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
