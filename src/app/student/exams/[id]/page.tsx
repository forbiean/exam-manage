import { mockExams } from "@/lib/mock-data";
import ExamTakingClient from "./ExamTakingClient";

export function generateStaticParams() {
  return mockExams.map((exam) => ({
    id: exam.id,
  }));
}

export default function ExamTakingPage() {
  return <ExamTakingClient />;
}
