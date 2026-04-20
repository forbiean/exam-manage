"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { mockQuestions } from "@/lib/mock-data";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Search, Database, Pencil, Trash2, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

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

function getTypeLabel(type: string) {
  switch (type) {
    case "single":
      return "单选题";
    case "judge":
      return "判断题";
    case "essay":
      return "简答题";
    default:
      return type;
  }
}

export default function AdminQuestionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState<string>("single");

  const filtered = mockQuestions.filter((q) => {
    const matchSearch = q.stem.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || q.type === typeFilter;
    return matchSearch && matchType;
  });

  const categories = Array.from(new Set(mockQuestions.map((q) => q.category)));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">题库管理</h1>
            <p className="text-muted-foreground mt-1">管理考试题目，支持单选、判断、简答多种题型</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
                  <Select value={newQuestionType} onValueChange={setNewQuestionType}>
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
                  <Textarea placeholder="请输入题目内容..." rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>分类</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                        <SelectItem value="new">+ 新建分类</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>分值</Label>
                    <Input type="number" placeholder="5" />
                  </div>
                </div>

                {newQuestionType === "single" && (
                  <div className="space-y-3">
                    <Label>选项</Label>
                    {["A", "B", "C", "D"].map((opt, idx) => (
                      <div key={opt} className="flex items-center gap-2">
                        <span className="w-6 text-sm font-medium text-muted-foreground">{opt}.</span>
                        <Input placeholder={`选项 ${opt}`} />
                      </div>
                    ))}
                    <div className="space-y-2 pt-2">
                      <Label>正确答案</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="选择正确答案" />
                        </SelectTrigger>
                        <SelectContent>
                          {["A", "B", "C", "D"].map((opt) => (
                            <SelectItem key={opt} value={opt}>选项 {opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {newQuestionType === "judge" && (
                  <div className="space-y-2">
                    <Label>正确答案</Label>
                    <Select>
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

                {newQuestionType === "essay" && (
                  <div className="space-y-2">
                    <Label>参考答案（可选）</Label>
                    <Textarea placeholder="输入参考答案或评分要点..." rows={3} />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  取消
                </Button>
                <Button onClick={() => setShowCreateDialog(false)}>保存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
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

        {/* Questions List */}
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
                      {q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 ${
                                q.correctAnswer === String.fromCharCode(65 + optIdx)
                                  ? "text-emerald-600 font-medium"
                                  : ""
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="truncate">{opt}</span>
                              {q.correctAnswer === String.fromCharCode(65 + optIdx) && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.type === "judge" && (
                        <div className="flex items-center gap-4 text-sm mb-3">
                          <span
                            className={`flex items-center gap-1 ${
                              q.correctAnswer === "A" ? "text-emerald-600 font-medium" : ""
                            }`}
                          >
                            {q.correctAnswer === "A" ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            正确
                          </span>
                          <span
                            className={`flex items-center gap-1 ${
                              q.correctAnswer === "B" ? "text-emerald-600 font-medium" : ""
                            }`}
                          >
                            {q.correctAnswer === "B" ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            错误
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
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
              {categories.map((cat) => {
                const count = mockQuestions.filter((q) => q.category === cat).length;
                return (
                  <Card key={cat} className="hover:shadow-sm transition-shadow cursor-pointer">
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
