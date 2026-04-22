"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import {
  createQuestion,
  deleteQuestion,
  getQuestions,
  type QuestionRecord,
  type QuestionType,
  updateQuestion,
} from "@/lib/admin-questions-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Database, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";

type QuestionForm = {
  type: QuestionType;
  stem: string;
  category: string;
  score: number;
  options: string[];
  correctAnswer: string;
  analysis: string;
};

const defaultForm: QuestionForm = {
  type: "single",
  stem: "",
  category: "",
  score: 5,
  options: ["", "", "", ""],
  correctAnswer: "",
  analysis: "",
};

const NEW_CATEGORY_VALUE = "__new_category__";

function getTypeBadge(type: string) {
  switch (type) {
    case "single":
      return <Badge variant="secondary">单选题</Badge>;
    case "judge":
      return <Badge variant="outline">判断题</Badge>;
    case "essay":
      return <Badge className="bg-blue-600 hover:bg-blue-700">简答题</Badge>;
    default:
      return null;
  }
}

function normalizeCorrectAnswer(type: QuestionType, raw: string) {
  if (type === "single") {
    const v = raw.trim().toUpperCase();
    return ["A", "B", "C", "D"].includes(v) ? v : "";
  }
  if (type === "judge") {
    if (raw === "A" || raw === "B") return raw;
    if (raw.toLowerCase() === "true") return "A";
    if (raw.toLowerCase() === "false") return "B";
    return "";
  }
  return "";
}

function normalizeCategory(category: string | null | undefined) {
  const value = String(category ?? "").trim();
  return value || "未分类";
}

function buildPayload(form: QuestionForm) {
  const type = form.type;
  const stem = form.stem.trim();
  const category = normalizeCategory(form.category);
  const score = Number(form.score) || 1;
  const analysis = form.analysis.trim();

  if (!stem) {
    throw new Error("题目内容不能为空");
  }
  if (score <= 0) {
    throw new Error("分值必须大于 0");
  }

  if (type === "single") {
    const options = form.options.map((s) => s.trim()).filter(Boolean);
    if (options.length < 2) {
      throw new Error("单选题至少需要 2 个选项");
    }
    const correctAnswer = normalizeCorrectAnswer(type, form.correctAnswer);
    if (!correctAnswer) {
      throw new Error("请选择单选题正确答案");
    }
    return {
      type,
      stem,
      category,
      score,
      options,
      correctAnswer,
      analysis: analysis || undefined,
    };
  }

  if (type === "judge") {
    const correctAnswer = normalizeCorrectAnswer(type, form.correctAnswer);
    if (!correctAnswer) {
      throw new Error("请选择判断题正确答案");
    }
    return {
      type,
      stem,
      category,
      score,
      options: ["正确", "错误"],
      correctAnswer,
      analysis: analysis || undefined,
    };
  }

  return {
    type,
    stem,
    category,
    score,
    options: [],
    analysis: analysis || undefined,
  };
}

function formFromQuestion(q: QuestionRecord): QuestionForm {
  const base: QuestionForm = {
    type: q.type,
    stem: q.stem,
    category: q.category,
    score: q.score,
    options: ["", "", "", ""],
    correctAnswer: q.correctAnswer || "",
    analysis: q.analysis || "",
  };

  if (q.type === "single") {
    const opts = [...q.options, "", "", "", ""].slice(0, 4);
    return { ...base, options: opts };
  }
  return base;
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<QuestionForm>(defaultForm);
  const [savingCreate, setSavingCreate] = useState(false);

  const [editing, setEditing] = useState<QuestionRecord | null>(null);
  const [editForm, setEditForm] = useState<QuestionForm>(defaultForm);
  const [savingEdit, setSavingEdit] = useState(false);

  async function loadQuestions() {
    setLoading(true);
    setError("");
    try {
      const data = await getQuestions();
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载题库失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const matchSearch = q.stem.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || q.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [questions, search, typeFilter]);

  const categories = useMemo(() => {
    return Array.from(new Set(questions.map((q) => normalizeCategory(q.category)))).sort();
  }, [questions]);

  const createCategorySelectValue =
    createForm.category.trim() && categories.includes(createForm.category.trim())
      ? createForm.category.trim()
      : NEW_CATEGORY_VALUE;
  const editCategorySelectValue =
    editForm.category.trim() && categories.includes(editForm.category.trim())
      ? editForm.category.trim()
      : NEW_CATEGORY_VALUE;

  async function handleCreate() {
    setSavingCreate(true);
    try {
      const payload = buildPayload(createForm);
      await createQuestion(payload);
      setCreateOpen(false);
      setCreateForm(defaultForm);
      await loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建题目失败");
    } finally {
      setSavingCreate(false);
    }
  }

  function openEdit(q: QuestionRecord) {
    setEditing(q);
    setEditForm(formFromQuestion(q));
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    try {
      const payload = buildPayload(editForm);
      await updateQuestion(editing.id, payload);
      setEditing(null);
      await loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新题目失败");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(q: QuestionRecord) {
    const ok = window.confirm(`确认删除题目？\n${q.stem}`);
    if (!ok) return;
    try {
      await deleteQuestion(q.id);
      await loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除题目失败");
    }
  }

  function setOptionValue(setter: (v: QuestionForm) => void, form: QuestionForm, index: number, value: string) {
    const next = [...form.options];
    next[index] = value;
    setter({ ...form, options: next });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">题库管理</h1>
            <p className="text-muted-foreground mt-1">管理考试题目，支持单选、判断、简答多种题型</p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-1.5" />
                新增题目
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增题目</DialogTitle>
                <DialogDescription>创建一道新题目添加到题库。</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>题目类型</Label>
                  <Select
                    value={createForm.type}
                    onValueChange={(v) =>
                      setCreateForm({
                        ...createForm,
                        type: v as QuestionType,
                        correctAnswer: "",
                        options: ["", "", "", ""],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">单选题</SelectItem>
                      <SelectItem value="judge">判断题</SelectItem>
                      <SelectItem value="essay">简答题</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>题目内容</Label>
                  <Textarea
                    placeholder="请输入题目内容..."
                    rows={3}
                    value={createForm.stem}
                    onChange={(e) => setCreateForm({ ...createForm, stem: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>分类</Label>
                    <Select
                      value={createCategorySelectValue}
                      onValueChange={(v) => {
                        if (v === NEW_CATEGORY_VALUE) {
                          setCreateForm({ ...createForm, category: "" });
                          return;
                        }
                        setCreateForm({ ...createForm, category: v });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <SelectItem value={NEW_CATEGORY_VALUE}>新增分类</SelectItem>
                      </SelectContent>
                    </Select>
                    {createCategorySelectValue === NEW_CATEGORY_VALUE ? (
                      <Input
                        placeholder="请输入新分类"
                        value={createForm.category}
                        onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                      />
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>分值</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={createForm.score}
                      onChange={(e) => setCreateForm({ ...createForm, score: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {createForm.type === "single" && (
                  <div className="space-y-3">
                    <Label>选项</Label>
                    {["A", "B", "C", "D"].map((opt, idx) => (
                      <div key={opt} className="flex items-center gap-2">
                        <span className="w-6 text-sm font-medium text-muted-foreground">{opt}.</span>
                        <Input
                          placeholder={`选项 ${opt}`}
                          value={createForm.options[idx] || ""}
                          onChange={(e) => setOptionValue(setCreateForm, createForm, idx, e.target.value)}
                        />
                      </div>
                    ))}
                    <div className="space-y-2 pt-2">
                      <Label>正确答案</Label>
                      <Select
                        value={createForm.correctAnswer}
                        onValueChange={(v) => setCreateForm({ ...createForm, correctAnswer: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择正确答案" />
                        </SelectTrigger>
                        <SelectContent>
                          {["A", "B", "C", "D"].map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              选项 {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {createForm.type === "judge" && (
                  <div className="space-y-2">
                    <Label>正确答案</Label>
                    <Select
                      value={createForm.correctAnswer}
                      onValueChange={(v) => setCreateForm({ ...createForm, correctAnswer: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择正确答案" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">正确</SelectItem>
                        <SelectItem value="B">错误</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{createForm.type === "essay" ? "参考答案（可选）" : "解析（可选）"}</Label>
                  <Textarea
                    placeholder="输入参考答案或解析..."
                    rows={3}
                    value={createForm.analysis}
                    onChange={(e) => setCreateForm({ ...createForm, analysis: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate} disabled={savingCreate}>
                  保存
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索题目内容..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="全部题型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部题型</SelectItem>
              <SelectItem value="single">单选题</SelectItem>
              <SelectItem value="judge">判断题</SelectItem>
              <SelectItem value="essay">简答题</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading ? <p className="text-sm text-muted-foreground">加载中...</p> : null}

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="list">列表视图</TabsTrigger>
            <TabsTrigger value="category">分类视图</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="space-y-3">
            {filtered.map((q, idx) => (
              <Card key={q.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {getTypeBadge(q.type)}
                        <span className="text-xs text-muted-foreground">{q.category}</span>
                        <span className="text-xs text-muted-foreground">{q.score} 分</span>
                      </div>
                      <p className="text-sm font-medium mb-3">{q.stem}</p>
                      {q.type === "single" && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                          {q.options.map((opt, optIdx) => {
                            const optValue = String.fromCharCode(65 + optIdx);
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-2 ${
                                  q.correctAnswer === optValue ? "text-emerald-600 font-medium" : ""
                                }`}
                              >
                                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">
                                  {optValue}
                                </span>
                                <span className="truncate">{opt}</span>
                                {q.correctAnswer === optValue && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {q.type === "judge" && (
                        <div className="flex items-center gap-4 text-sm mb-3">
                          <span
                            className={`flex items-center gap-1 ${
                              q.correctAnswer === "A" ? "text-emerald-600 font-medium" : ""
                            }`}
                          >
                            {q.correctAnswer === "A" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            正确
                          </span>
                          <span
                            className={`flex items-center gap-1 ${
                              q.correctAnswer === "B" ? "text-emerald-600 font-medium" : ""
                            }`}
                          >
                            {q.correctAnswer === "B" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            错误
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(q)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(q)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!loading && filtered.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Database className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>没有找到匹配的题目</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="category">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat, idx) => {
                const count = questions.filter((q) => normalizeCategory(q.category) === cat).length;
                return (
                  <Card key={`${cat}-${idx}`} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{cat}</h3>
                          <p className="text-2xl font-bold mt-2">{count}</p>
                          <p className="text-xs text-muted-foreground">道题目</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Database className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {categories.length === 0 && !loading && (
                <Card className="border-dashed sm:col-span-2 lg:col-span-3">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Database className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>暂无分类数据</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑题目</DialogTitle>
            <DialogDescription>修改题目内容与配置。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>题目类型</Label>
              <Select
                value={editForm.type}
                onValueChange={(v) =>
                  setEditForm({
                    ...editForm,
                    type: v as QuestionType,
                    correctAnswer: "",
                    options: ["", "", "", ""],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">单选题</SelectItem>
                  <SelectItem value="judge">判断题</SelectItem>
                  <SelectItem value="essay">简答题</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>题目内容</Label>
              <Textarea
                rows={3}
                value={editForm.stem}
                onChange={(e) => setEditForm({ ...editForm, stem: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>分类</Label>
                <Select
                  value={editCategorySelectValue}
                  onValueChange={(v) => {
                    if (v === NEW_CATEGORY_VALUE) {
                      setEditForm({ ...editForm, category: "" });
                      return;
                    }
                    setEditForm({ ...editForm, category: v });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value={NEW_CATEGORY_VALUE}>新增分类</SelectItem>
                  </SelectContent>
                </Select>
                {editCategorySelectValue === NEW_CATEGORY_VALUE ? (
                  <Input
                    placeholder="请输入新分类"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  />
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>分值</Label>
                <Input
                  type="number"
                  value={editForm.score}
                  onChange={(e) => setEditForm({ ...editForm, score: Number(e.target.value) })}
                />
              </div>
            </div>

            {editForm.type === "single" && (
              <div className="space-y-3">
                <Label>选项</Label>
                {["A", "B", "C", "D"].map((opt, idx) => (
                  <div key={opt} className="flex items-center gap-2">
                    <span className="w-6 text-sm font-medium text-muted-foreground">{opt}.</span>
                    <Input
                      value={editForm.options[idx] || ""}
                      onChange={(e) => setOptionValue(setEditForm, editForm, idx, e.target.value)}
                    />
                  </div>
                ))}
                <div className="space-y-2 pt-2">
                  <Label>正确答案</Label>
                  <Select value={editForm.correctAnswer} onValueChange={(v) => setEditForm({ ...editForm, correctAnswer: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择正确答案" />
                    </SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D"].map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          选项 {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {editForm.type === "judge" && (
              <div className="space-y-2">
                <Label>正确答案</Label>
                <Select value={editForm.correctAnswer} onValueChange={(v) => setEditForm({ ...editForm, correctAnswer: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择正确答案" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">正确</SelectItem>
                    <SelectItem value="B">错误</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{editForm.type === "essay" ? "参考答案（可选）" : "解析（可选）"}</Label>
              <Textarea
                rows={3}
                value={editForm.analysis}
                onChange={(e) => setEditForm({ ...editForm, analysis: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
