"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import { Button, Card, ErrorNote, PageHeading, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { submitOnboarding, useOnboarding } from "@/lib/hooks";
import type {
  OnboardingGoal,
  OnboardingProfile,
  SubmitOnboardingInput,
} from "@/lib/types";

const GOALS: { key: OnboardingGoal; label: string; icon: IconName }[] = [
  { key: "TRAVEL", label: "Du lịch, giao tiếp cơ bản", icon: "route" },
  { key: "WORK", label: "Phục vụ công việc", icon: "chart" },
  { key: "EXAM", label: "Thi lấy chứng chỉ HSK", icon: "trophy" },
  { key: "ACADEMIC", label: "Du học", icon: "book" },
  { key: "INTEREST", label: "Sở thích, tìm hiểu văn hoá", icon: "heart" },
  { key: "OTHER", label: "Mục tiêu khác", icon: "spark" },
];

const LEVELS = Array.from({ length: 9 }, (_, i) => i + 1);

/** Khảo sát làm xong TRƯỚC khi có tài khoản (kiểu Duolingo) được giữ tạm ở
 * đây, đăng ký xong quay lại trang này thì tự nộp — xem hàm submit() trong
 * OnboardingWizard và effect tự nộp trong OnboardingPage. */
const PENDING_KEY = "hanni:pending-onboarding";

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const onboarding = useOnboarding(Boolean(user));
  const [result, setResult] = useState<OnboardingProfile | null>(null);
  const [redo, setRedo] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [autoSubmitError, setAutoSubmitError] = useState<string | null>(null);

  // Vừa đăng ký xong từ luồng khảo sát ẩn danh -> tự nộp dữ liệu đã lưu tạm,
  // không bắt làm lại 3 bước.
  useEffect(() => {
    if (
      !user ||
      onboarding.isLoading ||
      onboarding.data ||
      result ||
      autoSubmitting
    )
      return;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(PENDING_KEY);
    } catch {
      /* trình duyệt có thể chặn sessionStorage */
    }
    if (!raw) return;
    setAutoSubmitting(true);
    submitOnboarding(JSON.parse(raw) as SubmitOnboardingInput)
      .then((profile) => setResult(profile))
      .catch(() =>
        setAutoSubmitError(
          "Chưa lưu được lộ trình vừa khảo sát — bạn làm lại giúp mình nhé.",
        ),
      )
      .finally(() => {
        try {
          sessionStorage.removeItem(PENDING_KEY);
        } catch {
          /* không sao, chỉ là dọn rác */
        }
        setAutoSubmitting(false);
      });
  }, [user, onboarding.isLoading, onboarding.data, result, autoSubmitting]);

  if (authLoading || (user && onboarding.isLoading) || autoSubmitting) {
    return (
      <OnboardingShell authenticated={Boolean(user)}>
        <Spinner />
      </OnboardingShell>
    );
  }

  const finalProfile = result ?? (!redo ? (onboarding.data ?? null) : null);

  return (
    <OnboardingShell authenticated={Boolean(user)}>
      {finalProfile ? (
        <ResultScreen
          profile={finalProfile}
          onRedo={() => {
            setResult(null);
            setRedo(true);
          }}
        />
      ) : (
        <OnboardingWizard
          authenticated={Boolean(user)}
          errorBanner={autoSubmitError}
          onDone={(profile) => {
            setResult(profile);
            setRedo(false);
          }}
        />
      )}
    </OnboardingShell>
  );
}

/** Khung tối giản, không mượn sidebar/topbar của app — kiểu quiz Duolingo,
 * tập trung, không phân tán chú ý trước khi có tài khoản. */
function OnboardingShell({
  authenticated,
  children,
}: {
  authenticated: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-surface">
        <div className="page-wrap flex items-center justify-between py-4!">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/favicon.ico"
              alt=""
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 rounded-lg"
            />
            <span className="text-base font-bold tracking-tight">
              Hanni<span className="text-primary">.</span>
            </span>
          </Link>
          {authenticated ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted hover:text-primary"
            >
              Bỏ qua, làm sau
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-muted hover:text-primary"
            >
              Đã có tài khoản? Đăng nhập
            </Link>
          )}
        </div>
      </div>
      <div className="py-8">{children}</div>
    </div>
  );
}

type Step = 1 | 2 | 3;

function OnboardingWizard({
  authenticated,
  errorBanner,
  onDone,
}: {
  authenticated: boolean;
  errorBanner: string | null;
  onDone: (profile: OnboardingProfile) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [hasStudiedBefore, setHasStudiedBefore] = useState<boolean | null>(
    null,
  );
  const [selfAssessedLevel, setSelfAssessedLevel] = useState<number | null>(
    null,
  );
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [plansToTakeExam, setPlansToTakeExam] = useState<boolean | null>(
    null,
  );
  const [targetLevel, setTargetLevel] = useState<number | null>(null);
  const [targetDate, setTargetDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (hasStudiedBefore === null || !goal || plansToTakeExam === null)
      return;
    const input: SubmitOnboardingInput = {
      hasStudiedBefore,
      selfAssessedLevel: hasStudiedBefore
        ? (selfAssessedLevel ?? undefined)
        : undefined,
      goal,
      plansToTakeExam,
      targetLevel: plansToTakeExam ? (targetLevel ?? undefined) : undefined,
      targetDate: plansToTakeExam && targetDate ? targetDate : undefined,
    };
    setBusy(true);
    setError(null);
    try {
      if (authenticated) {
        const profile = await submitOnboarding(input);
        onDone(profile);
      } else {
        // Chưa có tài khoản: lưu tạm rồi qua đăng ký, đăng ký xong quay lại
        // trang này (xem effect tự nộp trong OnboardingPage) mới thật sự lưu.
        sessionStorage.setItem(PENDING_KEY, JSON.stringify(input));
        router.push("/register");
      }
    } catch {
      setError("Chưa lưu được khảo sát. Bạn thử lại nhé.");
      setBusy(false);
    }
  }

  return (
    <div className="page-wrap max-w-2xl space-y-6">
      <PageHeading
        icon="route"
        eyebrow="1 PHÚT ĐỂ HANNI HIỂU BẠN HƠN"
        title="Cùng lên lộ trình học phù hợp"
        description="Vài câu hỏi ngắn để gợi ý cấp HSK nên bắt đầu và nhịp học phù hợp mục tiêu của bạn."
      />

      {errorBanner && <ErrorNote>{errorBanner}</ErrorNote>}
      {error && <ErrorNote>{error}</ErrorNote>}

      {step === 1 && (
        <Card className="space-y-5">
          <h2 className="font-semibold">Bạn đã học tiếng Trung/HSK trước đây chưa?</h2>
          <div className="grid grid-cols-2 gap-3">
            <ChoiceButton
              active={hasStudiedBefore === true}
              onClick={() => setHasStudiedBefore(true)}
            >
              Rồi, có học qua
            </ChoiceButton>
            <ChoiceButton
              active={hasStudiedBefore === false}
              onClick={() => {
                setHasStudiedBefore(false);
                setSelfAssessedLevel(null);
              }}
            >
              Chưa, mới bắt đầu
            </ChoiceButton>
          </div>
          {hasStudiedBefore && (
            <div>
              <p className="mb-3 text-sm text-muted">
                Bạn tự đánh giá đã học tới khoảng cấp nào?
              </p>
              <LevelGrid value={selfAssessedLevel} onChange={setSelfAssessedLevel} />
            </div>
          )}
          <div className="flex justify-end">
            <Button
              disabled={
                hasStudiedBefore === null ||
                (hasStudiedBefore && !selfAssessedLevel)
              }
              onClick={() => setStep(2)}
            >
              Tiếp tục <Icon name="arrow" size={16} />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-5">
          <h2 className="font-semibold">Mục tiêu chính của bạn là gì?</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {GOALS.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setGoal(g.key)}
                aria-pressed={goal === g.key}
                className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center text-xs font-medium transition-colors ${
                  goal === g.key
                    ? "border-primary/40 bg-primary/8 text-primary"
                    : "border-border bg-surface text-muted hover:text-foreground"
                }`}
              >
                <Icon name={g.icon} size={20} />
                {g.label}
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>
              <Icon name="back" size={16} /> Quay lại
            </Button>
            <Button disabled={!goal} onClick={() => setStep(3)}>
              Tiếp tục <Icon name="arrow" size={16} />
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-5">
          <h2 className="font-semibold">Bạn có dự định thi HSK không?</h2>
          <div className="grid grid-cols-2 gap-3">
            <ChoiceButton
              active={plansToTakeExam === true}
              onClick={() => setPlansToTakeExam(true)}
            >
              Có, đang nhắm tới
            </ChoiceButton>
            <ChoiceButton
              active={plansToTakeExam === false}
              onClick={() => {
                setPlansToTakeExam(false);
                setTargetLevel(null);
                setTargetDate("");
              }}
            >
              Chưa, học từ từ thôi
            </ChoiceButton>
          </div>
          {plansToTakeExam && (
            <div className="space-y-4">
              <div>
                <p className="mb-3 text-sm text-muted">Bạn muốn thi cấp nào?</p>
                <LevelGrid value={targetLevel} onChange={setTargetLevel} />
              </div>
              <div>
                <label
                  htmlFor="onboarding-target-date"
                  className="mb-2 block text-sm text-muted"
                >
                  Hạn thi dự kiến (không bắt buộc)
                </label>
                <input
                  id="onboarding-target-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="field max-w-xs"
                />
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(2)}>
              <Icon name="back" size={16} /> Quay lại
            </Button>
            <Button
              disabled={
                plansToTakeExam === null ||
                (plansToTakeExam && !targetLevel) ||
                busy
              }
              onClick={() => void submit()}
            >
              {busy
                ? "Đang lưu…"
                : authenticated
                  ? "Xem lộ trình đề xuất"
                  : "Tạo tài khoản để xem lộ trình"}
              <Icon name={authenticated ? "check" : "arrow"} size={16} />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-14 rounded-xl border px-4 text-sm font-semibold transition-colors ${
        active
          ? "border-primary/40 bg-primary/8 text-primary"
          : "border-border bg-surface text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function LevelGrid({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (level: number) => void;
}) {
  return (
    <div className="grid grid-cols-9 gap-2">
      {LEVELS.map((lv) => (
        <button
          key={lv}
          type="button"
          onClick={() => onChange(lv)}
          aria-pressed={value === lv}
          className={`min-h-11 rounded-lg text-sm font-semibold transition-colors ${
            value === lv
              ? "bg-primary text-primary-fg"
              : "bg-surface-2 text-muted hover:text-foreground"
          }`}
        >
          {lv}
        </button>
      ))}
    </div>
  );
}

function ResultScreen({
  profile,
  onRedo,
}: {
  profile: OnboardingProfile;
  onRedo: () => void;
}) {
  const router = useRouter();
  return (
    <div className="page-wrap max-w-2xl space-y-6">
      <PageHeading
        icon="route"
        eyebrow="LỘ TRÌNH ĐỀ XUẤT CHO BẠN"
        title={`Bắt đầu từ HSK ${profile.recommendedLevel}`}
        description="Dựa trên câu trả lời của bạn — có thể làm lại khảo sát bất cứ lúc nào."
      />
      <Card className="space-y-5">
        <p className="whitespace-pre-line text-sm leading-6">
          {profile.recommendationVi}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() =>
              router.push(`/learn?level=${profile.recommendedLevel}`)
            }
          >
            Bắt đầu học HSK {profile.recommendedLevel}
            <Icon name="arrow" size={16} />
          </Button>
          <Link
            href="/dashboard"
            className="motion-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-2"
          >
            Vào trang chủ
          </Link>
          <Button variant="ghost" onClick={onRedo}>
            Làm lại khảo sát
          </Button>
        </div>
      </Card>
    </div>
  );
}
