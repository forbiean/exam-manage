"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { getAdminSubmissions } from "@/lib/admin-submissions-api";
import type { SubmissionRecord } from "@/lib/student-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ClipboardList, User, Loader2 } from "lucide-react";

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

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
                        <Button variant="ghost" size="sm" disabled>
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
    </AdminLayout>
  );
}

