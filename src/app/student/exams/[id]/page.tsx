"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExamById, getQuestionsByIds } from "@/lib/mock-data";
import type { Question } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, ChevronLeft, Flag, Send, AlertCircle } from "lucide-react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function QuestionTypeLabel({ type }: { type: string }) {
  switch (type) {
    case "single":
      return <Badge variant="secondary" className="text-xs">单选题</Badge>;
    case "judge":
      return <Badge variant="secondary" className="text-xs">判断题</Badge>;
    case "essay":
      return <Badge variant="secondary" className="text-xs">简答题</Badge>;
    default:
      return null;
  }
}

export default function ExamTakingPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const exam = getExamById(examId);
  const questions: Question[] = exam?.questions ? getQuestionsByIds(exam.questions) : [];

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exam?.durationMinutes ? exam.durationMinutes * 60 : 0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!exam) return;
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
  }, [exam]);

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

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    setShowSubmitDialog(false);
    setTimeout(() => {
      router.push("/student/history");
    }, 2000);
  }, [router]);

  if (!exam) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold">考试不存在</h1>
          <p className="text-muted-foreground mt-2">该考试可能已被删除或未发布</p>
          <Button className="mt-6" onClick={() => router.push("/student/exams")}>
            返回考试列表
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-full flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">试卷已提交</h2>
            <p className="text-muted-foreground">感谢您的参与，成绩将在评阅后公布</p>
            <p className="text-sm text-muted-foreground mt-4">即将跳转到历史成绩页...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

  return (
    <div className="min-h-full flex flex-col bg-background">
      {/* Top Bar */}
      <header className="border-b bg-card/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/student/exams")}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              退出
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="font-semibold text-sm truncate max-w-[200px] sm:max-w-md">
              {exam.title}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 text-sm font-mono font-medium ${
              timeLeft < 300 ? "text-destructive" : "text-foreground"
            }`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
            <Button size="sm" onClick={() => setShowSubmitDialog(true)}>
              交卷
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Question Area */}
        <div className="space-y-6">
          {currentQuestion && (
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      第 {currentIndex + 1} 题
                    </span>
                    <QuestionTypeLabel type={currentQuestion.type} />
                    <span className="text-sm text-muted-foreground">
                      ({currentQuestion.score} 分)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={flagged.has(currentQuestion.id) ? "text-amber-500" : ""}
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    {flagged.has(currentQuestion.id) ? "已标记" : "标记"}
                  </Button>
                </div>

                <h2 className="text-lg font-medium leading-relaxed mb-6">
                  {currentQuestion.stem}
                </h2>

                {currentQuestion.type === "single" && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt, idx) => {
                      const value = String.fromCharCode(65 + idx);
                      const selected = answers[currentQuestion.id] === value;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(currentQuestion.id, value)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-sm font-medium ${
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30"
                            }`}>
                              {value}
                            </span>
                            <span className="pt-0.5">{opt}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === "judge" && (
                  <div className="flex gap-4">
                    {[
                      { value: "A", label: "正确" },
                      { value: "B", label: "错误" },
                    ].map((opt) => {
                      const selected = answers[currentQuestion.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                          className={`flex-1 text-center p-4 rounded-lg border transition-all ${
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                          }`}
                        >
                          <span className="font-medium">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === "essay" && (
                  <textarea
                    className="w-full min-h-[200px] p-4 rounded-lg border border-border bg-background resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="请输入您的答案..."
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
            >
              上一题
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {totalQuestions}
            </span>
            <Button
              variant="outline"
              disabled={currentIndex === totalQuestions - 1}
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              下一题
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <Card className="border shadow-sm sticky top-20">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-4">答题卡</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isFlagged = flagged.has(q.id);
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative w-full aspect-square rounded-md text-sm font-medium flex items-center justify-center transition-all ${
                        isCurrent
                          ? "ring-2 ring-primary bg-primary text-primary-foreground"
                          : isAnswered
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-emerald-100" />
                  已答
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-muted" />
                  未答
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-amber-400" />
                  标记
                </span>
              </div>
              <Separator className="my-4" />
              <div className="text-sm">
                <p className="text-muted-foreground">
                  已答 <span className="font-semibold text-foreground">{answeredCount}</span> /{" "}
                  {totalQuestions} 题
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认交卷？</DialogTitle>
            <DialogDescription>
              交卷后无法修改答案，请确认是否已完成所有题目。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
              <span>已答题数</span>
              <span className="font-semibold">
                {answeredCount} / {totalQuestions}
              </span>
            </div>
            {answeredCount < totalQuestions && (
              <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                还有 {totalQuestions - answeredCount} 题未作答
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              继续答题
            </Button>
            <Button onClick={handleSubmit}>确认交卷</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Up Dialog */}
      <Dialog open={showTimeUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>考试时间已到</DialogTitle>
            <DialogDescription>系统将自动提交您的答案。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleSubmit}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
