import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  GraduationCap,
  Award,
  BookOpen,
  LineChart,
  Wallet,
  Newspaper,
  Compass,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useGameStore } from '../../stores/gameStore';

interface TutorialGuideProps {
  activeWorkspace: 'trading' | 'portfolio' | 'news' | 'glossary';
  setActiveWorkspace: (workspace: 'trading' | 'portfolio' | 'news' | 'glossary') => void;
  onClose: () => void;
}

interface Step {
  title: string;
  emoji: string;
  icon: typeof GraduationCap;
  workspace: 'trading' | 'portfolio' | 'news' | 'glossary';
  description: string;
}

const TUTORIAL_STEPS: Step[] = [
  {
    title: '스탁스쿨 입학을 환영합니다!',
    emoji: '🏫',
    icon: GraduationCap,
    workspace: 'news',
    description:
      '안녕하세요! 스탁스쿨의 **가상 금융교육 시뮬레이터**에 오신 것을 환영합니다! 🎉\n\n저는 여러분의 금융 멘토 **스탁 쌤**입니다. 이곳의 모든 기업, 뉴스, 자금은 **100% 가상 교육 자료**예요. 매일 **뉴스를 먼저 읽고 판단한 뒤 투자하는 습관**을 함께 길러봅시다!',
  },
  {
    title: '1단계: 매일 아침, 뉴스 스스로 읽고 추론하기!',
    emoji: '📰',
    icon: Newspaper,
    workspace: 'news',
    description:
      '스탁스쿨의 하루는 항상 **오늘의 뉴스**에서 시작합니다!\n\n매일 도착하는 3건의 기사를 읽고 **① 어떤 산업이 영향받을지 스스로 추론**한 뒤 **② 호재 / 혼조 / 악재** 방향을 체크해 보세요. 3건을 모두 분석하면 **모의투자 교실의 주문과 다음 날 진행이 열립니다!**',
  },
  {
    title: '2단계: 직접 기업을 찾아 탐색하고 ★ 찜하기',
    emoji: '📈',
    icon: LineChart,
    workspace: 'trading',
    description:
      '스탁스쿨은 관련 종목을 자동으로 알려주지 않아요! **모의투자 교실**의 **종목 검색**과 **기업 정보**를 직접 읽고 오늘 뉴스의 영향을 받을 기업을 스스로 찾아보세요.\n\n주목할 기업에는 **★ 별표**를 눌러 관심 종목에 모아 비교할 수 있습니다!',
  },
  {
    title: '3단계: 차트 · 오늘 뉴스 요약 · 모의 호가창',
    emoji: '📊',
    icon: Compass,
    workspace: 'trading',
    description:
      '종목을 클릭하면 중앙에 **시세 차트**가 열리고, 바로 아래에서 **오늘의 뉴스 요약**과 **모의 호가창(참고용)**을 탭으로 오가며 볼 수 있어요!\n\n주문을 넣기 직전에도 오늘 읽은 뉴스를 다시 확인하며 신중하게 판단해 보세요.',
  },
  {
    title: '4단계: 모의 매수·매도 및 분산투자',
    emoji: '💰',
    icon: LineChart,
    workspace: 'trading',
    description:
      '오늘의 뉴스 3건을 모두 체크하면 우측 **주문 실행** 패널이 열립니다!\n\n가상 예수금 한도 내에서 원하는 수량을 정해 매수하거나, 마땅한 종목이 없으면 **관망(현금 보유)**을 선택해도 좋습니다. 여러 산업에 **분산투자**해 보세요!',
  },
  {
    title: '5단계: 자산 보고서 & 뉴스 적중률 점검',
    emoji: '💼',
    icon: Wallet,
    workspace: 'portfolio',
    description:
      '**자산 보고서** 탭에서는 내 총 평가자산, 보유 종목 손익, 섹터별 비중과 함께 나의 **누적 뉴스 독해 적중률**을 한눈에 확인할 수 있습니다.',
  },
  {
    title: '6단계: 금융 용어사전 활용',
    emoji: '📚',
    icon: BookOpen,
    workspace: 'glossary',
    description:
      '뉴스나 기업 설명에 모르는 경제 용어가 나왔다면 **용어 사전방**을 열어보세요!\n\n초급·중급·고급 눈높이별로 쉬운 설명을 비교하며 공부할 수 있습니다.',
  },
  {
    title: '7단계: 다음 날 진행 & 개장 복기 리포트',
    emoji: '🚀',
    icon: Sparkles,
    workspace: 'news',
    description:
      '오늘의 분석과 투자 결정을 마쳤다면 **다음 날 진행** 버튼을 눌러보세요!\n\n다음 날 아침에는 **어제 내 뉴스 판단의 적중 결과**와 **자산 변동 리포트**가 도착하고, 스탁 쌤의 상세 해설로 원인을 복기할 수 있습니다.',
  },
  {
    title: '스탁스쿨 오리엔테이션 완료!',
    emoji: '🎓',
    icon: Award,
    workspace: 'news',
    description:
      '훌륭합니다! 모든 기초 과정을 완료했습니다! 🏆\n\n이제 **DAY 1 오늘의 뉴스 3건**을 읽고 첫 판단을 체크하며 나만의 합리적인 투자 여정을 시작해 보세요. 파이팅! 🔥',
  },
];

export default function TutorialGuide({
  activeWorkspace,
  setActiveWorkspace,
  onClose,
}: TutorialGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { setTutorialStep } = useGameStore();

  useEffect(() => {
    setTutorialStep(currentStep);
    return () => setTutorialStep(null);
  }, [currentStep, setTutorialStep]);

  useEffect(() => {
    const step = TUTORIAL_STEPS[currentStep];
    if (step && activeWorkspace !== step.workspace) {
      setActiveWorkspace(step.workspace);
    }
  }, [currentStep, activeWorkspace, setActiveWorkspace]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('stockschool_tutorial_completed', 'true');
    onClose();
  };

  const renderFormattedDescription = (text: string) => {
    let cleanedText = text;
    cleanedText = cleanedText.replace(/\*\*['"‘“']?([^'*"]+)['"’”']?\*\*/g, '**$1**');
    cleanedText = cleanedText.replace(/['"‘“']?\*\*([^*]+)\*\*['"’”']?/g, '**$1**');

    const parts = cleanedText.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <strong
            key={index}
            className="font-black text-[var(--color-primary)] dark:text-[var(--color-accent-gold)] underline decoration-[var(--color-primary)]/25 decoration-2"
          >
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  const stepInfo = TUTORIAL_STEPS[currentStep];
  const StepIcon = stepInfo.icon;
  const progressPercent = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  const isOverlayStep = currentStep === 0 || currentStep === TUTORIAL_STEPS.length - 1;

  const renderContent = () => {
    if (isOverlayStep) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[90dvh] overflow-y-auto rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 shadow-2xl p-6 md:p-8 flex flex-col gap-5 backdrop-blur-xl animate-scale-in">
            {/* Top Progress Line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-900 overflow-hidden">
              <div
                className="h-full bg-slate-900 dark:bg-[var(--color-accent-gold)] transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Header bar */}
            <div className="flex items-center justify-between shrink-0 pt-2">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-500/10 text-[var(--color-primary)] dark:text-[var(--color-accent-gold)]">
                  <StepIcon className="w-5 h-5" />
                </span>
                <span className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase font-mono">
                  STEP {currentStep + 1} / {TUTORIAL_STEPS.length}
                </span>
              </div>

              <button
                type="button"
                onClick={handleComplete}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                title="튜토리얼 건너뛰기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Character speech block */}
            <div className="flex flex-col md:flex-row gap-4 items-start bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-900/60 relative overflow-hidden">
              <div className="flex md:flex-col items-center gap-3 shrink-0">
                <div className="w-14 h-14 rounded-full bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-3xl shadow-md border-2 border-white dark:border-slate-700">
                  {stepInfo.emoji}
                </div>
                <div className="text-center">
                  <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    MENTOR
                  </div>
                  <div className="text-[13px] font-black text-foreground">스탁 쌤</div>
                </div>
              </div>

              <div className="flex-1 min-w-0 md:pl-2">
                <h3 className="text-base font-black text-foreground mb-2 tracking-tight flex items-center gap-2">
                  {stepInfo.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line">
                  {renderFormattedDescription(stepInfo.description)}
                </p>
              </div>
            </div>

            {/* Buttons Controls */}
            <div className="flex items-center justify-between mt-1 shrink-0">
              {currentStep > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="h-10 px-4 font-bold text-[13px] rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전으로
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {currentStep < TUTORIAL_STEPS.length - 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleComplete}
                    className="h-10 px-4 font-bold text-[13px] text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer rounded-xl"
                  >
                    건너뛰기
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  onClick={handleNext}
                  className="h-10 px-5 font-black text-[13px] rounded-xl bg-slate-900 dark:bg-[var(--color-accent-gold)] text-white dark:text-slate-950 shadow-md flex items-center gap-1.5 cursor-pointer border-transparent transition-all active:scale-[0.98]"
                >
                  {currentStep === TUTORIAL_STEPS.length - 1 ? (
                    <>오늘의 뉴스 읽으러 가기! 🚀</>
                  ) : (
                    <>
                      다음 단계
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-45 pointer-events-none flex items-end justify-end p-4 md:p-6 animate-fade-in">
        <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-5 flex flex-col gap-4 backdrop-blur-xl animate-scale-in md:mr-6 md:mb-12 relative">
          {/* Top Progress Line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-900 overflow-hidden">
            <div
              className="h-full bg-slate-900 dark:bg-[var(--color-accent-gold)] transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Header bar */}
          <div className="flex items-center justify-between shrink-0 pt-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-500/10 text-[var(--color-primary)] dark:text-[var(--color-accent-gold)]">
                <StepIcon className="w-4 h-4" />
              </span>
              <span className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase font-mono">
                STEP {currentStep + 1} / {TUTORIAL_STEPS.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleComplete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              title="튜토리얼 건너뛰기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Character speech block */}
          <div className="flex gap-3.5 items-start bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-900/60">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-sm border border-white/80 dark:border-slate-700">
                {stepInfo.emoji}
              </div>
              <div className="text-[11px] font-black text-muted-foreground">스탁 쌤</div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-foreground mb-1.5 tracking-tight">
                {stepInfo.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line">
                {renderFormattedDescription(stepInfo.description)}
              </p>
            </div>
          </div>

          {/* Buttons Controls */}
          <div className="flex items-center justify-between shrink-0 pt-0.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="h-9 px-3.5 font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              이전
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleComplete}
                className="h-9 px-3 font-bold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer rounded-lg"
              >
                건너뛰기
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleNext}
                className="h-9 px-4 font-black text-xs rounded-lg bg-slate-900 dark:bg-[var(--color-accent-gold)] text-white dark:text-slate-950 shadow-sm flex items-center gap-1 cursor-pointer border-transparent transition-all active:scale-[0.98]"
              >
                다음 단계
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const portalRoot = typeof document !== 'undefined' ? document.body : null;
  if (!portalRoot) return renderContent();
  return createPortal(renderContent(), portalRoot);
}
