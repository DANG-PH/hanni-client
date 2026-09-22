"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import { Button, ErrorNote, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  previewOnboarding,
  submitOnboarding,
  useOnboarding,
} from "@/lib/hooks";
import type {
  OnboardingGoal,
  OnboardingProfile,
  SubmitOnboardingInput,
} from "@/lib/types";
import styles from "./onboarding.module.css";

const GOALS: {
  key: OnboardingGoal;
  label: string;
  hint: string;
  icon: IconName;
}[] = [
  {
    key: "TRAVEL",
    label: "Du lịch, giao tiếp",
    hint: "Tự tin dùng câu cơ bản",
    icon: "route",
  },
  {
    key: "WORK",
    label: "Phục vụ công việc",
    hint: "Trao đổi và làm việc tốt hơn",
    icon: "chart",
  },
  {
    key: "EXAM",
    label: "Thi chứng chỉ HSK",
    hint: "Ôn tập theo mốc rõ ràng",
    icon: "trophy",
  },
  {
    key: "ACADEMIC",
    label: "Du học",
    hint: "Xây nền tảng học thuật",
    icon: "book",
  },
  {
    key: "INTEREST",
    label: "Văn hoá & sở thích",
    hint: "Học vì niềm vui mỗi ngày",
    icon: "heart",
  },
  {
    key: "OTHER",
    label: "Mục tiêu khác",
    hint: "Tạo nhịp học riêng cho bạn",
    icon: "spark",
  },
];

const LEVELS = Array.from({ length: 9 }, (_, i) => i + 1);
const LEVEL_DESCRIPTIONS = [
  "Nhập môn",
  "Nền tảng",
  "Giao tiếp",
  "Trung cấp",
  "Mở rộng",
  "Khá tốt",
  "Nâng cao",
  "Thành thạo",
  "Chuyên sâu",
];

/** Khảo sát làm xong TRƯỚC khi có tài khoản (kiểu Duolingo) được giữ tạm ở
 * đây, đăng ký xong quay lại trang này thì tự nộp — xem hàm submit() trong
 * OnboardingWizard và effect tự nộp trong OnboardingPage. */
const PENDING_KEY = "hanni:pending-onboarding";

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const onboarding = useOnboarding(Boolean(user));
  const [result, setResult] = useState<OnboardingProfile | null>(null);
  const [preview, setPreview] = useState<{
    recommendedLevel: number;
    recommendationVi: string;
  } | null>(null);
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
      ) : preview ? (
        <ResultScreen
          profile={preview}
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
              src="/brand/hanni.png"
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
            <Link href="/dashboard" className={styles.topbarLink}>
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
            aria-label="Giới thiệu lộ trình Hanni"
          >
            <div className={styles.introContent}>
              <p className={styles.introKicker}>
                <span className={styles.introKickerDot} aria-hidden="true" />
                Hanni learning path
              </p>
              <h1 className={styles.introTitle}>
                Học đúng nhịp.
                <br />
                <em>Tiến bộ đều.</em>
              </h1>
              <p className={styles.introDescription}>
                Trả lời vài câu hỏi ngắn để Hanni hiểu mục tiêu, chọn đúng điểm
                bắt đầu và đồng hành cùng bạn lâu dài.
              </p>
              <div className={styles.benefitList}>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>
                    <Icon name="target" size={17} />
                  </span>
                  <span>Chọn đúng cấp độ</span>
                </div>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>
                    <Icon name="clock" size={17} />
                  </span>
                  <span>Nhịp học vừa sức</span>
                </div>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>
                    <Icon name="chart" size={17} />
                  </span>
                  <span>Tiến bộ thấy rõ</span>
                </div>
              </div>
              <div className={styles.introQuote}>
                <span className={styles.quoteBadge} aria-hidden="true">
                  HSK
                  <br />
                  3.0
                </span>
                <span className={styles.quoteCopy}>
                  <strong>Lộ trình bám sát mục tiêu</strong>
                  <span>Cá nhân hoá theo câu trả lời của bạn</span>
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

function OnboardingWizard({
  authenticated,
  errorBanner,
  onDone,
  onPreview,
}: {
  authenticated: boolean;
  errorBanner: string | null;
  onDone: (profile: OnboardingProfile) => void;
  /** Khách chưa đăng nhập: chỉ có kết quả tính thử, chưa lưu gì. */
  onPreview: (preview: {
    recommendedLevel: number;
    recommendationVi: string;
  }) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [hasStudiedBefore, setHasStudiedBefore] = useState<boolean | null>(
    null,
  );
  const [selfAssessedLevel, setSelfAssessedLevel] = useState<number | null>(
    null,
  );
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [plansToTakeExam, setPlansToTakeExam] = useState<boolean | null>(null);
  const [targetLevel, setTargetLevel] = useState<number | null>(null);
  const [targetDate, setTargetDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (hasStudiedBefore === null || !goal || plansToTakeExam === null) return;
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
        // Chưa có tài khoản: TÍNH và HIỆN kết quả ngay, chỉ lưu tạm câu trả
        // lời để đăng ký xong thì tự nộp (xem effect trong OnboardingPage).
        //
        // Trước đây bước này đẩy thẳng sang /register — trả lời xong 3 câu mà
        // chưa nhận lại gì, đúng chỗ dễ rời đi nhất trong cả luồng. Giờ xem
        // lộ trình trước, rồi mới mời tạo tài khoản để LƯU nó.
        const preview = await previewOnboarding(input);
        try {
          sessionStorage.setItem(PENDING_KEY, JSON.stringify(input));
        } catch {
          /* trình duyệt có thể chặn sessionStorage — vẫn xem được kết quả */
        }
        onPreview(preview);
      }
    } catch {
      setError("Chưa lưu được khảo sát. Bạn thử lại nhé.");
      setBusy(false);
    }
  }

  const progress = Math.round((step / 3) * 100);
  const progressHint =
    step === 1 ? "Còn 2 bước" : step === 2 ? "Còn 1 bước" : "Sắp hoàn tất";

  return (
    <div className={styles.wizardColumn}>
      <section className={styles.wizardCard} aria-label="Khảo sát lộ trình học">
        <div className={styles.progressHeader}>
          <div className={styles.progressMeta}>
            <span className={styles.progressLabel}>Bước {step} / 3</span>
            <span className={styles.progressHint}>{progressHint}</span>
            <span className={styles.progressPercent}>{progress}%</span>
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
                eyebrow="Điểm bắt đầu"
                title="Bạn đã học tiếng Trung/HSK trước đây chưa?"
                description="Hanni sẽ dùng thông tin này để chọn bài học vừa sức với bạn."
              />
              <div className={styles.choiceGrid}>
                <ChoiceButton
                  icon="book"
                  title="Rồi, có học qua"
                  description="Mình muốn học tiếp từ nền tảng hiện có"
                  active={hasStudiedBefore === true}
                  onClick={() => setHasStudiedBefore(true)}
                />
                <ChoiceButton
                  icon="spark"
                  title="Chưa, mới bắt đầu"
                  description="Mình muốn làm quen từ những điều cơ bản"
                  active={hasStudiedBefore === false}
                  onClick={() => {
                    setHasStudiedBefore(false);
                    setSelfAssessedLevel(null);
                  }}
                />
              </div>
              {hasStudiedBefore && (
                <div>
                  <p className={styles.subQuestion}>
                    Bạn tự đánh giá đã học tới khoảng cấp nào?
                  </p>
                  <LevelGrid
                    value={selfAssessedLevel}
                    onChange={setSelfAssessedLevel}
                  />
                </div>
              )}
              <div className={styles.wizardFooter}>
                <p className={styles.footerHint}>
                  {hasStudiedBefore
                    ? "Chọn cấp gần nhất với trình độ hiện tại của bạn."
                    : "Không cần biết trước Hán tự — Hanni sẽ hướng dẫn từ đầu."}
                </p>
                <Button
                  className={styles.nextButton}
                  disabled={
                    hasStudiedBefore === null ||
                    (hasStudiedBefore && !selfAssessedLevel)
                  }
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
                eyebrow="Mục tiêu của bạn"
                title="Bạn muốn học tiếng Trung để làm gì?"
                description="Một mục tiêu rõ ràng giúp Hanni sắp xếp nội dung và nhịp học phù hợp hơn."
              />
              <div className={styles.goalGrid}>
                {GOALS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setGoal(g.key)}
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
              <div className={styles.wizardFooter}>
                <Button variant="secondary" onClick={() => setStep(1)}>
                  <Icon name="back" size={16} /> Quay lại
                </Button>
                <Button
                  className={styles.nextButton}
                  disabled={!goal}
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
                icon="trophy"
                eyebrow="Đích đến"
                title="Bạn có dự định thi HSK không?"
                description="Nếu có, Hanni sẽ giúp bạn chia nhỏ mục tiêu thành các mốc dễ theo dõi."
              />
              <div className={styles.choiceGrid}>
                <ChoiceButton
                  icon="trophy"
                  title="Có, đang nhắm tới"
                  description="Mình muốn học theo một mốc thi cụ thể"
                  active={plansToTakeExam === true}
                  onClick={() => setPlansToTakeExam(true)}
                />
                <ChoiceButton
                  icon="clock"
                  title="Chưa, học từ từ thôi"
                  description="Mình ưu tiên duy trì thói quen đều đặn"
                  active={plansToTakeExam === false}
                  onClick={() => {
                    setPlansToTakeExam(false);
                    setTargetLevel(null);
                    setTargetDate("");
                  }}
                />
              </div>
              {plansToTakeExam && (
                <div>
                  <p className={styles.subQuestion}>Bạn muốn thi cấp nào?</p>
                  <LevelGrid value={targetLevel} onChange={setTargetLevel} />
                  <div className="mt-5">
                    <label
                      htmlFor="onboarding-target-date"
                      className={styles.fieldLabel}
                    >
                      Hạn thi dự kiến{" "}
                      <span className="font-normal">(không bắt buộc)</span>
                    </label>
                    <input
                      id="onboarding-target-date"
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className={`field ${styles.dateField}`}
                    />
                  </div>
                </div>
              )}
              <div className={styles.wizardFooter}>
                <Button variant="secondary" onClick={() => setStep(2)}>
                  <Icon name="back" size={16} /> Quay lại
                </Button>
                <Button
                  className={styles.nextButton}
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

function LevelGrid({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (level: number) => void;
}) {
  return (
    <div className={styles.levelGrid}>
      {LEVELS.map((lv) => (
        <button
          key={lv}
          type="button"
          onClick={() => onChange(lv)}
          aria-pressed={value === lv}
          className={`${styles.levelButton} ${value === lv ? styles.levelActive : ""}`}
        >
          <span className={styles.levelNumber}>HSK {lv}</span>
          <span className={styles.levelDescription}>
            {LEVEL_DESCRIPTIONS[lv - 1]}
          </span>
        </button>
      ))}
    </div>
  );
}

function ResultScreen({
  profile,
  guest = false,
  onRedo,
}: {
  /** Chỉ cần 2 field này — khách chưa đăng nhập không có hồ sơ đầy đủ. */
  profile: { recommendedLevel: number; recommendationVi: string };
  /** true = kết quả tính thử, CHƯA lưu (chưa có tài khoản). */
  guest?: boolean;
  onRedo: () => void;
}) {
  const router = useRouter();
  return (
    <div className={styles.wizardColumn}>
      <section className={styles.resultCard}>
        <span className={styles.resultIcon}>
          <Icon name="check" size={28} />
        </span>
        <p className={styles.resultEyebrow}>Lộ trình dành riêng cho bạn</p>
        <h2 className={styles.resultTitle}>
          Bắt đầu từ <strong>HSK {profile.recommendedLevel}</strong>
        </h2>
        <p className={styles.resultDescription}>
          {guest
            ? "Đây là điểm bắt đầu vừa sức với câu trả lời của bạn. Tạo tài khoản để Hanni lưu lộ trình này và theo dõi tiến độ mỗi ngày."
            : "Hanni đã ghép câu trả lời của bạn thành một điểm bắt đầu vừa sức. Bạn có thể làm lại khảo sát bất cứ lúc nào."}
        </p>
        <p className={styles.recommendation}>{profile.recommendationVi}</p>
        <div className={styles.resultActions}>
          {guest ? (
            <>
              <Button onClick={() => router.push("/register")}>
                Tạo tài khoản để lưu lộ trình
                <Icon name="arrow" size={16} />
              </Button>
              {/* Vẫn cho xem thử trước khi đăng ký — ép đăng ký ngay là chỗ
               * rời đi nhiều nhất. */}
              <Link
                href="/hoc-thu"
                className="motion-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-2"
              >
                Học thử 8 từ, chưa cần tài khoản
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
          <Button variant="ghost" onClick={onRedo}>
            Làm lại khảo sát
          </Button>
        </div>
      </section>
    </div>
  );
}
