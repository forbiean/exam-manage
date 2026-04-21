"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExamById, getQuestionsByIds } from "@/lib/mock-data";
import type { Question } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Clock,
  ChevronLeft,
  Flag,
  Send,
  AlertCircle,
  CheckCircle2,
  Circle,
  Grid3X3,
  Loader2,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
} from "lucide-react";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function QuestionTypeLabel({ type }: { type: string }) {
  switch (type) {
    case "single":
      return (
        <Badge variant="outline" className="text-xs font-normal border-blue-200 text-blue-600 bg-blue-50">
          单选题
        </Badge>
      );
    case "judge":
      return (
        <Badge variant="outline" className="text-xs font-normal border-purple-200 text-purple-600 bg-purple-50">
          判断题
        </Badge>
      );
    case "essay":
      return (
        <Badge variant="outline" className="text-xs font-normal border-amber-200 text-amber-600 bg-amber-50">
          简答题
        </Badge>
      );
    default:
      return null;
  }
}

function useExamLoader(examId: string) {
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ReturnType<typeof getExamById>>(undefined);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      if (cancelled) return;
      const e = getExamById(examId);
      setExam(e);
      setQuestions(e?.questions ? getQuestionsByIds(e.questions) : []);
      setLoading(false);
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [examId]);

  return { loading, exam, questions };
}

export default function ExamTakingClient() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const { loading, exam, questions } = useExamLoader(examId);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!exam) return;
    const totalSeconds = exam.durationMinutes * 60;
    setTimeLeft(totalSeconds);
  }, [exam]);

  useEffect(() => {
    if (!exam || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowTimeUpDialog(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, timeLeft]);

  const handleAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const toggleFlag = useCallback((questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setShowSubmitDialog(false);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitted(true);
    setSubmitting(false);
    setTimeout(() => {
      router.push("/student/history");
    }, 2000);
  }, [router]);

  const handleTimeUpSubmit = useCallback(async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setSubmitting(false);
    setTimeout(() => {
      router.push("/student/history");
    }, 2000);
  }, [router]);

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((k) => answers[k]?.trim?.()).length,
    [answers]
  );
  const totalQuestions = questions.length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const isTimeLow = timeLeft < 300 && timeLeft > 0;
  const isTimeCritical = timeLeft < 60 && timeLeft > 0;

  if (loading) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">正在加载试卷</h2>
            <p className="text-sm text-muted-foreground mt-1">请稍候，正在准备考试环境...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-full flex items-center justify-center bg-background px-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-10 pb-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">考试不存在</h1>
              <p className="text-sm text-muted-foreground mt-1">该考试可能已被删除或未发布</p>
            </div>
            <Button className="mt-2" onClick={() => router.push("/student/exams")}>
              返回考试列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-full flex items-center justify-center bg-background px-4">
        <Card className="max-w-sm w-full border-none shadow-lg">
          <CardContent className="pt-12 pb-12 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto ring-4 ring-emerald-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">试卷已提交</h2>
              <p className="text-muted-foreground mt-2">感谢您的参与，成绩将在评阅后公布</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              即将跳转到历史成绩页...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">正在提交试卷</h2>
            <p className="text-sm text-muted-foreground mt-1">请稍候，正在保存您的答案...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-full flex flex-col bg-background">
      {/* Top Bar */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => router.push("/student/exams")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Separator orientation="vertical" className="h-5 hidden sm:block" />
            <h1 className="font-semibold text-sm truncate max-w-[140px] sm:max-w-xs">
              {exam.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Progress - hidden on small screens */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                已答 {answeredCount}/{totalQuestions}
              </span>
              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Timer */}
            <div
              className={`flex items-center gap-1.5 text-sm font-mono font-semibold px-2.5 py-1 rounded-md transition-colors ${
                isTimeCritical
                  ? "bg-red-50 text-red-600 animate-pulse"
                  : isTimeLow
                    ? "bg-amber-50 text-amber-600"
                    : "bg-muted text-foreground"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {formatTime(timeLeft)}
            </div>

            {/* Mobile answer sheet trigger */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden gap-1.5">
                  <Grid3X3 className="w-3.5 h-3.5" />
                  答题卡
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[340px]">
                <SheetHeader>
                  <SheetTitle>答题卡</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <AnswerSheet
                    questions={questions}
                    answers={answers}
                    flagged={flagged}
                    currentIndex={currentIndex}
                    onSelect={setCurrentIndex}
                    onClose={() => setSheetOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Button size="sm" onClick={() => setShowSubmitDialog(true)}>
              交卷
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Question Area */}
        <div className="space-y-5 min-w-0">
          {currentQuestion ? (
            <>
              <Card className="border shadow-sm">
                <CardContent className="p-5 sm:p-7">
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        第 {currentIndex + 1} 题
                      </span>
                      <QuestionTypeLabel type={currentQuestion.type} />
                      <span className="text-xs text-muted-foreground">
                        {currentQuestion.score} 分
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFlag(currentQuestion.id)}
                      className={
                        flagged.has(currentQuestion.id)
                          ? "text-amber-500 bg-amber-50 hover:bg-amber-100 hover:text-amber-600"
                          : "text-muted-foreground"
                      }
                    >
                      <Flag className="w-3.5 h-3.5 mr-1" />
                      {flagged.has(currentQuestion.id) ? "已标记" : "标记"}
                    </Button>
                  </div>

                  {/* Stem */}
                  <h2 className="text-base sm:text-lg font-medium leading-relaxed mb-6">
                    {currentQuestion.stem}
                  </h2>

                  {/* Single Choice */}
                  {currentQuestion.type === "single" && currentQuestion.options && (
                    <div className="space-y-2.5">
                      {currentQuestion.options.map((opt, idx) => {
                        const value = String.fromCharCode(65 + idx);
                        const selected = answers[currentQuestion.id] === value;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleAnswer(currentQuestion.id, value)}
                            className={`group w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                              selected
                                ? "border-primary bg-primary/[0.03] shadow-sm"
                                : "border-transparent bg-muted/40 hover:bg-muted hover:border-muted-foreground/20"
                            }`}
                          >
                            <div className="flex items-start gap-3.5">
                              <span
                                className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all ${
                                  selected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/25 text-muted-foreground group-hover:border-muted-foreground/40"
                                }`}
                              >
                                {value}
                              </span>
                              <span className="pt-0.5 text-sm sm:text-base leading-relaxed">
                                {opt}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Judge */}
                  {currentQuestion.type === "judge" && (
                    <div className="flex gap-3 sm:gap-4">
                      {[
                        { value: "A", label: "正确", icon: CheckCircle2 },
                        { value: "B", label: "错误", icon: Circle },
                      ].map((opt) => {
                        const selected = answers[currentQuestion.id] === opt.value;
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                            className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                              selected
                                ? "border-primary bg-primary/[0.03] shadow-sm"
                                : "border-transparent bg-muted/40 hover:bg-muted hover:border-muted-foreground/20"
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${selected ? "text-primary" : "text-muted-foreground"}`}
                            />
                            <span
                              className={`font-medium ${selected ? "text-primary" : "text-foreground"}`}
                            >
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay */}
                  {currentQuestion.type === "essay" && (
                    <Textarea
                      placeholder="请输入您的答案..."
                      rows={8}
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                      className="resize-y min-h-[180px] text-sm sm:text-base leading-relaxed"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => i - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一题
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(0)}
                  >
                    <ChevronFirst className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {currentIndex + 1} / {totalQuestions}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentIndex === totalQuestions - 1}
                    onClick={() => setCurrentIndex(totalQuestions - 1)}
                  >
                    <ChevronLast className="w-4 h-4" />
                  </Button>
                </div>

                {currentIndex === totalQuestions - 1 ? (
                  <Button size="sm" onClick={() => setShowSubmitDialog(true)} className="gap-1">
                    <Send className="w-3.5 h-3.5" />
                    交卷
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentIndex((i) => i + 1)}
                    className="gap-1"
                  >
                    下一题
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-20 text-center text-muted-foreground">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>该考试暂无题目</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Desktop Sidebar - Answer Sheet */}
        <div className="hidden lg:block">
          <div className="sticky top-[72px]">
            <AnswerSheet
              questions={questions}
              answers={answers}
              flagged={flagged}
              currentIndex={currentIndex}
              onSelect={setCurrentIndex}
            />
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              确认交卷
            </DialogTitle>
            <DialogDescription>交卷后无法修改答案，请确认是否已完成所有题目。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-foreground">{answeredCount}</p>
                <p className="text-xs text-muted-foreground mt-1">已答题</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-foreground">
                  {totalQuestions - answeredCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">未答题</p>
              </div>
            </div>
            {answeredCount < totalQuestions && (
              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>还有 {totalQuestions - answeredCount} 题未作答，建议先完成所有题目。</span>
              </div>
            )}
            {flagged.size > 0 && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <Flag className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>您标记了 {flagged.size} 道题，交卷前可以回头检查。</span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              继续答题
            </Button>
            <Button onClick={handleSubmit}>确认交卷</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Up Dialog */}
      <Dialog open={showTimeUpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              考试时间已到
            </DialogTitle>
            <DialogDescription>系统将自动提交您的答案，请确认。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleTimeUpSubmit} className="w-full sm:w-auto">
              确定并提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Answer Sheet Component */
function AnswerSheet({
  questions,
  answers,
  flagged,
  currentIndex,
  onSelect,
  onClose,
}: {
  questions: Question[];
  answers: Record<string, string>;
  flagged: Set<string>;
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose?: () => void;
}) {
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim?.()).length;

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">答题卡</h3>
          <span className="text-xs text-muted-foreground">
            {answeredCount}/{questions.length}
          </span>
        </div>

        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">暂无题目</p>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id]?.trim?.();
                const isFlagged = flagged.has(q.id);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      onSelect(idx);
                      onClose?.();
                    }}
                    className={`relative w-full aspect-square rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-200 ${
                      isCurrent
                        ? "ring-2 ring-primary ring-offset-1 bg-primary text-primary-foreground shadow-sm"
                        : isAnswered
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-muted text-muted-foreground border border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-card" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-200" />
                已答
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-muted border border-transparent" />
                未答
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary" />
                当前
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                标记
              </span>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">完成进度</span>
                <span className="font-semibold">
                  {Math.round((answeredCount / Math.max(questions.length, 1)) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
