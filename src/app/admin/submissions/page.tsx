"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin-layout";
import { mockSubmissions, mockExams, getQuestionsByIds } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ClipboardList, Eye, CheckCircle2, HelpCircle, User, FileText } from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case "reviewed":
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">已评阅</Badge>;
    case "submitted":
      return <Badge variant="secondary">待复核</Badge>;
    case "in_progress":
      return <Badge variant="outline">进行中</Badge>;
    default:
      return <Badge variant="outline">未知</Badge>;
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminSubmissionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<typeof mockSubmissions[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filtered = mockSubmissions.filter((sub) => {
    const matchSearch =
      sub.studentName.toLowerCase().includes(search.toLowerCase()) ||
      sub.examTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleViewDetail = (sub: typeof mockSubmissions[0]) => {
    setSelectedSubmission(sub);
    setShowDetailDialog(true);
  };

  const exam = selectedSubmission ? mockExams.find((e) => e.id === selectedSubmission.examId) : null;
  const questions = exam?.questions ? getQuestionsByIds(exam.questions) : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">提交记录</h1>
          <p className="text-muted-foreground mt-1">查看学生考试提交，进行人工复核</p>
        </div>

        {/* Filters */}
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

        {/* Submissions Table */}
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
                    <TableCell className="text-muted-foreground">
                      {formatDate(sub.submittedAt)}
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell className="text-right">
                      {sub.status === "reviewed" && sub.totalScore !== undefined ? (
                        <span className="font-semibold text-emerald-600">
                          {sub.totalScore} / {sub.maxScore}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">— / {sub.maxScore}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(sub)}
                      >
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
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle>提交详情</DialogTitle>
                <DialogDescription>
                  {selectedSubmission.studentName} - {selectedSubmission.examTitle}
                </DialogDescription>
              </DialogHeader>
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

                {/* Answers */}
                <div className="space-y-4">
                  <h3 className="font-semibold">答题详情</h3>
                  {questions.map((q, idx) => {
                    const answer = selectedSubmission.answers[q.id];
                    const isCorrect = answer === q.correctAnswer;
                    return (
                      <Card key={q.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium mb-2">{q.stem}</p>
                              {q.type === "single" && q.options && (
                                <div className="space-y-1 text-sm">
                                  {q.options.map((opt, optIdx) => {
                                    const optValue = String.fromCharCode(65 + optIdx);
                                    const isSelected = answer === optValue;
                                    const isAnswer = q.correctAnswer === optValue;
                                    return (
                                      <div
                                        key={optIdx}
                                        className={`flex items-center gap-2 p-1.5 rounded ${
                                          isSelected
                                            ? isCorrect
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
                                            {isCorrect ? "✓ 正确" : "✗ 错误"}
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
                                      answer === "A"
                                        ? isCorrect
                                          ? "text-emerald-600 font-medium"
                                          : "text-red-600 font-medium"
                                        : ""
                                    }`}
                                  >
                                    正确
                                    {answer === "A" && (isCorrect ? " ✓" : " ✗")}
                                  </span>
                                  <span
                                    className={`flex items-center gap-1 ${
                                      answer === "B"
                                        ? isCorrect
                                          ? "text-emerald-600 font-medium"
                                          : "text-red-600 font-medium"
                                        : ""
                                    }`}
                                  >
                                    错误
                                    {answer === "B" && (isCorrect ? " ✓" : " ✗")}
                                  </span>
                                </div>
                              )}
                              {q.type === "essay" && (
                                <div className="space-y-2">
                                  <div className="p-3 bg-muted rounded-lg text-sm">
                                    <p className="text-muted-foreground mb-1">学生答案：</p>
                                    <p>{answer || "（未作答）"}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
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
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  关闭
                </Button>
                {selectedSubmission.status === "submitted" && (
                  <Button onClick={() => setShowDetailDialog(false)}>保存评阅</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
