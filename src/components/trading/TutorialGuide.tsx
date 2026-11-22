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
    description: '안녕하세요! 스탁스쿨의 **가상 금융교육 시뮬레이터**에 오신 것을 진심으로 환영합니다! 🎉\n\n저는 여러분의 금융 멘토 **스탁 쌤**입니다. 이곳의 모든 기업, 뉴스, 자금은 **실제 돈이 오가지 않는 100% 가상 교육 자료**예요. 실제 투자 권유가 아니니 안심하고 뉴스 분석과 분산투자 원리를 차근차근 배워봅시다!'
  },
  {
    title: '1단계: 오늘의 뉴스룸 분석',
    emoji: '📰',
    icon: Newspaper,
    workspace: 'news',
    description: '화면의 **경제 뉴스분석** 방이 하이라이트 되었습니다!\n\n매일 발행되는 3개의 가상 경제 뉴스를 읽고, 내일 주가가 움직일 산업(기술, 바이오, 배터리, 식품 등)의 힌트를 보물찾기하듯 분석해 보세요. 같은 산업이라도 수출형·내수형 기업마다 영향이 달라질 수 있답니다!'
  },
  {
    title: '2단계: 가상 기업 탐색',
    emoji: '📈',
    icon: LineChart,
    workspace: 'trading',
    description: '힌트를 분석했다면 **모의투자 교실** 탭의 좌측 **종목 리스트**를 봐주세요!\n\n17개 산업 섹터에 걸쳐 34개 가상 기업이 정리되어 있습니다. 기업 분석 탭에서 각 회사의 사업 구조와 변동성을 확인해 보고, 관심 있는 기업을 **직접 클릭**해 보세요!'
  },
  {
    title: '3단계: 차트 및 모의 호가창 살펴보기',
    emoji: '📊',
    icon: Compass,
    workspace: 'trading',
    description: '종목을 클릭하면 화면 중앙에 주가 흐름과 거래량을 보여주는 **시세 차트**와 실제 주식시장 호가 단위를 체험해 보는 **모의 호가창(참고용)**이 열립니다!\n\n뉴스가 나온 날 주가와 거래량이 어떻게 함께 움직이는지 차트로 관찰해 보세요.'
  },
  {
    title: '4단계: 모의 매수·매도 및 분산투자',
    emoji: '💰',
    icon: LineChart,
    workspace: 'trading',
    description: '이제 거래를 연습할 차례입니다! 우측의 **주문 실행** 패널을 확인해 보세요!\n\n가상 예수금 한도 내에서 원하는 수량을 정해 **모의 매수** 또는 **모의 매도**를 실행할 수 있습니다. 한 종목에 모두 넣기보다 여러 산업에 **분산투자**하는 습관을 길러보세요!'
  },
  {
    title: '5단계: 포트폴리오(내 자산) 점검',
    emoji: '💼',
    icon: Wallet,
    workspace: 'portfolio',
    description: '주문을 실행한 후에는 **자산 보고서** 탭으로 가보세요!\n\n내 보유 종목, 평균 매입가, 섹터별 비중을 원형 차트와 추이 그래프로 한눈에 점검할 수 있습니다. 특정 산업에 너무 쏠려 있지 않은지 주기적으로 확인해 보세요!'
  },
  {
    title: '6단계: 금융 용어사전 활용',
    emoji: '📚',
    icon: BookOpen,
    workspace: 'glossary',
    description: '주식 용어가 어렵게 느껴진다면 **용어 사전방** 탭을 클릭해 보세요!\n\n주식, PER, PBR, 환율, 분산투자 등 핵심 금융 개념이 초·중·고 눈높이별로 알기 쉽게 정리되어 있답니다. 모르는 용어는 언제든지 검색해 보세요!'
  },
  {
    title: '7단계: 다음 날로 진행 및 결과 복기',
    emoji: '🚀',
    icon: Sparkles,
    workspace: 'trading',
    description: '뉴스 분석과 주문 연습을 마쳤나요?\n\n사이드바의 **다음 날 진행** 버튼을 누르면 어제 뉴스가 반영되어 주가가 변동하고 새로운 뉴스가 도착합니다. **어제 뉴스 해설** 탭에서 실제 변동 결과와 스탁 쌤 해설을 꼭 복기해 보세요!'
  },
  {
    title: '스탁스쿨 오리엔테이션 완료!',
    emoji: '🎓',
    icon: Award,
    workspace: 'trading',
    description: '훌륭합니다! 모든 기초 과정을 완료하셨습니다! 🏆\n\n이제 가상 자금으로 뉴스 독해와 분산투자 전략을 스스로 실험해 보세요. 수익률 숫자보다 "왜 올랐는지, 왜 내렸는지" 원인을 이해하는 과정이 가장 큰 실력이 됩니다. 파이팅! 🔥'
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

  const isOverlayStep = currentStep === 0 || currentStep === TUTORIAL_STEPS.length - 1;

  const renderContent = () => {
    if (isOverlayStep) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 shadow-2xl p-6 md:p-8 flex flex-col gap-6 backdrop-blur-xl animate-scale-in">
            
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
        <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-5 flex flex-col gap-4.5 backdrop-blur-xl animate-scale-in md:mr-6 md:mb-12">
          
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
