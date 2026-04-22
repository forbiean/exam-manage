"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Clock, Calendar, FileText, Pencil, Trash2 } from "lucide-react";
import { createExam, deleteExam, getExams, updateExamQuestions, type ExamRecord, type ExamStatus } from "@/lib/admin-exams-api";
import { getQuestions, type QuestionRecord } from "@/lib/admin-questions-api";

type CreateExamForm = {
  title: string;
  description: string;
  durationMinutes: number;
  status: ExamStatus;
  startTime: string;
  endTime: string;
};

const emptyCreateForm: CreateExamForm = {
  title: "",
  description: "",
  durationMinutes: 60,
  status: "draft",
  startTime: "",
  endTime: "",
};

function getStatusBadge(status: string) {
  switch (status) {
    case "published":
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">已发布</Badge>;
    case "draft":
      return <Badge variant="secondary">草稿</Badge>;
    case "closed":
      return <Badge variant="outline">已关闭</Badge>;
    default:
      return <Badge variant="outline">未知</Badge>;
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateExamForm>(emptyCreateForm);
  const [creating, setCreating] = useState(false);

  const [editingExam, setEditingExam] = useState<ExamRecord | null>(null);
  const [editQuestionIds, setEditQuestionIds] = useState<string[]>([""]);
  const [savingQuestions, setSavingQuestions] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [examData, questionData] = await Promise.all([getExams(), getQuestions("active")]);
      setExams(examData);
      setQuestions(questionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    return exams.filter((exam) => {
      const matchSearch = exam.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || exam.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [exams, search, statusFilter]);

  async function handleCreateExam() {
    const title = createForm.title.trim();
    if (!title) {
      setError("考试名称不能为空");
      return;
    }
    if (createForm.durationMinutes <= 0) {
      setError("考试时长必须大于 0");
      return;
    }

    setCreating(true);
    try {
      await createExam({
        title,
        description: createForm.description.trim(),
        durationMinutes: createForm.durationMinutes,
        status: createForm.status,
        startTime: createForm.startTime ? new Date(createForm.startTime).toISOString() : null,
        endTime: createForm.endTime ? new Date(createForm.endTime).toISOString() : null,
      });
      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建考试失败");
    } finally {
      setCreating(false);
    }
  }

  function openEditQuestions(exam: ExamRecord) {
    setEditingExam(exam);
    const ids = exam.questionIds.length > 0 ? exam.questionIds : [""];
    setEditQuestionIds(ids);
  }

  function addQuestionSelectRow() {
    setEditQuestionIds((prev) => [...prev, ""]);
  }

  function setQuestionSelectValue(index: number, questionId: string) {
    setEditQuestionIds((prev) => prev.map((v, i) => (i === index ? questionId : v)));
  }

  async function handleSaveExamQuestions() {
    if (!editingExam) return;
    const normalized = editQuestionIds.map((id) => id.trim()).filter(Boolean);
    if (normalized.length === 0) {
      setError("至少选择 1 道题目");
      return;
    }
    if (new Set(normalized).size !== normalized.length) {
      setError("同一场考试中不能重复选择同一道题");
      return;
    }

    setSavingQuestions(true);
    try {
      await updateExamQuestions(editingExam.id, normalized);
      setEditingExam(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新考试题目失败");
    } finally {
      setSavingQuestions(false);
    }
  }

  async function handleDeleteExam(exam: ExamRecord) {
    const confirmed = window.confirm(`确认删除考试？\n${exam.title}`);
    if (!confirmed) return;
    try {
      await deleteExam(exam.id);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除考试失败");
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">考试管理</h1>
            <p className="text-muted-foreground mt-1">创建、编辑和删除考试</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-1.5" />
                创建考试
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>创建新考试</DialogTitle>
                <DialogDescription>填写考试基本信息，状态默认草稿。</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>考试名称</Label>
                  <Input
                    placeholder="例如：前端开发基础测试"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>考试说明</Label>
                  <Input
                    placeholder="简要描述考试内容"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>考试时长（分钟）</Label>
                    <Input
                      type="number"
                      placeholder="60"
                      value={createForm.durationMinutes}
                      onChange={(e) => setCreateForm({ ...createForm, durationMinutes: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>状态</Label>
                    <Select
                      value={createForm.status}
                      onValueChange={(v) => setCreateForm({ ...createForm, status: v as ExamStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">草稿</SelectItem>
                        <SelectItem value="published">已发布</SelectItem>
                        <SelectItem value="closed">已关闭</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>开始时间</Label>
                    <Input
                      type="datetime-local"
                      value={createForm.startTime}
                      onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>结束时间</Label>
                    <Input
                      type="datetime-local"
                      value={createForm.endTime}
                      onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreateExam} disabled={creating}>
                  创建
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索考试..."
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
              <SelectItem value="published">已发布</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="closed">已关闭</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading ? <p className="text-sm text-muted-foreground">加载中...</p> : null}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium px-4 py-3">考试名称</th>
                    <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">状态</th>
                    <th className="text-left font-medium px-4 py-3 hidden md:table-cell">时间</th>
                    <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">题目数</th>
                    <th className="text-right font-medium px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exam) => (
                    <tr key={exam.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{exam.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{exam.description || "—"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">{getStatusBadge(exam.status)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {exam.durationMinutes} 分钟
                          </p>
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(exam.startTime)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-muted-foreground">
                          {exam.questionCount} 题 / {exam.totalScore} 分
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditQuestions(exam)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteExam(exam)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && filtered.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>没有找到匹配的考试</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editingExam)} onOpenChange={(open) => !open && setEditingExam(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>修改考试题目</DialogTitle>
            <DialogDescription>
              {editingExam ? `考试：${editingExam.title}` : "从题库中选择题目，至少选择 1 道题。"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {editQuestionIds.map((questionId, idx) => (
              <div key={`q-select-${idx}`} className="space-y-2">
                <Label>{idx === 0 ? "从题库中选择题目" : `题目 ${idx + 1}`}</Label>
                <Select value={questionId} onValueChange={(v) => setQuestionSelectValue(idx, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择题目" />
                  </SelectTrigger>
                  <SelectContent>
                    {questions.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        [{q.category}] {q.stem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            <Button variant="outline" onClick={addQuestionSelectRow}>
              增加考试题目
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExam(null)}>
              取消
            </Button>
            <Button onClick={handleSaveExamQuestions} disabled={savingQuestions}>
              保存题目
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
