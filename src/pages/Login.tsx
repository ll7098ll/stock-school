import { useEffect, useRef, useState } from 'react';
import { useGameStore, type Level } from '../stores/gameStore';
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

export default function Login() {
  const { theme, toggleTheme, enterGuestMode } = useGameStore();
  const [level, setLevel] = useState<Level>('elementary');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChangedLevel, setHasChangedLevel] = useState(false);
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
      disabled: legalOpen || consentOpen,
    });

  // Redirect KakaoTalk in-app browser to system default browser
  useEffect(() => {
    if (isKakaoTalk) {
      window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(window.location.href)}`;
    }
  }, [isKakaoTalk]);

  const handleSelectLevel = (nextLevel: Level) => {
    setLevel(nextLevel);
    setHasChangedLevel(true);
  };

  const openLegal = (tab: LegalTab) => {
    setLegalTab(tab);
    setLegalOpen(true);
  };

  const handleGuestStart = () => {
    enterGuestMode(nickname, level);
    toast.success('개인정보 수집 없는 게스트 교실에 입장했습니다! 🎉');
  };

  const handleStartWithSelectedLevel = () => {
    scrollToSlide(0);
    setTimeout(() => {
      nicknameInputRef.current?.focus();
    }, 520);
  };

  const executeGoogleLogin = async () => {
    setIsLoading(true);
    try {
      if (hasChangedLevel) {
        localStorage.setItem('stockschool_pending_level', level);
      }
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setConsentOpen(false);
      toast.success('스탁스쿨 클라우드 교실에 입장했습니다! 🎉');
    } catch (error: unknown) {
      localStorage.removeItem('stockschool_pending_level');
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
