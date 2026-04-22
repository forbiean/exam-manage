"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import {
  getAdminSubmissions,
  getAdminSubmissionDetail,
  type AdminSubmissionDetail,
} from "@/lib/admin-submissions-api";
import type { SubmissionRecord } from "@/lib/student-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ClipboardList, Eye, User, Loader2 } from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case "reviewed":
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">已评阅</Badge>;
    case "submitted":
      return <Badge variant="secondary">待复核</Badge>;
    default:
      return <Badge variant="outline">未知</Badge>;
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function optionValueFromIndex(index: number) {
  return String.fromCharCode(65 + index);
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [selectedSubmission, setSelectedSubmission] = useState<AdminSubmissionDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getAdminSubmissions();
        if (cancelled) return;
        setSubmissions(data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "加载提交记录失败");
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

  const filtered = useMemo(() => {
    return submissions.filter((sub) => {
      const q = search.toLowerCase();
      const matchSearch = sub.studentName.toLowerCase().includes(q) || sub.examTitle.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || sub.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, submissions]);

  async function handleViewDetail(submissionId: string) {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const detail = await getAdminSubmissionDetail(submissionId);
      setSelectedSubmission(detail);
    } catch (err) {
      setSelectedSubmission(null);
      setError(err instanceof Error ? err.message : "加载提交详情失败");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">提交记录</h1>
          <p className="text-muted-foreground mt-1">查看学生考试提交，进行人工复核</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索学生姓名或考试..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="submitted">待复核</SelectItem>
              <SelectItem value="reviewed">已评阅</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              加载中...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-10 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>学生</TableHead>
                    <TableHead>考试</TableHead>
                    <TableHead>提交时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">得分</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="font-medium">{sub.studentName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{sub.examTitle}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(sub.submittedAt)}</TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell className="text-right">
                        {sub.status === "reviewed" && sub.totalScore !== null ? (
                          <span className="font-semibold text-emerald-600">
                            {sub.totalScore} / {sub.maxScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">— / {sub.maxScore}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(sub.id)}>
                          <Eye className="w-4 h-4 mr-1" />
                          查看
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>没有找到匹配的提交记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>提交详情</DialogTitle>
            <DialogDescription>
              {selectedSubmission
                ? `${selectedSubmission.studentName} - ${selectedSubmission.examTitle}`
                : "查看学生本次考试提交的答题明细"}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-16 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              加载详情中...
            </div>
          ) : selectedSubmission ? (
            <>

              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">提交时间</p>
                      <p className="font-medium">{formatDate(selectedSubmission.submittedAt)}</p>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div>
                      <p className="text-sm text-muted-foreground">状态</p>
                      {getStatusBadge(selectedSubmission.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">得分</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {selectedSubmission.totalScore ?? "—"}
                      <span className="text-base text-muted-foreground font-normal">
                        {" "}
                        / {selectedSubmission.maxScore}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">答题详情</h3>
                  {selectedSubmission.answers.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-10 text-center text-muted-foreground">
                        该提交暂无答题明细
                      </CardContent>
                    </Card>
                  ) : (
                    selectedSubmission.answers
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((q, idx) => (
                        <Card key={q.questionId} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <span className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                {idx + 1}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium mb-2">{q.stem}</p>

                                {q.type === "single" && (
                                  <div className="space-y-1 text-sm">
                                    {q.options.map((opt, optIdx) => {
                                      const optValue = optionValueFromIndex(optIdx);
                                      const isSelected = q.studentAnswer === optValue;
                                      const isAnswer = q.correctAnswer === optValue;
                                      return (
                                        <div
                                          key={optIdx}
                                          className={`flex items-center gap-2 p-1.5 rounded ${
                                            isSelected
                                              ? q.isCorrect
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-red-100 text-red-700"
                                              : isAnswer
                                                ? "bg-emerald-50 text-emerald-600"
                                                : ""
                                          }`}
                                        >
                                          <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">
                                            {optValue}
                                          </span>
                                          <span>{opt}</span>
                                          {isSelected && (
                                            <span className="ml-auto text-xs">
                                              {q.isCorrect ? "✓ 正确" : "✗ 错误"}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {q.type === "judge" && (
                                  <div className="flex items-center gap-4 text-sm">
                                    <span
                                      className={`flex items-center gap-1 ${
                                        q.studentAnswer === "A"
                                          ? q.isCorrect
                                            ? "text-emerald-600 font-medium"
                                            : "text-red-600 font-medium"
                                          : ""
                                      }`}
                                    >
                                      正确
                                      {q.studentAnswer === "A" && (q.isCorrect ? " ✓" : " ✗")}
                                    </span>
                                    <span
                                      className={`flex items-center gap-1 ${
                                        q.studentAnswer === "B"
                                          ? q.isCorrect
                                            ? "text-emerald-600 font-medium"
                                            : "text-red-600 font-medium"
                                          : ""
                                      }`}
                                    >
                                      错误
                                      {q.studentAnswer === "B" && (q.isCorrect ? " ✓" : " ✗")}
                                    </span>
                                  </div>
                                )}

                                {q.type === "essay" && (
                                  <div className="space-y-2">
                                    <div className="p-3 bg-muted rounded-lg text-sm">
                                      <p className="text-muted-foreground mb-1">学生答案：</p>
                                      <p>{q.studentAnswer || "（未作答）"}</p>
                                    </div>
                                  </div>
                                )}

                                <div className="mt-3 text-xs text-muted-foreground">
                                  本题得分：{q.finalScore} / {q.questionScore}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )}
                </div>

                {selectedSubmission.status === "submitted" && (
                  <div className="space-y-3">
                    <Separator />
                    <h3 className="font-semibold">人工评阅</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>简答题得分</Label>
                        <Input type="number" placeholder="输入得分" />
                      </div>
                      <div className="space-y-2">
                        <Label>总分</Label>
                        <Input type="number" placeholder="自动计算" disabled />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  关闭
                </Button>
                {selectedSubmission.status === "submitted" && (
                  <Button onClick={() => setDetailOpen(false)}>保存评阅</Button>
                )}
              </DialogFooter>
            </>
          ) : (
            <div className="py-16 text-center text-muted-foreground">未找到提交详情</div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
