"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  createStudent,
  deleteStudent,
  getStudents,
  importStudentsCsv,
  type StudentRecord,
  updateStudent,
} from "@/lib/admin-students-api";
import { Plus, Search, Upload, UserRound, Trash2, Pencil } from "lucide-react";

type CreateForm = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  studentNo: string;
};

type EditForm = {
  fullName: string;
  email: string;
  phone: string;
  studentNo: string;
  isActive: boolean;
  mustChangePassword: boolean;
};

const emptyCreateForm: CreateForm = {
  username: "",
  password: "",
  fullName: "",
  email: "",
  phone: "",
  studentNo: "",
};

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreateForm);

  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    fullName: "",
    email: "",
    phone: "",
    studentNo: "",
    isActive: true,
    mustChangePassword: false,
  });

  const [importOpen, setImportOpen] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const [importCsvText, setImportCsvText] = useState("");
  const [overwriteImport, setOverwriteImport] = useState(false);
  const [importResult, setImportResult] = useState("");
  const [importParsing, setImportParsing] = useState(false);
  const [previewRows, setPreviewRows] = useState<Array<Record<string, string>>>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [failedRows, setFailedRows] = useState<Array<{ row_no: number; error_message: string | null }>>([]);

  async function fetchStudents(params: { search: string; page: number }) {
    const data = await getStudents({ search: params.search, page: params.page, pageSize });
    setStudents(data.list);
    setTotal(data.pagination.total);
  }

  function buildPreview(csvText: string) {
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      setPreviewHeaders([]);
      setPreviewRows([]);
      return;
    }

    const headers = lines[0].split(",").map((s) => s.trim());
    const rows = lines.slice(1, 6).map((line) => {
      const cols = line.split(",").map((s) => s.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = cols[index] || "";
      });
      return row;
    });

    setPreviewHeaders(headers);
    setPreviewRows(rows);
  }

  async function loadStudents() {
    setLoading(true);
    setError("");
    try {
      await fetchStudents({ search, page });
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function onSearch() {
    setPage(1);
    setLoading(true);
    setError("");
    try {
      await fetchStudents({ search, page: 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function onCreateStudent() {
    try {
      await createStudent(createForm);
      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      setSearch("");
      setPage(1);
      setLoading(true);
      setError("");
      try {
        await fetchStudents({ search: "", page: 1 });
      } finally {
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    }
  }

  function openEdit(student: StudentRecord) {
    setEditing(student);
    setEditForm({
      fullName: student.fullName,
      email: student.email || "",
      phone: student.phone || "",
      studentNo: student.studentNo,
      isActive: student.isActive,
      mustChangePassword: student.mustChangePassword,
    });
  }

  async function onSaveEdit() {
    if (!editing) return;
    try {
      await updateStudent(editing.id, editForm);
      setEditing(null);
      await loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
    }
  }

  async function onDeleteStudent(id: string) {
    const confirmed = window.confirm("确认删除该学生？（实际为禁用）");
    if (!confirmed) return;
    try {
      await deleteStudent(id);
      await loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  }

  async function onImport() {
    if (!importCsvText || !importFileName) {
      setImportResult("请先选择 .csv 或 .xlsx 文件");
      return;
    }

    try {
      const data = await importStudentsCsv({
        fileName: importFileName,
        csvText: importCsvText,
        overwrite: overwriteImport,
      });
      setImportResult(
        `导入完成：新增 ${data.summary.inserted_count}，更新 ${data.summary.updated_count}，失败 ${data.summary.failed_count}`
      );
      const failed = (data.detail || [])
        .filter((item) => !item.imported)
        .map((item) => ({
          row_no: item.row_no,
          error_message: item.error_message,
        }));
      setFailedRows(failed);
      await loadStudents();
    } catch (err) {
      setImportResult(err instanceof Error ? err.message : "导入失败");
      setFailedRows([]);
    }
  }

  async function onChooseImportFile(file: File | null) {
    if (!file) return;
    setImportResult("");
    setFailedRows([]);
    setImportParsing(true);
    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".csv")) {
        const text = await file.text();
        setImportFileName(file.name);
        setImportCsvText(text);
        buildPreview(text);
        return;
      }

      if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const xlsx = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = xlsx.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error("Excel 文件没有可用工作表");
        }
        const sheet = workbook.Sheets[firstSheetName];
        const csv = xlsx.utils.sheet_to_csv(sheet, { FS: ",", RS: "\n" });
        setImportFileName(file.name);
        setImportCsvText(csv);
        buildPreview(csv);
        return;
      }

      throw new Error("仅支持 .csv / .xlsx / .xls 文件");
    } catch (err) {
      setImportFileName("");
      setImportCsvText("");
      setPreviewHeaders([]);
      setPreviewRows([]);
      setImportResult(err instanceof Error ? err.message : "文件解析失败");
    } finally {
      setImportParsing(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">学生管理</h1>
            <p className="text-muted-foreground mt-1">支持新增、编辑、禁用和批量导入学生账号</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-1.5" />
                  批量导入
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>批量导入学生</DialogTitle>
                  <DialogDescription>
                    直接上传 .csv/.xlsx 文件。表头必须包含：username,password,fullName,studentNo（email/phone 可选）
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-2">
                    <Label>选择文件</Label>
                    <Input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => onChooseImportFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {importFileName
                        ? `已选择：${importFileName}${importParsing ? "（解析中...）" : ""}`
                        : "未选择文件"}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={overwriteImport}
                      onChange={(e) => setOverwriteImport(e.target.checked)}
                    />
                    覆盖已存在账号
                  </label>
                  {importResult ? <p className="text-sm text-muted-foreground">{importResult}</p> : null}

                  {previewRows.length > 0 ? (
                    <div className="space-y-2">
                      <Label>数据预览（前 5 行）</Label>
                      <div className="rounded-md border overflow-auto max-h-52">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/50 border-b">
                              {previewHeaders.map((header) => (
                                <th key={header} className="text-left px-2 py-1.5 whitespace-nowrap">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewRows.map((row, index) => (
                              <tr key={index} className="border-b last:border-0">
                                {previewHeaders.map((header) => (
                                  <td key={`${index}-${header}`} className="px-2 py-1.5 whitespace-nowrap">
                                    {row[header] || "-"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  {failedRows.length > 0 ? (
                    <div className="space-y-2">
                      <Label>失败行明细</Label>
                      <div className="rounded-md border overflow-auto max-h-52">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/50 border-b">
                              <th className="text-left px-2 py-1.5">行号</th>
                              <th className="text-left px-2 py-1.5">错误原因</th>
                            </tr>
                          </thead>
                          <tbody>
                            {failedRows.map((row) => (
                              <tr key={row.row_no} className="border-b last:border-0">
                                <td className="px-2 py-1.5">{row.row_no}</td>
                                <td className="px-2 py-1.5">{row.error_message || "未知错误"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportOpen(false)}>
                    关闭
                  </Button>
                  <Button onClick={onImport} disabled={importParsing || !importFileName}>
                    执行导入
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-1.5" />
                  新增学生
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新增学生账号</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 py-2">
                  <Input
                    placeholder="账号 username"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  />
                  <Input
                    placeholder="初始密码"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  />
                  <Input
                    placeholder="姓名"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  />
                  <Input
                    placeholder="学号"
                    value={createForm.studentNo}
                    onChange={(e) => setCreateForm({ ...createForm, studentNo: e.target.value })}
                  />
                  <Input
                    placeholder="邮箱（可选）"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                  <Input
                    placeholder="手机号（可选）"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={onCreateStudent}>创建</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="搜索账号 / 姓名 / 学号"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={onSearch}>
                查询
              </Button>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left px-3 py-2">账号</th>
                    <th className="text-left px-3 py-2">姓名</th>
                    <th className="text-left px-3 py-2">学号</th>
                    <th className="text-left px-3 py-2">联系方式</th>
                    <th className="text-left px-3 py-2">状态</th>
                    <th className="text-right px-3 py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="px-3 py-2">{s.username}</td>
                      <td className="px-3 py-2">{s.fullName}</td>
                      <td className="px-3 py-2">{s.studentNo}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {s.email || "-"} / {s.phone || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {s.isActive ? <Badge>启用</Badge> : <Badge variant="secondary">禁用</Badge>}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => onDeleteStudent(s.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && students.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <UserRound className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  暂无学生数据
                </div>
              ) : null}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <Separator className="mb-2" />
              <p>CSV 表头格式：username,password,fullName,email,phone,studentNo</p>
              <p>删除操作为软删除（账号置为禁用），便于审计和恢复。</p>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                共 {total} 条，当前第 {page} / {totalPages} 页
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑学生</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-3 py-2">
              <Input
                placeholder="姓名"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              />
              <Input
                placeholder="学号"
                value={editForm.studentNo}
                onChange={(e) => setEditForm({ ...editForm, studentNo: e.target.value })}
              />
              <Input
                placeholder="邮箱"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
              <Input
                placeholder="手机号"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                />
                启用账号
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.mustChangePassword}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      mustChangePassword: e.target.checked,
                    })
                  }
                />
                下次登录强制改密
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                取消
              </Button>
              <Button onClick={onSaveEdit}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
