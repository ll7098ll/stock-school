import { useEffect, useRef, useState } from 'react';
import {
  clearPendingGoogleLevel,
  getSavedGuestSummary,
  setPendingGoogleLevel,
  useGameStore,
  type Level,
  type SavedGuestSummary,
} from '../stores/gameStore';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import LegalModals, { type LegalTab } from '../components/legal/LegalModals';
import GoogleConsentModal from '../components/legal/GoogleConsentModal';
import LandingNav from '../components/landing/LandingNav';
import HeroSlide from '../components/landing/HeroSlide';
import ConceptSlide from '../components/landing/ConceptSlide';
import LearningLoopSlide from '../components/landing/LearningLoopSlide';
import LevelShowcaseSlide from '../components/landing/LevelShowcaseSlide';
import MarketWorldSlide from '../components/landing/MarketWorldSlide';
import TrustCtaSlide from '../components/landing/TrustCtaSlide';
import { LANDING_SLIDES } from '../components/landing/landingData';
import { useSlideNavigation } from '../components/landing/useSlideNavigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { AlertTriangle, RotateCcw, UserCheck } from 'lucide-react';

const LEVEL_LABELS: Record<Level, string> = {
  elementary: '초급',
  middle: '중급',
  high: '고급',
};

export default function Login() {
  const { theme, toggleTheme, enterGuestMode } = useGameStore();
  const [level, setLevel] = useState<Level>('elementary');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedGuest] = useState<SavedGuestSummary | null>(() => getSavedGuestSummary());
  const [guestConflictOpen, setGuestConflictOpen] = useState(false);
  const [isKakaoTalk] = useState(
    () => typeof navigator !== 'undefined' && /kakaotalk/i.test(navigator.userAgent)
  );

  // Legal & Consent Modal states
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('disclaimer');
  const [consentOpen, setConsentOpen] = useState(false);

  const nicknameInputRef = useRef<HTMLInputElement | null>(null);

  const { containerRef, activeSlide, visitedSlides, registerSlide, scrollToSlide } =
    useSlideNavigation({
      slideCount: LANDING_SLIDES.length,
      disabled: legalOpen || consentOpen || guestConflictOpen,
    });

  // Redirect KakaoTalk in-app browser to system default browser
  useEffect(() => {
    if (isKakaoTalk) {
      window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(window.location.href)}`;
    }
  }, [isKakaoTalk]);

  const handleSelectLevel = (nextLevel: Level) => {
    setLevel(nextLevel);
  };

  const openLegal = (tab: LegalTab) => {
    setLegalTab(tab);
    setLegalOpen(true);
  };

  const launchGuestSession = (resetExisting: boolean) => {
    const resolvedName =
      !resetExisting && !nickname.trim() && savedGuest
        ? savedGuest.displayName
        : nickname;
    enterGuestMode(resolvedName, level, { resetExisting });
    setGuestConflictOpen(false);
    toast.success(
      resetExisting
        ? '새 학생 게스트 교실을 DAY 1로 시작했습니다! 🎉'
        : '개인정보 수집 없는 게스트 교실에 입장했습니다! 🎉'
    );
  };

  const handleGuestStart = () => {
    // 공용 PC에서 기존 게스트 기록과 다른 닉네임이 입력되었거나 기존 진행 기록이 있는 경우 선택 확인 (L-2)
    if (savedGuest) {
      const enteredName = nickname.trim();
      const isDifferentName =
        enteredName.length > 0 && enteredName !== savedGuest.displayName;
      const hasProgress = Object.values(savedGuest.levelDays).some((d) => (d ?? 1) > 1);
      if (isDifferentName || hasProgress) {
        setGuestConflictOpen(true);
        return;
      }
    }
    launchGuestSession(false);
  };

  const handleStartWithSelectedLevel = () => {
    scrollToSlide(0);
    setTimeout(() => {
      nicknameInputRef.current?.focus();
    }, 520);
  };

  const executeGoogleLogin = async () => {
    if (!auth) {
      toast.error('클라우드 로그인 설정이 완료되지 않았습니다. 게스트 모드로 이용해 주세요.');
      return;
    }
    setIsLoading(true);
    try {
      // 신규 Google 사용자 초기 등급용으로만 sessionStorage(TTL 3분)에 기록 (기존 계정은 클라우드 등급 유지: L-4)
      setPendingGoogleLevel(level);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setConsentOpen(false);
      toast.success('스탁스쿨 클라우드 교실에 입장했습니다! 🎉');
    } catch (error: unknown) {
      clearPendingGoogleLevel();
      const msg = error instanceof Error ? error.message : '다시 시도해 주세요.';
      toast.error('로그인 실패: ' + msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme === 'dark';

  const primarySurface = isDark ? 'bg-[#12151F] text-white' : 'bg-[#F8FAFC] text-slate-900';
  const altSurface = isDark ? 'bg-[#151926] text-white' : 'bg-white text-slate-900';

  return (
    <div
      className={cn(
        'relative h-dvh w-full overflow-hidden transition-colors duration-300',
        primarySurface
      )}
    >
      {/* Persistent Top Navigation & Right Vertical Slide Dots */}
      <LandingNav
        activeSlide={activeSlide}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onSelectSlide={scrollToSlide}
      />

      {/* Full-Page Vertical Slide Container */}
      <main
        ref={containerRef}
        className="h-dvh w-full overflow-y-auto overflow-x-hidden scroll-smooth snap-y snap-proximity lg:snap-mandatory"
      >
        {/* Slide 01: Main Hero + Level Selector + Live HTS Preview */}
        <section
          id={LANDING_SLIDES[0].id}
          ref={registerSlide(0)}
          data-slide-index={0}
          className={cn('snap-start w-full transition-colors duration-300', primarySurface)}
        >
          <HeroSlide
            isDark={isDark}
            level={level}
            nickname={nickname}
            isLoading={isLoading}
            isKakaoTalk={isKakaoTalk}
            nicknameInputRef={nicknameInputRef}
            onSelectLevel={handleSelectLevel}
            onChangeNickname={setNickname}
            onGuestStart={handleGuestStart}
            onOpenGoogleConsent={() => setConsentOpen(true)}
            onScrollNext={() => scrollToSlide(1)}
          />
        </section>

        {/* Slide 02: App Concept & Philosophy */}
        <section
          id={LANDING_SLIDES[1].id}
          ref={registerSlide(1)}
          data-slide-index={1}
          className={cn(
            'snap-start w-full border-t transition-colors duration-300',
            altSurface,
            isDark ? 'border-[#202638]' : 'border-slate-200/70'
          )}
        >
          <ConceptSlide isDark={isDark} isVisible={visitedSlides.has(1)} />
        </section>

        {/* Slide 03: Interactive 4-Step Daily Learning Loop */}
        <section
          id={LANDING_SLIDES[2].id}
          ref={registerSlide(2)}
          data-slide-index={2}
          className={cn(
            'snap-start w-full border-t transition-colors duration-300',
            primarySurface,
            isDark ? 'border-[#202638]' : 'border-slate-200/70'
          )}
        >
          <LearningLoopSlide isDark={isDark} isVisible={visitedSlides.has(2)} />
        </section>

        {/* Slide 04: 3-Level Academy & Live Glossary Explorer */}
        <section
          id={LANDING_SLIDES[3].id}
          ref={registerSlide(3)}
          data-slide-index={3}
          className={cn(
            'snap-start w-full border-t transition-colors duration-300',
            altSurface,
            isDark ? 'border-[#202638]' : 'border-slate-200/70'
          )}
        >
          <LevelShowcaseSlide
            isDark={isDark}
            isVisible={visitedSlides.has(3)}
            level={level}
            onSelectLevel={handleSelectLevel}
            onStartWithLevel={handleStartWithSelectedLevel}
          />
        </section>

        {/* Slide 05: Virtual Market (34 Stocks) & Engine v2.0 Scenario Demo */}
        <section
          id={LANDING_SLIDES[4].id}
          ref={registerSlide(4)}
          data-slide-index={4}
          className={cn(
            'snap-start w-full border-t transition-colors duration-300',
            primarySurface,
            isDark ? 'border-[#202638]' : 'border-slate-200/70'
          )}
        >
          <MarketWorldSlide isDark={isDark} isVisible={visitedSlides.has(4)} />
        </section>

        {/* Slide 06: Safe Classroom Design, Final CTA & Legal Footer */}
        <section
          id={LANDING_SLIDES[5].id}
          ref={registerSlide(5)}
          data-slide-index={5}
          className={cn(
            'snap-start w-full border-t transition-colors duration-300',
            altSurface,
            isDark ? 'border-[#202638]' : 'border-slate-200/70'
          )}
        >
          <TrustCtaSlide
            isDark={isDark}
            isVisible={visitedSlides.has(5)}
            level={level}
            nickname={nickname}
            onChangeNickname={setNickname}
            onGuestStart={handleGuestStart}
            onOpenGoogleConsent={() => setConsentOpen(true)}
            onBackToTop={() => scrollToSlide(0)}
            onOpenLegal={openLegal}
          />
        </section>
      </main>

      {/* Shared PC Guest Conflict Protection Dialog (L-2) */}
      <Dialog open={guestConflictOpen} onOpenChange={setGuestConflictOpen}>
        <DialogContent className="max-w-md w-[94vw] rounded-2xl bg-[var(--color-hts-panel)] border-[var(--color-hts-border)]">
          <DialogHeader className="text-left space-y-1.5">
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              이 브라우저에 기존 게스트 기록이 있어요
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed">
              공용 PC에서 다른 학생 기록과 섞이지 않도록 이어서 할지 새로 시작할지 선택해 주세요.
            </DialogDescription>
          </DialogHeader>

          {savedGuest && (
            <div className="p-3.5 rounded-xl border border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-white/[0.03] space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground font-semibold">저장된 별명</span>
                <span className="font-black text-foreground">{savedGuest.displayName}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground font-semibold">저장된 진행 기록</span>
                <span className="font-bold text-foreground tabular-nums">
                  {Object.entries(savedGuest.levelDays)
                    .map(([lvl, day]) => `${LEVEL_LABELS[lvl as Level]} DAY ${day}`)
                    .join(' · ')}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="button"
              onClick={() => launchGuestSession(false)}
              className="w-full h-10 rounded-xl text-xs font-black gap-1.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>기존 기록 이어서 학습하기 ({LEVEL_LABELS[level]} 교실)</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => launchGuestSession(true)}
              className="w-full h-10 rounded-xl text-xs font-bold gap-1.5 border-rose-500/35 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>기존 기록 지우고 새 학생(DAY 1)으로 시작하기</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Consent Gate before Google OAuth */}
      <GoogleConsentModal
        open={consentOpen}
        onOpenChange={setConsentOpen}
        onProceedGoogle={executeGoogleLogin}
        onUseGuestInstead={handleGuestStart}
        onOpenLegal={openLegal}
        isLoading={isLoading}
      />

      {/* Full Legal Documents Modal */}
      <LegalModals open={legalOpen} onOpenChange={setLegalOpen} initialTab={legalTab} />
    </div>
  );
}
