import { useState, useEffect, useMemo } from 'react';
import { useGameStore, type Level } from '../stores/gameStore';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import {
  BookOpen,
  Lightbulb,
  TrendingUp,
  Activity,
  Coins,
  Newspaper,
  Sparkles,
  Sun,
  Moon,
  ShieldCheck,
  UserCircle2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { GLOSSARY_TERMS, type GlossaryItem } from '../lib/glossaryData';
import SchoolLogo from '../components/layout/SchoolLogo';
import LegalModals, { type LegalTab } from '../components/legal/LegalModals';
import GoogleConsentModal from '../components/legal/GoogleConsentModal';

const levels: { key: Level; label: string; title: string; emoji: string; desc: string; cash: string }[] = [
  {
    key: 'elementary',
    label: '초급 학교',
    title: '입문자 교실',
    emoji: '🌱',
    desc: '주식을 처음 접하는 학생도 쉽게 이해하는 일상 비유와 뚜렷한 뉴스 인과관계 학습',
    cash: '100만 원 시작',
  },
  {
    key: 'middle',
    label: '중급 아카데미',
    title: '성장형 실전반',
    emoji: '📈',
    desc: '산업 뉴스의 행간을 읽고 금리·환율·공급망이 가상 기업 가치에 미치는 영향 분석',
    cash: '500만 원 시작',
  },
  {
    key: 'high',
    label: '고급 연구소',
    title: '심화 분석반',
    emoji: '🏦',
    desc: '재무 핵심 지표(ROE, PER, PBR)와 거시경제 복합 변수, 환노출도까지 종합 분석하는 심화 학습',
    cash: '1,000만 원 시작',
  },
];

// Mock News Headlines for interactive dashboard preview (100% fictional educational examples)
const mockNewsByLevel: Record<Level, string[]> = {
  elementary: [
    '🌱 [새싹뉴스] 새 학기 스마트 태블릿 인기 폭발! 전자·반도체 공장 풀가동',
    '🌱 [쉬운 경제] 이상 기후로 밀가루·설탕 가격 급등... 식품 공장 재료비 비상',
    '🌱 [금융 상식] 달걀을 한 바구니에 담지 마세요! 여러 산업에 분산투자 연습하기',
  ],
  middle: [
    '📈 [산업 동향] 글로벌 AI 데이터센터 증설 경쟁... 고대역폭 메모리 주문 급증',
    '📈 [공급망 분석] 리튬·니켈 광물 시세 급락... 2차전지 소재 재고평가손실 주의',
    '📈 [친환경 규제] 글로벌 해운사 탄소중립 선언... 친환경 선박 교체 발주 확대',
  ],
  high: [
    '🏦 [거시 분석] 미 연준 기준금리 인하 단행... 성장주 할인율 하락 vs 은행 NIM 축소',
    '🏦 [환율 심화] 원/달러 환율 상승! 수출형 식품주 환차익 vs 내수 수입형 식품주 원가 부담',
    '🏦 [정책 분석] 저PBR 기업 밸류업 세제 혜택 확정... 금융·지주사 주주환원 확대',
  ],
};

export default function Login() {
  const { theme, toggleTheme, enterGuestMode } = useGameStore();
  const [level, setLevel] = useState<Level>('elementary');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChangedLevel, setHasChangedLevel] = useState(false);
  const [randomTerm] = useState<GlossaryItem | null>(() =>
    GLOSSARY_TERMS.length > 0
      ? GLOSSARY_TERMS[Math.floor(Math.random() * GLOSSARY_TERMS.length)]
      : null
  );
  const [isKakaoTalk] = useState(() =>
    typeof navigator !== 'undefined' && /kakaotalk/i.test(navigator.userAgent)
  );

  // Legal & Consent Modal states
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('disclaimer');
  const [consentOpen, setConsentOpen] = useState(false);

  const openLegal = (tab: LegalTab) => {
    setLegalTab(tab);
    setLegalOpen(true);
  };

  // Redirect KakaoTalk in-app browser to system default browser
  useEffect(() => {
    if (isKakaoTalk) {
      window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(window.location.href)}`;
    }
  }, [isKakaoTalk]);

  // Enable body scrolling when Login page is mounted, restore on unmount
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = originalStyle || 'hidden';
    };
  }, []);

  // Live mockup states for preview dashboard
  const [mockPrice, setMockPrice] = useState(82000);
  const [priceHistory, setPriceHistory] = useState<number[]>([80500, 81000, 80800, 81600, 81400, 82000]);
  const [newsIndex, setNewsIndex] = useState(0);
  const [flashType, setFlashType] = useState<'up' | 'down' | 'flat'>('flat');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      const isUp = Math.random() > 0.48;
      const changePercent = 0.002 + Math.random() * 0.008;
      const delta = Math.round((mockPrice * changePercent) / 100) * 100 || 100;
      const nextPrice = Math.max(1000, isUp ? mockPrice + delta : mockPrice - delta);

      setMockPrice(nextPrice);
      setPriceHistory((prev) => [...prev.slice(-9), nextPrice]);
      setFlashType(isUp ? 'up' : 'down');

      if (Math.random() > 0.65) {
        setNewsIndex((prev) => (prev + 1) % 3);
      }

      timer = setTimeout(() => setFlashType('flat'), 600);
    }, 2000);

    return () => {
      clearInterval(interval);
      if (timer) clearTimeout(timer);
    };
  }, [mockPrice]);

  const handleGuestStart = () => {
    enterGuestMode(nickname, level);
    toast.success('개인정보 수집 없는 게스트 교실에 입장했습니다! 🎉');
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

  const linePoints = useMemo(() => {
    const max = Math.max(...priceHistory);
    const min = Math.min(...priceHistory);
    const range = max - min || 1;
    const width = 280;
    const height = 110;

    return priceHistory
      .map((p, i) => {
        const x = (i / (priceHistory.length - 1)) * width;
        const y = height - 10 - ((p - min) / range) * (height - 20);
        return `${x},${y}`;
      })
      .join(' ');
  }, [priceHistory]);

  const maPoints = useMemo(() => {
    const maHistory = priceHistory.map((_, i, arr) => {
      if (i < 2) return arr[i];
      return Math.round((arr[i] + arr[i - 1] + arr[i - 2]) / 3);
    });
    const max = Math.max(...priceHistory);
    const min = Math.min(...priceHistory);
    const range = max - min || 1;
    const width = 280;
    const height = 110;

    return maHistory
      .map((p, i) => {
        const x = (i / (maHistory.length - 1)) * width;
        const y = height - 10 - ((p - min) / range) * (height - 20);
        return `${x},${y}`;
      })
      .join(' ');
  }, [priceHistory]);

  const isDark = theme === 'dark';

  return (
    <div
      className={cn(
        'min-h-screen w-full flex flex-col justify-between relative overflow-x-hidden tech-grid transition-colors duration-300 pt-10 pb-6 lg:pt-6',
        isDark ? 'bg-[#050811] text-white' : 'bg-[#f8fafc] text-slate-800'
      )}
    >
      {/* Light/Dark theme switcher at top-right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          onClick={toggleTheme}
          className={cn(
            'p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shadow-sm font-black text-[11px]',
            isDark
              ? 'bg-slate-900/60 border-slate-800 text-amber-400 hover:bg-slate-800'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          )}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>라이트 모드로 학습</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-500" />
              <span>다크 모드로 학습</span>
            </>
          )}
        </button>
      </div>

      {/* Mesh Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className={cn(
            'absolute top-[10%] left-[5%] w-[450px] h-[450px] rounded-full blur-[140px] animate-float-glow transition-colors duration-300',
            isDark ? 'bg-slate-800/10' : 'bg-slate-200/10'
          )}
        />
        <div
          className={cn(
            'absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full blur-[150px] transition-colors duration-300',
            isDark ? 'bg-slate-900/5' : 'bg-slate-300/5'
          )}
        />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 py-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
        {/* LEFT COLUMN: Educational Hero & Setup Form */}
        <div className="lg:col-span-6 space-y-5 flex flex-col justify-center">
          {/* Logo & Welcome */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <SchoolLogo className="w-10 h-10 shrink-0 filter drop-shadow-sm" />
              <div>
                <h3
                  className={cn(
                    'text-lg font-black tracking-tight leading-none',
                    isDark ? 'text-white' : 'text-slate-900'
                  )}
                >
                  스탁스쿨
                </h3>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5 tracking-wider uppercase">
                  StockSchool Financial Literacy Lab
                </span>
              </div>
            </div>

            <div
              className={cn(
                'inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-xs font-extrabold shadow-sm select-none w-fit',
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              )}
            >
              <Activity className="w-4 h-4 text-slate-500" />
              <span>100% 가상 기업 · 비영리 금융 문해력 교육 시뮬레이터</span>
            </div>

            <h1 className="text-4xl md:text-5xl xl:text-[52px] font-black tracking-tight leading-[1.12] select-none">
              안전하게 배우는
              <br />
              <span className={cn('font-extrabold', isDark ? 'text-white' : 'text-slate-900')}>
                스탁스쿨 StockSchool
              </span>
            </h1>

            <p
              className={cn(
                'text-sm leading-relaxed font-medium max-w-lg',
                isDark ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              실제 돈이 오가지 않는 34개 가상 기업과 102건의 가상 경제 뉴스 속에서 뉴스 독해력, 분산투자,
              합리적 경제 판단 능력을 자연스럽게 익혀보세요.
            </p>
          </div>

          {/* Interactive Glossary Preview Card */}
          {randomTerm && (
            <div
              className={cn(
                'glass-panel border rounded-2xl p-4 shadow-md space-y-2.5 relative overflow-hidden transition-all duration-300',
                isDark
                  ? 'border-slate-800 bg-slate-950/20 shadow-slate-950/20'
                  : 'border-slate-200 bg-white/70 shadow-slate-500/5'
              )}
            >
              <div className="absolute top-0 right-0 p-3 text-slate-500/5 pointer-events-none">
                <BookOpen className="w-16 h-16" />
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-500/10">
                  <Lightbulb className="w-3 h-3 text-slate-500" />
                </span>
                <span
                  className={cn(
                    'text-[10px] tracking-wider font-extrabold',
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  )}
                >
                  💡 난이도 교실별 금융 개념 설명 미리보기
                </span>
              </div>

              <div className="space-y-1">
                <h3
                  className={cn(
                    'text-sm font-extrabold flex items-center gap-2',
                    isDark ? 'text-white' : 'text-slate-800'
                  )}
                >
                  {randomTerm.term}
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-500/10 border border-slate-500/20 font-bold text-slate-500">
                    {randomTerm.category === 'basic'
                      ? '기초'
                      : randomTerm.category === 'analysis'
                        ? '분석'
                        : randomTerm.category === 'macro'
                          ? '거시'
                          : '심화'}
                  </span>
                </h3>
                <p
                  className={cn(
                    'text-xs leading-relaxed font-medium transition-all duration-300',
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  )}
                >
                  {randomTerm.definitions[level]}
                </p>
              </div>
            </div>
          )}

          {/* Level Academy Plan Card */}
          <div
            className={cn(
              'glass-panel border rounded-2xl p-5 shadow-lg space-y-4 transition-all duration-300',
              isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-white/80'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-between border-b pb-3',
                isDark ? 'border-slate-800/80' : 'border-slate-100'
              )}
            >
              <div>
                <h2
                  className={cn(
                    'font-extrabold text-sm flex items-center gap-1.5',
                    isDark ? 'text-white' : 'text-slate-800'
                  )}
                >
                  <Coins className="w-4 h-4 text-amber-500" />
                  학습 등급 선택
                </h2>
                <p className={cn('text-[10px] mt-0.5 font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  등급별 가상 자본금과 뉴스 난이도·시장 변동 폭이 맞춤 설정됩니다
                </p>
              </div>
              <span className="text-[10px] text-slate-500 font-extrabold bg-slate-500/10 px-2.5 py-1 rounded-full">
                설정에서 전환 가능
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {levels.map((l) => (
                <button
                  key={l.key}
                  onClick={() => {
                    setLevel(l.key);
                    setHasChangedLevel(true);
                  }}
                  className={cn(
                    'rounded-xl p-3 sm:p-3.5 text-left transition-all border flex flex-row sm:flex-col justify-between cursor-pointer select-none group min-h-[82px] sm:min-h-[130px] items-center sm:items-stretch gap-3 sm:gap-0',
                    level === l.key
                      ? isDark
                        ? 'border-white bg-white/5 shadow-md'
                        : 'border-slate-900 bg-slate-900/5 shadow-md'
                      : isDark
                        ? 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  )}
                >
                  <div className="flex sm:flex-row items-center justify-between sm:w-full gap-2 sm:gap-0">
                    <span className="text-xl sm:text-2xl filter drop-shadow">{l.emoji}</span>
                    <span
                      className={cn(
                        'hidden sm:inline text-[9px] px-1.5 py-0.5 rounded font-black',
                        level === l.key
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                          : isDark
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {l.label}
                    </span>
                  </div>

                  <div className="flex-1 sm:flex-initial space-y-0.5 mt-0 sm:mt-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          'text-[11px] font-black group-hover:text-slate-900 dark:group-hover:text-white transition-colors',
                          isDark ? 'text-white' : 'text-slate-800'
                        )}
                      >
                        {l.title}
                      </div>
                      <span
                        className={cn(
                          'inline sm:hidden text-[8px] px-1 py-0.5 rounded font-black',
                          level === l.key
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                            : isDark
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {l.label}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-[9px] line-clamp-1 sm:line-clamp-2 leading-snug font-medium',
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      )}
                    >
                      {l.desc}
                    </p>
                  </div>

                  <div
                    className={cn(
                      'text-[9px] sm:text-[10px] text-slate-500 font-extrabold mt-0 sm:mt-2 sm:pt-1 border-t-0 sm:border-t flex flex-col sm:flex-row items-end sm:items-center justify-center sm:justify-between shrink-0',
                      isDark ? 'sm:border-slate-800/60' : 'sm:border-slate-100'
                    )}
                  >
                    <span className="hidden sm:inline">가상 자금</span>
                    <span className="text-[10px] font-black text-amber-500 sm:text-slate-500">{l.cash}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Entry Triggers: Privacy-First Guest Mode (Primary) + Optional Google Cloud Login */}
            <div className="space-y-2.5 pt-1">
              {/* Nickname input + Instant Guest Entry */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <UserCircle2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={20}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGuestStart();
                    }}
                    placeholder="별명 입력 (선택, 실명 입력 불필요)"
                    className={cn(
                      'w-full h-11 pl-9 pr-3 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-500/40',
                      isDark
                        ? 'bg-slate-900/70 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                    )}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleGuestStart}
                  className={cn(
                    'h-11 px-5 font-extrabold text-xs sm:text-sm gap-2 transition-all cursor-pointer shadow-sm rounded-xl border flex items-center justify-center shrink-0',
                    isDark
                      ? 'bg-white text-black hover:bg-slate-100 border-transparent'
                      : 'bg-slate-900 text-white hover:bg-slate-800 border-transparent'
                  )}
                >
                  <span>개인정보 없이 바로 시작</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <p
                className={cn(
                  'text-[10px] font-semibold flex items-center gap-1.5',
                  isDark ? 'text-emerald-400/90' : 'text-emerald-700'
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>
                  초·중등 수업 권장: 별명만 쓰고 브라우저에 안전 저장되며, 이름·이메일 등 개인정보를 서버로 전송하지 않습니다.
                </span>
              </p>

              {/* Divider */}
              <div className="flex items-center gap-2 py-0.5">
                <div className={cn('h-px flex-1', isDark ? 'bg-slate-800' : 'bg-slate-200')} />
                <span className="text-[10px] font-bold text-slate-400">또는 다른 기기와 이어하기 (선택)</span>
                <div className={cn('h-px flex-1', isDark ? 'bg-slate-800' : 'bg-slate-200')} />
              </div>

              {isKakaoTalk && (
                <div
                  className={cn(
                    'p-3 border rounded-xl flex flex-col gap-1 text-xs text-left animate-fade-in shadow-sm select-none',
                    isDark
                      ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  )}
                >
                  <div className="flex items-center gap-1.5 font-black text-rose-600 dark:text-rose-400">
                    <span>⚠️</span>
                    <span>카카오톡 인앱 브라우저 안내</span>
                  </div>
                  <p className="leading-relaxed font-semibold text-[11px] opacity-90">
                    카카오톡 내부에서도 위의 <strong>'개인정보 없이 바로 시작'</strong>은 즉시 이용 가능합니다. Google 로그인을 원하시면 우측 상단 메뉴(⋯/⋮)에서 '다른 브라우저로 열기'를 선택해 주세요.
                  </p>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                className={cn(
                  'w-full h-10 font-extrabold text-xs gap-2 transition-all cursor-pointer rounded-xl flex items-center justify-center',
                  isDark
                    ? 'bg-slate-900/60 text-slate-200 border-slate-700 hover:bg-slate-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                )}
                onClick={() => setConsentOpen(true)}
                disabled={isLoading}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google 계정으로 클라우드 저장 로그인 (만 14세 이상 또는 보호자 동의)
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Educational Interactive Mockup HTS */}
        <div className="hidden lg:block lg:col-span-6 pl-4 relative">
          <div
            className={cn(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-[32px] blur-[30px] border pointer-events-none transition-colors duration-300',
              isDark ? 'bg-slate-800/5 border-slate-800/10' : 'bg-slate-300/5 border-slate-300/10'
            )}
          />

          <div
            className={cn(
              'relative glass-panel border rounded-[24px] shadow-2xl overflow-hidden backdrop-blur-xl w-full transition-all duration-300',
              isDark ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-white/70'
            )}
          >
            {/* Mock Windows Title bar */}
            <div
              className={cn(
                'border-b px-4 py-3 flex items-center justify-between shrink-0',
                isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400/70" />
                <span
                  className={cn(
                    'text-[10px] font-black ml-2 tracking-widest flex items-center gap-1.5',
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  )}
                >
                  <Activity className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
                  STOCKSCHOOL EDUCATIONAL PREVIEW
                </span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-slate-500/10 border border-slate-500/20 text-slate-500 font-extrabold uppercase">
                {level === 'elementary' ? '초급: 심플 뷰' : level === 'middle' ? '중급: 산업 분석' : '고급: 심화 지표'}
              </span>
            </div>

            <div className="p-4 space-y-4 bg-slate-950/5">
              {/* Simulated Price Display Panel */}
              <div className="grid grid-cols-3 gap-2">
                <div
                  className={cn(
                    'col-span-2 p-3.5 rounded-2xl border flex flex-col justify-between relative overflow-hidden',
                    isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-[10px] font-black uppercase tracking-wider',
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      )}
                    >
                      가상 종목 프리뷰
                    </span>
                    <span className="text-[9px] text-slate-500 font-extrabold bg-slate-500/10 border border-slate-500/20 px-1.5 py-0.5 rounded">
                      가상 기술 섹터
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <div className={cn('text-base font-black', isDark ? 'text-white' : 'text-slate-800')}>
                      누리전자 (가상 종목)
                    </div>
                    <div
                      className={cn(
                        'text-xl font-mono font-black mt-0.5 tracking-tight transition-all duration-300 rounded px-1.5 py-0.5 w-fit',
                        flashType === 'up'
                          ? 'bg-[var(--price-up)]/20 text-[var(--price-up)]'
                          : flashType === 'down'
                            ? 'bg-[var(--price-down)]/20 text-[var(--price-down)]'
                            : isDark
                              ? 'text-slate-100'
                              : 'text-slate-700'
                      )}
                    >
                      {mockPrice.toLocaleString()} 원
                    </div>
                  </div>
                </div>

                {/* Simulated Educational Learning Stat */}
                <div
                  className={cn(
                    'p-3.5 rounded-2xl border flex flex-col justify-between',
                    isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  )}
                >
                  <span
                    className={cn(
                      'text-[10px] font-black uppercase tracking-wider',
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    가상 시장 구성
                  </span>
                  <div className="mt-2.5 text-center">
                    <div className="text-xl font-black text-foreground flex items-center justify-center gap-1">
                      <TrendingUp className="w-4.5 h-4.5 text-[var(--price-up)]" />
                      34개사
                    </div>
                    <span className={cn('text-[9px] font-bold block mt-0.5', isDark ? 'text-slate-400' : 'text-slate-500')}>
                      17개 산업 · 102건 뉴스
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Simulated Chart Board */}
              <div
                className={cn(
                  'p-4 rounded-2xl border h-[150px] flex flex-col justify-between relative',
                  isDark ? 'bg-slate-900/30 border-slate-800/80' : 'bg-slate-50/50 border-slate-200'
                )}
              >
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-40">
                  <div className={cn('w-full border-t border-dashed', isDark ? 'border-slate-800' : 'border-slate-200')} />
                  <div className={cn('w-full border-t border-dashed', isDark ? 'border-slate-800' : 'border-slate-200')} />
                  <div className={cn('w-full border-t border-dashed', isDark ? 'border-slate-800' : 'border-slate-200')} />
                </div>

                <div className="flex items-center justify-between z-10">
                  <span className={cn('text-[9px] font-black flex items-center gap-1', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                    시뮬레이션 차트 미리보기
                  </span>

                  <div className="flex gap-2">
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold">
                      Price
                    </span>
                    {level !== 'elementary' && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-bold">
                        MA(3)
                      </span>
                    )}
                    {level === 'high' && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold">
                        Candle
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-0 w-full flex items-center justify-center z-10 pt-2">
                  {level === 'elementary' && (
                    <svg className="w-full h-full" viewBox="0 0 280 110">
                      <polyline
                        fill="none"
                        stroke="#F04452"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={linePoints}
                      />
                    </svg>
                  )}

                  {level === 'middle' && (
                    <svg className="w-full h-full" viewBox="0 0 280 110">
                      <polyline
                        fill="none"
                        stroke="#F04452"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={linePoints}
                      />
                      <polyline
                        fill="none"
                        stroke={isDark ? '#6366f1' : '#4f46e5'}
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={maPoints}
                      />
                    </svg>
                  )}

                  {level === 'high' && (
                    <div className="w-full h-full flex items-end justify-between px-2 pt-2 pb-1 relative">
                      {priceHistory.map((p, idx) => {
                        const prev = idx > 0 ? priceHistory[idx - 1] : p;
                        const isCandleUp = p >= prev;
                        const max = Math.max(...priceHistory);
                        const min = Math.min(...priceHistory);
                        const range = max - min || 1;

                        const heightPercent = Math.max(10, Math.min(90, ((p - min) / range) * 80));
                        const prevPercent = Math.max(10, Math.min(90, ((prev - min) / range) * 80));
                        const bodyTop = Math.max(heightPercent, prevPercent);
                        const bodyBottom = Math.min(heightPercent, prevPercent);
                        const bodyHeight = Math.max(8, bodyTop - bodyBottom);

                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center justify-end h-full group relative mx-1.5"
                          >
                            <div
                              className={cn(
                                'w-[1.5px] absolute bottom-0',
                                isCandleUp ? 'bg-[var(--price-up)]' : 'bg-[var(--price-down)]'
                              )}
                              style={{
                                height: `${heightPercent + 12}%`,
                                bottom: `${Math.min(heightPercent, prevPercent) - 3}%`,
                              }}
                            />
                            <div
                              className={cn(
                                'w-full rounded-sm z-10 transition-all shadow-sm',
                                isCandleUp
                                  ? 'bg-[var(--price-up)] shadow-[var(--price-up)]/30'
                                  : 'bg-[var(--price-down)] shadow-[var(--price-down)]/30'
                              )}
                              style={{ height: `${bodyHeight}%`, marginBottom: `${bodyBottom}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    'flex items-center justify-between text-[7px] border-t pt-1 mt-1 z-10 font-bold',
                    isDark ? 'text-slate-500 border-slate-800/40' : 'text-slate-400 border-slate-100'
                  )}
                >
                  <span>DAY 1</span>
                  <span>DAY 2</span>
                  <span>DAY 3</span>
                  <span>DAY 4</span>
                  <span>DAY 5</span>
                  <span>DAY 6</span>
                </div>
              </div>

              {/* Dynamic Live News Ticker Card */}
              <div
                className={cn(
                  'p-3.5 rounded-2xl border space-y-2',
                  isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                )}
              >
                <div className={cn('flex items-center gap-1 text-[9px] font-black', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  <Newspaper className="w-3.5 h-3.5 text-slate-500" />
                  난이도 맞춤 가상 경제 뉴스룸
                </div>
                <div
                  className={cn(
                    'text-[11px] font-bold p-2.5 rounded-xl transition-all duration-300 min-h-[42px] flex items-center leading-normal border',
                    isDark
                      ? 'text-white bg-slate-950/40 border-slate-900/60'
                      : 'text-slate-800 bg-white border-slate-100 shadow-sm'
                  )}
                >
                  {mockNewsByLevel[level][newsIndex]}
                </div>
              </div>
            </div>

            {/* Mock status footer */}
            <div
              className={cn(
                'px-4 py-2 border-t flex items-center justify-between text-[8px] font-extrabold',
                isDark
                  ? 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              )}
            >
              <span>● 교육용 가상 시뮬레이션 (실제 투자 아님)</span>
              <span>스탁스쿨 엔진 v2.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Disclaimer Footer */}
      <footer
        className={cn(
          'w-full max-w-7xl mx-auto px-6 pt-4 mt-2 border-t relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-semibold',
          isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
        )}
      >
        <p className="text-center sm:text-left">
          본 서비스는 100% 가상 기업·가상 자금을 활용한 비영리 교육용 시뮬레이터이며, 실제 투자 권유나 자문이 아닙니다.
        </p>
        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => openLegal('disclaimer')}
            className="hover:underline font-bold cursor-pointer"
          >
            면책고지
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => openLegal('privacy')}
            className="hover:underline font-extrabold text-foreground cursor-pointer"
          >
            개인정보처리방침
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => openLegal('terms')}
            className="hover:underline font-bold cursor-pointer"
          >
            이용약관
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => openLegal('licenses')}
            className="hover:underline font-bold cursor-pointer"
          >
            오픈소스 고지
          </button>
        </div>
      </footer>

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
