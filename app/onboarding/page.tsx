"use client";

/**
 * BẢN ĐỒ TRANG — KHẢO SÁT ĐẦU VÀO (/onboarding) — 3 câu → lộ trình đề xuất (khách làm được)
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: sổ tay thuyết trình (tab Tra cứu).
 *
 *   GET /onboarding           ← useOnboarding() ở lib/hooks.ts (← chính trang này)
 *                               → server: modules/onboarding/onboarding.controller.ts → OnboardingService.get()
 *   POST /onboarding          ← submitOnboarding() ở lib/hooks.ts (← chính trang này)
 *                               → server: modules/onboarding/onboarding.controller.ts → OnboardingService.submit()
 *   POST /onboarding/preview  ← previewOnboarding() ở lib/hooks.ts (← chính trang này)
 *                               → server: modules/onboarding/onboarding.controller.ts → OnboardingService.preview()
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import { Button, ErrorNote, LinkButton, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  previewOnboarding,
  submitOnboarding,
  useOnboarding,
} from "@/lib/hooks";
import type {
  OnboardingGoal,
  OnboardingPlan,
  SubmitOnboardingInput,
} from "@/lib/types";
import styles from "./onboarding.module.css";

/**
 * Khảo sát 3 câu (làm lại 2026-10-18 — user: "mục đích, câu hỏi, luồng trả lời
 * rõ ràng, dễ điền"). Mỗi câu hỏi có tác dụng THẬT và hiện thành 1 dòng ở màn
 * kết quả: trình độ → bài bắt đầu; mục tiêu → lộ trình tới kỳ thi hoặc cách
 * luyện nên thử; thời gian mỗi ngày → mục tiêu ngày (phút). Trước đó câu "mục
 * tiêu" không đổi gì trong app, còn mục tiêu ngày lại không được hỏi.
 */

const GOALS: { key: OnboardingGoal; label: string; hint: string; icon: IconName }[] = [
  { key: "EXAM", label: "Thi chứng chỉ HSK", hint: "Chia lộ trình theo ngày thi", icon: "trophy" },
  { key: "TRAVEL", label: "Giao tiếp, du lịch", hint: "Nói được câu thường ngày", icon: "route" },
  { key: "WORK", label: "Công việc", hint: "Trao đổi với đối tác, đồng nghiệp", icon: "chart" },
  { key: "ACADEMIC", label: "Du học", hint: "Cần chứng chỉ HSK để nộp hồ sơ", icon: "book" },
  { key: "INTEREST", label: "Phim ảnh, văn hoá", hint: "Học vì thích", icon: "heart" },
  { key: "OTHER", label: "Lý do khác", hint: "Chỉ cần học đều mỗi ngày", icon: "spark" },
];

/** Gợi ý cách luyện theo mục tiêu (mục tiêu thi HSK có dòng lộ trình riêng). */
const GOAL_SUGGESTION: Record<
  Exclude<OnboardingGoal, "EXAM">,
  { label: string; detail: string; href: string; guest: boolean }
> = {
  TRAVEL: { label: "Luyện nói với AI", detail: "gọi món, hỏi đường, mua sắm như thật", href: "/roleplay", guest: false },
  WORK: { label: "Luyện nói với AI", detail: "luyện phản xạ trao đổi bằng tiếng Trung", href: "/roleplay", guest: false },
  ACADEMIC: { label: "Đề thi thử HSK", detail: "làm thử 1 đề để biết mình đang ở đâu", href: "/thi-thu-hsk", guest: true },
  INTEREST: { label: "Học qua video", detail: "phim ngắn có phụ đề song ngữ, bấm từ để tra", href: "/watch", guest: false },
  OTHER: { label: "Luyện tập", detail: "nghe, nói, viết, trò chơi — chọn cách bạn thích", href: "/luyen-tap", guest: false },
};

/** Cấp 7 = HSK 7–9 (dữ liệu bài học gộp 3 cấp này). */
const LEVELS: { value: number; label: string; hint: string }[] = [
  { value: 1, label: "HSK 1", hint: "Nhập môn" },
  { value: 2, label: "HSK 2", hint: "Nền tảng" },
  { value: 3, label: "HSK 3", hint: "Giao tiếp" },
  { value: 4, label: "HSK 4", hint: "Trung cấp" },
  { value: 5, label: "HSK 5", hint: "Mở rộng" },
  { value: 6, label: "HSK 6", hint: "Khá tốt" },
  { value: 7, label: "HSK 7–9", hint: "Nâng cao" },
];

const EXAM_WINDOWS: { value: number; label: string; hint: string }[] = [
  { value: 3, label: "3 tháng", hint: "≈ 13 tuần" },
  { value: 6, label: "6 tháng", hint: "≈ 26 tuần" },
  { value: 12, label: "1 năm", hint: "≈ 52 tuần" },
  { value: 0, label: "Chưa rõ", hint: "chưa có ngày" },
];

const DAILY_MINUTES: { value: number; label: string; hint: string }[] = [
  { value: 5, label: "5 phút", hint: "Nhẹ nhàng" },
  { value: 10, label: "10 phút", hint: "Vừa phải" },
  { value: 15, label: "15 phút", hint: "Chăm chỉ" },
  { value: 20, label: "20 phút", hint: "Tăng tốc" },
];

const levelName = (level: number) => (level >= 7 ? "7–9" : String(level));

/** Khảo sát làm xong TRƯỚC khi có tài khoản (kiểu Duolingo) được giữ tạm ở
 * đây, đăng ký xong quay lại trang này thì tự nộp — xem hàm submit() trong
 * OnboardingWizard và effect tự nộp trong OnboardingPage. */
const PENDING_KEY = "hanni:pending-onboarding";

/** Đủ để vẽ màn kết quả — cả hồ sơ đã lưu lẫn kết quả tính thử của khách. */
type ResultData = {
  recommendedLevel: number;
  recommendationVi: string;
  goal: OnboardingGoal;
  plan?: OnboardingPlan;
};

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const onboarding = useOnboarding(Boolean(user));
  const [result, setResult] = useState<ResultData | null>(null);
  const [preview, setPreview] = useState<ResultData | null>(null);
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
          data={finalProfile}
          onRedo={() => {
            setResult(null);
            setRedo(true);
          }}
        />
      ) : preview ? (
        <ResultScreen
          data={preview}
          guest
          onRedo={() => {
            setPreview(null);
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
          onPreview={(p) => {
            setPreview(p);
            setRedo(false);
          }}
        />
      )}
    </OnboardingShell>
  );
}

/** Khung riêng cho khảo sát, không mượn sidebar/topbar của app để giữ mạch tập trung. */
function OnboardingShell({
  authenticated,
  children,
}: {
  authenticated: boolean;
  children: ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link
            href="/"
            className={styles.brand}
            aria-label="Về trang chủ Hanni"
          >
            <Image
              src="/brand/fox-mark.png"
              alt=""
              width={34}
              height={34}
              priority
              className={styles.brandMark}
            />
            <span className={styles.brandName}>Hanni</span>
            <span className={styles.topbarDivider} aria-hidden="true" />
            <span className={styles.topbarContext}>Thiết lập lộ trình</span>
          </Link>
          {authenticated ? (
            <Link href="/learn" className={styles.topbarLink}>
              Bỏ qua, làm sau <Icon name="arrow" size={15} />
            </Link>
          ) : (
            <Link href="/login" className={styles.topbarLink}>
              Đã có tài khoản? Đăng nhập
            </Link>
          )}
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.layout}>
          <aside
            className={styles.introPanel}
            aria-label="Khảo sát này để làm gì"
          >
            <div className={styles.introContent}>
              <p className={styles.introKicker}>
                <span className={styles.introKickerDot} aria-hidden="true" />
                Thiết lập lộ trình
              </p>
              <h1 className={styles.introTitle}>
                3 câu hỏi,
                <br />
                <em>chưa tới 1 phút.</em>
              </h1>
              <p className={styles.introDescription}>
                Câu trả lời của bạn quyết định 3 thứ trong Hanni:
              </p>
              <div className={styles.benefitList}>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>
                    <Icon name="target" size={17} />
                  </span>
                  <span>Bài bắt đầu vừa sức</span>
                </div>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>
                    <Icon name="trophy" size={17} />
                  </span>
                  <span>Lộ trình tới kỳ thi HSK (nếu có)</span>
                </div>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>
                    <Icon name="clock" size={17} />
                  </span>
                  <span>Mục tiêu học mỗi ngày</span>
                </div>
              </div>
              <div className={styles.introQuote}>
                <span className={styles.quoteBadge} aria-hidden="true">
                  <Icon name="check" size={18} />
                </span>
                <span className={styles.quoteCopy}>
                  {authenticated ? (
                    <>
                      <strong>Đổi lại được bất cứ lúc nào</strong>
                      <span>Mục tiêu ngày chỉnh trong Cài đặt</span>
                    </>
                  ) : (
                    <>
                      <strong>Chưa cần tài khoản</strong>
                      <span>Làm xong vào học bài 1 ngay, lưu tiến độ sau</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </aside>
          <div className={styles.contentArea}>{children}</div>
        </div>
      </main>
    </div>
  );
}

type Step = 1 | 2 | 3;
type LevelChoice = "new" | "unsure" | "studied";

function OnboardingWizard({
  authenticated,
  errorBanner,
  onDone,
  onPreview,
}: {
  authenticated: boolean;
  errorBanner: string | null;
  onDone: (profile: ResultData) => void;
  /** Khách chưa đăng nhập: chỉ có kết quả tính thử, chưa lưu gì. */
  onPreview: (preview: ResultData) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [levelChoice, setLevelChoice] = useState<LevelChoice | null>(null);
  const [selfAssessedLevel, setSelfAssessedLevel] = useState<number | null>(null);
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [targetLevel, setTargetLevel] = useState<number | null>(null);
  const [examWindow, setExamWindow] = useState<number | null>(null);
  const [dailyMinutes, setDailyMinutes] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step1Ready =
    levelChoice === "new" ||
    levelChoice === "unsure" ||
    (levelChoice === "studied" && selfAssessedLevel !== null);
  const step2Ready = goal !== null && (goal !== "EXAM" || targetLevel !== null);

  async function submit() {
    if (!levelChoice || !goal || dailyMinutes === null) return;
    const plansToTakeExam = goal === "EXAM";
    let targetDate: string | undefined;
    if (plansToTakeExam && examWindow) {
      const d = new Date();
      d.setMonth(d.getMonth() + examWindow);
      targetDate = d.toISOString().slice(0, 10);
    }
    const input: SubmitOnboardingInput = {
      hasStudiedBefore: levelChoice !== "new",
      selfAssessedLevel:
        levelChoice === "studied" ? (selfAssessedLevel ?? undefined) : undefined,
      goal,
      plansToTakeExam,
      targetLevel: plansToTakeExam ? (targetLevel ?? undefined) : undefined,
      targetDate,
      dailyMinutes,
    };
    setBusy(true);
    setError(null);
    try {
      if (authenticated) {
        onDone(await submitOnboarding(input));
      } else {
        // Chưa có tài khoản: TÍNH và HIỆN kết quả ngay, chỉ lưu tạm câu trả
        // lời để đăng ký xong thì tự nộp (xem effect trong OnboardingPage).
        const preview = await previewOnboarding(input);
        try {
          sessionStorage.setItem(PENDING_KEY, JSON.stringify(input));
        } catch {
          /* trình duyệt có thể chặn sessionStorage — vẫn xem được kết quả */
        }
        onPreview({ ...preview, goal });
      }
    } catch {
      setError("Chưa tính được lộ trình. Bạn thử lại nhé.");
      setBusy(false);
    }
  }

  const progress = Math.round((step / 3) * 100);

  return (
    <div className={styles.wizardColumn}>
      <section className={styles.wizardCard} aria-label="Khảo sát lộ trình học">
        <p className={styles.mobilePurpose}>
          3 câu hỏi để Hanni chọn bài bắt đầu, lộ trình thi và mục tiêu mỗi ngày
          {authenticated ? "." : " — chưa cần tài khoản."}
        </p>
        <div className={styles.progressHeader}>
          <div className={styles.progressMeta}>
            <span className={styles.progressLabel}>Câu {step} / 3</span>
            <span className={styles.progressHint}>
              {step === 3 ? "Câu cuối" : `Còn ${3 - step} câu`}
            </span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Tiến độ khảo sát"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span
              className={styles.progressValue}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {(errorBanner || error) && (
          <div className={styles.errorSlot}>
            <ErrorNote>{errorBanner ?? error}</ErrorNote>
          </div>
        )}

        <div key={step} className={styles.stepPanel}>
          {step === 1 && (
            <>
              <QuestionHeading
                icon="book"
                eyebrow="Để chọn bài bắt đầu"
                title="Bạn biết tiếng Trung tới đâu?"
                description="Không lặp lại thứ bạn đã biết, cũng không nhảy quá xa."
              />
              <div className={styles.choiceList}>
                <ChoiceButton
                  icon="spark"
                  title="Chưa biết gì"
                  description="Bắt đầu từ bài 1 HSK 1 — không cần biết trước chữ Hán"
                  active={levelChoice === "new"}
                  onClick={() => {
                    setLevelChoice("new");
                    setSelfAssessedLevel(null);
                  }}
                />
                <ChoiceButton
                  icon="chart"
                  title="Biết một chút, chưa chắc cấp nào"
                  description="Cuối khảo sát làm bài kiểm tra khoảng 3 phút để xếp đúng cấp"
                  active={levelChoice === "unsure"}
                  onClick={() => {
                    setLevelChoice("unsure");
                    setSelfAssessedLevel(null);
                  }}
                />
                <ChoiceButton
                  icon="book"
                  title="Đang học một cấp HSK"
                  description="Chọn cấp bạn đang học, học dở cũng được"
                  active={levelChoice === "studied"}
                  onClick={() => setLevelChoice("studied")}
                />
              </div>
              {levelChoice === "studied" && (
                <div>
                  <p className={styles.subQuestion}>Bạn đang học cấp nào?</p>
                  <OptionGrid
                    options={LEVELS}
                    value={selfAssessedLevel}
                    onChange={setSelfAssessedLevel}
                  />
                </div>
              )}
              <div className={`${styles.wizardFooter} ${styles.wizardFooterEnd}`}>
                <Button
                  className={styles.nextButton}
                  disabled={!step1Ready}
                  onClick={() => setStep(2)}
                >
                  Tiếp tục <Icon name="arrow" size={16} />
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <QuestionHeading
                icon="target"
                eyebrow="Để gợi ý cách luyện hợp với bạn"
                title="Bạn học tiếng Trung để làm gì?"
                description="Nếu định thi HSK, Hanni tính số bài còn lại tới cấp thi và chia theo ngày thi."
              />
              <div className={styles.goalGrid}>
                {GOALS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => {
                      setGoal(g.key);
                      if (g.key !== "EXAM") {
                        setTargetLevel(null);
                        setExamWindow(null);
                      }
                    }}
                    aria-pressed={goal === g.key}
                    className={`${styles.goalCard} ${goal === g.key ? styles.goalActive : ""}`}
                  >
                    <span className={styles.goalIcon}>
                      <Icon name={g.icon} size={17} />
                    </span>
                    <span className={styles.goalLabel}>{g.label}</span>
                    <span className={styles.goalHint}>{g.hint}</span>
                  </button>
                ))}
              </div>
              {goal === "EXAM" && (
                <div>
                  <p className={styles.subQuestion}>Bạn định thi cấp nào?</p>
                  <OptionGrid
                    options={LEVELS}
                    value={targetLevel}
                    onChange={setTargetLevel}
                  />
                  <p className={styles.subQuestion}>
                    Bao lâu nữa thì thi? <span className="font-normal">(không bắt buộc)</span>
                  </p>
                  <OptionGrid
                    options={EXAM_WINDOWS}
                    value={examWindow}
                    onChange={setExamWindow}
                  />
                </div>
              )}
              <div className={styles.wizardFooter}>
                <Button variant="secondary" onClick={() => setStep(1)}>
                  <Icon name="back" size={16} /> Quay lại
                </Button>
                <Button
                  className={styles.nextButton}
                  disabled={!step2Ready}
                  onClick={() => setStep(3)}
                >
                  Tiếp tục <Icon name="arrow" size={16} />
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <QuestionHeading
                icon="clock"
                eyebrow="Để đặt mục tiêu mỗi ngày"
                title="Mỗi ngày bạn học được bao lâu?"
                description="Hanni tính cả học bài mới, ôn thẻ và làm đề, rồi nhắc bạn giữ chuỗi ngày học. Đổi lại được trong Cài đặt."
              />
              <OptionGrid
                options={DAILY_MINUTES}
                value={dailyMinutes}
                onChange={setDailyMinutes}
              />
              <div className={styles.wizardFooter}>
                <Button variant="secondary" onClick={() => setStep(2)}>
                  <Icon name="back" size={16} /> Quay lại
                </Button>
                <Button
                  className={styles.nextButton}
                  disabled={dailyMinutes === null || busy}
                  onClick={() => void submit()}
                >
                  {busy ? "Đang tính…" : "Xem lộ trình"}
                  <Icon name="arrow" size={16} />
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function QuestionHeading({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: IconName;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className={styles.questionHeading}>
      <span className={styles.questionIcon}>
        <Icon name={icon} size={20} />
      </span>
      <div>
        <p className={styles.questionEyebrow}>{eyebrow}</p>
        <h2 className={styles.questionTitle}>{title}</h2>
        <p className={styles.questionDescription}>{description}</p>
      </div>
    </div>
  );
}

function ChoiceButton({
  icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: IconName;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${styles.choice} ${active ? styles.choiceActive : ""}`}
    >
      <span className={styles.choiceIcon}>
        <Icon name={icon} size={18} />
      </span>
      <span className={styles.choiceCopy}>
        <span className={styles.choiceTitle}>{title}</span>
        <span className={styles.choiceDescription}>{description}</span>
      </span>
      <span className={styles.choiceCheck} aria-hidden="true">
        <Icon name="check" size={13} />
      </span>
    </button>
  );
}

/** Lưới nút chọn 1 (cấp HSK, thời điểm thi, số phút mỗi ngày). */
function OptionGrid({
  options,
  value,
  onChange,
}: {
  options: { value: number; label: string; hint: string }[];
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div className={styles.levelGrid}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`${styles.levelButton} ${value === o.value ? styles.levelActive : ""}`}
        >
          <span className={styles.levelNumber}>{o.label}</span>
          <span className={styles.levelDescription}>{o.hint}</span>
        </button>
      ))}
    </div>
  );
}

function PlanRow({
  icon,
  title,
  detail,
  link,
}: {
  icon: IconName;
  title: string;
  detail: string;
  link?: { href: string; label: string };
}) {
  return (
    <li className={styles.planRow}>
      <span className={styles.planIcon}>
        <Icon name={icon} size={18} />
      </span>
      <span className={styles.planCopy}>
        <span className={styles.planTitle}>{title}</span>
        <span className={styles.planDetail}>{detail}</span>
        {link && (
          <Link href={link.href} className={styles.planLink}>
            {link.label} <Icon name="arrow" size={13} />
          </Link>
        )}
      </span>
    </li>
  );
}

function ResultScreen({
  data,
  guest = false,
  onRedo,
}: {
  data: ResultData;
  /** true = kết quả tính thử, CHƯA lưu (chưa có tài khoản). */
  guest?: boolean;
  onRedo: () => void;
}) {
  const plan = data.plan;
  // Server cũ (trước khi có `plan`) — vẫn hiện được đề xuất dạng chữ.
  if (!plan) {
    return (
      <div className={styles.wizardColumn}>
        <section className={styles.resultCard}>
          <h2 className={styles.resultTitle}>
            Bắt đầu từ <strong>HSK {levelName(data.recommendedLevel)}</strong>
          </h2>
          <p className={styles.recommendation}>{data.recommendationVi}</p>
          <div className={styles.resultActions}>
            <LinkButton href={guest ? `/bat-dau?level=${Math.min(data.recommendedLevel, 7)}` : "/learn"}>
              Vào học <Icon name="arrow" size={16} />
            </LinkButton>
            <Button variant="ghost" onClick={onRedo}>
              Làm lại khảo sát
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const start = plan.startLevel;
  const exam = plan.exam;
  const goal = GOALS.find((g) => g.key === data.goal) ?? GOALS[GOALS.length - 1];

  let examDetail = "";
  if (exam) {
    if (exam.lessons === null) {
      examDetail = "Làm bài kiểm tra xong, Hanni biết bạn còn bao nhiêu bài tới cấp thi.";
    } else if (exam.lessons === 0) {
      examDetail = "Bạn đã học tới cấp này — làm đề thi thử để quen dạng bài và thời gian.";
    } else {
      const span =
        start === Math.min(exam.level, 7)
          ? `Cả HSK ${levelName(exam.level)}`
          : `Từ HSK ${levelName(start ?? 1)} tới hết HSK ${levelName(exam.level)}`;
      examDetail = `${span}: ${exam.lessons} bài (~${(exam.words ?? 0).toLocaleString("vi-VN")} từ)`;
      if (exam.weeksLeft) {
        examDetail += ` — khoảng ${Math.ceil(exam.lessons / exam.weeksLeft)} bài mỗi tuần`;
      }
      examDetail += ".";
    }
  }
  const suggestion = data.goal !== "EXAM" ? GOAL_SUGGESTION[data.goal] : null;

  return (
    <div className={styles.wizardColumn}>
      <section className={styles.resultCard}>
        <span className={styles.resultIcon}>
          <Icon name={start ? "check" : "chart"} size={28} />
        </span>
        <h2 className={styles.resultTitle}>
          {start ? "Lộ trình của bạn đã sẵn sàng" : "Còn 1 bước: kiểm tra trình độ"}
        </h2>
        <ul className={styles.planList}>
          {start ? (
            <PlanRow
              icon="target"
              title={`Bắt đầu từ HSK ${levelName(start)}`}
              detail={
                plan.firstLesson
                  ? `Bài đầu tiên: ${plan.firstLesson.title}. Không khoá bài nào — muốn học chủ đề khác cứ chọn.`
                  : "Không khoá bài nào — muốn học chủ đề khác cứ chọn."
              }
            />
          ) : (
            <PlanRow
              icon="target"
              title="Cấp bắt đầu: xếp sau bài kiểm tra"
              detail="Khoảng 3 phút, đúng thì lên cấp, sai thì dừng — bạn được xếp vào cấp thấp nhất chưa vững."
            />
          )}
          {exam ? (
            <PlanRow
              icon="trophy"
              title={`Thi HSK ${levelName(exam.level)}${exam.weeksLeft ? ` · còn ${exam.weeksLeft} tuần` : ""}`}
              detail={examDetail}
              link={
                // Đề thi thử hiện có HSK 1–4 (công khai, khách làm được).
                exam.level <= 4
                  ? { href: `/thi-thu-hsk/hsk${exam.level}-de-1`, label: `Làm thử đề HSK ${exam.level}` }
                  : undefined
              }
            />
          ) : (
            <PlanRow
              icon={goal.icon}
              title={`Mục tiêu: ${goal.label}`}
              detail={suggestion ? `Nên thử thêm: ${suggestion.label} — ${suggestion.detail}.` : goal.hint}
              link={suggestion && (!guest || suggestion.guest) ? { href: suggestion.href, label: suggestion.label } : undefined}
            />
          )}
          {plan.dailyMinutes && (
            <PlanRow
              icon="clock"
              title={`Mỗi ngày ${plan.dailyMinutes} phút`}
              detail={
                guest
                  ? "Thành mục tiêu ngày khi bạn lưu tiến độ — tính cả học bài, ôn thẻ và làm đề."
                  : "Đã đặt làm mục tiêu ngày — tính cả học bài, ôn thẻ và làm đề. Đổi lại trong Cài đặt."
              }
            />
          )}
        </ul>
        <div className={styles.resultActions}>
          {start ? (
            <LinkButton href={guest ? `/bat-dau?level=${start}` : "/learn"}>
              {guest ? "Vào bài 1" : `Vào học HSK ${levelName(start)}`}
              <Icon name="arrow" size={16} />
            </LinkButton>
          ) : (
            <LinkButton href="/kiem-tra-trinh-do">
              Làm bài kiểm tra trình độ <Icon name="arrow" size={16} />
            </LinkButton>
          )}
          <Button variant="ghost" onClick={onRedo}>
            Làm lại khảo sát
          </Button>
        </div>
        <p className={styles.resultNote}>
          {guest
            ? "Chưa cần tài khoản — học xong bài 1, Hanni mới mời bạn lưu tiến độ."
            : "Đã lưu vào tài khoản của bạn."}
        </p>
      </section>
    </div>
  );
}
