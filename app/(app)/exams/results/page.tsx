"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useSyncExternalStore } from "react";
import {
  ExamResultView,
  examResultKey,
  parseExamResult,
} from "@/components/exam-result";
import { Icon } from "@/components/icon";
import { EmptyState, LinkButton, Spinner } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";

const subscribe = () => () => {};
const serverSnapshot = () => null;

function ResultsContent() {
  const { user, loading } = useRequireAuth();
  const attemptId = useSearchParams().get("attempt");
  const serialized = useSyncExternalStore(
    subscribe,
    () => {
      if (!user) return null;
      try {
        return sessionStorage.getItem(examResultKey(user.id, attemptId));
      } catch {
        return null;
      }
    },
    serverSnapshot,
  );
  const result = useMemo(() => parseExamResult(serialized), [serialized]);

  if (loading || !user) return <Spinner />;

  return (
    <div className="page-wrap max-w-3xl! space-y-6">
      <LinkButton href="/exams" variant="ghost" className="-ml-4">
        <Icon name="back" size={16} /> Kiểm tra từ vựng
      </LinkButton>
      {result ? (
        <>
          <ExamResultView result={result} />
          <p className="text-center text-xs leading-5 text-muted">
            Kết quả bài làm trong phiên hiện tại. Bạn có thể xem lại tại đây
            trước khi đóng tab.
          </p>
        </>
      ) : (
        <EmptyState
          title="Chưa có kết quả trong phiên này"
          description="Hoàn thành một bài kiểm tra để xem điểm và các đáp án tại đây. Kết quả xem lại trên trang này được giữ trong tab hiện tại."
        >
          <LinkButton href="/exams">
            <Icon name="target" size={16} /> Làm bài kiểm tra
          </LinkButton>
        </EmptyState>
      )}
    </div>
  );
}

export default function ExamResultsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ResultsContent />
    </Suspense>
  );
}
