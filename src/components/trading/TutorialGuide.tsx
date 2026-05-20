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
  Compass
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
  icon: any;
  workspace: 'trading' | 'portfolio' | 'news' | 'glossary';
  description: string;
}

const TUTORIAL_STEPS: Step[] = [
  {
    title: '스탁스쿨 입학을 환영합니다!',
    emoji: '🏫',
    icon: GraduationCap,
    workspace: 'trading',
    description: '안녕하세요! 스탁스쿨의 가상 모의투자 교실에 오신 것을 진심으로 환영합니다! 🎉\n\n저는 여러분의 금융 멘토 **스탁 쌤**입니다. 지금부터 게임처럼 쉽고 재미있는 모의투자 학습을 1:1로 가르쳐 드릴게요. 화면 곳곳의 주요 기능을 하나씩 짚어가며 직접 눌러보면서 알아봅시다!'
  },
  {
    title: '1단계: 오늘의 뉴스룸 분석',
    emoji: '📰',
    icon: Newspaper,
    workspace: 'news',
    description: '화면 우측의 **경제 뉴스분석** 방이 하이라이트 되었습니다!\n\n매일 발행되는 3개의 핵심 뉴스를 읽고, 내일 주가가 변동할 섹터(기술, 바이오 등)의 힌트를 뉴스 속에서 보물찾기하듯 분석해보세요. 뉴스 리스트를 한번 읽어보며 분위기를 파악해볼까요?'
  },
  {
    title: '2단계: 투자할 유망 기업 탐색',
    emoji: '📈',
    icon: LineChart,
    workspace: 'trading',
    description: '힌트를 분석했다면 **모의투자 교실** 탭의 좌측 **종목 리스트**를 봐주세요!\n\n현재 상장된 유망 기업들이 섹터별로 정렬되어 있습니다. 종목의 이름이나 우측의 미니 트렌드 선차트를 확인해보고, 관심 있는 기업을 **직접 클릭**해 보세요!'
  },
  {
    title: '3단계: 차트 및 호가 분석',
    emoji: '📊',
    icon: Compass,
    workspace: 'trading',
    description: '종목을 클릭하면 화면 중앙에 실시간 주가 변동을 보여주는 **시세 차트**와 매수/매도 대기 물량을 보여주는 **호가창**이 열립니다!\n\n차트의 등락 흐름과 호가의 매수 대기량이 어떻게 쌓여 있는지 꼼꼼하게 살피는 것이 투자의 첫걸음입니다.'
  },
  {
    title: '4단계: 주식 주문 및 거래',
    emoji: '💰',
    icon: LineChart,
    workspace: 'trading',
    description: '이제 거래를 실행할 차례입니다! 우측의 **주문 실행** 패널을 확인해보세요!\n\n현재 예수금 한도 내에서 원하는 수량을 적고 **매수(사기)**하여 주주가 되거나, 주가가 올랐을 때 **매도(팔기)**하여 시세 차익을 거둘 수 있습니다. 신중하게 매수 결정을 해보세요!'
  },
  {
    title: '5단계: 포트폴리오(내 자산) 확인',
    emoji: '💼',
    icon: Wallet,
    workspace: 'portfolio',
    description: '투자를 진행한 후에는 상단(또는 좌측)의 **자산 보고서** 탭으로 가보세요!\n\n내 보유 종목, 평균 매입가, 평가 금액 및 **실시간 누적 수익률**을 예쁜 원형 차트와 대시보드로 한눈에 볼 수 있답니다. 자산 현황을 주기적으로 점검해보세요!'
  },
  {
    title: '6단계: 금융 용어사전 활용',
    emoji: '📚',
    icon: BookOpen,
    workspace: 'glossary',
    description: '주식 용어가 너무 어렵다고요? 걱정 마세요! **용어 사전방** 탭을 클릭해보세요!\n\n주요 핵심 경제 용어가 가나다순으로 깔끔하게 정리되어 있고, 클릭 시 아주 쉽고 친근한 설명이 나온답니다. 모르는 용어는 언제든지 검색해 보세요!'
  },
  {
    title: '7단계: 다음 날로 시장 진행',
    emoji: '🚀',
    icon: Sparkles,
    workspace: 'trading',
    description: '뉴스 분석, 종목 탐색, 그리고 주문까지 모두 완료하셨나요?\n\n그렇다면 사이드바(또는 헤더)의 **다음 날 진행** 버튼을 눌러보세요! 하룻밤이 지나 새로운 뉴스가 뜨고, 어제 분석한 정보가 반영되어 주가가 변동합니다. 짜릿한 결과를 확인해 보세요!'
  },
  {
    title: '스탁스쿨 졸업 & 모의투자 시작!',
    emoji: '🎓',
    icon: Award,
    workspace: 'trading',
    description: '와! 대단하십니다! 모든 기초 과정을 완벽하게 이수하셨습니다! 🏆\n\n이제 가상 자금으로 나만의 전략을 실행해 볼 시간입니다. 뉴스를 통해 세상의 변화를 먼저 감지하고 현명한 주주가 되어보세요. 스탁스쿨의 전설적인 투자자로 성장하시길 응원합니다! 파이팅! 🔥'
  }
];

export default function TutorialGuide({ activeWorkspace, setActiveWorkspace, onClose }: TutorialGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { setTutorialStep } = useGameStore();

  // Sync global tutorial step
  useEffect(() => {
    setTutorialStep(currentStep);
    return () => setTutorialStep(null);
  }, [currentStep, setTutorialStep]);

  // Sync workspace with step
  useEffect(() => {
    const step = TUTORIAL_STEPS[currentStep];
    if (step && activeWorkspace !== step.workspace) {
      setActiveWorkspace(step.workspace);
    }
  }, [currentStep, activeWorkspace, setActiveWorkspace]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('stockschool_tutorial_completed', 'true');
    onClose();
  };

  // Advanced parser to render bold text AND strip single/double quotes inside or around it
  const renderFormattedDescription = (text: string) => {
    let cleanedText = text;
    // Replace **'something'** or **"something"** with just **something**
    cleanedText = cleanedText.replace(/\*\*['"‘“']?([^'*"]+)['"’”']?\*\*/g, '**$1**');
    // Replace '**something**' or "**something**" with just **something**
    cleanedText = cleanedText.replace(/['"‘“']?\*\*([^*]+)\*\*['"’”']?/g, '**$1**');

    const parts = cleanedText.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <strong key={index} className="font-extrabold text-[var(--color-primary)] dark:text-[var(--color-accent-gold)] underline decoration-[var(--color-primary)]/20 decoration-2">
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

  // Step 0 and the final step (Step 8) are shown in full-screen modal mode.
  // Steps 1 to 7 are rendered in non-blocking floating bubble mode.
  // Step 0 and the final step (Step 8) are shown in full-screen modal mode.
  // Steps 1 to 7 are rendered in non-blocking floating bubble mode.
  const isOverlayStep = currentStep === 0 || currentStep === TUTORIAL_STEPS.length - 1;

  const renderContent = () => {
    if (isOverlayStep) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/65 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-955/95 shadow-2xl p-6 md:p-8 flex flex-col gap-6 backdrop-blur-xl animate-scale-in">
            
            {/* Top Progress Line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-900 overflow-hidden">
              <div 
                className="h-full bg-slate-900 dark:bg-[var(--color-accent-gold)] transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Header bar */}
            <div className="flex items-center justify-between shrink-0 pt-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-500/10 text-[var(--color-primary)] dark:text-[var(--color-accent-gold)]">
                  <StepIcon className="w-4.5 h-4.5" />
                </span>
                <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase font-mono">
                  STEP {currentStep + 1} OF {TUTORIAL_STEPS.length}
                </span>
              </div>

              <button 
                onClick={handleComplete}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                title="튜토리얼 건너뛰기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Character speech block */}
            <div className="flex flex-col md:flex-row gap-4 items-start bg-slate-50 dark:bg-slate-900/40 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-900/60 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] dark:opacity-[0.02] text-slate-500 pointer-events-none">
                <StepIcon className="w-32 h-32" />
              </div>

              {/* Guide Avatar */}
              <div className="flex md:flex-col items-center gap-3 shrink-0">
                <div className="w-14 h-14 rounded-full bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-3xl shadow-md border-2 border-white dark:border-slate-750 animate-pulse">
                  {stepInfo.emoji}
                </div>
                <div className="text-center md:text-left">
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">MENTOR</div>
                  <div className="text-xs font-black text-foreground/90">스탁 쌤</div>
                </div>
              </div>

              {/* Speech Bubble Arrow (Desktop only) */}
              <div className="hidden md:block absolute left-[88px] top-9 w-3 h-3 bg-slate-50 dark:bg-slate-900 border-l border-b border-slate-100 dark:border-slate-900/60 rotate-45" />

              {/* Speech Text */}
              <div className="flex-1 min-w-0 md:pl-2.5">
                <h3 className="text-sm font-black text-foreground mb-2 tracking-tight flex items-center gap-1.5">
                  {stepInfo.title}
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] dark:bg-[var(--color-accent-gold)] animate-ping" />
                </h3>
                <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-350 font-bold whitespace-pre-line">
                  {renderFormattedDescription(stepInfo.description)}
                </p>
              </div>
            </div>

            {/* Buttons Controls - Flat solid, no gradients */}
            <div className="flex items-center justify-between mt-2 shrink-0">
              {/* Back btn */}
              {currentStep > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="h-10 px-4 font-bold text-xs rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 transition-all bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전으로
                </Button>
              ) : (
                <div />
              )}

              {/* Action buttons (Next / Skip) */}
              <div className="flex items-center gap-2">
                {currentStep < TUTORIAL_STEPS.length - 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleComplete}
                    className="h-10 px-4 font-bold text-xs text-rose-500 hover:bg-rose-500/10 cursor-pointer rounded-xl bg-transparent transition-all"
                  >
                    건너뛰기 (Skip)
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="h-10 px-5 font-black text-xs rounded-xl bg-slate-900 dark:bg-[var(--color-accent-gold)] text-white dark:text-slate-950 hover:bg-slate-855 dark:hover:bg-amber-400 shadow-md flex items-center gap-1.5 cursor-pointer border-transparent transition-all active:scale-[0.98]"
                >
                  {currentStep === TUTORIAL_STEPS.length - 1 ? (
                    <>스탁스쿨 시작하기! 🚀</>
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
        <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/98 dark:bg-slate-955/98 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-5 flex flex-col gap-4.5 backdrop-blur-xl animate-scale-in md:mr-6 md:mb-12">
          
          {/* Top Progress Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-900 overflow-hidden">
            <div 
              className="h-full bg-slate-900 dark:bg-[var(--color-accent-gold)] transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Header bar */}
          <div className="flex items-center justify-between shrink-0 pt-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-500/10 text-[var(--color-primary)] dark:text-[var(--color-accent-gold)]">
                <StepIcon className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">
                STEP {currentStep + 1} OF {TUTORIAL_STEPS.length}
              </span>
            </div>

            <button 
              onClick={handleComplete}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              title="튜토리얼 건너뛰기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Character speech block (compacted) */}
          <div className="flex gap-3.5 items-start bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-900/50 relative overflow-hidden">
            {/* Guide Avatar */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-sm border border-white/80 dark:border-slate-750 animate-pulse">
                {stepInfo.emoji}
              </div>
              <div className="text-[8px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">스탁 쌤</div>
            </div>

            {/* Speech Text */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-foreground mb-1.5 tracking-tight flex items-center gap-1.5">
                {stepInfo.title}
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] dark:bg-[var(--color-accent-gold)] animate-ping" />
              </h3>
              <p className="text-[11px] leading-relaxed text-slate-650 dark:text-slate-350 font-bold whitespace-pre-line">
                {renderFormattedDescription(stepInfo.description)}
              </p>
            </div>
          </div>

          {/* Buttons Controls - Flat solid, no gradients */}
          <div className="flex items-center justify-between shrink-0 pt-0.5">
            {/* Back btn */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="h-8.5 px-3.5 font-bold text-[11px] rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1 bg-transparent transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              이전으로
            </Button>

            {/* Action buttons (Next / Skip) */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleComplete}
                className="h-8.5 px-3 font-bold text-[11px] text-rose-500 hover:bg-rose-500/10 cursor-pointer rounded-lg bg-transparent transition-all"
              >
                건너뛰기 (Skip)
              </Button>

              <Button
                size="sm"
                onClick={handleNext}
                className="h-8.5 px-4 font-black text-[11px] rounded-lg bg-slate-900 dark:bg-[var(--color-accent-gold)] text-white dark:text-slate-950 hover:bg-slate-855 dark:hover:bg-amber-400 shadow-sm flex items-center gap-1 cursor-pointer border-transparent transition-all active:scale-[0.98]"
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
